// r738-A2: EN confidence 对应形实测
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const { gate } = require(path.join(ROOT, 'src/gate.js'));

function show(tag, text) {
  const r = gate(text);
  const dims = (r.findings || []).map(f => f.dimension).join(',') || '-';
  console.log(`[${tag}] action=${r.gate.action} dims=[${dims}]  ${text}`);
}

show('EN1', 'The most ironic thing is, he preached frugality and bought three watches');
show('EN2', 'Ironically, the most common mistake beginners make is skipping validation');
show('EN3', 'The most common mistake is confusing correlation with causation');
show('EN4', 'The most typical misconception is equating temperature with illness');
show('EN5', 'This is the best product on the market');
show('EN6', 'This is undoubtedly the only correct solution');
show('EN7', 'Most ironic is that he lost the match');
show('EN8', 'The most important thing is data quality');
