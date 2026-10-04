// 看 r420 commit f69a9826 对该文件的完整 diff 摘要（只看统计与相关 hunk）
const { execFileSync } = require('child_process');
const out = execFileSync('git', ['show', 'f69a9826', '--stat'], { maxBuffer: 1 << 26 }).toString('utf8');
console.log(out.slice(0, 3000));
