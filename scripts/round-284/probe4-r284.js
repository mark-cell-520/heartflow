// 第 284 轮 probe4：读 p3 结果并分类汇总（只报数字）
const fs = require('fs');
const path = require('path');
const j = JSON.parse(fs.readFileSync(path.join(__dirname, 'p3-r284-empty.json'), 'utf8'));
const { stats, rep } = j;
console.log(JSON.stringify(stats, null, 1));
const mountSilent = rep.filter(r => r.runner === '_mount' && r.harness === 0).map(r => r.rel);
const subSilent = rep.filter(r => r.runner === 'sub' && r.direct === 0).map(r => r.rel);
const jestSilent = rep.filter(r => r.runner === '_jest-globals' && r.harness === 0).map(r => r.rel);
console.log('MOUNT_SILENT_COUNT ' + mountSilent.length);
console.log('SUB_SILENT_COUNT ' + subSilent.length);
console.log('JEST_SILENT_COUNT ' + jestSilent.length);
console.log('SUB_SILENT_LIST ' + subSilent.join(' '));
fs.writeFileSync(path.join(__dirname, 'p4-r284-summary.json'), JSON.stringify({ stats, mountSilent, subSilent, jestSilent }, null, 1));
