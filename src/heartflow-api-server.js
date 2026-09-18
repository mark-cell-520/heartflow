#!/usr/bin/env node
const http = require('http');
const path = require('path');
const fs = require('fs');
const { spawnSync } = require('child_process');
const { checkOutput, checkInput, runPipeline } = require('./gate.js');
const { guardPath, guardWritePath } = require('./core/path-guard.js');

const PORT = Number(process.env.PORT) || 4317;
const HOST = '127.0.0.1'; // [AUDIT-FIX] 绑定 localhost，避免 0.0.0.0 暴露到外网

// [AUDIT-FIX] 允许的仓库根目录白名单
const ALLOWED_REPO_ROOTS = [
  path.resolve(process.cwd()),
  path.resolve('/tmp'),
  path.resolve('/var/tmp'),
  path.resolve(process.env.HOME || '', 'code'),
  path.resolve(process.env.HOME || '', 'projects'),
  path.resolve(process.env.HOME || '', 'src'),
];

function validateRepoPath(repoPath) {
  if (!repoPath || typeof repoPath !== 'string') {
    return { safe: false, reason: 'repoPath must be a non-empty string' };
  }
  // 禁止路径遍历标记
  if (repoPath.includes('..') || repoPath.includes('\x00')) {
    return { safe: false, reason: 'path traversal detected' };
  }
  const resolved = path.resolve(repoPath);
  const allowed = ALLOWED_REPO_ROOTS.some(root =>
    resolved === root || resolved.startsWith(root + path.sep)
  );
  if (!allowed) {
    return { safe: false, reason: `repoPath outside allowed roots: ${resolved}` };
  }
  return { safe: true, resolved };
}

function validateRepoName(repoName) {
  if (!repoName || typeof repoName !== 'string') {
    return { safe: false, reason: 'repoName must be a non-empty string' };
  }
  // 仅允许字母、数字、连字符、下划线、点
  if (!/^[a-zA-Z0-9._\-]+$/.test(repoName)) {
    return { safe: false, reason: 'repoName contains invalid characters' };
  }
  if (repoName.includes('..')) {
    return { safe: false, reason: 'repoName contains path traversal' };
  }
  return { safe: true, value: repoName };
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1'); // [AUDIT-FIX] 限定来源
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  try {
    if (url.pathname === '/health') {
      return res.end(JSON.stringify({ok:true, ts:Date.now()}));
    }

    if (req.method === 'POST' && url.pathname === '/v1/check/output') {
      const body = await new Promise(r => { let d=''; req.on('data',c=>d+=c); req.on('end',()=>r(d)); });
      const {text, mode='fast'} = JSON.parse(body);
      if (!text) return res.end(JSON.stringify({error:'text required'}));
      const t0 = Date.now();
      const out = mode === 'deep' ? runPipeline({input:text, mode:'deep'}) : checkOutput(text);
      const ms = Date.now() - t0;
      return res.end(JSON.stringify({ok:true, ms, gate: out.gate, verdict: out.verdict, overallScore: out.overallScore, findings: (out.findings||[]).slice(0,20)}));
    }

    if (req.method === 'POST' && url.pathname === '/v1/check/input') {
      const body = await new Promise(r => { let d=''; req.on('data',c=>d+=c); req.on('end',()=>r(d)); });
      const {text} = JSON.parse(body);
      if (!text) return res.end(JSON.stringify({error:'text required'}));
      const t0 = Date.now();
      const out = checkInput(text);
      const ms = Date.now() - t0;
      return res.end(JSON.stringify({ok:true, ms, gate: out.gate, verdict: out.verdict, overallScore: out.overallScore}));
    }

    if (req.method === 'POST' && url.pathname === '/v1/audit/repo') {
      const body = await new Promise(r => { let d=''; req.on('data',c=>d+=c); req.on('end',()=>r(d)); });
      const {repoPath, repoName} = JSON.parse(body);
      if (!repoPath) return res.end(JSON.stringify({error:'repoPath required'}));

      // [AUDIT-FIX P0] 校验 repoPath 和 repoName，防止路径遍历和命令注入
      const pathCheck = validateRepoPath(repoPath);
      if (!pathCheck.safe) {
        return res.end(JSON.stringify({error: `invalid repoPath: ${pathCheck.reason}`}));
      }
      const nameCheck = validateRepoName(repoName);
      if (!nameCheck.safe) {
        return res.end(JSON.stringify({error: `invalid repoName: ${nameCheck.reason}`}));
      }

      const script = path.join(path.dirname(require.resolve('./gate.js')), '..', 'scripts', 'repo-audit.js');
      const safeRepoPath = pathCheck.resolved;
      const outPath = path.join(safeRepoPath, `heartflow-audit-report-${nameCheck.value}.md`);
      // [AUDIT-FIX] 二次校验输出路径是否在允许范围内
      const outGuard = guardPath(outPath);
      if (!outGuard.safe) {
        return res.end(JSON.stringify({error: `output path rejected: ${outGuard.reason}`}));
      }
      const writeGuard = guardWritePath(outGuard.resolved);
      if (!writeGuard.safe) {
        return res.end(JSON.stringify({error: `output path write denied: ${writeGuard.reason}`}));
      }
      const args = [script, safeRepoPath, nameCheck.value, outGuard.resolved];
      const child = spawnSync('node', args, {encoding:'utf8', timeout: 300000, maxBuffer: 10 * 1024 * 1024});
      const report = fs.readFileSync(outGuard.resolved, 'utf8');
      const summary = {};
      for (const line of child.stdout.split('\n')) {
        const m = line.match(/^([A-Z]+)\s+(.+)$/);
        if (m) summary[m[1].toLowerCase()] = isNaN(Number(m[2])) ? m[2] : Number(m[2]);
      }
      return res.end(JSON.stringify({ok: child.status===0, status: child.status, stderr: child.stderr, summary, report}));
    }

    res.writeHead(404); return res.end(JSON.stringify({error:'not found', paths:['/v1/check/output','/v1/check/input','/v1/audit/repo','/health']}));
  } catch (e) {
    res.writeHead(500); return res.end(JSON.stringify({error: e.message}));
  }
}).listen(PORT, HOST, () => {
  console.log(`HeartFlow API up on http://${HOST}:${PORT}`);
  console.log(`Endpoints:`);
  console.log(`  POST /v1/check/output  {text, mode?}`);
  console.log(`  POST /v1/check/input   {text}`);
  console.log(`  POST /v1/audit/repo    {repoPath, repoName?}`);
});
