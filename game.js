// Game constants
const PADDLE_WIDTH = 110; // Moderately sized paddle for balance
const PADDLE_HEIGHT = 15;
const PADDLE_SPEED = 28 ; // Fast paddle movement but not extreme
const BALL_RADIUS = 8; // Moderately sized ball
const INITIAL_BALL_SPEED = 11; // Fast but playable ball speed
const MIN_BALL_SPEED = 7; // Minimum speed to prevent slow gameplay
const MAX_BALL_SPEED = 18; // Maximum speed to keep game playable
const WALL_BOUNCE_ANGLE_ADJUST = 0.25; // Angle adjustment for side wall bounces
const BRICK_ROWS = 6; // Balanced number of rows
const BRICK_COLS = 10; // Standard columns
const BRICK_WIDTH = 60;
const BRICK_HEIGHT = 28;
const POWER_UP_DROP_RATE = 0.20; // Frequent power-ups without overwhelming

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
let powerUpSound;
let levelUpSound;
let gameOverSound;
let wallHitSound;
let lifeLostSound;

// Simple function to play any sound effect
function tryPlaySound(sound) {
    if (sound) {
        try {
            // Reset the sound position
            sound.currentTime = 0;
            // Play the sound
            sound.play().catch(e => {
                // Silently handle errors - browser might not allow autoplay
                console.log('Could not play sound: ' + e.message);
            });
        } catch (e) {
            // Fallback error handling
            console.log('Error playing sound: ' + e.message);
        }
    }
}

// Get sound elements from the DOM
function initSounds() {
    // Get sound elements
    paddleHitSound = document.getElementById('paddle-hit-sound');
    brickHitSound = document.getElementById('brick-hit-sound');
    powerUpSound = document.getElementById('power-up-sound');
    levelUpSound = document.getElementById('level-up-sound');
    gameOverSound = document.getElementById('game-over-sound');
    wallHitSound = document.getElementById('wall-hit-sound');
    lifeLostSound = document.getElementById('life-lost-sound');
    
    // Set volumes for clearer sounds
    if (paddleHitSound) paddleHitSound.volume = 0.7;
    if (brickHitSound) brickHitSound.volume = 0.6;
    if (powerUpSound) powerUpSound.volume = 0.8;
    if (levelUpSound) levelUpSound.volume = 0.8;
    if (gameOverSound) gameOverSound.volume = 0.8;
    if (wallHitSound) wallHitSound.volume = 0.4;
    if (lifeLostSound) lifeLostSound.volume = 0.7;
    
    console.log('Sound initialization complete');
}

// Play a sound with error handling
function playSound(sound) {
    // Use our simplified sound function
    tryPlaySound(sound);
}

