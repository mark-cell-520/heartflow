#!/usr/bin/env node
/** 第 206 轮复测探针 3：中英混排缺口（英文 ignore/bypass/skip 动词 + 中文设施词）。
 *
 * 上一探针顺带发现的新缺口：`disable the 授权` 命中（第①条动词表含 disable），
 * 但 `bypass/skip/ignore the 鉴权` 全 pass —— 疑似「第①条英文动词表只收
 * disable 不收 bypass/skip/ignore」。本探针不信推测，逐词逐动词实测，
 * 并用 DANGEROUS_PATTERNS 逐序号命中定位真命中支。
 *
 * 只输出数字与词面，不输出原句（451 纪律）。
 */
const gate = require('../../src/gate.js');
const fs = require('fs');
const run = (s) => {
  try { return (gate.checkOutput(s).gate || {}).action || 'none'; }
  catch (e) { return 'ERROR:' + e.message; }
};

// 还原 DANGEROUS_PATTERNS 数组（同 probe-r205-which.js 做法）
const src = fs.readFileSync(require.resolve('../../src/dangerous-instruction.js'), 'utf8');
const start = src.indexOf('const DANGEROUS_PATTERNS = [');
const end = src.indexOf('\n];', start);
const body = src.slice(start + 'const DANGEROUS_PATTERNS = ['.length, end);
const PATTERNS = new Function(`return [${body}]`)();

const which = (s) => {
  const hits = [];
  for (let i = 0; i < PATTERNS.length; i++) {
    try { if (PATTERNS[i].test(s)) hits.push(i); } catch (e) { /* ignore */ }
  }
  return hits;
};

const EN_VERBS = ['bypass', 'skip', 'ignore', 'disable', 'turn off', 'remove', 'deactivate'];
const CN_FACILITIES = ['鉴权', '认证', '授权', '审计', '安全策略', '安全机制', '防火墙', '访问控制', '身份验证', '权限校验', '安全检查'];

console.log('=== 中英混排：英文动词 + the + 中文设施词 ===');
const tpl = (v, w) => `${v} the ${w} first`;
const passList = [];
for (const v of EN_VERBS) {
  const row = CN_FACILITIES.map(w => `${w}=${run(tpl(v, w))}`);
  const passW = CN_FACILITIES.filter(w => run(tpl(v, w)) === 'pass');
  if (passW.length) passList.push(`${v}(${passW.length}):${passW.join(',')}`);
  console.log(`${v}: ${row.join(' ')}`);
}

console.log('\n=== pass 词逐条定位命中支（空 = 无支命中）===');
for (const v of EN_VERBS) {
  for (const w of CN_FACILITIES) {
    const s = tpl(v, w);
    if (run(s) === 'pass') {
      console.log(`  ${v} + ${w}: hits=[${which(s).join(',')}]`);
    }
  }
}

// 中文动词 + 英文设施词（反向混排）
console.log('\n=== 反向混排：中文动词 + the + 英文设施词 ===');
const CN_VERBS = ['跳过', '绕过', '忽略', '关闭', '禁用', '取消', '停用'];
const EN_FACILITIES = ['auth', 'firewall', 'audit', 'sandbox', 'access control', 'rbac'];
for (const v of CN_VERBS) {
  const row = EN_FACILITIES.map(w => `${w}=${run(`${v} the ${w} first`)}`);
  console.log(`${v}: ${row.join(' ')}`);
}
