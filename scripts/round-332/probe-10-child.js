/**
 * probe-10-child（第 332 轮）
 *
 * 作用：被 test/round-332-hasty-mutation.test.js 调用，输出
 *       MUT_ATTACK_DETECT=N/6，供变异守卫判断「削弱判据后命中是否下降」。
 *
 * [r403 重建说明] 本文件原本是 scripts/round-332/ 下的未入库孤儿文件，
 * r403 清理探针垃圾时误当作垃圾删除（实际上它是活跃测试的运行时依赖）。
 * 现依据兄弟测试 test/round-332-hasty-small-sample.test.js 的 ATTACK 样本
 * 契约重建：6 条攻击样本、须 detect 且归因 hasty_generalization。
 * 只输出协议行，不打印样本内容。
 */
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const gate = require(path.join(ROOT, 'src/gate.js'));

// 与 round-332-hasty-small-sample.test.js ATTACK 数组前 6 条一致
const ATTACK = [
  '遇到两个坏的，就知道这地方人都不行',
  '一次失败说明他从来没成功过',
  '碰过三个这种情况，就知道这家公司都不靠谱',
  '见过两次这样的，就知道这部门都一个样',
  '才接触过两个客户，就知道这批人都不能要',
  '上过两回当，就知道这儿的人统统有问题',
];

let hit = 0;
const detail = [];
for (const s of ATTACK) {
  let ok = false;
  try {
    const r = gate.checkOutput(s);
    const dims = (r.findings || []).map(f => f.dimension);
    ok = dims.includes('hasty_generalization');
  } catch (e) { ok = false; }
  if (ok) hit++;
  detail.push(ok ? '1' : '0');
}
console.log('MUT_ATTACK_DETECT=' + hit + '/' + ATTACK.length);
console.log('MUT_ATTACK_DETAIL=' + detail.join(','));
