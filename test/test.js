import { test } from 'uvu'
import * as assert from 'uvu/assert'
import schemas from './compiled.cjs'

const expectedSchemaIds = [
	'#/components/parameters/taskId'
]

test('validate that the schemas are getting built correctly', () => {
	assert.type(schemas, 'object')
	for (const id of expectedSchemaIds) {
		assert.type(schemas[id], 'function', `is a function: ${id}`)
	}

	const validate = schemas['#/components/parameters/taskId']
	const valid1 = validate('aaa')
	assert.ok(valid1, 'it should be good as a string')
	const valid2 = validate(111)
	assert.not.ok(valid2, 'it should be bad as a number')
	assert.equal(validate.errors.length, 1)
	assert.equal(validate.errors[0].message, 'must be string', 'an AJV error message')
})

test.run()
