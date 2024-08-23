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
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setAnimationLoop( animate );
document.body.appendChild(renderer.domElement);

window.addEventListener( 'resize', onWindowResize );

let laSensor = new LinearAccelerationSensor({ frequency: 5 });
const sens_x = document.getElementById('sens_x');
const sens_y = document.getElementById('sens_y');
const sens_z = document.getElementById('sens_z');
const sens = 0.005;

laSensor.addEventListener("reading", (e) => {
    uniforms.phi.value += laSensor.x * sens;
    uniforms.tet.value += laSensor.y * sens;
    uniforms.zoom.value += laSensor.z * sens;
    sens_x.value = laSensor.x;
    sens_y.value = laSensor.y;
    sens_z.value = laSensor.z;
});

laSensor.start();


function onWindowResize() {
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function animate() {
    uniforms.iTime.value += 0.05;
    renderer.render( scene, camera );
}