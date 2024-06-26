function detectColorScheme(){
    var theme="light";    //default to light

    //local storage is used to override OS theme settings
    if(localStorage.getItem("theme")){
        if(localStorage.getItem("theme") == "dark"){
            var theme = "dark";
        }
    } else if(!window.matchMedia) {
        //matchMedia method not supported
        return false;
    } else if(window.matchMedia("(prefers-color-scheme: dark)").matches) {
        //OS theme setting detected as dark
        var theme = "dark";
    }

    //dark theme preferred, set document with a `data-theme` attribute
    if (theme=="dark") {
         document.documentElement.setAttribute("data-theme", "dark");
    }
}

detectColorScheme();

localStorage.clear();

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

function testArrayAscii(arr){
    var c;
    for (var i=0; i < arr.length; i++){
        c = arr[i];
        if (!Number.isInteger(c) && ( c < 32 || c > 126 ))
            return false;
    }
    return true;
}

const exifTags = {
    gpsUnits: ['º','\'','\"', ' ', ' '],
    MakerNote:    (val) => {return val.map((c) => {return String.fromCharCode(c)}).join('')},
    GPSLatitude:  (val) => {return val.forEach((value, index) => value + this.gpsUnits[index]).join('')},
    GPSLongitude: (val) => {return val.forEach((value, index) => value + this.gpsUnits[index]).join('')}
}

function addCardArray(parent, key, val){
    let isAscii = testArrayAscii(val);
    var sval = val.map( (x) => {
        if (key.match("GPS*"))
            return x.toString().padStart(3,' ');
        return isAscii ? String.fromCharCode(x) : x.toString(16).padStart(2,'0');
    }).join(isAscii ? '' : ' ');
    if (isAscii){
        try {
            let jval = JSON.parse(sval);
            if (typeof jval == "object"){
                addHeader(parent, key);
                populate(parent, jval);
                return;
            }
        } catch {}
    }
    let item=document.createElement('div');
    item.className="card";
    let k=document.createElement('div');
    k.className="cardKey";
    k.innerHTML=key;
    let v=document.createElement('div');
    v.className = "cardHexArray"
    v.innerHTML = sval;
    item.appendChild(v);
    item.appendChild(k);+
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
        addHeader(res,file.name)
        populate(res, m2);
      });
}

function parseCode(file, res){
    let reader = new FileReader();
    reader.onload = function(){
        let pre = document.createElement('pre');
        let code = document.createElement('code');
        //code.setAttribute('class','language-java');
        //code.innerHTML="<![CDATA["+reader.result+"]]>";
        code.innerHTML=reader.result;
        pre.appendChild(code);
        res.innerHTML="";
        res.appendChild(pre);
        hljs.highlightElement(code);
    }
    reader.readAsText(file);
}

function parseMediaInfo(res, file){
    
    const onChangeFile = (mediainfo) => {
        if (file) {
        
            const getSize = () => file.size
        
            const readChunk = (chunkSize, offset) =>
            new Promise((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = (event) => {
                if (event.target.error) {
                    reject(event.target.error)
                }
                resolve(new Uint8Array(event.target.result))
                }
                reader.readAsArrayBuffer(file.slice(offset, offset + chunkSize))
            })
        
            mediainfo.analyzeData(getSize, readChunk)
                .then((result) => {
                    //let m1 = JSON.stringify(result);
                    let m2 = JSON.parse(result);
                    //res.innerHTML=result;
                    addHeader(res,"MediaInfo")
                    let media = m2.media.track;
                    for(let i = 0; i < media.length; i++) {
                        let m1 = media[i];
                        addHeader(res, m1['@type'])
                        populate(res, m1);
                    }
                })
                .catch((error) => {
                    res.value = `An error occured:\n${error.stack}`
                })
        }
    }

    MediaInfo({ format: 'JSON' }, (mediainfo) => {
        onChangeFile(mediainfo)
      }, (err) => {
        console.error(err)
      }
    )
}

document.getElementById('picker').addEventListener('change', async e => {
    let file = e.target.files[0];
    console.log("mimetype: "+file.type);
    let res = document.getElementById('result');
    if (file.type.match("^image/")){
        parseImage(res, file);
        parseMediaInfo(res, file);
    } else if (file.type.match("^image/") || file.type.match("^audio/") || file.type.match("^video/")){
        parseMediaInfo(res, file);
    } else if (file.type.match("^text/") || file.type.match("script"))
        parseCode(file,res)
    else {
        res.innerHTML="Unknown type " + file.type;
    }
})