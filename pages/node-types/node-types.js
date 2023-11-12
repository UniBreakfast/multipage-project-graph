const nodeTypesForm = document.getElementById('node-types-form')
const nodeTypesSelect = nodeTypesForm['node-types']
const nodeTypeOptionTemplate = nodeTypesSelect.querySelector('template')
const details = document.getElementById('node-types-details')
const singleFeedback = details.previousElementSibling
const firstFeedback = details.querySelector('b')
const restOfLines = details.querySelector('ul')
const feedbackTemplate = details.querySelector('template')

getNodeTypes().then(fillNodeTypesSelect)

nodeTypesForm.onsubmit = handleNodeTypesFormSubmit

nodeTypesSelect.ondblclick = handleNodeTypesSelectDblClick

function handleNodeTypesSelectDblClick(e) {
  const { target } = e
  const { value } = target

  if (!value) return

  goTo('node-type', value)
}

function handleNodeTypesFormSubmit(e) {
  const button = e.submitter
  const action = button.value
  const { selectedOptions } = nodeTypesSelect
  const nodeTypeIds = Array.from(selectedOptions).map(option => option.value)

  if (action === 'delete') {
    deleteNodeTypes(nodeTypeIds)
  } else if (action === 'details') {
    goTo('node-type', nodeTypeIds[0])
  }
}

async function deleteNodeTypes(nodeTypeIds) {
  const init = {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(nodeTypeIds),
  }
  const result = await fetch('/api/node-types', init)

  handleFirstFeedback()

  if (result.ok) {
    const {nodes, types: nodeTypes} = await result.json()

    nodeTypes.reverse()
    nodes.reverse()

    nodeTypes.forEach(nodeType => {
      tellNodeType(nodeType)
      removeNodeTypeOption(nodeType)
    })

    nodes.forEach(node => tellNode(node))
  } else {
    const problem = await result.json()

    tellProblem(problem.complaint)
  }
}

function handleFirstFeedback() {
  if (details.hidden) {
    details.hidden = false
    singleFeedback.hidden = true
    firstFeedback.replaceChildren(...singleFeedback.childNodes)
    restOfLines.innerHTML = ''
  }
}

function tellNodeType(nodeType) {
  const { li, btn, a, span } = useFeedbackTemplate()
  const children = [...li.childNodes]

  btn.textContent = nodeType.id
  a.textContent = nodeType.type
  span.textContent = 'type deleted'

  li.replaceChildren(...firstFeedback.childNodes)
  restOfLines.prepend(li)
  firstFeedback.replaceChildren(...children)
}

function tellNode(node) {
  const { li, btn, a } = useFeedbackTemplate()
  const children = [...li.childNodes]

  btn.textContent = node.id
  a.textContent = node.name

  li.replaceChildren(...firstFeedback.childNodes)
  restOfLines.prepend(li)
  firstFeedback.replaceChildren(...children)
}

function removeNodeTypeOption(nodeType) {
  const option = nodeTypesSelect.querySelector(`option[value="${nodeType.id}"]`)

  option.remove()
}

function tellProblem(problem) {
  const { li } = useFeedbackTemplate()

  li.replaceChildren(...firstFeedback.childNodes)
  restOfLines.prepend(li)
  firstFeedback.textContent = problem.complaint
}

function useFeedbackTemplate() {
  const { content } = feedbackTemplate
  const li = content.firstElementChild.cloneNode(true)
  const [btn, a, span] = li.children

  return { li, btn, a, span }
}

async function getNodeTypes() {
  const result = await fetch('/api/node-types')

  if (result.ok) {
    return await result.json()
  } else {
    const problem = await result.json()

    tellProblem(problem.complaint)
  }
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
