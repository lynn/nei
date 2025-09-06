import { expect, test } from "vitest";
import { parse } from "./parse";
import { Tokenizer } from "./tokenize";

test.each([
	".ua",
	"mi",
	".i mi gerku",
	".i by gerku",
	".i .a bu gerku",
	".ua ni'o ni'o broda ni'o brode .i brodo .ije broda brode",
	`.i ze'a lo slolecydo'i mi'a surla sakli`,
	`.i terbloga'a`,
	`.i terbloga'a catke`,
	`.i terbloga'a catke fa lo birka`,
	`.i terbloga'a catke fa lo birka be lo cmaxli`,
	`.i terbloga'a catke fa lo birka be lo cmaxli fau`,
	`.i terbloga'a catke fa lo birka be lo cmaxli fau lo nu tolcre`,
	`.i terbloga'a catke fa lo birka be lo cmaxli fau lo nu tolcre troci`,
	`.i terbloga'a catke fa lo birka be lo cmaxli fau lo nu tolcre troci lo nu gidva`,
])("parses %s", (text) => {
	const tokens = new Tokenizer({
		cmevlaBrivlaMerger: false,
	}).tokenize(text);
	const result = parse(tokens);
	expect(result.success).toBe(true);
});

test.each([
	".i gerku lo",
	".i lo lo prenu cu klama",
	"mi klama do klama",
	"kei mi klama",
])("fails to parse %s", (text) => {
	const tokens = new Tokenizer({
		cmevlaBrivlaMerger: false,
	}).tokenize(text);
	const result = parse(tokens);
	expect(result.success).toBe(false);
});
