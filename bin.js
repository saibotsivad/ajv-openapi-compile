#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs'
import { load } from 'js-yaml'
import mri from 'mri'
import { compile } from './src/index.js'

let { definition, d, schema: schemaFilePath, s, tree: treeFilePath, t } = mri(process.argv.slice(2))
definition = definition || d
schemaFilePath = schemaFilePath || s
treeFilePath = treeFilePath || t
if (!definition || !schemaFilePath) {
	console.log(`Must specify definition file and output schema file:
	--definition, -d   Path to the OpenAPI definition file.
	--schema, -s         Filename and path to write compiled schemas.
	--tree, -t         Filename and path to write generated schema tree. (Optional.)`)
	process.exit(1)
}

const work = async () => {
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

	const { code, tree } = await compile(definitionObject)

	writeFileSync(schemaFilePath, code, 'utf8')
	if (treeFilePath) writeFileSync(treeFilePath, tree, 'utf8')
}

work().then(() => console.log('Wrote to file:', schemaFilePath))
