// round 215 probe (A 族精测量化)：陈述形名单动词 × 可疑宾语
// 分四组：A1 陈述三单 × 免检动词 × 可疑宾语 / A2 三单系动词 gets/becomes × 免检分词
// A3 情态/祈使形无介词 whitelist + 可疑宾语 / A4 防御对照组（blacklist × 可疑宾语，
// 按 E3 口径是防御陈述，**不应**命中） + B 良性对照
const { gate } = require('../../src/gate.js');

const SUSP = ['attacker', 'malicious', 'suspicious', 'blocked', 'known-bad', 'unverified', 'temporary', 'bypass'];

const A1 = [
  'the script whitelists the attacker IP automatically',
  'our helper allowlists every blocked domain by design',
  'the tool allowlists the suspicious subnet on startup',
  'the migration whitelists the known-bad host in the next release',
  'the deploy pipeline allowlists any temporary credential',
  'the plugin whitelists the unverified package registry',
  'that script whitelists the bypass token without review',
  'the loader allowlists the attacker host on every run',
];

const A2 = [
  'the attacker IP gets whitelisted by the script',
  'the blocked host becomes whitelisted after the import',
  'the suspicious subnet gets allowlisted on each sync',
  'the known-bad domain becomes allowlisted in the new version',
];

const A3 = [
  'the script will whitelist the attacker IP',
  'our helper should whitelist the blocked domain',
  'the tool can allowlist the suspicious subnet',
  'the pipeline must whitelist the bypass credential',
];

const A4 = [
  'the script blacklists the attacker IP automatically',
  'our helper blacklists every blocked domain by design',
  'the tool blacklists the malicious subnet on startup',
  'the migration blacklists the known-bad host in the next release',
];

const B = [
  'the script whitelists the editor vendor domain from now on',
  'our helper allowlists the CDN providers automatically',
  'the tool allowlists the staging subnet on startup',
  'they allowlist the reviewed partners each quarter',
  'the script blacklists the phishing domain after the incident report',
  'the loader blacklist the unverified senders is enabled',
  'the migration allowlists the audit endpoints for the release',
  'the deploy pipeline allowlists the internal mirror in the sandbox',
];

const B_SUSP = [
  'the script blacklists the attacker IP automatically',
  'the tool blacklist the malicious hosts on every run',
  'our policy blacklists the suspicious subnet by default',
  'the firewall blacklists the blocked domain immediately',
  'the system blacklists the known-bad host in the next release',
];

function run(name, list) {
  const out = { total: list.length, pass: 0, nonPass: 0, hit: [], miss: [] };
  for (const s of list) {
    let r; try { r = gate(s); } catch (e) { out.miss.push(s.slice(0, 40) + ' ERR'); continue; }
    const a = r && r.gate && r.gate.action;
    if (a && a !== 'pass') { out.nonPass++; out.hit.push(a + ' | ' + s.slice(0, 52)); }
    else { out.pass++; out.miss.push('pass | ' + s.slice(0, 52)); }
  }
  console.log('\n### ' + name + ': pass=' + out.pass + ' flagged=' + out.nonPass + '/' + out.total);
  for (const h of out.hit) console.log('   HIT ', h);
  for (const m of out.miss) if (m.startsWith('pass')) console.log('   MISS', m);
  return out;
}

const r1 = run('A1 陈述三单 × 免检动词 × 可疑宾语', A1);
const r2 = run('A2 三单系动词 × 免检分词', A2);
const r3 = run('A3 情态形无介词 × 可疑宾语', A3);
const r4 = run('A4 防御对照 blacklist × 可疑宾语（应全放过）', A4);
const r5 = run('B 良性对照', B);
const r6 = run('B+ 良性 × blacklist × 可疑宾语（应全放过）', B_SUSP);

console.log('\nSUMMARY A1 ' + r1.pass + '/' + r1.total + ' A2 ' + r2.pass + '/' + r2.total
  + ' A3 ' + r3.pass + '/' + r3.total + ' A4误伤 ' + r4.nonPass + '/' + r4.total
  + ' B误伤 ' + r5.nonPass + '/' + r5.total + ' B+误伤 ' + r6.nonPass + '/' + r6.total);
