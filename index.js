// index.js：倒排索引，词项 -> 文档 -> 位置列表（位置从 0 起、升序）
export function tokenize(text) {
  return String(text).split(" ").filter((word) => word.length > 0);
}

export function buildDocs(docs) {
  const postings = {};
  const seen = new Set();
  let positions = 0;
  for (const doc of docs) {
    if (seen.has(doc.id)) {
      const error = new Error("duplicate doc id: " + doc.id);
      error.code = "E_DUP_ID";
      throw error;
    }
    seen.add(doc.id);
    positions += insertDoc(postings, doc);
  }
  return { postings: postings, positions: positions };
}

// 把单篇文档的词项位置写入 postings，返回新增的位置条目数
export function insertDoc(postings, doc) {
  let added = 0;
  tokenize(doc.text).forEach((word, pos) => {
    if (!postings[word]) postings[word] = {};
    const list = postings[word][doc.id] || (postings[word][doc.id] = []);
    list.push(pos);
    added += 1;
  });
  return added;
}

// 删除单篇文档的全部位置条目，返回删除的条目数
export function deleteDoc(postings, docId) {
  let removed = 0;
  for (const word of Object.keys(postings)) {
    const list = postings[word][docId];
    if (list) {
      removed += list.length;
      delete postings[word][docId];
      if (Object.keys(postings[word]).length === 0) delete postings[word];
    }
  }
  return removed;
}
