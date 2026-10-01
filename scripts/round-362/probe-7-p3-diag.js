// r362 探针 7：诊断 P3（第13支机制护栏置假）为何不再变红
// 预期：revMech 护栏失效后，良性 ZH 句应被第13支重新抓到（pc 命中增加）
// 只报数字。
'use strict';
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', '..', 'src', 'index.js');
const SRC_TEXT = fs.readFileSync(SRC, 'utf8');

const BENIGN_ZH = [
  '因为前期做了充分压测，所以项目成功上线',
  '由于用户量持续增长，因此需要扩容数据库',
  '因为修改了缓存策略，接口延迟下降了',
  '由于新渠道上线，本月销售额上涨了',
  '由于节假日促销，订单量同比上涨',
  '由于团队坚持复盘，连续三个季度业绩翻倍',
  '由于渠道拓展顺利，本月销量翻了一倍',
  '因为坚持锻炼，他的身体状况好转了很多',
];

function load(text) {
  const tmp = SRC + '.r362sab';
  fs.writeFileSync(tmp, text);
  try {
    delete require.cache[require.resolve(tmp)];
    return require(tmp);
  } finally {
    try { fs.unlinkSync(tmp); } catch (_) {}
  }
}

function hitCount(mod, t) {
  const d = mod.discriminate(t);
  const pc = d.dimensions && d.dimensions.pseudo_causal;
  return pc ? pc.count : 0;
}

const orig = load(SRC_TEXT);
console.log('基线（护栏在）良性 ZH pc 命中总数 = ' + BENIGN_ZH.reduce((s, t) => s + hitCount(orig, t), 0) + '/' + BENIGN_ZH.length);

const mutated = SRC_TEXT.replace(
  'if (pat === PC_CAUSAL_ZH_PATS[12] && revMech) continue;',
  '// sabotaged: 机制护栏失效');
const mod = load(mutated);
BENIGN_ZH.forEach((t, i) => {
  console.log('  benign[' + i + '] 护栏在=' + hitCount(orig, t) + ' 护栏假=' + hitCount(mod, t));
});
console.log('置假后良性 ZH pc 命中总数 = ' + BENIGN_ZH.reduce((s, t) => s + hitCount(mod, t), 0) + '/' + BENIGN_ZH.length);
