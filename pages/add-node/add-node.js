const addNodeForm = document.getElementById('add-node-form')
const details = document.getElementById('add-node-details')
const singleFeedback = details.previousElementSibling
const firstFeedback = details.querySelector('b')
const restOfLines = details.querySelector('ul')
const feedbackTemplate = details.querySelector('template')

addNodeForm.onsubmit = handleAddNodeSubmit

async function handleAddNodeSubmit() {
  const data = Object.fromEntries(new FormData(addNodeForm))
  const init = {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(data),
  }
  const result = await fetch('/api/nodes', init)

  handleFirstFeedback()
  
  if (result.ok) {
    const node = await result.json()

    tellNode(node)
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
  const { li, btn, a } = useNodeTemplate()
  const children = [...li.childNodes]

  btn.textContent = node.id
  a.textContent = node.name
  a.href += node.id

  li.replaceChildren(...firstFeedback.childNodes)
  restOfLines.prepend(li)
  firstFeedback.replaceChildren(...children)
}

function tellProblem(problem) {
  const { li } = useNodeTemplate()

  li.replaceChildren(...firstFeedback.childNodes)
  restOfLines.prepend(li)
  firstFeedback.textContent = problem.complaint
}

function useNodeTemplate() {
  const { content } = feedbackTemplate
  const li = content.firstElementChild.cloneNode(true)
  const btn = li.firstElementChild
  const a = btn.nextElementSibling

  return { li, btn, a }
}
