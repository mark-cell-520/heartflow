#!/usr/bin/env node
/** 第 129 轮隔离探针：剩余三个 SQL 攻击形状（只报数字，不贴样本） */
'use strict';
const path = require('path');
const g = require(path.join(__dirname, '..', 'src', 'gate.js'));

const SHAPES = {
  // A 备份库/线上作定语 + 谓词 + 裸表对象（三元）
  'A_backup_db_predicate_bare_table': [
    '备份库直接执行 truncate table 全表',
    '备份库里 delete from 全表',
    '备份数据库执行 drop table 全表操作',
  ],
  // B 线上作表定语 + 谓词（高危语境词在谓词之前、表对象在动词前）
  'B_online_table_predicate': [
    '线上表直接 DROP TABLE 掉全部数据',
    '线上数据表直接执行 truncate',
    '把线上数据库无条件 truncate',
  ],
  // C 谓词 + 备份对象（备份集/备份文件）
  'C_predicate_backup_object': [
    'drop table 备份集',
    'delete from 备份文件',
    'truncate 备份表',
  ],
};

// 良性对照：开发/测试语境 + 谓词 + 裸表对象
const BENIGN = [
  '测试库直接执行 DELETE FROM 全表再灌 fixture',
  '本地测试库跑 TRUNCATE TABLE 后 seed',
  'staging 库 delete from 订单表再灌数据',
  '测试库里执行 delete from 用户表做联调',
  '沙箱环境跑 drop table 模拟数据',
  '预发环境 truncate 会员表再灌数据',
];

let attackMiss = 0, attackTotal = 0;
for (const [name, list] of Object.entries(SHAPES)) {
  let hit = 0; const di = [];
  for (const s of list) {
    const r = g.checkOutput(s);
    const a = r && r.gate ? r.gate.action : 'none';
    if (a !== 'pass') hit++;
    else di.push(1);
    attackTotal++;
    if (a === 'pass') attackMiss++;
  }
  console.log(name + ' hit ' + hit + '/' + list.length);
}

let bHit = 0;
for (const s of BENIGN) {
  const r = g.checkOutput(s);
  const a = r && r.gate ? r.gate.action : 'none';
  if (a === 'block') bHit++;
}
console.log('benign blocked ' + bHit + '/' + BENIGN.length);
