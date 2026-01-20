
import React from 'react';

interface UIProps {
  score: number;
  status: string;
  aiHint: string;
  onRestart: () => void;
}

export const UI: React.FC<UIProps> = ({ score, status, aiHint, onRestart }) => {
  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 select-none">
      {/* HUD */}
      <div className="flex justify-between items-start">
        <div className="bg-black/50 p-4 border-4 border-white text-white">
          <p className="text-sm mb-1">SCORE</p>
          <p className="text-xl">{score.toString().padStart(6, '0')}</p>
        </div>
        
        {aiHint && (
          <div className="max-w-xs bg-yellow-400 p-4 border-4 border-black text-black text-xs animate-bounce shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <p className="font-bold mb-1">ORACLE SAYS:</p>
            <p>"{aiHint}"</p>
          </div>
        )}
      </div>

      {/* Game Over / Win Screens */}
      {(status === 'gameover' || status === 'won') && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 pointer-events-auto">
          <div className="bg-white border-8 border-red-500 p-10 text-center shadow-2xl">
            <h1 className={`text-4xl mb-6 ${status === 'won' ? 'text-green-600' : 'text-red-600'}`}>
              {status === 'won' ? 'STAGE CLEAR!' : 'GAME OVER'}
            </h1>
            <p className="text-black mb-8">FINAL SCORE: {score}</p>
            <button
              onClick={onRestart}
              className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform active:translate-y-1 active:shadow-none"
            >
              PLAY AGAIN
            </button>
          </div>
        </div>
      )}

      {/* Controls Hint */}
      <div className="text-white text-[10px] text-center bg-black/30 p-2 self-center">
        ARROWS to Move & Jump • ESC to Pause
      </div>
    </div>
  );
};
