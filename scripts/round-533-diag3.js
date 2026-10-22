'use strict';
const R = new RegExp([
  '\\b(?:i|we)\\s+(?:accept|take|shoulder|own|assume)\\s+(?:full\\s+|all\\s+)?(?:responsibility|blame|accountability|the\\s+blame|the\\s+fault)',
].join('|'), 'i');
console.log('minimal:', R.test('I accept responsibility, since you pushed me into this.'));
console.log('src:', R.source);
const R2 = /\b(?:i|we)\s+(?:accept|take)\s+(?:full\s+|all\s+)?(?:responsibility|blame)\b/i;
console.log('literal:', R2.test('I accept responsibility, since you pushed me into this.'));
