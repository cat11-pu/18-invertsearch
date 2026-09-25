import assert from "node:assert";
import { buildDocs } from "../index.js";
import { phrase, applyUpdate } from "../search.js";
import { render } from "../app.js";

let failed = 0;
function check(name, fn) {
  try { fn(); console.log("ok   " + name); } catch (e) { failed += 1; console.log("FAIL " + name + " :: " + e.message); }
}

const docs = [{ id: "d0", text: "a b" }];

check("buildDocs returns postings", () => {
  assert.ok(typeof buildDocs(docs).postings === "object");
});

check("buildDocs counts positions", () => {
  assert.strictEqual(typeof buildDocs(docs).positions, "number");
});

check("phrase returns one list per query", () => {
  assert.strictEqual(phrase(buildDocs(docs), [["a", "b"]]).length, 1);
});

check("applyUpdate reports touched", () => {
  assert.strictEqual(typeof applyUpdate(buildDocs(docs), docs, null).touched, "number");
});

check("render exposes terms count", () => {
  assert.strictEqual(typeof render({ docs: docs, phrases: [] }).terms, "number");
});

console.log("5 cases, " + failed + " failed");
process.exit(failed === 0 ? 0 : 1);
