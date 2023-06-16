

function addHeader(parent, head){
    let k=document.createElement('p');
    k.className="cardHead";
    k.innerHTML=head;
    parent.appendChild(k);
}

function addCard(parent, key, val){
    let item=document.createElement('div');
    item.className="card";
    let k=document.createElement('p');
    k.className="cardKey";
    k.innerHTML=key;
    let v=document.createElement('p');
    v.className="cardValue";
    v.innerHTML=val;
    item.appendChild(v);
    item.appendChild(k);
    parent.appendChild(item);
}

function populate(parent, obj){
    Object.entries(obj).forEach(([key, value]) => {
        if (value instanceof Object){
            addHeader(parent, key);
            populate(parent, value);
        } else {
            addCard(parent,key,value);
        }
    });
}

document.getElementById('picker').addEventListener('change', async e => {
    let file = e.target.files[0];
    let res = document.getElementById('result');
    EXIF.getData(file, function () {
        let meta = EXIF.getAllTags(this);
        // keep it simple, stupid!
        let m1 = JSON.stringify(meta);
        let m2 = JSON.parse(m1);
        res.innerHTML=m1;
        addHeader(res,"Main")
        populate(res, m2);
      });
})