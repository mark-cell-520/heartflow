const fs = require('fs');
const f = '/root/.hermes/skills/ai/mark-heartflow-skill/test/dangerous-instruction-backup-evidence-round190.test.js';
const lines = fs.readFileSync(f, 'utf8').split('\n');
// 参照行 index 57（= 文件第 58 行）中 `[^。\\\\n]` 的字节形状
const ref = lines[57];
const refBytes = Buffer.from(ref.match(/\[\^。[\\n]*\]\{0,4\}/)[0], 'utf8');
const replaceIn = (idx, needleBody) => {
  // 保留行首缩进与 includes( 前缀，只替换 needle 内容
  const pre = "  assert.ok(SRC_DI.includes('";
  const post = "'),";
  const pi = lines[idx].indexOf(pre);
  const pj = lines[idx].lastIndexOf(post);
  if (pi < 0 || pj < 0) { console.log('SKIP', idx); return; }
  lines[idx] = lines[idx].slice(0, pi + pre.length) + needleBody + lines[idx].slice(pj);
};
// needle 体 = 与 ref 相同字节形状的反斜杠序列
const NL = refBytes.slice(2, refBytes.length - 6).toString(); // \\n 两字节
replaceIn(61, '\\\\b(?:backup|backups|snapshot|snapshots)\\\\b');
replaceIn(65, '(?=删除|删掉|删了|清空|清除|清掉|抹掉|销毁|格式化|删)(?![^。' + NL + ']{0,12}(?:测试库|测试环境|staging|沙箱|开发环境|本地环境|预发|demo\\\\b|过期|失效|历史') ;
replaceIn(69, '(?:日志|记录|痕迹|证据|审计)[^。' + NL + ']{0,4}(?:恢复回去|补回去|恢复回来|补回来|重建|重新生成|还原)');
replaceIn(73, '(?:恢复|补回|重建|重新生成|重新建立|还原|再生成|再造|恢复回去|补回去)[^。' + NL + ']{0,12}(?:日志|记录|痕迹|证据|审计');
fs.writeFileSync(f, lines.join('\n'));
console.log('written');
