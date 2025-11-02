/**
 * Универсальная оптимизированная система звуков для всех устройств
 * Работает на ПК, мобильных и планшетах
 */
class UniversalSoundSystem {
constructor() {
    this.audioContext = null;
    this.sounds = {};
    this.muted = false;
    this.initialized = false;
    this.cache = new Map();
    this.mobileUnlocked = false;
    this.globalVolume = 0.7;
    
    // Флаг для отслеживания попыток инициализации
    this.initializationAttempted = false;
    
    this.init();
}
    
    init() {
        console.log('🎵 Инициализация универсальной звуковой системы');
        
        // Создаем простые звуки как fallback
        this.createFallbackSounds();
        this.initialized = true;
        
        // Пытаемся инициализировать продвинутую систему
        this.setupAdvancedAudio();
    }
    
setupAdvancedAudio() {
    // Предотвращаем множественные попытки инициализации
    if (this.initializationAttempted && this.audioContext) return;
    this.initializationAttempted = true;
    
    const unlockAudio = () => {
        if (this.mobileUnlocked && this.audioContext) return;
        
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                console.log('🎵 Web Audio API инициализирован');
            }
            
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume().then(() => {
                    console.log('🔊 Аудио контекст возобновлен');
                }).catch(error => {
                    console.warn('Не удалось возобновить аудио контекст:', error);
                });
            }
            
            this.createOptimizedSounds();
            this.mobileUnlocked = true;
            
