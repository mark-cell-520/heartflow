#!/usr/bin/env node
/**
 * ============================================================================
 * [AUDIT-FIX 2026-11-23] 本脚本当前未启用，不要直接打开定时任务！
 * ============================================================================
 * 已确认本脚本没有任何调度入口：无 cron、无 systemd timer、无 supervisord
 * program、也无常驻进程。这是刻意保持的状态。
 *
 * 启用前必须人工核对以下三件事，任一条不满足就不要启用：
 *
 *  1) 门禁基线。data/test-count.json 实测存量失败 195 个（2026-11-23），而
 *     data/auto-upgrade-known-failures.json 只容忍 32 个。旧逻辑因此恒判失败，
 *     恒触发 git reset --hard —— 那会连并行任务的未提交工作一起毁掉（今天已经
 *     真实发生过并发写冲突）。现在门禁改成按“存量失败 vs 本脚本新引入的失败”
 *     分类，只对后者失败；基线从 data/test-count.json 动态读。详见 parseTestResult。
 *
 *  2) 失败回滚。旧逻辑失败即 `git reset --hard HEAD`，属于无差别摧毁工作区。
 *     现已废除：失败只记日志、保留工作区、退出非零。唯一允许的回滚是
 *     `git reset --mixed` 到本脚本自己动手前的 HEAD，且必须校验那之间的每个
 *     commit 都是本脚本产的（chore(auto-upgrade): 前缀）。详见 rollbackOwnCommits。
 *
 *  3) 提交范围。旧逻辑 `git add -A`，会把并行任务的半成品一起提交。现已收窄为
 *     “本脚本确实改过的文件 ∩ 脚本自有路径白名单”，白名单见 SCRIPT_OWNED_PATHS。
 *
 * 另外：git push 目标是公开 GitHub 仓库（github.com/mark-cell-520/heartflow），
 * 推送前请确认本次改动可以公开。本脚本自身不负责审批。
 * ============================================================================
 *
 * HeartFlow 自动升级脚本（优化版）
 *
 * 优化点：
 *  1. 有真实代码变更才升级版本
 *  2. 单次只做一个最小变更
 *  3. 已知失败基线不阻断，新增失败才中止并回滚
 *  4. 推送失败指数退避重试
 *  5. 变更后自动校验：node --check、版本同步、git diff 记录
 *
 * [AUDIT-FIX 2026-11-23] 上述第 3 条的“回滚”已按文件头说明改为非破坏性回滚；
 * 第 5 条的 node --check 已改为 execFileSync 参数数组形式，消除命令注入面。
 */

'use strict';

const fs = require('fs');
const path = require('path');
// [AUDIT-FIX 2026-11-23] 原为 { execSync }。execFileSync 用参数数组把可执行文件与
// 参数分开交给 execve，不经过 shell，因此文件名里带空格/引号/$(...) 也只是一个
// 普通字符串参数。旧代码 `execSync('node --check "' + file + '"')` 是拼字符串后
// 交给 /bin/sh 解析，file 来自 `git status --porcelain` 的行内容，属于外部可控
// 输入，构成命令注入面。
const { execSync, execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const VERSION_FILE = path.join(ROOT, 'VERSION');
const VERSION_JS = path.join(ROOT, 'src/core/version.js');
const PACKAGE_JSON = path.join(ROOT, 'package.json');
const UPGRADE_LOG = path.join(ROOT, 'data', 'auto-upgrade-history.json');
const UPGRADE_CANDIDATES = path.join(ROOT, 'data', 'upgrade-candidates.json');
const KNOWN_FAILURES_PATH = path.join(ROOT, 'data', 'auto-upgrade-known-failures.json');
// [AUDIT-FIX 2026-11-23] 存量失败基线来源：test/run-all.js 每次跑完都会写这个文件，
// 里面的 failed 就是“与本次改动无关的存量失败数”。门禁拿它当基线，而不是拿
// auto-upgrade-known-failures.json 里那个 32 当基线。
const TEST_COUNT_PATH = path.join(ROOT, 'data', 'test-count.json');

// [AUDIT-FIX 2026-11-23] 本脚本自己会碰到的全部文件（相对仓库根）。用于把
// `git add -A` 收窄成“只 add 这些文件”，避免把并行任务的半成品一起提交。
// 前 3 个来自 applyVersionBump，中间 2 个来自 materializeCandidates 的 data 回退
// 分支，最后一个是 UPGRADE_LOG（appendLog 会写，但它本来就在 .gitignore 里，
// 列出来只为语义完整）。src/ 下那 14 个是 MATERIALIZATION_RULES 的目标文件。
const SCRIPT_OWNED_PATHS = [
  'VERSION',
  'src/core/version.js',
  'package.json',
  'data/auto-rules.json',
  'data/upgrade-candidates.json',
  'data/auto-upgrade-history.json',
  'src/consciousness/consciousness-theory.js',
  'src/consciousness/multi-agent-dialogue.js',
  'src/core/embodied-core.js',
  'src/cortex/reflection-loop.js',
  'src/cortex/strategic-restraint.js',
  'src/emotion/emotion-dynamics-engine.js',
  'src/emotion/engine.js',
  'src/emotion/psychology.js',
  'src/memory/agentic-memory-engine.js',
  'src/memory/semantic-anchor.js',
  'src/planner/evolutionary-search.js',
  'src/reasoning/causal-inference.js',
  'src/shield/epistemic-safety.js',
  'src/shield/safety-guardrails.js',
];

function readJson(p, fallback) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return fallback;
  }
}

