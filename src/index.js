import AJV from 'ajv'
import addFormats from 'ajv-formats'
import standaloneCode from 'ajv/dist/standalone/index.js'

const ajv = new AJV({ code: { source: true } })
addFormats(ajv) // for OpenAPI schemas

const addSchema = (schema, $id) => {
	schema.$id = $id
	ajv.addSchema(schema, $id)
}

/**
 * Given an OpenAPI definition, compile into an AJV validation module string.
 *
 * @param {Object} definition - The OpenAPI definition object.
 * @param {Object} [definition.components]
 * @param {Object} [definition.components.parameters]
 * @param {Object} [definition.components.responses]
 * @param {Object} [definition.components.schemas]
 * @param {Object} [definition.paths]
 * @return {String}
 */
export const compile = definition => {
	for (const parameterName in (definition.components?.parameters || {})) {
		const schema = definition.components.parameters[parameterName].schema
		if (schema) {
			addSchema(schema, `#/components/parameters/${parameterName}`)
		}
	}

	for (const responseName in (definition.components?.responses || {})) {
		const jsonSchema = definition.components.responses[responseName].content?.['application/json']?.schema
		if (jsonSchema) {
			addSchema(jsonSchema, `#/components/responses/${responseName}`)
		}
	}

	for (const schemaName in (definition.components?.schemas || {})) {
		const schema = definition.components.schemas[schemaName]
		addSchema(schema, `#/components/schemas/${schemaName}`)
	}

	for (const path in (definition.paths || {})) {
		for (const method in definition.paths[path]) {
			const { requestBody, responses } = definition.paths[path][method]
			if (responses) {
				for (const status in responses) {
					let id = `#/response/${encodeURIComponent(path)}/${method}/${encodeURIComponent(status)}`
					let schema = definition.paths[path][method].responses[status]
					if (schema?.content?.['application/json']) {
						schema = schema.content['application/json']
					}
					if (schema.schema) {
						schema = schema.schema
					}
					addSchema(schema, id)
				}
			}
			if (requestBody?.content?.['application/json']?.schema) {
				const id = `#/request/${encodeURIComponent(path)}/${method}`
				const schema = requestBody.content['application/json'].schema
				addSchema(schema, id)
			}
		}
	}

	return standaloneCode.default(ajv)
}
