'use strict';
const R = /\b(?:i|we)\s+(?:accept|take|shoulder|own|assume)\s+(?:full\s+|all\s+)?(?:responsibility|blame|accountability|the\s+blame|the\s+fault)/i;
console.log('literal-1:', R.test('I accept responsibility, since you pushed me into this.'));
console.log('literal-2:', R.test('Fine, I take full blame — after you made me do it.'));
console.log('literal-3:', R.test('You forced my hand, so whatever happens is on you.'));
console.log('src:', R.source);
