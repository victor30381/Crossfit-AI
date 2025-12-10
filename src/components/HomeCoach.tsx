import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, WorkoutLog } from '../types';
import { generateHomeWorkout } from '../services/geminiService';
import { Sparkles, Dumbbell, Check, Loader2, Calendar, Play, ChevronRight, ChevronLeft, RotateCcw, Volume2, Trash2 } from 'lucide-react';

interface HomeCoachProps {
  user: UserProfile;
  onAddLog: (log: WorkoutLog) => void;
}

interface Exercise {
  name: string;
  instruction: string;
  durationSeconds: number;
}

interface Section {
  name: string;
  exercises: Exercise[];
}

interface WorkoutData {
  title: string;
  estimatedCalories: number;
  tips: string;
  sections: Section[];
}

const COMMON_EQUIPMENT = [
  { id: 'jump_rope', name: 'Soga de Saltar', icon: '➰' },
  { id: 'dumbbells', name: 'Mancuernas', icon: '🏋️' },
  { id: 'kettlebell', name: 'Kettlebell', icon: '🔔' },
  { id: 'pull_up_bar', name: 'Barra de Dominadas', icon: '💪' },
  { id: 'box', name: 'Cajón (Box)', icon: '📦' },
  { id: 'rings', name: 'Anillas', icon: '⭕' },
  { id: 'barbell', name: 'Barra Olímpica', icon: '🏋️‍♂️' },
  { id: 'wall_ball', name: 'Balón Medicinal', icon: '🏐' },
  { id: 'rower', name: 'Remo', icon: '🚣' },
  { id: 'bike', name: 'Bici (Air Bike)', icon: '🚲' },
];

