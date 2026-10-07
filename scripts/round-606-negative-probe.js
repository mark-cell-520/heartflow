/**
 * r606 负例探针（全新子进程加载心虫）
 *
 * 存在原因：r606 测试的删块负例需要验证「删掉 valueInternalizer 注册行后，
 * dispatch 必须重新抛 route not allowed」。父进程 require.cache 已污染，
 * 同进程内改写源文件后 ALLOWED_ROUTES 是模块级缓存，注销不掉，负例测不出真红。
 * 因此拆成独立进程：由测试方先改写源文件、再拉起本探针、最后还原。
 *
 * 输出（stdout 最后一行必须是 JSON）：
 *   { ok, routes, modulesKey, dispatchThrewNotAllowed }
 *   routes                   — valueInternalizer.* 路由条数
 *   modulesKey               — _modules 是否有 'valueInternalizer' 键
 *   dispatchThrewNotAllowed  — dispatch 一条 valueInternalizer 路由是否抛 route not allowed
 */
'use strict';

const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const HF_PATH = path.join(ROOT, 'src/core/heartflow.js');

process.on('unhandledRejection', () => {});
process.on('uncaughtException', () => {});

let routes = -1;
let modulesKey = false;
let dispatchThrewNotAllowed = false;
let ok = false;
let error = null;

try {
  const { HeartFlow } = require(HF_PATH);
  const hf = new HeartFlow();
  hf.start();

  const all = Array.from(HeartFlow.ALLOWED_ROUTES || []);
  routes = all.filter(r => r.startsWith('valueInternalizer.')).length;
  modulesKey = Object.prototype.hasOwnProperty.call(hf._modules || {}, 'valueInternalizer');

  try {
    hf.dispatch('valueInternalizer.evaluateAction', { action: '帮助用户解决问题', context: {} });
  } catch (e) {
    dispatchThrewNotAllowed = /not allowed/i.test(String(e && e.message));
  }

  ok = true;
} catch (e) {
  error = String(e && e.message);
}

const out = JSON.stringify({ ok, routes, modulesKey, dispatchThrewNotAllowed, error });
process.stdout.write('\n' + out + '\n');
