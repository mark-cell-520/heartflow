#!/usr/bin/env node
/**
 * scripts/negative-test-reward-hacking-round32.js
 *
 * 第 32 轮负例守卫：**注入破坏 → 测试必须变红**。
 *
 * 前几轮三次踩到的坑（本轮 5/8 失效已经逼着重写一次）：
 *   ① 用正则去匹配源文件片段做注入——正则自身的转义层级
 *      （\| 与 |、\\s 与 \s）极易写错，导致「注入落空」假阴性；
 *   ② 样本不专一：删掉目标模式后，同句仍被**同族另一条**命中，
 *      测试仍绿 → 守卫失效。
 *
 * 因此本轮改为：
 *   - 注入用 **indexOf 精确锚串 + slice 删除**，不用正则匹配源码；
 *   - 每项注入配**专一样本**，并在测试里用 classes 归因断言锁死：
 *     该样本必须命中目标类。删掉目标模式后归因消失 → 测试红。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src/reward-hacking.js');
const TEST = 'test/reward-hacking-ml-eval-round32.test.js';
const orig = fs.readFileSync(SRC, 'utf8');

let pass = 0, fail = 0;
const report = (ok, name, detail) => {
  if (ok) { pass++; console.log(`  OK   ${name}${detail ? ' — ' + detail : ''}`); }
  else { fail++; console.log(`  DEAD ${name}${detail ? ' — ' + detail : ''}`); }
};

function runTest() {
  try {
    return { rc: 0, out: execFileSync('node', [TEST], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) };
  } catch (e) { return { rc: e.status || 1, out: (e.stdout || '') + '\n' + (e.stderr || '') }; }
}

/** 用锚串定位并删除一整行（含行尾换行）。anchor 必须在源文件中唯一。 */
function deleteLine(src, anchor) {
  const i = src.indexOf(anchor);
  if (i < 0) return { ok: false, src, why: `锚串未找到: ${anchor.slice(0, 40)}` };
  // 扩展到行首（往前找 \n）与行尾（往后找 \n）
  const start = src.lastIndexOf('\n', i) + 1;
  const end = src.indexOf('\n', i);
  if (end < 0) return { ok: false, src, why: '找不到行尾' };
  return { ok: true, src: src.slice(0, start) + src.slice(end + 1) };
}

/** 字符串级替换（非正则，避免转义层级问题） */
function replaceOnce(src, from, to) {
  const i = src.indexOf(from);
  if (i < 0) return { ok: false, src, why: `锚串未找到: ${from.slice(0, 40)}` };
  return { ok: true, src: src.slice(0, i) + to + src.slice(i + from.length) };
}

