import fs from "node:fs";
import { buildDocs } from "./index.js";
import { phrase, applyUpdate } from "./search.js";
import { render } from "./app.js";

const spec = JSON.parse(fs.readFileSync(process.argv[2] || "sample/docs.json", "utf8"));
const index = buildDocs(spec.docs);
const terms = Object.keys(index.postings).length;
const positions = index.positions;
const hits = phrase(index, spec.phrases || []);
const delta = applyUpdate(index, spec.docs, spec.update || null);
const out = render(spec);

function samePostings(a, b) {
  const ka = Object.keys(a).sort(), kb = Object.keys(b).sort();
  if (JSON.stringify(ka) !== JSON.stringify(kb)) return false;
  for (const word of ka) {
    const da = Object.keys(a[word]).sort(), db = Object.keys(b[word]).sort();
    if (JSON.stringify(da) !== JSON.stringify(db)) return false;
    for (const id of da) {
      if (JSON.stringify(a[word][id]) !== JSON.stringify(b[word][id])) return false;
    }
  }
  return true;
}

// 不变量：增量更新后的索引 == 用新文档全量重建的索引
const newDocs = spec.docs.map((d) => (spec.update && d.id === spec.update.id ? spec.update : d));
if (spec.update && !spec.docs.some((d) => d.id === spec.update.id)) newDocs.push(spec.update);
const fresh = buildDocs(newDocs);
const consistent = samePostings(index.postings, fresh.postings) && index.positions === fresh.positions;

// 异常路径：重复文档编号必须报 E_DUP_ID
let dupCode = null;
try {
  buildDocs([{ id: "dup", text: "a" }, { id: "dup", text: "b" }]);
} catch (error) {
  dupCode = error.code;
}

console.log("词项数 =", terms);
console.log("位置条目数 =", positions);
console.log("每个短语命中的文档 =", JSON.stringify(hits));
console.log("增量更新触及的文档数 =", delta.rebuilt);
console.log("增量更新改动的位置条目数 =", delta.touched);
console.log("增量结果与全量重建一致 =", consistent ? "True" : "False");
console.log("重复文档编号的错误码 =", dupCode);
