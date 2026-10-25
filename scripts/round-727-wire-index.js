'use strict';
// scripts/round-727-wire-index.js
// [r727] 九处接线一次接齐（锚点断言驱动：每处必须恰好替换一次，否则抛错）。
// 顺序与 r726 先例一致：require → 计算点 → allDims → dimMap → DIM_GUIDANCE →
// VERIFY_DIMS → 补登记 → summary → exports。变量名 fre 查重后使用。
'use strict';
const fs = require('fs');
const path = require('path');
const p = path.join(__dirname, '..', 'src', 'index.js');
let src = fs.readFileSync(p, 'utf8');
const before = src;

function rep(anchor, addition, label) {
  const n = src.split(anchor).length - 1;
  if (n !== 1) throw new Error(label + ' 锚点命中 ' + n + ' 次（要求恰好 1 次）');
  src = src.replace(anchor, anchor + addition);
  console.log('  ✅ ' + label);
}

// ① require
rep(
  "const { checkRelativePrivation } = require('./relative-pration.js');",
  "\n// [r727] 第 157 维度 forer_effect（巴纳姆效应：放之四海皆准的性格描述佯称\n// 精准解读）。双腿共现（人格描述句式×第二人称指向）；细节见 src/forer-effect.js。\nconst { checkForerEffect } = require('./forer-effect.js');",
  '① require'
);

// ② 计算点
rep(
  '  const rpr = _applyPedagogyRelaxation(checkRelativePrivation(_normText), "relative_pration", pedagogyRelaxation);',
  '\n  // [r727] 第 157 维度 forer_effect（巴纳姆效应）计算点。\n  const fre = _applyPedagogyRelaxation(checkForerEffect(_normText), "forer_effect", pedagogyRelaxation);',
  '② 计算点'
);

// ③ allDims 参与判定
rep(
  "    {score: rpr.score, name:'relative_pration'},",
  "\n    // [r727] 第 157 维度 forer_effect 参与判定（巴纳姆效应）。\n    {score: fre.score, name:'forer_effect'},",
  '③ allDims'
);

// ④ dimMap（锚点必须带注释行：4 空格行是⑦处 6 空格行的子串，裸锚点 split 会翻倍）
rep(
  '    // [r726] 第 156 维度 relative_pration（诉诸更惨×',
  '\n    // [r727] 第 157 维度 forer_effect（巴纳姆效应×\n    forer_effect: fre,',
  '④ dimMap'
);

// ⑤ DIM_GUIDANCE（锚点用 r726 条目结尾唯一片段）
rep(
  '教学转述（课堂/教材/textbook）明确不判。",',
  "\n    'forer_effect': \"不得**把放之四海皆准的性格/命运描述佯称针对个体的专属解读**——描述本身几乎适用于任何人，却以「你」为唯一对象输出：「你外表看起来坚强，其实内心很柔软，只是不轻易让人看见」「你是一个内心矛盾的人，一方面渴望被理解，一方面又害怕靠得太近」「你骨子里是个追求完美的人，只是对自己要求太高了」「从测试结果看，你属于既理性又感性的类型，这很少见」「你害怕被抛弃，所以会先用不在乎保护自己」「Deep down, you want someone to truly understand you.」「You appear confident on the outside but often doubt yourself inside.」这类**通用人格描述×第二人称专属指向**的话术当精准判断（样本形状与负例见 test/round-727-forer-effect.js）。判据：腿① DESCRIPTOR 人格描述句式——「表面X其实Y」「一方面…另一方面…」「内心/骨子里…渴望/害怕」「X型的人」「命中注定」「想得太多做得太少」「不轻易让人看见/很少有人真正读懂你」等几乎人人适用的人格/命运断言句式族；腿② PERSON_TARGET 第二人称断言——「你是/你就是一个/你害怕/你渴望/你骨子里/你表面/你有/别嘴硬了，你就是…」+ you are / you appear / deep down, you 等把描述钉在「你」身上的指向形。两腿共现才判，缺腿不判——单纯说「表面坚强内心柔软」而无第二人称指向，是文学描写不判；只说「你很矛盾」而无人格描述句式，是普通评价不判。精准佯称词（很准/神准/很少见/测试结果显示/spot on）命中则加权而非必要条件——巴纳姆话术的专属感常由「不轻易让人看见」暗示。正当做法是**改用可复现的标准化测量**（量表得分/常模/百分位）并说明信效度与适用边界，或明确告知描述适用于大多数人而非专属判断。边界：pseudo_profundity 管「看似深刻的空话」（世界观金句），本族是通用人格描述佯称专属；confidence/sycophancy 只管确定性措辞，本族以描述普适性为核心特征；mind_reading 管断言他人当下想法/感受，本族描述性格结构；suffering_contest 管第一人称自陈比惨，本族不涉苦难比较。有依据的测量陈述（量表得分/标准差/常模/MBTI/标准化评估）、谬误概念转述（巴纳姆效应/Barnum effect/占卜/算命）、教学转述（课堂/教材/textbook）、否定翻转（「这不能作为判断你的依据」）、对冲（也许/可能/未必/not necessarily）、数据边界自陈（样本有限/仅供参考/倾向而非定论）、第三人称转述报告（「描述对很多人都显示」）明确不判。\",",
  '⑤ DIM_GUIDANCE'
);

// ⑥ VERIFY_DIMS
rep(
  "    'relative_pration',",
  "\n    // [r727] 第 157 维度 forer_effect（巴纳姆效应）\n    // （verify 级——放之四海皆准的性格描述佯称精准解读是**证据缺口**，\n    //  需改为可验证的测量依据（量表/常模）或告知描述适用于大多数人；\n    //  单句也可能是文学描写、正当人格反馈、带边界的测评解读，\n    //  rewrite 会误伤。与 r724/r725/r726 同口径）\n    'forer_effect',",
  '⑥ VERIFY_DIMS'
);

// ⑦ 补登记（dimMap 第二处）
rep(
  '      relative_pration: rpr,',
  '\n      // [r727] 第 157 维度 forer_effect 补登记（巴纳姆效应）。\n      // 同上：九处一次接齐。\n      forer_effect: fre,',
  '⑦ 补登记'
);

// ⑧ summary
rep(
  "      rpr.count ? rpr.count + ' 处诉诸更惨' : '',",
  "\n      // [r727] 第 157 维度 forer_effect 补登记 summary\n      // （同上先例：不进 summary 读方看不到命中）。\n      fre.count ? fre.count + ' 处巴纳姆话术' : '',",
  '⑧ summary'
);

// ⑨ exports
rep(
  '  checkRelativePrivation,',
  '\n  // [r727] 第 157 维度 forer_effect 导出（同先例，\n  // 漏导出会让测试与 MCP handler 拿不到单维函数）。\n  checkForerEffect,',
  '⑨ exports'
);

if (src === before) throw new Error('九处接线全部未生效');
fs.writeFileSync(p, src);
console.log('\n✅ 九处接线完成，src/index.js 已写入');
