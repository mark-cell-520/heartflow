#!/usr/bin/env node
/**
 * r638 候选辨别力实测：16 个 hidden instance 逐个试公有方法
 * 口径：同形状最小实参调用，记录 抛/可用/返回结构，用于 decision 选方向。
 * 落盘 /tmp/r638-candidates2.json
 */
'use strict';
const fs = require('fs');
const path = require('path');
const srcdir = path.join(__dirname, '..', 'src');
const { HeartFlow } = require(path.join(srcdir, 'core', 'heartflow.js'));

const hf = new HeartFlow();
try { hf.start(); } catch (_) {}

const keys = Object.keys(hf._modules || {});
const modVals = keys.map(k => hf._modules[k]);

const CANDS = JSON.parse(fs.readFileSync('/tmp/r638-unwired.json', 'utf8')).top.map(r => r.key);

// 别名核对：_modules 里是否已有指向同一对象的键
function aliasOf(key) {
  const inst = hf[key];
  if (!inst) return null;
  const hit = keys.find(k => hf._modules[k] === inst);
  return hit || null;
}

const out = [];
for (const key of CANDS) {
  const inst = hf[key];
  if (!inst) continue;
  const alias = aliasOf(key);
  const proto = Object.getPrototypeOf(inst);
  const pubs = Object.getOwnPropertyNames(proto)
    .filter(m => !m.startsWith('_') && m !== 'constructor' && typeof inst[m] === 'function');
  const calls = [];
  for (const m of pubs) {
    let status = 'threw';
    let shape = '';
    try {
      // 依次试 4 组实参形状，取第一个不抛的
      const tries = [
        () => inst[m](),
        () => inst[m]({}),
        () => inst[m]('test', {}),
        () => inst[m]({ text: 'This is unmistakably the only correct answer, without any doubt.', context: 'chat' }),
      ];
      for (const t of tries) {
        try {
          const r = t();
          status = 'ok';
          shape = r === undefined ? 'undefined' : (r === null ? 'null' : (typeof r === 'object' ? 'obj[' + Object.keys(r).slice(0, 8).join(',') + ']' : typeof r + ':' + String(r).slice(0, 40)));
          break;
        } catch (e) { /* 试下一组 */ }
      }
    } catch (_) {}
    calls.push(m + '=' + status + (shape ? ' ' + shape : ''));
  }
  const ok = calls.filter(c => /=ok/.test(c)).length;
  out.push({
    key,
    alias,
    totalMethods: pubs.length,
    okCount: ok,
    calls: calls.slice(0, 40),
  });
}

out.sort((a, b) => b.okCount - a.okCount);
fs.writeFileSync('/tmp/r638-candidates2.json', JSON.stringify(out, null, 1));
for (const r of out) {
  console.log(`[${r.key}] alias=${r.alias || '-'} pub=${r.totalMethods} ok=${r.okCount}`);
  for (const c of r.calls.filter(c => /=ok/.test(c)).slice(0, 6)) console.log('    ' + c);
}
