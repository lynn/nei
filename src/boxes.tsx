/** biome-ignore-all lint/suspicious/noArrayIndexKey: Lots of static data */

import { createContext } from "preact";
import { useContext } from "preact/hooks";
import { shortDescriptions } from "./gloss";
import type * as G from "./grammar";
import { isTenseSelmaho, type Token } from "./tokenize";

export const TokenContext = createContext<Token[]>([]);

export function ShowToken({ token }: { token: Token }) {
	const gloss = shortDescriptions[token.lexeme];
	return (
		<div className="inline-flex flex-col hover:bg-black/10">
			<pre
				class="inline-block tracking-tighter"
				style={{
					color:
						token.lexeme === "bisladru"
							? "#e03000"
							: isTenseSelmaho(token.selmaho)
								? "#c00080"
								: "black",
				}}
			>
				{token.erased.length > 0 && (
					<span class="whitespace-pre opacity-50">
						<del class="line-through">{token.erased.join(" ")}</del>{" "}
					</span>
				)}
				{token.sourceText}
			</pre>
			<span className="text-xs italic font-light">{gloss || "\u00a0"}</span>
		</div>
	);
}

export function ShowTokens({ start, end }: { start: number; end: number }) {
	const tokens = useContext(TokenContext);
	return (
		<span className="inline-flex flex-row gap-2 items-baseline mb-1">
			{tokens.slice(start, end + 1).map((token, index) => (
				<ShowToken token={token} key={index} />
			))}
		</span>
	);
}

export function ShowSpan({ span }: { span: G.Span | undefined }) {
	if (!span) return undefined;
	if (span.start <= span.end)
		return <ShowTokens start={span.start} end={span.end} />;
	return (
		<span>
			Empty span: {span.start}—{span.end}
		</span>
	);
}

function spanToString(span: G.Span): string {
	const tokens = useContext(TokenContext);
	return tokens
		.slice(span.start, span.end + 1)
		.map((token) => token.lexeme)
		.join(" ");
}

export function TextBox({
	text,
	remainder,
}: {
	text: G.Text;
	remainder?: G.Span;
}) {
	return (
		<div className="row">
			{text.pretext && <PretextBox pretext={text.pretext} />}
			<Text1Box text1={text.text1} />
			{remainder !== undefined && (
				<div className="bg-red-200 px-2">
					<ShowSpan span={remainder} />
				</div>
			)}
		</div>
	);
}

export function PretextBox({ pretext }: { pretext: G.Pretext }) {
	return (
		<div className="box col outline-dotted">
			<b>pre-text</b>
			<ShowTokens start={pretext.start} end={pretext.end} />
		</div>
	);
}

export function Text1Box({ text1 }: { text1: G.Text1 }) {
	return (
		<div className="row">
			{text1.firstSeparator && (
				<div className="box col bg-green-100">
					<b>initial separator</b>
					<ShowSpan span={text1.firstSeparator} />
				</div>
			)}
			{text1.paragraphs.map((paragraph, index) => (
				<ParagraphBox key={index} paragraph={paragraph} />
			))}
		</div>
	);
}
export function ParagraphBox({ paragraph }: { paragraph: G.Paragraph }) {
	return (
		<div className="box col bg-gray-300 outline-none">
			<div className="row">
				{paragraph.niho && (
					<div className="box col bg-green-100">
						<b>separator</b>
						<ShowTokens start={paragraph.niho.start} end={paragraph.niho.end} />
					</div>
				)}
				<ItemBox
					item={{
						type: "item",
						i: undefined,
						tem: paragraph.first,
						start: paragraph.start,
						end: paragraph.end,
					}}
				/>
				{paragraph.rest.map((item) => (
					<ItemBox item={item} />
				))}
			</div>
		</div>
	);
}

export function ItemBox({ item }: { item: G.Item }) {
	return (
		<div
			className={`row box bg-gray-50 ${
				item.tem.type === "statement" ? "" : "hatch"
			} outline-none`}
		>
			{item.i && (
				<div className="box col bg-green-100">
					<b>separator</b>
					<ShowTokens start={item.i.start} end={item.i.end} />
				</div>
			)}
			{item.tem.type === "statement" ? (
				<StatementBox statement={item.tem} />
			) : (
				<FragmentBox fragment={item.tem} />
			)}
		</div>
	);
}

export function FragmentBox({ fragment }: { fragment: G.Fragment }) {
	return <TermsBox terms={fragment.terms} />;
}

