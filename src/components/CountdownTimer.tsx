
import React, { useEffect, useRef, useState } from 'react';

interface CountdownTimerProps {
  targetDate: string;
}

type TimeParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number;
  percent: number;
};

const getTimeParts = (target: Date, start: Date): TimeParts => {
  const now = new Date();
  const total = target.getTime() - now.getTime();
  const eventDuration = target.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const percent = Math.max(0, Math.min(1, elapsed / eventDuration));
  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  return { days, hours, minutes, seconds, total, percent };
};

const GAMIFY_TEXTS = [
  '⏳ Time is running out',
  '⚠ Limited slots remaining',
  '🔥 Registration closing soon',
  '🏁 Final countdown has begun',
];

function getGamifyText(time: TimeParts): string {
  if (time.days < 1) return GAMIFY_TEXTS[3];
  if (time.days < 7) return GAMIFY_TEXTS[2];
  if (time.days < 30) return GAMIFY_TEXTS[1];
  return GAMIFY_TEXTS[0];
}

function getBorderColor(time: TimeParts): string {
  if (time.days < 1) return 'border-red-500 shadow-red-500/60';
  if (time.days < 7) return 'border-red-500 shadow-orange-500/60';
  if (time.days < 30) return 'border-orange-400 shadow-orange-400/40';
  return 'border-cyan-400 shadow-cyan-400/30';
}

function getProgressColor(time: TimeParts): string {
  if (time.days < 1) return 'bg-red-500';
  if (time.days < 7) return 'bg-orange-500';
  if (time.days < 30) return 'bg-orange-400';
  return 'bg-cyan-400';
}

const pad = (n: number) => String(Math.max(0, n)).padStart(2, '0');

const FlipDigit: React.FC<{ value: number; prev: number; pulse: boolean; danger: boolean; unit: string }> = ({ value, prev, pulse, danger, unit }) => {
  const [flipping, setFlipping] = useState(false);
  useEffect(() => {
    if (value !== prev) {
      setFlipping(true);
      const t = setTimeout(() => setFlipping(false), 400);
      return () => clearTimeout(t);
    }
  }, [value, prev]);
  return (
    <div className={`relative w-14 h-20 md:w-16 md:h-24 mx-1 flex flex-col items-center select-none`}> 
      <div
        className={`w-full h-full rounded-lg bg-black/80 border-2 text-5xl md:text-6xl font-extrabold font-mono flex items-center justify-center transition-transform duration-200 ${danger ? 'text-red-400 border-red-500 shadow-red-500/80' : 'text-cyan-200 border-cyan-400 shadow-cyan-400/40'} ${flipping ? 'animate-flip' : ''} ${pulse ? 'animate-pulse-fast' : ''}`}
        aria-label={unit}
      >
        {pad(value)}
      </div>
      <span className="text-xs mt-1 text-cyan-300 uppercase tracking-widest font-bold drop-shadow">{unit}</span>
    </div>
  );
};