const INJ = [
  {
    name: '1 删 best_run_picking 首条（挑最好+汇报口径）',
    kind: 'line', anchor: '(?:挑|选|取|拿|抠|筛|捡)',
    why: '把随机种子里表现最好的那次当成最终结果 / Pick the best random seed run',
  },
  {
    name: '2 删 condition_tuning 首条（故意/凸显自认）',
    kind: 'line', anchor: '(?:故意|刻意|有意|悄悄|偷偷|暗中|专门)\\s*[^。\\n]{0,20}(?:把|将)?',
    why: '故意把对照组的条件设置得更差 / Make the control group deliberately worse',
  },
  {
    name: '3 同删 selective_reporting 首条+逗号分句（组合守卫）',
    kind: 'lines2',
    anchors: [
      '(?:只|仅|光|单单)\\s*(?:写|报|汇报|报告|展示|呈现|列|列出来|公开)\\s*[^。\\n]{0,16}(?:提升|上涨|改善|变好|增长|涨|好的?)',
      '(?:只|仅|光)\\s*(?:写|报|汇报|报告|提到|列)\\s*[^，。\\n]{0,16}(?:提升|上涨|改善|增长)',
    ],
    note: '首条 40 字窗与逗号分句互相兜底，单删任一条都不应变红（实测删后 count 仍 1）——'
      + '两条同时删才要求变红。这是设计冗余，不是守卫失效。',
  },
  {
    name: '4 删 rerun_until_significant 前两条',
    kind: 'lines2',
    anchors: ['(?:重跑|重做|再来|反复跑|反复做|多跑|多试|继续跑|接着跑|换[个种批]?)\\s*[^。\\n]{0,30}(?:直到|直至|一直到|直到跑出|跑到)', '(?:为了|以便|以求)\\s*[^。\\n]{0,20}(?:统计)?\\s*(?:显著|显著性|p\\s*值)'],
    why: '用更大的样本重跑，直到统计显著为止 / Rerun ... until ... significant',
  },
  {
    name: '5 删 metric_denominator_gaming 领域名词条',
    kind: 'line', anchor: 'change\\s+(?:the\\s+)?(?:\\w+\\s+){0,2}denominator\\s+(?:of\\s+(?:the\\s+)?\\w+\\s+)?(?:metric\\s+)?to\\s+(?:only\\s+)?(?:count|include|use)\\s+(?:only\\s+)?successful',
    why: '把延迟指标的分母换成只算成功的请求 / Change the denominator of the latency metric',
  },
  {
    name: '6 删 eval_leakage 首条（评测集+微调）',
    kind: 'line', anchor: '(?:在|把|将)\\s*[^。\\n]{0,16}(?:测试集|测试数据|评测集|评测数据|test\\s+set|benchmark\\s*数据集)\\s*(?:上|里|中)?\\s*(?:微调|训练|fit|调参|拟合)',
    why: '在评测集上微调，然后当成泛化能力对外宣传 / Fine-tune on the test set',
  },
  {
    name: '7 DISCOURSE_FRAME 退回宽词面版（报告里即豁免）',
    kind: 'replace',
    from: 'const DISCOURSE_FRAME = /(?:论文|文章|报告|研究|文献|资料)\\s*(?:里|中)?\\s*(?:提到|说|指出|表明|记载|描述|阐述|揭露|披露|讨论|分析)',
    to: 'const DISCOURSE_FRAME = /(?:论文|文章|报告|研究|文献|资料)\\s*(?:里|中|提到|说)',
    why: '报告里只写提升的部分，下降的指标不提',
  },
  {
    name: '8 CLASS_LABEL_ZH 删 best_run_picking 中文标签',
    kind: 'line', anchor: "  best_run_picking: '挑最好的一次冒充最终结果',",
    why: 'details 用中文类名断言（探针样本命中 best_run_picking）',
  },
];

console.log('══ 第 32 轮负例守卫（注入-删条-必须变红）══');
for (const inj of INJ) {
  let res;
  if (inj.kind === 'line') res = deleteLine(orig, inj.anchor);
  else if (inj.kind === 'lines2') {
    let s = orig, bad = null;
    for (const a of inj.anchors) { const r = deleteLine(s, a); if (!r.ok) { bad = r.why; break; } s = r.src; }
    res = bad ? { ok: false, src: orig, why: bad } : { ok: true, src: s };
  }
  else res = replaceOnce(orig, inj.from, inj.to);

  if (!res.ok) { report(false, `注入落空: ${inj.name}`, res.why); continue; }
  fs.writeFileSync(SRC, res.src, 'utf8');
  const r = runTest();
  const red = r.rc !== 0;
  const m = r.out.match(/FAIL (?:命中|gate|归因|discriminate|checkRewardHacking|DSec)[^\n]*/);
  report(red, inj.name, red ? (m ? m[0].slice(0, 90) : `rc=${r.rc}`) : `注入后仍全绿（样本: ${inj.why}）`);
  fs.writeFileSync(SRC, orig, 'utf8');
}

const restored = fs.readFileSync(SRC, 'utf8') === orig;
console.log(`\n还原字节级一致: ${restored ? 'OK' : 'FAIL'}`);
if (!restored) process.exit(1);
const sanity = runTest();
console.log(`还原后测试: ${sanity.rc === 0 ? 'OK 全绿' : 'FAIL ' + sanity.out.slice(0, 200)}`);
if (sanity.rc !== 0) process.exit(1);
console.log(`\n结果: ${pass} 项注入有效, ${fail} 项失效`);
process.exit(fail === 0 ? 0 : 1);
