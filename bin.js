#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs'
import mri from 'mri'
import { compile } from './src/index.js'

let { definition, d, output, o } = mri(process.argv.slice(2))
definition = definition || d
output = output || o
if (!definition || !output) {
	console.log('Must specify definition file and output file.\n  --definition, -d   Path to the OpenAPI definition file.\n  --output, -o       Filename and path to write compiled output.')
	process.exit(1)
}

// resolve the definition file
let definitionObject
if (definition.endsWith('.json')) {
	definitionObject = JSON.parse(readFileSync(definition, 'utf8'))
} else {
	const imported = await import(definition)
	if (imported.definition?.paths) definitionObject = imported.definition
	else if (imported.paths) definitionObject = imported
	else if (imported.default?.paths) definitionObject = imported.default
}
if (!definitionObject) {
	console.log('Could not resolve definition file:', definition)
	process.exit(1)
}

const codeString = compile(definitionObject)

writeFileSync(output, codeString, 'utf8')
