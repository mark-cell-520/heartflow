#!/usr/bin/env node
/**
 * r615 负例探针：删除 priorityGuardian 接线块 → 路由/模块必须回落
 * 与 scripts/round-614-negative-probe.js 同一范式：
 * 子进程加载心虫，输出 {ok, routes, total, modulesKey, dispatchThrewNotAllowed}
 *
 * [r616] 修正：原实现只输出「删除态」实测值，恢复态的 routes/modulesKey
 * 无实测数据，导致 round-615-priorityguardian-dispatch.test.js 的 C2
 * （"恢复源文件后路由归位"）拿到删除态数据必然判红 —— 这是探针口径
 * 缺陷，不是引擎缺陷。现在恢复态也一次性进程实测后一并输出。
 */
const path = require('path');
const fs = require('fs');
const HF = path.join(__dirname, '..');
const HF_PATH = path.join(HF, 'src', 'core', 'heartflow.js');

// 接线标记：[r615] 接线块
const MARK = "[r615] priorityGuardian 接线";

function probeOnce() {
  const childSrc = [
    'const p=' + JSON.stringify(HF) + ';',
    'const {HeartFlow}=require(p+"/src/core/heartflow.js");',
    'const hf=new HeartFlow();hf.start();',
    'const A=Array.from(HeartFlow.ALLOWED_ROUTES);',
    'let threw=false;',
    'try{hf.dispatch("priorityGuardian.check",{userIntent:"x",action:"y"});}catch(e){threw=/not allowed/i.test(String(e.message));}',
    'console.log(JSON.stringify({ok:true,',
    '  routes:A.filter(function(r){return r.indexOf("priorityGuardian.")===0;}).length,',
    '  total:A.length,',
    '  modulesKey:Object.prototype.hasOwnProperty.call(hf._modules,"priorityGuardian"),',
    '  dispatchThrewNotAllowed:threw}));',
  ].join('');
  const out = require('child_process').execFileSync(process.execPath, ['-e', childSrc], { cwd: HF, stdio: ['ignore', 'pipe', 'pipe'] }).toString();
  const line = out.split('\n').filter(Boolean).pop();
  return JSON.parse(line);
}

function main() {
  const original = fs.readFileSync(HF_PATH, 'utf8');
  if (original.indexOf(MARK) < 0) {
    console.error('找不到 r615 接线标记，源文件可能已被改动');
    process.exit(2);
  }
  const mutated = original.replace(
    /    \/\/ \[r615\] priorityGuardian 接线[\s\S]*?\n    if \(this\.priorityGuardian && !this\._modules\['priorityGuardian'\]\) \{\n      this\._modules\['priorityGuardian'\] = this\.priorityGuardian;\n    \}/,
    '    // [r615 负例] priorityGuardian 接线块已删除'
  );
  if (mutated === original) {
    console.error('负例切除失败：正则未匹配');
    process.exit(2);
  }
  fs.writeFileSync(HF_PATH, mutated);
  let deleted, restored;
  try {
    deleted = probeOnce();
    // [r616] 恢复后再实测一次：父进程有 require 缓存，必须用一次性子进程
    fs.writeFileSync(HF_PATH, original);
    const diskBack = fs.readFileSync(HF_PATH, 'utf8') === original;
    restored = diskBack ? probeOnce() : null;
  } finally {
    fs.writeFileSync(HF_PATH, original);
  }
  console.log(JSON.stringify({
    ok: deleted.ok && !!restored,
    // 删除态口径
    routes: deleted.routes,
    total: deleted.total,
    modulesKey: deleted.modulesKey,
    dispatchThrewNotAllowed: deleted.dispatchThrewNotAllowed,
    // [r616] 恢复态口径（C2 用）
    restored: !!(restored && restored.ok),
    restoredRoutes: restored ? restored.routes : 0,
    restoredTotal: restored ? restored.total : 0,
    restoredModulesKey: restored ? restored.modulesKey : null,
    sourceRestored: fs.readFileSync(HF_PATH, 'utf8') === original,
  }));
}

main();
