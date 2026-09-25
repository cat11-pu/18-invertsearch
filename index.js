// index.js：倒排索引，词项 -> 文档编号 -> 位置列表（位置从 0 起、升序）
export function tokenize(text) {
  return String(text == null ? "" : text).split(" ");
}

export function buildDocs(docs) {
  const postings = {};
  let positions = 0;
  const seen = new Set();
  for (const doc of docs) {
    if (seen.has(doc.id)) {
      const error = new Error("duplicate document id: " + doc.id);
      error.code = "E_DUP_ID";
      throw error;
    }
    seen.add(doc.id);
    let pos = 0;
    for (const word of tokenize(doc.text)) {
      const perDoc = postings[word] || (postings[word] = {});
      const list = perDoc[doc.id] || (perDoc[doc.id] = []);
      list.push(pos);
      positions += 1;
      pos += 1;
    }
  }
  return { postings, positions };
}
