# Product Requirements Document (PRD): Sci-Fi Breakout Game
## 1. Purpose and Scope
### 1.1 Purpose
The Sci-Fi Breakout Game is a single-player, arcade-style web application designed to provide an engaging, modern take on the classic Breakout game. It aims to deliver a visually striking sci-fi experience with responsive controls, persistent high scores, and balanced gameplay enhancements (power-ups) to maximize player enjoyment and replayability.
### 1.2 Scope
The game includes:

- A sci-fi-themed frontend built with HTML, CSS, and JavaScript (Canvas API).
- A Python (Flask) backend with SQLite for persistent high-score storage.
- Core gameplay: Players control a paddle to bounce a ball and destroy bricks across 4 levels.
- Features: Power-ups, 4 lives, simultaneous mouse/keyboard controls, sound effects, and a leaderboard displayed only on game over.
- Responsive design adapting to any screen size.
- Deployment on a web server (frontend) and Python-compatible host (backend).

Out of scope:

- Multiplayer functionality.
- Mobile touch controls.
- Additional features (e.g., achievements, background music).

## 2. Requirements
### 2.1 Functional Requirements
#### 2.1.1 Core Gameplay

- Objective: Players move a paddle horizontally to bounce a ball and destroy bricks in a grid.
- Lives: Players start with 4 lives. A life is lost if the ball falls below the paddle. Game over occurs when all lives are lost.
- Scoring:
  - Standard brick: 10 points.
  - Tough brick: 20 points.
  - Power-up collected: 100 points.
  - Level cleared: 500 points.

- Game Over: Triggers when lives reach 0, displaying final score, high-score input (if qualified), and leaderboard.

#### 2.1.2 Sci-Fi Theme

- Visuals:
  - Background: Dark space with a starry gradient.
  - Bricks: Neon blue (standard), neon purple (tough).
  - Paddle: Metallic, glowing cyan.
  - Ball: Comet-like with a neon pink trail.

- Sound Effects:
  - thumphi.wav: Played on paddle-ball collisions (high-pitched, metallic).
  - thumplo.wav: Played on brick destruction (low-pitched, explosive).

- HUD: Displays score, lives, and level in the top-left corner using Orbitron font (neon cyan).

#### 2.1.3 Controls

- Simultaneous Input:
  - Mouse: Paddle's x-position tracks the mouse cursor's x-coordinate within the canvas.
  - Keyboard: Left/right arrow keys move the paddle at 15 pixels per frame.
  - Keyboard supports key hold-down (using keydown/keyup events) for smooth movement.

- Priority: Keyboard input overrides mouse during key hold to prevent jitter.

#### 2.1.4 Ball Physics

- Speed: Initial 5 pixels per frame, increasing 5% per level, capped at 2x initial speed.
- Collisions:
  - Bounces off walls, paddle, and bricks.
  - Paddle hits adjust the ball's angle based on contact point (e.g., left third of paddle angles leftward).


#### 2.1.5 Bricks

- Grid: 8 rows x 12 columns, scaled to canvas size (brick width = canvas width/12).
- Types:
  - Standard: 1 hit, 10 points, neon blue.
  - Tough: 2 hits, 20 points, neon purple (introduced in Level 2+).

- Patterns:
  - Level 1: Full grid (standard bricks).
  - Level 2: Checkerboard (20% tough bricks).
  - Level 3: Diamond shape (40% tough bricks).
  - Level 4: Sparse with gaps (60% tough bricks).


#### 2.1.6 Power-Ups

- Drop Rate: 5% chance when a brick is destroyed.
- Movement: Fall at 3 pixels per frame; caught by paddle contact.
- Duration: 10 seconds (except Multi-Ball, persists until a ball is lost).
- Types:
  - Wide Paddle: Increases paddle width by 50% (visual: green glow).
  - Multi-Ball: Spawns one additional ball (visual: red ball).
  - Slow Ball: Reduces ball speed by 20% (visual: blue pulse).

- Visuals: Glowing orbs with neon colors matching their effect.

#### 2.1.7 Levels and Progression

- Levels: 4 levels with increasing difficulty:
  - Level 1: Standard bricks, full grid, base speed (5 pixels/frame).
  - Level 2: 20% tough bricks, checkerboard, +5% speed.
  - Level 3: 40% tough bricks, diamond pattern, +10% speed.
  - Level 4: 60% tough bricks, sparse with gaps, +15% speed.

- Looping: After Level 4, loops to Level 1 with a 1.2x difficulty multiplier (faster ball, 10% more tough bricks per loop).
- Bonus: 500 points for clearing a level.

#### 2.1.8 High Scores

- Storage: Top 5 scores with three-letter initials, persisted in a SQLite database.
- Display: Shown only on game over screen (no in-game leaderboard).
- Input: Players enter initials (case-insensitive, auto-converted to uppercase) if their score qualifies.

#### 2.1.9 User Interface

- Start Menu: "Start Game" button with neon styling.
- In-Game HUD: Top-left displays score, lives, and level (Orbitron font, neon cyan).
- Game Over Screen: Shows final score, high-score input (if qualified), leaderboard, and "Play Again" button.

### 2.2 Non-Functional Requirements
#### 2.2.1 Performance

- Frame Rate: 60 FPS using requestAnimationFrame.
- Collision Detection: Optimized for up to 2 balls (Multi-Ball power-up).
- DOM Updates: Minimized to ensure smooth gameplay.

#### 2.2.2 Responsiveness

