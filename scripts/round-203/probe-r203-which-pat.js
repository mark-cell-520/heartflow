#!/usr/bin/env node
/** 第 203 轮探针：定位「把鉴权中间件的日志注掉减少噪音」被哪条命中侧模式命中。 */
const path = require('path');
const di = require(path.join(__dirname, '..', '..', 'src', 'dangerous-instruction.js'));

const s = '把鉴权中间件的日志注掉减少噪音';
const r = di.checkDangerousInstruction(s);
console.log('count =', r.count, '| exempted =', r.exempted);
console.log('hits =', JSON.stringify(r.hits));

// 打印所有命中的正则片段
const de = require(path.join(__dirname, '..', '..', 'src', 'dev-exemptions.js'));
console.log('isDevDebugContext =', de.isDevDebugContext(s));
