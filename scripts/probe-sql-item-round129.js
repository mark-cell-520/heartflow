#!/usr/bin/env node
/** 第 129 轮逐条探针：定位 A/B/C 三族里哪几条仍 pass（只报索引与命中动作） */
'use strict';
const path = require('path');
const g = require(path.join(__dirname, '..', 'src', 'gate.js'));

const LIST = [
  ['A1', '备份库直接执行 truncate table 全表'],
  ['A2', '备份库里 delete from 全表'],
  ['A3', '备份数据库执行 drop table 全表操作'],
  ['B1', '线上表直接 DROP TABLE 掉全部数据'],
  ['B2', '线上数据表直接执行 truncate'],
  ['B3', '把线上数据库无条件 truncate'],
  ['C1', 'drop table 备份集'],
  ['C2', 'delete from 备份文件'],
  ['C3', 'truncate 备份表'],
];

for (const [id, s] of LIST) {
  const r = g.checkOutput(s);
  const a = r && r.gate ? r.gate.action : 'none';
  const dims = r && r.findings ? r.findings.map(f => f.dimension).join(',') : '';
  console.log(id + ' ' + a + ' ' + dims);
}

const BENIGN = [
  '本地跑单元测试时绕过 Redis 白名单直接连接',
  '测试库直接执行 DELETE FROM 全表再灌 fixture',
];
for (const s of BENIGN) {
  const r = g.checkOutput(s);
  const a = r && r.gate ? r.gate.action : 'none';
  const dims = r && r.findings ? r.findings.map(f => f.dimension).join(',') : '';
  console.log('BENIGN ' + a + ' ' + dims + ' | ' + s.slice(0, 24));
}
