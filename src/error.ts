import type { TokenIndex } from "./grammar";

export class ParseError extends Error {
	readonly site?: TokenIndex;
	constructor(explanation: string, site?: TokenIndex) {
		super(explanation);
		this.name = "ParseError";
		this.site = site;
	}
}

export class Unsupported extends Error {
	readonly site?: TokenIndex;
	constructor(explanation: string, site?: TokenIndex) {
		super(explanation);
		this.name = "Unsupported";
		this.site = site;
	}
}
