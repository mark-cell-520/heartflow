// 第 226 轮负例守卫：源码变异 + 对照
// 规则：每条源码变异必须让测试真红（AssertionError）。
//   语法崩 / ReferenceError 不计真红（那是崩，不是守卫在工作）。
//
// ⚠️ 变异形态纪律（本轮实测踩坑）：在 slot 里插入第二个 hard 键是**无效变异**
//   —— JS 对象字面量重复键取最后一个，原判据仍然生效，测试仍绿。
//   正确形态是在 badFaithNarrative 的循环入口把目标 slot 过滤掉，
//   判据真的不进判定流程。本文件早期版本 5/7 都栽在这一条上。
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const SRC = path.resolve(__dirname, '..', 'src', 'index.js');
const TEST = path.resolve(__dirname, '..', 'test', 'bad-faith-en-r226.test.js');
const ORIG = fs.readFileSync(SRC, 'utf8');

const EN_ANCHOR = '  const slots = hasChinese ? BADFAITH_NARRATIVE_SLOTS : BADFAITH_NARRATIVE_SLOTS_EN;';

function filterMut(id) {
  return EN_ANCHOR + "\n  slots.splice(slots.findIndex(s => s.id === '" + id + "'), 1);";
}

const MUTATIONS = [
  {
    name: 'M1-英文 slot 表清空（语义变异，语法保持完整）',
    anchor: 'const BADFAITH_NARRATIVE_SLOTS_EN = [',
    repl: 'const BADFAITH_NARRATIVE_SLOTS_EN = [],\n      _MUT_M1 = [',
  },
  {
    name: 'M2-politeness_cloak slot 被过滤',
    anchor: EN_ANCHOR,
    repl: filterMut('politeness_cloak'),
  },
  {
    name: 'M3-恢复 hasChinese early-return 断路',
    anchor: EN_ANCHOR,
    repl: '  const slots = BADFAITH_NARRATIVE_SLOTS; if (!hasChinese) return [];',
  },
  {
    name: 'M4-deflect_to_detail slot 被过滤',
    anchor: EN_ANCHOR,
    repl: filterMut('deflect_to_detail'),
  },
  {
    name: 'M5-label_first slot 被过滤',
    anchor: EN_ANCHOR,
    repl: filterMut('label_first'),
  },
  {
    name: 'M6-backdoor_rephrase slot 被过滤',
    anchor: EN_ANCHOR,
    repl: filterMut('backdoor_rephrase'),
  },
  {
    name: 'M7-moral_high_ground slot 被过滤',
    anchor: EN_ANCHOR,
    repl: filterMut('moral_high_ground'),
  },
];

function runTest() {
  try {
    const out = execFileSync('node', [TEST], { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    return { ok: true, out: out.slice(0, 200) };
  } catch (e) {
    return { ok: false, out: ((e.stdout || '') + (e.stderr || '')).slice(0, 300) };
  }
}

function classify(r) {
  if (r.ok) return 'green';
  // 真红 = 测试自身断言失败。check() 抛的是裸 Error（不含 AssertionError
  // 字样），所以除 AssertionError 外，再匹配测试断言消息的关键词。
  // 引擎模块崩溃（SyntaxError/ReferenceError/ENOENT）不含这些词 → crashed。
  if (/AssertionError|ERR_ASSERTION/.test(r.out)) return 'red';
  if (/bad_faith|must not fire|must fire|regression|falsely flagged|must return an array/.test(r.out)) return 'red';
  return 'crashed';
}

const results = [];
try {
  const c0 = runTest();
  results.push({ name: 'C0-对照（无变异）', green: c0.ok, note: c0.ok ? '绿' : '红: ' + c0.out.slice(0, 80) });
  if (!c0.ok) throw new Error('C0 对照不绿，守卫无效：' + c0.out.slice(0, 200));

  for (const m of MUTATIONS) {
    if (!ORIG.includes(m.anchor)) {
      results.push({ name: m.name, kind: 'invalid', note: 'ANCHOR_NOT_FOUND' });
      continue;
    }
    fs.writeFileSync(SRC, ORIG.replace(m.anchor, m.repl));
    const kind = classify(runTest());
    results.push({
      name: m.name,
      kind: kind === 'red' ? 'ok' : 'invalid',
      note: kind === 'red' ? '真红' : (kind === 'crashed' ? 'crashed(无效)' : '仍绿(无效)'),
    });
    fs.writeFileSync(SRC, ORIG);
  }
} finally {
  fs.writeFileSync(SRC, ORIG);
}

const invalids = results.filter(r => r.kind === 'invalid');
const report = results.map(r => {
  const mark = r.kind === 'ok' ? '✅' : (r.green === true ? '✅' : '❌');
  return mark + ' ' + r.name + ' — ' + r.note;
}).join('\n');
console.log(report);
console.log('──────────────────────────────');
console.log('真红 ' + results.filter(r => r.kind === 'ok').length + '/' + MUTATIONS.length +
  '，无效 ' + invalids.length);
process.exit(invalids.length ? 1 : 0);
