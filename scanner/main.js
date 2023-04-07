const beep = document.getElementById('beep');
const table = document.getElementById("table-results");
const resultContainer = document.getElementById('qr-reader-results');
var lastResult, countResults = 0;
const gs = String.fromCharCode(29);

const testStr = "010560031211263417250731102423821100923530526127145665971";

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
      } else {
        out += "UNKNOWN " + a + "\n";
      }
  }
  return out;
}

function onScanSuccess(decodedText, decodedResult) {
    if (decodedText !== lastResult) {
      beep.play();
      let row = table.insertRow(countResults + 1);
      let fc = decodedText.charCodeAt(0);
      row.insertCell(0).innerText = countResults;
      //row.insertCell(2).innerHTML = "0x" + fc.toString(16);
      row.insertCell(1).innerText = decodedText.length;
      row.insertCell(2).innerText = tryINF(decodedText);
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

onScanSuccess(testStr,0);