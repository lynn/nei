import { expect, test } from "vitest";
import { Preparser } from "./preparse";
import { Tokenizer } from "./tokenize";

test("BY BY A BU should become a LerfuString", () => {
	const tokenizer = new Tokenizer({
		cmevlaBrivlaMerger: false,
	});

	const tokens = tokenizer.tokenize("by by .a bu");
	const preparser = new Preparser(tokens);
	const preparsed = preparser.preparse();

	expect(preparsed).toHaveLength(1);

	expect(preparsed[0].selmaho).toBe("lerfu-string");
	expect(preparsed[0].preparsed?.type).toBe("lerfu-string");

	const lerfuString = preparsed[0].preparsed as any as {
		first: { type: string };
		rest: { type: string }[];
	};
	expect(lerfuString.first.type).toBe("lerfu-word");
	expect(lerfuString.rest).toHaveLength(2);
	expect(lerfuString.rest[0].type).toBe("lerfu-word");
	expect(lerfuString.rest[1].type).toBe("lerfu-word");
});

test("Single BY should become a LerfuString with empty rest", () => {
	const tokenizer = new Tokenizer({
		cmevlaBrivlaMerger: false,
	});

	const tokens = tokenizer.tokenize("BY");
	const preparser = new Preparser(tokens);
	const preparsed = preparser.preparse();

	expect(preparsed).toHaveLength(1);
	expect(preparsed[0].selmaho).toBe("lerfu-string");

	const lerfuString = preparsed[0].preparsed as any as {
		first: { type: string };
		rest: { type: string }[];
	};
	expect(lerfuString.first.type).toBe("lerfu-word");
	expect(lerfuString.rest).toHaveLength(0);
});

test("BY PA BY should become a LerfuString with PA and BY in rest", () => {
	const tokenizer = new Tokenizer({
		cmevlaBrivlaMerger: false,
	});

	const tokens = tokenizer.tokenize("BY PA BY");
	const preparser = new Preparser(tokens);
	const preparsed = preparser.preparse();

	expect(preparsed).toHaveLength(1);
	expect(preparsed[0].selmaho).toBe("lerfu-string");

	const lerfuString = preparsed[0].preparsed as any as {
		first: { type: string };
		rest: { type: string }[];
	};
	expect(lerfuString.first.type).toBe("lerfu-word");
	expect(lerfuString.rest).toHaveLength(2);
	expect(lerfuString.rest[0].type).toBe("pa");
	expect(lerfuString.rest[1].type).toBe("lerfu-word");
});
