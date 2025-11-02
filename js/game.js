// Основные переменные игры
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Элементы интерфейса
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const levelElement = document.getElementById('level');
const enemiesElement = document.getElementById('enemies');
const gameOverScreen = document.getElementById('gameOverScreen');
const finalScoreElement = document.getElementById('finalScore');
const restartButton = document.getElementById('restartButton');
const pauseScreen = document.getElementById('pauseScreen');
const soundToggle = document.getElementById('soundToggle');
const levelCompleteScreen = document.getElementById('levelCompleteScreen');
const nextLevelButton = document.getElementById('nextLevelButton');
const completedLevelElement = document.getElementById('completedLevel');
const levelScoreElement = document.getElementById('levelScore');
const difficultyBadge = document.getElementById('difficultyBadge');
const continueButton = document.getElementById('continueButton');

// Экраны
const mainMenu = document.getElementById('mainMenu');
const gameScreen = document.getElementById('gameScreen');
const controlsScreen = document.getElementById('controlsScreen');
const aboutScreen = document.getElementById('aboutScreen');
const difficultyScreen = document.getElementById('difficultyScreen');
const graphicsScreen = document.getElementById('graphicsScreen');

// Кнопки меню
const startButton = document.getElementById('startButton');
const controlsButton = document.getElementById('controlsButton');
const aboutButton = document.getElementById('aboutButton');
const difficultyButton = document.getElementById('difficultyButton');
const graphicsButton = document.getElementById('graphicsButton');
const backFromControls = document.getElementById('backFromControls');
const backFromAbout = document.getElementById('backFromAbout');
const backFromDifficulty = document.getElementById('backFromDifficulty');
const backFromGraphics = document.getElementById('backFromGraphics');
const menuButton = document.getElementById('menuButton');
const menuFromPauseButton = document.getElementById('menuFromPauseButton');

// Кнопки сложности
const easyButton = document.getElementById('easyButton');
const normalButton = document.getElementById('normalButton');
const hardButton = document.getElementById('hardButton');
const expertButton = document.getElementById('expertButton');
const enemySpeedStat = document.getElementById('enemySpeedStat');
const enemyShootStat = document.getElementById('enemyShootStat');
const enemyCountStat = document.getElementById('enemyCountStat');
const bonusChanceStat = document.getElementById('bonusChanceStat');

// Кнопки графики
const applyGraphics = document.getElementById('applyGraphics');
const resetGraphics = document.getElementById('resetGraphics');

// Конфигурация уровней сложности
const DIFFICULTY_LEVELS = {
    easy: {
        name: "ЛЁГКАЯ",
        enemySpeed: 1.0,
        enemyShootChance: 0.01,
        initialEnemies: 3,
        enemyIncrement: 1,
        bonusChance: 0.4,
        playerSpeed: 3.5,
        playerLives: 4,
        color: "#0f0"
    },
    normal: {
        name: "НОРМАЛЬНАЯ",
        enemySpeed: 1.5,
        enemyShootChance: 0.02,
        initialEnemies: 5,
        enemyIncrement: 2,
        bonusChance: 0.3,
        playerSpeed: 3.0,
        playerLives: 3,
        color: "#ff0"
    },
    hard: {
        name: "СЛОЖНАЯ",
        enemySpeed: 2.0,
        enemyShootChance: 0.03,
        initialEnemies: 7,
        enemyIncrement: 3,
        bonusChance: 0.2,
        playerSpeed: 2.5,
        playerLives: 2,
        color: "#ff8000"
    },
    expert: {
        name: "ЭКСПЕРТ",
        enemySpeed: 2.5,
        enemyShootChance: 0.04,
        initialEnemies: 10,
        enemyIncrement: 4,
        bonusChance: 0.1,
        playerSpeed: 2.0,
        playerLives: 1,
        color: "#f00"
    }
};

// Настройки графики
const GRAPHICS_SETTINGS = {
    explosions: true,
    particleDensity: 'medium', // 'low', 'medium', 'high'
    screenShake: true,
    renderDistance: 'high', // 'low', 'medium', 'high'
    frameRateTarget: 60, // 30, 60, 0 (unlimited)
    lowSpecMode: false
};

// Константы игры
const TANK_SPEED = 3;
const BULLET_SPEED = 7;
const CANNON_RECOIL = 5;
const CANNON_RECOVERY = 0.5;

// Цвета
const BLACK = '#000';
const WHITE = '#fff';
const GREEN = '#0f0';
const RED = '#f00';
const BLUE = '#00f';
const GRAY = '#888';
const BROWN = '#8B4513';
const DARK_GREEN = '#006400';
const YELLOW = '#ff0';
const ORANGE = '#ffa500';
const PURPLE = '#800080';

// Игровые объекты
let player = null;
let bullets = [];
let enemies = [];
let walls = [];
let explosions = [];
let bonuses = [];
let gameOver = false;
let gamePaused = false;
let score = 0;
let playerLives = 3;
let gameLevel = 1;
let enemiesToKill = 5;
let lastBonusTime = 0;
let bonusNotifications = [];
let lastMoveSound = 0;
let currentDifficulty = 'normal';

// Оптимизация производительности
let lastUpdateTime = 0;
let UPDATE_INTERVAL = 1000 / 60; // 60 FPS
let frameCount = 0;
let lastFpsUpdate = 0;
let currentFPS = 0;

// Пространственное разделение для оптимизации коллизий
class SpatialHash {
    constructor(cellSize) {
        this.cellSize = cellSize;
        this.grid = new Map();
    }
    
