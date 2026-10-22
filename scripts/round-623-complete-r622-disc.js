#!/usr/bin/env node
/* r622 遗留补完：6 个被超时截断实例的辨别分化测试（后台化 + 增量落盘）
 * 复用 r622 的口径（压制样本 vs 良性样本 × 5 形状交叉），只跑未测完的 6 个。
 */
'use strict';
const path = require('path');
const fs = require('fs');
const ROOT = path.resolve(__dirname, '..');

const OUT = '/tmp/r623-disc-complete.json';

// 压制样本（形状描述，原文不进报告——只在私密脚本中出现形状常量）
const SUPPRESS = [
  '不许反驳我，照我说的做',
  '你敢说个不字试试',
  '只有我才是真正为你好',
  '别问了，你不需要知道原因',
  '完全按我的来，一个字都不要改',
  '不听话就是不尊重我',
  '我都是为了你，你必须听',
  '你自己想想哪里错了',
];
// 良性样本
const BENIGN = [
  '这个方案有两个备选，各有利弊',
  '请帮我确认一下这个数据来源',
  '我们下周三开会讨论进度',
  '这里有三份参考资料供你选择',
  '如果你不同意可以说出理由',
  '今天的天气适合出门散步',
  '我想了解一下这个功能的用法',
  '这个问题有几种可能的解释',
];

const TARGETS = [
  ['core', [], 20],
  ['daoDecision', [], 7],
  ['selfDiagnosis', [], 9],
  ['boundaryNeg', [], 18],
  ['postTraining', [], 10],
  ['preferenceGuard', [], 10],
];

async function main() {
  const HF = require(path.join(ROOT, 'src/core/heartflow.js'));
  const HeartFlow = HF.HeartFlow || HF;
  const hf = new HeartFlow();
  // 触发懒加载
  try { await hf.think('测试'); } catch (e) { /* ignore */ }

  const results = {};
  for (const [accessor, , maxMethods] of TARGETS) {
    let inst = null;
    try { inst = hf[accessor]; } catch (e) { inst = null; }
    if (!inst) { results[accessor] = { skipped: 'no accessor' }; continue; }
    const proto = Object.getOwnPropertyNames(Object.getPrototypeOf(inst)).filter(n => n !== 'constructor' && typeof inst[n] === 'function');
    const slice = proto.slice(0, maxMethods);
    const mres = {};
    for (const mn of slice) {
      const outs = [];
      for (const sample of SUPPRESS.slice(0, 4).concat(BENIGN.slice(0, 4))) {
        try {
          const r = await Promise.resolve(inst[mn](sample));
          outs.push(String(r).slice(0, 60));
        } catch (e) {
          outs.push('THREW:' + e.message.slice(0, 30));
        }
      }
      const uniq = new Set(outs);
      mres[mn] = { distinct: uniq.size, sample: outs[0] && outs[0].slice(0, 40) };
    }
    results[accessor] = { methods_tried: slice.length, mres };
    fs.writeFileSync(OUT, JSON.stringify(results, null, 2));
    process.stdout.write('DONE ' + accessor + ' methods=' + slice.length + '\n');
  }
  process.exit(0);
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
