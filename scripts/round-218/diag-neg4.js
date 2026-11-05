'use strict';
const s = '谈判中双方各让一步，最终敲定了分期付款方案。';
const COND = /[^。]{0,24}(?:时|之际|的情况下|的话)[，,。][^。]{0,30}(?:可以|可|不妨|方能|才可|建议)/;
console.log('COND match:', COND.test(s));
if (COND.test(s)) console.log('matched text:', JSON.stringify(s.match(COND)[0]));
const fb = require('C:/Users/USER782663/AppData/Local/hermes/cache/scratch/fb-neutralized.js');
console.log('neutralized module hit:', fb.checkFalseBalance(s).hit);
// 直接复算各闸
const META = /(?:不(?:代表|等于|意味着|说明|证明)|不是.{0,8}(?:事实|真相|结论)|充其量|看似|貌似|美其名曰|所谓|话术|套路|谬误|谬论|陷阱|幻觉|把戏|手段|策略|手法|技巧|逻辑错误|逻辑谬误|认知偏误|偏差)/;
console.log('META:', META.test(s));
