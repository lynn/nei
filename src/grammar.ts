export type Many<T> = T[] & { 0: T };

export type TokenIndex = number;

export interface Span {
	start: TokenIndex;
	end: TokenIndex;
}

export interface Brivla extends Span {
	type: "brivla";
}

export type Floating = "floating";

export interface Role {
	xIndex: number | "fai" | "?" | "modal";
	verb: Span;
}

/** For example Sumti<Positional> has positional role info */
export interface Positional {
	roles: Role[];
}

/// text =
///   [NAI ...] [CMENE ... # | (indicators & free ...)] [joik-jek] text-1

export interface Text extends Span {
	type: "text";
	pretext: Pretext | undefined;
	text1: Text1;
}

export interface Pretext extends Span {
	type: "pretext";
	nais: TokenIndex[];
	cmene: Cmene | undefined;
	frees: Free[];
	joikjek: JoikJek | undefined;
}

export interface Cmene extends Span {
	type: "cmene";
	cmevlas: TokenIndex[];
	frees: Free[];
}

/// text-1 =
///   [(I [jek | joik] [[stag] BO] #) ... | NIhO ... #] [paragraphs]

export interface Text1 extends Span {
	type: "text-1";
	firstSeparator: Ijek | Ibo | Nihos | CmavoWithFrees | undefined;
	paragraphs: Paragraph[];
}

export interface Nihos extends Span {
	type: "nihos";
	nihos: TokenIndex[];
	frees: Free[];
}

/// paragraphs = paragraph [NIhO ... # paragraphs]
/// paragraph = (statement | fragment) [I # [statement | fragment]] ...

export interface Paragraph extends Span {
	type: "paragraph";
	niho: Nihos | undefined;
	first: Statement | Fragment;
	rest: Item[];
}

export interface Item extends Span {
	type: "item";
	i: CmavoWithFrees | undefined;
	tem: Statement | Fragment;
}

/// statement = statement-1 | prenex statement

export interface Statement extends Span {
	type: "statement";
	prenexes: Prenex[];
	statement1: Statement1;
}

/// statement-1 = statement-2 [I joik-jek [statement-2]] ...

export interface Statement1 extends Span {
	type: "statement-1";
	first: Statement2;
	rest: IjekStatement2[];
}

export interface Ijek extends Span {
	type: "ijek";
	i: TokenIndex;
	jek: JoikJek;
}

export interface IjekStatement2 extends Span {
	type: "ijek-statement-2";
	ijek: Ijek;
	statement2: Statement2;
}

/// statement-2 = statement-3 [I [jek | joik] [stag] BO # [statement-2]]

export interface Statement2 extends Span {
	type: "statement-2";
	first: Statement3;
	rest: IboStatement2[];
}

export interface Ibo extends Span {
	type: "ibo";
	i: TokenIndex;
	jk: Joik | Jek | undefined;
	stag: Stag | undefined;
	bo: CmavoWithFrees;
}

export interface IboStatement2 extends Span {
	type: "ibo-statement-2";
	ibo: Ibo;
	statement2: Statement2;
}

/// statement-3 = sentence | [tag] TUhE # text-1 /TUhU#/

export interface Statement3 extends Span {
	type: "statement-3";
	sentence: Sentence;
	// TODO: [tag] TUhE # text-1 /TUhU#/
}

/// fragment =
///   ek #
///   | gihek #
///   | quantifier
///   | NA #
///   | terms /VAU#/
///   | prenex
///   | relative-clauses
///   | links
///   | linkargs

export interface Fragment extends Span {
	type: "fragment";
	value:
		| EkWithFrees
		| GihekWithFrees
		| Quantifier
		| CmavoWithFrees
		| Terms<Floating>
		| Prenex
		| RelativeClauses
		| Links
		| Linkargs;
}

/// prenex = terms ZOhU #

export interface Prenex extends Span {
	type: "prenex";
	terms: Terms<Floating>;
	zohu: CmavoWithFrees;
}

/// sentence = [terms [CU #]] bridi-tail

export interface Sentence extends Span {
	type: "sentence";
	terms: Terms<Positional> | undefined;
	cu: CmavoWithFrees | undefined;
	bridiTail: BridiTail<Positional>;
}

/// subsentence = sentence | prenex subsentence

export interface Subsentence extends Span {
	type: "subsentence";
	prenexes: Prenex[];
	sentence: Sentence;
}

/// bridi-tail = bridi-tail-1 [gihek [stag] KE # bridi-tail /KEhE#/ tail-terms]

