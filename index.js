try { require('./.env.js') } catch { }

const { createServer } = require('http')
const { readFile, writeFile } = require('fs/promises')
const { readFileSync } = require('fs')
const server = createServer()
const port = process.env.PORT
const env = process.env.NODE_ENV

let nodeTypes = loadNodeTypes()
let nodes = loadNodes()
let idCounter = loadIdCounter()

server.on('request', handleRequest)

server.listen(port, notifyServerStarted)

function loadNodeTypes() {
  try {
    const nodeTypesJSON = readFileSync('data/node-types.json', 'utf-8')
    const nodeTypes = JSON.parse(nodeTypesJSON)

    return nodeTypes
  } catch {
    return []
  }
}

function saveNodeTypes() {
  const nodeTypesJSON = JSON.stringify(nodeTypes, null, 2)

  return writeFile('data/node-types.json', nodeTypesJSON)
}

function loadIdCounter() {
  try {
    const idCounterJSON = readFileSync('data/id-counter.json', 'utf-8')
    const { count } = JSON.parse(idCounterJSON)

    return count
  } catch {
    return 1
  }
}

function saveIdCounter() {
  const idCounterJSON = JSON.stringify({ count: idCounter, nextId: idCounter.toString(36).padStart(5, '0') }, null, 2)

  return writeFile('data/id-counter.json', idCounterJSON)
}

function getNextId() {
  const nextCount = idCounter++
  const nextId = nextCount.toString(36).padStart(5, '0')

  saveIdCounter()

  return nextId
}

function loadNodes() {
  try {
    const nodesJSON = readFileSync('data/nodes.json', 'utf-8')
    const nodes = JSON.parse(nodesJSON)

    return nodes
  } catch {
    return []
  }
}

function saveNodes() {
  const nodesJSON = JSON.stringify(nodes, null, 2)

  return writeFile('data/nodes.json', nodesJSON)
}

function handleRequest(request, response) {
  if (request.url.startsWith('/api/')) {
    handleApiRequest(request, response)
  } else {
    handleStaticRequest(request, response)
  }
}

function notifyServerStarted() {
  console.log(`Server started at http://localhost:${port}`)
}

async function handleApiRequest(request, response) {
  let { method, url } = request
  let [urlPart, id] = url.split(/(?<=\/.+\/.+)\//)
  const route = method + ' ' + urlPart

  try {
    switch (route) {
      case 'GET /api/node-types': {
        response.end(JSON.stringify(nodeTypes))
        break
      }
      case 'POST /api/node-types': {
        const body = await getBody(request)
        let nodeType = JSON.parse(body)
        const { type } = nodeType

        if (!type) throw 'Type is required'

        nodeType = { id: getNextId(), type }
        nodeTypes.push(nodeType)
        saveNodeTypes()
        response.end(JSON.stringify(nodeType))
        break
      }
      case 'DELETE /api/node-types': {
        const body = await getBody(request)
        const nodeTypeIds = JSON.parse(body)

        if (!nodeTypeIds.length) throw 'No node type ids provided'

        const nodeTypesToDelete = nodeTypes.filter(nodeType => nodeTypeIds.includes(nodeType.id))

        nodeTypes = nodeTypes.filter(nodeType => !nodeTypeIds.includes(nodeType.id))
        saveNodeTypes()
        response.end(JSON.stringify(nodeTypesToDelete))
        break
      }
      case 'GET /api/nodes': {
        if (id) {
          const node = nodes.find(node => node.id == id)

          if (!node) throw 'Node not found'

          response.end(JSON.stringify(node))
        } else {
          response.end(JSON.stringify(nodes))
        }
        break
      }
      case 'POST /api/nodes': {
        const body = await getBody(request)
        let node = JSON.parse(body)
        const { name, type: typeId } = node

        if (!name) throw 'Name is required'
        if (!typeId) throw 'Type is required'

        node = { id: getNextId(), name, typeId }
        nodes.push(node)
        saveNodes()
        response.end(JSON.stringify(node))
        break
      }
      case 'PUT /api/nodes': {
        const body = await getBody(request)
        let node = JSON.parse(body)
        const { id, name, type: typeId } = node

        if (!id) throw 'Id is required'
        if (!name) throw 'Name is required'
        if (!typeId) throw 'Type is required'

        const index = nodes.findIndex(node => node.id == id)

        if (index == -1) throw 'Node not found'

        node = { id, name, typeId }
        nodes[index] = node
        saveNodes()
        response.end(JSON.stringify(node))
        break
      }
      case 'DELETE /api/nodes': {
        const body = await getBody(request)
        const nodeIds = JSON.parse(body)

        if (!nodeIds.length) throw 'No node ids provided - nothing to delete'

        const nodesToDelete = nodes.filter(node => nodeIds.includes(node.id))

        nodes = nodes.filter(node => !nodeIds.includes(node.id))
        saveNodes()
        response.end(JSON.stringify(nodesToDelete))
        break
      }
      default: {
        const json = JSON.stringify({ complaint: 'route not found' })

        response.statusCode = 404
        response.end(json)
      }
    }
  } catch (err) {
    const json = JSON.stringify({ complaint: err.message || err })

    response.statusCode = 400
    response.end(json)
  }
}

async function getBody(request) {
  let body = ''

  for await (const chunk of request) body += chunk

  return body
}

async function handleStaticRequest(request, response) {
  let path = request.url.slice(1) || 'index.html'

  try {
    if (await isNonPublic(path)) throw 404

    try {
      if (env == 'dev' && path == 'favicon.ico') {
        path = 'favicon-dev.ico'
      }
      const fileContent = await readFile(path)

      response.end(fileContent)
    } catch {
      if (/^pages\/[\w-]/.test(path)) {
        const pageName = path.split('/')[1]
        const actualPath = `${path}/${pageName}.html`
        const fileContent = await readFile(actualPath)

        response.end(fileContent)
      }
    }
  } catch {
    response.statusCode = 404
    response.end('File not found: /' + path)
  }
}

async function isNonPublic(path) {
  const nonPublicPaths = (await readFile('.nonpublic', 'utf-8')).split(/\r?\n/).filter(Boolean)
  const nonPublic = nonPublicPaths.some(str => path.startsWith(str))

  return nonPublic
}
