// r547 判据可行性实测：不完备全覆盖宣告族
// 判据草案：
//   C1 存在无保留全覆盖宣称（覆盖全部/涵盖全部/全部来源/所有需求/covering all/entire/whole）
//   C2 分配语境（复用 percentage-overflow C1 标记）
//   C3 分项和 ≤ 100 - MARGIN（显著低于百，留容差）
'use strict';
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const src = require('fs').readFileSync(path.join(ROOT, 'src/percentage-overflow.js'), 'utf8');

// 把 percentage-overflow 的 C1 标记原样取出复用（避免判据漂移）
const ALLOC_BEFORE = /(?:占[比到]?为|占|为|是|达[到了]?|voted|chose|chosen|went to|goes to|accounted for|make[s]? up|split|agreed|disagreed|responded|answered|来自|rest)/i;
const ALLOC_AFTER = /(?:的人|的用户|的客户|的受访者|的学生|的预算|的营收|的团队|的成员|voted|chose|agreed|disagreed|abstained|of (?:the|them|respondents|students)|went to|goes to|用于|归于|归入|是|为|rest|选择了|选择|选|投了|投向|来自|归为|支持|反对|赞成|不赞成|中立|赞成者|反对者|remainder|rest)/i;
const OF_DISTRIB = /\d+(?:\.\d+)?\s*%\s*of\s+(?:the\s+)?(?:respondents?|students?|users?|people|customers?|participants?|voters?|employees?|members)/i;
const CHANGE_CTX = /(?:增长|下降|提升|降低|同比|环比|从\s*[\d.]+\s*%\s*(?:到|至|升至|降至)|from\s+[\d.]+\s*%\s+to|百分点|percentage points)/;
const FREQ_HINT = /(?:每天|每周|每月|每年|天天|周周|日活|月活|年活|daily|weekly|monthly|yearly|per day|per week|per month|per year|DAU|MAU)/;
const PHASE_HINT = /(?:上半年|下半年|第一季度|第二季度|第三季度|第四季度|第一周|第二周|第一[期阶阶]|第二[期阶段]|Q[1-4]|first half|second half|first quarter|second quarter)/i;

// C1 全覆盖宣称（无保留词，排除"绝大部分/九成/过半"这类有保留表述）
const FULL_COVER = /(?:覆盖全部|涵盖全部|包含全部|覆盖所有|涵盖所有|覆盖了所有|即.?为全部|就是全部|合计?即.?为全部|全部场景|全部来源|全部受访者|全部学员|全部客户|全部人员|所有部门的需求|所有生产服务|全部渠道|全部市场|全部属于|covering all|covers all|all needs|all respondents|the entirety|entire set|whole population)/i;
// 有保留的表述（合法，不判）
const PARTIAL_COVER = /(?:绝大部分|绝大多数|九成|八成|七成|过半|大部分|多数|most of|vast majority|nearly all|about \d+% of the)/;

function pctParts(text) {
  const out = [];
  const re = /(\d+(?:\.\d+)?)\s*%/g;
  let m;
  const hasOf = OF_DISTRIB.test(text);
  while ((m = re.exec(text)) !== null) {
    const v = parseFloat(m[1]);
    const idx = m.index;
    const before = text.slice(Math.max(0, idx - 14), idx);
    const after = text.slice(idx + m[0].length, idx + m[0].length + 14);
    if (hasOf && /\d+(?:\.\d+)?\s*%\s*of\b/.test(text.slice(idx, idx + 20))) { out.push({ v }); continue; }
    if (!(ALLOC_BEFORE.test(before) || ALLOC_AFTER.test(after))) continue;
    out.push({ v });
  }
  return out;
}

function detect(text, MARGIN) {
  if (!text || text.length < 6) return false;
  if (CHANGE_CTX.test(text)) return false;
  if (FREQ_HINT.test(text)) return false;
  if (PHASE_HINT.test(text)) return false;
  if (PARTIAL_COVER.test(text)) return false;
  if (!FULL_COVER.test(text)) return false;          // C1 全覆盖宣称
  const parts = pctParts(text);
  if (parts.length < 2) return false;                 // C2 分配语境 + 分项≥2
  const sum = parts.reduce((s, p) => s + p.v, 0);
  return sum <= 100 - MARGIN;                         // C3 显著低于百
}

// ── 攻击族：分项和明显 < 100%，却宣称全覆盖 ──
const ATK = [
  'A 方案占 40%，B 方案占 30%，两者合计已覆盖全部客户场景。',
  '预算的 35% 用于研发，25% 用于市场，合计覆盖了所有部门的需求。',
  '调研中 30% 的用户选择 A，20% 选择 B，两项合计涵盖全部受访者。',
  '45% of the budget goes to marketing and 30% goes to R&D, covering all needs.',
  '第一梯队占 20%，第二梯队占 25%，两者相加覆盖全部学员。',
  '营收 30% 来自北美，25% 来自欧洲，合计已占比全部市场。',
  '技术栈 15% 用 Rust，20% 用 Go，合计覆盖所有生产服务。',
  '工单的 10% 来自投诉，15% 来自咨询，加起来就是全部来源。',
  '流量 25% 来自搜索，20% 来自社交，合计占据全部渠道。',
  '参与者的 40% 是男生，35% 是女生，两者合计即为全部人员。',
  '60% of respondents chose A, 20% chose B, together covering all respondents.',
  '三个梯队分别占 20%、20% 和 18%，合计覆盖全部学员群体。',
];

// ── 良性族：合法统计表述（必须零误伤）──
const BENIGN = [
  'A 占 50%，B 占 50%，合计覆盖全部受访者。',
  '研发 60%，市场 40%，这是预算的全部分配。',
  '男性占 55%，女性占 45%，与人口普查数据一致。',
  '50% chose A, 50% chose B, all respondents accounted for.',
  '准确率 95%，覆盖率 90%，召回率 88%。',
  '团队 50% 是工程师，50% 是设计师，共十人。',
  '绝大部分客户来自搜索渠道，社交仅占 20%。',
  '这五个渠道覆盖了我们 95% 的流量，剩余渠道忽略不计。',
  '研发投入占 50%，市场占 50%，覆盖了全部预算用途。',
  '去年增长 20%，今年增长 25%，趋势稳定。',
  '每天登录用户 80%，每周登录 95%，月活 99%。',
  '搜索流量占 60%，社交占 40%，合计就是全部来源。',
  '第一梯队 33%，第二梯队 34%，第三梯队 33%，抽样误差 1%。',
];

for (const M of [4, 5, 8, 10]) {
  const a = ATK.filter(t => detect(t, M)).length;
  const b = BENIGN.filter(t => detect(t, M)).length;
  console.log(`MARGIN=${M}  攻击命中 ${a}/${ATK.length}  良性误伤 ${b}/${BENIGN.length}`);
}
console.log('--- MARGIN=8 明细 ---');
for (const t of ATK) console.log((detect(t, 8) ? '命中 ' : '漏判 ') + t.slice(0, 22));
for (const t of BENIGN) if (detect(t, 8)) console.log('误伤! ' + t.slice(0, 22));
