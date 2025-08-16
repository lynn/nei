#!/usr/bin/env node

import { fuzzOnce } from "./fuzz.js";

// Call fuzzOnce when the script is run directly

for (let i = 0; i < 1000; i++) {
	fuzzOnce();
}
