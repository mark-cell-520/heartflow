/**
 * r434 变异执行器：在子进程里删掉 EM_MANIPULATION_PATTERNS 的 guilt_ledger 判据，
 * 分别统计删前/删后攻击样本的 emotional_manipulation 命中数。
 *
 * 父进程 require 缓存会污染 gate.js 内部引擎引用（r428 同款教训），
 * 所以删条+统计全部走 spawnSync 子进程。
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const RUNNER = path.resolve(__dirname, 'round-434-mutant-child.js');
const SRC = path.resolve(__dirname, '..', 'src', 'index.js');
const CHILD_SRC = path.resolve(__dirname, '..', 'src', 'round-434-mutant-index.js');
const CHILD_GATE = path.resolve(__dirname, '..', 'src', 'round-434-mutant-gate.js');
const MARK = 'guilt_ledger';

class Round434Mutant {
  constructor(srcPath) { this.srcPath = srcPath; }

  _spawn(samples, mode) {
    const r = spawnSync(process.execPath, [RUNNER], {
      input: JSON.stringify({ dir: path.dirname(this.srcPath), mode: mode || 'baseline', samples }),
      encoding: 'utf8', timeout: 90000,
    });
    if (r.status !== 0) throw new Error('child failed: ' + (r.stderr || r.stdout));
    return JSON.parse(r.stdout.trim().split('\n').pop());
  }

  baseline(attack) { return this._spawn(attack, 'baseline').total; }

  mutate(attack) {
    const idx = fs.readFileSync(this.srcPath, 'utf8');
    const lines = idx.split('\n');
    const kept = [];
    let removed = 0;
    for (const ln of lines) {
      const t = ln.trim();
      if (ln.includes("'" + MARK + "'") && t.startsWith('[')) { removed++; continue; }
      kept.push(ln);
    }
    if (removed === 0) throw new Error('变异源未命中：没有可删除的 guilt_ledger 判据行');
    fs.writeFileSync(CHILD_SRC, kept.join('\n'));
    fs.writeFileSync(CHILD_GATE, fs.readFileSync(path.resolve(__dirname, '..', 'src', 'gate.js'), 'utf8')
      .replace(/require\(['"]\.\/index\.js['"]\)/g, "require('./round-434-mutant-index.js')"));
    try {
      return this._spawn(attack, 'mutant').total;
    } finally {
      try { fs.unlinkSync(CHILD_SRC); } catch (e) {}
      try { fs.unlinkSync(CHILD_GATE); } catch (e) {}
    }
  }
}

module.exports = Round434Mutant;
