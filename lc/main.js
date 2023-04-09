let config = {
  fps: 7,
  qrbox : {
    width: 200, height: 200
  }
}

const html5QrCode = new Html5Qrcode(
  "reader", { formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ] });
const qrCodeSuccessCallback = (decodedText, decodedResult) => {
    /* handle success */
};
html5QrCode.start({ facingMode: "user" }, config, qrCodeSuccessCallback);