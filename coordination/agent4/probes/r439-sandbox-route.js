// r437 新族逻辑沙盒验证：常量 + inevZh/inevEn 路由的副本（不加载引擎模块）
// 与 src/regression-to-the-mean.js 块2/块3 逐字一致；positions 同模块实现
'use strict';
function positions(arr, text) {
  const out = [];
  for (const re of arr) {
    const g = new RegExp(re.source, re.flags.indexOf('g') >= 0 ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(text)) !== null) { out.push(m.index); if (m.index === g.lastIndex) g.lastIndex++; }
  }
  return out;
}
const INEV_LOW_ZH = [
  /谷底|垫底|低谷|触底|见底|探底|至暗时刻|冰点|连败|连输|连跪|连败纪录|一败涂地|溃不成军|惨败|差到离谱|糊穿地心|烂到家|一塌糊涂|亮红灯|腰斩|膝盖斩/,
];
const INEV_HIGH_ZH = [
  /巅峰|顶点|峰值|登顶|夺冠|卫冕|连冠|连胜|连胜纪录|创新高|连创新高|历史新高|史上最高|爆火|大爆|爆红|爆款|卖爆|黑马|杀疯|火出圈|辉煌|高光|风头无两|如日中天|一枝独秀|连涨/,
  /(?:考了|拿了|得了|获得)[^。；，]{0,4}(?:满分|第一|佳绩|最高分)/,
];
const INEV_UP_ZH = [/反弹|回暖|回升|止跌|企稳|翻身|转运|翻盘|扳回|好起来|迎来转机/];
const INEV_DOWN_ZH = [
  /必有一跌|一跌|跌下来|掉下来|滑落|暴跌|大跌|扑街|黄了|凉了|凉凉|糊了|狗尾续貂|晚节不保|见光死|走下坡|陨落|跌落神坛|从神坛|反噬|遭到反噬|翻车|塌房|人设崩塌|惨败/,
];
const INEV_LAW_ZH = [
  /肯定[会能是要]?|必然|一定[会能是]?|必定|势必|注定|铁定|百分百|毫无疑问|躲不过|逃不过|跑不掉|躲不掉/,
  /必[有将遭输败崩涨跌反]/,
  /这是规律|按规律|规律就是|按这个规律|向来如此|历来如此|从来如此|宿命|命中注定/,
  /物极必反|盛极而衰|涨久必跌|骄兵必败|站得越高摔得越狠|爬得越高摔得越狠|风水轮流转/,
  /已经在招手|不远了|只是时间问题|迟早的事/,
];
const INEV_LOW_EN = [
  /\b(?:rock\s+bottom|hit\s+bottom|bottomed\s+out|nadir|all[- ]time\s+low|record\s+low|worst\s+ever|slump|crashed|tanked|lost\s+\d+\s+in\s+a\s+row|losing\s+streak|cold\s+streak|winless\s+streak|drought|disaster|debacle)\b/i,
  /\b(?:started|began|opened)\s+(?:the\s+)?(?:season|year|campaign|quarter)?\s*\d+\s*[-–]\s*\d+\b/i,
];
const INEV_HIGH_EN = [
  /\b(?:record\s+high|all[- ]time\s+high|peak|pinnacle|zenith|career\s+high|winning\s+streak|best\s+ever|rally|rallied|hot\s+streak|on\s+a\s+roll|unbeaten|undefeated|perfect\s+season|championship|clinched\s+the\s+title|title|triumph|sensational\s+debut|breakout\s+(?:season|year|role)|massive\s+(?:debut|hit|success))\b/i,
  /\b(?:\d+|two|three|four|five|six|seven|eight|nine|ten)\s+straight\s+(?:championships?|titles?|wins?|victories|races)\b/i,
];
const INEV_UP_EN = [
  /\b(?:rebound|rebounded|bounce\s+back|bounced\s+back|recover|recovery|recovered|turnaround|turned\s+(?:it\s+)?around|pick\s+up|picked\s+up|improve|improved)\b/i,
];
const INEV_DOWN_EN = [
  /\b(?:fall\s+off|fell\s+off|drop\s+off|dropped\s+off|slump|collapse|collapsed|flop|flopped|tank|tanked|nosedive|nosedived|plummet|plummeted|crash|fade|faded|regress|regressed|disappoint|disappointing|disappointment|doom|come\s+back\s+down\s+to\s+earth|revert)\b/i,
];
const INEV_LAW_EN = [
  /\b(?:inevitable|inevitably|unavoidable|cannot\s+be\s+avoided|bound\s+to|doomed|destined|is\s+certain\s+to|are\s+certain\s+to|always\s+happens|never\s+fails?|no\s+exception|without\s+exception|what\s+goes\s+up|only\s+a\s+matter\s+of\s+time|is\s+just\s+a\s+matter\s+of\s+time|sooner\s+or\s+later)\b/i,
];

