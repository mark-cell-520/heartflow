// r604 探针 v2：在 r602/r603 的 hidden-instance 基础上补齐三个维度：
//  ① 该实例是否被引擎其它源码引用（不是只挂在 this 上）
//  ② 方法零抛情况（async reject 也要兜住，不能让探针崩）
//  ③ 「辨别能力」强度：方法名命中判定类动词（judge/evaluate/check/detect/assess/
//     discriminate/verify/audit/review/inspect/score…）的占比
// 目的：找出「能力完整 + 零抛 + 真具辨别性质 + 引擎侧 0 条 dispatch 路由」的接线目标。
// 只输出计数与名字，不贴样本原文。
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

// async reject 不拦，否则探针被单个 async 方法炸断（r604 实测 sageGuardian 如是）
process.on('unhandledRejection', () => {});
process.on('uncaughtException', () => {});

const DISCRIMINATION_VERBS = [
  'judge', 'evaluate', 'check', 'detect', 'assess', 'discriminate', 'verify',
  'audit', 'review', 'inspect', 'score', 'validate', 'screen', 'filter',
  'guard', 'monitor', 'supervise', 'weigh', 'measure', 'estimate', 'classify',
];

(async () => {
  const { HeartFlow } = require(path.join(ROOT, 'src/core/heartflow.js'));
  const hf = new HeartFlow();
  hf.start();

  const moduleKeys = new Set(Object.keys(hf._modules));

  // 引用扫描：mcp-server.js + src 下其它文件
  const srcFiles = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory()) { walk(path.join(dir, e.name)); continue; }
      if (!e.name.endsWith('.js')) continue;
      srcFiles.push(path.join(dir, e.name));
    }
  })(path.join(ROOT, 'src'));
  const mcpPath = path.join(ROOT, 'src/mcp-server.js');
  const mcpSrc = fs.readFileSync(mcpPath, 'utf8');
  const otherSrc = srcFiles.filter(f => f !== mcpPath && !f.endsWith('src/core/heartflow.js'));
  const otherSrcText = otherSrc.map(f => { try { return fs.readFileSync(f, 'utf8'); } catch (e) { return ''; } });

  const rows = [];
  for (const k of Object.keys(hf)) {
    if (k.startsWith('_')) continue;
    if (moduleKeys.has(k)) continue;
    const v = hf[k];
    if (!v || typeof v !== 'object') continue;
    const proto = Object.getPrototypeOf(v);
    let methods = [];
    if (proto && proto !== Object.prototype) {
      methods = Object.getOwnPropertyNames(proto).filter(m => m !== 'constructor' && typeof v[m] === 'function' && !m.startsWith('_'));
    }
    const own = Object.keys(v).filter(m => typeof v[m] === 'function' && !m.startsWith('_'));
    const all = [...new Set([...methods, ...own])];
    if (all.length === 0) continue;

    // 零抛判定（async 返回值当作已跑通，不 await，只统计）
    let ok = 0, bad = 0;
    const fails = [];
    for (const m of all.slice(0, 4)) {
      try {
        const r = v[m]();
        if (r && typeof r.then === 'function') { r.then(() => {}, () => {}); ok++; }
        else if (r !== undefined) ok++; else bad++;
      } catch (e) { bad++; fails.push(m + ':' + String(e.message).slice(0, 40)); }
    }

    // 引用数
    const re = new RegExp('\\.' + k + '\\b', 'g');
    const inMcp = (mcpSrc.match(re) || []).length;
    let inSrc = 0;
    for (const s of otherSrcText) inSrc += (s.match(re) || []).length;

    // 辨别强度
    const disc = all.filter(m => DISCRIMINATION_VERBS.some(vb => m.toLowerCase().includes(vb)));
    rows.push({
      k, n: all.length, ok, bad, inMcp, inSrc,
      discN: disc.length, discRatio: disc.length / all.length,
      methods: all.slice(0, 6), fails: fails.slice(0, 1),
    });
  }

  rows.sort((a, b) => {
    const sa = a.inMcp * 4 + a.inSrc + a.discN * 2 + a.ok * 2;
    const sb = b.inMcp * 4 + b.inSrc + b.discN * 2 + b.ok * 2;
    return sb - sa;
  });
  console.log('total=' + rows.length);
  console.log('noThrow=' + rows.filter(r => r.bad === 0).length);
  console.log('--- 排序 = MCP引用x4 + 源码引用 + 辨别方法x2 + 零抛x2 ---');
  for (const r of rows) {
    console.log(`${r.k}\tn=${r.n}\tok=${r.ok}\tbad=${r.bad}\tmcp=${r.inMcp}\tsrc=${r.inSrc}\tdisc=${r.discN}/${r.n}\t[${r.methods.join(',')}]`);
  }
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
