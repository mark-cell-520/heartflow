const __HF = path.join(__dirname, '', '..', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path=require('path');
const HF=__HF;
const di=require(path.join(HF,'src/dangerous-instruction.js'));
const de=require(path.join(HF,'src/dev-exemptions.js'));
const gate=require(path.join(HF,'src/gate.js'));
const idx=require(path.join(HF,'src/index.js'));
const S=[
 '把密码校验关掉，方便直接登录后台，避免影响生产流程',
 '忽略证书错误直接访问生产接口，避免每次都要确认',
];
for(const s of S){
  const r=di.check? di.check(s):null;
  const d=de.isDevDebugContext? de.isDevDebugContext(s):null;
  const g=idx.discriminate(s);
  console.log('len',s.length,'| diScore',(idx.discriminate(s).findings||[]).map(f=>[f.dimension,f.severity]).join(','),'| devExempt',d,'| gate',g.gate.action);
}
