function createNode(element) {
    return document.createElement(element);
}

function append(parent, el) {
  return parent.appendChild(el);
}

const ul = document.getElementById('products');
const url = '/api/product';

fetch(url)
.then((resp) => resp.json())
.then(function(data) {
  let products = data.results;
  return products.map(function(product) {
    let li = createNode('li');
    let img = createNode('img');
    let span = createNode('span');
    img.src = product.img;
    append(li, img);
    append(li, span);
    append(ul, li);
  })
})
.catch(function(error) {
  console.log(error);
});
