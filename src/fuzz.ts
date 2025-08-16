import * as camxes from "./camxes";
import { cmavo } from "./cmavo";
import { shortDescriptions } from "./gloss";
import { parse } from "./parse";
import { Tokenizer } from "./tokenize";

export function tokenPool(): string[] {
	const tokens = new Set<string>([
		...Object.keys(cmavo),
		...Object.keys(shortDescriptions).filter((g) => g.startsWith("b")),
	]);
	return Array.from(tokens);
}

export function randomSentence(length: number) {
	const tokens = tokenPool();
	const result = [];
	for (let i = 0; i < length; i++) {
		result.push(tokens[Math.floor(Math.random() * tokens.length)]);
	}
	return result.join(" ");
}

export function fuzzOnce() {
	const length = Math.floor(Math.random() * 10) + 1;
	const sentence = randomSentence(length);
	let ourSuccess: boolean;
	try {
		const tokens = new Tokenizer().tokenize(sentence);
		ourSuccess = parse(tokens).success;
	} catch (_e) {
		ourSuccess = false;
	}

	let camxesSuccess: boolean;
	try {
		camxes.parse(sentence);
		camxesSuccess = true;
	} catch {
		camxesSuccess = false;
	}

	if (ourSuccess && !camxesSuccess) {
		console.log("we parse, camxes rejects:", sentence);
	} else if (!ourSuccess && camxesSuccess) {
		console.log("we reject, camxes parses:", sentence);
	}
}
