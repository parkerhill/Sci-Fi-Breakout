// Game constants
const PADDLE_WIDTH = 100; // Smaller paddle for challenge
const PADDLE_HEIGHT = 15;
const PADDLE_SPEED = 25; // Faster paddle movement
const BALL_RADIUS = 8; // Smaller ball
const INITIAL_BALL_SPEED = 9; // Much faster initial ball speed
const BRICK_ROWS = 6; // Fewer rows = faster level completion
const BRICK_COLS = 10;
const BRICK_WIDTH = 60;
const BRICK_HEIGHT = 20;
const POWER_UP_DROP_RATE = 0.15; // More power-ups for excitement

// Game state
let canvas, ctx;
let paddle;
let ball;
let balls = []; // For multi-ball power-up
let bricks = [];
let powerUps = [];
let score = 0;
let lives = 4;
let level = 1;
let gameLoop;
let isGameRunning = false;

// Power-up variables
let widePaddleActive = false;
let widePaddleTimer = null;
let slowBallActive = false;
let slowBallTimer = null;

// Sound effects
let paddleHitSound;
let brickHitSound;

// Try to load sounds
try {
    paddleHitSound = new Audio('thumphi.wav');
    brickHitSound = new Audio('thumplo.wav');
} catch (e) {
    console.error('Could not load sounds:', e);
}

// Initialize game
function initGame() {
    console.log('Game initialization started');
    
    // Get canvas and context
    canvas = document.getElementById('game-canvas');
    if (!canvas) {
        console.error('Canvas element not found!');
        return;
    }
    
    ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('Could not get 2D context!');
        return;
    }
    
    console.log('Canvas initialized:', canvas.width, canvas.height);
    
    // Reset game state
    score = 0;
    lives = 4;
    level = 1;
    balls = [];
    powerUps = [];
    widePaddleActive = false;
    slowBallActive = false;
    
    if (widePaddleTimer) clearTimeout(widePaddleTimer);
    if (slowBallTimer) clearTimeout(slowBallTimer);
    
    // Set canvas size
    resizeCanvas();
    console.log('Canvas resized to:', canvas.width, canvas.height);
    
    // Initialize game objects
    paddle = {
        x: canvas.width / 2 - PADDLE_WIDTH / 2,
        y: canvas.height - PADDLE_HEIGHT - 10,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT,
        speed: PADDLE_SPEED,
        dx: 0 // For keyboard controls
    };
    console.log('Paddle initialized:', paddle);

    // Create the main ball
    ball = createBall();
    balls.push(ball);
    console.log('Ball created:', ball);

    // Create initial level
    createLevel(level);
    console.log('Level created with', bricks.length, 'bricks');
    
    // Set up event listeners
    setupEventListeners();
    console.log('Event listeners set up');
    
    // Start game loop
    isGameRunning = true;
    console.log('Starting game loop');
    gameLoop = requestAnimationFrame(update);
}

// Create level layout
function createLevel(levelNumber) {
    bricks = [];
    const rows = BRICK_ROWS;
    const cols = BRICK_COLS;
    const brickWidth = canvas.width / cols;
    const brickHeight = BRICK_HEIGHT;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Create bricks based on level pattern
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (shouldCreateBrick(levelNumber, row, col)) {
                const brick = {
                    x: col * brickWidth,
                    y: row * brickHeight + 50,
                    width: brickWidth,
                    height: brickHeight,
                    hits: getBrickHits(levelNumber, row, col),
                    type: getBrickType(levelNumber, row, col)
                };
                bricks.push(brick);
            }
        }
    }
}

// Check if brick should be created based on level pattern
function shouldCreateBrick(level, row, col) {
    switch (level) {
        case 1:
            return true; // Full grid
        case 2:
            return (row + col) % 2 === 0; // Checkerboard
        case 3:
            const centerRow = Math.floor(BRICK_ROWS / 2);
            const centerCol = Math.floor(BRICK_COLS / 2);
            return Math.abs(row - centerRow) + Math.abs(col - centerCol) <= 4; // Diamond
        case 4:
            return Math.random() > 0.3; // Sparse with gaps
        default:
            return true;
    }
}

// Get number of hits required for brick
function getBrickHits(level, row, col) {
    if (level >= 2 && Math.random() < (level - 1) * 0.2) {
        return 2; // Tough brick
    }
    return 1; // Standard brick
}

