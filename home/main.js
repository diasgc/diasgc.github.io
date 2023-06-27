var level = 3;
const container = document.getElementById('container');

fetch("data.json")
  .then(response => response.json())
  .then(json => populate(json));


function addArray(array){
  array.forEach((entry) => {
    if (entry === 'break'){
      let h = document.createElement('div');
      container.appendChild(h)
    } else {
      addEntry(entry);
    }
  });
  //level--;
}

function addHeader(header,level){
  let h = document.createElement('div');
  h.innerHTML="<h"+level+">"+header+"</h"+level+">";
  container.appendChild(h);
  //level++;
}

function addEntry(entry){
  let h = document.createElement('div');
  h.className='icon-wrap';
  if (entry['background'])
    h.style="background: "+entry['background'];
  h.innerHTML="<a href=\""+entry['url']+"\"><img src=\""+entry['icon']+"\" /></a><p>"+entry['name']+"</p>";
  container.appendChild(h);
}

function populate(data){
  Object.entries(data).forEach(([key, value]) => {
    let t = Object.prototype.toString.call(value);
    if (t === '[object Array]'){
        addHeader(key, level);
        addArray(value);
    } else if (t === '[object Object]'){
        addEntry(value);
    }
});
}