    getCellKey(x, y) {
        return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`;
    }
    
    insert(object) {
        const key = this.getCellKey(object.x, object.y);
        if (!this.grid.has(key)) {
            this.grid.set(key, []);
        }
        this.grid.get(key).push(object);
    }
    
    getNearby(x, y) {
        const keys = [];
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                keys.push(this.getCellKey(x + dx * this.cellSize, y + dy * this.cellSize));
            }
        }
        
        const nearby = [];
        keys.forEach(key => {
            if (this.grid.has(key)) {
                nearby.push(...this.grid.get(key));
            }
        });
        return nearby;
    }
    
    clear() {
        this.grid.clear();
    }
}

const spatialHash = new SpatialHash(100);

// Класс для управления настройками графики
class GraphicsSettings {
    constructor() {
        this.loadSettings();
    }
    
    loadSettings() {
        const saved = localStorage.getItem('tankGraphicsSettings');
        if (saved) {
            Object.assign(GRAPHICS_SETTINGS, JSON.parse(saved));
        }
        this.applySettings();
    }
    
    saveSettings() {
        localStorage.setItem('tankGraphicsSettings', JSON.stringify(GRAPHICS_SETTINGS));
    }
    
    setSetting(key, value) {
        GRAPHICS_SETTINGS[key] = value;
        this.saveSettings();
        this.applySettings();
    }
    
    applySettings() {
        // Применяем настройки FPS
        if (GRAPHICS_SETTINGS.frameRateTarget === 0) {
            UPDATE_INTERVAL = 1000 / 144; // 144 FPS максимум
        } else {
            UPDATE_INTERVAL = 1000 / GRAPHICS_SETTINGS.frameRateTarget;
        }
    }
    
    getParticleLimit() {
        switch(GRAPHICS_SETTINGS.particleDensity) {
            case 'low': return 10;
            case 'medium': return 25;
            case 'high': return 50;
            default: return 25;
        }
    }
    
    getScreenShakeIntensity() {
        return GRAPHICS_SETTINGS.screenShake ? 1 : 0;
    }
}

const graphicsSettings = new GraphicsSettings();

// Функция проверки видимости объекта
function isVisible(object) {
    return object.x < canvas.width && 
           object.x + object.width > 0 &&
           object.y < canvas.height &&
           object.y + object.height > 0;
}

// Улучшенный класс взрыва
class EnhancedExplosion {
    constructor(x, y, size = 1, type = 'normal') {
        this.x = x;
        this.y = y;
        this.size = size;
        this.type = type;
        this.life = 1.0;
        this.stage = 0; // 0: growing, 1: sustain, 2: fading
        this.particles = [];
        this.lightFlash = 1.0;
        this.screenShake = 0;
        
        this.initExplosion();
        
        if (GRAPHICS_SETTINGS.explosions) {
            soundSystem.play('explosion');
        }
    }
    
    initExplosion() {
        if (!GRAPHICS_SETTINGS.explosions) return;
        
        const particleLimit = graphicsSettings.getParticleLimit();
        
        // Основной взрыв
        this.radius = 10 * this.size;
        this.maxRadius = 40 * this.size;
        this.growing = true;
        
        // Создаем частицы в зависимости от настроек
        const baseParticles = Math.min(15 * this.size, particleLimit);
        
        for (let i = 0; i < baseParticles; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            const life = 0.8 + Math.random() * 0.4;
            
            this.particles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: life,
                maxLife: life,
                size: 1 + Math.random() * 3,
                color: this.getParticleColor(),
                type: 'debris'
            });
        }
        
        // Добавляем дополнительные эффекты для больших взрывов
        if (this.size > 1) {
            // Вспышка света
            this.lightFlash = 1.0;
            
            // Сотрясение экрана
            this.screenShake = 5 * this.size * graphicsSettings.getScreenShakeIntensity();
            
            // Дополнительные частицы для больших взрывов
            const extraParticles = Math.min(10 * this.size, particleLimit / 2);
            for (let i = 0; i < extraParticles; i++) {
                this.particles.push({
                    x: this.x,
                    y: this.y,
                    vx: (Math.random() - 0.5) * 8,
                    vy: (Math.random() - 0.5) * 8,
                    life: 1.2 + Math.random() * 0.8,
                    maxLife: 1.2 + Math.random() * 0.8,
                    size: 2 + Math.random() * 4,
                    color: this.getSecondaryColor(),
                    type: 'fire'
                });
            }
        }
    }
    
    getParticleColor() {
        const colors = [
            '#FFA500', '#FF4500', '#FFFF00', '#FF6347'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    getSecondaryColor() {
        const colors = [
            '#FF0000', '#FF8C00', '#DC143C', '#B22222'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    update() {
        if (!GRAPHICS_SETTINGS.explosions) return false;
        
        // Обновляем основную фазу взрыва
        if (this.growing) {
            this.radius += 3;
            if (this.radius >= this.maxRadius) {
                this.growing = false;
                this.stage = 1;
            }
        } else if (this.stage === 1) {
            // Фаза поддержания
            this.life -= 0.02;
            if (this.life <= 0.7) {
                this.stage = 2;
            }
        } else if (this.stage === 2) {
            // Фаза затухания
            this.life -= 0.03;
        }
        
        // Обновляем частицы
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            // Физика частиц
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.1; // гравитация
            
            p.life -= 0.02;
            p.vx *= 0.97;
            p.vy *= 0.97;
            
            // Уменьшаем размер со временем
            p.size *= 0.98;
            
            if (p.life <= 0 || p.size < 0.1) {
                this.particles.splice(i, 1);
            }
        }
        
        // Обновляем вспышку света
        this.lightFlash *= 0.9;
        
        // Обновляем сотрясение экрана
        this.screenShake *= 0.8;
        
        return this.life > 0 || this.particles.length > 0 || this.screenShake > 0.1;
    }
    
    draw() {
        if (!GRAPHICS_SETTINGS.explosions) return;
        
        const alpha = this.life;
        
        // Рисуем основной взрыв
        if (this.growing || this.life > 0) {
            const gradient = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.radius
            );
            
            if (this.type === 'normal') {
                gradient.addColorStop(0, `rgba(255, 255, 0, ${alpha * 0.8})`);
                gradient.addColorStop(0.3, `rgba(255, 165, 0, ${alpha * 0.6})`);
                gradient.addColorStop(0.6, `rgba(255, 69, 0, ${alpha * 0.4})`);
                gradient.addColorStop(1, `rgba(255, 0, 0, 0)`);
            } else {
                gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.9})`);
                gradient.addColorStop(0.2, `rgba(255, 255, 0, ${alpha * 0.7})`);
                gradient.addColorStop(0.5, `rgba(255, 69, 0, ${alpha * 0.5})`);
                gradient.addColorStop(1, `rgba(139, 0, 0, 0)`);
            }
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Рисуем частицы
        for (const p of this.particles) {
            const particleAlpha = p.life / p.maxLife;
            
            if (p.type === 'fire') {
                const gradient = ctx.createRadialGradient(
                    p.x, p.y, 0,
                    p.x, p.y, p.size
                );
                gradient.addColorStop(0, `rgba(255, 255, 0, ${particleAlpha})`);
                gradient.addColorStop(0.7, `rgba(255, 69, 0, ${particleAlpha * 0.7})`);
                gradient.addColorStop(1, `rgba(139, 0, 0, 0)`);
                
                ctx.fillStyle = gradient;
            } else {
                ctx.fillStyle = p.color + Math.floor(particleAlpha * 255).toString(16).padStart(2, '0');
            }
            
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Рисуем вспышку света для больших взрывов
        if (this.lightFlash > 0.01 && this.size > 1) {
            ctx.fillStyle = `rgba(255, 255, 200, ${this.lightFlash * 0.3})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }
    
    getScreenShake() {
        if (!GRAPHICS_SETTINGS.screenShake) return { x: 0, y: 0 };
        
        return {
            x: (Math.random() - 0.5) * this.screenShake,
            y: (Math.random() - 0.5) * this.screenShake
        };
    }
}

// Управление экранами
function showScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    screen.classList.remove('hidden');
}

// Обработчики кнопок меню
startButton.addEventListener('click', () => {
    showScreen(gameScreen);
    startGame();
});

controlsButton.addEventListener('click', () => {
    showScreen(controlsScreen);
});

aboutButton.addEventListener('click', () => {
    showScreen(aboutScreen);
});

difficultyButton.addEventListener('click', () => {
    showScreen(difficultyScreen);
    updateDifficultyStats();
});

graphicsButton.addEventListener('click', () => {
    showScreen(graphicsScreen);
    updateGraphicsUI();
});

backFromControls.addEventListener('click', () => {
    showScreen(mainMenu);
});

backFromAbout.addEventListener('click', () => {
    showScreen(mainMenu);
});

backFromDifficulty.addEventListener('click', () => {
    showScreen(mainMenu);
});

backFromGraphics.addEventListener('click', () => {
    showScreen(mainMenu);
});

menuButton.addEventListener('click', () => {
    showScreen(mainMenu);
});

menuFromPauseButton.addEventListener('click', () => {
    showScreen(mainMenu);
    gamePaused = false;
});

continueButton.addEventListener('click', () => {
    gamePaused = false;
    pauseScreen.classList.add('hidden');
});

// Переключение звука
soundToggle.addEventListener('click', () => {
    const soundEnabled = soundSystem.toggleMute();
    soundToggle.textContent = `🔊 ЗВУК: ${soundEnabled ? 'ВКЛ' : 'ВЫКЛ'}`;
});

// Функция обновления статистики сложности
function updateDifficultyStats() {
    const difficulty = DIFFICULTY_LEVELS[currentDifficulty];
    enemySpeedStat.textContent = `${difficulty.enemySpeed}x`;
    enemyShootStat.textContent = `${Math.round(difficulty.enemyShootChance * 100)}%`;
    enemyCountStat.textContent = difficulty.initialEnemies;
    bonusChanceStat.textContent = `${Math.round(difficulty.bonusChance * 100)}%`;
}

// Обработчики выбора сложности
function setDifficulty(difficulty) {
    currentDifficulty = difficulty;
    
    // Обновляем активную кнопку
    document.querySelectorAll('.difficulty-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-difficulty="${difficulty}"]`).classList.add('active');
    
    // Обновляем статистику
    updateDifficultyStats();
    
    // Обновляем бейдж в игре
    difficultyBadge.textContent = DIFFICULTY_LEVELS[difficulty].name;
    difficultyBadge.style.background = `linear-gradient(145deg, ${DIFFICULTY_LEVELS[difficulty].color}33, ${DIFFICULTY_LEVELS[difficulty].color}66)`;
}

