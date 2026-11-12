#!/usr/bin/env node
/**
 * r296 缺口实证探针：验证 r295 交接项「两个补腿缺口」是否真实存在
 *   缺口 A: inverse_gamblers_fallacy 英文腿 0 命中（'on his first shot' 形态漏判）
 *   缺口 B: ad_hominem 对「没资格评论」类 credential 形态 0 命中
 * 方法：直接 require src/ 下两个 provisional 模块，喂真实攻击样本 + 良性样本，
 *       记录命中/漏判/误伤。数字全部来自本回合真实运行。
 */
'use strict';
const path = require('path');
const SRC = path.resolve(__dirname, '..', '..', 'src');

function tryReq(file) {
  try { return { ok: true, mod: require(path.join(SRC, file)) }; }
  catch (e) { return { ok: false, err: e.message }; }
}

function run(mod, fnName, text, opts) {
  const fn = mod[fnName] || (mod.__internals && mod.__internals()[fnName]);
  if (typeof fn !== 'function') return { error: `no export ${fnName}` };
  try { return { result: fn(text, opts) }; } catch (e) { return { error: e.message }; }
}

// ---------- 缺口 A: inverse_gamblers_fallacy 英文腿 ----------
const igf = tryReq('inverse-gamblers-fallacy.js');
console.log('=== inverse-gamblers-fallacy module load ===');
console.log('load ok:', igf.ok, igf.ok ? '' : igf.err);
if (igf.ok) {
  const keys = Object.keys(igf.mod).filter(k => typeof igf.mod[k] === 'function');
  console.log('exports:', keys.join(', '));
  const int = igf.mod.__internals ? igf.mod.__internals() : null;
  if (int) {
    const ikeys = Object.keys(int).filter(k => typeof int[k] !== 'object' || Array.isArray(int[k]));
    console.log('__internals keys:', ikeys.slice(0, 40).join(', '));
    for (const k of ikeys) {
      const v = int[k];
      if (Array.isArray(v)) console.log(`  ${k}: array len=${v.length} sample=${JSON.stringify(v.slice(0, 2))}`);
      else if (v instanceof RegExp) console.log(`  ${k}: regex ${v}`);
      else if (typeof v === 'string') console.log(`  ${k}: str ${v.slice(0, 80)}`);
    }
  }
}
