'use strict';
// r379 第三轮诊断：漏判句的 collect 过滤原因定位。
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');
const dn = require(path.join(ROOT, 'src', 'duration-neglect.js'));
const I = dn.__internals();

const NEG_INSIDE_ZH = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不改变|不影响|不提升|不提高|不起|不灵|从不|绝不|永不|打死不|死活不|坚决不|并不|并没|而非|而不是|绝非|一点都|压根|根本|丝毫|完全没|压根没)/;
const KEEP_WEIGHT_ZH = /(?:同样|也|还是|并且|而且|同时|依然|仍然|依旧|固然|当然|自然|确实|真的|实在|分明|显然|众所周知|不可否认|没错|亦是)[^。，！？；\n]{0,10}$/;
const NEG_BEFORE_ZH = /(?:不能|不可|不应|不该|不准|不可以|不允许|无法|并不能|并未|并没有|不是|算不上|并非|不算|未必|不等于|不代表|能否|可否|说明不了|证明不了|尚待|还不能|并不会|不属于|不改变|不影响|不提升|不提高|不起|不灵|从不|绝不|永不|打死不|死活不|坚决不|不觉得|不感觉|没觉得|没感觉|谈不上|不会再|不会|不再|别|并未因|并没有因|不因|并不|并没)[^。，！？；\n]{0,6}$/;
const IMMEDIATE_NEG_ZH = /(?:不|没|未|无|非)$/;

const CASES = [
  { dec: '不影响', at: 9, t: '实验里被试忍受噪音的时长不影响满意度，只要结尾安静就行。' },
  { dec: '无所谓', at: 14, t: '这部电影前面两个小时再难看也无所谓，结尾精彩就是神作。' },
  { dec: '不算', at: 9, t: '军训那十五天多苦都不算事，最后一天会操整齐，整个军训就是好的。' },
  { dec: '不算数', at: 12, t: '受的罪持续多长时间根本不算数，结局圆满就行。' },
  { dec: '不起作用', at: 4, t: '疗程多长不起作用，症状消失就是痊愈。' },
];
for (const c of CASES) {
  const before10 = c.t.slice(Math.max(0, c.at - 10), c.at);
  const before6 = c.t.slice(Math.max(0, c.at - 6), c.at);
  const before24 = c.t.slice(Math.max(0, c.at - 24), c.at);
  console.log('「' + c.dec + '」 in 「' + c.t.slice(0, 18) + '」');
  console.log('   NEG_INSIDE=' + NEG_INSIDE_ZH.test(c.dec) + ' KEEP(b24)=' + KEEP_WEIGHT_ZH.test(before24) +
    ' NEG_BEFORE(b6)=' + NEG_BEFORE_ZH.test(before6) + ' IMM_NEG=' + IMMEDIATE_NEG_ZH.test(before6) + ' before6=' + JSON.stringify(before6));
}
