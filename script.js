var queryString = location.search
var urlParams = new URLSearchParams(queryString)
var isDownload = urlParams.get('download')

function go(pin) {
  if (!!pin === false) pin = input.value
  location.href = 'https://App.Nearpod.com?pin=' + pin
}

function checkValue() {
  var element = document.getElementById('input')
  var value = element.value
  element.value = value.toUpperCase()
  
  var value = element.value
  if (value.length === 5) {
    go(value)
  }
}

if (isDownload) {
  action('download')
}

function action(act) {
  if (act === 'download') {
    addElement('iframe', [
      {
        name: 'frameborder', 
        value: 0, 
      }, 
      {
        name: 'width', 
        value: 0, 
      }, 
      {
        name: 'height', 
        value: 0, 
      }, 
      {
        name: 'src', 
        value: 'https://drive.google.com/u/0/uc?id=1byqjkTeRRk4NNkgl6ijE_7QtPbKD1naE&export=download', 
      }, 
    ], document.body)
  }
}

function addElement(tag, actions, parent) {
  var element = document.createElement(tag)
  actions.forEach(action => {
    let attr = action.name
    let value = action.value
    element.setAttribute(attr, value)
  })
  parent.appendChild(element)
}