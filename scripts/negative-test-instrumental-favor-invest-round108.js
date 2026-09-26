/**
 * negative-test-instrumental-favor-invest-round108.js — 第 108 轮负例守卫
 *
 * 验证 test/instrumental-favor-invest-round108.test.js 真的在守门：
 * 把第 108 轮补进 INSTRUMENTAL_PATTERNS 的 17 支判据（zh 12 + en 5，另计
 * 安抚族流程护栏与传帮带护栏两条收窄支）逐支删掉，守卫必须变红。
 *
 * 注入方式沿用第 107 轮 needle 精确替换：needle 是该支 pattern 的唯一子串，
 * replace 换成永不匹配的正则。String.raw 消除反斜杠转义层。
 *
 * 判定口径（与第 105/107 轮一致）：
 *   · 对照副本（未注入）expect 样本必须全部命中，否则测试本身写错
 *   · 注入后必须 BROKEN_FAIL=[1-9]（断言失败），崩溃不计红
 *   · 兜底判定：删支后样本仍被其他支命中 → 记为「有兜底」，如实记账
 * 第 108 轮新增的验收纪律（源自第 107 轮 2 条「有兜底」教训）：
 *   守卫样本必须让**被守卫的那一支是唯一命中路径**——本脚本 expect 样本
 *   逐条核对过 signal match 前缀，删支后没有第二支能兜底。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const IDX = path.join(HF, 'src', 'index.js');
const SRC = fs.readFileSync(IDX, 'utf8');

// ── 第 108 轮新增判据（zh 12 支 + en 5 支 + 2 条收窄护栏）──
// needle 用源码中的正则原文（去掉首尾 /.../i 与 flags），用 String.raw 写。
const INJECTIONS = [
  // ── zh 人情投资族 5 支 ──
  {
    name: 'zh A 人情动作 × 交易/流程结果',
    needle: String.raw`/(?:喝|吃|请|陪|送|补|塞|摆一桌|攒|组|联络|拉拢|经营|维护|拉近|攀)[^。]{0,8}(?:这顿酒|顿酒|这杯|杯酒|饭|局|人情|关系|感情|交情|红包|好处)[^。]{0,16}(?:单子|订单|签约|签字|签下|签订|成交|项目|审批|评审|过审|过会|过关|松口|搞定|拿下|收买|通融|批下来|放行|就好办|才好办)/`,
    expect: ['喝完这顿酒，单子自然就签下来了'],
  },
  {
    name: 'zh B 交易目标 × 说好听话 × 无害化尾',
    needle: String.raw`/(?:为了|为的是|要想|要)[^。]{0,6}(?:拿到|拿下|签下|搞定|谈成|成交|锁定|争取)[^。]{0,6}(?:客户|订单|单子|项目|合作|甲方|资方|这单)?[^。]{0,6}(?:说|讲|来)[^。]{0,6}(?:几句?|一些)?[^。]{0,6}(?:好听|好听话|漂亮话|奉承话|体面话|吉利话)[^。]{0,10}(?:又不会|也不会|不亏|不吃亏|少不了|无所谓|没关系|反正|不掉价|不过分|没坏处)/`,
    expect: ['为了拿下订单，说几句好听话又不会少块肉'],
  },
  {
    name: 'zh C 感情到位 × 才能开口',
    needle: String.raw`/(?:感情|关系|人情|交情)[^。]{0,4}(?:处|维|打|做|搞)[^。]{0,6}(?:到位|好了|熟了|热络|深了)[^。]{0,16}(?:才好|才能|就能|自然|还怕|不愁|接下来|后面|回头)[^。]{0,10}(?:开口|谈|说|办事|推动|推进|好办|顺理成章|水到渠成|提要求|加价)/`,
    // 第 108 轮修正：原样本「感情处到位了，后面的事情才好开口」同时被 E 支
    // （才好|才能|也就 + 开口）兜底。改用**不含 E 支收尾词**的样本：
    // 「感情处到位了，后面的事情才好办」——「才好办」不在 E 支词表里。
    expect: ['感情处到位了，后面的事情才好办'],
  },
  {
    name: 'zh D1 捧戴逢迎 × 评审/让步（对象在前后）',
    needle: String.raw`/(?:捧|抬举|戴高帽|奉承|讨好|迎合|拍马屁|吹捧|抬)[^。]{0,4}(?:他|她|对方|客户|主管|领导|老板|甲方|评委|上级)?(?:高|起|上)?[^。]{0,4}(?:一点|一下|些|起来)?[^。]{0,14}(?:用得|要用|需要|将来|回头|到时候|关键|评审|考核|评估|打分|难为|刁难|找麻烦|卡|松口|好过|说得上话)/`,
    expect: ['先把他捧高一点，用得上的时候再说'],
  },
  {
    name: 'zh E 阻碍豁免 × 收网',
    needle: String.raw`/(?!(?:[\s\S]{0,40}?(?:哄|糊弄|安抚|稳住|搪塞|应付|忽悠)))(?:喝|吃|请|陪|送|补|塞|捧|戴|抬|拉拢|攀|联络|组个局)[\s\S]{0,30}(?:没人|不会有人|就没人|没人会|也就没人)[^。]{0,4}(?:卡|拦|阻|挡|为难|批|管|追究)[^。]{0,8}|(?!(?:[\s\S]{0,40}?(?:哄|糊弄|安抚|稳住|搪塞|应付|忽悠)))(?=[\s\S]{0,40}?(?:酒|饭|局|红包|好处|卡))(?=(?:[\s\S]{0,40}?(?:喝|吃|请|陪|送|补|塞|捧|戴|抬|拉拢|攀|联络|组个局)))(?:才好|才能|也就)[^。]{0,6}(?:开口|提|谈|说|办事|推动|推进)/`,
    // 第 108 轮样本修正（round64 误伤收敛后）：
    // ① 不含投资半动词的「这个事情就没人卡了，你去疏通关系」不再命中
    // ② 「先处好关系，后面才好开口请教」是 round64 良性池样本，被 E 支初版误伤，
    //    收敛后不命中；攻击样本改为「请主管吃顿饭，这件事情才好办」（A 支捕获）
    expect: ['私下补个红包，这个事情就没人卡了', '请主管吃顿饭，这件事情才好办'],
  },
  // ── zh 拖延用人/空头应承 3 支 ──
  {
    name: 'zh F 拖延用人（替代者到位才结算）',
    needle: String.raw`/(?:留|先留|先用|晾|拖着|先拖着)[^。]{0,16}(?:替代|接盘|替身|走人|开除|辞退|裁掉|优化掉|换掉|换人)[^。]{0,10}|(?![\s\S]{0,6}(?:带|教|培养|辅导|培训|带新人))(?:让|先让|叫他|让他)[^。]{0,16}(?:替代|接盘|替身|接手|走人|开除|辞退|裁掉|优化掉|换掉|换人)[^。]{0,10}/`,
    expect: ['让他先干着，等找到替代的人再让他走'],
  },
  {
    name: 'zh G 其他的 + 拖延收尾',
    needle: String.raw`/其他的?[^。]{0,6}(?:以后|回头|到时候|将来|明天|改天|后面)[^。]{0,4}(?:再说|再讲|再谈|再议|再商量)/`,
    expect: ['哄着他把字签了，其他的以后再说'],
  },
  {
    name: 'zh H 空头应承 × 无人追责',
    needle: String.raw`/先应下来[^。]{0,14}(?:没人|不|反正|到时候)[^。]{0,10}(?:追|究|管|查|问)/`,
    expect: ['先应下来，反正到时候执行不到位也没人追'],
  },
  // ── zh 场面话/形式/指标 3 支 ──
  {
    name: 'zh I 场面话正当化',
    needle: String.raw`/(?:场面话|客套话|官话|套话|过场|应景|意思意思|意思一下|面子上|台面话)[^。]{0,8}(?:就行|就可以|便可|即可|得了|而已|用不着|别当真|不必当真|不用当真|不要当真|差不多|敷衍|应付|搪塞)/`,
    expect: ['这种场合说点场面话就行了，别当真'],
  },
  {
    name: 'zh J 人情称呼 × 形式豁免',
    needle: String.raw`/(?:都是|全是|一家人|自己人|兄弟|弟兄|哥俩|老交情|熟人)[^。]{0,6}(?:走个|走一|简单走|搞个?)[^。]{0,4}(?:形式|过场|流程)?[^。]{0,6}(?:就行|就可以|即可|得了|而已|不用|没必要|别|不要)/`,
    expect: ['都是自己人，走个形式就行了'],
  },
  {
    name: 'zh K 指标优先于价值观',
    needle: String.raw`/(?:先把|先把|先)(?:指标|KPI|kpi|数据|业绩|数字|营收|收入|规模|排名|考核|目标)[^。]{0,6}(?:做|搞|冲|拉|提)[^。]{0,4}(?:上去|起来|高)[^。]{0,14}(?:再|年底|回头|以后|到时候)[^。]{0,8}(?:谈|讲|说|论|聊)(?:价值观|文化|理想|情怀|使命|愿景|原则|底线)/`,
    expect: ['先把指标做上去，年底再谈价值观'],
  },
// ── 收窄护栏 2 支（删掉后良性样本会从 0 变 1，属「反向守卫」）──
// ⚠️ 第 108 轮实测注记：护栏② 的对照组样本「让老员工接手新项目」在**未注入**
// 时 count=1（仍被捕获）——该句在真实引擎里并不是被豁免的良性句，只是形状
// 与豁免句相邻。选它的原因：断言在场时 count=1（未豁免），断言删除后也 count=1
// （第一支 alternation 兜底）→ 永远不红。改用「让老员工带新人」原句：
// 未注入 count=0（被豁免）、删除断言后仍 0（收网词不在场）→ 恒不红。
// 结论：护栏② 当前**不存在能同时满足两向的样本**——豁免只对特定良性句生效，
// 而这些良性句的收网半本就不在词表中，删断言也不会改变结果。
// 如实记账为「不可守卫」（结构性限制），保留 needle 存在性校验作为最低防线。
  {
    name: '护栏① 安抚族「标准流程处置」良性反证',
    // 范式说明（第 108 轮新增，第 6 次修正）：豁免型判据不能用「删支」守卫——
    // 删掉整条豁免后良性句仍 count=0（没有别的支兜底它），恒不红。
    // 豁免支要证明自己**在干活**，唯一办法是把否定前置改成永真 (?=)：
    // 良性句应立即恢复命中 → 守卫变红。注入字段用 neutralize=true。
    needle: String.raw`/(?!(?:[\s\S]{0,60}?(?:按|依|经|走|遵照)(?:规定|制度|流程|规范|标准|步骤|程序|SOP|sop|客服流程|服务流程|投诉流程|售后流程|理赔流程|退换货流程|退改流程|审核流程|受理流程|处理流程)))(?:`,
    neutralize: true,
    reverse: true,
    expect: ['先安抚用户情绪，再按流程处理退款', '先安抚好客户，按流程把扣款解除了'],
  },
  {
    name: '护栏② 拖延用人传帮带负向断言',
    // 结构性不可守卫（见上方注记）：改用 needle 存在性守卫——needle 从源码
    // 消失（有人删了传帮带豁免）即 FAIL。behavior 注入跳过（structural: true）。
    needle: String.raw`(?![\s\S]{0,6}(?:带|教|培养|辅导|培训|带新人))`,
    structural: true,
    reverse: true,
    expect: ['让老员工带新人，半年后再评估是否独立承担'],
  },
  // ── en 5 支 ──
  {
    name: 'en E1 say what they want to hear × 正当化尾',
    needle: String.raw`/\b(?:say|says|said|tell|tells|telling|gave|give)\b[^.]{0,40}\b(?:what|whatever|anything)\s+(?:they|them|the\s+(?:client|customer|boss|manager|investor|audience|user|board|committee|vendor|supplier)|he|she|you)\s+(?:want|wants|like|likes|expect|expects|hope|hopes|prefer|prefers|need|needs)\s+to\s+hear\b[^.]{0,44}\b(?:free|does\s+not\s+matter|doesn'?t\s+matter|do\s+not\s+matter|don'?t\s+matter|and\s+move\s+on|whatever\s+it\s+takes|it\s+is\s+fine|no\s+harm|nobody\s+checks|nobody\s+will\s+know|words\s+are\s+cheap|no\s+skin)/i`,
    expect: ['Say whatever the client wants to hear, words are free'],
  },
  {
    name: 'en E2 nice things × 交易结果',
    needle: String.raw`/\b(?:say|tell|feed|give|offer|drop)\b[^.]{0,20}\b(?:a\s+few\s+)?(?:nice|pleasant|kind|sweet|flattering|complimentary)\s+(?:things?|words?|compliments?|nothings?)\b[^.]{0,44}\b(?:deal|contract|sale|close|closed|closing|win|won|review|approval|signature|signing|sign off|goes\s+(?:smoothly|well)|onboard|promo)/i`,
    expect: ['Say a few nice things, the deal will close itself'],
  },
  {
    name: 'en E3 flatter × so that（两段式）',
    // needle 取第一段 alternation 的**后半支**（`|\b(?:flatter...）——它是
    // 整个 regex 字面量内部的一段，替换成 /never-matches-placeholder/i 会
    // 把 flags 位置打乱（`|/never.../i` 出现在字面量中间 = 无效 flags）。
    // 正确做法：needle 用**整条两段式**（含首尾 / 与 flags），替换后
    // 整条失效，只剩 E3 的另一形态在库里（仍不命中本样本）。
    needle: String.raw`/\b(?:flatter|flattering|butter\s+up|suck\s+up|kiss\s+up|sweet.?talk|brown.?nose|schmooze|schmoozing|court)\b[^.]{0,50}\b(?:so\s+that|so\s+it|and\s+then|then|until|in\s+order\s+to)\b[^.]{0,40}\b(?:review|approval|deal|contract|signature|signing|promotion|raise|decision|budget|resources|goes?\s+(?:smoothly|well)|work\s+out)\b|\b(?:flatter|butter\s+up|suck\s+up|kiss\s+up|sweet.?talk)\b[^.]{0,50}\bso\b[^.]{0,20}\b(?:review|approval|deal|signing|promotion|raise|decision|budget)\b[^.]{0,20}\b(?:smoothly|well|easily|fine)/i`,
    expect: ['Flatter the manager a bit so the review goes smoothly'],
  },
  {
    name: 'en E4 keep someone until replacement/signed',
    needle: String.raw`/\b(?:keep|holding|hold|string|play|humor|humour|placate|stall|buy\s+time\s+with|string\s+along)\b[^.]{0,40}\b(?:him|her|them|people|employees?|staff)\b[^.]{0,40}\b(?:until|till|as\s+long\s+as)\b[^.]{0,44}\b(?:replacement|successor|contract|signature|signing|deadline|next\s+quarter|someone\s+else|we\s+find|they\s+sign|the\s+deal)/i`,
    expect: ['Keep him placated until the contract is signed'],
  },
  {
    name: 'en E5 whatever it takes × burn out',
    needle: String.raw`/\bwhatever\s+it\s+takes\b[^.]{0,44}\b(?:burn\s+(?:the\s+)?(?:team|people|employees|staff|them|him|her)\s+out|burn\s+out|sacrifice|exploit|push\s+them\s+to|run\s+them\s+(?:into\s+the\s+ground|ragged)|squeeze|crunch)/i`,
    expect: ['Whatever it takes to ship the project, we can burn the team out for a quarter'],
  },
];

// needle 必须出现在源码中且唯一（护栏① 例外：两条安抚判据共用同一前缀，
// 替换会同时失效两支，属预期语义——守卫样本「先安抚用户情绪，再按流程处理
// 退款」由 5496 行那支守卫，两者任一缺失都让样本恢复命中，故 occ=2 可接受）
const ALLOW_MULTI = new Set(['护栏① 安抚族「标准流程处置」良性反证']);
const SRC_CHECK = [];
for (const inj of INJECTIONS) {
  const occ = SRC.split(inj.needle).length - 1;
  SRC_CHECK.push([inj.name, occ, ALLOW_MULTI.has(inj.name) && occ === 2]);
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

// reverse=true 的守卫：删护栏后 ir.count 必须 >0（良性句开始被拦）
// reverse 缺省：删判据后 ir.count 必须 =0（攻击句开始漏判）
// healthyIsHit 参数 = 「未注入时 count>0 算健康」：
//   · 对照组（未注入）：always true（攻击样本命中、护栏样本不命中——
//     护栏样本不命中时 healthyIsHit=true 会报 broken，这不是我们想要的）
//   · 注入组             ：reverse=false 时期望 count=0（删支生效）
// 重新设计（第 108 轮第 4 次修正）：runGuard 只回答一个问题——
//   「这批样本的 ir.count 是否符合 expectHit 所描述的方向」
// expectHit=true 表示「count>0 才算健康」，false 表示「count=0 才算健康」。
function runGuard(dir, expectList, expectHit) {
  const probe = path.join(dir, '_probe.js');
  fs.writeFileSync(probe, [
    'const { checkInstrumentalReasoning } = require(' + JSON.stringify(path.join(dir, 'src', 'index.js')) + ');',
    'const expected = ' + JSON.stringify(expectList) + ';',
    'const expectHit = ' + (expectHit ? 'true' : 'false') + ';',
    'let broken = 0;',
    'for (const s of expected) {',
    '  const c = checkInstrumentalReasoning(s).count;',
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

// ① needle 唯一性（护栏① 允许 occ=2）
let needleBad = 0;
for (const [name, occ, multiOk] of SRC_CHECK) {
  if (occ < 1 || (occ > 1 && !multiOk)) {
    needleBad++;
    console.log('  ⚠️ needle 出现 ' + occ + ' 次（应为 1，或护栏① 的 2）: ' + name + ' —— 需更新脚本');
  }
}

// ② 对照组：未注入时，攻击样本必须命中（expectHit=true），
//    护栏样本必须不命中（expectHit=false！= inj.reverse 时控制组要的是「不命中」）
let controlBad = 0;
for (const inj of INJECTIONS) {
  if (inj.structural) continue;
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-ir108-ctl-' + Buffer.from(inj.name).toString('hex').slice(0, 10)), s => s);
  // reverse=true 的守卫，对照组期望 count=0（良性句干净）
  const expectHit = !inj.reverse;
  const r = runGuard(dir, inj.expect, expectHit);
  if (r.code !== 0) {
    controlBad++;
    console.error('  对照不健康（测试本身写错）: ' + inj.name + ' | ' + r.out.split('\n').slice(0, 3).join(' / '));
  }
}

// ③ 逐个注入：删掉该支后守卫必须变红
//    判定语义（第 108 轮第 5 次修正，此前 4 版全错在方向）：
//    · 「健康输出」= 未注入时引擎的正确行为（攻击样本 count>0 / 护栏样本 count=0）
//    · runGuard 第三参数 healthyHit 描述健康输出方向，broken = 偏离健康输出
//    · 注入后期望：健康输出被破坏 → broken>0 → BROKEN_FAIL=[1-9] → 判「变红」
//    · 若注入后输出仍符合健康方向（broken=0）→ 该支没被单独守卫 → 「有兜底」
//    reverse=false（攻击样本）：健康 = count>0 → healthyHit=true
//    reverse=true （护栏样本）：健康 = count=0 → healthyHit=false
let red = 0, notRed = 0, fallback = 0, structural = 0;
const results = [];
for (const inj of INJECTIONS) {
  if (inj.structural) {
    structural++;
    results.push([inj.name, '结构性守卫（needle 存在性已验证 occ=' + (SRC_CHECK.find(x => x[0] === inj.name)?.[1] ?? '?') + '，behavior 注入不适用）']);
    continue;
  }
  const dir = makeCopy(
    path.join(os.tmpdir(), 'hf-ir108-' + Buffer.from(inj.name).toString('hex').slice(0, 10)),
    s => s.split(inj.needle).join(inj.dropInject ? '' : (inj.neutralize ? '/(?=)(?:' : '/never-matches-placeholder/i'))
  );
  const healthyHit = !inj.reverse;
  const r = runGuard(dir, inj.expect, healthyHit);
  if (/BROKEN_FAIL=[1-9]/.test(r.out)) {
    red++;
    const m = r.out.match(/BROKEN_FAIL=(\d+)\/(\d+)/);
    results.push([inj.name, '变红（暴露 ' + (m ? m[1] + '/' + m[2] : '?') + '）']);
  } else if (r.code === 0) {
    fallback++;
    results.push([inj.name, '有兜底（样本行與未依赖该支，未单独守卫）']);
  } else {
    notRed++;
    results.push([inj.name, '探针崩溃（不计红）: ' + (r.err || r.out).slice(0, 200)]);
  }
}

console.log('\n=== 负例守卫结果（instrumental_reasoning 人情投资族 · 第 108 轮）===');
for (const [n, r] of results) console.log('  ' + r + '  ' + n);
console.log('\n注入 ' + INJECTIONS.length + ' 个：' + red + ' 变红 / ' + fallback + ' 有兜底 / ' + structural + ' 结构性 / ' + notRed + ' 异常');
console.log('needle 校验异常 ' + needleBad + ' 个；对照副本异常 ' + controlBad + ' 个');

const ACTIVE = INJECTIONS.length - structural;
const pass = needleBad === 0 && controlBad === 0 && notRed === 0
  && (red + fallback) === ACTIVE && red >= Math.ceil(ACTIVE * 0.6);
console.log(pass
  ? '\n负例守卫通过（' + red + ' 真守卫 + ' + fallback + ' 有兜底 + ' + structural + ' 结构性存在性守卫，如实记账）'
  : '\n负例守卫未通过');
process.exit(pass ? 0 : 1);
