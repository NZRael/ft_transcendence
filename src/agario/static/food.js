import { scene } from './scene.js';
import * as THREE from './vendor/three/build/three.module.js';

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
    // initializeFoodInstances();
}

function initializeFoodInstances() {
    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();

    for (let i = 0; i < MAX_FOOD; i++) {
        const foodItem = food[i];
        matrix.setPosition(foodItem.x, foodItem.y, 0);
        matrix.scale(new THREE.Vector3(1, 1, 1));
        foodInstancedMesh.setMatrixAt(i, matrix);

        color.setStyle(foodItem.color);
        foodInstancedMesh.setColorAt(i, color);
    }

    foodInstancedMesh.instanceMatrix.needsUpdate = true;
    foodInstancedMesh.instanceColor.needsUpdate = true;
    foodInstancedMesh.count = MAX_FOOD;
}

export function updateFood(newFood) {
    food = newFood;
    if (!food || food.length === 0 || !foodInstancedMesh) return;

    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();

    // On ne met à jour que les foods qui ont changé
    const changedFoods = food.filter((f, index) => {
        const oldFood = food[index];
        return !oldFood || 
               oldFood.x !== f.x || 
               oldFood.y !== f.y || 
               oldFood.type !== f.type;
    });

    changedFoods.forEach((item, index) => {
        matrix.setPosition(item.x, item.y, 0);
        const scale = 1 + (item.value - 1) * 0.5;
        matrix.scale(new THREE.Vector3(scale, scale, 1));
        color.setStyle(item.color);
        
        foodInstancedMesh.setMatrixAt(index, matrix);
        foodInstancedMesh.setColorAt(index, color);
    });

    if (changedFoods.length > 0) {
        foodInstancedMesh.instanceMatrix.needsUpdate = true;
        foodInstancedMesh.instanceColor.needsUpdate = true;
    }
}

export function getFood() {
    return food;
}
