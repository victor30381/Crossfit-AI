import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader2, Utensils, Check, AlertCircle, Pencil, Save, Target, TrendingUp, Calendar, Clock, PlusCircle, Trash2 } from 'lucide-react';
import { analyzeFood, generateDietPlan } from '../services/geminiService';
import { NutritionLog, UserProfile, NutritionGoal, DietPlan, WeightLog, MealType } from '../types';

interface NutritionProps {
    user: UserProfile;
    nutritionLogs?: NutritionLog[];
    onAddLog?: (log: NutritionLog) => void;
    onUpdateUser: (user: UserProfile) => void;
    onDeleteLog?: (id: string) => void;
}

const Nutrition: React.FC<NutritionProps> = ({ user, nutritionLogs = [], onAddLog, onUpdateUser, onDeleteLog }) => {
    const [activeTab, setActiveTab] = useState<'today' | 'plan' | 'progress'>('plan');

    // Today Tab State
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<NutritionLog | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<NutritionLog | null>(null);
    const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Manual Entry State
    const [isManualMode, setIsManualMode] = useState(false);
    const [manualDescription, setManualDescription] = useState('');
    const [manualCalories, setManualCalories] = useState<string>('');
    const [manualMacros, setManualMacros] = useState({ protein: '', carbs: '', fat: '' });


    // Plan Tab State
    const [selectedGoal, setSelectedGoal] = useState<NutritionGoal>(user.nutritionGoal || 'maintain');
    const [generatingPlan, setGeneratingPlan] = useState(false);

    // Progress Tab State
    const [newWeight, setNewWeight] = useState<string>('');

    // --- Today Tab Handlers ---
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
                setAnalysis(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAnalyze = async () => {
        if (!image) return;
        setLoading(true);
        try {
            const result = await analyzeFood(image);
            setAnalysis({ ...result, mealType: selectedMealType });
        } catch (error: any) {
            console.error("Error analyzing food:", error);
            alert(`No pude analizar la comida. Error: ${error.message || 'Desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = () => {
        if (analysis) {
            setEditData({ ...analysis });
            setIsEditing(true);
        }
    };

    const handleSaveEdit = () => {
        if (editData) {
            setAnalysis(editData);
            setIsEditing(false);
        }
    };

    const handleSaveLog = () => {
        if (analysis && onAddLog) {
            const logToSave: NutritionLog = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                date: new Date(selectedDate + 'T' + new Date().toTimeString().split(' ')[0]).toISOString(),
                mealType: selectedMealType,
                foodItems: analysis.foodItems,
                description: analysis.foodItems.join(', '),
                calories: analysis.calories,
                macros: analysis.macros,
                tips: analysis.tips || "Análisis con IA"
            };
            onAddLog(logToSave);
            alert("¡Comida registrada!");
            setAnalysis(null);
            setImage(null);
        }
    };

    const handleSaveManualLog = () => {
        if (!manualDescription || !manualCalories) {
            alert("Por favor ingresa una descripción y las calorías.");
            return;
        }

        if (onAddLog) {
            const logToSave: NutritionLog = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                date: new Date(selectedDate + 'T' + new Date().toTimeString().split(' ')[0]).toISOString(),
                mealType: selectedMealType,
                foodItems: [manualDescription],
                description: manualDescription,
                calories: parseFloat(manualCalories) || 0,
                macros: {
                    protein: parseFloat(manualMacros.protein) || 0,
                    carbs: parseFloat(manualMacros.carbs) || 0,
                    fat: parseFloat(manualMacros.fat) || 0
                },
                tips: "Registro manual"
            };
            onAddLog(logToSave);
            alert("¡Comida registrada manualmente!");
            // Reset form
            setManualDescription('');
            setManualCalories('');
            setManualMacros({ protein: '', carbs: '', fat: '' });
            setIsManualMode(false);
        }
    };


    // --- Plan Tab Handlers ---
    const handleGeneratePlan = async () => {
        setGeneratingPlan(true);
        try {
            const plan = await generateDietPlan(user, selectedGoal);
            onUpdateUser({ ...user, nutritionGoal: selectedGoal, dietPlan: plan });
        } catch (error) {
            console.error("Error generating plan:", error);
            alert("Error al generar el plan.");
        } finally {
            setGeneratingPlan(false);
        }
    };

    // --- Progress Tab Handlers ---
    const handleAddWeight = () => {
        const weight = parseFloat(newWeight);
        if (!isNaN(weight)) {
            const newLog: WeightLog = { date: new Date().toISOString(), weight };
            const updatedHistory = [...(user.weightHistory || []), newLog];
            onUpdateUser({ ...user, weight: weight, weightHistory: updatedHistory });
            setNewWeight('');
            alert("Peso registrado.");
        }
    };

    // Filter logs for today
    const todayLogs = nutritionLogs.filter(log => {
        const logDate = new Date(log.date);
        const today = new Date();
        return logDate.getDate() === today.getDate() &&
            logDate.getMonth() === today.getMonth() &&
            logDate.getFullYear() === today.getFullYear();
    });

    const totalCaloriesToday = todayLogs.reduce((sum, log) => sum + log.calories, 0);

    const getMealLabel = (type: MealType) => {
        switch (type) {
            case 'breakfast': return 'Desayuno';
            case 'lunch': return 'Almuerzo';
            case 'dinner': return 'Cena';
            case 'snack': return 'Colación';
            default: return type;
        }
    };

    return (
        <div className="flex flex-col h-full w-full animate-fade-in">
            {/* Header */}
            <div className="p-4 md:p-6 text-center shrink-0">
                <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
                    <Utensils className="text-[var(--color-primary)]" />
                    Nutricionista <span className="text-[var(--color-primary)]">AI</span>
                </h2>
            </div>

            {/* Tabs */}
            <div className="flex justify-center gap-2 px-4 mb-4 shrink-0">
                <button
                    onClick={() => setActiveTab('plan')}
                    className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${activeTab === 'plan' ? 'bg-[var(--color-primary)] text-black' : 'bg-gray-800 text-gray-400'}`}
                >
                    Objetivos
                </button>
                <button
                    onClick={() => setActiveTab('today')}
                    className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${activeTab === 'today' ? 'bg-[var(--color-primary)] text-black' : 'bg-gray-800 text-gray-400'}`}
                >
                    Registros
                </button>
                <button
                    onClick={() => setActiveTab('progress')}
                    className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${activeTab === 'progress' ? 'bg-[var(--color-primary)] text-black' : 'bg-gray-800 text-gray-400'}`}
                >
                    Progreso
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 pb-4 max-w-3xl mx-auto w-full">

                {/* TODAY (REGISTROS) TAB */}
                {activeTab === 'today' && (
                    <div className="flex flex-col gap-6">
                        {/* Daily Summary */}
                        <div className="bg-[var(--color-card)] p-4 rounded-xl border border-[var(--color-secondary)]/30 flex justify-between items-center">
                            <div>
                                <h3 className="text-[var(--color-primary)] font-bold text-sm uppercase">Hoy</h3>
                                <div className="text-2xl font-black text-[var(--color-text)]">{totalCaloriesToday} <span className="text-sm font-normal text-gray-400">kcal</span></div>
                            </div>
                            {user.dietPlan && (
                                <div className="text-right">
                                    <h3 className="text-gray-400 font-bold text-sm uppercase">Meta</h3>
                                    <div className="text-xl font-bold text-gray-300">{user.dietPlan.dailyCalories} <span className="text-sm font-normal text-gray-500">kcal</span></div>
                                </div>
                            )}
                        </div>

                        {/* Image Upload & Analysis OR Manual Entry */}
                        <div className="bg-[var(--color-card)] rounded-2xl border-2 border-dashed border-gray-700 p-6 flex flex-col items-center justify-center relative overflow-hidden min-h-[300px]">

                            {/* Toggle Mode */}
                            {!image && !analysis && (
                                <div className="absolute top-4 right-4 z-20 flex bg-gray-800 rounded-lg p-1">
                                    <button
                                        onClick={() => setIsManualMode(false)}
                                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${!isManualMode ? 'bg-[var(--color-primary)] text-black' : 'text-gray-400'}`}
                                    >
                                        Foto
                                    </button>
                                    <button
                                        onClick={() => setIsManualMode(true)}
                                        className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${isManualMode ? 'bg-[var(--color-primary)] text-black' : 'text-gray-400'}`}
                                    >
                                        Manual
                                    </button>
                                </div>
                            )}

                            {isManualMode ? (
                                <div className="w-full max-w-md space-y-4 z-10">
                                    <h3 className="text-lg font-bold text-[var(--color-text)] text-center mb-4">Registro Manual</h3>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Fecha</label>
                                        <input
                                            type="date"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                            className="w-full bg-gray-900 text-white p-3 rounded-xl border border-gray-700 focus:border-[var(--color-primary)] outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Descripción</label>
                                        <textarea
                                            value={manualDescription}
                                            onChange={(e) => setManualDescription(e.target.value)}
                                            placeholder="Ej: Ensalada de pollo con palta..."
                                            className="w-full bg-gray-900 text-white p-3 rounded-xl border border-gray-700 focus:border-[var(--color-primary)] outline-none resize-none h-24"
                                        />
                                        <button
                                            onClick={async () => {
                                                if (!manualDescription) return;
                                                setLoading(true);
                                                try {
                                                    // Dynamic import to avoid circular dependencies if any, or just direct import reuse
                                                    const { analyzeFoodText } = await import('../services/geminiService');
                                                    const result = await analyzeFoodText(manualDescription);
                                                    setManualCalories(result.calories.toString());
                                                    setManualMacros({
                                                        protein: result.macros.protein.toString(),
                                                        carbs: result.macros.carbs.toString(),
                                                        fat: result.macros.fat.toString()
                                                    });
                                                } catch (e) {
                                                    console.error(e);
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
                                            disabled={loading || !manualDescription}
                                            className="mt-2 w-full bg-[var(--color-secondary)]/20 text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/30 border border-[var(--color-secondary)]/50 font-bold py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-all"
                                        >
                                            {loading ? <Loader2 className="animate-spin" size={16} /> : <Utensils size={16} />}
                                            Analizar con IA
                                        </button>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Tipo de Comida</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {(['breakfast', 'lunch', 'snack', 'dinner'] as MealType[]).map(type => (
                                                <button
                                                    key={type}
                                                    onClick={() => setSelectedMealType(type)}
                                                    className={`p-2 rounded-lg text-xs font-bold transition-all truncate ${selectedMealType === type ? 'bg-[var(--color-primary)] text-black' : 'bg-gray-800 text-gray-400'}`}
                                                >
                                                    {getMealLabel(type)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Calorías</label>
                                            <input
                                                type="number"
                                                value={manualCalories}
                                                onChange={(e) => setManualCalories(e.target.value)}
                                                placeholder="0"
                                                className="w-full bg-gray-900 text-white p-3 rounded-xl border border-gray-700 focus:border-[var(--color-primary)] outline-none"
                                            />
                                        </div>
                                        {/* Optional Macros */}
                                        <div className="col-span-2 grid grid-cols-3 gap-2">
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Prot (g)</label>
                                                <input type="number" value={manualMacros.protein} onChange={(e) => setManualMacros({ ...manualMacros, protein: e.target.value })} className="w-full bg-gray-900 text-blue-400 p-2 rounded-lg border border-gray-800 text-center font-bold text-sm" placeholder="0" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Carbs (g)</label>
                                                <input type="number" value={manualMacros.carbs} onChange={(e) => setManualMacros({ ...manualMacros, carbs: e.target.value })} className="w-full bg-gray-900 text-green-400 p-2 rounded-lg border border-gray-800 text-center font-bold text-sm" placeholder="0" />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Grasas (g)</label>
                                                <input type="number" value={manualMacros.fat} onChange={(e) => setManualMacros({ ...manualMacros, fat: e.target.value })} className="w-full bg-gray-900 text-yellow-400 p-2 rounded-lg border border-gray-800 text-center font-bold text-sm" placeholder="0" />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={handleSaveManualLog}
                                        className="w-full bg-[var(--color-primary)] text-black font-bold py-3 rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 mt-4"
                                    >
                                        <Save size={18} /> Guardar Registro
                                    </button>
                                </div>
                            ) : (
                                image ? (
                                    <>
                                        <img src={image} alt="Plato" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                                        <div className="relative z-10 flex flex-col gap-4 w-full max-w-xs">
                                            {!analysis && !loading && (
                                                <>
                                                    <div className="bg-black/80 p-2 rounded-xl backdrop-blur-sm">
                                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1 text-center">Tipo de Comida</label>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {(['breakfast', 'lunch', 'snack', 'dinner'] as MealType[]).map(type => (
                                                                <button
                                                                    key={type}
                                                                    onClick={() => setSelectedMealType(type)}
                                                                    className={`p-2 rounded-lg text-xs font-bold transition-all ${selectedMealType === type ? 'bg-[var(--color-primary)] text-black' : 'bg-gray-700 text-gray-300'}`}
                                                                >
                                                                    {getMealLabel(type)}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <button onClick={handleAnalyze} className="bg-[var(--color-primary)] text-black font-bold py-3 px-8 rounded-full shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2 w-full">
                                                        <Utensils size={20} /> Analizar Plato
                                                    </button>
                                                </>
                                            )}
                                            <button onClick={() => setImage(null)} className="bg-black/50 text-white text-sm py-2 px-4 rounded-full backdrop-blur-md hover:bg-black/70 w-full">Cambiar Foto</button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center space-y-4">
                                        <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Camera size={40} className="text-[var(--color-primary)]" />
                                        </div>
                                        <h3 className="text-lg font-bold text-[var(--color-text)]">Registrar Comida</h3>
                                        <button onClick={() => fileInputRef.current?.click()} className="bg-[var(--color-secondary)] text-white font-bold py-2 px-6 rounded-xl hover:brightness-110 transition-all flex items-center gap-2 mx-auto">
                                            <Upload size={18} /> Subir Foto
                                        </button>
                                    </div>
                                )
                            )}
                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                        </div>

                        {loading && (
                            <div className="text-center py-8 animate-pulse">
                                <Loader2 size={40} className="animate-spin text-[var(--color-primary)] mx-auto mb-4" />
                                <p className="text-lg font-medium text-[var(--color-text)]">Analizando ingredientes...</p>
                            </div>
                        )}

                        {analysis && (
                            <div className="bg-[var(--color-card)] p-6 rounded-2xl border border-[var(--color-secondary)]/50 animate-fade-in space-y-4">

                                {/* Date Selection */}
                                <div className="flex justify-between items-center bg-gray-900/30 p-3 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} className="text-[var(--color-primary)]" />
                                        <span className="text-xs font-bold text-gray-400 uppercase">Fecha del registro</span>
                                    </div>
                                    <input
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="bg-gray-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-700 outline-none focus:border-[var(--color-primary)]"
                                    />
                                </div>

                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-[var(--color-text)]">Análisis Nutricional</h3>
                                    {isEditing ? (
                                        <div className="flex items-center gap-2">
                                            <input type="number" value={editData?.calories} onChange={(e) => setEditData(prev => prev ? { ...prev, calories: Number(e.target.value) } : null)} className="bg-gray-800 text-white px-2 py-1 rounded w-20 text-right font-bold" />
                                            <span className="text-xs font-bold text-[var(--color-primary)]">kcal</span>
                                        </div>
                                    ) : (
                                        <div className="bg-[var(--color-primary)]/20 text-[var(--color-primary)] px-3 py-1 rounded-full text-xs font-bold">~{analysis.calories} kcal</div>
                                    )}
                                </div>

                                {/* Macros Grid */}
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <div className="bg-gray-900/50 p-3 rounded-xl text-center">
                                        <div className="text-xs text-[var(--color-text)] opacity-70 uppercase font-bold mb-1">Prot</div>
                                        {isEditing ? <input type="number" value={editData?.macros.protein} onChange={(e) => setEditData(prev => prev ? { ...prev, macros: { ...prev.macros, protein: Number(e.target.value) } } : null)} className="bg-gray-800 text-blue-400 w-full text-center font-black rounded" /> : <div className="text-lg font-black text-blue-400">{analysis.macros.protein}g</div>}
                                    </div>
                                    <div className="bg-gray-900/50 p-3 rounded-xl text-center">
                                        <div className="text-xs text-[var(--color-text)] opacity-70 uppercase font-bold mb-1">Carbs</div>
                                        {isEditing ? <input type="number" value={editData?.macros.carbs} onChange={(e) => setEditData(prev => prev ? { ...prev, macros: { ...prev.macros, carbs: Number(e.target.value) } } : null)} className="bg-gray-800 text-green-400 w-full text-center font-black rounded" /> : <div className="text-lg font-black text-green-400">{analysis.macros.carbs}g</div>}
                                    </div>
                                    <div className="bg-gray-900/50 p-3 rounded-xl text-center">
                                        <div className="text-xs text-[var(--color-text)] opacity-70 uppercase font-bold mb-1">Grasas</div>
                                        {isEditing ? <input type="number" value={editData?.macros.fat} onChange={(e) => setEditData(prev => prev ? { ...prev, macros: { ...prev.macros, fat: Number(e.target.value) } } : null)} className="bg-gray-800 text-yellow-400 w-full text-center font-black rounded" /> : <div className="text-lg font-black text-yellow-400">{analysis.macros.fat}g</div>}
                                    </div>
                                </div>
                                {/* Food Items */}
                                <div className="mb-6">
                                    <h4 className="text-sm font-bold text-[var(--color-text)] opacity-80 mb-3 uppercase">Alimentos</h4>
                                    {isEditing ? (
                                        <textarea value={editData?.foodItems.join(', ')} onChange={(e) => setEditData(prev => prev ? { ...prev, foodItems: e.target.value.split(',').map(s => s.trim()) } : null)} className="w-full bg-gray-800 text-gray-300 p-2 rounded-lg text-sm" rows={3} />
                                    ) : (
                                        <ul className="space-y-2">
                                            {analysis.foodItems.map((item, idx) => (
                                                <li key={idx} className="flex items-center gap-2 text-sm text-[var(--color-text)] opacity-80"><Check size={16} className="text-[var(--color-primary)]" />{item}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    {isEditing ? (
                                        <button onClick={handleSaveEdit} className="flex-1 bg-green-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"><Save size={20} /> Guardar</button>
                                    ) : (
                                        <>
                                            <button onClick={handleEdit} className="bg-gray-800 text-white font-bold p-4 rounded-xl"><Pencil size={20} /></button>
                                            <button onClick={handleSaveLog} className="flex-1 bg-[var(--color-primary)] text-black font-bold py-4 rounded-xl">Registrar Comida</button>
                                        </>
                                    )}
                                </div>
                            </div >
                        )}

                        {/* Daily History List */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-[var(--color-text)] flex items-center gap-2">
                                <Clock size={20} className="text-[var(--color-primary)]" />
                                Historial de Hoy
                            </h3>
                            {todayLogs.length > 0 ? (
                                todayLogs.map((log) => (
                                    <div key={log.id} className="bg-[var(--color-card)] p-4 rounded-xl border border-gray-800 flex justify-between items-center group">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-[var(--color-primary)] uppercase bg-[var(--color-primary)]/10 px-2 py-0.5 rounded">{getMealLabel(log.mealType)}</span>
                                                <span className="text-xs text-gray-500">{new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <p className="text-sm text-[var(--color-text)] font-medium line-clamp-1">{log.foodItems.join(', ')}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <div className="font-bold text-[var(--color-text)]">{log.calories}</div>
                                                <div className="text-xs text-gray-500">kcal</div>
                                            </div>
                                            {onDeleteLog && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDeleteLog(log.id);
                                                    }}
                                                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors relative z-10"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500 bg-gray-900/30 rounded-xl border border-dashed border-gray-800">
                                    <p>No has registrado comidas hoy.</p>
                                </div>
                            )}
                        </div>
                    </div >
                )}

                {/* PLAN TAB */}
                {
                    activeTab === 'plan' && (
                        <div className="flex flex-col gap-6">
                            <div className="bg-[var(--color-card)] p-6 rounded-2xl border border-[var(--color-secondary)]">
                                <h3 className="text-xl font-bold text-[var(--color-text)] mb-4 flex items-center gap-2"><Target className="text-[var(--color-primary)]" /> Tu Objetivo</h3>
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    {(['lose_weight', 'gain_muscle', 'maintain', 'performance'] as NutritionGoal[]).map((goal) => (
                                        <button
                                            key={goal}
                                            onClick={() => setSelectedGoal(goal)}
                                            className={`p-3 rounded-xl text-sm font-bold border-2 transition-all ${selectedGoal === goal ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]' : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}
                                        >
                                            {goal === 'lose_weight' && 'Perder Peso'}
                                            {goal === 'gain_muscle' && 'Ganar Músculo'}
                                            {goal === 'maintain' && 'Mantener'}
                                            {goal === 'performance' && 'Rendimiento'}
                                        </button>
                                    ))}
                                </div>
                                <button
                                    onClick={handleGeneratePlan}
                                    disabled={generatingPlan}
                                    className="w-full bg-[var(--color-primary)] text-black font-bold py-4 rounded-xl hover:brightness-110 transition-all shadow-lg flex items-center justify-center gap-2"
                                >
                                    {generatingPlan ? <Loader2 className="animate-spin" /> : <Target size={20} />}
                                    {user.dietPlan ? 'Regenerar Plan' : 'Generar Plan de Dieta'}
                                </button>
                            </div>

                            {user.dietPlan && (
                                <div className="bg-[var(--color-card)] p-6 rounded-2xl border border-[var(--color-secondary)] animate-slide-up">
                                    <h3 className="text-xl font-bold text-[var(--color-text)] mb-4">Tu Plan Diario</h3>
                                    <div className="flex justify-between mb-6 bg-black/30 p-4 rounded-xl">
                                        <div className="text-center">
                                            <div className="text-2xl font-black text-[var(--color-primary)]">{user.dietPlan.dailyCalories}</div>
                                            <div className="text-xs text-gray-400">Kcal</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xl font-bold text-blue-400">{user.dietPlan.macros.protein}g</div>
                                            <div className="text-xs text-gray-400">Prot</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xl font-bold text-green-400">{user.dietPlan.macros.carbs}g</div>
                                            <div className="text-xs text-gray-400">Carbs</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xl font-bold text-yellow-400">{user.dietPlan.macros.fat}g</div>
                                            <div className="text-xs text-gray-400">Grasas</div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {user.dietPlan.meals.map((meal, idx) => (
                                            <div key={idx} className="bg-gray-900/50 p-4 rounded-xl">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h4 className="font-bold text-[var(--color-text)]">{meal.name}</h4>
                                                    <span className="text-xs font-bold text-[var(--color-primary)]">{meal.calories} kcal</span>
                                                </div>
                                                <p className="text-sm text-gray-400">{meal.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                }

                {/* PROGRESS TAB */}
                {
                    activeTab === 'progress' && (
                        <div className="flex flex-col gap-6">
                            <div className="bg-[var(--color-card)] p-6 rounded-2xl border border-[var(--color-secondary)]">
                                <h3 className="text-xl font-bold text-[var(--color-text)] mb-4 flex items-center gap-2"><TrendingUp className="text-[var(--color-primary)]" /> Control de Peso</h3>
                                <div className="flex gap-3 mb-6">
                                    <input
                                        type="number"
                                        value={newWeight}
                                        onChange={(e) => setNewWeight(e.target.value)}
                                        placeholder="Peso actual (kg)"
                                        className="flex-1 bg-gray-900 text-white p-4 rounded-xl border border-gray-700 focus:border-[var(--color-primary)] outline-none"
                                    />
                                    <button onClick={handleAddWeight} className="bg-[var(--color-primary)] text-black font-bold px-6 rounded-xl">Registrar</button>
                                </div>

                                <div className="space-y-2">
                                    <h4 className="text-sm font-bold text-gray-400 uppercase mb-2">Historial</h4>
                                    {user.weightHistory && user.weightHistory.length > 0 ? (
                                        [...user.weightHistory].reverse().map((log, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-gray-900/30 p-3 rounded-lg">
                                                <div className="flex items-center gap-2 text-gray-400">
                                                    <Calendar size={16} />
                                                    <span className="text-sm">{new Date(log.date).toLocaleDateString()}</span>
                                                </div>
                                                <span className="font-bold text-[var(--color-text)]">{log.weight} kg</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-center py-4">No hay registros aún.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                }
            </div >
        </div >
    );
};

export default Nutrition;
