// r539: 坐实 tokenize 是中文链的硬阻断（比空图更根本）
const path = require('path');
const ROOT = process.cwd();
const { AssociativeEngine } = require(path.join(ROOT, 'src/archive/associative-engine.js'));

(async () => {
  const e = new AssociativeEngine(ROOT);
  const la = e.lexicalAssociator;
  const cases = [
    '我今天很累，想休息一下。',
    '这绝对是唯一正确的方案',
    '代码 函数 变量',          // 空格分隔（图里有节点的词）
    '代码，函数，变量。',
    '代码,函数。',
    '代码，函数',
    '迷茫 与 困惑',
  ];
  console.log('=== tokenize 实测 ===');
  for (const c of cases) {
    const w = la.tokenize(c);
    console.log('  ' + JSON.stringify(c) + ' → ' + JSON.stringify(w));
  }

  console.log('\n=== 图里有哪些节点 ===');
  const nodes = Object.keys(la.graph.nodes || {});
  console.log('  total =', nodes.length, '| 前10 =', JSON.stringify(nodes.slice(0, 10)));

  console.log('\n=== 空格分隔的图内词，补边后能否命中 ===');
  // 动态给这三个词建边
  la.graph.nodes['代码'] = { associations: [{ word: '函数', strength: 0.8 }, { word: '变量', strength: 0.7 }] };
  la.graph.nodes['函数'] = { associations: [{ word: '代码', strength: 0.8 }, { word: '变量', strength: 0.6 }] };
  la.graph.nodes['变量'] = { associations: [{ word: '函数', strength: 0.6 }] };
  for (const c of ['代码 函数 变量', '代码，函数，变量。', '代码,函数。']) {
    const s = la.associateSequence(c);
    console.log('  ' + JSON.stringify(c) + ' → words=' + JSON.stringify(s.words) + ' 联想数=' + s.allAssociations.length);
  }

  console.log('\n=== 结论 ===');
  console.log('  中文整句 → tokenize 切成 1 个 token（整句本身）→ 永远 miss 图节点 → 联想数 0');
  console.log('  只有空白/英文标点分隔的词才能命中图的节点');
})();
