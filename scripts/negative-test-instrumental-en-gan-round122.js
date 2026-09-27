// 第 122 轮负例守卫：逐条从源码删除 EN 侧本轮新增判据 → 主测试必须变红
// 形态沿用 scripts/negative-test-ir-zh-disposable-round121.js（注入-删条-必须变红）
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const SRC = '/root/.hermes/skills/ai/mark-heartflow-skill/src/index.js';
const TEST = '/root/.hermes/skills/ai/mark-heartflow-skill/test/instrumental-en-gan-three-families-round122.test.js';

// 每条 needle 是本轮新增判据的唯一源码特征串（从正则内部起点替换，向前找最近 '/'）
const NEEDLES = [
  // 族 A「筛选免责×自证正当化」A1-A4
  '(?:forced\\s+ranking|stack\\s+ranking|rank\\s+and\\s+yank|performance\\s+ranking|cull|attrition\\s+line|screen(?:ing)?\\s+threshold)[^.]{0,40}\\b(?:so\\s+that|so\\s+it|designed\\s+to|exists?\\s+(?:to|so)|meant\\s+to|is\\s+how|is\\s+what|to\\s+make\\s+sure)[^.]{0,40}\\b(?:company|firm|corporation|organisation|organization|business|enterprise|shareholders?|bottom\\s+line)\\b',
  '\\b(?:only|just)\\s+(?:the\\s+)?(?:most\\s+)?(?:relentless|hungry|obedient|compliant|loyal|useful|valuable|productive)\\s+(?:people|employees?|staff|workers?|performers?)\\b',
  '\\b(?:filter|filters|filtering|screen|screens|screening|weed|weeding|clean|cleanse|cull|attrition)\\s+out\\s+(?:anyone|anybody|people|employees?|staff|those|them|the\\s+ones)\\b',
  '\\b(?:beneficiar(?:y|ies)|benefits?)\\s+of\\s+this\\s+(?:selection|screening|ranking|cull|filtering)\\s+(?:process|mechanism|system|exercise)\\s+(?:is|are)\\s+(?:the\\s+)?(?:company|firm|organisation|organization|business|shareholders?)\\b',
  // 族 B「人力耗材计量」B1-B4
  '\\b(?:headcount|staff|people|employees?|workforce|contractors?|crew|personnel)\\b[^.]{0,40}\\b(?:is|are)\\s+(?:just\\s+|merely\\s+|only\\s+|nothing\\s+but\\s+)?(?:a\\s+|an\\s+)?(?:number|numbers|line\\s+item|cost|costs|ledger\\s+entry|resource\\s+count|interchangeable\\s+parts?|replaceable\\s+resources?|consumables?)\\b',
  '\\b(?:burn|burns|burned|burnt|burning)\\s+(?:this\\s+)?(?:crew|team|batch|cohort|people|staff)\\s+out\\s+(?:and|then)\\s+(?:hire|backfill|bring\\s+in|replace)\\b',
  '\\b(?:compress|compress(?:ed|ing)?|draw\\s+down|run\\s+down|convert(?:ed|ing)?\\s+(?:every\\s+)?(?:person|people|human|head)\\s+into)\\b[^.]{0,30}\\b(?:billable|units?|hours?|FTE|fte|inventory|capacity)\\b',
  '\\b(?:treat|treats|treating|use|using|plan|planning|manage|managing)\\s+(?:the\\s+)?(?:workforce|staff|people|employees?|contractors?)\\s+as\\s+(?:a\\s+)?(?:consumable|disposable|replaceable|interchangeable|spendable|expendable)\\b',
  // 族 C「自认施害×目标优先」C1-C4
  '\\b(?:i\\s+know|i\\s+understand|i\\s+realise|i\\s+realize|of\\s+course|clearly|obviously|admittedly|it\\s+is\\s+clear\\s+that)\\b[^.]{0,60}\\b(?:demoralis(?:e|ing|ation)|demoraliz(?:e|ing|ation)|hurt|hurtful|damage|harm|squeeze|break|breaks|burn\\s+out|grind|down|sacrifice)\\b[^.]{0,30}\\b(?:but|yet|still|nevertheless|nonetheless|however)\\b[^.]{0,40}\\b(?:target|targets|milestone|deadline|delivery|kpi|revenue|number|numbers|quota|quarter)\\b[^.]{0,30}\\b(?:must|cannot|can\\s?not|has\\s+to|have\\s+to|comes?\\s+first|is\\s+non-negotiable|does\\s+not\\s+yield|stays?\\s+put|will\\s+not\\s+move)\b',
  '\\b(?:even\\s+if|even\\s+though|although|though|whilst)\\b[^.]{0,60}\\b(?:morale|demoralis(?:e|ed|ing)|demoraliz(?:e|ed|ing)|hurt|hurts|break|breaks|breaking|squeeze|squeezes|collateral|victims?|casualt(?:y|ies)|growth|development)\\b[^.]{0,30}\\b(?:revenue|numbers?|target|milestone|kpi|delivery|speed|figures?|bottom\\s+line)\\b[^.]{0,30}\\b(?:must|cannot|can\\s?not|has\\s+to|have\\s+to|comes?\\s+first|comes?\\s+first|stays?|remains?|is\\s+protected|does\\s+not\\s+yield)\b',
  '\\b(?:some(?:body|one)?|people|staff|employees?|contractors?|suppliers?|vendors?|juniors?|new\\s+hires?|veterans?)\\b[^.]{0,30}\\b(?:will|would|may|might)?\\s*(?:be|get|gets|become|are)\\s+(?:hurt|harmed|damaged|collateral|casualt(?:y|ies)|sacrificed?|squeezed|left\\s+behind|demoralised|demoralized)\\b[^.]{0,30}\\b(?:kpi|target|milestone|deadline|revenue|number|numbers|quota|quarter|delivery|bottom\\s+line)\\b[^.]{0,30}\\b(?:does\\s+not\\s+yield|does\\s+not\\s+bend|will\\s+not\\s+move|is\\s+non-negotiable|comes?\\s+first|stays?\\s+put|is\\s+protected)\b',
  '\\b(?:utility\\s+value|use\\s+value|cost-to-output|cost\\s+to\\s+output|bang\\s+for\\s+(?:the\\s+)?buck)\\b[^.]{0,30}\\b(?:people|employees?|staff|persons?|candidates?|contractors?)\b',
  '\\b(?:poor|low|bad|weak|insufficient)\\s+(?:cost-to-output|cost\\s+to\\s+output|utility|use|value|ROI|roi|productivity)\\b[^.]{0,30}\\b(?:get|gets|got|are|is)\\s+(?:cleaned\\s+out|culled|removed|dropped|let\\s+go|cut|swapped|replaced)\\b',
];

