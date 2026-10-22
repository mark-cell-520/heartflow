#!/usr/bin/env node
/* r571：运行时精确定性 —— new HeartFlow() 后 knowledgeLayer / associativeEngine /
 * blindSpotBreaker 是否存在。这是判定「1671-1693 是否死代码」的最终证据。 */
'use strict';
const { HeartFlow } = require('../src/core/heartflow.js');

function snap(tag, hf) {
  const out = {};
  for (const k of ['knowledgeLayer', 'associativeEngine', '_blindSpotBreaker']) {
    out[k] = hf[k] === undefined ? 'undefined' : (hf[k] === null ? 'null' : hf[k].constructor.name);
  }
  console.log(tag, JSON.stringify(out));
}

const a = new HeartFlow({ rootPath: process.cwd() });
snap('new-only      ', a);
try { a.start(); } catch (e) { console.log('start threw:', e.message); }
snap('after-start() ', a);

// L5 narrative 参数（r543 修复）是否真的被调用
const ae = a.associativeEngine;
if (ae) {
  console.log('ae methods =', JSON.stringify(Object.getOwnPropertyNames(Object.getPrototypeOf(ae)).filter(m => typeof ae[m] === 'function')));
}
process.exit(0);
