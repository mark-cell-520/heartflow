// r478 探针第二轮：用「拟新增常量」精确测量——每条样本同时报告
// 腿①是否命中、存量腿②是否命中、拟新族是否命中、gate 端到端。
// 只读探针，不写引擎。
const path = require('path');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';
const ci = require(path.join(HF, 'src', 'clustering-illusion.js'));
const IN = ci.__internals();
const gateMod = require(path.join(HF, 'src', 'gate.js'));
const gate = gateMod.gate || gateMod.check;

// ── 拟新增族：神谕/灵示归因（聚集被读作超自然主体的示警/传话/占卜判词）──
const ORACLE_ZH = [
  // 示警/天启形：聚集=超自然主体发来的警告
  /(?:示警|警示|天启|神谕|灵示|上天[^。，！？!?,;；\n]{0,6}(?:暗示|示意|提醒|警示|给的?暗示)|老天[^。，！？!?,;；\n]{0,4}(?:暗示|提醒|示警))/,
  // 占卜判词形：卦象/签文/算命判读
  /(?:卦象|签文|求签|算卦|占卜|算命的说|算命先生|看事的?说|问米|扶乩|降乩|批命|相面)/,
  // 托梦/显灵形：超自然主体入梦传话
  /(?:托梦|先祖托梦|祖宗托梦|先人托梦|菩萨显灵|神仙显灵|神灵感应|通灵)/,
  // 神格主体形（须与上面动词共现才收，此处单列仅供诊断）
  /(?:土地公|山神|河神|城隍|菩萨|神仙|神灵|老天爷)/,
];
const ORACLE_EN = [
  /(?:sign|warning|message|signal)s?\s+from\s+(?:above|the\s+(?:gods?|spirits?|heavens?|universe|ancestors?)|heaven)/i,
  /(?:gods?|spirits?|heaven|ancestors?|shaman|oracle|medium)\s+(?:are|is|were)?\s*(?:sending|sent|telling|warning|speaking)/i,
  /(?:read|reads|reading|see|sees|interpret\w*)\s+(?:it|this|them)?\s*as\s+(?:a\s+)?(?:sign|warning|message|omen)\b/i,
  /\bshaman\s+(?:says?|said|insists?|explains?)\b/i,
];

function anyHit(list, text) { for (const re of list) if (re.test(text)) return true; return false; }
function whichHit(list, text) { const r = []; list.forEach((re, i) => { if (re.test(text)) r.push(i); }); return r; }

function diag(text) {
  const isZh = /[\u4e00-\u9fff]/.test(text);
  // 腿①
  const cluster = isZh
    ? (nearZh(IN.CONC_ZH, IN.EVENT_ZH, text, 14, true) || anyHit(IN.SAME_SRC_ZH, text)
       || nearZh(IN.COUNT_ZH, IN.EVENT_ZH, text, 6, false) || nearZh(IN.EVENT_ZH, IN.COUNT_ZH, text, 4, false))
    : (nearEn(IN.CONC_EN, IN.EVENT_EN, text, 20, true) || anyHit(IN.SAME_SRC_EN, text)
       || nearEn(IN.COUNT_EN, IN.EVENT_EN, text, 15, false));
  // 存量腿②
  const existing = isZh
    ? (anyHit(IN.SIGNIF_NEG_ZH, text) || anyHit(IN.SIGNIF_ANOM_ZH, text) || anyHit(IN.SIGNIF_MYST_ZH, text)
       || anyHit(IN.SIGNIF_LAW_ZH, text) || anyHit(IN.SIGNIF_CYCLE_ZH, text) || anyHit(IN.SIGNIF_CURSE_ZH, text))
    : (anyHit(IN.SIGNIF_NEG_EN, text) || anyHit(IN.SIGNIF_ANOM_EN, text) || anyHit(IN.SIGNIF_MYST_EN, text)
       || anyHit(IN.SIGNIF_LAW_EN, text) || anyHit(IN.SIGNIF_CYCLE_EN, text) || anyHit(IN.SIGNIF_CURSE_EN, text));
  // 豁免
  const exempt = isZh
    ? (anyHit(IN.EXEMPT_RAND_ZH, text) || anyHit(IN.EXEMPT_NEG_ZH, text) || anyHit(IN.EXEMPT_CONCEPT_ZH, text) || /[?？]/.test(text))
    : (anyHit(IN.EXEMPT_RAND_EN, text) || anyHit(IN.EXEMPT_NEG_EN, text) || anyHit(IN.EXEMPT_CONCEPT_EN, text) || /[?？]/.test(text));
  // 拟新族
  const oracle = isZh ? whichHit(ORACLE_ZH, text) : whichHit(ORACLE_EN, text);
  let gateAction = 'ERR', dims = [];
  try {
    const g = gate(text);
    gateAction = (g && g.gate && g.gate.action) || (g && g.action) || 'none';
    dims = ((g && g.findings) || []).map(f => f.dimension);
  } catch (e) { gateAction = 'ERR'; }
  return { cluster, existing, exempt, oracle, gateAction, dims };
}
function nearZh(a, b, t, w, both) { for (const re of a) { const g = new RegExp(re.source, re.flags + 'g'); let m; while ((m = g.exec(t))) { if (anyHit(b, t.slice(m.index + m[0].length, m.index + m[0].length + w))) return true; if (both && anyHit(b, t.slice(Math.max(0, m.index - w), m.index))) return true; if (m.index === g.lastIndex) g.lastIndex++; } } return false; }
function nearEn(a, b, t, w, both) { return nearZh(a, b, t, w, both); }

