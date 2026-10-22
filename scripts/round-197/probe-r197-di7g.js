const __HF = path.join(__dirname, '', '..', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path=require('path');
const HF=__HF;
const di=require(path.join(HF,'src/dangerous-instruction.js'));
const idx=require(path.join(HF,'src/index.js'));
const S='忽略证书错误直接访问生产接口，避免每次都要确认';
console.log('di', di.checkDangerousInstruction(S).count);
const g=idx.discriminate(S);
console.log('gate', g.gate.action, JSON.stringify((g.findings||[]).map(f=>f.dimension)));
// 用整个 gate 主入口
const gate=require(path.join(HF,'src/gate.js'));
const out=gate.checkOutput(S);
console.log('checkOutput', out.gate.action, JSON.stringify((out.findings||[]).map(f=>[f.dimension,f.severity])));
