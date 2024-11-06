import * as THREE from './three/three.module.js';
import { scene } from './scene.js';

const MAX_FOOD = 500;
let food = [];
let foodInstancedMesh;

export function initFood(initialFood = []) {
    food = initialFood;
    const foodGeometry = new THREE.CircleGeometry(5, 32);
    const foodMaterial = new THREE.MeshBasicMaterial({ 
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        depthTest: false
    });
    foodInstancedMesh = new THREE.InstancedMesh(foodGeometry, foodMaterial, MAX_FOOD);
    
    const matrix = new THREE.Matrix4();
    const color = new THREE.Color();

    food.forEach((foodItem, index) => {
        matrix.identity();
        matrix.setPosition(foodItem.x, foodItem.y, 1);
        const scale = 1 + (foodItem.value - 1) * 0.5;
        matrix.scale(new THREE.Vector3(scale, scale, 1));
        color.setStyle(foodItem.color);
        
        foodInstancedMesh.setMatrixAt(index, matrix);
        foodInstancedMesh.setColorAt(index, color);
    });

    foodInstancedMesh.instanceMatrix.needsUpdate = true;
    foodInstancedMesh.instanceColor.needsUpdate = true;
    foodInstancedMesh.renderOrder = 1;
    scene.add(foodInstancedMesh);
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
        matrix.identity();
        matrix.setPosition(item.x, item.y, 1);
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
