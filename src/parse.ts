/** biome-ignore-all lint/style/noNonNullAssertion: Useful */

import { ParseError, Unsupported } from "./error";
import type {
	BeiLink,
	BoSelbri6,
	BridiTail,
	BridiTail1,
	BridiTail2,
	BridiTail3,
	BrivlaWithFrees,
	CeiTanruUnit1,
	Floating,
	Fragment,
	Gihek,
	GihekTail,
	Gik,
	Guhek,
	Ibo,
	IboStatement2,
	IjekStatement2,
	Item,
	JkBoSelbri5,
	JkSelbri5,
	Linkargs,
	Many,
	Naku,
	Nihos,
	Paragraph,
	Positional,
	Pretext,
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
	Span,
	Statement,
	Statement1,
	Statement2,
	Statement3,
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
	Term,
	Terms,
	Text,
	Text1,
	TokenIndex,
} from "./grammar";
import { BaseParser } from "./parse-base";
import { TenseParser } from "./parse-tense";
import { isTenseSelmaho, type Selmaho, type Token } from "./tokenize";

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

export class Parser extends BaseParser {
	public parseText(): Text {
		this.begin("text");
		const pretext = this.tryParsePretext();
		const text1 = this.parseText1();
		return this.parsed("text", {
			type: "text",
			start: pretext?.start ?? text1.start,
			end: text1.end,
			pretext: pretext,
			text1,
		});
	}

	private tryParsePretext(): Pretext | undefined {
		const nais = this.parseCmavos("NAI");
		const cmevlas = this.parseCmavos("CMEVLA");
		const frees = this.parseFrees();
		const joikjek = this.tryParseJoikJek();
		if (
			nais.length === 0 &&
			cmevlas.length === 0 &&
			frees.length === 0 &&
			joikjek === undefined
		) {
			return undefined;
		}
		return {
			type: "pretext",
			start: nais.length
				? nais[0]
				: cmevlas.length
					? cmevlas[0]
					: frees.length
						? frees[0].start
						: (joikjek?.start ?? 0),
			end: (joikjek?.end ?? frees.length) ? frees[frees.length - 1].end : 0,
			nais,
			cmevlas,
			frees,
			joikjek,
		};
	}

