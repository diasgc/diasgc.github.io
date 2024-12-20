function maxV2(arr){
  const max = Math.max(...arr); // Find the minimum value
  const index = arr.indexOf(max)
  const out = {
    max: max,
    idx: index
  };
  console.log("max " + arr + ": "+JSON.stringify(out));
  return out;
}

function minV2(arr){
  const min = Math.min(...arr); // Find the minimum value
  const index = arr.indexOf(min)
  const out = {
    min: min,
    idx: index
  };
  console.log("min " + arr + ": "+JSON.stringify(out));
  return out;
}

function minV(arr){
  const out = {
    min: arr[0],
    idx: 0
  };
  for (let i = 1 ; i < arr.length; i++){
    if (arr[i] < out.min){
      out.min = arr[i];
      out.idx = i;
    }
  }
  console.log("min " + arr + ": "+JSON.stringify(out));
  return out;
}

function maxV(arr){
  const out = {
    max: arr[0],
    idx: 0
  };
  for (let i = 1 ; i < arr.length; i++){
    if (arr[i] > out.max){
      out.max = arr[i];
      out.idx = i;
    }
  }
  console.log("max " + arr + ": "+JSON.stringify(out));
  return out;
}

function parseRow(opList, cols){
  console.log("cols: " + cols);
  let id = cols[0];
  let prior = cols[1];
  let nArm = cols.length - offset;
  let vals = cols.slice(offset);
  let max = maxV(vals);
  let min = minV(vals);

  /*
  max [88,-415,0,0,0,0,-30]: {"max":"88","idx":0}
  min [88,-415,0,0,0,0,-30]: {"min":"-30","idx":6}
  transf: {"id":"110000414","src":0,"dst":6,"qt":88}
  */
 
  // max:1, min:-2 -> 1 > 2 false -> max(1,-2) = 1
  // max:200, min:-2 -> 200 > 2 true -> min(200,2) = 2
  if (max.max > 0 && min.min < 0){
    let qt = max.max > -min.min
              ? Math.min(max.max, -min.min)
              : Math.max(max.max, min.min);
    let trs = {
      id: id,
      src: min.idx,
      dst: max.idx,
      qt: qt
    };
    opList.push(trs);
    console.log("transf: " + JSON.stringify(trs));
    cols[max.idx + offset] -= qt;
    cols[min.idx + offset] += qt;
    parseRow(opList,cols);
  }
}

/*
data = [
    ["110000101","",-1000,0,0,500,200,100],
    ["110000101","",-200,0,0,500,200,100],
    ["110000101","",-100,0,0,500,200,100],
    ["110000101","",-50,0,0,50,20,10]
];
out = [];
for (let i = 0 ; i < data.length; i++){
    parseRow(out, data[i]);
}
document.getElementById("result").innerHTML = JSON.stringify(out, null, 2);
*/

var LF = "\r\n";
var CS = ";";
var DC = ",";
let dataOut = [];
let offset = 2; // primeira coluna do armazem (from 0)
var header;
let outLines = [];

function prepareData(dataIn){
  if (dataIn.indexOf(LF) < 0)
    LF = "\n";
  let rows = dataIn.split(LF);
  header = rows[0].split(CS);
  if (header.length < offset){
    CS = ",";
    DC = ".";
    header = rows[0].split(CS);
  }
  let keepDec = DC === '.';
  for (let i = 1; i < rows.length; i++){
    var row = keepDec
      ? rows[i]
      : rows[i].replaceAll(DC,".").replaceAll(DC,".");
    row = row.split(CS).map(x => parseInt(x || 0));
    if (row.length == header.length)
        parseRow(dataOut, row);
  }
  let outHTML = "";
  outLines.push(["cod","src","dst","qt"]);
  for (let i = 0; i < dataOut.length; i++){
    let r = dataOut[i];
    let l = [r.id, header[r.src + offset], header[r.dst + offset], r.qt];
    outLines.push(l);
    outHTML += l.join(CS)+"<br>";
  }
  saveCsv();
  showResults();
}

function showResults(){
  let res = document.getElementById("result");
  res.style.display = 'block';
  for (let i = 0 ; i < header.length - offset; i++){
    let from = header[i + offset];
    let el_src = document.createElement("fieldset");
    let el_src_legend = document.createElement("legent");
    el_src_legend.innerHTML = "from " + from;
    el_src.appendChild(el_src_legend);
    for (let j = 0; j < header.length - offset; j++){
      if (i == j)
        continue;
      let to = header[j + offset];
      const filteredData = outLines.filter(row => row[1] === from && row[2] === to);
      console.log("from " + from + " to " + to + ": " + filteredData.length); 
      if (filteredData.length == 0)
        continue;
      let el_dst = getLinkElement("trf-" + from + "-to-" + to, from + "-&gt;" + to, filteredDataToGhaf(filteredData));
      el_src.appendChild(el_dst);
    }
    res.appendChild(el_src);
  }
}

function getUri(arr){
  let csvText = "data:text/csv;charset=utf-8," 
      + arr.map(e => e.join(CS)).join(LF);
  return encodeURI(csvText);
}

function getLinkElement(name, label, uri){
  let el = document.createElement("a");
  el.setAttribute("href", uri);
  el.setAttribute("download", name +"-" + new Date().getTime() + ".csv");
  el.innerHTML = label;
  return el;
}

function filteredDataToGhaf(filteredData){
  let out = [];
  out.push(['Codigo','Designacao','Qtd','Armazem','CentroDeCusto','Caract','Obs','RefForn','EmbForn','Lote','PrzValidade','PTotal']);
  for (let i = 0 ; i < filteredData.length; i++)
    out.push([filteredData[i][0],'',filteredData[i][3],filteredData[i][1],'','','','','','','','']);
  let csvText = "data:text/csv;charset=utf-8," + out.map(e => e.join(CS)).join(LF);
  return encodeURI(csvText);
}

function saveCsv() {
  document.getElementById("saveCsv").style.display = 'block';
  let csvOut = document.getElementById('csvOut');
  csvOut.data = outLines;
  let savecsv = (evt) => {
    let link = document.createElement("a");
    let name = "trsf_all";
    let el_dst = getLinkElement(name, name + "_" + new Date().getTime(), getUri(evt.currentTarget.data));
    document.body.appendChild(el_dst); // Required for FF
    link.click();
  }
  csvOut.addEventListener('click', savecsv, false);
}

let csvIn = document.getElementById('csvIn');
let opencsv = () => {
  let reader = new FileReader()
  reader.onload = () => prepareData(reader.result);
  reader.readAsBinaryString(csvIn.files[0])
}

csvIn.addEventListener('change', opencsv);

