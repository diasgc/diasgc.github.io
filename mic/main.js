import * as THREE from 'three';

let scene, camera, renderer, analyser, uniforms;

const startButton = document.getElementById( 'startButton' );
startButton.addEventListener( 'click', () => {
    navigator.mediaDevices.getUserMedia( { audio: true, video: false } ).then(init);
} );

function init(stream){
    const fftSize = 128;
    const overlay = document.getElementById( 'overlay' );
    overlay.remove();

    const container = document.getElementById( 'container' );
    scene = new THREE.Scene();
    camera = new THREE.Camera();

    const listener = new THREE.AudioListener();
    const audio = new THREE.Audio( listener );
    const context = listener.context;
    const source = context.createMediaStreamSource( stream );
    audio.setNodeSource( source );
    analyser = new THREE.AudioAnalyser( audio, fftSize );
    uniforms = {
        tAudioData: { value: new THREE.DataTexture( analyser.data, fftSize / 2, 1, THREE.RedFormat ) }
    };

    const material = new THREE.ShaderMaterial( {

        uniforms: uniforms,
        vertexShader: document.getElementById( 'vertexShader' ).textContent,
        fragmentShader: document.getElementById( 'fragmentShader' ).textContent

    } );

    const geometry = new THREE.PlaneGeometry( 1, 1 );

    const mesh = new THREE.Mesh( geometry, material );
    scene.add( mesh );

    //

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setAnimationLoop( animate );
    container.appendChild( renderer.domElement );

    //

    window.addEventListener( 'resize', onWindowResize );

}

function onWindowResize() {
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
    analyser.getFrequencyData();
    uniforms.tAudioData.value.needsUpdate = true;
    renderer.render( scene, camera );
}