export interface BridiTail<Role> extends Span {
	type: "bridi-tail";
	first: BridiTail1<Role>;
	// TODO: [gihek [stag] KE # bridi-tail /KEhE#/ tail-terms]
}

/// bridi-tail-1 = bridi-tail-2 [gihek # bridi-tail-2 tail-terms] ...

export interface BridiTail1<Role> extends Span {
	type: "bridi-tail-1";
	first: BridiTail2<Role>;
	rest: GihekTail<Role>[];
}

export interface GihekTail<Role> extends Span {
	type: "gihek-tail-1";
	gihek: Gihek;
	frees: Free[];
	tail: BridiTail2<Role>;
	tailTerms: TailTerms<Role>;
}

/// bridi-tail-2 = bridi-tail-3 [gihek [stag] BO # bridi-tail-2 tail-terms]

export interface BridiTail2<Role> extends Span {
	type: "bridi-tail-2";
	first: BridiTail3<Role>;
	// TODO: [gihek [stag] BO # bridi-tail-2 tail-terms]
}

/// bridi-tail-3 = selbri tail-terms | gek-sentence
/// gek-sentence = gek subsentence gik subsentence tail-terms | [tag] KE # gek-sentence /KEhE#/ | NA # gek-sentence

export interface BridiTail3<Role> extends Span {
	type: "bridi-tail-3";
	selbri: Selbri;
	tailTerms: TailTerms<Role>;
	// TODO: | gek-sentence
}

/// tail-terms = [terms] /VAU#/

export interface TailTerms<Role> extends Span {
	type: "tail-terms";
	terms: Terms<Role> | undefined;
	vau: CmavoWithFrees | undefined;
}

/// terms = terms-1 ...
/// terms-1 = terms-2 [PEhE # joik-jek terms-2] ...
/// terms-2 = term [CEhE # term] ...

export interface Terms<Role> extends Span {
	type: "terms";
	terms: Term<Role>[];
	// I don't care about termsets
}

/// term = sumti | (tag | FA #) (sumti | /KU#/) | termset | NA KU #

export type Term<Role> = Sumti<Role> | Tagged<Role> | Naku; // TODO: termset

export interface Tagged<Role> extends Span {
	type: "tagged";
	tagOrFa: Tag | CmavoWithFrees;
	sumtiOrKu: Sumti<Floating> | CmavoWithFrees | undefined;
	role: Role;
}

export interface Naku extends Span {
	type: "naku";
	na: TokenIndex;
	ku: CmavoWithFrees;
}

/// termset = NUhI # gek terms /NUhU#/ gik terms /NUhU#/ | NUhI # terms /NUhU#/

/// sumti = sumti-1 [VUhO # relative-clauses]

export interface Sumti<Role> extends Span {
	type: "sumti";
	sumti1: Sumti1;
	vuho: CmavoWithFrees | undefined;
	relativeClauses: RelativeClauses | undefined;
	role: Role;
}

/// sumti-1 = sumti-2 [(ek | joik) [stag] KE # sumti /KEhE#/]

export interface Sumti1 extends Span {
	type: "sumti-1";
	sumti2: Sumti2;
	// TODO: [(ek | joik) [stag] KE # sumti /KEhE#/]
}

/// sumti-2 = sumti-3 [joik-ek sumti-3] ...

export interface Sumti2 extends Span {
	type: "sumti-2";
	sumti3: Sumti3;
	// TODO: [joik-ek sumti-3]...
}

/// sumti-3 = sumti-4 [(ek | joik) [stag] BO # sumti-3]

export interface Sumti3 extends Span {
	type: "sumti-3";
	sumti4: Sumti4;
	// TODO: [(ek | joik) [stag] BO # sumti-3]
}

/// sumti-4 = sumti-5 | gek sumti gik sumti-4

export interface Sumti4 extends Span {
	type: "sumti-4";
	sumti5: Sumti5;
	// TODO: | gek sumti gik sumti-4
}

/// sumti-5 = [quantifier] sumti-6 [relative-clauses] | quantifier selbri /KU#/ [relative-clauses]

export type Sumti5 = Sumti5Small | Sumti5Large;

export interface Sumti5Large extends Span {
	type: "sumti-5-large";
	outerQuantifier: Quantifier | undefined;
	sumti6: Sumti6;
	relativeClauses: RelativeClauses | undefined;
}

export interface Sumti5Small extends Span {
	type: "sumti-5-small";
	quantifier: Quantifier;
	selbri: Selbri;
	ku: CmavoWithFrees | undefined;
	relativeClauses: RelativeClauses | undefined;
}

