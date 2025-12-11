import React, { useState, useRef, useEffect } from 'react';
import { Upload, Loader2, CheckCircle, AlertCircle, FileText, Image as ImageIcon, Type, Trash2, Calendar, X, RefreshCw } from 'lucide-react';
import { analyzeWod, evaluatePerformance, fileToGenerativePart } from '../services/geminiService';
import { UserProfile, WorkoutLog } from '../types';

interface WodScannerProps {
  user: UserProfile;
  onAddLog: (log: WorkoutLog) => void;
  onUpdateUser: (user: UserProfile) => void;
}

type InputMode = 'upload' | 'text';

const WodScanner: React.FC<WodScannerProps> = ({ user, onAddLog, onUpdateUser }) => {
  // ... (state remains the same)
  const [mode, setMode] = useState<InputMode>('upload');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // File State
  const [preview, setPreview] = useState<string | null>(null); // For Images
  const [fileName, setFileName] = useState<string | null>(null); // For PDFs
  const [fileData, setFileData] = useState<{ mimeType: string, data: string } | null>(null);



  // Text State
  const [inputText, setInputText] = useState('');

  // Result State
  const [result, setResult] = useState<Partial<WorkoutLog> | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const fileInputRef = useRef<HTMLInputElement>(null);



  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      setPreview(file.type.startsWith('image/') ? base64String : null);
      setFileName(file.name);
      setFileData({ mimeType: file.type, data: base64Data });

      handleAnalyze({ file: { mimeType: file.type, data: base64Data } });
    };
    reader.readAsDataURL(file);
  };

  const handleTextAnalyze = () => {
    if (!inputText.trim()) return;
    handleAnalyze({ text: inputText });
  };

  const handleAnalyze = async (input: any) => {
    setLoading(true);
    setError(null);
    try {
      const analysis = await analyzeWod(input, user);
      setResult(analysis);
      setMode('upload'); // Reset mode or keep as is?
    } catch (err) {
      setError('No se pudo analizar el WOD. Intenta de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExerciseChange = (index: number, field: string, value: string) => {
    if (!result || !result.exercises) return;
    const updatedExercises = [...result.exercises];
    updatedExercises[index] = { ...updatedExercises[index], [field]: value };
    setResult({ ...result, exercises: updatedExercises });
  };

  const clearSelection = () => {
    setPreview(null);
    setFileName(null);
    setFileData(null);
    setResult(null);
    setInputText('');
  };

  const handleConfirm = async () => {
    if (!result) return;

    setLoading(true); // Re-use loading state for evaluation

    // Create date at local noon to avoid timezone shifts when converting to ISO
    const [year, month, day] = selectedDate.split('-').map(Number);
    const dateObj = new Date(year, month - 1, day, 12, 0, 0);

    const newLog: WorkoutLog = {
      id: Date.now().toString(),
      date: dateObj.toISOString(),
      name: result.name || 'WOD Sin Nombre',
      description: result.description || 'WOD Analizado',
      calories: result.calories || 0,
      durationMinutes: result.durationMinutes || 0,
      type: 'image-scan',
      exercises: result.exercises
    };

    try {
      // Evaluate performance for XP and Leveling
      const evaluation = await evaluatePerformance(newLog, user);

      const logWithXp = { ...newLog, xpEarned: evaluation.xpEarned };
      onAddLog(logWithXp);

      // Update User Profile
      let newXp = (user.xp || 0) + evaluation.xpEarned;
      let newLevel = user.fitnessLevel;
      let newLevelProgress = (user.levelProgress || 0) + (evaluation.xpEarned / 10); // Simplified progress logic: 1000 XP = 100% progress

      if (newLevelProgress >= 100) {
        newLevelProgress = newLevelProgress % 100; // Keep overflow
        // Logic to actually change level string if AI suggested it
        if (evaluation.newLevel && evaluation.newLevel !== user.fitnessLevel) {
          newLevel = evaluation.newLevel as any;
        }
      }

      onUpdateUser({
        ...user,
        xp: newXp,
        levelProgress: newLevelProgress,
        fitnessLevel: newLevel
      });

      alert(`¡WOD Registrado!\nXP Ganada: ${evaluation.xpEarned}\n${evaluation.feedback}\n${evaluation.newLevel ? '¡HAS SUBIDO DE NIVEL A ' + evaluation.newLevel.toUpperCase() + '!' : ''}`);

      setResult(null);
      setInputText('');
      clearSelection();
    } catch (err) {
      console.error("Error saving log:", err);
      // Save anyway if evaluation fails
      onAddLog(newLog);
      setResult(null);
      clearSelection();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in h-full overflow-y-auto custom-scrollbar p-1">
      {/* Camera Overlay */}


      {!result && !loading && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-[var(--color-text)]">Registrar WOD</h2>
            <p className="text-gray-400">Analiza tu pizarra o escribe tu entrenamiento</p>
          </div>

          <div className="grid grid-cols-1 gap-4">


            <label className="p-6 bg-[var(--color-card)] border border-gray-700 rounded-2xl flex flex-col items-center gap-3 hover:bg-gray-800 transition-all cursor-pointer group">
              <div className="p-3 bg-gray-700 rounded-full group-hover:scale-110 transition-transform">
                <Upload size={32} className="text-gray-400" />
              </div>
              <span className="font-bold text-gray-300">Subir Foto / Archivo</span>
              <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[var(--color-bg)] text-gray-500">O escribe manualmente</span>
            </div>
          </div>

          <div className="space-y-4">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ej: AMRAP 20 min: 5 Pull-ups, 10 Push-ups, 15 Squats..."
              className="w-full h-32 bg-[var(--color-card)] border border-gray-700 rounded-xl p-4 text-[var(--color-text)] placeholder-gray-500 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none resize-none"
            />
            <button
              onClick={handleTextAnalyze}
              className="mt-4 w-full bg-[var(--color-primary)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
            >
              <CheckCircle size={20} />
              Analizar Texto
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4 animate-fade-in">
          <Loader2 size={48} className="text-[var(--color-primary)] animate-spin" />
          <p className="text-gray-400 animate-pulse">Analizando WOD con IA...</p>
        </div>
      )}

      {/* Result Area */}
      {result && !loading && (
        <div className="bg-[var(--color-card)] p-6 rounded-2xl border border-[var(--color-primary)] shadow-2xl animate-slide-up">

          {/* Input Preview Header */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-700">
            <div className="flex items-center gap-3">
              {preview ? (
                <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-600">
                  {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              ) : fileName ? (
                <div className="w-12 h-12 rounded-lg bg-red-900/30 flex items-center justify-center border border-red-500/50">
                  <FileText size={24} className="text-red-400" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center border border-gray-600">
                  <Type size={24} className="text-gray-400" />
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold">Fuente</p>
                <p className="text-sm font-medium truncate max-w-[150px]">
                  {fileName || (preview ? 'Imagen' : 'Texto Manual')}
                </p>
              </div>
            </div>
            <button
              onClick={clearSelection}
              className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <Trash2 size={20} />
            </button>
          </div>

          <div className="flex justify-between items-start mb-4">
            <h3 className="text-2xl font-bold text-[var(--color-text)]">{result.name}</h3>
            <span className="bg-[var(--color-primary)] text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
              ~ {result.durationMinutes} min
            </span>
          </div>

          <div className="bg-[var(--color-bg)] p-4 rounded-xl border border-gray-700 mb-6">
            <p className="text-gray-300 text-sm whitespace-pre-line leading-relaxed">
              {result.description}
            </p>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <span className="text-gray-400 text-xs uppercase tracking-wider mb-1">Calorías Estimadas</span>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-[var(--color-primary)]">{result.calories}</span>
                <span className="text-sm font-medium text-gray-400">kcal</span>
              </div>
            </div>
          </div>

          {/* Date Selection */}
          <div className="mb-6">
            <label className="block text-xs text-gray-400 uppercase font-bold mb-2">Fecha del Entrenamiento</label>
            <div className="flex items-center gap-2 bg-[var(--color-bg)] p-3 rounded-xl border border-gray-700 focus-within:border-[var(--color-primary)] transition-colors">
              <Calendar size={20} className="text-gray-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-[var(--color-text)] w-full focus:outline-none font-medium"
              />
            </div>
          </div>

          <button
            onClick={handleConfirm}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg hover:scale-[1.02]"
          >
            <CheckCircle size={22} />
            Guardar Entrenamiento
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 p-4 rounded-xl border border-red-500/50 flex items-start gap-3 animate-fade-in mt-4">
          <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={20} />
          <span className="text-red-200 text-sm">{error}</span>
        </div>
      )}
    </div>
  );
};

export default WodScanner;