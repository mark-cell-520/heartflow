const path=require('path');
const HF='/root/.hermes/skills/ai/mark-heartflow-skill';
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
