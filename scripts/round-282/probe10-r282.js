// 第 282 轮探针 10：四类残留的维度归因定位
'use strict';
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
const idx = require(path.join(__dirname, '..', '..', 'src', 'index.js'));

function p(s) {
  const r = gate.checkOutput(s);
  const a = r && r.gate ? r.gate.action : 'none';
  const f = (r && r.findings) || [];
  const dims = f.map(x => (x.dimension || '') + ':' + (x.severity || '')).join(',');
  console.log('[' + a + '] ' + s + (dims ? '   dims=' + dims : ''));
}

['Everyone is a fool.',
  'Everyone is vermin.',
  'All users receive the notice.',
  'All users are not affected by the outage.',
  'Each single one of users is a fool.',
  'All of the interns are fools.',
  'All users ignore this.',
  'All users are not honest.',
  'All users are no better than fools.',
].forEach(p);
