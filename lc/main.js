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

