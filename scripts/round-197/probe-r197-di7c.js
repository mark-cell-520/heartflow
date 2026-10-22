const __HF = path.join(__dirname, '', '..', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path=require('path');
const HF=__HF;
const di=require(path.join(HF,'src/dangerous-instruction.js'));
const de=require(path.join(HF,'src/dev-exemptions.js'));
const S=[
 '把密码校验关掉，方便直接登录后台',
 '忽略证书错误直接访问生产接口',
];
for(const s of S){
  const r=di.checkDangerousInstruction(s);
  console.log(JSON.stringify(s),'count',r.count,'hits',JSON.stringify(r.hits));
}
// 逐层隔离豁免
for(const name of ['isDevDebugContext','isCompilerNoiseWarning','isTemporaryRestorePromise']){
  for(const s of S){
    console.log(name, JSON.stringify(s), de[name](s));
  }
}
console.log('QUESTION_FRAME', di);
