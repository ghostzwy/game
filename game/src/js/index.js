import soundManager from './sound.js';

function checkLandscape() {
    const warning = document.getElementById('landscape-warning');
    const isMobile = isMobileDevice();
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
            this.isRunning = false;
            setTimeout(() => {
                let handled = false;
                const afterInstruksi = () => {
                    if (handled) return;
                    handled = true;
                    showRoomTransition(() => this.gotoRuang2());
                };
                this.showTypingInstruction(
                    'akhirnya barang di ruang tamu sudah berhasil dikumpulkan! Sekarang ke kamar untuk mengambil barang yang lainya',
                    60,
                    false,
                    false,
                    afterInstruksi
                );
                const instruction = document.getElementById('instruction');
                const instructionNext = document.getElementById('instruction-next');
                if (instruction && instructionNext) {
                    instruction.onclick = afterInstruksi;
                    instructionNext.onclick = afterInstruksi;
                }
            }, 350);
            return;
        }
        if (
            this.areas[this.currentArea] === 'ruang2' &&
            document.querySelectorAll('.item-ruang2:not(.found)').length === 0
        ) {
            this.isRunning = false;
            setTimeout(() => {
                this.showTypingInstructionWithBack(
                    'Semua barang di kamar sudah berhasil dikumpulkan! Sekarang keluar rumah ke tempat aman!',
                    60,
                    () => {
                        this.gotoRuang3Simple();
                    }
                );
            }, 350);
            return;
        }
        if (
            this.areas[this.currentArea] === 'ruang3' &&
            document.querySelectorAll('.item-ruang3:not(.found)').length === 0
        ) {
            this.isRunning = false;
            setTimeout(() => {
                this.showBackOnlyInstruction(() => {
                    this.gotoRuang4Win();
                });
            }, 350);
            return;
        }
    }

    showBackOnlyInstruction(callback = null, message = null) {
        const instruction = document.getElementById('instruction');
        const instructionContainer = document.querySelector('.instruction-container');
        const instructionTextEl = document.getElementById('instruction-text');
        const instructionNext = document.getElementById('instruction-next');
        if (instructionTextEl) instructionTextEl.textContent = '';
        if (instructionNext) instructionNext.classList.add('hidden');
        if (instructionContainer) instructionContainer.innerHTML = '';
        let backBtn = document.getElementById('back-instruksi');
        if (!backBtn) {
            backBtn = document.createElement('span');
            backBtn.id = 'back-instruksi';
        }
        backBtn.textContent = '< back';
        backBtn.style.cursor = 'pointer';
        backBtn.style.fontSize = '2em';
        backBtn.style.padding = '18px 40px';
        backBtn.style.background = 'rgba(0,0,0,0.25)';
        backBtn.style.borderRadius = '16px';
        backBtn.style.fontWeight = 'bold';
        backBtn.style.color = '#ffd700';
        backBtn.style.display = 'inline-block';
        backBtn.style.margin = '0 auto';
        backBtn.style.textAlign = 'center';
        if (instructionContainer) {
            instructionContainer.style.justifyContent = 'center';
            instructionContainer.style.alignItems = 'center';
            instructionContainer.innerHTML = '';
            if (message) {
                const msg = document.createElement('div');
                msg.style.textAlign = 'center';
                msg.style.fontSize = '1.5em';
                msg.style.fontWeight = 'bold';
                msg.style.color = '#fff';
                msg.style.marginBottom = '24px';
                msg.textContent = message;
                instructionContainer.appendChild(msg);
            }
            instructionContainer.appendChild(backBtn);
        }
        instruction.classList.remove('hidden');
        instruction.style.pointerEvents = 'auto';
        backBtn.onclick = () => {
            instruction.classList.add('hidden');
            backBtn.classList.add('hidden');
            if (typeof callback === 'function') callback();
        };
        instruction.onclick = backBtn.onclick;
        backBtn.classList.remove('hidden');
    }

    showBackOnlyInstruction(callback = null, message = null, buttonText = null, ruang4Clean = false, verticalLayout = false) {
        const instruction = document.getElementById('instruction');
        const instructionContainer = document.querySelector('.instruction-container');
        const instructionTextEl = document.getElementById('instruction-text');
        const instructionNext = document.getElementById('instruction-next');
        if (instructionTextEl) instructionTextEl.textContent = '';
        if (instructionNext) instructionNext.classList.add('hidden');
        if (instructionContainer) instructionContainer.innerHTML = '';
        if (ruang4Clean && instruction) {
            instruction.classList.add('ruang4-clear-bg');
        } else if (instruction) {
            instruction.classList.remove('ruang4-clear-bg');
        }
        if (instructionContainer && verticalLayout) {
            instructionContainer.style.flexDirection = 'column';
            instructionContainer.style.justifyContent = 'center';
            instructionContainer.style.alignItems = 'center';
            instructionContainer.innerHTML = '';
            if (message) {
                const msg = document.createElement('div');
                msg.style.textAlign = 'center';
                msg.style.fontSize = '1.5em';
                msg.style.fontWeight = 'bold';
                msg.style.color = '#fff';
                msg.style.marginBottom = buttonText ? '32px' : '0';
                msg.textContent = message;
                instructionContainer.appendChild(msg);
            }
            if (buttonText) {
                let backBtn = document.getElementById('back-instruksi');
                if (!backBtn) {
                    backBtn = document.createElement('span');
                    backBtn.id = 'back-instruksi';
                }
                backBtn.textContent = buttonText;
                backBtn.style.cursor = 'pointer';
                backBtn.style.fontSize = '2em';
                backBtn.style.padding = '18px 40px';
                backBtn.style.background = 'rgba(0,0,0,0.25)';
                backBtn.style.borderRadius = '16px';
                backBtn.style.fontWeight = 'bold';
                backBtn.style.color = '#ffd700';
                backBtn.style.display = 'block';
                backBtn.style.margin = '0 auto';
                backBtn.style.textAlign = 'center';
                instructionContainer.appendChild(backBtn);
                instruction.classList.remove('hidden');
                instruction.style.pointerEvents = 'auto';
                backBtn.onclick = () => {
                    instruction.classList.add('hidden');
                    backBtn.classList.add('hidden');
                    let overlay = document.getElementById('win-dark-overlay');
                    if (overlay) overlay.style.display = 'none';
                    if (typeof callback === 'function') callback();
                };
                instruction.onclick = backBtn.onclick;
                backBtn.classList.remove('hidden');
                return;
            } else {
                instruction.classList.remove('hidden');
                instruction.style.pointerEvents = 'none';
                return;
            }
        }
        let backBtn = document.getElementById('back-instruksi');
        if (!backBtn) {
            backBtn = document.createElement('span');
            backBtn.id = 'back-instruksi';
        }
        backBtn.textContent = buttonText || '< back';
        backBtn.style.cursor = 'pointer';
        backBtn.style.fontSize = '2em';
        backBtn.style.padding = '18px 40px';
        backBtn.style.background = 'rgba(0,0,0,0.25)';
        backBtn.style.borderRadius = '16px';
        backBtn.style.fontWeight = 'bold';
        backBtn.style.color = '#ffd700';
        backBtn.style.display = 'inline-block';
        backBtn.style.margin = '0 auto';
        backBtn.style.textAlign = 'center';
        if (instructionContainer) {
            instructionContainer.style.flexDirection = '';
            instructionContainer.style.justifyContent = 'center';
            instructionContainer.style.alignItems = 'center';
            instructionContainer.innerHTML = '';
            if (message) {
                const msg = document.createElement('div');
                msg.style.textAlign = 'center';
                msg.style.fontSize = '1.5em';
                msg.style.fontWeight = 'bold';
                msg.style.color = '#fff';
                msg.style.marginBottom = '24px';
                msg.textContent = message;
                instructionContainer.appendChild(msg);
            }
            instructionContainer.appendChild(backBtn);
        }
        instruction.classList.remove('hidden');
        instruction.style.pointerEvents = 'auto';
        backBtn.onclick = () => {
            instruction.classList.add('hidden');
            backBtn.classList.add('hidden');
            if (typeof callback === 'function') callback();
        };
        instruction.onclick = backBtn.onclick;
        backBtn.classList.remove('hidden');
    }

    showTypingInstructionWithBack(text, speed = 80, callback = null) {
        const instruction = document.getElementById('instruction');
        const instructionTextEl = document.getElementById('instruction-text');
        const instructionNext = document.getElementById('instruction-next');
        const instructionContainer = document.querySelector('.instruction-container');
        instruction.classList.add('ruang2-instruction');
        let backBtn = document.getElementById('back-instruksi');
        if (!backBtn) {
            backBtn = document.createElement('span');
            backBtn.id = 'back-instruksi';
        }
        backBtn.textContent = '< BACK';
        backBtn.style.cursor = 'pointer';
        backBtn.style.fontSize = '1.2em';
        backBtn.style.padding = '6px 16px';
        backBtn.style.background = 'rgba(0,0,0,0.2)';
        backBtn.style.borderRadius = '7px';
        backBtn.style.fontWeight = 'bold';
        backBtn.style.color = '#ffd700';
        backBtn.style.marginRight = '10px';
        backBtn.style.marginBottom = '0';
        backBtn.classList.add('hidden');
        if (instructionContainer) {
            instructionContainer.innerHTML = '';
            instructionContainer.style.flexDirection = 'row';
            instructionContainer.style.alignItems = 'center';
            instructionContainer.appendChild(backBtn);
            instructionContainer.appendChild(instructionTextEl);
        }
        instructionNext.classList.add('hidden');
        instruction.classList.remove('hidden');
        instructionTextEl.textContent = '';
        instruction.style.pointerEvents = 'none';
        let i = 0;
        const typeNext = () => {
            if (i < text.length) {
                instructionTextEl.textContent += text[i];
                i++;
                setTimeout(typeNext, speed);
            } else {
                backBtn.classList.remove('hidden');
                instruction.style.pointerEvents = 'auto';
                backBtn.onclick = () => {
                    instruction.classList.add('hidden');
                    backBtn.classList.add('hidden');
                    instructionTextEl.textContent = '';
                    instruction.classList.remove('ruang2-instruction');
                    if (typeof callback === 'function') callback();
                };
                instruction.onclick = backBtn.onclick;
            }
        };
        typeNext();
    }

    gotoRuang2() {
        const bg = document.getElementById('background');
        if (bg) {
            bg.style.backgroundImage = "url('/src/assets/images/bedroom.png')";
        }
        const gameScreen = document.getElementById('game-screen');
        if (gameScreen) {
            gameScreen.style.backgroundImage = "url('/src/assets/images/bedroom.png')";
            gameScreen.style.backgroundSize = 'cover';
        }
        document.querySelectorAll('.item-ruang1').forEach(item => {
            item.classList.add('hidden');
            item.style.display = 'none';
        });
        document.getElementById('items-container-ruang1')?.classList.add('hidden');
        document.querySelectorAll('.item-ruang2').forEach(item => {
            item.classList.remove('hidden');
            item.style.display = 'block';
            item.style.pointerEvents = 'auto';
        });
        document.getElementById('items-container-ruang2')?.classList.remove('hidden');
        this.currentArea = 1;
        document.querySelectorAll('.item-ruang2').forEach(item => {
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
            newItem.style.pointerEvents = 'auto';
            newItem.style.display = 'block';
            newItem.classList.remove('hidden');
            newItem.addEventListener('click', () => this.collectItem(newItem));
        });
        document.querySelector('#timer span').textContent = Math.ceil(this.timeLeft);
        this.timerStarted = true;
        this.isRunning = true;
        this.startTimer();
    }
    
    gotoRuang3Simple() {
        document.querySelectorAll('.item-ruang1, .item-ruang2, .hud, #items-container-ruang1, #items-container-ruang2, #items-container-ruang3, #area-navigation, #character').forEach(el => {
            el.classList.add('hidden');
            if (el.style) el.style.display = 'none';
        });
        document.getElementById('ruang3-bg')?.classList.remove('hidden');
        const bg = document.getElementById('background');
        if (bg) {
            bg.style.backgroundImage = "url('/src/assets/images/open.jpg')";
            bg.style.filter = '';
        }
        const gameScreen = document.getElementById('game-screen');
        if (gameScreen) {
            gameScreen.style.backgroundImage = "url('/src/assets/images/open.jpg')";
            gameScreen.style.backgroundSize = 'cover';
            gameScreen.style.filter = '';
        }
        this.currentArea = 2;
        this.isRunning = false;
        this.timerStarted = false;
        setTimeout(() => {
            this.showBackOnlyInstruction(() => {
                this.gotoRuang4Win();
            });
        }, 1200);
    }

    gotoRuang4Win() {
        document.querySelectorAll('.item-ruang1, .item-ruang2, .item-ruang3, .hud, #items-container-ruang1, #items-container-ruang2, #items-container-ruang3, #area-navigation, #character').forEach(el => {
            el.classList.add('hidden');
            if (el.style) el.style.display = 'none';
        });
        const bg = document.getElementById('background');
        if (bg) {
            bg.style.backgroundImage = "url('/src/assets/images/win.png')";
        }
        const gameScreen = document.getElementById('game-screen');
        if (gameScreen) {
            gameScreen.style.backgroundImage = "url('/src/assets/images/win.png')";
            gameScreen.style.backgroundSize = 'cover';
        }
        let winnAudio = document.getElementById('winnSound');
        if (!winnAudio) {
            winnAudio = document.createElement('audio');
            winnAudio.id = 'winnSound';
            winnAudio.src = '/src/assets/audio/winn.mp3';
            winnAudio.preload = 'auto';
            document.body.appendChild(winnAudio);
        }
        let winDelay = 0;
        try {
            winnAudio.currentTime = 0;
            winnAudio.play();
            winDelay = (winnAudio.duration && !isNaN(winnAudio.duration)) ? Math.ceil(winnAudio.duration * 1000) : 1200;
        } catch (e) {
            winDelay = 1200;
        }
        setTimeout(() => {
            this.showBackOnlyInstruction(
                null,
                'Alhamdulillah semua barang berhasil diselamatkan!!',
                null,
                true,
                true
            );
            const showMainLagi = () => {
                this.showBackOnlyInstruction(() => {
                    window.location.reload();
                }, 'Alhamdulillah semua barang berhasil diselamatkan!!', 'AYO MAINKAN LAGI😊', false, true);
                setTimeout(() => {
                    const backBtn = document.getElementById('back-instruksi');
                    if (backBtn) {
                        backBtn.style.opacity = '0';
                        backBtn.style.transform = 'scale(0.7) rotate(-10deg)';
                        backBtn.style.transition = 'opacity 0.5s cubic-bezier(0.4,0,0.2,1), transform 0.5s cubic-bezier(0.4,0,0.2,1)';
                        setTimeout(() => {
                            backBtn.style.opacity = '1';
                            backBtn.style.transform = 'scale(1) rotate(0deg)';
                            backBtn.classList.add('main-lagi-bounce');
                            setTimeout(() => {
                                backBtn.classList.remove('main-lagi-bounce');
                            }, 1200);
                        }, 10);
                    }
                }, 50);
            };
            if (winnAudio) {
                let shown = false;
                const showIfNotYet = () => { if (!shown) { shown = true; setTimeout(showMainLagi, 7000); } };
                winnAudio.onended = showIfNotYet;
                setTimeout(showIfNotYet, winDelay);
            } else {
                setTimeout(showMainLagi, 7000);
            }
        }, 350);
        this.isRunning = false;
    }

    showKamarWarningInstruction(callback) {
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
        roomArrow.innerHTML = `
        <svg width="48" height="48" viewBox="0 0 48 48" style="vertical-align:middle;">
            <circle cx="24" cy="24" r="22" fill="#27ae60" stroke="#fff" stroke-width="3"/>
            <polyline points="18,14 30,24 18,34" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        `;
        roomArrow.classList.remove('hidden');
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
                instruction.style.pointerEvents = 'auto';
                roomArrow.onclick = () => {
                    soundManager.play('click');
                    const gameScreen = document.getElementById('game-screen');
                    if (gameScreen) {
                        gameScreen.classList.add('area-slide-right');
                        setTimeout(() => {
                            gameScreen.classList.remove('area-slide-right');
                            instruction.classList.add('hidden');
                            instructionTextEl.textContent = '';
                            roomArrow.classList.add('hidden');
                            if (typeof callback === 'function') callback();
                        }, 500);
                    } else {
                        instruction.classList.add('hidden');
                        instructionTextEl.textContent = '';
                        roomArrow.classList.add('hidden');
                        if (typeof callback === 'function') callback();
                    }
                };
                instruction.onclick = roomArrow.onclick;
            }
        };
        typeNext();
    }

    showTypingInstruction(text, speed = 80, lanjutGame = true, showHudAfter = false, callback = null) {
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
        document.querySelector('#timer span').textContent = '30';
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

function isPortrait() {
    if (window.matchMedia) {
        return window.matchMedia("(orientation: portrait)").matches;
    }
    return window.innerHeight > window.innerWidth;
}

function isMobileDevice() {
    return (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) &&
        (('ontouchstart' in window) || (navigator.maxTouchPoints > 0))
    );
}

