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
    
    // Eventos astronômicos importantes para destacar na timeline
    this.astronomicalEvents = this.generateAstronomicalEvents();
    
    // Elementos DOM
    this.slider = document.getElementById('timeline-slider');
    this.playPauseBtn = document.getElementById('timeline-play-pause');
    this.resetBtn = document.getElementById('timeline-reset');
    this.speedSelect = document.getElementById('timeline-speed');
    this.currentDateDisplay = document.getElementById('current-date');
    
    this.initEventListeners();
    this.updateDisplay();
    this.highlightNearbyEvents();
  }
  
  setUICallbacks(callbacks) {
    this.uiCallbacks = { ...this.uiCallbacks, ...callbacks };
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
      this.slider.addEventListener('input', (e) => {
        const percentage = parseFloat(e.target.value);
        this.setTimeByPercentage(percentage);
      });
      
      // Prevent slider from affecting camera when dragging
      this.slider.addEventListener('mousedown', (e) => {
        e.stopPropagation();
      });
      
      this.slider.addEventListener('mousemove', (e) => {
        e.stopPropagation();
      });
    }
  }
  
  togglePlayPause() {
    this.isPlaying = !this.isPlaying;
    if (this.playPauseBtn) {
      this.playPauseBtn.textContent = this.isPlaying ? '⏸️ Pausar' : '▶️ Reproduzir';
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
    this.updateDisplay();
  }
  
  getCurrentTimePercentage() {
    const totalDuration = this.endDate.getTime() - this.startDate.getTime();
    const currentDuration = this.currentDate.getTime() - this.startDate.getTime();
    return Math.max(0, Math.min(100, (currentDuration / totalDuration) * 100));
  }
  
  update(deltaTime) {
    if (!this.isPlaying) return;
    
    // Avançar o tempo baseado na velocidade de simulação
    const millisecondsToAdd = deltaTime * this.realTimeScale * this.timeSpeed * 24 * 60 * 60 * 1000; // deltaTime em segundos -> dias -> milissegundos
    this.currentDate.setTime(this.currentDate.getTime() + millisecondsToAdd);
    
    // Verificar se chegamos ao fim do período
    if (this.currentDate.getTime() > this.endDate.getTime()) {
      this.currentDate = new Date(this.endDate);
      this.isPlaying = false;
      if (this.playPauseBtn) {
        this.playPauseBtn.textContent = '▶️ Reproduzir';
      }
    }
    
    // Verificar se voltamos ao início (caso o tempo seja revertido)
    if (this.currentDate.getTime() < this.startDate.getTime()) {
      this.currentDate = new Date(this.startDate);
    }
    
    this.updateDisplay();
    this.highlightNearbyEvents();
  }
  
  updateDisplay() {
    // Atualizar slider
    const percentage = this.getCurrentTimePercentage();
    if (this.slider) {
      this.slider.value = percentage;
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
  
  // Gerar eventos astronômicos importantes baseados no período da simulação
  generateAstronomicalEvents() {
    const events = [];
    
    // Eventos conhecidos entre 1965-2035
    const knownEvents = [
      { date: new Date('1969-07-20'), name: 'Apollo 11 - Primeira chegada à Lua', type: 'mission' },
      { date: new Date('1970-04-17'), name: 'Apollo 13 retorna à Terra após emergência', type: 'mission' },
      { date: new Date('1975-07-17'), name: 'Missão Apollo-Soyuz', type: 'mission' },
      { date: new Date('1977-08-20'), name: 'Lançamento da Voyager 2', type: 'mission' },
      { date: new Date('1977-09-05'), name: 'Lançamento da Voyager 1', type: 'mission' },
      { date: new Date('1981-04-12'), name: 'Primeiro voo do Space Shuttle', type: 'mission' },
      { date: new Date('1986-02-09'), name: 'Passagem do Cometa Halley', type: 'comet' },
      { date: new Date('1989-08-25'), name: 'Voyager 2 passa por Netuno', type: 'mission' },
      { date: new Date('1990-02-14'), name: 'Voyager 1 - "Pale Blue Dot"', type: 'mission' },
      { date: new Date('1994-07-16'), name: 'Impacto do Cometa Shoemaker-Levy 9 em Júpiter', type: 'impact' },
      { date: new Date('1997-04-01'), name: 'Passagem do Cometa Hale-Bopp', type: 'comet' },
      { date: new Date('2003-08-27'), name: 'Marte mais próximo da Terra em 60.000 anos', type: 'opposition' },
      { date: new Date('2004-06-08'), name: 'Trânsito de Vênus', type: 'transit' },
      { date: new Date('2006-08-24'), name: 'Plutão reclassificado como planeta anão', type: 'reclassification' },
      { date: new Date('2012-06-05'), name: 'Trânsito de Vênus', type: 'transit' },
      { date: new Date('2015-07-14'), name: 'New Horizons passa por Plutão', type: 'mission' },
      { date: new Date('2020-07-30'), name: 'Lançamento do Mars Perseverance Rover', type: 'mission' },
      { date: new Date('2024-04-08'), name: 'Eclipse Solar Total nos EUA', type: 'eclipse' },
      { date: new Date('2029-04-13'), name: 'Asteroide Apophis passa próximo à Terra', type: 'asteroid' }
    ];
    
    // Filtrar eventos que estão no período da simulação
    return knownEvents.filter(event => 
      event.date >= this.startDate && event.date <= this.endDate
    );
  }
  
  // Destacar eventos próximos ao tempo atual
  highlightNearbyEvents() {
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
    const nearbyEvents = this.astronomicalEvents.filter(event => {
      const timeDiff = Math.abs(event.date.getTime() - this.currentDate.getTime());
      return timeDiff <= thirtyDaysInMs;
    });
    
    // Chamar callback de UI se existir
    if (this.uiCallbacks.onEventUpdate) {
      this.uiCallbacks.onEventUpdate(nearbyEvents, this.currentDate);
    }
  }
  
  // Método para gerar mensagem de evento
  getEventMessage(event, currentDate) {
    const daysDiff = Math.round((event.date.getTime() - currentDate.getTime()) / (24 * 60 * 60 * 1000));
    
    if (daysDiff === 0) {
      return `🌟 HOJE: ${event.name}`;
    } else if (daysDiff > 0) {
      return `🔮 Em ${daysDiff} dias: ${event.name}`;
    } else {
      return `📅 Há ${Math.abs(daysDiff)} dias: ${event.name}`;
    }
  }
}

export default Timeline;
