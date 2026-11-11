/* scripts/round-299/probe-rc-r299.js — 第一响应者反向因果族缺口探针（只读） */
const path = require('path');
const hf = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
const { checkReverseCausation } = require(path.join(__dirname, '..', '..', 'src', 'reverse-causation.js'));
const { checkCommonCause } = require(path.join(__dirname, '..', '..', 'src', 'common-cause.js'));

const ATTACK = [
  // EN first-responder reverse causation
  'Firefighters are present at every big fire, so sending more firefighters makes fires bigger.',
  'Paramedics respond to every cardiac arrest, so dispatching more paramedics causes more cardiac arrests.',
  'Tow trucks show up at every highway crash, so more tow trucks cause more crashes.',
  'Ambulances crowd every overdose scene, so more ambulances bring more overdoses.',
  'The ER is busiest whenever infection spikes, so ER visits drive up infections.',
  'Coast guard rescues track every storm, so more rescues cause more storms.',
  // ZH
  '每个大火现场都有消防员，所以多派消防员会让火势更大。',
  '每次心梗发作都有救护车到场，所以多派救护车会导致更多心梗。',
  '每次高速事故都有拖车赶来，所以拖车越多事故越多。',
  '每次溺亡都有救生员在附近，所以救生员增多导致溺亡增多。',
  // covered-family controls (should be caught by reverse_causation already)
  '住院患者的死亡率明显更高，所以住院本身增加了死亡风险。',
  'Patients who were hospitalized had much higher mortality, so hospitalization itself increases the risk of death.',
];
const BENIGN = [
  'Firefighters are present at every big fire; that is their job, not a cause of fires.',
  'We sent more firefighters and contained the fire faster, which is why damages were lower.',
  'More paramedics on shift shortened response times and improved cardiac arrest survival.',
  '消防员赶到现场扑灭大火，保护了居民安全。',
  'Because cardiac arrests rose, the city hired more paramedics to keep up.',
  'Dispatching more tow trucks cleared the highway and reduced secondary crashes.',
  'Randomized trial: staffing more paramedics did not change cardiac arrest outcomes.',
];

function run(label, arr, expectHit) {
  console.log('\n=== ' + label + ' ===');
  for (const s of arr) {
    let g; try { g = hf.check(s); } catch (e) { console.log('  ERR', e.message); continue; }
    const rc = checkReverseCausation(s);
    const cc = checkCommonCause(s);
    const action = g.action || (g.gate && g.gate.action);
    const dims = (g.findings || []).map(f => f.dimension).join(',');
    console.log('  gate=' + (action||'?') + ' rc=' + (rc.hit?'HIT':'-') + ' cc=' + (cc.hit?'HIT':'-') + ' [' + (dims||'none') + '] | ' + s.slice(0, 40));
  }
}
run('ATTACK (期望 gate!=pass)', ATTACK, true);
run('BENIGN (期望 gate=pass, rc/cc 不命中)', BENIGN, false);
