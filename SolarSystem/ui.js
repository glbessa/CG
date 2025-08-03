import camera from "./camera.js";
import { canvas } from "./init.js";

// Referência global para a timeline (será definida quando importada)
let timeline = null;

// Função para configurar a referência da timeline
function setTimeline(timelineInstance) {
  timeline = timelineInstance;
  
  // Configurar callbacks da timeline para atualização da UI
  timeline.setUICallbacks({
    onUpdateDisplay: updateTimelineDisplay,
    onPlayPauseChange: updatePlayPauseButton,
    onEventUpdate: updateEventDisplay
  });
  
  // Configurar event listeners da timeline
  initTimelineEventListeners();
}

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
  
  // Atualizar informações da câmera imediatamente
  updateCameraInfo();
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
  
  // Atualizar informações da câmera imediatamente
  updateCameraInfo();
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
  
  // Controles da linha do tempo
  if (timeline) {
    // Spacebar para play/pause
    if (e.code === 'Space' && e.target === document.body) {
      e.preventDefault();
      timeline.togglePlayPause();
    }
    
    // R para resetar
    if (e.code === 'KeyR') {
      timeline.reset();
    }
    
    // Setas esquerda/direita para navegar no tempo
    if (e.code === 'ArrowLeft') {
      e.preventDefault();
      timeline.addTime(-30); // Voltar 30 dias
    }
    
    if (e.code === 'ArrowRight') {
      e.preventDefault();
      timeline.addTime(30); // Avançar 30 dias
    }
    
    // Shift + setas para navegação mais rápida
    if (e.shiftKey && e.code === 'ArrowLeft') {
      e.preventDefault();
      timeline.addTime(-365); // Voltar 1 ano
    }
    
    if (e.shiftKey && e.code === 'ArrowRight') {
      e.preventDefault();
      timeline.addTime(365); // Avançar 1 ano
    }
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
  updateCameraInfo();
  startCameraInfoUpdates();
});

function handlePointerLockMouseMove(e) {
  if (camera.mode === 'free') {
    camera.yaw -= e.movementX * camera.sensitivity;
    camera.pitch -= e.movementY * camera.sensitivity;
    camera.pitch = Math.max(-Math.PI/2 + 0.01, Math.min(Math.PI/2 - 0.01, camera.pitch));
    
    // Atualizar informações da câmera imediatamente
    updateCameraInfo();
  }
}

// Funções para atualizar a interface
function updateModeIndicator() {
  const modeIndicator = document.getElementById('mode-indicator');
  if (modeIndicator) {
    modeIndicator.textContent = `Modo: ${camera.mode === 'orbital' ? 'Orbital' : 'Livre'}`;
  }
  
  // Atualizar também as informações da câmera
  updateCameraInfo();
}

function updateSpeedIndicator() {
  const speedIndicator = document.getElementById('speed-indicator');
  if (speedIndicator) {
    speedIndicator.textContent = `Velocidade: ${camera.speed.toFixed(2)}`;
  }
  
  // Atualizar também a velocidade nas informações da câmera
  const cameraSpeed = document.getElementById('camera-speed');
  if (cameraSpeed) {
    cameraSpeed.textContent = camera.speed.toFixed(2);
  }
}

function updateCameraInfo() {
  // Atualizar modo
  const cameraMode = document.getElementById('camera-mode');
  if (cameraMode) {
    cameraMode.textContent = camera.mode === 'orbital' ? 'Orbital' : 'Livre';
  }
  
  // Obter posição atual da câmera
  const position = camera.getPosition();
  
  // Atualizar posição
  const posX = document.getElementById('camera-pos-x');
  const posY = document.getElementById('camera-pos-y');
  const posZ = document.getElementById('camera-pos-z');
  
  if (posX) posX.textContent = position[0].toFixed(2);
  if (posY) posY.textContent = position[1].toFixed(2);
  if (posZ) posZ.textContent = position[2].toFixed(2);
  
  // Mostrar/esconder informações específicas do modo
  const orbitalInfo = document.getElementById('orbital-info');
  const freeInfo = document.getElementById('free-info');
  
  if (camera.mode === 'orbital') {
    if (orbitalInfo) orbitalInfo.style.display = 'block';
    if (freeInfo) freeInfo.style.display = 'none';
    
    // Atualizar informações orbitais
    const radius = document.getElementById('camera-radius');
    const theta = document.getElementById('camera-theta');
    const phi = document.getElementById('camera-phi');
    
    if (radius) radius.textContent = camera.radius.toFixed(2);
    if (theta) theta.textContent = (camera.theta * 180 / Math.PI).toFixed(2);
    if (phi) phi.textContent = (camera.phi * 180 / Math.PI).toFixed(2);
  } else {
    if (orbitalInfo) orbitalInfo.style.display = 'none';
    if (freeInfo) freeInfo.style.display = 'block';
    
    // Atualizar informações do modo livre
    const yaw = document.getElementById('camera-yaw');
    const pitch = document.getElementById('camera-pitch');
    const speed = document.getElementById('camera-speed');
    
    if (yaw) yaw.textContent = (camera.yaw * 180 / Math.PI).toFixed(2);
    if (pitch) pitch.textContent = (camera.pitch * 180 / Math.PI).toFixed(2);
    if (speed) speed.textContent = camera.speed.toFixed(2);
  }
}

