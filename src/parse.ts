/** biome-ignore-all lint/style/noNonNullAssertion: <explanation> */

import type {
	BridiTail,
	BridiTail1,
	BridiTail2,
	BridiTail3,
	BrivlaWithFrees,
	CmavoWithFrees,
	Floating,
	Fragment,
	Free,
	Gihek,
	GihekTail,
	Ijek,
	IjekStatement2,
	IntervalProperty,
	Item,
	LerfuString,
	LerfuWord,
	Motion,
	Naku,
	Namcu,
	Nihos,
	Pa,
	Paragraph,
	Positional,
	Quantifier,
	RelativeClause,
	RelativeClauses,
	Selbri,
	Selbri1,
	Selbri2,
	Selbri3,
	Selbri4,
	Selbri5,
	Selbri6,
	Sentence,
	SimpleTenseModal,
	Space,
	SpaceInterval,
	SpaceIntProp,
	SpaceOffset,
	Spacetime,
	Span,
	Statement,
	Statement1,
	Statement2,
	Statement3,
	StmBai,
	StmTense,
	Subsentence,
	Sumti,
	Sumti1,
	Sumti2,
	Sumti3,
	Sumti4,
	Sumti5,
	Sumti6,
	SumtiTail,
	SumtiTail1,
	Tag,
	Tagged,
	TailTerms,
	TanruUnit,
	TanruUnit1,
	TanruUnit2,
	TenseModal,
	Term,
	Terms,
	Text,
	Text1,
	Time,
	TimeOffset,
	Timespace,
	TokenIndex,
	Vxha,
	Zehapu,
} from "./grammar";
import type { Selmaho, Token } from "./tokenize";

class ParseError extends Error {
	readonly site?: TokenIndex;
	constructor(explanation: string, site?: TokenIndex) {
		super(explanation);
		this.name = "ParseError";
		this.site = site;
	}
}

class Unsupported extends Error {
	constructor(explanation: string) {
		super(explanation);
		this.name = "Unsupported";
	}
}

interface TerbriState {
	x: number;
	// Bitset of filled positions
	filled: bigint;
}

export interface Snapshot {
	index: TokenIndex;
	state: string[];
	completed?: Span;
}

/**
 * State in the context of which a positional sumti can occur.
 * After saying "mi mutce nelci..." there is a Tertau hanging in the air
 * with `tertau` = nelci and `state` = {x:2, filled: {1}}.
 * After "mi zgana gi'e nelci vau..." there are two Tertaus.
 */
export interface Tertau {
	tertau: Span;
	state: TerbriState;
}

export class Parser {
	public readonly tokens: Token[];
	public index: TokenIndex;
	public state: string[];
	public snapshots: Snapshot[];
	public depth = 0;

	constructor(tokens: Token[]) {
		this.tokens = tokens;
		this.index = 0;
		this.state = [];
		this.snapshots = [];
	}

	private takeSnapshot(completed?: Span) {
		this.snapshots.push({
			index: this.index,
			state: [...this.state],
			completed,
		});
	}

	private begin(type: string) {
		this.state.push(`Parsing ${type}`);
		this.takeSnapshot();
	}

	private log(text: string, completed?: Span) {
		if (this.state.length) this.state.pop();
		this.state.push(text);
		this.takeSnapshot(completed);
	}

	private parsed<T extends Span>(type: string, result: T): T {
		this.state.pop();
		this.state.push(
			`Finished ${type} (${this.tokens
				.slice(result.start, result.end + 1)
				.map((x) => x.lexeme)
				.join(" ")})`,
		);
		this.takeSnapshot(result);
		this.state.pop();

		return result;
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
		this.begin("text");
		const frees = this.parseFrees();
		const text1 = this.parseText1();
		return this.parsed("text", {
			type: "text",
			free: frees,
			start: frees.length ? frees[0].start : text1.start,
			end: text1.end,
			text1,
		});
	}

	public parseText1(): Text1 {
		const i = this.tryParseCmavoWithFrees("I") ?? this.tryParseNihos();
		const first = this.parseParagraph();
		const paragraphs = [first];
		let end = first.end;
		while (this.peekToken()?.selmaho === "NIhO") {
			const p = this.parseParagraph();
			end = p.end;
			paragraphs.push(p);
		}
		return {
			type: "text-1",
			start: i?.start ?? first.start,
			end,
			firstSeparator: i,
			paragraphs,
		};
	}

	public tryParseNihos(): Nihos | undefined {
		const first = this.tryParseCmavo("NIhO");
		if (first === undefined) return undefined;
		const nihos = [first];
		while (true) {
			const next = this.tryParseCmavo("NIhO");
			if (next === undefined) break;
			nihos.push(next);
		}
		const frees = this.parseFrees();
		return {
			type: "nihos",
			start: first,
			end: frees.length ? frees[frees.length - 1].end : nihos[nihos.length - 1],
			nihos,
			frees,
		};
	}

	public parseParagraph(): Paragraph {
		this.begin("paragraph");
		const niho = this.tryParseNihos();
		const first = this.parseTem();
		const items: Item[] = [];
		while (this.peekToken()?.selmaho === "I") {
			const item = this.parseItem();
			items.push(item);
		}

		return this.parsed("paragraph", {
			type: "paragraph",
			start: niho?.start ?? first.start,
			end: items.length > 0 ? items[items.length - 1].end : first.end,
			niho,
			first,
			rest: items,
		});
	}

