import CONFIG from './config.js';

class Timeline {
  constructor() {
    this.startDate = new Date(CONFIG.startDatetime);
    this.endDate = new Date(CONFIG.endDatetime);
    this.currentDate = new Date(this.startDate);
    this.realTimeScale = CONFIG.simulationVelocity; // Quantos dias reais passam por segundo de simulação
    this.isPlaying = true;
    this.timeSpeed = 1.0; // Multiplicador de velocidade temporal
    
    // Callbacks para UI
    this.uiCallbacks = {
      onUpdateDisplay: null,
      onPlayPauseChange: null,
      onEventUpdate: null
    };
    
    // Elementos DOM
    this.slider = document.getElementById('timeline-slider');
    this.playPauseBtn = document.getElementById('timeline-play-pause');
    this.resetBtn = document.getElementById('timeline-reset');
    this.speedSelect = document.getElementById('timeline-speed');
    this.currentDateDisplay = document.getElementById('current-date');
    
    this.initEventListeners();
    this.updateDisplay();
  }
  
  setUICallbacks(callbacks) {
    this.uiCallbacks = { ...this.uiCallbacks, ...callbacks };
  }

  setTimeSpeed(speed) {
    CONFIG.simulationVelocity = speed;
  }
  
  initEventListeners() {
    // Play/Pause button
    if (this.playPauseBtn) {
      this.playPauseBtn.addEventListener('click', () => {
        this.togglePlayPause();
      });
    }
    
    // Reset button
    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => {
        this.reset();
      });
    }
    
    // Speed selector
    if (this.speedSelect) {
      this.speedSelect.addEventListener('change', (e) => {
        this.timeSpeed = parseFloat(e.target.value);
      });
    }
    
    // Timeline slider
    if (this.slider) {
      let debounceTimer = null;
      let wasPlayingBeforeDrag = false;
      
      // Prevenir comportamento padrão
      this.slider.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        this.isDraggingSlider = true;
        wasPlayingBeforeDrag = this.isPlaying;
        this.isPlaying = false; // Pausar imediatamente
        console.log("Iniciou arraste do slider - pausando timeline");
      });
      
      // Usando 'input' para resposta imediata durante o arraste
      this.slider.addEventListener('input', (e) => {
        if (!this.isDraggingSlider) {
          this.isDraggingSlider = true;
          wasPlayingBeforeDrag = this.isPlaying;
          this.isPlaying = false;
        }
        
        // Cancelar timer anterior
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }
        
        const percentage = parseFloat(e.target.value);
        this.setTimeByPercentage(percentage);
        
        // Timer para detectar fim do arraste
        debounceTimer = setTimeout(() => {
          this.isDraggingSlider = false;
          if (wasPlayingBeforeDrag) {
            this.isPlaying = true;
          }
          console.log("Arraste finalizado (debounce) - restaurando estado:", wasPlayingBeforeDrag ? "playing" : "paused");
        }, 300);
      });
      
      this.slider.addEventListener('mouseup', (e) => {
        setTimeout(() => {
          this.isDraggingSlider = false;
          if (wasPlayingBeforeDrag) {
            this.isPlaying = true;
          }
          console.log("Finalizou arraste do slider - restaurando estado:", wasPlayingBeforeDrag ? "playing" : "paused");
        }, 100);
      });
      
      this.slider.addEventListener('mousemove', (e) => {
        e.stopPropagation();
      });
      
      // Para dispositivos touch
      this.slider.addEventListener('touchstart', (e) => {
        this.isDraggingSlider = true;
        wasPlayingBeforeDrag = this.isPlaying;
        this.isPlaying = false;
      });
      
      this.slider.addEventListener('touchend', (e) => {
        setTimeout(() => {
          this.isDraggingSlider = false;
          if (wasPlayingBeforeDrag) {
            this.isPlaying = true;
          }
        }, 100);
      });
    }
  }
  
  togglePlayPause() {
    this.isPlaying = !this.isPlaying;
    if (this.playPauseBtn) {
      this.playPauseBtn.textContent = this.isPlaying ? 'Pausar' : 'Reproduzir';
    }
    if (this.uiCallbacks.onPlayPauseChange) {
      this.uiCallbacks.onPlayPauseChange(this.isPlaying);
    }
  }
  
  reset() {
    this.currentDate = new Date(this.startDate);
    if (this.slider) {
      this.slider.value = 0;
    }
    this.updateDisplay();
  }
  
  setTimeByPercentage(percentage) {
    const totalDuration = this.endDate.getTime() - this.startDate.getTime();
    const newTime = this.startDate.getTime() + (totalDuration * percentage / 100);
    this.currentDate = new Date(newTime);
    
    // Garantir que está dentro dos limites
    if (this.currentDate.getTime() > this.endDate.getTime()) {
      this.currentDate = new Date(this.endDate);
    }
    if (this.currentDate.getTime() < this.startDate.getTime()) {
      this.currentDate = new Date(this.startDate);
    }
    
    this.updateDisplay();
  }
  
  getCurrentTimePercentage() {
    const totalDuration = this.endDate.getTime() - this.startDate.getTime();
    const currentDuration = this.currentDate.getTime() - this.startDate.getTime();
    return Math.max(0, Math.min(100, (currentDuration / totalDuration) * 100));
  }
  
  update(deltaTime) {
    if (!this.isPlaying || this.isDraggingSlider) return;
    
    // Avançar o tempo baseado na velocidade de simulação
    const millisecondsToAdd = deltaTime * this.realTimeScale * this.timeSpeed * 24 * 60 * 60 * 1000; // deltaTime em segundos -> dias -> milissegundos
    this.currentDate.setTime(this.currentDate.getTime() + millisecondsToAdd);
    
    // Verificar se chegamos ao fim do período
    if (this.currentDate.getTime() > this.endDate.getTime()) {
      this.currentDate = new Date(this.endDate);
      this.isPlaying = false;
      if (this.playPauseBtn) {
        this.playPauseBtn.textContent = 'Reproduzir';
      }
    }
    
    // Verificar se voltamos ao início (caso o tempo seja revertido)
    if (this.currentDate.getTime() < this.startDate.getTime()) {
      this.currentDate = new Date(this.startDate);
    }
    
    this.updateDisplay();
  }
  
  updateDisplay() {
    const percentage = this.getCurrentTimePercentage();
    
    // Atualizar slider apenas se não estiver sendo arrastado
    // e se a diferença for significativa (evita conflitos)
    if (this.slider && !this.isDraggingSlider) {
      const currentSliderValue = parseFloat(this.slider.value);
      const diff = Math.abs(currentSliderValue - percentage);
      
      // Só atualizar se a diferença for maior que 0.1%
      if (diff > 0.1) {
        this.slider.value = percentage;
      }
    }
    
    // Atualizar display da data atual
    const formattedDate = this.formatDate(this.currentDate);
    if (this.currentDateDisplay) {
      this.currentDateDisplay.textContent = formattedDate;
    }
    
    // Chamar callback de UI se existir
    if (this.uiCallbacks.onUpdateDisplay) {
      this.uiCallbacks.onUpdateDisplay({
        percentage: percentage,
        formattedDate: formattedDate,
        currentDate: new Date(this.currentDate)
      });
    }
  }
  
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // Método para obter o tempo normalizado (0-1) para usar nos cálculos de órbita
  getNormalizedTime() {
    const totalDuration = this.endDate.getTime() - this.startDate.getTime();
    const currentDuration = this.currentDate.getTime() - this.startDate.getTime();
    return currentDuration / totalDuration;
  }
  
  // Método para obter o tempo em anos desde o início da simulação
  getYearsSinceStart() {
    const millisecondsPerYear = 365.25 * 24 * 60 * 60 * 1000;
    const timeDifference = this.currentDate.getTime() - this.startDate.getTime();
    return timeDifference / millisecondsPerYear;
  }
  
  // Método para obter informações detalhadas do tempo atual
  getTimeInfo() {
    return {
      currentDate: new Date(this.currentDate),
      startDate: new Date(this.startDate),
      endDate: new Date(this.endDate),
      percentage: this.getCurrentTimePercentage(),
      yearsSinceStart: this.getYearsSinceStart(),
      isPlaying: this.isPlaying,
      timeSpeed: this.timeSpeed
    };
  }
  
  // Método para definir uma data específica
  setDate(date) {
    if (date instanceof Date) {
      this.currentDate = new Date(Math.max(this.startDate.getTime(), 
                                        Math.min(this.endDate.getTime(), date.getTime())));
      this.updateDisplay();
    }
  }
  
  // Método para adicionar/subtrair tempo
  addTime(days) {
    const millisecondsToAdd = days * 24 * 60 * 60 * 1000;
    this.currentDate.setTime(this.currentDate.getTime() + millisecondsToAdd);
    
    // Manter dentro dos limites
    if (this.currentDate.getTime() > this.endDate.getTime()) {
      this.currentDate = new Date(this.endDate);
    }
    if (this.currentDate.getTime() < this.startDate.getTime()) {
      this.currentDate = new Date(this.startDate);
    }
    
    this.updateDisplay();
  }
}

export default Timeline;