/// sumti-6 =
///   (LAhE # | NAhE BO #) [relative-clauses] sumti /LUhU#/
///   | KOhA #
///   | lerfu-string /BOI#/
///   | LA # [relative-clauses] CMENE ... #
///   | (LA | LE) # sumti-tail /KU#/
///   | LI # mex /LOhO#/
///   | ZO any-word #
///   | LU text /LIhU#/
///   | LOhU any-word ... LEhU #
///   | ZOI any-word anything any-word #

export type Sumti6 =
	| Sumti6Lahe
	| Sumti6Nahebo
	| Sumti6Koha
	| Sumti6Lerfu
	| Sumti6La
	| Sumti6Le
	| Sumti6Li
	| Sumti6Quote
	| Sumti6Lu;

export interface Sumti6Lahe extends Span {
	type: "sumti-6-lahe";
	lahe: CmavoWithFrees;
	// relative clauses here feels like crimes. not condoning it
	sumti: Sumti<Floating>;
	luhu: CmavoWithFrees | undefined;
}

export interface Sumti6Nahebo extends Span {
	type: "sumti-6-nahebo";
	nahe: TokenIndex;
	bo: CmavoWithFrees;
	// relative clauses here feels like crimes. not condoning it
	sumti: Sumti<Floating>;
	luhu: CmavoWithFrees | undefined;
}

export interface Sumti6Koha extends Span {
	type: "sumti-6-koha";
	koha: CmavoWithFrees;
}

export interface Sumti6Lerfu extends Span {
	type: "sumti-6-lerfu";
	lerfuString: LerfuString;
	boi: CmavoWithFrees | undefined;
}

export interface Sumti6La extends Span {
	type: "sumti-6-la";
	la: CmavoWithFrees;
	relativeClauses: RelativeClauses | undefined;
	cmevlas: TokenIndex[];
	frees: Free[];
}

export interface Sumti6Le extends Span {
	type: "sumti-6-le";
	le: CmavoWithFrees;
	sumtiTail: SumtiTail;
	ku: CmavoWithFrees | undefined;
}

export interface Sumti6Li extends Span {
	type: "sumti-6-li";
	li: CmavoWithFrees;
	lerfuString: LerfuString; // not doing mekso...
	loho: CmavoWithFrees | undefined;
}

export interface Sumti6Quote extends Span {
	type: "sumti-6-quote";
	// The tokenizer already merged ZO x or LOhU x LEhU into one token.
	quote: CmavoWithFrees;
}

export interface Sumti6Lu extends Span {
	type: "sumti-6-lu";
	lu: TokenIndex;
	text: Text;
	lihu: CmavoWithFrees | undefined;
}

/// sumti-tail = [sumti-6 [relative-clauses]] sumti-tail-1 | relative-clauses sumti-tail-1

export interface SumtiTail extends Span {
	type: "sumti-tail";
	owner: Sumti6 | undefined;
	relativeClauses: RelativeClauses | undefined;
	tail: SumtiTail1;
}

/// sumti-tail-1 = [quantifier] selbri [relative-clauses] | quantifier sumti

export interface SumtiTail1 extends Span {
	type: "sumti-tail-1";
	// TODO: quantifiers and stuff
	selbri: Selbri;
	relativeClauses: RelativeClauses | undefined;
}

/// relative-clauses = relative-clause [ZIhE # relative-clause] ...
/// relative-clause = GOI # term /GEhU#/ | NOI # subsentence /KUhO#/

export interface RelativeClauses extends Span {
	type: "relative-clauses";
	first: RelativeClause;
	// TODO: zi'e
}

export interface RelativeClause extends Span {
	type: "relative-clause";
	antecedent: Span | undefined;
	noi: CmavoWithFrees;
	subsentence: Subsentence;
	kuho: CmavoWithFrees | undefined;
	// TODO: goi
}

/// selbri = [tag] selbri-1

export interface Selbri extends Span {
	type: "selbri";
	tag: Tag | undefined;
	selbri1: Selbri1;
}

/// selbri-1 = selbri-2 | NA # selbri

export type Selbri1 = Selbri1Na | Selbri1Simple;

export interface Selbri1Na extends Span {
	type: "selbri-1-na";
	na: CmavoWithFrees;
	selbri: Selbri;
}

export interface Selbri1Simple extends Span {
	type: "selbri-1-simple";
	selbri2: Selbri2;
}

/// selbri-2 = selbri-3 [CO # selbri-2]

