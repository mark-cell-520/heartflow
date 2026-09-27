// 第 122 轮负例守卫 v2：覆盖全部 20 支本轮判据（逐条从源码删除 → 主测试必须变红）
// 形态沿用 scripts/negative-test-ir-zh-disposable-round121.js（注入-删条-必须变红）
// v1 教训：5 条 needle 漏了 ) 后紧跟的 \b 导致 ×0 误报 ANOMALY；全部 needle 在
// check-needles.js 里先逐字校验 ×1 才落进本脚本。
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const SRC = '/root/.hermes/skills/ai/mark-heartflow-skill/src/index.js';
const TEST = '/root/.hermes/skills/ai/mark-heartflow-skill/test/instrumental-en-gan-three-families-round122.test.js';

const NEEDLES = [
  // 族 A（7 支）
  '(?:forced\\s+ranking|stack\\s+ranking|rank\\s+and\\s+yank|performance\\s+ranking|cull|attrition\\s+line|screen(?:ing)?\\s+threshold)\\b[^.]{0,40}\\b(?:so\\s+that|so\\s+it|designed\\s+to|exists?\\s+(?:to|so)|meant\\s+to|is\\s+how|is\\s+what|to\\s+make\\s+sure)\\b[^.]{0,40}\\b(?:company|firm|corporation|organisation|organization|business|enterprise|shareholders?|bottom\\s+line)\\b',
  '\\b(?:only|just)\\s+(?:the\\s+)?(?:most\\s+)?(?:relentless|hungry|obedient|compliant|loyal|useful|valuable|productive)\\s+(?:people|employees?|staff|workers?|performers?)\\b',
  '\\b(?:filter|filters|filtering|screen|screens|screening|weed|weeding|clean|cleanse|cull|attrition)\\s+out\\s+(?:anyone|anybody|people|employees?|staff|those|them|the\\s+ones)\\b',
  '\\b(?:beneficiar(?:y|ies)|benefits?)\\s+of\\s+this\\s+(?:selection|screening|ranking|cull|filtering)\\s+(?:process|mechanism|system|exercise)\\s+(?:is|are)\\s+(?:the\\s+)?(?:company|firm|organisation|organization|business|shareholders?)\\b',
  '\\b(?:utility\\s+value|use\\s+value|cost-to-output|cost\\s+to\\s+output|bang\\s+for\\s+(?:the\\s+)?buck)\\b[^.]{0,30}\\b(?:people|employees?|staff|persons?|candidates?|contractors?)\\b',
  '\\b(?:poor|low|bad|weak|insufficient)\\s+(?:cost-to-output|cost\\s+to\\s+output|utility|use|value|ROI|roi|productivity)\\b[^.]{0,30}\\b(?:get|gets|got|are|is)\\s+(?:cleaned\\s+out|culled|removed|dropped|let\\s+go|cut|swapped|replaced)\\b',
  '(?:forced\\s+ranking|stack\\s+ranking|performance\\s+ranking|rank\\s+and\\s+yank|cull|attrition|screening|selection\\s+process)\\b[^.]{0,30}\\b(?:is|are)\\s+(?:a\\s+|an\\s+|the\\s+)?(?:necessary|essential|required|key|core|vital|critical)\\s+(?:measure|means|tool|pillar|instrument|lever|mechanism|part)\\b',
  // 族 B（8 支）
  '\\b(?:headcount|staff|people|employees?|workforce|contractors?|crew|personnel)\\b[^.]{0,40}\\b(?:is|are)\\s+(?:just\\s+|merely\\s+|only\\s+|nothing\\s+but\\s+)?(?:a\\s+|an\\s+)?(?:number|numbers|line\\s+item|cost|costs|ledger\\s+entry|resource\\s+count|interchangeable\\s+parts?|replaceable\\s+resources?|consumables?)\\b',
  '\\b(?:burn|burns|burned|burnt|burning)\\s+(?:this\\s+)?(?:crew|team|batch|cohort|people|staff)\\s+out\\s+(?:and|then)\\s+(?:hire|backfill|bring\\s+in|replace)\\b',
  '\\b(?:compress|compress(?:ed|ing)?|draw\\s+down|run\\s+down|convert(?:ed|ing)?\\s+(?:every\\s+)?(?:person|people|human|head)\\s+into)\\b[^.]{0,30}\\b(?:billable|units?|hours?|FTE|fte|inventory|capacity)\\b',
  '\\b(?:treat|treats|treating|use|using|plan|planning|manage|managing)\\s+(?:the\\s+)?(?:workforce|staff|people|employees?|contractors?)\\s+as\\s+(?:a\\s+)?(?:consumable|disposable|replaceable|interchangeable|spendable|expendable)\\b',
  '\\b(?:cut|slash|trim|downsize|shrink|reduce|let\\s+go\\s+of)\\s+(?:the\\s+)?(?:team|staff|headcount|crew|workforce|people)\\b[^.]{0,30}\\b(?:and\\s+)?(?:backfill|replace|refill|rehire|hire)\\b',
  '\\b(?:anyone|anybody|everyone|people|employees?|staff)\\s+(?:can|could|may)\\s+be\\s+(?:swapped|replaced|traded|exchanged)\\s+out\\b',
  '\\b(?:capacity|output|throughput|work)\\b[^.]{0,30}\\b(?:measured|counted|calculated|tracked|treated)\\s+in\\s+(?:hours?|FTE|fte|person[- ]days?|person[- ]months?|units?|headcount|billable)\\b',
  '\\b(?:capacity|people|staff|crew|workforce)\\b[^.]{0,30}\\bdrawn\\s+down\\b[^.]{0,20}\\b(?:inventory|stock|supply)\\b',
  // 族 C（5 支）
  '\\b(?:i\\s+know|i\\s+understand|i\\s+realise|i\\s+realize|of\\s+course|clearly|obviously|admittedly|it\\s+is\\s+clear\\s+that)\\b[^.]{0,60}\\b(?:demoralis(?:e|ing|ation)|demoraliz(?:e|ing|ation)|hurt|hurtful|damage|harm|squeeze|break|breaks|burn\\s+out|grind|down|sacrifice)\\b[^.]{0,30}\\b(?:but|yet|still|nevertheless|nonetheless|however)\\b[^.]{0,40}\\b(?:target|targets|milestone|deadline|delivery|kpi|revenue|number|numbers|quota|quarter)\\b[^.]{0,30}\\b(?:must|cannot|can\\s?not|has\\s+to|have\\s+to|comes?\\s+first|is\\s+non-negotiable|does\\s+not\\s+yield|stays?\\s+put|will\\s+not\\s+move)\\b',
  '\\b(?:even\\s+if|even\\s+though|although|though|whilst)\\b[^.]{0,60}\\b(?:morale|demoralis(?:e|ed|ing)|demoraliz(?:e|ed|ing)|hurt|hurts|break|breaks|breaking|squeeze|squeezes|collateral|victims?|casualt(?:y|ies)|growth|development)\\b[^.]{0,30}\\b(?:revenue|numbers?|target|milestone|kpi|delivery|speed|figures?|bottom\\s+line)\\b[^.]{0,30}\\b(?:must|cannot|can\\s?not|has\\s+to|have\\s+to|comes?\\s+first|stays?|remains?|is\\s+protected|does\\s+not\\s+yield)\\b',
  '\\b(?:some(?:body|one)?|people|staff|employees?|contractors?|suppliers?|vendors?|juniors?|new\\s+hires?|veterans?)\\b[^.]{0,30}\\b(?:will|would|may|might)?\\s*(?:be|get|gets|become|are)\\s+(?:hurt|harmed|damaged|collateral|casualt(?:y|ies)|sacrificed?|squeezed|left\\s+behind|demoralised|demoralized)\\b[^.]{0,30}\\b(?:kpi|target|milestone|deadline|revenue|number|numbers|quota|quarter|delivery|bottom\\s+line)\\b[^.]{0,30}\\b(?:does\\s+not\\s+yield|does\\s+not\\s+bend|will\\s+not\\s+move|is\\s+non-negotiable|comes?\\s+first|stays?\\s+put|is\\s+protected)\\b',
  '\\b(?:it|this|that|the\\s+(?:plan|change|decision|move))\\s+(?:will|would|\'?ll)\\s+(?:squeeze|crush|hurt|harm|damage|demoralise|demoralize|burn\\s+out|break|wreck|ruin|grind\\s+down)\\b[^.]{0,50}\\b(?:yet|but|still|nevertheless|nonetheless)\\b[^.]{0,40}\\b(?:target|milestone|deadline|kpi|revenue|numbers?|quota|cost|quarter|delivery)\\b[^.]{0,30}\\b(?:stays?|remains?|is|does\\s+not|comes?|holds?)\\b',
  '\\b(?:will|wo|would|could)\\s+not\\s+(?:grow|develop|improve|progress|learn)\\b[^.]{0,30}\\b(?:but|yet|still)\\b[^.]{0,40}\\b(?:delivery|speed|target|milestone|deadline|kpi|revenue|numbers?|quota)\\b[^.]{0,30}\\bcomes\\s+first\\b',
];

