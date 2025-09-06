/** biome-ignore-all lint/style/noNonNullAssertion: Useful */

import { HeadBridi, type TailBridi } from "./bridi";
import { ParseError, Unsupported } from "./error";
import type {
	BeiLink,
	BiheOperatorMex1,
	BoSelbri6,
	BridiTail,
	BridiTail1,
	BridiTail2,
	BridiTail3,
	BrivlaWithFrees,
	CeiTanruUnit1,
	CmavoWithFrees,
	Cmene,
	Coinai,
	Ek,
	EkBoSumti3,
	EkKeSumti,
	EkWithFrees,
	Floating,
	Fragment,
	Free,
	Gihek,
	GihekTail,
	GihekWithFrees,
	Gik,
	GoiClause,
	Guhek,
	Ibo,
	IboStatement2,
	Ijek,
	IjekStatement2,
	Indicator,
	Item,
	Jek,
	JkBoSelbri5,
	JkSelbri5,
	Joik,
	JoikEk,
	JoikEkSumti3,
	JoikJek,
	LerfuString,
	Linkargs,
	Links,
	Many,
	Mex,
	Mex1,
	Mex2,
	MexFuha,
	MexOperator,
	MexSimple,
	Naku,
	Namcu,
	Nihos,
	NoiClause,
	Operand,
	Operand1,
	Operand2,
	Operand3,
	Operator,
	Operator1,
	Operator2,
	OperatorMex1,
	Paragraph,
	Positional,
	Pretext,
	Quantifier,
	RelativeClauses,
	RpExpression,
	Selbri,
	Selbri1,
	Selbri2,
	Selbri3,
	Selbri4,
	Selbri5,
	Selbri6,
	Sentence,
	Span,
	Stag,
	Statement,
	Statement1,
	Statement2,
	Statement3,
	Stm,
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
	Terminator,
	Terms,
	Text,
	Text1,
	TokenIndex,
	Vocative,
} from "./grammar";
import { BaseParser } from "./parse-base";
import {
	among,
	either,
	opt,
	patternNumberOrLerfuString,
	patternPaMai,
	patternPaMoi,
	patternStag,
	patternSumti,
	patternSumti6,
	patternTmStart,
	patternVerb,
	preparsed,
	seq,
} from "./pattern";
import { type BigSelmaho, Preparser } from "./preparse";
import { spanOf } from "./span";
import type { Selmaho, Token } from "./tokenize";

export interface Snapshot {
	index: TokenIndex;
	breadcrumbs: string[];
	state: string;
	completed?: Span;
}

