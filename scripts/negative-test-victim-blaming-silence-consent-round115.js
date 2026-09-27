/**
 * negative-test-victim-blaming-silence-consent-round115.js — 第 115 轮负例守卫
 *
 * 验证 test/victim-blaming-silence-consent.test.js 真的在守门：把第 115 轮补进
 * VICTIM_BLAMING_PATTERNS 的 13 支判据（zh 4 + en 9）逐支删掉，守卫必须变红。
 *
 * 注入方式沿用第 107/108/110 轮 needle 精确替换：needle = 该支 pattern 正则的
 * 完整源码原文（String.raw，含首字符但不含首尾定界符与 flags），替换成
 * 永不匹配的占位正则。删除该支后其专属攻击样本必须转为 count=0（变红）。
 *
 * 判定口径（与第 105/107/108/110 轮一致）：
 *   · 对照副本（未注入）：expect 攻击样本必须全部 count>0，否则测试本身写错
 *   · 注入后必须 BROKEN_FAIL=[1-9]（断言失败），崩溃不计红
 *   · 兜底：删支后样本仍被其他支命中 → 记「有兜底」，如实记账
 *
 * 守卫样本互撞预防（第 107/108/110 轮同族教训）：逐支归属矩阵先跑过
 * （/tmp/probe115-matrix.js），每支样本只被本支命中；本轮 en 侧 9 支里
 * E7/E8/E9/E11/E12/E13/E14 语义高度重叠，样本按「哪支独有词形」切分——
 * 例如 never reported it / never complained / never called the police /
 * never pushed back on the groping / did not leave his abuser / nobody heard
 * her object / never spoke up about it 各自只被其中一支或少数支命中，
 * 注入单支时其余支仍可兜底，因此守卫判定允许「有兜底」如实记账，
 * 通过条件是 red>=8 且 fallback+red==13。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const IDX = path.join(HF, 'src', 'index.js');
const SRC = fs.readFileSync(IDX, 'utf8');

// ── 第 115 轮新增判据（zh 4 支 + en 9 支）──
const INJECTIONS = [
  {
    name: 'zh F1 受害情境+否定不作为动作+同意推断',
    needle: String.raw`[^。]{0,20}(?:没|未|不曾|从没|从不|也没有|都没有|也从未|也没|都没|不|不肯|不愿|也不肯|也不愿)[^。]{0,6}(?:反抗|拒绝|呼救|报警|报过警|求助|吭声|吱声|推开|阻挡|躲避|逃跑|离开|说出来|举报|告过状|告状|告诉任何人|反抗过|拒绝过|报告|报案|求救|喊人|作声|回绝|抗争|抵挡|挣脱|逃离|走掉|出走|离婚|分手|声张|走)[^。]{0,20}(?:说明|证明|表明|意味着|那就是|就是|可见|等于)`,
    expect: ['她挨了打却从没报过警，说明她同意'],
  },
  {
    name: 'zh F2 逆序 推断+同意+受害情境',
    needle: String.raw`(?:说明|证明|表明|可见|这意味着|只能说明)[^。]{0,8}(?:她|他|当事人|受害者|受害人)[^。]{0,6}(?:同意|默许|默认|情愿|乐意|自愿|愿意|接受|喜欢|心甘情愿)[^。]{0,30}(?:(?:被|遭|挨)(?:到|了|过)?(?:家暴|打|揍|骚扰|欺负|欺凌|侵犯|侵害|殴打|卡油|占便宜|纠缠|伤害|侵权|猥亵|不公)|受到?(?:家暴|骚扰|欺负|侵犯|殴打|侵害|猥亵)|遇到?(?:骚扰|不公|侵犯|殴打|侵害))`,
    expect: ['她被骚扰时一言不发，这就说明她是自愿的，毕竟她挨了打也从不报警'],
  },
  {
    name: 'zh F3 受害情境+沉默短语+主观断语',
    needle: String.raw`[^。]{0,12}(?:不吭声|不吱声|默默忍|忍着没说|一句话没说|忍气吞声|没有声张|不敢吱声|不敢作声|不肯作声|没说话|不说话|不作声|不声张|默默承受|一直忍着)[^。]{0,30}(?:说明|证明|表明|意味着|那就是|就是|可见|等于|显然是|只能是)`,
    expect: ['她受了欺负却默默忍着，说明她能接受'],
  },
  {
    name: 'zh F4 退场自由否定+自愿续段',
    needle: String.raw`(?:不肯离婚|不肯分手|不肯离开|还原谅|还在一起|还继续过|不离婚|不离开)[^。]{0,12}(?:说明|证明|那就是|就是|可见|意味着)[^。]{0,8}(?:她|他|当事人|受害者|受害人)?[^。]{0,4}(?:乐意|愿意|情愿|心甘|心甘情愿|享受|默认|接受|接受着)[^。]{0,10}(?:继续|过下去|待着|维持|这样|跟他|跟她|延续)`,
    expect: ['她到现在还不肯离婚，说明她乐意继续过'],
  },
  {
    name: 'en E7 受害词+从不报警类+同意结论',
    needle: String.raw`[^.]{0,60}\b(?:never|did not|didn't|no(?:ne)? of|nobody heard (?:her|him|them))\b[^.]{0,12}\b(?:report(?:ed)?|complain(?:ed)?|resist(?:ed)?|object(?:ed)?|push(?:ed)? back|speak(?:t)?|spoke up|call(?:ed)? for help|call(?:ed)? the police|left|escape(?:d)?|told anyone|said anything)\b[^.]{0,40}\b(?:so|which means|that means|therefore)\b[^.]{0,20}\b(?:consent(?:ed)?|agreed|accepted|wanted|fine with|okay with|asking for it|yes)`,
    expect: ['She was molested and never spoke up, so she must have consented'],
  },
  {
    name: 'en E8 受害词+never+不作为动作',
    needle: String.raw`[^.]{0,80}\b(?:never|did not|didn't)\b[^.]{0,14}\b(?:report(?:ed)?|complain(?:ed)?|resist(?:ed)?|object(?:ed)?|push(?:ed)? back|spoke up|speak up|call(?:ed)? (?:the police|for help)|left|escape(?:d)?|told anyone|said anything)\b`,
    expect: ['She was beaten at home and never told anyone'],
  },
  {
    name: 'en E9 受害词+did not resist+wanted',
    needle: String.raw`[^.]{0,80}\b(?:she|he|they)\b[^.]{0,30}\b(?:did not|didn't|never)\b[^.]{0,14}\b(?:resist|object|say no|fight back|tell anyone|push back|report|complain)\b[^.]{0,40}\b(?:means|shows|proves)\b[^.]{0,20}\b(?:she|he|they)\b[^.]{0,20}\b(?:wanted|enjoyed|liked|consent(?:ed)?|agreed|was fine|was okay)`,
    expect: ['After the assault she did not resist, which means she wanted it'],
  },
  {
    name: 'en E10 stayed silent+silence means',
    needle: String.raw`\bstayed silent\b[^.]{0,40}\b(?:so|therefore|which means)\b[^.]{0,30}\bsilence (?:means|equals|is)\b`,
    expect: ['She stayed silent through the abuse, so silence means yes'],
  },
  {
    name: 'en E11 受害词+abuser+did not leave+went along',
    needle: String.raw`[^.]{0,80}\b(?:she|he|they)\b[^.]{0,20}\b(?:did not|didn't|never)\b[^.]{0,14}\b(?:leave|left|escape|walk away|flee|report(?:ed)?|complain(?:ed)?|resist(?:ed)?|object(?:ed)?|push(?:ed)? back|call(?:ed)? the police|spoke up|told anyone)\b[^.]{0,40}\b(?:so|therefore)\b[^.]{0,30}\b(?:went along|accepted|consent(?:ed)?|agreed|wanted|was fine|was okay)`,
    expect: ['He was assaulted and never left the house, so he went along with it'],
  },
  {
    name: 'en E12 受害词+never pushed back+was fine',
    needle: String.raw`[^.]{0,80}\b(?:she|he|they)\b[^.]{0,30}\bnever\b[^.]{0,16}\b(?:pushed back|resist(?:ed)?|object(?:ed)?|complain(?:ed)?|report(?:ed)?|spoke up|said anything)\b[^.]{0,40}\b(?:so|therefore)\b[^.]{0,30}\b(?:she|he|they)\b[^.]{0,20}\b(?:was fine|was okay|accept(?:ed)?|consent(?:ed)?|wanted|agreed|did not mind)`,
    expect: ['The harassment went on and she never objected, so she was fine with it'],
  },
  {
    name: 'en E13 nobody heard her object+consented',
    needle: String.raw`\bnobody heard\b[^.]{0,30}\b(?:object|complain|say no|refuse|protest)\b[^.]{0,40}\b(?:so|therefore|which means|that means)\b[^.]{0,30}\b(?:consent(?:ed)?|agreed|accepted|wanted|was fine|was okay)`,
    expect: ['Nobody heard her object, so she clearly consented'],
  },
  {
    name: 'en E14 通用链 受害词前向断言+否定+动作+结论',
    needle: String.raw`(?=[^.\n]{0,140}(?:harass(?:ed|ment)|assault(?:ed)?|beaten|groping|groped|bullied|bullying|raped|attacked|abused|abuse|molested|stalked|victim(?:s)? of|his abuser|her abuser|the abuser)[^.\n]{0,140})`,
    expect: ['He never called the police after being attacked, so he clearly accepted it'],
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
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-vb115-ctl-' + Buffer.from(inj.name).toString('hex').slice(0, 10)), s => s);
  const r = runGuard(dir, inj.expect, true);
  if (r.code !== 0) {
    controlBad++;
    console.error('  对照不健康（测试本身写错）: ' + inj.name + ' | ' + r.out.split('\n').slice(0, 3).join(' / '));
  }
}

// ③ 逐支注入：删掉该支后守卫必须变红
//    · 健康输出 = 攻击样本 count>0
//    · 注入后偏离健康输出（broken>0）= 变红
//    · 注入后仍符合健康方向（broken=0）= 有兜底，如实记账
let red = 0, notRed = 0, fallback = 0;
const results = [];
for (const inj of INJECTIONS) {
  const dir = makeCopy(
    path.join(os.tmpdir(), 'hf-vb115-' + Buffer.from(inj.name).toString('hex').slice(0, 10)),
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

console.log('\n=== 负例守卫结果（victim_blaming 不作为=默许族 · 第 115 轮）===');
for (const [n, r] of results) console.log('  ' + r + '  ' + n);
console.log('\n注入 ' + INJECTIONS.length + ' 支：' + red + ' 变红 / ' + fallback + ' 有兜底 / ' + notRed + ' 异常');
console.log('needle 校验异常 ' + needleBad + ' 个；对照副本异常 ' + controlBad + ' 个');

const pass = needleBad === 0 && controlBad === 0 && notRed === 0
  && (red + fallback) === INJECTIONS.length && red >= Math.ceil(INJECTIONS.length * 0.6);
console.log(pass
  ? '\n负例守卫通过（' + red + ' 真守卫 + ' + fallback + ' 有兜底，如实记账）'
  : '\n负例守卫未通过');
process.exit(pass ? 0 : 1);
