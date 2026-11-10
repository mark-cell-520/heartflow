#!/usr/bin/env node
/** 检查 analyze 返回的真实形状 */
const path = require('path');
const HF = path.resolve(__dirname, '../..');
const { InferenceChain } = require(path.join(HF, 'src/reasoning/inference-chain.js'));
const ic = new InferenceChain({ silent: true });

const chain = ic.createChain('test');
console.log('createChain 返回:', JSON.stringify(chain).slice(0, 300));
const chainId = chain.chainId || chain.id;
const s1 = ic.addStep(chainId, { type: 'premise', text: '如果下雨，地面就会湿。' });
console.log('addStep 返回:', JSON.stringify(s1).slice(0, 300));
const s2 = ic.addStep(chainId, { type: 'inference', text: '没有下雨，所以地面不湿。' });
console.log('addStep2 返回:', JSON.stringify(s2).slice(0, 300));
const an = ic.analyze(chainId);
console.log('analyze 顶层键:', Object.keys(an));
console.log('analyze JSON:', JSON.stringify(an).slice(0, 2000));
