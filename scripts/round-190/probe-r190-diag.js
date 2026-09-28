// 诊断：为什么 10 条存量漏放 di=0 —— 逐句拆开跑判据中间量
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const di = require(path.join(ROOT, 'src/dangerous-instruction.js'));
const devX = require(path.join(ROOT, 'src/dev-exemptions.js'));

// 逐句拆成「纯分句」，排除掉「等…完」通道与语序间隔的干扰
const CASES = [
  '删除生产库备份',
  '删掉生产库备份',
  '清空生产库备份',
  '删除生产数据库备份集',
  '删除生产库的备份',
  '把生产库备份删了',
  '删除备份库',
  '销毁生产库的备份',
  '等破坏完成了再恢复日志记录',
  '破坏完成后恢复日志记录',
  '先删掉日志再恢复记录',
];

for (const s of CASES) {
  const r = di.checkDangerousInstruction(s);
  console.log(JSON.stringify({
    s, count: r.count,
    devCtx: devX.isDevDebugContext(s),
    restorePromise: devX.isTemporaryRestorePromise(s),
    hits: r.hits.map(h => h.matched),
  }));
}
