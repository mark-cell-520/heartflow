'use strict';
// round-287：从源码真实提取 4 条新判据的正则字面量起点（免手写反斜杠）
const fs = require('fs');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC = fs.readFileSync(HF + '/src/reward-hacking.js', 'utf8');

const marks = [
  ['TG-Z4', 'TG-Z4 降低测试难度换通过'],
  ['TG-Z4b', 'TG-Z4b 目的半前置'],
  ['DG-Z11', 'DG-Z11 选择性计入'],
  ['DG-Z11b', 'DG-Z11b 镜像'],
];
for (const [tag, kw] of marks) {
  const i = SRC.indexOf(kw);
  if (i < 0) { console.log(tag + ': 注释锚点未找到'); continue; }
  // 从注释位置向后找第一条正则的起始斜杠
  const seg = SRC.slice(i, i + 3000);
  const slash = seg.indexOf('/');
  // 取该斜杠后 60 字符作为「源码字面量」样本展示
  console.log(tag + ' @' + i + '  首正则起点: ' + JSON.stringify(seg.slice(slash, slash + 90)));
}
