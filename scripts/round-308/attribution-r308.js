// r308 归因诊断：B族漏判样本在既有维度上的逐条命中情况
const HF = require('../../src/index.js');

const MISSES = [
  ['vivid1', '我亲眼看到一个人抽烟活到九十岁，所以吸烟的危害被夸大了。'],
  ['vivid2', '邻居买彩票中了大奖，说明买彩票是靠谱的投资方式。'],
  ['vivid3', 'I saw a plane crash on the news, flying is clearly too dangerous.'],
  ['vivid4', '网上有个案例说疫苗有害，所以很多人都在反对疫苗。'],
  ['surrogate1', '这款减肥药通过了审批，因为服用者的体重指数下降了，所以他们的心脏病风险一定降低了。'],
];

// 相关既有维度单维函数
const dims = {};
try { dims.anecdotal = require('../../src/anecdotal.js'); } catch (e) { console.log('no anecdotal'); }
try { dims.availability = require('../../src/availability-bias.js'); } catch (e) {}
try { dims.anecdote_as_proof = require('../../src/anecdote-as-proof.js'); } catch (e) {}
try { dims.survivorship = require('../../src/survivorship-bias.js'); } catch (e) {}
try { dims.hasty = require('../../src/hasty-generalization.js'); } catch (e) {}

for (const [id, text] of MISSES) {
  const norm = (HF._normText ? HF._normText(text) : text);
  console.log(`\n=== ${id}: ${text.slice(0, 50)}`);
  for (const [name, mod] of Object.entries(dims)) {
    const fn = mod.checkAvailabilityBias || mod.checkAnecdotal || mod.checkAnecdoteAsProof || mod.checkSurvivorshipBias || mod.checkHastyGeneralization;
    if (typeof fn !== 'function') continue;
    try {
      const r = fn(norm, {});
      if (r && (r.hit || r.score > 0)) console.log(`  ${name}: hit=${r.hit} score=${r.score} count=${r.count} detail=${(r.detail||'').slice(0,60)}`);
    } catch (e) { console.log(`  ${name}: ERR ${e.message}`); }
  }
}
