// r234 门禁：gate 层端到端实测 r232/r231/r228 七个新维度是否真承重
const { gate } = require('/root/hermes1/skills/ai/mark-heartflow-skill/src/gate.js');

const cases = [
  ['appeal_to_future', '未来的技术终将解决这个问题，所以现在不用采取行动。'],
  ['appeal_to_future', 'Future research will surely vindicate this approach, so we should adopt it now.'],
  ['appeal_to_rumor', '外界都这么传，肯定不是空穴来风。'],
  ['appeal_to_rumor', 'When so many people are saying it, there must be some truth to it.'],
  ['confirmatory_evidence', '实验反复验证了这个理论，说明它是成立的。'],
  ['confirmatory_evidence', 'The theory has been confirmed by numerous studies, so it must be valid.'],
  ['self_fulfilling_prophecy', '因为他知道自己会被歧视，所以他干脆不申请，最后果然没能入选。'],
  ['broken_window', '地震把房子震塌了，但重建会带动建材和家电消费，所以对经济是好事。'],
  ['anonymous_source_claim', '内部人士透露，这款产品存在严重的安全漏洞。'],
];

const benign = [
  '这项技术目前不成熟，预计未来五年会有突破，因此现在应启动预研。',
  '这条传闻已传播三天，目前没有任何证据支持，需警惕。',
  '经过多次独立复现，目前证据支持它，但尚未排除其他解释。',
  '他担心面试失败，于是认真准备了三天，最终顺利通过。',
  '地震后重建需要考虑地基安全与建筑规范的全面升级。',
  '据新华社报道，官方已发布通报否认了该传言。',
];

let ok = 0, bad = 0;
for (const [dim, text] of cases) {
  const r = gate(text);
  const dims = (r.findings || []).flatMap(f => [f.dimension, ...(f.subDimensions || [])]);
  const hit = dims.includes(dim);
  const nonPass = r.gate && r.gate.action !== 'pass';
  if (hit && nonPass) { ok++; console.log(`PASS  ${dim} -> ${r.gate.action} [${r.findings.map(f=>f.dimension).join(',')}]`); }
  else { bad++; console.log(`FAIL  ${dim} -> ${r.gate && r.gate.action} findings=[${(r.findings||[]).map(f=>f.dimension).join(',')}] :: ${text.slice(0,30)}`); }
}
for (const text of benign) {
  const r = gate(text);
  const dims = (r.findings || []).flatMap(f => [f.dimension, ...(f.subDimensions || [])]);
  const touched = ['appeal_to_future','appeal_to_rumor','confirmatory_evidence','self_fulfilling_prophecy','broken_window','anonymous_source_claim'].filter(d => dims.includes(d));
  if (touched.length === 0) { ok++; console.log(`PASS  benign  ${r.gate && r.gate.action} [${(r.findings||[]).map(f=>f.dimension).join(',')}]`); }
  else { bad++; console.log(`FAIL  benign 误拦 by ${touched.join(',')} :: ${text.slice(0,30)}`); }
}
console.log(`\ngate端到端: ${ok} pass / ${bad} fail`);
