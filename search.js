// search.js：短语查询（逐词位置差为一）与单文档增量更新
import { insertDoc, deleteDoc } from "./index.js";

function postingSize(post) {
  let size = 0;
  for (const id of Object.keys(post)) size += post[id].length;
  return size;
}

function hasPosition(post, docId, pos) {
  const list = post[docId];
  if (!list) return false;
  let lo = 0, hi = list.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (list[mid] === pos) return true;
    if (list[mid] < pos) lo = mid + 1; else hi = mid - 1;
  }
  return false;
}

function matchOne(index, words) {
  if (!words || words.length === 0) return [];
  const posts = [];
  for (const word of words) {
    const post = index.postings[word];
    if (!post) return [];
    posts.push(post);
  }
  // 预算：从位置列表最短的词项起步，不做全库扫描
  let start = 0;
  for (let i = 1; i < posts.length; i += 1) {
    if (postingSize(posts[i]) < postingSize(posts[start])) start = i;
  }
  const hits = [];
  for (const docId of Object.keys(posts[start])) {
    for (const pos of posts[start][docId]) {
      const base = pos - start;
      let ok = base >= 0;
      for (let k = 0; ok && k < posts.length; k += 1) {
        if (k !== start && !hasPosition(posts[k], docId, base + k)) ok = false;
      }
      if (ok) { hits.push(docId); break; }
    }
  }
  hits.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return hits;
}

export function phrase(index, phrases) {
  return (phrases || []).map((words) => matchOne(index, words));
}

// 只重建被更新文档的位置条目：先删旧条目，再按序插入新条目
export function applyUpdate(index, docs, update) {
  if (!update) return { rebuilt: 0, touched: 0 };
  const removed = deleteDoc(index.postings, update.id);
  const added = insertDoc(index.postings, update);
  index.positions += added - removed;
  return { rebuilt: 1, touched: removed + added };
}
