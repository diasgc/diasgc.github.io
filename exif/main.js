const res=document.getElementById('result');

function addCard(parent, key,val){
    let item=document.createElement('div');
    item.className="card";
    let k=document.createElement('p');
    k.className="cardKey";
    k.innerHTML=value;
    let v=document.createElement('p');
    v.className="cardValue";
    item.appendChild(v);
    item.appendChild(k);
    parent.appendChild(item);
}

function populate(parent, obj){
    for (const [key, value] of Object.entries(obj)) {
        if (value instanceof Object)
            populate(parent, value);
        else
            addCard(parent,key,value);
    }
}

document.getElementById('picker').addEventListener('change', async e => {
    let file = e.target.files[0];
    EXIF.getData(file, function () {
        let meta = EXIF.getAllTags(this);
        populate(res,meta);
        //res.innerHTML=JSON.stringify(meta, null, "\t")
      });
})