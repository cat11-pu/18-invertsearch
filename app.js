// app.js：渲染结果
import { buildDocs } from "./index.js";
import { phrase, applyUpdate } from "./search.js";

export function render(spec) {
  const index = buildDocs(spec.docs);
  const hits = phrase(index, spec.phrases || []);
  const terms = Object.keys(index.postings).length;
  const positions = index.positions;
  const delta = applyUpdate(index, spec.docs, spec.update || null);
  return { terms, positions,
           hits: hits, rebuilt: delta.rebuilt, touched: delta.touched };
}
