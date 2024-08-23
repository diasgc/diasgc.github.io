import * as THREE from 'three';

let scene, camera, geometry, renderer, uniforms;

scene = new THREE.Scene();
// full screen
camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
geometry = new THREE.PlaneGeometry( 2, 2 );

uniforms = {
    opacity: { value: 1.0 },
    iTime: { value: 0.1 },
    zoom: { value: 0.1 },
    tet: { value: 0.1 },
    phi: { value: 0.1 }
};

const material = new THREE.ShaderMaterial( {

    uniforms: uniforms,
    vertexShader: document.getElementById( 'vertex' ).textContent,
    fragmentShader: document.getElementById( 'fragment' ).textContent

} );

const mesh = new THREE.Mesh( geometry, material );
scene.add( mesh );

renderer = new THREE.WebGLRenderer( { antialias: true } );
//renderer.setPixelRatio( window.devicePixelRatio );
// Square it!
renderer.setPixelRatio( 1 );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild(renderer.domElement);

window.addEventListener( 'resize', onWindowResize );

function onWindowResize() {
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
    uniforms.iTime.value += 0.1;
    renderer.render( scene, camera );
}