export interface Selbri2 extends Span {
	type: "selbri-2";
	selbri3: Selbri3;
	co?: CmavoWithFrees;
	coSelbri?: Selbri2;
}

/// selbri-3 = selbri-4 ...

export interface Selbri3 extends Span {
	type: "selbri-3";
	selbri4s: Many<Selbri4>;
}

/// selbri-4 = selbri-5 [joik-jek selbri-5 | joik [stag] KE # selbri-3 /KEhE#/] ...

export interface Selbri4 extends Span {
	type: "selbri-4";
	first: Selbri5;
	rest: JkSelbri5[];
}

export interface JkSelbri5 extends Span {
	type: "jk-selbri-5";
	jk: JoikJek;
	selbri5: Selbri5;
	// The joik [stag] stuff is weird, might not implement it
}

/// selbri-5 =
///     selbri-6 [(jek | joik) [stag] BO # selbri-5]

export interface Selbri5 extends Span {
	type: "selbri-5";
	first: Selbri6;
	rest: JkBoSelbri5 | undefined;
}

export interface JkBoSelbri5 extends Span {
	type: "jk-bo-selbri-5";
	jk: Jek | Joik;
	stag: Stag | undefined;
	bo: CmavoWithFrees;
	selbri5: Selbri5;
}

/// selbri-6 =
///     tanru-unit [BO # selbri-6]
///     | [NAhE #] guhek selbri gik selbri-6

export type Selbri6 = Selbri6Plain | Selbri6Guhek;

export interface Selbri6Plain extends Span {
	type: "selbri-6-plain";
	tanruUnit: TanruUnit;
	rest: BoSelbri6 | undefined;
}

export interface BoSelbri6 extends Span {
	type: "bo-selbri-6";
	bo: CmavoWithFrees;
	selbri6: Selbri6;
}

export interface Selbri6Guhek extends Span {
	type: "selbri-6-guhek";
	nahe: CmavoWithFrees | undefined;
	guhek: Guhek;
	selbri: Selbri;
	gik: Gik;
	selbri6: Selbri6;
}

/// tanru-unit =
///     tanru-unit-1 [CEI # tanru-unit-1] ...

export interface TanruUnit extends Span {
	type: "tanru-unit";
	first: TanruUnit1;
	rest: CeiTanruUnit1[];
}

export interface CeiTanruUnit1 extends Span {
	type: "cei-tanru-unit-1";
	cei: CmavoWithFrees;
	tanruUnit1: TanruUnit1;
}

/// tanru-unit-1 =
///     tanru-unit-2 [linkargs]

export interface TanruUnit1 extends Span {
	type: "tanru-unit-1";
	tanruUnit2: TanruUnit2;
	linkargs: Linkargs | undefined;
}

/// tanru-unit-2 =
///     BRIVLA #
///     | GOhA [RAhO] #
///     | KE # selbri-3 /KEhE#/
///     | ME # sumti /MEhU#/ [MOI #]
//      | (number | lerfu-string) MOI #
///     | NUhA # mex-operator
///     | SE # tanru-unit-2
///     | JAI # [tag] tanru-unit-2
///     | any-word (ZEI any-word) ...
///     | NAhE # tanru-unit-2
///     | NU [NAI] # [joik-jek NU [NAI] #] ... subsentence /KEI#/

export type TanruUnit2 =
	| TuBrivla
	| TuGoha
	| TuKe
	| TuMe
	| TuMoi
	// TODO: nuha
	| TuSe
	| TuJai
	// TODO: zei
	| TuNahe
	| TuNu;

export interface TuBrivla extends Span {
	type: "tu-brivla";
	brivla: BrivlaWithFrees;
}

export interface TuGoha extends Span {
	type: "tu-goha";
	goha: TokenIndex;
	raho: TokenIndex | undefined;
	frees: Free[];
}

export interface TuKe extends Span {
	type: "tu-ke";
	ke: CmavoWithFrees;
	selbri3: Selbri3;
	kehe: CmavoWithFrees | undefined;
}

export interface TuMe extends Span {
	type: "tu-me";
	me: CmavoWithFrees;
	sumti: Sumti<Floating>;
	mehu: CmavoWithFrees | undefined;
	moi: CmavoWithFrees | undefined;
}

export interface TuMoi extends Span {
	type: "tu-moi";
	number: Namcu | LerfuString;
	moi: CmavoWithFrees;
}

export interface TuSe extends Span {
	type: "tu-se";
	se: CmavoWithFrees;
	inner: TanruUnit2;
}