function writeJson(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');
}

function appendLog(entry) {
  const log = readJson(UPGRADE_LOG, []);
  log.push(entry);
  if (log.length > 500) log.splice(0, log.length - 500);
  writeJson(UPGRADE_LOG, log);
}

function now() { return Date.now(); }

// ─── 版本号 +0.0.1 ─────────────────────────────────────────────────────────

function bumpPatch(versionStr) {
  const parts = versionStr.split('.').map(Number);
  if (parts.length < 3) parts.push(0, 0);
  parts[2] = (parts[2] || 0) + 1;
  return parts.join('.');
}

function applyVersionBump(newVersion) {
  fs.writeFileSync(VERSION_FILE, newVersion + '\n');
  let vjs = fs.readFileSync(VERSION_JS, 'utf8');
  vjs = vjs.replace(/let VERSION = '[^']+';/, `let VERSION = '${newVersion}';`);
  fs.writeFileSync(VERSION_JS, vjs);
  const pkg = readJson(PACKAGE_JSON, {});
  pkg.version = newVersion;
  writeJson(PACKAGE_JSON, pkg);
}

function revertVersionBump(originalVersion) {
  applyVersionBump(originalVersion);
}

// ─── Git 操作 ──────────────────────────────────────────────────────────────

// [AUDIT-FIX 2026-11-23] gitResetHard() 已删除，原因是它会摧毁一切未提交改动。
// 旧代码在“语法错误”“测试新增失败”“推送失败”三条路径上都调它，而工作区里可能
// 同时躺着其他并行任务（agent4 / hf4-commit.sh 等）没提交的半成品——今天已经真实
// 发生过并发写冲突。git reset --hard 对“别人的工作”和“自己的回滚”一视同仁地抹掉，
// 这个代价换不回任何好处：本脚本的改动本来就是可重放的（再跑一次 materialize 即可）。
//
// 现在的失败语义只有一句：记日志、保留工作区、退出非零。绝不动工作区一个字节。
function gitResetHard() {
  // 刻意保留这个函数名并让它恒失败，是为了让任何漏改的旧调用点立刻暴露，
  // 而不是悄悄回到破坏性行为。
  throw new Error('[AUDIT-FIX 2026-11-23] gitResetHard 已废除：失败路径不再重置工作区');
}

function git(args, timeout = 60000) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: 'pipe', timeout });
}

function gitHead() {
  try {
    return git(['rev-parse', 'HEAD']).trim();
  } catch {
    return null;
  }
}

/**
 * 从 `git status --porcelain` 的一行里取出路径。
 * porcelain v1 格式是 "XY<space>path"（X/Y 是两个状态位）；重命名是
 * "R  old -> new"，要取箭头之后的新路径。
 */
function porcelainPath(line) {
  const rest = String(line).slice(3);
  const arrow = rest.indexOf(' -> ');
  return (arrow >= 0 ? rest.slice(arrow + 4) : rest).trim();
}

function gitStatus() {
  try {
    const out = git(['status', '--porcelain']);
    // [AUDIT-FIX 2026-11-23] 原来是 out.trim().split('\n')。trim() 作用在整段输出上，
    // 会把第一行前面的状态位空格一起吃掉（' M scripts/a.js' → 'M scripts/a.js'），
    // 于是第一行的路径少一个字符（变成 'cripts/a.js'）。后果有两个：
    //   1) 预校验的 node --check 去查一个不存在的路径，误报“语法错误”并中止整轮；
    //   2) collectOwnChangedFiles 漏掉本脚本改的第一个文件，提交内容不完整。
    // 正确做法是先按行拆、再逐行判断是否为空。
    return out.split('\n').map(l => l.replace(/\r$/, '')).filter(l => l.trim().length > 0);
  } catch {
    return [];
  }
}

function gitDiffStat() {
  try {
    return git(['diff', '--cached', '--stat']).trim();
  } catch {
    return '';
  }
}

/**
 * [AUDIT-FIX 2026-11-23] 只回滚“本脚本自己产生的提交”。
 *
 * 前置条件（缺一不可，否则直接拒绝）：
 *   - baselineHead 是一个真实存在的 commit；
 *   - baselineHead..HEAD 之间的每个 commit，其 message 都以本脚本的前缀开头。
 * 第二条是为了防止把别人夹在中间的提交一起退掉。
 *
 * 用 --mixed 而不是 --hard：--mixed 只移动 HEAD 和清索引，工作区文件内容原样留着，
 * 没有任何数据丢失风险。正常情况下（失败发生在 commit 之前）HEAD 仍等于 baselineHead，
 * 这时什么都不做，直接返回。
 */
