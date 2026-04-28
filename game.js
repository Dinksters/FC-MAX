// ==========================================
// 1. GRAPHICS SETUP (Three.js)
// ==========================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue
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


// ==========================================
// 2. PHYSICS SETUP (Cannon.js)
// ==========================================
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0); // Earth gravity

// Physics Materials for Bouncing
const defaultMaterial = new CANNON.Material();
const wallMaterial = new CANNON.Material();

const ballContactMaterial = new CANNON.ContactMaterial(defaultMaterial, defaultMaterial, {
    friction: 0.4,
    restitution: 0.7 // Ball bounce on grass
});
world.addContactMaterial(ballContactMaterial);

const wallContactMaterial = new CANNON.ContactMaterial(defaultMaterial, wallMaterial, {
    friction: 0.0,
    restitution: 0.5 // Ball bounce off walls
});
world.addContactMaterial(wallContactMaterial);

// Physics Pitch
const groundBody = new CANNON.Body({ mass: 0, shape: new CANNON.Plane(), material: defaultMaterial });
groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
world.addBody(groundBody);

// Physics Player
const playerBody = new CANNON.Body({
    mass: 75, 
    shape: new CANNON.Box(new CANNON.Vec3(0.5, 1, 0.5)),
    position: new CANNON.Vec3(-5, 1, 0),
    material: defaultMaterial
});
playerBody.fixedRotation = true; 
playerBody.updateMassProperties();
world.addBody(playerBody);

// --- AI OPPONENT VISUAL & PHYSICS ---
const enemyGeo = new THREE.BoxGeometry(1, 2, 1);
const enemyMat = new THREE.MeshBasicMaterial({ color: 0x0000ff }); // Blue kit
const enemyMesh = new THREE.Mesh(enemyGeo, enemyMat);
scene.add(enemyMesh);

const enemyBody = new CANNON.Body({
    mass: 75,
    shape: new CANNON.Box(new CANNON.Vec3(0.5, 1, 0.5)),
    position: new CANNON.Vec3(5, 1, 0), // Spawns on the Away side
    material: defaultMaterial
});
enemyBody.fixedRotation = true;
enemyBody.updateMassProperties();
world.addBody(enemyBody);

// Physics Ball
const ballBody = new CANNON.Body({
    mass: 0.43, 
    shape: new CANNON.Sphere(0.5),
    position: new CANNON.Vec3(0, 5, 0),
    material: defaultMaterial
});
world.addBody(ballBody);


// ==========================================
// 3. STADIUM BOUNDARIES & GOALS
// ==========================================
function createWall(width, height, depth, x, y, z) {
    const shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
    const body = new CANNON.Body({ mass: 0, material: wallMaterial });
    body.addShape(shape);
    body.position.set(x, y, z);
    world.addBody(body);
}

// 4 Outer Walls
createWall(50, 10, 1, 0, 5, -15); // Top
createWall(50, 10, 1, 0, 5, 15);  // Bottom
createWall(1, 10, 30, -25, 5, 0); // Left
createWall(1, 10, 30, 25, 5, 0);  // Right

// Goal Generator
function createGoal(xPosition) {
    const postMat = new THREE.MeshBasicMaterial({ color: 0xffffff }); 
    function addPost(px, py, pz, width, height, depth) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), postMat);
        mesh.position.set(px, py, pz);
        scene.add(mesh);
        
        const body = new CANNON.Body({ mass: 0, material: wallMaterial });
        body.addShape(new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2)));
        body.position.set(px, py, pz);
        world.addBody(body);
    }
    addPost(xPosition, 1.5, -3, 0.4, 3, 0.4);   // Left Post
    addPost(xPosition, 1.5, 3, 0.4, 3, 0.4);    // Right Post
    addPost(xPosition, 3.2, 0, 0.4, 0.4, 6.4);  // Crossbar
}

createGoal(-24); // Home Goal
createGoal(24);  // Away Goal


// ==========================================
// 4. CONTROLS & SCORING LOGIC
// ==========================================
const keys = { w: false, a: false, s: false, d: false, " ": false };

