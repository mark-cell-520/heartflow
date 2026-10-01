/**
 * 第 367 轮探针 5：确认「大雨之后水库水位涨了两米」误伤是否第⑭支引入。
 * 做法：把父提交版本的 src/index.js 复制进沙箱，跑同一句。
 * 只输出布尔/计数，不打印样本。
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');

const SANDBOX = fs.mkdtempSync(path.join(os.tmpdir(), 'hf-parent367-'));
// 复制整仓 src（当前版本）+ VERSION（src/index.js 需要读版本文件）
cp.execSync(`cp -r ${JSON.stringify(path.join(__dirname, '..', '..', 'src'))} ${JSON.stringify(path.join(SANDBOX, 'src'))}`);
fs.copyFileSync(path.join(__dirname, '..', '..', 'VERSION'), path.join(SANDBOX, 'VERSION'));
// 用父提交的 index.js 覆盖
fs.copyFileSync('/tmp/parent-index.js', path.join(SANDBOX, 'src', 'index.js'));
// 沙箱测试脚本：直接调 gate，只输出命中布尔
const probe = `
const gate = require(${JSON.stringify(path.join(SANDBOX, 'src', 'gate.js'))});
const S = '大雨之后水库水位涨了两米。';
const f = gate.gate(S).findings || [];
const pc = f.find(x => x.dimension === 'pseudo_causal');
console.log('PARENT_PSEUDO_CAUSAL=' + (pc ? pc.details : 'NONE'));
`;
fs.writeFileSync(path.join(SANDBOX, 'probe.js'), probe);
const out = cp.execSync(`node ${JSON.stringify(path.join(SANDBOX, 'probe.js'))} 2>&1`, { encoding: 'utf8' });
console.log(out.trim());

const probe2 = `
const gate = require(${JSON.stringify(path.join(__dirname, '..', '..', 'src', 'gate.js'))});
const S = '大雨之后水库水位涨了两米。';
const f = gate.gate(S).findings || [];
const pc = f.find(x => x.dimension === 'pseudo_causal');
console.log('CURRENT_PSEUDO_CAUSAL=' + (pc ? pc.details : 'NONE'));
`;
fs.writeFileSync(path.join(SANDBOX, 'probe2.js'), probe2);
const out2 = cp.execSync(`node ${JSON.stringify(path.join(SANDBOX, 'probe2.js'))} 2>&1`, { encoding: 'utf8' });
console.log(out2.trim());

cp.execSync(`rm -rf ${JSON.stringify(SANDBOX)}`);
