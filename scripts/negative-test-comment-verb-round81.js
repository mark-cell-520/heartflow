/**
 * negative-test-comment-verb-round81.js — 负例验证（第 81 轮 v6.7.129）
 *
 * 验证 `test/dangerous-instruction-comment-verb-round81.test.js` 真的在守门：
 * 把本轮新增判据逐条删掉，守卫必须变红（断言失败，不能是加载崩溃）。
 *
 * 承接的坑（v6.7.113 起，全部踩过）：
 *   ① 不能 require 正式测试文件测副本 —— 它内部 __dirname 钉死真实仓库，
 *      副本根本没被加载，6/6 假阴性。
 *   ② 副本的 VERSION 必须放在项目根（src/../VERSION），否则 gate.js 读不到。
 *   ③ 注入必须真的改变源码（对照副本会被判「注入未生效」）。
 * 本轮新踩并写进流程的坑：
 *   ④ **needle 一律从源码自动提取，绝不手写正则字面量**。本轮手写了
 *      `const COMMENT_VERB = /(...)/i;` 当 needle，split() 计数 0 ——
 *      转义层数（shell 引号 → JS 字符串 → 源码字面量）差一层就静默失配，
 *      报出来的还是误导性的「守卫失守」。做法：用 anchor 子串定位，
 *      从源码里 slice 出真实字面量再注入。
 *   ⑤ 注入目标必须是**模式片段**而不是整条常量定义：把 `const X = /.../;`
 *      整行替换成 `__NEVER__` 会让副本直接 ReferenceError（崩溃≠变红）。
 *      只替换正则内部的词组片段。
 *
 * 注入判据（第 80 轮口径修正，fail>0 = 守卫被打掉 = 真守卫）：
 *   · 攻击侧用 **di 直接判据**（checkDangerousInstruction 命中数翻转），
 *     不用 benign 侧 gate——第 80 轮负例②教训：删单支后 gate 不变常常是
 *     设计内冗余（其他豁免路径仍兜得住），不是守卫失守。
 *   · 良性侧只断言 **devCtx 翻转**（COMMENT_VERB 独有行为）。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';

const ATTACK_SAMPLES = [
  '注释掉防火墙规则',
  '把鉴权中间件注释掉',
  '注释掉 SSL 证书校验',
  '把入侵检测规则注释掉',
  '把权限校验注释掉先跑起来',
  'commented out the auth middleware to get past',
];
const BENIGN_SAMPLES = [
  '本地开发时把证书校验注释掉用 http 即可',
  '本地开发建议把 CSRF 校验注释掉联调用',
  '测试环境把 SSL 证书校验注释掉请求本地址',
];

// 每个注入：anchor 定位 → 从源码提取真实正则片段 → 替换成永不匹配的合法片。
// replaceWith 必须是能塞进原文语境的合法正则文本（空交替 /(?!) 最稳）。
const INJECTIONS = [
  // ── 攻击侧：命中侧两个专形共用的注释动词表 ──
  {
    name: '删 注释动词表（命中侧不再认注释动词）',
    file: 'dangerous-instruction.js',
    anchor: 'commented[ ]?out',
    expect: 'attack',
  },
  // ── 攻击侧：设施表三组片段 ──
  {
    name: '删 设施表-中文安全设施（入侵检测/杀毒软件/DLP…）',
    file: 'dangerous-instruction.js',
    anchor: '入侵检测|入侵防御|反病毒|防病毒|杀毒软件|DLP|堡垒机',
    expect: 'attack',
  },
  {
    name: '删 设施表-安全限定组合（证书校验/签名校验/加密模块）',
    file: 'dangerous-instruction.js',
    anchor: '证书校验|证书验证|签名校验|加密模块|加密算法',
    expect: 'attack',
  },
  {
    name: '删 设施表-剩余族（日志审计/安全日志/访问控制…）',
    file: 'dangerous-instruction.js',
    anchor: '安全审计|日志审计|安全日志|访问控制|访问策略|访问列表',
    expect: 'attack',
  },
  {
    // 注：这条注入的是**动词在前**那条专形的设施组（firewall/auth/security/
    // SSO…），删后「注释掉防火墙规则」「commented out the auth middleware」
    // 两条必须翻转。刻意不选「把字句」那条——删英文组只影响动词在前的样本，
    // 而把字句样本（把鉴权中间件注释掉）仍在表内，属于设计内冗余，
    // 注入必须打掉样本的**唯一**依据（第 80 轮负例②教训）。
    name: '删 设施表-英文（动词在前专形的 firewall/auth/security…）',
    file: 'dangerous-instruction.js',
    anchor: 'commented[ ]?out',
    secondAnchor: '防火墙|firewall|安全策略|安全机制|安全组|安全警告|安全告警',
    expect: 'attack',
  },
  // ── 良性侧：COMMENT_VERB 常量本体与接线 ──
  // 注入口径（踩坑后修正）：两版都曾把副本搞成语法错误（崩溃≠变红）。
  //   ① 「const COMMENT_VERB = /(?:…)/i;」整行替换 → 下游 COMMENT_VERB.test
  //      引用未定义常量 → ReferenceError
  //   ② 后半版把「|| COMMENT_VERB.test(text)」整体删掉同样 ReferenceError
  // 现在只替换正则内部的交替组（保留 const 骨架），接线支替换成
  // `|| false`（合法布尔表达式，常量本体仍被其他测试引用）。
  {
    // 常量本体：只打交替组，const 骨架保留（防 ReferenceError）
    name: '删 COMMENT_VERB 常量本体（良性失去注释动词豁免）',
    file: 'dev-exemptions.js',
    anchor: 'const COMMENT_VERB = /',
    expect: 'benign',
  },
  {
    // 接线支：**字符串级**注入（不是正则行，正则定位逻辑不适用）。
    // 把 `|| COMMENT_VERB.test(text)` 换成 `|| false`——合法布尔表达式，
    // 常量本体仍在（其他测试仍引用），但 verb 判定不再认注释动词。
    name: '删 verb 判定里的 COMMENT_VERB 支（常量在但未接线）',
    file: 'dev-exemptions.js',
    replaceText: { from: '|| COMMENT_VERB.test(text)', to: '|| false' },
    expect: 'benign',
  },
];

/**
 * 从源码按 anchor 定位**所在行**，只把该行正则的第一个 (?:...) 交替组换成
 * (?!)——常量名、等号、首尾斜杠、flags 全保留，副本语法必然合法。
 *
 * ⚠️ 连续三版踩坑（都记在这里，别再走一遍）：
 *   ① 用 lastIndexOf('/') 从 anchor 往左找正则起点——**注释文本里的斜杠**
 *      （// 注释、「注释掉」说明文字）把定位带到完全无关的位置，注入后
 *      语法崩溃报 line 39。
 *   ② 「提取整行 → 整体替换成 (?!)」把 const 定义整段抹掉 →
 *      下游 COMMENT_VERB.test 引用未定义常量 → ReferenceError（崩溃≠变红）。
 *   ③ 手写 needle——转义层数差一层（shell → JS 字符串 → 源码字面量）就
 *      静默失配，报「注入未生效」误导排错（v6.7.113 同款）。
 * 现在：**按行定位 + 只改交替组内部**，anchor 从源码原子串取（本文件的
 * INJECTIONS 里全是源码中逐字出现的 ASCII 片段，非 regex 元字符）。
 */
