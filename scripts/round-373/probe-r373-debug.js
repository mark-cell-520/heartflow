// r373 断线产能收尾：CORRECT_ZH 承重注入失败根因定位
// 测试句：'税负归宿取决于供需弹性，法定纳税人不等同于实际负税人。'
// 断言：注入空 CORRECT_ZH 后应 hit=true（证明豁免承重）
const path = '/root/hermes1/skills/ai/mark-heartflow-skill/src/tax-incidence.js';
const m = require(path);
const S = '税负归宿取决于供需弹性，法定纳税人不等同于实际负税人。';
console.log('detectTaxIncidence 导出键:', Object.keys(m));
const fn = m.detectTaxIncidence || m.default || m.checkTaxIncidence;
console.log('fn typeof:', typeof fn);

// 1) 原句
console.log('1) 原句 hit =', JSON.stringify(fn(S)));

// 2) 注入空 CORRECT_ZH
try {
  const r2 = fn(S, { CORRECT_ZH: [] });
  console.log('2) 注入空 CORRECT_ZH hit =', JSON.stringify(r2));
} catch (e) { console.log('2) ERR', e.message); }

// 3) 注入空 CONCEPT_ZH + CORRECT_ZH
try {
  const r3 = fn(S, { CORRECT_ZH: [], CONCEPT_ZH: [] });
  console.log('3) 注入空 CORRECT+CONCEPT hit =', JSON.stringify(r3));
} catch (e) { console.log('3) ERR', e.message); }

// 4) 尝试注入永假正则
try {
  const r4 = fn(S, { CORRECT_ZH: /(?!)/i });
  console.log('4) 注入永假 CORRECT_ZH hit =', JSON.stringify(r4));
} catch (e) { console.log('4) ERR', e.message); }

// 5) 打印 normalize 后的文本与三条腿常量
const src = require('fs').readFileSync(path, 'utf8');
// 提取腿常量名
for (const name of ['TAXTOOL_ZH', 'STATUTORY_ZH', 'NOTRANSFER_ZH', 'CORRECT_ZH', 'CONCEPT_ZH']) {
  const mm = src.match(new RegExp('const ' + name + ' = (/[^\\n]+)'));
  console.log(name, '定义存在:', !!mm);
}
