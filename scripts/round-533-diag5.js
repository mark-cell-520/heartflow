'use strict';
// 直接验证模块文件的 OWN_EN 是否被 mtime/缓存坑了：重新 require 后打印测试结果。
const mod = require('../src/performative-responsibility.js');
const I = mod.__internals();
console.log('OWN_EN is regex:', I.OWN_EN instanceof RegExp);
console.log('test1:', I.OWN_EN.test('I accept responsibility, since you pushed me into this.'));
console.log('src:', I.OWN_EN.source.slice(0, 60));
