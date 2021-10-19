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
ajv-openapi-compile --definition=/path/to/openapi.json --output=/path/to/compiled.cjs
```

**Note:** The AJV compiler outputs a single CommonJS module, so you'll need to write it with the appropriate filename extension. E.g. if your project is `"type": "module"` you'll need to use a `.cjs` extension.

You can also use in your build scripts:

```js
import { compile } from 'ajv-openapi-compile'
import { readFile, writeFile } from 'node:fs'
const definition = JSON.parse(await readFile('/path/to/openapi.json', 'utf8'))
const code = compile(definition)
await writeFile('/path/to/compiled.cjs', code, 'utf8')
```

AJV compiles into an exported map where the key is the schema id (in our case things like `#/components/schema/Task`) and the value is the validation function:

```js
import schemas from '/path/to/compiled.cjs'
const validate = schemas['#/components/schema/Task']
const valid = validate({ completed: true })
if (!valid) console.log(validate.errors)
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

## API: `function(definition: Object) => String`

The function simply takes a valid OpenAPI 3.x object.

It returns the compiled string.

Some notes on special cases:

## Request Bodies

On an "Operation Object" the "Request Body Object" looks like this:

```json
{
	"paths": {
		"/api/tasks/{taskId}": {
			"post": {
				"requestBody": {
					"content": {
						"application/json": {
							"schema": {
								// schema or $ref
```

Or it can reference a request schema directly:

```json
{
	"paths": {
		"/api/tasks/{taskId}": {
			"post": {
				"requestBody": {
					"$ref": "#/..."
```

> **Note:** the specs allow multiple request content types, but this compiler will only compile `application/json` types, other types will be ignored.

In order to avoid needing a deep schema identifier, the synthesized schema identifier for request bodies is `#/request/PATH/METHOD` where the `PATH` is URI encoded.

For example:

```json
{
	"paths": {
		"/api/tasks/{taskId}": {
			"post": {
				"requestBody": {
					"content": {
						"application/json": {
							"schema": {
								//...
							}
						}
					}
				}
			}
		}
	}
}
```

The schema identifier would be:

```
#/request/%2Fapi%2Ftasks%2F%7BtaskId%7D/post
```

## Response Bodies

On an "Operation Object" the "Responses Object" is a map of response statuses (with `default` being the exception) to "Response Object", which looks similar to the "Request Body", e.g.:

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

> **Note:** the specs allow multiple response content types, but this compiler will only compile `application/json` types, other types will be ignored.

In order to avoid needing a deep schema identifier, the synthesized schema identifier for response bodies is `#/response/PATH/METHOD/STATUS` where the `PATH` is URI encoded.

For example, both the above examples would generate:

```
#/response/%2Fapi%2Ftasks%2F%7BtaskId%7D/post/201
```

## License

Published and released under the [Very Open License](http://veryopenlicense.com).

If you need a commercial license, [contact me here](https://davistobias.com/license?software=ajv-openapi-compile).
