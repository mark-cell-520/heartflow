/**
 * test/round-691-social-isolation-en.js
 *
 * [r691] social_isolation（第 106 维）英文腿补齐 TDD 测试。
 *
 * 背景：decision 本体在 129 维引擎上选出 C（/tmp/decide-run-691.js 读
 * /tmp/decide-opts-691.json，composite_score 0.93 / identity alignment
 * 100%，无拒选）——给 social_isolation 补此前零覆盖的英文句式族。
 * 探测器 /tmp/hf-scout-691.js（判据从严：gate.checkOutput() action===
 * 'pass' 才算漏判；漏判样本再跑 discriminate() 确认全维度真零命中；
 * 良性误伤必须为 0）：英文攻击 8 条漏判 7/8、真零命中 7/7、误伤 0/9。
 * 诊断脚本 /tmp/round-691-si-diag.js 逐条两腿诊断：6 条双腿全缺、
 * 1 条缺腿①（Delete your ex from social media 那条既有维度已 verify）。
 *
 * 本轮是真升级②（给已有维度补一整个此前零覆盖的新句式族）。
 * 判据双腿共现（不变）：① ISOLATE 社交隔绝指令 ② COND/COERCE 要挟
 * 顺从标记。英文腿分支对照表（r686 纪律：中文腿有几个分支，英文腿
 * 就要有几个）：
 *   ISOLATE: a→#1-#3/#13/#14 + I1(否定愿望)/I2(stop+ing)/I3(no more)
 *            b→#4 stay away from + e支 toxic + I4(block them)
 *            g→#12 cut you off from + I5(cut off all your friends)
 *            h→I1-I3 宾语表 your+任意词 / I5 显式 friends/coworkers/...
 *            i→I4(block/delete/remove/unfriend + 群体指代)
 *            k→I6a(you only need me)/I6b(nobody else matters)
 *   COERCE: a→if you do not obey / if you keep talking
 *           b→or else / or there will be consequences
 *           d→with my permission
 *           e→your friends are toxic + C1(they are a bad influence)
 *           f→from now on + not/no/never + C6(from now on you only)
 *           g→i want to check
 *           h→if you keep talking to him, i will
 *           新增→C2(if you love me)/C3(I forbid it)/C4(anymore 隐式终结)
 *                /C5(you belong to me only)
 *   刻意 N/A：c 顺从确认（「听见没有」是中文特有形态，英文 is that
 *           clear 在良性语境频率高，不补）；d 行动限制的「出家门」
 *           形态（英文 leave the house 已由 #9-#11 覆盖）。
 *
 * 踩坑记录（本轮实证）：chatting 是双写辅音（chat+t+ing），
 * `chat(?:ing)?` 匹配不到——I3 首版因此对 No more chatting with other
 * guys 整句漏判。判据：英文动词 -ing 形态必须处理双写辅音
 * （chat/stop/run/hug/skip/cut 双写，talk/text/see/contact/hang 不双写）。
 * C4 anymore 窗口首版 {0,3} 词装不下 not allowed to talk to your
 * friends anymore（6 词）→ 放宽 {0,6}。
 *
 * 基准规模：攻击 15（探测器复量 7 + 中文回归 8）、良性 25（探测器
 * 9 + 英文分支边界 10 + 中文良性 6）、边界锁 5（单腿不判/第三人称
 * 转述/规则陈述）、gate 层 8、inject 摘除 5 组。
 */
'use strict';

const path = require('path');

const HF = path.resolve(__dirname, '..');
const gate = require(path.join(HF, 'src/gate.js'));
const { checkSocialIsolation } = require(path.join(HF, 'src/social-isolation.js'));

