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
				$ref: '#/components/parameters/taskId'
			}
		},
		requestBodies: {
			task: {
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								id: { type: 'string' }
							}
						}
					}
				}
			},
			aliasedRequestBody: {
				$ref: '#/components/requestBodies/task'
			}
		},
		headers: {
			aliasedHeader: {
				$ref: '#/components/headers/cookie'
			}
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
				$ref: '#/components/responses/error'
			}
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
			user: {
				type: 'object',
				properties: {
					id: {
						type: 'string',
					},
					type: {
						type: 'string',
						enum: [
							'user',
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
		'/api/v1/login': {
			post: {
				responses: {
					204: {
						description: 'The session cookie is set.',
						headers: {
							'Set-Cookie': {
								description: 'The session cookie.',
								schema: {
									type: 'string'
								}
							}
						}
					},
					default: {
						$ref: '#/components/responses/error',
					},
				},
			}
		},
		'/api/v1/tasks': {
			get: {
				responses: {
					200: {
						content: {
							'application/json': {
								schema: {
									type: 'object',
									properties: {
										data: {
											type: 'array',
											items: {
												$ref: '#/components/schemas/task',
											},
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
			post: {
				requestBody: {
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
		'/api/v1/tasks/{taskId}': {
			parameters: [
				{
					$ref: '#/components/parameters/taskId',
				},
			],
			get: {
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
		'/api/v1/users/{userId}': {
			parameters: [
				{
					name: 'userId',
					in: 'path',
					required: true,
					schema: {
						type: 'string',
					},
				},
			],
			get: {
				parameters: [
					{
						name: 'include',
						in: 'query',
						schema: {
							type: 'string',
							enum: [
								'tasks',
							],
						},
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
											$ref: '#/components/schemas/user',
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
