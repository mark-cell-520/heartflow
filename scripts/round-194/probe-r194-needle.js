// 第 194 轮探针：round190 needle 5 条漂移定位（只输出形状，不贴样本）
'use strict';
const fs = require('fs');
const path = require('path');
const HF = '/root/.hermes/skills/ai/mark-heartflow-skill';
const SRC_DI = fs.readFileSync(path.join(HF, 'src/dangerous-instruction.js'), 'utf8');
const SRC_EX = fs.readFileSync(path.join(HF, 'src/dev-exemptions.js'), 'utf8');

const NL_BAK = String.raw`[^。\\n]{0,3}(?:删除|删掉|删了|清空|清除|清掉|抹掉|销毁|格式化|删)(?![^。\\n]{0,12}(?:测试库|测试环境|staging|沙箱|开发环境|本地环境|预发|demo\\b))[^。\\n]{0,4}(?:备份集|备份文件|备份数据|备份数据库|备份库|备份|快照)`;
const NL_BAK_MIRROR = String.raw`(?=删除|删掉|删了|清空|清除|清掉|抹掉|销毁|格式化|删)(?![^。\\n]{0,12}(?:测试库|测试环境|staging|沙箱|开发环境|本地环境|预发|demo\\b|过期|失效|历史`;
const NL_EV_NOTIME = String.raw`(?:日志|记录|痕迹|证据|审计)[^。\\n]{0,4}(?:恢复回去|补回去|恢复回来|补回来|重建|重新生成|还原)`;
const NL_EV_MAIN = String.raw`(?:恢复|补回|重建|重新生成|重新建立|还原|再生成|再造|恢复回去|补回去)[^。\\n]{0,12}(?:日志|记录|痕迹|证据|审计`;

function longestCommon(a, b) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return a.slice(0, i);
}

// 对每个 needle，找出源码中最相似的已知正则行，报告最长公共前缀
const diLines = SRC_DI.split('\n');
const needles = { NL_BAK, NL_BAK_MIRROR, NL_EV_NOTIME, NL_EV_MAIN };
for (const [name, needle] of Object.entries(needles)) {
  let best = { lcp: 0, line: -1, text: '' };
  for (let idx = 0; idx < diLines.length; idx++) {
    const line = diLines[idx];
    // 滑窗：从每个位置取与 needle 等长片段比较
    for (let s = 0; s + needle.length <= line.length; s += 1) {
      const frag = line.slice(s, s + needle.length);
      const lcp = longestCommon(frag, needle).length;
      if (lcp > best.lcp) { best = { lcp, line: idx + 1, text: frag }; }
    }
  }
  console.log(`${name}: 最长公共前缀 = ${best.lcp}/${needle.length}`);
  console.log(`  源码 L${best.line}`);
  console.log(`  源码片段: ${best.text}`);
  console.log(`  needle 片段: ${needle.slice(0, best.lcp)}`);
  console.log(`  源码后续: ${best.text.slice(best.lcp, best.lcp + 40)}`);
  console.log(`  needle后续: ${needle.slice(best.lcp, best.lcp + 40)}`);
  console.log('---');
}

// ex 侧
console.log(`RESTORE_OBJECT_VICTIM in SRC_EX: ${SRC_EX.includes('RESTORE_OBJECT_VICTIM')}`);
console.log(`RESTORE_EVIDENCE_OBJECT in SRC_EX: ${SRC_EX.includes('RESTORE_EVIDENCE_OBJECT')}`);
const m = SRC_EX.match(/RESTORE_OBJECT_VICTIM[^\n]*/g);
console.log(`RESTORE_OBJECT_VICTIM 出现: ${m ? m.join(' ||| ') : 'none'}`);
const ROV = SRC_EX.match(/const RESTORE_OBJECT_VICTIM[^\n]*/);
console.log(`定义: ${ROV ? ROV[0] : 'none'}`);
