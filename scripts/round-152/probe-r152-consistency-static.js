// 第 152 轮：normalize 一致性静态判据 —— 「英文 token 被 en2zh 拆散」精确诊断
//
// 分裂机制（151 轮踩坑③的通用化）：
//   gate(text) → discriminate(text) → _normText = normalize(text).normalized
//             → checkRewardHacking(_normText)
//   而直调 checkRewardHacking(text) 用的是**原文**。
//   当文本是中英混排且中文为主（cjkCount>=2 && latinWords>=1 && latinWords<=cjkCount）时，
//   en2zh 会把英文词翻成中文（prompt→提示）。若某中文侧模式**要求**这个英文词，
//   归一化后该词消失 → gate 放行，但直调命中 → 分裂。
//
// 精确判据（不需要构造攻击样本）：
//   对中文侧每条模式，取其中所有「会被 en2zh 翻译」的英文 token t。
//   若该模式的源串里**找不到 EN_ZH[t] 这个中文译形**，则该模式依赖的英文词
//   在归一化后会凭空消失 → 必然存在分裂（只要构造出的混排文本能命中它）。
//   反之若中英两形都在同一模式里（如 prompt|提示词|指令|提示），en2zh 无害。
//
// 用法：node scripts/round-152/probe-r152-consistency-static.js
const path = require('path');
const SRC = path.join(__dirname, '..', '..', 'src', 'reward-hacking.js');
const { REWARD_HACKING_ZH, REWARD_HACKING_EN } = require(SRC);
const { normalize } = require(path.join(__dirname, '..', '..', 'src', 'text-normalizer.js'));

// 与 src/text-normalizer.js 的 enZh 字典保持同步（运行时读取，避免漂移）
const EN_ZH = {
  ignore: '忽略', bypass: '绕过', skip: '跳过', disable: '关闭',
  instruction: '指令', instructions: '指令', prompt: '提示', password: '密码',
  verify: '验证', confirm: '确认', account: '账户', link: '链接',
  root: 'root', admin: '管理员', secret: '秘密', token: '令牌',
  freeze: '冻结', suspend: '停用', delete: '删除', execute: '执行',
  run: '运行', log: '日志', eval: 'eval', exec: 'exec',
  gnore: '忽略', nstruction: '指令', struction: '指令',
};

// 每条模式只用一次 normalize 取样验证：混排中文句 + 插入该英文词 → 归一化后是否真被翻掉
function en2zhWillFire(token) {
  const probe = '这是一段中文为主的混排测试句子，其中包含 ' + token + ' 这个词用于验证归一化行为';
  const n = normalize(probe);
  return n.applied.some(a => a === 'en2zh:' + token) && n.normalized.includes(EN_ZH[token]);
}

function asSource(p) {
  if (typeof p === 'string') return p;
  if (p instanceof RegExp) return p.source;
  return String(p);
}

// 找出模式源串中出现的英文 token（词边界，跳过转义序列）
function extractLatinTokens(p) {
  return extractLatinTokensFromSource(asSource(p));
}

function extractLatinTokensFromSource(src) {
  return (src.match(/[A-Za-z]{2,}/g) || []).filter(t => /^[a-z]+$/.test(t));
}

function analyze(table, label) {
  console.log('\n══════ ' + label + ' ══════');
  const divergent = [];
  let total = 0;
  for (const [cls, pats] of Object.entries(table)) {
    pats.forEach((p, i) => {
      total++;
      const toks = extractLatinTokensFromSource(asSource(p)).filter(t => EN_ZH[t]);
      if (toks.length === 0) return;
      // 归一化后仍能保留原形的（eval→eval / root→root / exec→exec）无害
      const effective = toks.filter(t => EN_ZH[t] !== t);
      if (effective.length === 0) return;
      const missing = effective.filter(t => !asSource(p).includes(EN_ZH[t]));
      if (missing.length > 0) {
        divergent.push({ cls, i, missing, toks });
      }
    });
  }
  for (const d of divergent) {
    console.log('  ⚠️ ' + d.cls + ' #' + String(d.i).padStart(2) + '  缺译形: ' + d.missing.map(t => t + '→' + EN_ZH[t]).join(', '));
  }
  console.log('\n  合计 ' + label + ': ' + total + ' 条模式，' + divergent.length + ' 条存在「英文 token 无中文译形」分裂风险');
  return divergent;
}

// 先验证 en2zh 字典与我们硬拷的一致性（运行时校验，防字典漂移）
console.log('══════ en2zh 字典运行时校验 ══════');
for (const [k, v] of Object.entries(EN_ZH)) {
  const fires = en2zhWillFire(k);
  if (!fires) console.log('  ⚠️ ' + k + ' 在混排句中未触发 en2zh（可能不影响此分析）');
}
console.log('  字典共 ' + Object.keys(EN_ZH).length + ' 项');

const zhDiv = analyze(REWARD_HACKING_ZH, '中文侧 REWARD_HACKING_ZH（归一化后由 gate 消费）');
const enDiv = analyze(REWARD_HACKING_EN, '英文侧 REWARD_HACKING_EN（纯英文不触发 en2zh，仅混排时经中文表）');

console.log('\n══════ 优先级（按族+缺译形数）══════');
const byCls = {};
for (const d of [...zhDiv, ...enDiv]) {
  byCls[d.cls] = byCls[d.cls] || { n: 0, miss: [] };
  byCls[d.cls].n++;
  for (const m of d.missing) if (!byCls[d.cls].miss.includes(m)) byCls[d.cls].miss.push(m);
}
for (const [cls, v] of Object.entries(byCls).sort((a, b) => b[1].n - a[1].n)) {
  console.log('  ' + cls.padEnd(28) + ' ' + v.n + ' 支  缺: ' + v.miss.join(', '));
}
