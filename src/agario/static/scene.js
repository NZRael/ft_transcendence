export let scene;
export const mapWidth = 10000;
export const mapHeight = 10000;

export function initScene() {
    scene = new THREE.Scene();
    let aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 1000;
    const camera = new THREE.OrthographicCamera(
        frustumSize * aspect / -2,
        frustumSize * aspect / 2,
        frustumSize / 2,
        frustumSize / -2,
        0.1,
        1000
    );
    // const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 20000);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    createMapBorders(scene, mapWidth, mapHeight);
    camera.position.set(0, 0, 500);
    camera.lookAt(0, 0, 0);
    return { scene, camera, renderer };
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

// let cameraTarget = new THREE.Vector3();

export function updateCameraPosition(camera, player) {
    if (player && player.x !== undefined && player.y !== undefined) {
        //console.log('in updateCameraPosition, Updating camera position to:', player.x, player.y, camera.position.z);
        camera.position.set(player.x, player.y, camera.position.z);
        camera.lookAt(player.x, player.y, 0);
    }
    // const zoomFactor = 1 + (player.size / 100);
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
