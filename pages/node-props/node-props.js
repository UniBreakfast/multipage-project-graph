const nodePropsForm = document.getElementById('node-props-form')
const nodePropsSelect = nodePropsForm['node-props']
const nodePropOptionTemplate = nodePropsSelect.querySelector('template')
const details = document.getElementById('node-props-details')
const singleFeedback = details.previousElementSibling
const firstFeedback = details.querySelector('b')
const restOfLines = details.querySelector('ul')
const feedbackTemplate = details.querySelector('template')

getNodeProps().then(fillNodePropsSelect)

nodePropsForm.onsubmit = handleNodePropsFormSubmit

function handleNodePropsFormSubmit(e) {
  const button = e.submitter
  const action = button.value
  const { selectedOptions } = nodePropsSelect
  const nodePropIds = Array.from(selectedOptions).map(option => option.value)

  if (action === 'delete') {
    deletePropTypes(nodePropIds)
  }
}

async function deletePropTypes(nodePropIds) {
  const init = {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(nodePropIds),
  }
  const result = await fetch('/api/node-props', init)

  handleFirstFeedback()

  if (result.ok) {
    const {props, nodes, types: nodeTypes} = await result.json()

    nodeTypes.reverse()
    nodes.reverse()

    nodeTypes.forEach(nodeType => {
      tellNodeType(nodeType)
      removeNodePropOption(nodeType)
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

function removeNodePropOption(nodeType) {
  const option = nodePropsSelect.querySelector(`option[value="${nodeType.id}"]`)

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

async function getNodeProps() {
  const result = await fetch('/api/node-props')

  if (result.ok) {
    return await result.json()
  } else {
    const problem = await result.json()

    tellProblem(problem.complaint)
  }
}

function fillNodePropsSelect(nodeProps) {
  nodeProps.forEach(nodeProp => {
    const { option } = useNodePropOptionTemplate()
    const { id, prop, key } = nodeProp

    option.value = id
    option.textContent = `${prop} (${key})`

    nodePropsSelect.append(option)
  })
}

function useNodePropOptionTemplate() {
  const { content } = nodePropOptionTemplate
  const option = content.firstElementChild.cloneNode(true)

  return { option }
}