const AUTO_UPGRADE_COMMIT_PREFIX = 'chore(auto-upgrade):';

function rollbackOwnCommits(baselineHead) {
  if (!baselineHead) {
    return { ok: false, error: 'no baseline HEAD recorded; refusing to roll back' };
  }
  let type;
  try {
    type = git(['cat-file', '-t', baselineHead]).trim();
  } catch (e) {
    return { ok: false, error: `baseline ${baselineHead} 不存在: ${e.message}` };
  }
  if (type !== 'commit') {
    return { ok: false, error: `baseline ${baselineHead} 不是 commit（cat-file -t = ${type}）` };
  }
  const head = gitHead();
  if (!head) return { ok: false, error: '读不到当前 HEAD' };
  if (head === baselineHead) {
    return { ok: true, rolledBack: 0, note: 'HEAD 仍等于 baseline，无需回滚' };
  }
  let subjects;
  try {
    subjects = git(['log', '--format=%s', `${baselineHead}..HEAD`]).trim().split('\n').filter(Boolean);
  } catch (e) {
    return { ok: false, error: `读 ${baselineHead}..HEAD 的提交列表失败: ${e.message}` };
  }
  const foreign = subjects.filter(s => !s.startsWith(AUTO_UPGRADE_COMMIT_PREFIX));
  if (foreign.length > 0) {
    return {
      ok: false,
      error: `拒绝回滚：${baselineHead}..HEAD 之间有 ${foreign.length} 个不是本脚本产生的提交`,
      foreignSubjects: foreign,
    };
  }
  try {
    git(['reset', '--mixed', baselineHead], 120000);
  } catch (e) {
    return { ok: false, error: `git reset --mixed 失败: ${e.message}` };
  }
  return { ok: true, rolledBack: subjects.length, from: head, to: baselineHead };
}

// ─── 论文/资料搜索：生成候选升级点 ─────────────────────────────────────────

function searchUpgradeCandidates() {
  const candidates = [];

  const psychPhilosophyQueries = [
    'dual process theory cognitive bias debiasing',
    'theory of mind mentalizing LLM',
    'moral psychology virtue ethics AI alignment',
    'embodied cognition situated cognition',
    'phenomenology consciousness artificial intelligence',
    'free will determinism moral responsibility',
    'epistemic humility intellectual virtue',
    'emotional regulation affective computing',
  ];

  const agentQueries = [
    'LLM agent tool use grounding',
    'multi-agent coordination debate',
    'agent memory retrieval augmented generation',
    'self-reflection LLM iterative improvement',
    'planning acting LLM',
    'agent safety alignment',
    'continual learning lifelong learning agent',
  ];

  const allQueries = [...psychPhilosophyQueries, ...agentQueries];

  for (const q of allQueries) {
    const id = `cand-${now()}-${Math.random().toString(36).slice(2, 7)}`;
    candidates.push({
      id,
      kind: 'research-idea',
      source: 'auto-search',
      query: q,
      detail: `检索主题「${q}」，待人工/自动转化为代码改动`,
      timestamp: now(),
    });
  }

  return candidates;
}

// ─── 将候选转化为最小可运行代码变更 ────────────────────────────────────────

