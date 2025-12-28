const ui = {
    loadId: document.getElementById('load-note'),
    saveId: document.getElementById('save-note'),
    contentId: document.getElementById('t-content'),
    passwordInput: document.getElementById('input-password'),
    submitPassword: document.getElementById('submit-password'),
    init: function() {
        this.loadId.addEventListener('click', actions.loadNote);
        this.saveId.addEventListener('click', actions.saveNote);
        this.submitPassword.addEventListener('click', actions.setPassword);
    },
    requestPassword: function() {
        const pwd = prompt('Enter your password:');
        return pwd;
    }
}

const actions = {
    password: null,
    filename: null,
    setPassword: function() {
        actions.password = ui.passwordInput.value;
        alert('Password set!');
    },
    saveNote: function() {
        if (!actions.password) {
            actions.password = ui.requestPassword();
        }
        const content = ui.contentId.innerHTML;
        const encrypted = CryptoJS.AES.encrypt(content, actions.password).toString();
        if (!actions.filename) {
            actions.filename = prompt('Enter filename to save note:') || 'cnote.txt';
        }
        dowload(encrypted, actions.filename, 'text/plain');
        //localStorage.setItem('cnote', encrypted);
        alert('Note saved securely!');
    },
    loadNote: function() {
        const input = document.createElement('input');
        input.type = 'file';
        input.onchange = e => {
            actions.filename = e.target.files[0];
            const reader = new FileReader();
            reader.onload = function(event) {
                const encrypted = event.target.result;
                actions.password = ui.requestPassword();
                try {
                    const decrypted = CryptoJS.AES.decrypt(encrypted, actions.password).toString(CryptoJS.enc.Utf8);
                    ui.contentId.innerHTML = decrypted;
                    alert('Note loaded successfully!');
                } catch (e) {
                    alert('Failed to decrypt note. Check your password.');
                }
            }
            reader.readAsText(actions.filename);
        }
        input.click();
    }
}

function dowload(content, fileName, contentType) {
    const a = document.createElement("a");
    const file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}

document.addEventListener('DOMContentLoaded', () => {
    ui.init();
});