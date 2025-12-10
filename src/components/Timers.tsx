import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Settings, Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';

type TimerType = 'stopwatch' | 'fortime' | 'amrap' | 'emom' | 'tabata';

interface TimerState {
  time: number;
  rounds: number;
  tabataPhase: 'Work' | 'Rest';
  isWork: boolean;
  totalRounds: number;
}

const Timers: React.FC = () => {
  const [activeTimer, setActiveTimer] = useState<TimerType>('stopwatch');
  const [isRunning, setIsRunning] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Combined state
  const [timerState, setTimerState] = useState<TimerState>({
    time: 0,
    rounds: 0,
    tabataPhase: 'Work',
    isWork: true,
    totalRounds: 8
  });

  // Settings
  const [capTime, setCapTime] = useState(20 * 60);
  const [emomInterval, setEmomInterval] = useState(60);
  const [workTime, setWorkTime] = useState(20);
  const [restTime, setRestTime] = useState(10);
  const [totalRounds, setTotalRounds] = useState(8);

  const timerRef = useRef<number | null>(null);

  // Initialize Audio Context
  useEffect(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  const playBeep = useCallback((freq: number = 800, duration: number = 0.1, type: OscillatorType = 'sine') => {
    if (!soundEnabled || !audioCtxRef.current) return;
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();

    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtxRef.current.currentTime);

    gain.gain.setValueAtTime(0.1, audioCtxRef.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);

    osc.start();
    osc.stop(audioCtxRef.current.currentTime + duration);
  }, [soundEnabled]);

  const playCountdown = () => playBeep(600, 0.1, 'square');
  const playGo = () => playBeep(1200, 0.3, 'square');

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Timer Logic (Same as before)
  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setInterval(() => {
        setTimerState((prev) => {
          if (activeTimer === 'stopwatch') return { ...prev, time: prev.time + 1 };
          if (activeTimer === 'fortime') {
            const nextTime = prev.time + 1;
            if (capTime > 0 && nextTime >= capTime) {
              playGo(); setIsRunning(false); return { ...prev, time: capTime };
            }
            return { ...prev, time: nextTime };
          }
          if (activeTimer === 'amrap') {
            if (prev.time <= 0) { playGo(); setIsRunning(false); return { ...prev, time: 0 }; }
            if (prev.time <= 4 && prev.time > 1) playCountdown();
            if (prev.time === 1) playGo();
            return { ...prev, time: prev.time - 1 };
          }
          if (activeTimer === 'emom') {
            const nextTime = prev.time + 1;
            const currentIntervalTime = nextTime % emomInterval;
            if (nextTime > 0 && currentIntervalTime === 0) {
              playGo(); return { ...prev, time: nextTime, rounds: prev.rounds + 1 };
            }
            const timeToNext = emomInterval - currentIntervalTime;
            if (timeToNext <= 3 && timeToNext > 0) playCountdown();
            return { ...prev, time: nextTime };
          }
          if (activeTimer === 'tabata') {
            if (prev.rounds >= totalRounds && prev.tabataPhase === 'Rest' && prev.time <= 0) {
              playGo(); setIsRunning(false); return prev;
            }
            if (prev.time > 0) {
              if (prev.time <= 3) playCountdown();
              return { ...prev, time: prev.time - 1 };
            }
            playGo();
            if (prev.tabataPhase === 'Work') {
              return { ...prev, tabataPhase: 'Rest', time: restTime, isWork: false };
            } else {
              return { ...prev, tabataPhase: 'Work', time: workTime, rounds: prev.rounds + 1, isWork: true };
            }
          }
          return prev;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning, activeTimer, emomInterval, workTime, restTime, capTime, totalRounds, playBeep, playCountdown, playGo]);

  const handleReset = () => {
    setIsRunning(false);
    let initialTime = 0;
    if (activeTimer === 'amrap') initialTime = capTime;
    if (activeTimer === 'tabata') initialTime = workTime;
    setTimerState({ time: initialTime, rounds: 0, tabataPhase: 'Work', isWork: true, totalRounds: totalRounds });
  };

  const switchTimer = (type: TimerType) => {
    setActiveTimer(type);
    setIsRunning(false);
    setShowSettings(true);
    let initialTime = 0;
    if (type === 'amrap') initialTime = capTime;
    if (type === 'tabata') initialTime = workTime;
    setTimerState({ time: initialTime, rounds: 0, tabataPhase: 'Work', isWork: true, totalRounds: totalRounds });
  };

  useEffect(() => {
    if (!isRunning) {
      if (activeTimer === 'amrap') setTimerState(prev => ({ ...prev, time: capTime }));
      if (activeTimer === 'tabata') setTimerState(prev => ({ ...prev, time: workTime, totalRounds: totalRounds }));
    }
  }, [capTime, workTime, totalRounds, activeTimer, isRunning]);

  // Helper for Number Input
  const NumberControl = ({ label, value, onChange, step = 1, suffix = '' }: any) => (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">{label}</label>
      <div className="flex items-center bg-[var(--color-bg)] rounded-xl border border-gray-800 p-1">
        <button
          onClick={() => onChange(Math.max(0, value - step))}
          className="p-3 hover:bg-gray-700/50 rounded-lg text-gray-400 hover:text-[var(--color-text)] transition-colors"
        >
          <Minus size={16} />
        </button>
        <div className="flex-1 text-center font-bold text-lg text-[var(--color-text)]">
          {value}{suffix}
        </div>
        <button
          onClick={() => onChange(value + step)}
          className="p-3 hover:bg-gray-700/50 rounded-lg text-gray-400 hover:text-[var(--color-text)] transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full animate-fade-in max-w-md mx-auto w-full relative">

      {/* Top Bar: Selector & Settings Toggle */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <div className="flex-1 overflow-x-auto no-scrollbar mask-gradient-r">
          <div className="flex gap-2 p-1">
            {(['stopwatch', 'fortime', 'amrap', 'emom', 'tabata'] as TimerType[]).map((t) => (
              <button
                key={t}
                onClick={() => switchTimer(t)}
                className={`
                  whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all border
                  ${activeTimer === t
                    ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-[0_0_15px_var(--color-primary)]'
                    : 'bg-transparent border-gray-800 text-gray-400 hover:border-gray-600 hover:text-[var(--color-text)]'}
                `}
              >
                {t === 'fortime' ? 'For Time' : t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`ml-2 p-2 rounded-full border transition-colors ${showSettings ? 'bg-[var(--color-card)] border-[var(--color-primary)] text-[var(--color-primary)]' : 'border-transparent text-gray-500'}`}
        >
          <Settings size={20} />
        </button>
      </div>

      {/* Settings Panel (Collapsible) */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out shrink-0 ${showSettings ? 'max-h-80 opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
        <div className="bg-[var(--color-card)] rounded-2xl p-4 border border-[var(--color-secondary)]/50 shadow-lg grid grid-cols-2 gap-3">
          {(activeTimer === 'amrap' || activeTimer === 'fortime') && (
            <NumberControl label="Time Cap (min)" value={capTime / 60} onChange={(v: number) => setCapTime(v * 60)} />
          )}
          {activeTimer === 'emom' && (
            <NumberControl label="Intervalo (seg)" value={emomInterval} onChange={setEmomInterval} step={5} />
          )}
          {activeTimer === 'tabata' && (
            <>
              <NumberControl label="Trabajo (seg)" value={workTime} onChange={setWorkTime} step={5} />
              <NumberControl label="Descanso (seg)" value={restTime} onChange={setRestTime} step={5} />
              <NumberControl label="Rondas" value={totalRounds} onChange={setTotalRounds} />
            </>
          )}
          {activeTimer === 'stopwatch' && (
            <div className="col-span-2 text-center text-gray-500 text-sm py-4">Cronómetro simple sin configuración.</div>
          )}
        </div>
      </div>

      {/* Main Timer Display */}
      <div className="flex-1 flex flex-col items-center justify-center relative min-h-[250px]">
        <div className={`
          relative w-64 h-64 sm:w-80 sm:h-80 rounded-full flex flex-col items-center justify-center transition-all duration-500
          border-4
          ${isRunning
            ? (timerState.isWork
              ? 'border-[var(--color-primary)] shadow-[0_0_50px_var(--color-primary)] bg-[var(--color-primary)]/5'
              : 'border-red-500 shadow-[0_0_50px_#ef4444] bg-red-500/5')
            : 'border-gray-800 bg-[var(--color-card)]'}
        `}>

          {/* Status Badge */}
          {(activeTimer === 'tabata' || activeTimer === 'emom') && (
            <div className={`
              absolute top-12 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border
              ${timerState.isWork
                ? 'bg-[var(--color-primary)]/20 border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'bg-red-500/20 border-red-500 text-red-500'}
            `}>
              {activeTimer === 'emom' ? 'EMOM' : timerState.tabataPhase}
            </div>
          )}

          {/* Time */}
          <div className="text-6xl sm:text-7xl font-mono font-bold tracking-tighter text-[var(--color-text)] tabular-nums drop-shadow-2xl">
            {formatTime(timerState.time)}
          </div>

          {/* Rounds */}
          {(activeTimer === 'emom' || activeTimer === 'tabata') && (
            <div className="absolute bottom-12 text-gray-400 text-sm font-medium bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
              Ronda {timerState.rounds + 1} <span className="opacity-50">/ {activeTimer === 'tabata' ? totalRounds : '-'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="mt-auto pt-6 pb-2 flex items-center justify-center gap-6 shrink-0">
        <button
          onClick={handleReset}
          className="p-4 rounded-2xl bg-[var(--color-card)] border border-gray-800 text-gray-400 hover:text-[var(--color-text)] hover:border-gray-600 transition-all active:scale-95"
        >
          <RotateCcw size={24} />
        </button>

        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`
            w-20 h-20 rounded-3xl flex items-center justify-center transition-all shadow-2xl active:scale-95
            ${isRunning
              ? 'bg-red-500 text-white shadow-[0_0_30px_#ef4444]'
              : 'bg-[var(--color-primary)] text-black shadow-[0_0_30px_var(--color-primary)]'}
          `}
        >
          {isRunning ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
        </button>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-4 rounded-2xl border transition-all active:scale-95 ${soundEnabled ? 'bg-[var(--color-card)] border-gray-800 text-[var(--color-text)]' : 'bg-red-900/20 border-red-900/50 text-red-500'}`}
        >
          {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
        </button>
      </div>

    </div>
  );
};

export default Timers;