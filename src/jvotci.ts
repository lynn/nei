import {
	analyseBrivla as analyseBrivlaThrow,
	type BrivlaType,
	NotBrivlaError,
} from "latkerlo-jvotci";

export type BrivlaProblem = string;

export function analyseBrivla(
	brivla: string,
):
	| { success: true; type: BrivlaType; parts: string[] }
	| { success: false; brivla: string; problem: BrivlaProblem } {
	try {
		const result = analyseBrivlaThrow(brivla);
		return { success: true, type: result[0], parts: result[1] };
	} catch (e) {
		if (e instanceof NotBrivlaError) {
			return { success: false, brivla, problem: e.message };
		} else {
			throw e;
		}
	}
}
