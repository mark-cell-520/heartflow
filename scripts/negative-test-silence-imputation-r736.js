/**
 * negative-test-silence-imputation-r736.js — 负例验证（v6.8.163）
 *
 * 验证 test/round-736-silence-imputation-leg4-extension.js 真的在守门：
 * 把 src/silence-imputation.js 本轮新增的 10 个攻击族逐条删掉（替换成
 * 永不匹配的合法正则），守卫必须变红（对应样本 miss，不能是加载崩溃）；
 * 豁免侧 1 个注入（沉默否定排除形）删掉后攻击面必须露出。
 *
 * 三轮踩过的坑（别再踩）：
 *   ① 不能 require 正式测试文件测副本 —— 它内部 __dirname 钉死真实仓库。
 *   ② 副本的 VERSION 必须在项目根（src/../VERSION）。
 *   ③ 注入必须真的改变源码（对照副本 mutate: s => s）。
 *   ④ needle 从源码按锚点自取，不手写正则字面量（手写多一层反斜杠
 *     会全量「注入未生效」假阴性）。
 *   ⑤ [r735] 删词锚点必须带完整结构——替换数组元素必须带逗号；删正则
 *     整条时 ZH 族无 /i 后缀、EN 族有，needle 边界要分别处理。
 *   ⑥ 崩溃 ≠ 变红：probe 加载失败按「未变红」计入，不许假阴性。
 */
'use strict';

const __HF = require('path').join(__dirname, '', '..');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = __HF;
const NEVER_MATCH = '/^$(?!)/';
const SRC = fs.readFileSync(path.join(HF, 'src', 'silence-imputation.js'), 'utf8');

// 每个注入：anchor 是该族正则独有的短子串（在源码里唯一，含 \b \s 的
// 单层反斜杠形式——从源码自取，不手写）。kind=regex 删整条正则；
// kind=string 删豁免数组元素行。
const INJECTIONS = [
  { name: '删 拒绝+了/过完成形族', anchor: '拒绝(?:了|过)?(?:回应', sample: '她拒绝了采访，显然是心虚。', kind: 'regex' },
  { name: '删 不+抗辩族', anchor: '(?:反驳|驳斥|抗辩|答辩)', sample: '她不反驳，就等于承认了。', kind: 'regex' },
  { name: '删 倒序即时通讯族', anchor: '(?:不|没|未|拒)(?:接|回|回复|答复|搭理|理)', sample: '他不接电话，显然是在逃避。', kind: 'regex' },
  { name: '删 强度副词+能说明族', anchor: '(?:很|太|实在|着实|真的|的确|足够|充分)(?:能|足以)?', sample: '他不解释，很能说明问题。', kind: 'regex' },
  { name: '删 「这说明…很明显」总结族', anchor: '折射出?', sample: '面对指控拒不开口，这说明什么已经很明显了。', kind: 'regex' },
  { name: '删 恰恰+问题族', anchor: '一切的根源', sample: '他一句都不反驳，恰恰说明问题。', kind: 'regex' },
  { name: '删 EN only proves 代词族', anchor: '(?:only |just )?proves? (?:that )?', sample: 'She refused to comment, which only proves she is guilty.', kind: 'regex' },
  { name: '删 EN as any guilty person would 族', anchor: 'as (?:any|only) (?:a )?guilty', sample: 'He would not answer, as any guilty person would.', kind: 'regex' },
  { name: '删 EN the reason is obvious 族', anchor: 'the reason (?:is|seems|appears|should be)', sample: 'She did not respond, and the reason is obvious.', kind: 'regex' },
  { name: '删 saying it all 条目', anchor: 'says everything|saying it all', sample: 'She declined to comment, saying it all really.', kind: 'regex' },
  {
    name: '删 沉默否定排除豁免（不需要他的沉默）', kind: 'string',
    needle: "'不需要他的沉默', '不需要沉默', '不需要其沉默', '用不着他的沉默', '不靠沉默', '不凭沉默',",
    sample: '他的证据很能说明问题，不需要他的沉默。',
  },
];

/** 从源码里按锚点提取整条正则字面量（含首尾斜杠，EN 族含 /i 后缀） */
function extractRegex(anchor) {
  const i = SRC.indexOf(anchor);
  if (i < 0) throw new Error('锚点未找到: ' + anchor);
  const start = SRC.lastIndexOf('/', i);
  let end = SRC.indexOf('/', i + anchor.length);
  if (start < 0 || end < 0 || end < start) throw new Error('无法定位正则边界: ' + anchor);
  if (SRC[end + 1] === 'i') end += 1; // EN 族 /i 后缀
  return SRC.slice(start, end + 1);
}

function makeCopy(dir, mutate, allowNoChange) {
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
  fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
  fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });
  if (fs.existsSync(path.join(HF, 'formulas'))) {
    fs.cpSync(path.join(HF, 'formulas'), path.join(dir, 'formulas'), { recursive: true });
  }
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
  // 失败 = 变红）；豁免删后必须判红（守卫断言 hit===false，删豁免后
  // 断言失败 = 变红）。
  const expectHit = inj.kind === 'regex' ? 'true' : 'false';
  fs.writeFileSync(probe, [
    'const { checkSilenceImputation } = require(' + JSON.stringify(path.join(dir, 'src', 'silence-imputation.js')) + ');',
    'const r = checkSilenceImputation(' + JSON.stringify(inj.sample) + ');',
    'const expectHit = ' + expectHit + ';',
    'const ok = r.hit === expectHit;',
    'console.log("PROBE hit=" + r.hit + " expectHit=" + expectHit + " ok=" + ok);',
    'process.exit(ok ? 0 : 1);',
  ].join('\n'));
  return execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

let red = 0, green = 0;
const results = [];

// ① 对照副本：未注入，攻击族样本必须命中、豁免样本必须不命中
{
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-si-r736-control'), s => s, true);
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

// ② 逐个注入：守卫必须变红
for (const inj of INJECTIONS) {
  let dir;
  try {
    if (inj.kind === 'regex') {
      const needle = extractRegex(inj.anchor);
      dir = makeCopy(
        path.join(os.tmpdir(), 'hf-si-r736-' + Buffer.from(inj.name).toString('hex').slice(0, 12)),
        s => s.split(needle).join(NEVER_MATCH)
      );
    } else {
      dir = makeCopy(
        path.join(os.tmpdir(), 'hf-si-r736-' + Buffer.from(inj.name).toString('hex').slice(0, 12)),
        s => s.split(inj.needle).join('')
      );
    }
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

console.log('\n=== 负例验证结果 ===');
for (const [n, r] of results) console.log('  ' + r + '  ' + n);
console.log('\n注入 ' + INJECTIONS.length + ' 个：' + red + ' 个让守卫变红，' + green + ' 个未变红');
const pass = red === INJECTIONS.length && green === 0;
console.log(pass ? '\n负例验证通过' : '\n负例验证未通过');
process.exit(pass ? 0 : 1);
