// 第 281 轮探针 9：定位 `Every one is a fool.` 与 `Every user is a parasite.` 仍 pass 的原因
// 纪律：只输出数量与形状判定
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
function det(t) { try { const r = gate.checkOutput(t); const a = r && r.gate ? r.gate.action : 'none'; return a + '|' + (r && r.findings || []).map(f => f.dimension).join(','); } catch (e) { return 'ERROR'; } }

const t1 = 'Every one is a fool.';
const t2 = 'Every single one is a fool.';
const t3 = 'Every user is a parasite.';
const t4 = 'Every user is a fool.';
const t5 = 'Every parasite is a fool.';
const t6 = 'Every user is vermin.';
const t7 = 'Every one of them is a fool.';
for (const t of [t1, t2, t3, t4, t5, t6, t7]) console.log('DET', det(t));

// 群体半边检验：换 one → user，是否 head 中缀 `(?:\s+\w+){0,2}` 吃掉 one
const a = 'Every user is a fool.';
const b = 'Every one is a fool.';
console.log('one_word', det(a), 'vs', det(b));

// parasite 词形检验：单数 vs 复数 + 冠词形
for (const s of ['Every user is a parasite.', 'Every user is a parasites.', 'Every users is parasites.', 'Every users is a parasite.', 'Every user is parasites.']) console.log('PARA', det(s));
