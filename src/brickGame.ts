import { Engine } from './engine/core/Engine';
import { GameObject } from './engine/core/GameObject';
import { Vector2 } from './engine/core/Vector2';

// Components
import { Transform } from './engine/components/Transform';
import { ShapeRenderer, ShapeType } from './engine/components/ShapeRenderer';
import { BoxCollider } from './engine/components/BoxCollider';
import { Rigidbody } from './engine/components/Rigidbody';
import { Script } from './engine/components/Script';
import { Text } from './engine/components/Text';

// Systems
import { TransformSystem } from './engine/system/TransformSystem';
import { RenderSystem } from './engine/system/RenderSystem';
import { PhysicsSystem } from './engine/system/PhysicsSystem';
import { ScriptSystem } from './engine/system/ScriptSystem';
import { InputSystem } from './engine/system/InputSystem';
import { UISystem } from './engine/system/UISystem';

// Paddle Controller Script
class PaddleController extends Script {
  private speed = 600; // pixels per second (increased speed)

  start(): void {
    console.log('Paddle controller started');
  }

  getTypeName(): string {
    return "Script";
  }

  update(deltaTime: number): void {
    const input = Engine.instance.getSystem('Input') as InputSystem;
    if (!input) return;

    const transform = this.gameObject.getComponent(Transform);
    if (!transform) return;

    // Get input (use key codes)
    let moveDirection = 0;
    if (input.isKeyPressed('KeyA') || input.isKeyPressed('ArrowLeft')) {
      moveDirection = -1;
    }
    if (input.isKeyPressed('KeyD') || input.isKeyPressed('ArrowRight')) {
      moveDirection = 1;
    }

    // Move paddle
    if (moveDirection !== 0) {
      transform.position.x += moveDirection * this.speed * deltaTime;
      
      // Keep paddle within screen bounds
      const paddleWidth = 80;
      const halfWidth = paddleWidth / 2;
      const screenWidth = window.innerWidth;
      
      if (transform.position.x - halfWidth < -screenWidth/2) {
        transform.position.x = -screenWidth/2 + halfWidth;
      }
      if (transform.position.x + halfWidth > screenWidth/2) {
        transform.position.x = screenWidth/2 - halfWidth;
      }
    }
  }
}

// Game State
enum GameState {
  PLAYING,
  GAME_OVER,
  VICTORY
}

// Game UI Controller Script
class GameUIController extends Script {
  private gameStartTime = 0;
  private gameTime = 0;
  private rulesText: Text | null = null;
  private timeText: Text | null = null;
  private statusText: Text | null = null;
  private gameStatusText: Text | null = null;
  private isGameRunning = true;
  private lastGameState = GameState.PLAYING;
  
  start(): void {
    this.gameStartTime = performance.now();
    console.log('Game UI started');
  }

  getTypeName(): string {
    return "Script";
  }

