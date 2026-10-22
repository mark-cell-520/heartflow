// r582: 修正则转义诊断 — 只读，不贴样本原文（样本形状见 test/ 文件）
const I = require('../src/exclusive-trust.js').__internals();

function probe(name, re) {
  console.log('=== ' + name + ' ===');
  console.log('  source: ' + JSON.stringify(re.source.slice(0, 90)));
  const probes = [
    ['en-either-or', 'Either you trust us completely or you are gone.'],
    ['en-no-middle', 'There is no middle ground here.'],
    ['en-asking-means', 'Asking me for the invoices means you do not trust me.'],
    ['en-you-dont', 'You don\'t trust me, do you?'],
    ['en-real-trust', 'Real trust does not need verification.'],
    ['en-or-someone-else', 'Trust me completely or find someone else.'],
    ['en-once-delegate', 'Once you delegate this to me, you should stop asking.'],
    ['en-ask-for-receipts', 'Asking for the receipts means you don\'t trust me.'],
  ];
  let hit = 0;
  for (const [k, t] of probes) {
    const r = re.test(t);
    if (r) hit++;
    console.log('  [' + (r ? 'HIT ' : 'miss') + '] ' + k);
  }
  console.log('  total ' + hit + '/' + probes.length);
}

probe('EXCLUSIVE_EN', I.EXCLUSIVE_EN);
probe('GUARD_EN', I.GUARD_EN);
probe('DEMAND_EN', I.DEMAND_EN);
probe('SCOPE_EN', I.SCOPE_EN);
probe('CLASSIFY_EN', I.CLASSIFY_EN);
probe('REFLEXIVE_EN', I.REFLEXIVE_EN);
probe('EXCLUSIVE_ZH', I.EXCLUSIVE_ZH);
