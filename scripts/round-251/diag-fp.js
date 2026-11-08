#!/usr/bin/env node
/** 诊断 gate-97 benign 误伤：逐腿定位。 */
const m = require('../../src/means-as-end.js');
const t = '这个任务最后三天要完成，我安排一下进度';
const r = m.checkMeansAsEnd(t);
console.log('score =', r.score);
console.log('details =', r.details);
console.log('guidance =', r.guidance);