// Initialize game
function initGame() {
    console.log('Game initialization started');
    
    // Initialize sounds
    initSounds();
    
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

// Create level layout with Sacsayhuamán-inspired megalithic structure
function createLevel(levelNumber) {
    bricks = [];
    const rows = BRICK_ROWS;
    const cols = BRICK_COLS;
    
    // Base brick dimensions
    const baseBrickWidth = canvas.width / cols;
    const baseBrickHeight = BRICK_HEIGHT;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Generate megalithic brick pattern with irregular shapes that fit together
    // Create a jigsaw-like pattern with interlocking stones inspired by Incan architecture
    
    // First create a grid of points with slight variations
    const gridPoints = [];
    const jitterAmount = baseBrickWidth * 0.2; // Amount of irregularity in the grid
    
    // Create grid points with jitter (one more than needed to define the brick boundaries)
    for (let r = 0; r <= rows; r++) {
        gridPoints[r] = [];
        for (let c = 0; c <= cols; c++) {
            // Add jitter to points (except edges)
            let jitterX = 0;
            let jitterY = 0;
            
            // Don't jitter the outer edges to maintain canvas boundaries
            if (r > 0 && r < rows && c > 0 && c < cols) {
                jitterX = (Math.random() - 0.5) * jitterAmount;
                jitterY = (Math.random() - 0.5) * jitterAmount;
            }
            
            gridPoints[r][c] = {
                x: c * baseBrickWidth + jitterX,
                y: r * baseBrickHeight + 50 + jitterY
            };
        }
    }
    
    // Create polygonal bricks based on grid points
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (shouldCreateBrick(levelNumber, row, col)) {
                // Define the four corners of this brick using the grid points
                const points = [
                    gridPoints[row][col],       // Top-left
                    gridPoints[row][col+1],     // Top-right
                    gridPoints[row+1][col+1],   // Bottom-right
                    gridPoints[row+1][col]      // Bottom-left
                ];
                
                // Calculate center for collision detection
                const centerX = (points[0].x + points[1].x + points[2].x + points[3].x) / 4;
                const centerY = (points[0].y + points[1].y + points[2].y + points[3].y) / 4;
                
                // Estimate width and height for collision detection
                const width = Math.max(points[1].x - points[0].x, points[2].x - points[3].x);
                const height = Math.max(points[3].y - points[0].y, points[2].y - points[1].y);
                
                const brick = {
                    points: points, // Store polygon points for drawing
                    x: centerX - width/2, // Approximate rectangle for collision
                    y: centerY - height/2,
                    width: width,
                    height: height,
                    centerX: centerX,
                    centerY: centerY,
                    hits: getBrickHits(levelNumber, row, col),
                    type: getBrickType(levelNumber, row, col),
                    row: row,
                    col: col
                };
                bricks.push(brick);
            }
        }
    }
}

