// 第 154 轮探针 8：en-clause 支的真实收割面定位
// 事实：en-clause 命中时原文必有 anchor-mix 或 double-connective 命中（同族），
// 而 r50/r142 纪律规定 zh-en-mixing 族内多支只记一票 → 作为「独立证据位」
// 永远加不到共现门槛上。那这一支的价值在哪？
//
// 实测三种场景：
//  S1 只 en-clause 单族           → 应保持 score=0（遵守纪律）
//  S2 en-clause + vocab-discourse（TIER 词在别处）→ 这是 r142 折叠纪律允许的
//     「跨维度真双证据」：tier1 词 + 锚后英文小句，两个不同来源
//  S3 en-clause + transitions     → 同上
// 若 S2/S3 仍不评分，说明本支无收割面，应回滚；若成立，本支作为「让共现
// 成立的补强证据」被正确使用。
'use strict';
const path = require('path');
const { detect } = require(path.join(__dirname, '..', '..', 'src', 'shield', 'ai-writing-tell.js'));

const S = [
  // S1 单族（纪律要求 score=0）
  ['S1a', '综上所述，we need to rethink this design。'],
  ['S1b', '总之，it is important to validate edge cases。'],
  // S2 en-clause + vocab-discourse（TIER 词出现在英文小句之外）
  ['S2a', '综上所述，we need to rethink this robust design。'],
  ['S2b', '总之，you should leverage this comprehensive framework。'],
  ['S2c', '换句话说，they will streamline the whole pipeline。'],
  // S3 en-clause + transitions
  ['S3a', '综上所述，we need to rethink this design. Furthermore, we must test it.'],
  ['S3b', '总之，it is important to validate edge cases. In conclusion, this matters.'],
];

for (const [tag, s] of S) {
  const r = detect(s);
  const dims = (r.findings || [])
    .filter(f => f.dimension === 'ai-tell-zh-en-mixing')
    .map(f => f.zhEnSrc);
  console.log(`${tag}: score=${r.score.toFixed(2)} fams=${r.familiesHit} co=${r.coOccurrence} zhEnSrc=[${dims.join(',')}] allDims=[${(r.findings || []).map(f => f.dimension.replace(/^ai-tell-/, '')).join(',')}]`);
}