function checkOrientation() {
    const warning = document.getElementById('orientation-warning');
    const landscapeWarning = document.getElementById('landscape-warning');
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const endScreen = document.getElementById('end-screen');
    const mobile = isMobileDevice();
    const portrait = isPortrait();
    if (typeof window.__hasStartedGame === 'undefined') {
        window.__hasStartedGame = false;
    }
    if (mobile && portrait) {
        if (warning) warning.classList.remove('hidden');
        if (landscapeWarning) landscapeWarning.classList.remove('hidden');
        if (startScreen) startScreen.style.visibility = 'hidden';
        if (gameScreen) gameScreen.style.visibility = 'hidden';
        if (endScreen) endScreen.style.visibility = 'hidden';
        document.body.style.overflow = 'hidden';
    } else {
        if (warning) warning.classList.add('hidden');
        if (landscapeWarning) landscapeWarning.classList.add('hidden');
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

export function handleOrientationWarning() {
    const orientationWarning = document.getElementById('orientation-warning');
    const startScreen = document.getElementById('start-screen');
    const gameScreen = document.getElementById('game-screen');
    const endScreen = document.getElementById('end-screen');
    const isMobile = isMobileDevice();
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
    window.addEventListener('DOMContentLoaded', () => {
        checkOrientation();
    });
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', () => setTimeout(checkOrientation, 100));
});
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
                        window.location.reload();
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
        winBg.style.zIndex = 1000;
        const msg = winBg.querySelector('.win-message');
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
            window.location.reload();
        });
        newRetryBtn.style.display = 'block';
        newRetryBtn.style.opacity = '1';
    }
}

