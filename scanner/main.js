const beep = document.getElementById('beep');
const table = document.getElementById("table-results");
const resultContainer = document.getElementById('qr-reader-results');
var lastResult, countResults = 0;
const gs = String.fromCharCode(29);

function tryGTIN(s){
  var out = s.split(gs);
  return out.join('\n');
}

function onScanSuccess(decodedText, decodedResult) {
    if (decodedText !== lastResult) {
      beep.play();
      let row = table.insertRow(countResults + 1);
      let fc = decodedText.charCodeAt(0);
      row.insertCell(0).innerHTML = countResults;
      row.insertCell(1).innerHTML = decodedText.length;
      row.insertCell(2).innerHTML = "0x" + fc.toString(16);
      row.insertCell(3).innerHTML = decodedText.replaceAll(gs,'\n');
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