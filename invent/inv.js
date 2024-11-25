function maxV(v){
  const out = {
    max: Number.MIN_SAFE_INTEGER,
    idx: -1
  };
  for (let i = 0 ; i < v.length; i++){
    if (v[i] > out.max){
      out.max = v[i];
      out.idx = i;
    }
  }
  console.log("max " + v + ": "+JSON.stringify(out));
  return out;
}

function minV(v){
  const out = {
    min: Number.MAX_SAFE_INTEGER,
    idx: -1
  };
  for (let i = 0 ; i < v.length; i++){
    if (v[i] < out.min){
      out.min = v[i];
      out.idx = i;
    }
  }
  console.log("min " + v + ": "+JSON.stringify(out));
  return out;
}

function parseRow(opList, cols){
  console.log("cols: " + cols);
  let id = cols[0];
  let prior = cols[1];
  let nArm = cols.length - 2;
  let vals = cols.slice(2);
  let max = maxV(vals);
  let min = minV(vals);
  if (max.max > 0 && min.min < 0){
    let qt = max.max > -min.min
              ? Math.max(max.max, -min.min)
              : Math.min(max.max, -min.min);
    let trs = {
      id: id,
      src: max.idx,
      dst: min.idx,
      qt: qt
    };
    opList.push(trs);
    console.log("transf: " + JSON.stringify(trs));
    cols[max.idx + 2] -= qt;
    cols[min.idx + 2] += qt;
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
let dataOut = [];
let offset = 2; // primeira coluna do armazem (from 0)

let outLines = [];
function prepareData(dataIn){
  
  if (dataIn.indexOf(LF) < 0)
    LF = "\n";
  let rows = dataIn.split(LF);
  let header = rows[0].split(CS);
  if (header.length < 2){
    CS = ",";
    header = rows[0].split(CS);
  }
  for (let i = 1; i < rows.length; i++){
    var row = rows[i].replaceAll(CS+CS,CS+"0"+CS).replaceAll(CS+LF,CS+"0"+LF);
    row = row.split(CS);
    if (row.length == header.length)
        parseRow(dataOut, row);
  }
  let outHTML = "";
  outLines.push(["cod","src","dst","qt"]);
  for (let i = 0; i < dataOut.length; i++){
    let r = dataOut[i];
    let v = r.id + CS + header[r.src + offset] + CS + header[r.dst + offset] + CS + r.qt;
    let l = [r.id, header[r.src + offset], header[r.dst + offset], r.qt];
    outLines.push(l);
    outHTML += l.join(CS)+"<br>";
  }
  showResults();
}

function showResults(){
  let res = document.getElementById("result");
  for (let i = 0 ; i < header.length - 2; i++){
    let from = header[i + 2];
    let el_src = document.createElement("div");
    for (let j = 0; j < header.length - 2; j++){
      if (i == j)
        continue;
      let to = header[j + 2];
      const filteredData = outLines.filter(row => row[i] === from && row[j] === to);
      let el_dst = document.createElement("a");
      el_dst.setAttribute("href", getUri(filteredData));
      el_dst.setAttribute("download", "transf_de_" + from + "_para_" + to +"_" + new Date().getTime() + ".csv");
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


function saveCsv() {
  document.getElementById("saveCsv").style.display = 'block';
  let csvOut = document.getElementById('csvOut');
  csvOut.data = outLines;
  let savecsv = (evt) => {
    let link = document.createElement("a");
    link.setAttribute("href", getUri(evt.currentTarget.data));
    link.setAttribute("download", "inventario-" + new Date().getTime() + ".csv");
    document.body.appendChild(link); // Required for FF
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

