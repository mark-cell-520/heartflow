// 逐段窗口量化：找出完整正则断在哪一段
'use strict';
const S = '只统计跑通的那几轮实验，失败的其余全部丢掉';

// 完整正则的分段参数，逐段替换成宽松版找断点
const V = {
  verb: /(?:只|仅|光)\s*(?:平均|求平均|取平均|算平均|统计|只算|算)/,
  gap1: /[^。\n]{0,10}/,
  objHalf: /(?:表现|跑|成绩|分数|结果|数据)/,
  gap2: /[^。\n]{0,8}/,
  good: /(?:好|正常|成功|有效|通过|不错|达标)/,
  de: /[^。\n]{0,6}(?:的)?/,
  gap3: /[^。\n]{0,10}/,
  instr: /(?:那|这|几|这些|那些)/,
  gap4: /[^。\n]{0,8}/,
  unit: /(?:批|次|轮|组|个|回)/,
  objName: /[^。\n]{0,6}(?:运行|样本|数据|结果|记录|实验)?/,
  gap5: /[^。\n]{0,14}/,
  comma: /(?:，|,)?/,
  scope: /(?:差的|失败的|不好的|其余的|其他的|剩下的)/,
  gap6: /[^。\n]{0,6}/,
  range: /(?:全部|全都|一概|统统|全|都)?/,
  verb2: /(?:不管|不管了|丢掉|舍弃|剔除|排除|删掉|去掉|不算|不计|忽略|不管它)/,
};

// 逐段累计拼接并测试
const order = ['verb', 'gap1', 'objHalf', 'gap2', 'good', 'de', 'gap3', 'instr', 'gap4',
               'unit', 'objName', 'gap5', 'comma', 'scope', 'gap6', 'range', 'verb2'];
let acc = '';
let lastOk = '';
for (const k of order) {
  const prev = acc;
  acc += V[k].source;
  if (new RegExp(acc, 'i').test(S)) { lastOk = k; }
  else {
    console.log(`❌ 断点在加入「${k}」处`);
    console.log(`  前缀(到 ${lastOk}): ${prev}`);
    console.log(`  加入段: ${V[k].source}`);
    // 显示从 lastOk 结尾开始的剩余样本
    const m = new RegExp(prev, 'i').exec(S);
    if (m) console.log(`  剩余待匹配: 「${S.slice(m.index + m[0].length)}」`);
    break;
  }
}
// 若全过
if (lastOk === order[order.length - 1]) console.log('✅ 全段通过');
