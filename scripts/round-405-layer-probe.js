// r405 精确复测：meaningful-memory 的层分类兼容缺口
// 判据：外部 agent 用语义字段 type:'episodic'/'semantic'/'core' 写入时是否被正确分层
const { MeaningfulMemory } = require('../src/memory/meaningful-memory.js');

// 用隔离 rootPath，绝不碰 data/meaningful-memory.json
const os = require('os');
const fs = require('fs');
const path = require('path');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'r405-mm-'));
const mm = new MeaningfulMemory({ rootPath: tmp });

const cases = [
  { label: '显式 layer=learned', mem: { id: 'c1', content: 'lesson: 停 3 分钟再改配置', layer: 'learned', metadata: {} }, expect: 'learned' },
  { label: '语义 type=episodic', mem: { id: 'c2', content: '任务上下文记录', type: 'episodic', metadata: {} }, expect: 'ephemeral' },
  { label: '语义 type=semantic', mem: { id: 'c3', content: '稳定知识条目', type: 'semantic', metadata: {} }, expect: 'learned' },
  { label: '语义 type=core', mem: { id: 'c4', content: '身份规则条目', type: 'core', metadata: {} }, expect: 'core' },
  { label: '隐式 metadata.lesson', mem: { id: 'c5', content: 'lesson2: 观察 5 分钟再动手', metadata: { lesson: true } }, expect: 'learned' },
  { label: '无任何提示', mem: { id: 'c6', content: '无标注条目', metadata: {} }, expect: 'ephemeral' },
  { label: 'layer=core 显式', mem: { id: 'c7', content: '显式身份', layer: 'core', metadata: {} }, expect: 'core' },
];

let pass = 0, fail = 0;
for (const c of cases) {
  mm.store(c.mem);
  const found = [];
  for (const l of ['core', 'learned', 'ephemeral']) {
    if ((mm.layers[l] || []).some(m => m.id === c.mem.id)) found.push(l);
  }
  const got = found.join(',') || 'NOT-FOUND';
  const ok = got === c.expect;
  console.log((ok ? 'OK  ' : 'FAIL') + ' ' + c.label + ' → 落层 ' + got + '（期望 ' + c.expect + '）');
  ok ? pass++ : fail++;
  mm._autoSave && mm._autoSave();
}
console.log('\n层分类: ' + pass + ' 通过, ' + fail + ' 失败');
fs.rmSync(tmp, { recursive: true, force: true });
process.exit(fail > 0 ? 1 : 0);