easyButton.addEventListener('click', () => setDifficulty('easy'));
normalButton.addEventListener('click', () => setDifficulty('normal'));
hardButton.addEventListener('click', () => setDifficulty('hard'));
expertButton.addEventListener('click', () => setDifficulty('expert'));

// Функции для управления настройками графики
function updateGraphicsUI() {
    // Обновляем переключатели взрывов
    document.querySelectorAll('[data-setting="explosions"]').forEach(btn => {
        btn.classList.toggle('active', 
            btn.dataset.value === GRAPHICS_SETTINGS.explosions.toString());
    });
    
    // Обновляем плотность частиц
    document.querySelectorAll('[data-setting="particleDensity"]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.value === GRAPHICS_SETTINGS.particleDensity);
    });
    
    // Обновляем сотрясение экрана
    document.querySelectorAll('[data-setting="screenShake"]').forEach(btn => {
        btn.classList.toggle('active', 
            btn.dataset.value === GRAPHICS_SETTINGS.screenShake.toString());
    });
    
    // Обновляем частоту кадров
    document.querySelectorAll('[data-setting="frameRateTarget"]').forEach(btn => {
        btn.classList.toggle('active', 
            btn.dataset.value === GRAPHICS_SETTINGS.frameRateTarget.toString());
    });
    
    updatePerformanceIndicator();
}