export interface TuJai extends Span {
	type: "tu-jai";
	jai: CmavoWithFrees;
	tag: Tag | undefined;
	inner: TanruUnit2;
}

export interface TuNahe extends Span {
	type: "tu-nahe";
	nahe: CmavoWithFrees;
	inner: TanruUnit2;
}

export interface TuNu extends Span {
	type: "tu-nu";
	nu: CmavoWithFrees;
	// nu nai? nujeka? ridiculous imo
	subsentence: Subsentence;
	kei: CmavoWithFrees | undefined;
}

/// linkargs = BE # term [links] /BEhO#/
/// links = BEI # term [links]

export interface Linkargs extends Span {
	type: "linkargs";
	be: CmavoWithFrees;
	term: Term<Floating>;
	links: Links | undefined;
	beho: CmavoWithFrees | undefined;
}

export interface Links extends Span {
	type: "links";
	links: Many<BeiLink>;
}

export interface BeiLink extends Span {
	type: "bei-link";
	bei: CmavoWithFrees;
	term: Term<Floating>;
}

/// quantifier = number /BOI#/ | VEI # mex /VEhO#/

export interface Quantifier extends Span {
	type: "quantifier";
	number: Namcu;
	boi: CmavoWithFrees | undefined;
}

/// mex = mex-1 [operator mex-1] ... | FUhA # rp-expression

export interface Mex extends Span {
	type: "mex";
	mex: MexSimple | MexFuha;
}

export interface MexSimple extends Span {
	type: "mex-simple";
	first: Mex1;
	rest: OperatorMex1[];
}

export interface OperatorMex1 extends Span {
	type: "operator-mex-1";
	operator: Operator;
	rest: Mex1;
}

export interface MexFuha extends Span {
	type: "mex-fuha";
	fuha: CmavoWithFrees;
	rpExpression: RpExpression;
}

// mex-1 = mex-2 [BIhE # operator mex-1]

export interface Mex1 extends Span {
	type: "mex-1";
	first: Mex2;
	rest: BiheOperatorMex1 | undefined;
}

export interface BiheOperatorMex1 extends Span {
	type: "bihe-operator-mex-1";
	bihe: CmavoWithFrees;
	operator: Operator;
	rest: Mex1;
}

// mex-2 = operand | [PEhO #] operator mex-2 ... /KUhE#/

export interface Mex2 extends Span {
	type: "mex-2";
	value: Mex2Operand | Mex2Polish;
}

export interface Mex2Operand extends Span {
	type: "mex-2-operand";
	operand: Operand;
}

export interface Mex2Polish extends Span {
	type: "mex-2-polish";
	peho: CmavoWithFrees | undefined;
	operator: Operator;
	arguments: Mex2[];
	kuhe: CmavoWithFrees | undefined;
}

// rp-expression = rp-operand rp-operand operator
// rp-operand = operand | rp-expression

export interface RpExpression extends Span {
	type: "rp-expression";
	left: Operand | RpExpression;
	right: Operand | RpExpression;
	operator: Operator;
}

// operator = operator-1 [joik-jek operator-1 | joik [stag] KE # operator /KEhE#/] ...

export interface Operator extends Span {
	type: "operator";
	first: Operator1;
	// rest: JkOperator1[];
}

// operator-1 = operator-2
//            | guhek operator-1 gik operator-2
//            | operator-2 (jek | joik) [stag] BO # operator-1

export interface Operator1 extends Span {
	type: "operator-1";
	first: Operator2;
	// rest: JkBoOperator1 | undefined;
}

// operator-2 = mex-operator | KE # operator /KEhE#/

export interface Operator2 extends Span {
	type: "operator-2";
	operator: MexOperator;
}

// mex-operator =
//     | SE # mex-operator
//     | NAhE # mex-operator
//     | MAhO # mex /TEhU#/
//     | NAhU # selbri /TEhU#/
//     | VUhU #

export type MexOperator =
	| MexOperatorSe
	| MexOperatorNahe
	| MexOperatorMaho
	| MexOperatorNahu
	| MexOperatorVuhu;

export interface MexOperatorSe extends Span {
	type: "mex-operator-se";
	se: CmavoWithFrees;
	operator: MexOperator;
}

export interface MexOperatorNahe extends Span {
	type: "mex-operator-nahe";
	nahe: CmavoWithFrees;
	operator: MexOperator;
}

export interface MexOperatorMaho extends Span {
	type: "mex-operator-maho";
	maho: CmavoWithFrees;
	mex: Mex;
	tehu: CmavoWithFrees | undefined;
}