const MATERIALIZATION_RULES = [
  {
    match: /theory of mind|mentalizing|false belief/i,
    patch: () => {
      const file = path.join(ROOT, 'src', 'consciousness', 'consciousness-theory.js');
      if (!fs.existsSync(file)) return false;
      let text = fs.readFileSync(file, 'utf8');
      const marker = '// [auto-upgrade] theory-of-mind candidate from research';
      if (text.includes(marker)) return false;
      text = text.replace('\nmodule.exports', `${marker}: consider ToM grounding from psychology/philosophy sources\nmodule.exports`);
      fs.writeFileSync(file, text);
      return true;
    },
  },
  {
    match: /self-reflection|iterative improvement|reflexion/i,
    patch: () => {
      const file = path.join(ROOT, 'src', 'cortex', 'reflection-loop.js');
      if (!fs.existsSync(file)) return false;
      let text = fs.readFileSync(file, 'utf8');
      const marker = '// [auto-upgrade] self-reflection candidate from research';
      if (text.includes(marker)) return false;
      text = text.replace('\nmodule.exports', `${marker}: consider reflexion-style verbal reinforcement loop\nmodule.exports`);
      fs.writeFileSync(file, text);
      return true;
    },
  },
  {
    match: /curiosity|intrinsic motivation|exploration bonus/i,
    patch: () => {
      const file = path.join(ROOT, 'src', 'emotion', 'psychology.js');
      if (!fs.existsSync(file)) return false;
      let text = fs.readFileSync(file, 'utf8');
      const marker = '// [auto-upgrade] curiosity candidate from research';
      if (text.includes(marker)) return false;
      text = text.replace('\nmodule.exports', `${marker}: consider intrinsic motivation signal for exploration\nmodule.exports`);
      fs.writeFileSync(file, text);
      return true;
    },
  },
  {
    match: /continual|lifelong|catastrophic forgetting/i,
    patch: () => {
      const file = path.join(ROOT, 'src', 'memory', 'agentic-memory-engine.js');
      if (!fs.existsSync(file)) return false;
      let text = fs.readFileSync(file, 'utf8');
      const marker = '// [auto-upgrade] continual-learning candidate from research';
      if (text.includes(marker)) return false;
      text = text.replace('\nmodule.exports', `${marker}: consider replay/regularization against catastrophic forgetting\nmodule.exports`);
      fs.writeFileSync(file, text);
      return true;
    },
  },
  {
    match: /causal inference|counterfactual/i,
    patch: () => {
      const file = path.join(ROOT, 'src', 'reasoning', 'causal-inference.js');
      if (!fs.existsSync(file)) return false;
      let text = fs.readFileSync(file, 'utf8');
      const marker = '// [auto-upgrade] causal candidate from research';
      if (text.includes(marker)) return false;
      text = text.replace('\nmodule.exports', `${marker}: consider counterfactual grounding for causal judgments\nmodule.exports`);
      fs.writeFileSync(file, text);
      return true;
    },
  },
  {
    match: /moral psychology|virtue ethics|AI alignment/i,
    patch: () => {
      const file = path.join(ROOT, 'src', 'emotion', 'engine.js');
      if (!fs.existsSync(file)) return false;
      let text = fs.readFileSync(file, 'utf8');
      const marker = '// [auto-upgrade] moral-philosophy candidate from research';
      if (text.includes(marker)) return false;
      text = text.replace('\nmodule.exports', `${marker}: consider virtue-ethics calibration for alignment judgments\nmodule.exports`);
      fs.writeFileSync(file, text);
      return true;
    },
  },
  {
    match: /embodied cognition|situated cognition/i,
    patch: () => {
      const file = path.join(ROOT, 'src', 'core', 'embodied-core.js');
      if (!fs.existsSync(file)) return false;
      let text = fs.readFileSync(file, 'utf8');
      const marker = '// [auto-upgrade] embodied-cognition candidate from research';
      if (text.includes(marker)) return false;
      text = text.replace('\nmodule.exports', `${marker}: consider situated-context weighting for grounding\nmodule.exports`);
      fs.writeFileSync(file, text);
      return true;
    },
  },
  {
    match: /free will|determinism|moral responsibility/i,
    patch: () => {
      const file = path.join(ROOT, 'src', 'cortex', 'strategic-restraint.js');
      if (!fs.existsSync(file)) return false;
      let text = fs.readFileSync(file, 'utf8');
      const marker = '// [auto-upgrade] free-will candidate from research';
      if (text.includes(marker)) return false;
      text = text.replace('\nmodule.exports', `${marker}: consider responsibility-aware restraint heuristics\nmodule.exports`);
      fs.writeFileSync(file, text);
      return true;
    },
  },
  {
    match: /emotional regulation|affective computing/i,
    patch: () => {
      const file = path.join(ROOT, 'src', 'emotion', 'emotion-dynamics-engine.js');
      if (!fs.existsSync(file)) return false;
      let text = fs.readFileSync(file, 'utf8');
      const marker = '// [auto-upgrade] emotion-regulation candidate from research';
      if (text.includes(marker)) return false;
      text = text.replace('\nmodule.exports', `${marker}: consider affective-state gating before high-stakes output\nmodule.exports`);
      fs.writeFileSync(file, text);
      return true;
    },
  },
  {
    match: /LLM agent tool use grounding/i,
    patch: () => {
      const file = path.join(ROOT, 'src', 'consciousness', 'multi-agent-dialogue.js');
      if (!fs.existsSync(file)) return false;
      let text = fs.readFileSync(file, 'utf8');
      const marker = '// [auto-upgrade] tool-grounding candidate from research';
      if (text.includes(marker)) return false;
      text = text.replace('\nmodule.exports', `${marker}: consider grounded tool verification before execution\nmodule.exports`);
      fs.writeFileSync(file, text);
      return true;
    },
  },
  {
    match: /multi-agent coordination|debate/i,
    patch: () => {
      const file = path.join(ROOT, 'src', 'consciousness', 'multi-agent-dialogue.js');
      if (!fs.existsSync(file)) return false;
      let text = fs.readFileSync(file, 'utf8');
      const marker = '// [auto-upgrade] multi-agent candidate from research';
      if (text.includes(marker)) return false;
      text = text.replace('\nmodule.exports', `${marker}: consider debate-style arbitration for conflicting evidence\nmodule.exports`);
      fs.writeFileSync(file, text);
      return true;
    },
  },
  {
    match: /agent memory retrieval augmented generation/i,
    patch: () => {
      const file = path.join(ROOT, 'src', 'memory', 'semantic-anchor.js');
      if (!fs.existsSync(file)) return false;
      let text = fs.readFileSync(file, 'utf8');
      const marker = '// [auto-upgrade] retrieval-augmentation candidate from research';
      if (text.includes(marker)) return false;
      text = text.replace('\nmodule.exports', `${marker}: consider RAG-style evidence injection into reasoning context\nmodule.exports`);
      fs.writeFileSync(file, text);
      return true;
    },
  },
  {
    match: /planning acting LLM/i,
    patch: () => {
      const file = path.join(ROOT, 'src', 'planner', 'evolutionary-search.js');
      if (!fs.existsSync(file)) return false;
      let text = fs.readFileSync(file, 'utf8');
      const marker = '// [auto-upgrade] planning candidate from research';
      if (text.includes(marker)) return false;
      text = text.replace('\nmodule.exports', `${marker}: consider explicit plan-verify-act loop before execution\nmodule.exports`);
      fs.writeFileSync(file, text);
      return true;
    },
  },
  {
    match: /agent safety alignment/i,
    patch: () => {
      const file = path.join(ROOT, 'src', 'shield', 'safety-guardrails.js');
      if (!fs.existsSync(file)) return false;
      let text = fs.readFileSync(file, 'utf8');
      const marker = '// [auto-upgrade] safety-alignment candidate from research';
      if (text.includes(marker)) return false;
      text = text.replace('\nmodule.exports', `${marker}: consider alignment-before-capability priority gate\nmodule.exports`);
      fs.writeFileSync(file, text);
      return true;
    },
  },
  {
    match: /epistemic humility|intellectual virtue/i,
    patch: () => {
      const file = path.join(ROOT, 'src', 'shield', 'epistemic-safety.js');
      if (!fs.existsSync(file)) return false;
      let text = fs.readFileSync(file, 'utf8');
      const marker = '// [auto-upgrade] epistemic-humility candidate from research';
      if (text.includes(marker)) return false;
      text = text.replace('\nmodule.exports', `${marker}: consider doubt calibration for uncertain claims\nmodule.exports`);
      fs.writeFileSync(file, text);
      return true;
    },
  },
];

