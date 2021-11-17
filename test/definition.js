export const definition = {
	openapi: '3.0.2',
	components: {
		parameters: {
			taskId: {
				name: 'taskId',
				in: 'path',
				required: true,
				schema: {
					type: 'string',
				},
			},
			aliasedTaskId: {
				$ref: '#/components/parameters/taskId',
			},
			filter: {
				name: 'filter',
				in: 'query',
				schema: {
					type: 'string',
				},
			},
		},
		requestBodies: {
			task: {
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								id: { type: 'string' },
							},
						},
					},
				},
			},
			aliasedTask: {
				$ref: '#/components/requestBodies/task',
			},
		},
		headers: {
			cookie: {
				schema: { type: 'string' },
			},
			aliasedCookie: {
				$ref: '#/components/headers/cookie',
			},
		},
		responses: {
			error: {
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								error: {
									$ref: '#/components/schemas/error',
								},
							},
						},
					},
				},
			},
			aliasedError: {
				$ref: '#/components/responses/error',
			},
		},
		schemas: {
			error: {
				type: 'object',
				properties: {
					code: {
						type: 'string',
					},
				},
			},
			aliasedError: {
				$ref: '#/components/schemas/error',
			},
			meta: {
				type: 'object',
				properties: {
					created: {
						type: 'string',
						format: 'date-time',
					},
					updated: {
						type: 'string',
						format: 'date-time',
					},
				},
			},
			task: {
				type: 'object',
				properties: {
					id: {
						type: 'string',
					},
					type: {
						type: 'string',
						enum: [
							'task',
						],
					},
					meta: {
						$ref: '#/components/schemas/meta',
					},
					attributes: {
						type: 'object',
					},
				},
			},
		},
	},
	paths: {
		'/login': {
			post: {
				responses: {
					204: {
						description: 'The session cookie is set.',
						headers: {
							'Set-Cookie': {
								description: 'The session cookie.',
								schema: {
									type: 'string',
								},
							},
						},
					},
					default: {
						$ref: '#/components/responses/error',
					},
				},
			},
		},
		'/tasks/{taskId}': {
			parameters: [
				{
					$ref: '#/components/parameters/taskId',
				},
				{
					name: 'include',
					in: 'query',
					schema: {
						type: 'string',
					},
				},
			],
			patch: {
				parameters: [
					{
						name: 'X-Api-Token',
						in: 'header',
						schema: {
							type: 'string',
						},
					},
					{
						$ref: '#/components/parameters/filter',
					},
				],
				responses: {
					200: {
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										data: {
											$ref: '#/components/schemas/task',
										},
									},
								},
							},
						},
					},
					default: {
						$ref: '#/components/responses/error',
					},
				},
			},
		},
	},
}
