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
            actions.filename = prompt('Enter filename to save note:');
        }
        dowload(encrypted, actions.filename || 'cnote.txt', 'text/plain');
        //localStorage.setItem('cnote', encrypted);
        alert('Note saved securely!');
    },
    loadNote: function() {
        if (!actions.password) {
            alert('Please set a password first.');
            return;
        }
        const encrypted = localStorage.getItem('cnote');
        if (!encrypted) {
            alert('No note found!');
            return;
        }
        try {
            const decrypted = CryptoJS.AES.decrypt(encrypted, actions.password).toString(CryptoJS.enc.Utf8);
            ui.contentId.innerHTML = decrypted;
            alert('Note loaded successfully!');
        } catch (e) {
            alert('Failed to decrypt note. Check your password.');
        }
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