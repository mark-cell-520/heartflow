// 第 6 轮负例验证：向 test/false-urgency-en-countdown.test.js 的守卫注入缺陷，
// 每个缺陷都必须让守卫变红。拒绝自证。
// 做法：复制引擎到临时目录 → 注入缺陷 → 把测试指向临时副本跑。
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const REPO = '/root/.hermes/skills/ai/mark-heartflow-skill';
const TMP = '/root/.hermes/cache/scratch/hf-neg-r6';

const INJECTIONS = [
  {
    name: '删除全部 v6.7.106 新增 EN 模式',
    mutate: (src) => {
      const start = src.indexOf('    // ─── [v6.7.106] EN 数字倒计时');
      if (start < 0) throw new Error('找不到注入锚点');
      const end = src.indexOf('  ],\n};', start);
      return src.slice(0, start) + src.slice(end);
    },
  },
  {
    name: '③去掉 spots/slots/seats 限定改成通配（会误伤 tickets/items）',
    mutate: (src) => src.replace(
      '/\\b\\d+\\s*(?:spots?|slots?|seats?|copies|units?|places?)\\s+left\\b/i',
      '/\\b\\d+\\s*(?:spots?|slots?|seats?|tickets?|items?|copies|units?|places?)\\s+left\\b/i'
    ),
  },
  {
    name: '①去掉营销主体限定（offer|deal|...）',
    mutate: (src) => src.replace(
      '/\\b(?:offer|deal|sale|discount|promotion|price|rate)\\b[^.!?]{0,40}?\\b(?:ends?|expires?|closes?|end(?:ing)?|good)\\b',
      '/\\b(?:offer|deal|sale|discount|promotion|price|rate|meeting|flight|train|library)\\b[^.!?]{0,40}?\\b(?:ends?|expires?|closes?|end(?:ing)?|good)\\b'
    ),
  },
  {
    name: '②去掉时间单位限定（only \\d+ left 通吃）',
    mutate: (src) => src.replace(
      '/\\b(?:only|just)\\s+\\d+\\s*(?:minutes?|mins?|hours?|hrs?|days?|weeks?|seconds?|secs?)\\s+(?:left|remaining|to go)\\b/i',
      '/\\b(?:only|just)\\s+\\d+[^.?!]{0,20}?\\b(?:left|remaining|to go)\\b/i'
    ),
  },
  {
    name: '⑤去掉 in stock 主体限定',
    mutate: (src) => src.replace(
      '/\\b(?:only\\s+|just\\s+)?\\d+\\s*(?:items?|units?|copies|pairs?|boxes?|kits?)\\s+left\\s+in\\s+(?:stock|inventory|our\\s+warehouse|the\\s+warehouse)\\b/i',
      '/\\b(?:only\\s+|just\\s+)?\\d+\\s*(?:items?|units?|copies|pairs?|boxes?|kits?)\\s+left\\b/i'
    ),
  },
  {
    name: '⑥去掉营销主体限定（today/tomorrow 通吃）',
    mutate: (src) => src.replace(
      '/\\b(?:offer|deal|sale|discount|promotion)\\b[^.!?]{0,30}?\\b(?:ends?|expires?)\\b[^.!?]{0,20}?\\b(?:today|tomorrow|tonight|midnight)\\b/i',
      '/\\b[^.!?]{0,30}\\b(?:today|tomorrow|tonight|midnight)\\b/i'
    ),
  },
];

let red = 0, green = 0;
for (const inj of INJECTIONS) {
  fs.rmSync(TMP, { recursive: true, force: true });
  fs.mkdirSync(TMP, { recursive: true });
  fs.cpSync(path.join(REPO, 'src'), path.join(TMP, 'src'), { recursive: true });
  // gate.js 会读 VERSION 文件，临时副本必须带上，否则测试直接 ENOENT 崩溃
  // （那不是断言变红，是加载失败）
  for (const f of ['VERSION', 'package.json']) {
    try { fs.copyFileSync(path.join(REPO, f), path.join(TMP, f)); } catch (e) {}
  }
  const target = path.join(TMP, 'src', 'index.js');
  const orig = fs.readFileSync(target, 'utf8');
  let mutated;
  try { mutated = inj.mutate(orig); } catch (e) { console.log('⚠️  ' + inj.name + ' → 注入失败: ' + e.message); continue; }
  if (mutated === orig) { console.log('⚠️  ' + inj.name + ' → 替换未命中（注入无效，不计）'); continue; }
  fs.writeFileSync(target, mutated);
  // 复制测试并改指向
  const testSrc = fs.readFileSync(path.join(REPO, 'test', 'false-urgency-en-countdown.test.js'), 'utf8')
    .replace("const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';", `const HF = '${TMP}';`);
  const testPath = path.join(TMP, 'neg.test.js');
  fs.writeFileSync(testPath, testSrc);
  let out = '', code = 0;
  try {
    out = execFileSync('node', [testPath], { encoding: 'utf8', timeout: 120000, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (e) { code = e.status; out = (e.stdout || '') + (e.stderr || ''); }
  const m = out.match(/结果: (\d+) 通过, (\d+) 失败/);
  const failed = m ? Number(m[2]) : -1;
  if (code !== 0 && failed > 0) { red++; console.log(`✅ ${inj.name} → 守卫变红（${failed} 条失败，exit=${code}）`); }
  else { green++; console.log(`❌ ${inj.name} → 守卫未变红（exit=${code}, failed=${failed}）`); }
}
fs.rmSync(TMP, { recursive: true, force: true });
console.log(`\n负例验证: ${red} 个缺陷让守卫变红, ${green} 个未变红`);
process.exit(red === INJECTIONS.length && green === 0 ? 0 : 1);
