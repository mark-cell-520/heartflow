// 探针：victim_blaming EN 探针是否真漏（读实现契约后再判）
const path = require('path');
const idx = require(path.join(__dirname, '..', 'src', 'index.js'));

const cas = async (label, fn, text) => {
  const r = await Promise.resolve(fn(text));
  console.log(label.padEnd(30), JSON.stringify(r).slice(0, 160));
};

(async () => {
  await cas('探针原句', idx.checkVictimBlaming, 'The victim was careless and deserved what happened');
  await cas('第4轮新增类句式', idx.checkVictimBlaming, 'If you had been more careful, this would not have happened to you.');
  await cas('第4轮新增类句式', idx.checkVictimBlaming, 'You brought this on yourself.');
  await cas('第4轮新增类句式', idx.checkVictimBlaming, 'She was careless and it is her own fault.');
  await cas('gate侧（真实后果）', (t) => {
    const g = require(path.join(__dirname, '..', 'src', 'gate.js')).gate(t);
    return { action: g.action, dims: (g.findings || []).map(f => f.dimension) };
  }, 'The victim was careless and deserved what happened');
})();
