const beep = document.getElementById('beep');
const content = document.getElementById('qr-reader-results');
var lastResult, countResults = 0;
const gs = String.fromCharCode(29);

const testStr = "010560031211263417250731102423821100923530526127145665971";

function parseInf(str){
var a, tag, arr = str.split(gs), out={};
  while (arr.length > 0){
      a = arr.pop();
      if (a.length < 2)
          continue;
      tag = a.slice(0,2);
      if (tag === "01"){
        out.pc = a.slice(2,16);
        // 05600312112634
        if (a.length > 16)
          arr.push(a.substring(16));
        continue;
      } else if (tag === "17") {
        out.val = `20${a.substring(2,4)}/${a.substring(4,6)}/${a.substring(6,8)}`;
        if (a.length > 6)
          arr.push(a.substring(8));
        continue;
      } else if (tag === "10") {
        out.lot = a.substring(2);
        continue;
      } else if (tag === "21") {
        out.sn = a.substring(2);
      } else if (tag === "71") {
        out.cod = a.substring(3);
        out.rcm = `https://extranet.infarmed.pt/INFOMED-fo/download-ficheiro.xhtml?med_id=${out.cod}&tipo_doc=rcm`;
        out.fi = `https://extranet.infarmed.pt/INFOMED-fo/download-ficheiro.xhtml?med_id=${out.cod}&tipo_doc=fi`;
      } else {
        out.str = a;
      }
  }
  return out;
}

function reload(){
  fetch(window.location.href, { cache: 'reload' })
    .then(() => location.reload());
}

function tryINF(str){ 
  var a, tag, arr = str.split(gs), out="";
  while (arr.length > 0){
      a = arr.pop();
      if (a.length < 2)
          continue;
      tag = a.slice(0,2);
      if (tag === "01"){
        // 05600312112634
        out +="PC : " + a.slice(2,16) + "\n";
        if (a.length > 16)
          arr.push(a.substring(16));
        continue;
      } else if (tag === "17") {
        out +="VAL: 20" + a.substring(2,4)+"/"+a.substring(4,6) + "/" + a.substring(6,8) + "\n";
        if (a.length > 6)
          arr.push(a.substring(8));
        continue;
      } else if (tag === "10") {
        out +="LOT: " + a.substring(2) + "\n";
        continue;
      } else if (tag === "21") {
        out += "SN : " + a.substring(2) + "\n";
      } else if (tag === "71") {
        out += "COD: " + a.substring(3) + "\n";
        out += "<a href="
      } else {
        out += "UNKNOWN " + a + "\n";
      }
  }
  return out;
}

function onScanSuccess(decodedText, decodedResult) {
    if (decodedText !== lastResult) {
      beep.play();
      let out = parseInf(decodedText);
      content.innerHTML = `<p class='fi'>Len: ${decodedText.length}</p>`;
      if (out.cod){
        content.innerHTML += `<p class='fi'>COD: ${out.cod}</p><p class='fi'>LOT: ${out.lot}</p><p class='fi'>VAL: ${out.val}</p><p class='fi'>PC: ${out.pc}</p><p class='fi'>SN: ${out.sn}</p>`;
        content.innerHTML += `<a class='fi' href="${out.rcm}">rcm</a><a class='fi' href="${out.fi}">fi</a>`;
      }
      if (out.str){
        content.innerHTML += `<p class='fi'>STR: ${out.str}</p>`;
      }
      lastResult = decodedText;
      console.log(`Scan result ${decodedText}`, decodedResult);
    }
}

let html5QrcodeScanner = new Html5QrcodeScanner(
    "qr-reader", { fps: 10, qrbox: {width: 250, height: 250} }, false);
html5QrcodeScanner.render(onScanSuccess);

onScanSuccess(testStr,"");