function applyGraphicsSettings() {
    // Сохраняем настройки
    graphicsSettings.saveSettings();
    graphicsSettings.applySettings();
    
    // Применяем изменения в реальном времени
    if (!GRAPHICS_SETTINGS.explosions) {
        explosions = [];
    }
    
    showScreen(mainMenu);
}

function resetGraphicsSettings() {
    // Сбрасываем настройки по умолчанию
    Object.assign(GRAPHICS_SETTINGS, {
        explosions: true,
        particleDensity: 'medium',
        screenShake: true,
        renderDistance: 'high',
        frameRateTarget: 60,
        lowSpecMode: false
    });
    
    updateGraphicsUI();
}

function updatePerformanceIndicator() {
    const performanceFill = document.getElementById('performanceFill');
    const performanceText = document.getElementById('performanceText');
    
    let performanceLevel = 'medium';
    let performanceTextValue = 'ОПТИМАЛЬНАЯ';
    
    if (GRAPHICS_SETTINGS.particleDensity === 'low' && 
        !GRAPHICS_SETTINGS.screenShake && 
        GRAPHICS_SETTINGS.frameRateTarget === 30) {
        performanceLevel = 'low';
        performanceTextValue = 'МАКСИМАЛЬНАЯ';
    } else if (GRAPHICS_SETTINGS.particleDensity === 'high' && 
               GRAPHICS_SETTINGS.screenShake && 
               GRAPHICS_SETTINGS.frameRateTarget === 0) {
        performanceLevel = 'high';
        performanceTextValue = 'ВЫСОКАЯ НАГРУЗКА';
    }
    
    performanceFill.className = `performance-fill ${performanceLevel}`;
    performanceText.textContent = performanceTextValue;
}

// Обработчики для пресетов графики
document.querySelectorAll('.preset-button').forEach(btn => {
    btn.addEventListener('click', function() {
        const preset = this.dataset.preset;
        
        // Убираем активный класс у всех пресетов
        document.querySelectorAll('.preset-button').forEach(b => b.classList.remove('active'));
        // Добавляем активный класс текущему пресету
        this.classList.add('active');
        
        // Применяем настройки пресета
        applyGraphicsPreset(preset);
        updateGraphicsUI();
    });
});

function applyGraphicsPreset(preset) {
    switch(preset) {
        case 'low':
            GRAPHICS_SETTINGS.explosions = true;
            GRAPHICS_SETTINGS.particleDensity = 'low';
            GRAPHICS_SETTINGS.screenShake = false;
            GRAPHICS_SETTINGS.frameRateTarget = 30;
            break;
        case 'medium':
            GRAPHICS_SETTINGS.explosions = true;
            GRAPHICS_SETTINGS.particleDensity = 'medium';
            GRAPHICS_SETTINGS.screenShake = true;
            GRAPHICS_SETTINGS.frameRateTarget = 60;
            break;
        case 'high':
            GRAPHICS_SETTINGS.explosions = true;
            GRAPHICS_SETTINGS.particleDensity = 'high';
            GRAPHICS_SETTINGS.screenShake = true;
            GRAPHICS_SETTINGS.frameRateTarget = 0;
            break;
    }
}

// Обработчики для переключателей графики
document.querySelectorAll('.toggle-button').forEach(btn => {
    btn.addEventListener('click', function() {
        const setting = this.dataset.setting;
        const value = this.dataset.value;
        
        // Преобразуем строковые значения в соответствующие типы
        let processedValue = value;
        if (value === 'true') processedValue = true;
        if (value === 'false') processedValue = false;
        if (!isNaN(value) && value !== '') processedValue = Number(value);
        
        // Обновляем настройку
        GRAPHICS_SETTINGS[setting] = processedValue;
        
        // Обновляем UI
        updateGraphicsUI();
    });
});

// Обработчики кнопок графики
applyGraphics.addEventListener('click', applyGraphicsSettings);
resetGraphics.addEventListener('click', resetGraphicsSettings);

// Класс Танк
class Tank {
    constructor(x, y, color, isPlayer = false) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.color = color;
        this.isPlayer = isPlayer;
        this.direction = 0;
        this.aimDirection = 0;
        this.cooldown = 0;
        
        // Используем настройки сложности
        const difficulty = DIFFICULTY_LEVELS[currentDifficulty];
        this.speed = isPlayer ? difficulty.playerSpeed : difficulty.enemySpeed;
        
