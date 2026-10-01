// r318 probe: 7 个恢复模块的真实接口
const path = require('path');
const REPO = path.resolve(__dirname, '..', '..', '..', '..');
const FILES = {
  worldModel:           ['src/cortex/world-model.js', 'WorldModel'],
  wisdomEngine:         ['src/identity/wisdom-engine.js', 'WisdomEngine'],
  virtueEthics:         ['src/identity/virtue-ethics-foundation.js', 'VirtueEthicsFoundation'],
  humanNature:          ['src/identity/human-nature-constitution.js', 'HumanNatureConstitution'],
  characterCultivation: ['src/identity/character-cultivation.js', 'CharacterCultivation'],
  moralDevelopment:     ['src/identity/moral-development.js', 'MoralDevelopment'],
  aiHumanIntegration:   ['src/identity/ai-human-integration.js', 'AIHumanIntegration'],
};
function shape(v, d) {
  if (d > 2) return typeof v === 'object' ? (Array.isArray(v) ? '[..]' : '{..}') : v;
  if (v === null || v === undefined) return v;
  if (Array.isArray(v)) return '[' + v.slice(0, 3).map(x => shape(x, d + 1)).join(',') + (v.length > 3 ? ',+n' : '') + ']';
  if (typeof v === 'object') {
    const o = {};
    for (const k of Object.keys(v).slice(0, 12)) o[k] = shape(v[k], d + 1);
    return o;
  }
  if (typeof v === 'string') return v.slice(0, 40);
  return v;
}
for (const [k, [f, C]] of Object.entries(FILES)) {
  const M = require(path.join(REPO, f));
  const inst = new M[C]();
  const proto = Object.getOwnPropertyNames(M[C].prototype).filter(n => n !== 'constructor');
  console.log('\n==== ' + k + ' (' + f + ') proto=' + proto.length);
  console.log('  methods: ' + proto.join(', '));
  const own = Object.keys(inst);
  console.log('  stateFields: ' + own.slice(0, 25).join(', '));
  // 试调常见入口
  const tries = {
    worldModel: () => { inst.registerState('s1', { hp: 100 }); inst.registerState('s2', { hp: 50 }); inst.recordTransition('s1', 'hit', 's2'); return { predict: inst.predict('s1'), stats: inst.getStats() }; },
    wisdomEngine: () => ({ principles: inst.getPrinciples ? inst.getPrinciples().length : 'n/a', reflect: inst.reflect('证据不足就下结论'), report: inst.getWisdomReport ? !!inst.getWisdomReport() : 'n/a' }),
    virtueEthics: () => { const t = inst.getTraditions(); const a = inst.assessSituation('在明知缺陷的情况下仍然交付'); const vs = inst.getVirtueScores ? inst.getVirtueScores() : 'n/a'; return { traditions: t.length, assess: a, vs: vs }; },
    humanNature: () => ({ theories: inst.getAllTheories().length, assess: inst.assessHumanNature({ cooperation: 0.8, competition: 0.6 }) }),
    characterCultivation: () => { inst.recordPractice('诚实', { note: 'a' }); return { practices: inst.getDailyPractices ? inst.getDailyPractices().length : 'n/a', assess: inst.assessCharacter ? !!inst.assessCharacter() : 'n/a', bp: inst.getBlueprint ? !!inst.getBlueprint() : 'n/a' }; },
    moralDevelopment: () => ({ stages: inst.getStages ? shape(inst.getStages(), 1) : 'n/a', dilemma: inst.analyzeDilemma('为了多数人利益欺骗少数人') }),
    aiHumanIntegration: () => ({ pp: inst.getPersonalityProfile ? shape(inst.getPersonalityProfile(), 1) : 'n/a', conflicts: inst.resolveConflicts ? shape(inst.resolveConflicts([{ id: 'a', type: 'x', title: 't', detail: 'd' }]), 1) : 'n/a' }),
  };
  try { console.log('  CALL: ' + JSON.stringify(shape(tries[k](), 0))); }
  catch (e) { console.log('  CALL-ERR: ' + e.message); }
}