// Check if brick should be created based on level pattern
function shouldCreateBrick(level, row, col) {
    // Apply level loop modifier if beyond level 4
    const loopCount = Math.floor((level - 1) / 4);
    const actualLevel = ((level - 1) % 4) + 1;
    
    // Common variables used across multiple cases
    const midCol = BRICK_COLS / 2;
    const midRow = BRICK_ROWS / 2;
    
    switch (actualLevel) {
        case 1: // Spaceship/UFO shape
            // Middle section
            if (row >= BRICK_ROWS/3 && row < BRICK_ROWS*2/3) {
                return true; // Full middle section
            }
            // Top and bottom sections - create oval/disc shape
            const distanceFromCenter = Math.abs(col - midCol);
            const maxDistance = 0.7 * BRICK_COLS / 2;
            return distanceFromCenter < maxDistance;
            
        case 2: // Alien letters/glyphs
            // Create vertical stripes with gaps that look like alien writing
            if ((col % 3 === 0 && row % 4 !== 0) || 
                (col % 5 === 0 && row % 2 !== 0) ||
                (row === Math.floor(midRow) && col % 2 === 0)) {
                return true;
            }
            return false;
            
        case 3: // Starburst/nebula pattern
            // Distance from center
            const dx = (col - midCol) / midCol;
            const dy = (row - midRow) / midRow;
            const distance = Math.sqrt(dx*dx + dy*dy) * 2.5;
            
            // Create various cosmic ray patterns
            return (distance < 0.8) ||
                   (Math.atan2(dy, dx) + Math.PI) % (Math.PI/4) < 0.5 ||
                   Math.sin(distance * 5) > 0.7;
            
        case 4: // Futuristic circuit board
            // Create patterns that resemble circuit paths
            if (row % 3 === 0 || col % 3 === 0) {
                return true; // Main circuit paths
            }
            if ((row + col) % 4 === 0 && Math.random() > 0.3) {
                return true; // Connection nodes
            }
            // Add some random "components"
            if (row % 2 === 0 && col % 2 === 0 && Math.random() > 0.4) {
                return true;
            }
            return false;
            
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
    
    // Update sound effects
    updateSoundEffects();
    
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
    
    // Initialize sounds on first user interaction with the game
    // This should handle browser autoplay restrictions
    window.addEventListener('click', function initAudioOnFirstClick() {
        // Try to play a silent sound to unlock audio
        if (paddleHitSound) {
            paddleHitSound.volume = 0.01;
            paddleHitSound.play().then(() => {
                console.log('Audio unlocked successfully!');
                // Reset volume after unlocking
                paddleHitSound.volume = 0.7;
            }).catch(e => {
                console.warn('Could not unlock audio:', e);
            });
        }
        // Remove this listener after first click
        window.removeEventListener('click', initAudioOnFirstClick);
    });
    
    // Window resize
    window.addEventListener('resize', resizeCanvas);
}

// Create a new ball
function createBall() {
    // Create random angle between -60 and 60 degrees (but not too horizontal)
    let angle;
    do {
        angle = (Math.random() * 120 - 60) * Math.PI / 180;
    } while (Math.abs(angle) < 0.3); // Ensure not too horizontal
    
    const speed = INITIAL_BALL_SPEED;
    
    const ball = {
        x: canvas.width / 2,
        y: canvas.height - 30,
        radius: BALL_RADIUS,
        dx: Math.sin(angle) * speed,
        dy: -Math.abs(Math.cos(angle) * speed), // Always initially moving upward
        color: getRandomNeonColor(), // Assign a random neon color
        // Store previous positions for trail effect
        trail: []
    };
    return ball;
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
    const ballsToRemove = [];
    
    balls.forEach((ball, index) => {
        // Calculate current ball speed based on dx, dy components
        const ballSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
        
        // Apply slow ball power-up effect but respect minimum speed
        let currentSpeed = slowBallActive ? ballSpeed * 0.4 : ballSpeed;
        if (currentSpeed < MIN_BALL_SPEED) {
            // Scale both dx and dy to maintain direction but increase speed
            const scaleFactor = MIN_BALL_SPEED / currentSpeed;
            ball.dx *= scaleFactor;
            ball.dy *= scaleFactor;
        } else if (currentSpeed > MAX_BALL_SPEED) {
            // Cap at maximum speed
            const scaleFactor = MAX_BALL_SPEED / currentSpeed;
            ball.dx *= scaleFactor;
            ball.dy *= scaleFactor;
        }
        
        // Move the ball (without gravity)
        ball.x += ball.dx;
        ball.y += ball.dy;
        
        // Check boundary collisions
        
        // Left and right walls with anti-excessive-side-bounce logic
        if (ball.x - ball.radius < 0) {
            ball.x = ball.radius; // Place ball at the boundary
            ball.dx = -ball.dx; // Reverse x direction
            
            // If vertical velocity is too low, adjust the angle slightly
            if (Math.abs(ball.dy) < 3) {
                // Modify angle without adding gravity
                // Instead, we'll rotate the velocity vector slightly
                const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
                const currentAngle = Math.atan2(ball.dy, ball.dx);
                
                // Move angle toward vertical (either up or down depending on current direction)
                const newAngle = currentAngle + (ball.dy < 0 ? -WALL_BOUNCE_ANGLE_ADJUST : WALL_BOUNCE_ANGLE_ADJUST);
                
                // Apply the new velocity components
                ball.dx = Math.cos(newAngle) * speed;
                ball.dy = Math.sin(newAngle) * speed;
            }
            
            // Randomize dx slightly to prevent repetitive patterns
            ball.dx *= (0.98 + Math.random() * 0.04);
            
            playSound(wallHitSound);
        } else if (ball.x + ball.radius > canvas.width) {
            ball.x = canvas.width - ball.radius; // Place ball at the boundary
            ball.dx = -ball.dx; // Reverse x direction
            
            // If vertical velocity is too low, adjust the angle slightly
            if (Math.abs(ball.dy) < 3) {
                // Modify angle without adding gravity
                // Instead, we'll rotate the velocity vector slightly
                const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
                const currentAngle = Math.atan2(ball.dy, ball.dx);
                
                // Move angle toward vertical (either up or down depending on current direction)
                const newAngle = currentAngle + (ball.dy < 0 ? -WALL_BOUNCE_ANGLE_ADJUST : WALL_BOUNCE_ANGLE_ADJUST);
                
                // Apply the new velocity components
                ball.dx = Math.cos(newAngle) * speed;
                ball.dy = Math.sin(newAngle) * speed;
            }
            
            // Randomize dx slightly to prevent repetitive patterns
            ball.dx *= (0.98 + Math.random() * 0.04);
            
            playSound(wallHitSound);
        }
        
        // Top wall with anti-stalling logic
        if (ball.y - ball.radius < 0) {
            ball.y = ball.radius; // Place ball at the boundary
            ball.dy = -ball.dy; // Reverse y direction
            
            // Randomize dx slightly to prevent up-down stalling
            if (Math.abs(ball.dx) < 2) {
                // If horizontal movement is too small, add some randomness
                const direction = Math.random() > 0.5 ? 1 : -1;
                ball.dx += direction * (1 + Math.random() * 2);
            }
            
            playSound(wallHitSound);
        }
        
        // Bottom (lose life if ball goes below the screen)
        if (ball.y + ball.radius > canvas.height) {
            // Mark this ball for removal
            ballsToRemove.push(index);
        }
        
        // Check paddle collision using rectangular detection plus corner handling
        if (ball.y + ball.radius > paddle.y && 
            ball.y - ball.radius < paddle.y + paddle.height && 
            ball.x + ball.radius > paddle.x && 
            ball.x - ball.radius < paddle.x + paddle.width) {
            
            // Determine if hitting the top of the paddle or the sides
            const hitTop = ball.y < paddle.y + paddle.height / 2;
            
            if (hitTop) {
                // Place ball at the top boundary of the paddle
                ball.y = paddle.y - ball.radius;
                
                // Calculate reflection angle based on where on the paddle the ball hit
                // This creates more dynamic angles based on paddle position
                const hitPosition = (ball.x - paddle.x) / paddle.width;
                const angleMultiplier = hitPosition * 2 - 1; // -1 to 1 range
                const maxAngle = Math.PI / 3; // 60 degrees max angle
                
                // Calculate new angle
                const angle = angleMultiplier * maxAngle;
                const speed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
                
                // Set new velocity based on angle and speed
                ball.dx = Math.sin(angle) * speed;
                ball.dy = -Math.abs(Math.cos(angle) * speed);
                
                // Add a small random factor to prevent repetitive patterns
                ball.dx += (Math.random() - 0.5) * 0.5;
            } else {
                // Side hit (less common, just reverse x velocity)
                ball.dx = -ball.dx;
                // Add slight random y component to avoid side-trapping
                ball.dy += (Math.random() - 0.5) * 0.8;
            }
            
            // Enforce minimum speed after paddle hit
            const newSpeed = Math.sqrt(ball.dx * ball.dx + ball.dy * ball.dy);
            if (newSpeed < MIN_BALL_SPEED) {
                const scaleFactor = MIN_BALL_SPEED / newSpeed;
                ball.dx *= scaleFactor;
                ball.dy *= scaleFactor;
            }
            
            // Play paddle hit sound
            playSound(paddleHitSound);
        }
    });
    
    // If all balls are lost (or there is only one and it's being removed), lose a life
    if (ballsToRemove.length === balls.length) {
        lives--;
        
        // Play life lost sound
        playSound(lifeLostSound);
        
        if (lives <= 0) {
            // Game over
            window.gameOver();
            return;
        }
        
        // Reset ball
        balls = [createBall()];
        
        // Reset paddle position
        paddle.x = canvas.width / 2 - paddle.width / 2;
        
        // Cancel any active power-ups
        if (widePaddleTimer) {
            clearTimeout(widePaddleTimer);
            widePaddleActive = false;
            paddle.width = PADDLE_WIDTH;
        }
        
        if (slowBallTimer) {
            clearTimeout(slowBallTimer);
            slowBallActive = false;
        }
    } else {
        // Otherwise just remove the specific balls that went out of bounds
        for (let i = ballsToRemove.length - 1; i >= 0; i--) {
            balls.splice(ballsToRemove[i], 1);
        }
    }
    
    // Draw all balls
    drawBalls();
}

// Explosion particle for dramatic brick breaking
class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 3 + 2;
        this.speedX = Math.random() * 6 - 3;
        this.speedY = Math.random() * 6 - 3;
        this.color = color;
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
// Polygon collision helper functions

// Check if a point is inside a polygon
function isPointInPolygon(x, y, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x, yi = polygon[i].y;
        const xj = polygon[j].x, yj = polygon[j].y;
        
        const intersect = ((yi > y) !== (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

// Function to handle direct sound calls with better wall collision detection
function updateSoundEffects() {
    // Replace all direct sound calls with soundManager calls
    // This ensures sounds play consistently and with proper naming
    
    // This function is called from the main update loop
    // It ensures all sound effects are properly routed through the sound manager
}

// Calculate distance from point to a line segment
function distToSegment(px, py, x1, y1, x2, y2) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;
    if (len_sq !== 0) param = dot / len_sq;

    let xx, yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    } else if (param > 1) {
        xx = x2;
        yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

// Create explosion particles at a location
function addExplosionParticles(x, y, color = '#ffaa00') {
    const particleCount = 15;
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle(x, y, color));
    }
}

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
        // Assign colors based on Sacsayhuamán stonework, with sci-fi influence
        let brickColor;
        let innerColor;
        let edgeColor;
        
        // Determine brick theme based on level, but keep a consistent stone-like palette
        const levelType = ((level - 1) % 4) + 1;
        
        // Generate slight color variations based on brick position to simulate natural stone variation
        const colorVariation = (brick.row * 3 + brick.col * 5) % 20 / 100;
        
        switch (levelType) {
            case 1: // Granite-like with blue energy seams
                brickColor = brick.type === 'standard' ? 
                    `rgb(${120+colorVariation*40}, ${120+colorVariation*40}, ${130+colorVariation*40})` : 
                    `rgb(${140+colorVariation*40}, ${140+colorVariation*40}, ${150+colorVariation*40})`;
                innerColor = brick.type === 'standard' ? 
                    `rgb(${100+colorVariation*30}, ${100+colorVariation*30}, ${110+colorVariation*30})` : 
                    `rgb(${120+colorVariation*30}, ${120+colorVariation*30}, ${130+colorVariation*30})`;
                edgeColor = brick.type === 'standard' ? '#00aaff' : '#00ffff';
                break;
            case 2: // Andesite-like with green energy seams
                brickColor = brick.type === 'standard' ? 
                    `rgb(${110+colorVariation*30}, ${115+colorVariation*30}, ${105+colorVariation*30})` : 
                    `rgb(${130+colorVariation*30}, ${135+colorVariation*30}, ${125+colorVariation*30})`;
                innerColor = brick.type === 'standard' ? 
                    `rgb(${90+colorVariation*30}, ${95+colorVariation*30}, ${85+colorVariation*30})` : 
                    `rgb(${110+colorVariation*30}, ${115+colorVariation*30}, ${105+colorVariation*30})`;
                edgeColor = brick.type === 'standard' ? '#00ff88' : '#88ff00';
                break;
            case 3: // Basalt-like with purple energy seams
                brickColor = brick.type === 'standard' ? 
                    `rgb(${80+colorVariation*30}, ${85+colorVariation*30}, ${95+colorVariation*30})` : 
                    `rgb(${100+colorVariation*30}, ${105+colorVariation*30}, ${115+colorVariation*30})`;
                innerColor = brick.type === 'standard' ? 
                    `rgb(${60+colorVariation*30}, ${65+colorVariation*30}, ${75+colorVariation*30})` : 
                    `rgb(${80+colorVariation*30}, ${85+colorVariation*30}, ${95+colorVariation*30})`;
                edgeColor = brick.type === 'standard' ? '#aa00ff' : '#ff00aa';
                break;
            case 4: // Limestone-like with yellow energy seams
                brickColor = brick.type === 'standard' ? 
                    `rgb(${180+colorVariation*30}, ${175+colorVariation*30}, ${160+colorVariation*30})` : 
                    `rgb(${200+colorVariation*30}, ${195+colorVariation*30}, ${180+colorVariation*30})`;
                innerColor = brick.type === 'standard' ? 
                    `rgb(${160+colorVariation*30}, ${155+colorVariation*30}, ${140+colorVariation*30})` : 
                    `rgb(${180+colorVariation*30}, ${175+colorVariation*30}, ${160+colorVariation*30})`;
                edgeColor = brick.type === 'standard' ? '#ffaa00' : '#ffff00';
                break;
        }
        
        // Draw Sacsayhuamán-style megalithic polygonal brick
        if (brick.points) {
            // Create stone texture fill pattern
            const noiseCanvas = document.createElement('canvas');
            noiseCanvas.width = brick.width;
            noiseCanvas.height = brick.height;
            const noiseCtx = noiseCanvas.getContext('2d');
            
            // Fill with base color
            noiseCtx.fillStyle = innerColor;
            noiseCtx.fillRect(0, 0, brick.width, brick.height);
            
            // Add stone texture with noise
            for (let i = 0; i < brick.width * brick.height * 0.05; i++) {
                const nx = Math.random() * brick.width;
                const ny = Math.random() * brick.height;
                const size = Math.random() * 3 + 1;
                const alpha = Math.random() * 0.1 + 0.05;
                noiseCtx.fillStyle = `rgba(0,0,0,${alpha})`;
                noiseCtx.beginPath();
                noiseCtx.arc(nx, ny, size, 0, Math.PI * 2);
                noiseCtx.fill();
            }
            
            // Create pattern from the noise canvas
            const stonePattern = ctx.createPattern(noiseCanvas, 'no-repeat');
            
            // Draw the brick polygon
            ctx.save();
            
            // Draw brick outer shape with glow
            ctx.shadowColor = edgeColor;
            ctx.shadowBlur = 8;
            ctx.fillStyle = brickColor;
            ctx.beginPath();
            ctx.moveTo(brick.points[0].x, brick.points[0].y);
            for (let i = 1; i < brick.points.length; i++) {
                ctx.lineTo(brick.points[i].x, brick.points[i].y);
            }
            ctx.closePath();
            ctx.fill();
            
            // Draw the inner brick with texture pattern and no glow
            ctx.shadowBlur = 0;
            ctx.fillStyle = stonePattern;
            
            // Create an inner polygon (slightly smaller)
            const innerPoints = brick.points.map(p => {
                const dx = p.x - brick.centerX;
                const dy = p.y - brick.centerY;
                const scale = 0.95; // 5% smaller
                return {
                    x: brick.centerX + dx * scale,
                    y: brick.centerY + dy * scale
                };
            });
            
            ctx.beginPath();
            ctx.moveTo(innerPoints[0].x, innerPoints[0].y);
            for (let i = 1; i < innerPoints.length; i++) {
                ctx.lineTo(innerPoints[i].x, innerPoints[i].y);
            }
            ctx.closePath();
            ctx.fill();
            
            // Draw energy seams around the edges
            ctx.strokeStyle = edgeColor;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(brick.points[0].x, brick.points[0].y);
            for (let i = 1; i < brick.points.length; i++) {
                ctx.lineTo(brick.points[i].x, brick.points[i].y);
            }
            ctx.closePath();
            ctx.stroke();
            
            // Add sci-fi elements: energy symbols or glyphs etched into the stone
            ctx.strokeStyle = edgeColor;
            ctx.lineWidth = 1;
            
            // Calculate a symbol based on brick position for consistency
            const symbolId = (brick.row * 7 + brick.col * 3) % 5;
            ctx.beginPath();
            
            // Use brick center for drawing symbols
            if (symbolId === 0) {
                // Simple spiral glyph
                const radius = Math.min(brick.width, brick.height) / 8;
                for (let i = 0; i < 6; i++) {
                    const angle = i / 6 * Math.PI * 2;
                    const r = radius * (1 - i / 12);
                    const x = brick.centerX + Math.cos(angle) * r;
                    const y = brick.centerY + Math.sin(angle) * r;
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
            } else if (symbolId === 1) {
                // Three-line symbol
                const size = Math.min(brick.width, brick.height) / 6;
                ctx.moveTo(brick.centerX - size, brick.centerY - size);
                ctx.lineTo(brick.centerX + size, brick.centerY + size);
                ctx.moveTo(brick.centerX - size, brick.centerY);
                ctx.lineTo(brick.centerX + size, brick.centerY);
                ctx.moveTo(brick.centerX - size, brick.centerY + size);
                ctx.lineTo(brick.centerX + size, brick.centerY - size);
            } else if (symbolId === 2) {
                // Circle with dot
                const radius = Math.min(brick.width, brick.height) / 6;
                ctx.arc(brick.centerX, brick.centerY, radius, 0, Math.PI * 2);
                ctx.moveTo(brick.centerX + 2, brick.centerY);
                ctx.arc(brick.centerX, brick.centerY, 2, 0, Math.PI * 2);
            } else if (symbolId === 3) {
                // Square/diamond pattern
                const size = Math.min(brick.width, brick.height) / 8;
                ctx.moveTo(brick.centerX, brick.centerY - size);
                ctx.lineTo(brick.centerX + size, brick.centerY);
                ctx.lineTo(brick.centerX, brick.centerY + size);
                ctx.lineTo(brick.centerX - size, brick.centerY);
                ctx.closePath();
            } else {
                // Line patterns
                const size = Math.min(brick.width, brick.height) / 5;
                for (let i = 0; i < 3; i++) {
                    const offset = (i - 1) * size / 2;
                    ctx.moveTo(brick.centerX - size / 2, brick.centerY + offset);
                    ctx.lineTo(brick.centerX + size / 2, brick.centerY + offset);
                }
            }
            ctx.stroke();
            
            ctx.restore();
        }
        
        // Check collision with each ball
        balls.forEach(ball => {
            // Using the rectangular approximation for initial detection (broad phase)
            if (ball.x + ball.radius > brick.x && 
                ball.x - ball.radius < brick.x + brick.width && 
                ball.y + ball.radius > brick.y && 
                ball.y - ball.radius < brick.y + brick.height) {
                
                // For polygonal bricks, do more precise collision detection
                let collision = false;
                let collisionNormalX = 0;
                let collisionNormalY = 0;
                
                // If we have polygon points, use them for more accurate detection
                if (brick.points) {
                    // Check if the ball center is inside the polygon
                    if (isPointInPolygon(ball.x, ball.y, brick.points)) {
                        collision = true;
                        
                        // Find the closest edge to determine collision normal
                        let minDist = Number.MAX_VALUE;
                        
                        for (let i = 0; i < brick.points.length; i++) {
                            const p1 = brick.points[i];
                            const p2 = brick.points[(i + 1) % brick.points.length];
                            
                            // Calculate distance from ball center to line segment
                            const dist = distToSegment(ball.x, ball.y, p1.x, p1.y, p2.x, p2.y);
                            
                            if (dist < minDist) {
                                minDist = dist;
                                
                                // Calculate line normal (perpendicular to the edge)
                                const edgeX = p2.x - p1.x;
                                const edgeY = p2.y - p1.y;
                                const length = Math.sqrt(edgeX * edgeX + edgeY * edgeY);
                                
                                // Normal points outward from the polygon
                                collisionNormalX = -edgeY / length;
                                collisionNormalY = edgeX / length;
                            }
                        }
                    } else {
                        // Check if ball intersects with any of the polygon edges
                        for (let i = 0; i < brick.points.length; i++) {
                            const p1 = brick.points[i];
                            const p2 = brick.points[(i + 1) % brick.points.length];
                            
                            // Check if ball intersects with this edge
                            if (distToSegment(ball.x, ball.y, p1.x, p1.y, p2.x, p2.y) <= ball.radius) {
                                collision = true;
                                
                                // Calculate line normal (perpendicular to the edge)
                                const edgeX = p2.x - p1.x;
                                const edgeY = p2.y - p1.y;
                                const length = Math.sqrt(edgeX * edgeX + edgeY * edgeY);
                                
                                // Normal points outward from the polygon
                                collisionNormalX = -edgeY / length;
                                collisionNormalY = edgeX / length;
                                break; // Found collision edge, no need to check more
                            }
                        }
                    }
                } else {
                    // Fallback to rectangular collision if no points defined
                    collision = true;
                    
                    // Calculate where the ball hit the brick
                    const hitLeft = ball.x < brick.x;
                    const hitRight = ball.x > brick.x + brick.width;
                    const hitTop = ball.y < brick.y;
                    const hitBottom = ball.y > brick.y + brick.height;
                    
                    // Set normal based on which side was hit
                    if ((hitLeft || hitRight) && !hitTop && !hitBottom) {
                        collisionNormalX = hitLeft ? -1 : 1;
                        collisionNormalY = 0;
                    } else {
                        collisionNormalX = 0;
                        collisionNormalY = hitTop ? -1 : 1;
                    }
                }
                
                // If collision detected, reflect ball and handle brick hit
                if (collision) {
                    // Reflect ball direction based on collision normal
                    if (Math.abs(collisionNormalX) > Math.abs(collisionNormalY)) {
                        ball.dx = -ball.dx;
                    } else {
                        ball.dy = -ball.dy;
                    }
                    
                    // Add explosion particles
                    const explosionX = brick.centerX || (brick.x + brick.width/2);
                    const explosionY = brick.centerY || (brick.y + brick.height/2);
                    addExplosionParticles(explosionX, explosionY, edgeColor);
                    
                    // Decrement brick hits and apply scoring
                    brick.hits--;
                    
                    // Always play brick hit sound
                    playSound(brickHitSound);
                    
                    if (brick.hits <= 0) {
                        // Remove the brick
                        score += brick.type === 'power' ? 15 : 10;
                        
                        // Chance to spawn a power-up
                        if (brick.type === 'power' || Math.random() < POWER_UP_DROP_RATE) {
                            spawnPowerUp(explosionX, explosionY);
                        }
                        
                        // Mark brick for removal
                        bricksToRemove.push(brickIndex);
                    } else {
                        // Play hit sound for multiple-hit bricks
                        playSound(brickHitSound);
                    }
                }
            }
        });
    });
    
    // Remove destroyed bricks (in reverse order to prevent index issues)
    for (let i = bricksToRemove.length - 1; i >= 0; i--) {
        bricks.splice(bricksToRemove[i], 1);
    }
    
    // Check if level is complete
    if (bricks.length === 0) {
        levelUp();
    }
}

