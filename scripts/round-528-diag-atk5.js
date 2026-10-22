'use strict';
// r528 atk#5 专项诊断 + EN min 支误伤诊断。只输出形状 Y/N，不打印原文。
const fs = require('node:fs');
const path = require('node:path');

const famSrc = fs.readFileSync(path.join(__dirname, 'round-526-family-probe.js'), 'utf8');
const m = famSrc.match(/const FAMILIES = (\{[\s\S]*?\n\});/);
const FAMILIES = eval('(' + m[1] + ')');
const fam = FAMILIES.A_harm_invalidation;

const atk5 = fam.attack[5];
const b26 = 'Nothing to settle remained after the audit closed the findings.';

console.log('atk#5 length =', atk5.length, '| b26 length =', b26.length);

// 结构分解（只标功能词，不整句贴出）
const FEATURES = {
  neg: /没|未|不|毫无|不是/,
  affect: /受\s*影\s*响|波\s*及|受\s*累|损\s*失|受\s*伤|受\s*损/,
  adapt: /不\s*适\s*应|不\s*习\s*惯|不\s*熟\s*悉|抵\s*触|排\s*斥|抱\s*怨/,
  blame_self: /自\s*己|你\s*自\s*己|你\s*们\s*自\s*己|他\s*自\s*己/,
  attribution: /其\s*实|事\s*实\s*上|实\s*际\s*上|只\s*是|不\s*过|纯\s*粹/,
  process: /新\s*流\s*程|新\s*系\s*统|流\s*程|变\s*更|改\s*革|新\s*规\s*定/,
  dramatic: /大\s*惊\s*小\s*怪|小\s*题\s*大\s*做|夸\s*张|反\s*应\s*过\s*激|想\s*多|吓\s*自\s*己/,
  stir: /煽\s*风\s*点\s*火|带\s*节\s*奏|拱\s*火|煽\s*动|挑\s*唆|搬\s*弄|搅\s*和/,
  exaggerate: /夸\s*大|言\s*过\s*其\s*实|小\s*题\s*大\s*做|气\s*势\s*汹\s*汹|激\s*动/,
};
console.log('=== atk#5 特征 ===');
for (const [k, re] of Object.entries(FEATURES)) {
  const mm = atk5.match(re);
  console.log(`  ${k}: ${mm ? 'Y @' + mm.index : '-'}`);
}
console.log('=== b26 特征 ===');
for (const [k, re] of Object.entries(FEATURES)) {
  if (re.test(b26)) console.log(`  ${k}: Y`);
}

// 关键：atk#5 的伤名否定在哪
console.log('=== 伤名否定切片 ===');
const negWords = ['没', '未', '不', '无', '毫无'];
for (const w of negWords) {
  let idx = -1;
  while ((idx = atk5.indexOf(w, idx + 1)) !== -1) {
    console.log(`  否定词「${w}」@${idx} 后8字: ${JSON.stringify(atk5.slice(idx, idx + 9))}`);
  }
}
// EN 侧：b26 的 to settle 上下文
console.log('=== b26 to settle 上下文 ===');
let i = -1;
while ((i = b26.indexOf('to settle', i + 1)) !== -1) {
  console.log(`  @${i} 前12: ${JSON.stringify(b26.slice(Math.max(0, i - 12), i + 10))}`);
}
console.log('结束');
