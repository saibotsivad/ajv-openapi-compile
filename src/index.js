import { generate } from './generate.js'
import { bundle } from './bundle.js'

/**
 * Given an OpenAPI definition, compile into a JavaScript AJV validation module string.
 *
 * @param {Object} definition - The OpenAPI definition object.
 * @return {Promise<{ code: String}>} - The returned compiled code.
 */
export const compile = async (definition) => {
	const { schemaCode } = generate(definition)
	const { code } = await bundle(schemaCode)
	return { code }
}
