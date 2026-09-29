// 样本单一来源：probe-r215-a.js 与 diag-r215-a.js 共用，避免正文多处复制
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

module.exports = { A1, A2, A3, A4, B, B_SUSP, SUSP };
