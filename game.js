// 1. Scene & Camera Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); 

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// Camera will be positioned dynamically in the animation loop

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 2. The Pitch
const pitchGeometry = new THREE.PlaneGeometry(50, 30);
const pitchMaterial = new THREE.MeshBasicMaterial({ color: 0x228B22, side: THREE.DoubleSide });
const pitch = new THREE.Mesh(pitchGeometry, pitchMaterial);
pitch.rotation.x = Math.PI / 2;
scene.add(pitch);

// 3. The Player (Red Box)
const playerGeometry = new THREE.BoxGeometry(1, 2, 1);
const playerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.y = 1; 
scene.add(player);

// 4. The Ball (White Sphere)
const ballGeometry = new THREE.SphereGeometry(0.5, 32, 32);
const ballMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
const ball = new THREE.Mesh(ballGeometry, ballMaterial);
ball.position.set(0, 0.5, -5); // Start slightly ahead of the player
scene.add(ball);

// 5. Input Tracking (WASD)
const keys = { w: false, a: false, s: false, d: false };

document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (keys.hasOwnProperty(key)) keys[key] = true;
});

document.addEventListener('keyup', (event) => {
    const key = event.key.toLowerCase();
    if (keys.hasOwnProperty(key)) keys[key] = false;
});

// 6. The Game Loop
const playerSpeed = 0.15;

function animate() {
    requestAnimationFrame(animate);
    
    // Player Movement Logic
    if (keys.w) player.position.z -= playerSpeed;
    if (keys.s) player.position.z += playerSpeed;
    if (keys.a) player.position.x -= playerSpeed;
    if (keys.d) player.position.x += playerSpeed;

    // Dynamic Camera (Follows the player)
    camera.position.x = player.position.x;
    camera.position.y = player.position.y + 8; // Height of camera
    camera.position.z = player.position.z + 10; // Distance behind player
    camera.lookAt(player.position); // Always look at the player

    renderer.render(scene, camera);
}

// Handle Window Resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

animate();
