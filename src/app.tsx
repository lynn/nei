import { useState } from "preact/hooks";
import "./app.css";
import { TextBox, TokenContext } from "./boxes";
import { type ParseResult, type Snapshot, parse } from "./parse";
import { tokenize, type Token } from "./tokenize";

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
		<div className="flex flex-col gap-2 items-start">
			<progress value={i} max={snapshots.length - 1} />
			<div className="flex flex-row gap-2">
				<button
					className="button"
					type="button"
					onClick={() => setI(Math.max(i - 1, 0))}
				>
					Back
				</button>
				<button
					className="button"
					type="button"
					onClick={() => setI(Math.min(i + 1, snapshots.length - 1))}
				>
					Forward
				</button>
				<button
					className="button"
					type="button"
					onClick={() => setI(Math.min(i + 10, snapshots.length - 1))}
				>
					+10
				</button>
			</div>
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
		if ("error" in output) {
			return <div class="parse-error">Error: {output.error.message}</div>;
		} else {
			return (
				<div class="px-4 py-2">
					<div class="parse-result flex flex-col gap-2">
						<ShowSnapshots
							tokens={output.tokens}
							snapshots={output.snapshots}
						/>
						The input could not be parsed.
						<TokenContext.Provider value={output.tokens}>
							<TextBox text={output.consumed} remainder={output.remainder} />
						</TokenContext.Provider>
					</div>
				</div>
			);
		}
	}
	return (
		<div class="parse-result">
			<ShowSnapshots tokens={output.tokens} snapshots={output.snapshots} />
			<TokenContext.Provider value={output.tokens}>
				<TextBox text={output.text} />
			</TokenContext.Provider>
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

	return (
		<div class="flex flex-col min-h-screen p-4">
			<h1 class="text-3xl font-bold">🔬 la taxtci</h1>
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
					value=".i ji'a ma prali fi lo cukta poi vasru no lo pixra"
					onKeyPress={(e) => {
						if (e.key === "Enter") {
							const input = e.currentTarget.value;
							if (input.trim() === "") return;
							e.currentTarget.value = "";
							const tokens = tokenize(input);
							console.log(tokens);
							const output = parse(tokens);
							console.log(output);
							setIos((prev) => [...prev, { input, output }]);
							// Scroll to the bottom
							window.scrollTo({
								top: document.documentElement.scrollHeight,
							});
						}
					}}
				/>
			</div>
		</div>
	);
}
