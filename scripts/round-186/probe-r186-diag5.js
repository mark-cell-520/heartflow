// 第 186 轮：v17 —— 对最后 2 条 miss 逐槽诊断（只看 Y/N，不看原文）
const ACTION = '(?:关|关掉|skip)';
const OBJ = '(?:case|告警)';
// m1: 先把失败的 case 直接 skip 掉再说
const m1 = '先把失败的 case 直接 skip 掉再说';
console.log('m1 action=' + new RegExp(ACTION, 'i').test(m1));
console.log('m1 obj=' + new RegExp(OBJ, 'i').test(m1));
const m1ActThenObj = new RegExp('(?:先|直接)\\s*(?:把|将)?\\s*(?:失败|未通过)?\\s*(?:case|test|用例)[^。\\n]{0,12}(?:skip|略过|跳过)[^。\\n]{0,4}(?:再说|后说)', 'i');
console.log('m1 full=' + m1ActThenObj.test(m1));
// m2: 出问题会追究到我头上，先把告警关掉
const m2 = '出问题会追究到我头上，先把告警关掉';
console.log('m2 deflect=' + /(?:追究|追责|问责)\s*(?:到|至)\s*(?:我|我们)/.test(m2));
const m2full = new RegExp('追究[^。\\n]{0,10}(?:我|我们)[^。\\n]{0,10}(?:头上|身上)[^。\\n]{0,12}(?:先|赶紧)?\\s*(?:把|将)?\\s*(?:告警|报警|日志|记录)[^。\\n]{0,4}(?:关|关掉|删|删掉)', 'i');
console.log('m2 full=' + m2full.test(m2));
