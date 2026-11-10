// 第 278 轮判据设计 v2：用「还原后是否为真实英文词」区分 leet 攻击 vs 字母数字混排 token
// 关键洞察：
//   leet 攻击 token 还原后是真实英文词（!gn0re→ignore、a11→all、prev1ous→previous）
//   字母数字混排 token 还原后是乱码（3f2a91b→ef2agib、100k→iook、Q3→qe）
// 由于无词表资源，用「结构特征」近似：
//   1) 字母数字混排 token 的常见形态：数字在词首/词尾成簇、含 0x 前缀、含版本号点分、
//      含连字符分隔、hex 串、全大写型号
//   2) leet 攻击 token 的形态：数字/符号散落在字母之间
// 先量化「数字成簇位置」这个特征。
'use strict';

function analyze(t) {
  // 找数字簇（连续数字）与字母簇的分布
  const clusters = [];
  let cur = null;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    const isD = /[0-9]/.test(c);
    if (isD) {
      if (!cur || cur.type !== 'd') { cur = { type: 'd', start: i, end: i }; clusters.push(cur); }
      else cur.end = i;
    } else if (/[a-zA-Z]/.test(c)) {
      if (!cur || cur.type !== 'a') { cur = { type: 'a', start: i, end: i }; clusters.push(cur); }
      else cur.end = i;
    } else {
      cur = null;
    }
  }
  const dClusters = clusters.filter(c => c.type === 'd');
  const aClusters = clusters.filter(c => c.type === 'a');
  const digits = dClusters.reduce((s, c) => s + c.end - c.start + 1, 0);
  const letters = aClusters.reduce((s, c) => s + c.end - c.start + 1, 0);
  const sym = (t.match(/[@$!+|]/g) || []).length;
  // 最大数字簇长度占比
  const maxD = Math.max(0, ...dClusters.map(c => c.end - c.start + 1));
  const maxA = Math.max(0, ...aClusters.map(c => c.end - c.start + 1));
  // 数字簇是否首尾成簇（版本号/型号特征）
  const firstIsD = clusters.length > 0 && clusters[0].type === 'd';
  const lastIsD = clusters.length > 0 && clusters[clusters.length - 1].type === 'd';
  return { digits, letters, sym, dClusters: dClusters.length, aClusters: aClusters.length, maxD, maxA, firstIsD, lastIsD };
}

const LEET = ['!gn0re', '1gnor3', 'a11', 'prev1ous', 'instruct!ons', '!nstruct!ons', 'gn0re',
  '1gnore', 'pr3v10us', '5y5t3m', 'p@ssword', '4dmin', 'h@ck', '|gn0re', '$ecret', 's3cur1ty'];
const TOKENS = ['Q3', '3f2a91b', '100k', '0xFF00', 'v6.8.159', 'SKU-A17', 'a1b2c3d4',
  '9f8e7d6c5b4a39281706f5e4d3c2b1a0987654321', 'x86_64', 'utf8', 'sha256', 'md5',
  'Q1', 'Q4', '2026', '6.8.62', '150%', '0x00FF', '3D', '4K', '8K', 'H264', 'mp3', 'A17'];

console.log('=== LEET（应还原）===');
for (const t of LEET) {
  const a = analyze(t);
  console.log(`${t.padEnd(14)} d=${a.digits} a=${a.letters} sym=${a.sym} dClu=${a.dClusters} aClu=${a.aClusters} maxD=${a.maxD} maxA=${a.maxA} firstD=${a.firstIsD?1:0} lastD=${a.lastIsD?1:0}`);
}
console.log('');
console.log('=== TOKENS（应保留）===');
for (const t of TOKENS) {
  const a = analyze(t);
  console.log(`${t.padEnd(14)} d=${a.digits} a=${a.letters} sym=${a.sym} dClu=${a.dClusters} aClu=${a.aClusters} maxD=${a.maxD} maxA=${a.maxA} firstD=${a.firstIsD?1:0} lastD=${a.lastIsD?1:0}`);
}