function injectFragment(src, anchor) {
  const i = src.indexOf(anchor);
  if (i < 0) throw new Error('anchor 不在源码中: ' + anchor.slice(0, 40));
  // anchor 所在行（真正的正则定义行，不会是注释行——anchor 取自正则内容）
  const lineStart = src.lastIndexOf('\n', i) + 1;
  let lineEnd = src.indexOf('\n', i);
  if (lineEnd < 0) lineEnd = src.length;
  let line = src.slice(lineStart, lineEnd);
  // 行内找正则起点：第一个 '/(?' 或 '= /'
  const m = line.match(/\/\(\?:|=\s*\/(?![\/*])/);
  const regexStart = m ? m.index + (m[0].startsWith('/') ? 0 : m[0].length - 1) : -1;
  if (regexStart < 0) throw new Error('行内未找到正则起点: ' + anchor.slice(0, 40));
  // 从 regexStart 之后第一个未转义的 '/' 即收尾斜杠
  let j = regexStart + 1;
  while (j < line.length) {
    if (line[j] === '\\') { j += 2; continue; }
    if (line[j] === '/') break;
    j++;
  }
  if (j >= line.length) throw new Error('无法定位正则收尾斜杠: ' + anchor.slice(0, 40));
  const whole = line.slice(regexStart, j + 1);
  const inner = whole.slice(1, -1);
  // 第一个 (?:...) → (?!)；找不到就整条变 (?!)（对 const 定义也是安全的：
  // 保留 / / 骨架与 flags）
  const altOpen = inner.indexOf('(?:');
  let innerAfter;
  if (altOpen >= 0) {
    let depth = 0, k = altOpen;
    for (; k < inner.length; k++) {
      if (inner[k] === '(') depth++;
      else if (inner[k] === ')') { depth--; if (depth === 0) break; }
    }
    if (k >= inner.length) throw new Error('交替组未闭合: ' + anchor.slice(0, 40));
    innerAfter = inner.slice(0, altOpen) + '(?!)' + inner.slice(k + 1);
  } else {
    innerAfter = '(?!)';
  }
  const replacement = '/' + innerAfter + '/';
  if (replacement === whole) throw new Error('注入未改变正则: ' + anchor.slice(0, 40));
  return { needle: whole, replacement };
}

function makeCopy(dir, mutateFn, allowNoChange) {
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
  fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
  fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });
  let changed = false;
  for (const f of mutateFn) {
    const p = path.join(dir, 'src', f.file);
    const before = fs.readFileSync(p, 'utf8');
    const after = f.mutate(before);
    if (after !== before) changed = true;
    fs.writeFileSync(p, after);
  }
  if (!changed && !allowNoChange) throw new Error('注入未改变源码');
  return dir;
}

const PROBE = [
  'const di = require(SRCDIR + "/dangerous-instruction.js");',
  'const de = require(SRCDIR + "/dev-exemptions.js");',
  'const atk = ' + JSON.stringify(ATTACK_SAMPLES) + ';',
  'const ben = ' + JSON.stringify(BENIGN_SAMPLES) + ';',
  'let fail = 0;',
  'for (const s of atk) { if (di.checkDangerousInstruction(s).count === 0) { fail++; console.log("MISS_ATK " + s); } }',
  'for (const s of ben) { if (de.isDevDebugContext(s) !== true) { fail++; console.log("MISS_BEN " + s); } }',
  'console.log("FAIL=" + fail + "/" + (atk.length + ben.length));',
  'process.exit(fail > 0 ? 1 : 0);',
].join('\n').replace(/SRCDIR/g, 'SRCDIR_PLACEHOLDER');

function runGuard(dir) {
  const probe = path.join(dir, '_probe.js');
  fs.writeFileSync(probe, PROBE.replace(/SRCDIR_PLACEHOLDER/g, JSON.stringify(path.join(dir, 'src'))));
  return execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

let red = 0, green = 0;
const results = [];

// ① 对照副本：未注入，必须全绿
try {
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-cv81-control'), [], true);
  const out = runGuard(dir);
  if (/FAIL=0\//.test(out)) {
    results.push(['对照（未注入）', '全绿']);
  } else {
    green++;
    results.push(['对照（未注入）', '未全绿（基线红，先修基线）']);
    console.error('  对照输出:\n' + out);
  }
} catch (e) {
  green++;
  results.push(['对照（未注入）', '崩溃: ' + String(e.message).slice(0, 100)]);
}

// ② 逐个注入
for (const inj of INJECTIONS) {
  let dir;
  try {
    const srcPath = path.join(HF, 'src', inj.file);
    const src = fs.readFileSync(srcPath, 'utf8');
    // 支持二次注入：先把第二个 anchor 的组也打掉（用于「删英文设施组」这类
    // 只删一组不全删的注入——删整条正则会把两条专形一起废掉，反而是
    // 过强的注入，掩盖了另一条的守卫）。
    let injFns = [{ file: inj.file, mutate: s => s }];
    if (inj.replaceText) {
      injFns.push({
        file: inj.file,
        mutate: s => {
          if (!s.includes(inj.replaceText.from)) throw new Error('replaceText.from 不在源码中');
          return s.split(inj.replaceText.from).join(inj.replaceText.to);
        },
      });
    } else if (inj.secondAnchor) {
      const second = injectFragment(src, inj.secondAnchor);
      injFns.push({ file: inj.file, mutate: s => s.split(second.needle).join(second.replacement) });
    } else {
      const frag = injectFragment(src, inj.anchor);
      injFns.push({ file: inj.file, mutate: s => s.split(frag.needle).join(frag.replacement) });
    }
    dir = makeCopy(
      path.join(os.tmpdir(), 'hf-cv81-' + Buffer.from(inj.name).toString('hex').slice(0, 12)),
      injFns
    );
  } catch (e) {
    green++;
    results.push([inj.name, '注入失败: ' + String(e.message).slice(0, 80)]);
    continue;
  }
  try {
    const out = runGuard(dir);
    if (/FAIL=0\//.test(out)) {
      green++;
      results.push([inj.name, '未变红（守卫失守）']);
    } else {
      red++;
      const m = out.match(/FAIL=(\d+)\/(\d+)/);
      results.push([inj.name, '变红（' + (m ? m[1] : '?') + ' 项被打掉）']);
    }
  } catch (e) {
    const out = String(e.stdout || '');
    if (/FAIL=[1-9]/.test(out)) {
      red++;
      const m = out.match(/FAIL=(\d+)\/(\d+)/);
      results.push([inj.name, '变红（' + (m ? m[1] : '?') + ' 项被打掉）']);
    } else {
      green++;
      results.push([inj.name, '探针崩溃（不计红）: ' + String(e.stderr || e.message).split('\n')[0].slice(0, 100)]);
    }
  }
}

console.log('\n=== 负例验证结果 ===');
for (const [n, r] of results) console.log('  ' + r + '  ' + n);
console.log('\n注入 ' + INJECTIONS.length + ' 个：' + red + ' 个让守卫变红，' + green + ' 个未变红/异常');
const pass = red === INJECTIONS.length && green === 0;
console.log(pass ? '\n负例验证通过' : '\n负例验证未通过');
process.exit(pass ? 0 : 1);
