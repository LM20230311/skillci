/*!
 * Adapted from github/codeql-action src/fingerprints.ts, commit
 * 33d7b85da1a04171e211befe2c739303b9a4c066. Uses native BigInt instead of Long.
 *
 * MIT License
 *
 * Copyright (c) 2020 GitHub
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
/** GitHub-compatible primaryLocationLineHash values, indexed by 1-based line. */
export function githubLineFingerprints(source) {
    const size = 100;
    const window = new Uint32Array(size);
    const lines = new Array(size).fill(-1);
    const firstMod = BigInt.asUintN(64, 37n ** BigInt(size));
    const counts = new Map();
    const result = new Map();
    let value = 0n;
    let index = 0;
    let line = 0;
    let lineStart = true;
    let previousCR = false;
    const output = () => {
        const hex = value.toString(16);
        const occurrence = (counts.get(hex) ?? 0) + 1;
        counts.set(hex, occurrence);
        result.set(lines[index], `${hex}:${occurrence}`);
        lines[index] = -1;
    };
    const update = (character) => {
        value = BigInt.asUintN(64, 37n * value + BigInt(character) - firstMod * BigInt(window[index]));
        window[index] = character;
        index = (index + 1) % size;
    };
    const consume = (character) => {
        // Match upstream UTF-16 code units, whitespace and CR/LF handling exactly.
        if (character === 32 || character === 9 || (previousCR && character === 10)) {
            previousCR = false;
            return;
        }
        previousCR = character === 13;
        if (previousCR)
            character = 10;
        if (lines[index] !== -1)
            output();
        if (lineStart) {
            lineStart = false;
            lines[index] = ++line;
        }
        if (character === 10)
            lineStart = true;
        update(character);
    };
    for (let i = 0; i < source.length; i++)
        consume(source.charCodeAt(i));
    consume(65535); // Upstream EOF marker, followed by 100 zero-padding code units.
    for (let i = 0; i < size; i++) {
        if (lines[index] !== -1)
            output();
        update(0);
    }
    return result;
}
//# sourceMappingURL=sarif-fingerprints.js.map