// https://www.npmjs.com/package/html5-qrcode#pro-mode---if-you-want-to-implement-your-own-user-interface
var lastResult;

const beep = document.getElementById('beep');

// This method will trigger user permissions
Html5Qrcode.getCameras().then(devices => {
  /**
   * devices would be an array of objects of type:
   * { id: "id", label: "label" }
   */
  if (devices && devices.length) {
    var cameraId = devices[0].id;
    // .. use this to start scanning.
  }
}).catch(err => {
  // handle errv
});

function onScanSuccess(decodedText, decodedResult) {
  if (decodedText !== lastResult) {
    beep.play();
  }
}

let html5QrcodeScanner = new Html5QrcodeScanner(
  "qr-reader", { fps: 10, qrbox: 250 });
html5QrcodeScanner.render(onScanSuccess);

//const html5QrCode = new Html5Qrcode(
//  "reader", { formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ] });
//const qrCodeSuccessCallback = (decodedText, decodedResult) => {
//    /* handle success */
//};
//html5QrCode.start({ facingMode: "user" }, config, qrCodeSuccessCallback);
