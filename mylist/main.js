const doc = document.implementation.createDocument(null, "NewDataSet", null);
const root = doc.documentElement;
root.innerHTML = document.getElementById('xs-dom').innerHTML;

function appendChild(doc, parent, name, content){
    let child = doc.createElement(name);
    child.innerHTML = content;
    parent.appendChild(child);
    return parent;
}

function entry(doc, root, estArtCod, estQtd, note){
    let node = doc.createElement("EncCCULista");
    appendChild(doc, node, "EstArtCod", estArtCod);
    appendChild(doc, node, "EstQtd", estQtd);
    appendChild(doc, node, "NConc", 0);
    if (note)
        appendChild(doc, node, "nota", note);
    root.appendChild(node);
}

function exportData(){
  for(var e of resultList){
    let data = e.split(';');
    entry(doc, root, data[1], data[2], data.length > 3 ? data[3] : null);
  }

  const pi = doc.createProcessingInstruction('xml', 'version="1.0" standalone="yes"');
  doc.insertBefore(pi, doc.firstChild);
  let str = new XMLSerializer().serializeToString(doc);

  let file = new Blob([str],{type: 'text/xml'});
  let filename = "LC_" + new Date().toISOString().substr(0, 16).replace('T','_') +".est";
  if (window.navigator.msSaveOrOpenBlob) // IE10+
    window.navigator.msSaveOrOpenBlob(file, filename);
  else { // Others
    let a = document.createElement('a');
    let url = URL.createObjectURL(file);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);  
    }, 0); 
  }

}

const beep = document.getElementById('beep');
const table = document.getElementById("table-results");
const resultContainer = document.getElementById('qr-reader-results');
var lastResult, countResults = 0;
var resultList = [];
/*
var resultList = [
  "KANBAN;110001234;20;MUITO URGENTE",
  "KANBAN;110001235;200;AE12345678 PAP123 PROC.12345678",
  "KANBAN;110001236;100;AE12348 PAP12"
];
*/

function onScanSuccess(decodedText, decodedResult) {
  if (decodedText.startsWith('KANBAN') && ! resultList.includes(decodedText)){
    beep.play();
    resultList.push(decodedText);
    let data = decodedText.split(';');
    let row = table.insertRow(countResults + 1);;
    row.insertCell(0).innerText = data[1];
    row.insertCell(1).innerText = data[2];
    if (data.length > 3)
      row.insertCell(2).innerText = data[3];
    ++countResults;
    console.log(`Scan result ${decodedText}`, decodedResult);
  }
}

let html5QrcodeScanner = new Html5QrcodeScanner(
    "qr-reader", { fps: 10, qrbox: 250 });
html5QrcodeScanner.render(onScanSuccess);

// test only onScanSuccess(testStr,0);
