const nodesForm = document.getElementById('nodes-form')
const nodesSelect = nodesForm.nodes
const nodeOptionTemplate = nodesSelect.querySelector('template')

getNodes().then(fillNodesSelect)

function getNodes() {
  return fetch('/api/nodes')
    .then(response => response.json())
}

function fillNodesSelect(nodes) {
  nodesSelect.replaceChildren(...nodes.map(makeNodeOption))
}

function makeNodeOption(node) {
  const {option} = useNodeOptionTemplate()

  option.value = node.id
  option.textContent = node.name

  return option
}

function useNodeOptionTemplate() {
  const {content} = nodeOptionTemplate
  const option = content.firstElementChild.cloneNode(true)

  return {option}
}
