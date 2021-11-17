# ajv-openapi-compile

Given an OpenAPI definition, compile into AJV validation modules to be used in environments (like Cloudflare Workers) where `eval` is not available, or a single JavaScript file is desired.

## Install

The normal way:

```shell
npm install ajv-openapi-compile --save-dev
```

## Build With It

You can use the CLI tool, as part of your build process:

```shell
ajv-openapi-compile --definition=/path/to/openapi.json \
  --output=/path/to/compiled.js \
  --tree=/path/to/tree.js
```

You can also use in your build scripts:

```js
import { compile } from 'ajv-openapi-compile'
import { readFile, writeFile } from 'node:fs'
const definition = JSON.parse(await readFile('/path/to/openapi.json', 'utf8'))
const { code, tree } = await compile(definition)
await writeFile('/path/to/compiled.js', code, 'utf8')
await writeFile('/path/to/tree.js', tree, 'utf8')
```

The output from the `compile` function contains the `code` property, which has all imports/requires resolved and concatenated into the single string.

## Use Built Code

The compiled `code` is an ES string, and exports `schema` as the default, which is a map of schema identifiers to validation functions.

If you know the fully-resolved schema id, you can access the validation function explicitly:

```js
import schemas from '/path/to/compiled.js'
const validate = schemas['#/components/schema/error']
const valid = validate({ code: 404 })
if (!valid) console.log(validate.errors)
```

> **Note:** The schema identifiers are escaped using the JSON Pointer (RFC6901) specs, which turns `~` into `~0` and `/` into `~1`.

If you don't know the fully-resolved schema id, you can use something like [pointer-props](https://github.com/saibotsivad/pointer-props) to navigate the structure and resolve to the correct id:

```js
import { resolve, toPointer } from 'pointer-props'
import { readFile } from 'node:fs'
import schemas from '/path/to/compiled.js'
const definition = JSON.parse(await readFile('/path/to/openapi.json', 'utf8'))
// lookup the id
const id = resolve(definition, '#/path/to/schema') // => '/path/to/fully/resolved/schema'
// note the relative reference requires "#" as the prefix
const validate = schemas['#' + id]
const valid = validate({ code: 404 })
if (!valid) console.log(validate.errors)
```

## CLI `ajv-openapi-compile`

The CLI takes the following parameters:

- `---definition, -d` (String) - The path to the definition JSON file.
- `---output, -o` (String) - The path to write the compiled AJV validation code.

For convenience and compatability with other tooling, the `definition` parameter also supports importing JavaScript files, and will follow this algorithm:

1. If the file extension is `.json` read and parse as JSON
2. If the file extension is `.yaml` or `.yml` read and parse as YAML (using `js-yaml` internally)
3. Otherwise, attempt importing `* as schema`
4. If `schema.definition` is set, use that
5. Otherwise, try using `schema`
6. Otherwise, try importing the default as `schema` and try that

To be considered valid, the imported schema definition must have a `paths` object, with at least one "Path Object" defined.

## API: `function(definition: Object) => { code: String }`

The function simply takes a valid OpenAPI 3.x object.

It returns an object with the following properties:

- `code: String` - The compiled code, with all `import` and `require` statements resolved and placed inline.

## License

Published and released under the [Very Open License](http://veryopenlicense.com).

If you need a commercial license, [contact me here](https://davistobias.com/license?software=ajv-openapi-compile).
