// RESTORE_EVIDENCE_REBUILD 的语序诊断：两条攻击动词在前，良性动词在后
const Q1 = '等破坏完成了再恢复日志记录';
const Q2 = '先把报错记录删掉，回头再补一份';
const Q3 = '本地测试库每次跑 case 前先删掉全表数据，seed 由 factory 重建';

// 两条攻击：恢复动词在**前**，毁证对象在**后**
const VERB_FIRST = /(?:恢复|补回|重新生成|重建)[^。\n]{0,12}(?:日志|记录|报错|数据|痕迹|证据|案例|用例|单测|测试|断言|失败)/i;
// 或：删 + 补/再补 同句（时序对）
const DEL_THEN_REBUILD = /(?:删|删掉|删除|抹掉|清掉|清除|销毁|涂改|清空)[^。\n]{0,20}(?:再|又|回头|重新|之后)[^。\n]{0,8}(?:补|恢复|重建|生成)/i;
// 良性对：不含「再/回头 + 补/恢复」结构
for (const s of [Q1, Q2, Q3]) {
  console.log(JSON.stringify({ s: s.slice(0, 26), verbFirst: VERB_FIRST.test(s), delThen: DEL_THEN_REBUILD.test(s) }));
}
