const nodeTypeForm = document.getElementById('node-type-form')
const nodeTypeSelect = nodeTypeForm.id
const nodeTypeOptionTemplate = nodeTypeSelect.querySelector('template')
const nodePropSelect = nodeTypeForm.props
const nodePropOptionTemplate = nodePropSelect.querySelector('template')
const details = document.getElementById('node-type-details')
const singleFeedback = details.previousElementSibling
const firstFeedback = details.querySelector('b')
const restOfLines = details.querySelector('ul')
const feedbackTemplate = details.querySelector('template')

Promise.all([
  getNodeProps(),
  getNodeTypes(),
]).then(([nodeProps, nodeTypes]) => {
  fillNodePropsSelect(nodeProps)
  fillNodeTypeSelect(nodeTypes)
})
  .then(getCurrentNodeTypeId)
  .then(getNodeType)
  .then(actualizeNodeTypeForm)

window.onhashchange = handleHashChange

nodeTypeSelect.onchange = handleSelectNodeType

nodeTypeForm.onsubmit = handleNodeTypeFormSubmit

function handleHashChange() {
  getCurrentNodeTypeId().then(getNodeType).then(actualizeNodeTypeForm)
}

function handleSelectNodeType() {
  const id = nodeTypeSelect.value

  nodeTypeSelect.setAttribute('value', id)
  location.hash = id
  getNodeType(id).then(actualizeNodeTypeForm)
}

function getNodeProps() {
  return fetch('/api/node-props')
    .then(result => result.json())
}

function getNodeTypes() {
  return fetch('/api/node-types')
    .then(result => result.json())
}

function fillNodePropsSelect(nodeProps) {
  nodeProps.forEach(nodeProp => {
    const { option } = useNodePropOptionTemplate()
    const { id, prop, key } = nodeProp

    option.value = id
    option.textContent = `${prop} (${key})`

    nodePropSelect.append(option)
  })
}

function fillNodeTypeSelect(nodeTypes) {
  nodeTypes.forEach(nodeType => {
    const { option } = useNodeTypeOptionTemplate()
    const { id, type } = nodeType

    option.value = id
    option.textContent = `${id} \u00A0 ${type}`

    nodeTypeSelect.append(option)
  })
}

function useNodePropOptionTemplate() {
  const { content } = nodePropOptionTemplate
  const option = content.firstElementChild.cloneNode(true)

  return { option }
}

function useNodeTypeOptionTemplate() {
  const { content } = nodeTypeOptionTemplate
  const option = content.firstElementChild.cloneNode(true)

  return { option }
}

async function getCurrentNodeTypeId() { // from hash
  if (!nodeTypeSelect.options.length) {
    goTo('add-node-type')
  }
  
  let id = location.hash.slice(1)

  if (!id || !nodeTypeSelect.querySelector(`option[value="${id}"]`)) {
    id = nodeTypeSelect.value
    location.hash = id
  }

  return id
}

function getNodeType(id) {
  return fetch(`/api/node-types/${id}`)
    .then(result => result.json())
}

function actualizeNodeTypeForm(nodeType) {
  const { id, type, props } = nodeType
  const nodeTypeOption = nodeTypeSelect.querySelector(`option[value="${id}"]`)

  nodeTypeSelect.querySelector('[selected]')?.toggleAttribute('selected')
  nodeTypeSelect.value = id
  nodeTypeOption.toggleAttribute('selected')
  nodeTypeOption.textContent = `${id} \u00A0 ${type}`
  nodeTypeForm.type.setAttribute('value', type)
  nodeTypeForm.type.value = type

  for (const option of nodePropSelect.options) {
    const selected = !!props?.includes(option.value)
    option.toggleAttribute('selected', selected)
    option.selected = selected
  }
}

function handleNodeTypeFormSubmit(e) {
  const button = e.submitter
  const action = button.value

  if (action === 'delete') {
    deleteNodeType()
  } else if (action === 'save') {
    saveNodeType()
  } else if (action == 'revert') {
    nodeTypeForm.reset()
  }
}

async function deleteNodeType() {
  const id = nodeTypeSelect.value
  const nodeTypeIds = [id]

  const init = {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(nodeTypeIds),
  }
  const result = await fetch('/api/node-types', init)

  handleFirstFeedback()

  if (result.ok) {
    const {nodes, types: [nodeType]} = await result.json()

    tellNodeType(nodeType, 'delete')
    nodes.reverse()
    nodes.forEach(node => tellNode(node, 'delete'))
    removeNodeTypeOption(nodeType)
    getCurrentNodeTypeId().then(getNodeType).then(actualizeNodeTypeForm)
  } else {
    const problem = await result.json()

    tellProblem(problem.complaint)
  }
}

async function saveNodeType() {
  const payload = Object.fromEntries(new FormData(nodeTypeForm))
  payload.props = Array.from(nodePropSelect.selectedOptions).map(option => option.value)
  const init = {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }
  const response = await fetch('/api/node-types', init)

  if (response.ok) {
    const nodeType = await response.json()

    location.hash = nodeType.id
    actualizeNodeTypeForm(nodeType)

    handleFirstFeedback()

    tellNodeType(nodeType)
  } else {
    const problem = await response.json()

    tellProblem(problem.complaint)
  }
}

function tellNodeType(nodeType, action = 'save') {
  const { li, btn, a, span } = useFeedbackTemplate()
  const children = [...li.childNodes]

  btn.textContent = nodeType.id
  a.textContent = nodeType.type
  a.href += nodeType.id

  if (action === 'delete') {
    span.textContent = 'type deleted'
  } else if (action === 'save') {
    span.textContent = 'type saved'
  }

  li.replaceChildren(...firstFeedback.childNodes)
  restOfLines.prepend(li)
  firstFeedback.replaceChildren(...children)
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

function removeNodeTypeOption(nodeType) {
  const option = nodeTypeSelect.querySelector(`option[value="${nodeType.id}"]`)

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
