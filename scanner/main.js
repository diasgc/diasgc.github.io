const beep = document.getElementById('beep');
const table = document.getElementById("table-results");
const resultContainer = document.getElementById('qr-reader-results');
var lastResult, countResults = 0;

function onScanSuccess(decodedText, decodedResult) {
    if (decodedText !== lastResult) {
      beep.play();
      let row = table.insertRow(0);
      let c1 = row.insertCell(0);
      let c2 = row.insertCell(1);
      let c3 = row.insertCell(2);
      c1.innerHTML = countResults;
      c2.innerHTML = decodedText.length;
      c3.innerHTML = decodedText;
      ++countResults;
      lastResult = decodedText;
      // Handle on success condition with the decoded message.
      console.log(`Scan result ${decodedText}`, decodedResult);
      //resultContainer.innerText = decodedText;
      html5QrcodeScanner.clear();
      html5QrcodeScanner.pause();
    }
}

let html5QrcodeScanner = new Html5QrcodeScanner(
    "qr-reader", { fps: 10, qrbox: 250 });
html5QrcodeScanner.render(onScanSuccess);