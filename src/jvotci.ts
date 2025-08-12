export type BrivlaType =
	| "GISMU"
	| "ZIhEVLA"
	| "LUJVO"
	| "EXTENDED_LUJVO"
	| "RAFSI"
	| "CMEVLA";

export type BrivlaProblem = string;

declare global {
	interface Window {
		score(rafsi: string): number;
		analyseBrivla(brivla: string): [BrivlaType, string[]];
		VALID: string[];
		INITIAL: string[];
	}
	class NotBrivlaError extends Error {}
}

export const score = window.score;
export const validConsonantClusters = window.VALID;
export const validInitialClusters = window.INITIAL;

export function analyseBrivla(
	brivla: string,
):
	| { success: true; type: BrivlaType; parts: string[] }
	| { success: false; brivla: string; problem: BrivlaProblem } {
	try {
		const result = window.analyseBrivla(brivla);
		return { success: true, type: result[0], parts: result[1] };
	} catch (e) {
		if (e instanceof NotBrivlaError) {
			return { success: false, brivla, problem: e.message };
		} else {
			throw e;
		}
	}
}
