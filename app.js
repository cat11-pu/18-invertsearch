// app.js：渲染结果
import { buildDocs } from "./index.js";
import { phrase, applyUpdate } from "./search.js";

export function render(spec) {
  const index = buildDocs(spec.docs);
  const hits = phrase(index, spec.phrases || []);
  const delta = applyUpdate(index, spec.docs, spec.update || null);
  return { terms: Object.keys(index.postings).length, positions: index.positions,
           hits: hits, rebuilt: delta.rebuilt, touched: delta.touched };
}