        this.moveCooldown = 0;
        this.lastPlayerPos = { x: 0, y: 0 };
        this.cannonOffset = 0;
        this.health = 1;
        this.invulnerable = 0;
        this.lastX = x;
        this.lastY = y;
    }
    
    update(walls, playerPos = null) {
        if (playerPos) {
            this.lastPlayerPos = playerPos;
        }
        
        if (this.invulnerable > 0) {
            this.invulnerable--;
        }
        
        const oldX = this.x;
        const oldY = this.y;
        
        if (this.isPlayer) {
            if (keys['w']) {
                this.y -= this.speed;
                this.direction = 0;
            }
            if (keys['s']) {
                this.y += this.speed;
                this.direction = 2;
            }
            if (keys['a']) {
                this.x -= this.speed;
                this.direction = 3;
            }
            if (keys['d']) {
                this.x += this.speed;
                this.direction = 1;
            }
            
            // Звук движения
            if ((this.x !== this.lastX || this.y !== this.lastY) && Date.now() - lastMoveSound > 200) {
                soundSystem.play('move');
                lastMoveSound = Date.now();
            }
            
            this.lastX = this.x;
            this.lastY = this.y;
            
            if (keys['arrowup']) this.aimDirection = 0;
            if (keys['arrowright']) this.aimDirection = 1;
            if (keys['arrowdown']) this.aimDirection = 2;
            if (keys['arrowleft']) this.aimDirection = 3;
        } else {
            this.moveCooldown--;
            
            if (this.moveCooldown <= 0) {
                const dx = this.lastPlayerPos.x - this.x;
                const dy = this.lastPlayerPos.y - this.y;
                
                if (Math.random() < 0.8) {
                    if (Math.abs(dx) > Math.abs(dy)) {
                        this.direction = dx > 0 ? 1 : 3;
                    } else {
                        this.direction = dy > 0 ? 2 : 0;
                    }
                } else {
                    this.direction = Math.floor(Math.random() * 4);
                }
                
                this.moveCooldown = Math.floor(Math.random() * 60) + 30;
            }
            
            if (this.direction === 0) {
                this.y -= this.speed;
            } else if (this.direction === 1) {
                this.x += this.speed;
            } else if (this.direction === 2) {
                this.y += this.speed;
            } else if (this.direction === 3) {
                this.x -= this.speed;
            }
            
            const dx = this.lastPlayerPos.x - this.x;
            const dy = this.lastPlayerPos.y - this.y;
            if (Math.abs(dx) > Math.abs(dy)) {
                this.aimDirection = dx > 0 ? 1 : 3;
            } else {
                this.aimDirection = dy > 0 ? 2 : 0;
            }
            
            // Используем настройки сложности для шанса выстрела
            const difficulty = DIFFICULTY_LEVELS[currentDifficulty];
            if (Math.random() < difficulty.enemyShootChance) {
                const bullet = this.shoot();
                if (bullet) {
                    bullets.push(bullet);
                }
            }
        }
        
        let collided = false;
        for (const wall of walls) {
            if (this.collidesWith(wall)) {
                collided = true;
                break;
            }
        }
        
        if (collided || this.x < 20 || this.x > canvas.width - this.width - 20 ||
            this.y < 20 || this.y > canvas.height - this.height - 20) {
            this.x = oldX;
            this.y = oldY;
            if (!this.isPlayer) {
                this.direction = Math.floor(Math.random() * 4);
                this.moveCooldown = 20;
            }
        }
        
        if (this.cooldown > 0) {
            this.cooldown--;
        }
        
        if (this.cannonOffset > 0) {
            this.cannonOffset -= CANNON_RECOVERY;
        }
    }
    
    draw() {
        if (!isVisible(this)) return;
        
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        
        if (this.invulnerable > 0 && Math.floor(this.invulnerable / 5) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }
        
        ctx.rotate(this.direction * Math.PI/2);
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.width/2 + 4, -this.height/2 + 4, this.width - 8, this.height - 8);
        ctx.strokeStyle = BLACK;
        ctx.lineWidth = 2;
        ctx.strokeRect(-this.width/2 + 4, -this.height/2 + 4, this.width - 8, this.height - 8);
        
        ctx.fillStyle = this.isPlayer ? DARK_GREEN : '#600';
        ctx.fillRect(-this.width/2 + 8, -this.height/2 + 8, this.width - 16, this.height - 16);
        
        ctx.restore();
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.aimDirection * Math.PI/2);
        
        const cannonLength = 16 - this.cannonOffset;
        ctx.fillStyle = this.isPlayer ? DARK_GREEN : '#900';
        ctx.fillRect(-2, -this.height/2 - cannonLength + 8, 4, cannonLength);
        
        ctx.restore();
        ctx.globalAlpha = 1;
    }
    
    collidesWith(obj) {
        return this.x < obj.x + obj.width &&
               this.x + this.width > obj.x &&
               this.y < obj.y + obj.height &&
               this.y + this.height > obj.y;
    }
    
    shoot() {
        if (this.cooldown === 0) {
            this.cooldown = 30;
            this.cannonOffset = CANNON_RECOIL;
            
            soundSystem.play('shoot');
            
            const shootDir = this.aimDirection;
            let bulletX, bulletY;
            
            if (shootDir === 0) {
                bulletX = this.x + this.width/2;
                bulletY = this.y;
            } else if (shootDir === 1) {
                bulletX = this.x + this.width;
                bulletY = this.y + this.height/2;
            } else if (shootDir === 2) {
                bulletX = this.x + this.width/2;
                bulletY = this.y + this.height;
            } else if (shootDir === 3) {
                bulletX = this.x;
                bulletY = this.y + this.height/2;
            }
            
            return new Bullet(bulletX, bulletY, shootDir, this.isPlayer);
        }
        return null;
    }
    
    takeDamage() {
        if (this.invulnerable > 0) return false;
        
        this.health--;
        if (this.health <= 0) {
            return true;
        }
        
        soundSystem.play('hit');
        
        if (this.isPlayer) {
            this.invulnerable = 120;
        }
        return false;
    }
}

// Класс Пуля
class Bullet {
    constructor(x, y, direction, isPlayer) {
        this.x = x;
        this.y = y;
        this.width = 6;
        this.height = 6;
        this.direction = direction;
        this.isPlayer = isPlayer;
        this.speed = BULLET_SPEED;
        this.power = 1;
    }
    
    update() {
        if (this.direction === 0) {
            this.y -= this.speed;
        } else if (this.direction === 1) {
            this.x += this.speed;
        } else if (this.direction === 2) {
            this.y += this.speed;
        } else if (this.direction === 3) {
            this.x -= this.speed;
        }
        
        return !(this.x < 0 || this.x > canvas.width || 
                 this.y < 0 || this.y > canvas.height);
    }
    
