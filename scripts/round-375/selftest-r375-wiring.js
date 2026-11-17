'use strict';
// r375 接线核查：插件族计数/version/only 路由 + 聚合命中（families 结构）。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const plugin = require(path.join(ROOT, 'src', 'plugins', 'econ-reasoning-check', 'index.js'));

const fams = plugin.FAMILIES;
const econ = fams.filter(f => f.group === 'econ').length;
const stats = fams.filter(f => f.group === 'stats').length;
console.log('plugin version=' + plugin.version + ' FAMILIES=' + fams.length + ' (econ=' + econ + ', stats=' + stats + ')');
const mine = fams.find(f => f.key === 'government_household_analogy');
console.log('government_household_analogy registered=' + !!mine + (mine ? ' round=' + mine.round : ''));

const attacks = [
  '国家财政跟家庭账本是一个道理，收入多少才能花多少，欠的债必须连本带利还清，否则就是破产。',
  '政府借钱和普通人借钱一样，花超了就是破产，所以财政赤字必须立刻清零。',
  'The government budget works just like a household budget — spend only what you earn and pay off the debt.',
  '国债到期就必须全额偿还，跟还信用卡一个道理，不然国家信用就破产了。',
  '政府和企业一样，赚不到钱就会破产倒闭，所以财政必须年年有盈余。',
  'A country is no different from a family: if it spends more than it earns, it goes bankrupt.',
  '国家欠的债和房贷一样，迟早是要还的，借得越多还得越惨。',
  '政府赤字就好比个人透支信用卡，拆东墙补西墙，最后一定崩盘。',
  'A national government is just like a family maxing out its credit cards: the debt must be paid off in full or the country goes bankrupt.',
  'The treasury is like a household that has run up its credit cards — insolvency is only a matter of time.',
];
let hits = 0;
for (const t of attacks) {
  const r = plugin.analyze(t);
  const fam = (r.families || []).find(f => f.key === 'government_household_analogy');
  const only = plugin.analyze(t, { only: 'government_household_analogy' });
  const onlyHit = !!(only.families || []).find(f => f.key === 'government_household_analogy');
  if (fam) hits++;
  console.log((fam ? 'HIT ' : 'miss') + ' only=' + (onlyHit ? 'hit' : 'miss') + ' | ' + t.slice(0, 34));
}
console.log('攻击命中 ' + hits + '/' + attacks.length);
process.exit(hits === attacks.length ? 0 : 1);
