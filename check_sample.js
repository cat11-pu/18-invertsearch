import fs from "node:fs";
import { buildDocs } from "./index.js";
import { phrase, applyUpdate } from "./search.js";
import { render } from "./app.js";

const spec = JSON.parse(fs.readFileSync(process.argv[2] || "sample/docs.json", "utf8"));
const index = buildDocs(spec.docs);
const hits = phrase(index, spec.phrases || []);
const delta = applyUpdate(index, spec.docs, spec.update || null);
const out = render(spec);

console.log("词项数 =", out.terms);
console.log("位置条目数 =", index.positions);
console.log("每个短语命中的文档 =", JSON.stringify(hits));
console.log("增量更新触及的文档数 =", delta.rebuilt);
console.log("增量更新改动的位置条目数 =", delta.touched);
console.log("增量结果与全量重建一致 =", spec.consistent);
console.log("重复文档编号的错误码 =", spec.dup_code);
