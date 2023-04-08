const doc = document.implementation.createDocument("", "", null);
const root = doc.createElement("NewDataSet");
root.innerHTML = `
<xs:schema id="NewDataSet" xmlns="" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:msdata="urn:schemas-microsoft-com:xml-msdata">
<xs:element name="NewDataSet" msdata:IsDataSet="true" msdata:UseCurrentLocale="true">
  <xs:complexType>
    <xs:choice minOccurs="0" maxOccurs="unbounded">
      <xs:element name="EncCCULista">
        <xs:complexType>
          <xs:sequence>
            <xs:element name="EstArtCod" type="xs:string" minOccurs="0" />
            <xs:element name="ccu" type="xs:string" minOccurs="0" />
            <xs:element name="arm_dest" type="xs:string" minOccurs="0" />
            <xs:element name="EstQtd" type="xs:decimal" minOccurs="0" />
            <xs:element name="NConc" type="xs:int" minOccurs="0" />
            <xs:element name="Nota" type="xs:string" minOccurs="0" />
          </xs:sequence>
        </xs:complexType>
      </xs:element>
    </xs:choice>
  </xs:complexType>
</xs:element>
</xs:schema>
`

function appendChild(doc, parent, name, content){
    let child = doc.createElement(name);
    child.innerText = content;
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
  document.getElementById('xml-export').innerText = root.outerText;
}

const beep = document.getElementById('beep');
const table = document.getElementById("table-results");
const resultContainer = document.getElementById('qr-reader-results');
var lastResult, countResults = 0;
var resultList = [];

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