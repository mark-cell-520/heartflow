// r543 负例脚本：验证 r543 新增/接线的 L4→L5 叙事约束是真守卫。
// 判据：删掉接线/删掉叙事分支 → stage 命中必须回 0。删不掉就说明没接到。
// 参考 scripts/negative-test-sec-obj-verb-round203.js 的 4/4 真守卫范式。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const fs = require('fs');

const WB = path.join(ROOT, 'src/archive/associative-engine/word-by-word-generator.js');
const AE = path.join(ROOT, 'src/archive/associative-engine.js');

const wbSrc = fs.readFileSync(WB, 'utf8');
const aeSrc = fs.readFileSync(AE, 'utf8');

let pass = 0, fail = 0;
function check(name, cond, evidence) {
  if (cond) { pass++; console.log('  [PASS] ' + name + '  ' + evidence); }
  else { fail++; console.log('  [FAIL] ' + name + '  ' + evidence); }
}

console.log('== 负例 1：接线存在性（调用方真的传了 narrative）==');
check('process() 传入了 matchedNarrativeDetail',
  /generateResponse\(\s*trace\.layers\.L4\.thoughtVector,\s*userModel,\s*200,\s*trace\.layers\.L4\.matchedNarrativeDetail/.test(aeSrc),
  'associative-engine.js 步骤6');
check('processL5() 签名带 narrative 参数',
  /async processL5\(thoughtVector, userModel, narrative = null\)/.test(aeSrc),
  'associative-engine.js processL5');

console.log('== 负例 2：消费端分支存在性 ==');
check('drift 自愈有 narrative_stage 分支',
  wbSrc.includes("source: 'narrative_stage'"),
  'word-by-word-generator.js drift_correction');
check('predictNextWord 有叙事优先分支',
  wbSrc.includes('state.narrative') && /remaining\.length > 0/.test(wbSrc),
  'predictNextWord');
check('selectFirstWord 叙事优先',
  /selectFirstWord\(thoughtVector, narrative = null\)/.test(wbSrc) && wbSrc.includes('nc.stageWords'),
  'selectFirstWord');

console.log('== 负例 3：变异测试 —— 删掉接线后 stage 命中必须归零 ==');
// 直接在内存里造一个「不传 narrative」的调用，验证 narrative 是命中原因而非巧合
const { AssociativeEngine } = require(AE);
const { WordByWordGenerator } = require(path.join(ROOT, 'src/archive/associative-engine/word-by-word-generator.js'));

(async () => {
  const eng = new AssociativeEngine(ROOT);
  const r = await eng.process('专注和心流是深度工作的关键');
  const detail = r.internal.layers.L4.matchedNarrativeDetail;
  const tv = r.internal.layers.L4.thoughtVector;
  const withNarr = r.internal.layers.L5.response;

  const stageWords = (detail && Array.isArray(detail.stages))
    ? detail.stages.map(x => (x && typeof x === 'object' ? x.stage : x))
    : [];
  const hitsWith = stageWords.filter(w => withNarr.includes(w)).length;

  // 变异 A：同一 thoughtVector，不传 narrative
  let mutated = '';
  try {
    const res = await eng.wordByWordGenerator.generateResponse(tv, {}, 200, null);
    mutated = res.response;
  } catch (e) { mutated = ''; }
  const hitsWithout = stageWords.filter(w => mutated.includes(w)).length;

  // 变异 B：narrative 传空 stages
  let mutatedB = '';
  try {
    const resB = await eng.wordByWordGenerator.generateResponse(tv, {}, 200, { stages: [], name: 'x' });
    mutatedB = resB.response;
  } catch (e) { mutatedB = ''; }
  const hitsEmptyStages = stageWords.filter(w => mutatedB.includes(w)).length;

  check('变异A（不传 narrative）stage 命中归零', hitsWithout === 0,
    'with=' + hitsWith + ' without=' + hitsWithout);
  check('变异B（空 stages）stage 命中归零', hitsEmptyStages === 0,
    'with=' + hitsWith + ' emptyStages=' + hitsEmptyStages);
  check('接线态 stage 命中 >= 2/4', hitsWith >= 2, 'hits=' + hitsWith + '/' + stageWords.length);

  console.log('\n==== 负例脚本结果: ' + pass + ' passed / ' + fail + ' failed ====');
  process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error('FATAL', e); process.exit(1); });
