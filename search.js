// search.js：短语查询与单文档增量更新
import { tokenize } from "./index.js";

// 判断有序位置列表中是否存在 value（二分查找，避免全表扫描）
function hasPosition(list, value) {
  let lo = 0;
  let hi = list.length - 1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (list[mid] === value) return true;
    if (list[mid] < value) lo = mid + 1;
    else hi = mid - 1;
  }
  return false;
}

// 单个短语：从最短（位置条目最少）的词项起步，逐词校验位置差为 1
function matchPhrase(postings, words) {
  if (words.length === 0) return [];
  let anchor = 0;
  for (let i = 1; i < words.length; i += 1) {
    const entry = postings[words[i]];
    if (!entry) return []; // 含未知词项：直接返回空，不报错
    const anchorEntry = postings[words[anchor]];
    if (entrysize(entry) < entrysize(anchorEntry)) anchor = i;
  }
  const anchorEntry = postings[words[anchor]];
  if (!anchorEntry) return [];
  const hits = [];
  for (const docId of Object.keys(anchorEntry)) {
    const positions = anchorEntry[docId];
    for (const p of positions) {
      let ok = true;
      for (let i = 0; i < words.length; i += 1) {
        if (i === anchor) continue;
        const list = postings[words[i]][docId];
        if (!list || !hasPosition(list, p + i - anchor)) {
          ok = false;
          break;
        }
      }
      if (ok) {
        hits.push(docId);
        break; // 同一文档命中一次即可
      }
    }
  }
  hits.sort();
  return hits;
}

function entrysize(entry) {
  let n = 0;
  for (const docId of Object.keys(entry)) n += entry[docId].length;
  return n;
}

export function phrase(index, phrases) {
  return phrases.map((words) => matchPhrase(index.postings, words));
}

// 向升序位置列表插入一个位置，保持有序且不重复
function insertPosition(list, value) {
  let lo = 0;
  let hi = list.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (list[mid] < value) lo = mid + 1;
    else hi = mid;
  }
  if (list[lo] !== value) list.splice(lo, 0, value);
}

// 只重建被更新文档的位置条目：先删旧条目，再按升序插新条目
export function applyUpdate(index, docs, update) {
  if (!update) return { rebuilt: 0, touched: 0 };
  const postings = index.postings;
  const existing = docs.find((doc) => doc.id === update.id);
  let touched = 0;
  let removed = 0;

  if (existing) {
    // 删除该文档的旧条目（同一词项在旧文本中可能出现多次，只处理一次）
    const cleared = new Set();
    for (const word of tokenize(existing.text)) {
      if (cleared.has(word)) continue;
      cleared.add(word);
      const perDoc = postings[word];
      const list = perDoc && perDoc[existing.id];
      if (!list) continue;
      removed += list.length;
      touched += list.length;
      delete perDoc[existing.id];
      if (Object.keys(perDoc).length === 0) delete postings[word];
    }
  }

  // 插入新条目，位置列表保持升序
  let pos = 0;
  const newWords = tokenize(update.text);
  for (const word of newWords) {
    const perDoc = postings[word] || (postings[word] = {});
    const list = perDoc[update.id] || (perDoc[update.id] = []);
    insertPosition(list, pos);
    touched += 1;
    pos += 1;
  }

  // 增量维护总条目数，不做全库扫描
  index.positions = index.positions - removed + newWords.length;

  if (existing) existing.text = update.text;
  else docs.push({ id: update.id, text: update.text });

  return { rebuilt: 1, touched };
}
