#!/usr/bin/env node

import { Fuzzer } from "./fuzz.js";

// Call fuzzOnce when the script is run directly

const fuzzer = new Fuzzer();
for (let i = 0; i < 1000; i++) {
	fuzzer.fuzzOnce();
}

console.log(`Error rate: ${(fuzzer.mistakes / fuzzer.fuzzes) * 100}%`);
