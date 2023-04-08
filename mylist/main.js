const doc = document.implementation.createDocument("", "", null);
const root = doc.createElement("NewDataSet");

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
  let str = new XMLSerializer().serializeToString(doc);
  document.getElementById('xml-export').innerText = str;
}

function XmlPrettify(domRoot, indent){
  let xmlString = new XMLSerializer().serializeToString(domRoot);
  indent = indent || "\t"; //can be specified by second argument of the function

  var tabs = "";  //store the current indentation

  var result = xmlString.replace(
    /\s*<[^>\/]*>[^<>]*<\/[^>]*>|\s*<.+?>|\s*[^<]+/g , //pattern to match nodes (angled brackets or text)
    function(m,i)
    {
      m = m.replace(/^\s+|\s+$/g, "");  //trim the match just in case

      if(i<38)
       if (/^<[?]xml/.test(m))  return m+"\n";  //if the match is a header, ignore it

      if (/^<[/]/.test(m))  //if the match is a closing tag
       {
          tabs = tabs.replace(indent, "");  //remove one indent from the store
          m = tabs + m;  //add the tabs at the beginning of the match
       }
       else if (/<.*>.*<\/.*>|<.*[^>]\/>/.test(m))  //if the match contains an entire node
       {
        //leave the store as is or
        m = m.replace(/(<[^\/>]*)><[\/][^>]*>/g, "$1 />");  //join opening with closing tags of the same node to one entire node if no content is between them
        m = tabs + m; //add the tabs at the beginning of the match
       }
       else if (/<.*>/.test(m)) //if the match starts with an opening tag and does not contain an entire node
       {
        m = tabs + m;  //add the tabs at the beginning of the match
        tabs += indent;  //and add one indent to the store
       }
       else  //if the match contain a text node
       {
        m = tabs + m;  // add the tabs at the beginning of the match
       }

      //return m+"\n";
      return "\n"+m; //content has additional space(match) from header
    }//anonymous function
  );//replace

  return result;
}

const beep = document.getElementById('beep');
const table = document.getElementById("table-results");
const resultContainer = document.getElementById('qr-reader-results');
var lastResult, countResults = 0;
var resultList = [
  "KANBAN;110001234;20;MUITO URGENTE",
  "KANBAN;110001235;200;AE12345678 PAP123 PROC.12345678",
  "KANBAN;110001236;100;AE12348 PAP12"
];

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
