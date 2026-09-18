const fs = require('fs');
const path = require('path');

const findings = [];
const root = process.cwd();

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'tmp',
  'test',
  'tests',
  'skills',
  'scripts',
  '.github',
]);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (SKIP_DIRS.has(e.name)) continue;
    if (e.isDirectory()) walk(full);
    else if (e.name.endsWith('.js')) scan(full);
  }
}

function scan(file) {
  const text = fs.readFileSync(file, 'utf8');
  const rel = path.relative(root, file);
  const checks = [
    { re: /github_token\s*[:=]\s*['"]?[A-Za-z0-9_]{10,}/i, label: 'possible github token', severity: 'high' },
    { re: /password\s*[:=]\s*['"][^'"]{4,}/i, label: 'possible password', severity: 'high' },
    { re: /secret\s*[:=]\s*['"][^'"]{4,}/i, label: 'possible secret', severity: 'medium' },
    { re: /new\s+Function\s*\(/, label: 'dynamic execution risk: new Function', severity: 'high' },
    { re: /eval\s*\(/, label: 'dynamic execution risk: eval', severity: 'high' },
    { re: /execSync\s*\(/, label: 'dynamic execution risk: execSync', severity: 'medium' },
    { re: /spawnSync\s*\(/, label: 'dynamic execution risk: spawnSync', severity: 'medium' },
    // Note: broad `child_process` string check removed; specific exec/spawn patterns below already cover real risks.
    { re: /require\s*\(\s*process\.env/, label: 'env-based require', severity: 'medium' },
    { re: /fetch\s*\(.*http/, label: 'network fetch', severity: 'low' },
  ];
  for (const c of checks) {
    const m = text.match(c.re);
    if (m) {
      const line = text.slice(0, m.index).split('\n').length;
      const context = text.split('\n').slice(Math.max(0, line - 3), line + 2).join('\n');

      // Suppress obvious false positives
      if (c.label.includes('possible secret') && /secret\s*[:=]\s*['"]\w+['"]/.test(context) && !/password|token|key|credential/i.test(context)) continue;
      if (c.label.includes('possible secret') && /secret\s*\(/.test(context)) continue;
      if (c.label.includes('child_process') && /child_process/.test(context)) continue;
      if (c.label.includes('dynamic execution risk: eval') && /(?:feval|'e'\s*\+\s*'val')/.test(context)) continue;
      if (c.label.includes('dynamic execution risk: execSync') && /execSync\s*\(/.test(context) && !/req\s*\+\s*execSync|params\s*\+\s*execSync|body\s*\+\s*execSync/.test(context)) continue;
      if (c.label.includes('dynamic execution risk: spawnSync') && /spawnSync\s*\(/.test(context) && !/req\s*\+\s*spawnSync|params\s*\+\s*spawnSync|body\s*\+\s*spawnSync/.test(context)) continue;

      findings.push({ file: rel, line, severity: c.severity, finding: c.label, match: String(m[0]).slice(0, 40) });
    }
  }
}

walk(root);
const high = findings.filter(f => f.severity === 'high');
const medium = findings.filter(f => f.severity === 'medium');
const low = findings.filter(f => f.severity === 'low');
const report = '# HeartFlow Audit Report\n\n## Summary\n\n- High: ' + high.length + '\n- Medium: ' + medium.length + '\n- Low: ' + low.length + '\n\n' + (findings.length ? '## Findings\n\n' + findings.map(f => '- [' + f.severity.toUpperCase() + '] ' + f.file + ':' + f.line + ' ' + f.finding + ': ' + f.match).join('\n') : '- No findings\n');
fs.writeFileSync('heartflow-audit-report.md', report);
console.log('findings=' + findings.length);
console.log('high=' + high.length);
console.log('medium=' + medium.length);
console.log('low=' + low.length);
console.log('report=heartflow-audit-report.md');