export interface MexOperatorNahu extends Span {
	type: "mex-operator-nahu";
	nahu: CmavoWithFrees;
	selbri: Selbri;
	tehu: CmavoWithFrees | undefined;
}

export interface MexOperatorVuhu extends Span {
	type: "mex-operator-vuhu";
	vuhu: CmavoWithFrees;
}

/// operand = operand-1 [(ek | joik) [stag] KE # operand /KEhE#/]

export interface Operand extends Span {
	type: "operand";
	first: Operand1;
}

/// operand-1 = operand-2 [joik-ek operand-2]

export interface Operand1 extends Span {
	type: "operand-1";
	first: Operand2;
	rest: JoikEkOperand2 | undefined;
}

export interface JoikEkOperand2 extends Span {
	type: "joik-ek-operand-2";
	joikEk: JoikEk;
	operand: Operand2;
}

/// operand-2 = operand-3 [(ek | joik) [stag] BO # operand-2]

export interface Operand2 extends Span {
	type: "operand-2";
	first: Operand3;
	rest: JoikEkBoOperand2 | undefined;
}

export interface JoikEkBoOperand2 extends Span {
	type: "joik-ek-bo-operand-2";
	joikEk: Ek | Joik;
	stag: Stag | undefined;
	bo: CmavoWithFrees;
	operand: Operand2;
}

/// operand-3 =
///     quantifier
///     | lerfu-string /BOI#/
///     | NIhE # selbri /TEhU#/
///     | MOhE # sumti /TEhU#/
///     | JOhI # mex-2 ... /TEhU#/
///     | gek operand gik operand-3
///     | (LAhE # | NAhE BO #) operand /LUhU#/

export interface Operand3 extends Span {
	type: "operand-3";
	value:
		| O3Quantifier
		| O3LerfuString
		| O3Nihe
		| O3Mohe
		| O3Johi
		| O3Gek
		| O3Lahe;
}

export interface O3Quantifier extends Span {
	type: "o3-quantifier";
	quantifier: Quantifier;
}

export interface O3LerfuString extends Span {
	type: "o3-lerfu-string";
	lerfuString: LerfuString;
	boi: CmavoWithFrees | undefined;
}

export interface O3Nihe extends Span {
	type: "o3-nihe";
	nihe: CmavoWithFrees;
	selbri: Selbri;
	tehu: CmavoWithFrees | undefined;
}

export interface O3Mohe extends Span {
	type: "o3-mohe";
	mohe: CmavoWithFrees;
	sumti: Sumti<Floating>;
	tehu: CmavoWithFrees | undefined;
}

export interface O3Johi extends Span {
	type: "o3-johi";
	johi: CmavoWithFrees;
	mex: Many<Mex2>;
	tehu: CmavoWithFrees | undefined;
}

export interface O3Gek extends Span {
	type: "o3-gek";
	gek: Gek;
	left: Operand;
	gik: Gik;
	right: Operand3;
}

export interface O3Lahe extends Span {
	type: "o3-lahe";
	lahe: CmavoWithFrees;
	operand: Operand;
	luhu: CmavoWithFrees | undefined;
}

/// number = PA [PA | lerfu-word] ...

export interface Namcu extends Span {
	type: "number";
	first: Pa;
	rest: (Pa | LerfuWord)[];
}

export interface Pa extends Span {
	type: "pa";
	// span is enough
}

/// lerfu-string = lerfu-word [PA | lerfu-word] ...

export interface LerfuString extends Span {
	type: "lerfu-string";
	first: LerfuWord;
	rest: (Pa | LerfuWord)[];
}

/// lerfu-word = BY | any-word BU | LAU lerfu-word | TEI lerfu-string FOI

export interface LerfuWord extends Span {
	type: "lerfu-word";
	by: TokenIndex;
	// TODO: lau, tei, foi
}

/// ek = [NA] [SE] A [NAI]

export interface Ek extends Span {
	type: "ek";
	na: TokenIndex | undefined;
	se: TokenIndex | undefined;
	a: TokenIndex;
	nai: TokenIndex | undefined;
}

export interface EkWithFrees extends Span {
	type: "ek-with-frees";
	ek: Ek;
	frees: Free[];
}

/// gihek = [NA] [SE] GIhA [NAI]

export interface Gihek extends Span {
	type: "gihek";
	na: TokenIndex | undefined;
	se: TokenIndex | undefined;
	giha: TokenIndex;
	nai: TokenIndex | undefined;
}

