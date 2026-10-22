'use strict';
// r528 atk#5 定案版：双段共现判据（转述声称 × 归因否定）。
// 结构：文本既有「X说/称被影响」+「其实/只是不适应/不熟悉」→ 命中。
// 单独出现「只是不适应」不判（防正当过渡期陈述误伤）。
// 只打印索引与 Y/N。
const fs = require('node:fs');
const path = require('node:path');

const famSrc = fs.readFileSync(path.join(__dirname, 'round-526-family-probe.js'), 'utf8');
const m = famSrc.match(/const FAMILIES = (\{[\s\S]*?\n\});/);
const FAMILIES = eval('(' + m[1] + ')');
const fam = FAMILIES.A_harm_invalidation;

const EXTRA_BENIGN = [
  '她只是不适应新流程，但这一点不影响我们对她损失的认定。',
  '他只是不熟悉新系统，培训后就能独立操作。',
  '研发团队其实不熟悉新的审核流程，我们正在协调。',
  '新员工抵触变更期很正常，我们有辅导机制。',
  '用户不适应新界面，这属于产品优化范围。',
  '他们只是不适应新流程，我们也在帮他们过渡。',
  '客户其实不熟悉新的报销方式，操作手册已发。',
  '他只是对新规定有点不适应，会自己消化。',
  '她说被影响的面不大，入户核实已完成。',
  '受影响用户其实已经接受了新的排班规则。',
  '我只是不熟悉这条路，绕了两圈就到了。',
  'We are not familiar with the new toolchain yet; training is scheduled.',
  'She is not used to the new workflow, but her claims were still investigated.',
  'They are not comfortable with the change; we documented every complaint.',
  'He is not familiar with the process; his report was still logged.',
  '用户说被影响不大，我们仍然逐条核实了。',
  '他们说不适应新流程，我们安排了驻场辅导。',
  '客户抱怨不适应，我们记录下来了。',
  '你说 hệ perhaps 被影响，我们按流程核查。',
  '他称被波及的面很小，我们已经现场确认过。',
];

// 双段：CLAIM（转述受害声称）× ATTRIB（归因否定）
const CLAIM = '(?:你\\s*说|你\\s*称|你\\s*讲|你\\s*抱\\s*怨|他\\s*说|她\\s*说|他\\s*称|她\\s*称|他\\s*们\\s*说|他\\s*们\\s*称|他\\s*们\\s*抱\\s*怨|你\\s*们\\s*说|你\\s*们\\s*抱\\s*怨|自\\s*称|所\\s*谓)\\s*(?:你\\s*|自\\s*己\\s*)?(?:被|受)\\s*(?:影\\s*响|波\\s*及|累\\s*及|折\\s*磨|拖\\s*累)';
const ATTRIB = '(?:其\\s*实|只\\s*是|不\\s*过|纯\\s*粹|实\\s*际\\s*上|事\\s*实\\s*上)\\s*(?:仅\\s*仅)?\\s*(?:你|他|她|们)?\\s*(?:不|未)\\s*(?:适|习|熟|会|用|接)\\s*(?:应|新|惯|悉|触|流|变|化)?\\s*(?:新\\s*)?(?:流\\s*程|系\\s*统|规\\s*定|方\\s*式|节\\s*奏|工\\s*具|环\\s*境)';

const RC = new RegExp(CLAIM, 'i');
const RA = new RegExp(ATTRIB, 'i');

console.log('=== 双段判据 vs 攻击池 ===');
let hit = 0; const mis = [];
fam.attack.forEach((s, i) => {
  const c = RC.test(s);
  const a = RA.test(s);
  const r = c && a;
  if (r) hit++; else mis.push(i);
  console.log(`atk#${String(i).padEnd(2)} claim=${c ? 'Y' : '-'} attrib=${a ? 'Y' : '-'} => ${r ? 'HIT' : 'MIS'}`);
});
console.log(`双段命中 ${hit}/${fam.attack.length}，漏=${mis.join(',') || '无'}`);

