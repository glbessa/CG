import camera from "./camera.js";
import { canvas } from "./init.js";

// Event listeners para controles
canvas.addEventListener("mousedown", (e) => {
  camera.isDragging = true;
  camera.lastX = e.clientX;
  camera.lastY = e.clientY;
  if (camera.mode === 'free') {
    canvas.requestPointerLock(); // Travar o mouse no modo livre
  }
});

canvas.addEventListener("mouseup", () => {
  camera.isDragging = false;
});

canvas.addEventListener("mousemove", (e) => {
  if (!camera.isDragging) return;
  
  const deltaX = e.clientX - camera.lastX;
  const deltaY = e.clientY - camera.lastY;
  camera.lastX = e.clientX;
  camera.lastY = e.clientY;

  if (camera.mode === 'orbital') {
    // Controle orbital
    camera.theta -= deltaX * 0.01;
    camera.phi += deltaY * 0.01;
    camera.phi = Math.max(camera.minPhi, Math.min(camera.maxPhi, camera.phi));
  } else {
    // Controle livre (mouse look)
    camera.yaw -= deltaX * camera.sensitivity;
    camera.pitch -= deltaY * camera.sensitivity;
    // Limitar pitch para evitar flip
    camera.pitch = Math.max(-Math.PI/2 + 0.01, Math.min(Math.PI/2 - 0.01, camera.pitch));
  }
});

canvas.addEventListener("wheel", (e) => {
  if (camera.mode === 'orbital') {
    camera.radius += e.deltaY * 0.01;
    camera.radius = Math.max(camera.minRadius, Math.min(camera.maxRadius, camera.radius));
  } else {
    // No modo livre, wheel pode ajustar velocidade
    camera.speed += e.deltaY * -0.001;
    camera.speed = Math.max(0.01, Math.min(1.0, camera.speed));
    updateSpeedIndicator();
  }
});

// Controles de teclado
document.addEventListener("keydown", (e) => {
  camera.keys[e.code] = true;
  
  // Tecla para alternar modo (C)
  if (e.code === 'KeyC') {
    camera.toggleMode();
    updateModeIndicator();
    console.log(`Modo da câmera: ${camera.mode}`);
  }
  
  // ESC para sair do pointer lock
  if (e.code === 'Escape') {
    document.exitPointerLock();
  }
});

document.addEventListener("keyup", (e) => {
  camera.keys[e.code] = false;
});

// Lidar com pointer lock para o modo livre
document.addEventListener('pointerlockchange', () => {
  if (document.pointerLockElement === canvas) {
    // Pointer está travado, usar moveDelta para controle suave
    document.addEventListener('mousemove', handlePointerLockMouseMove);
  } else {
    // Pointer foi liberado
    document.removeEventListener('mousemove', handlePointerLockMouseMove);
    camera.isDragging = false;
  }
});

document.addEventListener('DOMContentLoaded', () => {
  updateModeIndicator();
  updateSpeedIndicator();
});

function handlePointerLockMouseMove(e) {
  if (camera.mode === 'free') {
    camera.yaw -= e.movementX * camera.sensitivity;
    camera.pitch -= e.movementY * camera.sensitivity;
    camera.pitch = Math.max(-Math.PI/2 + 0.01, Math.min(Math.PI/2 - 0.01, camera.pitch));
  }
}

// Funções para atualizar a interface
function updateModeIndicator() {
  const modeIndicator = document.getElementById('mode-indicator');
  if (modeIndicator) {
    modeIndicator.textContent = `Modo: ${camera.mode === 'orbital' ? 'Orbital' : 'Livre'}`;
  }
}

function updateSpeedIndicator() {
  const speedIndicator = document.getElementById('speed-indicator');
  if (speedIndicator) {
    speedIndicator.textContent = `Velocidade: ${camera.speed.toFixed(2)}`;
  }
}

export {
    handlePointerLockMouseMove,
    updateModeIndicator,
    updateSpeedIndicator
}