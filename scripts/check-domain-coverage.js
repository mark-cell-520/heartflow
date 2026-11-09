const fs=require('fs');
const {matchDomain}=require('../src/knowledge/classics-rules');
const files=[
 ['孝经','/root/.hermes/skills/daizhigev20/儒藏/孝经/孝经.txt'],
 ['论语','/root/.hermes/skills/daizhigev20/儒藏/四书/论语.txt'],
 ['孟子','/root/.hermes/skills/daizhigev20/儒藏/四书/孟子.txt'],
 ['大学','/root/.hermes/skills/daizhigev20/儒藏/四书/大学.txt'],
 ['中庸','/root/.hermes/skills/daizhigev20/儒藏/四书/中庸.txt'],
 ['道德经','/root/.hermes/skills/daizhigev20/道藏/道德经/道德经.txt'],
 ['南华经','/root/.hermes/skills/daizhigev20/道藏/南华经/南华经.txt'],
 ['四十二章经','/root/.hermes/skills/daizhigev20/佛藏/乾隆藏/小乘阿含部/佛说四十二章经.txt'],
 ['法句经','/root/.hermes/skills/daizhigev20/佛藏/乾隆藏/西土圣贤撰集/法句经.txt'],
 ['八大人觉经','/root/.hermes/skills/daizhigev20/佛藏/乾隆藏/大乘单译经/佛说八大人觉经.txt'],
 ['金刚经','/root/.hermes/skills/daizhigev20/佛藏/乾隆藏/大乘单译经/金刚经.txt'],
];
let skipped=0, checked=0;
for (const [name,path] of files) {
  // [audit 2026-11-09] 语料目录随机器不同（本机无 daizhigev20 儒藏/道藏/佛藏）：
  // 缺文件时记 SKIP 并继续，不抛 ENOENT 崩掉整轮审计。
  if (!fs.existsSync(path)) { console.log(name.padEnd(10)+' => SKIP (语料缺失: '+path+')'); skipped++; continue; }
  const text=fs.readFileSync(path,'utf-8');
  const d=matchDomain(text);
  console.log(name.padEnd(10)+' => '+(d?d.id:'null').padEnd(22)+' ('+text.length+' chars)');
  checked++;
}
if (checked===0) { console.log('domain-coverage: 0 个语料可用（全部 SKIP），本机无儒藏/道藏/佛藏语料'); }
else { console.log('domain-coverage: '+checked+' 个已检查, '+skipped+' 个 SKIP'); }
