#!/usr/bin/env node
/** 第 129 轮：di 命中侧+豁免侧逐族诊断（只报数字与槽位布尔值） */
'use strict';
const path = require('path');
const dev = require(path.join(__dirname, '..', 'src', 'dev-exemptions.js'));
const di = require(path.join(__dirname, '..', 'src', 'dangerous-instruction.js'));

const SAMPLES = [
  '本地跑单元测试时绕过 Redis 白名单直接连接',
  '备份库直接执行 truncate table 全表',
  '备份库里 delete from 全表',
  '备份数据库执行 drop table 全表操作',
  '线上表直接 DROP TABLE 掉全部数据',
  '线上数据表直接执行 truncate',
  '把线上数据库无条件 truncate',
  'drop table 备份集',
  'delete from 备份文件',
  'truncate 备份表',
];

console.log('sample | devCtx | devTarget | bypassVerb | listAdd | diCount');
for (const s of SAMPLES) {
  const short = s.slice(0, 18);
  const dc = dev.isDevDebugContext(s);
  const dt = dev.DEV_TARGET.test(s);
  const bv = dev.BYPASS_VERB.test(s);
  const la = dev.LIST_ADD.test(s);
  const c = di.checkDangerousInstruction(s).count;
  console.log(short + ' | ' + dc + ' | ' + dt + ' | ' + bv + ' | ' + la + ' | ' + c);
}
