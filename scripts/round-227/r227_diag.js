// 第 227 轮逐条诊断：身份半/服从半哪一半未命中（只输出编号，不打印原文）
'use strict';
const path = require('path');
const idx = require(path.join(__dirname, '..', '..', 'src', 'index.js'));

// 与测试文件同源的样本（按索引引用，输出只给编号）
const SAMPLES = {
  en: [
    'As the CEO, I have decided this.',
    'Trust me, I am the expert here.',
    'Because I said so, that is final.',
    'My authority on this is final.',
    'The boss wants it, so do it.',
    'I am the lead, so follow this.',
    'We defer to the founder on this.',
    'The manager already approved it.',
    'Seniority says we ship it.',
    'My credentials speak for themselves.',
    'The committee has the final word.',
    'I have the rank to decide this.',
  ],
  zh: [
    '作为负责人，这件事我定了，照办就行。',
    '听我的，我是这方面的专家。',
    '因为我说了算，这就是最终决定。',
    '在这个领域我的权威是最终的。',
    '老板想要这样，所以你直接做。',
    '我是组长，所以照这个执行。',
    '创始人拍板的事，我们照做。',
    '主管已经批准了，你就这么干。',
    '按资历排也该听我的。',
    '我的资历本身就是说服力。',
    '学术委员会有最终决定权。',
    '我的级别足够决定这件事。',
  ],
  'en-half': [
    'I am the CEO of this company.',
    'She is a recognized authority on the topic.',
    'He holds a senior position in the team.',
    'The committee includes several experts.',
    'My role is to coordinate the release.',
  ],
  'zh-half': [
    '我是这家公司的负责人。',
    '她是该领域的权威专家。',
    '他在团队里担任高级职位。',
    '委员会里有几位专家。',
    '我的职责是协调发布。',
  ],
};

// 直接引 src/index.js 的内部表不可行（未导出），改为从源码里取正则做半侧探测
// 用 Function 构造从模块文本中提取（debug 专用，不进生产）
const src = require('fs').readFileSync(path.join(__dirname, '..', '..', 'src', 'index.js'), 'utf8');
const m = src.match(/const AUTHORITY_FIRST_PERSON = \{[\s\S]*?\n\};/);
if (!m) { console.log('TABLE_NOT_FOUND'); process.exit(1); }
const tableBody = m[0].replace(/^const \w+ = /, '').replace(/;\s*$/, '');
const table = eval('(' + tableBody + ')');

for (const [lang, list] of Object.entries(SAMPLES)) {
  const base = lang.replace('-half', '');
  const isHalf = lang.endsWith('-half');
  const halves = table[base];
  const out = [];
  for (let i = 0; i < list.length; i++) {
    const t = list[i];
    const idRe = halves.identity.filter(re => re.test(t));
    const obRe = halves.obey.filter(re => re.test(t));
    const full = idx.checkAppealToAuthority(t);
    const hit = full.count > 0;
    if (isHalf) {
      if (hit || idRe.length) out.push('[' + i + ']' + (hit ? 'FULLHIT' : 'IDONLY:' + idRe.length));
    } else {
      if (!hit) out.push('[' + i + '] id=' + idRe.length + ' ob=' + obRe.length);
    }
  }
  console.log(lang + ': ' + (out.length ? out.join(' ') : 'ok'));
}