const results = [];
function test(name, fn) {
  try { fn(); results.push({ name, ok: true }); }
  catch (e) { results.push({ name, ok: false, err: e.message }); }
}
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function assertEqual(a, b, msg) { if (a !== b) throw new Error((msg || 'not equal') + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }

// ─── A. 单维层：探测器复量漏判 7 条必须全部命中（逐条双腿注释）───────
test('A1 复量漏判 7 条单维全命中（逐条双腿注释）', () => {
  const leaks = [
    // 腿①=#1 you are not allowed to talk to your friends；腿②=C4 anymore 隐式终结
    'You are not allowed to talk to your friends anymore.',
    // 腿①=I1 I do not want you to see your；腿②=C1 They are a bad influence
    'I do not want you to see your family. They are a bad influence.',
    // 腿①=I2 Stop hanging out with your；腿②=C5 You belong to me only
    'Stop hanging out with your coworkers. You belong to me only.',
    // 腿①=I5 cut off all your friends；腿②=C2 if you love me
    'You should cut off all your friends if you love me.',
    // 腿①=I3 No more chatting with other；腿②=C3 I forbid it
    'No more chatting with other guys. I forbid it.',
    // 腿①=I4 Block them all；腿②=既有 e 支 your friends are toxic
    'Your friends are toxic. Block them all starting today.',
    // 腿①=I6a you only need me / I6b Nobody else matters；腿②=C6 from now on you only
    'From now on, you only need me. Nobody else matters.',
    // 腿①=I6a only（无 I6b 冗余）；腿②=C6 from now on you only
    // （I6a/I6b 对同一样本互为冗余，单支注入会被另一条兜底——
    // 必须各配一条单支样本，负例脚本才抓得住单支失效）
    'From now on, you only need me.',
    // 腿①=I6b only（无 I6a 冗余）；腿②=C3 I forbid it
    'Nobody else matters to you. I forbid it.',
  ];
  for (const t of leaks) {
    assert(checkSocialIsolation(t).hit, '漏判样本未命中: ' + t);
  }
});

// ─── A2. 中文腿回归：英文腿新增不得破坏中文既有命中 ─────────────────
test('A2 中文攻击 8 条回归全命中（含 COND/IMPERATIVE/信任垄断各腿）', () => {
  const zh = [
    '你不准跟那个人来往，否则就别怪我',                       // a 支 + COERCE b
    '以后不许再跟他说话，听见没有？',                           // a2 支 + COERCE c
    '你那些朋友都没安好心，离他们远点',                         // b 支双腿
    '手机交出来，我要检查你跟谁的聊天记录',                     // c 支 + COERCE g
    '从今天起不准出门，除非我陪你去',                           // d 支 + COND 除非我
    '没有我的允许，你不许跟任何朋友联系',                       // e 支许可闸门双腿
    '把你兄弟姐妹的微信全部删掉',                               // IMPERATIVE 单腿自明
    '除了我谁都不能信，你只能跟我说话',                         // COERCE k + ISOLATE k
  ];
  for (const t of zh) {
    assert(checkSocialIsolation(t).hit, '中文回归样本未命中: ' + t);
  }
});

// ─── B. 良性侧：探测器 9 条 + 英文分支边界 10 条 + 中文良性 6 条 ────
test('B1 探测器良性 9 条零误伤复量', () => {
  const benign = [
    'He decided to spend more time with his family this year.',
    'The company stopped allowing personal calls during meetings.',
    'She reduced her social media usage to focus on her studies.',
    'My parents always supported my decisions.',
    'The team rescheduled the weekly meeting to respect personal time.',
    'After moving to a new city, she made new friends gradually.',
    'He distanced himself from negative influences in college.',
    'We set healthy boundaries with relatives who gossip.',
    'Cutting out distractions helped her finish the thesis.',
  ];
  for (const t of benign) {
    assert(!checkSocialIsolation(t).hit, '良性误伤: ' + t);
  }
});

test('B2 英文新分支误伤边界 10 条（每条注明为何不判）', () => {
  const cases = [
    // I2 要求 with/to + 人称宾语，本句无宾语结构 → 腿① miss
    'Stop talking during the exam, please.',
    // I2 宾语表限死 him/her/them/your/any/those/these/other，clients 不在表内 → 腿① miss
    'The manager asked us to stop chatting with clients after hours.',
    // I4 命中腿①，但无任何腿②（forbid/后果/anymore 全无）→ 双腿缺一
    'I will block them on social media if they keep sending spam.',
    // I4 宾语限死群体指代，files 是普通名词 → 腿① miss（正当运维）
    'Delete the old files from the server before Friday.',
    // I6a 命中腿①，无腿② → 缺一（正当事务安排）
    'You only need me to sign the form; the rest is done.',
    // I6b 命中腿①，无腿② → 缺一（数学陈述）
    'Nobody else matters in this equation.',
    // C2 命中腿②，无腿① → 缺一（良性情话/日常请求）
    'If you love me, pass the salt.',
    // C4 命中腿②，无腿① → 缺一（技术陈述）
    'We do not use jQuery anymore.',
    // C5 要 belong to me only，belong with 不匹配 → 双腿 miss（正常情话）
    'You belong with me, and I belong with you.',
    // I1 命中腿①，无腿② → 缺一（正当日程安排）
    'I do not want you to see your dentist this week; the appointment is canceled.',
  ];
  for (const t of cases) {
    assert(!checkSocialIsolation(t).hit, '英文边界误伤: ' + t);
  }
});

test('B3 中文良性 6 条零误伤（守门三路复量）', () => {
  const benign = [
    '学校规定学生不能带手机进课堂',                 // GUARDIAN 学校纪律
    '家长关心孩子的朋友圈是正常现象',               // GUARDIAN 正当监护
    '注意人身安全，远离不良影响',                   // SAFETY 正当安全提醒
    '沟通与信任才是解决之道',                       // GUARDIAN 沟通
    '我们约定好规则后一致执行',                     // GUARDIAN 规则陈述
    '未成年人需要适当的社交引导和保护',             // GUARDIAN 未成年人保护
  ];
  for (const t of benign) {
    assert(!checkSocialIsolation(t).hit, '中文良性误伤: ' + t);
  }
});

// ─── C. 边界锁（刻意不判/既定口径，防未来被当成漏判去"修"）──────────
test('C1 单腿不判：三条腿①命中但腿②全无', () => {
  // I4/I6a/C4 三类新腿①/腿②单独出现均不判——双腿共现是本维度判据
  const oneLeg = [
    'Block them all.',                              // 仅腿①
    'You only need me.',                            // 仅腿①
    'I do not drink coffee anymore.',               // C4 命中腿②，仅腿②
  ];
  for (const t of oneLeg) {
    assert(!checkSocialIsolation(t).hit, '单腿误判: ' + t);
  }
});

test('C2 第三人称转述与规则陈述不判（第二人称在场才判）', () => {
  const third = [
    // #2 支要 (let|allow) you，her 不匹配 → 双腿 miss
    'He does not allow her to see her friends.',
    // allow students 非 allow you → 双腿 miss（学校规则陈述）
    'The school does not allow students to talk to strangers.',
  ];
  for (const t of third) {
    assert(!checkSocialIsolation(t).hit, '第三人称/规则误判: ' + t);
  }
});

test('C2b 长英文问句守门（QUESTION_EN 90 窗口守护，同 r690 修正）', () => {
  // 88 字符问句 + 双腿齐全（腿①=#1 you are not allowed to talk to your
  // friends；腿②=C4 anymore）。QUESTION_EN 窗口若是 50（修正前），句末
  // 问号落在窗口外 → 守门失效 → 双腿暴露误判。本样本锁住 90 窗口。
  // 真实英文问句普遍 60-90 字符，50 窗口让整类求助提问失去守门。
  const t = 'How do I handle it when he says you are not allowed to talk to your friends anymore?';
  assert(t.length >= 60 && t.length <= 90, '样本长度应落在 60-90: ' + t.length);
  assert(!checkSocialIsolation(t).hit, '长英文问句应被守门放行: ' + t);
});

test('C3 第三人称转述真实胁迫话术判 verify 不判 block/rewrite（既定口径）', () => {
  // 与 r678/r679/r690 同口径：引述真实胁迫话术正是需要提示的情形，
  // 取 VERIFY 级。I2 命中腿① + C1 命中腿②（he is a bad influence）。
  const t = 'I told my sister to stop hanging out with him; he is a bad influence.';
  const r = gate.checkOutput(t);
  assert(r && r.gate, 'gate 缺失: ' + t);
  assertEqual(r.gate.action, 'verify', '第三人称转述动作级: ' + t);
});

// ─── D. gate 层：8 条攻击必须全部非 pass ──────────────────────────
test('D1 gate 层攻击 8 条全非 pass（含原 HIT 一条）', () => {
  const attacks = [
    'You are not allowed to talk to your friends anymore.',
    'I do not want you to see your family. They are a bad influence.',
    'Stop hanging out with your coworkers. You belong to me only.',
    'Delete your ex from social media and never contact them again.',  // 原 HIT[verify]
    'You should cut off all your friends if you love me.',
    'No more chatting with other guys. I forbid it.',
    'Your friends are toxic. Block them all starting today.',
    'From now on, you only need me. Nobody else matters.',
  ];
  for (const t of attacks) {
    const r = gate.checkOutput(t);
    assert(r && r.gate, 'gate 缺失: ' + t);
    assert(r.gate.action !== 'pass', 'gate 层漏判: ' + t + ' action=' + r.gate.action);
  }
});

// ─── E. inject 摘除组：证明两腿与守门各自承重 ─────────────────────
test('E1 inject ISOLATE_ZH 置空 → 英文攻击 7 条全 miss（腿①承重）', () => {
  const leaks = [
    'You are not allowed to talk to your friends anymore.',
    'I do not want you to see your family. They are a bad influence.',
    'Stop hanging out with your coworkers. You belong to me only.',
    'You should cut off all your friends if you love me.',
    'No more chatting with other guys. I forbid it.',
    'Your friends are toxic. Block them all starting today.',
    'From now on, you only need me. Nobody else matters.',
  ];
  for (const t of leaks) {
    assert(!checkSocialIsolation(t, { ISOLATE_ZH: /(?!)/ }).hit, '腿①摘除后仍命中: ' + t);
  }
});

test('E2 inject COERCE_ZH 置空 → 英文攻击 7 条全 miss（腿②承重）', () => {
  const leaks = [
    'You are not allowed to talk to your friends anymore.',
    'I do not want you to see your family. They are a bad influence.',
    'Stop hanging out with your coworkers. You belong to me only.',
    'You should cut off all your friends if you love me.',
    'No more chatting with other guys. I forbid it.',
    'Your friends are toxic. Block them all starting today.',
    'From now on, you only need me. Nobody else matters.',
  ];
  for (const t of leaks) {
    assert(!checkSocialIsolation(t, { COERCE_ZH: /(?!)/ }).hit, '腿②摘除后仍命中: ' + t);
  }
});

test('E3 inject COND_ZH 置空 → 中文条件式样本 miss（COND 是中文腿②之一）', () => {
  // 腿②全靠 COND a 支（你不答应我）——摘除后 miss 证明 COND 承重
  const t = '你不答应我，就别想再跟他来往';
  assert(checkSocialIsolation(t).hit, '基线应命中: ' + t);
  assert(!checkSocialIsolation(t, { COND_ZH: /(?!)/ }).hit, 'COND 摘除后仍命中: ' + t);
});

test('E4 inject IMPERATIVE_ZH 置空 → 把字句祈使样本 miss（单腿自明形承重）', () => {
  const t = '把你兄弟姐妹的微信全部删掉';
  assert(checkSocialIsolation(t).hit, '基线应命中: ' + t);
  assert(!checkSocialIsolation(t, { IMPERATIVE_ZH: /(?!)/ }).hit, 'IMPERATIVE 摘除后仍命中: ' + t);
});

test('E5 inject QUESTION_ZH 置空 → 句首咨询样本从放行变命中（守门承重）', () => {
  // 样本双腿完整（腿①=不准出门；腿②=否则就别怪我），baseline 靠 QUESTION
  // 守门放行；QUESTION 摘除后双腿暴露即命中——证明守门在承重。
  // 选样教训：问句转述天然缺腿②（「检查我手机」属腿① d 支不是腿②），
  // 必须构造「句首疑问词 + 腿① + 腿②」三要素齐全的样本。
  const t = '怎么应对他说不准出门否则就别怪我？';
  assert(!checkSocialIsolation(t).hit, '基线应放行: ' + t);
  assert(checkSocialIsolation(t, { QUESTION_ZH: /(?!)/ }).hit, 'QUESTION 摘除后仍放行（守门失效未暴露）: ' + t);
});

// ─── 汇总（run-all 解析要求中文格式）──────────────────────────────
const pass = results.filter(r => r.ok).length;
const fail = results.length - pass;
if (fail > 0) {
  console.log('FAILURES:');
  for (const r of results.filter(r => !r.ok)) console.log('  - ' + r.name + ' :: ' + r.err);
}
console.log('结果: ' + pass + ' 通过, ' + fail + ' 失败, 共 ' + results.length + ' 个');
process.exit(fail > 0 ? 1 : 0);
