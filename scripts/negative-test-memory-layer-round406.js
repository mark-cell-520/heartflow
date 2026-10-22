/**
 * r406 负例脚本：变异 classifyLayer 的 type 兼容映射 + _getExportPath 隔离
 * 守卫 test/round-405-memory-layer-type-compat.test.js 必须变红。
 *
 * 纪律（r405 踩坑 + r406 根因，两条都写在这里）：
 *   ① 基线每轮从 `git show HEAD:` 现取，绝不「读一次反复写回」——
 *      r405 的 instrument 脚本在 finally 里写回陈旧快照，污染后续所有变异。
 *   ② 变异判定看 FAIL 行数与条目名，不看 exit=0/非0 单独一个信号——
 *      r405 报「未变红」的真相是 _getExportPath 忽略 rootPath，
 *      测试用 mkdtemp 以为隔离、实际读写生产文件，而生产数据里早有 g-a1。
 *      修完 rootPath 后同一组变异全部变红，说明当时不是守卫失效。
 *   ③ 回报里不贴任何样本文本，只报形状与数字。
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const TARGET = path.join(ROOT, 'src/memory/meaningful-memory.js');
const TEST = path.join(ROOT, 'test/round-405-memory-layer-type-compat.test.js');

// 基线从 git HEAD 现取
const BASELINE = execFileSync('git', ['show', 'HEAD:src/memory/meaningful-memory.js'], { cwd: ROOT, encoding: 'utf8' });

const MUTATIONS = [
  {
    name: 'M1 摘掉整个 type 映射（回到修复前）',
    find: /    const _t = memory\.type;[\s\S]*?    return 'ephemeral';\n\n  \}/,
    replace: `    return 'ephemeral';\n\n  }`,
    expect: ['A1 type:core', 'A2 type:semantic'],
  },
  {
    name: 'M2 只摘 core 映射',
    find: /    if \(_t === 'core'[^\n]*\n/,
    replace: '',
    expect: ['A1 type:core', 'A5 type'],
  },
  {
    name: 'M3 只摘 learned 映射',
    find: /    if \(_t === 'semantic'[^\n]*\n/,
    replace: '',
    expect: ['A2 type:semantic', 'A4 type'],
  },
  {
    name: 'M5 type 读取拼错（memory.typex）',
    find: /    const _t = memory\.type;/,
    replace: `    const _t = memory.typex;`,
    expect: ['A1 type:core', 'A2 type:semantic'],
  },
  {
    name: 'M6 导出路径退回硬编码常量（忽略 rootPath，r405 事故根因）',
    find: /    return path\.join\(this\.rootPath, 'data', 'meaningful-memory\.json'\);/,
    replace: `    return EXPORT_PATH;`,
    expect: [], // 由源码形状断言 D2 判定
  },
];

const rows = [];
let red = 0, green = 0;

function runGuard() {
  const r = spawnSync(process.execPath, [TEST], { cwd: ROOT, encoding: 'utf8', timeout: 90000 });
  const out = String(r.stdout || '') + String(r.stderr || '');
  return { status: r.status, out };
}

try {
  for (const mu of MUTATIONS) {
    if (!mu.find.test(BASELINE)) {
      rows.push([mu.name, 'SKIP 变异模式未匹配当前源码（源码已变，需人工核）']);
      green++;
      continue;
    }
    const mutated = BASELINE.replace(mu.find, mu.replace);
    if (mutated === BASELINE) {
      rows.push([mu.name, 'SKIP 注入未改变源码']);
      green++;
      continue;
    }
    // 每轮从 BASELINE 重新生成，绝不在上一轮变异结果上叠加
    fs.writeFileSync(TARGET, mutated);
    const { status, out } = runGuard();
    const failLines = out.split('\n').filter(l => l.startsWith('FAIL'));
    const landed = mu.expect.filter(k => failLines.some(l => l.includes(k)));

    if (mu.expect.length === 0) {
      // M6：看 D2 源码形状断言是否变红
      const d2Red = failLines.some(l => l.includes('D2'));
      if (d2Red) { red++; rows.push([mu.name, '变红（着陆 D2 导出路径形状断言）']); }
      else { green++; rows.push([mu.name, '未变红 —— D2 守卫失守']); }
    } else if (status !== 0 && landed.length === mu.expect.length) {
      red++;
      rows.push([mu.name, '变红，着陆点 ' + landed.join('/')]);
    } else if (status !== 0 && landed.length > 0) {
      red++;
      rows.push([mu.name, '变红，着陆 ' + landed.join('/') + '（期望 ' + mu.expect.join('/') + '，其余 FAIL 需人工核）']);
      console.log('  —— ' + mu.name + ' FAIL 行 ——\n' + failLines.slice(0, 5).map(l => '    ' + l.slice(0, 110)).join('\n'));
    } else if (status !== 0) {
      rows.push([mu.name, 'exit 非0 但期望条目未着陆 ' + mu.expect.join('/') + ' —— 需人工核']);
      green++;
      console.log('  —— ' + mu.name + ' FAIL 行 ——\n' + failLines.slice(0, 5).map(l => '    ' + l.slice(0, 110)).join('\n'));
    } else {
      green++;
      rows.push([mu.name, '未变红（exit=0，' + failLines.length + ' 个 FAIL）—— 守卫失守']);
    }
    // 立即写回基线，绝不让变异逗留
    fs.writeFileSync(TARGET, BASELINE);
  }
} finally {
  fs.writeFileSync(TARGET, BASELINE);
}

// 还原校验：与 git HEAD 字节一致
const diskNow = fs.readFileSync(TARGET, 'utf8');
const sameAsHead = diskNow === BASELINE;

console.log('\n══════ r406 负例变异结果 ══════');
for (const [n, r] of rows) console.log('  ' + n + ' → ' + r);
console.log('\n变红 ' + red + ' 项，未变红 ' + green + ' 项');
console.log('源码与 git HEAD 字节一致 =', sameAsHead ? '是' : '否（必须人工检查）');
const pass = red === MUTATIONS.length && green === 0 && sameAsHead;
console.log(pass ? '\n负例验证通过' : '\n负例验证未通过');
process.exit(pass ? 0 : 1);
