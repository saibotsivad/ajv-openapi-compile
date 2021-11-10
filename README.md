# ajv-openapi-compile

Given an OpenAPI definition, compile into AJV validation modules to be used in environments (like Cloudflare Workers) where `eval` is not available, or a single JavaScript file is desired.

## Install

The normal way:

```shell
npm install --save-dev ajv-openapi-compile
```

## Using It

You can use the CLI tool, as part of your build process:

```shell
ajv-openapi-compile --definition=/path/to/openapi.json --output=/path/to/compiled.js
```

You can also use in your build scripts:

```js
import { compile } from 'ajv-openapi-compile'
import { readFile, writeFile } from 'node:fs'
const definition = JSON.parse(await readFile('/path/to/openapi.json', 'utf8'))
const code = compile(definition)
await writeFile('/path/to/compiled.js', code, 'utf8')
```

If you know the fully-resolved schema id, you can access the validation function explicitly:

```js
import schemas from '/path/to/compiled.js'
const validate = schemas['#/components/schema/error']
const valid = validate({ code: 404 })
if (!valid) console.log(validate.errors)
```

If you don't know the fully-resolved schema id, you can use the `getSchemaId` to get it, or `getSchema` to get  validation function after resolving all `$ref` paths.

For example, given a definition like this:

```json
{
	"paths": {
		"/users": {
			"get": {
				"responses": {
					"default": { "$ref": "#/components/responses/error" }
				}
			}
		}
	},
	"components": {
		"responses": {
			"content": {
				"application/json": {
					"schema": { "$ref": "#/components/schemas/error" }
				}
			}
		},
		"schemas": {
			"error": {
				"type": "object",
				"properties": {
					"code": { "type": "number" }
				}
			}
		}
	}
}
```

Using the `getSchema` function to get the schema:

```js
import schemas from '/path/to/compiled'
const path = [ 'paths', '/api/v1/users/{userId}', 'get', 'responses', 'default', 'content', 'application/json', 'schema' ]
// get the schema id:
schemas.getSchemaId(...path) // => "#/components/schema/error"
// or get the validation function:
const validate = schemas.getSchema(...path) // => function
```

## CLI `ajv-openapi-compile`

The CLI only takes two parameters:

- `---definition, -d` The path to the definition JSON file.
- `---output, -o` The path to write the compiled AJV validation code.

For convenience in using with other tooling, the `definition` parameter also supports importing JavaScript files, and will follow this algorithm:

1. If the file extension is `.json` read and parse as JSON
2. Otherwise, attempt importing `* as schema`
3. If `schema.definition` is set, use that
4. Otherwise, try using `schema`
5. Otherwise, try importing the default as `schema` and try that

To be considered valid, the imported schema definition must have a `paths` object, with at least one "Path Object" defined.

## API: `function(definition: Object) => { schemaCode: String, schemaTree: Object }`

The function simply takes a valid OpenAPI 3.x object.

It returns the compiled schema code as a string, and the schema tree used for doing `$ref` resolution.

Some notes on special cases:

## Request Bodies

On an "Operation Object" the "Request Body Object" can reference a Request Body component:

```json
{
	"paths": {
		"/api/tasks/{taskId}": {
			"post": {
				"requestBody": {
					"$ref": "#/components/requestBodies/CreateTask"
				}
			}
		}
	}
}
```

Or it can define a Request Body object inline.

The Request Body object is the part that holds the schema (inside `content.<TYPE>`) which can be a reference to a schema object:

```json
{
	"content": {
		"application/json": {
			"schema": {
				"$ref": "#/components/schemas/Task"
			}
		}
	}
}
```

Or it can define the schema inline. For example, if all parts are defined inline, we could have:

```json
{
	"paths": {
		"/api/tasks/{taskId}": {
			"post": {
				"requestBody": {
					"content": {
						"application/json": {
							"schema": {
								"type": "object",
								"properties": {
									"id": { "type": "string" }
								}
							}
						}
					}
				}
			}
		}
	}
}
```

Finally, in the root `components.requestBodies` object, each named Request Body optionally can be a reference. This can be useful for aliasing, among other things. For example, here `first` is an alias of `second`, which has a reference to a schema:

```json
{
	"components": {
		"requestBodies": {
			"first": { "$ref": "#/components/requestBodies/second" },
			"second": {
				"content": {
					"application/json": {
						"schema": { "$ref": "#/components/schemas/Task" }
					}
				}
			}
		}
	}
}
```

This means that there are *at least* three (3) potential ways to reference a request body schema, and this ignores that there can be multiple content types!

- On an Operation Objects `requestBody`, as a direct reference. The id would be `paths.<PATH>.<METHOD>.requestBody` and would be a reference to an object that *is not itself a schema* (a Request Object contains a schema as an inner property).
- On an Operation Objects `requestBody`, as a content type reference. The id would be `paths.<PATH>.<METHOD>.requestBody.content.<CONTENT_TYPE>.schema` and would be a reference to an actual schema.
- On an Operation Objects `requestBody`, in a content type, as an inline schema. The id would then be the same as the previous, but would be a schema instead of a reference.

