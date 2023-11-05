const addNodeForm = document.getElementById('add-node-form')
const nodeTypesSelect = addNodeForm.type
const nodeTypeOptionTemplate = nodeTypesSelect.querySelector('template')
const details = document.getElementById('add-node-details')
const singleFeedback = details.previousElementSibling
const firstFeedback = details.querySelector('b')
const restOfLines = details.querySelector('ul')
const feedbackTemplate = details.querySelector('template')

getNodeTypes().then(fillNodeTypesSelect)

addNodeForm.onsubmit = handleAddNodeSubmit

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

async function handleAddNodeSubmit() {
  const payload = Object.fromEntries(new FormData(addNodeForm))
  const init = {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload),
  }
  const result = await fetch('/api/nodes', init)

  handleFirstFeedback()
  
  if (result.ok) {
    const node = await result.json()

    tellNode(node)
    nodeTypesSelect.querySelector(`[value="${node.typeId}"]`).toggleAttribute('selected')
    addNodeForm.reset()
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

function tellNode(node) {
  const { li, btn, a } = useFeedbackTemplate()
  const children = [...li.childNodes]

  btn.textContent = node.id
  a.textContent = node.name
  a.href += node.id

  li.replaceChildren(...firstFeedback.childNodes)
  restOfLines.prepend(li)
  firstFeedback.replaceChildren(...children)
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
  const btn = li.firstElementChild
  const a = btn.nextElementSibling

  return { li, btn, a }
}