export interface GihekWithFrees extends Span {
	type: "gihek-with-frees";
	gihek: Gihek;
	frees: Free[];
}

/// jek = [NA] [SE] JA [NAI]

export interface Jek extends Span {
	type: "jek";
	na: TokenIndex | undefined;
	se: TokenIndex | undefined;
	ja: TokenIndex;
	nai: TokenIndex | undefined;
}

/// joik = [SE] JOI [NAI] | interval | GAhO interval GAhO
/// interval = [SE] BIhI [NAI]

export interface Joik extends Span {
	type: "joik";
	gaho1: TokenIndex | undefined;
	se: TokenIndex | undefined;
	joi: TokenIndex; // JOI or BIhI
	nai: TokenIndex | undefined;
	gaho2: TokenIndex | undefined;
}

/// joik-ek = joik # | ek #

export interface JoikEk extends Span {
	type: "joik-ek";
	jk: Joik | Ek;
	frees: Free[];
}

/// joik-jek = joik # | jek #

export interface JoikJek extends Span {
	type: "joik-jek";
	jk: Joik | Jek;
	frees: Free[];
}

/// gek = [SE] GA [NAI] # | joik GI # | stag gik

export interface Gek extends Span {
	type: "gek";
	se: TokenIndex | undefined;
	ga: TokenIndex;
	nai: TokenIndex | undefined;
	frees: Free[];
	// TODO: joi gi, bai gi
}

/// guhek = [SE] GUhA [NAI] #

export interface Guhek extends Span {
	type: "guhek";
	se: TokenIndex | undefined;
	guha: TokenIndex;
	nai: TokenIndex | undefined;
	frees: Free[];
}

/// gik = GI [NAI] #

export interface Gik extends Span {
	type: "gik";
	gi: TokenIndex;
	nai: TokenIndex | undefined;
	frees: Free[];
}

/// tag = tense-modal [joik-jek tense-modal] ...

export interface Tag extends Span {
	type: "tag";
	first: TenseModal;
	// TODO: [joik-jek tense-modal] ...
}

/// stag = simple-tense-modal [(jek | joik) simple-tense-modal] ...

export interface Stag extends Span {
	type: "stag";
	first: SimpleTenseModal;
	// TODO: joik/jek
}

/// tense-modal = simple-tense-modal # | FIhO # selbri /FEhU#/

export interface TenseModal extends Span {
	type: "tense-modal";
	first: SimpleTenseModal;
	frees: Free[];
	// TODO: | FIhO # selbri /FEhU#/
}

/// simple-tense-modal =
///     [NAhE] [SE] BAI [NAI] [KI]
///     | [NAhE] (time [space] | space [time]) & CAhA [KI]
///     | KI
///     | CUhE

export type SimpleTenseModal = StmBai | StmTense | StmCmavo;

export interface StmBai extends Span {
	type: "stm-bai";
	nahe: TokenIndex | undefined;
	se: TokenIndex | undefined;
	bai: TokenIndex;
	nai: TokenIndex | undefined;
	ki: TokenIndex | undefined;
}

export interface StmTense extends Span {
	type: "stm-tense";
	nahe: TokenIndex | undefined;
	tense: Timespace | Spacetime | undefined;
	caha: TokenIndex | undefined;
	ki: TokenIndex | undefined;
}

export interface StmCmavo extends Span {
	type: "stm-cmavo";
	kiOrCuhe: TokenIndex;
}

export interface Timespace extends Span {
	type: "timespace";
	time: Time;
	space: Space | undefined;
}

export interface Spacetime extends Span {
	type: "spacetime";
	space: Space;
	time: Time | undefined;
}

/// time = ZI & time-offset ... & ZEhA [PU [NAI]] & interval-property ...

export interface Time extends Span {
	type: "time";
	zi: CmavoWithFrees | undefined;
	timeOffsets: TimeOffset[];
	zehapu: Zehapu | undefined;
	intervalProperties: IntervalProperty[];
}

export interface Zehapu extends Span {
	type: "zehapu";
	zeha: TokenIndex;
	pu: TokenIndex | undefined;
	nai: TokenIndex | undefined;
}

/// time-offset = PU [NAI] [ZI]

export interface TimeOffset extends Span {
	type: "time-offset";
	pu: TokenIndex;
	nai: TokenIndex | undefined;
	zi: TokenIndex | undefined;
}

/// space = VA & space-offset ... & space-interval & (MOhI space-offset)

export interface Space extends Span {
	type: "space";
	va: CmavoWithFrees | undefined;
	spaceOffsets: SpaceOffset[];
	spaceIntervals: SpaceInterval[];
	motion: Motion | undefined;
}

