import type { Span, TokenIndex } from "./grammar";
import type { Token } from "./tokenize";

type HasIndex = Span | Token | TokenIndex | undefined | HasIndex[];

export function startOf(...spans: HasIndex[]): TokenIndex {
	for (const span of spans) {
		if (typeof span === "number") return span;
		if (span === undefined) continue;
		if (Array.isArray(span)) {
			const inner = startOf(...span);
			if (inner === Number.POSITIVE_INFINITY) continue;
			return inner;
		}
		if ("index" in span) return span.index;
		return span.start;
	}
	return Number.POSITIVE_INFINITY;
}

export function endOf(...spans: HasIndex[]): TokenIndex {
	console.log("endOf before", spans);
	for (let i = spans.length - 1; i >= 0; i--) {
		const span = spans[i];
		console.log("endOf", i, span);
		if (typeof span === "number") return span;
		if (span === undefined) continue;
		if (Array.isArray(span)) {
			const inner = endOf(...span);
			if (inner === Number.NEGATIVE_INFINITY) continue;
			return inner;
		}
		if ("index" in span) return span.index;
		return span.end;
	}
	console.log("endOf", spans);
	return Number.NEGATIVE_INFINITY;
}

export function spanOf(...spans: HasIndex[]): Span {
	return {
		start: startOf(spans),
		end: endOf(spans),
	};
}
