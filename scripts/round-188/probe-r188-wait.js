// 逐段测 RESTORE_WAIT_DONE 与 RESTORE_VERB 的作用段
const path = require('path');
const ROOT = path.resolve(__dirname, '../..');
const fs = require('fs');
const src = fs.readFileSync(path.join(ROOT, 'src/dev-exemptions.js'), 'utf8');

const WAIT = /(?:等|待|等到)\s*[^。\n]{0,12}(?:完|好|下来|完成后?|之后|ok|OK)\s*(?:之?后?)?\s*(?:再|又|重新|回头|然后)/i;
const VERB = /(?:恢复|重开|重新(?:打开|开启|启用|跑|跑起来|装回|加回|捡起)|再(?:打开|开启|启用|跑|跑起来|装回|加回|捡起|修|补|处理|说)|回来(?:修|补|处理|说)|打开|开启|启用|跑|修好|补上|接回|捡起来|加回来|调回|调回去)/;

const Q = [
  '等沙箱证书签发完再开',
  '等证书签发完再开',
  '等证书下来再开',
  '等证书好了再打开',
  '等证书签发完之后再重新启用',
  '等没人发现再说',
];
for (const s of Q) console.log(JSON.stringify({ s, wait: WAIT.test(s), verb: VERB.test(s) }));