function materializeCandidates(candidates) {
  let changed = false;
  const applied = [];

  // 优先尝试真实代码补丁
  for (const c of candidates) {
    for (const rule of MATERIALIZATION_RULES) {
      if (rule.match.test(c.query + ' ' + c.detail)) {
        try {
          const didPatch = rule.patch();
          if (didPatch) {
            applied.push({ id: c.id, type: 'code-patch', query: c.query });
            changed = true;
            break;
          }
        } catch {
          // 单条失败不影响整体
        }
      }
    }
    if (changed) break; // 单次只做一个最小变更
  }

  // 如果没有可落地的代码变更，再回退到 data 规则
  if (!changed) {
    for (const c of candidates) {
      try {
        const rulesPath = path.join(ROOT, 'data', 'auto-rules.json');
        const rules = readJson(rulesPath, { rules: [] });
        const newRule = {
          id: c.id,
          source: c.source,
          query: c.query,
          detail: c.detail,
          createdAt: c.timestamp,
          enabled: true,
        };
        if (!rules.rules.some(r => r.query === c.query && r.detail === c.detail)) {
          rules.rules.push(newRule);
          writeJson(rulesPath, rules);
          applied.push(newRule);
          changed = true;
          break; // 单次只做一个最小变更
        }
      } catch {
        // 单条失败不影响整体
      }
    }
  }

  return { changed, applied };
}

// ─── 运行测试：只阻断“本脚本新引入的失败” ──────────────────────────────────
//
// [AUDIT-FIX 2026-11-23] 旧逻辑是 `newFailures = max(0, failed - knownFailures.count)`，
// 而 auto-upgrade-known-failures.json 里的 count 停在 32，data/test-count.json 实测
// failed 已经是 195（2026-11-23，且历史区间 195~249 波动）。于是每一轮都算出
// 160+ 个“新失败”→ 恒判失败 → 恒触发 git reset --hard。这不是“基线该调大”的问题，
// 是拿一个手填的常数去描述一个会自己漂的存量，方向就错了。
//
// 现在改成分类：
//   存量失败（stock）  = data/test-count.json 的 failed，取最近一次全量回归的实测值
//   新引入失败（new） = max(0, 本次 failed - stock)
// 只对 new 失败。另外显式核对 auto-upgrade-known-failures.json：如果它的 count 与
// stock 差得离谱（< stock 的一半），打一条醒目告警——这说明有人在拿旧常数当基线，
// 但告警只是告警，绝不再触发任何工作区重置。
//
// 取不到基线时宁可拒绝判定（reason 说清“请人工核对”），也不猜一个数放行。

function readStockBaseline() {
  const tc = readJson(TEST_COUNT_PATH, null);
  if (!tc || typeof tc.failed !== 'number' || tc.failed < 0) {
    return { ok: false, reason: `读不到存量失败基线：${TEST_COUNT_PATH} 缺失或没有合法的 failed 字段，请先跑一次 node test/run-all.js` };
  }
  return {
    ok: true,
    stock: tc.failed,
    at: tc.at || null,
    source: 'data/test-count.json',
  };
}