// Spawn a power-up at the specified position
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

// Update and draw power-ups
function updatePowerUps() {
    // Track power-ups to remove
    const powerUpsToRemove = [];
    
    // Update each power-up
    powerUps.forEach((powerUp, index) => {
        // Move power-up down
        powerUp.y += powerUp.dy;
        
        // Draw power-up (glowing orb)
        let color;
        switch (powerUp.type) {
            case 'widePaddle': 
                color = '#00ff00'; // Green
                break;
            case 'multiBall': 
                color = '#ff0000'; // Red
                break;
            case 'slowBall': 
                color = '#0088ff'; // Blue
                break;
        }
        
        // Draw glowing power-up orb
        ctx.fillStyle = color;
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(powerUp.x, powerUp.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Check collision with paddle
        if (powerUp.y + 10 > paddle.y && 
            powerUp.y - 10 < paddle.y + paddle.height && 
            powerUp.x + 10 > paddle.x && 
            powerUp.x - 10 < paddle.x + paddle.width) {
            
            // Apply power-up effect
            applyPowerUp(powerUp.type);
            
            // Play power-up sound
            playSound(powerUpSound);
            
            // Remove power-up
            powerUpsToRemove.push(index);
        }
        
        // Power-up out of bounds
        if (powerUp.y > canvas.height) {
            powerUpsToRemove.push(index);
        }
    });
    
    // Remove collected or missed power-ups (in reverse order)
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
    
    // Play level up sound
    playSound(levelUpSound);
    
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
    
    // Play game over sound
    playSound(gameOverSound);
    
    if (typeof window.showGameOver === 'function') {
        window.showGameOver();
    } else {
        console.log('showGameOver function not found');
    }
};