- Canvas Size: 90% of the smaller of window width or height (e.g., 720x720 on 1080p).
- Scaling: Paddle, bricks, and ball scale proportionally.
- Resize Handling: Window resize listener adjusts canvas dynamically.

#### 2.2.3 Accessibility

- Controls: Keyboard support ensures playability without a mouse.
- Visuals: High-contrast neon colors (cyan, purple, blue) for readability.

#### 2.2.4 Compatibility

- Browsers: Chrome, Firefox, Safari, Edge (modern versions).
- Backend: Deployable on Heroku, AWS, or any Python-compatible host.

#### 2.2.5 Security

- Input Sanitization: Initials limited to 3 characters, converted to uppercase.
- Database: SQLite transactions prevent data corruption.

## 3. Technical Specifications
### 3.1 Frontend

- Tech Stack:
  - HTML5 Canvas for rendering.
  - JavaScript for game logic, event handling, and sound effects.
  - CSS for styling (neon aesthetic, Orbitron font via Google Fonts).

- Files:
  - index.html: Game structure (canvas, menus, sound effects).
  - styles.css: Sci-fi styling (neon glows, responsive layout).
  - game.js: Core logic (paddle, ball, bricks, power-ups, collisions).
  - ui.js: Menus, high-score input, API calls.

- Dependencies: None (vanilla JavaScript/CSS).
- Assets:
  - thumphi.wav: Paddle hit sound.
  - thumplo.wav: Brick break sound.


### 3.2 Backend

- Tech Stack:
  - Flask for REST API.
  - SQLite for high-score storage.

- Endpoints:
  - GET /highscores: Returns top 5 scores with initials.
  - POST /highscores: Saves a new score, keeping only the top 5.

- Database Schema:
  - Table: highscores
    - id: Integer, primary key, auto-increment.
    - initials: Text (3 characters, uppercase).
    - score: Integer.
    - date: Text (ISO timestamp).


- Dependencies: Flask (pip install flask).
- File: app.py (API and database logic).

### 3.3 Integration

- Frontend-Backend: Fetch API for high-score storage/retrieval.
- Sound Effects: Loaded via Audio objects, triggered on collisions.

## 4. User Flow

- Start:
  - User loads the game, sees the start menu with "Start Game" button.
  - Clicks to begin Level 1.

- Gameplay:
  - Uses mouse and/or keyboard to move the paddle.
  - Bounces the ball to destroy bricks, collects power-ups, and progresses through levels.
  - HUD shows score, lives, and level.

- Game Over:
  - Triggered when lives reach 0.
  - Displays final score.
  - If score qualifies, prompts for three-letter initials.
  - Shows leaderboard and "Play Again" button.

- Restart:
  - Clicking "Play Again" resets the game to Level 1.


## 5. Development Plan
### 5.1 Milestones

- Frontend Setup (2 days):
  - Create index.html, styles.css, game.js, and ui.js.
  - Implement canvas rendering for paddle, ball, bricks, and power-ups.
  - Integrate thumphi.wav and thumplo.wav.

- Game Mechanics (3 days):
  - Implement ball physics, collisions, and power-up logic.
  - Code 4 levels with unique patterns and difficulty scaling.
  - Add simultaneous mouse/keyboard controls with key hold-down.

- UI and Polish (2 days):
  - Apply sci-fi styling (neon glows, starry background).
  - Finalize game over screen with high-score input and leaderboard.
  - Ensure responsive canvas scaling.

- Backend Integration (1 day):
  - Deploy Flask API with SQLite.
  - Connect frontend for high-score storage/retrieval.

- Testing and Deployment (2 days):
  - Test controls, sound effects, levels, and power-ups.
  - Verify high-score persistence and responsiveness.
  - Deploy frontend (e.g., GitHub Pages) and backend (e.g., Heroku).


### 5.2 Timeline

- Total: 10 days (assuming 1 developer).
- Start: TBD.
- Completion: TBD + 10 days.

## 6. Assumptions and Dependencies

- Assumptions:
  - Sound files (thumphi.wav, thumplo.wav) are in the same directory as index.html.
  - Backend runs on localhost:5000 during development; production URLs will be updated.
  - Users have modern browsers with JavaScript enabled.

- Dependencies:
  - Google Fonts (Orbitron).
  - Flask for backend.
  - Hosting platform for deployment.


## 7. Risks and Mitigations

- Risk: Sound files fail to load.
  - Mitigation: Include fallback silent mode; verify file paths.

- Risk: Performance issues with multiple balls.
  - Mitigation: Optimize collision detection; cap at 2 balls.

- Risk: SQLite write contention for high scores.
  - Mitigation: Use transactions; scale to PostgreSQL if needed.

- Risk: Responsive design fails on unusual screen sizes.
  - Mitigation: Test across devices; enforce minimum canvas size.


## 8. Success Metrics

- Gameplay: Players can complete at least 1 level without control issues.
- Engagement: Average session time > 5 minutes.
- Stability: No crashes or freezes during 10-minute sessions.
- High Scores: Scores persist across sessions and display correctly.

## 9. Future Enhancements

- Add touch controls for mobile devices.
- Implement achievements (e.g., "Clear 100 bricks").
- Support customizable paddle/ball skins.
- Integrate social sharing (e.g., post scores to X, if permitted).

## 10. References

- Sound files: thumphi.wav, thumplo.wav (provided by user).
- Font: Orbitron (Google Fonts).
- Classic Breakout mechanics for inspiration.
