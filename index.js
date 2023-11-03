try { require('./.env.js') } catch {}

const { createServer } = require('http')
const { readFile, writeFile } = require('fs/promises')
const { readFileSync } = require('fs')
const server = createServer()
const port = process.env.PORT
const env = process.env.NODE_ENV

const nodes = loadNodes()

let idCounter = loadIdCounter()

server.on('request', handleRequest)

server.listen(port, notifyServerStarted)

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
  const { method, url } = request
  const route = method + ' ' + url

  try {
    switch (route) {
      case 'GET /api/nodes':
        response.end(JSON.stringify(nodes))
        break
  
      case 'POST /api/nodes':
        const body = await getBody(request)
        let node = JSON.parse(body)
        const { name } = node
  
        if (!name) throw 'Name is required'
  
        node = { id: getNextId(), name }
        nodes.push(node)
        saveNodes()
        response.end(JSON.stringify(node))
        break
  
      default:
        const json = JSON.stringify({ complaint: 'route not found' })

        response.statusCode = 404 
        response.end(json)
    }
  } catch (err) {
    const json = JSON.stringify({ complaint: err.message })

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