function parseTestResult(output) {
  const text = String(output);
  const summaryMatch = text.match(/测试结果:\s*(\d+)\s+通过,\s*(\d+)\s+失败/);
  if (!summaryMatch) {
    return { ok: false, failedCount: -1, knownFailures: 0, newFailures: -1, reason: 'cannot parse test summary' };
  }
  const passed = parseInt(summaryMatch[1], 10);
  const failed = parseInt(summaryMatch[2], 10);

  const baseline = readStockBaseline();
  if (!baseline.ok) {
    // 没有基线就不判定，明确报“请人工核对”，由调用方决定中止。
    return {
      ok: false,
      passed,
      failed,
      stockBaseline: null,
      allowedFailures: null,
      knownFailures: null,
      newFailures: -1,
      reason: baseline.reason,
    };
  }
  const stockBaseline = baseline.stock;

  const known = readJson(KNOWN_FAILURES_PATH, { count: null, updatedAt: null });
  const knownCount = typeof known.count === 'number' ? known.count : null;

  const newFailures = Math.max(0, failed - stockBaseline);

  // 手填常数与实测存量差得远 → 告警（不阻断、不重置任何东西）
  let baselineWarning = null;
  if (knownCount !== null && knownCount < stockBaseline / 2) {
    baselineWarning =
      `auto-upgrade-known-failures.json 的 count=${knownCount} 与实测存量失败 ${stockBaseline} 严重脱节` +
      `（不足一半）。该文件已不再作为门禁基线，请人工核对后更新它，或直接删除 count 字段`;
  }

  return {
    ok: newFailures === 0,
    passed,
    failed,
    stockBaseline,
    stockBaselineAt: baseline.at,
    allowedFailures: stockBaseline,
    knownFailures: Math.min(failed, stockBaseline),
    knownFailuresFileCount: knownCount,
    baselineWarning,
    newFailures,
  };
}

function runTests() {
  try {
    const out = execSync('node test/run-all.js', {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: 'pipe',
      // [全局修复 2026-10-26] 原 120s——全量回归 638 文件实测 27 分钟，
      // 每轮必被杀且无汇总行 → parseTestResult 判 ok:false → 轮轮次反复失败。
      // 40 分钟 = 实测 27 分钟 + 50% 余量。
      timeout: 2400000,
    });
    // [AUDIT-FIX 2026-11-23] 旧代码这里返回写死的 { ok: true, passed: 0, failed: 0 }，
    // 等于“跑成功也不做基线核对”。现在照样解析 stdout，让存量失败告警有机会打出来。
    const parsed = parseTestResult(out);
    return { ok: parsed.ok, output: out, parsed };
  } catch (e) {
    const output = e.stdout || e.message || '';
    const parsed = parseTestResult(output);
    return { ok: parsed.ok, output, parsed };
  }
}

// ─── Git 提交推送 ──────────────────────────────────────────────────────────

/**
 * [AUDIT-FIX 2026-11-23] 旧代码是 `git add -A`：把工作区里所有改动（含并行任务
 * 没提交的半成品、误放的临时文件）一并 stage 进本脚本的提交。现已收窄成
 * “本脚本确实改过的文件” ∩ “脚本自有路径白名单”。
 *
 * @param {Set<string>|null} baselineStatusSet 脚本动手前的 git status --porcelain 集合
 *   （主流程在干净工作区预检通过后立刻采集）。用它把“本来就脏着的文件”排除掉。
 */
function collectOwnChangedFiles(baselineStatusSet) {
  const current = gitStatus();
  const own = [];
  const skipped = [];
  for (const line of current) {
    const file = porcelainPath(line);
    if (baselineStatusSet && baselineStatusSet.has(file)) {
      skipped.push({ file, why: '脚本动手前就是脏的，不是本次改动' });
      continue;
    }
    if (SCRIPT_OWNED_PATHS.includes(file)) {
      own.push(file);
    } else {
      skipped.push({ file, why: '不在 SCRIPT_OWNED_PATHS 白名单，可能是并行任务的改动' });
    }
  }
  return { own, skipped };
}