	private parseText1(): Text1 {
		const i =
			this.tryParseIjek() ??
			this.tryParseIbo() ??
			this.tryParseNihos() ??
			this.tryParseCmavoWithFrees("I");
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

	protected tryParseIbo(): Ibo | undefined {
		const backtrack = this.index;
		const i = this.tryParseCmavo("I");
		if (i === undefined) return undefined;
		const jk = this.tryParseJoik() ?? this.tryParseJek();
		const stag = undefined; // TODO: this.tryParseStag();
		const bo = this.tryParseCmavoWithFrees("BO");
		if (bo === undefined) {
			this.index = backtrack;
			return undefined;
		}
		return {
			type: "ibo",
			start: i,
			end: bo.end,
			i,
			jk,
			stag,
			bo,
		};
	}

	private tryParseNihos(): Nihos | undefined {
		const nihos = this.parseCmavos("NIhO");
		if (nihos.length === 0) return undefined;
		const frees = this.parseFrees();
		return {
			type: "nihos",
			start: nihos[0],
			end: frees.length ? frees[frees.length - 1].end : nihos[nihos.length - 1],
			nihos,
			frees,
		};
	}

	private parseParagraph(): Paragraph {
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

	private parseItem(): Item {
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

	private parseTem(): Statement | Fragment {
		return this.parseStatement();
	}

	private parseStatement(): Statement {
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

	private parseStatement1(): Statement1 {
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

	private parseStatement2(): Statement2 {
		const first = this.parseStatement3();
		const rest: IboStatement2[] = [];
		while (true) {
			const ibo = this.tryParseIbo();
			if (!ibo) break;
			const statement2 = this.parseStatement2();
			rest.push({
				type: "ibo-statement-2",
				start: ibo.start,
				end: statement2.end,
				ibo,
				statement2,
			});
		}
		return {
			type: "statement-2",
			start: first.start,
			end: rest.length > 0 ? rest[rest.length - 1].end : first.end,
			first,
			rest,
		};
	}

	private parseStatement3(): Statement3 {
		const sentence = this.parseSentence();
		return {
			type: "statement-3",
			start: sentence.start,
			end: sentence.end,
			sentence,
		};
	}

	private parseSelbri(): Selbri {
		this.begin("selbri");
		const selmaho = this.peekToken()?.selmaho;
		const tag =
			selmaho && isTenseSelmaho(selmaho) ? this.parseTag() : undefined;
		const selbri1 = this.parseSelbri1();
		return this.parsed("selbri", {
			type: "selbri",
			start: tag?.start ?? selbri1.start,
			end: selbri1.end,
			tag,
			selbri1,
		});
	}

	private parseSelbri1(): Selbri1 {
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

	private parseSelbri2(): Selbri2 {
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

	private parseSelbri3(): Selbri3 {
		const first = this.parseSelbri4();
		const tanru: Many<Selbri4> = [first];
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

	private parseSelbri4(): Selbri4 {
		const selbri5 = this.parseSelbri5();
		const rest: JkSelbri5[] = [];
		while (true) {
			const jk = this.tryParseJoikJek();
			if (!jk) break;
			const selbri5 = this.parseSelbri5();
			rest.push({
				type: "jk-selbri-5",
				start: jk.start,
				end: selbri5.end,
				jk,
				selbri5,
			});
		}
		return {
			type: "selbri-4",
			start: selbri5.start,
			end: selbri5.end,
			first: selbri5,
			rest,
		};
	}

	private parseSelbri5(): Selbri5 {
		const selbri6 = this.parseSelbri6();
		const rest = this.tryParseJkBoSelbri5();
		return {
			type: "selbri-5",
			start: selbri6.start,
			end: rest?.end ?? selbri6.end,
			first: selbri6,
			rest,
		};
	}

	private tryParseJkBoSelbri5(): JkBoSelbri5 | undefined {
		const backtrack = this.index;
		const jk = this.tryParseJoik() ?? this.tryParseJek();
		if (!jk) return undefined;
		const stag = undefined; // TODO this.tryParseStag();
		const bo = this.tryParseCmavoWithFrees("BO");
		if (bo === undefined) {
			this.index = backtrack;
			return undefined;
		}
		const selbri5 = this.parseSelbri5();
		return {
			type: "jk-bo-selbri-5",
			start: jk.start,
			end: bo.end,
			jk,
			stag,
			bo,
			selbri5,
		};
	}

	private parseSelbri6(): Selbri6 {
		const backtrack = this.index;
		const nahe = this.tryParseCmavoWithFrees("NAhE");
		const guhek = this.tryParseGuhek();
		if (guhek !== undefined) {
			const selbri = this.parseSelbri();
			const gik = this.parseGik();
			if (gik !== undefined) {
				const selbri6 = this.parseSelbri6();
				return {
					type: "selbri-6-guhek",
					start: nahe?.start ?? guhek.start,
					end: selbri6.end,
					nahe,
					guhek,
					selbri,
					gik,
					selbri6,
				};
			}
		}

		this.index = backtrack;
		const tanruUnit = this.parseTanruUnit();
		const rest = this.tryParseBoSelbri6();
		return {
			type: "selbri-6-plain",
			start: tanruUnit.start,
			end: rest?.end ?? tanruUnit.end,
			tanruUnit,
			rest,
		};
	}

	private tryParseBoSelbri6(): BoSelbri6 | undefined {
		const bo = this.tryParseCmavoWithFrees("BO");
		if (bo === undefined) return undefined;
		const selbri6 = this.parseSelbri6();
		return {
			type: "bo-selbri-6",
			start: bo.start,
			end: selbri6.end,
			bo,
			selbri6,
		};
	}

	private tryParseGuhek(): Guhek | undefined {
		const backtrack = this.index;
		const se = this.tryParseCmavo("SE");
		const guha = this.tryParseCmavo("GUhA");
		if (guha === undefined) {
			this.index = backtrack;
			return undefined;
		}
		const nai = this.tryParseCmavo("NAI");
		const frees = this.parseFrees();
		return {
			type: "guhek",
			start: se ?? guha,
			end: frees.length ? frees[frees.length - 1].end : (nai ?? guha),
			se,
			guha,
			nai,
			frees,
		};
	}

	private parseGik(): Gik {
		const gi = this.tryParseCmavo("GI");
		if (gi === undefined) throw new ParseError("expected gi");
		const nai = this.tryParseCmavo("NAI");
		const frees = this.parseFrees();
		return {
			type: "gik",
			start: gi,
			end: frees.length ? frees[frees.length - 1].end : (nai ?? gi),
			gi,
			nai,
			frees,
		};
	}

	private parseTanruUnit(): TanruUnit {
		const first = this.parseTanruUnit1();
		const rest: CeiTanruUnit1[] = [];
		while (true) {
			const cei = this.tryParseCeiTanruUnit1();
			if (cei === undefined) break;
			rest.push(cei);
		}
		return {
			type: "tanru-unit",
			start: first.start,
			end: rest.length > 0 ? rest[rest.length - 1].end : first.end,
			first,
			rest,
		};
	}

	private tryParseCeiTanruUnit1(): CeiTanruUnit1 | undefined {
		const cei = this.tryParseCmavoWithFrees("CEI");
		if (cei === undefined) return undefined;
		const tanruUnit1 = this.parseTanruUnit1();
		return {
			type: "cei-tanru-unit-1",
			start: cei.start,
			end: tanruUnit1.end,
			cei,
			tanruUnit1,
		};
	}

	private parseTanruUnit1(): TanruUnit1 {
		const tanruUnit2 = this.parseTanruUnit2();
		const linkargs = this.tryParseLinkArgs();
		return {
			type: "tanru-unit-1",
			start: tanruUnit2.start,
			end: linkargs?.end ?? tanruUnit2.end,
			tanruUnit2,
			linkargs,
		};
	}

	private tryParseLinkArgs(): Linkargs | undefined {
		const be = this.tryParseCmavoWithFrees("BE");
		if (be === undefined) return undefined;
		const term = this.tryParseTerm();
		if (!term) throw new ParseError("no term after be");
		const links: BeiLink[] = [];
		while (this.peekToken()?.selmaho === "BEI") {
			const bei = this.tryParseCmavoWithFrees("BEI")!;
			const term = this.tryParseTerm();
			if (!term) throw new ParseError("no term after bei");
			links.push({
				type: "bei-link",
				start: bei.start,
				end: term.end,
				bei,
				term,
			});
		}
		const beho = this.tryParseCmavoWithFrees("BEhO");

		return {
			type: "linkargs",
			start: be.start,
			end: beho?.end ?? (links.length ? links[links.length - 1].end : term.end),
			be,
			term,
			links,
			beho,
		};
	}

	private isNumberMoiAhead(): boolean {
		const backtrack = this.index;
		const number = this.tryParseNamcu() ?? this.tryParseLerfuString();
		const success =
			number !== undefined && this.tryParseCmavo("MOI") !== undefined;
		this.index = backtrack;
		return success;
	}

	private parseTanruUnit2(): TanruUnit2 {
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

	private parseSumti(): Sumti<Floating> {
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

	private parseSumti1(): Sumti1 {
		const sumti2 = this.parseSumti2();
		return {
			type: "sumti-1",
			start: sumti2.start,
			end: sumti2.end,
			sumti2,
		};
	}

	private parseSumti2(): Sumti2 {
		const sumti3 = this.parseSumti3();
		return {
			type: "sumti-2",
			start: sumti3.start,
			end: sumti3.end,
			sumti3,
		};
	}

	private parseSumti3(): Sumti3 {
		const sumti4 = this.parseSumti4();
		return {
			type: "sumti-3",
			start: sumti4.start,
			end: sumti4.end,
			sumti4,
		};
	}

	private parseSumti4(): Sumti4 {
		const sumti5 = this.parseSumti5();
		return {
			type: "sumti-4",
			start: sumti5.start,
			end: sumti5.end,
			sumti5,
		};
	}

	private parseSumti5(): Sumti5 {
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

	private tryParseQuantifier(): Quantifier | undefined {
		const token = this.peekToken();

		if (token && token.selmaho === "PA") {
			return this.parseQuantifier();
		} else {
			return undefined;
		}
	}

	private parseQuantifier(): Quantifier {
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

	private tryParseRelativeClauses(
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

	private tryParseRelativeClause(antecedent: Span): RelativeClause | undefined {
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

	private parseSumti6(): Sumti6 {
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

		if (token.selmaho === "QUOTE") {
			// The tokenizer already merged the ZO with the next word.
			const quote = this.tryParseCmavoWithFrees("QUOTE")!;
			return {
				type: "sumti-6-quote",
				start: quote.start,
				end: quote.end,
				quote,
			};
		}

		if (token.selmaho === "LU") {
			const lu = this.nextToken()!;
			const text = this.parseText();
			const lihu = this.tryParseCmavoWithFrees("LIhU");
			return {
				type: "sumti-6-lu",
				start: lu.index,
				end: lihu?.end ?? text.end,
				lu: lu.index,
				text,
				lihu,
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

	private zeroOrMore(selmaho: Selmaho): TokenIndex[] {
		const result = [];
		while (this.peekToken()?.selmaho === selmaho) {
			result.push(this.nextToken()!.index);
		}
		return result;
	}

	private isSumti6Ahead(): boolean {
		return (
			this.isAhead(["LAhE"]) ||
			this.isAhead(["NAhE", "BO"]) ||
			this.isAhead(["KOhA"]) ||
			this.isAhead(["BY"]) ||
			// this.isAhead(["BU"]) || // eliminated by tokenizer
			this.isAhead(["LA"]) ||
			this.isAhead(["LE"]) ||
			this.isAhead(["LI"]) ||
			this.isAhead(["QUOTE"]) ||
			this.isAhead(["LU"])
		);
	}

	private parseSumtiTail(): SumtiTail {
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

	private parseSumtiTail1(): SumtiTail1 {
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

	private isTaggedSumtiAhead(): boolean {
		// kinda ugly
		const oldIndex = this.index;
		while (true) {
			const selmaho = this.tokens[this.index]?.selmaho;
			if (selmaho === "FIhO") return true;
			if (isTenseSelmaho(selmaho)) {
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
			if (isTenseSelmaho(selmaho)) {
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

	private parseTag(): Tag {
		this.begin("tag");
		const tenseParser = new TenseParser(this.tokens, this.index);
		const tenseModal = tenseParser.parseTenseModal();
		this.index = tenseParser.index;
		return this.parsed("tag", {
			type: "tag",
			start: tenseModal.start,
			end: tenseModal.end,
			first: tenseModal,
		});
	}

	private parseTagged(): Tagged {
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

	private tryParseTerm(): Term<Floating> | undefined {
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

	private parseNaku(): Naku {
		const na = this.nextToken()!;
		const ku = this.tryParseCmavoWithFrees("KU")!;
		return { type: "naku", start: na.index, end: ku.end, na: na.index, ku };
	}

	private parseBrivlaWithFrees(): BrivlaWithFrees {
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

	private parseSentence(): Sentence {
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

	private parseSubsentence(): Subsentence {
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

	private parseBridiTail(headState: TerbriState): {
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

	private parseBridiTail1(headState: TerbriState): {
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

	private tryParseGihekTail(
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

	private parseBridiTail2(headState: TerbriState): {
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

	private placeTailTerms(
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

	private parseBridiTail3(headState: TerbriState): {
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

	private extractTertau(selbri: Selbri, mode: "head" | "tail"): Span {
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

	private tryParseGihek(): Gihek | undefined {
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

	private parseTailTerms(): TailTerms<Floating> {
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

	private tryParseTerms(): Terms<Floating> | undefined {
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
