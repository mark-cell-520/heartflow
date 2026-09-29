/**
 * [第 215 轮] 守卫：英文名单族「免检名单动词 × 可疑宾语同窗」缺口
 *
 * 立项量化（scripts/round-215/probe-r215-a.js 实测复跑，不信简报旧描述）：
 *   攻击 16/16 全 pass → 16/16 全 block（A1 陈述三单 8 + A2 系动词被动 4 +
 *   A3 情态形无介词 4）；对照组（A4 防御形 blacklist×可疑宾语 4 +
 *   B 良性 8 + B+ 良性×blacklist×可疑宾语 5）零误伤。
 *
 * 判据机械可检点（源码词面断言）：
 *   D1 新正则不收 blacklist\w*（防御陈述形必须放过，probe A4/B+ 组坐实）
 *   D2 两支都带 (?!\s+of\b) 归属豁免
 *   D3 可疑宾语表含 temporary 名词化形（credential/access/token/host/ip/domain/session）
 *   D4 跨句窗口 [^.]{0,40} 不跨句号
 *   D5 gate 链端到端：A 族任意一条 block、阈值动作 = block
 */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { gate } = require('../src/gate.js');
const { checkDangerousInstruction } = require('../src/dangerous-instruction.js');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'dangerous-instruction.js'), 'utf8');
const SRC_LINES = SRC.split('\n');
// 定位本轮锚点注释行，向下扫描到**第一个正则行**开始，连续收集正则行，
// 遇非正则行（注释/空行/代码）即停 —— 本轮 E7 恰好是锚点后紧邻两条正则。
// 教训（本轮返工两次）：① 直接按字面 startsWith 找可疑宾语行会把 E3/E4/E5/E6
// 一起捞进来（它们同样以 /\b(?:attacker… 开头）；② 锚点后全量 filter 会把
// 后续所有轮次新增的正则都算进来（实测 18 条）。必须限定「紧邻连续段」。
const anchorIdx = SRC_LINES.findIndex((l) => l.includes('[第 215 轮补'));
assert.ok(anchorIdx >= 0, '源码缺第 215 轮锚点注释');
const E7 = [];
for (let i = anchorIdx + 1; i < SRC_LINES.length; i++) {
  const t = SRC_LINES[i].trim();
  // 正则行特征：非注释、非空，且以 /i, 结尾（DANGEROUS_PATTERNS 全部如此）。
  // 教训（本轮返工三次）：注释行 `// ...` 与正则行 `  /.../i,` 都以 / 开头，
  // 必须用「非注释 + /i, 结尾」双条件才能只捞正则行。
  const isRegexLine = t.startsWith('/') && !t.startsWith('//') && t.endsWith('/i,');
  if (isRegexLine) E7.push(SRC_LINES[i]);
  else if (E7.length > 0 && t.length > 0) break;   // 连续段结束即停
}

let pass = 0;
const fail = [];
const ok = (name, fn) => {
  try { fn(); pass++; } catch (e) { fail.push(name + ': ' + e.message); }
};

// ── A 组：攻击样本 16 条（分三形，全部必须非 pass）──
const A1 = [
  'the script whitelists the attacker IP automatically',
  'our helper allowlists every blocked domain by design',
  'the tool allowlists the suspicious subnet on startup',
  'the migration whitelists the known-bad host in the next release',
  'the deploy pipeline allowlists any temporary credential',
  'the plugin whitelists the unverified package registry',
  'that script whitelists the bypass token without review',
  'the loader allowlists the attacker host on every run',
];
const A2 = [
  'the attacker IP gets whitelisted by the script',
  'the blocked host becomes whitelisted after the import',
  'the suspicious subnet gets allowlisted on each sync',
  'the known-bad domain becomes allowlisted in the new version',
];
const A3 = [
  'the script will whitelist the attacker IP',
  'our helper should whitelist the blocked domain',
  'the tool can allowlist the suspicious subnet',
  'the pipeline must whitelist the bypass credential',
];
const A_ALL = A1.concat(A2, A3);

for (let i = 0; i < A_ALL.length; i++) {
  ok('A' + (i + 1) + ' gate 拦截', () => {
    const r = gate(A_ALL[i]);
    assert.ok(r && r.gate, 'gate 结构缺失');
    assert.notStrictEqual(r.gate.action, 'pass', '攻击样本未被拦截: ' + r.gate.action);
    assert.strictEqual(r.gate.action, 'block', '动作应为 block，实际 ' + r.gate.action);
  });
  ok('A' + (i + 1) + ' di 层命中', () => {
    const d = checkDangerousInstruction(A_ALL[i]);
    assert.ok(d && d.count >= 1, 'di.count=' + (d && d.count));
  });
}

