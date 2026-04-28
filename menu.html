// 1. ENGINE SETUP
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const clock = new THREE.Clock();

// 2. PHYSICS WORLD
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);

const slipperyMat = new CANNON.Material();
const contactMat = new CANNON.ContactMaterial(slipperyMat, slipperyMat, { friction: 0.01, restitution: 0.5 });
world.addContactMaterial(contactMat);

// Pitch
const groundBody = new CANNON.Body({ mass: 0, shape: new CANNON.Plane(), material: slipperyMat });
groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
world.addBody(groundBody);
const pitchMesh = new THREE.Mesh(new THREE.PlaneGeometry(50, 30), new THREE.MeshBasicMaterial({ color: 0x228B22 }));
pitchMesh.rotation.x = -Math.PI / 2;
scene.add(pitchMesh);

// Player (Red)
const playerBody = new CANNON.Body({ mass: 75, shape: new CANNON.Box(new CANNON.Vec3(0.5, 1, 0.5)), position: new CANNON.Vec3(-10, 1, 0), material: slipperyMat });
playerBody.fixedRotation = true;
playerBody.linearDamping = 0.5;
world.addBody(playerBody);
const playerMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), new THREE.MeshBasicMaterial({ color: 0xff0000 }));
scene.add(playerMesh);

// AI Bot (Blue)
const enemyBody = new CANNON.Body({ mass: 75, shape: new CANNON.Box(new CANNON.Vec3(0.5, 1, 0.5)), position: new CANNON.Vec3(10, 1, 0), material: slipperyMat });
enemyBody.fixedRotation = true;
enemyBody.linearDamping = 0.5;
world.addBody(enemyBody);
const enemyMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), new THREE.MeshBasicMaterial({ color: 0x0000ff }));
scene.add(enemyMesh);

// Ball
const ballBody = new CANNON.Body({ mass: 0.43, shape: new CANNON.Sphere(0.5), position: new CANNON.Vec3(0, 5, 0), material: slipperyMat });
world.addBody(ballBody);
const ballMesh = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), new THREE.MeshBasicMaterial({ color: 0xffffff }));
scene.add(ballMesh);

// Boundaries & Goals
function createWall(w, h, d, x, y, z) {
    const b = new CANNON.Body({ mass: 0, shape: new CANNON.Box(new CANNON.Vec3(w/2, h/2, d/2)), material: slipperyMat });
    b.position.set(x, y, z);
    world.addBody(b);
}
createWall(50, 10, 1, 0, 5, -15); createWall(50, 10, 1, 0, 5, 15);
createWall(1, 10, 30, -25, 5, 0); createWall(1, 10, 30, 25, 5, 0);

// 3. CONTROLS & LOGIC
const keys = { w: false, a: false, s: false, d: false, " ": false };
document.addEventListener('keydown', (e) => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', (e) => keys[e.key.toLowerCase()] = false);

let scoreH = 0, scoreA = 0;
const speed = 25, aiSpeed = 20, kickP = 35;

function reset() {
    ballBody.position.set(0, 5, 0); ballBody.velocity.set(0,0,0);
    playerBody.position.set(-10, 1, 0); enemyBody.position.set(10, 1, 0);
    document.getElementById('scoreboard').innerText = `HOME ${scoreH} - ${scoreA} AWAY`;
}

function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    world.step(1/60, dt, 3);

    // Player Move
    playerBody.velocity.x = 0; playerBody.velocity.z = 0;
    if (keys.w) playerBody.velocity.z = -speed; if (keys.s) playerBody.velocity.z = speed;
    if (keys.a) playerBody.velocity.x = -speed; if (keys.d) playerBody.velocity.x = speed;

    // Kick
    if (keys[" "] && playerBody.position.distanceTo(ballBody.position) < 2) {
        const dir = new CANNON.Vec3(ballBody.position.x - playerBody.position.x, 0, ballBody.position.z - playerBody.position.z);
        dir.normalize();
        ballBody.applyImpulse(new CANNON.Vec3(dir.x * kickP, 4, dir.z * kickP), ballBody.position);
        keys[" "] = false;
    }

    // AI Bot
    enemyBody.velocity.x = (ballBody.position.x > enemyBody.position.x) ? aiSpeed : -aiSpeed;
    enemyBody.velocity.z = (ballBody.position.z > enemyBody.position.z) ? aiSpeed : -aiSpeed;
    if (enemyBody.position.distanceTo(ballBody.position) < 2) {
        const dir = new CANNON.Vec3(-24 - enemyBody.position.x, 0, 0 - enemyBody.position.z);
        dir.normalize();
        ballBody.applyImpulse(new CANNON.Vec3(dir.x * kickP, 4, dir.z * kickP), ballBody.position);
    }

    // Goals
    if (ballBody.position.x > 24 && Math.abs(ballBody.position.z) < 3) { scoreH++; reset(); }
    if (ballBody.position.x < -24 && Math.abs(ballBody.position.z) < 3) { scoreA++; reset(); }

    playerMesh.position.copy(playerBody.position);
    enemyMesh.position.copy(enemyBody.position);
    ballMesh.position.copy(ballBody.position);
    camera.position.set(playerMesh.position.x, 10, playerMesh.position.z + 12);
    camera.lookAt(playerMesh.position);
    renderer.render(scene, camera);
}
animate();