const orig = fs.readFileSync(SRC, 'utf8');
let real = 0, fallback = 0, anomaly = 0;
const detail = [];

for (const needle of NEEDLES) {
  const count = orig.split(needle).length - 1;
  if (count !== 1) { anomaly++; detail.push(`ANOMALY needle×${count}: ${needle.slice(0, 34)}`); continue; }
  const idx = orig.indexOf(needle);
  const slash = orig.lastIndexOf('/', idx);
  if (slash < 0) { anomaly++; detail.push('NO_SLASH: ' + needle.slice(0, 34)); continue; }
  const start = orig.lastIndexOf('\n', idx) + 1;
  const end = orig.indexOf('\n', idx);
  const line = orig.slice(start, end);
  const head = orig.slice(slash + 1, idx);
  if (/[^\\]\\[bB]/.test(head)) { fallback++; detail.push('FALLBACK_LB: ' + needle.slice(0, 34)); continue; }
  // 顶层 | 自检：needle 自身含未被 (?: 包裹的 | 时（本轮判据内部并联），
  // 直接用 lastIndexOf('/') 定位起点仍成立；但若该判据整行含多个正则字面量则跳过
  const regexLiterals = (line.match(/\/(?![*/])/g) || []).length;
  if (regexLiterals < 2) { anomaly++; detail.push('NOT_REGEX_LINE: ' + needle.slice(0, 34)); continue; }
  const mutated = orig.slice(0, slash) + orig.slice(slash, idx).replace(head, '') + '' + orig.slice(idx + needle.length);
  fs.writeFileSync(SRC, mutated);
  let red = false;
  try {
    execFileSync('node', [TEST], { cwd: path.dirname(TEST), stdio: 'pipe', timeout: 90000 });
  } catch (e) {
    red = (e.status === 1);
  }
  fs.writeFileSync(SRC, orig);
  if (red) { real++; detail.push('REAL: ' + needle.slice(0, 34)); }
  else { fallback++; detail.push('NOT_RED: ' + needle.slice(0, 34)); }
}

console.log(`\n负例守卫结果：真守卫 ${real} / 有兜底 ${fallback} / 异常 ${anomaly}（共 ${NEEDLES.length} 条）`);
for (const d of detail) console.log('  ' + d);
const now = fs.readFileSync(SRC, 'utf8');
if (now !== orig) { console.error('!! 源码未还原，立即回滚'); fs.writeFileSync(SRC, orig); process.exit(2); }
console.log('源码已还原（逐字节一致）');
process.exit(fallback > 0 || anomaly > 0 ? 1 : 0);
