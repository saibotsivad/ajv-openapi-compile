import { writeFileSync } from 'node:fs'
import { compile } from '../src/index.js'
import { definition } from './definition.js'

const codeString = compile(definition)

writeFileSync('./test/compiled.cjs', codeString, 'utf8')
