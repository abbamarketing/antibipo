# Content from https://generativelanguage.googleapis.com/$discovery/rest?version=v1beta

```json
{
  "mtlsRootUrl": "https://generativelanguage.mtls.googleapis.com/",
  "fullyEncodeReservedExpansion": true,
  "parameters": {
    "oauth_token": {
      "type": "string",
      "description": "OAuth 2.0 token for the current user.",
      "location": "query"
    },
    "uploadType": {
      "location": "query",
      "type": "string",
      "description": "Legacy upload protocol for media (e.g. \"media\", \"multipart\")."
    },
    "upload_protocol": {
      "description": "Upload protocol for media (e.g. \"raw\", \"multipart\").",
      "type": "string",
      "location": "query"
    },
    "callback": {
      "location": "query",
      "type": "string",
      "description": "JSONP"
    },
    "$.xgafv": {
      "enumDescriptions": [
        "v1 error format",
        "v2 error format"
      ],
      "description": "V1 error format.",
      "enum": [
        "1",
        "2"
      ],
      "location": "query",
      "type": "string"
    },
    "key": {
      "location": "query",
      "description": "API key. Your API key identifies your project and provides you with API access, quota, and reports. Required unless you provide an OAuth 2.0 token.",
      "type": "string"
    },
    "prettyPrint": {
      "location": "query",
      "type": "boolean",
      "description": "Returns response with indentations and line breaks.",
      "default": "true"
    },
    "fields": {
      "description": "Selector specifying which fields to include in a partial response.",
      "type": "string",
      "location": "query"
    },
    "alt": {
      "type": "string",
      "enum": [
        "json",
        "media",
        "proto"
      ],
      "location": "query",
      "description": "Data format for response.",
      "default": "json",
      "enumDescriptions": [
        "Responses with Content-Type of application/json",
        "Media download with context-dependent Content-Type",
        "Responses with Content-Type of application/x-protobuf"
      ]
    },
    "quotaUser": {
      "location": "query",
      "description": "Available to use for quota purposes for server-side applications. Can be any arbitrary string assigned to a user, but should not exceed 40 characters.",
      "type": "string"
    },
    "access_token": {
      "location": "query",
      "description": "OAuth access token.",
      "type": "string"
    }
  },
  "id": "generativelanguage:v1beta",
  "batchPath": "batch",
  "servicePath": "",
  "resources": {
    "batches": {
      "methods": {
        "cancel": {
          "parameterOrder": [
            "name"
          ],
          "parameters": {
            "name": {
              "pattern": "^batches/[^/]+$",
              "required": true,
              "type": "string",
              "location": "path",
              "description": "The name of the operation resource to be cancelled."
            }
          },
          "description": "Starts asynchronous cancellation on a long-running operation. The server makes a best effort to cancel the operation, but success is not guaranteed. If the server doesn't support this method, it returns `google.rpc.Code.UNIMPLEMENTED`. Clients can use Operations.GetOperation or other methods to check whether the cancellation succeeded or whether the operation completed despite cancellation. On successful cancellation, the operation is not deleted; instead, it becomes an operation with an Operation.error value with a google.rpc.Status.code of `1`, corresponding to `Code.CANCELLED`.",
          "flatPath": "v1beta/batches/{batchesId}:cancel",
          "httpMethod": "POST",
          "path": "v1beta/{+name}:cancel",
          "response": {
            "$ref": "Empty"
          },
          "id": "generativelanguage.batches.cancel"
        },
        "updateEmbedContentBatch": {
          "parameterOrder": [
            "name"
          ],
          "id": "generativelanguage.batches.updateEmbedContentBatch",
          "path": "v1beta/{+name}:updateEmbedContentBatch",
          "response": {
            "$ref": "EmbedContentBatch"
          },
          "request": {
            "$ref": "EmbedContentBatch"
          },
          "description": "Updates a batch of EmbedContent requests for batch processing.",
          "parameters": {
            "updateMask": {
              "location": "query",
              "format": "google-fieldmask",
              "description": "Optional. The list of fields to update.",
              "type": "string"
            },
            "name": {
              "location": "path",
              "pattern": "^batches/[^/]+$",
              "required": true,
              "type": "string",
              "description": "Output only. Identifier. Resource name of the batch. Format: `batches/{batch_id}`."
            }
          },
          "flatPath": "v1beta/batches/{batchesId}:updateEmbedContentBatch",
          "httpMethod": "PATCH"
        },
        "updateGenerateContentBatch": {
          "parameters": {
            "updateMask": {
              "location": "query",
              "format": "google-fieldmask",
              "description": "Optional. The list of fields to update.",
              "type": "string"
            },
            "name": {
              "location": "path",
              "pattern": "^batches/[^/]+$",
              "required": true,
              "type": "string",
              "description": "Output only. Identifier. Resource name of the batch. Format: `batches/{batch_id}`."
            }
          },
          "request": {
            "$ref": "GenerateContentBatch"
          },
          "description": "Updates a batch of GenerateContent requests for batch processing.",
          "flatPath": "v1beta/batches/{batchesId}:updateGenerateContentBatch",
          "httpMethod": "PATCH",
          "parameterOrder": [
            "name"
          ],
          "id": "generativelanguage.batches.updateGenerateContentBatch",
          "path": "v1beta/{+name}:updateGenerateContentBatch",
          "response": {
            "$ref": "GenerateContentBatch"
          }
        },
        "list": {
          "id": "generativelanguage.batches.list",
          "path": "v1beta/{+name}",
          "response": {
            "$ref": "ListOperationsResponse"
          },
          "flatPath": "v1beta/batches",
          "httpMethod": "GET",
          "description": "Lists operations that match the specified filter in the request. If the server doesn't support this method, it returns `UNIMPLEMENTED`.",
          "parameters": {
            "pageToken": {
              "type": "string",
              "description": "The standard list page token.",
              "location": "query"
            },
            "name": {
              "description": "The name of the operation's parent resource.",
              "location": "path",
              "pattern": "^batches$",
              "required": true,
              "type": "string"
            },
            "returnPartialSuccess": {
              "description": "When set to `true`, operations that are reachable are returned as normal, and those that are unreachable are returned in the ListOperationsResponse.unreachable field. This can only be `true` when reading across collections. For example, when `parent` is set to `\"projects/example/locations/-\"`. This field is not supported by default and will result in an `UNIMPLEMENTED` error if set unless explicitly documented otherwise in service or product specific documentation.",
              "type": "boolean",
              "location": "query"
            },
            "filter": {
              "location": "query",
              "type": "string",
              "description": "The standard list filter."
            },
            "pageSize": {
              "location": "query",
              "format": "int32",
              "type": "integer",
              "description": "The standard list page size."
            }
          },
          "parameterOrder": [
            "name"
          ]
        },
        "delete": {
          "description": "Deletes a long-running operation. This method indicates that the client is no longer interested in the operation result. It does not cancel the operation. If the server doesn't support this method, it returns `google.rpc.Code.UNIMPLEMENTED`.",
          "parameters": {
            "name": {
              "location": "path",
              "pattern": "^batches/[^/]+$",
              "required": true,
              "type": "string",
              "description": "The name of the operation resource to be deleted."
            }
          },
          "parameterOrder": [
            "name"
          ],
          "id": "generativelanguage.batches.delete",
          "path": "v1beta/{+name}",
          "response": {
            "$ref": "Empty"
          },
          "flatPath": "v1beta/batches/{batchesId}",
          "httpMethod": "DELETE"
        },
        "get": {
          "id": "generativelanguage.batches.get",
          "path": "v1beta/{+name}",
          "response": {
            "$ref": "Operation"
          },
          "flatPath": "v1beta/batches/{batchesId}",
          "httpMethod": "GET",
          "description": "Gets the latest state of a long-running operation. Clients can use this method to poll the operation result at intervals as recommended by the API service.",
          "parameters": {
            "name": {
              "pattern": "^batches/[^/]+$",
              "required": true,
              "type": "string",
              "location": "path",
              "description": "The name of the operation resource."
            }
          },
          "parameterOrder": [
            "name"
          ]
        }
      }
    },
    "corpora": {
      "resources": {
        "permissions": {
          "methods": {
            "get": {
              "parameterOrder": [
                "name"
              ],
              "description": "Gets information about a specific Permission.",
              "parameters": {
                "name": {
                  "location": "path",
                  "pattern": "^corpora/[^/]+/permissions/[^/]+$",
                  "required": true,
                  "type": "string",
                  "description": "Required. The resource name of the permission. Formats: `tunedModels/{tuned_model}/permissions/{permission}` `corpora/{corpus}/permissions/{permission}`"
                }
              },
              "path": "v1beta/{+name}",
              "response": {
                "$ref": "Permission"
              },
              "flatPath": "v1beta/corpora/{corporaId}/permissions/{permissionsId}",
              "httpMethod": "GET",
              "id": "generativelanguage.corpora.permissions.get"
            },
            "patch": {
              "flatPath": "v1beta/corpora/{corporaId}/permissions/{permissionsId}",
              "httpMethod": "PATCH",
              "request": {
                "$ref": "Permission"
              },
              "description": "Updates the permission.",
              "parameters": {
                "updateMask": {
                  "location": "query",
                  "format": "google-fieldmask",
                  "description": "Required. The list of fields to update. Accepted ones: - role (`Permission.role` field)",
                  "type": "string"
                },
                "name": {
                  "location": "path",
                  "pattern": "^corpora/[^/]+/permissions/[^/]+$",
                  "required": true,
                  "type": "string",
                  "description": "Output only. Identifier. The permission name. A unique name will be generated on create. Examples: tunedModels/{tuned_model}/permissions/{permission} corpora/{corpus}/permissions/{permission} Output only."
                }
              },
              "path": "v1beta/{+name}",
              "response": {
                "$ref": "Permission"
              },
              "id": "generativelanguage.corpora.permissions.patch",
              "parameterOrder": [
                "name"
              ]
            },
            "create": {
              "parameters": {
                "parent": {
                  "description": "Required. The parent resource of the `Permission`. Formats: `tunedModels/{tuned_model}` `corpora/{corpus}`",
                  "pattern": "^corpora/[^/]+$",
                  "required": true,
                  "type": "string",
                  "location": "path"
                }
              },
              "request": {
                "$ref": "Permission"
              },
              "description": "Create a permission to a specific resource.",
              "flatPath": "v1beta/corpora/{corporaId}/permissions",
              "httpMethod": "POST",
              "parameterOrder": [
                "parent"
              ],
              "id": "generativelanguage.corpora.permissions.create",
              "path": "v1beta/{+parent}/permissions",
              "response": {
                "$ref": "Permission"
              }
            },
            "delete": {
              "flatPath": "v1beta/corpora/{corporaId}/permissions/{permissionsId}",
              "httpMethod": "DELETE",
              "path": "v1beta/{+name}",
              "response": {
                "$ref": "Empty"
              },
              "id": "generativelanguage.corpora.permissions.delete",
              "parameterOrder": [
                "name"
              ],
              "parameters": {
                "name": {
                  "location": "path",
                  "pattern": "^corpora/[^/]+/permissions/[^/]+$",
                  "required": true,
                  "type": "string",
                  "description": "Required. The resource name of the permission. Formats: `tunedModels/{tuned_model}/permissions/{permission}` `corpora/{corpus}/permissions/{permission}`"
                }
              },
              "description": "Deletes the permission."
            },
            "list": {
              "id": "generativelanguage.corpora.permissions.list",
              "path": "v1beta/{+parent}/permissions",
              "response": {
                "$ref": "ListPermissionsResponse"
              },
              "flatPath": "v1beta/corpora/{corporaId}/permissions",
              "httpMethod": "GET",
              "description": "Lists permissions for the specific resource.",
              "parameters": {
                "pageToken": {
                  "location": "query",
                  "type": "string",
                  "description": "Optional. A page token, received from a previous `ListPermissions` call. Provide the `page_token` returned by one request as an argument to the next request to retrieve the next page. When paginating, all other parameters provided to `ListPermissions` must match the call that provided the page token."
                },
                "parent": {
                  "description": "Required. The parent resource of the permissions. Formats: `tunedModels/{tuned_model}` `corpora/{corpus}`",
                  "pattern": "^corpora/[^/]+$",
                  "required": true,
                  "type": "string",
                  "location": "path"
                },
                "pageSize": {
                  "description": "Optional. The maximum number of `Permission`s to return (per page). The service may return fewer permissions. If unspecified, at most 10 permissions will be returned. This method returns at most 1000 permissions per page, even if you pass larger page_size.",
                  "type": "integer",
                  "location": "query",
                  "format": "int32"
                }
              },
              "parameterOrder": [
                "parent"
              ]
            }
          }
        },
        "operations": {
          "methods": {
            "get": {
              "parameterOrder": [
                "name"
              ],
              "description": "Gets the latest state of a long-running operation. Clients can use this method to poll the operation result at intervals as recommended by the API service.",
              "parameters": {
                "name": {
                  "location": "path",
                  "pattern": "^corpora/[^/]+/operations/[^/]+$",
                  "required": true,
                  "type": "string",
                  "description": "The name of the operation resource."
                }
              },
              "path": "v1beta/{+name}",
              "response": {
                "$ref": "Operation"
              },
              "flatPath": "v1beta/corpora/{corporaId}/operations/{operationsId}",
              "httpMethod": "GET",
              "id": "generativelanguage.corpora.operations.get"
            }
          }
        }
      },
      "methods": {
        "get": {
          "flatPath": "v1beta/corpora/{corporaId}",
          "httpMethod": "GET",
          "path": "v1beta/{+name}",
          "response": {
            "$ref": "Corpus"
          },
          "id": "generativelanguage.corpora.get",
          "parameterOrder": [
            "name"
          ],
          "parameters": {
            "name": {
              "description": "Required. The name of the `Corpus`. Example: `corpora/my-corpus-123`",
              "pattern": "^corpora/[^/]+$",
              "required": true,
              "type": "string",
              "location": "path"
            }
          },
          "description": "Gets information about a specific `Corpus`."
        },
        "create": {
          "path": "v1beta/corpora",
          "response": {
            "$ref": "Corpus"
          },
          "id": "generativelanguage.corpora.create",
          "parameterOrder": [],
          "flatPath": "v1beta/corpora",
          "httpMethod": "POST",
          "request": {
            "$ref": "Corpus"
          },
          "description": "Creates an empty `Corpus`.",
          "parameters": {}
        },
        "delete": {
          "id": "generativelanguage.corpora.delete",
          "path": "v1beta/{+name}",
          "response": {
            "$ref": "Empty"
          },
          "flatPath": "v1beta/corpora/{corporaId}",
          "httpMethod": "DELETE",
          "description": "Deletes a `Corpus`.",
          "parameters": {
            "name": {
              "location": "path",
              "pattern": "^corpora/[^/]+$",
              "required": true,
              "type": "string",
              "description": "Required. The resource name of the `Corpus`. Example: `corpora/my-corpus-123`"
            },
            "force": {
              "location": "query",
              "type": "boolean",
              "description": "Optional. If set to true, any `Document`s and objects related to this `Corpus` will also be deleted. If false (the default), a `FAILED_PRECONDITION` error will be returned if `Corpus` contains any `Document`s."
            }
          },
          "parameterOrder": [
            "name"
          ]
        },
        "list": {
          "path": "v1beta/corpora",
          "response": {
            "$ref": "ListCorporaResponse"
          },
          "flatPath": "v1beta/corpora",
          "httpMethod": "GET",
          "id": "generativelanguage.corpora.list",
          "parameterOrder": [],
          "description": "Lists all `Corpora` owned by the user.",
          "parameters": {
            "pageToken": {
              "location": "query",
              "type": "string",
              "description": "Optional. A page token, received from a previous `ListCorpora` call. Provide the `next_page_token` returned in the response as an argument to the next request to retrieve the next page. When paginating, all other parameters provided to `ListCorpora` must match the call that provided the page token."
            },
            "pageSize": {
              "type": "integer",
              "description": "Optional. The maximum number of `Corpora` to return (per page). The service may return fewer `Corpora`. If unspecified, at most 10 `Corpora` will be returned. The maximum size limit is 20 `Corpora` per page.",
              "location": "query",
              "format": "int32"
            }
          }
        }
      }
    },
    "generatedFiles": {
      "methods": {
        "list": {
          "parameterOrder": [],
          "description": "Lists the generated files owned by the requesting project.",
          "parameters": {
            "pageToken": {
              "location": "query",
              "description": "Optional. A page token from a previous `ListGeneratedFiles` call.",
              "type": "string"
            },
            "pageSize": {
              "type": "integer",
              "description": "Optional. Maximum number of `GeneratedFile`s to return per page. If unspecified, defaults to 10. Maximum `page_size` is 50.",
              "location": "query",
              "format": "int32"
            }
          },
          "path": "v1beta/generatedFiles",
          "response": {
            "$ref": "ListGeneratedFilesResponse"
          },
          "flatPath": "v1beta/generatedFiles",
          "httpMethod": "GET",
          "id": "generativelanguage.generatedFiles.list"
        }
      },
      "resources": {
        "operations": {
          "methods": {
            "get": {
              "description": "Gets the latest state of a long-running operation. Clients can use this method to poll the operation result at intervals as recommended by the API service.",
              "parameters": {
                "name": {
                  "location": "path",
                  "pattern": "^generatedFiles/[^/]+/operations/[^/]+$",
                  "required": true,
                  "type": "string",
                  "description": "The name of the operation resource."
                }
              },
              "parameterOrder": [
                "name"
              ],
              "id": "generativelanguage.generatedFiles.operations.get",
              "path": "v1beta/{+name}",
              "response": {
                "$ref": "Operation"
              },
              "flatPath": "v1beta/generatedFiles/{generatedFilesId}/operations/{operationsId}",
              "httpMethod": "GET"
            }
          }
        }
      }
    },
    "models": {
      "resources": {
        "operations": {
          "methods": {
            "get": {
              "path": "v1beta/{+name}",
              "response": {
                "$ref": "Operation"
              },
              "flatPath": "v1beta/models/{modelsId}/operations/{operationsId}",
              "httpMethod": "GET",
              "id": "generativelanguage.models.operations.get",
              "parameterOrder": [
                "name"
              ],
              "description": "Gets the latest state of a long-running operation. Clients can use this method to poll the operation result at intervals as recommended by the API service.",
              "parameters": {
                "name": {
                  "pattern": "^models/[^/]+/operations/[^/]+$",
                  "required": true,
                  "type": "string",
                  "location": "path",
                  "description": "The name of the operation resource."
                }
              }
            },
            "list": {
              "id": "generativelanguage.models.operations.list",
              "path": "v1beta/{+name}/operations",
              "response": {
                "$ref": "ListOperationsResponse"
              },
              "flatPath": "v1beta/models/{modelsId}/operations",
              "httpMethod": "GET",
              "description": "Lists operations that match the specified filter in the request. If the server doesn't support this method, it returns `UNIMPLEMENTED`.",
              "parameters": {
                "filter": {
                  "description": "The standard list filter.",
                  "type": "string",
                  "location": "query"
                },
                "pageSize": {
                  "location": "query",
                  "format": "int32",
                  "type": "integer",
                  "description": "The standard list page size."
                },
                "pageToken": {
                  "location": "query",
                  "description": "The standard list page token.",
                  "type": "string"
                },
                "name": {
                  "description": "The name of the operation's parent resource.",
                  "location": "path",
                  "pattern": "^models/[^/]+$",
                  "required": true,
                  "type": "string"
                },
                "returnPartialSuccess": {
                  "location": "query",
                  "type": "boolean",
                  "description": "When set to `true`, operations that are reachable are returned as normal, and those that are unreachable are returned in the ListOperationsResponse.unreachable field. This can only be `true` when reading across collections. For example, when `parent` is set to `\"projects/example/locations/-\"`. This field is not supported by default and will result in an `UNIMPLEMENTED` error if set unless explicitly documented otherwise in service or product specific documentation."
                }
              },
              "parameterOrder": [
                "name"
              ]
            }
          }
        }
      },
      "methods": {
        "get": {
          "id": "generativelanguage.models.get",
          "flatPath": "v1beta/models/{modelsId}",
          "httpMethod": "GET",
          "path": "v1beta/{+name}",
          "response": {
            "$ref": "Model"
          },
          "parameters": {
            "name": {
              "description": "Required. The resource name of the model. This name should match a model name returned by the `ListModels` method. Format: `models/{model}`",
              "location": "path",
              "pattern": "^models/[^/]+$",
              "required": true,
              "type": "string"
            }
          },
          "description": "Gets information about a specific `Model` such as its version number, token limits, [parameters](https://ai.google.dev/gemini-api/docs/models/generative-models#model-parameters) and other metadata. Refer to the [Gemini models guide](https://ai.google.dev/gemini-api/docs/models/gemini) for detailed model information.",
          "parameterOrder": [
            "name"
          ]
        },
        "generateMessage": {
          "parameterOrder": [
            "model"
          ],
          "path": "v1beta/{+model}:generateMessage",
          "response": {
            "$ref": "GenerateMessageResponse"
          },
          "id": "generativelanguage.models.generateMessage",
          "request": {
            "$ref": "GenerateMessageRequest"
          },
          "description": "Generates a response from the model given an input `MessagePrompt`.",
          "parameters": {
            "model": {
              "description": "Required. The name of the model to use. Format: `name=models/{model}`.",
              "location": "path",
              "pattern": "^models/[^/]+$",
              "required": true,
              "type": "string"
            }
          },
          "flatPath": "v1beta/models/{modelsId}:generateMessage",
          "httpMethod": "POST"
        },
        "embedText": {
          "flatPath": "v1beta/models/{modelsId}:embedText",
          "httpMethod": "POST",
          "request": {
            "$ref": "EmbedTextRequest"
          },
          "description": "Generates an embedding from the model given an input message.",
          "parameters": {
            "model": {
              "location": "path",
              "pattern": "^models/[^/]+$",
              "required": true,
              "type": "string",
              "description": "Required. The model name to use with the format model=models/{model}."
            }
          },
          "id": "generativelanguage.models.embedText",
          "path": "v1beta/{+model}:embedText",
          "response": {
            "$ref": "EmbedTextResponse"
          },
          "parameterOrder": [
            "model"
          ]
        },
        "batchGenerateContent": {
          "flatPath": "v1beta/models/{modelsId}:batchGenerateContent",
          "httpMethod": "POST",
          "request": {
            "$ref": "BatchGenerateContentRequest"
          },
          "description": "Enqueues a batch of `GenerateContent` requests for batch processing.",
          "parameters": {
            "model": {
              "location": "path",
              "pattern": "^models/[^/]+$",
              "required": true,
              "type": "string",
              "description": "Required. The name of the `Model` to use for generating the completion. Format: `models/{model}`."
            }
          },
          "id": "generativelanguage.models.batchGenerateContent",
          "path": "v1beta/{+model}:batchGenerateContent",
          "response": {
            "$ref": "Operation"
          },
          "parameterOrder": [
            "model"
          ]
        },
        "asyncBatchEmbedContent": {
          "parameters": {
            "model": {
              "location": "path",
              "pattern": "^models/[^/]+$",
              "required": true,
              "type": "string",
              "description": "Required. The name of the `Model` to use for generating the completion. Format: `models/{model}`."
            }
          },
          "request": {
            "$ref": "AsyncBatchEmbedContentRequest"
          },
          "description": "Enqueues a batch of `EmbedContent` requests for batch processing. We have a `BatchEmbedContents` handler in `GenerativeService`, but it was synchronized. So we name this one to be `Async` to avoid confusion.",
          "flatPath": "v1beta/models/{modelsId}:asyncBatchEmbedContent",
          "httpMethod": "POST",
          "parameterOrder": [
            "model"
          ],
          "id": "generativelanguage.models.asyncBatchEmbedContent",
          "path": "v1beta/{+model}:asyncBatchEmbedContent",
          "response": {
            "$ref": "Operation"
          }
        },
        "batchEmbedText": {
          "flatPath": "v1beta/models/{modelsId}:batchEmbedText",
          "httpMethod": "POST",
          "parameters": {
            "model": {
              "description": "Required. The name of the `Model` to use for generating the embedding. Examples: models/embedding-gecko-001",
              "pattern": "^models/[^/]+$",
              "required": true,
              "type": "string",
              "location": "path"
            }
          },
          "request": {
            "$ref": "BatchEmbedTextRequest"
          },
          "description": "Generates multiple embeddings from the model given input text in a synchronous call.",
          "path": "v1beta/{+model}:batchEmbedText",
          "response": {
            "$ref": "BatchEmbedTextResponse"
          },
          "id": "generativelanguage.models.batchEmbedText",
          "parameterOrder": [
            "model"
          ]
        },
        "countTokens": {
          "request": {
            "$ref": "CountTokensRequest"
          },
          "description": "Runs a model's tokenizer on input `Content` and returns the token count. Refer to the [tokens guide](https://ai.google.dev/gemini-api/docs/tokens) to learn more about tokens.",
          "parameters": {
            "model": {
              "pattern": "^models/[^/]+$",
              "required": true,
              "type": "string",
              "location": "path",
              "description": "Required. The model's resource name. This serves as an ID for the Model to use. This name should match a model name returned by the `ListModels` method. Format: `models/{model}`"
            }
          },
          "flatPath": "v1beta/models/{modelsId}:countTokens",
          "httpMethod": "POST",
          "parameterOrder": [
            "model"
          ],
          "id": "generativelanguage.models.countTokens",
          "path": "v1beta/{+model}:countTokens",
          "response": {
            "$ref": "CountTokensResponse"
          }
        },
        "predictLongRunning": {
          "path": "v1beta/{+model}:predictLongRunning",
          "response": {
            "$ref": "Operation"
          },
          "id": "generativelanguage.models.predictLongRunning",
          "parameterOrder": [
            "model"
          ],
          "flatPath": "v1beta/models/{modelsId}:predictLongRunning",
          "httpMethod": "POST",
          "request": {
            "$ref": "PredictLongRunningRequest"
          },
          "description": "Same as Predict but returns an LRO.",
          "parameters": {
            "model": {
              "description": "Required. The name of the model for prediction. Format: `name=models/{model}`.",
              "location": "path",
              "pattern": "^models/[^/]+$",
              "required": true,
              "type": "string"
            }
          }
        },
        "predict": {
          "parameterOrder": [
            "model"
          ],
          "path": "v1beta/{+model}:predict",
          "response": {
            "$ref": "PredictResponse"
          },
          "id": "generativelanguage.models.predict",
          "parameters": {
            "model": {
              "location": "path",
              "pattern": "^models/[^/]+$",
              "required": true,
              "type": "string",
              "description": "Required. The name of the model for prediction. Format: `name=models/{model}`."
            }
          },
          "request": {
            "$ref": "PredictRequest"
          },
          "description": "Performs a prediction request.",
          "flatPath": "v1beta/models/{modelsId}:predict",
          "httpMethod": "POST"
        },
        "generateContent": {
          "flatPath": "v1beta/models/{modelsId}:generateContent",
          "httpMethod": "POST",
          "parameters": {
            "model": {
              "pattern": "^models/[^/]+$",
              "required": true,
              "type": "string",
              "location": "path",
              "description": "Required. The name of the `Model` to use for generating the completion. Format: `models/{model}`."
            }
          },
          "request": {
            "$ref": "GenerateContentRequest"
          },
          "description": "Generates a model response given an input `GenerateContentRequest`. Refer to the [text generation guide](https://ai.google.dev/gemini-api/docs/text-generation) for detailed usage information. Input capabilities differ between models, including tuned models. Refer to the [model guide](https://ai.google.dev/gemini-api/docs/models/gemini) and [tuning guide](https://ai.google.dev/gemini-api/docs/model-tuning) for details.",
          "path": "v1beta/{+model}:generateContent",
          "response": {
            "$ref": "GenerateContentResponse"
          },
          "id": "generativelanguage.models.generateContent",
          "parameterOrder": [
            "model"
          ]
        },
        "embedContent": {
          "path": "v1beta/{+model}:embedContent",
          "response": {
            "$ref": "EmbedContentResponse"
          },
          "id": "generativelanguage.models.embedContent",
          "parameterOrder": [
            "model"
          ],
          "flatPath": "v1beta/models/{modelsId}:embedContent",
          "httpMethod": "POST",
          "parameters": {
            "model": {
              "description": "Required. The model's resource name. This serves as an ID for the Model to use. This name should match a model name returned by the `ListModels` method. Format: `models/{model}`",
              "pattern": "^models/[^/]+$",
              "required": true,
              "type": "string",
              "location": "path"
            }
          },
          "request": {
            "$ref": "EmbedContentRequest"
          },
          "description": "Generates a text embedding vector from the input `Content` using the specified [Gemini Embedding model](https://ai.google.dev/gemini-api/docs/models/gemini#text-embedding)."
        },
        "countMessageTokens": {
          "parameterOrder": [
            "model"
          ],
          "path": "v1beta/{+model}:countMessageTokens",
          "response": {
            "$ref": "CountMessageTokensResponse"
          },
          "id": "generativelanguage.models.countMessageTokens",
          "parameters": {
            "model": {
              "pattern": "^models/[^/]+$",
              "required": true,
              "type": "string",
              "location": "path",
              "description": "Required. The model's resource name. This serves as an ID for the Model to use. This name should match a model name returned by the `ListModels` method. Format: `models/{model}`"
            }
          },
          "request": {
            "$ref": "CountMessageTokensRequest"
          },
          "description": "Runs a model's tokenizer on a string and returns the token count.",
          "flatPath": "v1beta/models/{modelsId}:countMessageTokens",
          "httpMethod": "POST"
        },
        "generateAnswer": {
          "flatPath": "v1beta/models/{modelsId}:generateAnswer",
          "httpMethod": "POST",
          "request": {
            "$ref": "GenerateAnswerRequest"
          },
          "description": "Generates a grounded answer from the model given an input `GenerateAnswerRequest`.",
          "parameters": {
            "model": {
              "description": "Required. The name of the `Model` to use for generating the grounded response. Format: `model=models/{model}`.",
              "pattern": "^models/[^/]+$",
              "required": true,
              "type": "string",
              "location": "path"
            }
          },
          "path": "v1beta/{+model}:generateAnswer",
          "response": {
            "$ref": "GenerateAnswerResponse"
          },
          "id": "generativelanguage.models.generateAnswer",
          "parameterOrder": [
            "model"
          ]
        },
        "streamGenerateContent": {
          "path": "v1beta/{+model}:streamGenerateContent",
          "response": {
            "$ref": "GenerateContentResponse"
          },
          "id": "generativelanguage.models.streamGenerateContent",
          "parameterOrder": [
            "model"
          ],
          "flatPath": "v1beta/models/{modelsId}:streamGenerateContent",
          "httpMethod": "POST",
          "request": {
            "$ref": "GenerateContentRequest"
          },
          "description": "Generates a [streamed response](https://ai.google.dev/gemini-api/docs/text-generation?lang=python#generate-a-text-stream) from the model given an input `GenerateContentRequest`.",
          "parameters": {
            "model": {
              "description": "Required. The name of the `Model` to use for generating the completion. Format: `models/{model}`.",
              "pattern": "^models/[^/]+$",
              "required": true,
              "type": "string",
              "location": "path"
            }
          }
        },
        "batchEmbedContents": {
          "parameterOrder": [
            "model"
          ],
          "id": "generativelanguage.models.batchEmbedContents",
          "path": "v1beta/{+model}:batchEmbedContents",
          "response": {
            "$ref": "BatchEmbedContentsResponse"
          },
          "request": {
            "$ref": "BatchEmbedContentsRequest"
          },
          "description": "Generates multiple embedding vectors from the input `Content` which consists of a batch of strings represented as `EmbedContentRequest` objects.",
          "parameters": {
            "model": {
              "description": "Required. The model's resource name. This serves as an ID for the Model to use. This name should match a model name returned by the `ListModels` method. Format: `models/{model}`",
              "pattern": "^models/[^/]+$",
              "required": true,
              "type": "string",
              "location": "path"
            }
          },
          "flatPath": "v1beta/models/{modelsId}:batchEmbedContents",
          "httpMethod": "POST"
        },
        "list": {
          "id": "generativelanguage.models.list",
          "path": "v1beta/models",
          "response": {
            "$ref": "ListModelsResponse"
          },
          "flatPath": "v1beta/models",
          "httpMethod": "GET",
          "description": "Lists the [`Model`s](https://ai.google.dev/gemini-api/docs/models/gemini) available through the Gemini API.",
          "parameters": {
            "pageToken": {
              "location": "query",
              "type": "string",
              "description": "A page token, received from a previous `ListModels` call. Provide the `page_token` returned by one request as an argument to the next request to retrieve the next page. When paginating, all other parameters provided to `ListModels` must match the call that provided the page token."
            },
            "pageSize": {
              "type": "integer",
              "description": "The maximum number of `Models` to return (per page). If unspecified, 50 models will be returned per page. This method returns at most 1000 models per page, even if you pass a larger page_size.",
              "location": "query",
              "format": "int32"
            }
          },
          "parameterOrder": []
        },
        "countTextTokens": {
          "path": "v1beta/{+model}:countTextTokens",
          "response": {
            "$ref": "CountTextTokensResponse"
          },
          "id": "generativelanguage.models.countTextTokens",
          "parameterOrder": [
            "model"
          ],
          "flatPath": "v1beta/models/{modelsId}:countTextTokens",
          "httpMethod": "POST",
          "parameters": {
            "model": {
              "description": "Required. The model's resource name. This serves as an ID for the Model to use. This name should match a model name returned by the `ListModels` method. Format: `models/{model}`",
              "pattern": "^models/[^/]+$",
              "required": true,
              "type": "string",
              "location": "path"
            }
          },
          "request": {
            "$ref": "CountTextTokensRequest"
          },
          "description": "Runs a model's tokenizer on a text and returns the token count."
        },
        "generateText": {
          "parameterOrder": [
            "model"
          ],
          "id": "generativelanguage.models.generateText",
          "path": "v1beta/{+model}:generateText",
          "response": {
            "$ref": "GenerateTextResponse"
          },
          "request": {
            "$ref": "GenerateTextRequest"
          },
          "description": "Generates a response from the model given an input message.",
          "parameters": {
            "model": {
              "description": "Required. The name of the `Model` or `TunedModel` to use for generating the completion. Examples: models/text-bison-001 tunedModels/sentence-translator-u3b7m",
              "pattern": "^models/[^/]+$",
              "required": true,
              "type": "string",
              "location": "path"
            }
          },
          "flatPath": "v1beta/models/{modelsId}:generateText",
          "httpMethod": "POST"
        }
      }
    },
    "tunedModels": {
      "resources": {
        "permissions": {
          "methods": {
            "get": {
              "id": "generativelanguage.tunedModels.permissions.get",
              "path": "v1beta/{+name}",
              "response": {
                "$ref": "Permission"
              },
              "flatPath": "v1beta/tunedModels/{tunedModelsId}/permissions/{permissionsId}",
              "httpMethod": "GET",
              "description": "Gets information about a specific Permission.",
              "parameters": {
                "name": {
                  "pattern": "^tunedModels/[^/]+/permissions/[^/]+$",
                  "required": true,
                  "type": "string",
                  "location": "path",
                  "description": "Required. The resource name of the permission. Formats: `tunedModels/{tuned_model}/permissions/{permission}` `corpora/{corpus}/permissions/{permission}`"
                }
              },
              "parameterOrder": [
                "name"
              ]
            },
            "patch": {
              "id": "generativelanguage.tunedModels.permissions.patch",
              "path": "v1beta/{+name}",
              "response": {
                "$ref": "Permission"
              },
              "parameterOrder": [
                "name"
              ],
              "flatPath": "v1beta/tunedModels/{tunedModelsId}/permissions/{permissionsId}",
              "httpMethod": "PATCH",
              "request": {
                "$ref": "Permission"
              },
              "description": "Updates the permission.",
              "parameters": {
                "name": {
                  "location": "path",
                  "pattern": "^tunedModels/[^/]+/permissions/[^/]+$",
                  "required": true,
                  "type": "string",
                  "description": "Output only. Identifier. The permission name. A unique name will be generated on create. Examples: tunedModels/{tuned_model}/permissions/{permission} corpora/{corpus}/permissions/{permission} Output only."
                },
                "updateMask": {
                  "location": "query",
                  "format": "google-fieldmask",
                  "type": "string",
                  "description": "Required. The list of fields to update. Accepted ones: - role (`Permission.role` field)"
                }
              }
            },
            "create": {
              "flatPath": "v1beta/tunedModels/{tunedModelsId}/permissions",
              "httpMethod": "POST",
              "parameters": {
                "parent": {
                  "pattern": "^tunedModels/[^/]+$",
                  "required": true,
                  "type": "string",
                  "location": "path",
                  "description": "Required. The parent resource of the `Permission`. Formats: `tunedModels/{tuned_model}` `corpora/{corpus}`"
                }
              },
              "request": {
                "$ref": "Permission"
              },
              "description": "Create a permission to a specific resource.",
              "path": "v1beta/{+parent}/permissions",
              "response": {
                "$ref": "Permission"
              },
              "id": "generativelanguage.tunedModels.permissions.create",
              "parameterOrder": [
                "parent"
              ]
            },
            "delete": {
              "description": "Deletes the permission.",
              "parameters": {
                "name": {
                  "location": "path",
                  "pattern": "^tunedModels/[^/]+/permissions/[^/]+$",
                  "required": true,
                  "type": "string",
                  "description": "Required. The resource name of the permission. Formats: `tunedModels/{tuned_model}/permissions/{permission}` `corpora/{corpus}/permissions/{permission}`"
                }
              },
              "parameterOrder": [
                "name"
              ],
              "id": "generativelanguage.tunedModels.permissions.delete",
              "path": "v1beta/{+name}",
              "response": {
                "$ref": "Empty"
              },
              "flatPath": "v1beta/tunedModels/{tunedModelsId}/permissions/{permissionsId}",
              "httpMethod": "DELETE"
            },
            "list": {
              "parameterOrder": [
                "parent"
              ],
              "parameters": {
                "pageToken": {
                  "location": "query",
                  "description": "Optional. A page token, received from a previous `ListPermissions` call. Provide the `page_token` returned by one request as an argument to the next request to retrieve the next page. When paginating, all other parameters provided to `ListPermissions` must match the call that provided the page token.",
                  "type": "string"
                },
                "parent": {
                  "description": "Required. The parent resource of the permissions. Formats: `tunedModels/{tuned_model}` `corpora/{corpus}`",
                  "location": "path",
                  "pattern": "^tunedModels/[^/]+$",
                  "required": true,
                  "type": "string"
                },
                "pageSize": {
                  "description": "Optional. The maximum number of `Permission`s to return (per page). The service may return fewer permissions. If unspecified, at most 10 permissions will be returned. This method returns at most 1000 permissions per page, even if you pass larger page_size.",
                  "type": "integer",
                  "location": "query",
                  "format": "int32"
                }
              },
              "description": "Lists permissions for the specific resource.",
              "flatPath": "v1beta/tunedModels/{tunedModelsId}/permissions",
              "httpMethod": "GET",
              "path": "v1beta/{+parent}/permissions",
              "response": {
                "$ref": "ListPermissionsResponse"
              },
              "id": "generativelanguage.tunedModels.permissions.list"
            }
          }
        },
        "operations": {
          "methods": {
            "get": {
              "path": "v1beta/{+name}",
              "response": {
                "$ref": "Operation"
              },
              "flatPath": "v1beta/tunedModels/{tunedModelsId}/operations/{operationsId}",
              "httpMethod": "GET",
              "id": "generativelanguage.tunedModels.operations.get",
              "parameterOrder": [
                "name"
              ],
              "description": "Gets the latest state of a long-running operation. Clients can use this method to poll the operation result at intervals as recommended by the API service.",
              "parameters": {
                "name": {
                  "pattern": "^tunedModels/[^/]+/operations/[^/]+$",
                  "required": true,
                  "type": "string",
                  "location": "path",
                  "description": "The name of the operation resource."
                }
              }
            },
            "list": {
              "description": "Lists operations that match the specified filter in the request. If the server doesn't support this method, it returns `UNIMPLEMENTED`.",
              "parameters": {
                "pageSize": {
                  "location": "query",
                  "format": "int32",
                  "description": "The standard list page size.",
                  "type": "integer"
                },
                "filter": {
                  "description": "The standard list filter.",
                  "type": "string",
                  "location": "query"
                },
                "name": {
                  "location": "path",
                  "pattern": "^tunedModels/[^/]+$",
                  "required": true,
                  "type": "string",
                  "description": "The name of the operation's parent resource."
                },
                "returnPartialSuccess": {
                  "type": "boolean",
                  "description": "When set to `true`, operations that are reachable are returned as normal, and those that are unreachable are returned in the ListOperationsResponse.unreachable field. This can only be `true` when reading across collections. For example, when `parent` is set to `\"projects/example/locations/-\"`. This field is not supported by default and will result in an `UNIMPLEMENTED` error if set unless explicitly documented otherwise in service or product specific documentation.",
                  "location": "query"
                },
                "pageToken": {
                  "type": "string",
                  "description": "The standard list page token.",
                  "location": "query"
                }
              },
              "parameterOrder": [
                "name"
              ],
              "id": "generativelanguage.tunedModels.operations.list",
              "path": "v1beta/{+name}/operations",
              "response": {
                "$ref": "ListOperationsResponse"
              },
              "flatPath": "v1beta/tunedModels/{tunedModelsId}/operations",
              "httpMethod": "GET"
            }
          }
        }
      },
      "methods": {
        "patch": {
          "parameterOrder": [
            "name"
          ],
          "id": "generativelanguage.tunedModels.patch",
          "path": "v1beta/{+name}",
          "response": {
            "$ref": "TunedModel"
          },
          "request": {
            "$ref": "TunedModel"
          },
          "description": "Updates a tuned model.",
          "parameters": {
            "updateMask": {
              "type": "string",
              "description": "Optional. The list of fields to update.",
              "location": "query",
              "format": "google-fieldmask"
            },
            "name": {
              "description": "Output only. The tuned model name. A unique name will be generated on create. Example: `tunedModels/az2mb0bpw6i` If display_name is set on create, the id portion of the name will be set by concatenating the words of the display_name with hyphens and adding a random portion for uniqueness. Example: * display_name = `Sentence Translator` * name = `tunedModels/sentence-translator-u3b7m`",
              "location": "path",
              "pattern": "^tunedModels/[^/]+$",
              "required": true,
              "type": "string"
            }
          },
          "flatPath": "v1beta/tunedModels/{tunedModelsId}",
          "httpMethod": "PATCH"
        },
        "delete": {
          "parameters": {
            "name": {
              "location": "path",
              "pattern": "^tunedModels/[^/]+$",
              "required": true,
              "type": "string",
              "description": "Required. The resource name of the model. Format: `tunedModels/my-model-id`"
            }
          },
          "description": "Deletes a tuned model.",
          "parameterOrder": [
            "name"
          ],
          "id": "generativelanguage.tunedModels.delete",
          "flatPath": "v1beta/tunedModels/{tunedModelsId}",
          "httpMethod": "DELETE",
          "path": "v1beta/{+name}",
          "response": {
            "$ref": "Empty"
          }
        },
        "generateContent": {
          "flatPath": "v1beta/tunedModels/{tunedModelsId}:generateContent",
          "httpMethod": "POST",
          "request": {
            "$ref": "GenerateContentRequest"
          },
          "description": "Generates a model response given an input `GenerateContentRequest`. Refer to the [text generation guide](https://ai.google.dev/gemini-api/docs/text-generation) for detailed usage information. Input capabilities differ between models, including tuned models. Refer to the [model guide](https://ai.google.dev/gemini-api/docs/models/gemini) and [tuning guide](https://ai.google.dev/gemini-api/docs/model-tuning) for details.",
          "parameters": {
            "model": {
              "pattern": "^tunedModels/[^/]+$",
              "required": true,
              "type": "string",
              "location": "path",
              "description": "Required. The name of the `Model` to use for generating the completion. Format: `models/{model}`."
            }
          },
          "id": "generativelanguage.tunedModels.generateContent",
          "path": "v1beta/{+model}:generateContent",
          "response": {
            "$ref": "GenerateContentResponse"
          },
          "parameterOrder": [
            "model"
          ]
        },
        "get": {
          "id": "generativelanguage.tunedModels.get",
          "path": "v1beta/{+name}",
          "response": {
            "$ref": "TunedModel"
          },
          "flatPath": "v1beta/tunedModels/{tunedModelsId}",
          "httpMethod": "GET",
          "description": "Gets information about a specific TunedModel.",
          "parameters": {
            "name": {
              "description": "Required. The resource name of the model. Format: `tunedModels/my-model-id`",
              "pattern": "^tunedModels/[^/]+$",
              "required": true,
              "type": "string",
              "location": "path"
            }
          },
          "parameterOrder": [
            "name"
          ]
        },
        "create": {
          "flatPath": "v1beta/tunedModels",
          "httpMethod": "POST",
          "request": {
            "$ref": "TunedModel"
          },
          "description": "Creates a tuned model. Check intermediate tuning progress (if any) through the [google.longrunning.Operations] service. Access status and results through the Operations service. Example: GET /v1/tunedModels/az2mb0bpw6i/operations/000-111-222",
          "parameters": {
            "tunedModelId": {
              "location": "query",
              "description": "Optional. The unique id for the tuned model if specified. This value should be up to 40 characters, the first character must be a letter, the last could be a letter or a number. The id must match the regular expression: `[a-z]([a-z0-9-]{0,38}[a-z0-9])?`.",
              "type": "string"
            }
          },
          "id": "generativelanguage.tunedModels.create",
          "path": "v1beta/tunedModels",
          "response": {
            "$ref": "Operation"
          },
          "parameterOrder": []
        },
        "transferOwnership": {
          "parameterOrder": [
            "name"
          ],
          "path": "v1beta/{+name}:transferOwnership",
          "response": {
            "$ref": "TransferOwnershipResponse"
          },
          "id": "generativelanguage.tunedModels.transferOwnership",
          "request": {
            "$ref": "TransferOwnershipRequest"
          },
          "description": "Transfers ownership of the tuned model. This is the only way to change ownership of the tuned model. The current owner will be downgraded to writer role.",
          "parameters": {
            "name": {
              "description": "Required. The resource name of the tuned model to transfer ownership. Format: `tunedModels/my-model-id`",
              "location": "path",
              "pattern": "^tunedModels/[^/]+$",
              "required": true,
              "type": "string"
            }
          },
          "flatPath": "v1beta/tunedModels/{tunedModelsId}:transferOwnership",
          "httpMethod": "POST"
        },
        "streamGenerateContent": {
          "parameterOrder": [
            "model"
          ],
          "id": "generativelanguage.tunedModels.streamGenerateContent",
          "path": "v1beta/{+model}:streamGenerateContent",
          "response": {
            "$ref": "GenerateContentResponse"
          },
          "parameters": {
            "model": {
              "pattern": "^tunedModels/[^/]+$",
              "required": true,
              "type": "string",
              "location": "path",
              "description": "Required. The name of the `Model` to use for generating the completion. Format: `models/{model}`."
            }
          },
          "request": {
            "$ref": "GenerateContentRequest"
          },
          "description": "Generates a [streamed response](https://ai.google.dev/gemini-api/docs/text-generation?lang=python#generate-a-text-stream) from the model given an input `GenerateContentRequest`.",
          "flatPath": "v1beta/tunedModels/{tunedModelsId}:streamGenerateContent",
          "httpMethod": "POST"
        },
        "list": {
          "id": "generativelanguage.tunedModels.list",
          "path": "v1beta/tunedModels",
          "response": {
            "$ref": "ListTunedModelsResponse"
          },
          "flatPath": "v1beta/tunedModels",
          "httpMethod": "GET",
          "description": "Lists created tuned models.",
          "parameters": {
            "pageToken": {
              "location": "query",
              "description": "Optional. A page token, received from a previous `ListTunedModels` call. Provide the `page_token` returned by one request as an argument to the next request to retrieve the next page. When paginating, all other parameters provided to `ListTunedModels` must match the call that provided the page token.",
              "type": "string"
            },
            "filter": {
              "location": "query",
              "description": "Optional. A filter is a full text search over the tuned model's description and display name. By default, results will not include tuned models shared with everyone. Additional operators: - owner:me - writers:me - readers:me - readers:everyone Examples: \"owner:me\" returns all tuned models to which caller has owner role \"readers:me\" returns all tuned models to which caller has reader role \"readers:everyone\" returns all tuned models that are shared with everyone",
              "type": "string"
            },
            "pageSize": {
              "location": "query",
              "format": "int32",
              "type": "integer",
              "description": "Optional. The maximum number of `TunedModels` to return (per page). The service may return fewer tuned models. If unspecified, at most 10 tuned models will be returned. This method returns at most 1000 models per page, even if you pass a larger page_size."
            }
          },
          "parameterOrder": []
        },
        "batchGenerateContent": {
          "id": "generativelanguage.tunedModels.batchGenerateContent",
          "path": "v1beta/{+model}:batchGenerateContent",
          "response": {
            "$ref": "Operation"
          },
          "parameterOrder": [
            "model"
          ],
          "flatPath": "v1beta/tunedModels/{tunedModelsId}:batchGenerateContent",
          "httpMethod": "POST",
          "parameters": {
            "model": {
              "description": "Required. The name of the `Model` to use for generating the completion. Format: `models/{model}`.",
              "location": "path",
              "pattern": "^tunedModels/[^/]+$",
              "required": true,
              "type": "string"
            }
          },
          "request": {
            "$ref": "BatchGenerateContentRequest"
          },
          "description": "Enqueues a batch of `GenerateContent` requests for batch processing."
        },
        "generateText": {
          "id": "generativelanguage.tunedModels.generateText",
          "path": "v1beta/{+model}:generateText",
          "response": {
            "$ref": "GenerateTextResponse"
          },
          "parameterOrder": [
            "model"
          ],
          "flatPath": "v1beta/tunedModels/{tunedModelsId}:generateText",
          "httpMethod": "POST",
          "request": {
            "$ref": "GenerateTextRequest"
          },
          "description": "Generates a response from the model given an input message.",
          "parameters": {
            "model": {
              "location": "path",
              "pattern": "^tunedModels/[^/]+$",
              "required": true,
              "type": "string",
              "description": "Required. The name of the `Model` or `TunedModel` to use for generating the completion. Examples: models/text-bison-001 tunedModels/sentence-translator-u3b7m"
            }
          }
        },
        "asyncBatchEmbedContent": {
          "flatPath": "v1beta/tunedModels/{tunedModelsId}:asyncBatchEmbedContent",
          "httpMethod": "POST",
          "request": {
            "$ref": "AsyncBatchEmbedContentRequest"
          },
          "description": "Enqueues a batch of `EmbedContent` requests for batch processing. We have a `BatchEmbedContents` handler in `GenerativeService`, but it was synchronized. So we name this one to be `Async` to avoid confusion.",
          "parameters": {
            "model": {
              "location": "path",
              "pattern": "^tunedModels/[^/]+$",
              "required": true,
              "type": "string",
              "description": "Required. The name of the `Model` to use for generating the completion. Format: `models/{model}`."
            }
          },
          "path": "v1beta/{+model}:asyncBatchEmbedContent",
          "response": {
            "$ref": "Operation"
          },
          "id": "generativelanguage.tunedModels.asyncBatchEmbedContent",
          "parameterOrder": [
            "model"
          ]
        }
      }
    },
    "media": {
      "methods": {
        "upload": {
          "parameterOrder": [],
          "mediaUpload": {
            "accept": [
              "*/*"
            ],
            "maxSize": "2147483648",
            "protocols": {
              "simple": {
                "multipart": true,
                "path": "/upload/v1beta/files"
              },
              "resumable": {
                "path": "/resumable/upload/v1beta/files",
                "multipart": true
              }
            }
          },
          "path": "v1beta/files",
          "response": {
            "$ref": "CreateFileResponse"
          },
          "id": "generativelanguage.media.upload",
          "parameters": {},
          "request": {
            "$ref": "CreateFileRequest"
          },
          "description": "Creates a `File`.",
          "flatPath": "v1beta/files",
          "httpMethod": "POST",
          "supportsMediaUpload": true
        },
        "uploadToFileSearchStore": {
          "request": {
            "$ref": "UploadToFileSearchStoreRequest"
          },
          "description": "Uploads data to a FileSearchStore, preprocesses and chunks before storing it in a FileSearchStore Document.",
          "parameters": {
            "fileSearchStoreName": {
              "pattern": "^fileSearchStores/[^/]+$",
              "required": true,
              "type": "string",
              "location": "path",
              "description": "Required. Immutable. The name of the `FileSearchStore` to upload the file into. Example: `fileSearchStores/my-file-search-store-123`"
            }
          },
          "supportsMediaUpload": true,
          "flatPath": "v1beta/fileSearchStores/{fileSearchStoresId}:uploadToFileSearchStore",
          "httpMethod": "POST",
          "mediaUpload": {
            "accept": [
              "*/*"
            ],
            "maxSize": "104857600",
            "protocols": {
              "simple": {
                "multipart": true,
                "path": "/upload/v1beta/{+fileSearchStoreName}:uploadToFileSearchStore"
              },
              "resumable": {
                "path": "/resumable/upload/v1beta/{+fileSearchStoreName}:uploadToFileSearchStore",
                "multipart": true
              }
            }
          },
          "parameterOrder": [
            "fileSearchStoreName"
          ],
          "id": "generativelanguage.media.uploadToFileSearchStore",
          "path": "v1beta/{+fileSearchStoreName}:uploadToFileSearchStore",
          "response": {
            "$ref": "CustomLongRunningOperation"
          }
        }
      }
    },
    "cachedContents": {
      "methods": {
        "create": {
          "flatPath": "v1beta/cachedContents",
          "httpMethod": "POST",
          "request": {
            "$ref": "CachedContent"
          },
          "description": "Creates CachedContent resource.",
          "parameters": {},
          "path": "v1beta/cachedContents",
          "response": {
            "$ref": "CachedContent"
          },
          "id": "generativelanguage.cachedContents.create",
          "parameterOrder": []
        },
        "get": {
          "parameters": {
            "name": {
              "description": "Required. The resource name referring to the content cache entry. Format: `cachedContents/{id}`",
              "location": "path",
              "pattern": "^cachedContents/[^/]+$",
              "required": true,
              "type": "string"
            }
          },
          "description": "Reads CachedContent resource.",
          "parameterOrder": [
            "name"
          ],
          "id": "generativelanguage.cachedContents.get",
          "flatPath": "v1beta/cachedContents/{cachedContentsId}",
          "httpMethod": "GET",
          "path": "v1beta/{+name}",
          "response": {
            "$ref": "CachedContent"
          }
        },
        "patch": {
          "parameterOrder": [
            "name"
          ],
          "path": "v1beta/{+name}",
          "response": {
            "$ref": "CachedContent"
          },
          "id": "generativelanguage.cachedContents.patch",
          "parameters": {
            "updateMask": {
              "location": "query",
              "format": "google-fieldmask",
              "type": "string",
              "description": "The list of fields to update."
            },
            "name": {
              "location": "path",
              "pattern": "^cachedContents/[^/]+$",
              "required": true,
              "type": "string",
              "description": "Output only. Identifier. The resource name referring to the cached content. Format: `cachedContents/{id}`"
            }
          },
          "request": {
            "$ref": "CachedContent"
          },
          "description": "Updates CachedContent resource (only expiration is updatable).",
          "flatPath": "v1beta/cachedContents/{cachedContentsId}",
          "httpMethod": "PATCH"
        },
        "list": {
          "id": "generativelanguage.cachedContents.list",
          "flatPath": "v1beta/cachedContents",
          "httpMethod": "GET",
          "path": "v1beta/cachedContents",
          "response": {
            "$ref": "ListCachedContentsResponse"
          },
          "parameters": {
            "pageSize": {
              "location": "query",
              "format": "int32",
              "type": "integer",
              "description": "Optional. The maximum number of cached contents to return. The service may return fewer than this value. If unspecified, some default (under maximum) number of items will be returned. The maximum value is 1000; values above 1000 will be coerced to 1000."
            },
            "pageToken": {
              "location": "query",
              "description": "Optional. A page token, received from a previous `ListCachedContents` call. Provide this to retrieve the subsequent page. When paginating, all other parameters provided to `ListCachedContents` must match the call that provided the page token.",
              "type": "string"
            }
          },
          "description": "Lists CachedContents.",
          "parameterOrder": []
        },
        "delete": {
          "parameters": {
            "name": {
              "pattern": "^cachedContents/[^/]+$",
              "required": true,
              "type": "string",
              "location": "path",
              "description": "Required. The resource name referring to the content cache entry Format: `cachedContents/{id}`"
            }
          },
          "description": "Deletes CachedContent resource.",
          "parameterOrder": [
            "name"
          ],
          "id": "generativelanguage.cachedContents.delete",
          "flatPath": "v1beta/cachedContents/{cachedContentsId}",
          "httpMethod": "DELETE",
          "path": "v1beta/{+name}",
          "response": {
            "$ref": "Empty"
          }
        }
      }
    },
    "files": {
      "methods": {
        "register": {
          "id": "generativelanguage.files.register",
          "path": "v1beta/files:register",
          "response": {
            "$ref": "RegisterFilesResponse"
          },
          "parameterOrder": [],
          "scopes": [
            "https://www.googleapis.com/auth/devstorage.read_only"
          ],
          "flatPath": "v1beta/files:register",
          "httpMethod": "POST",
          "request": {
            "$ref": "RegisterFilesRequest"
          },
          "description": "Registers a Google Cloud Storage files with FileService. The user is expected to provide Google Cloud Storage URIs and will receive a File resource for each URI in return. Note that the files are not copied, just registered with File API. If one file fails to register, the whole request fails.",
          "parameters": {}
        },
        "get": {
          "description": "Gets the metadata for the given `File`.",
          "parameters": {
            "name": {
              "location": "path",
              "pattern": "^files/[^/]+$",
              "required": true,
              "type": "string",
              "description": "Required. The name of the `File` to get. Example: `files/abc-123`"
            }
          },
          "parameterOrder": [
            "name"
          ],
          "id": "generativelanguage.files.get",
          "path": "v1beta/{+name}",
          "response": {
            "$ref": "File"
          },
          "flatPath": "v1beta/files/{filesId}",
          "httpMethod": "GET"
        },
        "list": {
          "path": "v1beta/files",
          "response": {
            "$ref": "ListFilesResponse"
          },
          "flatPath": "v1beta/files",
          "httpMethod": "GET",
          "id": "generativelanguage.files.list",
          "parameterOrder": [],
          "description": "Lists the metadata for `File`s owned by the requesting project.",
          "parameters": {
            "pageToken": {
              "location": "query",
              "type": "string",
              "description": "Optional. A page token from a previous `ListFiles` call."
            },
            "pageSize": {
              "location": "query",
              "format": "int32",
              "type": "integer",
              "description": "Optional. Maximum number of `File`s to return per page. If unspecified, defaults to 10. Maximum `page_size` is 100."
            }
          }
        },
        "delete": {
          "description": "Deletes the `File`.",
          "parameters": {
            "name": {
              "location": "path",
              "pattern": "^files/[^/]+$",
              "required": true,
              "type": "string",
              "description": "Required. The name of the `File` to delete. Example: `files/abc-123`"
            }
          },
          "parameterOrder": [
            "name"
          ],
          "id": "generativelanguage.files.delete",
          "path": "v1beta/{+name}",
          "response": {
            "$ref": "Empty"
          },
          "flatPath": "v1beta/files/{filesId}",
          "httpMethod": "DELETE"
        }
      }
    },
    "fileSearchStores": {
      "resources": {
        "documents": {
          "methods": {
            "get": {
              "id": "generativelanguage.fileSearchStores.documents.get",
              "flatPath": "v1beta/fileSearchStores/{fileSearchStoresId}/documents/{documentsId}",
              "httpMethod": "GET",
              "path": "v1beta/{+name}",
              "response": {
                "$ref": "Document"
              },
              "parameters": {
                "name": {
                  "location": "path",
                  "pattern": "^fileSearchStores/[^/]+/documents/[^/]+$",
                  "required": true,
                  "type": "string",
                  "description": "Required. The name of the `Document` to retrieve. Example: `fileSearchStores/my-file-search-store-123/documents/the-doc-abc`"
                }
              },
              "description": "Gets information about a specific `Document`.",
              "parameterOrder": [
                "name"
              ]
            },
            "delete": {
              "id": "generativelanguage.fileSearchStores.documents.delete",
              "flatPath": "v1beta/fileSearchStores/{fileSearchStoresId}/documents/{documentsId}",
              "httpMethod": "DELETE",
              "path": "v1beta/{+name}",
              "response": {
                "$ref": "Empty"
              },
              "parameters": {
                "name": {
                  "location": "path",
                  "pattern": "^fileSearchStores/[^/]+/documents/[^/]+$",
                  "required": true,
                  "type": "string",
                  "description": "Required. The resource name of the `Document` to delete. Example: `fileSearchStores/my-file-search-store-123/documents/the-doc-abc`"
                },
                "force": {
                  "location": "query",
                  "type": "boolean",
                  "description": "Optional. If set to true, any `Chunk`s and objects related to this `Document` will also be deleted. If false (the default), a `FAILED_PRECONDITION` error will be returned if `Document` contains any `Chunk`s."
                }
              },
              "description": "Deletes a `Document`.",
              "parameterOrder": [
                "name"
              ]
            },
            "list": {
              "id": "generativelanguage.fileSearchStores.documents.list",
              "path": "v1beta/{+parent}/documents",
              "response": {
                "$ref": "ListDocumentsResponse"
              },
              "flatPath": "v1beta/fileSearchStores/{fileSearchStoresId}/documents",
              "httpMethod": "GET",
              "description": "Lists all `Document`s in a `Corpus`.",
              "parameters": {
                "parent": {
                  "description": "Required. The name of the `FileSearchStore` containing `Document`s. Example: `fileSearchStores/my-file-search-store-123`",
                  "pattern": "^fileSearchStores/[^/]+$",
                  "required": true,
                  "type": "string",
                  "location": "path"
                },
                "pageSize": {
                  "location": "query",
                  "format": "int32",
                  "type": "integer",
                  "description": "Optional. The maximum number of `Document`s to return (per page). The service may return fewer `Document`s. If unspecified, at most 10 `Document`s will be returned. The maximum size limit is 20 `Document`s per page."
                },
                "pageToken": {
                  "type": "string",
                  "description": "Optional. A page token, received from a previous `ListDocuments` call. Provide the `next_page_token` returned in the response as an argument to the next request to retrieve the next page. When paginating, all other parameters provided to `ListDocuments` must match the call that provided the page token.",
                  "location": "query"
                }
              },
              "parameterOrder": [
                "parent"
              ]
            }
          }
        },
        "operations": {
          "methods": {
            "get": {
              "path": "v1beta/{+name}",
              "response": {
                "$ref": "Operation"
              },
              "flatPath": "v1beta/fileSearchStores/{fileSearchStoresId}/operations/{operationsId}",
              "httpMethod": "GET",
              "id": "generativelanguage.fileSearchStores.operations.get",
              "parameterOrder": [
                "name"
              ],
              "description": "Gets the latest state of a long-running operation. Clients can use this method to poll the operation result at intervals as recommended by the API service.",
              "parameters": {
                "name": {
                  "description": "The name of the operation resource.",
                  "pattern": "^fileSearchStores/[^/]+/operations/[^/]+$",
                  "required": true,
                  "type": "string",
                  "location": "path"
                }
              }
            }
          }
        },
        "upload": {
          "resources": {
            "operations": {
              "methods": {
                "get": {
                  "flatPath": "v1beta/fileSearchStores/{fileSearchStoresId}/upload/operations/{operationsId}",
                  "httpMethod": "GET",
                  "path": "v1beta/{+name}",
                  "response": {
                    "$ref": "Operation"
                  },
                  "id": "generativelanguage.fileSearchStores.upload.operations.get",
                  "parameterOrder": [
                    "name"
                  ],
                  "parameters": {
                    "name": {
                      "location": "path",
                      "pattern": "^fileSearchStores/[^/]+/upload/operations/[^/]+$",
                      "required": true,
                      "type": "string",
                      "description": "The name of the operation resource."
                    }
                  },
                  "description": "Gets the latest state of a long-running operation. Clients can use this method to poll the operation result at intervals as recommended by the API service."
                }
              }
            }
          }
        }
      },
      "methods": {
        "create": {
          "id": "generativelanguage.fileSearchStores.create",
          "path": "v1beta/fileSearchStores",
          "response": {
            "$ref": "FileSearchStore"
          },
          "parameterOrder": [],
          "flatPath": "v1beta/fileSearchStores",
          "httpMethod": "POST",
          "parameters": {},
          "request": {
            "$ref": "FileSearchStore"
          },
          "description": "Creates an empty `FileSearchStore`."
        },
        "get": {
          "description": "Gets information about a specific `FileSearchStore`.",
          "parameters": {
            "name": {
              "description": "Required. The name of the `FileSearchStore`. Example: `fileSearchStores/my-file-search-store-123`",
              "location": "path",
              "pattern": "^fileSearchStores/[^/]+$",
              "required": true,
              "type": "string"
            }
          },
          "parameterOrder": [
            "name"
          ],
          "id": "generativelanguage.fileSearchStores.get",
          "path": "v1beta/{+name}",
          "response": {
            "$ref": "FileSearchStore"
          },
          "flatPath": "v1beta/fileSearchStores/{fileSearchStoresId}",
          "httpMethod": "GET"
        },
        "importFile": {
          "flatPath": "v1beta/fileSearchStores/{fileSearchStoresId}:importFile",
          "httpMethod": "POST",
          "parameters": {
            "fileSearchStoreName": {
              "description": "Required. Immutable. The name of the `FileSearchStore` to import the file into. Example: `fileSearchStores/my-file-search-store-123`",
              "location": "path",
              "pattern": "^fileSearchStores/[^/]+$",
              "required": true,
              "type": "string"
            }
          },
          "request": {
            "$ref": "ImportFileRequest"
          },
          "description": "Imports a `File` from File Service to a `FileSearchStore`.",
          "id": "generativelanguage.fileSearchStores.importFile",
          "path": "v1beta/{+fileSearchStoreName}:importFile",
          "response": {
            "$ref": "Operation"
          },
          "parameterOrder": [
            "fileSearchStoreName"
          ]
        },
        "list": {
          "id": "generativelanguage.fileSearchStores.list",
          "flatPath": "v1beta/fileSearchStores",
          "httpMethod": "GET",
          "path": "v1beta/fileSearchStores",
          "response": {
            "$ref": "ListFileSearchStoresResponse"
          },
          "parameters": {
            "pageToken": {
              "type": "string",
              "description": "Optional. A page token, received from a previous `ListFileSearchStores` call. Provide the `next_page_token` returned in the response as an argument to the next request to retrieve the next page. When paginating, all other parameters provided to `ListFileSearchStores` must match the call that provided the page token.",
              "location": "query"
            },
            "pageSize": {
              "type": "integer",
              "description": "Optional. The maximum number of `FileSearchStores` to return (per page). The service may return fewer `FileSearchStores`. If unspecified, at most 10 `FileSearchStores` will be returned. The maximum size limit is 20 `FileSearchStores` per page.",
              "location": "query",
              "format": "int32"
            }
          },
          "description": "Lists all `FileSearchStores` owned by the user.",
          "parameterOrder": []
        },
        "delete": {
          "parameters": {
            "name": {
              "pattern": "^fileSearchStores/[^/]+$",
              "required": true,
              "type": "string",
              "location": "path",
              "description": "Required. The resource name of the `FileSearchStore`. Example: `fileSearchStores/my-file-search-store-123`"
            },
            "force": {
              "location": "query",
              "type": "boolean",
              "description": "Optional. If set to true, any `Document`s and objects related to this `FileSearchStore` will also be deleted. If false (the default), a `FAILED_PRECONDITION` error will be returned if `FileSearchStore` contains any `Document`s."
            }
          },
          "description": "Deletes a `FileSearchStore`.",
          "parameterOrder": [
            "name"
          ],
          "id": "generativelanguage.fileSearchStores.delete",
          "flatPath": "v1beta/fileSearchStores/{fileSearchStoresId}",
          "httpMethod": "DELETE",
          "path": "v1beta/{+name}",
          "response": {
            "$ref": "Empty"
          }
        }
      }
    },
    "dynamic": {
      "methods": {
        "generateContent": {
          "parameterOrder": [
            "model"
          ],
          "id": "generativelanguage.dynamic.generateContent",
          "path": "v1beta/{+model}:generateContent",
          "response": {
            "$ref": "GenerateContentResponse"
          },
          "request": {
            "$ref": "GenerateContentRequest"
          },
          "description": "Generates a model response given an input `GenerateContentRequest`. Refer to the [text generation guide](https://ai.google.dev/gemini-api/docs/text-generation) for detailed usage information. Input capabilities differ between models, including tuned models. Refer to the [model guide](https://ai.google.dev/gemini-api/docs/models/gemini) and [tuning guide](https://ai.google.dev/gemini-api/docs/model-tuning) for details.",
          "parameters": {
            "model": {
              "description": "Required. The name of the `Model` to use for generating the completion. Format: `models/{model}`.",
              "pattern": "^dynamic/[^/]+$",
              "required": true,
              "type": "string",
              "location": "path"
            }
          },
          "flatPath": "v1beta/dynamic/{dynamicId}:generateContent",
          "httpMethod": "POST"
        },
        "streamGenerateContent": {
          "parameterOrder": [
            "model"
          ],
          "path": "v1beta/{+model}:streamGenerateContent",
          "response": {
            "$ref": "GenerateContentResponse"
          },
          "id": "generativelanguage.dynamic.streamGenerateContent",
          "parameters": {
            "model": {
              "pattern": "^dynamic/[^/]+$",
              "required": true,
              "type": "string",
              "location": "path",
              "description": "Required. The name of the `Model` to use for generating the completion. Format: `models/{model}`."
            }
          },
          "request": {
            "$ref": "GenerateContentRequest"
          },
          "description": "Generates a [streamed response](https://ai.google.dev/gemini-api/docs/text-generation?lang=python#generate-a-text-stream) from the model given an input `GenerateContentRequest`.",
          "flatPath": "v1beta/dynamic/{dynamicId}:streamGenerateContent",
          "httpMethod": "POST"
        }
      }
    }
  },
  "ownerName": "Google",
  "description": "The Gemini API allows developers to build generative AI applications using Gemini models. Gemini is our most capable model, built from the ground up to be multimodal. It can generalize and seamlessly understand, operate across, and combine different types of information including language, images, audio, video, and code. You can use the Gemini API for use cases like reasoning across text and images, content generation, dialogue agents, summarization and classification systems, and more.",
  "name": "generativelanguage",
  "protocol": "rest",
  "icons": {
    "x16": "http://www.google.com/images/icons/product/search-16.gif",
    "x32": "http://www.google.com/images/icons/product/search-32.gif"
  },
  "basePath": "",
  "ownerDomain": "google.com",
  "kind": "discovery#restDescription",
  "rootUrl": "https://generativelanguage.googleapis.com/",
  "version_module": true,
  "canonicalName": "Generative Language",
  "schemas": {
    "Operation": {
      "properties": {
        "done": {
          "type": "boolean",
          "description": "If the value is `false`, it means the operation is still in progress. If `true`, the operation is completed, and either `error` or `response` is available."
        },
        "error": {
          "description": "The error result of the operation in case of failure or cancellation.",
          "$ref": "Status"
        },
        "response": {
          "additionalProperties": {
            "description": "Properties of the object. Contains field @type with type URL.",
            "type": "any"
          },
          "description": "The normal, successful response of the operation. If the original method returns no data on success, such as `Delete`, the response is `google.protobuf.Empty`. If the original method is standard `Get`/`Create`/`Update`, the response should be the resource. For other methods, the response should have the type `XxxResponse`, where `Xxx` is the original method name. For example, if the original method name is `TakeSnapshot()`, the inferred response type is `TakeSnapshotResponse`.",
          "type": "object"
        },
        "name": {
          "type": "string",
          "description": "The server-assigned name, which is only unique within the same service that originally returns it. If you use the default HTTP mapping, the `name` should be a resource name ending with `operations/{unique_id}`."
        },
        "metadata": {
          "additionalProperties": {
            "type": "any",
            "description": "Properties of the object. Contains field @type with type URL."
          },
          "type": "object",
          "description": "Service-specific metadata associated with the operation. It typically contains progress information and common metadata such as create time. Some services might not provide such metadata. Any method that returns a long-running operation should document the metadata type, if any."
        }
      },
      "id": "Operation",
      "description": "This resource represents a long-running operation that is the result of a network API call.",
      "type": "object"
    },
    "BatchEmbedContentsRequest": {
      "id": "BatchEmbedContentsRequest",
      "description": "Batch request to get embeddings from the model for a list of prompts.",
      "type": "object",
      "properties": {
        "requests": {
          "description": "Required. Embed requests for the batch. The model in each of these requests must match the model specified `BatchEmbedContentsRequest.model`.",
          "type": "array",
          "items": {
            "$ref": "EmbedContentRequest"
          }
        }
      }
    },
    "CitationMetadata": {
      "properties": {
        "citationSources": {
          "type": "array",
          "items": {
            "$ref": "CitationSource"
          },
          "description": "Citations to sources for a specific response."
        }
      },
      "type": "object",
      "id": "CitationMetadata",
      "description": "A collection of source attributions for a piece of content."
    },
    "PromptFeedback": {
      "id": "PromptFeedback",
      "description": "A set of the feedback metadata the prompt specified in `GenerateContentRequest.content`.",
      "type": "object",
      "properties": {
        "blockReason": {
          "type": "string",
          "description": "Optional. If set, the prompt was blocked and no candidates are returned. Rephrase the prompt.",
          "enum": [
            "BLOCK_REASON_UNSPECIFIED",
            "SAFETY",
            "OTHER",
            "BLOCKLIST",
            "PROHIBITED_CONTENT",
            "IMAGE_SAFETY"
          ],
          "enumDescriptions": [
            "Default value. This value is unused.",
            "Prompt was blocked due to safety reasons. Inspect `safety_ratings` to understand which safety category blocked it.",
            "Prompt was blocked due to unknown reasons.",
            "Prompt was blocked due to the terms which are included from the terminology blocklist.",
            "Prompt was blocked due to prohibited content.",
            "Candidates blocked due to unsafe image generation content."
          ]
        },
        "safetyRatings": {
          "description": "Ratings for safety of the prompt. There is at most one rating per category.",
          "type": "array",
          "items": {
            "$ref": "SafetyRating"
          }
        }
      }
    },
    "ListGeneratedFilesResponse": {
      "properties": {
        "nextPageToken": {
          "description": "A token that can be sent as a `page_token` into a subsequent `ListGeneratedFiles` call.",
          "type": "string"
        },
        "generatedFiles": {
          "description": "The list of `GeneratedFile`s.",
          "type": "array",
          "items": {
            "$ref": "GeneratedFile"
          }
        }
      },
      "id": "ListGeneratedFilesResponse",
      "description": "Response for `ListGeneratedFiles`.",
      "type": "object"
    },
    "GoogleAiGenerativelanguageV1betaSegment": {
      "properties": {
        "endIndex": {
          "description": "End index in the given Part, measured in bytes. Offset from the start of the Part, exclusive, starting at zero.",
          "type": "integer",
          "format": "int32"
        },
        "text": {
          "type": "string",
          "description": "The text corresponding to the segment from the response."
        },
        "partIndex": {
          "format": "int32",
          "description": "The index of a Part object within its parent Content object.",
          "type": "integer"
        },
        "startIndex": {
          "type": "integer",
          "description": "Start index in the given Part, measured in bytes. Offset from the start of the Part, inclusive, starting at zero.",
          "format": "int32"
        }
      },
      "type": "object",
      "id": "GoogleAiGenerativelanguageV1betaSegment",
      "description": "Segment of the content."
    },
    "ModalityTokenCount": {
      "properties": {
        "modality": {
          "description": "The modality associated with this token count.",
          "type": "string",
          "enumDescriptions": [
            "Unspecified modality.",
            "Plain text.",
            "Image.",
            "Video.",
            "Audio.",
            "Document, e.g. PDF."
          ],
          "enum": [
            "MODALITY_UNSPECIFIED",
            "TEXT",
            "IMAGE",
            "VIDEO",
            "AUDIO",
            "DOCUMENT"
          ]
        },
        "tokenCount": {
          "format": "int32",
          "description": "Number of tokens.",
          "type": "integer"
        }
      },
      "id": "ModalityTokenCount",
      "description": "Represents token counting info for a single modality.",
      "type": "object"
    },
    "ModelStatus": {
      "properties": {
        "modelStage": {
          "description": "The stage of the underlying model.",
          "enumDescriptions": [
            "Unspecified model stage.",
            "The underlying model is subject to lots of tunings.",
            "Models in this stage are for experimental purposes only.",
            "Models in this stage are more mature than experimental models.",
            "Models in this stage are considered stable and ready for production use.",
            "If the model is on this stage, it means that this model is on the path to deprecation in near future. Only existing customers can use this model.",
            "Models in this stage are deprecated. These models cannot be used.",
            "Models in this stage are retired. These models cannot be used."
          ],
          "type": "string",
          "enumDeprecated": [
            false,
            true,
            false,
            false,
            false,
            false,
            true,
            false
          ],
          "enum": [
            "MODEL_STAGE_UNSPECIFIED",
            "UNSTABLE_EXPERIMENTAL",
            "EXPERIMENTAL",
            "PREVIEW",
            "STABLE",
            "LEGACY",
            "DEPRECATED",
            "RETIRED"
          ]
        },
        "retirementTime": {
          "format": "google-datetime",
          "type": "string",
          "description": "The time at which the model will be retired."
        },
        "message": {
          "description": "A message explaining the model status.",
          "type": "string"
        }
      },
      "type": "object",
      "id": "ModelStatus",
      "description": "The status of the underlying model. This is used to indicate the stage of the underlying model and the retirement time if applicable."
    },
    "WebSearch": {
      "id": "WebSearch",
      "description": "Standard web search for grounding and related configurations.",
      "type": "object",
      "properties": {}
    },
    "PredictLongRunningRequest": {
      "type": "object",
      "id": "PredictLongRunningRequest",
      "description": "Request message for [PredictionService.PredictLongRunning].",
      "properties": {
        "parameters": {
          "description": "Optional. The parameters that govern the prediction call.",
          "type": "any"
        },
        "instances": {
          "type": "array",
          "items": {
            "type": "any"
          },
          "description": "Required. The instances that are the input to the prediction call."
        }
      }
    },
    "UploadToFileSearchStoreRequest": {
      "properties": {
        "customMetadata": {
          "type": "array",
          "items": {
            "$ref": "CustomMetadata"
          },
          "description": "Custom metadata to be associated with the data."
        },
        "chunkingConfig": {
          "description": "Optional. Config for telling the service how to chunk the data. If not provided, the service will use default parameters.",
          "$ref": "ChunkingConfig"
        },
        "displayName": {
          "type": "string",
          "description": "Optional. Display name of the created document."
        },
        "mimeType": {
          "type": "string",
          "description": "Optional. MIME type of the data. If not provided, it will be inferred from the uploaded content."
        }
      },
      "type": "object",
      "id": "UploadToFileSearchStoreRequest",
      "description": "Request for `UploadToFileSearchStore`."
    },
    "BatchGenerateContentRequest": {
      "properties": {
        "batch": {
          "description": "Required. The batch to create.",
          "$ref": "GenerateContentBatch"
        }
      },
      "type": "object",
      "id": "BatchGenerateContentRequest",
      "description": "Request for a `BatchGenerateContent` operation."
    },
    "ToolConfig": {
      "properties": {
        "functionCallingConfig": {
          "description": "Optional. Function calling config.",
          "$ref": "FunctionCallingConfig"
        },
        "retrievalConfig": {
          "description": "Optional. Retrieval config.",
          "$ref": "RetrievalConfig"
        }
      },
      "id": "ToolConfig",
      "description": "The Tool configuration containing parameters for specifying `Tool` use in the request.",
      "type": "object"
    },
    "Permission": {
      "type": "object",
      "id": "Permission",
      "description": "Permission resource grants user, group or the rest of the world access to the PaLM API resource (e.g. a tuned model, corpus). A role is a collection of permitted operations that allows users to perform specific actions on PaLM API resources. To make them available to users, groups, or service accounts, you assign roles. When you assign a role, you grant permissions that the role contains. There are three concentric roles. Each role is a superset of the previous role's permitted operations: - reader can use the resource (e.g. tuned model, c