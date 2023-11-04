const nodeForm = document.getElementById('node-form')
const nodeTypesSelect = nodeForm.type
const nodeTypeOptionTemplate = nodeTypesSelect.querySelector('template')
const details = document.getElementById('node-details')
const singleFeedback = details.previousElementSibling
const firstFeedback = details.querySelector('b')
const restOfLines = details.querySelector('ul')
const feedbackTemplate = details.querySelector('template')

getNodeTypes().then(fillNodeTypesSelect)
  .then(getCurrentNodeId)
  .then(getNode)
  .then(actualizeNodeForm)

nodeForm.onsubmit = handleNodeFormSubmit

function getNodeTypes() {
  return fetch('/api/node-types')
    .then(result => result.json())
}

function fillNodeTypesSelect(nodeTypes) {
  nodeTypes.forEach(nodeType => {
    const { option } = useNodeTypeOptionTemplate()
    const { id, type } = nodeType

    option.value = id
    option.textContent = type

    nodeTypesSelect.append(option)
  })
}

function useNodeTypeOptionTemplate() {
  const { content } = nodeTypeOptionTemplate
  const option = content.firstElementChild.cloneNode(true)

  return { option }
}

async function getCurrentNodeId() { // from hash
  let id = location.hash.slice(1)

  if (!id) {
    const nodes = await getNodes()
    const lastNode = nodes.at(-1)
    
    id = lastNode.id
    location.hash = id
  }
  return id
}

function getNode(id) {
  return fetch(`/api/nodes/${id}`)
    .then(result => result.json())
}

function actualizeNodeForm(node) {
  const { id, name, typeId } = node

  nodeForm.id.value = id
  nodeForm.name.value = name
  nodeForm.type.value = typeId
}

function getNodes() {
  return fetch('/api/nodes')
    .then(result => result.json())
}

function handleNodeFormSubmit() {

}
