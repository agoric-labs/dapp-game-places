import 'ses'; // adds lockdown, harden, and Compartment
import '@endo/eventual-send/shim.js'; // adds support needed by E
import { Buffer } from 'buffer';

const consoleTaming = import.meta.env.DEV ? 'unsafe' : 'safe';

lockdown({
  errorTaming: 'unsafe',
  overrideTaming: 'severe',
  consoleTaming,
});

Error.stackTraceLimit = Infinity;

globalThis.Buffer = Buffer;

// @ts-expect-error Add process to context for cosmos-kit
globalThis.process = { env: import.meta.env };
