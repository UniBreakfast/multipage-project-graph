const addNodeTypeForm = document.getElementById('add-node-type-form')
const nodePropSelect = addNodeTypeForm.props
const nodePropOptionTemplate = nodePropSelect.querySelector('template')
const details = document.getElementById('add-node-type-details')
const singleFeedback = details.previousElementSibling
const firstFeedback = details.querySelector('b')
const restOfLines = details.querySelector('ul')
const feedbackTemplate = details.querySelector('template')

getNodeProps().then(fillNodePropsSelect)

addNodeTypeForm.onsubmit = handleAddNodeTypeSubmit

function getNodeProps() {
  return fetch('/api/node-props')
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

function useNodePropOptionTemplate() {
  const { content } = nodePropOptionTemplate
  const option = content.firstElementChild.cloneNode(true)

  return { option }
}

async function handleAddNodeTypeSubmit() {
  const payload = Object.fromEntries(new FormData(addNodeTypeForm))
  // add multiple selected props to payload
  payload.props = Array.from(addNodeTypeForm.props.selectedOptions).map(option => option.value)
  const init = {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(payload),
  }
  const result = await fetch('/api/node-types', init)

  handleFirstFeedback()

  if (result.ok) {
    const nodeType = await result.json()

    tellNodeType(nodeType)
    addNodeTypeForm.reset()
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
  const { li, btn, a } = useFeedbackTemplate()
  const children = [...li.childNodes]

  btn.textContent = nodeType.id
  a.textContent = nodeType.type
  a.href += nodeType.id

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
  const li = feedbackTemplate.content.cloneNode(true).querySelector('li')
  const btn = li.querySelector('button')
  const a = li.querySelector('a')

  return { li, btn, a }
}
