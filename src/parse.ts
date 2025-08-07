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
	CmavoWithFrees,
	Cmene,
	Floating,
	Fragment,
	Free,
	Gihek,
	GihekTail,
	Gik,
	Guhek,
	Ibo,
	IboStatement2,
	Ijek,
	IjekStatement2,
	Indicator,
	IntervalProperty,
	Item,
	Jek,
	JkBoSelbri5,
	JkSelbri5,
	Joik,
	JoikJek,
	Linkargs,
	Many,
	Motion,
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
import { BaseParser } from "./parse-base";
import { spanOf } from "./span";
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
			...spanOf(pretext, text1),
			pretext: pretext,
			text1,
		});
	}

	private tryParseCmene(): Cmene | undefined {
		const cmevlas = this.parseCmavos("CMEVLA");
		if (cmevlas.length === 0) return undefined;
		const frees = this.parseFrees();
		return {
			type: "cmene",
			...spanOf(cmevlas, frees),
			cmevlas,
			frees,
		};
	}

	private tryParsePretext(): Pretext | undefined {
		const nais = this.parseCmavos("NAI");
		const cmene = this.tryParseCmene();
		const frees = this.parseFrees();
		const joikjek = this.tryParseJoikJek();
		if (
			nais.length === 0 &&
			cmene === undefined &&
			frees.length === 0 &&
			joikjek === undefined
		) {
			return undefined;
		}
		return {
			type: "pretext",
			...spanOf(nais, cmene, frees, joikjek),
			nais,
			cmene,
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
		while (this.peekToken()?.selmaho === "NIhO") {
			const p = this.parseParagraph();
			paragraphs.push(p);
		}
		return {
			type: "text-1",
			...spanOf(i, paragraphs),
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
			...spanOf(i, jk, stag, bo),
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
			...spanOf(nihos, frees),
			nihos,
			frees,
		};
	}

	private parseParagraph(): Paragraph {
		this.begin("paragraph");
		const niho = this.tryParseNihos();
		const first = this.parseTem();
		const rest: Item[] = [];
		while (this.peekToken()?.selmaho === "I") {
			const item = this.parseItem();
			rest.push(item);
		}

		return this.parsed("paragraph", {
			type: "paragraph",
			...spanOf(niho, first, rest),
			niho,
			first,
			rest,
		});
	}

	private parseItem(): Item {
		this.begin("item");
		const i = this.tryParseCmavoWithFrees("I");
		const tem = this.parseTem();
		return this.parsed("item", {
			type: "item",
			...spanOf(i, tem),
			i,
			tem,
		});
	}

	private parseTem(): Statement | Fragment {
		return this.parseStatement(true);
	}

	private parseStatement(allowFragment: boolean): Statement | Fragment {
		this.begin("statement");
		const first = this.parseStatement1(allowFragment);
		if (first.type === "fragment-terms") return first;

		return this.parsed("statement", {
			type: "statement",
			...spanOf(first),
			prenexes: [], // TODO
			statement1: first,
		});
	}

	private parseStatement1(allowFragment: false): Statement1;
	private parseStatement1(allowFragment: boolean): Statement1 | Fragment;
	private parseStatement1(allowFragment: boolean): Statement1 | Fragment {
		const first = this.parseStatement2(allowFragment);
		if (first.type === "fragment-terms") return first;
		const rest: IjekStatement2[] = [];
		while (true) {
			const ijek = this.tryParseIjek();
			if (!ijek) break;
			const statement2 = this.parseStatement2(false);
			rest.push({
				type: "ijek-statement-2",
				...spanOf(ijek, statement2),
				ijek,
				statement2,
			});
		}
		return {
			type: "statement-1",
			...spanOf(first, rest),
			first,
			rest,
		};
	}

	private parseStatement2(allowFragment: false): Statement2;
	private parseStatement2(allowFragment: boolean): Statement2 | Fragment;
	private parseStatement2(allowFragment: boolean): Statement2 | Fragment {
		const first = this.parseStatement3(allowFragment);
		if (first.type === "fragment-terms") return first;

		const rest: IboStatement2[] = [];
		while (true) {
			const ibo = this.tryParseIbo();
			if (!ibo) break;
			const statement2 = this.parseStatement2(false);
			rest.push({
				type: "ibo-statement-2",
				...spanOf(ibo, statement2),
				ibo,
				statement2,
			});
		}
		return {
			type: "statement-2",
			...spanOf(first, rest),
			first,
			rest,
		};
	}

	private parseStatement3(allowFragment: boolean): Statement3 | Fragment {
		const sentence = this.parseSentence(allowFragment);
		if (sentence.type === "fragment-terms") return sentence;
		return {
			type: "statement-3",
			...spanOf(sentence),
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
			...spanOf(tag, selbri1),
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
				...spanOf(na, selbri),
				na,
				selbri,
			};
		}
		const selbri2 = this.parseSelbri2();
		return {
			type: "selbri-1-simple",
			...spanOf(selbri2),
			selbri2,
		};
	}

	private parseSelbri2(): Selbri2 {
		const selbri3 = this.parseSelbri3();
		return {
			type: "selbri-2",
			...spanOf(selbri3),
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

		this.log("Is this selbri a tanru?", first);
		while (this.isVerbAhead()) {
			const next = this.parseSelbri4();
			tanru.push(next);
		}

		return {
			type: "selbri-3",
			...spanOf(first, tanru),
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
				...spanOf(jk, selbri5),
				jk,
				selbri5,
			});
		}
		return {
			type: "selbri-4",
			...spanOf(selbri5, rest),
			first: selbri5,
			rest,
		};
	}

	private parseSelbri5(): Selbri5 {
		const selbri6 = this.parseSelbri6();
		const rest = this.tryParseJkBoSelbri5();
		return {
			type: "selbri-5",
			...spanOf(selbri6, rest),
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
			...spanOf(jk, stag, bo, selbri5),
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
					...spanOf(nahe, guhek, selbri, gik, selbri6),
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
			...spanOf(tanruUnit, rest),
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
			...spanOf(bo, selbri6),
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
			...spanOf(se, guha, nai, frees),
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
			...spanOf(gi, nai, frees),
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
			...spanOf(first, rest),
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
			...spanOf(cei, tanruUnit1),
			cei,
			tanruUnit1,
		};
	}

	private parseTanruUnit1(): TanruUnit1 {
		const tanruUnit2 = this.parseTanruUnit2();
		const linkargs = this.tryParseLinkArgs();
		return {
			type: "tanru-unit-1",
			...spanOf(tanruUnit2, linkargs),
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
				...spanOf(bei, term),
				bei,
				term,
			});
		}
		const beho = this.tryParseCmavoWithFrees("BEhO");

		return {
			type: "linkargs",
			...spanOf(be, term, links, beho),
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
		if (!token)
			throw new ParseError("expected tanru-unit, got eof", this.index);

		if (token?.selmaho === "BRIVLA") {
			const brivla = this.parseBrivlaWithFrees();
			return {
				type: "tu-brivla",
				...spanOf(brivla),
				brivla,
			};
		}

		if (token?.selmaho === "GOhA") {
			const goha = this.nextToken()!;
			const raho = this.tryParseCmavo("RAhO");
			const frees = this.parseFrees();
			return {
				type: "tu-goha",
				...spanOf(goha, raho, frees),
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
				...spanOf(ke, selbri3, kehe),
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
				...spanOf(me, sumti, mehu, moi),
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
				...spanOf(namcu, moi),
				number: namcu,
				moi,
			};
		}

		if (token?.selmaho === "SE") {
			const se = this.tryParseCmavoWithFrees("SE")!;
			const inner = this.parseTanruUnit2();
			return {
				type: "tu-se",
				...spanOf(se, inner),
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
				...spanOf(jai, inner),
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
				...spanOf(nahe, inner),
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
				...spanOf(nu, subsentence, kei),
				nu,
				subsentence,
				kei,
			};
		}

		throw new Unsupported(
			`Unsupported tanru-unit-2: ${token?.selmaho}`,
			this.index,
		);
	}

	private parseSumti(): Sumti<Floating> {
		const sumti1 = this.parseSumti1();
		const vuho = this.tryParseCmavoWithFrees("VUhO");
		const relativeClauses = vuho
			? this.tryParseRelativeClauses(sumti1)
			: undefined;
		if (vuho && relativeClauses === undefined) {
			throw new ParseError("Expected relative clause after vu'o", this.index);
		}

		return {
			type: "sumti",
			...spanOf(sumti1, vuho, relativeClauses),
			sumti1,
			vuho,
			relativeClauses,
			role: "floating",
		};
	}

	private parseSumti1(): Sumti1 {
		const sumti2 = this.parseSumti2();
		return {
			type: "sumti-1",
			...spanOf(sumti2),
			sumti2,
		};
	}

	private parseSumti2(): Sumti2 {
		const sumti3 = this.parseSumti3();
		return {
			type: "sumti-2",
			...spanOf(sumti3),
			sumti3,
		};
	}

	private parseSumti3(): Sumti3 {
		const sumti4 = this.parseSumti4();
		return {
			type: "sumti-3",
			...spanOf(sumti4),
			sumti4,
		};
	}

	private parseSumti4(): Sumti4 {
		const sumti5 = this.parseSumti5();
		return {
			type: "sumti-4",
			...spanOf(sumti5),
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
				...spanOf(outerQuantifier, selbri, ku, relativeClauses),
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
			...spanOf(outerQuantifier, sumti6, relativeClauses),
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
			...spanOf(number, boi),
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
			...spanOf(relativeClause),
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
			...spanOf(noi, subsentence, kuho),
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
			return { type: "sumti-6-koha", ...spanOf(koha), koha };
		}

		if (token.selmaho === "BY") {
			const lerfuString = this.tryParseLerfuString()!;
			const boi = this.tryParseCmavoWithFrees("BOI");
			return {
				type: "sumti-6-lerfu",
				...spanOf(lerfuString, boi),
				lerfuString,
				boi,
			};
		}

		if (token.selmaho === "QUOTE") {
			// The tokenizer already merged the ZO with the next word.
			const quote = this.tryParseCmavoWithFrees("QUOTE")!;
			return {
				type: "sumti-6-quote",
				...spanOf(quote),
				quote,
			};
		}

		if (token.selmaho === "LU") {
			const lu = this.nextToken()!;
			const text = this.parseText();
			const lihu = this.tryParseCmavoWithFrees("LIhU");
			return {
				type: "sumti-6-lu",
				...spanOf(lu, text, lihu),
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
				...spanOf(lahe, sumti, luhu),
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
				...spanOf(le, sumtiTail, ku),
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
					...spanOf(la, names, frees),
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
					...spanOf(la, sumtiTail, ku),
					le: la,
					sumtiTail,
					ku,
				};
			}
		}

		throw new Unsupported(`Unsupported sumti6 ${token.selmaho}`, this.index);
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
			...spanOf(owner, tail),
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
			...spanOf(selbri, relativeClauses),
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
		const tenseModal = this.parseTenseModal();
		return this.parsed("tag", {
			type: "tag",
			...spanOf(tenseModal),
			first: tenseModal,
		});
	}

	private parseTagged(): Tagged<Floating> {
		const fa = this.tryParseCmavoWithFrees("FA");
		const tagOrFa = fa ?? this.parseTag();
		const sumtiOrKu = this.isSumtiAhead()
			? this.parseSumti()
			: this.tryParseCmavoWithFrees("KU");
		return {
			type: "tagged",
			...spanOf(tagOrFa, sumtiOrKu),
			tagOrFa,
			sumtiOrKu,
			role: "floating",
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
		return { type: "naku", ...spanOf(na, ku), na: na.index, ku };
	}

	private parseBrivlaWithFrees(): BrivlaWithFrees {
		const token = this.peekToken();
		if (!token || token.selmaho !== "BRIVLA") {
			throw new ParseError("expected brivla");
		}
		this.index++;
		const frees = this.parseFrees();
		return {
			type: "brivla-with-frees",
			...spanOf(token, frees),
			brivla: token.index,
			frees,
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

	private parseSentence(allowFragment: false): Sentence;
	private parseSentence(allowFragment: boolean): Sentence | Fragment;
	private parseSentence(allowFragment: boolean): Sentence | Fragment {
		this.begin("sentence");
		const head: Term<Floating>[] = [];
		const headState: TerbriState = { x: 1, filled: 0n };
		const headPositions: (number | "fai" | "?" | "modal")[] = [];
		while (true) {
			const term = this.tryParseTerm();
			if (!term) {
				this.log(`No more terms in head`);
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
				const num = this.faToXIndex(term.tagOrFa);
				headPositions.push(num);
				if (typeof num === "number") {
					headState.filled |= 1n << BigInt(num);
					headState.x = num;
					while (headState.filled & (1n << BigInt(headState.x))) headState.x++;
				}
			} else {
				headPositions.push("modal");
			}
		}
		const cu = head.length ? this.tryParseCmavoWithFrees("CU") : undefined;
		if (
			!this.isVerbAhead() &&
			!this.isTaggedVerbAhead() &&
			!cu &&
			allowFragment
		) {
			return {
				type: "fragment-terms",
				...spanOf(head),
				terms: { type: "terms", ...spanOf(head), terms: head },
			};
		}

		if (headState.x === 1) {
			// After verb, skip to the x2:
			headState.x = 2;
		}
		const { bridiTail, tertaus } = this.parseBridiTail(headState);

		const terms: Terms<Positional> | undefined =
			head.length > 0
				? {
						type: "terms",
						...spanOf(head),
						terms: head.map((term, i) =>
							term.type === "naku"
								? term
								: {
										...term,
										role: {
											roles: tertaus.map((t) => ({
												xIndex: headPositions[i],
												verb: t.tertau,
											})),
										},
									},
						),
					}
				: undefined;

		return this.parsed("sentence", {
			type: "sentence",
			...spanOf(head, cu, bridiTail),
			cu,
			bridiTail,
			terms,
		});
	}

	private parseSubsentence(): Subsentence {
		const sentence = this.parseSentence(false);
		return {
			type: "subsentence",
			...spanOf(sentence),
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
				...spanOf(bridiTail1),
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
			...spanOf(bridiTail2, rest),
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
				...spanOf(gihek, frees, bridiTail2, tailTerms),
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
				...spanOf(bridiTail),
				first: bridiTail,
			},
		};
	}

	private faToXIndex(fa: CmavoWithFrees): number | "fai" | "?" {
		const lexeme = this.tokens[fa.cmavo].lexeme;
		if (lexeme === "fa") return 1;
		if (lexeme === "fe") return 2;
		if (lexeme === "fi") return 3;
		if (lexeme === "fo") return 4;
		if (lexeme === "fu") return 5;
		if (lexeme === "fai") return "fai";
		if (lexeme === "fi'a") return "?";
		return 1;
	}

	private placeTailTerms(
		tailTerms: TailTerms<Floating>,
		tertaus: Tertau[],
	): { placedTerms: TailTerms<Positional>; newTertaus: Tertau[] } {
		const placed: Term<Positional>[] = [];
		let iterTertaus = tertaus;

		for (const term of tailTerms.terms?.terms ?? []) {
			if (term.type === "sumti") {
				placed.push({
					...term,
					role: {
						roles: iterTertaus.map((s) => ({
							xIndex: s.state.x,
							verb: s.tertau,
						})),
					},
				});

				iterTertaus = iterTertaus.map((s) => {
					const newFilled = s.state.filled | (1n << BigInt(s.state.x));
					let newX = s.state.x;
					while (newFilled & (1n << BigInt(newX))) {
						newX++;
					}
					return { ...s, state: { x: newX, filled: newFilled } };
				});
			} else if (term.type === "tagged") {
				if (term.tagOrFa.type !== "tag") {
					// FA
					const fa = term.tagOrFa;
					const num = this.faToXIndex(fa);

					placed.push({
						...term,
						role: {
							roles: iterTertaus.map((s) => ({
								xIndex: num,
								verb: s.tertau,
							})),
						},
					});

					if (typeof num === "number") {
						iterTertaus = iterTertaus.map((s) => {
							const newFilled = s.state.filled | (1n << BigInt(num));
							let newX = num;
							while (newFilled & (1n << BigInt(newX))) newX++;
							return { ...s, state: { x: newX, filled: newFilled } };
						});
					}
				} else {
					placed.push({
						...term,
						role: {
							roles: iterTertaus.map((s) => ({
								xIndex: "modal",
								verb: s.tertau,
							})),
						},
					});
				}
			}
		}

		const placedTerms: TailTerms<Positional> = {
			type: "tail-terms",
			...spanOf(tailTerms),
			terms: {
				type: "terms",
				...spanOf(placed),
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
				...spanOf(selbri, placedTerms),
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
		return spanOf(tertau);
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
			...spanOf(na, se, giha, nai),
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
			...spanOf(terms, vau),
			terms,
			vau,
		};
	}

	private tryParseTerms(): Terms<Floating> | undefined {
		const terms: Term<Floating>[] = [];
		while (true) {
			const term = this.tryParseTerm();
			if (!term) break;
			this.log(`Parsed term "${this.showSpan(term)}" in bridi-tail`, term);
			terms.push(term);
		}

		if (terms.length === 0) return undefined;

		return {
			type: "terms",
			...spanOf(terms),
			terms,
		};
	}

	protected tryParseCmavoWithFrees(
		selmaho: Selmaho,
	): CmavoWithFrees | undefined {
		const token = this.peekToken();
		if (token && token.selmaho === selmaho) {
			this.index++;
			const frees = this.parseFrees();
			return {
				...spanOf(token, frees),
				type: "cmavo-with-frees",
				cmavo: token.index,
				frees,
			};
		}
		return undefined;
	}

	protected tryParseIndicator(): Indicator | undefined {
		const token = this.peekToken();
		switch (token?.selmaho) {
			case "Y":
			case "DAhO":
			case "FUhO":
				this.index++;
				return {
					type: "indicator",
					...spanOf(token),
					indicator: token.index,
					nai: undefined,
				};
			case "UI":
			case "CAI": {
				this.index++;
				const nai = this.tryParseCmavo("NAI");
				return {
					type: "indicator",
					...spanOf(token, nai),
					indicator: token.index,
					nai,
				};
			}
			default:
				return undefined;
		}
	}

	protected tryParseFree(): Free | undefined {
		const token = this.peekToken();
		const indicator = this.tryParseIndicator();
		if (indicator) return indicator;

		// TODO: sei, vocative, mai, to

		if (token?.selmaho === "XI") {
			const xi = this.tryParseCmavoWithFrees("XI")!;
			const ordinal = this.tryParseLerfuString() ?? this.parseNamcu();
			const boi = this.tryParseCmavo("BOI");
			return {
				type: "free-xi",
				...spanOf(xi, ordinal, boi),
				xi,
				ordinal,
				boi,
			};
		}
		return undefined;
	}

	protected parseFrees(): Free[] {
		const frees: Free[] = [];
		while (true) {
			const free = this.tryParseFree();
			if (!free) break;
			frees.push(free);
		}
		return frees;
	}

	protected tryParseJoikJek(): JoikJek | undefined {
		const jk = this.tryParseJoik() ?? this.tryParseJek();
		if (!jk) return undefined;
		const frees = this.parseFrees();
		return {
			type: "joik-jek",
			jk,
			frees,
			...spanOf(jk, frees),
		};
	}

	protected tryParseJoik(): Joik | undefined {
		const backtrack = this.index;
		const gaho1 = this.tryParseCmavo("GAhO");
		const se = this.tryParseCmavo("SE");
		const token = this.nextToken();
		if (!token || (token.selmaho !== "JOI" && token.selmaho !== "BIhI")) {
			this.index = backtrack;
			return undefined;
		}
		const nai = this.tryParseCmavo("NAI");
		const gaho2 = this.tryParseCmavo("GAhO");
		if (
			token.selmaho === "JOI" &&
			(gaho1 !== undefined || gaho2 !== undefined)
		) {
			this.index = backtrack;
			return undefined;
		}
		return {
			type: "joik",
			gaho1,
			se,
			joi: token.index,
			nai,
			gaho2,
			...spanOf(gaho1, se, token, nai, gaho2),
		};
	}

	protected tryParseJek(): Jek | undefined {
		const backtrack = this.index;
		const na = this.tryParseCmavo("NA");
		const se = this.tryParseCmavo("SE");
		const ja = this.tryParseCmavo("JA");
		if (ja === undefined) {
			this.index = backtrack;
			return undefined;
		}
		const nai = this.tryParseCmavo("NAI");

		return {
			type: "jek",
			na,
			se,
			ja,
			nai,
			...spanOf(na, se, ja, nai),
		};
	}

	protected tryParseIjek(): Ijek | undefined {
		const backtrack = this.index;
		const i = this.tryParseCmavo("I");
		if (i === undefined) return undefined;
		const jek = this.tryParseJoikJek();
		if (jek === undefined) {
			this.index = backtrack;
			return undefined;
		}
		return {
			type: "ijek",
			i,
			jek,
			...spanOf(i, jek),
		};
	}

	public parseTenseModal(): TenseModal {
		const simpleTenseModal = this.parseSimpleTenseModal();
		const frees = this.parseFrees();
		return {
			type: "tense-modal",
			...spanOf(simpleTenseModal),
			first: simpleTenseModal,
			frees,
		};
	}

	private parseSimpleTenseModal(): SimpleTenseModal {
		if (this.isAhead(["KI"]) || this.isAhead(["CUhE"])) {
			const kiOrCuhe = this.nextToken()!;
			return {
				type: "stm-cmavo",
				...spanOf(kiOrCuhe),
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

	private parseStmBai(): StmBai {
		const nahe = this.tryParseCmavo("NAhE");
		const se = this.tryParseCmavo("SE");
		const bai = this.tryParseCmavo("BAI")!;
		const nai = this.tryParseCmavo("NAI");
		const ki = this.tryParseCmavo("KI");
		return {
			type: "stm-bai",
			...spanOf(nahe, se, bai, nai, ki),
			nahe,
			se,
			bai,
			nai,
			ki,
		};
	}

	private parseStmTense(): StmTense {
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
			...spanOf(nahe, tense, caha, ki),
			nahe,
			tense,
			caha,
			ki,
		};
	}

	private tryParseTimespace(): Timespace | undefined {
		const time = this.tryParseTime();
		if (!time) return undefined;
		const space = this.tryParseSpace();
		return {
			type: "timespace",
			...spanOf(time, space),
			time,
			space,
		};
	}

	private tryParseSpacetime(): Spacetime | undefined {
		const space = this.tryParseSpace();
		if (!space) return undefined;
		const time = this.tryParseTime();
		return {
			type: "spacetime",
			...spanOf(space, time),
			space,
			time,
		};
	}

	private tryParseTime(): Time | undefined {
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

	private tryParseTimeOffset(): TimeOffset | undefined {
		const pu = this.tryParseCmavo("PU");
		if (pu === undefined) return undefined;
		const nai = this.tryParseCmavo("NAI");
		const zi = this.tryParseCmavo("ZI");
		return {
			type: "time-offset",
			...spanOf(pu, nai, zi),
			pu,
			nai,
			zi,
		};
	}

	private tryParseIntervalProperty(): IntervalProperty | undefined {
		const taheOrZaho = this.tryParseCmavo("TAhE") ?? this.tryParseCmavo("ZAhO");
		if (taheOrZaho) {
			const nai = this.tryParseCmavo("NAI");
			return {
				type: "interval-property-cmavo",
				...spanOf(taheOrZaho, nai),
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
			...spanOf(number, roi, nai),
			number,
			roi,
			nai,
		};
	}

	private tryParseZehapu(): Zehapu | undefined {
		const zeha = this.tryParseCmavo("ZEhA");
		if (zeha === undefined) return undefined;
		const pu = this.tryParseCmavo("PU");
		const nai = pu ? this.tryParseCmavo("NAI") : undefined;
		return {
			type: "zehapu",
			...spanOf(zeha, pu, nai),
			zeha,
			pu,
			nai,
		};
	}

	private tryParseSpace(): Space | undefined {
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

	private tryParseMotion(): Motion | undefined {
		const mohi = this.tryParseCmavo("MOhI");
		if (mohi === undefined) return undefined;
		const spaceOffset = this.tryParseSpaceOffset();
		if (spaceOffset === undefined) {
			throw new ParseError("bad motion");
		}
		return {
			type: "motion",
			...spanOf(mohi, spaceOffset),
			mohi,
			spaceOffset,
		};
	}

	private tryParseSpaceOffset(): SpaceOffset | undefined {
		const faha = this.tryParseCmavo("FAhA");
		if (faha === undefined) return undefined;
		const nai = this.tryParseCmavo("NAI");
		const va = this.tryParseCmavo("VA");
		return {
			type: "space-offset",
			...spanOf(faha, nai, va),
			faha,
			nai,
			va,
		};
	}

	private tryParseSpaceInterval(): SpaceInterval | undefined {
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
				...spanOf(vxha, spaceIntProps),
				vxha,
				spaceIntProps,
			};
		}
	}

	private tryParseVxha(): Vxha | undefined {
		const veha = this.tryParseCmavo("VEhA");
		const viha = this.tryParseCmavo("VIhA");
		if ((veha ?? viha) === undefined) return undefined;
		const faha = this.tryParseCmavo("FAhA");
		const nai = faha ? this.tryParseCmavo("NAI") : undefined;
		return {
			type: "vxha",
			...spanOf(veha, viha, faha, nai),
			veha,
			viha,
			faha,
			nai,
		};
	}

	private tryParseSpaceIntProp(): SpaceIntProp | undefined {
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
}

export type ParseResult = (
	| { success: true; tokens: Token[]; text: Text }
	| {
			success: false;
			error: ParseError;
			tokens: Token[];
			consumed?: Text;
			remainder?: Span;
	  }
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
				error: new ParseError("incomplete parse"),
				consumed: text,
				snapshots: parser.snapshots,
				remainder: { start: parser.index, end: tokens.length - 1 },
			};
		}
	} catch (error) {
		console.error(error);
		if (error instanceof ParseError || error instanceof Unsupported) {
			if ("site" in error && error.site !== undefined) {
				// Try to show a partial parse... silly, but it's better than nothing.
				for (let i = 0; i < 8; i++) {
					try {
						const partialTokens = tokens.slice(0, error.site - i);
						const partialText = new Parser(partialTokens).parseText();
						return {
							success: false,
							error,
							tokens,
							consumed: partialText,
							remainder: { start: error.site - i, end: tokens.length - 1 },
							snapshots: parser.snapshots,
						};
					} catch (_error) {
						// Oh, well.
					}
				}
			}
			return { success: false, error, tokens, snapshots: parser.snapshots };
		} else {
			throw error; // Re-throw unexpected errors
		}
	}
}
