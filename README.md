# `kitsy`

Monkey-patching toolkit to make it easier and cleaner to run code before and after functions or to inject new code into script tags

Based on work by [@mildmojo](https://github.com/mildmojo) in [bitsy-hacks](https://github.com/seleb/bitsy-hacks)

## How to use

```sh
npm i kitsy
```

Example:

```ts
import { kitsy } from "kitsy";

// set up hooks/injections

kitsy.before('someGlobal.someFn', () => { console.log('before someGlobal.someFn') });
kitsy.after('someGlobal.someFn', () => { console.log('after someGlobal.someFn') });
kitsy.inject(/(some code)/, 'injected before some code $1 injected after some code');

// call
kitsy.applyInjects();
// between applying injections and hooks,
// reinitialize any globals that referred to injected code
kitsy.applyHooks();
```