    draw() {
        if (!isVisible(this)) return;
        
        ctx.fillStyle = this.isPlayer ? WHITE : RED;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width/2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = this.isPlayer ? YELLOW : ORANGE;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width/4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    collidesWith(obj) {
        return this.x < obj.x + obj.width &&
               this.x + this.width > obj.x &&
               this.y < obj.y + obj.height &&
               this.y + this.height > obj.y;
    }
}

// Класс Стена
class Wall {
    constructor(x, y, width, height, destructible = false) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.destructible = destructible;
        this.health = destructible ? 1 : Infinity;
    }
    
    draw() {
        if (!isVisible(this)) return;
        
        if (this.destructible) {
            ctx.fillStyle = BROWN;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            ctx.strokeStyle = '#643200';
            ctx.lineWidth = 1;
            for (let i = 0; i < this.width; i += 4) {
                ctx.beginPath();
                ctx.moveTo(this.x + i, this.y);
                ctx.lineTo(this.x + i, this.y + this.height);
                ctx.stroke();
            }
            for (let j = 0; j < this.height; j += 4) {
                ctx.beginPath();
                ctx.moveTo(this.x, this.y + j);
                ctx.lineTo(this.x + this.width, this.y + j);
                ctx.stroke();
            }
        } else {
            ctx.fillStyle = GRAY;
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            ctx.strokeStyle = '#666';
            ctx.lineWidth = 1;
            for (let i = 0; i < this.width; i += 6) {
                ctx.beginPath();
                ctx.moveTo(this.x + i, this.y);
                ctx.lineTo(this.x + i, this.y + this.height);
                ctx.stroke();
            }
            for (let j = 0; j < this.height; j += 6) {
                ctx.beginPath();
                ctx.moveTo(this.x, this.y + j);
                ctx.lineTo(this.x + this.width, this.y + j);
                ctx.stroke();
            }
        }
    }
}

// Класс Бонус
class Bonus {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.type = Math.floor(Math.random() * 3);
        this.life = 300;
    }
    
    update() {
        this.life--;
        return this.life > 0;
    }
    
    draw() {
        if (!isVisible(this)) return;
        
        if (this.life < 60 && Math.floor(this.life / 10) % 2 === 0) {
            return;
        }
        
        ctx.fillStyle = this.getColor();
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        ctx.strokeStyle = WHITE;
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.width, this.height);
        
        ctx.fillStyle = WHITE;
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.getSymbol(), this.x + this.width/2, this.y + this.height/2);
    }
    
    getColor() {
        switch(this.type) {
            case 0: return RED;
            case 1: return BLUE;
            case 2: return PURPLE;
            default: return YELLOW;
        }
    }
    
    getSymbol() {
        switch(this.type) {
            case 0: return '♥';
            case 1: return '⚡';
            case 2: return '★';
            default: return '?';
        }
    }
    
    applyBonus(tank) {
        soundSystem.play('bonus');
        
        switch(this.type) {
            case 0:
                if (tank.isPlayer) {
                    playerLives++;
                    showBonusNotification("+1 ЖИЗНЬ");
                }
                break;
            case 1:
                tank.speed += 1;
                setTimeout(() => {
                    if (tank.speed > (tank.isPlayer ? DIFFICULTY_LEVELS[currentDifficulty].playerSpeed : DIFFICULTY_LEVELS[currentDifficulty].enemySpeed)) {
                        tank.speed -= 1;
                    }
                }, 10000);
                showBonusNotification("СКОРОСТЬ ПОВЫШЕНА");
                break;
            case 2:
                showBonusNotification("МОЩНОСТЬ ПОВЫШЕНА");
                break;
        }
    }
    
    collidesWith(obj) {
        return this.x < obj.x + obj.width &&
               this.x + this.width > obj.x &&
               this.y < obj.y + obj.height &&
               this.y + this.height > obj.y;
    }
}

function showBonusNotification(text) {
    const notification = {
        text: text,
        x: canvas.width / 2,
        y: canvas.height / 2,
        life: 120
    };
    
    bonusNotifications.push(notification);
}

function createLevel() {
    const walls = [];
    
    walls.push(new Wall(0, 0, canvas.width, 20, false));
    walls.push(new Wall(0, 0, 20, canvas.height, false));
    walls.push(new Wall(0, canvas.height - 20, canvas.width, 20, false));
    walls.push(new Wall(canvas.width - 20, 0, 20, canvas.height, false));
    
    const wallPositions = [
        [200, 150], [400, 100], [600, 200],
        [100, 400], [300, 350], [500, 450],
        [150, 250], [350, 300], [550, 150]
    ];
    
    for (const [x, y] of wallPositions) {
        walls.push(new Wall(x, y, 40, 40, false));
    }
    
    for (let i = 0; i < 25; i++) {
        const x = Math.floor(Math.random() * (canvas.width - 80)) + 50;
        const y = Math.floor(Math.random() * (canvas.height - 80)) + 50;
        
        if (Math.abs(x - 100) > 150 || Math.abs(y - 300) > 150) {
            walls.push(new Wall(x, y, 30, 30, true));
        }
    }
    
    return walls;
}

function spawnEnemies(count) {
    enemies = [];
    for (let i = 0; i < count; i++) {
        let validPosition = false;
        let x, y, enemy;
        
        while (!validPosition) {
            x = Math.floor(Math.random() * (canvas.width / 2 - 70)) + canvas.width / 2 + 50;
            y = Math.floor(Math.random() * (canvas.height - 140)) + 70;
            enemy = new Tank(x, y, RED);
            
            validPosition = true;
            for (const wall of walls) {
                if (enemy.collidesWith(wall)) {
                    validPosition = false;
                    break;
                }
            }
        }
        
        enemies.push(enemy);
    }
}

function drawGrid() {
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1;
    
    for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    
    for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
}

function updateUI() {
    scoreElement.textContent = score;
    livesElement.textContent = playerLives;
    levelElement.textContent = gameLevel;
    enemiesElement.textContent = enemies.length;
}

