const beep = document.getElementById('beep');
const table = document.getElementById("table-results");
const resultContainer = document.getElementById('qr-reader-results');
var lastResult, countResults = 0;
const gs = String.fromCharCode(29);

function tryINF(s){
  let f = s.split(gs);
  if (f.length === 1)
    return f[0];
  var out = "";
  for (ff in f){
    let s = ff.substring(0,1);
    if (s == "01"){
      // 0105600312112634
      out +="PC: " + ff.substring(2,15) + "\n";
      out +="VAL: 20" + ff.substring(18,19)+"/"+ff.substring(20,21) + "\n";
      out +="(f1): " + ff.substring(22) + "\n";
    } else if (s == "21") {
      out += "SN: " + ff.substring(2) + "\n";
    } else if (s == "71") {
      out += "COD: " + ff.substring(3) + "\n";
    } else {
      out += "UNKNOWN " + ff + "\n";
    }
  return out;
}

function onScanSuccess(decodedText, decodedResult) {
    if (decodedText !== lastResult) {
      beep.play();
      let row = table.insertRow(countResults + 1);
      let fc = decodedText.charCodeAt(0);
      row.insertCell(0).innerHTML = countResults;
      row.insertCell(1).innerHTML = decodedText.length;
      row.insertCell(2).innerHTML = "0x" + fc.toString(16);
      row.insertCell(3).innerHTML = tryINF(decodedText);
      ++countResults;
      lastResult = decodedText;
      // Handle on success condition with the decoded message.
      console.log(`Scan result ${decodedText}`, decodedResult);
      //resultContainer.innerText = decodedText;
      //html5QrcodeScanner.clear();
      //html5QrcodeScanner.pause();
    }
}

let html5QrcodeScanner = new Html5QrcodeScanner(
    "qr-reader", { fps: 10, qrbox: 250 });
html5QrcodeScanner.render(onScanSuccess);