export function StatementBox({ statement }: { statement: G.Statement }) {
	return <Statement1Box statement1={statement.statement1} />;
}

export function Statement1Box({ statement1 }: { statement1: G.Statement1 }) {
	return (
		<div className="row">
			<Statement2Box statement2={statement1.first} />
			{statement1.rest.map((r) => (
				<div className="row">
					<ShowSpan span={r.ijek} />
					<Statement2Box statement2={r.statement2} />
				</div>
			))}
		</div>
	);
}

export function Statement2Box({ statement2 }: { statement2: G.Statement2 }) {
	return (
		<div className="row">
			<Statement3Box statement3={statement2.first} />
			{statement2.rest.map((r) => (
				<div className="row">
					<ShowSpan span={r.ibo} />
					<Statement2Box statement2={r.statement2} />
				</div>
			))}
		</div>
	);
}

export function Statement3Box({ statement3 }: { statement3: G.Statement3 }) {
	return <SentenceBox sentence={statement3.sentence} />;
}

export function SubsentenceBox({
	subsentence,
}: {
	subsentence: G.Subsentence;
}) {
	return (
		<div className="row">
			{subsentence.prenexes.map((p) => (
				<PrenexBox prenex={p} />
			))}
			<SentenceBox sentence={subsentence.sentence} />
		</div>
	);
}

export function PrenexBox({ prenex }: { prenex: G.Prenex }) {
	return (
		<div className="row">
			<TermsBox terms={prenex.terms} />
		</div>
	);
}

export function SentenceBox({ sentence }: { sentence: G.Sentence }) {
	return (
		<div className="row">
			{sentence.terms && <TermsBox terms={sentence.terms} />}
			{sentence.cu && (
				<ShowTokens start={sentence.cu.start} end={sentence.cu.end} />
			)}
			<BridiTailBox bridiTail={sentence.bridiTail} />
		</div>
	);
}

export function BridiTailBox({
	bridiTail,
}: {
	bridiTail: G.BridiTail<G.Positional>;
}) {
	return <BridiTail1Box bridiTail1={bridiTail.first} />;
}

export function BridiTail1Box({
	bridiTail1,
}: {
	bridiTail1: G.BridiTail1<G.Positional>;
}) {
	const row = (
		<div className="row">
			<BridiTail2Box bridiTail2={bridiTail1.first} />
			{bridiTail1.rest.map((x) => (
				<GihekTailBox gihekTail={x} />
			))}
		</div>
	);
	return bridiTail1.rest.length ? (
		<div className="box outline-dotted col">
			<b>complex bridi tail</b>
			{row}
		</div>
	) : (
		row
	);
}

export function GihekTailBox({
	gihekTail,
}: {
	gihekTail: G.GihekTail<G.Positional>;
}) {
	return (
		<div className="row">
			<ShowSpan span={gihekTail.gihek} />
			<FreesBox frees={gihekTail.frees} />
			<BridiTail2Box bridiTail2={gihekTail.tail} />
			<TailTermsBox tailTerms={gihekTail.tailTerms} />
		</div>
	);
}

export function BridiTail2Box({
	bridiTail2,
}: {
	bridiTail2: G.BridiTail2<G.Positional>;
}) {
	return <BridiTail3Box bridiTail3={bridiTail2.first} />;
}

export function BridiTail3Box({
	bridiTail3,
}: {
	bridiTail3: G.BridiTail3<G.Positional>;
}) {
	return (
		<div className="row">
			<SelbriBox selbri={bridiTail3.selbri} isVerb={true} />
			<TailTermsBox tailTerms={bridiTail3.tailTerms} />
		</div>
	);
}

export function SelbriBox({
	selbri,
	isVerb,
}: {
	selbri: G.Selbri;
	isVerb: boolean;
}) {
	return (
		<div className={`box col${isVerb ? " bg-blue-100" : " outline-dotted"}`}>
			<b>selbri</b>
			<SelbriInnerBox selbri={selbri} />
		</div>
	);
}

export function SelbriInnerBox({ selbri }: { selbri: G.Selbri }) {
	return (
		<div className="row">
			{selbri.tag && <TagBox tag={selbri.tag} />}
			<Selbri1Box selbri1={selbri.selbri1} />
		</div>
	);
}

export function TagBox({ tag }: { tag: G.Tag | G.CmavoWithFrees }) {
	return <ShowSpan span={tag} />;
}