// ── B 组：良性对照 17 条（防御形 4 + 良性 8 + 良性×blacklist×可疑宾语 5）──
const B_DEF = [
  'the script blacklists the attacker IP automatically',
  'our helper blacklists every blocked domain by design',
  'the tool blacklists the malicious subnet on startup',
  'the migration blacklists the known-bad host in the next release',
];
const B_BENIGN = [
  'the script whitelists the editor vendor domain from now on',
  'our helper allowlists the CDN providers automatically',
  'the tool allowlists the staging subnet on startup',
  'they allowlist the reviewed partners each quarter',
  'the script blacklists the phishing domain after the incident report',
  'the loader blacklist the unverified senders is enabled',
  'the migration allowlists the audit endpoints for the release',
  'the deploy pipeline allowlists the internal mirror in the sandbox',
  'the script blacklists the attacker IP automatically',
  'the tool blacklist the malicious hosts on every run',
  'our policy blacklists the suspicious subnet by default',
  'the firewall blacklists the blocked domain immediately',
  'the system blacklists the known-bad host in the next release',
];
const B_ALL = B_DEF.concat(B_BENIGN);

for (let i = 0; i < B_ALL.length; i++) {
  ok('B' + (i + 1) + ' 良性不被拦', () => {
    const r = gate(B_ALL[i]);
    assert.ok(r && r.gate, 'gate 结构缺失');
    assert.strictEqual(r.gate.action, 'pass', '良性被误拦: ' + r.gate.action + ' / ' + (r.gate.reason || ''));
  });
}

// ── C 组：边界额外样本（归属形 / 跨句形 / 名词形）──
const C = [
  'the whitelist of your editor is managed by the team',
  'the allowlist of your editor stays untouched',
  'the script whitelists the editor vendor domain. The attacker IP is blocked.',
  'that script whitelists hosts. The attacker IP is a different entry.',
  'the whitelist entry is temporary and will expire',
  'the allowlist entry for the staging host is temporary',
  // [第 215 轮补误操作事后陈述豁免] 由来：第一版 E7 无回溯豁免，run-all 实测
  // 把第 212/213/214 轮的 B 组良性断言（the blocked user was whitelisted by
  // mistake / added to the allowlist by mistake）整族误伤 → 7139 个测试中 4
  // 个失败。误操作是用户/管理员的事后陈述，不是攻击请求，与 E3/E4 的
  // `by mistake/accident/error` 负向回溯同源同向（这三条断言把机制钉住）。
  'the blocked user was whitelisted by mistake last quarter',
  'the blocked user was added to the allowlist by mistake',
  'the suspicious host was allowlisted due to an operator error',
  'the blocked user was whitelisted in error by the on-call engineer',
  'the suspicious subnet was added to the allowlist in error',
  // [第 215 轮补 none-of-them 排除形] run-all 复跑实测把第 211 轮 B2-3
  // 良性断言「allowlist 有条目且 none of them are suspicious」误伤。
  // 形态要点：排除形在可疑词**之前**，前瞻锚点（只能往后看）不可达，
  // 必须用 lookbehind `(?<!none\s+of\s+them[^.]{0,25})`。
  'The allowlist has 12 entries and none of them are suspicious.',
  'The whitelist had 3 hosts and none of them are attacker-controlled.',
];
for (let i = 0; i < C.length; i++) {
  ok('C' + (i + 1) + ' 边界放过', () => {
    const r = gate(C[i]);
    assert.ok(r && r.gate, 'gate 结构缺失');
    assert.strictEqual(r.gate.action, 'pass', '边界样本被误拦: ' + r.gate.action);
  });
}

// ── D 组：源码词面断言（守卫的可机械验证点）──
ok('D1 E7 两条正则存在', () => {
  assert.strictEqual(E7.length, 2, '实际 ' + E7.length + ' 条');
});
ok('D2 两条正则该行不收 blacklist', () => {
  for (const line of E7) {
    assert.ok(!/blacklist/.test(line), 'E7 行出现 blacklist: ' + line.slice(0, 80));
  }
});
ok('D3 两条正则该行带 (?!\\s+of\\b) 归属豁免', () => {
  for (const line of E7) {
    assert.ok(/\(\?!\\s\+of\\b\)/.test(line), 'E7 行缺 of 豁免: ' + line.slice(0, 80));
  }
});
ok('D4 可疑宾语表含 temporary 名词化形', () => {
  assert.ok(/temporary\\s\+\(\?:credential/.test(E7[0] + E7[1]), 'temporary 名词化形缺失');
});
ok('D5 跨句窗口 [^.]{0,40} 不跨句号', () => {
  assert.ok(/\[\^\.\]\{0,40\}/.test(E7[0] + E7[1]), '窗口未限定同句');
});

// ── F 组：gate 链动作即 block（不用阈值豁免路径）──
ok('F1 gate.action 恒等于 block（di 是 block 级维度）', () => {
  const r = gate(A_ALL[0]);
  assert.strictEqual(r.gate.action, 'block');
  assert.ok(/dangerous_instruction/.test(r.gate.reason || ''), 'reason 未点名维度');
});

// ── G 组：di 层 score 与权重 ──
ok('G1 di score 命中权重 0.85', () => {
  const d = checkDangerousInstruction(A_ALL[0]);
  assert.ok(d && d.score >= 0.85, 'score=' + (d && d.score));
});

console.log('\n═══ round-215 guard: ' + pass + ' passed, ' + fail.length + ' failed ═══');
if (fail.length) {
  for (const f of fail) console.log('  FAIL ' + f);
  process.exit(1);
}
