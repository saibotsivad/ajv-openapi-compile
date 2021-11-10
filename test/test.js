import { test } from 'uvu'
import * as assert from 'uvu/assert'
import schemas from './build/compiled.js'

const expectedSchemaIds = [
	'#/components/parameters/taskId/schema'
]

const expectedSchemaIdAliasToId = [
	[ [ 'components', 'parameters', 'aliasedTaskId', 'schema' ], '#/components/parameters/taskId/schema' ],
	[ [ 'components', 'requestBodies', 'aliasedRequestBody', 'content', 'application/json', 'schema' ], '#/components/requestBodies/task/content/application%2Fjson/schema' ]
]

test('validate that the schemas are getting built correctly', () => {
	assert.type(schemas, 'object')
	for (const id of expectedSchemaIds) {
		assert.type(schemas[id], 'function', `is a function: ${id}`)
	}

	for (const [ aliasId, finalId ] of expectedSchemaIdAliasToId) {
		assert.equal(schemas.getId(...aliasId), finalId, `alias points to correct final id: ${aliasId}`)
	}

	const validate = schemas['#/components/parameters/taskId/schema']
	const valid1 = validate('aaa')
	assert.ok(valid1, 'it should be good as a string')
	const valid2 = validate(111)
	assert.not.ok(valid2, 'it should be bad as a number')
	assert.equal(validate.errors.length, 1)
	assert.equal(validate.errors[0].message, 'must be string', 'an AJV error message')
})

test.run()