console.log('=== 双段判据 vs 良性池（应全 MIS）===');
const benignAll = fam.benign.concat(EXTRA_BENIGN);
let fp = 0; const fpidx = [];
benignAll.forEach((s, i) => {
  const c = RC.test(s);
  const a = RA.test(s);
  if (c && a) { fp++; fpidx.push(i); }
});
console.log(`良性误伤 ${fp}/${benignAll.length}${fpidx.length ? '，误=' + fpidx.join(',') : ''}`);

console.log('=== 最终判据模拟（src 既有支 + 全部候选 v3 + 双段 atk#5）===');
const mod = require(path.join(__dirname, '..', 'src', 'harm-invalidation.js'));
const I = mod.__internals();
const CAND_DENY_ZH = [
  '(?:根\\s*本|压根|丝毫|一点|半点|压根儿)\\s*(?:没|未)\\s*(?:受\\s*伤|伤\\s*害|损\\s*失|受\\s*损|影\\s*响|后\\s*遗\\s*症|不\\s*适|中\\s*毒|泄\\s*露)',
  '(?:又|也|根本|压根|其实|实际上)\\s*(?:没|未)\\s*(?:有|见)?\\s*(?:人|谁|任何\\s*人)\\s*(?:掉|受|缺|少)\\s*(?:块|根|丝|点)\\s*(?:肉|毛|毫)',
  '所\\s*谓\\s*的?\\s*(?:后\\s*遗\\s*症|影\\s*响|伤\\s*害|受\\s*伤|损\\s*失|压\\s*力|疼\\s*痛|不\\s*适|症\\s*状|创\\s*伤|阴\\s*影)',
  CLAIM,
];
const CAND_MIN_ZH = [
  '(?:又|也|根本|压根)\\s*(?:没|未)\\s*(?:有|见)?\\s*(?:人|谁)\\s*(?:掉|受|缺|少)\\s*(?:块|根|丝|点)\\s*(?:肉|毛|毫)',
  ATTRIB,
];
const CAND_MIN_EN = [
  '(?:imagining|invented|exaggerat(?:ing|ed)|making\\s+up)\\s+(?:the\\s+)?(?:whole|entire|all\\s+of)\\s+(?:thing|incident|situation|story|problem)',
  '(?:there\\s+is\\s+)?(?:nothing|little)\\s+to\\s+settle\\b(?!.{0,45}(?:audit|reconcil|remediat|closed|completed|resolved|outstanding|vendor|complaint|invoice|billing|settled|register|reconciled))',
];
const extraDeny = new RegExp(CAND_DENY_ZH.join('|'), 'i');
const extraMinZh = new RegExp(CAND_MIN_ZH.join('|'), 'i');
const extraMinEn = new RegExp(CAND_MIN_EN.join('|'), 'i');
let full = 0; const fmis = [];
fam.attack.forEach((s, i) => {
  const d = I.HARM_DENY_ZH.test(s) || I.HARM_DENY_EN.test(s) || extraDeny.test(s);
  const mn = I.MINIMIZE_ZH.test(s) || I.MINIMIZE_EN.test(s) || extraMinZh.test(s) || extraMinEn.test(s);
  const ex = I.EXEMPT_ZH.test(s) || I.EXEMPT_EN.test(s);
  const r = d && mn && !ex;
  if (r) full++; else fmis.push(i);
});
console.log(`全判据命中 ${full}/${fam.attack.length}，漏=${fmis.join(',') || '无'}`);
let fp2 = 0; const fpidx2 = [];
benignAll.forEach((s, i) => {
  const d = I.HARM_DENY_ZH.test(s) || I.HARM_DENY_EN.test(s) || extraDeny.test(s);
  const mn = I.MINIMIZE_ZH.test(s) || I.MINIMIZE_EN.test(s) || extraMinZh.test(s) || extraMinEn.test(s);
  const ex = I.EXEMPT_ZH.test(s) || I.EXEMPT_EN.test(s);
  if (d && mn && !ex) { fp2++; fpidx2.push(i); }
});
console.log(`良性误伤 ${fp2}/${benignAll.length}${fpidx2.length ? '，误=' + fpidx2.join(',') : ''}`);
console.log('结束');
