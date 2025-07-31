import type { Selmaho, Token } from "./tokenize";
import type {
	Text,
	Text1,
	TokenIndex,
	Paragraph,
	Item,
	Statement,
	Fragment,
	Ijek,
	IjekStatement2,
	Statement1,
	Statement2,
	Statement3,
	Sentence,
	BridiTail,
	BridiTail1,
	BridiTail2,
	BridiTail3,
	TailTerms,
	Terms,
	Term,
	Sumti,
	Sumti1,
	Sumti2,
	Sumti3,
	Sumti4,
	Sumti5,
	Sumti6,
	Floating,
	Positional,
	Selbri,
	TanruUnit,
	CmavoWithFrees,
	RelativeClauses,
	RelativeClause,
	Subsentence,
	Quantifier,
	Pa,
	LerfuWord,
	Namcu,
	Selbri1,
	Selbri2,
	Selbri3,
} from "./grammar";

class ParseError extends Error {
	readonly site?: TokenIndex;
	constructor(explanation: string, site?: TokenIndex) {
		super(explanation);
		this.name = "ParseError";
		this.site = site;
	}
}

interface TerbriState {
	x: number;
	// Bitset of filled positions
	filled: bigint;
}

export class Parser {
	private tokens: Token[];
	private index: TokenIndex;

	constructor(tokens: Token[]) {
		this.tokens = tokens;
		this.index = 0;
	}

	private nextToken(): Token | undefined {
		if (this.index < this.tokens.length) {
			return this.tokens[this.index++];
		}
		return undefined;
	}

	private peekToken(): Token | undefined {
		if (this.index < this.tokens.length) {
			return this.tokens[this.index];
		}
		return undefined;
	}

	public parseText(): Text {
		const text1 = this.parseText1();
		return {
			type: "text",
			free: [], // TODO free before text1
			start: text1.start,
			end: text1.end,
			text1,
		};
	}

	public parseText1(): Text1 {
		const i = this.tryParseCmavoWithFrees("I");
		const first = this.parseParagraph();
		// TODO: ni'o
		return {
			type: "text-1",
			start: i?.start ?? first.start,
			end: first.end,
			i,
			paragraphs: [first],
		};
	}

	public parseParagraph(): Paragraph {
		const first = this.parseTem();
		const items: Item[] = [];
		while (this.peekToken()?.selmaho === "I") {
			const item = this.parseItem();
			items.push(item);
		}

		return {
			type: "paragraph",
			start: first.start,
			end: items.length > 0 ? items[items.length - 1].end : first.end,
			niho: this.tryParseCmavoWithFrees("NIhO"),
			first,
			rest: items,
		};
	}

	public parseItem(): Item {
		const i = this.tryParseCmavoWithFrees("I");
		const tem = this.parseTem();
		return {
			type: "item",
			start: i?.start ?? tem.start,
			end: tem.end,
			i,
			tem,
		};
	}

	public parseTem(): Statement | Fragment {
		return this.parseStatement();
	}

	public parseStatement(): Statement {
		const first = this.parseStatement1();
		return {
			type: "statement",
			start: first.start,
			end: first.end,
			prenexes: [], // TODO
			statement1: first,
		};
	}

	public tryParseIjek(): Ijek | undefined {
		const i = this.tokens[this.index];
		const jek = this.tokens[this.index + 1];
		if (
			i &&
			jek &&
			i.selmaho === "I" &&
			(jek.selmaho === "JOI" || jek.selmaho === "JA")
		) {
			this.index += 2;
			return {
				type: "ijek",
				start: i.index,
				end: jek.index,
				i: i.index,
				jek: {
					type: "cmavo-with-frees",
					start: jek.index,
					end: jek.index,
					cmavo: jek.index,
					frees: [], // TODO parse frees
				},
			};
		}
	}

	public parseStatement1(): Statement1 {
		const first = this.parseStatement2();
		const rest: IjekStatement2[] = [];
		while (true) {
			const ijek = this.tryParseIjek();
			if (!ijek) break;
			const statement2 = this.parseStatement2();
			rest.push({
				type: "ijek-statement-2",
				start: ijek.start,
				end: statement2.end,
				ijek,
				statement2,
			});
		}
		return {
			type: "statement-1",
			start: first.start,
			end: rest.length > 0 ? rest[rest.length - 1].end : first.end,
			first,
			rest,
		};
	}

