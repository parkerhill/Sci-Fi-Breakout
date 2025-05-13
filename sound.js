// Load audio files
const paddleHitSound = new Audio('assets/audio/paddle_hit.wav');
const brickHitSound = new Audio('assets/audio/brick_hit.wav');
const powerUpSound = new Audio('assets/audio/power_up.wav');
const levelUpSound = new Audio('assets/audio/level_up.wav');
const gameOverSound = new Audio('assets/audio/game_over.wav');
const wallHitSound = new Audio('assets/audio/wall_hit.wav');
const lifeLostSound = new Audio('assets/audio/life_lost.wav');

// Function to play sounds
function playPaddleHit() {
    paddleHitSound.play();
}

function playBrickHit() {
    brickHitSound.play();
}

function playPowerUp() {
    powerUpSound.play();
}

function playLevelUp() {
    levelUpSound.play();
}

function playGameOver() {
    gameOverSound.play();
}

function playWallHit() {
    wallHitSound.play();
}

function playLifeLost() {
    lifeLostSound.play();
}

// Make functions available globally
window.playPaddleHit = playPaddleHit;
window.playBrickHit = playBrickHit;
window.playPowerUp = playPowerUp;
window.playLevelUp = playLevelUp;
window.playGameOver = playGameOver;
window.playWallHit = playWallHit;
window.playLifeLost = playLifeLost;
