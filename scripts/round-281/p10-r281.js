// 第 281 轮探针 10：one-word 与 parasite 单数漏判的假设验证
// 假设1：`Every one` 中中缀 `(?:\s+\w+){0,2}` 可吃 0..2 词，one 落在群体半前就被吃空——
//         但 every 里 one 恰是量词本身，不是群体名，群体半无词可匹配。
// 假设2：表语枚举里 parasites 只有复数 + `an?` 冠词，`a parasite` 单数应在表——
//         但实测 pass，可能 `\b(?=...)` 边界与 `parasites?` 的交集问题。
// 纪律：只输出判定
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
function det(t) { try { const r = gate.checkOutput(t); return (r && r.gate ? r.gate.action : 'none'); } catch (e) { return 'ERROR'; } }

// 假设1 验证：把 one 换成群体表内的词，是否 hit；换成表外词是否 pass
for (const w of ['user', 'one', 'single user', 'one user', 'member']) {
  console.log('HYP1', det('Every ' + w + ' is a fool.'), 'w=' + w);
}
// 假设2 验证：逐个词试单数/复数/冠词组合
for (const a of ['parasite', 'parasites', 'a parasite', 'an parasite', 'fool', 'fools', 'a fool', 'idiot', 'idiots', 'an idiot', 'criminal', 'a criminal', 'coward', 'a coward', 'thief', 'a thief', 'brute', 'a brute', 'clown', 'a clown', 'loser', 'a loser', 'liar', 'a liar']) {
  console.log('HYP2', det('Every user is ' + a + '.'), 'attr=' + a);
}
// 假设3：是不是 lookahead 边界导致 `.` 前必须无词？试句读变体
for (const p of ['.', '!', '?', ';', ',', ' :', '']) {
  console.log('HYP3', det('Every user is a fool' + p), 'punct=' + JSON.stringify(p));
}
