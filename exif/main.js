const res=document.getElementById('result');

function addCard(parent, key,val){
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
        if (value instanceof Object)
            populate(parent, value);
        else
            addCard(parent,key,value);
    });
}

document.getElementById('picker').addEventListener('change', async e => {
    let file = e.target.files[0];
    EXIF.getData(file, function () {
        let meta = EXIF.getAllTags(this);
        res.innerHTML=JSON.stringify(meta, null, "\t")
        populate(res,meta);
      });
})