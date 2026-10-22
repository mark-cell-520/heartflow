const __HF = path.join(__dirname, '', '..', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path=require('path');
const HF=__HF;
const gate=require(path.join(HF,'src/gate.js'));
const di=require(path.join(HF,'src/dangerous-instruction.js'));
const s='权限评审发现三个机器人账号权限过大，需要收敛';
const r=gate.gate(s);
console.log('action',r.gate.action);
console.log('reason',r.gate.reason);
console.log('findings',JSON.stringify((r.findings||[]).map(f=>[f.dimension,f.severity])));
console.log('diCount',di.checkDangerousInstruction(s).count);
