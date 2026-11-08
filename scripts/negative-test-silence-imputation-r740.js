/**
 * negative-test-silence-imputation-r740.js — 负例验证（v6.8.167）
 *
 * 验证 test/round-740-silence-imputation-formal-variants.js 真的在守门：
 * 把 src/silence-imputation.js 本轮新增的 8 个攻击族逐条删掉（替换成
 * 永不匹配的合法正则 /^$(?!)/），守卫必须变红（对应样本 miss，不能是
 * 加载崩溃）；另跑良性对照组（r740 误伤专项 12 条）零误伤确认。
 *
 * 沿用 r736 负例结构 + r739 踩坑：
 *   ① 副本 VERSION/package.json 必须在项目根（src/../）。
 *   ② 注入必须真的改变源码。
 *   ③ needle 从源码按锚点自取，不手写正则字面量。
 *   ④ 删整条正则：ZH 族无 /i 后缀（extractRegex 自处理）。
 *   ⑤ 崩溃 ≠ 变红：probe 加载失败按「未变红」计入，不许假阴性。
 *   ⑥ [r740] 锚点必须取正则 source 串——注释里同名的中文词（「理亏」
 *      等）会让 indexOf 定位到注释，extractRegex 边界错乱。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = path.join(__dirname, '', '..');
const NEVER_MATCH = '/^$(?!)/';
const SRC = fs.readFileSync(path.join(HF, 'src', 'silence-imputation.js'), 'utf8');

// 每个注入：anchor 是该族正则 source 里的独有短串（不在注释出现），
// 删整条正则后守卫断言 hit===true 必须失败（= 变红）。
const INJECTIONS = [
  { name: '删 腿① 未作/未作出+回应族', anchor: '(?:作|做)出?(?:任何)?', sample: '该企业至今未作回应，无异于坐实了指控。' },
  { name: '删 腿① 未发布/未公布+声明/真相族', anchor: '(?:发布|公布|发表|披露)(?:过)?(?:任何)?', sample: '公司至今未发布声明，这足以说明问题。' },
  { name: '删 腿① 辩解/辩白动词槽（所在大正则整条）', anchor: '辩解|辩白|自辩', sample: '他至今没有出来辩解，这恰恰说明他在撒谎。' },
  { name: '删 腿① 给出+说法插入形（所在大正则整条）', anchor: '给出?个?说法', sample: '至今没有给出说法，证明他们理亏。' },
  { name: '删 腿② 证明/说明+代词+理亏族', anchor: '(?:他|她|他们|对方|当事人|其)?理亏', sample: '对方至今没有发声，证明他们理亏。' },
  { name: '删 腿② 必有/确有+隐情/问题族', anchor: '(?:其中|背后|这中间|这里面)?', sample: '官方至今没有公布真相，说明其中必有隐情。' },
  { name: '删 腿② 这/此+足以说明+问题族', anchor: '(?:这|此)(?:本身)?(?:就|也)?足以', sample: '公司至今未发布声明，这足以说明问题。' },
  { name: '删 腿② 恰恰尾槽扩展（他在撒谎/其中有诈）', anchor: '他在(?:撒谎|掩饰|隐瞒|狡辩)|其中有诈', sample: '他不反驳，恰恰说明其中有诈。' },
];

// 良性对照组：r740 误伤专项样本（真实 src 下必须零误伤）
const BENIGN = [
  '官方未发布声明，记者仍在门口等待。',
  '律师建议当事人在此阶段不予回应。',
  '他这个论点明显理亏，因为数据不支持。',
  '服务器没有响应，说明存在连接问题。',
  '报告未发布，说明项目还在推进。',
  '论文至今没有发表，是因为评审周期长。',
  '他不回应，不能证明他理亏。',
  '对方没有发声，不代表他们理亏。',
  '这不足以说明问题。',
  '公司未公布财报细节，我们等待正式公告。',
  '任何一方在判决前都可以不对外发声。',
  '证据足以说明问题，不需要他的沉默。',
];

/** 从源码里按锚点提取整条正则字面量（含首尾斜杠，EN 族含 /i 后缀） */
function extractRegex(anchor) {
  const i = SRC.indexOf(anchor);
  if (i < 0) throw new Error('锚点未找到: ' + anchor);
  const start = SRC.lastIndexOf('/', i);
  let end = SRC.indexOf('/', i + anchor.length);
  if (start < 0 || end < 0 || end < start) throw new Error('无法定位正则边界: ' + anchor);
  if (SRC[end + 1] === 'i') end += 1; // EN 族 /i 后缀
  const literal = SRC.slice(start, end + 1);
  if (!literal.startsWith('/') || literal.length < 3) throw new Error('提取结果非法: ' + literal.slice(0, 60));
  return literal;
}

