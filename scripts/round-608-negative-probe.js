/**
 * r608 负例探针（全新子进程加载心虫）
 *
 * 存在原因：r608 测试的删块负例需要验证「删掉 forgettingEngine 注册行后，
 * dispatch 必须重新抛 route not allowed」。父进程 require.cache 已污染，
 * 同进程内改写源文件后 ALLOWED_ROUTES 是模块级缓存，注销不掉，负例测不出真红。
 * 因此拆成独立进程：由测试方先改写源文件、再拉起本探针、最后还原。
 *
 * 输出（stdout 最后一行必须是 JSON）：
 *   { ok, routes, modulesKey, modulesKeyCount, dispatchThrewNotAllowed }
 *   routes                   — forgettingEngine.* 路由条数
 *   modulesKey               — _modules 是否有 'forgettingEngine' 键
 *   modulesKeyCount          — _modules 键总数
 *   dispatchThrewNotAllowed  — dispatch 一条 forgettingEngine 路由是否抛 route not allowed
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
  routes = all.filter(r => r.startsWith('forgettingEngine.')).length;
  modulesKey = Object.prototype.hasOwnProperty.call(hf._modules || {}, 'forgettingEngine');
  modulesKeyCount = Object.keys(hf._modules || {}).length;

  try {
    hf.dispatch('forgettingEngine.checkForget', { id: 'neg-probe-1', content: '探测用记忆' });
  } catch (e) {
    dispatchThrewNotAllowed = /not allowed/i.test(String(e && e.message));
  }

  ok = true;
} catch (e) {
  error = String(e && e.message);
}

const out = JSON.stringify({ ok, routes, modulesKey, modulesKeyCount, dispatchThrewNotAllowed, error });
process.stdout.write('\n' + out + '\n');
