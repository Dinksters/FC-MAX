// --- 1. THREE.JS VISUAL SETUP ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Visual Pitch
const pitchGeo = new THREE.PlaneGeometry(50, 30);
const pitchMat = new THREE.MeshBasicMaterial({ color: 0x228B22, side: THREE.DoubleSide });
const pitchMesh = new THREE.Mesh(pitchGeo, pitchMat);
pitchMesh.rotation.x = Math.PI / 2;
scene.add(pitchMesh);

// Visual Player
const playerGeo = new THREE.BoxGeometry(1, 2, 1);
const playerMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const playerMesh = new THREE.Mesh(playerGeo, playerMat);
scene.add(playerMesh);

// Visual Ball
const ballGeo = new THREE.SphereGeometry(0.5, 32, 32);
const ballMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
const ballMesh = new THREE.Mesh(ballGeo, ballMat);
scene.add(ballMesh);


// --- 2. CANNON.JS PHYSICS SETUP ---
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0); // Earth's gravity

// Physics Pitch (Mass 0 makes it a static, unmoving floor)
const groundBody = new CANNON.Body({
    mass: 0, 
    shape: new CANNON.Plane()
});
groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
world.addBody(groundBody);

// Physics Player (75kg player)
const playerBody = new CANNON.Body({
    mass: 75, 
    shape: new CANNON.Box(new CANNON.Vec3(0.5, 1, 0.5)),
    position: new CANNON.Vec3(0, 1, 0)
});
playerBody.fixedRotation = true; // Prevents the player from tipping over
playerBody.updateMassProperties();
world.addBody(playerBody);

// Physics Ball (0.43kg standard football)
const ballBody = new CANNON.Body({
    mass: 0.43, 
    shape: new CANNON.Sphere(0.5),
    position: new CANNON.Vec3(0, 5, -5) // Drop it from the sky to test gravity!
});
world.addBody(ballBody);

// Bounciness and Friction
const defaultMaterial = new CANNON.Material();
const contactMaterial = new CANNON.ContactMaterial(defaultMaterial, defaultMaterial, {
    friction: 0.4,
    restitution: 0.7 // Gives the ball a realistic bounce
});
world.addContactMaterial(contactMaterial);


// --- STADIUM BOUNDARIES (Invisible Physics Walls) ---
// Our pitch is 50 wide (X) and 30 deep (Z). 

const wallMaterial = new CANNON.Material();
const wallContactMaterial = new CANNON.ContactMaterial(defaultMaterial, wallMaterial, {
    friction: 0.0,
    restitution: 0.5 // Balls bounce slightly off the invisible walls
});
world.addContactMaterial(wallContactMaterial);

// Function to create a generic wall
function createWall(mass, width, height, depth, x, y, z) {
    const wallShape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
    const wallBody = new CANNON.Body({ mass: mass, material: wallMaterial });
    wallBody.addShape(wallShape);
    wallBody.position.set(x, y, z);
    world.addBody(wallBody);
    return wallBody;
}

// Top Wall (North)
createWall(0, 50, 10, 1, 0, 5, -15);
// Bottom Wall (South)
createWall(0, 50, 10, 1, 0, 5, 15);
// Left Wall (West)
createWall(0, 1, 10, 30, -25, 5, 0);
// Right Wall (East)
createWall(0, 1, 10, 30, 25, 5, 0);


// --- 3. CONTROLS ---
const keys = { w: false, a: false, s: false, d: false };
document.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);


// --- 4. THE GAME LOOP ---
const timeStep = 1 / 60;
const speed = 8;

function animate() {
    requestAnimationFrame(animate);
    
    // Step the physics engine forward
    world.step(timeStep);
    
    // Player Movement (Apply velocity to the physics body, not the visual mesh)
    playerBody.velocity.x = 0;
    playerBody.velocity.z = 0;
    
    if (keys.w) playerBody.velocity.z = -speed;
    if (keys.s) playerBody.velocity.z = speed;
    if (keys.a) playerBody.velocity.x = -speed;
    if (keys.d) playerBody.velocity.x = speed;
    
    // Sync the invisible Physics world to the visible Three.js world
    playerMesh.position.copy(playerBody.position);
    
    ballMesh.position.copy(ballBody.position);
    ballMesh.quaternion.copy(ballBody.quaternion); // Makes the ball visually roll
    
    // Chase Camera
    camera.position.x = playerMesh.position.x;
    camera.position.y = playerMesh.position.y + 8;
    camera.position.z = playerMesh.position.z + 10;
    camera.lookAt(playerMesh.position);

    renderer.render(scene, camera);
}

// Handle Window Resize
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

animate();
