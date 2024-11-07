import 'ses'; // adds lockdown, harden, and Compartment
import '@endo/eventual-send/shim.js'; // adds support needed by E

const consoleTaming = process.env.NODE_ENV !== 'production' ? 'unsafe' : 'safe';

lockdown({
  errorTaming: 'unsafe',
  overrideTaming: 'severe',
  consoleTaming,
});
console.log('SES lockdown successful!');
Error.stackTraceLimit = Infinity;
