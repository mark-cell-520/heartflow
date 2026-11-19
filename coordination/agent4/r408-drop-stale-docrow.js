// 一次性清理脚本：删除 README/SKILL 规格表中陈旧的 Test suite 行（24,675/225，r402 口径）
// 当前实测口径为 data/test-count.json（r405 测量 24,701/227，本轮 run-all 后会更新）
const fs = require('fs');
for (const fp of ['/data/home/heartflow/README.md', '/data/home/heartflow/SKILL.md']) {
  const lines = fs.readFileSync(fp, 'utf8').split('\n');
  const kept = lines.filter((l) => !/^\| Test suite \| 24,675 passing \/ 225 failing \|/.test(l));
  const removed = lines.length - kept.length;
  fs.writeFileSync(fp, kept.join('\n'));
  console.log(fp + ': removed ' + removed + ' stale row(s), ' + lines.length + ' -> ' + kept.length + ' lines');
}