function checkAllItemsCollected() {
    if (typeof itemsRuang1 !== 'undefined' && typeof collectedItems !== 'undefined') {
        if (itemsRuang1.every(item => collectedItems.includes(item))) {
            changeBackground('assets/images/bedroom.png');
        }
    }
}

function onItemCollected(itemName) {
    if (typeof collectedItems !== 'undefined') {
        collectedItems.push(itemName);
        checkAllItemsCollected();
    }
}

function changeBackground(imageName) {
    const bg = document.getElementById('background');
    if (bg) {
        bg.style.backgroundImage = `url('/src/${imageName.replace(/^src\//, "")}')`;
    } else {
        const gameScreen = document.getElementById('game-screen');
        if (gameScreen) {
            gameScreen.style.backgroundImage = `url('/src/${imageName.replace(/^src\//, "")}')`;
            gameScreen.style.backgroundSize = 'cover';
        }
    }
}

function showRoomTransition(callback) {
    const overlay = document.getElementById('transition-overlay');
    if (!overlay) {
        if (typeof callback === 'function') callback();
        return;
    }
    overlay.classList.remove('hidden');
    overlay.classList.add('active');
    setTimeout(() => {
        if (typeof callback === 'function') callback();
        setTimeout(() => {
            overlay.classList.remove('active');
            setTimeout(() => {
                overlay.classList.add('hidden');
            }, 700);
        }, 400);
    }, 700);
}