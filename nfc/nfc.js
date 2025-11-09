const logger = {
    id: document.getElementById('log'),
    log: function(msg){
        id.innerText += `${msg}\n`; 
    }
}


const ndef = new NDEFReader();
ndef.scan().then(() => {
    logger.log("Scan started successfully.");
    ndef.onreading = event => {
        logger.log(`NDEF message read: ${event.message}`);
    };
}).catch(error => {
    logger.log(`Error starting scan: ${error}`);
});