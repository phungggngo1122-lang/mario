
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Entity, GameState, GRAVITY, JUMP_FORCE, MOVE_SPEED, FRICTION, WORLD_WIDTH, SCREEN_WIDTH, SCREEN_HEIGHT } from './types';
import { getLevelHint } from './services/geminiService';
import { UI } from './components/UI';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>({
    player: { x: 50, y: 500, width: 32, height: 48, vx: 0, vy: 0, type: 'player', id: 'player' },
    entities: [],
    score: 0,
    status: 'playing',
    cameraX: 0,
    aiHint: "Welcome, Plumber! Hit the [?] blocks for wisdom."
  });

  const keys = useRef<Set<string>>(new Set());
  const gameLoopRef = useRef<number>();

  // Initialize Level
  const initLevel = useCallback(() => {
    const platforms: Entity[] = [
      { x: 0, y: 550, width: WORLD_WIDTH, height: 50, vx: 0, vy: 0, type: 'platform', id: 'ground' },
      { x: 300, y: 400, width: 150, height: 32, vx: 0, vy: 0, type: 'platform', id: 'p1' },
      { x: 500, y: 300, width: 150, height: 32, vx: 0, vy: 0, type: 'platform', id: 'p2' },
      { x: 1000, y: 450, width: 200, height: 32, vx: 0, vy: 0, type: 'platform', id: 'p3' },
      { x: 1400, y: 350, width: 100, height: 32, vx: 0, vy: 0, type: 'platform', id: 'p4' },
      { x: 1800, y: 250, width: 300, height: 32, vx: 0, vy: 0, type: 'platform', id: 'p5' },
    ];

    const coins: Entity[] = Array.from({ length: 20 }).map((_, i) => ({
      x: 400 + i * 200,
      y: 450 - (i % 3) * 50,
      width: 24,
      height: 24,
      vx: 0,
      vy: 0,
      type: 'coin',
      id: `coin-${i}`
    }));

    const enemies: Entity[] = Array.from({ length: 10 }).map((_, i) => ({
      x: 800 + i * 450,
      y: 518,
      width: 32,
      height: 32,
      vx: -2,
      vy: 0,
      type: 'enemy',
      id: `enemy-${i}`
    }));

    const aiBlocks: Entity[] = [
      { x: 400, y: 250, width: 40, height: 40, vx: 0, vy: 0, type: 'gemini-block', id: 'ai-1' },
      { x: 1100, y: 300, width: 40, height: 40, vx: 0, vy: 0, type: 'gemini-block', id: 'ai-2' },
      { x: 2000, y: 150, width: 40, height: 40, vx: 0, vy: 0, type: 'gemini-block', id: 'ai-3' },
    ];

    const goal: Entity = {
      x: WORLD_WIDTH - 200,
      y: 450,
      width: 60,
      height: 100,
      vx: 0,
      vy: 0,
      type: 'goal',
      id: 'flag'
    };

    setGameState(prev => ({
      ...prev,
      player: { x: 50, y: 500, width: 32, height: 48, vx: 0, vy: 0, type: 'player', id: 'player' },
      entities: [...platforms, ...coins, ...enemies, ...aiBlocks, goal],
      score: 0,
      status: 'playing',
      cameraX: 0,
      aiHint: "Find the flag to win!"
    }));
  }, []);

  useEffect(() => {
    initLevel();
    const handleKeyDown = (e: KeyboardEvent) => keys.current.add(e.code);
    const handleKeyUp = (e: KeyboardEvent) => keys.current.delete(e.code);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [initLevel]);

  const fetchAiHint = async (score: number) => {
    const hint = await getLevelHint(score);
    setGameState(prev => ({ ...prev, aiHint: hint }));
  };

  const update = () => {
    setGameState(prev => {
      if (prev.status !== 'playing') return prev;

      const player = { ...prev.player };
      
      // Horizontal movement
      if (keys.current.has('ArrowRight')) player.vx += 1;
      if (keys.current.has('ArrowLeft')) player.vx -= 1;
      player.vx *= FRICTION;
      player.x += player.vx;

      // Vertical movement / Gravity
      player.vy += GRAVITY;
      player.y += player.vy;

      let onGround = false;
      let newScore = prev.score;
      let newStatus = prev.status;
      let newHint = prev.aiHint;

      const updatedEntities = prev.entities.map(e => {
        // Enemy logic
        if (e.type === 'enemy') {
          return { ...e, x: e.x + e.vx };
        }
        return e;
      }).filter(e => {
        // Collision Detection (AABB)
        const isColliding = 
          player.x < e.x + e.width &&
          player.x + player.width > e.x &&
          player.y < e.y + e.height &&
          player.y + player.height > e.y;

        if (isColliding) {
          if (e.type === 'platform') {
            // Basic platform collision resolution
            if (player.vy > 0 && player.y + player.height - player.vy <= e.y) {
              player.y = e.y - player.height;
              player.vy = 0;
              onGround = true;
            } else if (player.vy < 0 && player.y - player.vy >= e.y + e.height) {
              player.y = e.y + e.height;
              player.vy = 0;
            } else if (player.vx > 0) {
                player.x = e.x - player.width;
                player.vx = 0;
            } else if (player.vx < 0) {
                player.x = e.x + e.width;
                player.vx = 0;
            }
          }

          if (e.type === 'coin') {
            newScore += 100;
            return false; // Remove coin
          }

          if (e.type === 'gemini-block') {
            if (player.vy < 0 && player.y - player.vy >= e.y + e.height) {
               player.vy = 2; // Bounce down
               fetchAiHint(newScore); // Trigger AI
            }
          }

          if (e.type === 'enemy') {
            // If jumping on head
            if (player.vy > 0 && player.y + player.height - player.vy <= e.y + 10) {
              player.vy = JUMP_FORCE / 1.5;
              newScore += 500;
              return false; // Kill enemy
            } else {
              newStatus = 'gameover';
            }
          }

          if (e.type === 'goal') {
            newStatus = 'won';
          }
        }
        return true;
      });

      // Jump
      if (onGround && keys.current.has('ArrowUp')) {
        player.vy = JUMP_FORCE;
      }

      // Boundaries
      if (player.x < 0) player.x = 0;
      if (player.x > WORLD_WIDTH - player.width) player.x = WORLD_WIDTH - player.width;
      if (player.y > SCREEN_HEIGHT) newStatus = 'gameover';

      // Camera
      const cameraX = Math.max(0, Math.min(player.x - SCREEN_WIDTH / 2, WORLD_WIDTH - SCREEN_WIDTH));

      return {
        ...prev,
        player,
        entities: updatedEntities,
        score: newScore,
        status: newStatus,
        cameraX,
        aiHint: newHint
      };
    });
  };

  const draw = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.clearRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);
    
    // Save state for camera transform
    ctx.save();
    ctx.translate(-gameState.cameraX, 0);

    // Draw Background details (Parallax-ish simple)
    ctx.fillStyle = '#4a7dcf';
    for (let i = 0; i < WORLD_WIDTH; i += 800) {
        ctx.fillRect(i + 100, 400, 200, 150); // Simple bush/hill
    }

    // Draw Entities
    gameState.entities.forEach(e => {
      switch (e.type) {
        case 'platform':
          ctx.fillStyle = '#8B4513'; // Dirt
          ctx.fillRect(e.x, e.y, e.width, e.height);
          ctx.fillStyle = '#228B22'; // Grass
          ctx.fillRect(e.x, e.y, e.width, 10);
          break;
        case 'coin':
          ctx.fillStyle = '#FFD700';
          ctx.beginPath();
          ctx.arc(e.x + e.width / 2, e.y + e.height / 2, e.width / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#DAA520';
          ctx.stroke();
          break;
        case 'enemy':
          ctx.fillStyle = '#A52A2A';
          ctx.fillRect(e.x, e.y, e.width, e.height);
          ctx.fillStyle = '#000';
          ctx.fillRect(e.x + 5, e.y + 5, 5, 5);
          ctx.fillRect(e.x + 22, e.y + 5, 5, 5);
          break;
        case 'gemini-block':
          ctx.fillStyle = '#f39c12';
          ctx.fillRect(e.x, e.y, e.width, e.height);
          ctx.fillStyle = '#fff';
          ctx.font = '20px Arial';
          ctx.fillText('?', e.x + 12, e.y + 28);
          break;
        case 'goal':
          ctx.fillStyle = '#7f8c8d';
          ctx.fillRect(e.x, e.y - 100, 10, 200);
          ctx.fillStyle = '#e74c3c';
          ctx.fillRect(e.x + 10, e.y - 100, 40, 30);
          break;
      }
    });

    // Draw Player
    const p = gameState.player;
    ctx.fillStyle = '#ff0000'; // Hat/Shirt
    ctx.fillRect(p.x, p.y, p.width, p.height);
    ctx.fillStyle = '#3b82f6'; // Overalls
    ctx.fillRect(p.x, p.y + p.height / 2, p.width, p.height / 2);
    ctx.fillStyle = '#fbd38d'; // Skin
    ctx.fillRect(p.x + 10, p.y + 5, 20, 15);
    ctx.fillStyle = '#000'; // Eyes
    ctx.fillRect(p.x + 22, p.y + 10, 4, 4);

    ctx.restore();
  }, [gameState]);

  useEffect(() => {
    const loop = () => {
      update();
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) draw(ctx);
      gameLoopRef.current = requestAnimationFrame(loop);
    };
    gameLoopRef.current = requestAnimationFrame(loop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [draw]);

  return (
    <div className="relative w-full h-screen flex items-center justify-center bg-gray-900 overflow-hidden">
      <div className="relative border-8 border-gray-800 shadow-2xl rounded-lg bg-[#5c94fc]">
        <canvas
          ref={canvasRef}
          width={SCREEN_WIDTH}
          height={SCREEN_HEIGHT}
          className="block"
        />
        <UI 
          score={gameState.score} 
          status={gameState.status} 
          aiHint={gameState.aiHint}
          onRestart={initLevel}
        />
      </div>
      
      {/* Mobile Controls Placeholder */}
      <div className="absolute bottom-10 left-10 lg:hidden flex gap-4 pointer-events-none">
         {/* In a real app, touch buttons would go here */}
      </div>
    </div>
  );
};

export default App;
