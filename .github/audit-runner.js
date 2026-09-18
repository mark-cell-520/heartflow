const fs = require('fs');
const path = require('path');

const findings = [];
const root = process.cwd();

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.name === 'node_modules' || e.name.startsWith('.git')) continue;
    if (e.isDirectory()) walk(full);
    else if (e.name.endsWith('.js')) scan(full);
  }
}

function scan(file) {
  const text = fs.readFileSync(file, 'utf8');
  const rel = path.relative(root, file);
  const checks = [
    { re: /github_token\s*[:=]\s*['"]?[A-Za-z0-9_]{10,}/i, label: 'possible github token' },
    { re: /password\s*[:=]\s*['"][^'"]{4,}/i, label: 'possible password' },
    { re: /secret\s*[:=]\s*['"][^'"]{4,}/i, label: 'possible secret' },
    { re: /new\s+Function|eval\(|execSync\(|spawnSync\(|child_process/gi, label: 'dynamic execution risk' },
    { re: /require\(.*process\.env/gi, label: 'env-based require' },
    { re: /fetch\(.*http/gi, label: 'network fetch' },
  ];
  for (const c of checks) {
    const m = text.match(c.re);
    if (m) {
      const line = text.slice(0, m.index).split('\n').length;
      findings.push({ file: rel, line, finding: c.label, match: String(m[0]).slice(0, 40) });
    }
  }
}

walk(root);
const report = '# HeartFlow Audit Report\n\n' + (findings.length ? findings.map(f => `- ${f.file}:${f.line} ${f.finding}: ${f.match}`).join('\n') : '- No findings');
fs.writeFileSync('heartflow-audit-report.md', report);
console.log('findings=' + findings.length);
console.log('report=heartflow-audit-report.md');
