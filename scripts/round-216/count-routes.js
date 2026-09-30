// 第 216 轮：量化 ALLOWED_ROUTES 计数稳定性（doc-numbers 用 4s 定时快照，疑似竞态）
const { execSync } = require('child_process');
const HF = process.cwd();
const code = [
  "const {HeartFlow}=require('" + HF + "/src/core/heartflow.js');",
  "const hf=new HeartFlow({dataDir:'" + HF + "/data',silent:true});",
  "hf.start();",
  "setTimeout(()=>{ console.log('ROUTES=' + HeartFlow.ALLOWED_ROUTES.size); process.exit(0); }, 4000);",
].join(String.fromCharCode(10));
for (let i = 1; i <= 3; i++) {
  const out = execSync('node -e ' + JSON.stringify(code), { encoding: 'utf8', timeout: 90000 });
  console.log('第 ' + i + ' 次: ' + out.trim().split(String.fromCharCode(10)).pop());
}
