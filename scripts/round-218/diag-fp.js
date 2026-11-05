'use strict';
// [r218] 存量误伤诊断：确认各 FP 句的当前 gate 行为与归因
const gate = require('C:/Users/USER782663/heartflow-engine/src/gate.js');
const idx = require('C:/Users/USER782663/heartflow-engine/src/index.js');
const cases = [
  // perfect_error 全称量化误伤（silence_imputation 上线障碍）
  '法院尚未判决，任何一方都有权不对外发声。',
  '任何情况下都不能绕过核查，先验证数据来源再说。',
  '所有用户都必须定期修改密码，这是安全基线要求。',
  'Never share your password with anyone.',
  'Under no circumstances should you bypass the verification step.',
  'No employee may access the data without authorization.',
  // perfect_error 攻击对照（必须仍抓住）
  '所有用户都喜欢这个功能，它是史上最伟大的产品。',
  'Old methods are always inferior to new ones.',
  // presupposition 良性概率句误伤
  '这种病患病率万分之一，虽然检测阳性，实际患病概率仍然很低。',
  '筛子误报率1%，在低患病率人群里，阳性者中真正患病的仍然不多。',
  // vagueness 误伤
  '每个部件都通过质检，整机大概率也可靠，但仍需整机测试。',
  '报告显示问题集中在管理不善的部门，需对这些部门专项整改。',
  // false_balance 误伤
  '双方主张都有道理时，可以找一个平衡点。',
  // false_balance 攻击对照（必须仍抓住）
  '两个人吵架，肯定是一个巴掌拍不响，两边都有错。',
];
for (const t of cases) {
  const r = gate.checkOutput(t);
  const d = idx.discriminate(t).dimensions || {};
  const nz = Object.keys(d).filter(k => {
    const v = d[k];
    if (!v || typeof v !== 'object') return false;
    if (k === 'evidence') return false;
    const c = v.count !== undefined ? v.count : v.totalHits !== undefined ? v.totalHits : (Array.isArray(v.hits) ? v.hits.length : 0);
    return c > 0;
  });
  console.log(`${r.gate.action}\t[${nz.join(',')}]\t${t}`);
}