// Get brick type
function getBrickType(level, row, col) {
    return getBrickHits(level, row, col) === 2 ? 'tough' : 'standard';
}

// Update game state
function update() {
    if (!isGameRunning) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    drawBackground();
    
    // Update and draw paddle
    updatePaddle();
    drawPaddle();
    
    // Update and draw balls
    updateBalls();
    
    // Update and draw bricks
    updateBricks();
    
    // Update and draw power-ups
    updatePowerUps();
    
    // Draw HUD
    drawHUD();
    
    // Check if level is cleared
    if (bricks.length === 0) {
        levelUp();
    }
    
    // Check game over
    if (lives <= 0) {
        window.gameOver();
        return;
    }
    
    // Request next frame
    gameLoop = requestAnimationFrame(update);
}

// Draw background with starry gradient
function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#000022');
    gradient.addColorStop(1, '#000044');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add stars
    ctx.fillStyle = 'white';
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 2;
        ctx.fillRect(x, y, size, size);
    }
}

// Draw paddle with glow effect
function drawPaddle() {
    // Draw paddle
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    
    // Add glow effect
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 15;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.shadowBlur = 0;
}

// Generate a random neon color
function getRandomNeonColor() {
    const neonColors = [
        '#ff00ff', // Neon pink
        '#00ffff', // Neon cyan
        '#00ff00', // Neon green
        '#ffff00', // Neon yellow
        '#ff9900', // Neon orange
        '#ff0066', // Hot pink
        '#3300ff'  // Neon blue
    ];
    return neonColors[Math.floor(Math.random() * neonColors.length)];
}

// Draw all balls with enhanced trails
function drawBalls() {
    balls.forEach(ball => {
        // Update ball trail
        ball.trail.unshift({x: ball.x, y: ball.y});
        if (ball.trail.length > 10) ball.trail.pop();
        
        // Draw fancy ball trail
        for (let i = 0; i < ball.trail.length; i++) {
            const point = ball.trail[i];
            ctx.beginPath();
            ctx.arc(point.x, point.y, ball.radius * (1 - i * 0.09), 0, Math.PI * 2);
            
            // Gradient trail effect
            const alpha = 0.7 * (1 - i / ball.trail.length);
            ctx.fillStyle = ball.color.replace('rgb', 'rgba').replace(')', `,${alpha})`);
            if (ball.color.startsWith('#')) {
                // Handle hex colors
                ctx.fillStyle = hexToRgba(ball.color, alpha);
            }
            ctx.fill();
        }
        
        // Draw ball with glow effect
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.shadowColor = ball.color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = ball.color;
        ctx.fill();
        ctx.shadowBlur = 0;
    });
}

// Convert hex color to rgba
function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Draw HUD
function drawHUD() {
    ctx.fillStyle = '#00ffff';
    ctx.font = '16px Orbitron';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 20, 20);
    ctx.fillText(`Lives: ${lives}`, 20, 40);
    ctx.fillText(`Level: ${level}`, 20, 60);
}

// Resize canvas based on window size
function resizeCanvas() {
    const size = Math.min(window.innerWidth * 0.9, window.innerHeight * 0.9);
    canvas.width = size;
    canvas.height = size;
}

// Setup event listeners
function setupEventListeners() {
    // Mouse control
    canvas.addEventListener('mousemove', (e) => {
        // Only follow mouse if no keyboard input is active
        if (paddle.dx === 0) {
            const rect = canvas.getBoundingClientRect();
            paddle.x = e.clientX - rect.left - paddle.width / 2;
            paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, paddle.x));
        }
    });
    
    // Keyboard control
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') paddle.dx = -paddle.speed;
        if (e.key === 'ArrowRight') paddle.dx = paddle.speed;
    });
    
    document.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft' && paddle.dx < 0) paddle.dx = 0;
        if (e.key === 'ArrowRight' && paddle.dx > 0) paddle.dx = 0;
    });
    
    // Window resize
    window.addEventListener('resize', resizeCanvas);
}

