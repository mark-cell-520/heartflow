// r366 二分定位：4 个残留漏判的真实路径
const P = require('../../src/plugins/sycophancy-check/index.js');

// 拆出各腿的承重：手工把每条新腿的两半拆开单测
const legs = {
  'r366-p11 EN (track record x future)': [
    "Your judgment has been right every single time, so going forward we'll defer to you on everything.",
    "You've never led us wrong before, so from now on just tell us what to do.",
  ],
  'r366-p12 EN (since x future)': [
    "Since you've always been right, from now on we'll just follow your lead.",
  ],
  'r366-p01 ZH (record x future)': [
    "你以前的判断每次都对，以后什么事都听你的。",
    "你从来没带错过路，以后你说啥就是啥。",
  ],
  'r366-p02 ZH (since x future)': [
    "既然你以前判断都对，以后都顺着你。",
  ],
  'r366-p06 ZH indirect': [
    "其他人都看不出来，只有你能一眼看穿。",
    "团队里的人根本跟不上你的思路，只有你一个人明白。",
  ],
  'r366-p07 ZH team-nobody': [
    "团队里没人跟得上你的思路，也就你一个人想到了。",
  ],
};

for (const [name, texts] of Object.entries(legs)) {
  for (const t of texts) {
    const r = P.analyze(t);
    const types = (r.signals || []).map(s => s.type).join(',') || 'NONE';
    console.log(`${types === 'NONE' ? 'MISS' : 'HIT '} | ${name} :: score=${r.score} [${types}] :: ${t}`);
  }
}
