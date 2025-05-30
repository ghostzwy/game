import soundManager from './sound.js';

function requestFullscreenIfLandscape() {
    const isLandscape = window.innerWidth > window.innerHeight;
    const elem = document.documentElement;
    if (isLandscape && !document.fullscreenElement) {
        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(() => {});
        }
    }
}

function handleOrientationWarning() {
    const portraitWarning = document.getElementById('portrait-warning');
    const gameScreen = document.getElementById('game-screen');
    const isMobile = window.innerWidth < 900;
    const isPortrait = window.innerWidth < window.innerHeight;

    if (isMobile && isPortrait) {
        if (portraitWarning) portraitWarning.classList.remove('hidden');
        if (gameScreen) gameScreen.style.display = 'none';
        document.body.style.overflow = 'hidden';
        if (window.game && window.game.isRunning) window.game.pauseGame();
    } else {
        if (portraitWarning) portraitWarning.classList.add('hidden');
        if (gameScreen) gameScreen.style.display = '';
        document.body.style.overflow = '';
        if (window.game && !window.game.isRunning) window.game.resumeGame();
    }
}

function showLoseBackground() {
    const loseBg = document.querySelector('.background.lose-bg');
    if (loseBg) {
        loseBg.style.display = 'block';
        loseBg.style.zIndex = 1000;
        const msg = loseBg.querySelector('.lose-message');
        if (msg) {
            msg.style.display = 'block';
            msg.textContent = '';
            const text = 'yahh aku tidak sempat mengambil barang di rumah!!';
            let i = 0;
            function typeNext() {
                if (i < text.length) {
                    msg.textContent += text[i];
                    i++;
                    setTimeout(typeNext, 60);
                } else {
                    let retryBtn = loseBg.querySelector('.retry-button');
                    if (!retryBtn) {
                        retryBtn = document.createElement('button');
                        retryBtn.className = 'retry-button';
                        retryBtn.textContent = 'Coba Lagi';
                        loseBg.appendChild(retryBtn);
                    }
                    const newRetryBtn = retryBtn.cloneNode(true);
                    retryBtn.parentNode.replaceChild(newRetryBtn, retryBtn);
                    newRetryBtn.addEventListener('click', function() {
                        window.location.href = './index.html';
                    });
                    newRetryBtn.style.display = 'block';
                    newRetryBtn.style.opacity = '1';
                }
            }
            typeNext();
        }
    }
}

function showWinBackground() {
    const winBg = document.querySelector('.background.win-bg');
    if (winBg) {
        winBg.style.display = 'block';
        winBg.classList.add('show');
        winBg.style.zIndex = 1000;
        winBg.style.opacity = '1';

        const msg = winBg.querySelector('.win-message');
        let retryButton = winBg.querySelector('.retry-button');

        if (!retryButton) {
            retryButton = document.createElement('button');
            retryButton.className = 'retry-button';
            retryButton.textContent = 'Mau Main Lagi?';
            winBg.appendChild(retryButton);
        }

        const newRetryBtn = retryButton.cloneNode(true);
        retryButton.parentNode.replaceChild(newRetryBtn, retryButton);
        newRetryBtn.addEventListener('click', function() {
            window.location.href = '../index.html';
        });
        newRetryBtn.style.display = 'block';
        newRetryBtn.style.opacity = '1';

        if (msg) {
            msg.style.display = 'block';
            msg.textContent = '';

            const text = 'Alhamdulillah semua barang berhasil diselamatkan!!';
            let i = 0;
            function typeNext() {
                if (i < text.length) {
                    msg.textContent += text[i];
                    i++;
                    setTimeout(typeNext, 60);
                }
            }
            typeNext();
        }
    }
}

class Room2Game {
    constructor() {
        const waktuSisa = localStorage.getItem('sisaWaktu');
        this.timeLeft = waktuSisa ? parseFloat(waktuSisa) : 30;
        this.collectedItems = 0;
        this.isRunning = false;
        this.timerStarted = false;

        this.leftArrow = document.getElementById('arrow-left');
        if (this.leftArrow) {
            this.leftArrow.style.display = 'none';
        }

        this.rightArrow = document.getElementById('arrow-right');
        if (this.rightArrow) {
            this.rightArrow.style.display = 'block';
        }

        this.handleLoading();

        this.bindMethods();
        this.setupOrientationHandlers();
    }

    bindMethods() {
        this.collectItem = this.collectItem.bind(this);
        this.setupEventListeners = this.setupEventListeners.bind(this);
        this.pauseGame = this.pauseGame.bind(this);
        this.resumeGame = this.resumeGame.bind(this);
    }

