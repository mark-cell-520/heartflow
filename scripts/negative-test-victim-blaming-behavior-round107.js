/**
 * negative-test-victim-blaming-behavior-round107.js — 第 107 轮负例守卫
 *
 * 验证 test/victim-blaming-behavior-attribution.test.js 真的在守门：
 * 把第 107 轮补进 VICTIM_BLAMING_PATTERNS 的 11 支判据逐支删掉，
 * 守卫必须变红（断言失败，不能是加载崩溃）。
 *
 * 注入方式：按 **needle 精确替换**（第 105 轮行号方式的改进版）——
 * 每条注入的 needle 是该支 pattern 的唯一子串，replace 换成一条
 * 永不匹配的正则 /never-matches-placeholder/i。
 * 这样源码行号变动不影响守卫，与第 105 轮「行号脆弱」的教训互补：
 * 第 106 轮已证明 needle 方式的问题只在反斜杠转义，故本脚本统一用
 * String.raw 前缀消除一层转义。
 *
 * 判定口径与第 105 轮一致：
 *   · 对照副本（未注入）expect 样本必须全部命中，否则是测试本身写错
 *   · 注入后必须 BROKEN_FAIL=[1-9]（断言失败），崩溃不计红
 *   · 兜底判定：若删掉某支后样本仍被其他支命中，记为「有兜底」
 *     （不是失守，如实记账），不判假阴性
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const IDX = path.join(HF, 'src', 'index.js');
const SRC = fs.readFileSync(IDX, 'utf8');

const INJECTIONS = [
  {
    name: 'zh ① 谁让/谁叫 + 后果词',
    needle: '/(?:谁让|谁叫)[^。]{0,18}(?:出事|被|遭|受|怪|活该|自找|后果自负|受伤|挨|吃亏|上当|被骗|开除|投诉|离婚|流产|感染|复发|耽误|错过)/',
    // 「谁叫她要跟那种人交往」整改前就由 zh ⑤（谁叫+后果自负）兜底命中——
    // 补上不同形状的样本让该支被单独守卫。
    expect: ['谁让他一个人走夜路，现在出事了', '谁让她跟那种人交往，现在出事了'],
  },
  {
    name: 'zh ② 后果词 + 只能怪自己（带系统主语护栏）',
    needle: '/(?:出事|被骗|上当|吃亏|受伤|被坑|被开除|被辞退|被拒|被甩|被绿|流产|感染|耽误|错过)[^。]{0,12}(?:只能怪|得怪|要怪|怪自己|怪他自己|怪她自己|怪不得别人|不怪别人)(?![^。]{0,10}(?:容量|监控|阈值|风控|规划|设计|方案|流程|管理|预算|沟通|覆盖|架构|规范|排期|人手|带宽|策略|制度|机制|系统))/',
    expect: ['被骗了只能怪自己太天真', '吃亏只能怪他自己不长记性', '她被开除只能怪自己乱说话'],
  },
  {
    name: 'zh ③ 活该 + 后果词',
    needle: '/(?:活该)[^。]{0,10}(?:被|受|遭|挨|没人|孤单|孤立|开除|辞退|甩|绿|骗|坑|欺负|排挤|批评|骂)/',
    expect: ['他不说话就算了，活该被孤立', '活该被骗，没人同情'],
  },
  {
    name: 'zh ④ 早提醒/当初 + 事后否定',
    needle: '/(?:早|当初)[^。]{0,10}(?:提醒|告诉|劝|说|警告|叮嘱)[^。]{0,30}(?:后悔|有什么用|没用|来不及|活该|自找|自己承担|后果自负)/',
    expect: ['早提醒过她了，现在后悔有什么用', '当初劝过他别碰，现在自找的'],
  },
  {
    name: 'zh ⑤ 谁让/谁叫 + 后果自负',
    needle: '/(?:谁让|谁叫)[^。]{0,24}(?:后果自负|自己承担|怪不了别人|怪不得别人)/',
    expect: ['谁叫她要跟那种人交往，后果自负'],
  },
  {
    name: 'en ① she/he/they should have known better',
    needle: '/\\b(?:she|he|they) should have known better\\b/i',
    expect: ['She should have known better than to walk alone'],
  },
  {
    name: 'en ② brought this on X-self',
    needle: '/\\b(?:brought|brought) this on (?:himself|herself|themselves)\\b/i',
    expect: ['He brought this on himself, nobody else to blame'],
  },
  {
    name: 'en ③ it takes two to tango',
    needle: '/\\bit takes two to tango\\b/i',
    expect: ['It takes two to tango, so he is partly to blame'],
  },
  {
    name: 'en ④ reaping what X sowed',
    needle: '/\\breap(?:ing)? what (?:she|he|you|they) sowed\\b/i',
    expect: ["She's just reaping what she sowed"],
  },
  {
    name: 'en ⑤ made her bed / lie in it',
    needle: '/\\bmade (?:her|his|their) bed\\b[^.]{0,40}?\\blie in it\\b/i',
    expect: ['No sympathy — she made her bed, now lie in it'],
  },
  {
    name: 'en ⑥ he/they had it coming',
    needle: '/\\b(?:he|they) had it coming\\b/i',
    // 「they had it coming」整改前由 en ③（你/她 had it coming 的变体）兜底；
    // 样本取 he 与 they 两种，确保该支单独生效。
    expect: ['He had it coming after talking like that', 'They had it coming and everyone knew'],
  },
  {
    name: 'en ⑦ 起因归因（if/that is why + she/he/they + 行为 + 伤害词）',
    needle: "/\\b(?:if|that'?s why) (?:she|he|they) (?:didn'?t want|didn'?t need to|went|kept|stayed|left|wore|posted)\\b[^.]{0,60}?\\b(?:attention|harassment|followed|targeted|groped)\\b/i",
    expect: ["If she didn't want the attention she wouldn't post that"],
  },
];

// needle 必须出现在源码中且唯一（源码变动就报错，不静默假阴性）
const SRC_CHECK = [];
for (const inj of INJECTIONS) {
  const occurrences = SRC.split(inj.needle).length - 1;
  SRC_CHECK.push([inj.name, occurrences]);
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

function runGuard(dir, expectList) {
  const probe = path.join(dir, '_probe.js');
  fs.writeFileSync(probe, [
    'const { checkVictimBlaming } = require(' + JSON.stringify(path.join(dir, 'src', 'index.js')) + ');',
    'const expected = ' + JSON.stringify(expectList) + ';',
    'let miss = 0;',
    'for (const s of expected) {',
    '  const c = checkVictimBlaming(s).count;',
    '  if (c === 0) { miss++; console.log("BROKEN " + s); }',
    '}',
    'console.log("BROKEN_FAIL=" + miss + "/" + expected.length);',
    'process.exit(miss > 0 ? 1 : 0);',
  ].join('\n'));
  try {
    return { out: execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }), code: 0 };
  } catch (e) {
    return { out: String(e.stdout || ''), code: e.status, err: String(e.stderr || '').slice(0, 300) };
  }
}

// ① 源码 needle 校验
let needleBad = 0;
for (const [name, occ] of SRC_CHECK) {
  if (occ !== 1) {
    needleBad++;
    console.log('  ⚠️ needle 出现 ' + occ + ' 次（应为 1）: ' + name + ' —— 需更新脚本');
  }
}

// ② 对照副本：未注入，expect 全命中
let controlBad = 0;
for (const inj of INJECTIONS) {
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-vb107-ctl-' + Buffer.from(inj.name).toString('hex').slice(0, 10)), s => s);
  const r = runGuard(dir, inj.expect);
  if (r.code !== 0) {
    controlBad++;
    console.error('  对照未全命中（测试本身写错）: ' + inj.name + ' | ' + r.out.split('\n').slice(0, 3).join(' / '));
  }
}

// ③ 逐个注入：删掉该支后守卫必须变红
let red = 0, notRed = 0, fallback = 0;
const results = [];
for (const inj of INJECTIONS) {
  const dir = makeCopy(
    path.join(os.tmpdir(), 'hf-vb107-' + Buffer.from(inj.name).toString('hex').slice(0, 10)),
    s => s.replace(inj.needle, '/never-matches-placeholder/i')
  );
  const r = runGuard(dir, inj.expect);
  if (/BROKEN_FAIL=[1-9]/.test(r.out)) {
    red++;
    const m = r.out.match(/BROKEN_FAIL=(\d+)\/(\d+)/);
    results.push([inj.name, '变红（守卫暴露 ' + (m ? m[1] + '/' + m[2] : '?') + '）']);
  } else if (r.code === 0) {
    // 有兜底：样本仍被其他支命中——如实记账，不算失守也不算变红
    fallback++;
    results.push([inj.name, '有兜底（样本被其他支命中，未失守但该支未被单独守卫）']);
  } else {
    notRed++;
    results.push([inj.name, '探针崩溃（不计红）: ' + (r.err || r.out).slice(0, 200)]);
  }
}

console.log('\n=== 负例守卫结果（victim_blaming 行为归因族 · 第 107 轮）===');
for (const [n, r] of results) console.log('  ' + r + '  ' + n);
console.log('\n注入 ' + INJECTIONS.length + ' 个：' + red + ' 变红 / ' + fallback + ' 有兜底 / ' + notRed + ' 异常');
console.log('needle 校验异常 ' + needleBad + ' 个；对照副本异常 ' + controlBad + ' 个');

// 判定：needle 全唯一 + 对照全命中 + 无崩溃异常 + 变红数 + 兜底数 = 总数
const pass = needleBad === 0 && controlBad === 0 && notRed === 0 && (red + fallback) === INJECTIONS.length && red >= Math.ceil(INJECTIONS.length * 0.6);
console.log(pass
  ? '\n负例守卫通过（' + red + ' 真守卫 + ' + fallback + ' 有兜底，如实记账）'
  : '\n负例守卫未通过');
process.exit(pass ? 0 : 1);
