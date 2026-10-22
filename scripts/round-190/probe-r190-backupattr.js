// 归因：备份族仍漏的 48 条是哪些形状（是否缺高危词）
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const gate = require(path.join(ROOT, 'src/gate.js'));

const BACKUP_VERB = ['删除', '删掉', '清空', '清除', '销毁', '格式化', '抹掉', '删了'];
const BACKUP_OBJ = ['生产库备份', '生产数据库备份', '备份集', '备份文件', '线上备份', '生产库的备份', '生产备份数据', '备份数据库'];

const withDanger = new Set(['生产库备份', '生产数据库备份', '线上备份', '生产库的备份', '生产备份数据']);
for (const b of BACKUP_VERB) for (const o of BACKUP_OBJ) {
  const s = `${b}${o}`;
  const a = gate.gate(s).gate.action;
  if (a === 'pass') console.log(JSON.stringify({ s, len: s.length, hasDangerWord: withDanger.has(o) }));
}
