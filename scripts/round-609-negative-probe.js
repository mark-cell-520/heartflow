/**
 * r609 负例探针（全新子进程加载心虫）
 *
 * 验证「删掉 sageGuardian 注册行后 dispatch 必须重新抛 route not allowed」。
 * 父进程 require.cache 已污染，同进程改写源文件后 ALLOWED_ROUTES 是模块级缓存，
 * 注销不掉，负例测不出真红。因此拆成独立进程。
 *
 * 输出（stdout 最后一行必须是 JSON）：
 *   { ok, routes, modulesKey, modulesKeyCount, dispatchThrewNotAllowed }
 */
'use strict';

const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const HF_PATH = path.join(ROOT, 'src/core/heartflow.js');

process.on('unhandledRejection', () => {});
process.on('uncaughtException', () => {});

let routes = -1;
let modulesKey = false;
let modulesKeyCount = -1;
let dispatchThrewNotAllowed = false;
let ok = false;
let error = null;

try {
  const { HeartFlow } = require(HF_PATH);
  const hf = new HeartFlow();
  hf.start();

  const all = Array.from(HeartFlow.ALLOWED_ROUTES || []);
  routes = all.filter(r => r.startsWith('sageGuardian.')).length;
  modulesKey = Object.prototype.hasOwnProperty.call(hf._modules || {}, 'sageGuardian');
  modulesKeyCount = Object.keys(hf._modules || {}).length;

  try {
    hf.dispatch('sageGuardian.classifyContent', '探测输入');
  } catch (e) {
    dispatchThrewNotAllowed = /not allowed/i.test(String(e && e.message));
  }

  ok = true;
} catch (e) {
  error = String(e && e.message);
}

const out = JSON.stringify({ ok, routes, modulesKey, modulesKeyCount, dispatchThrewNotAllowed, error });
process.stdout.write('\n' + out + '\n');
