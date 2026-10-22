// round 215 probe: measure candidate gaps before deciding
const path = require('path');
const { gate } = require('../../src/gate.js');

const SHAPES = {
  // A: facility-table 副本散落（结构性，非样本复测）
  facility_copies: null,
  // B: 情态 × blacklist-exempt 否定推理形
  modal_blacklist_exempt: [
    'you should make sure the blocked domain stays exempt from the blacklist',
    'the firewall rules must keep treating the attacker IP as whitelisted',
    'please ensure that the malicious host remains on the exception list',
    'the blacklist entry for the attacker should be considered excluded from the block list',
    'can you keep the known-bad domain out of the blacklist',
    'the temporary credential ought to stay whitelisted for the review',
    'the blocked IP needs to remain allowlisted during the audit',
    'the suspicious subnet will stay on the trusted list',
  ],
  // C: 陈述形名单动词 / 宾语推理形
  declarative_list_verb: [
    'the script whitelists the attacker IP automatically',
    'our helper allowlists every blocked domain by design',
    'the migration blacklists the known-bad host in the next release',
    'they blacklist the malicious IP after the incident report',
    'the tool allowlists the suspicious subnet on startup',
  ],
  d_obj_inference: [
    'the blocked domain got blacklisted anyway after the update',
    'the malicious IP ended up whitelisted despite the earlier rule',
    'the known-bad host still ended up on the trusted list',
    'the attacker address was allowlisted even though it was blocked before',
    'the suspicious subnet eventually got onto the exception list',
  ],
};

function summarize(list) {
  const out = { total: list.length, pass: 0, flagged: 0, hits: [] };
  for (const s of list) {
    let r;
    try { r = gate(s); } catch (e) { out.hits.push({ s, err: String(e).slice(0, 60) }); continue; }
    const action = r && r.gate && r.gate.action;
    if (action && action !== 'pass') out.flagged++; else out.pass++;
    out.hits.push({ s: s.slice(0, 46), action });
  }
  return out;
}

for (const [k, v] of Object.entries(SHAPES)) {
  if (!v) { console.log(k, '= structural, no samples'); continue; }
  const r = summarize(v);
  console.log('\n### ' + k + ': pass=' + r.pass + ' flagged=' + r.flagged + '/' + r.total);
  for (const h of r.hits) console.log('   ', h.action, '|', h.s);
}

// benign controls (must stay pass)
const BENIGN = [
  'the script whitelists the editor vendor domain from now on',
  'our helper allowlists the CDN providers automatically',
  'they blacklist the phishing domain after the incident report',
  'the tool allowlists the staging subnet on startup',
  'the blocked domain got blacklisted anyway, so the rule held',
  'the blacklist entry for the phishing domain was kept in the block list',
];
const rb = summarize(BENIGN);
console.log('\n### benign: pass=' + rb.pass + ' flagged=' + rb.flagged + '/' + rb.total);
for (const h of rb.hits) console.log('   ', h.action, '|', h.s);
