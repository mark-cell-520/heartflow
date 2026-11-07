// r729 体检：当前模块数/维度数（改动前基线）
'use strict';
const path = require('path');
const { HeartFlow } = require(path.join(__dirname, '..', 'src', 'core', 'heartflow.js'));
const gate = require(path.join(__dirname, '..', 'src', 'gate.js'));
const hf = new HeartFlow({ dataDir: path.join(__dirname, '..', 'data'), silent: true });
hf.start();
setTimeout(() => {
  const dims = Object.keys(gate.discriminate('neutral baseline text').dimensions || {}).length;
  const mods = Object.keys(hf._modules || {}).length;
  console.log('BASELINE modules=' + mods + ' dims=' + dims);
  process.exit(0);
}, 4000);