document.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = true;
});
document.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key.toLowerCase())) keys[e.key.toLowerCase()] = false;
});

let scoreHome = 0;
let scoreAway = 0;
const scoreboardText = document.getElementById('scoreboard');

function resetAfterGoal() {
    scoreboardText.innerText = `HOME ${scoreHome} - ${scoreAway} AWAY`;
    ballBody.position.set(0, 5, 0);
    ballBody.velocity.set(0, 0, 0);
    ballBody.angularVelocity.set(0, 0, 0);
    playerBody.position.set(-5, 1, 0);
    playerBody.velocity.set(0, 0, 0);
    enemyBody.position.set(5, 1, 0);
    enemyBody.velocity.set(0, 0, 0);
}


// ==========================================
// 5. THE MAIN GAME LOOP
// ==========================================
const timeStep = 1 / 60;
const speed = 8;
const kickPower = 12;

function animate() {
    requestAnimationFrame(animate);
    world.step(timeStep);
    
    // Player Movement
    playerBody.velocity.x = 0;
    playerBody.velocity.z = 0;
    if (keys.w) playerBody.velocity.z = -speed;
    if (keys.s) playerBody.velocity.z = speed;
    if (keys.a) playerBody.velocity.x = -speed;
    if (keys.d) playerBody.velocity.x = speed;

    // --- AI BOT LOGIC ---
    const aiSpeed = 5; // Slightly slower than you (Speed 8) so you can outrun him
    const aiKickPower = 12;

    enemyBody.velocity.x = 0;
    enemyBody.velocity.z = 0;

    // 1. Calculate path to the ball and chase it
    if (enemyBody.position.x < ballBody.position.x - 0.5) enemyBody.velocity.x = aiSpeed;
    else if (enemyBody.position.x > ballBody.position.x + 0.5) enemyBody.velocity.x = -aiSpeed;

    if (enemyBody.position.z < ballBody.position.z - 0.5) enemyBody.velocity.z = aiSpeed;
    else if (enemyBody.position.z > ballBody.position.z + 0.5) enemyBody.velocity.z = -aiSpeed;

    // 2. Shoot if within striking distance
    if (enemyBody.position.distanceTo(ballBody.position) < 2) {
        // Target your Home Goal (x: -24)
        const kickDir = new CANNON.Vec3(-24 - enemyBody.position.x, 0, 0 - enemyBody.position.z);
        kickDir.normalize();
        const impulse = new CANNON.Vec3(kickDir.x * aiKickPower, 4, kickDir.z * aiKickPower);
        ballBody.applyImpulse(impulse, ballBody.position);
    }

    // 3. Sync Bot graphics
    enemyMesh.position.copy(enemyBody.position);
    
    // Kicking Logic (Spacebar)
    if (keys[" "]) {
        const distance = playerBody.position.distanceTo(ballBody.position);
        if (distance < 2) {
            const kickDir = new CANNON.Vec3(
                ballBody.position.x - playerBody.position.x, 0, ballBody.position.z - playerBody.position.z
            );
            kickDir.normalize(); 
            const impulse = new CANNON.Vec3(kickDir.x * kickPower, 4, kickDir.z * kickPower);
            ballBody.applyImpulse(impulse, ballBody.position);
            keys[" "] = false; // Require re-press to kick again
        }
    }

    // Goal Detection
    if (ballBody.position.x > 24 && Math.abs(ballBody.position.z) < 3) {
        scoreHome++;
        resetAfterGoal();
    } else if (ballBody.position.x < -24 && Math.abs(ballBody.position.z) < 3) {
        scoreAway++;
        resetAfterGoal();
    }

    // Sync Graphics to Physics
    playerMesh.position.copy(playerBody.position);
    ballMesh.position.copy(ballBody.position);
    ballMesh.quaternion.copy(ballBody.quaternion); 
    
    // Dynamic Camera Tracking
    camera.position.x = playerMesh.position.x;
    camera.position.y = playerMesh.position.y + 8;
    camera.position.z = playerMesh.position.z + 10;
    camera.lookAt(playerMesh.position);

    renderer.render(scene, camera);
}

// Window Resize Fix
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// Start the game!
animate();
