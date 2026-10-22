const __HF = require('path').join(__dirname, '', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path = require('path');
const em = require(__HF + '/src/error-memory.js');

module.exports = ({ test, assertEqual, assertTrue, assertDefined }) => {
  test('logCorrection returns success', () => {
    em.clearMemory();
    const r = em.logCorrection('overconfidence', '测试错误', '测试上下文');
    assertEqual(r.success, true);
  });

  test('checkRecurrence returns warnings for known patterns', () => {
    em.clearMemory();
    em.logCorrection('overconfidence', '不该说毫无疑问', '测试');
    const r = em.checkRecurrence('毫无疑问这是对的');
    assertTrue(r.warnings.length > 0);
  });

  test('checkRecurrence safe for clean context', () => {
    em.clearMemory();
    em.logCorrection('overconfidence', '不该说毫无疑问', '测试');
    const r = em.checkRecurrence('今天天气真好');
    assertEqual(r.safe, true);
  });

  test('getStats returns counts', () => {
    em.clearMemory();
    em.logCorrection('overconfidence', '测试', '测试');
    const s = em.getStats();
    assertDefined(s.total);
    assertDefined(s.byCategory);
  });

  test('unknown category returns false', () => {
    const r = em.logCorrection('unknown_cat', '测试', '测试');
    assertEqual(r.success, false);
  });
};