// Create a new ball
function createBall() {
    // Add randomness to make each ball feel unique
    const randomSpeed = INITIAL_BALL_SPEED * (0.9 + Math.random() * 0.3); // +/- 10-30%
    return {
        x: canvas.width / 2,
        y: canvas.height - 30 - PADDLE_HEIGHT,
        radius: BALL_RADIUS,
        dx: randomSpeed * (Math.random() > 0.5 ? 1 : -1), // Random direction
        dy: -randomSpeed,
        speed: randomSpeed * (1 + (level - 1) * 0.15), // Increase speed with level (15% per level instead of 5%)
        trail: [], // For enhanced trail effect
        color: getRandomNeonColor() // Random neon color for each ball
    };
}

// Update paddle position
function updatePaddle() {
    // Move paddle based on keyboard input
    paddle.x += paddle.dx;
    
    // Keep paddle within canvas bounds
    paddle.x = Math.max(0, Math.min(canvas.width - paddle.width, paddle.x));
}

// Update all balls
function updateBalls() {
    // Keep track of balls to remove
    const ballsToRemove = [];
    
    // Update each ball
    balls.forEach((ball, index) => {
        // Apply ball speed (adjusted for slow ball power-up)
        const speedMultiplier = slowBallActive ? 0.8 : 1.0;
        
        // Move ball
        ball.x += ball.dx * speedMultiplier;
        ball.y += ball.dy * speedMultiplier;
        
        // Ball-wall collisions
        if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
            ball.dx = -ball.dx; // Reverse horizontal direction
        }
        
        if (ball.y - ball.radius < 0) {
            ball.dy = -ball.dy; // Reverse vertical direction
        }
        
        // Ball-paddle collision
        if (ball.y + ball.radius > paddle.y && 
            ball.x > paddle.x && 
            ball.x < paddle.x + paddle.width && 
            ball.y < paddle.y + paddle.height) {
            
            // Calculate hit position relative to paddle center (range: -0.5 to 0.5)
            const hitPos = (ball.x - (paddle.x + paddle.width / 2)) / paddle.width;
            
            // Adjust ball angle based on hit position
            ball.dx = ball.speed * hitPos * 2; // More angle for edge hits
            ball.dy = -Math.abs(ball.dy); // Always bounce upward
            
            // Play paddle hit sound
            try {
                paddleHitSound.currentTime = 0;
                paddleHitSound.play();
            } catch(e) {}
        }
        
        // Ball out of bounds (bottom)
        if (ball.y - ball.radius > canvas.height) {
            if (balls.length === 1) {
                // Last ball lost - lose a life
                lives--;
                
                if (lives > 0) {
                    // Reset ball
                    ball.x = canvas.width / 2;
                    ball.y = canvas.height - 30 - PADDLE_HEIGHT;
                    ball.dx = INITIAL_BALL_SPEED * (Math.random() > 0.5 ? 1 : -1);
                    ball.dy = -INITIAL_BALL_SPEED;
                }
            } else {
                // Remove this ball
                ballsToRemove.push(index);
            }
        }
    });
    
    // Remove lost balls (in reverse order to avoid index issues)
    for (let i = ballsToRemove.length - 1; i >= 0; i--) {
        balls.splice(ballsToRemove[i], 1);
    }
    
    // Draw all balls
    drawBalls();
}

