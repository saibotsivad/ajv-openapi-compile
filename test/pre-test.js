import { mkdirSync, writeFileSync } from 'node:fs'
import { dump } from 'js-yaml'
import { compileAndBuild } from '../src/index.js'
import { definition } from './definition.js'

await mkdirSync('./test/build', { recursive: true })

const { standalone } = await compileAndBuild(definition)

writeFileSync('./test/build/definition.json', JSON.stringify(definition, undefined, 4), 'utf8')
writeFileSync('./test/build/definition.yaml', dump(definition), 'utf8')
writeFileSync('./test/build/compiled.js', standalone, 'utf8')
