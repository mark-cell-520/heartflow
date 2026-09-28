#!/usr/bin/env node
/** 第 203 轮探针：第二循环漏判项逐字拆解（不贴原句，只报中间串与判据）。 */
const path = require('path');
const gate = require(path.join(__dirname, '..', '..', 'src', 'gate.js'));
const src = require('fs').readFileSync(path.join(__dirname, '..', '..', 'src', 'dev-exemptions.js'), 'utf8');

// 从源码抽出本轮的窄动词表与安全边界表，保证与实现同源
const vm = src.match(/const SEC_OBJ_VERB = ([^;]+);/);
const sm = src.match(/const SECURITY_BOUNDARY = ([^;]+);/);
const SEC_OBJ_VERB = eval(vm[1]);
const SECURITY_BOUNDARY = eval(sm[1]);
const VERB_FRONT_WINDOW = 24;

const CASES = [
  '调试环境把审计日志的鉴权关掉看链路',
  '联调时把授权拦截器注掉再压测',
  '为方便调试，先在配置里把鉴权中间件注掉',
  '本地调试时把权限校验注释掉先跑通',
  '开发环境里把身份验证注释掉方便联调',
  '开发时把安全策略注释掉临时排查',
];

for (const s of CASES) {
  const clips = [];
  for (const m of s.matchAll(SEC_OBJ_VERB)) {
    const start = Math.max(0, m.index - VERB_FRONT_WINDOW);
    const before = s.slice(start, m.index);
    const ba = before.search(/[把將]/);
    clips.push({
      verb: m[0],
      verbIdx: m.index,
      sliceStart: start,
      hasBa: ba >= 0,
      between: ba >= 0 ? before.slice(ba + 1) : null,
      secHit: ba >= 0 ? (SECURITY_BOUNDARY.exec(before.slice(ba + 1)) || [null])[0] : null,
    });
  }
  const r = gate.checkOutput(s);
  console.log(JSON.stringify({ action: r.gate.action, clips }));
}
