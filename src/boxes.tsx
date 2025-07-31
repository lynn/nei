/** biome-ignore-all lint/suspicious/noArrayIndexKey: Lots of static data */

import { createContext } from "preact";
import { useContext } from "preact/hooks";
import type * as G from "./grammar";
import { Parser } from "./parse";
import type { Token } from "./tokenize";

export const TokenContext = createContext<Token[]>([]);

export function ShowTokens({ start, end }: { start: number; end: number }) {
	const tokens = useContext(TokenContext);
	return (
		<span className="inline-flex flex-row gap-2 items-baseline mb-1">
			{tokens.slice(start, end + 1).map((token, index) => (
				<div className="inline-flex flex-col">
					<pre
						class="inline-block tracking-tighter"
						style={{
							color:
								token.lexeme === "bisladru"
									? "#e03000"
									: new Parser([]).isTenseSelmaho(token.selmaho)
										? "#c00080"
										: "black",
						}}
						key={index}
					>
						{token.sourceText}
					</pre>
				</div>
			))}
		</span>
	);
}

export function ShowSpan({ span }: { span: G.Span }) {
	if (span.start <= span.end)
		return <ShowTokens start={span.start} end={span.end} />;
	return (
		<span>
			Empty span: {span.start}—{span.end}
		</span>
	);
}

export function TextBox({ text }: { text: G.Text }) {
	return <Text1Box text1={text.text1} />;
}

export function Text1Box({ text1 }: { text1: G.Text1 }) {
	return (
		<div className="row">
			{text1.firstSeparator && (
				<div className="box col bg-green-100">
					<b>separator</b>
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
		<div className="box col bg-gray-200 outline-none">
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
				{paragraph.rest.map((item, index) => (
					<ItemBox item={item} />
				))}
			</div>
		</div>
	);
}

export function ItemBox({ item }: { item: G.Item }) {
	return (
		<div className="row box bg-white outline-none">
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
	return <SumtiBox sumti={fragment} />;
}

export function StatementBox({ statement }: { statement: G.Statement }) {
	return <Statement1Box statement1={statement.statement1} />;
}

export function Statement1Box({ statement1 }: { statement1: G.Statement1 }) {
	return <Statement2Box statement2={statement1.first} />;
}

export function Statement2Box({ statement2 }: { statement2: G.Statement2 }) {
	return <Statement3Box statement3={statement2.first} />;
}

export function Statement3Box({ statement3 }: { statement3: G.Statement3 }) {
	return <SentenceBox sentence={statement3.sentence} />;
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
	return <BridiTail2Box bridiTail2={bridiTail1.first} />;
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
			<SelbriBox selbri={bridiTail3.selbri} />
			<TailTermsBox tailTerms={bridiTail3.tailTerms} />
		</div>
	);
}

export function SelbriBox({ selbri }: { selbri: G.Selbri }) {
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
	tailTerms: G.TailTerms<G.Positional>;
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

export function CmavoWithFreesBox({ cmavo }: { cmavo: G.CmavoWithFrees }) {
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

export function TermsBox({ terms }: { terms: G.Terms<G.Positional> }) {
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
		<NakuBox term={term} />
	) : (
		<TaggedBox term={term} />
	);
}

export function ExplainRoleIn({
	role,
	verb,
}: {
	role: G.Positional;
	verb: G.Span;
}) {
	const tokens = useContext(TokenContext);
	const lexemes = tokens
		.slice(verb.start, verb.end + 1)
		.map((token) => token.lexeme);

	// unwrap SE
	let si = 0,
		sx = role.xIndex;
	while (true) {
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
			x<sub>{role.xIndex}</sub> of <i>{lexemes.join(" ")}</i>
			{si > 0 && (
				<span class="opacity-50">
					<br />x<sub>{sx}</sub> of <i>{lexemes.slice(si).join(" ")}</i>
				</span>
			)}
		</span>
	);
}

export function ExplainRole({ role }: { role: G.Positional }) {
	return (
		<b className="flex flex-col">
			{role.verbs.map((verb) => (
				<ExplainRoleIn role={role} verb={verb} />
			))}
		</b>
	);
}

export function SumtiBox({
	sumti,
}: {
	sumti: G.Sumti<G.Positional> | G.Sumti<G.Floating>;
}) {
	return (
		<div className="box col bg-amber-100">
			{sumti.role ? <ExplainRole role={sumti.role} /> : <b>noun</b>}
			<div className="row">
				<ShowTokens start={sumti.start} end={sumti.end} />
			</div>
		</div>
	);
}

export function NakuBox({ term }: { term: G.Naku }) {
	return (
		<div className="box col">
			<b>clause neg.</b>
			<div className="row">
				<ShowTokens start={term.start} end={term.end} />
			</div>
		</div>
	);
}

export function TaggedBox({ term }: { term: G.Tagged }) {
	return (
		<div className="box col bg-purple-100">
			<b>tagged</b>
			<div className="row">
				<ShowTokens start={term.start} end={term.end} />
			</div>
		</div>
	);
}
