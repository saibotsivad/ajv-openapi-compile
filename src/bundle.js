import { rollup } from 'rollup'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

/**
 * Given an OpenAPI definition, compile into an AJV validation module string.
 *
 * @param {String} schemaCode - The generated AJV schema code.
 * @return {Promise<{ code: String }>} - The returned compiled code.
 */
export const bundle = async schemaCode => {
	// I can't figure out what this is for, in the compiled code it gets inserted but
	// doesn't get referenced anywhere. Possibly mutating a global? Gross. Anyway, it
	// links to this github repo, but I didn't find it helpful at all.
	// https://github.com/ajv-validator/ajv/issues/889
	// const modifiedSchemaCode = schemaCode.replace('const func0 = require("ajv/dist/runtime/equal").default', '')

	schemaCode = 'const ____map = {};\n\n' + schemaCode.replaceAll('exports[', '____map[') + '\n\nmodule.exports = ____map;\n'

	const virtualLoader = () => ({
		name: 'virtual-loader',
		resolveId: source => source === 'virtual-module.cjs'? source : null,
		load: id => {
			return id === 'virtual-module.cjs' ? schemaCode : null
		},
	})

	const bundle = await rollup({
		input: 'virtual-module.cjs',
		plugins: [
			virtualLoader(),
			nodeResolve(),
			commonjs({
				transformMixedEsModules: true,
			}),
		],
	})
	const result = await bundle.generate({
		inlineDynamicImports: true,
		format: 'es',
		exports: 'default',
	})
	if (result.output.length > 1) throw new Error('Unexpected Rollup output!')
	const code = result.output[0].code
	await bundle.close()

	return { code }
}
