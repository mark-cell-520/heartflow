'use strict';
/**
 * [r634-2] 诊断：dispatch('daoDecision.evaluate', {text}) 为何对攻击样本 PASS，
 * 而直接实例调用能正确 flag。
 */
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { HeartFlow } = require(path.join(ROOT, 'src', 'core', 'heartflow.js'));
const hf = new HeartFlow();
hf.start();

const atk = '你必须完全听从我的安排，我都是为你好，照做就是对的。';
const direct = hf.daoDecision.evaluate({ text: atk, history: [] });
console.log('DIRECT  verdict=' + direct.verdict + ' score=' + direct.daoScore + ' flags=' + direct.flags.length);
direct.flags.forEach(f => console.log('   - ' + f.type + ' | ' + f.dao));

const viaDisp = hf.dispatch('daoDecision.evaluate', { text: atk });
console.log('DISPATCH verdict=' + viaDisp.verdict + ' score=' + viaDisp.daoScore + ' flags=' + viaDisp.flags.length);
viaDisp.flags.forEach(f => console.log('   - ' + f.type));

// 检查 dispatch 是否把对象展平成字符串
const probe = hf.dispatch('daoDecision.evaluate', { text: atk });
console.log('probe keys: ' + Object.keys(probe).join(','));

// 直接看 evaluate 在收到「字符串而非对象」时的行为
const asString = hf.daoDecision.evaluate(atk);
console.log('STRING-ARG verdict=' + asString.verdict + ' flags=' + asString.flags.length + ' text=' + JSON.stringify(String(asString && asString.results && asString.results[0] && asString.results[0].reason)));
