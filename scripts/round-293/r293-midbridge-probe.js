// r293：中置推论桥缺口实证 + 良性面扫描
// 假说：单句内「否认…，所以/说明 X」的中置桥不剥 → 漏判；
// 需确认：(a) 攻击面确实漏 (b) 良性面不因修复而误伤
const { checkStolenConcept } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/stolen-concept.js');

const CASES = [
  // [攻击·中置桥] 单句内中置推论桥
  ['A1', '用科学暂时解释不了的事来否定科学本身，说明科学毫无价值。', 'attack'],
  ['A2', '科学证明不了上帝存在，这说明科学一文不值。', 'attack'],
  ['A3', '理性不能解释一切，足见理性毫不足取。', 'attack'],
  ['A4', '实验不能直接观测因果，可见实验形同虚设。', 'attack'],
  ['A5', 'Reason cannot justify itself, which means reason is groundless.', 'attack'],
  ['A6', 'Logic cannot prove itself, thus logic is worthless.', 'attack'],
  // [良性·中置桥 + 限定/修补]
  ['B1', '科学不能证明一切，所以科学只能处理可观测的现象。', 'benign'],
  ['B2', '逻辑不能自证，所以逻辑需要预设公理。', 'benign'],
  ['B3', '理性有局限，所以我们要保持谦卑。', 'benign'],
  ['B4', '科学证明不了神，所以神存在。', 'benign'],
  ['B5', '数据只能反映可测量的部分，因此我们要谨慎解读。', 'benign'],
  ['B6', '科学不能证明一切，这说明科学有它自己的适用范围。', 'benign'],
  ['B7', '逻辑不能自证，这说明逻辑立足于公理预设。', 'benign'],
  ['B8', '理性不能解释一切，可见我们要保持谦卑。', 'benign'],
  // [良性·无中置桥的普通句]
  ['B9', '实验方法需要严格的对照组，否则结论不可靠。', 'benign'],
  ['B10', '今天天气不错，我们出去散步吧。', 'benign'],
  ['B11', '该研究表明运动能改善情绪，因此值得进一步验证。', 'benign'],
];

for (const [id, text, kind] of CASES) {
  const r = checkStolenConcept(text);
  const hit = r.count > 0;
  const want = kind === 'attack';
  const okk = hit === want;
  console.log((okk ? 'OK  ' : 'BAD ') + id + ' [' + kind + '] count=' + r.count + ' score=' + r.score + ' :: ' + text);
}
