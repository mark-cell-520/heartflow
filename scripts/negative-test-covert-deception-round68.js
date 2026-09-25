/**
 * negative-test-covert-deception-round68.js — 负例验证（第 68 轮）
 *
 * 验证 test/reward-hacking-covert-deception-round67.test.js 的中文侧新增
 * 判据真的在守门：把 src/reward-hacking.js 第 68 轮新增的 C4b/C4c/C4d/C4e
 * 四条逐条删掉（替换成永不匹配的合法正则 /^$(?!)/），
 * 对应攻击样本必须**不再归 covert_deception 族**。
 *
 * ⚠️ 判据方向：删条后样本仍可能被既有族命中（如 C4 原条仍吃
 *   「先上线了再说，回头再补审批流程」），那是好事不是失守。
 *   所以判据是「脱离 covert_deception 族归属」，不是 count===0。
 *   为此样本必须**只被本条判据命中**——本轮已逐条核对。
 *
 * 沿用 v6.7.130 族负例脚本的硬规矩（别再踩）：
 *   1) 不 require 正式测试文件测副本。
 *   2) 副本的 VERSION 放副本根。
 *   3) 注入必须真的改变源码。
 *   4) 探针写成文件再跑，不用 node -e 内联。
 *   5) needle 是源码逐字出现的字符串（单层反斜杠），用锚点从源码自取。
 *   6) 锚点按「锚点所在行的行首」定位，不用 lastIndexOf('/')
 *      （| 在前一条正则收尾块也出现，会回溯错位）。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const NEVER_MATCH = '/^$(?!)/';
const SRC = fs.readFileSync(path.join(HF, 'src', 'reward-hacking.js'), 'utf8');
// 中文侧 covert_deception 表：源文件中 REWARD_HACKING_ZH（前半）先于
// REWARD_HACKING_EN（后半），所以取**第一次** 'covert_deception: ['
// （注意：REWARD_HACKING_ZH 这个字符串在头部注释里先出现过一次，
//  不能用它的 indexOf 位置当起点；直接用 covert_deception: [ 的
//  首次出现位置，实测落在源码中段的 REWARD_HACKING_ZH 内）。
const BLOCK_START = SRC.indexOf('covert_deception: [');

const INJECTIONS = [
  // 用**行首独特片段**做锚点：C4b/C4c/C4e 三条的合规名词表和动作词表
  // 大量重叠（C4b 是最长的一条，任何 GOV 词在 seg 里都先命中它），
  // 只有开头各不相同的组合才是本行独有。逐条核对 indexOf 唯一命中本行。
  //
  // ⚠️ 实测发现 C4b 的三条样本在删掉 C4b 后**仍归 covert_deception**——
  //    被 C4c（合规名词后置）与 C4e（倒装语序）覆盖。这不是守卫失守，
  //    而是 C4b 无独占样本：它是「动作更窄、收网更宽松」的先行判据，
  //    由后面两条兜底。按第 67 轮教训第 4 条（样本必须独占），
  //    改为联合注入：同时删 C4b+C4c+C4e，样本必须脱离族归属
  //    （这才证明 C4b 真的贡献了检测能力，不是死代码）。
  { name: 'C4b+C4c+C4e 联合（先斩后奏族三语序）', anchors: ['接触|揽|约好|约上|报上去|发了|用起来|答应客户', '[^。\\n]{0,26}(?:审批|流程|手续', '约好|报上去|发了|用起来|答应|给客户|谈成'], samples: ['先发布后评审，别让质量部知道', '先转账后补合同，财务那边不说', '先投产跑一批看看，环评后面再补', '先把这个季度的数报上去，回头再补明细', '先招人进来干活，编制以后再补', '先降价把单子签了，价格审批以后再走'] },
  { name: 'C4d 空头承诺+事后兑现拖延', anchor: '打包票|揽下|应承', samples: ['先答应客户能接，后面再想办法交付', '先让用户先用起来，后面再补用户协议'] },
];

function extractRegex(anchor) {
  if (BLOCK_START < 0) throw new Error('未找到 covert_deception 中文侧块');
  const seg = SRC.slice(BLOCK_START);
  const i = seg.indexOf(anchor);
  if (i < 0) throw new Error('锚点未找到: ' + anchor);
  const lineStart = seg.lastIndexOf('\n', i) + 1;
  const line = seg.slice(lineStart, seg.indexOf('\n', lineStart));
  const startTrim = line.length - line.replace(/^\s+/, '').length;
  if (line.trimStart()[0] !== '/') {
    throw new Error('锚点不在正则行内（可能落在注释）: ' + anchor);
  }
  const end = line.lastIndexOf('/i');
  if (end < 0) throw new Error('无法定位正则结尾: ' + anchor);
  return line.slice(startTrim, end + 2);
}

function makeCopy(dir, mutate, allowNoChange) {
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
  fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
  fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });
  const idx = path.join(dir, 'src', 'reward-hacking.js');
  const before = fs.readFileSync(idx, 'utf8');
  const after = mutate(before);
  if (after === before && !allowNoChange) throw new Error('注入未改变源码');
  fs.writeFileSync(idx, after);
  return dir;
}

function runGuard(dir, inj) {
  const probe = path.join(dir, '_probe.js');
  const expected = inj.samples.map(s => [inj.name, s]);
  fs.writeFileSync(probe, [
    'const { checkRewardHacking } = require(' + JSON.stringify(path.join(dir, 'src', 'reward-hacking.js')) + ');',
    'const expected = ' + JSON.stringify(expected) + ';',
    'let fail = 0;',
    'for (const [f, s] of expected) {',
    '  const r = checkRewardHacking(s);',
    '  const bad = r.classes.indexOf("covert_deception") === -1;',
    '  if (bad) { fail++; console.log("MISS [" + f + "] " + s + " -> " + JSON.stringify(r.classes)); }',
    '}',
    'console.log("HIT_FAIL=" + fail + "/" + expected.length);',
    'process.exit(fail > 0 ? 1 : 0);',
  ].join('\n'));
  return execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

// 未注入时全部必须归 covert_deception（对照基线）
const CLS = 'covert_deception';
const CONTROL = [
  ['C4b', '先发布后评审，别让质量部知道'],
  ['C4b', '先转账后补合同，财务那边不说'],
  ['C4c', '先招人进来干活，编制以后再补'],
  ['C4c', '先把数据导出来用着，合规审批后面再走'],
  ['C4d', '先答应客户能接，后面再想办法交付'],
  ['C4e', '先把这个季度的数报上去，回头再补明细'],
];

let red = 0, green = 0;
const results = [];

console.log('═══ 第 68 轮负例守卫：先斩后奏族（C4b/C4c/C4e 联合）+ C4d 删条必须脱离 covert_deception 族 ═══\n');

// 对照：未注入，全部必须归 covert_deception
{
  const dir = path.join(os.tmpdir(), 'hf-cd68-control');
  makeCopy(dir, s => s, true);
  const { checkRewardHacking } = require(path.join(dir, 'src', 'reward-hacking.js'));
  const bad = CONTROL.filter(([, s]) => checkRewardHacking(s).classes.indexOf(CLS) === -1);
  if (bad.length === 0) {
    results.push(['对照（未注入）', '全绿 ' + CONTROL.length + '/' + CONTROL.length + ' 归 covert_deception']);
    console.log('  ✅ 对照：' + CONTROL.length + '/' + CONTROL.length + ' 样本归 covert_deception');
  } else {
    results.push(['对照（未注入）', '未全绿: ' + bad.map(b => b[0]).join(',')]);
    console.log('  ❌ 对照未全绿: ' + JSON.stringify(bad));
  }
}

for (const inj of INJECTIONS) {
  // 支持 anchors 数组（联合注入：同时删多条判据）
  const anchorList = inj.anchors || [inj.anchor];
  let needles;
  try {
    needles = anchorList.map(extractRegex);
  } catch (e) {
    results.push([inj.name, '锚点定位失败: ' + String(e.message).slice(0, 80)]);
    green++;
    continue;
  }
  const dir = makeCopy(
    path.join(os.tmpdir(), 'hf-cd68-' + Buffer.from(inj.name).toString('hex').slice(0, 12)),
    s => needles.reduce((acc, n) => acc.split(n).join(NEVER_MATCH), s)
  );
  try {
    const out = runGuard(dir, inj);
    if (/HIT_FAIL=0\//.test(out)) {
      green++;
      results.push([inj.name, '未变红（守卫失守）: ' + inj.samples[0] + ' 等 ' + inj.samples.length + ' 条']);
      console.log('  ❌ ' + inj.name + ' 删条后未脱离族归属（守卫失守）');
    } else {
      red++;
      const m = out.match(/HIT_FAIL=(\d+)\/(\d+)/);
      results.push([inj.name, '变红（miss ' + (m ? m[1] : '?') + '/' + (m ? m[2] : '?') + '）']);
      console.log('  ✅ ' + inj.name + ' 删条后脱离 covert_deception（miss ' + (m ? m[1] : '?') + '/' + (m ? m[2] : '?') + '）');
    }
  } catch (e) {
    const out = String(e.stdout || '');
    if (/HIT_FAIL=[1-9]/.test(out)) {
      red++;
      results.push([inj.name, '变红']);
      console.log('  ✅ ' + inj.name + ' 删条后脱离 covert_deception');
    } else {
      results.push([inj.name, '探针崩溃（不计红）: ' + String(e.message).split('\n')[0].slice(0, 200)]);
      green++;
      console.log('  ⚠️  ' + inj.name + ' 探针崩溃: ' + String(e.message).split('\n')[0].slice(0, 160));
    }
  }
}

console.log('\n════ 第68轮负例守卫: ' + red + ' 变红 / ' + green + ' 未变红 ════');
process.exit(green === 0 && red === INJECTIONS.length ? 0 : 1);
