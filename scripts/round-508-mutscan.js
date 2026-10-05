/** r508：为变异守卫找「独占支」——替换该支后从 hit 变 miss 的样本集 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const samples = JSON.parse(fs.readFileSync(path.join(__dirname, '../test/round-507-standard-shift-samples.json'), 'utf8'));
const modPath = path.join(__dirname, '../src/self-imposed-standard-shift.js');
const orig = fs.readFileSync(modPath, 'utf8');
const { checkStandardShift } = require(modPath);

function hitsWith(src) {
  const tmp = path.join(__dirname, `.tmp-r508-mut-${process.pid}-${Math.random().toString(36).slice(2)}.js`);
  fs.writeFileSync(tmp, src);
  try {
    delete require.cache[require.resolve(tmp)];
    const { checkStandardShift: m } = require(tmp);
    return new Set(samples.attacks.map((s, i) => (m(s).hit ? i : -1)).filter(i => i >= 0));
  } finally { try { fs.unlinkSync(tmp); } catch (_) {} }
}

const base = hitsWith(orig);
console.log('基线命中条数 =', base.size);

const cands = [
  ['ACH_ZH 数量词前置支',
    "'|(?:你|你们)?(?:都|全)?(?:这|那|三|两|几|多|\\\\d+)?(?:轮|次|遍|回|趟)(?:都|已经)?' +\n  '(?:改|修|做|写|讲|说)(?:完|好)(?:了)?'",
    "'|(?:你|你们)?(?:都|全)?(?:这|那|三|两|几|多|\\\\d+)?(?:轮|次|遍|回|趟)(?:都|已经)?' +\n  '(?:ZZ|ZZ)(?:ZZ)(?:了)?'"],
  ['SH_ZH 换算法支',
    "'|(?:用|按|改按)(?:新|另一套|另外一套|不同)(?:的)?(?:一套|套)' +\n'(?:标准|口径|算法|规则|指标)?(?:来)?(?:算|计算|衡量|考核|评估)'",
    "'|(?:用|按|改按)(?:新|另一套|另外一套|不同)(?:的)?(?:一套|套)' +\n'(?:标准|口径|算法|规则|指标)?(?:来)?(?:ZZ|ZZ)'"],
  ['SH_ZH 追加轮次支',
    "'|(?:再|又|额外|另外|加)(?:加)?(?:几|两|三|四|五|多)?(?:轮|次|遍|趟|回)' +\n'(?:也|很)?(?:也|很)?(?:合理|正常|应该|必须|不算多)'",
    "'|(?:再|又|额外|另外|加)(?:加)?(?:几|两|三|四|五|多)?(?:轮|次|遍|趟|回)' +\n'(?:也|很)?(?:也|很)?(?:ZZ)'"],
  ['SH_ZH 原标准太低支',
    "'|(?:那个|原先|原来|既有|此前|约定)(?:的)?(?:标准|门槛|标杆|基准|考纲)(?:定(?:得)?|设(?:得)?)(?:太)?(?:低|松|宽松|容易|低啦|太低)'",
    "'|(?:那个|原先|原来|既有|此前|约定)(?:的)?(?:ZZ|ZZ)'"],
  ['SH_ZH 还能更好支',
    "'|(?:还能|还可以|应该|可以)(?:更好|更好一点|更强|更快|更完善|更完美|更优秀|更出色)'",
    "'|(?:ZZ|ZZ)(?:ZZ)'"],
  ['ACH_ZH 契约达成支',
    "'|(?:达到|满足|符合|符合了|够)(?:合同|契约|协议|约定|标书|订单|需求)(?:的)?(?:要求|规定|条款|标准|条件)'",
    "'|(?:ZZ|ZZ)(?:合同|契约|协议|约定|标书|订单|需求)(?:的)?(?:要求|规定|条款|标准|条件)'"],
];
for (const [name, from, to] of cands) {
  if (!orig.includes(from)) { console.log(`${name}: 源码未找到该支文本，跳过`); continue; }
  const after = hitsWith(orig.replace(from, to));
  const lost = [...base].filter(i => !after.has(i));
  console.log(`${name}: 独占样本数 = ${lost.length} → ${lost.map(i => `#${i + 1}`).join(',')}`);
}
