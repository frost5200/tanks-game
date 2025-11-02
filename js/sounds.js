// Оптимизированная система звуков для игры
class SoundSystem {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.muted = false;
        this.initialized = false;
        this.cache = new Map(); // Кэш для повторяющихся звуков
        
        // Инициализация при первом взаимодействии с пользователем
        this.init();
    }
    
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.createOptimizedSounds();
            this.initialized = true;
        } catch (e) {
            console.warn("Web Audio API не поддерживается:", e);
        }
    }
    
    createOptimizedSounds() {
        // Оптимизированный звук выстрела
        this.sounds.shoot = this.createOptimizedSound(150, 0.2, 'sine', 0.3);
        
        // Оптимизированный звук взрыва
        this.sounds.explosion = this.createOptimizedSound(100, 0.5, 'sawtooth', 0.5, 20);
        
        // Оптимизированный звук бонуса
        this.sounds.bonus = this.createSequenceSound([
            { freq: 523.25, duration: 0.1 }, // C5
            { freq: 659.25, duration: 0.1 }, // E5
            { freq: 783.99, duration: 0.3 }  // G5
        ], 0.3);
        
        // Оптимизированный звук попадания
        this.sounds.hit = this.createOptimizedSound(200, 0.1, 'square', 0.4, 50);
        
        // Оптимизированный звук движения
        this.sounds.move = this.createOptimizedSound(80, 0.05, 'triangle', 0.1);
    }
    
    createOptimizedSound(frequency, duration, type = 'sine', volume = 0.3, endFrequency = null) {
        return () => {
            if (!this.audioContext || this.muted) return;
            
            // Проверяем кэш
            const cacheKey = `${frequency}-${duration}-${type}-${volume}`;
            if (this.cache.has(cacheKey)) {
                try {
                    const cachedSound = this.cache.get(cacheKey);
                    const newOscillator = this.audioContext.createOscillator();
                    const newGain = this.audioContext.createGain();
                    
                    newOscillator.connect(newGain);
                    newGain.connect(this.audioContext.destination);
                    
                    newOscillator.type = cachedSound.type;
                    newOscillator.frequency.setValueAtTime(cachedSound.frequency, this.audioContext.currentTime);
                    
                    if (cachedSound.endFrequency) {
                        newOscillator.frequency.exponentialRampToValueAtTime(
                            cachedSound.endFrequency, 
                            this.audioContext.currentTime + cachedSound.duration
                        );
                    }
                    
                    newGain.gain.setValueAtTime(cachedSound.volume, this.audioContext.currentTime);
                    newGain.gain.exponentialRampToValueAtTime(
                        0.001, 
                        this.audioContext.currentTime + cachedSound.duration
                    );
                    
                    newOscillator.start(this.audioContext.currentTime);
                    newOscillator.stop(this.audioContext.currentTime + cachedSound.duration);
                    
                    return;
                } catch (e) {
                    console.warn("Ошибка воспроизведения кэшированного звука:", e);
                }
            }
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = type;
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            
            if (endFrequency) {
                oscillator.frequency.exponentialRampToValueAtTime(endFrequency, this.audioContext.currentTime + duration);
            }
            
            gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
            
            // Сохраняем параметры в кэш для повторного использования
            this.cache.set(cacheKey, {
                type: type,
                frequency: frequency,
                duration: duration,
                volume: volume,
                endFrequency: endFrequency
            });
        };
    }
    
    createSequenceSound(sequence, volume = 0.3) {
        return () => {
            if (!this.audioContext || this.muted) return;
            
            let currentTime = this.audioContext.currentTime;
            
            sequence.forEach((note, index) => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(note.freq, currentTime);
                
                gainNode.gain.setValueAtTime(volume, currentTime);
                
                // Плавное затухание в конце последовательности
                if (index === sequence.length - 1) {
                    gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + note.duration);
                } else {
                    gainNode.gain.setValueAtTime(volume, currentTime + note.duration - 0.02);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + note.duration);
                }
                
                oscillator.start(currentTime);
                oscillator.stop(currentTime + note.duration);
                
                currentTime += note.duration;
            });
        };
    }
    
    play(soundName) {
        if (this.sounds[soundName] && this.initialized && !this.muted) {
            try {
                // Восстанавливаем контекст если он приостановлен
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                }
                this.sounds[soundName]();
            } catch (e) {
                console.warn("Ошибка воспроизведения звука:", e);
            }
        }
    }
    
    toggleMute() {
        this.muted = !this.muted;
        return !this.muted;
    }
    
    isMuted() {
        return this.muted;
    }
    
    // Очистка кэша
    clearCache() {
        this.cache.clear();
    }
}

// Глобальная система звуков
const soundSystem = new SoundSystem();