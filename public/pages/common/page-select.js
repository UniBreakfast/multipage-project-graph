body.hidden = true

getPageSelectHTML()
  .then(replacePageSelectPlaceholder)
  .then(selectCurrentPageOption)
  .then(listenForPageSelectChange)

function getPageSelectHTML() {
  const selectRegExp = /<select[\s\S]+select>/
  const path = '/pages/common/page-select.html'

  if (location.pathname == path) {
    return Promise.resolve()
  }

  return fetch(path)
    .then(response => response.text())
    .then(html => html.match(selectRegExp)[0])
}

function replacePageSelectPlaceholder(pageSelectHTML) {
  const pageSelect = document.getElementById('page-select')

  if (pageSelectHTML) {
    pageSelect.outerHTML = pageSelectHTML
  }
}

function selectCurrentPageOption() {
  const pageSelect = document.getElementById('page-select')
  const currentPage = location.pathname.split('/')[2]

  pageSelect.value = currentPage || ''
  body.hidden = false
}

function listenForPageSelectChange() {
  const pageSelect = document.getElementById('page-select')

  pageSelect.onchange = handlePageSelectChange
}

function handlePageSelectChange(e) {
  const page = e.target.value
  const path = page ? '/pages/' + page : '/'

  location.assign(path)
}