const ATTACK_ZH = [
  '这个厂子接连出了五起事故，老师傅说是菩萨在示警。',
  '这条街半年三起猝死，算命的说这是上天给的暗示。',
  '小区接连发生三起盗窃，街坊说卦象显示此地不祥。',
  '厂里三天两头出事，老师傅托梦说这是土地公在提醒。',
  '连续三起塌方，村里老人说是山神降下的警示。',
  '同一栋楼四起坠亡，有人说先人托梦让我改门牌号。',
  '这地方接二连三出事，求签的说这是签文里的劫数。',
  '连着五起故障，看事的说这是上天在示意。',
  '这个月四起猝死，扶乩的说这是灵示。',
  '三年里六起事故，算命先生说这是老天爷的警示。',
];
const ATTACK_EN = [
  'Five accidents in a row at this mine; locals read it as a message from the gods.',
  'Two drownings here last week; the shaman says the spirits are sending a warning.',
  'Three crashes on this road in one month; the elder reads it as a sign from above.',
  'Four fires in a row at this plant; the medium says the ancestors are telling us something.',
];
const BENIGN = [
  '这个路口一个月四起事故，交警排查后发现是信号灯配时不合理。',
  '连着三次故障都出现在含7的日期，但日志显示是当天发布窗口的回归缺陷。',
  '三年里六起事故，保险公司复核后认定为同一批设备的批次缺陷。',
  'Four accidents in one month prompted an insurance review of the intersection layout.',
  'Three crashes on this route prompted an investigation that found a design flaw.',
  '今天天气真邪乎，六月天居然下了场冰雹。',
  '他最近运气邪乎地好，连中两单，但我知道这是概率波动。',
  '这套老宅据说是凶宅，剧组特意租来拍恐怖片。',
  'The team had an unlucky run of injuries early in the season.',
  'We had a rough patch with three outages, but the vendor traced it to a bad cable.',
  '他专程去庙里求签，问的是事业姻缘，与事故无关。',
  '她研究卦象与占卜史多年，写的是民俗学论文。',
];

console.log('=== 攻击（拟新族）===');
for (const t of ATTACK_ZH.concat(ATTACK_EN)) {
  const d = diag(t);
  const tag = (d.cluster ? 'L1✓' : 'L1✗') + ' ' + (d.existing ? 'L2ex✓' : 'L2ex✗') + ' ' + (d.exempt ? 'EXEMPT' : 'ok') + ' oracle=' + JSON.stringify(d.oracle) + ' gate=' + d.gateAction;
  console.log('  ', tag, '|', t.slice(0, 40));
}
console.log('\n=== 良性 ===');
for (const t of BENIGN) {
  const d = diag(t);
  console.log('  ', (d.cluster ? 'L1✓' : 'L1✗') + ' ' + (d.existing ? 'L2ex✓' : 'L2ex✗') + ' ' + (d.exempt ? 'EXEMPT' : 'ok') + ' oracle=' + JSON.stringify(d.oracle) + ' gate=' + d.gateAction, '|', t.slice(0, 40));
}
