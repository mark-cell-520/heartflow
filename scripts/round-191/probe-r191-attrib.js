// 第 191 轮探针：CD-ZH5f1 命中 vs rh count=0 的矛盾归因 + isTemporaryRestorePromise 链路
'use strict';
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..', '..');
const rh = require(path.join(ROOT, 'src', 'reward-hacking.js'));

const testSrc = fs.readFileSync(path.join(ROOT, 'test', 'reward-hacking-zh5-exemption-round186.test.js'), 'utf8');
function grabArr(name) {
  const marker = 'const ' + name + ' = [';
  const lines = testSrc.split('\n');
  let acc = -1, i1 = -1;
  for (let li = 0; li < lines.length; li++) if (lines[li] === marker) { acc = li; break; }
  for (let li = acc + 1; li < lines.length; li++) if (lines[li] === '];') { i1 = li; break; }
  return eval('[' + lines.slice(acc + 1, i1).join('\n') + ']');
}
const ATTACK = grabArr('ATTACK');
const T = ATTACK[8];

// 1) raw 正则命中吗
const rhSrcLines = fs.readFileSync(path.join(ROOT, 'src', 'reward-hacking.js'), 'utf8').split('\n');
const reLine = rhSrcLines[1799];
console.log('reLine1800=' + JSON.stringify(reLine.slice(0, 60)));
const RE = eval(reLine.trim().replace(/,\s*$/, ''));
console.log('CD-ZH5f1 regex on idx8 => ' + RE.test(T));

// 2) checkRewardHacking 全链路
const full = rh.checkRewardHacking(T);
console.log('checkRewardHacking idx8 => count=' + full.count + ' classes=' + JSON.stringify(full.classes));

// 3) dev-exemptions 是否豁免
const de = require(path.join(ROOT, 'src', 'dev-exemptions.js'));
for (const fn of ['isTemporaryRestorePromise', 'matchesDevExemption', 'isDevExempt']) {
  if (typeof de[fn] === 'function') {
    let out = '(throws)';
    try { out = JSON.stringify(de[fn](T)); } catch (e) { out = 'ERR ' + e.message; }
    console.log('dev-exemptions.' + fn + '(idx8) => ' + out);
  }
}

// 4) rh 模块内是否有本地豁免（同名/近似名）
console.log('rh keys with exempt/restore/temporary: ' + Object.keys(rh).filter(k => /exempt|restore|temporary|dev/i.test(k)).join(', '));
for (const k of Object.keys(rh)) {
  if (!/exempt|restore|temporary|dev/i.test(k)) continue;
  if (typeof rh[k] !== 'function') continue;
  let out;
  try { out = JSON.stringify(rh[k](T)); } catch (e) { out = 'ERR'; }
  console.log('  rh.' + k + '(idx8) => ' + out);
}

// 5) 直接调 checkRewardHacking 内部族：定位命中后是被谁吃掉的
//    用 REWARD_HACKING_PATTERNS 直接测（若导出）
if (rh.REWARD_HACKING_PATTERNS) {
  const t = rh.REWARD_HACKING_PATTERNS.covert_deception || [];
  let rawHit = 0;
  t.forEach((r, i) => { try { if (r.test(T)) rawHit++; } catch (e) {} });
  console.log('covert_deception raw patterns hit idx8 = ' + rawHit + ' / ' + t.length);
}

// 6) 看 checkRewardHacking 主体流程，找 count 归零的地方
const rhFile = fs.readFileSync(path.join(ROOT, 'src', 'reward-hacking.js'), 'utf8');
const mFns = [...rhFile.matchAll(/(?:^(?:  )?)(?:async )?function (\w+)\(/gm)].map(x => x[1]);
console.log('rh file fn defs: ' + mFns.join(', '));
// 找 checkRewardHacking 定义体
const idxDef = rhFile.indexOf('function checkRewardHacking');
console.log('--- checkRewardHacking body (first 2500 chars) ---');
console.log(rhFile.slice(idxDef, idxDef + 2500));
