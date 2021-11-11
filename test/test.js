import { test } from 'uvu'
import * as assert from 'uvu/assert'
import schemas from './build/schema.js'
import tree from './build/tree.js'
import { getIdString, getSchema } from '../src/index.js'

const expectedSchemaIds = [
	'#/components/parameters/taskId/schema',
	'#/components/requestBodies/task/content/application%2Fjson/schema',
	'#/components/headers/cookie/schema',
	'#/components/responses/error/content/application%2Fjson/schema',
	'#/components/schemas/error',
]

const expectedSchemaIdAliasToId = [
	[[ 'components', 'parameters', 'aliasedTaskId', 'schema' ], '#/components/parameters/taskId/schema' ],
	[[ 'components', 'requestBodies', 'aliasedTask', 'content', 'application/json', 'schema' ], '#/components/requestBodies/task/content/application%2Fjson/schema' ],
	[[ 'components', 'headers', 'aliasedCookie', 'schema' ], '#/components/headers/cookie/schema' ],
	[[ 'components', 'responses', 'aliasedError', 'content', 'application/json', 'schema' ], '#/components/responses/error/content/application%2Fjson/schema' ],
	[[ 'components', 'schemas', 'aliasedError' ], '#/components/schemas/error' ],
	[[ 'paths', '/login', 'post', 'responses', 'default', 'content', 'application/json', 'schema' ], '#/components/responses/error/content/application%2Fjson/schema' ],
]

test('validate that the schemas are getting built correctly', () => {
	assert.type(schemas, 'object')
	for (const id of expectedSchemaIds) {
		assert.type(schemas[id], 'function', `is a function: ${id}`)
	}

	for (const [ path, finalId ] of expectedSchemaIdAliasToId) {
		assert.equal(getIdString({ tree, path }), finalId, `alias points to correct final id: ${path}`)
	}
})

test('components.parameters', () => {
	const run = path => {
		const validate = getSchema({ tree, schemas, path })
		const valid1 = validate('aaa')
		assert.ok(valid1, 'it should be good as a string')
		const valid2 = validate(111)
		assert.not.ok(valid2, 'it should be bad as a number')
		assert.equal(validate.errors.length, 1)
		assert.equal(validate.errors[0].message, 'must be string', 'an AJV error message')
	}
	run('#/components/parameters/taskId/schema')
	run('#/components/parameters/aliasedTaskId/schema')
})

test.run()
