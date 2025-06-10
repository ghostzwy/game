import soundManager from './sound.js';

function checkLandscape() {
    const warning = document.getElementById('landscape-warning');
    const isMobile = window.innerWidth < 900;
    const isPortrait = window.innerWidth < window.innerHeight;
    if (isMobile && isPortrait) {
        warning?.classList.remove('hidden');
        if (game && game.isRunning) game.isRunning = false;
    } else {
        warning?.classList.add('hidden');
        if (game) {
            game.rebindEventListeners();
            if (!game.isRunning && game.hasStarted) {
                game.isRunning = true;
                game.gameLoop();
            }
        }
    }
}

function requestFullscreenIfLandscape() {
    const isLandscape = window.innerWidth > window.innerHeight;
    const elem = document.documentElement;
    if (isLandscape && !document.fullscreenElement) {
        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(() => {});
        }
    }
}

window.addEventListener('orientationchange', () => {
    setTimeout(requestFullscreenIfLandscape, 100);
});

window.addEventListener('resize', () => {
    requestFullscreenIfLandscape();
});

function checkReturnFromRoom2() {
    const returnedFromRoom2 = sessionStorage.getItem('returnedFromRoom2');
    if (returnedFromRoom2 === 'true') {
        document.querySelector('.hud')?.classList.add('hidden');
        document.getElementById('items-container')?.classList.add('hidden');
        document.querySelectorAll('.item-hidden').forEach(item => {
            item.style.display = 'none';
        });
        sessionStorage.removeItem('returnedFromRoom2');
        if (game) {
            game.isRunning = false;
        }
    }
}

class Character {
    constructor(name, position) {
        this.name = name;
        this.position = position;
    }

    move(newPosition) {
        this.position = newPosition;
        const characterEl = document.getElementById('character');
        if (characterEl) {
            characterEl.style.left = `${this.position.x}px`;
            characterEl.style.top = `${this.position.y}px`;
        }
    }
}

class Game {
    constructor() {
        this.isRunning = false;
        this.timeLeft = 30;
        this.collectedItems = 0;
        this.requiredItems = 5;
        this.character = null;
        this.areas = ['ruang1', 'ruang2'];
        this.currentArea = 0;
        this.instructionShown = false;
        this.typingTimeout = null;
        this.hasStarted = false;
        this.timerStarted = false;
        checkLandscape();
        this.start();
    }

    start() {
        this.isRunning = false;
        this.timeLeft = 30;
        this.collectedItems = 0;
        this.character = new Character('Dira', { x: 400, y: 300 });
        this.showGameScreen();
        audioManager.playBackgroundMusic();
        this.resetItems();
        const warning = document.getElementById('landscape-warning');
        if (warning && !warning.classList.contains('hidden')) return;
        this.showBadaiInstruction();
        this.hasStarted = true;
        this.rebindEventListeners();
    }

    rebindEventListeners() {
        document.querySelectorAll('.item-hidden').forEach(item => {
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
            newItem.addEventListener('click', () => this.collectItem(newItem));
        });
    }

    collectItem(itemEl) {
        if (!this.isRunning || itemEl.classList.contains('found')) return;
        this.collectedItems++;
        document.querySelector('#collected-items span').textContent = this.collectedItems;
        itemEl.classList.add('found');
        itemEl.style.pointerEvents = 'none';
        const name = itemEl.getAttribute('data-name');
        const inventoryItem = document.querySelector(`.item-inventory[data-name="${name}"]`);
        if (inventoryItem) {
            inventoryItem.classList.add('found');
        }
        soundManager.play('collect');
        if (
            this.areas[this.currentArea] === 'ruang1' &&
            document.querySelectorAll('.item-ruang1:not(.found)').length === 0
        ) {
            this.showKamarWarningInstruction();
            return;
        }
    }