export function Selbri1Box({ selbri1 }: { selbri1: G.Selbri1 }) {
	return selbri1.type === "selbri-1-na" ? (
		<div class="row">
			<ShowSpan span={selbri1.na} />
			<SelbriInnerBox selbri={selbri1.selbri} />
		</div>
	) : (
		<Selbri2Box selbri2={selbri1.selbri2} />
	);
}

export function Selbri2Box({ selbri2 }: { selbri2: G.Selbri2 }) {
	return (
		<div class="row">
			<Selbri3Box selbri3={selbri2.selbri3} />
			<ShowSpan span={selbri2.co} />
			{selbri2.coSelbri && <Selbri2Box selbri2={selbri2.coSelbri} />}
		</div>
	);
}

export function Selbri3Box({ selbri3 }: { selbri3: G.Selbri3 }) {
	const tanru = selbri3.selbri4s;
	return (
		<div class="row">
			{tanru.map((t) => (
				<Selbri4Box selbri4={t} />
			))}
		</div>
	);
}

export function Selbri4Box({ selbri4 }: { selbri4: G.Selbri4 }) {
	return (
		<div class="row">
			<Selbri5Box selbri5={selbri4.first} />
			{selbri4.rest.map((r) => (
				<div class="row">
					<ShowSpan span={r.jk} />
					<Selbri5Box selbri5={r.selbri5} />
				</div>
			))}
		</div>
	);
}

export function Selbri5Box({ selbri5 }: { selbri5: G.Selbri5 }) {
	return (
		<div class="row">
			<Selbri6Box selbri6={selbri5.first} />
			{selbri5.rest && (
				<div class="row">
					<ShowSpan span={selbri5.rest.jk} />
					<ShowSpan span={selbri5.rest.stag} />
					<ShowSpan span={selbri5.rest.bo} />
					<Selbri5Box selbri5={selbri5.rest.selbri5} />
				</div>
			)}
		</div>
	);
}

export function Selbri6Box({ selbri6 }: { selbri6: G.Selbri6 }) {
	return selbri6.type === "selbri-6-plain" ? (
		<div class="row">
			<TanruUnitBox unit={selbri6.tanruUnit} />
			{selbri6.rest && (
				<>
					<ShowSpan span={selbri6.rest.bo} />
					<Selbri6Box selbri6={selbri6.rest.selbri6} />
				</>
			)}
		</div>
	) : (
		<div class="row">
			<ShowSpan span={selbri6.nahe} />
			<ShowSpan span={selbri6.guhek} />
			<ShowSpan span={selbri6.selbri} />
			<ShowSpan span={selbri6.gik} />
			<Selbri6Box selbri6={selbri6.selbri6} />
		</div>
	);
}

export function TanruUnitBox({ unit }: { unit: G.TanruUnit }) {
	return (
		<div class="row">
			<TanruUnit1Box unit={unit.first} />
			{unit.rest.map((r) => (
				<div class="row">
					<ShowSpan span={r.cei} />
					<TanruUnit1Box unit={r.tanruUnit1} />
				</div>
			))}
		</div>
	);
}

export function TanruUnit1Box({ unit }: { unit: G.TanruUnit1 }) {
	return (
		<div class="row">
			<TanruUnit2Box unit={unit.tanruUnit2} />
			<ShowSpan span={unit.linkargs} />
		</div>
	);
}

export function TanruUnit2Box({ unit }: { unit: G.TanruUnit2 }) {
	return unit.type === "tu-nu" ? (
		<TuNuBox unit={unit} />
	) : (
		<ShowSpan span={unit} />
	);
}

export function TuNuBox({ unit }: { unit: G.TuNu }) {
	return (
		<div class="row">
			<ShowSpan span={unit.nu} />
			<SubsentenceBox subsentence={unit.subsentence} />
			{unit.kei ? (
				<ShowSpan span={unit.kei} />
			) : (
				<i className="opacity-50 py-1">(kei)</i>
			)}
		</div>
	);
}

export function TailTermsBox({
	tailTerms,
}: {
	tailTerms: G.TailTerms<G.Positional>;
}) {
	return (
		((tailTerms.terms?.terms?.length ?? 0) > 0 ||
			tailTerms.vau !== undefined) && (
			<div className="row">
				{tailTerms.terms && <TermsBox terms={tailTerms.terms} />}
				{tailTerms.vau && (
					<ShowTokens start={tailTerms.vau.start} end={tailTerms.vau.end} />
				)}
			</div>
		)
	);
}