// Оптимизированная функция очистки массивов
function cleanupArrays() {
    // Удаляем старые взрывы
    if (explosions.length > 20) {
        explosions = explosions.slice(-20);
    }
    
    // Удаляем старые уведомления
    if (bonusNotifications.length > 5) {
        bonusNotifications = bonusNotifications.slice(-5);
    }
}

// Мониторинг FPS
function updateFPS(timestamp) {
    frameCount++;
    if (timestamp - lastFpsUpdate >= 1000) {
        currentFPS = frameCount;
        frameCount = 0;
        lastFpsUpdate = timestamp;
        
        // Для отладки можно выводить в консоль
        if (currentFPS < 50) {
            console.warn(`Low FPS: ${currentFPS}`);
        }
    }
}

// Функция применения сотрясения экрана
function applyScreenShake() {
    let totalShakeX = 0;
    let totalShakeY = 0;
    
    for (const explosion of explosions) {
        const shake = explosion.getScreenShake();
        totalShakeX += shake.x;
        totalShakeY += shake.y;
    }
    
    // Ограничиваем максимальное сотрясение
    totalShakeX = Math.max(-10, Math.min(10, totalShakeX));
    totalShakeY = Math.max(-10, Math.min(10, totalShakeY));
    
    return { x: totalShakeX, y: totalShakeY };
}

const keys = {};