    showKamarWarningInstruction() {
        const instructionText = "Oh iya saya blom ngambil barang di kamar!";
        document.getElementById('arrow-left')?.classList.add('hidden');
        document.getElementById('arrow-right')?.classList.add('hidden');
        const instruction = document.getElementById('instruction');
        const instructionTextEl = document.getElementById('instruction-text');
        const instructionNext = document.getElementById('instruction-next');
        const roomArrow = document.getElementById('room-arrow');
        if (!instruction || !instructionTextEl || !roomArrow || !instructionNext) return;
        instruction.classList.remove('hidden');
        instructionTextEl.textContent = '';
        roomArrow.classList.add('hidden');
        instructionNext.classList.add('hidden');
        instruction.style.pointerEvents = 'none';
        let i = 0;
        const typeNext = () => {
            if (i < instructionText.length) {
                instructionTextEl.textContent += instructionText[i];
                if (instructionText[i] && instructionText[i] !== ' ') {
                    soundManager.play('type');
                }
                i++;
                setTimeout(typeNext, 60);
            } else {
                roomArrow.classList.remove('hidden');
                instructionNext.classList.remove('hidden');
                instruction.style.pointerEvents = 'auto';
                const handleClick = () => {
                    soundManager.play('click');
                    localStorage.setItem('sisaWaktu', this.timeLeft);
                    sessionStorage.setItem('returnedFromRoom2', 'true');
                    window.location.href = 'ruang2.html';
                };
                roomArrow.onclick = handleClick;
                instructionNext.onclick = handleClick;
                instruction.onclick = handleClick;
            }
        };
        typeNext();
    }

    showTypingInstruction(text, speed = 80, lanjutGame = true, showHudAfter = false) {
        const instruction = document.getElementById('instruction');
        const instructionTextEl = document.getElementById('instruction-text');
        const instructionNext = document.getElementById('instruction-next');
        if (!instruction || !instructionTextEl || !instructionNext) return;
        if (this.typingTimeout) {
            clearTimeout(this.typingTimeout);
            this.typingTimeout = null;
        }
        instruction.classList.remove('hidden');
        instructionTextEl.textContent = '';
        instructionNext.classList.add('hidden');
        instruction.style.pointerEvents = 'none';
        let i = 0;
        const typeNext = () => {
            if (i < text.length) {
                instructionTextEl.textContent += text[i];
                if (text[i] && text[i] !== ' ') {
                    soundManager.play('type');
                }
                i++;
                this.typingTimeout = setTimeout(typeNext, speed);
            } else {
                instructionNext.classList.remove('hidden');
                instruction.style.pointerEvents = 'auto';
                instruction.addEventListener('click', handleClick);
            }
        };
        const handleClick = () => {
            instruction.classList.add('hidden');
            instructionNext.classList.add('hidden');
            instruction.removeEventListener('click', handleClick);
            if (showHudAfter) {
                document.querySelector('.hud')?.classList.remove('hidden');
                document.getElementById('items-container')?.classList.remove('hidden');
            }
            if (lanjutGame) {
                this.isRunning = true;
                this.gameLoop();
            }
        };
        typeNext();
    }

    showGameScreen() {
        document.getElementById('start-screen')?.classList.add('hidden');
        document.getElementById('game-screen')?.classList.remove('hidden');
        document.getElementById('end-screen')?.classList.add('hidden');
        const gameScreen = document.getElementById('game-screen');
        if (gameScreen) {
            gameScreen.classList.remove('area-slide-left', 'area-slide-right', 'area-slide-reset');
            void gameScreen.offsetWidth;
            gameScreen.classList.add('zoom-animate');
        }
        document.querySelector('.hud')?.classList.remove('hidden');
        document.getElementById('items-container')?.classList.remove('hidden');
    }

