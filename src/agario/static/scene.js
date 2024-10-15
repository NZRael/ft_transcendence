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
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
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
