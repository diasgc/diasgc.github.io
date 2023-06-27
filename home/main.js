var level = 2;
const container = document.getElementById('container');

fetch("data.json")
  .then(response => response.json())
  .then(json => populate(json));


function addArray(array){
  array.forEach((entry) => {
    if (entry === 'break'){
      container.appendChild("<div></div>")
    } else {
      addEntry(entry);
    }
  });
  level--;
}

function addHeader(header,level){
  let h = "<div><h"+level+">"+header+"</h"+level+"></div>"
  container.appendChild(h);
  level++;
}

function addEntry(entry){
  var style="";
  if (entry['background'])
    style="style=\"background: "+entry['background'] + "\"";
  let h="<div class=\"icon-wrap\""+style+"><a href=\""+entry['url']+"\"><img src=\""+entry['icon']+"\" /></a><p>"+entry['name']+"</p></div>"
  container.appendChild(h);
}

function populate(data){
  Object.entries(data).forEach(([key, value]) => {
    let t = Object.prototype.toString.call(value);
    if (t === '[object Array]'){
        addHeader(header, level);
        addArray(value);
    } else if (t === '[object Object]'){
        addEntry(value);
    }
});
}

