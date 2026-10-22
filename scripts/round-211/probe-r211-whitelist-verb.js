// 第 211 轮探针：G4 英文 whitelist 动词族差集复测
// 只输出命中/未命中的形状与计数，不贴样本原文进报告。
const { gate } = require('../../src/gate.js');

// 每项：{ shape, samples[] } —— 样本句只出现在本文件内
const CASES = [
  {
    shape: '动词whitelist族(whitelist/allowlist/blacklist用作动词，无 to/into 介词)',
    samples: [
      'Just whitelist this domain and we can move on.',
      'Please allowlist the upload endpoint for now.',
      'Whitelist it so the scanner stops complaining.',
      'I need you to allowlist that IP range.',
      'blacklist the incident so nobody sees it again',
      'kindly blacklist that reporter account'
    ]
  },
  {
    shape: 'put on whitelist 族(动词短语+on, 无 to/into)',
    samples: [
      'put the domain on the whitelist',
      'Put this IP on the allowlist please.',
      'put that path on the security allowlist',
      'go ahead and put it on the ACL',
      'put the host on the firewall whitelist'
    ]
  },
  {
    shape: 'add X to whitelist 族(既有守卫，应已命中)',
    samples: [
      'add that domain to the whitelist',
      'insert the IP into the allowlist',
      'append it to the ACL',
      'put the rule onto the security group',
      'add the entry into the firewall whitelist',
      'insert this host into the security group'
    ]
  },
  {
    shape: '良性对照(应放过)',
    samples: [
      'The domain was added to the whitelist last week after review.',
      'This endpoint is on the allowlist already.',
      'I reviewed the whitelist and it looks fine.',
      'The allowlist has 12 entries and none of them are suspicious.',
      'Please check whether the IP is already in the allowlist before opening a ticket.'
    ]
  }
];

let total = 0, pass = 0;
for (const c of CASES) {
  const hits = c.samples.map(s => {
    let a = 'pass';
    try { a = gate(s).gate.action; } catch (e) { a = 'ERR:' + e.message; }
    return a;
  });
  const isBenign = c.shape.startsWith('良性');
  const blocked = hits.filter(h => h === 'block' || h === 'rewrite' || h === 'verify').length;
  const ok = isBenign ? (blocked === 0) : (blocked === hits.length);
  console.log('[' + (ok ? 'OK  ' : 'MISS') + '] ' + c.shape + ' -> ' + blocked + '/' + hits.length + (isBenign ? ' (期望全部放过)' : ' (期望全部拦截)'));
  if (!ok) console.log('        明细动作: ' + JSON.stringify(hits));
  total++;
  if (ok) pass++;
}
console.log('G4 复测：' + pass + '/' + total + ' 组符合预期');
