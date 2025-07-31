import { useState } from "preact/hooks";
import "./app.css";
import { TextBox, TokenContext } from "./boxes";
import { type ParseResult, parse } from "./parse";
import { tokenize } from "./tokenize";

interface IoProps {
	input: string;
	output: ParseResult;
}

export function ShowParseResult({ output }: { output: ParseResult }) {
	if (!output.success) {
		return <div class="parse-error">Error: {output.error.message}</div>;
	}
	return (
		<div class="parse-result">
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
				<span class="text">{props.input}</span>
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
			<h1 class="text-3xl mb-8 font-bold">la sidju</h1>
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
