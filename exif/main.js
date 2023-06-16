

function addHeader(parent, head){
    let k=document.createElement('p');
    k.className="cardHead";
    k.innerHTML=head;
    parent.appendChild(k);
}

function addCard(parent, key, val){
    let item=document.createElement('div');
    item.className="card";
    let k=document.createElement('div');
    k.className="cardKey";
    k.innerHTML=key;
    let v=document.createElement('div');
    v.className="cardValue";
    v.innerHTML=val;
    item.appendChild(v);
    item.appendChild(k);
    parent.appendChild(item);
}

function addCardArray(parent, key, val){
    let item=document.createElement('div');
    item.className="card";
    let k=document.createElement('div');
    k.className="cardKey";
    k.innerHTML=key;
    let v=document.createElement('div');
    v.className="cardHexArray";
    var hex = val.map( (x) => {
        return key.match("GPS*") ? x.toString().padStart(3,' ') : x.toString(16).padStart(2,'0');
    }).join(' ');
    v.innerHTML = hex;
    item.appendChild(v);
    item.appendChild(k);
    parent.appendChild(item);
}

function populate(parent, obj){
    Object.entries(obj).forEach(([key, value]) => {
        let t = Object.prototype.toString.call(value);
        if (t === '[object Array]'){
            addCardArray(parent, key, value);
        } else if (t === '[object Object]'){
            addHeader(parent, key);
            populate(parent, value);
        } else {
            addCard(parent,key,value);
        }
    });
}

function parseImage(res, file){
    EXIF.getData(file, function () {
        let meta = EXIF.getAllTags(this);
        // keep it simple, stupid!
        let m1 = JSON.stringify(meta);
        let m2 = JSON.parse(m1);
        //res.innerHTML=m1;
        addHeader(res,"Main")
        populate(res, m2);
      });
}

document.getElementById('picker').addEventListener('change', async e => {
    let file = e.target.files[0];
    let res = document.getElementById('result');
    if (file.type.match("^image/"))
        parseImage(res, file);
})