export interface Motion extends Span {
	type: "motion";
	mohi: TokenIndex;
	spaceOffset: SpaceOffset | undefined;
}

/// space-offset = FAhA [NAI] [VA]

export interface SpaceOffset extends Span {
	type: "space-offset";
	faha: TokenIndex;
	nai: TokenIndex | undefined;
	va: TokenIndex | undefined;
}

/// space-interval = ((VEhA & VIhA) [FAhA [NAI]]) & space-int-props

export interface SpaceInterval extends Span {
	type: "space-interval";
	vxha: Vxha | undefined;
	spaceIntProps: SpaceIntProp[];
}

export interface Vxha extends Span {
	type: "vxha";
	veha: TokenIndex | undefined;
	viha: TokenIndex | undefined;
	faha: TokenIndex | undefined;
	nai: TokenIndex | undefined;
}

/// space-int-props = (FEhE interval-property) ...

export interface SpaceIntProp extends Span {
	type: "space-int-prop";
	fehe: TokenIndex;
	intervalProperty: IntervalProperty;
}

/// interval-property = number ROI [NAI] | TAhE [NAI] | ZAhO [NAI]

export type IntervalProperty = IpRoi | IpCmavo;

export interface IpRoi extends Span {
	type: "interval-property-roi";
	number: Namcu;
	roi: TokenIndex;
	nai: TokenIndex | undefined;
}

export interface IpCmavo extends Span {
	type: "interval-property-cmavo";
	taheOrZaho: TokenIndex;
	nai: TokenIndex | undefined;
}

/// free =
///     SEI # [terms [CU #]] selbri /SEhU/
///     | SOI # sumti [sumti] /SEhU/
///     | vocative [relative-clauses] selbri [relative-clauses] /DOhU/
///     | vocative [relative-clauses] CMENE ... # [relative-clauses] /DOhU/
///     | vocative [sumti] /DOhU/
///     | (number | lerfu-string) MAI
///     | TO text /TOI/
///     | XI # (number | lerfu-string) /BOI/
///     | XI # VEI # mex /VEhO/

/// vocative =
///     (COI [NAI]) ... & DOI

/// indicators =
///     [FUhE] indicator ...

/// indicator =
///     (UI | CAI) [NAI]
///     | Y
///     | DAhO
///     | FUhO

export type Free =
	| Indicator // slight simplification
	| FreeSei
	| FreeVocative
	| FreeMai
	| FreeTo
	| FreeXi; // TODO: FreeSoi

export interface Indicator extends Span {
	type: "indicator";
	indicator: TokenIndex;
	nai: TokenIndex | undefined;
}

export interface FreeSei extends Span {
	type: "free-sei";
	sei: CmavoWithFrees;
	terms: Terms<Positional>;
	cu: CmavoWithFrees | undefined;
	selbri: Selbri;
	sehu: TokenIndex | undefined;
}

export interface FreeSoi extends Span {
	type: "free-soi";
	soi: CmavoWithFrees;
	sumti: Sumti<Floating>;
	otherSumti: Sumti<Floating> | undefined;
	sehu: TokenIndex | undefined;
}

export interface FreeVocative extends Span {
	type: "free-vocative";
	vocative: Vocative;
	relativeClauses: RelativeClauses | undefined;
	argument: Selbri | Sumti<Floating> | Cmene;
	relativeClauses2: RelativeClauses | undefined;
	dohu: TokenIndex | undefined;
}

export interface Vocative extends Span {
	type: "vocative";
	coinais: Coinai[];
	doi: TokenIndex | undefined;
}

export interface Coinai extends Span {
	type: "coinai";
	coi: TokenIndex;
	nai: TokenIndex | undefined;
}

export interface FreeMai extends Span {
	type: "free-mai";
	ordinal: Namcu | LerfuString;
	mai: TokenIndex;
}

export interface FreeTo extends Span {
	type: "free-to";
	to: TokenIndex;
	text: Text;
	toi: TokenIndex | undefined;
}

export interface FreeXi extends Span {
	type: "free-xi";
	xi: CmavoWithFrees;
	ordinal: Namcu | LerfuString;
	boi: TokenIndex | undefined;
}

export interface CmavoWithFrees extends Span {
	type: "cmavo-with-frees";
	cmavo: TokenIndex;
	frees: Free[];
}

export interface BrivlaWithFrees extends Span {
	type: "brivla-with-frees";
	brivla: TokenIndex;
	frees: Free[];
}
