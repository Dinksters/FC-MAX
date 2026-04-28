// --- 1. CORE & AUDIO ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const clock = new THREE.Clock();

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSound(freq, type, dur) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + dur);
}

// --- 2. PHYSICS WORLD ---
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
const mat = new CANNON.Material();
world.addContactMaterial(new CANNON.ContactMaterial(mat, mat, { friction: 0.01, restitution: 0.6 }));

// Bodies
const ground = new CANNON.Body({ mass: 0, shape: new CANNON.Plane(), material: mat });
ground.quaternion.setFromAxisAngle(new CANNON.Vec3(1,0,0), -Math.PI/2);
world.addBody(ground);

const playerBody = new CANNON.Body({ mass: 80, shape: new CANNON.Box(new CANNON.Vec3(0.5,1,0.5)), position: new CANNON.Vec3(-12,1,0), material: mat });
playerBody.fixedRotation = true; playerBody.linearDamping = 0.8;
world.addBody(playerBody);

const aiBody = new CANNON.Body({ mass: 80, shape: new CANNON.Box(new CANNON.Vec3(0.5,1,0.5)), position: new CANNON.Vec3(12,1,0), material: mat });
aiBody.fixedRotation = true; aiBody.linearDamping = 0.8;
world.addBody(aiBody);

const ballBody = new CANNON.Body({ mass: 0.5, shape: new CANNON.Sphere(0.5), position: new CANNON.Vec3(0,5,0), material: mat });
ballBody.angularDamping = 0.5;
world.addBody(ballBody);

// Visuals
scene.add(new THREE.AmbientLight(0xffffff, 0.7));
const sun = new THREE.DirectionalLight(0xffffff, 0.8); sun.position.set(10,20,10); scene.add(sun);

const pitch = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), new THREE.MeshStandardMaterial({ color: 0x2d5a27 }));
pitch.rotation.x = -Math.PI/2; scene.add(pitch);

const pMesh = new THREE.Mesh(new THREE.BoxGeometry(1,2,1), new THREE.MeshStandardMaterial({ color: 0xe94560 })); scene.add(pMesh);
const aiMesh = new THREE.Mesh(new THREE.BoxGeometry(1,2,1), new THREE.MeshStandardMaterial({ color: 0x0f3460 })); scene.add(aiMesh);
const bMesh = new THREE.Mesh(new THREE.SphereGeometry(0.5,32,32), new THREE.MeshStandardMaterial({ color: 0xffffff })); scene.add(bMesh);

const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.2, 1, 8), new THREE.MeshBasicMaterial({ color: 0xffd700 }));
arrow.rotation.x = Math.PI/2; scene.add(arrow);

// --- 3. INPUTS & REWARDS ---
const keys = {};
window.onkeydown = (e) => keys[e.key.toLowerCase()] = true;
window.onkeyup = (e) => keys[e.key.toLowerCase()] = false;

let scoreH = 0, scoreA = 0, stamina = 100;

function goal(isHome) {
    playSound(200, 'square', 0.5);
    if(isHome) { 
        scoreH++; 
        let c = parseInt(localStorage.getItem('c') || 500);
        localStorage.setItem('c', c + 100); // 100 Coin Reward
    } else { scoreA++; }
    ballBody.position.set(0,5,0); ballBody.velocity.set(0,0,0);
    playerBody.position.set(-12,1,0); aiBody.position.set(12,1,0);
    document.getElementById('scoreboard').innerText = `HOME ${scoreH} - ${scoreA} AWAY`;
}

// --- 4. GAME LOOP ---
function animate() {
    requestAnimationFrame(animate);
    world.step(1/60, clock.getDelta(), 3);

    // Movement
    let spd = (keys['shift'] && stamina > 0) ? 28 : 16;
    if(keys['shift'] && stamina > 0) stamina -= 0.6; else if(stamina < 100) stamina += 0.3;
    document.getElementById('stamina-fill').style.width = stamina + "%";

    playerBody.velocity.x = 0; playerBody.velocity.z = 0;
    if(keys['w']) playerBody.velocity.z = -spd; if(keys['s']) playerBody.velocity.z = spd;
    if(keys['a']) playerBody.velocity.x = -spd; if(keys['d']) playerBody.velocity.x = spd;

    // Aim Arrow
    if(Math.abs(playerBody.velocity.x) > 0.1 || Math.abs(playerBody.velocity.z) > 0.1) 
        arrow.rotation.z = Math.atan2(playerBody.velocity.x, playerBody.velocity.z);
    arrow.position.set(playerBody.position.x, 0.2, playerBody.position.z);

    // Kick
    if(keys[' '] && playerBody.position.distanceTo(ballBody.position) < 2) {
        playSound(150, 'sine', 0.1);
        const dir = new CANNON.Vec3(ballBody.position.x - playerBody.position.x, 0.2, ballBody.position.z - playerBody.position.z);
        dir.normalize();
        ballBody.applyImpulse(dir.scale(35), ballBody.position);
        keys[' '] = false;
    }

    // AI
    aiBody.velocity.x = (ballBody.position.x > aiBody.position.x) ? 14 : -14;
    aiBody.velocity.z = (ballBody.position.z > aiBody.position.z) ? 14 : -14;
    if(aiBody.position.distanceTo(ballBody.position) < 1.8) {
        const d = new CANNON.Vec3(-30 - aiBody.position.x, 0.2, 0 - aiBody.position.z).normalize();
        ballBody.applyImpulse(d.scale(30), ballBody.position);
    }

    // Logic
    if(ballBody.position.x > 28) goal(true); if(ballBody.position.x < -28) goal(false);

    pMesh.position.copy(playerBody.position); aiMesh.position.copy(aiBody.position);
    bMesh.position.copy(ballBody.position); bMesh.quaternion.copy(ballBody.quaternion);
    camera.position.set(pMesh.position.x - 10, 15, pMesh.position.z);
    camera.lookAt(pMesh.position);
    renderer.render(scene, camera);
}
animate();