            console.log('✅ Аудио система готова к работе');
            
        } catch (e) {
            console.warn('❌ Web Audio API не поддерживается, используется упрощенный режим:', e);
        }
    };
    
    // Запускаем разблокировку
    unlockAudio();
}

    
    createFallbackSounds() {
        console.log('🔊 Создание универсальных звуков');
        
        // Простые звуки, которые работают везде
        this.sounds = {
            shoot: () => this.playFallbackSound(150, 0.15, 'sine', 0.2),
            explosion: () => this.playFallbackSound(100, 0.3, 'sawtooth', 0.3, 20),
            bonus: () => this.playBonusSound(),
            hit: () => this.playFallbackSound(200, 0.08, 'square', 0.3, 50),
            move: () => this.playFallbackSound(80, 0.04, 'triangle', 0.08)
        };
    }
    
    createOptimizedSounds() {
        if (!this.audioContext) return;
        
        console.log('🎛️ Создание оптимизированных звуков');
        
        // Заменяем простые звуки на оптимизированные
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
            if (this.muted || !this.initialized) return;
            
            // Если нет аудио контекста, используем fallback
            if (!this.audioContext) {
                this.playFallbackSound(frequency, duration, type, volume, endFrequency);
                return;
            }
            
            try {
                // Проверяем состояние контекста
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume().catch(() => {
                        // Если не удалось возобновить, используем fallback
                        this.playFallbackSound(frequency, duration, type, volume, endFrequency);
                        return;
                    });
                }
                
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.type = type;
                oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                
                if (endFrequency) {
                    oscillator.frequency.exponentialRampToValueAtTime(
                        endFrequency, 
                        this.audioContext.currentTime + duration
                    );
                }
                
                const actualVolume = volume * this.globalVolume;
                gainNode.gain.setValueAtTime(actualVolume, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(
                    0.001, 
                    this.audioContext.currentTime + duration
                );
                
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + duration);
                
            } catch (error) {
                console.warn('Ошибка воспроизведения звука, используется fallback:', error);
                this.playFallbackSound(frequency, duration, type, volume, endFrequency);
            }
        };
    }
    
    createSequenceSound(sequence, volume = 0.3) {
        return () => {
            if (this.muted || !this.initialized) return;
            
            // Если нет аудио контекста, используем простой звук
            if (!this.audioContext) {
                this.playFallbackSound(523.25, 0.2, 'sine', volume);
                return;
            }
            
            try {
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                }
                
                let currentTime = this.audioContext.currentTime;
                const actualVolume = volume * this.globalVolume;
                
                sequence.forEach((note, index) => {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(note.freq, currentTime);
                    
                    gainNode.gain.setValueAtTime(actualVolume, currentTime);
                    
                    if (index === sequence.length - 1) {
                        gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + note.duration);
                    } else {
                        gainNode.gain.setValueAtTime(actualVolume, currentTime + note.duration - 0.02);
                        gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + note.duration);
                    }
                    
                    oscillator.start(currentTime);
                    oscillator.stop(currentTime + note.duration);
                    
                    currentTime += note.duration;
                });
                
            } catch (error) {
                console.warn('Ошибка последовательности звуков:', error);
                this.playFallbackSound(523.25, 0.2, 'sine', volume);
            }
        };
    }
    
    playFallbackSound(frequency, duration, type = 'sine', volume = 0.3, endFrequency = null) {
        // Максимально простой fallback для устройств без Web Audio API
        try {
            if (!this.audioContext) {
                // Создаем временный аудио контекст для fallback
                const tempContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = tempContext.createOscillator();
                const gainNode = tempContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(tempContext.destination);
                
                oscillator.type = type;
                oscillator.frequency.value = frequency;
                
                const actualVolume = volume * this.globalVolume;
                gainNode.gain.value = actualVolume;
                
                oscillator.start();
                oscillator.stop(tempContext.currentTime + duration);
                
                // Закрываем временный контекст после воспроизведения
                setTimeout(() => {
                    tempContext.close();
                }, duration * 1000 + 100);
                
            }
        } catch (error) {
            // Если даже fallback не работает, просто игнорируем звук
            console.log('🔇 Звук недоступен на этом устройстве');
        }
    }
    
    playBonusSound() {
        // Простой звук бонуса для fallback
        this.playFallbackSound(523.25, 0.2, 'sine', 0.3);
    }
    
    play(soundName) {
        if (!this.initialized) {
            console.warn('Звуковая система не инициализирована');
            return;
        }
        
        if (this.muted) return;
        
        const soundFunction = this.sounds[soundName];
        if (!soundFunction) {
            console.warn(`Звук "${soundName}" не найден`);
            return;
        }

        try {
            soundFunction();
        } catch (error) {
            console.warn(`Ошибка воспроизведения "${soundName}":`, error);
        }
    }
    
    toggleMute() {
        this.muted = !this.muted;
        
        if (this.muted) {
            console.log('🔇 Звук отключен');
        } else {
            console.log('🔊 Звук включен');
            // При включении звука пытаемся разблокировать аудио
            this.setupAdvancedAudio();
        }
        
        return !this.muted;
    }
    
    setVolume(volume) {
        this.globalVolume = Math.max(0, Math.min(1, volume));
    }
    
    getVolume() {
        return this.globalVolume;
    }
    
    isMuted() {
        return this.muted;
    }
    
    isInitialized() {
        return this.initialized;
    }
    
    clearCache() {
        this.cache.clear();
    }
    
    // Методы для управления аудио контекстом
    suspend() {
        if (this.audioContext && this.audioContext.state === 'running') {
            this.audioContext.suspend().catch(() => {});
        }
    }
    
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume().catch(() => {});
        }
    }
    unlockAudioForMobile() {
    this.setupAdvancedAudio();
}
}

// Создаем глобальный экземпляр системы звуков
const soundSystem = new UniversalSoundSystem();

// Автоматическое управление аудио контекстом при изменении видимости страницы
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        soundSystem.suspend();
    } else {
        soundSystem.resume();
    }
});

// Утилиты для работы со звуком
const SoundUtils = {
    playDelayed(soundName, delayMs) {
        setTimeout(() => soundSystem.play(soundName), delayMs);
    },
    
    playRandom(soundNames) {
        const randomSound = soundNames[Math.floor(Math.random() * soundNames.length)];
        soundSystem.play(randomSound);
    }
};

// Автоматическая инициализация при загрузке
window.addEventListener('load', () => {
    console.log('🚀 Страница загружена, звуковая система активирована');
});