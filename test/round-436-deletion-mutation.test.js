// test/round-436-deletion-mutation.test.js
// 第 436 轮删条变异守卫：本轮新增判据删除后测试必须变红
// （守卫不能被触发就不是守卫 —— 353 行删条 + 340-343 行删条）
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src', 'index.js');
const TEST = path.join(__dirname, 'round-436-bilingual-metric-quote.test.js');
const BACKUP = SRC + '.r436.bak';

const baseline = [];
const afterMut = [];
try {
  fs.copyFileSync(SRC, BACKUP);
  let src = fs.readFileSync(SRC, 'utf8');

  // ── 变异 1：删掉 r435/r436 的三条中文可定位语域豁免（法规/合同/同比环比）──
  const M1_OLD = `  const citedLegalQuote = hasChinese && M435_LEGAL_CITE_ZH.test(text) && !M435_NO_EFFECT_ZH.test(text);
  const citedContractQuote = hasChinese && M435_CONTRACT_RATIO_ZH.test(text) && !M435_NO_EFFECT_ZH.test(text);`;
  const M1_NEW = `  const citedLegalQuote = false;
  const citedContractQuote = false;`;
  const m1ok = src.includes(M1_OLD);
  if (m1ok) {
    fs.writeFileSync(SRC, src.replace(M1_OLD, M1_NEW));
    try {
      execFileSync('node', [TEST], { encoding: 'utf8', stdio: 'pipe' });
      afterMut.push('M1 删除法规/合同豁免后测试仍通过（守卫失效）');
    } catch (e) {
      baseline.push('M1 删除法规/合同豁免 -> 测试变红（守卫生效）');
    }
  } else {
    afterMut.push('M1 变异点未找到（源码已变更，跳过）');
  }
  src = fs.readFileSync(SRC, 'utf8');

  // ── 变异 2：删掉 M436_RATIO_CTX_ZH 统计/合同比例池 ──
  const M2_OLD = `    const M436_RATIO_CTX_ZH = /(?:同比|环比|较?(?:去年|上年|上期|上季度|上月|上周|年初)|较上年同期|与上年同期相比|较上期|日环比|月环比|年环比|环比上月|同比增长|同比下降)\\s*(?:增长|下降|提高|降低|增加|减少|回升|回落|升至|跌至|持平)|(?:承担|分成|分摊|赔付|赔偿|支付|预留|划拨|切分|偿付)\\s*\\d+(?:\\.\\d+)?\\s*%|\\d+(?:\\.\\d+)?\\s*%\\s*(?:的)?(?:损[失害]|费用|成本|金额|价款|份额|比例|权益|风险|责任)/;`;
  const M2_NEW = `    const M436_RATIO_CTX_ZH = /(?!)/;`;
  const m2ok = src.includes(M2_OLD);
  if (m2ok) {
    fs.writeFileSync(SRC, src.replace(M2_OLD, M2_NEW));
    try {
      execFileSync('node', [TEST], { encoding: 'utf8', stdio: 'pipe' });
      afterMut.push('M2 删除统计/合同比例池后测试仍通过（守卫失效）');
    } catch (e) {
      baseline.push('M2 删除统计/合同比例池 -> 测试变红（守卫生效）');
    }
  } else {
    afterMut.push('M2 变异点未找到（源码已变更，跳过）');
  }
  src = fs.readFileSync(SRC, 'utf8');

  // ── 变异 3：删掉 SOURCE_ANCHOR_ZH 的运维报告定位支 ──
  const M3_OLD = `|(?:根据|据|按|参照)?[^。]{0,8}(?:压测|测试|性能|线上|生产|运维|监控|巡检|审计|验收|灰度)[^。]{0,4}(?:报告|数据|记录|结果|日志|指标|看板|报表)/`;
  const m3ok = src.includes(M3_OLD);
  if (m3ok) {
    fs.writeFileSync(SRC, src.replace(M3_OLD, '|/'));
    try {
      execFileSync('node', [TEST], { encoding: 'utf8', stdio: 'pipe' });
      afterMut.push('M3 删除运维报告定位支后测试仍通过（守卫失效）');
    } catch (e) {
      baseline.push('M3 删除运维报告定位支 -> 测试变红（守卫生效）');
    }
  } else {
    afterMut.push('M3 变异点未找到（源码已变更，跳过）');
  }
} finally {
  fs.copyFileSync(BACKUP, SRC);
  fs.unlinkSync(BACKUP);
}

// ── 还原校验 ──
try {
  execFileSync('node', [TEST], { encoding: 'utf8', stdio: 'pipe' });
} catch (e) {
  console.error('❌ 还原后基线测试未通过：', e.message);
  process.exit(1);
}
// ── 守卫有效性汇总：变异后「变红」记入 baseline，「仍通过」记入 afterMut ──
console.log(`删条变异结果：${baseline.length} 支变红生效，${afterMut.length} 支未触发`);
for (const b of baseline) console.log(`  · ${b}`);
for (const a of afterMut) console.log(`  · ⚠️ ${a}`);
require('assert').ok(baseline.length >= 3,
  `本轮判据删条守卫不足（${baseline.length}/3 生效）：判据可能未真正接线`);
console.log('✅ round-436 删条变异守卫通过');
