import { scene } from './scene.js';
// import * as THREE from 'three';

const MAX_FOOD = 1000;
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
    // foodInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(foodInstancedMesh);
    // createFoodTexture();
}

export function updateFood(newFood) {
    console.log('updateFood called with', newFood.length, 'items');
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

    for (let i = 0; i < food.length && i < MAX_FOOD; i++) {
        const item = food[i];

        // Mettre à jour la position
        matrix.setPosition(item.x, item.y, 0);
        foodInstancedMesh.setMatrixAt(i, matrix);

        // Mettre à jour la couleur
        try {
            color.setStyle(item.color);
            foodInstancedMesh.setColorAt(i, color);
        } catch (error) {
            console.error(`Error setting color for item ${i}:`, error);
        }

        // Mettre à jour la taille (basée sur la valeur)
        const scale = 1 + (item.value - 1) * 0.5; // Ajustez cette formule selon vos besoins
        matrix.scale(new THREE.Vector3(scale, scale, 1));
        foodInstancedMesh.setMatrixAt(i, matrix);
    }

    // Marquer les attributs comme nécessitant une mise à jour
    foodInstancedMesh.instanceMatrix.needsUpdate = true;
    foodInstancedMesh.instanceColor.needsUpdate = true;

    // Si le nombre d'instances a changé, mettez à jour le count
    foodInstancedMesh.count = Math.min(food.length, MAX_FOOD);
    
    console.log('Food instances updated. Total count:', foodInstancedMesh.count);
    
    // Log des détails de l'InstancedMesh après mise à jour
    // console.log('InstancedMesh details:', {
    //     geometry: foodInstancedMesh.geometry,
    //     material: foodInstancedMesh.material,
    //     count: foodInstancedMesh.count,
    //     instanceMatrix: foodInstancedMesh.instanceMatrix,
    //     instanceColor: foodInstancedMesh.instanceColor
    // });
}

export function createFoodTexture() {
    const foodTexture = new THREE.DataTexture(
        new Uint8Array(foodTextureSize * foodTextureSize * 3),
        foodTextureSize,
        foodTextureSize,
        THREE.RGBFormat
    );
    const data = foodTexture.image.data;
    for (let i = 0; i < foodTextureSize; i++) {
        for (let j = 0; j < foodTextureSize; j++) {
            const index = (i * foodTextureSize + j) * 3;
            const distance = Math.sqrt(Math.pow(i - foodTextureSize / 2, 2) + Math.pow(j - foodTextureSize / 2, 2));
            if (distance < foodTextureSize / 2) {
                data[index] = 255;
                data[index + 1] = 255;
                data[index + 2] = 255;
            }
        }
    }
    foodTexture.needsUpdate = true;
    return foodTexture;
}

export function getFood() {
    return food;
}


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
//        // Créer ou mettre à jour les modèles de nourriture
//        for (let i = 0; i < food.length; i++) {
//            const f = food[i];
//            if (!foodModels[i]) {
//                // Créer un nouveau modèle si nécessaire
//                const foodGeometry = new THREE.CircleGeometry(5, 32);
//                const foodMaterial = new THREE.MeshBasicMaterial({ color: f.color });
//                const foodMesh = new THREE.Mesh(foodGeometry, foodMaterial);
//                scene.add(foodMesh);
//                foodModels[i] = foodMesh;
//            }
//            // Mettre à jour la position et l'échelle du modèle
//            const foodModel = foodModels[i];
//            foodModel.position.set(f.x, f.y, 0);
//            foodModel.scale.set(f.type === 'epic' ? 2 : 1, f.type === 'epic' ? 2 : 1, 1);
//            foodModel.material.color.set(f.color);
//        }
//        // foodInstancedMesh.instanceColor.needsUpdate = true;
//        // Cacher les modèles excédentaires
//        for (let i = food.length; i < foodModels.length; i++) {
//            if (foodModels[i]) {
//                foodModels[i].visible = false;
//            }
//        }
//    }
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
