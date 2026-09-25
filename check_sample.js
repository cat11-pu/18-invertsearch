import fs from "node:fs";
import assert from "node:assert";
import { buildDocs } from "./index.js";
import { phrase, applyUpdate } from "./search.js";
import { render } from "./app.js";

const specPath = process.argv[2] || "sample/docs.json";
const spec = JSON.parse(fs.readFileSync(specPath, "utf8"));

// 1) 更新前：建索引、短语命中
const index = buildDocs(spec.docs);
const termCount = Object.keys(index.postings).length;
const positionCount = index.positions;
const hits = phrase(index, spec.phrases || []);

// 2) 增量更新（原地）
const delta = applyUpdate(index, spec.docs, spec.update || null);

// 3) 不变量：增量结果必须与用新文档全量重建逐项一致
const rebuiltIndex = buildDocs(spec.docs);
assert.deepStrictEqual(index.postings, rebuiltIndex.postings);
assert.strictEqual(index.positions, rebuiltIndex.positions);

// 4) 异常路径：重复文档编号报 E_DUP_ID
let dupCode = null;
try {
  buildDocs([{ id: "x", text: "a" }, { id: "x", text: "b" }]);
} catch (error) {
  dupCode = error.code;
}

// 5) 浏览器渲染结构冒烟（在独立副本上，五键不变）
const out = render(JSON.parse(fs.readFileSync(specPath, "utf8")));

console.log("词项数 =", termCount);
console.log("位置条目数 =", positionCount);
console.log("每个短语命中的文档 =", JSON.stringify(hits));
console.log("增量更新触及的文档数 =", delta.rebuilt);
console.log("增量更新改动的位置条目数 =", delta.touched);
console.log("增量结果与全量重建一致 =", true);
console.log("重复文档编号的错误码 =", dupCode);

assert.strictEqual(termCount, 5);
assert.strictEqual(positionCount, 10);
assert.deepStrictEqual(hits, [["d0", "d1", "d2"], ["d0"], []]);
assert.strictEqual(delta.rebuilt, 1);
assert.strictEqual(delta.touched, 5);
assert.strictEqual(dupCode, "E_DUP_ID");
assert.deepStrictEqual(Object.keys(out).sort(), ["hits", "positions", "rebuilt", "terms", "touched"]);
console.log("验收通过");
