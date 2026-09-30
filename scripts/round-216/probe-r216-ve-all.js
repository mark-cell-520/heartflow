// 第 216 轮：verification-engine × skill-verifier 缺陷全集量化探针
const path = require('path');
const { skillVerifier } = require('../../src/shield/skill-verifier.js');
const ve = require('../../src/core/verification-engine.js').verificationEngine;

const bad = [
  '---', 'name: Bad_Name!!', '---', '# Bad Name v1.0.0', '',
  '## 随便', '收入 $123456 未标注。', '这是猜测。', '/etc/passwd 绝对路径。',
  '[]()', '[x](#nope)',
].join('\n');
const good = '---\nname: test-skill\nversion: 1.0.0\n---\n# Test Skill v1.0.0\n\n## 触发条件\nx\n\n## 核心功能\ny\n';

function t(name, fn) {
  try { const r = fn(); console.log('  ' + name + ' => OK ' + JSON.stringify(r).slice(0, 130)); }
  catch (e) { console.log('  ' + name + ' => THROWS ' + e.message); }
}

console.log('A) skill-verifier.verify 输出形状');
t('坏文档 errors[0] 形状', () => {
  const r = skillVerifier.verify(bad);
  const e0 = r.errors[0];
  return { type: typeof e0, keys: e0 && typeof e0 === 'object' ? Object.keys(e0).slice(0, 4) : null, warnings: r.warnings.length };
});
t('清理形（好文档）', () => {
  const r = skillVerifier.verify(good);
  return { ok: r.ok, errors: r.errors.length, summaryType: typeof r.summary };
});

console.log('B) verification-engine.verifySkill');
t('坏文档', () => { const r = ve.verifySkill(bad); return { ok: r.ok }; });
t('好文档', () => { const r = ve.verifySkill(good); return { ok: r.ok }; });
t('verifyCode(bad js)', () => { const r = ve.verifyCode('function f(){ return 1', 'js'); return { ok: r.ok }; });
t('verifyCode(good js)', () => { const r = ve.verifyCode('function f(){ return 1; }', 'js'); return { ok: r.ok }; });
t('verifyClaims', () => {
  const r = ve.verifyClaims('研究表明 AI 能提升 30% 的效率，专家认为这必然导致失业。');
  return { claims: r.claims.length, confidenceType: typeof r.confidence, markLen: r.mark.length };
});
t('healthCheck', () => { const h = ve.healthCheck(); return { healthy: h.healthy, healthScore: h.healthScore }; });
t('quickCheck(skill)', () => ve.quickCheck(good, 'skill'));
t('clearCache', () => ve.clearCache());

console.log('C) fullVerification（async 主流程）');
(async () => {
  for (const [label, doc] of [['skill 好文档', good], ['skill 坏文档', bad], ['code 坏代码', 'function f(){ return 1'], ['general', '一些普通文本，包含 100% 绝对化的断言。']]) {
    try {
      const r = await ve.fullVerification(doc, label.startsWith('code') ? 'code' : label.startsWith('general') ? 'general' : 'skill');
      console.log('  fullVerification[' + label + '] => OK issues=' + r.issues.length + ' confidence=' + r.confidence);
    } catch (e) {
      console.log('  fullVerification[' + label + '] => THROWS ' + e.message);
    }
  }
  console.log('D) generateReport');
  try {
    const fv = await ve.fullVerification(good, 'skill');
    console.log('  generateReport => OK ' + ve.generateReport(fv).split('\n')[0]);
  } catch (e) { console.log('  generateReport => THROWS ' + e.message); }
})();
