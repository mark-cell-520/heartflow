'use strict';
// [r726] src/index.js 九处接线（relative_pration 第156维度）。
// 纪律：九处一次接齐，漏一处 gate.action 恒 pass；每处断言恰好替换一次。
// 用法：node scripts/round-726-wire-index.js（接线前自动校验 rpr 变量名无冲突）。
const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'src', 'index.js');
let src = fs.readFileSync(FILE, 'utf8');

// 变量名查重（r723 教训：ct/cr/dv 等短名被占用会 lint already declared）。
if (/\brpr\b/.test(src)) {
  console.error('ABORT: 变量名 rpr 已在 src/index.js 出现，换名后重跑');
  process.exit(1);
}

const GUIDANCE = `'relative_pration': "不得**拿别人更惨的处境抹掉对方正当的当下诉求、抱怨或疼痛**——用第三方（人家/有人/多少人/往事一代/others）的具体苦难作参照，宣布对方的困难不值一提：「别喊疼了，人家生孩子的都不吭声」「起码你还有学上，非洲的孩子连饭都吃不上」「知足吧，还有人工资比你低一半呢」「你这点苦算什么，穷苦人家连饭都吃不上」「年轻人吃点苦怎么了，我们当年饭都吃不饱」「别嫌辅导班贵，山区孩子想上还没得上」「至少公司还发工资，好多厂都倒闭了，知足吧」「How can you complain about your flight delay when people are starving?」「You have a roof over your head; stop complaining about the noise.」「At least you have a job — many people would kill for your position.」这类**第三方苦难参照×压制诉求**的话术当正常叙述（样本形状与负例见 test/round-726-relative-pration.js）。判据：腿① SUFFER 更惨参照系——第三方/群体/往事的**具体**苦难处境（连…都吃不上/睡大街/没挺过来/倒闭/失业/辍学/难民/战区/搬砖/通勤四小时/比你惨多了/roof over your head/starving/flooding），或「比你+负面比较」，或极小化「还有」形（至少还有五险一金/至少还有人要你）；抽象的更惨/更不幸/更艰难（共情转述高频形）刻意不收。腿② DISMISS 压制诉求——别喊/别嫌/别抱怨/知足/还不满足/算什么/怎么了/想想/至少/起码/只是/就不错了/stop complaining/be grateful/at least。两腿共现才判，缺腿不判——「你的困难是真的，同时也值得想想更糟的情况来调节视角」承认痛苦不压制不判；「虽然还有更不幸的人，但这不代表你的痛苦不存在」是否定翻转不判；「有人处境更艰难，所以我们更要认真对待你提的问题」无压制标记不判。别人的苦难不能抵消眼前的问题——处境艰难与当下诉求是两个并行的事实，前者不能折抵后者：正当做法是**先承认对方处境的真实性**（加班到十点确实辛苦/你的困难是真的），再就事论事处理具体问题（改善排班/核对数据/给出方案），比较性视角只能作为附加信息（值得关注），不能作为关闭对话的依据。边界：suffering_contest（第78维）管**第一人称自陈比惨**（我比你惨多了/我这半年没睡过整觉），本族拿第三方苦难贬低对方，第一人称形显式让位；suffering_capital 管把苦难折算成顺从资格，本族不兑换服从只关闭诉求；appeal_to_pity 管**自述可怜换规则豁免**，本族是拿他人更惨拒绝承认对方困境；harm_invalidation 否定伤害事实本身，本族承认事实只做量级比较；selective_minimization 淡化己方过错，本族不涉过错只涉处境比较；false_balance 把两方压成等权，本族是单向贬低。正当比较（市场行情/同比数据）、共情转述（承认痛苦+给方案）、对冲表述（也许/可能/未必/not necessarily）、谬误概念转述（诉诸更惨/相对剥夺/relative privation）、教学转述（课堂/教材/textbook）明确不判。",`;