	public parseStatement2(): Statement2 {
		const first = this.parseStatement3();
		return {
			type: "statement-2",
			start: first.start,
			end: first.end,
			first,
		};
	}

	public parseStatement3(): Statement3 {
		const sentence = this.parseSentence();
		return {
			type: "statement-3",
			start: sentence.start,
			end: sentence.end,
			sentence,
		};
	}

	public parseSelbri(): Selbri {
		const tag = undefined; // TODO
		const selbri1 = this.parseSelbri1();
		return {
			type: "selbri",
			start: selbri1.start,
			end: selbri1.end,
			tag,
			selbri1,
		};

		// const units: TanruUnit[] = [];
		// for (;;) {
		// 	const token = this.peekToken();
		// 	console.log(token);
		// 	if (!token) break;
		// 	if (token.selmaho === "BRIVLA") {
		// 		units.push({ start: token.index, end: token.index, type: "brivla" });
		// 	} else {
		// 		break;
		// 	}
		// 	this.index++;
		// }
		// if (units.length === 0) {
		// 	throw new ParseError("Empty selbri");
		// }
		// const selbri: Selbri = {
		// 	start: units[0].start,
		// 	end: units[units.length - 1].end,
		// 	type: "selbri",
		// 	units,
		// };
		// return selbri;
	}

	public parseSelbri1(): Selbri1 {
		const na = this.tryParseCmavoWithFrees("NA");
		if (na) {
			const selbri = this.parseSelbri();

			return {
				type: "selbri-1-na",
				start: na.start,
				end: selbri.end,
				na,
				selbri,
			};
		}
		const selbri2 = this.parseSelbri2();
		return {
			type: "selbri-1-simple",
			start: selbri2.start,
			end: selbri2.end,
			selbri2,
		};
	}

	public parseSelbri2(): Selbri2 {
		const selbri3 = this.parseSelbri3();
		return {
			type: "selbri-2",
			start: selbri3.start,
			end: selbri3.end,
			selbri3,
		};
	}

	public parseSelbri3(): Selbri3 {
		const selbri4 = this.parseSelbri4();
		return {
			type: "selbri-3",
			start: selbri4.start,
			end: selbri4.end,
			selbri4s: [selbri4],
		};
	}

	public parseSumti(): Sumti<Floating> {
		const sumti1 = this.parseSumti1();
		const vuho = this.tryParseCmavoWithFrees("VUhO");
		const relativeClauses = vuho ? this.tryParseRelativeClauses() : undefined;
		if (vuho && relativeClauses === undefined) {
			throw new ParseError("Expected relative clause after vu'o");
		}

		return {
			type: "sumti",
			start: sumti1.start,
			end: sumti1.end,
			sumti1,
			vuho,
			relativeClauses,
			role: undefined,
		};
	}

	public parseSumti1(): Sumti1 {
		const sumti2 = this.parseSumti2();
		return {
			type: "sumti-1",
			start: sumti2.start,
			end: sumti2.end,
			sumti2,
		};
	}

	public parseSumti2(): Sumti2 {
		const sumti3 = this.parseSumti3();
		return {
			type: "sumti-2",
			start: sumti3.start,
			end: sumti3.end,
			sumti3,
		};
	}

	public parseSumti3(): Sumti3 {
		const sumti4 = this.parseSumti4();
		return {
			type: "sumti-3",
			start: sumti4.start,
			end: sumti4.end,
			sumti4,
		};
	}

	public parseSumti4(): Sumti4 {
		const sumti5 = this.parseSumti5();
		return {
			type: "sumti-4",
			start: sumti5.start,
			end: sumti5.end,
			sumti5,
		};
	}

	public parseSumti5(): Sumti5 {
		const outerQuantifier = this.tryParseQuantifier();
		const sumti6 = this.parseSumti6();
		const relativeClauses = this.tryParseRelativeClauses();
		return {
			type: "sumti-5-large",
			start: sumti6.start,
			end: sumti6.end,
			outerQuantifier,
			sumti6,
			relativeClauses,
		};
	}

