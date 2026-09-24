'use strict';
/**
 * scripts/negative-test-superlative-round29.js
 *
 * 第 29 轮负例守卫：**注入式删条**——把本轮新增的判据从源码里删掉/破坏，
 * 良性样本必须恢复漏判（pass），证明判据真的在起作用、测试真的能抓到它。
 *
 * 参考 scripts/negative-test-absolute-claim-en.js 的既有模式。
 *
 * 注入两种破坏：
 *   ① 中文 ② 泛化表新增词（舒适/省电/优/准确率高/安）整段删除
 *   ② 英文 else 分支 superlative 判据（_supENre）置为永不匹配
 * 预期：两种注入后，原 11 条漏判样本恢复 pass（测试全红）。
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src', 'index.js');
const BAK = path.join(ROOT, 'src', 'index.js.r29bak');

const ZH_SAMPLES = [
  '这款耳机是最舒适的',
  '这台空调是最省电的',
  '这是最安全的婴儿车',
  '这是业界最优的方案',
  '这是准确率最高的算法',
  '这是市面上最漂亮的手机',
];
const EN_SAMPLES = [
  'This is the quietest dishwasher on the market',
  'It is the most comfortable headphones you can buy',
  'This is the most trustworthy baby formula brand',
  'This is the safest stroller for infants',
  'This is the best laptop for developers',
  'This is the most efficient algorithm available',
];

function runProbe() {
  const out = execFileSync(process.execPath, ['-e', `
    const gate = require(${JSON.stringify(path.join(ROOT, 'src', 'gate.js'))});
    const zh = ${JSON.stringify(ZH_SAMPLES)};
    const en = ${JSON.stringify(EN_SAMPLES)};
    const zhHit = zh.filter(s => (gate.gate(s).findings || []).some(f => f.dimension === 'confidence')).length;
    const enHit = en.filter(s => (gate.gate(s).findings || []).some(f => f.dimension === 'confidence')).length;
    console.log(JSON.stringify({ zhHit, enHit }));
  `], { encoding: 'utf8' });
  const line = out.trim().split('\n').filter(l => l.startsWith('{')).pop();
  return JSON.parse(line);
}

let step = 'probe-baseline';
try {
  if (!fs.existsSync(SRC)) { console.error('找不到 src/index.js'); process.exit(1); }
  fs.copyFileSync(SRC, BAK);
  const original = fs.readFileSync(SRC, 'utf8');

  // ─── 基线：改动必须生效 ───
  step = 'baseline';
  let r = runProbe();
  console.log(`基线（未注入）: 中文 ${r.zhHit}/${ZH_SAMPLES.length} 英文 ${r.enHit}/${EN_SAMPLES.length}`);
  if (r.zhHit !== ZH_SAMPLES.length || r.enHit !== EN_SAMPLES.length) {
    console.error('❌ 基线不合预期——本轮改动未生效，负例脚本终止');
    process.exit(1);
  }

  // ─── 注入 ①：删除中文新增评价形容词 ───
  step = 'inject-zh';
  const zhNew = '|舒适|省电|优|准确率高|高|低|贵|便宜|快|慢|轻|重|厚|薄|亮|暗|静|闹|软|硬|香|甜|新鲜|划算|值|安';
  if (!original.includes(zhNew)) { console.error('❌ 找不到中文新增词锚点——判据已变，脚本需更新'); process.exit(1); }
  fs.writeFileSync(SRC, original.replace(zhNew, ''));
  r = runProbe();
  console.log(`注入①（删中文新增词）: 中文 ${r.zhHit}/${ZH_SAMPLES.length} 英文 ${r.enHit}/${EN_SAMPLES.length}`);
  if (r.zhHit >= ZH_SAMPLES.length) {
    console.error('❌ 注入①后中文仍全命中——删条没破坏判据，测试假绿');
    process.exit(1);
  }
  console.log('  ✅ 良性样本恢复漏判，测试会变红');

  // ─── 注入 ②：英文 superlative 判据置为永不匹配 ───
  step = 'inject-en';
  fs.copyFileSync(BAK, SRC);
  const base2 = fs.readFileSync(SRC, 'utf8');
  const enAnchor = "const superlativeEN = (_supEn.match(_supENre) || []).length;";
  if (!base2.includes(enAnchor)) { console.error('❌ 找不到英文判据锚点——判据已变，脚本需更新'); process.exit(1); }
  fs.writeFileSync(SRC, base2.replace(enAnchor, 'const superlativeEN = 0;'));
  r = runProbe();
  console.log(`注入②（英文判据置 0）: 中文 ${r.zhHit}/${ZH_SAMPLES.length} 英文 ${r.enHit}/${EN_SAMPLES.length}`);
  if (r.enHit >= EN_SAMPLES.length) {
    console.error('❌ 注入②后英文仍全命中——判据没被破坏，测试假绿');
    process.exit(1);
  }
  console.log('  ✅ 良性样本恢复漏判，测试会变红');

  // ─── 恢复 ───
  step = 'restore';
  fs.copyFileSync(BAK, SRC);
  r = runProbe();
  console.log(`恢复后: 中文 ${r.zhHit}/${ZH_SAMPLES.length} 英文 ${r.enHit}/${EN_SAMPLES.length}`);
  if (r.zhHit !== ZH_SAMPLES.length || r.enHit !== EN_SAMPLES.length) {
    console.error('❌ 恢复后基线不符——源码被破坏');
    process.exit(1);
  }
  console.log('\n✅ 负例守卫通过：判据有效、测试能抓到删条');
} catch (e) {
  console.error(`❌ 步骤 ${step} 失败: ${e.message}`);
  try { if (fs.existsSync(BAK)) fs.copyFileSync(BAK, SRC); } catch (_) {}
  process.exit(1);
} finally {
  try { if (fs.existsSync(BAK)) fs.unlinkSync(BAK); } catch (_) {}
}