	public parseItem(): Item {
		this.begin("item");
		const i = this.tryParseCmavoWithFrees("I");
		const tem = this.parseTem();
		return this.parsed("item", {
			type: "item",
			start: i?.start ?? tem.start,
			end: tem.end,
			i,
			tem,
		});
	}

	public parseTem(): Statement | Fragment {
		return this.parseStatement();
	}

	public parseStatement(): Statement {
		this.begin("statement");
		const first = this.parseStatement1();
		return this.parsed("statement", {
			type: "statement",
			start: first.start,
			end: first.end,
			prenexes: [], // TODO
			statement1: first,
		});
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
					frees: this.parseFrees(),
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
		this.begin("selbri");
		const selmaho = this.peekToken()?.selmaho;
		const tag =
			selmaho && this.isTenseSelmaho(selmaho) ? this.parseTag() : undefined;
		const selbri1 = this.parseSelbri1();
		return this.parsed("selbri", {
			type: "selbri",
			start: tag?.start ?? selbri1.start,
			end: selbri1.end,
			tag,
			selbri1,
		});
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

	private isVerbAhead(): boolean {
		const decision =
			(this.isAhead(["NAhE"]) && !this.isAhead(["NAhE", "BO"])) ||
			this.isAhead(["BRIVLA"]) ||
			this.isAhead(["GOhA"]) ||
			this.isAhead(["KE"]) || // really?
			this.isAhead(["ME"]) || // TODO: moi, tricky lookahead (.i mi panononono da/moi)
			this.isAhead(["SE"]) ||
			this.isAhead(["JAI"]) ||
			this.isAhead(["NU"]);

		return decision;
	}

	public parseSelbri3(): Selbri3 {
		const first = this.parseSelbri4();
		const tanru: Selbri4[] & { 0: Selbri4 } = [first];
		let end = first.end;

		this.log("Is this selbri a tanru?", first);
		while (this.isVerbAhead()) {
			const next = this.parseSelbri4();
			end = next.end;
			tanru.push(next);
		}

		return {
			type: "selbri-3",
			start: first.start,
			end,
			selbri4s: tanru,
		};
	}

	public parseSelbri4(): Selbri4 {
		const selbri5 = this.parseSelbri5();
		return {
			type: "selbri-4",
			start: selbri5.start,
			end: selbri5.end,
			first: selbri5,
		};
	}

	public parseSelbri5(): Selbri5 {
		const selbri6 = this.parseSelbri6();
		return {
			type: "selbri-5",
			start: selbri6.start,
			end: selbri6.end,
			first: selbri6,
		};
	}

	public parseSelbri6(): Selbri6 {
		const tanruUnit = this.parseTanruUnit();
		return {
			type: "selbri-6",
			start: tanruUnit.start,
			end: tanruUnit.end,
			tanruUnit,
		};
	}

	public parseTanruUnit(): TanruUnit {
		const tanruUnit1 = this.parseTanruUnit1();
		return {
			type: "tanru-unit",
			start: tanruUnit1.start,
			end: tanruUnit1.end,
			tanruUnit1,
		};
	}

	public parseTanruUnit1(): TanruUnit1 {
		const tanruUnit2 = this.parseTanruUnit2();
		return {
			type: "tanru-unit-1",
			start: tanruUnit2.start,
			end: tanruUnit2.end,
			tanruUnit2,
		};
	}

	public isNumberMoiAhead(): boolean {
		const backtrack = this.index;
		const number = this.tryParseNamcu() ?? this.tryParseLerfuString();
		const success =
			number !== undefined && this.tryParseCmavo("MOI") !== undefined;
		this.index = backtrack;
		return success;
	}

	public parseTanruUnit2(): TanruUnit2 {
		const token = this.peekToken();
		if (!token) throw new ParseError("expected tanru-unit, got eof");

		if (token?.selmaho === "BRIVLA") {
			const brivla = this.parseBrivlaWithFrees();
			return {
				type: "tu-brivla",
				start: token.index,
				end: token.index,
				brivla,
			};
		}

		if (token?.selmaho === "GOhA") {
			const goha = this.nextToken()!;
			const raho = this.tryParseCmavo("RAhO");
			const frees = this.parseFrees();
			return {
				type: "tu-goha",
				start: goha.index,
				end: frees.length ? frees[frees.length - 1].end : (raho ?? goha.index),
				goha: goha.index,
				raho,
				frees,
			};
		}

		if (token?.selmaho === "KE") {
			const ke = this.tryParseCmavoWithFrees("KE")!;
			const selbri3 = this.parseSelbri3();
			const kehe = this.tryParseCmavoWithFrees("KEhE");
			return {
				type: "tu-ke",
				start: ke.start,
				end: kehe?.end ?? selbri3.end,
				ke,
				selbri3,
				kehe,
			};
		}

		if (token?.selmaho === "ME") {
			const me = this.tryParseCmavoWithFrees("ME")!;
			const sumti = this.parseSumti();
			const mehu = this.tryParseCmavoWithFrees("MEhU");
			const moi = this.tryParseCmavoWithFrees("MOI");
			return {
				type: "tu-me",
				start: me.start,
				end: moi?.end ?? mehu?.end ?? sumti?.end,
				me,
				sumti,
				mehu,
				moi,
			};
		}

		if (this.isNumberMoiAhead()) {
			const namcu = this.tryParseNamcu() ?? this.tryParseLerfuString()!;
			const moi = this.tryParseCmavoWithFrees("MOI")!;
			return {
				type: "tu-moi",
				start: namcu.start,
				end: moi.end,
				number: namcu,
				moi,
			};
		}

		if (token?.selmaho === "SE") {
			const se = this.tryParseCmavoWithFrees("SE")!;
			const inner = this.parseTanruUnit2();
			return {
				type: "tu-se",
				start: se.start,
				end: inner.end,
				se,
				inner,
			};
		}

		if (token?.selmaho === "JAI") {
			const jai = this.tryParseCmavoWithFrees("JAI")!;
			const tag = this.isTaggedVerbAhead() ? this.parseTag() : undefined;
			const inner = this.parseTanruUnit2();
			return {
				type: "tu-jai",
				start: jai.start,
				end: inner.end,
				jai,
				tag,
				inner,
			};
		}

		if (token?.selmaho === "NAhE") {
			const nahe = this.tryParseCmavoWithFrees("NAhE")!;
			const inner = this.parseTanruUnit2();
			return {
				type: "tu-nahe",
				start: nahe.start,
				end: inner.end,
				nahe,
				inner,
			};
		}

		if (token?.selmaho === "NU") {
			const nu = this.tryParseCmavoWithFrees("NU")!;
			const subsentence = this.parseSubsentence();
			const kei = this.tryParseCmavoWithFrees("KEI");
			return {
				type: "tu-nu",
				start: nu.start,
				end: kei?.end ?? subsentence.end,
				nu,
				subsentence,
				kei,
			};
		}

		throw new Unsupported(`Unsupported tanru-unit-2: ${token?.selmaho}`);
	}

	public parseSumti(): Sumti<Floating> {
		const sumti1 = this.parseSumti1();
		const vuho = this.tryParseCmavoWithFrees("VUhO");
		const relativeClauses = vuho
			? this.tryParseRelativeClauses(sumti1)
			: undefined;
		if (vuho && relativeClauses === undefined) {
			throw new ParseError("Expected relative clause after vu'o");
		}

		return {
			type: "sumti",
			start: sumti1.start,
			end: relativeClauses?.end ?? sumti1.end,
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
		if (outerQuantifier && this.isVerbAhead()) {
			const selbri = this.parseSelbri();
			const ku = this.tryParseCmavoWithFrees("KU");
			const relativeClauses = this.tryParseRelativeClauses(selbri);
			return {
				type: "sumti-5-small",
				start: outerQuantifier.start,
				end: relativeClauses?.end ?? ku?.end ?? selbri.end,
				quantifier: outerQuantifier,
				selbri,
				ku,
				relativeClauses,
			};
		}
		const sumti6 = this.parseSumti6();
		const relativeClauses = this.tryParseRelativeClauses(sumti6);
		return {
			type: "sumti-5-large",
			start: outerQuantifier?.start ?? sumti6.start,
			end: relativeClauses?.end ?? sumti6.end,
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
			const next = this.tryParsePa() ?? this.tryParseLerfuWord();
			if (!next) break;
			end = next.end;
			rest.push(next);
		}
		return { type: "number", start: first.start, end, first, rest };
	}

	public tryParseNamcu(): Namcu | undefined {
		if (this.peekToken()?.selmaho === "PA") {
			return this.parseNamcu();
		} else {
			return undefined;
		}
	}

	public tryParseLerfuWord(): LerfuWord | undefined {
		const by = this.tryParseCmavo("BY");
		if (by === undefined) return undefined;
		return { type: "lerfu-word", start: by, end: by, by };
	}

	public tryParseLerfuString(): LerfuString | undefined {
		const first = this.tryParseLerfuWord();
		if (!first) {
			return undefined;
		}
		const rest: (Pa | LerfuWord)[] = [];
		while (true) {
			const next = this.tryParseLerfuWord() ?? this.tryParsePa();
			if (!next) break;
		}
		return {
			type: "lerfu-string",
			start: first.start,
			end: rest.length ? rest[rest.length - 1].end : first.end,
			first,
			rest,
		};
	}

	public parsePa(): Pa {
		const token = this.nextToken();
		if (!token || token.selmaho !== "PA") {
			throw new ParseError("Expected digit");
		}
		return { type: "pa", start: token.index, end: token.index };
	}

	public tryParsePa(): Pa | undefined {
		const token = this.tryParseCmavo("PA");
		if (token) {
			return { type: "pa", start: token, end: token };
		}
		return undefined;
	}

	public tryParseRelativeClauses(
		antecedent: Span,
	): RelativeClauses | undefined {
		const relativeClause = this.tryParseRelativeClause(antecedent);
		if (!relativeClause) return undefined;
		return {
			type: "relative-clauses",
			start: relativeClause.start,
			end: relativeClause.end,
			first: relativeClause,
		};
	}

	public tryParseRelativeClause(antecedent: Span): RelativeClause | undefined {
		const noi = this.tryParseCmavoWithFrees("NOI");
		if (!noi) return undefined;
		const subsentence = this.parseSubsentence();
		const kuho = this.tryParseCmavoWithFrees("KUhO");
		return {
			type: "relative-clause",
			start: noi.start,
			end: kuho?.end ?? subsentence?.end,
			antecedent,
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

		if (token.selmaho === "BY") {
			const lerfuString = this.tryParseLerfuString()!;
			const boi = this.tryParseCmavoWithFrees("BOI");
			return {
				type: "sumti-6-lerfu",
				start: lerfuString.start,
				end: boi?.end ?? lerfuString.end,
				lerfuString,
				boi,
			};
		}

		if (token.selmaho === "LAhE") {
			const lahe = this.tryParseCmavoWithFrees("LAhE")!;
			const sumti = this.parseSumti();
			const luhu = this.tryParseCmavoWithFrees("LUhU");
			return {
				type: "sumti-6-lahe",
				start: lahe.start,
				end: luhu?.end ?? sumti.end,
				lahe,
				sumti,
				luhu,
			};
		}

		if (token.selmaho === "LE") {
			const le = this.tryParseCmavoWithFrees("LE")!;
			const sumtiTail = this.parseSumtiTail();
			const ku = this.tryParseCmavoWithFrees("KU");
			return {
				type: "sumti-6-le",
				start: le.start,
				end: ku?.end ?? sumtiTail.end,
				le,
				sumtiTail,
				ku,
			};
		}

		if (token.selmaho === "LA") {
			const la = this.tryParseCmavoWithFrees("LA")!;
			// TODO: relative clauses...
			const names = this.zeroOrMore("CMEVLA");
			const frees = this.parseFrees();
			if (names.length) {
				return {
					type: "sumti-6-la",
					start: la.start,
					end: names[names.length - 1],
					la,
					relativeClauses: undefined,
					cmevlas: names,
					frees,
				};
			} else {
				// TODO: DRY?
				const sumtiTail = this.parseSumtiTail();
				const ku = this.tryParseCmavoWithFrees("KU");
				return {
					type: "sumti-6-le",
					start: la.start,
					end: ku?.end ?? sumtiTail.end,
					le: la,
					sumtiTail,
					ku,
				};
			}
		}

		throw new Unsupported(`Unsupported sumti6 ${token.selmaho}`);
	}

	public zeroOrMore(selmaho: Selmaho): TokenIndex[] {
		const result = [];
		while (this.peekToken()?.selmaho === selmaho) {
			result.push(this.nextToken()!.index);
		}
		return result;
	}

	private isAhead(selmahos: Selmaho[]): boolean {
		return selmahos.every((s, i) => this.tokens[this.index + i]?.selmaho === s);
	}

	private isSumti6Ahead(): boolean {
		return (
			this.isAhead(["LAhE"]) ||
			this.isAhead(["NAhE", "BO"]) ||
			this.isAhead(["KOhA"]) ||
			this.isAhead(["BY"]) ||
			this.isAhead(["BU"]) || // TODO: actually handle word+bu...
			this.isAhead(["LA"]) ||
			this.isAhead(["LE"]) ||
			this.isAhead(["LI"]) ||
			this.isAhead(["ZO"]) || // TODO: magic
			this.isAhead(["LU"]) ||
			this.isAhead(["LOhU"]) ||
			this.isAhead(["ZOI"]) // TODO: magic
		);
	}

	public parseSumtiTail(): SumtiTail {
		this.begin("sumti-tail");
		const owner = this.isSumti6Ahead() ? this.parseSumti6() : undefined;
		const relativeClauses = this.tryParseRelativeClauses(
			owner ?? { start: this.index - 1, end: this.index - 1 },
		);
		const tail = this.parseSumtiTail1();
		return this.parsed("sumti-tail", {
			type: "sumti-tail",
			start: owner?.start ?? tail.start,
			end: tail.end,
			owner,
			relativeClauses,
			tail,
		});
	}

	public parseSumtiTail1(): SumtiTail1 {
		const selbri = this.parseSelbri();
		const relativeClauses = this.tryParseRelativeClauses(selbri);
		return {
			type: "sumti-tail-1",
			start: selbri.start,
			end: relativeClauses?.end ?? selbri.end,
			selbri,
			relativeClauses,
		};
	}

	private isSumtiAhead(): boolean {
		if (this.isSumti6Ahead()) {
			return true;
		}
		if (this.isNumberMoiAhead()) {
			return false;
		}
		return this.isAhead(["PA"]);
	}

	public isTenseSelmaho(selmaho: Selmaho): boolean {
		return [
			"FA", // dubious but CLL says so
			"BAI",
			"CAhA",
			"KI",
			"CUhE",
			"ZI",
			"ZEhA",
			"PU",
			"NAI", // ehhh
			"VA",
			"MOhI",
			"FAhA",
			"VEhA",
			"VIhA",
			"FEhE",
			// TODO: handle number+roi here
			"TAhE",
			"ZAhO",
		].includes(selmaho);
	}

	private isTaggedSumtiAhead(): boolean {
		// kinda ugly
		const oldIndex = this.index;
		while (true) {
			const selmaho = this.tokens[this.index]?.selmaho;
			if (selmaho === "FIhO") return true;
			if (this.isTenseSelmaho(selmaho)) {
				this.index++;
				continue;
			}
			break;
		}
		if (this.index === oldIndex) return false; // no tag

		const ok = !this.isVerbAhead();
		this.index = oldIndex;
		return ok;
	}

	private isTaggedVerbAhead(): boolean {
		// kinda ugly
		const oldIndex = this.index;
		while (true) {
			const selmaho = this.tokens[this.index]?.selmaho;
			if (this.isTenseSelmaho(selmaho)) {
				this.index++;
				continue;
			}
			break;
		}
		if (this.index === oldIndex) return false; // no tag

		const ok = this.isVerbAhead();
		this.index = oldIndex;
		return ok;
	}

	public parseTag(): Tag {
		this.begin("tag");
		const tenseModal = this.parseTenseModal();
		return this.parsed("tag", {
			type: "tag",
			start: tenseModal.start,
			end: tenseModal.end,
			first: tenseModal,
		});
	}

	public parseTenseModal(): TenseModal {
		const simpleTenseModal = this.parseSimpleTenseModal();
		const frees = this.parseFrees();
		return {
			type: "tense-modal",
			start: simpleTenseModal.start,
			end: simpleTenseModal.end,
			first: simpleTenseModal,
			frees,
		};
	}

	public parseSimpleTenseModal(): SimpleTenseModal {
		if (this.isAhead(["KI"]) || this.isAhead(["CUhE"])) {
			const kiOrCuhe = this.nextToken()!;
			return {
				type: "stm-cmavo",
				start: kiOrCuhe.index,
				end: kiOrCuhe.index,
				kiOrCuhe: kiOrCuhe.index,
			};
		}
		if (
			this.isAhead(["NAhE", "SE", "BAI"]) ||
			this.isAhead(["NAhE", "BAI"]) ||
			this.isAhead(["SE"]) ||
			this.isAhead(["BAI"])
		) {
			return this.parseStmBai();
		}
		return this.parseStmTense();
	}

	public tryParseCmavo(selmaho: Selmaho): TokenIndex | undefined {
		if (this.peekToken()?.selmaho === selmaho) {
			return this.index++;
		}
	}

	public parseStmBai(): StmBai {
		const nahe = this.tryParseCmavo("NAhE");
		const se = this.tryParseCmavo("SE");
		const bai = this.tryParseCmavo("BAI")!;
		const nai = this.tryParseCmavo("NAI");
		const ki = this.tryParseCmavo("KI");
		return {
			type: "stm-bai",
			start: nahe ?? se ?? bai,
			end: ki ?? nai ?? bai,
			nahe,
			se,
			bai,
			nai,
			ki,
		};
	}

	public parseStmTense(): StmTense {
		const nahe = this.tryParseCmavo("NAhE");
		const tense = this.tryParseTimespace() ?? this.tryParseSpacetime();
		const caha = this.tryParseCmavo("CAhA");
		const ki = this.tryParseCmavo("KI");

		if (!tense && !caha) {
			console.log({ nahe, tense, caha, ki });
			// We should never hit this because we predict it
			throw new ParseError("Bad stm-tense", this.index);
		}

		return {
			type: "stm-tense",
			start: (nahe ?? tense?.start ?? caha)!,
			end: (ki ?? caha ?? tense?.end)!,
			nahe,
			tense,
			caha,
			ki,
		};
	}

	public tryParseTimespace(): Timespace | undefined {
		const time = this.tryParseTime();
		if (!time) return undefined;
		const space = this.tryParseSpace();
		return {
			type: "timespace",
			start: time.start,
			end: space?.end ?? time.end,
			time,
			space,
		};
	}

	public tryParseSpacetime(): Spacetime | undefined {
		const space = this.tryParseSpace();
		if (!space) return undefined;
		const time = this.tryParseTime();
		return {
			type: "spacetime",
			start: space.start,
			end: time?.end ?? space.end,
			space,
			time,
		};
	}

	public tryParseTime(): Time | undefined {
		const backtrack = this.index;
		let start: number | undefined;
		let end: number | undefined;

		const zi = this.tryParseCmavoWithFrees("ZI");
		if (zi) {
			start ??= zi.start;
			end = zi.end;
		}

		const timeOffsets: TimeOffset[] = [];
		while (true) {
			const offset = this.tryParseTimeOffset();
			if (!offset) break;
			timeOffsets.push(offset);
			start ??= offset.start;
			end = offset.end;
		}

		const zehapu = this.tryParseZehapu();
		if (zehapu) {
			start ??= zehapu.start;
			end = zehapu.end;
		}

		const intervalProperties: IntervalProperty[] = [];
		while (true) {
			const property = this.tryParseIntervalProperty();
			if (!property) break;
			intervalProperties.push(property);
			start ??= property.start;
			end = property.end;
		}

		if (start !== undefined && end !== undefined) {
			return {
				type: "time",
				start,
				end,
				zi,
				timeOffsets,
				zehapu,
				intervalProperties,
			};
		} else {
			this.index = backtrack;
			return undefined;
		}
	}

	public tryParseTimeOffset(): TimeOffset | undefined {
		const pu = this.tryParseCmavo("PU");
		if (pu === undefined) return undefined;
		const nai = this.tryParseCmavo("NAI");
		const zi = this.tryParseCmavo("ZI");
		return {
			type: "time-offset",
			start: pu,
			end: zi ?? nai ?? pu,
			pu,
			nai,
			zi,
		};
	}

	public tryParseIntervalProperty(): IntervalProperty | undefined {
		const taheOrZaho = this.tryParseCmavo("TAhE") ?? this.tryParseCmavo("ZAhO");
		if (taheOrZaho) {
			const nai = this.tryParseCmavo("NAI");
			return {
				type: "interval-property-cmavo",
				start: taheOrZaho,
				end: nai ?? taheOrZaho,
				taheOrZaho,
				nai,
			};
		}

		const backtrack = this.index;
		const number = this.tryParseNamcu();
		if (!number) return undefined;
		const roi = this.tryParseCmavo("ROI");
		if (!roi) {
			this.index = backtrack;
			return undefined;
		}
		const nai = this.tryParseCmavo("NAI");
		return {
			type: "interval-property-roi",
			start: number.start,
			end: nai ?? roi,
			number,
			roi,
			nai,
		};
	}

	public tryParseZehapu(): Zehapu | undefined {
		const zeha = this.tryParseCmavo("ZEhA");
		if (zeha === undefined) return undefined;
		const pu = this.tryParseCmavo("PU");
		const nai = pu ? this.tryParseCmavo("NAI") : undefined;
		return {
			type: "zehapu",
			start: zeha,
			end: nai ?? pu ?? zeha,
			zeha,
			pu,
			nai,
		};
	}

	public tryParseSpace(): Space | undefined {
		const backtrack = this.index;
		let start: number | undefined;
		let end: number | undefined;

		const va = this.tryParseCmavoWithFrees("VA");
		if (va !== undefined) {
			start ??= va.start;
			end = va.end;
		}

		const spaceOffsets: SpaceOffset[] = [];
		while (true) {
			const offset = this.tryParseSpaceOffset();
			if (!offset) break;
			spaceOffsets.push(offset);
			start ??= offset.start;
			end = offset.end;
		}
		const spaceIntervals: SpaceInterval[] = [];
		while (true) {
			const interval = this.tryParseSpaceInterval();
			if (!interval) break;
			spaceIntervals.push(interval);
			start ??= interval.start;
			end = interval.end;
		}

		const motion = this.tryParseMotion();
		if (motion !== undefined) {
			start ??= motion.start;
			end = motion.end;
		}

		if (start !== undefined && end !== undefined) {
			return {
				type: "space",
				start,
				end,
				va,
				spaceOffsets,
				spaceIntervals,
				motion,
			};
		} else {
			this.index = backtrack;
			return undefined;
		}
	}

	public tryParseMotion(): Motion | undefined {
		const mohi = this.tryParseCmavo("MOhI");
		if (mohi === undefined) return undefined;
		const spaceOffset = this.tryParseSpaceOffset();
		if (spaceOffset === undefined) {
			throw new ParseError("bad motion");
		}
		return {
			type: "motion",
			start: mohi,
			end: spaceOffset?.end ?? mohi,
			mohi,
			spaceOffset,
		};
	}

	public tryParseSpaceOffset(): SpaceOffset | undefined {
		const faha = this.tryParseCmavo("FAhA");
		if (faha === undefined) return undefined;
		const nai = this.tryParseCmavo("NAI");
		const va = this.tryParseCmavo("VA");
		return {
			type: "space-offset",
			start: faha,
			end: va ?? nai ?? faha,
			faha,
			nai,
			va,
		};
	}

	public tryParseSpaceInterval(): SpaceInterval | undefined {
		const vxha = this.tryParseVxha();
		const spaceIntProps: SpaceIntProp[] = [];
		while (true) {
			const next = this.tryParseSpaceIntProp();
			if (!next) break;

			spaceIntProps.push(next);
		}
		if (vxha !== undefined && spaceIntProps.length) {
			return {
				type: "space-interval",
				start: vxha.start,
				end: spaceIntProps.length
					? spaceIntProps[spaceIntProps.length - 1].end
					: vxha.end,
				vxha,
				spaceIntProps,
			};
		}
	}

	public tryParseVxha(): Vxha | undefined {
		const veha = this.tryParseCmavo("VEhA");
		const viha = this.tryParseCmavo("VIhA");
		const first = veha ?? viha;
		if (first === undefined) return undefined;
		const faha = this.tryParseCmavo("FAhA");
		const nai = faha ? this.tryParseCmavo("NAI") : undefined;
		return {
			type: "vxha",
			start: first,
			end: nai ?? faha ?? viha ?? first,
			veha,
			viha,
			faha,
			nai,
		};
	}

	public tryParseSpaceIntProp(): SpaceIntProp | undefined {
		const fehe = this.tryParseCmavo("FEhE");
		if (fehe === undefined) return undefined;
		const intervalProperty = this.tryParseIntervalProperty();
		if (intervalProperty === undefined) {
			throw new ParseError("bad space-int-prop");
		}
		return {
			type: "space-int-prop",
			start: fehe,
			end: intervalProperty.end,
			fehe,
			intervalProperty,
		};
	}

	public parseTagged(): Tagged {
		const fa = this.tryParseCmavoWithFrees("FA");
		const tagOrFa = fa ?? this.parseTag();
		const sumtiOrKu = this.isSumtiAhead()
			? this.parseSumti()
			: this.tryParseCmavoWithFrees("KU");
		return {
			type: "tagged",
			start: tagOrFa.start,
			end: sumtiOrKu?.end ?? tagOrFa?.end,
			tagOrFa,
			sumtiOrKu,
		};
	}

	public tryParseTerm(): Term<Floating> | undefined {
		const token = this.peekToken();
		if (!token) {
			return undefined;
		}
		if (this.isAhead(["NA", "KU"])) {
			return this.parseNaku();
		}
		if (this.isSumtiAhead()) {
			return this.parseSumti();
		}
		if (this.isTaggedSumtiAhead()) {
			return this.parseTagged();
		}

		return undefined; // Not a term
	}

	public parseNaku(): Naku {
		const na = this.nextToken()!;
		const ku = this.tryParseCmavoWithFrees("KU")!;
		return { type: "naku", start: na.index, end: ku.end, na: na.index, ku };
	}

	public parseFrees(): Free[] {
		const frees: Free[] = [];
		while (true) {
			const token = this.peekToken();
			if (token?.selmaho === "UI" || token?.selmaho === "CAI") {
				frees.push({ type: "free", start: token.index, end: token.index });
				this.index++;
			} else {
				break;
			}
		}
		return frees;
	}

	public tryParseCmavoWithFrees(selmaho: Selmaho): CmavoWithFrees | undefined {
		const token = this.peekToken();
		if (token && token.selmaho === selmaho) {
			this.index++;
			const frees = this.parseFrees();
			return {
				start: token.index,
				end: frees.at(-1)?.end ?? token.index,
				type: "cmavo-with-frees",
				cmavo: token.index,
				frees,
			};
		}
		return undefined;
	}

	public parseBrivlaWithFrees(): BrivlaWithFrees {
		const token = this.peekToken();
		if (!token || token.selmaho !== "BRIVLA") {
			throw new ParseError("expected brivla");
		}
		this.index++;
		return {
			type: "brivla-with-frees",
			brivla: token.index,
			start: token.index,
			end: token.index,
			frees: this.parseFrees(),
		};
	}

	private showSpan(span: Span): string {
		return (
			this.tokens
				.slice(span.start, span.end + 1)
				.map((x) => x.lexeme)
				.join(" ") || "(empty span?)"
		);
	}

	public parseSentence(): Sentence {
		this.begin("sentence");
		const head: Term<Floating>[] = [];
		const headState: TerbriState = { x: 1, filled: 0n };
		const headPositions: number[] = [];
		while (true) {
			const term = this.tryParseTerm();
			if (!term) {
				this.log(`No more terms in head!`);
				break;
			}
			this.log(`Parsed term`, term);
			head.push(term);
			if (term.type === "sumti") {
				headPositions.push(headState.x);
				headState.filled |= 1n << BigInt(headState.x);
				while (headState.filled & (1n << BigInt(headState.x))) headState.x++;
			} else if (term.type === "tagged" && term.tagOrFa.type !== "tag") {
				// FA
				const num =
					"aeiou".indexOf(this.tokens[term.tagOrFa.cmavo].lexeme[1]) + 1;
				headPositions.push(num);
				headState.filled |= 1n << BigInt(num);
				headState.x = num;
				while (headState.filled & (1n << BigInt(headState.x))) headState.x++;
			} else {
				headPositions.push(NaN);
			}
		}
		const cu = head.length ? this.tryParseCmavoWithFrees("CU") : undefined;
		if (headState.x === 1) {
			// After verb, skip to the x2:
			headState.x = 2;
		}
		const { bridiTail, tertaus } = this.parseBridiTail(headState);

		const terms: Terms<Positional> | undefined =
			head.length > 0
				? {
						type: "terms",
						start: head[0].start,
						end: head[head.length - 1].end,
						terms: head.map((term, i) =>
							term.type === "sumti"
								? {
										...term,
										role: {
											roles: tertaus.map((t) => ({
												xIndex: headPositions[i],
												verb: t.tertau,
											})),
										},
									}
								: term,
						),
					}
				: undefined;

		return this.parsed("sentence", {
			type: "sentence",
			start: head[0]?.start || bridiTail.start,
			end: bridiTail.end,
			cu,
			bridiTail,
			terms,
		});
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

	/**
	 *
	 *   mi ti nelci ta gi'e dunda do vau ra
	 *
	 *   mi = nelci1 = dunda1
	 *   ti = nelci2 = dunda2
	 *
	 */

	public parseBridiTail(headState: TerbriState): {
		bridiTail: BridiTail<Positional>;
		tertaus: Tertau[];
	} {
		const { bridiTail1, tertaus } = this.parseBridiTail1(headState);
		return {
			bridiTail: {
				type: "bridi-tail",
				start: bridiTail1.start,
				end: bridiTail1.end,
				first: bridiTail1,
			},
			tertaus,
		};
	}

	public parseBridiTail1(headState: TerbriState): {
		bridiTail1: BridiTail1<Positional>;
		tertaus: Tertau[];
	} {
		this.begin("bridi-tail-1");
		const { bridiTail2, tertaus: lhsTertaus } = this.parseBridiTail2(headState);
		const allTertaus = lhsTertaus;
		const rest = [];
		while (true) {
			const gihek = this.tryParseGihekTail(headState, lhsTertaus);
			if (!gihek) break;
			rest.push(gihek.gihek);
			allTertaus.push(...gihek.tertaus);
		}
		const bridiTail1: BridiTail1<Positional> = this.parsed("bridi-tail-1", {
			type: "bridi-tail-1",
			start: bridiTail2.start,
			end: rest.length ? rest[rest.length - 1].end : bridiTail2.end,
			first: bridiTail2,
			rest,
		});
		return { bridiTail1, tertaus: allTertaus };
	}

	public tryParseGihekTail(
		headState: TerbriState,
		lhs: Tertau[],
	):
		| {
				gihek: GihekTail<Positional>;
				tertaus: Tertau[];
		  }
		| undefined {
		const gihek = this.tryParseGihek();
		if (gihek === undefined) return undefined;
		const frees = this.parseFrees();
		const { bridiTail2, tertaus } = this.parseBridiTail2(headState);
		const tailTerms = this.parseTailTerms();

		return {
			tertaus,
			gihek: {
				type: "gihek-tail-1",
				gihek,
				frees,
				tail: bridiTail2,
				tailTerms: this.placeTailTerms(tailTerms, [...lhs, ...tertaus])
					.placedTerms,
				start: gihek.start,
				end:
					tailTerms && tailTerms.end !== Number.NEGATIVE_INFINITY
						? tailTerms.end
						: bridiTail2.end,
			},
		};
	}

	public parseBridiTail2(headState: TerbriState): {
		bridiTail2: BridiTail2<Positional>;
		tertaus: Tertau[];
	} {
		const { bridiTail, tertaus: newTertaus } = this.parseBridiTail3(headState);
		return {
			tertaus: newTertaus,
			bridiTail2: {
				type: "bridi-tail-2",
				start: bridiTail.start,
				end: bridiTail.end,
				first: bridiTail,
			},
		};
	}

	public placeTailTerms(
		tailTerms: TailTerms<Floating>,
		tertaus: Tertau[],
	): { placedTerms: TailTerms<Positional>; newTertaus: Tertau[] } {
		const placed: Term<Positional>[] = [];
		let iterTertaus = tertaus;

		for (const term of tailTerms.terms?.terms ?? []) {
			placed.push(
				"role" in term
					? {
							...term,
							role: {
								roles: iterTertaus.map((s) => ({
									xIndex: s.state.x,
									verb: s.tertau,
								})),
							},
						}
					: term,
			);
			if (term.type === "sumti") {
				iterTertaus = iterTertaus.map((s) => {
					const newFilled = s.state.filled | (1n << BigInt(s.state.x));
					let newX = s.state.x;
					while (newFilled & (1n << BigInt(newX))) {
						newX++;
					}
					return { ...s, state: { x: newX, filled: newFilled } };
				});
			} else if (term.type === "tagged" && term.tagOrFa.type !== "tag") {
				// FA
				const fa = term.tagOrFa;
				iterTertaus = iterTertaus.map((s) => {
					const num = "aeiou".indexOf(this.tokens[fa.cmavo].lexeme[1]) + 1;
					const newFilled = s.state.filled | (1n << BigInt(num));
					let newX = num;
					while (newFilled & (1n << BigInt(newX))) newX++;
					return { ...s, state: { x: newX, filled: newFilled } };
				});
			}
		}

		const placedTerms: TailTerms<Positional> = {
			type: "tail-terms",
			start: tailTerms.start,
			end: tailTerms.end,
			terms: {
				type: "terms",
				start: tailTerms.start,
				end: tailTerms.end,
				terms: placed,
			},
			vau: tailTerms.vau,
		};

		return { placedTerms, newTertaus: iterTertaus };
	}

	public parseBridiTail3(headState: TerbriState): {
		bridiTail: BridiTail3<Positional>;
		tertaus: Tertau[];
	} {
		const selbri = this.parseSelbri();
		const tailTerms = this.parseTailTerms();
		const tailTertau = this.extractTertau(selbri, "tail");
		const { placedTerms, newTertaus } = this.placeTailTerms(tailTerms, [
			{ tertau: tailTertau, state: headState },
		]);

		return {
			tertaus: newTertaus,
			bridiTail: {
				type: "bridi-tail-3",
				start: selbri.start,
				end: placedTerms.end,
				selbri,
				tailTerms: placedTerms,
			},
		};
	}

	public extractTertau(selbri: Selbri, mode: "head" | "tail"): Span {
		if (selbri.selbri1.type === "selbri-1-na") {
			return this.extractTertau(selbri.selbri1.selbri, mode);
		}
		const tanru = selbri.selbri1.selbri2.selbri3.selbri4s;
		const tertau = tanru[tanru.length - 1];
		return {
			start: tertau.start,
			end: tertau.end,
		};
	}

	public tryParseGihek(): Gihek | undefined {
		const backtrack = this.index;
		const na = this.tryParseCmavo("NA");
		const se = this.tryParseCmavo("SE");
		const giha = this.tryParseCmavo("GIhA");
		const nai = this.tryParseCmavo("NAI");
		if (giha === undefined) {
			this.index = backtrack;
			return undefined;
		}
		return {
			type: "gihek",
			start: na ?? se ?? giha,
			end: nai ?? giha,
			na,
			se,
			giha,
			nai,
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
			if (!term) break;
			this.log(`Parsed term "${this.showSpan(term)}" in bridi-tail`, term);
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

export type ParseResult = (
	| { success: true; tokens: Token[]; text: Text }
	| { success: false; error: ParseError }
	| { success: false; tokens: Token[]; consumed: Text; remainder: Span }
) & { snapshots: Snapshot[] };

export function parse(tokens: Token[]): ParseResult {
	const parser = new Parser(tokens);
	try {
		const text = parser.parseText();
		if (parser.index === parser.tokens.length) {
			return { success: true, tokens, text, snapshots: parser.snapshots };
		} else {
			// Incomplete parse
			return {
				success: false,
				tokens,
				consumed: text,
				snapshots: parser.snapshots,
				remainder: { start: parser.index, end: tokens.length - 1 },
			};
		}
	} catch (error) {
		console.error(error);
		if (error instanceof ParseError || error instanceof Unsupported) {
			return { success: false, error, snapshots: parser.snapshots };
		} else {
			throw error; // Re-throw unexpected errors
		}
	}
}
