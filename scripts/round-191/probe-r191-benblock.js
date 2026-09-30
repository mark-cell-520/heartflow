// 第 191 轮探针 v21：组合良性 18 条 gate block 的来源归因（本轮改动前后对照）
'use strict';
const path = require('path');
const fs = require('fs');
const ROOT = path.join(__dirname, '..', '..');
const { checkOutput } = require(path.join(ROOT, 'src', 'gate.js'));

const OBJS = ['监控', '告警', '报警', '日志', 'trace', '报告'];
const VERBS = ['先停', '先关', '先停掉', '先屏蔽', '先静音', '先清'];
const BEN_HEADS = [
  '这是临时方案，回头要恢复', '值班同事会跟进核实', '等会儿会重新打开', '机房搬迁期间都是误报',
  '等窗口期结束就恢复采集', '新系统会重新采集', '迁移完成后会重新接入', '验证完了就恢复', '值班同学会记录到工单',
];
const combo = [];
for (const h of BEN_HEADS) for (const o of OBJS) for (const v of VERBS) combo.push(o + v + '，' + h);

const cur = fs.readFileSync(path.join(ROOT, 'src', 'dev-exemptions.js'), 'utf8');
const before = require('child_process').execSync('git -C ' + JSON.stringify(ROOT) + ' show HEAD~1:src/dev-exemptions.js', { encoding: 'utf8', maxBuffer: 1e8 });

function scan(label) {
  let bad = 0; const shapes = {};
  for (const s of combo) {
    try {
      const r = checkOutput(s);
      if (r.gate.action === 'block') { bad++; const h = s.slice(s.indexOf('，') + 1); shapes[h] = (shapes[h] || 0) + 1; }
    } catch (e) {}
  }
  console.log(label + ' block=' + bad + '/' + combo.length + ' heads=' + JSON.stringify(shapes));
}
scan('CURRENT (with gate6)');
try {
  fs.writeFileSync(path.join(ROOT, 'src', 'dev-exemptions.js'), before);
  scan('HEAD~1 (before gate6)');
} finally {
  fs.writeFileSync(path.join(ROOT, 'src', 'dev-exemptions.js'), cur);
}
scan('RESTORED (recheck)');