const HomeCoach: React.FC<HomeCoachProps> = ({ user, onAddLog, onUpdateUser }) => {
  const [loading, setLoading] = useState(false);
  const [workout, setWorkout] = useState<WorkoutData | null>(() => {
    const saved = localStorage.getItem('cf_current_workout');
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showEquipment, setShowEquipment] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>(user.fitnessLevel || 'intermedio');
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const toggleEquipment = (eqId: string) => {
    if (!onUpdateUser) return;
    const currentEq = user.equipment || [];
    let newEq;
    if (currentEq.includes(eqId)) {
      newEq = currentEq.filter(id => id !== eqId);
    } else {
      newEq = [...currentEq, eqId];
    }
    onUpdateUser({ ...user, equipment: newEq });
  };

  // Persist workout
  useEffect(() => {
    if (workout) {
      localStorage.setItem('cf_current_workout', JSON.stringify(workout));
    } else {
      localStorage.removeItem('cf_current_workout');
    }
  }, [workout]);

  // Guided Mode State
  const [isGuided, setIsGuided] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Audio
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  const playBeep = (freq: number = 800) => {
    if (!audioCtxRef.current) return;
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume();
    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();
    osc.frequency.setValueAtTime(freq, audioCtxRef.current.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtxRef.current.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);
    osc.start();
    osc.stop(audioCtxRef.current.currentTime + 0.1);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setWorkout(null);
    try {
      const result = await generateHomeWorkout(user, selectedDifficulty);
      setWorkout(result);
    } catch (e) {
      alert("Error generando entrenamiento. Intenta de nuevo.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleLog = () => {
    if (!workout) return;
    const now = new Date();
    const [year, month, day] = selectedDate.split('-').map(Number);
    const dateToSave = new Date(year, month - 1, day, now.getHours(), now.getMinutes());

    const newLog: WorkoutLog = {
      id: crypto.randomUUID(),
      date: dateToSave.toISOString(),
      name: workout.title || 'Entrenamiento en Casa',
      description: 'Generado por IA',
      calories: workout.estimatedCalories || 300,
      durationMinutes: 45,
      type: 'home-ai'
    };
    onAddLog(newLog);
    alert("Entrenamiento registrado en tu calendario!");
    // Reset
    setWorkout(null);
    setIsGuided(false);
  };

  const handleDiscard = () => {
    setShowDiscardConfirm(true);
  };

  const confirmDiscard = () => {
    setWorkout(null);
    setIsGuided(false);
    setShowDiscardConfirm(false);
  };

  const startGuidedWorkout = () => {
    setIsGuided(true);
    setCurrentSectionIndex(0);
    setCurrentExerciseIndex(0);
    // Init timer for first exercise if needed
    const firstEx = workout?.sections[0]?.exercises[0];
    if (firstEx?.durationSeconds) {
      setTimer(firstEx.durationSeconds);
    } else {
      setTimer(0);
    }
    setIsTimerRunning(false);
  };

  const nextExercise = () => {
    if (!workout) return;
    const currentSection = workout.sections[currentSectionIndex];

    if (currentExerciseIndex < currentSection.exercises.length - 1) {
      // Next exercise in same section
      setCurrentExerciseIndex(prev => prev + 1);
      const nextEx = currentSection.exercises[currentExerciseIndex + 1];
      setTimer(nextEx.durationSeconds || 0);
    } else if (currentSectionIndex < workout.sections.length - 1) {
      // Next section
      setCurrentSectionIndex(prev => prev + 1);
      setCurrentExerciseIndex(0);
      const nextEx = workout.sections[currentSectionIndex + 1].exercises[0];
      setTimer(nextEx.durationSeconds || 0);
    } else {
      // Finished
      alert("¡Entrenamiento Completado!");
      setIsGuided(false);
    }
    setIsTimerRunning(false);
  };

  const prevExercise = () => {
    if (!workout) return;
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
      const prevEx = workout.sections[currentSectionIndex].exercises[currentExerciseIndex - 1];
      setTimer(prevEx.durationSeconds || 0);
    } else if (currentSectionIndex > 0) {
      setCurrentSectionIndex(prev => prev - 1);
      const prevSection = workout.sections[currentSectionIndex - 1];
      setCurrentExerciseIndex(prevSection.exercises.length - 1);
      const prevEx = prevSection.exercises[prevSection.exercises.length - 1];
      setTimer(prevEx.durationSeconds || 0);
    }
    setIsTimerRunning(false);
  };

  // Timer Logic
  useEffect(() => {
    let interval: number;
    if (isTimerRunning && timer > 0) {
      interval = window.setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            playBeep(1200); // End beep
            setIsTimerRunning(false);
            return 0;
          }
          if (prev <= 4) playBeep(600); // Countdown
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

  // View: Guided Mode
  if (isGuided && workout) {
    const currentSection = workout.sections[currentSectionIndex];
    const currentExercise = currentSection.exercises[currentExerciseIndex];
    const progress = ((currentSectionIndex * 100) + ((currentExerciseIndex + 1) / currentSection.exercises.length) * 100) / workout.sections.length;

    return (
      <div className="flex flex-col h-full w-full bg-black relative overflow-hidden">
        {/* Header - Compact */}
        <div className="flex justify-between items-center p-3 bg-black/40 backdrop-blur-md z-20 shrink-0 border-b border-white/5">
          <button onClick={() => setIsGuided(false)} className="text-gray-400 hover:text-white transition-colors p-1">
            <ChevronLeft size={24} />
          </button>
          <div className="flex flex-col items-center">
            <h3 className="font-bold text-[var(--color-primary)] uppercase tracking-wider text-xs md:text-sm truncate max-w-[200px]">{currentSection.name}</h3>
            <div className="flex gap-1 mt-1">
              {currentSection.exercises.map((_, i) => (
                <div key={i} className={`h-1 w-3 rounded-full ${i === currentExerciseIndex ? 'bg-[var(--color-primary)]' : 'bg-gray-800'}`} />
              ))}
            </div>
          </div>
          <div className="w-8"></div> {/* Spacer */}
        </div>

        {/* Main Content - Adaptive Flex */}
        <div className="flex-1 flex flex-col relative z-10">

          {/* Exercise Info - Top */}
          <div className="px-4 pt-4 pb-2 text-center shrink-0">
            <h2 className="text-2xl md:text-4xl font-black text-white leading-none mb-2">{currentExercise.name}</h2>
            <p className="text-sm md:text-base text-gray-400 font-medium line-clamp-2 leading-tight">{currentExercise.instruction}</p>
          </div>

          {/* Timer / Reps - Fills available space */}
          <div className="flex-1 flex items-center justify-center p-4 min-h-0">
            {currentExercise.durationSeconds > 0 ? (
              <div className="relative w-full h-full flex items-center justify-center max-h-[35vh] aspect-square">
                {/* Adaptive Circular Progress */}
                <svg className="transform -rotate-90 w-full h-full max-h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className="text-gray-800"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 45}
                    strokeDashoffset={2 * Math.PI * 45 - (timer / (currentExercise.durationSeconds || 1)) * (2 * Math.PI * 45)}
                    strokeLinecap="round"
                    className={`text-[var(--color-primary)] transition-all duration-1000 ease-linear ${isTimerRunning ? 'drop-shadow-[0_0_10px_rgba(255,50,50,0.5)]' : ''}`}
                  />
                </svg>

                {/* Digital Timer Center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className={`font-mono font-bold tabular-nums leading-none select-none text-[20vw] md:text-8xl tracking-tighter ${isTimerRunning ? 'text-white' : 'text-gray-500'}`}>
                    {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
                  </div>
                  <div className="text-[3vw] md:text-sm font-bold uppercase tracking-[0.3em] text-gray-600 mt-2">
                    {isTimerRunning ? 'Tiempo Restante' : 'En Pausa'}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full max-w-[80%] aspect-square rounded-full border-4 border-dashed border-gray-800 flex items-center justify-center bg-gray-900/30 backdrop-blur-sm">
                <div className="text-center">
                  <span className="block text-[15vw] md:text-8xl font-black text-gray-700 tracking-tighter">REPS</span>
                  <span className="text-xs md:text-sm text-gray-500 uppercase tracking-widest font-bold block mt-2">Completar</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Control Bar - Fixed Height */}
        <div className="bg-gray-900/90 backdrop-blur-xl border-t border-white/10 p-4 pb-20 md:pb-4 shrink-0 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
          <div className="max-w-md mx-auto flex items-center justify-between gap-4">

            {/* Prev Button */}
            <button
              onClick={prevExercise}
              disabled={currentSectionIndex === 0 && currentExerciseIndex === 0}
              className="p-4 rounded-2xl bg-gray-800 text-white disabled:opacity-20 hover:bg-gray-700 transition-all active:scale-95"
            >
              <ChevronLeft size={24} />
            </button>

            {/* Play/Pause or Next (Main Action) */}
            {currentExercise.durationSeconds > 0 ? (
              <div className="flex-1 flex gap-3">
                <button
                  onClick={() => {
                    setTimer(currentExercise.durationSeconds);
                    setIsTimerRunning(false);
                  }}
                  className="p-4 rounded-2xl bg-gray-800 text-gray-400 hover:text-white transition-all active:scale-95"
                >
                  <RotateCcw size={24} />
                </button>
                <button
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`flex-1 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${isTimerRunning
                    ? 'bg-red-500/20 text-red-500 border border-red-500/50'
                    : 'bg-[var(--color-primary)] text-black'
                    }`}
                >
                  {isTimerRunning ? <span className="flex items-center gap-2"><div className="w-3 h-3 bg-current rounded-sm" /> PAUSAR</span> : <span className="flex items-center gap-2"><Play fill="currentColor" size={20} /> INICIAR</span>}
                </button>
              </div>
            ) : (
              <button
                onClick={nextExercise}
                className="flex-1 bg-[var(--color-primary)] text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-lg active:scale-95"
              >
                SIGUIENTE <ChevronRight size={20} />
              </button>
            )}

            {/* Next Button (Secondary) */}
            {currentExercise.durationSeconds > 0 && (
              <button
                onClick={nextExercise}
                className="p-4 rounded-2xl bg-gray-800 text-white hover:bg-gray-700 transition-all active:scale-95"
              >
                <ChevronRight size={24} />
              </button>
            )}
          </div>
        </div>

        {/* Background Ambient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vw] h-[150vw] bg-[var(--color-primary)]/5 blur-[120px] rounded-full pointer-events-none z-0"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 w-full max-w-3xl mx-auto p-4 md:p-6 min-h-0">
      {!workout && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <button
            onClick={() => setShowEquipment(!showEquipment)}
            className="mb-6 text-sm text-[var(--color-primary)] font-bold underline decoration-dotted hover:text-white transition-colors"
          >
            {user.equipment && user.equipment.length > 0
              ? `Equipamiento: ${user.equipment.length} items`
              : '+ Añadir mi equipamiento'}
          </button>

          {showEquipment && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-[var(--color-card)] border border-[var(--color-secondary)] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                <h3 className="text-xl font-bold mb-4 text-center">Tu Gimnasio</h3>
                <p className="text-sm text-gray-400 mb-4 text-center">Selecciona lo que tienes disponible. La IA lo usará para variar tus rutinas.</p>
                <div className="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto custom-scrollbar mb-6">
                  {COMMON_EQUIPMENT.map(eq => (
                    <button
                      key={eq.id}
                      onClick={() => toggleEquipment(eq.id)}
                      className={`p-3 rounded-xl border text-left text-sm font-medium transition-all flex items-center gap-2 ${user.equipment?.includes(eq.id)
                        ? 'bg-[var(--color-primary)]/20 border-[var(--color-primary)] text-white'
                        : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
                        }`}
                    >
                      <span>{eq.icon}</span>
                      {eq.name}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setShowEquipment(false)}
                  className="w-full bg-[var(--color-primary)] text-black font-bold py-3 rounded-xl hover:brightness-110 transition-all"
                >
                  Guardar y Cerrar
                </button>
              </div>
            </div>
          )}

          <div className="bg-[var(--color-secondary)]/20 p-4 rounded-full mb-4 md:mb-6 md:p-6">
            <Dumbbell size={32} className="text-[var(--color-primary)] md:w-12 md:h-12" />
          </div>
          <h3 className="text-xl font-bold mb-2 md:mb-4">¿Listo para sudar?</h3>
          <p className="text-gray-400 mb-6 max-w-sm text-sm md:text-base">
            La IA creará una rutina personalizada basada en tu nivel y edad.
          </p>

          {/* Difficulty Selector */}
          <div className="mb-6 w-full max-w-xs">
            <label className="block text-xs text-gray-400 uppercase font-bold mb-2 text-left">Nivel de Intensidad</label>
            <div className="grid grid-cols-2 gap-2">
              {['principiante', 'intermedio', 'avanzado', 'experto'].map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedDifficulty(level)}
                  className={`p-2 rounded-lg text-sm font-bold capitalize transition-all ${selectedDifficulty === level
                    ? 'bg-[var(--color-primary)] text-black shadow-lg scale-105'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white font-bold py-3 px-6 md:py-4 md:px-8 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center gap-2 text-sm md:text-base"
          >
            <Sparkles size={18} className="md:w-5 md:h-5" />
            Generar WOD Ahora
          </button>
        </div>
      )}

      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-[var(--color-primary)]" size={60} />
          <p className="mt-4 text-lg font-medium">Diseñando tu sufrimiento...</p>
        </div>
      )}

      {workout && (
        <div className="flex-1 overflow-y-auto bg-[var(--color-card)] rounded-2xl border border-[var(--color-secondary)] p-4 md:p-6 shadow-2xl animate-slide-up relative custom-scrollbar">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]"></div>

          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xl md:text-2xl font-black uppercase italic text-[var(--color-text)] leading-tight">{workout.title}</h3>
            <button onClick={handleDiscard} className="text-red-400 hover:text-red-300 p-1">
              <Trash2 size={20} />
            </button>
          </div>

          <div className="space-y-6">
            {workout.sections.map((section, idx) => (
              <div key={idx} className="p-4 bg-[var(--color-bg)] rounded-xl border-l-4 border-[var(--color-primary)]">
                <h4 className="font-bold text-[var(--color-primary)] text-xs uppercase mb-3">{section.name}</h4>
                <ul className="space-y-2">
                  {section.exercises.map((ex, i) => (
                    <li key={i} className="flex flex-col sm:flex-row sm:justify-between text-sm border-b border-gray-800 pb-3 last:border-0 gap-1">
                      <span className="text-[var(--color-text)] font-bold">{ex.name}</span>
                      <span className="text-gray-500 sm:text-right text-xs sm:text-sm">{ex.instruction}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="mt-8 text-center italic text-gray-500 text-sm">
              "{workout.tips}"
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={startGuidedWorkout}
                className="flex-1 bg-[var(--color-primary)] text-black font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-lg"
              >
                <Play size={20} />
                EMPEZAR ENTRENAMIENTO
              </button>
            </div>

            {/* Date Selection & Log */}
            <div className="mt-8 pt-6 border-t border-gray-800">
              <label className="block text-xs text-gray-400 uppercase font-bold mb-2">Fecha del Entrenamiento</label>
              <div className="flex items-center gap-2 bg-[var(--color-bg)] p-3 rounded-xl border border-gray-700 focus-within:border-[var(--color-primary)] transition-colors mb-4">
                <Calendar size={20} className="text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-[var(--color-text)] w-full focus:outline-none font-medium"
                />
              </div>

              <button
                onClick={handleLog}
                className="w-full bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                <Check size={20} />
                Solo Registrar (Sin Guiar)
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Custom Discard Confirmation Modal */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[var(--color-card)] border border-[var(--color-secondary)] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-4 text-center text-[var(--color-text)]">¿Descartar entrenamiento?</h3>
            <p className="text-sm text-gray-400 mb-6 text-center">
              Si lo descartas, perderás esta rutina generada.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDiscardConfirm(false)}
                className="flex-1 py-3 rounded-xl font-bold bg-gray-800 text-white hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDiscard}
                className="flex-1 py-3 rounded-xl font-bold bg-red-500/20 text-red-500 border border-red-500/50 hover:bg-red-500/30 transition-colors"
              >
                Sí, Descartar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomeCoach;
