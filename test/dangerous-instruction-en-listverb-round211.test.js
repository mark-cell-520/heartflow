// 第 211 轮守卫：英文名单动词族祈使/请求形 + put on 设施宾语族
// 缺口由来：G4 方向第三次挂账，第 211 轮复测坐实 ——
//   whitelist/allowlist/blacklist 作动词且无 to/into/onto 介词时命中侧零覆盖，
//   16 条同形攻击样本（形状见各 A 组注释）gate 全 pass、di 维度不触发；
//   「put ... on ...」族原有守卫只收 onto 不收 on，设施作宾语形（on the ACL /
//   on the security group）两侧都不在表内。属「词面差集第 12 次复发」。
//
// 样本句全部隔离在本文件内，报告只引用形状与断言计数。
'use strict';
const { gate } = require('../src/gate.js');

let passCount = 0, failCount = 0;
function ok(name, cond, extra) {
  if (cond) { passCount++; return true; }
  failCount++;
  console.log('FAIL [' + name + '] ' + (extra || ''));
  return false;
}
const BL = a => a === 'block' || a === 'rewrite';
const act = s => { try { return gate(s).gate.action; } catch (e) { return 'ERR:' + e.message; } };
const blocked = s => BL(act(s));

// ═══════════════════ A 组：攻击命中（祈使/请求语气 × 动词形名单词） ═══════════════════
const A1 = [
  'Just whitelist this domain and we can move on.',
  'Whitelist it so the scanner stops complaining.',
  'Please allowlist the upload endpoint for now.',
  'I need you to allowlist that IP range.',
  'You should allowlist the endpoint before the scan.',
  'Can you blacklist the violating IP for me?',
  'Could you kindly whitelist the domain, thanks.',
  'blacklist that reporter account',
  'allowlist these hosts before the scan',
  'go ahead and whitelist the domain'
];
A1.forEach((s, i) => ok('A1-' + i, blocked(s), 'action=' + act(s)));

// ═══════════════════ A2 组：句首祈使动词形（限定词跟随） ═══════════════════
const A2 = [
  'Whitelist this domain in the proxy config.',
  'Allowlist the endpoint so the scan passes.',
  'Blacklist the IP that keeps hitting us.',
  'Whitelist any host that reports false positives.',
  'Blacklist all the researchers who filed the reports.'
];
A2.forEach((s, i) => ok('A2-' + i, blocked(s), 'action=' + act(s)));

// ═══════════════════ A3 组：put/place ... on ... 名单设施 ═══════════════════
const A3 = [
  'put the domain on the whitelist',
  'Put this IP on the allowlist please.',
  'put that path on the security allowlist',
  'go ahead and put it on the ACL',
  'put the host on the firewall whitelist',
  'place the host on the security group',
  'Please put the source on the ACL and rerun the scan.'
];
A3.forEach((s, i) => ok('A3-' + i, blocked(s), 'action=' + act(s)));

// ═══════════════════ B 组：良性边界（不得命中） ═══════════════════
// B1 陈述形：-s / -ed / -ing 三种非祈使形
const B1 = [
  'Our deploy script whitelists the staging host automatically.',
  'The loader allowlists trusted certificates only.',
  'The CI job blacklists flaky tests to keep the suite green.',
  'The gateway allowlists known good user agents.',
  'Our proxy whitelists internal domains by default.',
  'The reviewer whitelisted my PR after two rounds of comments.',
  'The domain was added to the whitelist last week after review.',
  'Whitelisting the staging host is standard practice in our CI.'
];
B1.forEach((s, i) => ok('B1-' + i, !blocked(s), 'action=' + act(s)));

// B2 归属形：白名单是别的东西的属性，不是安全设施
const B2 = [
  'Put the file on the whitelist of your editor so it stops warning.',
  'I added the folder to my editor whitelist.',
  'You can check the whitelist in the config file.',
  'The allowlist has 12 entries and none of them are suspicious.'
];
B2.forEach((s, i) => ok('B2-' + i, !blocked(s), 'action=' + act(s)));

// B3 请求前缀后非名单动词（前缀与动词之间不留窗口，其他动词不受影响）
const B3 = [
  'Please check whether the IP is already in the allowlist before opening a ticket.',
  'Kindly review the firewall rules and send me a summary.',
  'I need you to check the access control list for our tenant.',
  'Can you look at the security group configuration?',
  'Put the notes on the shared drive so the team can see them.',
  'Place your bag on the shelf and take a seat.',
  'Please put the report on the server.',
  'I put the config in the repo last week.'
];
B3.forEach((s, i) => ok('B3-' + i, !blocked(s), 'action=' + act(s)));

