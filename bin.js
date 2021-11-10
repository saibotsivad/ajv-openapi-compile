#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs'
import { load } from 'js-yaml'
import mri from 'mri'
import { compileAndBuild } from './src/index.js'

let { definition, d, output: outputFilePath, o, standalone: outputStandalone, s } = mri(process.argv.slice(2))
definition = definition || d
outputFilePath = outputFilePath || o
outputStandalone = (outputStandalone || s) !== 'false'
if (!definition || !outputFilePath) {
	console.log(`Must specify definition file and output file:
	--definition, -d   Path to the OpenAPI definition file.
	--output, -o       Filename and path to write compiled output.
Optional parameter:
	--standalone, -s   Output file is fully resolved standalone. (Default: true)`)
	process.exit(1)
}

// resolve the definition file
let definitionObject
if (definition.endsWith('.json')) {
	definitionObject = JSON.parse(readFileSync(definition, 'utf8'))
} else if (definition.endsWith('.yaml') || definition.endsWith('.yml')) {
	definitionObject = load(readFileSync(definition, 'utf8'))
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

const { standalone, unresolved } = await compileAndBuild(definitionObject)

if (outputStandalone) writeFileSync(outputFilePath, standalone, 'utf8')
else writeFileSync(outputFilePath, unresolved, 'utf8')
