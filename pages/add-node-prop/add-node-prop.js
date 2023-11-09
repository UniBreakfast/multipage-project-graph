const addNodePropForm = document.getElementById('add-node-prop-form')
const propValuesSelect = addNodePropForm.values
const colorPicker = addNodePropForm.querySelector('[type="color"]')
const colorInput = colorPicker.previousElementSibling
const details = document.getElementById('add-node-prop-details')
const singleFeedback = details.previousElementSibling
const firstFeedback = details.querySelector('b')
const restOfLines = details.querySelector('ul')
const feedbackTemplate = details.querySelector('template')

propValuesSelect.onchange = handlePropValuesChange

addNodePropForm.onchange = handlePropBoxChange

colorPicker.onchange = handleColorChange
colorPicker.oninput = handleColorChange
colorInput.onchange = handleColorChange
colorInput.oninput = handleColorChange

addNodePropForm.onsubmit = handleAddNodePropSubmit

function handleColorChange(e) {
  if (e.target === colorPicker) {
    colorInput.value = colorPicker.value
  } else if (e.target === colorInput) {
    if (/^#[0-9a-f]{6}$/i.test(colorInput.value)) {
      colorPicker.value = colorInput.value
    }
  }
}

function handlePropValuesChange() {
  const prevSelectedOption = propValuesSelect.querySelector('option[selected]')
  const nextSelectedOption = propValuesSelect.querySelector('option:checked')
  const prevFieldBlock = addNodePropForm.querySelector('div[name]:not([hidden])')
  const nextFieldBlock = addNodePropForm.querySelector(`div[name="${propValuesSelect.value}"]`)

  prevSelectedOption?.removeAttribute('selected')
  nextSelectedOption?.setAttribute('selected', '')
  prevFieldBlock?.toggleAttribute('hidden')
  nextFieldBlock?.toggleAttribute('hidden')
}

function handlePropBoxChange(e) {
  const box = e.target.closest('[type="checkbox"]')

  if (!box) return

  const dependentInputs = box.parentElement.querySelectorAll(':not(:first-child):not(br)')

  dependentInputs.forEach(input => input.disabled = !box.checked)
}

function getFormData() {
  const f = addNodePropForm
  const data = {}

  if (f.prop.value) data.prop = f.prop.value
  if (f.key.value) data.key = f.key.value

  data.type = f.values.value

  switch (data.type) {
    case 'boolean': {
      const defaultSelect = f.querySelector('[name="boolean"] [name="default"]')
      data.default = defaultSelect.value
      return data
    }
    case 'enum': {
      if (f.multiple.checked) {
        data.multiple = true
        data.rows = +f.multiple.nextElementSibling.nextElementSibling.value
      }
      const reqBox = f.querySelector('[name="enum"] [name="required"]')
      if (reqBox.checked) data.required = true
      data.options = f.options.value.split('\n').map(s => s.trim()).filter(Boolean)
      if (f.custom.checked) data.custom = true
      return data
    }
    case 'string': {
      if (f.multiline.checked) {
        data.multiline = true
        data.rows = +f.multiline.nextElementSibling.nextElementSibling.value
      }
      const reqBox = f.querySelector('[name="string"] [name="required"]')
      if (reqBox.checked) data.required = true
      if (f.minlength.checked) {
        const input = f.minlength.nextElementSibling
        if (input.value) data.minlength = +input.value
      }
      if (f.maxlength.checked) {
        const input = f.maxlength.nextElementSibling
        if (input.value) data.maxlength = +input.value
      }
      const placeholderBox = f.querySelector('[name="string"] [name="placeholder-box"]')
      if (placeholderBox.checked) {
        const input = placeholderBox.nextElementSibling
        if (input.value) data.placeholder = input.value 
      }
      const defaultBox = f.querySelector('[name="string"] [name="default-box"]')
      if (defaultBox.checked) {
        const input = defaultBox.nextElementSibling
        if (input.value) data.default = input.value 
      }
      return data
    }
    case 'number': {
      const reqBox = f.querySelector('[name="number"] [name="required"]')
      if (reqBox.checked) data.required = true
      const minBox = f.querySelector('[name="number"] [name="min-box"]')
      if (minBox.checked) {
        const input = minBox.nextElementSibling
        if (input.value) data.min = +input.value
      }
      const maxBox = f.querySelector('[name="number"] [name="max-box"]')
      if (maxBox.checked) {
        const input = maxBox.nextElementSibling
        if (input.value) data.max = +input.value
      }
      const placeholderBox = f.querySelector('[name="number"] [name="placeholder-box"]')
      if (placeholderBox.checked) {
        const input = placeholderBox.nextElementSibling
        if (input.value) data.placeholder = input.value 
      }
      const defaultBox = f.querySelector('[name="number"] [name="default-box"]')
      if (defaultBox.checked) {
        const input = defaultBox.nextElementSibling
        if (input.value) data.default = +input.value 
      }
      return data
    }
    case 'datetime': {
      const formatSelect = f.querySelector('[name="datetime"] [name="format"]')
      data.format = formatSelect.value
      const reqBox = f.querySelector('[name="datetime"] [name="required"]')
      if (reqBox.checked) data.required = true
      const minBox = f.querySelector('[name="datetime"] [name="min-box"]')
      if (minBox.checked) {
        const input = minBox.nextElementSibling
        if (input.value) data.min = input.value
      }
      const maxBox = f.querySelector('[name="datetime"] [name="max-box"]')
      if (maxBox.checked) {
        const input = maxBox.nextElementSibling
        if (input.value) data.max = input.value
      }
      const defaultBox = f.querySelector('[name="datetime"] [name="default-box"]')
      if (defaultBox.checked) data.nowByDefault = true
      return data
    }
    case 'color': {
      const formatSelect = f.querySelector('[name="color"] [name="format"]')
      data.format = formatSelect.value
      const reqBox = f.querySelector('[name="color"] [name="required"]')
      if (reqBox.checked) data.required = true
      const defaultBox = f.querySelector('[name="color"] [name="default-box"]')
      if (defaultBox.checked) {
        const input = defaultBox.nextElementSibling.nextElementSibling
        if (input.value) data.default = input.value 
      }
      return data
    }
    default: {
      return data
    }
  }
}

async function handleAddNodePropSubmit() {
  const payload = getFormData()
  
  const init = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }
  const result = await fetch('/api/node-props', init)

  handleFirstFeedback()

  if (result.ok) {
    const nodeProp = await result.json()

    tellNodeProp(nodeProp)
    addNodePropForm.reset()
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

function tellNodeProp(nodeType) {
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
