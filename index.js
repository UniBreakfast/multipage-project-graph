try { require('./.env.js') } catch {}

const { createServer } = require('http')
const { readFile } = require('fs/promises')
const server = createServer()
const port = process.env.PORT
const env = process.env.NODE_ENV

server.on('request', handleRequest)

server.listen(port, notifyServerStarted)

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

function handleApiRequest(request, response) {
  const fakeNode = { id: 1, name: 'Fake Node' }
  response.end(JSON.stringify(fakeNode))
  // response.end('Hello from API')
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
