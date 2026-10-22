'use strict';
const tn = require('../src/text-normalizer.js');
const samples = [
  "You don't have to bear the cost, so who are you to object?",
  "The fallout lands on them, so your objection is irrelevant.",
];
samples.forEach(s => {
  const n = tn.normalize(s);
  console.log('NORM:', JSON.stringify(n.normalized));
});