  update(deltaTime: number): void {
    // Check game state first
    this.checkGameState();
    
    // Only update time if game is running
    if (this.isGameRunning) {
      this.gameTime = (performance.now() - this.gameStartTime) / 1000;
      
      // Update time display
      if (this.timeText) {
        const minutes = Math.floor(this.gameTime / 60);
        const seconds = Math.floor(this.gameTime % 60);
        this.timeText.content = `Time: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
    }
    
    // Update status based on ball controller
    this.updateStatus();
  }
  
  private checkGameState(): void {
    const ball = Engine.instance.findGameObjectByName('Ball');
    if (ball) {
      const ballController = ball.getComponent(BallController);
      if (ballController) {
        const currentState = ballController.gameState;
        this.isGameRunning = (currentState === GameState.PLAYING);
        
        // Update game status message when state changes
        if (currentState !== this.lastGameState && this.gameStatusText) {
          switch (currentState) {
            case GameState.GAME_OVER:
              this.gameStatusText.content = '🔴 GAME OVER\nPress R to restart';
              break;
            case GameState.VICTORY:
              this.gameStatusText.content = '🎉 VICTORY!\nPress R to restart';
              break;
            case GameState.PLAYING:
              this.gameStatusText.content = '';
              break;
          }
          this.lastGameState = currentState;
        }
      }
    }
  }
  
  private updateStatus(): void {
    const ball = Engine.instance.findGameObjectByName('Ball');
    if (ball && this.statusText) {
      const ballController = ball.getComponent(BallController);
      if (ballController) {
        const remainingBricks = Engine.instance.getAllGameObjects()
          .filter(obj => obj.name.startsWith('Brick')).length;
        
        this.statusText.content = `Bricks: ${remainingBricks}`;
      }
    }
  }
  
  public setTextComponents(rules: Text, time: Text, status: Text, gameStatus?: Text): void {
    this.rulesText = rules;
    this.timeText = time;
    this.statusText = status;
    this.gameStatusText = gameStatus || null;
  }
  
  public resetTimer(): void {
    this.gameStartTime = performance.now();
    this.gameTime = 0;
    this.isGameRunning = true;
    this.lastGameState = GameState.PLAYING;
    if (this.gameStatusText) {
      this.gameStatusText.content = '';
    }
  }
}

// Ball Controller Script  
class BallController extends Script {
  private speed = 400;
  private velocity = new Vector2(0, 0);
  private launched = false;
  public gameState = GameState.PLAYING; // Make it public so UI can access it

  start(): void {
    console.log('Ball controller started');
  }

  getTypeName(): string {
    return "Script";
  }

  update(deltaTime: number): void {
    const input = Engine.instance.getSystem('Input') as InputSystem;
    const transform = this.gameObject.getComponent(Transform);
    if (!transform || !input) return;

    // Handle game state
    if (this.gameState === GameState.GAME_OVER || this.gameState === GameState.VICTORY) {
      // Press R to restart
      if (input.isKeyPressed('KeyR')) {
        this.resetGame();
        return;
      }
      return; // Don't process other input during game over/victory
    }

    // Launch ball with space key (use 'Space' key code)
    if (!this.launched && this.gameState === GameState.PLAYING && input.isKeyPressed('Space')) {
      this.launched = true;
      this.velocity = new Vector2(200, -400); // Start moving up and slightly right
      console.log('Ball launched with space key!');
    }

    if (this.launched) {
      // Move ball
      transform.position.x += this.velocity.x * deltaTime;
      transform.position.y += this.velocity.y * deltaTime;

      // Check boundaries
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const ballSize = 15;

      // Left and right walls
      if (transform.position.x - ballSize/2 <= -screenWidth/2) {
        transform.position.x = -screenWidth/2 + ballSize/2;
        this.velocity.x = Math.abs(this.velocity.x);
      }
      if (transform.position.x + ballSize/2 >= screenWidth/2) {
        transform.position.x = screenWidth/2 - ballSize/2;
        this.velocity.x = -Math.abs(this.velocity.x);
      }

      // Top wall
      if (transform.position.y - ballSize/2 <= -screenHeight/2) {
        transform.position.y = -screenHeight/2 + ballSize/2;
        this.velocity.y = Math.abs(this.velocity.y);
      }

      // Bottom boundary - game over
      if (transform.position.y > screenHeight/2) {
        console.log('🔴 Game Over! Ball fell off screen');
        console.log('Press R to restart');
        this.gameState = GameState.GAME_OVER;
        this.launched = false;
      }

      // Check collision with paddle
      this.checkPaddleCollision();
      
      // Check collision with bricks
      this.checkBrickCollision();
    }
  }

  private checkPaddleCollision(): void {
    const ballTransform = this.gameObject.getComponent(Transform);
    if (!ballTransform) return;

    // Find paddle
    const paddle = Engine.instance.findGameObjectByName('Paddle');
    if (!paddle) return;

    const paddleTransform = paddle.getComponent(Transform);
    if (!paddleTransform) return;

    // Simple collision detection
    const ballX = ballTransform.position.x;
    const ballY = ballTransform.position.y;
    const paddleX = paddleTransform.position.x;
    const paddleY = paddleTransform.position.y;

    const ballSize = 15;
    const paddleWidth = 80;
    const paddleHeight = 15;

    if (ballX >= paddleX - paddleWidth/2 && ballX <= paddleX + paddleWidth/2 &&
        ballY >= paddleY - paddleHeight/2 && ballY <= paddleY + paddleHeight/2) {
      
      // Bounce off paddle
      this.velocity.y = -Math.abs(this.velocity.y);
      
      // Add some angle based on where it hit the paddle
      const hitPosition = (ballX - paddleX) / (paddleWidth/2); // -1 to 1
      this.velocity.x = hitPosition * 300;
      
      console.log('Ball bounced off paddle');
    }
  }

  private checkBrickCollision(): void {
    const ballTransform = this.gameObject.getComponent(Transform);
    if (!ballTransform) return;

    const ballX = ballTransform.position.x;
    const ballY = ballTransform.position.y;
    const ballSize = 15;

    // Find all bricks
    const allObjects = Engine.instance.getAllGameObjects();
    const bricks = allObjects.filter(obj => obj.name.startsWith('Brick'));

    for (const brick of bricks) {
      const brickTransform = brick.getComponent(Transform);
      if (!brickTransform) continue;

      const brickX = brickTransform.position.x;
      const brickY = brickTransform.position.y;
      const brickWidth = 60;
      const brickHeight = 20;

      // Simple collision detection
      if (ballX >= brickX - brickWidth/2 && ballX <= brickX + brickWidth/2 &&
          ballY >= brickY - brickHeight/2 && ballY <= brickY + brickHeight/2) {
        
        // Destroy brick
        brick.destroy();
        console.log('Brick destroyed!');
        
        // Bounce ball
        this.velocity.y = -this.velocity.y;
        
        // Check for victory
        this.checkVictory();
        break;
      }
    }
  }

  private checkVictory(): void {
    setTimeout(() => {
      const allObjects = Engine.instance.getAllGameObjects();
      const remainingBricks = allObjects.filter(obj => obj.name.startsWith('Brick'));
      
      if (remainingBricks.length === 0) {
        console.log('🎉 Victory! All bricks destroyed!');
        console.log('Press R to restart');
        this.gameState = GameState.VICTORY;
        this.launched = false;
      }
    }, 100);
  }

  private resetBall(): void {
    this.launched = false;
    this.velocity = new Vector2(0, 0);
    
    // Reset ball position
    const transform = this.gameObject.getComponent(Transform);
    if (transform) {
      transform.position = new Vector2(0, window.innerHeight/4);
    }
  }

  private resetGame(): void {
    console.log('🔄 Restarting game...');
    
    // Reset game state
    this.gameState = GameState.PLAYING;
    this.resetBall();
    
    // Reset paddle position
    const paddle = Engine.instance.findGameObjectByName('Paddle');
    if (paddle) {
      paddle.transform.position = new Vector2(0, window.innerHeight/2 - 100);
    }
    
    // Reset UI timer
    const uiObject = Engine.instance.findGameObjectByName('GameUI');
    if (uiObject) {
      const uiController = uiObject.getComponent(GameUIController);
      if (uiController) {
        (uiController as any).resetTimer();
      }
    }
    
    // Recreate all bricks
    this.recreateBricks();
    
    console.log('Game restarted! Press SPACE to launch ball');
  }

  private recreateBricks(): void {
    // Remove existing bricks
    const allObjects = Engine.instance.getAllGameObjects();
    const existingBricks = allObjects.filter(obj => obj.name.startsWith('Brick'));
    existingBricks.forEach(brick => brick.destroy());
    
    // Create new bricks
    const brickWidth = 60;
    const brickHeight = 20;
    const brickSpacing = 5;
    const rows = 5;
    const cols = 10;
    
    const totalWidth = cols * (brickWidth + brickSpacing) - brickSpacing;
    const startX = -totalWidth / 2 + brickWidth / 2;
    const startY = -window.innerHeight/2 + 100;
    
    const colors = ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5'];
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const brick = new GameObject(`Brick_${row}_${col}`);
        
        // Position
        const x = startX + col * (brickWidth + brickSpacing);
        const y = startY + row * (brickHeight + brickSpacing);
        brick.transform.position = new Vector2(x, y);
        
        // Add renderer
        const renderer = brick.addComponent(ShapeRenderer);
        renderer.shapeType = ShapeType.Rectangle;
        renderer.width = brickWidth;
        renderer.height = brickHeight;
        renderer.fillColor = colors[row];
        renderer.strokeColor = '#ffffff';
        renderer.strokeWidth = 1;
      }
    }
    
    console.log('Bricks recreated');
  }
}

// Game Manager
class BrickGameManager {
  private engine: Engine;

  constructor() {
    this.engine = Engine.instance;
    this.setupGame();
  }

  private async setupGame(): Promise<void> {
    console.log('=== Starting Brick Game Setup ===');
    
    // Check canvas
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!canvas) {
      console.error('Canvas not found!');
      return;
    }
    
    // Set canvas size to full screen
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // Add resize handler
    window.addEventListener('resize', () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    });
    
    console.log('Canvas configured:', canvas.width, 'x', canvas.height);
    
    // Register systems
    console.log('Registering systems...');
    this.engine.registerSystem('Transform', new TransformSystem());
    this.engine.registerSystem('Render', new RenderSystem('gameCanvas'));
    this.engine.registerSystem('Physics', new PhysicsSystem());
    this.engine.registerSystem('Input', new InputSystem());
    this.engine.registerSystem('Script', new ScriptSystem());
    this.engine.registerSystem('UI', new UISystem());
    
    console.log('Systems registered');
    
    // Create game objects
    this.createGameObjects();
    
    // Wait a frame
    await new Promise(resolve => requestAnimationFrame(resolve));
    
    // Start engine
    console.log('Starting engine...');
    this.engine.start();
    
    console.log('=== Brick Game Setup Complete ===');
  }

  private createGameObjects(): void {
    console.log('Creating game objects...');

    // Create UI
    this.createUI();
    
    // Create paddle
    this.createPaddle();
    
    // Create ball
    this.createBall();
    
    // Create bricks
    this.createBricks();
    
    console.log('Game objects created');
  }

  private createUI(): void {
    // Create main UI controller object
    const uiObject = new GameObject('GameUI');
    const uiController = uiObject.addComponent(GameUIController);
    
    // Calculate safe UI positions - ensure text stays on screen
    const margin = 30;
    const panelWidth = Math.min(250, window.innerWidth * 0.25); // Slightly smaller to ensure it fits
    const leftEdge = -window.innerWidth/2 + margin; // Start from left edge with margin
    
    // Create title text
    const titleObject = new GameObject('TitleText');
    titleObject.transform.position = new Vector2(leftEdge, -window.innerHeight/2 + margin);
    const titleText = titleObject.addComponent(Text);
    titleText.width = panelWidth;
    titleText.height = 40;
    titleText.pivot = { x: 0, y: 0.5 }; // Left align pivot
    titleText.content = `🎮 BRICK BREAKER`;
    titleText.fontSize = 16;
    titleText.color = '#4CAF50';
    titleText.fontFamily = 'Arial, sans-serif';
    titleText.align = 'left';
    
    // Create controls text
    const controlsObject = new GameObject('ControlsText');
    controlsObject.transform.position = new Vector2(leftEdge, -window.innerHeight/2 + margin + 50);
    const controlsText = controlsObject.addComponent(Text);
    controlsText.width = panelWidth;
    controlsText.height = 120; // Increased height for better line spacing with empty lines
    controlsText.pivot = { x: 0, y: 0.5 }; // Left align pivot
    controlsText.content = `CONTROLS:

← → Move Paddle

SPACE Launch Ball

R Restart Game`;
    controlsText.fontSize = 12;
    controlsText.color = '#ffffff';
    controlsText.fontFamily = 'Arial, sans-serif';
    controlsText.align = 'left';
    
    // Create rules text
    const rulesObject = new GameObject('RulesText');
    rulesObject.transform.position = new Vector2(leftEdge, -window.innerHeight/2 + margin + 170);
    const rulesText = rulesObject.addComponent(Text);
    rulesText.width = panelWidth;
    rulesText.height = 160; // Increased height for better line spacing with empty lines
    rulesText.pivot = { x: 0, y: 0.5 }; // Left align pivot
    rulesText.content = `RULES:

• Destroy all bricks

• Don't let ball fall

• Ball bounces off paddle

• 5 rows of colorful bricks`;
    rulesText.fontSize = 12;
    rulesText.color = '#ffffff';
    rulesText.fontFamily = 'Arial, sans-serif';
    rulesText.align = 'left';
    
    // Create stats section
    const statsY = Math.max(-window.innerHeight/2 + margin + 340, window.innerHeight/2 - 120);
    
    // Create time text
    const timeObject = new GameObject('TimeText');
    timeObject.transform.position = new Vector2(leftEdge, statsY);
    const timeText = timeObject.addComponent(Text);
    timeText.width = panelWidth;
    timeText.height = 30;
    timeText.pivot = { x: 0, y: 0.5 }; // Left align pivot
    timeText.content = 'Time: 00:00';
    timeText.fontSize = 16;
    timeText.color = '#00ff00';
    timeText.fontFamily = 'Arial, sans-serif';
    timeText.align = 'left';
    
    // Create status text
    const statusObject = new GameObject('StatusText');
    statusObject.transform.position = new Vector2(leftEdge, statsY + 35);
    const statusText = statusObject.addComponent(Text);
    statusText.width = panelWidth;
    statusText.height = 30;
    statusText.pivot = { x: 0, y: 0.5 }; // Left align pivot
    statusText.content = 'Bricks: 50';
    statusText.fontSize = 16;
    statusText.color = '#FFC107';
    statusText.fontFamily = 'Arial, sans-serif';
    statusText.align = 'left';
    
    // Create game status text (for game over/victory messages)
    const gameStatusObject = new GameObject('GameStatusText');
    gameStatusObject.transform.position = new Vector2(leftEdge, statsY + 70);
    const gameStatusText = gameStatusObject.addComponent(Text);
    gameStatusText.width = panelWidth;
    gameStatusText.height = 30;
    gameStatusText.pivot = { x: 0, y: 0.5 }; // Left align pivot
    gameStatusText.content = '';
    gameStatusText.fontSize = 14;
    gameStatusText.color = '#FF5722';
    gameStatusText.fontFamily = 'Arial, sans-serif';
    gameStatusText.align = 'left';
    
    // Link text components to controller
    uiController.setTextComponents(rulesText, timeText, statusText, gameStatusText);
    
    console.log('Responsive UI created');
  }

  private createPaddle(): void {
    const paddle = new GameObject('Paddle');
    
    // Position at bottom center
    paddle.transform.position = new Vector2(0, window.innerHeight/2 - 100);
    
    // Add renderer
    const renderer = paddle.addComponent(ShapeRenderer);
    renderer.shapeType = ShapeType.Rectangle;
    renderer.width = 80;
    renderer.height = 15;
    renderer.fillColor = '#4CAF50'; // Green
    renderer.strokeColor = '#ffffff';
    renderer.strokeWidth = 2;
    
    // Add controller
    paddle.addComponent(PaddleController);
    
    console.log('Paddle created');
  }

  private createBall(): void {
    const ball = new GameObject('Ball');
    
    // Position above paddle
    ball.transform.position = new Vector2(0, window.innerHeight/4);
    
    // Add renderer
    const renderer = ball.addComponent(ShapeRenderer);
    renderer.shapeType = ShapeType.Circle;
    renderer.radius = 7.5;
    renderer.fillColor = '#FF5722'; // Red-orange
    renderer.strokeColor = '#ffffff';
    renderer.strokeWidth = 2;
    
    // Add controller
    ball.addComponent(BallController);
    
    console.log('Ball created');
  }

  private createBricks(): void {
    const brickWidth = 60;
    const brickHeight = 20;
    const brickSpacing = 5;
    const rows = 5;
    const cols = 10;
    
    const totalWidth = cols * (brickWidth + brickSpacing) - brickSpacing;
    const startX = -totalWidth / 2 + brickWidth / 2;
    const startY = -window.innerHeight/2 + 100;
    
    const colors = ['#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5']; // Different colors for each row
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const brick = new GameObject(`Brick_${row}_${col}`);
        
        // Position
        const x = startX + col * (brickWidth + brickSpacing);
        const y = startY + row * (brickHeight + brickSpacing);
        brick.transform.position = new Vector2(x, y);
        
        // Add renderer
        const renderer = brick.addComponent(ShapeRenderer);
        renderer.shapeType = ShapeType.Rectangle;
        renderer.width = brickWidth;
        renderer.height = brickHeight;
        renderer.fillColor = colors[row];
        renderer.strokeColor = '#ffffff';
        renderer.strokeWidth = 1;
      }
    }
    
    console.log(`Created ${rows * cols} bricks`);
  }
}

// Full screen styles and game startup
document.addEventListener('DOMContentLoaded', () => {
  console.log('=== Brick Game DOM Loaded ===');
  
  // Full screen styles
  const style = document.createElement('style');
  style.textContent = `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    html, body {
      height: 100%;
      overflow: hidden;
      background-color: #1a1a1a;
      font-family: Arial, sans-serif;
      color: white;
    }
    
    #container {
      width: 100vw;
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    #gameCanvas {
      display: block;
      background-color: #2a2a2a;
    }
    
    #gameRoot {
      display: none;
    }
  `;
  document.head.appendChild(style);
  
  // Clear game root
  const gameRoot = document.getElementById('gameRoot');
  if (gameRoot) {
    gameRoot.innerHTML = '';
  }
  
  // Show instructions
  console.log('🎮 Brick Breaker Game Controls:');
  console.log('  A/← : Move paddle left (faster speed!)');
  console.log('  D/→ : Move paddle right (faster speed!)');
  console.log('  SPACE : Launch ball');
  console.log('  R : Restart game after victory/defeat');
  console.log('  Goal: Destroy all bricks to win!');
  
  // Start game
  try {
    console.log('Creating Brick Game Manager...');
    const gameManager = new BrickGameManager();
    
    // Debug function
    (window as any).debugEngine = () => {
      const debugInfo = Engine.instance.getDebugInfo();
      console.group('🎮 Brick Game Debug Info');
      console.log('Running:', debugInfo.running);
      console.log('Systems:', debugInfo.systems.join(', '));
      console.log('GameObjects:', debugInfo.gameObjects);
      console.log('Components:', debugInfo.componentStats);
      console.log('FPS:', debugInfo.time.fps);
      console.groupEnd();
    };
    
    // Periodic debug info
    setInterval(() => {
      (window as any).debugEngine();
    }, 10000); // Every 10 seconds
    
  } catch (error) {
    console.error('Failed to start brick game:', error);
  }
});