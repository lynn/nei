import { useMemo, useState } from "preact/hooks";
import "./app.css";
import { TextBox, TokenContext } from "./boxes";
import { type ParseResult, parse, type Snapshot } from "./parse";
import { type Token, Tokenizer } from "./tokenize";
import { score } from "./jvotci";

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
			<div className="whitespace-pre text-xs my-2">
				{snapshots[i].state.join("\n")}
			</div>
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
		<div class="mb-8">
			<div class="input mb-4 italic">
				<pre>{props.input}</pre>
			</div>
			<div class="output ml-4">
				<ShowParseResult output={props.output} />
			</div>
		</div>
	);
}

export function App() {
	const [ios, setIos] = useState<IoProps[]>([]);
	const [input, setInput] = useState(
		".i ji'a ma prali fi lo cukta poi vasru no lo pixra",
	);
	const output = useMemo(() => parse(new Tokenizer().tokenize(input)), [input]);

	return (
		<div class="flex flex-col min-h-screen p-4">
			<h1 class="text-3xl font-bold">🔬 la nei {score("bra")}</h1>
			<div class="mb-8">sei gerna lanli tutci</div>
			<div class="io-list">
				{ios.map((io, index) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: static data
					<Io input={io.input} output={io.output} key={index} />
				))}
			</div>
			<div class="input">
				<input
					class="border border-gray-300 rounded p-2 w-full"
					autofocus
					type="text"
					value={input}
					onInput={(e) => setInput(e.currentTarget.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") {
							e.preventDefault();
							const input = e.currentTarget.value;
							if (input.trim() === "") return;
							setInput("");
							const tokens = new Tokenizer().tokenize(input);
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
			<ShowParseResult output={output} />
		</div>
	);
}
