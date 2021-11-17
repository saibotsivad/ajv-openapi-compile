import { URL } from 'node:url'
import { rollup } from 'rollup'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'

const __dirname = new URL('.', import.meta.url).pathname

/**
 * Given an OpenAPI definition, compile into an AJV validation module string.
 *
 * @param {String} schemaCode - The generated AJV schema code.
 * @return {Promise<{ code: String }>} - The returned compiled code.
 */
export const bundle = async schemaCode => {
	// Related to this issue: https://github.com/ajv-validator/ajv/issues/1361
	// The issue is claimed to be resolved, but in fact is still going on.
	// The code responsible for generating code is here: https://github.com/ajv-validator/ajv/blob/master/lib/standalone/index.ts#L52-L88
	// but trying to read through to fix the problem makes me want to weep and then die.
	// Instead, I'm going to do something that I would normally consider horrifyingly bad:
	let overrideIndex = 0
	schemaCode = schemaCode
		.split(';')
		.map(line => {
			// if it has a validation reference we can replace it
			if (/validate\d+/.test(line)) line = line.replaceAll(/validate\d+/g, `validate${overrideIndex}`)
			// the assumption is that the function declaration is where
			// we should increment, this is based on inspecting generated
			// code, and not on any understanding of the despair-inducing
			// gen-code in AJV.
			if (/function\s+validate\d+/.test(line)) overrideIndex++
			return line
		})
		.join(';')

	schemaCode = 'const ____map = {};\n\n' + schemaCode.replaceAll('exports[', '____map[') + '\n\nmodule.exports = ____map;\n'

	const virtualLoader = () => ({
		name: 'virtual-loader',
		resolveId: source => source === 'virtual-module.cjs'? source : null,
		load: id => {
			return id === 'virtual-module.cjs' ? schemaCode : null
		},
	})

	// ajv/dist/runtime/equal
	const bundle = await rollup({
		input: 'virtual-module.cjs',
		plugins: [
			virtualLoader(),
			nodeResolve({
				rootDir: __dirname,
			}),
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
