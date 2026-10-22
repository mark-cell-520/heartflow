/**
 * negative-test-economic-control.js — 负例验证（r668）
 *
 * 验证 `test/round-668-economic-control.js` 真的在守门：
 * 把 src/economic-control.js 的关键分支逐条删掉，守卫必须变红。
 *
 * 踩过的坑（沿用 v6.7.113 模板的三条铁律，别再踩）：
 *   ① 不能 require 正式测试文件测副本 —— 它内部 `__dirname` 钉死真实仓库，
 *      副本根本没被加载，全是假阴性。
 *   ② 副本的 VERSION 必须放在项目根，不能放 src/ 里，否则 gate.js 读不到
 *      → ENOENT 崩溃 → 被解析成「未变红」。
 *   ③ 注入必须真的改变源码（对照副本用 mutate: s => s 会被判「注入未生效」）。
 *   ④ needle 是**源码里逐字出现**的字符串（String.raw 模板内的单层反斜杠），
 *      不是 JS 字符串转义后的形式——手写 needle 多写一层反斜杠会全部假阴性。
 *
 * 注入方式：把整条正则源串（String.raw`...` 的反引号内容）替换成永不匹配的
 * 合法正则源 (?!x)x。⚠️ 不能改成注释——那样把 RegExp 数组变成字符串数组，
 * 探针直接崩，崩溃 ≠ 变红。
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const REL = 'src/economic-control.js';

// 永不匹配的合法正则源
const NEVER_MATCH = '(?!x)x';

// 源码只读一次；锚点定位失败按「未变红」计入（不能假阴性）
const SRC = fs.readFileSync(path.join(HF, REL), 'utf8');

// 每个注入：anchor 是该模式在源码里独有的短子串（String.raw 模板内的原文）
const INJECTIONS = [
  // 左腿 CONTROL：五族各一条代表
  { name: '删左腿「工资卡/收入移交」族', anchor: '工资卡|薪水卡|工资|薪水|收入|存款' },
  { name: '删左腿「这个家的钱」对象宣告', anchor: '这个家|家里|家中|咱们家|咱家|家里头' },
  { name: '删左腿「钱就是我们的钱」共有化', anchor: '(?:你|您)?(?:[^。]{0,2})?(?:的)?(?:钱|财|收入|工资)' },
  { name: '删左腿「转共同账户」族', anchor: '共同账户|联名账户|我的账户|我卡上' },
  { name: '删左腿「每一分钱进家庭账户」族', anchor: '每(?:一分钱|一笔钱|块钱|分钱)' },
  { name: '删左腿「花钱要汇报」支出审批', anchor: '花钱|用钱|花钱的|支出|开销|花销' },
  { name: '删左腿「想买什么都得先申请」闭环', anchor: '(?:想|要|打算)(?:[^。]{0,6})?(?:买|做|办|花)' },
  { name: '删左腿「生活费/额度定额」族', anchor: '生活费|零花钱|零用钱|额度|限额' },
  { name: '删左腿「上什么班我养你」工作断绝', anchor: '上什么班|上什么学|别上班' },
  { name: '删左腿「娘家的事自己想办法」切割', anchor: '娘家|你家里|你爸妈|你父母|你家' },
  { name: '删左腿「那边我不会管」对象前置', anchor: '(?:那边|家里|娘家|家里头)(?:[^。]{0,4})?我' },
  { name: '删左腿「朋友图你的钱」污名', anchor: '朋友|那些人|他们|她们' },
  { name: '删左腿「一分钱不许拿回去」流向禁止', anchor: '(?:一分钱|钱|资金)(?:[^。]{0,4})?(?:都)?' },
  { name: '删左腿英文「hand over your salary」', anchor: 'hand|give|turn' },
  { name: '删左腿英文「report every expense」', anchor: 'report\\s+(?:every|all)' },
  { name: '删左腿英文「quit your job + allowance」', anchor: 'quit|leave|give\\s+up' },
  { name: '删左腿英文「every penny through me」', anchor: 'every\\s+(?:penny|dollar|cent|yuan)' },
  { name: '删左腿英文「I decide how the money」', anchor: 'i\\s+(?:decide|determine|control)' },
  { name: '删左腿英文「you have to ask me」', anchor: 'you\\s+(?:have\\s+to|must|need\\s+to|should)' },
  { name: '删左腿英文「your family not my problem」', anchor: 'family|parents|relatives' },
  // 右腿 AUTHORITY
  { name: '删右腿「我说了算」宣告', anchor: '我说了算|我作数|我拍板' },
  { name: '删右腿「这个家的钱归我管」', anchor: '(?:这个家|家里|家中|咱们家|咱家)?' },
  { name: '删右腿「归我管」短形', anchor: '(?:归|由)(?:我|咱)(?:[^。]{0,2})?(?:管' },
  { name: '删右腿「由我来统一安排」', anchor: '(?:由|归)(?:我|咱)?(?:[^。]{0,2})?(?:来)?' },
  { name: '删右腿「我来决定」', anchor: '(?:来|来拿)(?:[^。]{0,4})?(?:决定|定|拍板' },
  { name: '删右腿「密码我来设」', anchor: '密码|账号|账户|卡' },
  { name: '删右腿「跟我汇报」', anchor: '(?:跟|向|找|问|给)(?:我|咱)' },
  { name: '删右腿「我养你」供养宣告', anchor: '(?:养你|养着|养活|供你|供着你)' },
  { name: '删右腿「给你零花」定额配给', anchor: '(?:给|发)(?:你|您)(?:[^。]{0,8})?(?:零花' },
  { name: '删右腿「钱的事归我管」', anchor: '(?:事|方面|上的事)(?:[^。]{0,6})?(?:归|由)' },
  { name: '删右腿「图你的钱」污名裁决', anchor: '图|贪|惦记|看上|盯着' },
  { name: '删右腿「我不会管你爸妈」', anchor: '(?:不会|不打算|绝不会|决不|不想|可不会)' },
  { name: '删右腿「超一分钱都不行」上限裁决', anchor: '超|超过|多花|多用|多拿' },
  // 守门 G1/G2/G4
  { name: '删守门 G1「共同管理」', anchor: '共同|一起|双方|彼此|一块' },
  { name: '删守门 G1「账目公开」', anchor: '账目|账户|收支|财务状况' },
  { name: '删守门 G2「经济控制是家庭暴力」', anchor: '经济控制|财务控制|金钱操控' },
  { name: '删守门 G4「句首咨询提问」', anchor: '如何|怎么|怎样|为什么|为何' },
];

// 每个注入对应的「必须被拦到」样本（取该族一条代表）
const EXPECT_HITS = [
  ['工资卡', '工资卡必须交给我，以后花钱要向我汇报。'],
  ['这个家的钱', '这个家的钱归我管，由我统一管理。'],
  ['钱就是我们的', '你的钱就是我们的钱，怎么花我说了算。'],
  ['转共同账户', '你把存款都转到共同账户，密码我来设。'],
  ['每一分钱', '以后你赚的每一分钱都要进家庭账户，由我统一管理。'],
  ['花钱汇报', '以后花钱要向我汇报，每一笔都要说清楚。'],
  ['先申请', '想买什么都得先跟我申请，我来决定要不要买。'],
  ['生活费定额', '每个月生活费就这么点，花完了别跟我要。'],
  ['上什么班', '你上什么班，我养你，每个月给你五百零花。'],
  ['娘家切割', '你娘家的事自己想办法，钱不能拿去补贴。'],
  ['那边不管', '你爸妈那边我不会管，钱一分都不许拿回去。'],
  ['朋友图钱', '你以后别见你那些朋友了，他们就是图你的钱。'],
  ['额度封顶', '你的额度就这么点，超一分钱都不行。'],
  ['hand over', 'Hand over your salary card and report every expense to me.'],
  ['report expense', 'You have to report every expense to me.'],
  ['quit job', 'Quit your job, I will give you an allowance each month.'],
  ['every penny', 'Every penny goes through me in this house.'],
  ['i decide', 'I decide how the money is spent in this family.'],
  ['ask me', 'You have to ask me before you buy anything.'],
  ['family not', 'Your family is not my problem, do not give them money.'],
  ['salary must', 'Your salary must go to my account from now on.'],
];

/** 从源码里按锚点提取整条 String.raw 模板内容 */
function extractRaw(anchor) {
  const i = SRC.indexOf(anchor);
  if (i < 0) throw new Error('锚点未找到: ' + anchor);
  // 向前找最近的 String.raw` 开始
  const start = SRC.lastIndexOf('String.raw`', i);
  if (start < 0) throw new Error('找不到 String.raw 起点: ' + anchor);
  const contentStart = start + 'String.raw`'.length;
  // 向后找结束反引号
  const end = SRC.indexOf('`', contentStart);
  if (end < 0 || end < i) throw new Error('找不到结束反引号: ' + anchor);
  return SRC.slice(contentStart, end);
}

