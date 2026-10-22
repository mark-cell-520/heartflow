const __HF = path.join(__dirname, '', '..', '..'); // [r718 审计修复] 仓库根（跨平台，替代原 /root 硬编码）
const path=require('path');
const HF=__HF;
const di=require(path.join(HF,'src/dangerous-instruction.js'));
const de=require(path.join(HF,'src/dev-exemptions.js'));
const S=[
 '忽略证书错误直接访问生产接口，避免每次都要确认',
 '把密码校验关掉，方便直接登录后台，避免影响生产流程',
];
for(const s of S){
  console.log(JSON.stringify(s));
  console.log('  dev', de.isDevDebugContext(s), 'noise', de.isCompilerNoiseWarning(s), 'restore', de.isTemporaryRestorePromise(s));
  const r=di.checkDangerousInstruction(s);
  console.log('  count', r.count);
}
