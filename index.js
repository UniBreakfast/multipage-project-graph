const { createServer } = require('http')
const { readFile } = require('fs/promises')
const server = createServer()
const port = 7843

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
  response.end('Hello from API')
}

async function handleStaticRequest(request, response) {
  const path = request.url.slice(1) || 'index.html'
  
  try {
    const fileContent = await readFile('public/' + path)

    response.end(fileContent)
  } catch {
    try {
      if (/^pages\/[\w-]/.test(path)) {
        const pageName = path.split('/')[1]
        const actualPath = `public/${path}/${pageName}.html`
        const fileContent = await readFile(actualPath)
  
        response.end(fileContent)
      } else throw 404
    } catch {
      response.statusCode = 404
      response.end('File not found: /' + path)
    }
  }
}