window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'p') {
        if (!gameOver && !levelCompleteScreen.classList.contains('hidden')) return;
        
        gamePaused = !gamePaused;
        pauseScreen.classList.toggle('hidden', !gamePaused);
        return;
    }
    
    if (e.key.toLowerCase() === 'm') {
        const soundEnabled = soundSystem.toggleMute();
        soundToggle.textContent = `🔊 ЗВУК: ${soundEnabled ? 'ВКЛ' : 'ВЫКЛ'}`;
        return;
    }
    
    keys[e.key.toLowerCase()] = true;
    
    if (!gameOver && !gamePaused) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowRight' || 
            e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
            const bullet = player.shoot();
            if (bullet) {
                bullets.push(bullet);
            }
        }
    }
    
    if (e.key === 'r' && gameOver) {
        restartGame();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

function startGame() {
    const difficulty = DIFFICULTY_LEVELS[currentDifficulty];
    
    player = new Tank(100, canvas.height / 2, GREEN, true);
    player.speed = difficulty.playerSpeed;
    
    bullets = [];
    explosions = [];
    bonuses = [];
    bonusNotifications = [];
    gameOver = false;
    gamePaused = false;
    score = 0;
    playerLives = difficulty.playerLives;
    gameLevel = 1;
    enemiesToKill = difficulty.initialEnemies;
    
    walls = createLevel();
    spawnEnemies(enemiesToKill);
    
    gameOverScreen.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    levelCompleteScreen.classList.add('hidden');
    
    // Обновляем интерфейс
    updateUI();
    difficultyBadge.textContent = difficulty.name;
    difficultyBadge.style.background = `linear-gradient(145deg, ${difficulty.color}33, ${difficulty.color}66)`;
}

function restartGame() {
    startGame();
}

function spawnBonus() {
    const now = Date.now();
    if (now - lastBonusTime > 10000) {
        const difficulty = DIFFICULTY_LEVELS[currentDifficulty];
        
        // Используем настройки сложности для шанса появления бонуса
        if (Math.random() < difficulty.bonusChance) {
            let validPosition = false;
            let x, y, bonus;
            
            while (!validPosition) {
                x = Math.floor(Math.random() * (canvas.width - 40)) + 20;
                y = Math.floor(Math.random() * (canvas.height - 40)) + 20;
                bonus = new Bonus(x, y);
                
                validPosition = true;
                for (const wall of walls) {
                    if (bonus.collidesWith(wall)) {
                        validPosition = false;
                        break;
                    }
                }
            }
            
            bonuses.push(bonus);
            lastBonusTime = now;
        }
    }
}

function completeLevel() {
    // Убедимся, что функция вызывается только когда нужно
    if (enemies.length > 0 || gameOver) return;
    
    const difficulty = DIFFICULTY_LEVELS[currentDifficulty];
    
    levelCompleteScreen.classList.remove('hidden');
    completedLevelElement.textContent = gameLevel;
    levelScoreElement.textContent = 500;
    
    // Добавляем очки за уровень
    score += 500;
    
    // Обновляем интерфейс
    updateUI();
}

// Обработчик кнопки следующего уровня
nextLevelButton.addEventListener('click', () => {
    const difficulty = DIFFICULTY_LEVELS[currentDifficulty];
    
    gameLevel++;
    enemiesToKill = difficulty.initialEnemies + (gameLevel - 1) * difficulty.enemyIncrement;
    playerLives++;
    
    walls = createLevel();
    spawnEnemies(enemiesToKill);
    
    // Респаун игрока в безопасном месте
    player.x = 100;
    player.y = canvas.height / 2;
    player.invulnerable = 120;
    
    levelCompleteScreen.classList.add('hidden');
    
    // Обновляем интерфейс
    updateUI();
});

function gameLoop(timestamp) {
    if (gameScreen.classList.contains('hidden')) {
        requestAnimationFrame(gameLoop);
        return;
    }
    
    // Throttle updates для стабильного FPS
    const deltaTime = timestamp - lastUpdateTime;
    if (deltaTime < UPDATE_INTERVAL) {
        requestAnimationFrame(gameLoop);
        return;
    }
    lastUpdateTime = timestamp;
    
    // Мониторинг FPS
    updateFPS(timestamp);
    
    if (!gameOver && !gamePaused) {
        // Применяем сотрясение экрана
        const shake = applyScreenShake();
        ctx.save();
        ctx.translate(shake.x, shake.y);
        
        ctx.fillStyle = BLACK;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        drawGrid();
        
        // Обновляем пространственное разделение
        spatialHash.clear();
        [player, ...enemies, ...walls, ...bonuses].forEach(obj => {
            spatialHash.insert(obj);
        });
        
        player.update(walls);
        
        for (const enemy of enemies) {
            enemy.update(walls, { x: player.x, y: player.y });
        }
        
        // Оптимизированная проверка коллизий с использованием spatialHash
        for (let i = bullets.length - 1; i >= 0; i--) {
            if (!bullets[i].update()) {
                bullets.splice(i, 1);
                continue;
            }
            
            const nearbyObjects = spatialHash.getNearby(bullets[i].x, bullets[i].y);
            let collisionHandled = false;
            
            for (const obj of nearbyObjects) {
                if (bullets[i].collidesWith(obj)) {
                    if (obj.destructible) {
                        // Удаляем разрушаемую стену
                        const wallIndex = walls.indexOf(obj);
                        if (wallIndex > -1) {
                            walls.splice(wallIndex, 1);
                            explosions.push(new EnhancedExplosion(bullets[i].x, bullets[i].y, 0.7));
                        }
                    } else if (!obj.destructible && obj instanceof Wall) {
                        // Неразрушаемая стена
                        bullets.splice(i, 1);
                        collisionHandled = true;
                        break;
                    }
                    
                    if (bullets[i] && bullets[i].isPlayer && obj instanceof Tank && !obj.isPlayer) {
                        if (obj.takeDamage()) {
                            const enemyIndex = enemies.indexOf(obj);
                            if (enemyIndex > -1) {
                                enemies.splice(enemyIndex, 1);
                                explosions.push(new EnhancedExplosion(bullets[i].x, bullets[i].y, 1.2));
                                score += 100;
                                
                                spawnBonus();
                            }
                        }
                        bullets.splice(i, 1);
                        collisionHandled = true;
                        break;
                    }
                    
                    if (bullets[i] && !bullets[i].isPlayer && obj === player) {
                        if (player.takeDamage()) {
                            playerLives--;
                            explosions.push(new EnhancedExplosion(player.x + player.width/2, player.y + player.height/2, 1.5));
                            
                            if (playerLives <= 0) {
                                gameOver = true;
                                finalScoreElement.textContent = score;
                                gameOverScreen.classList.remove('hidden');
                            } else {
                                player.x = 100;
                                player.y = canvas.height / 2;
                                player.invulnerable = 120;
                            }
                        }
                        bullets.splice(i, 1);
                        collisionHandled = true;
                        break;
                    }
                }
            }
            
            if (!collisionHandled && bullets[i]) {
                // Дополнительная проверка границ
                if (bullets[i].x < 0 || bullets[i].x > canvas.width || 
                    bullets[i].y < 0 || bullets[i].y > canvas.height) {
                    bullets.splice(i, 1);
                }
            }
        }
        
        for (let i = explosions.length - 1; i >= 0; i--) {
            if (!explosions[i].update()) {
                explosions.splice(i, 1);
            }
        }
        
        for (let i = bonuses.length - 1; i >= 0; i--) {
            if (!bonuses[i].update()) {
                bonuses.splice(i, 1);
                continue;
            }
            
            if (bonuses[i].collidesWith(player)) {
                bonuses[i].applyBonus(player);
                bonuses.splice(i, 1);
            }
        }
        
        for (let i = bonusNotifications.length - 1; i >= 0; i--) {
            bonusNotifications[i].life--;
            if (bonusNotifications[i].life <= 0) {
                bonusNotifications.splice(i, 1);
            }
        }
        
        // Очистка массивов для оптимизации памяти
        cleanupArrays();
        
        // Проверка победы на уровне (ИСПРАВЛЕННАЯ ЛОГИКА)
        if (enemies.length === 0 && 
            !gameOver && 
            !gamePaused && 
            levelCompleteScreen.classList.contains('hidden')) {
            completeLevel();
        }
        
        // Оптимизированный рендеринг - рисуем только видимые объекты
        const visibleWalls = walls.filter(wall => isVisible(wall));
        const visibleEnemies = enemies.filter(enemy => isVisible(enemy));
        const visibleBullets = bullets.filter(bullet => isVisible(bullet));
        const visibleExplosions = explosions.filter(explosion => isVisible(explosion));
        const visibleBonuses = bonuses.filter(bonus => isVisible(bonus));
        
        for (const wall of visibleWalls) {
            wall.draw();
        }
        
        for (const bullet of visibleBullets) {
            bullet.draw();
        }
        
        for (const enemy of visibleEnemies) {
            enemy.draw();
        }
        
        for (const explosion of visibleExplosions) {
            explosion.draw();
        }
        
        for (const bonus of visibleBonuses) {
            bonus.draw();
        }
        
        player.draw();
        
        for (const notification of bonusNotifications) {
            ctx.fillStyle = `rgba(255, 255, 0, ${notification.life / 120})`;
            ctx.font = '24px Courier New';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(notification.text, notification.x, notification.y);
        }
        
        updateUI();
        
        ctx.restore(); // Восстанавливаем контекст после сотрясения
    }
    
    requestAnimationFrame(gameLoop);
}

// Инициализация игры
function init() {
    restartButton.addEventListener('click', restartGame);
    
    // Устанавливаем сложность по умолчанию
    setDifficulty('normal');
    
    // Предзагрузка ресурсов (если будут добавлены текстуры)
    preloadResources().then(() => {
        console.log('Ресурсы загружены');
        gameLoop();
    }).catch(() => {
        console.log('Игра запущена без дополнительных ресурсов');
        gameLoop();
    });
}

// Функция предзагрузки ресурсов
function preloadResources() {
    return new Promise((resolve) => {
        // Здесь можно добавить предзагрузку изображений, звуков и т.д.
        setTimeout(resolve, 100); // Имитация загрузки
    });
}

window.addEventListener('load', init);