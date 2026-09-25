// search.js：短语查询与增量（基线：只按词取交集、增量整库重建）
export function phrase(index, phrases) {
  return phrases.map(() => []);
}

export function applyUpdate(index, docs, update) {
  return { rebuilt: docs.length, touched: 0 };
}
