/**
 * scripts/round-208/probe-r208-en.js
 * 精确复现英文存量缺口：truncate/reset/wipe × audit/firewall/security 名词。
 * 与第 206 轮「第⑥条英文形」同族，本轮不动手改，只量化给下一轮/遗留。
 */
'use strict';

const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const diMod = require(path.join(ROOT, 'src/dangerous-instruction.js'));

function cnt(r) { return (r && typeof r.count === 'number') ? r.count : 0; }

const VERBS = ['truncate', 'reset', 'wipe', 'purge', 'clear', 'delete', 'disable'];
const OBJS = [
  'the audit log', 'audit logs', 'the audit', 'the security audit log',
  'the firewall rules', 'firewall', 'the security logs', 'the access control',
  'the sandbox', 'the IDS rules', 'the WAF', '入侵检测',
];

let pass = 0, total = 0;
console.log('verb      ' + OBJS.map((o, i) => `#${i}`.padStart(22)).join(''));
const passCells = [];
for (const v of VERBS) {
  const row = OBJS.map(o => {
    const s = `${v} ${o}`;
    const c = cnt(diMod.checkDangerousInstruction(s));
    total++;
    const mark = c > 0 ? 'HIT' : 'pass';
    if (c === 0) { pass++; passCells.push(`${v} + #${OBJS.indexOf(o)}`); }
    return mark.padStart(22);
  });
  console.log(v.padEnd(10) + row.join(''));
}
console.log(`\n索引: 0=audit log(sg) 1=audit logs 2=the audit 3=security audit log 4=firewall rules 5=firewall 6=security logs 7=access control 8=sandbox 9=IDS rules 10=WAF 11=入侵检测`);
console.log(`汇总: pass=${pass}/${total}`);
console.log('pass 单元: ' + passCells.join(' | '));
console.log('DONE');
