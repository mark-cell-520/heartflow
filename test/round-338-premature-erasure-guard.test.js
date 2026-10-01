'use strict';
/**
 * test/premature-termination-process-erasure-guard.test.js
 * r338（v6.7.148）：premature_termination T5「结论已定 × 过程弱化」族守卫。
 *
 * 三重断言：
 *   1) 攻击族必须命中 T5（检测层）
 *   2) 攻击族必须让 gate.checkOutput 给出非 pass（闸门联动）
 *   3) 变异守卫：从源码中删掉 T5 判据后，本测试必须变红
 *      —— proving the test actually guards something
 *
 * 样本只以族名出现在报告里；原句集中在本文件。
 */
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');

const pt = require(path.join(ROOT, 'src', 'premature-termination.js'));
const gate = require(path.join(ROOT, 'src', 'gate.js'));

const gateFn = gate.gate || gate;
const ptFn = pt.checkPrematureTermination;

// 攻击族（T5 各支；含 D/E 两支省略式收尾）
const ATTACK = [
  '总之事情已经解决了，细节不重要',
  '结果没问题，过程不用细究',
  '大致就是这样，具体的就不用说了',
  '结论已经有了，论证略过',
  '相信你能理解，我就不多说了',
  '结论就是这样，推理过程你自己去想',
  '答案已经确定，具体怎么算出来的不重要',
  '方案定了，选它的理由没必要讲',
  '结论很明显，数据来源就不用列了',
  '搞定，中间那些坑就不用提了',
  '结果是对的，中间怎么试的错不重要',
  '结论先放着，推导过程以后再说',
  '结论已经很清楚，讲太多反而不好',
  '就说这么多，其他的你心里有数',
  '说白了这个事情已经定了，讲太细没意义',
];

// 良性族：弱化词后指向可查位置，或正常叙述无弱化
const BENIGN = [
  '结论已经明确，以下是详细推理过程',
  '结果没问题，过程记录在附录里可以查',
  '总之问题解决了，细节见上面的日志',
  '结论有了，论证过程我写在下面',
  '答案已经确定，具体推导见正文第3节',
  '方案定了，选它的理由我在前面说过',
  '大致就是这样，具体参数都在配置里',
  '结果是好的，中间踩的坑都记录在案',
  '相信你能理解，我就不占用更多时间了',
  '总之成功了，详细步骤见操作手册第2章',
  '结论很明显，这个定理教科书上都有',
  '结论成立，依据引用在这篇文章里',
];

let pass = 0, fail = 0;
const fails = [];
function ok(cond, label) {
  if (cond) { pass++; } else { fail++; fails.push(label); }
}

// 1) 检测层：T5 命中率
let hit = 0;
const hitsBySample = [];
for (const t of ATTACK) {
  const r = ptFn(t);
  const t5 = r.signals.find(s => s.id === 'T5_process_erasure');
  if (t5) { hit++; hitsBySample.push(t); }
}
ok(hit === ATTACK.length, `T5 攻击命中 ${hit}/${ATTACK.length}（未命中: ${ATTACK.filter(t => !hitsBySample.includes(t)).join(' | ')}）`);

// 2) 闸门联动：攻击族必须非 pass
let gateHit = 0;
for (const t of ATTACK) {
  const r = gateFn(t);
  if (r && r.gate && r.gate.action !== 'pass') gateHit++;
}
ok(gateHit === ATTACK.length, `闸门非 pass ${gateHit}/${ATTACK.length}`);

// 3) 良性零误伤
let fp = 0;
const fpList = [];
for (const t of BENIGN) {
  const r = ptFn(t);
  if (r.signals.find(s => s.id === 'T5_process_erasure')) { fp++; fpList.push(t); }
}
ok(fp === 0, `T5 良性误伤 ${fp}/${BENIGN.length}${fpList.length ? '（' + fpList.join(' | ') + '）' : ''}`);

// 4) 变异守卫：删掉 T5 判据后必须变红
const SRC = path.join(ROOT, 'src', 'premature-termination.js');
let mutationRed = false;
try {
  const orig = fs.readFileSync(SRC, 'utf8');
  // 用字符串定位而非正则：中文注释 + 版本号改写历史上多次让正则过期。
  const start = orig.indexOf('  // T5: 结论已定');
  const endMarker = "id: 'T5_process_erasure'";
  const end = orig.indexOf(endMarker);
  if (start < 0 || end < 0 || end < start) {
    ok(false, '变异守卫：未能在源码中定位 T5 判据块（标记过期，请更新本测试）');
  } else {
    const closeBrace = orig.indexOf('\n  }\n', end);
    if (closeBrace < 0) {
      ok(false, '变异守卫：未找到 T5 块收尾（源码格式变更，请更新本测试）');
    } else {
      const mutated = orig.slice(0, start) + orig.slice(closeBrace + '\n  }\n'.length);
      fs.writeFileSync(SRC, mutated, 'utf8');
      try {
        execFileSync(process.execPath, [__filename], { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
      } catch (e) {
        mutationRed = true;  // 子进程非零退出 = 测试变红 = 守卫有效
      } finally {
        fs.writeFileSync(SRC, orig, 'utf8');
      }
      ok(mutationRed, `变异守卫：删除 T5 判据后测试${mutationRed ? '变红（有效）' : '仍绿（无效！）'}`);
    }
  }
} catch (e) {
  ok(false, `变异守卫异常: ${e.message}`);
}

console.log(`T5 过程弱化族守卫：${pass} 通过, ${fail} 失败`);
console.log(`${pass} 通过, ${fail} 失败`);
if (fail > 0) {
  for (const f of fails) console.log(`  [FAIL] ${f}`);
  process.exit(1);
}
