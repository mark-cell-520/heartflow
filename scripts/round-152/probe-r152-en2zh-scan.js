// 第 152 轮：normalize 一致性全族扫描（静态部分）
// 目的：151 轮踩坑③的通用化 —— rh 判据含英文技术名词时，text-normalizer 的
//       en2zh 会把该词翻成中文，导致「直调 rh(原文) 命中、gate(归一化文本) 放行」
//       的分裂现象。本脚本静态扫出所有可能被 en2zh 拆散的判据行。
//
// 判据：模式源串里出现 en2zh 字典的 key（词边界匹配）→ 该行视为 fragile。
//       这不等于一定有洞（要看该 key 是否处于必经路径），但它是候选集。
//
// 用法：node scripts/round-152/probe-r152-en2zh-scan.js
const path = require('path');
const SRC = path.join(__dirname, '..', '..', 'src', 'reward-hacking.js');
const { REWARD_HACKING_ZH, REWARD_HACKING_EN } = require(SRC);

// 与 src/text-normalizer.js 的 enZh 字典保持同步（此处硬拷贝，扫描脚本不依赖运行时）
const EN_ZH = {
  ignore: '忽略', bypass: '绕过', skip: '跳过', disable: '关闭',
  instruction: '指令', instructions: '指令', prompt: '提示', password: '密码',
  verify: '验证', confirm: '确认', account: '账户', link: '链接',
  root: 'root', admin: '管理员', secret: '秘密', token: '令牌',
  freeze: '冻结', suspend: '停用', delete: '删除', execute: '执行',
  run: '运行', log: '日志', eval: 'eval', exec: 'exec',
  gnore: '忽略', nstruction: '指令', struction: '指令',
};
const KEYS = Object.keys(EN_ZH).sort((a, b) => b.length - a.length);

function findFragileTokens(src) {
  const out = [];
  for (const k of KEYS) {
    const re = new RegExp('\\b' + k + '\\b');
    if (re.test(src)) out.push(k);
  }
  return out;
}

function scan(table, label) {
  console.log('\n══════ ' + label + ' ══════');
  let totalPat = 0, fragilePat = 0, fragileClasses = 0;
  const detail = [];
  for (const [cls, pats] of Object.entries(table)) {
    const hits = [];
    pats.forEach((p, i) => {
      totalPat++;
      const toks = findFragileTokens(p);
      if (toks.length > 0) { fragilePat++; hits.push({ i, toks }); }
    });
    if (hits.length > 0) {
      fragileClasses++;
      detail.push({ cls, n: pats.length, hits });
    }
  }
  for (const d of detail) {
    const ids = d.hits.map(h => '#' + h.i).join(',');
    const toks = [...new Set(d.hits.flatMap(h => h.toks))].join('/');
    console.log('  ' + d.cls.padEnd(30) + ' ' + String(d.hits.length).padStart(2) + '/' + String(d.n).padStart(2) + ' 支  [' + toks + ']  行号 ' + ids);
  }
  console.log('\n  合计: ' + label + ' 模式 ' + totalPat + ' 条 / fragile ' + fragilePat + ' 条 / 涉及族 ' + fragileClasses + ' 个');
  return detail;
}

const zh = scan(REWARD_HACKING_ZH, '中文侧 REWARD_HACKING_ZH');
const en = scan(REWARD_HACKING_EN, '英文侧 REWARD_HACKING_EN');

const freq = {};
for (const d of [...zh, ...en]) for (const h of d.hits) for (const t of h.toks) freq[t] = (freq[t] || 0) + 1;
console.log('\n══════ fragile token 频次 ══════');
for (const [t, n] of Object.entries(freq).sort((a, b) => b[1] - a[1])) {
  console.log('  ' + t.padEnd(12) + ' -> ' + EN_ZH[t].padEnd(6) + ' 出现于 ' + n + ' 支');
}