// Explosion particle for dramatic brick breaking
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = Math.random() * 3 + 2;
        this.speedX = Math.random() * 6 - 3;
        this.speedY = Math.random() * 6 - 3;
        this.lifetime = 30;
    }
    
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.lifetime--;
    }
    
    draw() {
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// Store explosion particles
let particles = [];

// Update bricks and check for collisions
function updateBricks() {
    // Keep track of bricks to remove
    const bricksToRemove = [];
    
    // Update existing particles first
    particles = particles.filter(particle => {
        particle.update();
        particle.draw();
        return particle.lifetime > 0;
    });
    
    // Check each brick for collision with each ball
    bricks.forEach((brick, brickIndex) => {
        // Draw brick with glowing outline
        const brickColor = brick.type === 'standard' ? '#00bfff' : '#bf00ff'; // Neon blue or purple
        
        // Draw brick outline (glowing)
        ctx.fillStyle = brickColor;
        ctx.shadowColor = brickColor;
        ctx.shadowBlur = 10;
        ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
        
        // Draw inner brick (solid)
        ctx.shadowBlur = 0;
        ctx.fillStyle = brick.type === 'standard' ? '#003366' : '#330066'; // Darker inner color
        ctx.fillRect(brick.x + 2, brick.y + 2, brick.width - 4, brick.height - 4);
        
        // Check collision with each ball
        balls.forEach(ball => {
            if (ball.x + ball.radius > brick.x && 
                ball.x - ball.radius < brick.x + brick.width && 
                ball.y + ball.radius > brick.y && 
                ball.y - ball.radius < brick.y + brick.height) {
                
                // Determine collision side (top/bottom or left/right)
                const overlapX = Math.min(ball.x + ball.radius - brick.x, brick.x + brick.width - (ball.x - ball.radius));
                const overlapY = Math.min(ball.y + ball.radius - brick.y, brick.y + brick.height - (ball.y - ball.radius));
                
                if (overlapX < overlapY) {
                    ball.dx = -ball.dx; // Hit on sides
                } else {
                    ball.dy = -ball.dy; // Hit on top/bottom
                }
                
                // Add slight randomness to bounce for more dynamic gameplay
                ball.dx += (Math.random() - 0.5) * 0.5;
                ball.dy += (Math.random() - 0.5) * 0.5;
                
                // Reduce brick hits
                brick.hits--;
                
                // Play brick hit sound
                try {
                    brickHitSound.currentTime = 0;
                    brickHitSound.play();
                } catch(e) {}
                
                // Award points
                if (brick.type === 'standard') {
                    score += 10;
                } else {
                    score += 20;
                }
                
                // If brick is destroyed
                if (brick.hits <= 0) {
                    bricksToRemove.push(brickIndex);
                    
                    // Create explosion effect
                    const particleCount = brick.type === 'standard' ? 15 : 25;
                    for (let i = 0; i < particleCount; i++) {
                        particles.push(new Particle(
                            brick.x + brick.width / 2,
                            brick.y + brick.height / 2,
                            brickColor
                        ));
                    }
                    
                    // Maybe spawn a power-up (higher chance for tough bricks)
                    const powerUpChance = brick.type === 'standard' ? POWER_UP_DROP_RATE : POWER_UP_DROP_RATE * 1.5;
                    if (Math.random() < powerUpChance) {
                        spawnPowerUp(brick.x + brick.width / 2, brick.y + brick.height / 2);
                    }
                }
            }
        });
    });
    
    // Remove destroyed bricks (in reverse order)
    for (let i = bricksToRemove.length - 1; i >= 0; i--) {
        bricks.splice(bricksToRemove[i], 1);
    }
}

// Spawn a power-up
function spawnPowerUp(x, y) {
    const types = ['widePaddle', 'multiBall', 'slowBall'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    powerUps.push({
        x: x,
        y: y,
        width: 20,
        height: 20,
        dy: 3, // Fall speed
        type: type
    });
}

// Update power-ups
function updatePowerUps() {
    // Keep track of power-ups to remove
    const powerUpsToRemove = [];
    
    // Update each power-up
    powerUps.forEach((powerUp, index) => {
        // Move power-up down
        powerUp.y += powerUp.dy;
        
        // Draw power-up
        let color;
        switch (powerUp.type) {
            case 'widePaddle': 
                color = '#00ff00'; // Green
                break;
            case 'multiBall': 
                color = '#ff0000'; // Red
                break;
            case 'slowBall': 
                color = '#0000ff'; // Blue
                break;
        }
        
        // Draw power-up (glowing orb)
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(powerUp.x, powerUp.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Check collision with paddle
        if (powerUp.y + powerUp.height > paddle.y && 
            powerUp.x > paddle.x && 
            powerUp.x < paddle.x + paddle.width) {
            
            // Apply power-up effect
            applyPowerUp(powerUp.type);
            
            // Award points
            score += 100;
            
            // Remove power-up
            powerUpsToRemove.push(index);
        }
        
        // Power-up out of bounds
        if (powerUp.y > canvas.height) {
            powerUpsToRemove.push(index);
        }
    });
    
    // Remove collected power-ups
    for (let i = powerUpsToRemove.length - 1; i >= 0; i--) {
        powerUps.splice(powerUpsToRemove[i], 1);
    }
}

// Apply power-up effect
function applyPowerUp(type) {
    // Visual flash effect when power-up is collected
    flashScreen(type);
    
    switch (type) {
        case 'widePaddle':
            // Make paddle wider and add glow effect
            widePaddleActive = true;
            paddle.width = PADDLE_WIDTH * 1.8; // Even wider paddle (80% instead of 50%)
            paddle.color = '#00ff00'; // Green glow
            
            // Clear existing timer
            if (widePaddleTimer) clearTimeout(widePaddleTimer);
            
            // Set timer to revert power-up
            widePaddleTimer = setTimeout(() => {
                paddle.width = PADDLE_WIDTH;
                paddle.color = undefined; // Remove special color
                widePaddleActive = false;
            }, 12000); // 12 seconds (longer duration)
            break;
            
        case 'multiBall':
            // Add two extra balls instead of one
            if (balls.length < 3) { // Cap at 3 balls
                // Add first new ball
                const newBall1 = createBall();
                newBall1.x = balls[0].x;
                newBall1.y = balls[0].y;
                newBall1.dx = -balls[0].dx * 1.1; // Slightly faster in opposite direction
                balls.push(newBall1);
                
                // Add second new ball at an angle
                const newBall2 = createBall();
                newBall2.x = balls[0].x;
                newBall2.y = balls[0].y;
                newBall2.dx = balls[0].dy * 0.8; // Perpendicular to original ball
                newBall2.dy = -balls[0].dx * 0.8;
                balls.push(newBall2);
            }
            break;
            
        case 'slowBall':
            // Slow down the ball more dramatically
            slowBallActive = true;
            
            // Also make balls bigger temporarily for better visibility
            balls.forEach(ball => {
                ball.originalRadius = ball.radius;
                ball.radius *= 1.4;
                ball.color = '#0088ff'; // Blue color
            });
            
            // Clear existing timer
            if (slowBallTimer) clearTimeout(slowBallTimer);
            
            // Set timer to revert power-up
            slowBallTimer = setTimeout(() => {
                slowBallActive = false;
                // Restore original ball size
                balls.forEach(ball => {
                    if (ball.originalRadius) {
                        ball.radius = ball.originalRadius;
                        ball.originalRadius = undefined;
                    }
                    ball.color = getRandomNeonColor(); // New random color
                });
            }, 8000); // 8 seconds (shorter but more powerful)
            break;
    }
}

// Flash screen effect when power-up is collected
function flashScreen(type) {
    let color;
    switch (type) {
        case 'widePaddle': color = 'rgba(0, 255, 0, 0.2)'; break; // Green
        case 'multiBall': color = 'rgba(255, 0, 0, 0.2)'; break; // Red
        case 'slowBall': color = 'rgba(0, 100, 255, 0.2)'; break; // Blue
    }
    
    // Draw a full-screen rectangle with the power-up color
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add some particles from the paddle upward
    for (let i = 0; i < 30; i++) {
        particles.push(new Particle(
            paddle.x + paddle.width * Math.random(),
            paddle.y,
            color.replace('0.2', '1') // Full opacity for particles
        ));
    }
}

// Level up
function levelUp() {
    // Award points for completing level
    score += 500;
    
    // Increase level
    level++;
    
    // Reset ball and paddle
    balls = [createBall()];
    
    // Clear power-ups
    powerUps = [];
    
    // Reset power-up states
    widePaddleActive = false;
    slowBallActive = false;
    if (widePaddleTimer) clearTimeout(widePaddleTimer);
    if (slowBallTimer) clearTimeout(slowBallTimer);
    paddle.width = PADDLE_WIDTH;
    
    // Loop back to level 1 with increased difficulty after level 4
    if (level > 4) {
        level = 1;
        // Increase ball speed (capped at 2x initial)
        ball.speed = Math.min(INITIAL_BALL_SPEED * 2, INITIAL_BALL_SPEED * 1.2);
    }
    
    // Create new level
    createLevel(level);
}

// Export functions for UI.js to use
window.initGame = initGame;
window.endGame = () => {
    isGameRunning = false;
    cancelAnimationFrame(gameLoop);
};
// Export the getScore function to avoid recursive function calls
window.getScore = function() {
    return score;
};

// Game over function
window.gameOver = function() {
    isGameRunning = false;
    cancelAnimationFrame(gameLoop);
    if (typeof window.showGameOver === 'function') {
        window.showGameOver();
    } else {
        console.log('showGameOver function not found');
    }
};
