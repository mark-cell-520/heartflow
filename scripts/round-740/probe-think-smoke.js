// r740 think() 冒烟探针：new HeartFlow + think() 真实调用，验证
// silence_imputation 书面语新族在引擎口径下的正反判别（require 不调用
// 不算验证）。判据：_inputDiscrimination.dims.silence_imputation.score。
'use strict';
const path = require('path');
const { HeartFlow } = require(path.join(__dirname, '..', '..', 'src', 'core', 'heartflow.js'));

const CASES = [
  // [text, expectHit, note]
  ['该企业至今未作回应，无异于坐实了指控', true, '腿①未作族'],
  ['公司至今未发布声明，这足以说明问题', true, '腿①发布族×腿②这足以说明'],
  ['他至今没有出来辩解，这恰恰说明他在撒谎', true, '腿①辩解族×腿②恰恰扩展'],
  ['对方至今没有发声，证明他们理亏', true, '腿②理亏族'],
  ['官方至今没有公布真相，说明其中必有隐情', true, '腿②隐情族'],
  ['团队一直没有表态，说明确实存在这个问题', true, '腿②存在问题族'],
  ['至今没有给出说法，证明他们理亏', true, '腿①给出说法×腿②理亏'],
  ['该公司未发布声明，which only confirms the suspicion.', true, '跨语言配对'],
  // 良性：si 不命中
  ['官方未发布声明，记者仍在门口等待', false, '无腿②'],
  ['律师建议当事人在此阶段不予回应', false, '合法权利陈述'],
  ['他这个论点明显理亏，因为数据不支持', false, '纯辩论评价'],
  ['服务器没有响应，说明存在连接问题', false, '技术语境'],
];

let pass = 0, fail = 0;
const engine = new HeartFlow({ dataDir: path.join(__dirname, '..', '..', 'data'), silent: true });
engine.start();

Promise.all(CASES.map(([text, expectHit, note]) =>
  engine.think(text).then((r) => {
    const dims = (r._inputDiscrimination && r._inputDiscrimination.dims) || {};
    const d = dims.silence_imputation;
    const score = d && typeof d.score === 'number' ? d.score : 0;
    const hit = score > 0;
    const ok = hit === expectHit;
    if (ok) { pass++; } else { fail++; }
    console.log(`${ok ? '✅' : '❌'} [${hit ? 'HIT' : 'miss'}] atm=${score} 期望${expectHit ? 'HIT' : 'miss'}（${note}） ${text.slice(0, 26)}`);
  }).catch((e) => {
    fail++;
    console.log(`❌ think() 抛错（${note}）: ${e.message}`);
  })
)).then(() => {
  console.log(`\n汇总: ${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
});
