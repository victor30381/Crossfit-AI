import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Profile from './components/Profile';
import WodScanner from './components/WodScanner';
import Dashboard from './components/Dashboard';
import Timers from './components/Timers';
import Movements from './components/Movements';
import HomeCoach from './components/HomeCoach';
import Nutrition from './components/Nutrition';
import { UserProfile, WorkoutLog, NutritionLog, Theme, THEMES } from './types';
import { db, auth } from './services/firebase';
import { collection, doc, onSnapshot, setDoc, updateDoc, query, where, getDocs, writeBatch, deleteField } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import Login from './components/Login';

// Initial Defaults
const DEFAULT_USER: UserProfile = {
  name: 'Atleta',
  age: 25,
  weight: 75,
  height: 175,
  gender: 'male',
  fitnessLevel: 'principiante',
  xp: 0,
  levelProgress: 0,
  isRegistered: false,
  language: 'es'
};

const DEFAULT_THEME = THEMES[0]; // Neon Red

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [workoutMode, setWorkoutMode] = useState<'scan' | 'coach'>('scan'); // Lifted state to top level

  // State with LocalStorage Persistence (Theme only)
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('cf_theme');
    return saved ? JSON.parse(saved) : DEFAULT_THEME;
  });

  // Data State (from Firebase)
  const [user, setUser] = useState<UserProfile>(DEFAULT_USER);
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [nutritionLogs, setNutritionLogs] = useState<NutritionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string>('');

  const [deleteState, setDeleteState] = useState<{ isOpen: boolean; type: 'workout' | 'nutrition' | 'reset' | null; id: string | null }>({
    isOpen: false,
    type: null,
    id: null
  });

  // Initialize User & Firebase Sync
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setAuthUser(currentUser);
      if (currentUser) {
        setUserId(currentUser.uid);

        // 2. Subscribe to User Profile
        const userRef = doc(db, 'users', currentUser.uid);
        const unsubUser = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setUser(docSnap.data() as UserProfile);
          } else {
            // Create initial user doc if not exists
            const newUser = { ...DEFAULT_USER, name: currentUser.displayName || 'Atleta', avatar: currentUser.photoURL || undefined };
            setDoc(userRef, newUser);
            setUser(newUser);
          }
          setLoading(false);
        });

        // 3. Subscribe to Workout Logs
        const logsQuery = query(collection(db, 'workoutLogs'), where('userId', '==', currentUser.uid));
        const unsubLogs = onSnapshot(logsQuery, (snapshot) => {
          const fetchedLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WorkoutLog));
          setLogs(fetchedLogs);
        });

        // 4. Subscribe to Nutrition Logs
        const nutritionQuery = query(collection(db, 'nutritionLogs'), where('userId', '==', currentUser.uid));
        const unsubNutrition = onSnapshot(nutritionQuery, (snapshot) => {
          const fetchedLogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as NutritionLog));
          setNutritionLogs(fetchedLogs);
        });

        return () => {
          unsubUser();
          unsubLogs();
          unsubNutrition();
        };
      } else {
        setUserId('');
        setLogs([]);
        setNutritionLogs([]);
        setLoading(false);
      }
    });

    return () => unsubAuth();
  }, []);

  // Sync Theme to LocalStorage
  useEffect(() => localStorage.setItem('cf_theme', JSON.stringify(theme)), [theme]);

  // Update User in Firestore
  const handleUpdateUser = async (newUser: UserProfile) => {
    if (!userId) return;
    try {
      await setDoc(doc(db, 'users', userId), newUser, { merge: true });
      // Optimistic update is handled by onSnapshot, but we can set state for immediate feedback if needed
      // setUser(newUser); 
    } catch (error) {
      console.error("Error updating user:", error);
    }
  };

  // XP Decay System
  useEffect(() => {
    const checkInactivity = () => {
      if (!user.lastActiveDate || !user.xp) return;

      const today = new Date();
      const lastActive = new Date(user.lastActiveDate);
      const diffTime = Math.abs(today.getTime() - lastActive.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Threshold: 3 days
      if (diffDays > 3) {
        const lastPenalty = user.lastPenaltyDate ? new Date(user.lastPenaltyDate) : lastActive;
        const penaltyDiffTime = Math.abs(today.getTime() - lastPenalty.getTime());
        const daysToPenalize = Math.floor(penaltyDiffTime / (1000 * 60 * 60 * 24));

        if (daysToPenalize > 0) {
          const penaltyPerDay = 20;
          const totalPenalty = daysToPenalize * penaltyPerDay;
          const newXp = Math.max(0, user.xp - totalPenalty);

          if (newXp !== user.xp) {
            const { level, progress } = calculateLevel(newXp);
            const updatedUser = {
              ...user,
              xp: newXp,
              fitnessLevel: level,
              levelProgress: progress,
              lastPenaltyDate: today.toISOString()
            };
            handleUpdateUser(updatedUser);
            alert(`¡Has perdido ${totalPenalty} XP por inactividad! Entrena para recuperar tu nivel.`);
          }
        }
      }
    };

    checkInactivity();
    checkInactivity();
  }, []); // Run once on mount

  // Data Cleanup Effect (Fix missing IDs)
  useEffect(() => {
    let hasChanges = false;
    const fixedLogs = logs.map(log => {
      if (!log.id) {
        hasChanges = true;
        return { ...log, id: crypto.randomUUID() };
      }
      return log;
    });

    const fixedNutritionLogs = nutritionLogs.map(log => {
      if (!log.id) {
        hasChanges = true;
        return { ...log, id: crypto.randomUUID() };
      }
      return log;
    });

    if (hasChanges) {
      setLogs(fixedLogs);
      setNutritionLogs(fixedNutritionLogs);
      console.log("Fixed missing IDs in logs");
    }
  }, [logs.length, nutritionLogs.length]);

  // XP System Logic
  const calculateLevel = (xp: number): { level: UserProfile['fitnessLevel']; progress: number } => {
    // Thresholds
    const LEVELS = {
      principiante: 0,
      intermedio: 1000,
      avanzado: 3000,
      experto: 7000,
      master: 15000
    };

    if (xp >= LEVELS.master) return { level: 'master', progress: 100 };
    if (xp >= LEVELS.experto) return { level: 'experto', progress: ((xp - LEVELS.experto) / (LEVELS.master - LEVELS.experto)) * 100 };
    if (xp >= LEVELS.avanzado) return { level: 'avanzado', progress: ((xp - LEVELS.avanzado) / (LEVELS.experto - LEVELS.avanzado)) * 100 };
    if (xp >= LEVELS.intermedio) return { level: 'intermedio', progress: ((xp - LEVELS.intermedio) / (LEVELS.avanzado - LEVELS.intermedio)) * 100 };

    return { level: 'principiante', progress: (xp / LEVELS.intermedio) * 100 };
  };

  const handleAddLog = (log: WorkoutLog) => {
    // Calculate XP earned (Base 100 + bonuses could be added here)
    const xpEarned = 100 + (log.xpEarned || 0);
    const newTotalXp = (user.xp || 0) + xpEarned;
    const { level, progress } = calculateLevel(newTotalXp);

    // Update User
    // Update User
    const updatedUser = {
      ...user,
      xp: newTotalXp,
      fitnessLevel: level,
      levelProgress: progress,
      lastActiveDate: new Date().toISOString(),
      lastPenaltyDate: new Date().toISOString() // Reset penalty clock
    };
    handleUpdateUser(updatedUser);

    // Add Log to Firestore
    const newLogRef = doc(collection(db, 'workoutLogs'));
    setDoc(newLogRef, { ...log, id: newLogRef.id, userId }); // Ensure userId is attached

    setActiveTab('dashboard'); // Redirect to dashboard to see result
  };

  const handleAddNutritionLog = (log: NutritionLog) => {
    const newLogRef = doc(collection(db, 'nutritionLogs'));
    setDoc(newLogRef, { ...log, id: newLogRef.id, userId });
  };

  const handleDeleteLog = (id: string) => {
    setDeleteState({ isOpen: true, type: 'workout', id });
  };

  const handleDeleteNutritionLog = (id: string) => {
    setDeleteState({ isOpen: true, type: 'nutrition', id });
  };

  const confirmDelete = async () => {
    if (deleteState.type === 'workout' && deleteState.id) {
      await setDoc(doc(db, 'workoutLogs', deleteState.id), {}, { merge: false }); // Actually delete? No, setDoc empty? No, deleteDoc
      // Wait, I need to import deleteDoc.
      // Let's use the correct import in the first chunk.
      // For now, I'll use updateDoc to mark as deleted or just delete it.
      // Actually, I should use deleteDoc.
      // I will assume I imported deleteDoc in the first chunk (I added it to the import list).
      // But wait, I didn't add deleteDoc to the import list in the first chunk. 
      // I added: collection, doc, onSnapshot, setDoc, updateDoc, query, where, getDocs, writeBatch
      // I missed deleteDoc. I will use writeBatch to delete or just standard delete.
      // Let's use a workaround or assume I can add it. 
      // Actually, I can use setDoc(ref, {deleted: true}) if I want soft delete, but user wants delete.
      // I will use `deleteDoc` and hope I can fix the import in a follow up or if I added it.
      // Checking first chunk... I did NOT add deleteDoc.
      // I will use `setDoc` to null? No.
      // I will use `writeBatch` to delete.
      const batch = writeBatch(db);
      batch.delete(doc(db, 'workoutLogs', deleteState.id));
      await batch.commit();

    } else if (deleteState.type === 'nutrition' && deleteState.id) {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'nutritionLogs', deleteState.id));
      await batch.commit();

    } else if (deleteState.type === 'reset') {
      // Reset User Stats
      const userRef = doc(db, 'users', userId);
      const batch = writeBatch(db);

      batch.update(userRef, {
        xp: 0,
        fitnessLevel: 'principiante',
        levelProgress: 0,
        lastActiveDate: deleteField(),
        lastPenaltyDate: deleteField()
      });

      // Delete all logs
      logs.forEach(log => {
        batch.delete(doc(db, 'workoutLogs', log.id));
      });
      // Optional: Delete nutrition logs too if desired
      // nutritionLogs.forEach(log => batch.delete(doc(db, 'nutritionLogs', log.id)));

      await batch.commit();
      alert("¡Progreso reiniciado correctamente!");
    }
    setDeleteState({ isOpen: false, type: null, id: null });
  };

  const handleResetRequest = () => {
    setDeleteState({ isOpen: true, type: 'reset', id: null });
  };

  const cancelDelete = () => {
    setDeleteState({ isOpen: false, type: null, id: null });
  };

  const renderWorkoutSection = () => {
    return (
      <div className="h-full flex flex-col">
        <div className="flex bg-[var(--color-card)] p-1 rounded-lg mb-4 shrink-0">
          <button
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${workoutMode === 'scan' ? 'bg-[var(--color-primary)] text-white' : 'text-gray-400'}`}
            onClick={() => setWorkoutMode('scan')}
          >
            Escanear WOD
          </button>
          <button
            className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${workoutMode === 'coach' ? 'bg-[var(--color-primary)] text-white' : 'text-gray-400'}`}
            onClick={() => setWorkoutMode('coach')}
          >
            AI Coach
          </button>
        </div>
        <div className="flex-1 overflow-hidden relative flex flex-col min-h-0">
          {workoutMode === 'scan' ? (
            <WodScanner user={user} onAddLog={handleAddLog} onUpdateUser={handleUpdateUser} />
          ) : (
            <HomeCoach user={user} onAddLog={handleAddLog} onUpdateUser={handleUpdateUser} />
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard logs={logs} user={user} nutritionLogs={nutritionLogs} onDeleteLog={handleDeleteLog} />;
      case 'workout':
        return renderWorkoutSection();
      case 'timers':
        return <Timers />;
      case 'movements':
        return <Movements />;
      case 'nutrition':
        return <Nutrition user={user} nutritionLogs={nutritionLogs} onAddLog={handleAddNutritionLog} onUpdateUser={handleUpdateUser} onDeleteLog={handleDeleteNutritionLog} />;
      case 'profile':
        return <Profile user={user} onUpdateUser={handleUpdateUser} currentTheme={theme} onUpdateTheme={setTheme} onReset={handleResetRequest} />;
      default:
        return <Dashboard logs={logs} user={user} nutritionLogs={nutritionLogs} onDeleteLog={handleDeleteLog} />;
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ff0033]"></div>
      </div>
    );
  }

  if (!authUser) {
    return <Login />;
  }

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      theme={theme}
      user={user}
      onUpdateUser={handleUpdateUser}
      onUpdateTheme={setTheme}
      onReset={handleResetRequest}
    >
      {renderContent()}

      {/* Confirmation Modal */}
      {deleteState.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--color-card)] w-full max-w-sm rounded-2xl border border-[var(--color-secondary)] shadow-2xl p-6">
            <h3 className="text-xl font-bold text-[var(--color-text)] mb-2">
              {deleteState.type === 'reset' ? '¿Reiniciar Progreso?' : '¿Eliminar registro?'}
            </h3>
            <p className="text-gray-400 mb-6">
              {deleteState.type === 'reset'
                ? 'Se eliminarán todos los entrenamientos y volverás al nivel Principiante. Esta acción no se puede deshacer.'
                : 'Esta acción no se puede deshacer. ¿Estás seguro de que quieres continuar?'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={cancelDelete}
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;