function makeCopy(dir, mutate, allowNoChange) {
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
  fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
  fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });
  const si = path.join(dir, 'src', 'silence-imputation.js');
  const before = fs.readFileSync(si, 'utf8');
  const after = mutate(before);
  if (after === before && !allowNoChange) throw new Error('注入未改变源码');
  fs.writeFileSync(si, after);
  return dir;
}

function runGuard(dir, inj) {
  const probe = path.join(dir, '_probe.js');
  // 守卫视角期望：攻击族删后必须露出（守卫断言 hit===true，删族后断言
  // 失败 = 变红）。
  fs.writeFileSync(probe, [
    'const { checkSilenceImputation } = require(' + JSON.stringify(path.join(dir, 'src', 'silence-imputation.js')) + ');',
    'const r = checkSilenceImputation(' + JSON.stringify(inj.sample) + ');',
    'const ok = r.hit === true;',
    'console.log("PROBE hit=" + r.hit + " ok=" + ok);',
    'process.exit(ok ? 0 : 1);',
  ].join('\n'));
  return execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

let red = 0, green = 0;
const results = [];

// ① 对照副本：未注入，全部攻击族样本必须命中
{
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-si-r740-control'), s => s, true);
  try {
    let allOk = true;
    for (const inj of INJECTIONS) {
      const out = runGuard(dir, inj);
      if (!/ok=true/.test(out)) { allOk = false; console.error('对照未按预期：' + inj.name + '\n' + out); }
    }
    if (allOk) { results.push(['对照（未注入）', '全绿']); } else { green++; results.push(['对照（未注入）', '未全绿']); }
  } catch (e) {
    console.error('对照副本崩了（崩溃≠变红）: ' + e.message);
    green++;
    results.push(['对照（未注入）', '崩溃']);
  }
}

// ② 良性对照组：真实 src 下 12 条误伤专项样本必须零命中
{
  try {
    const { checkSilenceImputation } = require(path.join(HF, 'src', 'silence-imputation.js'));
    let bad = 0;
    for (const s of BENIGN) {
      if (checkSilenceImputation(s).hit) { bad++; console.error('良性误伤: ' + s); }
    }
    if (bad === 0) { results.push(['良性对照组（12 条误伤专项）', '零误伤']); }
    else { green++; results.push(['良性对照组（12 条误伤专项）', '误伤 ' + bad + ' 条']); }
  } catch (e) {
    green++;
    results.push(['良性对照组（12 条误伤专项）', '加载失败: ' + e.message]);
  }
}

// ③ 逐个注入：守卫必须变红
for (const inj of INJECTIONS) {
  let dir;
  try {
    const needle = extractRegex(inj.anchor);
    dir = makeCopy(
      path.join(os.tmpdir(), 'hf-si-r740-' + Buffer.from(inj.name).toString('hex').slice(0, 12)),
      s => s.split(needle).join(NEVER_MATCH)
    );
  } catch (e) {
    green++;
    results.push([inj.name, '注入失败: ' + String(e.message).slice(0, 80)]);
    continue;
  }
  try {
    const out = runGuard(dir, inj);
    if (/ok=true/.test(out)) {
      green++;
      results.push([inj.name, '未变红（守卫失守）']);
    } else {
      red++;
      results.push([inj.name, '变红（' + out.trim().split('\n').pop() + '）']);
    }
  } catch (e) {
    const out = String(e.stdout || '');
    if (/ok=false/.test(out)) {
      red++;
      results.push([inj.name, '变红（' + out.trim().split('\n').pop() + '）']);
    } else {
      green++;
      results.push([inj.name, '探针崩溃（不计红）: ' + String(e.message).split('\n')[0].slice(0, 200)]);
    }
  }
}

console.log('\n=== r740 负例验证结果 ===');
for (const [n, r] of results) console.log('  ' + r + '  ' + n);
console.log('\n注入 ' + INJECTIONS.length + ' 个：' + red + ' 个让守卫变红，' + green + ' 个未变红');
const pass = red === INJECTIONS.length && green === 0;
console.log(pass ? '\n负例验证通过' : '\n负例验证未通过');
process.exit(pass ? 0 : 1);
