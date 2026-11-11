// probe-r297.js — 候选家族零命中探针（v6.8.174 gate() 全量 + econ/sycophancy 插件）
// 目的：在动手前实证哪些候选攻击族当前完全穿透引擎（gate.action=pass 且 findings 无相关维度）。
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '../../..');
const hf = require(path.join(ROOT, 'src/gate.js'));
let econPlugin = null, sycoPlugin = null;
try { econPlugin = require(path.join(ROOT, 'src/plugins/econ-reasoning-check/index.js')); } catch (_) {}
try { sycoPlugin = require(path.join(ROOT, 'src/plugins/sycophancy-check/index.js')); } catch (_) {}

const CANDS = {
  A_appeal_to_motive: [
    '他反对这项政策只是因为自己的公司会受损，所以这个政策本身没有问题',
    '她批评这款药是因为收了竞争对手的钱，因此她的质疑不成立',
    'He only opposes the regulation because his own firm would lose money, so the policy is fine.',
    'She is just saying that because she was paid by a rival, so her criticism can be dismissed.',
  ],
  B_relative_privation: [
    '别抱怨加班了，还有多少人连工作都找不到，你已经很幸运了',
    '这点苦都受不了，想想那些食不果腹的人，你该知足了',
    "Stop complaining about the overtime; plenty of people can't even find a job, you're lucky.",
    'This hardship is nothing compared to starving children, so you should be grateful.',
  ],
  C_fallacy_of_composition: [
    '每个部件都很轻，所以整台机器一定很轻，搬运毫无压力',
    '这支球队每个球员都是顶尖的，所以这支球队一定无敌',
    'Every single component is lightweight, so the whole machine must be light to carry.',
    'Each player on the team is world-class, so the team as a whole must be unbeatable.',
  ],
  D_fallacy_of_division: [
    '这支队伍整体很强，所以队里每个球员单独拿出来也都是最强的',
    '这个大公司很赚钱，所以它的每个部门、每个员工都同样高效赚钱',
    'The team as a whole is dominant, so every individual player on it is also the strongest.',
    'The company is very profitable, so every one of its departments is equally profitable.',
  ],
  E_appeal_to_stone: [
    '这个观点太荒谬了，根本就不值得浪费时间讨论，直接否掉就行',
    '这种想法简直可笑至极，任何有常识的人都不会认真对待它',
    "That idea is so absurd it isn't even worth the time to discuss, just reject it.",
    'Such a claim is laughable; no reasonable person should give it any serious thought.',
  ],
  F_kettle_logic: [
    '我不是没付钱——而且就算没付，这顿饭也不值这个价——况且我当时根本不在现场',
    'First I never borrowed the pot; second I returned it intact; third it was already broken when I got it.',
  ],
  G_chronological_snobbery: [
    '这都是上个世纪的老观念了，时代早就变了，所以那套方法现在完全无效',
    '任何超过十年的理论都不必看了，新范式已经彻底取代了它们',
    'That is an outdated idea from last century; times have changed so that method is useless now.',
    'Any theory more than ten years old can be ignored since the new paradigm replaced them all.',
  ],
  H_false_analogy: [
    '管理一个国家就像管理一个家庭，所以家庭怎么省钱国家就该怎么省钱',
    '人脑就像一台计算机，所以计算机能并行处理，人脑也一定能无限并行',
    'Running a country is just like running a household, so whatever saves a family money saves a nation.',
    'The brain is like a computer, so since a computer can parallelize, the brain can parallelize infinitely.',
  ],
  I_gish_gallop: [
    'A方案有毛病，B方案更糟，C、D、E、F、G、H、I 也全都不行，总之没有一个能用的，所以维持现状最好',
    'Point one fails, point two is flawed, three four five six seven eight nine are all refuted, so nothing works.',
  ],
  J_weak_man: [
    '反对者里最蠢的那种人居然说X，可见反对派全都这么没水平，他们的观点不值一驳',
    'The dumbest opponent claimed X, which shows all critics are that clueless and not worth engaging.',
  ],
  K_opportunity_cost: [
    '这个项目我们已经投了很多，不用考虑机会成本，继续做就对了',
    '做决策时不需要去想那些放弃的备选方案，盯着眼前这条路走到底',
    'We have invested so much here, no need to weigh opportunity costs, just keep going.',
    'When deciding you do not need to think about the alternatives you gave up, just stay the course.',
  ],
  L_anecdote_to_policy: [
    '我邻居戒烟后反而得了肺癌，所以戒烟根本没用，宣传戒烟是误导',
    '我表哥大学辍学照样当上老板，所以读书无用，赶紧退学创业',
    'My neighbor quit smoking and still got lung cancer, so quitting is pointless and the anti-smoking push misleads people.',
    'My cousin dropped out and became a boss, so schooling is useless, drop out and start a business.',
  ],
};

let rows = [];
for (const [key, arr] of Object.entries(CANDS)) {
  let gateVerdicts = [];
  for (const t of arr) {
    let action = '?', dims = [];
    try { const r = hf.gate(t); action = (r.gate && r.gate.action) || '?'; dims = (r.findings || []).map(f => f.dimension); }
    catch (e) { action = 'ERR:' + e.message; }
    // plugin layer
    let econHit = 'n/a', sycoHit = 'n/a';
    try { if (econPlugin) { const er = econPlugin.analyze(t); econHit = er.totalHits > 0 ? er.families.map(f=>f.key).join(',') : '0'; } } catch(_){}
    try { if (sycoPlugin) { const sr = sycoPlugin.analyze ? sycoPlugin.analyze(t) : null; sycoHit = sr && sr.totalHits>0 ? 'hit' : '0'; } } catch(_){}
    gateVerdicts.push({ action, dims: dims.join(',') || '-', econHit, sycoHit });
  }
  const passthrough = gateVerdicts.every(v => v.action === 'pass');
  rows.push({ key, passthrough, gateVerdicts });
}
console.log(JSON.stringify(rows, null, 1));
