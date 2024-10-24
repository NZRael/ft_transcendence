import { scene } from './scene.js';
// import * as THREE from 'three';

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

// export function createFoodTexture() {
//     const foodTexture = new THREE.DataTexture(
//         new Uint8Array(foodTextureSize * foodTextureSize * 3),
//         foodTextureSize,
//         foodTextureSize,
//         THREE.RGBFormat
//     );
//     const data = foodTexture.image.data;
//     for (let i = 0; i < foodTextureSize; i++) {
//         for (let j = 0; j < foodTextureSize; j++) {
//             const index = (i * foodTextureSize + j) * 3;
//             const distance = Math.sqrt(Math.pow(i - foodTextureSize / 2, 2) + Math.pow(j - foodTextureSize / 2, 2));
//             if (distance < foodTextureSize / 2) {
//                 data[index] = 255;
//                 data[index + 1] = 255;
//                 data[index + 2] = 255;
//             }
//         }
//     }
//     foodTexture.needsUpdate = true;
//     return foodTexture;
// }



//export function initFood() {
//    const foodGeometry = new THREE.CircleGeometry(5, 32);
//    const foodMaterial = new THREE.MeshBasicMaterial({ vertexColors: true });
//    foodInstancedMesh = new THREE.InstancedMesh(foodGeometry, foodMaterial, MAX_FOOD);
//    foodInstancedMesh.instanceMatrix = new THREE.InstancedBufferAttribute(new Float32Array(MAX_FOOD * 16), 16);
//    foodInstancedMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(MAX_FOOD * 3), 3);
//    scene.add(foodInstancedMesh);
//    createFoodTexture();
//}
//
//export function updateFood(newFood) {
//    food = newFood;
//    if (!food || food.length === 0) {
//        console.warn('No food data available');
//        return;
//    }
//    if (!foodInstancedMesh) {
//        console.warn('Food instanced mesh not initialized');
//        return;
//    }
//    const color = new THREE.Color();
//    const matrix = new THREE.Matrix4();
//    for (let i = 0; i < food.length && i < MAX_FOOD; i++) {
//        const item = food[i];
//        matrix.setPosition(item.x, item.y, 0);
//        const scale = 1 + (item.value - 1) * 0.5;
//        matrix.scale(new THREE.Vector3(scale, scale, 1));
//        color.setStyle(item.color);
//        foodInstancedMesh.setMatrixAt(i, matrix);
//        foodInstancedMesh.setColorAt(i, color);
//    }
//    // Mettre à jour la taille (basée sur la valeur)
//    const scale = 1 + (item.value - 1) * 0.5; // Ajustez cette formule selon vos besoins
//    matrix.scale(new THREE.Vector3(scale, scale, 1));
//    foodInstancedMesh.setMatrixAt(i, matrix);
//
//    // Marquer les attributs comme nécessitant une mise à jour
//    foodInstancedMesh.instanceMatrix.needsUpdate = true;
//    foodInstancedMesh.instanceColor.needsUpdate = true;
//    foodInstancedMesh.count = Math.min(food.length, MAX_FOOD);
//}
//
//export function createFoodTexture() {
//    const foodTexture = new THREE.DataTexture(
//        new Uint8Array(foodTextureSize * foodTextureSize * 3),
//        foodTextureSize,
//        foodTextureSize,
//        THREE.RGBFormat
//    );
//    const data = foodTexture.image.data;
//    for (let i = 0; i < foodTextureSize; i++) {
//        for (let j = 0; j < foodTextureSize; j++) {
//            const index = (i * foodTextureSize + j) * 3;
//            const distance = Math.sqrt(Math.pow(i - foodTextureSize / 2, 2) + Math.pow(j - foodTextureSize / 2, 2));
//            if (distance < foodTextureSize / 2) {
//                data[index] = 255;
//                data[index + 1] = 255;
//                data[index + 2] = 255;
//            }
//        }
//    }
//    foodTexture.needsUpdate = true;
//    return foodTexture;
//}
//
//export function getFood() {
//    return food;
//}
//
//export function cleanupFood() {
//    foodModels.forEach(model => {
//        if (model) {
//            scene.remove(model);
//        }
//    });
//    foodModels = [];
//}

