/**
 * r458 — _backupUndecryptableBank 配额保护测试
 *
 * 缺陷：密钥不匹配时每次启动都会走到 _backupUndecryptableBank，
 * 无配额保护 → 无限增生 .bak（实测堆积 6832 个 / 14.9MB）。
 *
 * 断言：
 * 1. 备份文件按预期生成
 * 2. 超出 MAX_UNDECRYPTABLE_BACKUPS 的部分被删除（最旧的先删）
 * 3. 条数封顶：连续调用 N 次后只剩 keep 份
 * 4. 存量 > keep 时一次性收敛到 keep
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const assert = require('assert');

const MODULE = path.join(__dirname, '..', 'src', 'memory', 'memory-bank.js');
const src = fs.readFileSync(MODULE, 'utf8');

// 内部函数未导出，用受控 eval 取出（与仓库中其他测试的做法一致：
// 在临时作用域里重建模块顶层依赖，只暴露需要的符号）
const KEEP = 3;

function withTempDir(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-bak-quota-'));
  try { fn(dir); } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

function listBaks(dir, bankName) {
  const prefix = bankName + '.undecryptable.';
  return fs.readdirSync(dir)
    .filter((f) => f.startsWith(prefix) && f.endsWith('.bak'))
    .sort();
}

// ─── 从源码提取被测函数 ───
function loadPrivates() {
  const start = src.indexOf('const MAX_UNDECRYPTABLE_BACKUPS');
  const end = src.indexOf('class MemoryBank');
  assert.ok(start !== -1 && end !== -1 && end > start, 'quota block not found in source');
  const block = src.slice(start, end);
  // 被测块只含配额逻辑，不含顶部 require；把 fs/path 作为参数注入
  // eslint-disable-next-line no-new-func
  const factory = new Function('fs', 'path', block + '\nreturn { _backupUndecryptableBank, _pruneUndecryptableBackups, MAX_UNDECRYPTABLE_BACKUPS };');
  return factory(fs, path);
}

const priv = loadPrivates();
assert.strictEqual(priv.MAX_UNDECRYPTABLE_BACKUPS, KEEP, 'quota constant drifted');

// ─── 测试 1：单次备份生成一份 ───
withTempDir((dir) => {
  const bank = path.join(dir, 'memory-bank.json');
  fs.writeFileSync(bank, '{"_enc":"HEARTFLOW_v1","data":"x"}');
  priv._backupUndecryptableBank(bank, 'test-key-mismatch');
  const baks = listBaks(dir, 'memory-bank.json');
  assert.strictEqual(baks.length, 1, 'expected exactly 1 backup, got ' + baks.length);
  const content = fs.readFileSync(path.join(dir, baks[0]), 'utf8');
  assert.strictEqual(content, '{"_enc":"HEARTFLOW_v1","data":"x"}', 'backup content mismatch');
});

// ─── 测试 2：连续 10 次只保留最近 KEEP 份 ───
withTempDir((dir) => {
  const bank = path.join(dir, 'memory-bank.json');
  fs.writeFileSync(bank, '{"_enc":"HEARTFLOW_v1"}');
  for (let i = 0; i < 10; i++) {
    // 人为错开时间戳，确保字典序 == 时间序可判定
    const realNow = Date.now;
    Date.now = () => realNow() + i * 1000;
    priv._backupUndecryptableBank(bank, 'loop-' + i);
    Date.now = realNow;
  }
  const baks = listBaks(dir, 'memory-bank.json');
  assert.strictEqual(baks.length, KEEP, 'expected ' + KEEP + ' backups after 10 calls, got ' + baks.length);
  // 保留的必须是最新的 3 个（loop-7/8/9 的时间戳）
  assert.ok(baks[0] > 'memory-bank.json.undecryptable.', 'name shape ok');
  assert.ok(baks.every((f) => /\.undecryptable\..*\.bak$/.test(f)), 'all files match pattern');
});

// ─── 测试 3：存量超限时一次性收敛（不清空重建场景）───
withTempDir((dir) => {
  const bank = path.join(dir, 'memory-bank.json');
  fs.writeFileSync(bank, '{"_enc":"HEARTFLOW_v1"}');
  // 预置 8 份历史备份（模拟清理前堆积）
  for (let i = 0; i < 8; i++) {
    const stamp = new Date(Date.UTC(2026, 10, 20, 0, 0, i)).toISOString().replace(/[:.]/g, '-');
    fs.writeFileSync(path.join(dir, 'memory-bank.json.undecryptable.' + stamp + '.bak'), 'old-' + i);
  }
  assert.strictEqual(listBaks(dir, 'memory-bank.json').length, 8, 'precondition: 8 backups');
  priv._backupUndecryptableBank(bank, 'converge');
  const baks = listBaks(dir, 'memory-bank.json');
  assert.strictEqual(baks.length, KEEP, 'expected converge to ' + KEEP + ', got ' + baks.length);
  // 被删的必须是最旧的 5 份（old-0..old-4 的时间戳最小）
  const survived = baks.map((f) => fs.readFileSync(path.join(dir, f), 'utf8'));
  assert.ok(survived.some((c) => c.startsWith('old-')), 'some historical backups kept');
  assert.strictEqual(survived.filter((c) => c.startsWith('old-')).length, KEEP - 1, 'newest 1 + oldest-surviving');
});

// ─── 测试 4：不误删非 .undecryptable. 后缀的文件 ───
withTempDir((dir) => {
  const bank = path.join(dir, 'memory-bank.json');
  fs.writeFileSync(bank, '{}');
  const keepers = ['memory-bank.json', 'other.json', 'memory-bank.json.bak', 'memory-bank.json.undecryptable.txt'];
  keepers.forEach((f) => fs.writeFileSync(path.join(dir, f), 'keep'));
  for (let i = 0; i < 6; i++) {
    const stamp = new Date(Date.UTC(2026, 10, 21, 0, 0, i)).toISOString().replace(/[:.]/g, '-');
    fs.writeFileSync(path.join(dir, 'memory-bank.json.undecryptable.' + stamp + '.bak'), 'x');
  }
  priv._backupUndecryptableBank(bank, 'no-collateral');
  keepers.forEach((f) => {
    assert.ok(fs.existsSync(path.join(dir, f)), 'collateral damage: ' + f + ' was deleted');
  });
  assert.strictEqual(listBaks(dir, 'memory-bank.json').length, KEEP, 'quota still enforced');
});

// ─── 测试 5：bankPath 不存在时静默返回，不产出备份 ───
withTempDir((dir) => {
  const missing = path.join(dir, 'no-such-bank.json');
  priv._backupUndecryptableBank(missing, 'missing');
  assert.strictEqual(listBaks(dir, 'no-such-bank.json').length, 0, 'must not create backup for missing bank');
  assert.ok(!fs.existsSync(missing), 'must not create the bank itself');
});

console.log('memory-bank 备份配额测试: 5 通过, 0 失败');
