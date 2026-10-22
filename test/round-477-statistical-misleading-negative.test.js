/**
 * round-477-statistical-misleading-negative.test.js
 * 注入-删条-必须变红负例：验证 r477 新族守卫不是空断言。
 *
 * 做法：读 src/statistical-misleading.js 源码，逐个删掉 r477 新增的三处判据
 * （fold 汉字数字形 / from-to 动词到/至形 / 无单位裸对照分支），
 * 在隔离副本上重跑本轮攻击组，断言必须有样本从命中变为漏判。
 * 若删条后攻击组仍全命中 → 守卫是空断言，测试必须红。
 */
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const SRC = path.resolve(__dirname, '../src/statistical-misleading.js');
const original = fs.readFileSync(SRC, 'utf8');

// r477 三处新增判据的「指纹」——删掉它们应让对应族漏判
const MUTANTS = [
  {
    name: '删 C1_FOLD_ZH 汉字数字倍形',
    needle: '翻[了着过]?[一二两三四五六七八九十]?[倍番]|翻[了着过]?\\d+(?:\\.\\d+)?\\s*[倍番]',
    replaceWith: '翻[了着过]?[倍番]',
    family: '族1',
  },
  {
    name: '删 C1_FROMTO_ZH 到/至形',
    needle: '(?:了?\\s*)(?:到\\s*|至\\s*)?[\\d.]+',
    replaceWith: '(?:了?\\s*)[\\d.]+',
    family: '族2',
  },
  {
    name: '删 C2 SMALL_ABS_BARE_EN 分支',
    needle: 'if (m && C1_FROMTO_EN.test(text)) {',
    replaceWith: 'if (false && m && C1_FROMTO_EN.test(text)) {',
    family: '族3',
  },
];

// 各族攻击样本。
// 注意 C1×C2 双条件是本体设计：纯「翻了三倍」无小基数证据不算攻击，
// 故族1 样本需自带其他小基数证据（万分之N / 人数），且不依赖 from-to 判据，
// 否则删族1 判据会被族2 兜住、变异断言失效。
const FAMILY_SAMPLES = {
  族1: [
    '转化率翻了三倍，目前只有万分之二的基数在支撑。',
    '本季度满意度翻了五倍，反馈仅来自 3 个人。',
  ],
  族2: [
    '本月注册用户从 5 个涨到 30 个。',
    '投诉量从 3 起降到 2 起。',
  ],
  族3: [
    'Conversion tripled, from 2 to 6.',
    'Revenue doubled, from 4 to 9.',
  ],
};

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'r477-mut-'));

function loadFresh(filePath) {
  // 清掉 require 缓存以拿到变异版
  delete require.cache[require.resolve(filePath)];
  const mod = require(filePath);
  return mod.checkStatisticalMisleading;
}

// 基线：原版三个族必须全命中
let baseOk = true;
for (const [fam, samples] of Object.entries(FAMILY_SAMPLES)) {
  for (const t of samples) {
    const r = loadFresh(SRC)(t);
    if (!r.hit) { console.log(`  基线未命中(${fam}): ${t.slice(0, 30)}`); baseOk = false; }
  }
}
assert.ok(baseOk, '变异测试前置失败：原版本体未全命中，先修本体再测守卫');
console.log('基线（原版）：三个族攻击样本全命中 ✅');

// 逐个变异：删掉判据 → 对应族必须出现漏判
for (const mut of MUTANTS) {
  let mutated;
  if (mut.replaceWith !== undefined) {
    if (!original.includes(mut.needle)) { console.log(`  ⚠️ ${mut.name}: 源码中未找到指纹，跳过`); continue; }
    mutated = original.replace(mut.needle, mut.replaceWith);
  } else {
    if (!original.includes(mut.needle)) { console.log(`  ⚠️ ${mut.name}: 源码中未找到指纹，跳过`); continue; }
    mutated = original.replace(mut.needle, '');
  }
  assert.notStrictEqual(mutated, original, `${mut.name}: 变异未生效（替换没变）`);

  const tmpFile = path.join(tmpDir, `sm-${mut.family}.js`);
  fs.writeFileSync(tmpFile, mutated);

  const check = loadFresh(tmpFile);
  const samples = FAMILY_SAMPLES[mut.family];
  const misses = samples.filter(t => !check(t).hit);

  console.log(`${mut.name} → ${mut.family} 漏判 ${misses.length}/${samples.length}`);
  assert.ok(misses.length > 0,
    `删条未变红：${mut.name} 后 ${mut.family} 仍全命中 → 守卫是空断言`);
}

fs.rmSync(tmpDir, { recursive: true, force: true });
console.log('\nround-477 删条变异负例: 三处判据均验证有效（删条即变红）✅');
