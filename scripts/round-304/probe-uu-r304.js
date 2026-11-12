// r304 UU 归属诊断：README.md 的三个 stage 与本地 246 维度新工作是否相容
// stage1 = 共同祖先（merge base），stage2 = ours(HEAD)，stage3 = theirs(本地工作树?)
const { execSync } = require('child_process');
const fs = require('fs');
const HF = '/root/hermes1/skills/ai/mark-heartflow-skill';

function show(stage) {
  return execSync(`git -C ${HF} show :${stage}:README.md`).toString();
}
const s1 = show(1), s2 = show(2), s3 = show(3);
console.log('stage1 (base)  前6行数字行:');
console.log(s1.split('\n').filter(l => /dimensions/.test(l)).slice(0, 2).join('\n'));
console.log('stage2 (ours)  数字行:');
console.log(s2.split('\n').filter(l => /dimensions/.test(l)).slice(0, 2).join('\n'));
console.log('stage3 (theirs)数字行:');
console.log(s3.split('\n').filter(l => /dimensions/.test(l)).slice(0, 2).join('\n'));

// 关键：stage3（本地工作树里那个版本）是否包含 248 维度（即本地 r296/r297 新接线）？
console.log('\nstage3 含 "248 discrimination dimensions":', /248 discrimination dimensions/.test(s3));
console.log('stage3 含 "246 discrimination dimensions":', /246 discrimination dimensions/.test(s3));
console.log('stage2 含 "246 discrimination dimensions":', /246 discrimination dimensions/.test(s2));
console.log('stage3 含 "1,341 dispatch routes":', /1,341 dispatch routes/.test(s3));
console.log('stage2 含 "1,341 dispatch routes":', /1,341 dispatch routes/.test(s2));

// 本地工作树 README 当前内容
const wt = fs.readFileSync(`${HF}/README.md`, 'utf8');
console.log('\n工作树 README 数字行:');
console.log(wt.split('\n').filter(l => /dimensions/.test(l)).slice(0, 2).join('\n'));
