'use strict';
// [r218] S5 不连坐单测失败归因
const pe = require('C:/Users/USER782663/heartflow-engine/src/perfect-error.js');
const t = '所有用户都必须定期修改密码。所有产品都是史上最好的。';
const r = pe.checkPerfectError(t);
console.log(JSON.stringify(r, null, 1));
// 直接测正则
const S5 = /(?:所有|一切|全部|任何|每一个|总是|从不|从来|永远|绝对|完全|彻底|必定|必然|一定)\s*[^，,。.、\n!?！？]{0,12}(?:是|都|会|能|要|必须|不会|不可能)/gi;
const DZ = /(?:所有|一切|全部|任何|每一个|总是|从不|从来|永远)\s*[^。，,；;！!？?\n]{0,16}(?:有权|无权|不得|不能|不可|不准|不许|不允许|禁止|严禁|切勿|请勿|勿|应当|应该|应|需|需要|必须|只[允能]?许|允许|容许|予以|加以|方可|才可)/g;
let m; console.log('S5 matches:');
while ((m = S5.exec(t)) !== null) console.log('  ', m.index, JSON.stringify(m[0]));
DZ.lastIndex = 0; console.log('deontic spans:');
while ((m = DZ.exec(t)) !== null) console.log('  ', m.index, JSON.stringify(m[0]));
