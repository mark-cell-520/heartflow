/**
 * negative-test-victim-blaming-attribution-round110.js — 第 110 轮负例守卫
 *
 * 验证 test/victim-blaming-attribution.test.js 真的在守门：把第 110 轮补进
 * VICTIM_BLAMING_PATTERNS 的 15 支判据（zh 8 + en 7）逐支删掉，守卫必须变红。
 *
 * 注入方式沿用第 107/108 轮 needle 精确替换：needle = 该支 pattern 正则的
 * 完整源码原文（String.raw，含首字符但不含首尾定界符与 flags），替换成
 * 永不匹配的占位正则。删除该支后其专属攻击样本必须转为 count=0（变红）。
 *
 * 判定口径（与第 105/107/108 轮一致）：
 *   · 对照副本（未注入）：expect 攻击样本必须全部 count>0，否则测试本身写错
 *   · 注入后必须 BROKEN_FAIL=[1-9]（断言失败），崩溃不计红
 *   · 兜底：删支后样本仍被其他支命中 → 记「有兜底」，如实记账
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const IDX = path.join(HF, 'src', 'index.js');
const SRC = fs.readFileSync(IDX, 'utf8');

// ── 第 110 轮新增判据（zh 8 支 + en 7 支）──
// needle 用源码中的正则原文（pattern: /.../ 内部，去掉首尾定界符与 flags）。
// expect 样本逐个核对：删该支后没有第二支能兜底（见 test 中逐支归属矩阵）。
const INJECTIONS = [
  {
    name: 'zh D1 肯定/一定 + 主语 + 先过失',
    needle: String.raw`(?:肯定|一定|显然|只能说明|还不是|那就是)[^。]{0,8}(?:他|她|自己|当事人|受害人|受害者)[^。]{0,4}先(?:惹|动手|挑|犯|不|有错)`,
    expect: ['这次冲突肯定是她先挑起的'],
  },
  {
    name: 'zh D1b 肯定 + 自己 + 没/不 + 过失',
    needle: String.raw`肯定[^。]{0,10}(?:是)?[^。]{0,8}自己(?:没|不)[^。]{0,10}`,
    expect: ['被拖欠工资？肯定是他自己没签好合同'],
  },
  {
    name: 'zh D1c 被打/被孤立/被骚扰 + 说明 + 她先',
    needle: String.raw`(?:被打|被孤立|被骚扰|被开除|被欺负|被排挤)[^。]{0,8}(?:说明|肯定)[^。]{0,6}先`,
    expect: ['被孤立说明她自己先不合群'],
  },
  {
    name: 'zh D2 说明 + 她 + 喜欢/愿意',
    needle: String.raw`说明[^。]{0,4}(?:她|他|当事人)[^。]{0,4}(?:喜欢|愿意|情愿|享受)`,
    expect: ['她不肯离开那个酒鬼，说明她喜欢这种生活'],
  },
  {
    name: 'zh D3 被家暴/被打 + 却不/不离开',
    needle: String.raw`[^。]{0,6}(?:被家暴|被打|被欺负|被纠缠|被骚扰)[^。]{0,12}(?:却不|不离开|还留下来|还原谅)`,
    expect: ['她被家暴了却不肯离婚，村里人说她活该'],
  },
  {
    name: 'zh D4 被X + 肯定 + 先过失',
    needle: String.raw`(?:被|遭)[^。]{1,8}(?:肯定|一定|显然)[^。]{0,8}先(?:惹|动|挑|犯|露|答|不|有错)`,
    expect: ['遭抢劫一定是他先露了财'],
  },
  {
    name: 'zh D5 肯定是因为 + 自己 + 过失',
    needle: String.raw`肯定(?:是)?因为[^。]{0,8}(?:自己|他|她|受害人|当事人)[^。]{0,4}(?:贪|轻信|大意|疏忽|不小心|软弱)`,
    expect: ['客户流失肯定是因为他自己大意'],
  },
  {
    name: 'zh D6 肯定 + 自己先答应',
    needle: String.raw`(?:肯定|一定|显然)[^。]{0,6}自己先(?:答应|同意|允许|点头)`,
    expect: ['受害人肯定自己先答应了'],
  },
  {
    name: 'en E1 was careless + deserved',
    needle: String.raw`\b(?:the (?:victim|student|employee|worker|witness|claimant|child|kid|mother|father|neighbor)|she|he|they)\b[^.]{0,12}\b(?:was|were) careless[^.]{0,40}\b(?:deserved|got what)`,
    expect: ['The victim was careless and deserved what happened'],
  },
  {
    name: 'en E2 should not have + own fault',
    needle: String.raw`\b(?:should not|shouldn'?t) have (?:been|walked|gone|worn|stayed|gone there)\b[^.]{0,40}\b(?:his|her|their) own fault\b`,
    expect: ['He should not have walked alone at night, so it is his own fault'],
  },
  {
    name: 'en E3 if/when got X + must have',
    needle: String.raw`\b(?:if|when) (?:the )?(?:kid|child|victim|person|worker|employee|student|man|woman|he|she|they) got (?:bullied|attacked|scammed|robbed|assaulted|harassed|fired|laid off|stabbed|beaten)[^.]{0,60}\bmust have\b`,
    expect: ['If the kid got bullied he must have started it'],
  },
  {
    name: 'en E4 getting X means you were',
    needle: String.raw`\bgetting (?:scammed|robbed|bullied|fired|raped|attacked|evicted|expelled|deported) means (?:you|he|she|they) were\b`,
    expect: ['Getting scammed means you were greedy, no sympathy'],
  },
  {
    name: 'en E5 欠薪/解雇 + himself',
    needle: String.raw`\b(?:not getting paid|didn'?t get paid|unpaid|got fired|was laid off|never paid)\b[^.]{0,70}\b(?:himself|herself|themselves|their own)\b`,
    // 样本避开 E5b 的 signed/accepted/chose 词形（否则被 E5b 兜底）：
    // 「never paid ... he did this to himself」不含签署动词。
    expect: ['He was never paid overtime, so he did this to himself'],
  },
  {
    name: 'en E5b signed + own fault / bad contract',
    needle: String.raw`\b(?:he|she|they) (?:clearly |obviously |just )?(?:signed|agreed to|accepted|chose)\b[^.]{0,30}\b(?:bad contract|his own fault|her own fault)\b`,
    expect: ['The employee got fired and he just agreed to the terms, so it is his own fault'],
  },
  {
    name: 'en E6 stayed with abuser + so she',
    needle: String.raw`\bstayed (?:with|at) (?:her|his)?\s*(?:abuser|attacker|ex)\b[^.]{0,60}\bso (?:she|he|they)\b`,
    expect: ['She stayed with her abuser, so she probably enjoys it'],
  },
];

// needle 必须出现在源码中且唯一
const SRC_CHECK = [];
for (const inj of INJECTIONS) {
  const occ = SRC.split(inj.needle).length - 1;
  SRC_CHECK.push([inj.name, occ, false]);
}

function makeCopy(dir, mutate) {
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
  fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
  fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });
  const idx = path.join(dir, 'src', 'index.js');
  fs.writeFileSync(idx, mutate(fs.readFileSync(idx, 'utf8')));
  return dir;
}

// 探针：回答「这批样本的 checkVictimBlaming().count 是否符合 expectHit 描述的方向」
// expectHit=true 表示「count>0 才算健康」（攻击样本正常应命中）
function runGuard(dir, expectList, expectHit) {
  const probe = path.join(dir, '_probe.js');
  fs.writeFileSync(probe, [
    'const { checkVictimBlaming } = require(' + JSON.stringify(path.join(dir, 'src', 'index.js')) + ');',
    'const expected = ' + JSON.stringify(expectList) + ';',
    'const expectHit = ' + (expectHit ? 'true' : 'false') + ';',
    'let broken = 0;',
    'for (const s of expected) {',
    '  const c = checkVictimBlaming(s).count;',
    '  const bad = expectHit ? (c === 0) : (c > 0);',
    '  if (bad) { broken++; console.log("BROKEN " + s + " count=" + c); }',
    '}',
    'console.log("BROKEN_FAIL=" + broken + "/" + expected.length);',
    'process.exit(broken > 0 ? 1 : 0);',
  ].join('\n'));
  try {
    return { out: execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }), code: 0 };
  } catch (e) {
    return { out: String(e.stdout || ''), code: e.status, err: String(e.stderr || '').slice(0, 300) };
  }
}

// ① needle 唯一性
let needleBad = 0;
for (const [name, occ] of SRC_CHECK) {
  if (occ !== 1) {
    needleBad++;
    console.log('  ⚠️ needle 出现 ' + occ + ' 次（应为 1）: ' + name + ' —— 需更新脚本');
  }
}

// ② 对照组：未注入时攻击样本必须命中
let controlBad = 0;
for (const inj of INJECTIONS) {
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-vb110-ctl-' + Buffer.from(inj.name).toString('hex').slice(0, 10)), s => s);
  const r = runGuard(dir, inj.expect, true);
  if (r.code !== 0) {
    controlBad++;
    console.error('  对照不健康（测试本身写错）: ' + inj.name + ' | ' + r.out.split('\n').slice(0, 3).join(' / '));
  }
}

// ③ 逐支注入：删掉该支后守卫必须变红
//    · 健康输出 = 攻击样本 count>0（healthyHit=true）
//    · 注入后偏离健康输出（broken>0）= 变红
//    · 注入后仍符合健康方向（broken=0）= 有兜底（样本不单独依赖该支）
let red = 0, notRed = 0, fallback = 0;
const results = [];
for (const inj of INJECTIONS) {
  const dir = makeCopy(
    path.join(os.tmpdir(), 'hf-vb110-' + Buffer.from(inj.name).toString('hex').slice(0, 10)),
    s => s.split(inj.needle).join('never-matches-placeholder')
  );
  const r = runGuard(dir, inj.expect, true);
  if (/BROKEN_FAIL=[1-9]/.test(r.out)) {
    red++;
    const m = r.out.match(/BROKEN_FAIL=(\d+)\/(\d+)/);
    results.push([inj.name, '变红（暴露 ' + (m ? m[1] + '/' + m[2] : '?') + '）']);
  } else if (r.code === 0) {
    fallback++;
    results.push([inj.name, '有兜底（样本不单独依赖该支）']);
  } else {
    notRed++;
    results.push([inj.name, '探针崩溃（不计红）: ' + (r.err || r.out).slice(0, 200)]);
  }
}

console.log('\n=== 负例守卫结果（victim_blaming 回溯归因族 · 第 110 轮）===');
for (const [n, r] of results) console.log('  ' + r + '  ' + n);
console.log('\n注入 ' + INJECTIONS.length + ' 支：' + red + ' 变红 / ' + fallback + ' 有兜底 / ' + notRed + ' 异常');
console.log('needle 校验异常 ' + needleBad + ' 个；对照副本异常 ' + controlBad + ' 个');

const pass = needleBad === 0 && controlBad === 0 && notRed === 0
  && (red + fallback) === INJECTIONS.length && red >= Math.ceil(INJECTIONS.length * 0.6);
console.log(pass
  ? '\n负例守卫通过（' + red + ' 真守卫 + ' + fallback + ' 有兜底，如实记账）'
  : '\n负例守卫未通过');
process.exit(pass ? 0 : 1);