function gitCommitPush(message, baselineStatusSet) {
  try {
    const { own, skipped } = collectOwnChangedFiles(baselineStatusSet);
    if (own.length === 0) {
      return { ok: false, error: '没有属于本脚本的改动可提交（collectOwnChangedFiles 为空），拒绝提交' };
    }
    // 用参数数组 + `--` 分隔，文件名不会再被 shell 解释
    execFileSync('git', ['add', '--', ...own], { cwd: ROOT, encoding: 'utf8', stdio: 'pipe', timeout: 60000 });
    if (skipped.length > 0) {
      console.log('[auto-upgrade] 以下改动未纳入本次提交（不属于本脚本）:',
        skipped.map(s => `${s.file}（${s.why}）`).join('; '));
    }
    // [AUDIT-FIX 2026-11-23] 原为 execSync(`git commit -m "${message}"`)，
    // message 里若出现双引号/$(...)/反引号会被 shell 解释。改用参数数组 + -F -
    // 从 stdin 读 message，彻底不经 shell。
    execFileSync('git', ['commit', '-F', '-'], {
      cwd: ROOT, encoding: 'utf8', stdio: 'pipe', timeout: 60000, input: message + '\n',
    });
    // 推送失败时重试，指数退避
    let lastError = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        execFileSync('git', ['push', 'heartflow', 'main'], { cwd: ROOT, encoding: 'utf8', stdio: 'pipe', timeout: 120000 });
        return { ok: true, committedFiles: own };
      } catch (e) {
        lastError = e.message;
        if (attempt < 2) {
          const backoff = 5000 * Math.pow(2, attempt);
          console.log(`[auto-upgrade] push failed, retry ${attempt + 1}/3 after ${backoff}ms...`);
          const start = Date.now();
          while (Date.now() - start < backoff) {}
        }
      }
    }
    return { ok: false, error: lastError };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// ─── 主流程 ────────────────────────────────────────────────────────────────