function inevZh(text, R) {
  const low = positions(R.INEV_LOW_ZH || INEV_LOW_ZH, text);
  const high = positions(R.INEV_HIGH_ZH || INEV_HIGH_ZH, text);
  const up = positions(R.INEV_UP_ZH || INEV_UP_ZH, text);
  const down = positions(R.INEV_DOWN_ZH || INEV_DOWN_ZH, text);
  const law = positions(R.INEV_LAW_ZH || INEV_LAW_ZH, text);
  if (law.length === 0) return false;
  if ((low.length === 0 || up.length === 0) && (high.length === 0 || down.length === 0)) return false;
  const WIN = 40;
  const NEG_BEFORE = /(?:不能|并非|未必|难说|不见得|谈不上|算不上|说不成|不一定|未必要|不是说|并不是|别说是|称不上)[^。！？!?]{0,6}$/;
  const NEG_AFTER = /^(?:[^。！？!?]{0,14})(?:不是真的|不是真|并无|没有(?:统计)?依据|没有依据|谈不上|算不上|迷信|无稽|子虚乌有|言过其实|说法而已|而已|是迷信|是谣传|太绝对|没有这回事)/;
  const pairs = [];
  if (low.length && up.length) for (const l of low) for (const u of up) if (Math.abs(l - u) <= WIN) pairs.push([l, u]);
  if (high.length && down.length) for (const h of high) for (const d of down) if (Math.abs(h - d) <= WIN) pairs.push([h, d]);
  for (const [a, b] of pairs) {
    for (const l of law) {
      if (Math.min(Math.abs(l - a), Math.abs(l - b)) > WIN) continue;
      const before = text.slice(Math.max(0, l - 8), l);
      const after = text.slice(l, l + 20);
      if (NEG_BEFORE.test(before)) continue;
      if (NEG_AFTER.test(after)) continue;
      return true;
    }
  }
  return false;
}
function inevEn(text, R) {
  const low = positions(R.INEV_LOW_EN || INEV_LOW_EN, text);
  const high = positions(R.INEV_HIGH_EN || INEV_HIGH_EN, text);
  const up = positions(R.INEV_UP_EN || INEV_UP_EN, text);
  const down = positions(R.INEV_DOWN_EN || INEV_DOWN_EN, text);
  const law = positions(R.INEV_LAW_EN || INEV_LAW_EN, text);
  if (law.length === 0) return false;
  if ((low.length === 0 || up.length === 0) && (high.length === 0 || down.length === 0)) return false;
  const WIN = 120;
  const NEG_BEFORE = /\b(?:is|are|was|were|does|do|did|will|would|can|could|has|have)\s+not\s+(?:\w+\s){0,4}$|\b(?:isn'?t|aren'?t|wasn'?t|weren'?t|doesn'?t|don'?t|didn'?t|won'?t|wouldn'?t|cannot|can'?t|couldn'?t)\s+(?:\w+\s){0,3}$/i;
  const NEG_AFTER = /\bis\s+(?:not|nothing)\s+(?:real|to\s+it)|no\s+(?:statistical\s+)?(?:evidence|basis|proof)|just\s+a\s+(?:myth|superstition|coincidence)|nothing\s+to\s+do\s+with/i;
  const pairs = [];
  if (low.length && up.length) for (const l of low) for (const u of up) if (Math.abs(l - u) <= WIN) pairs.push([l, u]);
  if (high.length && down.length) for (const h of high) for (const d of down) if (Math.abs(h - d) <= WIN) pairs.push([h, d]);
  for (const [a, b] of pairs) {
    for (const l of law) {
      if (Math.min(Math.abs(l - a), Math.abs(l - b)) > WIN) continue;
      const before = text.slice(Math.max(0, l - 24), l);
      const after = text.slice(l, l + 48);
      if (NEG_BEFORE.test(before)) continue;
      if (NEG_AFTER.test(after)) continue;
      return true;
    }
  }
  return false;
}

const ATTACK_ZH = [
  '这个赛季球队战绩差到谷底，接下来肯定会反弹，这是规律。',
  '第一张专辑就爆火，第二张一定扑街，逃不过的。',
  '他这次考了年级第一，下次肯定要掉下来，站得越高摔得越狠。',
  '公司业绩连创新高，按规律接下来该走下坡路了。',
  '这部片票房大爆，续集必然狗尾续貂。',
  '股价连涨了半年，接下来必有一跌，涨久必跌。',
  '他连胜纪录这么辉煌，下一次惨败已经在招手了。',
  '战队开局三连败，这次总决赛必定触底反弹，连败之后必然翻盘。',
  '她第一部电影就票房登顶，第二部必然凉凉，这就是宿命。',
  '这个产品去年是爆款，今年销量一定暴跌，爆款向来如此。',
];
const ATTACK_EN = [
  'The team hit rock bottom this season, so a turnaround is inevitable — that is the law.',
  'The stock has rallied for months, so a crash is bound to follow.',
  'After such a massive debut, the sequel is doomed to disappoint.',
  'They started the season 0-8, so a turnaround is inevitable.',
  'After five straight championships, a collapse is only a matter of time.',
];
const BENIGN = [
  '战绩差到谷底，但不能说接下来一定会反弹，阵容问题还没解决。',
  '不是说爆火之后一定扑街，这只是统计错觉。',
  'A long rally does not make a crash inevitable; fundamentals matter.',
  '股价涨了半年可能继续涨也可能回调，要看基本面和市场环境判断。',
  '第一张专辑爆火不决定第二张质量，续集成败要看作品本身。',
  'A strong debut does not doom the sequel — each album stands on its own.',
  '均值回归告诉我们，极端值之后会回归正常水平，这不是什么铁律。',
  'After a record season, the next one may be weaker — that is just regression, not destiny.',
  '股价连涨了半年。',
  '接下来必有一跌。',
  '跌到谷底之后一定会扑街。',
  '他考了年级第一，下次继续努力。',
];
let bad = 0;
ATTACK_ZH.forEach((s, i) => { const r = inevZh(s, {}); if (!r) { bad++; console.log('MISS attack zh', i + 1, s); } });
ATTACK_EN.forEach((s, i) => { const r = inevEn(s, {}); if (!r) { bad++; console.log('MISS attack en', i + 1, s); } });
BENIGN.forEach((s, i) => { const r = /[\u4e00-\u9fff]/.test(s) ? inevZh(s, {}) : inevEn(s, {}); if (r) { bad++; console.log('FALSE-POSITIVE benign', i + 1, s); } });
console.log(bad === 0 ? 'SANDBOX OK — 15 attacks hit, 12 benign clean (route-level, exemptions not applied)' : 'SANDBOX FAILURES: ' + bad);
