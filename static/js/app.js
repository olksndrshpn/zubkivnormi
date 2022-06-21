const formId = 'telegramForm'
const form = document.getElementById(formId)
function toJSONString(form) {
  var obj = {}
  var elements = form.querySelectorAll('input, textarea')
  for (var i = 0; i < elements.length; ++i) {
    var element = elements[i]
    var name = element.name
    var value = element.value
    if (name) {
      obj[ name ] = value
    }
  }
  return JSON.stringify(obj)
}
if (form) {
  form.addEventListener('submit', event => {
    event.preventDefault()
    const json = toJSONString(form)
    const formReq = new XMLHttpRequest()
    formReq.open('POST', '/api/order', true)
    formReq.onload = function(oEvent) {
        if (formReq.status === 200) {
          swal({
            title: 'Дані отримано! Очікуйте дзвінка!',
            icon: 'success',
            timer: 10000
          })
          document.querySelector('.backdrop').style.display = 'none'
          document.querySelector('.modal').style.opacity = '0'
          document.querySelector('.hero-btn').style.opacity = "0"
          document.querySelector('.hero-title').style.opacity = "0"
          document.querySelector('.hero').style.opacity= "0"
          document.querySelector('.hero-new').style.opacity= "10"




        }
        if (formReq.status !== 200) {
          swal({
            title: 'Помилочка!',
            icon: 'error',
            timer: 10000
          })
          document.querySelector('.sa-error').style.display = 'block'
          document.querySelector('.modal').style.opacity = '0'
        }
      }
            formReq.setRequestHeader('Content-Type', 'application/json')
            formReq.send(json)
          })
        }