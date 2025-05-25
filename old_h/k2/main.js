document.addEventListener('DOMContentLoaded', function() {
    // Form input fields
    const peInput = document.getElementById('pe');
    const qeInput = document.getElementById('qe');
    const codigoInput = document.getElementById('codigo');
    const designacaoInput = document.getElementById('designacao');
    const localizacaoInput = document.getElementById('localizacao');
    const observacoesInput = document.getElementById('observacoes');

    // Front layout elements
    const ptcEncomenda = document.getElementById('pe-val');
    const qtdEncomenda = document.getElementById('qe-val');
    const labFrio = document.getElementById('frio-value');
    const codigoDisplay = document.querySelector('#front .code-number');
    const designacaoDisplay = document.querySelector('#front .designation-value');
    const localizacaoDisplay = document.querySelector('#front .location-value');
    const observacoesDisplay = document.querySelector('#front .notes-value');
    const barcodeImage = document.querySelector('#barcode-img');

    const revision = document.getElementById('revision');
    if (revision) {
        revision.textContent = 'Última revisão: ' + new Date().toLocaleDateString('pt-PT');
    }
    // Update function for each input
    const updateLayout = {
        pe: (value) => ptcEncomenda.textContent = value || '',
        qe: (value) => qtdEncomenda.textContent = value || '',
        codigo: (value) => {
            codigoDisplay.textContent = value || '';
            // Update barcode - requires a barcode library
            generateBarcode(value);
        },
        designacao: (value) => {
            designacaoDisplay.textContent = value || '';
            labFrio.hidden = !value.includes('[frio]');
        },
        localizacao: (value) => localizacaoDisplay.textContent = value || '',
        observacoes: (value) => observacoesDisplay.textContent = value || ''
    };

    // Add input event listeners
    [peInput, qeInput, codigoInput, designacaoInput, localizacaoInput, observacoesInput].forEach(input => {
        if (input) {
            input.addEventListener('input', (e) => {
                updateLayout[e.target.id](e.target.value);
            });
        }
    });

    // Function to generate barcode (requires barcode library)
    function generateBarcode(code) {
        if (!code) return;
        
        // Using JsBarcode library (need to add to HTML)
        try {
            JsBarcode("#barcode-img", code, {
                format: "CODE128",
                width: 2,
                height: 50,
                displayValue: false
            });
        } catch (e) {
            console.error('Error generating barcode:', e);
        }
    }

    // Form submit handler
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            // Add any additional form submission logic here
        });
    }
});