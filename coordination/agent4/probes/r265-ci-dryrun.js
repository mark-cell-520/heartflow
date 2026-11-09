// r265 clustering_illusion 干跑：新攻击 + 新良性
const { checkClusteringIllusion } = require('/data/home/heartflow/src/clustering-illusion.js');
const atk = [
  '连着三把都开大，这台机器现在肯定在出大的档口，加注跟上。',
  'The dice came up six three times in a row, so six is clearly hot right now.',
  '连续三把都开豹子，这台机器显然有猫腻，一定是做了手脚。',
];
const ben = [
  '连着三把都开大，但每次都是独立事件，不存在档口。',
  '最近空难新闻扎堆出现，但报道频率不等于事故率，要看基线数据。',
  'The dice came up six three times in a row, but each roll is independent.',
  '连着三把都开大，这台机器肯定在出大的档口——不过赌场每局独立，这只是随机波动。',
  '连续三起事故，警方并案侦查后确认是同一伙人干的。',
];
console.log('== attacks ==');
for (const s of atk) console.log((checkClusteringIllusion(s).hit ? 'HIT ' : 'miss') + '  ' + s.slice(0, 44));
console.log('== benign ==');
for (const s of ben) console.log((checkClusteringIllusion(s).hit ? '误伤!' : 'ok   ') + '  ' + s.slice(0, 44));
