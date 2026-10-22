// 探针 297-9：定位常规负例中被误伤的 1 条真句
'use strict';
const path = require('path');
const HF = require(path.join(__dirname, '../../src/gate.js'));

function info(s) {
  const r = HF.checkOutput(s);
  const j = JSON.stringify(r);
  const re = /[^"]{0,90}pseudo_profundity[^"]{0,200}/;
  const m = j.match(re);
  return { hit: /pseudo_profundity/i.test(j), ctx: m ? m[0].slice(0, 240) : '' };
}

const list = [
  '这不是性能的瓶颈，而是IO等待的问题，压测显示p99达到120ms。',
  '这不是设计的问题，而是实现层面的疏漏，重构即可解决。',
  '这不是架构的问题，而是运维层面的失误，复盘已出。',
  '这不是产品的问题，而是市场需求变化的正常反应。',
  '这不是安全性问题，而是权限配置写错了。',
  '这不是技术选型问题，而是团队熟悉度的差异。',
  '这不是流程问题，而是执行环节缺少监督。',
  '这不是预算的问题，而是供应商交付能力的问题。',
  '这不只是产品的错，也是运营的疏忽，两边都要改。',
  '这不是某个人的错，是系统设计本身有缺陷。',
  '这不是代码的错，是上游接口变更没通知。',
  '这不是钱的问题，是态度问题，需要重新对齐目标。',
  '瓶颈不在前端渲染，而在于后端接口的响应时间。',
  '延迟不在于网络，而在于数据库的索引缺失。',
  '问题不在代码，而在流程，先对齐验收标准。',
];

for (const s of list) {
  const r = info(s);
  if (r.hit) console.log('误伤 | ' + s + '\n    ' + r.ctx);
}