// Função para atualizar continuamente as informações da câmera
function startCameraInfoUpdates() {
  // Atualizar informações da câmera a cada 100ms
  setInterval(updateCameraInfo, 100);
}

// ========== TIMELINE UI FUNCTIONS ==========

// Configurar event listeners da timeline
function initTimelineEventListeners() {
  // Elementos DOM da timeline
  const slider = document.getElementById('timeline-slider');
  const playPauseBtn = document.getElementById('timeline-play-pause');
  const resetBtn = document.getElementById('timeline-reset');
  const speedSelect = document.getElementById('timeline-speed');
  
  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', () => {
      timeline.togglePlayPause();
    });
  }
  
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      timeline.reset();
    });
  }
  
  if (speedSelect) {
    speedSelect.addEventListener('change', (e) => {
      timeline.setTimeSpeed(parseFloat(e.target.value));
    });
  }
  
  if (slider) {
    slider.addEventListener('input', (e) => {
      const percentage = parseFloat(e.target.value) / 100;
      timeline.setTimeByPercentage(percentage);
    });
    
    // Prevent slider from affecting camera when dragging
    slider.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });
    
    slider.addEventListener('mousemove', (e) => {
      e.stopPropagation();
    });
  }
}

// Atualizar display da timeline
function updateTimelineDisplay(displayData) {
  const slider = document.getElementById('timeline-slider');
  const currentDateDisplay = document.getElementById('current-date');
  
  if (slider) {
    slider.value = displayData.percentage;
  }
  
  if (currentDateDisplay) {
    currentDateDisplay.textContent = displayData.formattedDate;
  }
}

// Atualizar botão play/pause
function updatePlayPauseButton(isPlaying) {
  const playPauseBtn = document.getElementById('timeline-play-pause');
  if (playPauseBtn) {
    playPauseBtn.textContent = isPlaying ? '⏸️ Pausar' : '▶️ Reproduzir';
  }
}

// Atualizar display de eventos
function updateEventDisplay(nearbyEvents, currentDate) {
  // Remover indicadores de eventos antigos
  const existingIndicators = document.querySelectorAll('.event-indicator');
  existingIndicators.forEach(indicator => indicator.remove());
  
  if (nearbyEvents.length > 0) {
    // Mostrar primeiro evento próximo
    const event = nearbyEvents[0];
    const message = timeline.getEventMessage(event, currentDate);
    
    // Criar indicador de evento
    const indicator = document.createElement('div');
    indicator.className = 'event-indicator';
    indicator.textContent = message;
    indicator.style.cssText = `
      position: absolute;
      top: -35px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(255, 215, 0, 0.9);
      color: black;
      padding: 5px 10px;
      border-radius: 15px;
      font-size: 11px;
      font-weight: bold;
      white-space: nowrap;
      z-index: 1001;
      pointer-events: none;
    `;
    
    const timelineContainer = document.getElementById('timeline-container');
    if (timelineContainer) {
      timelineContainer.appendChild(indicator);
    }
  }
}

export {
    handlePointerLockMouseMove,
    updateModeIndicator,
    updateSpeedIndicator,
    updateCameraInfo,
    startCameraInfoUpdates,
    setTimeline,
    initTimelineEventListeners,
    updateTimelineDisplay,
    updatePlayPauseButton,
    updateEventDisplay
}