import { scene } from './scene.js';

const MAX_FOOD = 500;
const foodTextureSize = 64;
let food = [];
let foodInstancedMesh;

export function initFood() {
    const foodGeometry = new THREE.CircleGeometry(5, 32);
    const foodMaterial = new THREE.MeshBasicMaterial({ vertexColors: true });
    foodInstancedMesh = new THREE.InstancedMesh(foodGeometry, foodMaterial, MAX_FOOD);
    foodInstancedMesh.instanceMatrix = new THREE.InstancedBufferAttribute(new Float32Array(MAX_FOOD * 16), 16);
    foodInstancedMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX_FOOD * 3), 3);
    foodInstancedMesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    foodInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(foodInstancedMesh);
    //createFoodTexture();
    initializeFoodInstances();
}

function initializeFoodInstances() {
    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();

    for (let i = 0; i < MAX_FOOD; i++) {
        matrix.setPosition(0, 0, 0);
        matrix.scale(new THREE.Vector3(1, 1, 1));
        foodInstancedMesh.setMatrixAt(i, matrix);

        color.setRGB(1, 1, 1);
        foodInstancedMesh.setColorAt(i, color);
    }

    foodInstancedMesh.instanceMatrix.needsUpdate = true;
    foodInstancedMesh.instanceColor.needsUpdate = true;
    foodInstancedMesh.count = MAX_FOOD;
}

export function updateFood(newFood) {
    console.log('in updateFood, start with : ', newFood.length, ' items');
    food = newFood;
    if (!food || food.length === 0) {
        console.warn('No food data available');
        return;
    }
    if (!foodInstancedMesh) {
        console.warn('Food instanced mesh not initialized');
        return;
    }

    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();

    for (let i = 0; i < MAX_FOOD; i++) {
        if (i < food.length) {
            const item = food[i];
            matrix.setPosition(item.x, item.y, 0);
            const scale = 1 + (item.value - 1) * 0.5;
            matrix.scale(new THREE.Vector3(scale, scale, 1));
            color.setStyle(item.color);
        } else {
            matrix.setPosition(0, 0, 0);
            matrix.scale(new THREE.Vector3(0, 0, 0));
            color.setRGB(0, 0, 0);
        }
        foodInstancedMesh.setMatrixAt(i, matrix);
        foodInstancedMesh.setColorAt(i, color);
    }

    foodInstancedMesh.instanceMatrix.needsUpdate = true;
    foodInstancedMesh.instanceColor.needsUpdate = true;
}

export function getFood() {
    return food;
}
