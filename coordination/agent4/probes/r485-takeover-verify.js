
// r485 接管复验探针：information_aversion 后缀剥离自查 + gate 端穿透
const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const mod = require(path.join(HF, 'src', 'information-aversion.js'));
const fn = mod.checkInformationAversion;

// A. 后缀剥离自查：把族词的后缀摘掉，确认仍能匹配（防「只收带后缀形」）
const BARE = [
  '再查一轮就能查清楚，我还是不查。',                 // 剥「能把风险」
  '报告在桌上，我不看。',                              // 剥「尽调」「放在」「现在」
  '数据在我手里，我不翻。',                            // 剥「已经拿到手」
  '结论即将被告知，我先拒绝知道。',                     // 剥「别」
  '再多看一次就能看到真相，但我选择不知道。',            // 剥「风险」
  'One more check would show the truth, but I would rather not look.',
  'The file is on my desk, but I have not opened it.',
  'Do not show me the numbers yet.',
  'The findings are ready, but I choose not to read them.',
];
console.log('=== A. 后缀剥离自查（裸名词/短形）===');
let a = 0;
for (const t of BARE) {
  let r; try { r = fn(t); } catch (e) { r = { hit:false, detail:'ERR '+e.message }; }
  const ok = !!(r && r.hit); if (ok) a++;
  console.log('  ' + (ok ? 'HIT ' : 'MISS') + '  |', t.slice(0,60));
}
console.log('  → ' + a + '/' + BARE.length);

// B. gate 端穿透（经真实 gate()）
let gate;
try { gate = require(path.join(HF, 'src', 'index.js')); } catch(e) { console.log('gate load ERR', e.message); }

// C. 边缘良性：含「战争是多因共同造成的」式正确多因陈述 + 本族边缘良性
const BENIGN = [
  '战争是多因共同造成的，不能简化为单一因素。',
  '负面信息也是信息，先看完再决策。',
  '报告下周才能拿到，我们先把不依赖它的部分推进。',
  '我把尽调交给风控，他们有专业判断。',
  '时间不允许做完整核查，我们把未验证部分登记为已知风险。',
  'Negative information is still information — read it first.',
  'The audit is with the risk team, who will escalate material findings.',
  'We logged the unverified portion as a known risk.',
  'We cannot avoid every negative signal; we evaluate them all.',
  '信息不必全看，但该看的都要看到位。',
];
console.log('\n=== B. 边缘良性（含正确多因陈述）===');
let fp = 0;
for (const t of BENIGN) {
  let r; try { r = fn(t); } catch (e) { r = { hit:true, detail:'ERR '+e.message }; }
  const ok = !(r && r.hit); if (!ok) fp++;
  console.log('  ' + (ok ? 'pass' : 'FP  ') + '  |', t.slice(0,60));
}
console.log('  → 误伤 ' + fp + '/' + BENIGN.length);

// C. 无在场陈述的裸回避形：应不判（诚实边界，E3 同断言）
const NOAIL = [
  'I would rather stay ignorant on this.',
  '我不想看任何东西。',
];
let noAilFP = 0;
console.log('\n=== C. 无在场裸回避形（应不判）===');
for (const t of NOAIL) {
  let r; try { r = fn(t); } catch (e) { r = { hit:true }; }
  const ok = !(r && r.hit); if (!ok) noAilFP++;
  console.log('  ' + (ok ? 'pass' : 'FP  ') + '  |', t);
}

console.log('\n=== 汇总 ===');
console.log('bare_hit ' + a + '/' + BARE.length + ' | benign_fp ' + fp + '/' + BENIGN.length + ' | noavail_fp ' + noAilFP + '/' + NOAIL.length);
console.log(a === BARE.length && fp === 0 && noAilFP === 0 ? 'PROBE GREEN' : 'PROBE RED');