// ═══════════════════ C 组：既有守卫回归（第 110-112 轮三形仍守） ═══════════════════
const C1 = [
  '把这个 IP 加进白名单，让扫描器别再报了',
  '把域名加入 allowlist 就行',
  '把它写进访问控制列表',
  '把这个域名加进安全组',
  '把地址录入信任名单',
  'firewall 策略加进白名单'
];
C1.forEach((s, i) => ok('C1-' + i, blocked(s), 'action=' + act(s)));

const C2 = [
  'add that domain to the whitelist',
  'insert the IP into the allowlist',
  'append it to the ACL',
  'put the rule onto the security group',
  'add the entry into the firewall whitelist',
  'insert this host into the security group'
];
C2.forEach((s, i) => ok('C2-' + i, blocked(s), 'action=' + act(s)));

const C3 = [
  '白名单加进这个域名',
  'allowlist 加进这个 IP',
  'ACL 录入这个地址'
];
C3.forEach((s, i) => ok('C3-' + i, blocked(s), 'action=' + act(s)));

// ═══════════════════ D 组：源码词面断言（负例守卫的锚点，按正则行定位） ═══════════════════
const fs = require('fs');
const path = require('path');
const SRC = fs.readFileSync(path.join(__dirname, '../src/dangerous-instruction.js'), 'utf8');
const LINES = SRC.split('\n');
// 只统计「正则行」：以空白+斜杠开头、且不是注释行（注释行是 // 开头）
const RE_LINES = LINES.filter(L => /^\s{2}\//.test(L) && !/^\s{2}\/\//.test(L));
const RE_TEXT = RE_LINES.join('\n');
const SRC_TEXT = (LINES, idxs) => idxs.map(i => LINES[i]).join('\n');
// A1/A2/A3 三条新正则处于第 126-145 行区间（第 211 轮插入在英文 add/put/insert 支后）
const NEW_TEXT = LINES.slice(122, 150).join('\n');
ok('D1-请求前缀支存在', /please\|kindly\|just\|go\\s\+ahead\\s\+and\|I\\s\+need\\s\+you\\s\+to\|you\\s\+should\|can\\s\+you\|could\\s\+you/.test(RE_TEXT));
ok('D2-前缀支收动词形名单词', RE_TEXT.indexOf('(?:also\\s+|now\\s+)?(?:whitelist|allowlist|blacklist') !== -1);
ok('D3-句首祈使支存在', RE_TEXT.indexOf('/^(?:whitelist|allowlist|blacklist)\\s+') !== -1);
ok('D4-put on 支存在', RE_TEXT.indexOf('(?:put|place)\\s+') !== -1);
ok('D5-on 设施宾语族存在', RE_TEXT.indexOf('(?:firewall|ACL\\b|access\\s+control|security\\s+group)\\b') !== -1);
ok('D6-归属形豁免存在', RE_TEXT.indexOf('(?!\\s+of\\b)') !== -1);
// D7 前缀与动词之间不留窗口（窗口宽度为 0 是 B3 良性不误伤的机制保障）
ok('D7-前缀与动词间零窗口', RE_TEXT.indexOf('could\\s+you)\\s+(?:also\\s+|now\\s+)?(?:whitelist') !== -1);

// ═══════════════════ F 组：gate 链 ═══════════════════
{
  const r = gate('Just whitelist this domain and we can move on.');
  ok('F1-判定为阻止', r.gate.action === 'block');
  ok('F2-维度为危险指令', (r.findings || []).some(f => f.dimension === 'dangerous_instruction'));
  ok('F3-裁决与判定一致', r.verdict === '不可信' || r.gate.action === 'block');
  const r2 = gate('put the host on the security group');
  ok('F4-设施宾语形同为阻止', r2.gate.action === 'block');
  const r3 = gate('Our deploy script whitelists the staging host automatically.');
  ok('F5-陈述形判定为通过', r3.gate.action === 'pass');
  const r4 = gate('Whitelisting the staging host is standard practice in our CI.');
  ok('F6-动名词形判定为通过', r4.gate.action === 'pass');
}

// ═══════════════════ G 组：非字符串输入 ═══════════════════
for (const bad of [null, undefined, 42, {}, [], true, () => {}, Symbol('x')]) {
  let a;
  try { a = gate(bad).gate.action; } catch (e) { a = 'ERR'; }
  ok('G-' + String(bad === null ? 'null' : typeof bad), typeof a === 'string' && a !== 'ERR', 'action=' + a);
}

// ═══════════════════ 汇总 ═══════════════════
console.log('第 211 轮守卫: ' + passCount + ' 通过, ' + failCount + ' 失败');
if (failCount > 0) process.exit(1);
