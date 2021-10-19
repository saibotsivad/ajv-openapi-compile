import { writeFileSync } from 'node:fs'
import { compile } from '../src/index.js'

const codeString = compile({

})

// Note that AJV outputs CommonJS formatted code, so you'll need to
// write it out to `.cjs` if your `package.json` has `type: module`.
writeFileSync('./test/schemas.cjs')
