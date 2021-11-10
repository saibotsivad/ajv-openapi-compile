const __getSchemaId = (schemaTree, ...keypath) => {
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
