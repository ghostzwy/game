class MockAudio {
    constructor() {
        this.paused = true;
        this.currentTime = 0;
    }
    play() {
        this.paused = false;
        return Promise.resolve();
    }
    pause() {
        this.paused = true;
    }
}
global.Audio = MockAudio;
window.HTMLMediaElement.prototype.play = () => Promise.resolve();
window.HTMLMediaElement.prototype.pause = () => {};
Object.defineProperty(window.HTMLMediaElement.prototype, 'currentTime', {
    configurable: true,
    get() { return this._currentTime || 0; },
    set(val) { this._currentTime = val; }
});
global.requestAnimationFrame = callback => setTimeout(callback, 0);