// Оптимизированная система звуков для мобильных устройств
class SoundSystem {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.muted = false;
        this.initialized = false;
        this.cache = new Map();
        this.mobileUnlocked = false;
        
        this.init();
    }
    
    init() {
        // На мобильных устройствах требуется пользовательское взаимодействие
        this.setupMobileAudio();
    }
    
    setupMobileAudio() {
        // Функция для разблокировки аудио на мобильных устройствах
        const unlockAudio = () => {
            if (this.mobileUnlocked) return;
            
            try {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.createOptimizedSounds();
                this.initialized = true;
                this.mobileUnlocked = true;
                
                // Воспроизводим тихий звук для разблокировки
                const buffer = this.audioContext.createBuffer(1, 1, 22050);
                const source = this.audioContext.createBufferSource();
                source.buffer = buffer;
                source.connect(this.audioContext.destination);
                source.start(0);
                
                console.log('Аудио система разблокирована для мобильных устройств');
            } catch (e) {
                console.warn("Web Audio API не поддерживается:", e);
            }
        };
        
        // Разблокируем аудио при первом касании
        document.addEventListener('touchstart', unlockAudio, { once: true });
        document.addEventListener('click', unlockAudio, { once: true });
    }
    
    createOptimizedSounds() {
        // Оптимизированные звуки для мобильных устройств
        this.sounds.shoot = this.createOptimizedSound(150, 0.15, 'sine', 0.2);
        this.sounds.explosion = this.createOptimizedSound(100, 0.3, 'sawtooth', 0.3, 20);
        this.sounds.bonus = this.createSequenceSound([
            { freq: 523.25, duration: 0.08 },
            { freq: 659.25, duration: 0.08 },
            { freq: 783.99, duration: 0.2 }
        ], 0.2);
        this.sounds.hit = this.createOptimizedSound(200, 0.08, 'square', 0.3, 50);
        this.sounds.move = this.createOptimizedSound(80, 0.04, 'triangle', 0.08);
    }
    
    createOptimizedSound(frequency, duration, type = 'sine', volume = 0.3, endFrequency = null) {
        return () => {
            if (!this.audioContext || this.muted || !this.initialized) return;
            
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
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
            if (!this.audioContext || this.muted || !this.initialized) return;
            
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            let currentTime = this.audioContext.currentTime;
            
            sequence.forEach((note, index) => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(note.freq, currentTime);
                
                gainNode.gain.setValueAtTime(volume, currentTime);
                
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
    
    clearCache() {
        this.cache.clear();
    }
}

const soundSystem = new SoundSystem();