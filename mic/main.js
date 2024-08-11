import * as THREE from 'three';

let scene, camera, geometry, renderer, analyser, uniforms;

const fftSize = 64;

const overlay = document.getElementById( 'overlay' );
const container = document.getElementById( 'container' );

const startButton = document.getElementById( 'startButton' );
startButton.addEventListener( 'click', () => {
    navigator.mediaDevices.getUserMedia( { audio: true, video: false } ).then(init);
} );

function init(stream){
    
    overlay.remove();

    scene = new THREE.Scene();
    // full screen
    camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
    geometry = new THREE.PlaneGeometry( 2, 2 );
    
    // Texture
    const loader = new THREE.TextureLoader();
    const texture = loader.load('noise8b256.png');
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    const listener = new THREE.AudioListener();
    const audio = new THREE.Audio( listener );
    const context = listener.context;
    const source = context.createMediaStreamSource( stream );
    audio.setNodeSource( source );
    
    analyser = new THREE.AudioAnalyser( audio, fftSize );
    uniforms = {

        tAudioData: { value: new THREE.DataTexture( analyser.data, fftSize / 2, 1, THREE.RedFormat ) },
        iTime: { value: 0.0 },
        iChannel0: { value: texture },

    };

    const material = new THREE.ShaderMaterial( {

        uniforms: uniforms,
        vertexShader: document.getElementById( 'vertexShader' ).textContent,
        fragmentShader: document.getElementById( 'frag03' ).textContent

    } );

    const mesh = new THREE.Mesh( geometry, material );
    scene.add( mesh );

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    //renderer.setPixelRatio( window.devicePixelRatio );
    // Square it!
    renderer.setPixelRatio( 1 );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setAnimationLoop( animate );
    container.appendChild( renderer.domElement );

    window.addEventListener( 'resize', onWindowResize );

}

function onWindowResize() {
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
    analyser.getFrequencyData();
    uniforms.tAudioData.value.needsUpdate = true;
    uniforms.iTime.value += 0.005;
    renderer.render( scene, camera );
}