import { mkdirSync, writeFileSync } from 'node:fs'
import { dump } from 'js-yaml'
import { compile } from '../src/index.js'
import { definition } from './definition.js'

mkdirSync('./test/build', { recursive: true })

compile(definition)
	.then(({ code }) => {
		writeFileSync('./test/build/definition.json', JSON.stringify(definition, undefined, 4), 'utf8')
		writeFileSync('./test/build/definition.yaml', dump(definition), 'utf8')
		writeFileSync('./test/build/compiled.js', code, 'utf8')
	})
