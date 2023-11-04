const nodesForm = document.getElementById('nodes-form')
const nodesSelect = nodesForm.nodes
const nodeOptionTemplate = nodesSelect.querySelector('template')
const details = document.getElementById('nodes-details')
const singleFeedback = details.previousElementSibling
const firstFeedback = details.querySelector('b')
const restOfLines = details.querySelector('ul')
const feedbackTemplate = details.querySelector('template')

getNodes().then(fillNodesSelect)

nodesForm.onsubmit = handleNodesFormSubmit

nodesSelect.ondblclick = handleNodesSelectDblClick

function handleNodesSelectDblClick(e) {
  const { target } = e
  const { value } = target

  if (!value) return

  goTo('node', value)
}

function handleNodesFormSubmit(e) {
  const button = e.submitter
  const action = button.value
  const { selectedOptions } = nodesSelect
  const nodeIds = Array.from(selectedOptions).map(option => option.value)

  if (action === 'delete') {
    deleteNodes(nodeIds)
  } else if (action === 'details') {
    goTo('node', nodeIds[0])
  }
}

async function deleteNodes(nodeIds) {
  const init = {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(nodeIds),
  }
  const result = await fetch('/api/nodes', init)

  handleFirstFeedback()

  if (result.ok) {
    const nodes = await result.json()

    nodes.reverse()

    nodes.forEach(node => {
      tellNode(node)
      removeNodeOption(node)
    })
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

  li.replaceChildren(...firstFeedback.childNodes)
  restOfLines.prepend(li)
  firstFeedback.replaceChildren(...children)
}

function removeNodeOption(node) {
  const option = nodesSelect.querySelector(`option[value="${node.id}"]`)

  option?.remove()
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

function getNodes() {
  return fetch('/api/nodes')
    .then(response => response.json())
}

function fillNodesSelect(nodes) {
  nodesSelect.replaceChildren(...nodes.map(makeNodeOption))
}

function makeNodeOption(node) {
  const { option } = useNodeOptionTemplate()

  option.value = node.id
  option.textContent = node.name

  return option
}

function useNodeOptionTemplate() {
  const { content } = nodeOptionTemplate
  const option = content.firstElementChild.cloneNode(true)

  return { option }
}