	public tryParseQuantifier(): Quantifier | undefined {
		const token = this.peekToken();

		if (token && token.selmaho === "PA") {
			return this.parseQuantifier();
		} else {
			return undefined;
		}
	}

	public parseQuantifier(): Quantifier {
		const number = this.parseNamcu();
		const boi = this.tryParseCmavoWithFrees("BOI");
		return {
			type: "quantifier",
			start: number.start,
			end: boi?.end ?? number.end,
			number,
			boi,
		};
	}

	public parseNamcu(): Namcu {
		const first = this.parsePa();
		let end = first.end;
		const rest: (Pa | LerfuWord)[] = [];
		while (true) {
			const next = undefined; // TODO this.tryParsePaLerfuWord();
			if (!next) break;
			// end = next.end;
			// rest.push(next);
		}
		return { type: "number", start: first.start, end, first, rest };
	}

	public parsePa(): Pa {
		const token = this.nextToken();
		if (!token || token.selmaho !== "PA") {
			throw new ParseError("Expected digit");
		}
		return { type: "pa", start: token.index, end: token.index };
	}

	public tryParseRelativeClauses(): RelativeClauses | undefined {
		const relativeClause = this.tryParseRelativeClause();
		if (!relativeClause) return undefined;
		return {
			type: "relative-clauses",
			start: relativeClause.start,
			end: relativeClause.end,
			first: relativeClause,
		};
	}

	public tryParseRelativeClause(): RelativeClause | undefined {
		const noi = this.tryParseCmavoWithFrees("NOI");
		if (!noi) return undefined;
		const subsentence = this.parseSubsentence();
		const kuho = this.tryParseCmavoWithFrees("KUhO");
		return {
			type: "relative-clause",
			start: noi.start,
			end: kuho?.end ?? subsentence?.end,
			noi,
			subsentence,
			kuho,
		};
	}

	public parseSumti6(): Sumti6 {
		const token = this.peekToken();
		if (!token) {
			throw new ParseError("Expected sumti", this.index);
		}
		if (token.selmaho === "KOhA") {
			const koha = this.tryParseCmavoWithFrees("KOhA")!;
			return { type: "sumti-6-koha", start: koha.start, end: koha.end, koha };
		}
		throw new ParseError("Unsupported sumti6");
	}

	public tryParseTerm(): Term<Floating> | undefined {
		const token = this.peekToken();
		if (!token) {
			return undefined;
		}
		if (token.selmaho === "KOhA" || token.selmaho === "LE") {
			return this.parseSumti();
		}
		return undefined; // Not a term
	}

	public tryParseCmavoWithFrees(selmaho: Selmaho): CmavoWithFrees | undefined {
		const token = this.peekToken();
		if (token && token.selmaho === selmaho) {
			this.index++;
			return {
				start: token.index,
				end: token.index,
				type: "cmavo-with-frees",
				cmavo: token.index,
				// TODO parse frees
				frees: [],
			};
		}
		return undefined;
	}

	public parseSentence(): Sentence {
		const head: Term<Floating>[] = [];
		const terbriState: TerbriState = { x: 1, filled: 0n };
		const headPositions: number[] = [];
		while (true) {
			const term = this.tryParseTerm();
			if (!term) {
				break;
			}
			head.push(term);
			headPositions.push(terbriState.x);
			terbriState.filled |= 1n << BigInt(terbriState.x);
			terbriState.x++;
		}
		const cu = head.length ? this.tryParseCmavoWithFrees("CU") : undefined;
		if (terbriState.x === 1) {
			// After verb, skip to the x2:
			terbriState.x = 2;
		}
		const bridiTail = this.parseBridiTail(terbriState);

		const terms: Terms<Positional> | undefined =
			head.length > 0
				? {
						type: "terms",
						start: head[0].start,
						end: head[head.length - 1].end,
						terms: head.map((term, i) => ({
							...term,
							role: {
								xIndex: headPositions[i],
								verbs: bridiTail.tertaus,
							},
						})),
					}
				: undefined;

		return {
			type: "sentence",
			start: head[0]?.start || bridiTail.start,
			end: bridiTail.end,
			cu,
			bridiTail,
			terms,
		};
	}

