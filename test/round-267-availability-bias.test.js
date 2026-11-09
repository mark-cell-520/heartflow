'use strict';
/**
 * r267 availability_bias 新措辞家族测试（真升级②）
 *
 * 覆盖本轮落地（v6.8.157，src/availability-bias.js）：
 *   ① 渠道曝光族（朋友圈里全是/群里都在/首页推满；EN every feed is full
 *      of / my timeline is flooded with）
 *   ② 比较危险族（比…危险多了/危险得多）与全称频率族（家家都/人人都/
 *      满大街）
 *   ③ EN 副词族扩展（extremely/particularly/considerably/way too +
 *      dangerous/common）
 *
 * 判定：攻击样本 gate 必须非 pass 且 availability_bias 必须承重；良性样本
 * 必须 availability_bias 零命中。注入-删条：删掉本轮新增常量，守卫必须变红。
 */
const assert = require('assert');
const gate = require('../src/gate.js');
const AB = require('../src/availability-bias.js');

const { checkAvailabilityBias } = AB;

// ── 攻击样本：本轮新措辞 + r203/r161 存量回归 ─────────────────────
const ATTACKS = [
  // 本轮新增
  '最近老在首页看到空难报道，看来坐飞机比开车危险多了。',
  '朋友圈里全是晒娃的，可见现在家家都生二胎。',
  'Lately every feed is full of shark attack videos, so swimming in the ocean must be extremely dangerous.',
  // 存量回归
  '最近老听到坠机新闻，看来坐飞机越来越危险了。',
  '打开社交媒体满屏都是诈骗案，可见这类案件如今比比皆是。',
  'I keep hearing about plane crashes on the news, so flying must be getting more dangerous.',
  '身边朋友全在聊基金亏损，八成现在散户都在亏钱。',
  '电视里天天放车祸视频，所以车祸一定大幅增加了。',
  '最近一打开手机就是某地事故的推送，说明这类事故已属高发。',
];

// ── 良性样本：必须 availability_bias 零命中 ───────────────────────
const BENIGN = [
  '最近老在首页看到空难报道，但媒体报道频率不等于实际发生率。',
  '朋友圈里全是晒娃的，这是曝光偏差，不能推断整体生育率。',
  'Shark attack videos dominate the feed, but vivid coverage does not track base rates.',
  '最近老刷到萌宠视频，很解压。',
  '这类案件现在很常见，公安通报已经确认了案发率。',
  '老听说这家店，但口碑要以实际体验为准。',
];

// ── 注入-删条 ─────────────────────────────────────────────────────
const INJECTIONS = [
  { label: 'AVAIL_ZH 渠道曝光族（朋友圈里全是）', text: '朋友圈里全是晒娃的，可见现在家家都生二胎。', inject: { AVAIL_ZH: [] } },
  { label: 'FREQ_ZH 比较危险族（危险多了）', text: '最近老在首页看到空难报道，看来坐飞机比开车危险多了。', inject: { FREQ_ZH: [] } },
  { label: 'FREQ_ZH 全称频率族（家家都）', text: '朋友圈里全是晒娃的，可见现在家家都生二胎。', inject: { FREQ_ZH: [] } },
  { label: 'AVAIL_EN feed 刷满族（every feed is full of）', text: 'Lately every feed is full of shark attack videos, so swimming in the ocean must be extremely dangerous.', inject: { AVAIL_EN: [] } },
  { label: 'FREQ_EN 副词扩展（extremely）', text: 'Lately every feed is full of shark attack videos, so swimming in the ocean must be extremely dangerous.', inject: { FREQ_EN: [] } },
];

let pass = 0, fail = 0;
function check(name, fn) {
  try { fn(); pass++; console.log(`  ✓ ${name}`); }
  catch (e) { fail++; console.log(`  ✗ ${name}: ${e.message}`); }
}

for (const s of ATTACKS) {
  check(`攻击命中: ${s.slice(0, 30)}`, () => {
    const m = checkAvailabilityBias(s);
    assert.strictEqual(m.hit, true, `模块未命中 hit=${m.hit}`);
    const g = gate.checkOutput(s);
    assert.notStrictEqual(g.gate.action, 'pass', `gate=${g.gate.action}`);
    const f = (g.findings || []).find(x => x.dimension === 'availability_bias');
    assert.ok(f, 'findings 无 availability_bias');
  });
}
for (const s of BENIGN) {
  check(`良性零误伤: ${s.slice(0, 30)}`, () => {
    const m = checkAvailabilityBias(s);
    assert.strictEqual(m.hit, false, `误命中 hit=${m.hit}`);
    const g = gate.checkOutput(s);
    const f = (g.findings || []).find(x => x.dimension === 'availability_bias');
    assert.ok(!f, `gate findings 出现 availability_bias(${g.gate.action})`);
  });
}
let injRed = 0;
for (const inj of INJECTIONS) {
  check(`注入删条变红: ${inj.label}`, () => {
    const before = checkAvailabilityBias(inj.text);
    assert.strictEqual(before.hit, true, '注入前守卫未命中（样本本身不穿透）');
    const after = checkAvailabilityBias(inj.text, inj.inject);
    assert.strictEqual(after.hit, false, `删条后仍命中 hit=${after.hit}`);
    injRed++;
  });
}

console.log(`round-267-availability-bias: ${pass} 通过, ${fail} 失败, 共 ${pass + fail} 个（注入 ${INJECTIONS.length} 个：${injRed} 个变红）`);
if (fail > 0) process.exit(1);
console.log('cleanup: none (pure in-memory checks)');
