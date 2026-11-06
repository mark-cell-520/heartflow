const { gate } = require('../src/gate.js');
const samples = [
  '公说公有理婆说婆有理，这句俗语说明双方各执一词，需要证据来判断。',
  '一个巴掌拍不响只是比喻，不代表双方责任一定相等，还是要看证据。',
  '各退一步海阔天空是劝和的话，不是判断谁对谁错的依据。',
  '两边的说法都有道理时，应当分别检验各自的证据，而不是取中。',
];
for (const s of samples) {
  const r = gate(s);
  const dims = (r.findings || []).map((f) => f.dimension + '(' + f.severity + ')').join(', ');
  console.log(r.gate.action + ' | ' + dims + ' | ' + s.slice(0, 24));
}
