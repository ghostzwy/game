class SoundManager {
    constructor() {
        this.sounds = {
            background: document.getElementById('bgMusic'),
            collect: document.getElementById('collectSound'),
            win: document.getElementById('winSound'),
            lose: document.getElementById('loseSound'),
            type: document.getElementById('typeSound') 
                };

        this.volumes = {
            background: 0.3,
            collect: 0.4,
            win: 0.5,
            lose: 0.4,
            type: 0.5 
        };

        this.initializeSounds();
    }

    initializeSounds() {
        Object.entries(this.sounds).forEach(([key, audio]) => {
            if (audio) {
                audio.load();
                audio.volume = this.volumes[key];
            }
        });
    }

    play(soundName) {
        const sound = this.sounds[soundName];
        if (!sound) return;

        try {
            sound.currentTime = 0;
            sound.play().catch(error => {
                console.warn(`Sound play failed (${soundName}):`, error);
            });
        } catch (error) {
            console.warn(`Sound system error (${soundName}):`, error);
        }
    }

    startBackgroundMusic() {
        const bgMusic = this.sounds.background;
        if (bgMusic && bgMusic.paused) {
            bgMusic.loop = true;
            this.play('background');
        }
    }

    stopBackgroundMusic() {
        const bgMusic = this.sounds.background;
        if (bgMusic && !bgMusic.paused) {
            bgMusic.pause();
            bgMusic.currentTime = 0;
        }
    }
}

const soundManager = new SoundManager();
export default soundManager;