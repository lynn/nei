import * as camxes from "./camxes";
import { cmavo } from "./cmavo";
import { shortDescriptions } from "./gloss";
import { parse } from "./parse";
import { Tokenizer } from "./tokenize";
import { alis } from "./alis";

export function tokenPool(): string[] {
	const tokens = new Set<string>([
		...Object.keys(cmavo),
		...Object.keys(shortDescriptions).filter((g) => g.startsWith("b")),
	]);
	return Array.from(tokens);
}

const alisTokens = alis
	.split(/\s+/)
	.map((x) => x.replaceAll(/[^ .a-zA-Z']/g, ""))
	.filter((t) => t.length > 0);

export function randomSentence(length: number) {
	if (Math.random() < 0.5) {
		const start = Math.floor(Math.random() * (alisTokens.length - length));
		return alisTokens.slice(start, start + length).join(" ");
	} else {
		const tokens = tokenPool();
		const result = [];
		for (let i = 0; i < length; i++) {
			result.push(tokens[Math.floor(Math.random() * tokens.length)]);
		}
		return result.join(" ");
	}
}

export class Fuzzer {
	public fuzzes: number = 0;
	public mistakes: number = 0;
	public bothParse: number = 0;
	public bothReject: number = 0;

	public fuzzOnce() {
		const length = Math.floor(Math.random() * 10) + 2;
		const sentence = randomSentence(length);
		let ourSuccess: boolean;
		try {
			const tokens = new Tokenizer({ cmevlaBrivlaMerger: false }).tokenize(
				sentence,
			);
			ourSuccess = parse(tokens).success;
		} catch (_e) {
			ourSuccess = false;
		}

		let camxesSuccess: boolean;
		try {
			camxes.parse(sentence);
			camxesSuccess = true;
		} catch (e) {
			// console.log(e);
			camxesSuccess = false;
		}

		this.fuzzes++;
		if (ourSuccess) {
			if (camxesSuccess) {
				this.bothParse++;
			} else {
				this.mistakes++;
				console.log("we parse, camxes rejects:", sentence);
			}
		} else {
			if (camxesSuccess) {
				this.mistakes++;
				console.log("we reject, camxes parses:", sentence);
			} else {
				this.bothReject++;
			}
		}
	}
}