export function CmavoWithFreesBox({ cmavo }: { cmavo: G.CmavoWithFrees }) {
	return (
		<div className="box col bg-green-100">
			<ShowTokens start={cmavo.start} end={cmavo.end} />
			{cmavo.frees && (
				<div className="frees">
					{cmavo.frees.map((free, index) => (
						<span className="free" key={index}>
							<ShowTokens start={free.start} end={free.end} />
						</span>
					))}
				</div>
			)}
		</div>
	);
}

export function FreesBox({ frees }: { frees: G.Free[] }) {
	return (
		<>
			{frees.map((free, index) => (
				<span className="free" key={index}>
					<ShowTokens start={free.start} end={free.end} />
				</span>
			))}
		</>
	);
}

export function TermsBox({
	terms,
}: {
	terms: G.Terms<G.Positional> | G.Terms<G.Floating>;
}) {
	return (
		<div className="row">
			{terms.terms.map((term, index) => (
				<TermBox term={term} key={index} />
			))}
		</div>
	);
}

export function TermBox({
	term,
}: {
	term: G.Term<G.Positional> | G.Term<G.Floating>;
}) {
	return term.type === "sumti" ? (
		<SumtiBox sumti={term} />
	) : term.type === "naku" ? (
		<LabelBox label="clause neg." span={term} />
	) : (
		<TaggedBox span={term} />
	);
}

export function ShowXIndex({
	xIndex,
	selbri,
}: {
	xIndex: number | "fai" | "?" | "modal";
	selbri: string;
}) {
	return xIndex === "modal" ? (
		<span>
			modal to <i>{selbri}</i>
		</span>
	) : (
		<span>
			x<sub>{xIndex}</sub> of <i>{selbri}</i>
		</span>
	);
}

export function ExplainRoleIn({ role }: { role: G.Role }) {
	const tokens = useContext(TokenContext);
	const lexemes = tokens
		.slice(role.verb.start, role.verb.end + 1)
		.map((token) => token.lexeme);

	// unwrap SE
	let si = 0,
		sx = role.xIndex;
	while (typeof role.xIndex === "number") {
		if (lexemes[si] === "se") {
			sx = sx === 1 ? 2 : sx === 2 ? 1 : sx;
		} else if (lexemes[si] === "te") {
			sx = sx === 1 ? 3 : sx === 3 ? 1 : sx;
		} else if (lexemes[si] === "ve") {
			sx = sx === 1 ? 4 : sx === 4 ? 1 : sx;
		} else if (lexemes[si] === "xe") {
			sx = sx === 1 ? 5 : sx === 5 ? 1 : sx;
		} else {
			break;
		}
		si++;
	}

	return (
		<span>
			<ShowXIndex xIndex={role.xIndex} selbri={lexemes.join(" ")} />
			{si > 0 && (
				<span class="opacity-50">
					<br />
					<ShowXIndex xIndex={sx} selbri={lexemes.slice(si).join(" ")} />
				</span>
			)}
		</span>
	);
}

export function ExplainRole({ role }: { role: G.Positional }) {
	return (
		<b className="flex flex-col">
			{role.roles.map((role) => (
				<ExplainRoleIn role={role} />
			))}
		</b>
	);
}

export function LabelBox({
	label,
	span,
}: {
	label: string;
	span: G.Span | undefined;
}) {
	return (
		span && (
			<div className="box col bg-gray-50">
				<b>{label}</b>
				<div className="row">
					<ShowTokens start={span.start} end={span.end} />
				</div>
			</div>
		)
	);
}

export function SumtiBox({
	sumti,
}: {
	sumti: G.Sumti<G.Positional> | G.Sumti<G.Floating>;
}) {
	return (
		<div className="box col bg-amber-100">
			{sumti.role !== "floating" ? (
				<ExplainRole role={sumti.role} />
			) : (
				<b>sumti</b>
			)}
			<div className="row">
				<Sumti1Box span={sumti.sumti1} />
				<LabelBox label="complex relator" span={sumti.vuho} />
				{sumti.relativeClauses && (
					<RelativeClausesBox span={sumti.relativeClauses} />
				)}
			</div>
		</div>
	);
}

export function Sumti1Box({ span }: { span: G.Sumti1 }) {
	return <Sumti2Box span={span.sumti2} />;
}