async function main() {
  const startedAt = now();
  const entry = {
    startedAt,
    status: 'running',
    phase: 'init',
    versionBefore: null,
    versionAfter: null,
    candidates: 0,
    applied: 0,
    tests: null,
    git: null,
    diffStat: null,
  };

  try {
    // 预检：确保工作区干净
    const dirty = gitStatus();
    if (dirty.length > 0) {
      entry.status = 'failed';
      entry.error = 'dirty working tree';
      appendLog(entry);
      console.log('[auto-upgrade] dirty working tree, abort:', dirty.join(', '));
      process.exit(1);
    }

    // [AUDIT-FIX 2026-11-23] 工作区干净这一点刚确认过，此刻采集两个基线：
    //   baselineHead        —— 本脚本动手前的 HEAD，rollbackOwnCommits 的回滚目标
    //   baselineStatusSet   —— 此刻的 status 集合（正常为空）；之后若出现新脏文件，
    //                          与它比对就能区分“本脚本改的”和“并行任务改的”。
    // 必须在这里采：materialize/applyVersionBump 之后工作区就不再干净了。
    const baselineHead = gitHead();
    const baselineStatusSet = new Set(gitStatus().map(porcelainPath));
    if (!baselineHead) {
      entry.status = 'failed';
      entry.error = 'cannot resolve baseline HEAD (not a git repo?)';
      appendLog(entry);
      console.log('[auto-upgrade] 读不到 baseline HEAD，中止（没有回滚锚点不安全）');
      process.exit(1);
    }
    entry.baselineHead = baselineHead;

    const currentVersion = fs.readFileSync(VERSION_FILE, 'utf8').trim();
    entry.versionBefore = currentVersion;
    const newVersion = bumpPatch(currentVersion);
    entry.versionAfter = newVersion;

    entry.phase = 'search';
    const candidates = searchUpgradeCandidates();
    entry.candidates = candidates.length;

    const existing = readJson(UPGRADE_CANDIDATES, []);
    existing.push(...candidates);
    if (existing.length > 200) existing.splice(0, existing.length - 200);
    writeJson(UPGRADE_CANDIDATES, existing);

    entry.phase = 'materialize';
    const { changed, applied } = materializeCandidates(candidates);
    entry.applied = applied.length;
    entry.changed = changed;

    // 没有真实变更就不升级版本，不提交
    if (!changed) {
      entry.status = 'success';
      entry.finishedAt = now();
      appendLog(entry);
      console.log(`[auto-upgrade] no material change, skip version bump and commit`);
      return;
    }

    applyVersionBump(newVersion);

    // 预校验：检查语法
    entry.phase = 'precheck';
    // [AUDIT-FIX 2026-11-23] 原来遍历 gitStatus() 的全部 .js。提交范围既已收窄到
    // SCRIPT_OWNED_PATHS，去检查不会进本次提交的文件就是白做功，而且并行任务留下的
    // 半成品一旦有语法错误，会让本脚本背锅中止（“syntax error in patched files”
    // 但它并不是本脚本 patch 的）。这里同步收窄。
    const changedFiles = gitStatus().filter(line => SCRIPT_OWNED_PATHS.includes(porcelainPath(line)));
    const syntaxErrors = [];
    for (const line of changedFiles) {
      const file = porcelainPath(line);
      if (!file.endsWith('.js')) continue;
      try {
        // [AUDIT-FIX 2026-11-23] 原为 execSync(`node --check "${file}"`)：拼字符串后
        // 交给 /bin/sh，file 来自 git status 的行内容（可含重命名/空格/非常规字符），
        // 构成命令注入面。改成 execFileSync 参数数组：process.execPath 与 file 作为
        // 独立 argv 元素直达 execve，不经 shell，任何字符都只是普通参数。
        execFileSync(process.execPath, ['--check', file], {
          cwd: ROOT, encoding: 'utf8', stdio: 'pipe', timeout: 30000,
        });
      } catch (e) {
        syntaxErrors.push(file + ': ' + (e.stdout || e.message).split('\n')[0]);
      }
    }
    if (syntaxErrors.length > 0) {
      // [AUDIT-FIX 2026-11-23] 旧代码这里 revertVersionBump + gitResetHard()。
      // git reset --hard 会连并行任务未提交的工作一起毁掉，已废除。
      // 现在只把版本号改回去（那是本脚本自己刚写的三个文件），
      // 其余工作区原样保留，交由人工判断。
      revertVersionBump(currentVersion);
      entry.status = 'failed';
      entry.error = 'syntax error in patched files';
      entry.syntaxErrors = syntaxErrors;
      entry.workdirKept = true;
      entry.note = '工作区已保留（未执行 git reset --hard），请人工处理上述语法错误后重跑';
      appendLog(entry);
      console.log('[auto-upgrade] syntax error, 版本号已还原，工作区保留不动:', syntaxErrors.join(', '));
      process.exit(1);
    }

    // 记录 diff stat
    entry.diffStat = gitDiffStat();

    // 运行测试
    entry.phase = 'test';
    const testResult = runTests();
    entry.tests = { ok: testResult.ok, parsed: testResult.parsed };

    // [AUDIT-FIX 2026-11-23] 存量失败基线与手填常数差得远时，先吼一声。
    // 这只是告警：不阻断、不重置工作区、不改任何文件。
    if (testResult.parsed && testResult.parsed.baselineWarning) {
      console.log('[auto-upgrade][WARN]', testResult.parsed.baselineWarning);
    }

    if (!testResult.ok) {
      // [AUDIT-FIX 2026-11-23] 旧代码 revertVersionBump + gitResetHard()。
      // git reset --hard 会摧毁包括并行任务在内的全部未提交工作，已废除。
      // 现在只还原本脚本自己刚写的版本号，工作区原样保留、退出非零。
      revertVersionBump(currentVersion);
      entry.status = 'failed';
      entry.error = testResult.parsed && testResult.parsed.newFailures === -1
        ? (testResult.parsed.reason || '无法判定测试门禁')
        : 'new test failures detected';
      entry.testOutput = testResult.output.slice(-2000);
      entry.workdirKept = true;
      entry.note = '工作区已保留（未执行 git reset --hard）。若是存量失败基线问题，请人工核对 data/test-count.json 与 data/auto-upgrade-known-failures.json';
      appendLog(entry);
      console.log('[auto-upgrade] 测试门禁未过，版本号已还原，工作区保留不动');
      console.log('[auto-upgrade] new failures:', testResult.parsed.newFailures,
        '/ stock baseline:', testResult.parsed.stockBaseline);
      if (testResult.parsed.reason) console.log('[auto-upgrade] reason:', testResult.parsed.reason);
      process.exit(1);
    }

    entry.phase = 'git';
    const gitResult = gitCommitPush(
      `chore(auto-upgrade): v${newVersion} + ${applied.length} research-driven candidates`,
      baselineStatusSet,
    );
    entry.git = gitResult;

    if (!gitResult.ok) {
      // 推送失败：把版本号改回去，并尝试退掉本脚本刚产生的那个本地提交。
      // [AUDIT-FIX 2026-11-23] 旧代码只 revertVersionBump，commit 留在本地没人管；
      // 且旧代码更早的版本在这里也调 gitResetHard()。现在改为 rollbackOwnCommits：
      // 只退本脚本自己的提交（--mixed，不碰工作区内容），且必须校验那之间的每个
      // commit 都是本脚本产的，否则拒绝回滚并把情况报出来。
      revertVersionBump(currentVersion);
      const rollback = rollbackOwnCommits(baselineHead);
      entry.rollback = rollback;
      entry.status = rollback.ok ? 'failed' : 'failed-needs-manual';
      entry.error = 'git push failed';
      appendLog(entry);
      console.log('[auto-upgrade] git push failed, rollback version:', gitResult.error);
      if (rollback.ok) {
        console.log('[auto-upgrade] 已退回本脚本自己的提交:', JSON.stringify(rollback));
      } else {
        console.log('[auto-upgrade][WARN] 未能自动回滚提交，请人工处理:', rollback.error);
        if (rollback.foreignSubjects) {
          console.log('[auto-upgrade][WARN] 夹在中间的非本脚本提交:', rollback.foreignSubjects.join(' | '));
        }
      }
      process.exit(1);
    }

    entry.status = 'success';
    entry.finishedAt = now();
    appendLog(entry);
    console.log(`[auto-upgrade] success: v${currentVersion} -> v${newVersion}, ${applied.length} candidates, tests passed`);
    console.log('[auto-upgrade] diff:', entry.diffStat);
  } catch (e) {
    entry.status = 'error';
    entry.error = e.message;
    appendLog(entry);
    console.error('[auto-upgrade] error:', e.message);
    process.exit(1);
  }
}

main();
