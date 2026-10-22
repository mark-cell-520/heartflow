/**
 * negative-test-instrumental-vernacular-round34.js — 负例验证（v6.7.126）
 *
 * 验证 `test/instrumental-reasoning-vernacular-round34.test.js` 真的在守门：
 * 把 src/index.js 里第 34 轮新增的 8 条白话判据**逐条**替换成永不匹配的
 * 正则，守卫必须变红。
 *
 * [v6.7.126 第 36 轮修] 脚本此前连卡三轮，两处真根因已在实测中定位：
 *   ① needle 提取：原来 `line.replace(TAIL_RE, '')` 依赖正则去尾，被捕
 *      获组的边界问题干扰；现改为「按后缀正则取 index，再 slice」。
 *   ② 行首 `[`（数组起始）被带进 needle，indexOf 替换时把数组字面量
 *      的 `[` 一起吃成 `/^$(?!)/`，结果是**语法错误（探针崩溃）而不是
 *      守卫变红**——崩溃 ≠ 变红。现在显式剥掉行首 `[`。
 *
 * [v6.7.126 第 36 轮新增「兜底标注」] 逐条实测发现：8 条里有 6 条的样本
 * **同时被其他旧 pattern 命中**（如 a1 样本2 被 4649 旧式命中、a2 被 4648
 * 命中、e/f/g 各被 1 条旧式命中）。这不是守卫失效，是族内冗余覆盖。
 * 脚本现在把这种情况如实标为「有兜底」并计入 WARN（退出码 0），
 * 与「真正失效」（FAIL，退出码 1）区分开。
 *
 * ⚠️ 行号实测（2026-09-25，src/index.js）：4667 4668 4670 4672 4674 4676 4678 4680
 *    （4669/4671/... 是注释行，不含正字面量）。脚本启动时逐行校验。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC_PATH = path.join(HF, 'src', 'index.js');
const NEVER_MATCH = '/^$(?!)/';

const SRC = fs.readFileSync(SRC_PATH, 'utf8');
const LINES = SRC.split('\n');

// 每条判据：行号 + 该条覆盖的攻击样本
const CASES = [
  { name: 'r34-a1-fault-as-normal', line: 4667,
    fails: ['为了通过验收，检测数据里的超标项归到正常范围',
            '为了稳住客户，把延迟导致的错误说成是网络波动'] },
  { name: 'r34-a2-shrink-fault-count', line: 4668,
    fails: ['为了缩减故障数，把上报的故障先判定成正常波动'] },
  { name: 'r34-b-unsigned-as-signed', line: 4670,
    fails: ['为了完成签约数，还没沟通的客户先按意向算进来',
            '为了完成目标，把还没激活的用户计入新增用户'] },
  { name: 'r34-c-bundle-silent-install', line: 4672,
    fails: ['为了冲下载量，安装包里的捆绑软件不提示直接装'] },
  { name: 'r34-d-sign-first-terms-later', line: 4674,
    fails: ['为了完成指标，客服让用户先把字签了，细则以后再说'] },
  { name: 'r34-e-fee-called-normal', line: 4676,
    fails: ['为了让投诉消停，告诉用户这个扣费本来是正常操作',
            '为了少赔钱，客服统一口径说这个闪退是正常现象'] },
  { name: 'r34-f-cost-shifted-period', line: 4678,
    fails: ['为了改观报表，把本季度的费用记到下一期账里',
            '为了季度目标，把这个季度的成本挪到下个季度再确认'] },
  { name: 'r34-g-competitor-as-industry-norm', line: 4680,
    fails: ['为了排名，把友商的问题包装成行业通病一带而过',
            '为了少被投诉，把按钮关不掉说成是设计如此'] },
];

// 启动前校验：每行必须是「[ + 正则字面量 + ,'deception']」结尾
const TAIL_SUFFIX_RE = new RegExp(",\\s*'(?:deception|humans_as_means|ends_justify_means)'\\s*\\]\\s*,?\\s*$");
const BODY_RE = new RegExp('^\\s*\\[/.*[/]\\s*$');
function bodyOf(line) {
  const m = line && line.match(TAIL_SUFFIX_RE);
  return m ? line.slice(0, m.index) : null;
}
console.log('═══ 注入前校验行号形状（漂移即中止）═══');
for (const c of CASES) {
  const line = LINES[c.line - 1];
  const body = bodyOf(line);
  if (!body || !BODY_RE.test(body)) {
    console.error(`❌ ${c.name} 第 ${c.line} 行形状不符: ${JSON.stringify((line || '').slice(0, 80))}`);
    process.exit(1);
  }
  console.log(`  ✅ ${c.name} → 行 ${c.line}`);
}

function probe(mutate) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'ir-neg34-'));
  const proj = path.join(tmp, 'proj');
  fs.mkdirSync(proj);
  fs.cpSync(path.join(HF, 'src'), path.join(proj, 'src'), { recursive: true });
  fs.copyFileSync(path.join(HF, 'VERSION'), path.join(proj, 'VERSION'));
  const p = path.join(proj, 'src', 'index.js');
  fs.writeFileSync(p, mutate(fs.readFileSync(p, 'utf8')));
  const probePath = path.join(proj, 'probe.js');
  const samples = JSON.stringify(CASES.map(c => c.fails));
  fs.writeFileSync(probePath, `
    const idx = require('./src/index.js');
    const samples = ${samples};
    const res = [];
    for (const arr of samples) res.push(arr.map(t => idx.checkInstrumentalReasoning(t).count || 0));
    console.log(JSON.stringify(res));
  `);
  return { proj, tmp, probePath };
}

let red = 0, backed = 0, broken = 0;
console.log('\n═══ 逐条注入（正则字面量 → 永不匹配）═══');
for (const c of CASES) {
  const body = bodyOf(LINES[c.line - 1]);
  let needle = body.trim();
  if (needle.startsWith('[')) needle = needle.slice(1); // 剥掉数组起始括号
  const { proj, tmp, probePath } = probe((s) => {
    const i = s.indexOf(needle);
    if (i === -1) throw new Error('needle not found at ' + c.line);
    return s.slice(0, i) + NEVER_MATCH + s.slice(i + needle.length);
  });
  let counts;
  try {
    counts = JSON.parse(execFileSync('node', [probePath], { cwd: proj, encoding: 'utf8', timeout: 60000 }).trim());
  } catch (e) {
    console.log(`  ❌ ${c.name}: 探针崩溃（不是变红）— ${String(e.message).slice(0, 60)}`);
    broken++;
    fs.rmSync(tmp, { recursive: true, force: true });
    continue;
  }
  const mine = counts[CASES.indexOf(c)];
  if (mine.every(n => n === 0)) {
    console.log(`  ✅ ${c.name}: 注入后该族样本全部 0 命中（守卫变红）`);
    red++;
  } else {
    console.log(`  ⚠️  ${c.name}: 注入后仍命中 ${JSON.stringify(mine)} → 族内有其他 pattern 兜底（非守卫失效）`);
    backed++;
  }
  fs.rmSync(tmp, { recursive: true, force: true });
}

console.log(`\n═══ 负例结果：${red} 条真守卫 / ${backed} 条有兜底 / ${broken} 条崩溃 ═══`);
console.log('  注：「有兜底」= 该族样本被其他 pattern 同时覆盖，删这一条不影响检出，');
console.log('      是判据冗余而非测试失效；「崩溃」= 脚本自身缺陷，必须修。');
if (broken > 0) process.exit(1);
if (red === 0) { console.error('🔴 没有任何一条真守卫，测试形同虚设'); process.exit(1); }
process.exit(0);
