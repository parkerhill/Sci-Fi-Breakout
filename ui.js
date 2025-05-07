// Global variables to store UI elements
let startMenu, gameOverMenu, startButton, playAgainButton;
let initialsInput, submitHighScoreButton, finalScore, leaderboard, gameCanvas;

// Ensure DOM is loaded before accessing elements
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing UI');
    
    // UI Elements
    startMenu = document.getElementById('start-menu');
    gameOverMenu = document.getElementById('game-over-menu');
    startButton = document.getElementById('start-button');
    playAgainButton = document.getElementById('play-again');
    initialsInput = document.getElementById('initials');
    submitHighScoreButton = document.getElementById('submit-high-score');
    finalScore = document.getElementById('final-score');
    leaderboard = document.getElementById('leaderboard');
    gameCanvas = document.getElementById('game-canvas');
    
    // Make sure we have all elements
    if (!startButton) {
        console.log('ERROR: Start button not found');
    } else {
        console.log('Start button found, adding click handler');
        // Event Listeners
        startButton.addEventListener('click', function() {
            console.log('Start button clicked');
            startGame();
        });
    }
    
    if (playAgainButton) {
        playAgainButton.addEventListener('click', playAgain);
    }
    
    if (submitHighScoreButton) {
        submitHighScoreButton.addEventListener('click', submitHighScore);
    }
    
    // Initialize high scores
    updateLeaderboard();
});

// Start game when clicking start button
function startGame() {
    console.log('Starting game...');
    if (startMenu) {
        startMenu.classList.add('hidden');
    } else {
        console.error('Start menu element not found');
    }
    
    try {
        // Make sure the canvas is visible
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            canvas.style.display = 'block';
            console.log('Canvas displayed');
        } else {
            console.error('Canvas element not found');
        }
        
        // Call the game initialization function
        if (typeof window.initGame === 'function') {
            window.initGame();
        } else {
            console.error('initGame function not found in window object');
        }
    } catch (error) {
        console.error('Error starting game:', error);
    }
}

// Play again when clicking play again button
function playAgain() {
    console.log('Playing again...');
    if (gameOverMenu) {
        gameOverMenu.classList.add('hidden');
    }
    
    try {
        // Call the game initialization function
        if (typeof window.initGame === 'function') {
            window.initGame();
        } else {
            console.error('initGame function not found in window object');
        }
    } catch (error) {
        console.error('Error restarting game:', error);
    }
}

// Submit high score
async function submitHighScore() {
    const initials = initialsInput.value.toUpperCase().substring(0, 3);
    if (initials.length === 0) return;
    
    const finalScore = window.getScore ? window.getScore() : 0;
    console.log('Submitting high score:', initials, finalScore);
    
    try {
        const response = await fetch('/highscores', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                initials: initials,
                score: finalScore
            })
        });
        
        if (response.ok) {
            console.log('High score submitted successfully');
            await updateLeaderboard();
        }
    } catch (error) {
        console.error('Error submitting high score:', error);
    }
}

// Update leaderboard
async function updateLeaderboard() {
    console.log('Updating leaderboard...');
    try {
        const response = await fetch('/highscores');
        if (!response.ok) {
            throw new Error('Failed to fetch high scores');
        }
        
        const scores = await response.json();
        console.log('Received scores:', scores);
        
        if (leaderboard) {
            leaderboard.innerHTML = '<h3>Leaderboard</h3><ul>' + 
                scores.map(score => `<li>${score.initials}: ${score.score}</li>`).join('') + 
                '</ul>';
        }
    } catch (error) {
        console.error('Error fetching high scores:', error);
        if (leaderboard) {
            leaderboard.innerHTML = '<h3>Leaderboard</h3><p>No scores available</p>';
        }
    }
}

// Show game over menu
function showGameOver() {
    const finalScore = window.getScore ? window.getScore() : 0;
    console.log('Game over! Final score:', finalScore);
    
    // Get the current score from the game state
    const currentScore = finalScore;
    
    if (finalScore) {
        finalScore.textContent = `Final Score: ${currentScore}`;
    }
    
    // Check if score qualifies for high score
    fetch('/highscores')
        .then(response => response.json())
        .then(scores => {
            const minScore = scores.length < 5 ? 0 : scores[scores.length - 1].score;
            const highScoreInput = document.getElementById('high-score-input');
            
            if (highScoreInput) {
                if (currentScore > minScore) {
                    highScoreInput.classList.remove('hidden');
                } else {
                    highScoreInput.classList.add('hidden');
                }
            }
            
            // Show leaderboard
            updateLeaderboard();
        })
        .catch(error => {
            console.error('Error checking high scores:', error);
        });
    
    if (gameOverMenu) {
        gameOverMenu.classList.remove('hidden');
    }
}

// Export functions for game.js to use
window.showGameOver = showGameOver;
