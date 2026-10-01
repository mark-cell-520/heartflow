/**
 * r331 变异守卫：改动删掉必须变红。
 *
 * 对象：src/index.js 的 isInfoDeprivationCompound（第 331 轮新增）。
 * 方法：把关键片段替换成等价无效写法 → 跑负例守卫 test 文件 → 断言 exit != 0；
 *      然后还原 → 断言 exit == 0。4 个变异各做一轮。
 *
 * 变异位：
 *   M1 剥夺支1（否定词+告知动词）整体作废 → 常量改为永假
 *   M2 剥夺支3（你+知情状态）作废
 *   M3 服从支收尾前瞻放宽（去掉 (?=$|[标点]) 限制）→ 应当吃掉良性句
 *   M4 三个豁免全部作废 → 良性句被拉进来，同样必须变红
 *
 * 变异有效的**前提**是主测试 BENIGN 集里存在真正落在该分支上的样本。
 * r332 遗留：M3/M4 实测「守卫不敏感」，probe-14 逐条映射后确认根因是
 * 良性集没有两半齐备且靠前瞻/豁免挡住的样本（obey=Y 但前瞻/豁免均为 N）。
 * 已在 test/round-331-info-deprivation-compound.test.js 补 4 组真承重样本，
 * 本文件因此全部变红。若将来 M3/M4 再次不敏感，先查 BENIGN 集而不是改本文件。
 */
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src/index.js');
const TEST = path.join(ROOT, 'test/round-331-info-deprivation-compound.test.js');
const orig = fs.readFileSync(SRC, 'utf8');

const MARK_DEPRIVE_1 = 'const ID_COMPOUND_DEPRIVE_ZH =';
const MARK_DEPRIVE_YOU = 'const ID_COMPOUND_DEPRIVE_YOU_ZH =';
const MARK_DEPRIVE_STATE = 'const ID_COMPOUND_DEPRIVE_STATE_ZH =';
const MARK_OBEY = 'const ID_COMPOUND_OBEY_ZH =';
const MARK_REFUSAL = 'const ID_COMPOUND_OBEY_REFUSAL_ZH =';
const MARK_POLITE = 'const ID_COMPOUND_OBEY_POLITE_ZH =';
const MARK_FALLBACK = 'const ID_COMPOUND_FALLBACK_ZH =';

const MUTATIONS = [
  {
    name: 'M1 剥夺支1（否定+告知动词）作废',
    from: MARK_DEPRIVE_1 + '\n  /(?:不|没|无|别|未|难|不便|不能)(?:能|可以|便|方便|会|必|得)?(?:说|讲|透露|解释|告诉|告知|公开|说清|讲清|过问|打听|插手|掺和|给(?:你|们)?)/;',
    to: MARK_DEPRIVE_1 + '\n  /(?!x)x/;',
  },
  {
    name: 'M2 剥夺支3（你+知情状态）作废',
    from: MARK_DEPRIVE_STATE + '\n  /你[^。！？，,；;]{0,8}(?:不清楚|不了解|不懂|不明白)/;',
    to: MARK_DEPRIVE_STATE + '\n  /(?!x)x/;',
  },
  {
    name: 'M3 服从支收尾前瞻放宽',
    from: '(?:就)?(?:行|可以|好|是|罢了)?(?=$|[，,。！？!?；;])|按[我着]?',
    to: '(?:就)?(?:行|可以|好|是|罢了)?|按[我着]?',
  },
  {
    name: 'M4 三个豁免全部作废',
    from: '  if (ID_COMPOUND_OBEY_REFUSAL_ZH.test(text)) return false;\n  if (ID_COMPOUND_OBEY_POLITE_ZH.test(text)) return false;\n  if (ID_COMPOUND_FALLBACK_ZH.test(text)) return false;',
    to: '  // 变异：豁免被删除',
  },
];

function runTest() {
  try {
    cp.execSync(`node ${JSON.stringify(TEST)}`, { cwd: ROOT, stdio: 'pipe' });
    return 0;
  } catch (e) {
    return typeof e.status === 'number' ? e.status : 1;
  }
}

let ok = 0, bad = 0;
// 基线：还原状态下必须 PASS
assert.strictEqual(runTest(), 0, '基线（未变异）应当 PASS');
console.log('基线：PASS（未变异）');

for (const m of MUTATIONS) {
  if (!orig.includes(m.from)) {
    console.log(`跳过 ${m.name}：锚点未找到（源码可能已变）`);
    continue;
  }
  fs.writeFileSync(SRC, orig.replace(m.from, m.to));
  try {
    const code = runTest();
    if (code !== 0) { console.log(`变红 ✓ ${m.name}`); ok++; }
    else { console.log(`未变红 ✗ ${m.name} —— 守卫对该改动不敏感`); bad++; }
  } finally {
    fs.writeFileSync(SRC, orig);
  }
}
// 还原后必须回到 PASS
assert.strictEqual(runTest(), 0, '还原后必须 PASS');
console.log('还原：PASS');

console.log(`r331 变异守卫：${ok} 个变红 / ${bad} 个不敏感`);
assert.strictEqual(bad, 0, '存在不敏感变异');
assert.ok(true);