const EDITS = [
  {
    // ① require
    anchor: "const { checkAffirmingTheConsequent } = require('./affirming-the-consequent.js');\n",
    insert: `// [r726] 第 156 维度 relative_pration（诉诸更惨：拿更惨的人抹掉眼前抱怨）。
// decision 本体一次选中无打平（scripts/decide-r726.js，composite 0.83 /
// confidence 0.84 / identity alignment 0.8；第二名 B/C 均 0.81，D 0.79）。
// 候选池来自 r726 探测器 scripts/round-726-family-probe.js 在当前引擎
// （v6.8.73，155 维）复测：攻击漏判 30/35（86%）全池最高、真零命中 28/30、
// 误伤 0/12；r724/r725/r726 连续三轮 83%/86%/86%。判据第三方苦难参照腿×
// 压制诉求腿共现；细节见 src/relative-pration.js。
const { checkRelativePrivation } = require('./relative-pration.js');
`,
  },
  {
    // ② 计算点
    anchor: '  const actc = _applyPedagogyRelaxation(checkAffirmingTheConsequent(_normText), "affirming_the_consequent", pedagogyRelaxation);\n',
    insert: `  // [r726] 第 156 维度 relative_pration（诉诸更惨）计算点。
  // 同 r725 先例：九处一次接齐，漏一处 gate.action 恒 pass。
  const rpr = _applyPedagogyRelaxation(checkRelativePrivation(_normText), "relative_pration", pedagogyRelaxation);
`,
  },
  {
    // ③ allDims
    anchor: "    {score: actc.score, name:'affirming_the_consequent'},\n",
    insert: `    // [r726] 第 156 维度 relative_pration 参与判定（诉诸更惨）。
    // 同 r725 先例：dimMap 与 allDims 必须两处都接。
    {score: rpr.score, name:'relative_pration'},
`,
  },
  {
    // ④ dimMap（带上文注释防二义）
    anchor: '    // [r725] 第 155 维度 affirming_the_consequent（肯定后件×\n    // 条件句腿×后件重现×前件肯定结论腿）。\n    affirming_the_consequent: actc,\n',
    insert: `    // [r726] 第 156 维度 relative_pration（诉诸更惨×
    // 第三方苦难参照腿×压制诉求腿）。
    relative_pration: rpr,
`,
  },
  {
    // ⑤ DIM_GUIDANCE（锚定 affirming 条目结尾唯一文案）
    anchor: '证据语境讨论（证据不足/孤证/不能证明/insufficient evidence/cannot prove）明确不判。",\n',
    insert: GUIDANCE + '\n',
  },
  {
    // ⑥ VERIFY_DIMS 登记
    anchor: "    'affirming_the_consequent',\n",
    insert: `    // [r726] 第 156 维度 relative_pration（诉诸更惨）登记。
    // verify 级——「拿更惨的人抹掉眼前抱怨」需要补的是对方诉求本身的
    // 事实核查与处理方案，单句也可能是共情转述或概念讨论。与 r672-r725
    // 同口径只登记 VERIFY。
    'relative_pration',
`,
  },
  {
    // ⑦ 补登记（dimMap 第二处，带上文注释防二义）
    anchor: '      // [r725] 第 155 维度补登记：affirming_the_consequent（肯定后件）。\n      // 同上：九处一次接齐。\n      affirming_the_consequent: actc,\n',
    insert: `      // [r726] 第 156 维度补登记：relative_pration（诉诸更惨）。
      // 同上：九处一次接齐。
      relative_pration: rpr,
`,
  },
  {
    // ⑧ summary 补登记
    anchor: "      actc.count ? actc.count + ' 处肯定后件' : '',\n",
    insert: `      // [r726] 第 156 维度 relative_pration 补登记 summary
      // （同上先例：不进 summary 读方看不到命中）。
      rpr.count ? rpr.count + ' 处诉诸更惨' : '',
`,
  },
  {
    // ⑨ exports
    anchor: '  checkAffirmingTheConsequent,\n',
    insert: `  // [r726] 第 156 维度 relative_pration 导出（同先例，
  // 漏导出会让测试与 MCP handler 拿不到单维函数）。
  checkRelativePrivation,
`,
  },
];

let ok = 0;
for (let i = 0; i < EDITS.length; i++) {
  const { anchor, insert } = EDITS[i];
  const count = src.split(anchor).length - 1;
  if (count !== 1) {
    console.error('ABORT: 第 ' + (i + 1) + ' 处锚点命中 ' + count + ' 次（应为 1）。anchor 前80字符: ' + anchor.slice(0, 80));
    process.exit(1);
  }
  src = src.replace(anchor, anchor + insert);
  ok++;
}

fs.writeFileSync(FILE, src);
console.log('[r726 wire] 九处接线完成 ' + ok + '/9（变量 rpr 查重通过）');
