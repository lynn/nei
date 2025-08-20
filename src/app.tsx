import { useMemo, useState } from "preact/hooks";
import "./app.css";
import { TextBox, TokenContext } from "./boxes";
import type { Text } from "./grammar";
import { type ParseResult, parse, type Snapshot } from "./parse";
import { Toggle } from "./Toggle";
import { type Token, Tokenizer } from "./tokenize";

interface IoProps {
	input: string;
	output: ParseResult;
}

export function SnapshotToken({
	token,
	snapshot,
}: {
	token: Token;
	snapshot: Snapshot;
}) {
	let classes = "px-1";

	if (
		snapshot.completed &&
		token.index >= snapshot.completed.start &&
		token.index <= snapshot.completed.end
	)
		classes += " bg-blue-300";
	if (snapshot.index === token.index) classes += " outline";
	return <span class={classes}>{token.lexeme}</span>;
}

export function ShowSnapshots({
	tokens,
	snapshots,
}: {
	tokens: Token[];
	snapshots: Snapshot[];
}) {
	const [i, setI] = useState(0);

	return (
		<div className="flex flex-col gap-2 items-start my-8 mx-8">
			<input
				type="range"
				value={i}
				min={0}
				max={snapshots.length - 1}
				onChange={(e) => setI(+e.currentTarget.value)}
				onMouseMove={(e) => setI(+e.currentTarget.value)}
			/>
			<div className="flex flex-row font-mono">
				{tokens.map((token) => (
					<SnapshotToken
						key={token.index}
						token={token}
						snapshot={snapshots[i]}
					/>
				))}
			</div>
			<div className="whitespace-pre text-xs font-bold">
				{snapshots[i].breadcrumbs.join(" > ") || " "}
			</div>
			<div className="whitespace-pre text-xs">{snapshots[i].state || " "}</div>
		</div>
	);
}

export function ShowParseResult({ output }: { output: ParseResult }) {
	if (!output.success) {
		return (
			<div class="px-4 py-2">
				<div class="parse-result flex flex-col gap-2">
					{output.error.message}
					{output.consumed && (
						<TokenContext.Provider value={output.tokens}>
							<TextBox text={output.consumed} remainder={output.remainder} />
						</TokenContext.Provider>
					)}
					<ShowSnapshots tokens={output.tokens} snapshots={output.snapshots} />
				</div>
			</div>
		);
	}
	return (
		<div class="px-4 py-2">
			<div class="parse-result">
				<TokenContext.Provider value={output.tokens}>
					<TextBox text={output.text} />
				</TokenContext.Provider>
				<ShowSnapshots tokens={output.tokens} snapshots={output.snapshots} />
			</div>
		</div>
	);
}

export function Io(props: IoProps) {
	return (
		<div class="mb-8 border-gray-200 border-2 rounded">
			<div class="input mb-4 italic bg-gray-200 p-2">
				<pre>{props.input}</pre>
			</div>
			<div class="output ml-4">
				<ShowParseResult output={props.output} />
			</div>
		</div>
	);
}

export function describeText(text: Text): string {
	return `${text.text1.paragraphs.length} paragraph${
		text.text1.paragraphs.length === 1 ? "" : "s"
	}`;
}

export function PreviewParseResult({ output }: { output: ParseResult }) {
	if (output.success) {
		return (
			<div>
				parsed {describeText(output.text)} in {output.time.toFixed(0)}ms
			</div>
		);
	} else {
		return <div>{output.error.message}</div>;
	}
}

export function App() {
	const [ios, setIos] = useState<IoProps[]>([]);
	const [input, setInput] = useState("");
	const [showSnapshots, setShowSnapshots] = useState(false);
	const [cmevlaBrivlaMerger, setCmevlaBrivlaMerger] = useState(false);
	const output = useMemo(
		() => parse(new Tokenizer({ cmevlaBrivlaMerger }).tokenize(input)),
		[input, cmevlaBrivlaMerger],
	);
	const inputClass = `border-b p-1 w-full border-gray-300 ${output.success ? "focus:border-blue-500" : "focus:border-red-500"} focus:border-b-2 focus:outline-none`;

	return (
		<div class="flex flex-col min-h-screen">
			<header class="flex flex-row items-baseline gap-4 p-4 bg-violet-950 text-white">
				<h1 class="text-3xl font-bold">la nei</h1>
				<div class="opacity-75">
					recursive Lojban parser — code on{" "}
					<a class="underline" href="https://github.com/lynn/nei">
						GitHub
					</a>
				</div>
			</header>
			<header class="p-4 bg-purple-200 sticky top-0 z-10 border-b">
				<div class="grid grid-cols-2 gap-2 max-w-screen-sm">
					<div class="flex flex-col gap-2">
						<h2 class="text-2xl font-bold">Display</h2>
						<div class="flex flex-row">
							<Toggle
								label="Show snapshots"
								checked={showSnapshots}
								onChange={setShowSnapshots}
							/>
						</div>
					</div>
					<div class="flex flex-col gap-2">
						<h2 class="text-2xl font-bold">Language</h2>
						<div class="flex flex-row">
							<Toggle
								label="cmevla-brivla merger"
								checked={cmevlaBrivlaMerger}
								onChange={setCmevlaBrivlaMerger}
							/>
						</div>
					</div>
				</div>
			</header>
			<main class="p-4">
				<h2 class="text-2xl font-bold pb-2">Parser</h2>
				<div class="io-list">
					{ios.map((io, index) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: static data
						<Io input={io.input} output={io.output} key={index} />
					))}
				</div>
				<div class="input flex flex-row items-baseline gap-2 font-mono">
					<span class="text-gray-500">&gt;&gt;&gt;</span>
					<input
						class={inputClass}
						autofocus
						placeholder=".i mi klama lo zarci"
						type="text"
						value={input}
						onInput={(e) => setInput(e.currentTarget.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								const input = e.currentTarget.value;
								if (input.trim() === "") return;
								setInput("");
								const tokens = new Tokenizer({
									cmevlaBrivlaMerger,
								}).tokenize(input);
								const output = parse(tokens);
								setIos((prev) => [...prev, { input, output }]);
								// Scroll to the bottom
								window.scrollTo({
									top: document.documentElement.scrollHeight,
								});
							}
						}}
					/>
				</div>
				{/* <div class="pt-4 text-sm">
					<PreviewParseResult output={output} />
				</div> */}
			</main>
		</div>
	);
}