export function Sumti2Box({ span }: { span: G.Sumti2 }) {
	return <Sumti3Box span={span.sumti3} />;
}

export function Sumti3Box({ span }: { span: G.Sumti3 }) {
	return <Sumti4Box span={span.sumti4} />;
}

export function Sumti4Box({ span }: { span: G.Sumti4 }) {
	return <Sumti5Box span={span.sumti5} />;
}

export function Sumti5Box({ span }: { span: G.Sumti5 }) {
	return span.type === "sumti-5-large" ? (
		<Sumti5LargeBox span={span} />
	) : (
		<Sumti5SmallBox span={span} />
	);
}

export function Sumti5SmallBox({ span }: { span: G.Sumti5Small }) {
	return (
		<div className="row">
			{span.quantifier && <ShowSpan span={span.quantifier} />}
			<SelbriBox selbri={span.selbri} isVerb={false} />
			{span.relativeClauses && (
				<RelativeClausesBox span={span.relativeClauses} />
			)}
		</div>
	);
}

export function Sumti5LargeBox({ span }: { span: G.Sumti5Large }) {
	return (
		<div className="row">
			{span.outerQuantifier && <ShowSpan span={span.outerQuantifier} />}
			<Sumti6Box span={span.sumti6} />
			{span.relativeClauses && (
				<RelativeClausesBox span={span.relativeClauses} />
			)}
		</div>
	);
}

export function Sumti6Box({ span }: { span: G.Sumti6 }) {
	return span.type === "sumti-6-le" ? (
		<Sumti6LeBox span={span} />
	) : span.type === "sumti-6-lu" ? (
		<Sumti6LuBox span={span} />
	) : (
		<ShowSpan span={span} />
	);
}

export function Sumti6LeBox({ span }: { span: G.Sumti6Le }) {
	return (
		<div className="row">
			<ShowSpan span={span.le} />
			<SumtiTailBox span={span.sumtiTail} />
			<ShowSpan span={span.ku} />
		</div>
	);
}

export function Sumti6LuBox({ span }: { span: G.Sumti6Lu }) {
	return (
		<div className="row">
			<ShowTokens start={span.lu} end={span.lu} />
			<TextBox text={span.text} />
			<ShowSpan span={span.lihu} />
		</div>
	);
}

export function SumtiTailBox({ span }: { span: G.SumtiTail }) {
	return (
		<div className="row">
			{span.owner && <Sumti6Box span={span.owner} />}
			{span.relativeClauses && (
				<RelativeClausesBox span={span.relativeClauses} />
			)}
			<SumtiTail1Box span={span.tail} />
		</div>
	);
}

export function SumtiTail1Box({ span }: { span: G.SumtiTail1 }) {
	return (
		<div className="row">
			{span.selbri && <SelbriBox selbri={span.selbri} isVerb={false} />}
			{span.relativeClauses && (
				<RelativeClausesBox span={span.relativeClauses} />
			)}
		</div>
	);
}

export function RelativeClausesBox({ span }: { span: G.RelativeClauses }) {
	return (
		<div className="row">
			<RelativeClauseBox span={span.first} />
		</div>
	);
}

export function RelativeClauseBox({ span }: { span: G.RelativeClause }) {
	return (
		<div className="box col bg-gray-50">
			<b>
				relative clause{" "}
				{span.antecedent && (
					<span>
						to <i>{spanToString(span.antecedent)}</i>
					</span>
				)}
			</b>
			<div className="row">
				<ShowSpan span={span.noi} />
				<SubsentenceBox subsentence={span.subsentence} />
				{span.kuho ? (
					<ShowSpan span={span.kuho} />
				) : (
					<i className="opacity-50 py-1">(ku'o)</i>
				)}
			</div>
		</div>
	);
}

export function TaggedBox({
	span,
}: {
	span: G.Tagged<G.Positional> | G.Tagged<G.Floating>;
}) {
	return (
		<div className="box col bg-purple-100">
			{span.role !== "floating" ? (
				<ExplainRole role={span.role} />
			) : (
				<b>tagged</b>
			)}
			<div className="row">
				<TagBox tag={span.tagOrFa} />
				{span.sumtiOrKu &&
					(span.sumtiOrKu.type === "sumti" ? (
						<SumtiBox sumti={span.sumtiOrKu} />
					) : (
						<ShowTokens start={span.sumtiOrKu.start} end={span.sumtiOrKu.end} />
					))}
			</div>
		</div>
	);
}
