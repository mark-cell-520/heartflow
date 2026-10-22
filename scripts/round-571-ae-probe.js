#!/usr/bin/env node
/*
 * r571 探测：associativeEngine 实例是否真的构造成功、具备哪些方法、
 * process() 能否跑通（L1-L5 五层管线）。
 * 只打印结构与方法名，不打印任何样本原文。
 */
'use strict';
const path = require('path');
const HF = require('../src/core/heartflow.js');
const HFC = (HF && (HF.HeartFlow || HF.default)) || HF;

(async () => {
  const hf = new HFC();
  const ae = hf.associativeEngine;
  console.log('associativeEngine =', ae ? ae.constructor.name : 'null');
  if (!ae) {
    console.log('initErrors =', JSON.stringify(hf._initErrors || [], null, 2));
    return;
  }
  const proto = Object.getPrototypeOf(ae);
  const methods = Object.getOwnPropertyNames(proto).filter(m => m !== 'constructor' && typeof ae[m] === 'function');
  console.log('methods =', JSON.stringify(methods));
  console.log('hasProcess =', typeof ae.process === 'function');

  // 中性输入（不含攻击话术，只测管线跑通性）
  const t0 = Date.now();
  try {
    const r = ae.process('The quarterly revenue figure implies the plant output is overheated.', { mode: 'fast' });
    console.log('process ok in', Date.now() - t0, 'ms');
    console.log('result keys =', JSON.stringify(Object.keys(r || {})));
    const l1 = r && (r.l1 || r.layer1 || r.lexical || r.associations);
    if (Array.isArray(l1)) console.log('l1 count =', l1.length);
    const l4 = r && (r.l4 || r.layer4 || r.semantic || r.converged);
    console.log('l4 present =', !!l4);
  } catch (e) {
    console.log('process FAILED =', e.message);
  }
  process.exit(0);
})().catch(e => { console.error('fatal', e); process.exit(1); });