    showBadaiInstruction() {
        if (this.instructionShown) return;
        this.instructionShown = true;
        this.isRunning = false;
        this.timerStarted = false;
        document.querySelector('#timer span').textContent = '60';
        document.querySelectorAll('.item-hidden').forEach(item => {
            item.style.pointerEvents = 'none';
        });
        const instruction = document.getElementById('instruction');
        const instructionTextEl = document.getElementById('instruction-text');
        const instructionNext = document.getElementById('instruction-next');
        if (!instruction || !instructionTextEl || !instructionNext) return;
        const text = "Kumpulkan semua barang di rumah dalam waktu 30 detik! Akan ada badai besar!";
        instruction.classList.remove('hidden');
        instructionTextEl.textContent = '';
        instructionNext.classList.add('hidden');
        instruction.style.pointerEvents = 'none';
        let i = 0;
        const typeNext = () => {
            if (i < text.length) {
                instructionTextEl.textContent += text[i];
                if (text[i] && text[i] !== ' ') {
                    soundManager.play('type');
                }
                i++;
                setTimeout(typeNext, 60);
            } else {
                instructionNext.classList.remove('hidden');
                instruction.style.pointerEvents = 'auto';
                const resumeGame = () => {
                    instruction.classList.add('hidden');
                    instruction.removeEventListener('click', resumeGame);
                    instructionNext.onclick = null;
                    document.querySelectorAll('.item-hidden').forEach(item => {
                        item.style.pointerEvents = 'auto';
                    });
                    this.timerStarted = true;
                    this.isRunning = true;
                    this.gameLoop();
                };
                instruction.addEventListener('click', resumeGame);
                instructionNext.onclick = resumeGame;
            }
        };
        typeNext();
    }

    startTimer() {
        if (!this.timerStarted) {
            return;
        }
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        this.timerInterval = setInterval(() => {
            if (!this.isRunning) return;
            this.timeLeft -= 1;
            document.querySelector('#timer span').textContent = Math.ceil(this.timeLeft);
            if (this.timeLeft <= 0) {
                this.pauseGame();
                this.endGame(false);
            }
        }, 1000);
    }
    resetItems() {
        document.querySelectorAll('.item-inventory').forEach(i => i.classList.remove('found'));
        document.querySelectorAll('.item-hidden').forEach(i => {
            i.classList.remove('found');
            i.style.pointerEvents = 'auto';
        });
        document.querySelector('#collected-items span').textContent = '0';
    }

    update() {
        if (this.isRunning && this.timerStarted) {
            this.timeLeft -= 1 / 60;
            document.querySelector('#timer span').textContent = Math.ceil(this.timeLeft);
            if (this.timeLeft <= 0) {
                this.endGame(false);
            }
        }
    }

    endGame(isWin) {
        this.isRunning = false;
        const message = isWin ? 'Selamat! Kamu Berhasil!' : 'Waktu Habis! Coba Lagi!';
        document.getElementById('result-message').textContent = message;
        document.getElementById('game-screen')?.classList.add('hidden');
        document.getElementById('end-screen')?.classList.remove('hidden');
        document.querySelector('.hud')?.classList.add('hidden');
        document.getElementById('items-container')?.classList.add('hidden');
        audioManager.stopBackgroundMusic();
        soundManager.play(isWin ? 'win' : 'lose');
        if (isWin) {
            showWinBackground();
            this.showCompletionMessage();
        } else {
            showLoseBackground();
        }
    }

    gameLoop() {
        if (this.isRunning) {
            this.update();
            requestAnimationFrame(() => this.gameLoop());
        }
    }
}

const audioManager = {
    backgroundMusic: null,
    init() {
        this.backgroundMusic = document.getElementById('bgMusic');
        if (this.backgroundMusic) {
            this.backgroundMusic.volume = 0.3;
        }
    },
    playBackgroundMusic() {
        if (this.backgroundMusic) {
            return this.backgroundMusic.play().catch(() => {});
        }
        return Promise.resolve();
    },
    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
        }
    }
};

let game;

function forceFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
    }
}

function checkOrientation() {
    const warning = document.getElementById('orientation-warning');
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const endScreen = document.getElementById('end-screen');
    const isLandscape = window.innerWidth > window.innerHeight;
    if (isLandscape) {
        warning?.classList.add('hidden');
        return true;
    } else {
        warning?.classList.remove('hidden');
        if (game?.isRunning) {
            game.pauseGame();
        }
        return false;
    }
}