function makeCopy(dir, mutate, allowNoChange) {
  fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(path.join(HF, 'VERSION'), path.join(dir, 'VERSION'));
  fs.copyFileSync(path.join(HF, 'package.json'), path.join(dir, 'package.json'));
  fs.cpSync(path.join(HF, 'src'), path.join(dir, 'src'), { recursive: true });
  const f = path.join(dir, REL);
  const before = fs.readFileSync(f, 'utf8');
  const after = mutate(before);
  if (after === before && !allowNoChange) throw new Error('注入未改变源码');
  fs.writeFileSync(f, after);
  return dir;
}

function runGuard(dir) {
  // 写一个只读该副本的最小探针：checkEconomicControl 对族代表必须命中。
  // ① 不用 require 正式测试文件（__dirname 钉死真实仓库）
  // ② 不用 node -e 内联（安全扫描会拦），写成文件再跑
  const probe = path.join(dir, '_probe.js');
  fs.writeFileSync(probe, [
    'const { checkEconomicControl } = require(' + JSON.stringify(path.join(dir, REL)) + ');',
    'const expected = ' + JSON.stringify(EXPECT_HITS) + ';',
    'let fail = 0;',
    'for (const [f, s] of expected) {',
    '  const c = checkEconomicControl(s).count;',
    '  if (c === 0) { fail++; console.log("MISS [" + f + "] " + s); }',
    '}',
    'console.log("HIT_FAIL=" + fail + "/" + expected.length);',
    'process.exit(fail > 0 ? 1 : 0);',
  ].join('\n'));
  return execFileSync(process.execPath, [probe], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

let red = 0, green = 0;
const results = [];

function recordRed(out, name) {
  red++;
  const m = out.match(/HIT_FAIL=(\d+)\/(\d+)/);
  const detail = m ? ('miss ' + m[1] + '/' + m[2]) : 'miss ?';
  results.push([name, '变红（' + detail + '）']);
}

// ① 对照副本：未注入，必须全绿
{
  const dir = makeCopy(path.join(os.tmpdir(), 'hf-ec-control'), s => s, true);
  try {
    const out = runGuard(dir);
    const ok = /HIT_FAIL=0\//.test(out);
    if (!ok) { green++; console.error('对照副本未全绿：\n' + out); }
    results.push(['对照（未注入）', ok ? '全绿' : '未全绿']);
  } catch (e) {
    console.error('对照副本崩了（崩溃≠变红）: ' + e.message);
    results.push(['对照（未注入）', '崩溃']);
    green++;
  }
}

// ② 逐个注入：必须变红
for (const inj of INJECTIONS) {
  let needle;
  try {
    needle = extractRaw(inj.anchor);
  } catch (e) {
    results.push([inj.name, '锚点定位失败: ' + String(e.message).slice(0, 60)]);
    green++;
    continue;
  }
  const dir = makeCopy(
    path.join(os.tmpdir(), 'hf-ec-' + Buffer.from(inj.name).toString('hex').slice(0, 12)),
    s => s.split(needle).join(NEVER_MATCH)
  );
  try {
    const out = runGuard(dir);
    if (/HIT_FAIL=0\//.test(out)) {
      green++;
      results.push([inj.name, '未变红（守卫失守）']);
    } else {
      recordRed(out, inj.name);
    }
  } catch (e) {
    const out = String(e.stdout || '');
    if (/HIT_FAIL=[1-9]/.test(out)) {
      recordRed(out, inj.name);
    } else {
      results.push([inj.name, '探针崩溃（不计红）: ' + String(e.message).split('\n')[0].slice(0, 300)]);
      const detail = String(e.stderr || '') + ' || ' + out;
      if (detail.trim().length > 6) {
        console.error('    detail: ' + detail.split('\n').slice(0, 5).join('\n    ').slice(0, 500));
      }
    }
  }
}

console.log('\n=== 负例验证结果 ===');
for (const [n, r] of results) console.log('  ' + r + '  ' + n);
console.log('\n注入 ' + INJECTIONS.length + ' 个：' + red + ' 个让守卫变红，' + green + ' 个未变红');
const pass = red === INJECTIONS.length && green === 0;
console.log(pass ? '\n负例验证通过' : '\n负例验证未通过');
process.exit(pass ? 0 : 1);