export class Parser extends BaseParser<BigSelmaho> {
	public parseText(topLevel: boolean = true): Text {
		this.begin("text");
		const pretext = this.tryParsePretext();
		const text1 = this.parseText1();
		const faho = topLevel ? this.tryParseCmavo("FAhO") : undefined;
		return this.parsed("text", {
			type: "text",
			...spanOf(pretext, text1, faho),
			pretext: pretext,
			text1,
			faho,
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

		if (
			this.isAhead(among("LIhU", "TUhU", "CU"), "LIhU/TUhU/CU") ||
			this.index === this.tokens.length
		) {
			return {
				type: "text-1",
				...spanOf(i),
				firstSeparator: i,
				paragraphs: [],
			};
		}

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
		const stag = this.isAhead(seq(patternStag, "BO"), "stag BO")
			? this.tryParseStag()
			: undefined;
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

	private tryParsePreparsed(type: string): Span | undefined {
		const token = this.peekToken();
		if (
			token?.preparsed !== undefined &&
			"type" in token.preparsed &&
			token.preparsed.type === type
		) {
			this.index++;
			return token.preparsed;
		}
		return undefined;
	}

	private tryParseJoik(): Joik | undefined {
		return this.tryParsePreparsed("joik") as Joik | undefined;
	}

	private tryParseJek(): Jek | undefined {
		return this.tryParsePreparsed("jek") as Jek | undefined;
	}

	private tryParseEk(): Ek | undefined {
		return this.tryParsePreparsed("ek") as Ek | undefined;
	}

	private tryParseGihek(): Gihek | undefined {
		return this.tryParsePreparsed("gihek") as Gihek | undefined;
	}

	private tryParseStm(): Stm | undefined {
		return this.tryParsePreparsed("stm") as Stm | undefined;
	}

	private tryParseNamcu(): Namcu | undefined {
		return this.tryParsePreparsed("number") as Namcu | undefined;
	}

	private tryParseLerfuString(): LerfuString | undefined {
		return this.tryParsePreparsed("lerfu-string") as LerfuString | undefined;
	}

	private tryParseStag(): Stag | undefined {
		const first = this.tryParseStm();
		if (first !== undefined) {
			return { type: "stag", ...spanOf(first), first };
		}
		return undefined;
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
		const first = this.tryParseTem();
		const rest: Item[] = [];
		while (this.peekToken()?.selmaho === "I") {
			const item = this.tryParseItem();
			if (item === undefined) break;
			rest.push(item);
			if (rest.length > 999) {
				throw new Error("Paragraph too long");
			}
		}

		return this.parsed("paragraph", {
			type: "paragraph",
			...spanOf(niho, first, rest),
			niho,
			first,
			rest,
		});
	}

	private tryParseItem(): Item | undefined {
		this.begin("item");
		const i = this.tryParseCmavoWithFrees("I");
		const tem = this.tryParseTem();
		if (i === undefined && tem === undefined) {
			return undefined;
		}
		return this.parsed<Item>("item", {
			type: "item",
			...spanOf(i, tem),
			i,
			tem,
		});
	}

	private tryParseTem(): Statement | Fragment | undefined {
		if (
			this.isSumtiAhead() ||
			this.isNaVerbAhead() ||
			this.isAhead(among("TUhE"), "tu'e") ||
			this.isAhead(seq("NA", "KU"), "naku") ||
			this.isTagAhead() ||
			this.isFaOrTagAhead()
		) {
			return this.parseStatement(true);
		}

		const ek = this.tryParseEkWithFrees();
		if (ek !== undefined) {
			return { type: "fragment", ...spanOf(ek), value: ek };
		}

		const gihek = this.tryParseGihekWithFrees();
		if (gihek !== undefined) {
			return { type: "fragment", ...spanOf(gihek), value: gihek };
		}

		const quantifier = this.tryParseQuantifier();
		if (quantifier !== undefined) {
			return { type: "fragment", ...spanOf(quantifier), value: quantifier };
		}

		const links = this.tryParseLinks();
		if (links !== undefined) {
			return { type: "fragment", ...spanOf(links), value: links };
		}

		const linkargs = this.tryParseLinkArgs();
		if (linkargs !== undefined) {
			return { type: "fragment", ...spanOf(linkargs), value: linkargs };
		}

		const na = this.tryParseCmavoWithFrees("NA");
		if (na !== undefined) {
			return { type: "fragment", ...spanOf(na), value: na };
		}

		// TODO: prenex

		const relativeClauses = this.tryParseRelativeClauses(undefined);
		if (relativeClauses !== undefined) {
			return {
				type: "fragment",
				...spanOf(relativeClauses),
				value: relativeClauses,
			};
		}

		return undefined;
	}

	private isStmAhead(): boolean {
		const token = this.peekToken();
		return token?.preparsed?.type === "stm";
	}

	private isFaOrTagAhead(): boolean {
		const token = this.peekToken();
		return (
			token?.preparsed?.type === "stm" ||
			token?.selmaho === "FA" ||
			token?.selmaho === "FIhO"
		);
	}

	private parseStatement(allowFragment: boolean): Statement | Fragment {
		this.begin("statement");
		const first = this.parseStatement1(allowFragment);
		if (first.type === "fragment") return first;

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
		if (first.type === "fragment") return first;
		const rest: IjekStatement2[] = [];
		while (true) {
			const ijek = this.tryParseIjek();
			if (!ijek) break;
			const statement2 = this.isStatementAhead()
				? this.parseStatement2(false)
				: undefined;
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

	private isStatementAhead(): boolean {
		return (
			this.isNaVerbAhead() ||
			this.isFaOrTagAhead() ||
			this.isSumtiAhead() ||
			this.isAhead("TUhE", "tu'e")
		);
	}

	private parseStatement2(allowFragment: false): Statement2;
	private parseStatement2(allowFragment: boolean): Statement2 | Fragment;
	private parseStatement2(allowFragment: boolean): Statement2 | Fragment {
		const first = this.parseStatement3(allowFragment);
		if (first.type === "fragment") return first;

		const rest: IboStatement2[] = [];
		while (true) {
			const ibo = this.tryParseIbo();
			if (!ibo) break;
			const statement2 = this.isStatementAhead()
				? this.parseStatement2(false)
				: undefined;
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

	private tryParseTag(): Tag | undefined {
		return this.isTagAhead() ? this.parseTag() : undefined;
	}

	private parseStatement3(allowFragment: boolean): Statement3 | Fragment {
		const backtrack = this.index;
		const tag = this.tryParseTag();
		const tuhe = this.tryParseCmavoWithFrees("TUhE");
		if (tuhe !== undefined) {
			const text1 = this.parseText1();
			const tuhu = this.tryParseTerminator("TUhU");
			return {
				type: "statement-3-tuhe",
				...spanOf(tag, tuhe, text1, tuhu),
				tag,
				tuhe,
				text1,
				tuhu,
			};
		}
		this.index = backtrack;
		const sentence = this.parseSentence(allowFragment);
		if (sentence.type === "fragment") return sentence;
		return {
			type: "statement-3-sentence",
			...spanOf(sentence),
			sentence,
		};
	}

	private parseSelbri(): Selbri {
		this.begin("selbri");
		const tag = this.isStmAhead() ? this.parseTag() : undefined;
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

	private isPureVerbAhead(): boolean {
		return this.isAhead(patternVerb, "verb");
	}

	private isNaVerbAhead(): boolean {
		return this.isAhead(seq(opt("NA"), patternVerb), "(na) verb");
	}

	private parseSelbri3(): Selbri3 {
		const first = this.parseSelbri4();
		const tanru: Many<Selbri4> = [first];

		this.log("Is this selbri a tanru?", first);
		while (this.isPureVerbAhead()) {
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
		const stag = this.tryParseStag();
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
		const links = this.tryParseLinks();
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

	private tryParseLinks(): Links | undefined {
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
		if (links.length === 0) return undefined;
		return {
			type: "links",
			...spanOf(links),
			links: links as Many<BeiLink>,
		};
	}

	private isNumberMoiAhead(): boolean {
		return this.isAhead(patternPaMoi, "PA MOI");
	}

	private isNumberMaiAhead(): boolean {
		return this.isAhead(patternPaMai, "PA MAI");
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
			const kehe = this.tryParseTerminator("KEhE");
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
			const mehu = this.tryParseTerminator("MEhU");
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
			const namcu = this.tryParseNamcu() ?? this.tryParseLerfuString();
			const moi = this.tryParseCmavoWithFrees("MOI");
			if (namcu === undefined || moi === undefined) {
				throw new ParseError("Bad tu-moi", this.index);
			}
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
			const tag = this.isTagAhead() ? this.parseTag() : undefined;
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
		const first = this.parseSumti2();
		const ekKeSumti = this.isAhead(
			seq(preparsed("ek"), opt(patternStag), "BO"),
			"ek",
		)
			? this.parseEkKeSumti()
			: undefined;
		return {
			type: "sumti-1",
			...spanOf(first, ekKeSumti),
			first,
			ekKeSumti,
		};
	}

	private parseEkKeSumti(): EkKeSumti {
		const ek = this.parseEk();
		const stag = this.tryParseStag();
		const ke = this.tryParseCmavoWithFrees("KE")!;
		const sumti = this.parseSumti();
		const kehe = this.tryParseTerminator("KEhE");
		return {
			type: "ek-ke-sumti",
			...spanOf(ek, stag, ke, sumti, kehe),
			ek,
			stag,
			ke,
			sumti,
			kehe,
		};
	}

	private parseEk(): Ek {
		const ek = this.tryParsePreparsed("ek") as Ek;
		if (ek === undefined) {
			throw new ParseError("Expected ek", this.index);
		}
		return ek;
	}

	private parseSumti2(): Sumti2 {
		const first = this.parseSumti3();
		const rest: JoikEkSumti3[] = [];
		while (true) {
			const joikEk = this.tryParseJoikEk();
			if (joikEk === undefined) break;
			const sumti3 = this.parseSumti3();
			rest.push({
				type: "joik-ek-sumti-3",
				...spanOf(joikEk, sumti3),
				joikEk,
				sumti3,
			});
		}
		return {
			type: "sumti-2",
			...spanOf(first, rest),
			first,
			rest,
		};
	}

	private tryParseJoikEkSumti3(): JoikEkSumti3 | undefined {
		const joikEk = this.tryParseJoikEk();
		if (joikEk === undefined) return undefined;
		const sumti3 = this.parseSumti3();
		return {
			type: "joik-ek-sumti-3",
			...spanOf(joikEk, sumti3),
			joikEk,
			sumti3,
		};
	}

	private parseSumti3(): Sumti3 {
		const first = this.parseSumti4();

		const ekBoSumti3 = this.isAhead(
			seq(either(preparsed("ek"), preparsed("joik")), opt(patternStag), "BO"),
			"stag BO",
		)
			? this.parseEkBoSumti3()
			: undefined;
		return {
			type: "sumti-3",
			...spanOf(first, ekBoSumti3),
			first,
			ekBoSumti3,
		};
	}

	private parseEkBoSumti3(): EkBoSumti3 {
		const ek = this.tryParseEk()!;
		const stag = this.tryParseStag();
		const bo = this.tryParseCmavoWithFrees("BO")!;
		const sumti3 = this.parseSumti3();
		return {
			type: "ek-bo-sumti-3",
			...spanOf(ek, stag, bo, sumti3),
			ek,
			stag,
			bo,
			sumti3,
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
		if (outerQuantifier && this.isNaVerbAhead()) {
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

		if (
			token &&
			token.selmaho === "number" &&
			!this.isNumberMaiAhead() &&
			!this.isNumberMoiAhead()
		) {
			return this.parseQuantifier();
		} else {
			return undefined;
		}
	}

	private parseQuantifier(): Quantifier {
		const number = this.tryParseNamcu()!;
		const boi = this.tryParseTerminator("BOI");
		return {
			type: "quantifier",
			...spanOf(number, boi),
			number,
			boi,
		};
	}

	private tryParseRelativeClauses(
		antecedent: Span | undefined,
	): RelativeClauses | undefined {
		const relativeClause =
			this.tryParseGoiClause(antecedent) ?? this.tryParseNoiClause(antecedent);
		if (!relativeClause) return undefined;
		return {
			type: "relative-clauses",
			...spanOf(relativeClause),
			first: relativeClause,
			rest: [],
		};
	}

	private tryParseGoiClause(
		antecedent: Span | undefined,
	): GoiClause | undefined {
		const goi = this.tryParseCmavoWithFrees("GOI");
		if (!goi) return undefined;
		const term = this.tryParseTerm();
		if (!term) return undefined;
		const gehu = this.tryParseTerminator("GEhU");
		return {
			type: "goi-clause",
			...spanOf(goi, term, gehu),
			antecedent,
			goi,
			term,
			gehu,
		};
	}

	private tryParseNoiClause(
		antecedent: Span | undefined,
	): NoiClause | undefined {
		const noi = this.tryParseCmavoWithFrees("NOI");
		if (!noi) return undefined;
		const subsentence = this.parseSubsentence();
		const kuho = this.tryParseTerminator("KUhO");
		return {
			type: "noi-clause",
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

		if (token.selmaho === "lerfu-string") {
			const lerfuString = this.tryParseLerfuString()!;
			const boi = this.tryParseTerminator("BOI");
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
			const text = this.parseText(false);
			const lihu = this.tryParseTerminator("LIhU");
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
			const luhu = this.tryParseTerminator("LUhU");
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
			const ku = this.tryParseTerminator("KU");
			return {
				type: "sumti-6-le",
				...spanOf(le, sumtiTail, ku),
				le,
				sumtiTail,
				ku,
			};
		}

		if (token.selmaho === "LI") {
			const li = this.tryParseCmavoWithFrees("LI")!;
			const mex = this.parseMex();
			const loho = this.tryParseTerminator("LOhO");
			return {
				type: "sumti-6-li",
				...spanOf(li, mex, loho),
				li,
				mex,
				loho,
			};
		}

		if (token.selmaho === "LA") {
			const la = this.tryParseCmavoWithFrees("LA")!;
			const relativeClauses = this.tryParseRelativeClauses(la);
			const names = this.zeroOrMore("CMEVLA");
			const frees = this.parseFrees();
			if (names.length) {
				return {
					type: "sumti-6-la",
					...spanOf(la, names, frees),
					la,
					relativeClauses,
					cmevlas: names,
					frees,
				};
			} else {
				// TODO: DRY?
				const sumtiTail = this.parseSumtiTail();
				const ku = this.tryParseTerminator("KU");
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
		return this.isAhead(patternSumti6, "sumti6");
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
		const quantifier = this.tryParseQuantifier();
		const selbri = this.parseSelbri();
		const relativeClauses = this.tryParseRelativeClauses(selbri);
		return {
			type: "sumti-tail-1",
			...spanOf(quantifier, selbri, relativeClauses),
			quantifier,
			selbri,
			relativeClauses,
		};
	}

	private isSumtiAhead(): boolean {
		return this.isAhead(patternSumti, "sumti");
	}

	private isTagAhead(): boolean {
		return this.isAhead(patternTmStart, "tag");
	}

	private parseTag(): Tag {
		this.begin("tag");
		const tenseModal = this.parseTenseModal();
		// TODO: jek joik
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
		if (this.isAhead(seq("NA", "KU"), "NA KU")) {
			return this.parseNaku();
		}
		if (this.isSumtiAhead()) {
			return this.parseSumti();
		}
		if (this.isAhead(either("FA", patternTmStart), "tag term")) {
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
		const headBridi = new HeadBridi();
		while (true) {
			const term = this.tryParseTerm();
			if (!term) {
				this.log(`No more terms in head`);
				break;
			}
			this.log(`Parsed term`, term);
			headBridi.place(term, this.tokens);
		}
		const cu =
			headBridi.length() > 0 ? this.tryParseCmavoWithFrees("CU") : undefined;
		if (!this.isNaVerbAhead() && !cu && allowFragment) {
			return headBridi.asFragment();
		}

		const tailBridi = headBridi.finish();
		const bridiTail = this.parseBridiTail(tailBridi);

		const terms: Terms<Positional> | undefined = tailBridi.placeHeadTerms();

		return this.parsed("sentence", {
			type: "sentence",
			...spanOf(headBridi.span(), cu, bridiTail),
			terms,
			cu,
			bridiTail,
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

	private parseBridiTail(bridi: TailBridi): BridiTail<Positional> {
		const bridiTail1 = this.parseBridiTail1(bridi);
		return {
			type: "bridi-tail",
			...spanOf(bridiTail1),
			first: bridiTail1,
		};
	}

	private parseBridiTail1(bridi: TailBridi): BridiTail1<Positional> {
		this.begin("bridi-tail-1");
		const bridiTail2 = this.parseBridiTail2(bridi);
		const rest: GihekTail<Positional>[] = [];
		while (true) {
			const gihek = this.tryParseGihekTail(bridi);
			if (!gihek) break;
			rest.push(gihek);
		}
		const bridiTail1: BridiTail1<Positional> = this.parsed("bridi-tail-1", {
			type: "bridi-tail-1",
			...spanOf(bridiTail2, rest),
			first: bridiTail2,
			rest,
		});
		return bridiTail1;
	}

	private tryParseGihekTail(
		bridi: TailBridi,
	): GihekTail<Positional> | undefined {
		const gihek = this.tryParseGihek();
		if (gihek === undefined) return undefined;
		const frees = this.parseFrees();
		const bridiTail2 = this.parseBridiTail2(bridi);
		const tailTerms = this.parseTailTerms();

		return {
			type: "gihek-tail-1",
			gihek,
			frees,
			tail: bridiTail2,
			tailTerms: bridi.placeTailTerms(tailTerms, this.tokens),
			...spanOf(gihek, frees, bridiTail2, tailTerms),
		};
	}

	private parseBridiTail2(bridi: TailBridi): BridiTail2<Positional> {
		const bridiTail3 = this.parseBridiTail3(bridi);
		return {
			type: "bridi-tail-2",
			...spanOf(bridiTail3),
			first: bridiTail3,
		};
	}

	private parseBridiTail3(bridi: TailBridi): BridiTail3<Positional> {
		const selbri = this.parseSelbri();
		const tailTerms = this.parseTailTerms();
		const tailTertau = this.extractTertau(selbri, "tail");
		bridi.openGroup(tailTertau);
		const placedTerms = bridi.placeTailTerms(tailTerms, this.tokens);
		bridi.closeGroup();

		return {
			type: "bridi-tail-3",
			...spanOf(selbri, placedTerms),
			selbri,
			tailTerms: placedTerms,
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

	private tryParseGihekWithFrees(): GihekWithFrees | undefined {
		const gihek = this.tryParseGihek();
		if (gihek === undefined) return undefined;
		const frees = this.parseFrees();
		return { type: "gihek-with-frees", ...spanOf(gihek, frees), gihek, frees };
	}

	private tryParseEkWithFrees(): EkWithFrees | undefined {
		const ek = this.tryParseEk();
		if (ek === undefined) return undefined;
		const frees = this.parseFrees();
		return { type: "ek-with-frees", ...spanOf(ek, frees), ek, frees };
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
			if (terms.length > 999) {
				throw new Error("Terms too long");
			}
		}

		if (terms.length === 0) return undefined;

		return {
			type: "terms",
			...spanOf(terms),
			terms,
		};
	}

	protected tryParseCmavoWithFrees(
		selmaho: BigSelmaho,
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

	protected tryParseTerminator(selmaho: BigSelmaho): Terminator | undefined {
		const terminator = this.tryParseCmavo(selmaho);
		const frees = this.parseFrees();
		if (terminator !== undefined || frees.length > 0) {
			return {
				type: "terminator",
				...spanOf(terminator, frees),
				terminator,
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

	private tryParseVocativeArgument():
		| Selbri
		| Sumti<Floating>
		| Cmene
		| undefined {
		const cmene = this.tryParseCmene();
		if (cmene) return cmene;
		return this.isNaVerbAhead()
			? this.parseSelbri()
			: this.isSumtiAhead()
				? this.parseSumti()
				: undefined;
	}

	private parseVocative(): Vocative {
		const coinais = this.parseCoinais();
		const doi = this.tryParseCmavo("DOI");
		return { type: "vocative", ...spanOf(coinais, doi), coinais, doi };
	}

	private parseCoinais(): Coinai[] {
		const coinais: Coinai[] = [];
		while (true) {
			const coinai = this.tryParseCoinai();
			if (!coinai) break;
			coinais.push(coinai);
		}
		return coinais;
	}

	private tryParseCoinai(): Coinai | undefined {
		const coi = this.tryParseCmavo("COI");
		if (coi === undefined) return undefined;
		const nai = this.tryParseCmavo("NAI");
		return { type: "coinai", ...spanOf(coi, nai), coi, nai };
	}

	protected tryParseFree(): Free | undefined {
		const token = this.peekToken();
		const indicator = this.tryParseIndicator();
		if (indicator) return indicator;

		if (token?.selmaho === "SEI") {
			const sei = this.tryParseCmavoWithFrees("SEI")!;
			const bridi = new HeadBridi();
			const headTerms = this.tryParseTerms();
			for (const term of headTerms?.terms ?? []) {
				bridi.place(term, this.tokens);
			}
			const tailBridi = bridi.finish();
			const cu = this.tryParseCmavoWithFrees("CU");
			const selbri = this.parseSelbri();
			tailBridi.openGroup(this.extractTertau(selbri, "tail"));
			tailBridi.closeGroup();
			const terms = tailBridi.placeHeadTerms();
			const sehu = this.tryParseCmavo("SEhU");
			return {
				type: "free-sei",
				...spanOf(sei, terms, cu, selbri, sehu),
				sei,
				terms,
				cu,
				selbri,
				sehu,
			};
		}

		if (token?.selmaho === "COI" || token?.selmaho === "DOI") {
			const vocative = this.parseVocative();
			const relativeClauses = this.tryParseRelativeClauses(undefined);
			const argument = this.tryParseVocativeArgument();
			const relativeClauses2 = this.tryParseRelativeClauses(relativeClauses);
			const dohu = this.tryParseCmavo("DOhU");
			return {
				type: "free-vocative",
				...spanOf(vocative, relativeClauses, argument, relativeClauses2, dohu),
				vocative,
				relativeClauses,
				argument,
				relativeClauses2,
				dohu,
			};
		}

		if (this.isNumberMaiAhead()) {
			const ordinal = this.tryParseNamcu() ?? this.tryParseLerfuString();
			const mai = this.tryParseCmavo("MAI");
			if (ordinal === undefined || mai === undefined) {
				throw new ParseError("Bad free-mai", this.index);
			}
			return {
				type: "free-mai",
				...spanOf(ordinal, mai),
				ordinal,
				mai,
			};
		}

		if (token?.selmaho === "TO") {
			const to = this.tryParseCmavo("TO")!;
			const text = this.parseText(false);
			const toi = this.tryParseCmavo("TOI");
			return {
				type: "free-to",
				...spanOf(to, text, toi),
				to,
				text,
				toi,
			};
		}

		if (this.isAhead(seq("XI", patternNumberOrLerfuString), "xi")) {
			const xi = this.tryParseCmavoWithFrees("XI")!;
			const ordinal = this.tryParseLerfuString() ?? this.tryParseNamcu()!;
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

	protected tryParseJoikEk(): JoikEk | undefined {
		const jk = this.tryParseJoik() ?? this.tryParseEk();
		if (!jk) return undefined;
		const frees = this.parseFrees();
		return {
			type: "joik-ek",
			jk,
			frees,
			...spanOf(jk, frees),
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

	// #region tense

	public parseTenseModal(): TenseModal {
		const simpleTenseModal = this.tryParseStm()!;
		const fiho = this.tryParseCmavoWithFrees("FIhO");
		if (fiho) {
			const selbri = this.parseSelbri();
			const fehu = this.tryParseCmavoWithFrees("FEhU");
			return {
				type: "tense-modal-fiho",
				...spanOf(fiho, selbri, fehu),
				fiho,
				selbri,
				fehu,
			};
		}

		const frees = this.parseFrees();
		return {
			type: "tense-modal-stm",
			...spanOf(simpleTenseModal),
			first: simpleTenseModal,
			frees,
		};
	}

	// #endregion

	// #region mex

	private parseMex(): Mex {
		const value = this.parseMexFuha() ?? this.parseMexSimple();
		return { type: "mex", ...spanOf(value), value };
	}

	private parseMexFuha(): MexFuha | undefined {
		const fuha = this.tryParseCmavoWithFrees("FUhA");
		if (fuha === undefined) return undefined;
		const rpExpression = this.parseRpExpression();
		return {
			type: "mex-fuha",
			...spanOf(fuha, rpExpression),
			fuha,
			rpExpression,
		};
	}

	private parseRpExpression(): RpExpression {
		throw new Error("TODO rp-expression");
	}

	private parseMexSimple(): MexSimple {
		const first = this.parseMex1();
		const rest: OperatorMex1[] = [];

		while (true) {
			const next = this.tryParseOperatorMex1();
			if (!next) break;
			rest.push(next);
		}
		return { type: "mex-simple", ...spanOf(first, rest), first, rest };
	}

	private tryParseOperatorMex1(): OperatorMex1 | undefined {
		const operator = this.tryParseOperator();
		if (operator === undefined) return undefined;
		const rest = this.parseMex1();
		return {
			type: "operator-mex-1",
			...spanOf(operator, rest),
			operator,
			rest,
		};
	}

	private parseMex1(): Mex1 {
		const first = this.parseMex2();
		const rest: BiheOperatorMex1 | undefined = undefined;
		return { type: "mex-1", ...spanOf(first, rest), first, rest };
	}

	private parseMex2(): Mex2 {
		const first = this.parseOperand();
		return {
			type: "mex-2",
			...spanOf(first),
			value: { type: "mex-2-operand", ...spanOf(first), operand: first },
		};
	}

	private tryParseOperator(): Operator | undefined {
		const first = this.tryParseOperator1();
		if (first === undefined) return undefined;
		return { type: "operator", ...spanOf(first), first };
	}

	private tryParseOperator1(): Operator1 | undefined {
		const first = this.tryParseOperator2();
		if (first === undefined) return undefined;
		return { type: "operator-1", ...spanOf(first), first };
	}

	private tryParseOperator2(): Operator2 | undefined {
		const operator = this.tryParseMexOperator();
		if (operator === undefined) return undefined;
		return { type: "operator-2", ...spanOf(operator), operator };
	}

	private tryParseMexOperator(): MexOperator | undefined {
		const token = this.peekToken();
		if (token?.selmaho === "VUhU") {
			const vuhu = this.tryParseCmavoWithFrees("VUhU")!;
			return { type: "mex-operator-vuhu", ...spanOf(vuhu), vuhu };
		}
		// TODO: other mex operators
		return undefined;
	}

	private parseOperand(): Operand {
		const first = this.parseOperand1();
		return { type: "operand", ...spanOf(first), first };
	}

	private parseOperand1(): Operand1 {
		const first = this.parseOperand2();
		const rest: BiheOperatorMex1 | undefined = undefined;
		return { type: "operand-1", ...spanOf(first, rest), first, rest };
	}

	private parseOperand2(): Operand2 {
		const first = this.parseOperand3();
		return { type: "operand-2", ...spanOf(first), first, rest: undefined };
	}

	private parseOperand3(): Operand3 {
		const token = this.peekToken();
		if (token?.selmaho === "NIhE") {
			throw new Error("TODO ni'e");
		} else if (token?.selmaho === "MOhE") {
			throw new Error("TODO mo'e");
		} else if (token?.selmaho === "JOhI") {
			throw new Error("TODO jo'i");
		} else if (token?.selmaho === "GA") {
			throw new Error("TODO gek");
		} else if (token?.selmaho === "LAhE") {
			throw new Error("TODO la'e");
		} else if (this.isAhead(seq("NAhE", "BO"), "NAhE BO")) {
			throw new Error("TODO na'ebo");
		} else {
			const quantifier = this.tryParseQuantifier();
			if (quantifier) {
				return {
					type: "operand-3",
					...spanOf(quantifier),
					value: { type: "o3-quantifier", ...spanOf(quantifier), quantifier },
				};
			} else {
				throw new Error("TODO operand3");
			}
		}
	}

	// #endregion
}

export type ParseResult = (
	| { success: true; tokens: Token[]; text: Text; time: number }
	| {
			success: false;
			error: ParseError;
			tokens: Token[];
			consumed?: Text;
			remainder?: Span;
	  }
) & { snapshots: Snapshot[] };

export function parse(tokens: Token[]): ParseResult {
	const preparsed = new Preparser(tokens).preparse();
	const parser = new Parser(preparsed);
	const start = performance.now();
	try {
		const text = parser.parseText();
		if (parser.index === parser.tokens.length) {
			return {
				success: true,
				tokens,
				text,
				snapshots: parser.snapshots,
				time: performance.now() - start,
			};
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
		// console.error(error);
		if (error instanceof ParseError || error instanceof Unsupported) {
			if ("site" in error && error.site !== undefined) {
				// Try to show a partial parse... silly, but it's better than nothing.
				for (let i = 0; i < 8; i++) {
					try {
						const partialTokens = tokens.slice(0, error.site - i);
						const preparsed = new Preparser(partialTokens).preparse();
						const partialText = new Parser(preparsed).parseText();
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
