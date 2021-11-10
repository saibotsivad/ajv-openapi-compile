const getSchemaId = (schemaTree, ...keypath) => {
	const _getSchema = (...keys) => {
		let actualKeys = []
		let node = schemaTree
		while (keys.length) {
			const currentKey = keys.shift()
			actualKeys.push(currentKey)
			node = node?.[currentKey]
			if (!node) return null
			if (node.$sch) return actualKeys
			if (node.$ref) return _getSchema(...node.$ref, ...keys)
		}
		return null
	}
	return `#/${_getSchema(...keypath).map(k => encodeURIComponent(k)).join('/')}`
}

const getKeypath = opt => opt.length === 1 && typeof opt[0] === 'string'
	? opt[0].replace(/^#\//, '').split('/').map(s => decodeURIComponent(s))
	: opt

export const __getId = schemaTree => (...opt) => getSchemaId(schemaTree, ...getKeypath(opt))
export const __getSchema = (schemaTree, schemas) => (...opt) => schemas[getSchemaId(schemaTree, ...getKeypath(opt))]
