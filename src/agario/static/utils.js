export function throttle(func, limit) {
    let lastFunc;
    let lastRan;
    return function() {
        const context = this;
        const args = arguments;
        if (!lastRan) {
            func.apply(context, args);
            lastRan = Date.now();
        } else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(function() {
                if ((Date.now() - lastRan) >= limit) {
                    func.apply(context, args);
                    lastRan = Date.now();
                }
            }, limit - (Date.now() - lastRan));
        }
    }
}

export function isInViewport(x, y, camera) {
    if (!camera) return false;
    const dx = x - camera.position.x;
    const dy = y - camera.position.y;
    const halfWidth = (camera.right - camera.left) / 2;
    const halfHeight = (camera.top - camera.bottom) / 2;
    return Math.abs(dx) <= halfWidth && Math.abs(dy) <= halfHeight;
}

export function getRandomColor() {
    return '#' + Math.floor(Math.random()*16777215).toString(16);
}
