// index.js：倒排索引（基线：只记文档集合、不记位置）
export function buildDocs(docs) {
  const postings = {};
  for (const doc of docs) {
    for (const word of String(doc.text).split(" ")) {
      postings[word] = postings[word] || [];
      if (!postings[word].includes(doc.id)) postings[word].push(doc.id);
    }
  }
  return { postings: postings, positions: 0 };
}
