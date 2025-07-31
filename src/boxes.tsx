/** biome-ignore-all lint/suspicious/noArrayIndexKey: Lots of static data */

import { createContext } from "preact";
import { useContext } from "preact/hooks";
import type * as P from "./parse";
import type { Token } from "./tokenize";

export const TokenContext = createContext<Token[]>([]);

export function ShowTokens({ start, end }: { start: number; end: number }) {
	const tokens = useContext(TokenContext);
	return (
		<span className="inline-flex flex-row gap-1 items-baseline mb-1">
			{tokens.slice(start, end + 1).map((token, index) => (
				<pre class="inline-block bg-black text-white rounded px-1 tracking-tighter" key={index}>
					{token.sourceText}
				</pre>
			))}
		</span>
	);
}

export function TextBox({ text }: { text: P.Text }) {
	return <Text1Box text1={text.text1} />;
}

export function Text1Box({ text1 }: { text1: P.Text1 }) {
	return (
		<div className="box row">
			<b>text</b>
			{text1.i && (
				<div className="box col bg-green-100">
					<b>separator</b>
					<ShowTokens start={text1.i.start} end={text1.i.end} />
				</div>
			)}
			{text1.paragraphs.map((paragraph, index) => (
				<ParagraphBox key={index} paragraph={paragraph} />
			))}
		</div>
	);
}
export function ParagraphBox({ paragraph }: { paragraph: P.Paragraph }) {
	return (
		<div className="box col">
			<b>paragraph</b>
			{paragraph.niho && (
				<div className="box col bg-green-100">
					<b>paragraph marker </b>
					<ShowTokens start={paragraph.niho.start} end={paragraph.niho.end} />
				</div>
			)}
			<div className="row">
				<ItemBox
					item={{
						type: "item",
						i: undefined,
						tem: paragraph.first,
						start: paragraph.start,
						end: paragraph.end,
					}}
				/>
			</div>
			{paragraph.rest.map((item, index) => (
				<div className="row" key={index}>
					<ItemBox item={item} />
				</div>
			))}
		</div>
	);
}

export function ItemBox({ item }: { item: P.Item }) {
	return (
		<div className="row">
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

export function FragmentBox({ fragment }: { fragment: P.Fragment }) {
	return <SumtiBox sumti={fragment} />;
}

export function StatementBox({ statement }: { statement: P.Statement }) {
	return <Statement1Box statement1={statement.statement1} />;
}

export function Statement1Box({ statement1 }: { statement1: P.Statement1 }) {
	return <Statement2Box statement2={statement1.first} />;
}

export function Statement2Box({ statement2 }: { statement2: P.Statement2 }) {
	return <Statement3Box statement3={statement2.first} />;
}

export function Statement3Box({ statement3 }: { statement3: P.Statement3 }) {
	return <SentenceBox sentence={statement3.sentence} />;
}

export function SentenceBox({ sentence }: { sentence: P.Sentence }) {
	return (
		<div className="box row">
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
	bridiTail: P.BridiTail<P.Positional>;
}) {
	return <BridiTail1Box bridiTail1={bridiTail.first} />;
}

export function BridiTail1Box({
	bridiTail1,
}: {
	bridiTail1: P.BridiTail1<P.Positional>;
}) {
	return <BridiTail2Box bridiTail2={bridiTail1.first} />;
}

export function BridiTail2Box({
	bridiTail2,
}: {
	bridiTail2: P.BridiTail2<P.Positional>;
}) {
	return <BridiTail3Box bridiTail3={bridiTail2.first} />;
}

export function BridiTail3Box({
	bridiTail3,
}: {
	bridiTail3: P.BridiTail3<P.Positional>;
}) {
	return (
		<div className="row">
			<SelbriBox selbri={bridiTail3.selbri} />
			<TailTermsBox tailTerms={bridiTail3.tailTerms} />
		</div>
	);
}

export function SelbriBox({ selbri }: { selbri: P.Selbri }) {
	return (
		<div className="box col bg-blue-100">
			<b>selbri</b>
			<ShowTokens start={selbri.start} end={selbri.end} />
		</div>
	);
}

export function TailTermsBox({
	tailTerms,
}: {
	tailTerms: P.TailTerms<P.Positional>;
}) {
	return (
		<div className="row">
			{tailTerms.terms && <TermsBox terms={tailTerms.terms} />}
			{tailTerms.vau && (
				<ShowTokens start={tailTerms.vau.start} end={tailTerms.vau.end} />
			)}
		</div>
	);
}

export function CmavoWithFreesBox({ cmavo }: { cmavo: P.CmavoWithFrees }) {
	return (
		<div className="box col bg-green-100">
			<b>cmavo</b>
			<ShowTokens start={cmavo.start} end={cmavo.end} />
			{cmavo.frees && (
				<div className="frees">
					<b>frees:</b>{" "}
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

export function TermsBox({ terms }: { terms: P.Terms<P.Positional> }) {
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
	term: P.Term<P.Positional> | P.Term<P.Floating>;
}) {
	return <SumtiBox sumti={term} />;
}

export function SumtiBox({
	sumti,
}: {
	sumti: P.Sumti<P.Positional> | P.Sumti<P.Floating>;
}) {
	const tokens = useContext(TokenContext);
	return (
		<div className="box col bg-amber-100">
			{sumti.role ? (
				<b>
					x<sub>{sumti.role.xIndex}</sub> of{" "}
					{sumti.role.verbs
						.map((verb) =>
							tokens
								.slice(verb.start, verb.end + 1)
								.map((token) => token.sourceText)
								.join(" "),
						)
						.join(", ")}
				</b>
			) : (
				<b>noun</b>
			)}
			<div className="row">
				<ShowTokens start={sumti.start} end={sumti.end} />
				<div className="terminator">
					{sumti.terminator && (
						<small>
							<ShowTokens start={sumti.terminator} end={sumti.terminator} />
						</small>
					)}
				</div>
			</div>
		</div>
	);
}
