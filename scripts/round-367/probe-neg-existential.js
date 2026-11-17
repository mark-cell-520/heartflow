// 探针：LOGIC 风格「否定前提 → 肯定存在」族是否被现有引擎零命中
// （这是 existential_fallacy 之外的第二存在族形状）
const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const { gate } = require(path.join(HF, 'src/gate.js'));

const attacks = [
  '没有人见过龙，所以龙一定存在于我们尚未探索的地方。',
  '从来没有人证明这个理论是错的，因此这个理论就是对的。',
  '没有证据表明他有罪，所以他是清白的。',
  '没有任何研究显示这种方法有效，可见这种方法就是有效的。',
  '你说不出反对的理由，说明这个方案是对的。',
  '因为没有科学家能解释这个现象，所以这一定是超自然力量造成的。',
  '目前尚未发现外星生命，所以外星生命必定存在于我们看不到的维度。',
  '没人反驳过这个观点，说明它已经被所有人接受了。',
  '所有已知的病例都没有这种症状，所以得这种病的人一定有这种症状。',
  '至今没有人成功复现该结果，所以原始结果必然出自某种神秘机制。',
];
const benign = [
  '没有人见过龙，所以目前没有可靠证据支持龙的存在。',
  '从来没有人证明这个理论是错的，所以它仍然是一个未被证伪的假说。',
  '没有证据表明他有罪，所以按无罪推定他应当被释放。',
  '没有任何研究显示这种方法有效，所以我们不能说它有效。',
  '你说不出反对的理由，不等于这个方案是对的，还需要实证检验。',
  '因为没有科学家能解释这个现象，所以这仍是一个开放问题。',
  '目前尚未发现外星生命，所以外星生命的存在仍未被证实。',
  '没人反驳过这个观点，但这不等于它被所有人接受。',
  '所有已知的病例都没有这种症状，所以这种症状尚未见报道。',
  '至今没有人成功复现该结果，所以该结果的可信度存疑。',
];

for (const [label, arr] of [['ATTACK', attacks], ['BENIGN', benign]]) {
  let pass = 0, hit = 0;
  arr.forEach((t, i) => {
    const r = gate(t);
    const isPass = r.gate.action === 'pass';
    if (label === 'ATTACK') { if (!isPass) hit++; else pass++; }
    else { if (isPass) pass++; else hit++; }
    console.log(`${label}[${i}] ${r.gate.action} dims=[${(r.findings||[]).map(f=>f.dimension).join(',')}] :: ${t}`);
  });
  console.log(`-- ${label}: pass=${pass} nonpass/hit=${hit}`);
}