const CountdownTimer: React.FC<CountdownTimerProps> = ({ targetDate }) => {
  const eventStart = useRef(new Date('2026-01-01T00:00:00'));
  const target = new Date(targetDate);
  const [time, setTime] = useState(() => getTimeParts(target, eventStart.current));
  const [prev, setPrev] = useState(time);
  const [showFlash, setShowFlash] = useState(false);
  // Sound removed

  useEffect(() => {
    const interval = setInterval(() => {
      setPrev(time);
      setTime(getTimeParts(target, eventStart.current));
    }, 1000);
    return () => clearInterval(interval);
  }, [target, time]);

  // Energy flash on minute change
  useEffect(() => {
    if (time.minutes !== prev.minutes) {
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 200);
    }
  }, [time.minutes, prev.minutes]);

  // Sound effect removed

  if (time.total <= 0) {
    return (
      <div className="w-full max-w-md mx-auto bg-green-900/80 border border-green-400 rounded-xl p-8 flex flex-col items-center shadow-lg animate-fade-in-up">
        <span className="text-3xl font-bold text-green-400 mb-2">Event Started!</span>
        <span className="text-lg text-green-200">Welcome to Roboyudh 2026</span>
      </div>
    );
  }

  // Urgency effects
  const borderColor = getBorderColor(time);
  const progressColor = getProgressColor(time);
  const danger = time.days < 1;
  const pulse = time.days < 7;
  const shake = time.days < 1 && time.hours < 24;

  return (
    <div
      className={`relative w-full max-w-xl mx-auto bg-gradient-to-br from-black/90 via-gray-900/80 to-black/90 border-4 rounded-2xl p-8 flex flex-col items-center shadow-2xl transition-transform duration-200 ${borderColor} ${shake ? 'animate-shake' : ''} hover:scale-105`}
      tabIndex={0}
    >
      {/* Energy flash */}
      {showFlash && <div className="absolute inset-0 z-10 pointer-events-none animate-energy-flash rounded-2xl" />}
      {/* Particle sparks (optional, simple) */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute left-1/4 top-2 w-2 h-2 bg-cyan-400 rounded-full opacity-30 animate-spark" />
        <div className="absolute right-1/4 bottom-2 w-1.5 h-1.5 bg-orange-400 rounded-full opacity-30 animate-spark2" />
        <div className="absolute left-1/2 top-1/2 w-1 h-1 bg-red-500 rounded-full opacity-20 animate-spark3" />
      </div>
      {/* Flip Digits */}
      <div className="flex gap-2 justify-center items-end mb-2">
        <FlipDigit value={time.days} prev={prev.days} pulse={pulse} danger={danger} unit="Days" />
        <span className="text-3xl md:text-4xl font-bold text-cyan-400 mx-1">:</span>
        <FlipDigit value={time.hours} prev={prev.hours} pulse={pulse} danger={danger} unit="Hours" />
        <span className="text-3xl md:text-4xl font-bold text-cyan-400 mx-1">:</span>
        <FlipDigit value={time.minutes} prev={prev.minutes} pulse={pulse} danger={danger} unit="Min" />
        <span className="text-3xl md:text-4xl font-bold text-cyan-400 mx-1">:</span>
        <FlipDigit value={time.seconds} prev={prev.seconds} pulse={true} danger={danger} unit="Sec" />
      </div>
      {/* Gamification Text */}
      <div className="text-lg md:text-xl font-bold text-orange-400 mt-2 animate-fade-in-up drop-shadow-lg">
        {getGamifyText(time)}
      </div>
      {/* Progress Bar */}
      <div className="w-full h-3 mt-6 bg-gray-800 rounded-full overflow-hidden border border-cyan-900">
        <div
          className={`h-full ${progressColor} transition-all duration-700`}
          style={{ width: `${Math.min(100, Math.max(0, time.percent * 100))}%` }}
        />
      </div>
      {/* Sound and mute button removed */}
      {/* Event Date */}
      <span className="text-xs text-cyan-300 mt-2">Event Date: 26th February 2026</span>
      {/* Custom styles for flip, pulse, shake, energy flash, sparks */}
      <style>{`
        .animate-flip {
          animation: flip 0.4s cubic-bezier(.68,-0.55,.27,1.55);
        }
        @keyframes flip {
          0% { transform: rotateX(0deg); }
          50% { transform: rotateX(90deg) scaleY(0.8); }
          100% { transform: rotateX(0deg); }
        }
        .animate-pulse-fast {
          animation: pulse-fast 0.7s cubic-bezier(.4,0,.6,1) infinite;
        }
        @keyframes pulse-fast {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255,64,64,0.5); }
          50% { box-shadow: 0 0 16px 4px rgba(255,64,64,0.8); }
        }
        .animate-shake {
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) infinite;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-4px); }
          40%, 80% { transform: translateX(4px); }
        }
        .animate-energy-flash {
          animation: energy-flash 0.2s linear;
          background: radial-gradient(circle, #fff 0%, #fbbf24 40%, #f87171 100%);
          opacity: 0.5;
        }
        @keyframes energy-flash {
          0% { opacity: 0.7; }
          100% { opacity: 0; }
        }
        .animate-spark {
          animation: spark 1.5s linear infinite;
        }
        @keyframes spark {
          0% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 0.7; transform: translateY(-10px) scale(1.2); }
          100% { opacity: 0.3; transform: translateY(0); }
        }
        .animate-spark2 {
          animation: spark2 1.2s linear infinite;
        }
        @keyframes spark2 {
          0% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 0.7; transform: translateY(10px) scale(1.2); }
          100% { opacity: 0.3; transform: translateY(0); }
        }
        .animate-spark3 {
          animation: spark3 2s linear infinite;
        }
        @keyframes spark3 {
          0% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.5); }
          100% { opacity: 0.2; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default CountdownTimer;
