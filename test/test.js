import { test } from 'uvu'
import * as assert from 'uvu/assert'
import { definition } from './definition.js'
import schemas from './build/schema.js'
import { resolve } from 'pointer-props'

const expectedSchemaIds = [
	'#/components/parameters/taskId/schema',
	'#/components/parameters/filter/schema',
	'#/components/requestBodies/task/content/application~1json/schema',
	'#/components/headers/cookie/schema',
	'#/components/responses/error/content/application~1json/schema',
	'#/components/schemas/error',
	'#/paths/~1login/post/responses/204/headers/Set-Cookie/schema',
	'#/paths/~1tasks~1{taskId}/parameters/1/schema',
	'#/paths/~1tasks~1{taskId}/patch/parameters/0/schema',
	'#/paths/~1tasks~1{taskId}/patch/responses/200/content/application~1json/schema',
]

test('validate that the schemas are getting built correctly', () => {
	assert.type(schemas, 'object')
	for (const id of expectedSchemaIds) {
		assert.type(schemas[id], 'function', `is a function: ${id}`)
	}
})

const schemaIdToTests = {
	'#/paths/~1tasks~1{taskId}/parameters/1/schema': [
		{
			valid: true,
			value: 'foo',
		},
		{
			valid: false,
			value: 3,
		},
	],
	'#/paths/~1tasks~1{taskId}/patch/parameters/0/schema': [
		{
			valid: true,
			value: 'foo',
		},
		{
			valid: false,
			value: 3,
		},
	],
}

test('some specifics about the schemas to make sure they are defined correctly', () => {
	for (const schemaId in schemaIdToTests) {
		let index = 0
		for (const { valid, value } of schemaIdToTests[schemaId]) {
			const validate = schemas[schemaId]
			const isValid = validate(value)
			// if (!isValid) console.log(validate.errors)
			assert.equal(!!isValid, valid, `${schemaId} @ ${index}`)
			index++
		}
	}
})

const expectedSchemaIdAliasToId = [
	[
		[ 'components', 'parameters', 'aliasedTaskId', 'schema' ],
		[ 'components', 'parameters', 'taskId', 'schema' ],
	],
	[
		[ 'components', 'requestBodies', 'aliasedTask', 'content', 'application/json', 'schema' ],
		[ 'components', 'requestBodies', 'task', 'content', 'application/json', 'schema' ],
	],
	[
		[ 'components', 'headers', 'aliasedCookie', 'schema' ],
		[ 'components', 'headers', 'cookie', 'schema' ],
	],
	[
		[ 'components', 'responses', 'aliasedError', 'content', 'application/json', 'schema' ],
		[ 'components', 'responses', 'error', 'content', 'application/json', 'schema' ],
	],
	[
		[ 'components', 'schemas', 'aliasedError' ],
		[ 'components', 'schemas', 'error' ],
	],
	[
		[ 'paths', '/login', 'post', 'responses', 'default', 'content', 'application/json', 'schema' ],
		[ 'components', 'responses', 'error', 'content', 'application/json', 'schema' ],
	],
	[
		[ 'paths', '/tasks/{taskId}', 'parameters', '0' ],
		[ 'components', 'parameters', 'taskId' ],
	],
	[
		[ 'paths', '/tasks/{taskId}', 'patch', 'parameters', '1' ],
		[ 'components', 'parameters', 'filter' ],
	],
	[
		[ 'paths', '/tasks/{taskId}', 'patch', 'responses', 'default', 'content', 'application/json', 'schema' ],
		[ 'components', 'responses', 'error', 'content', 'application/json', 'schema' ],
	],
]

test('the aliases all map correctly', () => {
	for (const [ aliased, actual ] of expectedSchemaIdAliasToId) {
		const resolved = resolve(definition, aliased)
		assert.equal(resolved, actual)
	}
})

test.run()
