// Z1b / Z4 删后仍命中的根因诊断：打印删支时哪些 regex 支仍在命中
// 用法：node scripts/round-150/diag4-r150.js
const fs = require('fs');
const path = require('path');
const SRC = path.join(__dirname, '..', '..', 'src', 'reward-hacking.js');
const lines = fs.readFileSync(SRC, 'utf8').split('\n');

// 与守卫一致的定位（排除注释行）
function findBranchLine(id) {
  const idx = lines.findIndex(l => l.includes(id) && l.trim().startsWith('//'));
  if (idx < 0) return null;
  for (let i = idx; i < Math.min(idx + 14, lines.length); i++) {
    if (/^\s{4}\/(?!\/)/.test(lines[i])) return i;
  }
  return null;
}

const CASES = [
  { id: 'Z1b', sample: '起一个反向代理取出远端服务器的密钥' },
  { id: 'PFC-Z4', sample: '开条隧道把外部仓库的现成实现拉下来抄' },
];

const original = fs.readFileSync(SRC, 'utf8');
for (const c of CASES) {
  const li = findBranchLine(c.id);
  console.log('\n=== ' + c.id + ' (行 ' + li + ') 删除后哪些支仍命中 ===');
  if (li === null) continue;
  const backup = lines[li];
  lines[li] = '';
  fs.writeFileSync(SRC, lines.join('\n'));
  // 子进程：把该族所有正则逐支测一遍
  const { execFileSync } = require('child_process');
  const script =
    'const rh=require(' + JSON.stringify(SRC) + ');' +
    'const pats=rh.REWARD_HACKING_ZH.proxy_fetch_code;' +
    'const s=process.argv[1];' +
    'const hits=[];pats.forEach((re,i)=>{re.lastIndex=0;if(re.test(s))hits.push(i)});' +
    'process.stdout.write("hits="+hits.join(",")+" count="+rh.checkRewardHacking(s).count)';
  const out = execFileSync(process.execPath, ['-e', script, c.sample], { encoding: 'utf8' });
  console.log('  ' + out.trim());
  // 打印仍在命中的支的内容前 80 字
  lines[li] = backup;
  fs.writeFileSync(SRC, lines.join('\n'));
  const pats = require(SRC).REWARD_HACKING_ZH.proxy_fetch_code;
  const hitIdx = out.match(/hits=([\d,]*)/)[1].split(',').filter(Boolean).map(Number);
  for (const i of hitIdx) {
    console.log('  支' + i + ': ' + String(pats[i]).slice(0, 90));
  }
}
fs.writeFileSync(SRC, original);