	public parseSubsentence(): Subsentence {
		const sentence = this.parseSentence();
		return {
			type: "subsentence",
			start: sentence.start,
			end: sentence.end,
			prenexes: [], // TODO
			sentence,
		};
	}

	public parseBridiTail(terbriState: TerbriState): BridiTail<Positional> {
		const first = this.parseBridiTail1(terbriState);
		return {
			type: "bridi-tail",
			start: first.start,
			end: first.end,
			tertaus: first.tertaus,
			first,
		};
	}

	public parseBridiTail1(terbriState: TerbriState): BridiTail1<Positional> {
		const first = this.parseBridiTail2(terbriState);
		return {
			type: "bridi-tail-1",
			start: first.start,
			end: first.end,
			tertaus: first.tertaus,
			first,
		};
	}

	public parseBridiTail2(terbriState: TerbriState): BridiTail2<Positional> {
		const first = this.parseBridiTail3(terbriState);
		return {
			type: "bridi-tail-2",
			start: first.start,
			end: first.end,
			tertaus: [first.tertau],
			first,
		};
	}

	public parseBridiTail3(terbriState: TerbriState): BridiTail3<Positional> {
		const selbri = this.parseSelbri();
		const tailTerms = this.parseTailTerms();

		let state = terbriState;
		const placedTerms: Term<Positional>[] = [];
		for (const term of tailTerms.terms?.terms ?? []) {
			placedTerms.push({
				...term,
				role: {
					xIndex: state.x,
					verbs: [{ start: selbri.end, end: selbri.end }],
				},
			});
			const newFilled = state.filled | (1n << BigInt(state.x));
			let newX = state.x;
			while (newFilled & (1n << BigInt(newX))) {
				newX++;
			}
			state = { x: newX, filled: newFilled };
		}

		const placedTailTerms: TailTerms<Positional> = {
			type: "tail-terms",
			start: tailTerms.start,
			end: tailTerms.end,
			terms: {
				type: "terms",
				start: tailTerms.start,
				end: tailTerms.end,
				terms: placedTerms,
			},
			vau: tailTerms.vau,
		};

		return {
			type: "bridi-tail-3",
			start: selbri.start,
			end: placedTailTerms.end,
			tertau: { start: selbri.end, end: selbri.end }, // TODO not quite. "se broda"
			selbri,
			tailTerms: placedTailTerms,
		};
	}

	public parseTailTerms(): TailTerms<Floating> {
		const terms = this.tryParseTerms();
		const vau = this.tryParseCmavoWithFrees("VAU");
		return {
			type: "tail-terms",
			start: terms?.start ?? vau?.start ?? Number.POSITIVE_INFINITY,
			end: vau?.end ?? terms?.end ?? Number.NEGATIVE_INFINITY,
			terms,
			vau,
		};
	}

	public tryParseTerms(): Terms<Floating> | undefined {
		const terms: Term<Floating>[] = [];
		let start = Number.POSITIVE_INFINITY;
		let end = Number.NEGATIVE_INFINITY;

		while (true) {
			const term = this.tryParseTerm();
			console.log("Term at", this.index, term);
			if (!term) break;
			if (start === Number.POSITIVE_INFINITY) start = term.start;
			end = term.end;
			terms.push(term);
		}

		if (terms.length === 0) return undefined;

		return {
			type: "terms",
			start,
			end,
			terms,
		};
	}
}

export type ParseResult =
	| { success: true; tokens: Token[]; text: Text }
	| { success: false; error: ParseError };

export function parse(tokens: Token[]): ParseResult {
	const parser = new Parser(tokens);
	try {
		const text = parser.parseText();
		if (text) {
			return { success: true, tokens, text };
		} else {
			return { success: false, error: new ParseError("Failed to parse bridi") };
		}
	} catch (error) {
		if (error instanceof ParseError) {
			return { success: false, error };
		} else {
			throw error; // Re-throw unexpected errors
		}
	}
}
