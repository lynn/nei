import { expect, test } from "vitest";
import { Parser } from "./parse";
import { Tokenizer } from "./tokenize";

test("parses Lojban", () => {
	const good = [
		".i mi gerku",
		`.i ze'a lo slolecydo'i mi'a surla sakli .i terbloga'a catke fa lo birka be lo cmaxli fau lo nu tolcre troci lo nu gidva co za'akli`,
	];
	const bad = [".i gerku lo"];

	for (const text of good) {
		const tokens = new Tokenizer().tokenize(text);
		const parser = new Parser(tokens);
		expect(parser.parseText()).toBeTruthy();
	}

	for (const text of bad) {
		const tokens = new Tokenizer().tokenize(text);
		const parser = new Parser(tokens);
		expect(() => parser.parseText()).toThrow();
	}
});