export function handleOrientationWarning() {
    const orientationWarning = document.getElementById('orientation-warning');
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const endScreen = document.getElementById('end-screen');
    const isMobile = window.innerWidth < 900;
    const isPortrait = window.innerWidth < window.innerHeight;
    if (typeof window.__hasStartedGame === 'undefined') {
        window.__hasStartedGame = false;
    }
    if (isMobile && isPortrait) {
        if (orientationWarning) orientationWarning.classList.remove('hidden');
        if (startScreen) startScreen.style.visibility = 'hidden';
        if (gameScreen) gameScreen.style.visibility = 'hidden';
        if (endScreen) endScreen.style.visibility = 'hidden';
        document.body.style.overflow = 'hidden';
    } else {
        if (orientationWarning) orientationWarning.classList.add('hidden');
        if (!window.__hasStartedGame) {
            if (startScreen) {
                startScreen.classList.remove('hidden');
                startScreen.style.visibility = '';
            }
            if (gameScreen) gameScreen.style.visibility = 'hidden';
            if (endScreen) endScreen.style.visibility = 'hidden';
        } else {
            if (startScreen) startScreen.style.visibility = 'hidden';
            if (gameScreen && !gameScreen.classList.contains('hidden')) gameScreen.style.visibility = '';
            else if (gameScreen) gameScreen.style.visibility = 'hidden';
            if (endScreen && !endScreen.classList.contains('hidden')) endScreen.style.visibility = '';
            else if (endScreen) endScreen.style.visibility = 'hidden';
        }
        document.body.style.overflow = '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const startBtn = document.getElementById('start-btn');
    audioManager.init();
    const playSeaOnce = () => {
        soundManager.play('sea3');
        document.removeEventListener('click', playSeaOnce);
        document.removeEventListener('touchend', playSeaOnce);
    };
    document.addEventListener('click', playSeaOnce);
    document.addEventListener('touchend', playSeaOnce);
    checkOrientation();
    startBtn?.addEventListener('click', () => {
        const isLandscape = window.innerWidth > window.innerHeight;
        if (isLandscape) {
            forceFullscreen();
            if (!game) {
                game = new Game();
                window.__hasStartedGame = true;
            }
        }
    });
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            const isLandscape = window.innerWidth > window.innerHeight;
            if (isLandscape) {
                forceFullscreen();
                document.getElementById('orientation-warning')?.classList.add('hidden');
                document.getElementById('start-screen')?.classList.remove('hidden');
            }
        }, 500);
    });
    window.addEventListener('DOMContentLoaded', handleOrientationWarning);
    window.addEventListener('resize', handleOrientationWarning);
    window.addEventListener('orientationchange', () => setTimeout(handleOrientationWarning, 100));
});

function showLoseBackground() {
    const loseBg = document.querySelector('.background.lose-bg');
    if (loseBg) {
        loseBg.style.display = 'block';
        loseBg.style.zIndex = 1000;
        const msg = loseBg.querySelector('.lose-message');
        if (msg) {
            msg.style.display = 'block';
            const retryBtn = document.createElement('button');
            retryBtn.className = 'retry-button';
            retryBtn.textContent = 'Coba Lagi';
            retryBtn.onclick = () => {
                window.location.reload();
            };
            loseBg.appendChild(retryBtn);
        }
    }
}

function showWinBackground() {
    const winBg = document.querySelector('.background.win-bg');
    if (winBg) {
        winBg.style.display = 'block';
        winBg.style.zIndex = 1000;
        const msg = winBg.querySelector('.win-message');
        if (msg) {
            msg.style.display = 'block';
        }
        // Mainkan sound win (winn.mp3)
        const winSound = document.getElementById('winSound');
        if (winSound) {
            winSound.currentTime = 0;
            winSound.play().catch(() => {});
        }
    }
}

function onTimeUp() {
    showLoseBackground();
}