In order to make referencing possible, Request Bodies are normalized in this way:

- On the root `components.requestBodies` each Request Body schema identifier is normalized to `#/components/requestBodies/<NAME>/content/<CONTENT_TYPE>`. This might be a full schema, or a reference to a different schema, which AJV will resolve correctly.
- On each Operation Object, each Request Body schema identifier is normalized to `#/paths/<PATH>/<METHOD>/requestBody/content/<CONTENT_TYPE>`, which is either the schema itself, or a `$ref` to the normalized root request body.

```js
import { schemas, getSchemaId } from '/path/to/compiled.js'
const id = getSchemaId('paths', '/api/tasks/{taskId}', 'post', 'requestBody', 'content', 'application/json', 'schema')
const validate = schemas[id]
```

**Note:** the `NAME`, `PATH`, and `CONTENT_TYPE` properties must be URL-encoded.

Because of this, to validate the request body, you can simply do this:

```js
import schemas from '/path/to/compiled.js'
const path = '#/' + [
	'paths',
	encodeURIComponent('/api/tasks/{taskId}'),
	'post',
	'requestBody',
	'content',
	encodeURIComponent('application/json')
].join('/')
const validate = schemas[path]
const valid = validate(request.body)
if (!valid) console.log(validate.errors)
```

If that Request Body references a schema, AJV will resolve it correctly without additional work from you.

## Response Bodies

Similarly, on an "Operation Object" the "Response Object" can reference a Response Body component for a status:

```json
{
	"paths": {
		"/api/tasks/{taskId}": {
			"post": {
				"responses": {
					"200": {
						"$ref": "#/components/responses/TaskCreated"
					}
				}
			}
		}
	}
}
```

Or it can define the Response Object inline.

The Response Object is the part that holds the schema (inside `content.<TYPE>`) *as well as* the (optional) schema for headers (inside `headers.<HEADER_NAME>`), each of which can be a reference to a schema object:

```json
{
	"content": {
		"application/json": {
			"schema": {
				"$ref": "#/components/schemas/Task"
			}
		}
	},
	"headers": {
		"Set-Cookie": {
			"$ref": "#/components/headers/SetCookie"
		}
	}
}
```

For the `content` and `headers`, each content type and header name can define the schema inline. For example, if all parts are defined inline, we could have:

```json
{
	"paths": {
		"/api/tasks/{taskId}": {
			"post": {
				"responses": {
					"200": {
						"content": {
							"application/json": {
								"schema": {
									"type": "object",
									"properties": {
										"id": { "type": "string" }
									}
								}
							}
						},
						"headers": {
							"Set-Cookie": {
								"schema": { "type": "string" }
							}
						}
					}
				}
			}
		}
	}
}
```

Finally, in the root `components.responses` object, each named Response optionally can be a reference. This can be useful for aliasing, among other things. For example, here `first` is an alias of `second`, which has a reference to a schema:

```json
{
	"components": {
		"responses": {
			"first": { "$ref": "#/components/responses/second" },
			"second": {
				"content": {
					"application/json": {
						"schema": { "$ref": "#/components/schemas/Task" }
					}
				}
			}
		}
	}
}
```

Similar to request bodies, in order to make reference possible without iterative lookups, Response Objects are normalized in this way:

- On the root `components.responses` each Response Object schema identifier is normalized to `#/components/responses/<NAME>/content/<CONTENT_TYPE>` and `#/components/responses/<NAME>/headers/<HEADER_NAME>`.
- On each Operation Object, each Request Body schema identifier is normalized to `#/paths/<PATH>/<METHOD>/responses/<STATUS>/content/<CONTENT_TYPE>`, which is either the schema itself, or a `$ref` to the *normalized root request body*.

**Note:** the `NAME`, `PATH`, `CONTENT_TYPE`, and `HEADER_NAME` properties must be URL-encoded.



TODO how to normalize?
















On an "Operation Object" the "Responses Object" is a map of response statuses to "Response Object", which looks similar to the "Request Body", e.g.:

```json
{
	"paths": {
		"/api/tasks/{taskId}": {
			"post": {
				"responses": {
					"201": {
						"content": {
							"application/json": {
								"schema": {
									//...
```

Or a reference for each response status:

```json
{
	"paths": {
		"/api/tasks/{taskId}": {
			"post": {
				"responses": {
					"201": {
						"$ref": "#/..."
```

Again, although the OpenAPI specs allow multiple response content types, this compiler will only compile `application/json` types, other types will be ignored. Because of this, the schema identifier is truncated after the status code, e.g. the schema identifier for response bodies is `#/paths/PATH/METHOD/responses/STATUS` where the `PATH` is URI encoded.

For example, both the above examples would generate:

```
#/paths/%2Fapi%2Ftasks%2F%7BtaskId%7D/post/responses/201
```

## License

Published and released under the [Very Open License](http://veryopenlicense.com).

If you need a commercial license, [contact me here](https://davistobias.com/license?software=ajv-openapi-compile).
