export let scene;

export function initScene() {
    scene = new THREE.Scene();
    const mapWidth = 10000;
    const mapHeight = 10000;
    let aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 1000;
    const camera = new THREE.OrthographicCamera(
        frustumSize * aspect / -2, frustumSize * aspect / 2,
        frustumSize / 2, frustumSize / -2,
        0.1, 1000
    );
    camera.position.set(mapWidth / 2, mapHeight / 2, 1000); // Positionner la caméra au centre de la carte
    camera.lookAt(mapWidth / 2, mapHeight / 2, 0);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    createMapBorders(scene, mapWidth, mapHeight);
    createMapBorders(scene, mapWidth, mapHeight);
    return { scene, camera, renderer, mapWidth, mapHeight };
}

export function render(scene, camera, renderer) {
    renderer.render(scene, camera);
}

function createMapBorders(scene, mapWidth, mapHeight) {
    const borderMaterial = new THREE.LineBasicMaterial({ color: 0xFFFFFF });
    const borderGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(mapWidth, 0, 0),
        new THREE.Vector3(mapWidth, mapHeight, 0),
        new THREE.Vector3(0, mapHeight, 0),
        new THREE.Vector3(0, 0, 0)
    ]);
    const borderLine = new THREE.Line(borderGeometry, borderMaterial);
    scene.add(borderLine);
}

export function updateCameraPosition(camera, player) {
    if (player && player.x !== undefined && player.y !== undefined) {
        camera.position.set(player.x, player.y, camera.position.z);
    } else {
        console.warn('Invalid player data for camera update');
    }
        // // Ajuster le zoom en fonction de la taille du joueur
        // const zoomFactor = 1 + (player.size / 100); // Ajustez cette formule selon vos besoins
        // const frustumSize = 1000 * zoomFactor;
        // const aspect = window.innerWidth / window.innerHeight;
        // camera.left = frustumSize * aspect / -2;
        // camera.right = frustumSize * aspect / 2;
        // camera.top = frustumSize / 2;
        // camera.bottom = frustumSize / -2;
        // camera.updateProjectionMatrix();
}

export function getScene() {
    return scene;
}
