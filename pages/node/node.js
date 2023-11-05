const nodeForm = document.getElementById('node-form')
const nodeSelect = nodeForm.id
const nodeOptionTemplate = nodeSelect.querySelector('template')
const nodeTypesSelect = nodeForm.type
const nodeTypeOptionTemplate = nodeTypesSelect.querySelector('template')
const details = document.getElementById('node-details')
const singleFeedback = details.previousElementSibling
const firstFeedback = details.querySelector('b')
const restOfLines = details.querySelector('ul')
const feedbackTemplate = details.querySelector('template')

getNodeTypes().then(fillNodeTypesSelect)
  .then(getNodes)
  .then(fillNodeSelect)
  .then(getCurrentNodeId)
  .then(getNode)
  .then(actualizeNodeForm)

window.onhashchange = handleHashChange

nodeSelect.onchange = handleSelectNode

nodeForm.onsubmit = handleNodeFormSubmit

function handleHashChange() {
  getCurrentNodeId().then(getNode).then(actualizeNodeForm)
}

function handleSelectNode(e) {
  const id = nodeSelect.value

  nodeSelect.setAttribute('value', id)
  location.hash = id
  getNode(id).then(actualizeNodeForm)
}

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

function fillNodeSelect(nodes) {
  nodes.forEach(node => {
    const { option } = useNodeOptionTemplate()
    const { id, name } = node

    option.value = id
    option.textContent = `${id} \u00A0 ${name}`

    nodeSelect.append(option)
  })
}

function useNodeOptionTemplate() {
  const { content } = nodeOptionTemplate
  const option = content.firstElementChild.cloneNode(true)

  return { option }
}

function useNodeTypeOptionTemplate() {
  const { content } = nodeTypeOptionTemplate
  const option = content.firstElementChild.cloneNode(true)

  return { option }
}

async function getCurrentNodeId() { // from hash
  if (!nodeSelect.options.length) {
    goTo('add-node')
  }
  
  let id = location.hash.slice(1)

  if (!id || !nodeSelect.querySelector(`option[value="${id}"]`)) {
    id = nodeSelect.value
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
  const nodeOption = nodeForm.id.querySelector(`option[value="${id}"]`)

  nodeForm.id.querySelector('[selected]')?.toggleAttribute('selected')
  nodeForm.id.value = id
  nodeOption.toggleAttribute('selected')
  nodeOption.textContent = `${id} \u00A0 ${name}`
  nodeForm.name.setAttribute('value', name)
  nodeForm.name.value = name
  nodeForm.type.querySelector('[selected]')?.toggleAttribute('selected')
  nodeForm.type.setAttribute('value', typeId)
  nodeForm.type.value = typeId
  nodeForm.type.querySelector(`option[value="${typeId}"]`)?.toggleAttribute('selected')
}

function getNodes() {
  return fetch('/api/nodes')
    .then(result => result.json())
}

function handleNodeFormSubmit(e) {
  const button = e.submitter
  const action = button.value

  if (action === 'delete') {
    deleteNode()
  } else if (action === 'save') {
    saveNode()
  } else if (action == 'revert') {
    nodeForm.reset()
  }
}

async function deleteNode() {
  const id = nodeForm.id.value
  const nodeIds = [id]

  const init = {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(nodeIds),
  }
  const result = await fetch('/api/nodes', init)

  handleFirstFeedback()

  if (result.ok) {
    const [node] = await result.json()

    tellNode(node, 'delete')
    removeNodeTypeOption(node)
    getCurrentNodeId().then(getNode).then(actualizeNodeForm)
  } else {
    const problem = await result.json()

    tellProblem(problem.complaint)
  }
}

async function saveNode() {
  const payload = Object.fromEntries(new FormData(nodeForm))
  const init = {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }
  const response = await fetch('/api/nodes', init)

  if (response.ok) {
    const node = await response.json()

    location.hash = node.id
    actualizeNodeForm(node)

    handleFirstFeedback()

    tellNode(node)
  } else {
    const problem = await response.json()

    tellProblem(problem.complaint)
  }
}

function tellNode(node, action = 'save') {
  const { li, btn, a, span } = useFeedbackTemplate()
  const children = [...li.childNodes]

  btn.textContent = node.id
  a.textContent = node.name
  a.href += node.id

  if (action === 'delete') {
    span.textContent = 'deleted'
  }

  li.replaceChildren(...firstFeedback.childNodes)
  restOfLines.prepend(li)
  firstFeedback.replaceChildren(...children)
}

function removeNodeTypeOption(node) {
  const option = nodeSelect.querySelector(`option[value="${node.id}"]`)

  option?.remove()
}

function handleFirstFeedback() {
  if (details.hidden) {
    details.hidden = false
    singleFeedback.hidden = true
    firstFeedback.replaceChildren(...singleFeedback.childNodes)
    restOfLines.innerHTML = ''
  }
}

function tellProblem(complaint) {
  const { li } = useFeedbackTemplate()

  li.replaceChildren(...firstFeedback.childNodes)
  restOfLines.prepend(li)
  firstFeedback.textContent = complaint
}

function useFeedbackTemplate() {
  const { content } = feedbackTemplate
  const li = content.firstElementChild.cloneNode(true)
  const [btn, a, span] = li.children

  return { li, btn, a, span }
}