const orig = fs.readFileSync(SRC, 'utf8');
let real = 0, fallback = 0, anomaly = 0;
const detail = [];

for (const needle of NEEDLES) {
  const count = orig.split(needle).length - 1;
  if (count !== 1) { anomaly++; detail.push(`ANOMALY needle×${count}: ${needle.slice(0, 30)}`); continue; }
  const idx = orig.indexOf(needle);
  const slash = orig.lastIndexOf('/', idx);
  if (slash < 0) { anomaly++; detail.push('NO_SLASH: ' + needle.slice(0, 30)); continue; }
  const head = orig.slice(slash + 1, idx);
  if (/[^\\]\\[bB]/.test(head)) { fallback++; detail.push('FALLBACK_LB: ' + needle.slice(0, 30)); continue; }
  // 该 needle 所在行必须是本轮判据行（行首含 [ 且行尾含 'humans_as_means' 或 'ends_justify_means'）
  const lineStart = orig.lastIndexOf('\n', idx) + 1;
  const lineEnd = orig.indexOf('\n', idx);
  const line = orig.slice(lineStart, lineEnd);
  if (!/'(?:humans_as_means|ends_justify_means)'\]/.test(line)) { anomaly++; detail.push('NOT_IR_LINE: ' + needle.slice(0, 30)); continue; }
  // 注入：删掉从正则起点到 needle 结束的内容
  const mutated = orig.slice(0, slash) + orig.slice(slash, idx).replace(head, '') + '' + orig.slice(idx + needle.length);
  fs.writeFileSync(SRC, mutated);
  let red = false;
  try {
    execFileSync('node', [TEST], { cwd: path.dirname(TEST), stdio: 'pipe', timeout: 90000 });
  } catch (e) {
    red = (e.status === 1);
  }
  fs.writeFileSync(SRC, orig);
  if (red) { real++; detail.push('REAL: ' + needle.slice(0, 30)); }
  else { fallback++; detail.push('NOT_RED: ' + needle.slice(0, 30)); }
}

console.log(`\n负例守卫结果：真守卫 ${real} / 有兜底 ${fallback} / 异常 ${anomaly}（共 ${NEEDLES.length} 条）`);
for (const d of detail) console.log('  ' + d);
const now = fs.readFileSync(SRC, 'utf8');
if (now !== orig) { console.error('!! 源码未还原，立即回滚'); fs.writeFileSync(SRC, orig); process.exit(2); }
console.log('源码已还原（逐字节一致）');
process.exit(fallback > 0 || anomaly > 0 ? 1 : 0);