    setupOrientationHandlers() {
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                handleOrientationWarning();
                this.rebindEventListeners();
            }, 100);
        });
        window.addEventListener('resize', () => {
            handleOrientationWarning();
            this.rebindEventListeners();
        });
    }

    handleLoading() {
        const loadingScreen = document.querySelector('.loading-screen');
        handleOrientationWarning();
        setTimeout(() => {
            loadingScreen?.classList.add('hidden');
            handleOrientationWarning();
            this.init();
        }, 500);
    }

    init() {
        this.setupEventListeners();
        this.showStartInstruction();
    }

    showStartInstruction() {
        this.isRunning = false;
        this.timerStarted = false;
        document.querySelector('#timer span').textContent = Math.ceil(this.timeLeft);

        document.querySelectorAll('.item-hidden').forEach(item => {
            item.style.pointerEvents = 'none';
        });

        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        const instruction = document.getElementById('instruction');
        const instructionTextEl = document.getElementById('instruction-text');
        const instructionNext = document.getElementById('instruction-next');

        if (!instruction || !instructionTextEl || !instructionNext) return;

        instruction.classList.remove('hidden');
        instructionTextEl.textContent = '';
        instructionNext.classList.add('hidden');
        instruction.style.pointerEvents = 'none';

        const text = 'Ambil semua barang penting di kamar sebelum waktu habis!';
        let i = 0;

        const typeNext = () => {
            if (i < text.length) {
                instructionTextEl.textContent += text[i];
                if (text[i] && text[i] !== ' ') {
                    soundManager.play('type');
                }
                i++;
                setTimeout(typeNext, 50);
            } else {
                instructionNext.classList.remove('hidden');
                instruction.style.pointerEvents = 'auto';

                const handleClick = () => {
                    instruction.classList.add('hidden');
                    instruction.removeEventListener('click', handleClick);
                    instructionNext.onclick = null;
                    document.querySelectorAll('.item-hidden').forEach(item => {
                        item.style.pointerEvents = 'auto';
                    });
                    this.timerStarted = true;
                    this.isRunning = true;
                    this.startTimer();
                };

                instruction.addEventListener('click', handleClick, { once: true });
                instructionNext.onclick = handleClick;
            }
        };

        typeNext();
    }

    showTransitionMessage(text) {
        this.pauseGame();

        const instruction = document.getElementById('instruction');
        const instructionTextEl = document.getElementById('instruction-text');
        const instructionNext = document.getElementById('instruction-next');

        if (!instruction || !instructionTextEl || !instructionNext) return;

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
                setTimeout(typeNext, 50);
            } else {
                instructionNext.classList.remove('hidden');
                instruction.style.pointerEvents = 'auto';

                const handleClick = () => {
                    instruction.classList.add('hidden');
                    instruction.removeEventListener('click', handleClick);
                    instructionNext.onclick = null;

                    if (this.leftArrow) {
                        this.leftArrow.style.display = 'block';
                        this.leftArrow.style.zIndex = '1000';

                        this.leftArrow.onclick = () => {
                            const gameArea = document.getElementById('game-area');

                            if (gameArea) {
                                gameArea.style.opacity = '0';
                                setTimeout(() => {
                                    gameArea.style.display = 'none';

                                    showWinBackground();
                                    const winnSound = new Audio('../assets/audio/winn.mp3');
                                    winnSound.play().catch(() => {});
                                }, 500);
                            }
                        };
                    }
                };

                instruction.addEventListener('click', handleClick);
                instructionNext.onclick = handleClick;
            }
        };

        typeNext();
    }

    setupEventListeners() {
        document.querySelectorAll('.item-hidden').forEach(item => {
            item.addEventListener('click', () => this.collectItem(item));
        });

        const handleArrowClick = () => {
            soundManager.play('click');
            const gameArea = document.getElementById('game-area');
            if (gameArea) {
                gameArea.classList.add('background-open');

                document.querySelectorAll('.item-hidden, .items-container, .hud').forEach(el => {
                    el.style.opacity = '0';
                    setTimeout(() => el.style.display = 'none', 500);
                });

                if (this.leftArrow) this.leftArrow.style.display = 'none';
                if (this.rightArrow) this.rightArrow.style.display = 'none';

                setTimeout(() => {
                    const instruction = document.getElementById('instruction');
                    const instructionTextEl = document.getElementById('instruction-text');
                    const instructionNext = document.getElementById('instruction-next');
                    const openMessage = document.querySelector('.open-message');

                    if (instruction && instructionTextEl && instructionNext) {
                        openMessage.style.display = 'block';
                        instruction.classList.remove('hidden');
                        instructionTextEl.textContent = '';
                        instructionNext.classList.add('hidden');
                        instruction.style.pointerEvents = 'none';

                        const text = 'kita harus segera keluar untuk mengevakuasi barang';
                        let i = 0;
                        const typeText = () => {
                            if (i < text.length) {
                                instructionTextEl.textContent += text[i];
                                if (text[i] !== ' ') {
                                    soundManager.play('type');
                                }
                                i++;
                                setTimeout(typeText, 60);
                            } else {
                                instructionNext.classList.remove('hidden');
                                instruction.style.pointerEvents = 'auto';

                                const handleClick = () => {
                                    instruction.classList.add('hidden');
                                    openMessage.style.display = 'none';
                                    gameArea.style.opacity = '0';

                                    setTimeout(() => {
                                        gameArea.style.display = 'none';
                                        const winBg = document.querySelector('.background.win-bg');
                                        if (winBg) {
                                            winBg.style.opacity = '0';
                                            winBg.style.display = 'block';
                                            winBg.style.transition = 'opacity 1s ease-in';
                                            setTimeout(() => {
                                                winBg.style.opacity = '1';
                                                const msg = winBg.querySelector('.win-message');
                                                if (msg) msg.style.display = 'block';
                                                const winnSound = new Audio('../assets/audio/winn.mp3');
                                                winnSound.play().catch(() => {});
                                            }, 50);
                                        }
                                    }, 500);
                                };

                                instruction.addEventListener('click', handleClick);
                                instructionNext.onclick = handleClick;
                            }
                        };

                        typeText();
                    }
                }, 600);
            }
        };

        if (this.leftArrow) {
            this.leftArrow.addEventListener('click', handleArrowClick);
        }
        if (this.rightArrow) {
            this.rightArrow.addEventListener('click', handleArrowClick);
        }
    }

    collectItem(item) {
        if (!this.isRunning || item.classList.contains('found')) return;

        this.collectedItems++;
        document.querySelector('#collected-items span').textContent = this.collectedItems;

        item.classList.add('found');
        item.style.pointerEvents = 'none';

        const name = item.getAttribute('data-name');
        const inventoryItem = document.querySelector(`.item-inventory[data-name="${name}"]`);
        if (inventoryItem) {
            inventoryItem.classList.add('found');
        }

        soundManager.play('collect');

        if (document.querySelectorAll('.item-hidden:not(.found)').length === 0) {
            this.isRunning = false;
            this.endGame(true);
        }
    }

    startGame() {
        this.isRunning = true;
        this.collectedItems = 0;

        const bgMusic = document.getElementById('bgMusic');
        if (bgMusic) {
            bgMusic.volume = 0.3;
            bgMusic.play().catch(() => {});
        }

        document.querySelectorAll('.item-inventory').forEach(i => i.classList.remove('found'));
        document.querySelectorAll('.item-hidden').forEach(i => {
            i.classList.remove('found');
            i.style.pointerEvents = 'auto';
        });

        document.querySelector('#collected-items span').textContent = '0';
        document.querySelector('#timer span').textContent = Math.ceil(this.timeLeft);
    }

    startTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        this.timerInterval = setInterval(() => {
            if (!this.isRunning || !this.timerStarted) return;

            this.timeLeft -= 1;
            document.querySelector('#timer span').textContent = Math.ceil(this.timeLeft);

            if (this.timeLeft <= 0) {
                this.pauseGame();
                soundManager.play('lose');
                showLoseBackground();
            }
        }, 1000);
    }

    endGame(isWin) {
        this.isRunning = false;
        localStorage.removeItem('sisaWaktu');

        const bgMusic = document.getElementById('bgMusic');
        if (bgMusic) {
            bgMusic.pause();
            bgMusic.currentTime = 0;
        }

        if (isWin) {
            const instruction = document.getElementById('instruction');
            const instructionTextEl = document.getElementById('instruction-text');
            const instructionNext = document.getElementById('instruction-next');

            if (instruction && instructionTextEl && instructionNext) {
                instruction.classList.remove('hidden');
                instructionTextEl.textContent = '';
                instructionNext.classList.add('hidden');
                instruction.style.pointerEvents = 'none';

                const text = 'alhamdulilah barang di kamar sudah di ambil sekarang waktunya keluar';
                let i = 0;

                const typeText = () => {
                    if (i < text.length) {
                        instructionTextEl.textContent += text[i];
                        if (text[i] !== ' ') {
                            soundManager.play('type');
                        }
                        i++;
                        setTimeout(typeText, 60);
                    } else {
                        instructionNext.classList.remove('hidden');
                        instruction.style.pointerEvents = 'auto';

                        const handleClick = () => {
                            instruction.classList.add('hidden');
                            if (this.leftArrow) {
                                this.leftArrow.style.display = 'block';
                            }
                            if (this.rightArrow) {
                                this.rightArrow.style.display = 'block';
                            }
                        };

                        instruction.addEventListener('click', handleClick);
                        instructionNext.onclick = handleClick;
                    }
                };

                typeText();
            }
        } else {
            soundManager.play('lose');
            showLoseBackground();
        }
    }

    pauseGame() {
        this.isRunning = false;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
    }

    resumeGame() {
        this.isRunning = true;
        this.startTimer();
    }

    rebindEventListeners() {
        document.querySelectorAll('.item-hidden').forEach(item => {
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
            newItem.addEventListener('click', () => this.collectItem(newItem));
        });
    }
}

window.game = null;

document.addEventListener('DOMContentLoaded', () => {
    handleOrientationWarning();
    document.addEventListener('click', requestFullscreenIfLandscape, { once: true });
    document.addEventListener('touchend', requestFullscreenIfLandscape, { once: true });
    window.game = new Room2Game();
});

export default Room2Game;
