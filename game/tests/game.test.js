import { Game } from '../src/js/index.js';

describe('Game Logic Tests', () => {
    let game;

    beforeEach(() => {
        // Setup DOM elements
        document.body.innerHTML = `
            <div id="start-screen"></div>
            <div id="game-screen"></div>
            <div id="end-screen"></div>
            <div id="timer"><span></span></div>
            <div id="collected-items"><span></span></div>
            <div id="result-message"></div>
            <audio id="bgMusic"></audio>
        `;
        game = new Game();
    });

    afterEach(() => {
        document.body.innerHTML = '';
        jest.clearAllMocks();
    });

    test('harus menginisialisasi game dengan nilai default yang benar', () => {
        expect(game.isRunning).toBe(false);
        expect(game.timeLeft).toBe(60);
        expect(game.collectedItems).toBe(0);
    });

    test('harus memulai game dengan benar', () => {
        game.start();
        expect(game.isRunning).toBe(true);
        expect(game.timeLeft).toBeCloseTo(60, 1); // toleransi desimal
    });

    test('harus mengumpulkan item dengan benar', () => {
        game.start();
        game.collectItem();
        expect(game.collectedItems).toBe(1);
    });

    test('harus mengakhiri game ketika waktu habis', () => {
        game.start();
        game.timeLeft = 0;
        game.update();
        expect(game.isRunning).toBe(false);
    });
});