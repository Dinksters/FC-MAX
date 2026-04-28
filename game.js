// 1. ENGINE & SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const clock = new THREE.Clock();

// Lighting
scene.add(new THREE.AmbientLight(0xffffff, 0.6));
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(5, 10, 7.5);
scene.add(sun);

// 2. PHYSICS WORLD
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
const slipMat = new CANNON.Material();
const contactMat = new CANNON.ContactMaterial(slipMat, slipMat, { friction: 0.01, restitution: 0.5 });
world.addContactMaterial(contactMat);

// Pitch
const groundBody = new CANNON.Body({ mass: 0, shape: new CANNON.Plane(), material: slipMat });
groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
world.addBody(groundBody);
const pitchMesh = new THREE.Mesh(new THREE.PlaneGeometry(50, 30), new THREE.MeshStandardMaterial({ color: 0x228B22 }));
pitchMesh.rotation.x = -Math.PI / 2;
scene.add(pitchMesh);

// Player
const playerBody = new CANNON.Body({ mass: 75, shape: new CANNON.Box(new CANNON.Vec3(0.5, 1, 0.5)), position: new CANNON.Vec3(-10, 1, 0), material: slipMat });
playerBody.fixedRotation = true; playerBody.linearDamping = 0.5;
world.addBody(playerBody);
const playerMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), new THREE.MeshStandardMaterial({ color: 0xff0000 }));
scene.add(playerMesh);

// AI Bot
const enemyBody = new CANNON.Body({ mass: 75, shape: new CANNON.Box(new CANNON.Vec3(0.5, 1, 0.5)), position: new CANNON.Vec3(10, 1, 0), material: slipMat });
enemyBody.fixedRotation = true; enemyBody.linearDamping = 0.5;
world.addBody(enemyBody);
const enemyMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), new THREE.MeshStandardMaterial({ color: 0x0000ff }));
scene.add(enemyMesh);

// Ball
const ballBody = new CANNON.Body({ mass: 0.43, shape: new CANNON.Sphere(0.5), position: new CANNON.Vec3(0, 5, 0), material: slipMat });
world.addBody(ballBody);
const ballMesh = new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 32), new THREE.MeshStandardMaterial({ color: 0xffffff }));
scene.add(ballMesh);

// Aim Arrow
const arrowMesh = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1, 32), new THREE.MeshBasicMaterial({ color: 0xffff00 }));
arrowMesh.rotation.x = Math.PI / 2;
scene.add(arrowMesh);

// Boundaries
function wall(w,h,d,x,y,z){
    const b = new CANNON.Body({ mass: 0, shape: new CANNON.Box(new CANNON.Vec3(w/2,h/2,d/2)), material: slipMat });
    b.position.set(x,y,z); world.addBody(b);
}
wall(50, 10, 1, 0, 5, -15); wall(50, 10, 1, 0, 5, 15);
wall(1, 10, 30, -25, 5, 0); wall(1, 10, 30, 25, 5, 0);

// 3. LOGIC & REWARDS
const keys = { w: false, a: false, s: false, d: false, " ": false, shift: false };
document.addEventListener('keydown', (e) => { 
    if(e.key === "Shift") keys.shift = true;
    else keys[e.key.toLowerCase()] = true; 
});
document.addEventListener('keyup', (e) => {
    if(e.key === "Shift") keys.shift = false;
    else keys[e.key.toLowerCase()] = false;
});

let scoreH = 0, scoreA = 0, stamina = 100;

function reset(goalScored) {
    if(goalScored) {
        let c = localStorage.getItem('c') ? parseInt(localStorage.getItem('c')) : 500;
        c += 50; localStorage.setItem('c', c);
    }
    ballBody.position.set(0, 5, 0); ballBody.velocity.set(0,0,0);
    playerBody.position.set(-10, 1, 0); enemyBody.position.set(10, 1, 0);
    document.getElementById('scoreboard').innerText = `HOME ${scoreH} - ${scoreA} AWAY`;
}

function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();
    world.step(1/60, dt, 3);

    // Speed & Stamina
    let currentSpeed = 18;
    if(keys.shift && stamina > 0) {
        currentSpeed = 30; stamina -= 0.5;
    } else if(stamina < 100) {
        stamina += 0.2;
    }
    document.getElementById('stamina-fill').style.width = stamina + "%";

    playerBody.velocity.x = 0; playerBody.velocity.z = 0;
    if (keys.w) playerBody.velocity.z = -currentSpeed; if (keys.s) playerBody.velocity.z = currentSpeed;
    if (keys.a) playerBody.velocity.x = -currentSpeed; if (keys.d) playerBody.velocity.x = currentSpeed;

    // Arrow Logic
    if (Math.abs(playerBody.velocity.x) > 0 || Math.abs(playerBody.velocity.z) > 0) {
        arrowMesh.rotation.z = Math.atan2(playerBody.velocity.x, playerBody.velocity.z);
    }
    arrowMesh.position.set(playerBody.position.x, 0.1, playerBody.position.z);

    // Kick
    if (keys[" "] && playerBody.position.distanceTo(ballBody.position) < 2) {
        const dir = new CANNON.Vec3(ballBody.position.x - playerBody.position.x, 0, ballBody.position.z - playerBody.position.z);
        dir.normalize();
        ballBody.applyImpulse(new CANNON.Vec3(dir.x * 35, 5, dir.z * 35), ballBody.position);
        keys[" "] = false;
    }

    // AI
    enemyBody.velocity.x = (ballBody.position.x > enemyBody.position.x) ? 15 : -15;
    enemyBody.velocity.z = (ballBody.position.z > enemyBody.position.z) ? 15 : -15;
    if (enemyBody.position.distanceTo(ballBody.position) < 2) {
        const dir = new CANNON.Vec3(-24 - enemyBody.position.x, 0, 0 - enemyBody.position.z);
        dir.normalize(); ballBody.applyImpulse(new CANNON.Vec3(dir.x * 30, 4, dir.z * 30), ballBody.position);
    }

    if (ballBody.position.x > 24 && Math.abs(ballBody.position.z) < 3) { scoreH++; reset(true); }
    if (ballBody.position.x < -24 && Math.abs(ballBody.position.z) < 3) { scoreA++; reset(false); }

    playerMesh.position.copy(playerBody.position); enemyMesh.position.copy(enemyBody.position);
    ballMesh.position.copy(ballBody.position); ballMesh.quaternion.copy(ballBody.quaternion);
    camera.position.set(playerMesh.position.x, 12, playerMesh.position.z + 15);
    camera.lookAt(playerMesh.position);
    renderer.render(scene, camera);
}
animate();
