import { URL } from 'node:url'
import { join } from 'node:path'

import AJV from 'ajv'
import addFormats from 'ajv-formats'
import standaloneCode from 'ajv/dist/standalone/index.js'
import set from 'just-safe-set'
import { rollup } from 'rollup'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

const __dirname = new URL('.', import.meta.url).pathname

const ajv = new AJV({ code: { source: true } })
addFormats(ajv) // for OpenAPI schemas

const addSchema = (schema, $id) => {
	schema.$id = $id
	const { errors } = ajv.addSchema(schema, $id)
	if (errors) console.error('Error while adding schema!', $id, errors)
}

export const __compile = definition => {
	const schemaTree = {}
	const addToTree = (schema, ...keys) => {
		const id = `#/${keys.map(k => encodeURIComponent(k)).join('/')}`
		set(
			schemaTree,
			keys,
			schema.$ref
				? { $ref: schema.$ref.replace(/^#\//, '').split('/') }
				: { $sch: id },
		)
		if (!schema.$ref) addSchema(schema, id)
	}
	const addToTreeRefOrSchema = (obj, ...keys) => {
		if (obj.$ref) addToTree(obj, ...keys)
		else if (obj.schema) addToTree(obj.schema, ...keys, 'schema')
	}

	for (const schemaName in (definition.components?.schemas || {})) {
		addToTree(definition.components.schemas[schemaName], 'components', 'schemas', schemaName)
	}

	for (const responseName in (definition.components?.responses || {})) {
		const response = definition.components.responses[responseName]
		const keys = [ 'components', 'responses', responseName ]
		if (response.$ref) {
			addToTree(response, ...keys)
		} else {
			for (const mediaType in (response.content || {})) {
				addToTreeRefOrSchema(response.content[mediaType], ...keys, 'content', mediaType)
			}
			for (const headerName in (response.headers || {})) {
				addToTreeRefOrSchema(response.headers[headerName], ...keys, 'headers', headerName)
			}
		}
	}

	for (const parameterName in (definition.components?.parameters || {})) {
		addToTreeRefOrSchema(definition.components.parameters[parameterName], 'components', 'parameters', parameterName)
	}

	for (const requestBodyName in (definition.components?.requestBodies || {})) {
		const requestBody = definition.components.requestBodies[requestBodyName]
		const keys = [ 'components', 'requestBodies', requestBodyName ]
		if (requestBody.$ref) {
			addToTree(requestBody, ...keys)
		} else {
			for (const mediaType in (requestBody.content || {})) {
				addToTreeRefOrSchema(requestBody.content[mediaType], ...keys, 'content', mediaType)
			}
		}
	}

	for (const headerName in (definition.components?.headers || {})) {
		addToTreeRefOrSchema(definition.components.headers[headerName], 'components', 'headers', headerName)
	}

	for (const path in (definition.paths || {})) {
		// parameters common to the path (an array)
		let pathParamIndex = 0
		for (const parameter of (path.parameters || [])) {
			addToTreeRefOrSchema(parameter, 'paths', path, 'parameters', pathParamIndex)
			pathParamIndex++
		}

		for (const method in definition.paths[path]) {
			const keys = [ 'paths', path, method ]
			const { parameters, requestBody, responses } = definition.paths[path][method]
			if (parameters) {
				let methodParamIndex = 0
				for (const parameter of parameters) {
					addToTreeRefOrSchema(parameter, ...keys, 'parameters', methodParamIndex)
					methodParamIndex++
				}
			}
			if (requestBody) {
				if (requestBody.$ref) {
					addToTree(requestBody, ...keys, 'requestBody')
				} else {
					for (const mediaType in (requestBody.content || {})) {
						addToTreeRefOrSchema(requestBody.content[mediaType], ...keys, 'requestBody', 'content', mediaType)
					}
				}
			}
			if (responses) {
				for (const status in responses) {
					let response = responses[status]
					let statusKeys = [ ...keys, 'responses', status ]
					if (response.$ref) {
						addToTree(response, ...statusKeys)
					} else {
						if (response.headers) {
							for (const headerName in response.headers) {
								addToTreeRefOrSchema(response.headers[headerName], ...statusKeys, 'headers', headerName)
							}
						}
						if (response.content) {
							for (const mediaType in response.content) {
								addToTreeRefOrSchema(response.content[mediaType].schema, ...statusKeys, 'content', mediaType)
							}
						}
					}
				}
			}
		}
	}

	return { schemaCode: standaloneCode.default(ajv), schemaTree }
}

/**
 * Given an OpenAPI definition, compile into an AJV validation module string.
 *
 * @param {Object} definition - The OpenAPI definition object.
 * @return {Promise<{ code: String }>} - The returned compiled code.
 */
export const compile = async (definition) => {
	const { schemaCode, schemaTree } = __compile(definition)

	const generatedCode = `/* GENERATED CODE */
const __schemaTree = ${JSON.stringify(schemaTree)};
import * as ajvSchemas from './virtual-ajv-schemas.cjs';
import { __getId, __getSchema } from '${join(__dirname, 'schema-helpers.js')}';
export { ajvSchemas as schemas }
export const getId = __getId(__schemaTree)
export const getSchema = __getSchema(__schemaTree, ajvSchemas)
`

	const virtualLoader = () => ({
		name: 'virtual-loader',
		resolveId: source => source === 'virtual-module.js' || source === './virtual-ajv-schemas.cjs' ? source : null,
		load: id => {
			return id === 'virtual-module.js' ? generatedCode : (id === './virtual-ajv-schemas.cjs' ? schemaCode : null)
		},
	})

	const bundle = await rollup({
		input: 'virtual-module.js',
		plugins: [
			virtualLoader(),
			nodeResolve(),
			commonjs(),
		],
	})
	const { output } = await bundle.generate({
		inlineDynamicImports: true,
		format: 'es',
	})
	if (output.length > 1) throw new Error('Unexpected Rollup output!')
	const code = output[0].code
	await bundle.close()

	return { code }
}
