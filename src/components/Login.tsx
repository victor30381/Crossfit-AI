import React, { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../services/firebase';
import { Activity, Dumbbell } from 'lucide-react';

const Login: React.FC = () => {
    const [error, setError] = useState<string | null>(null);

    const handleGoogleLogin = async () => {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (err: any) {
            console.error("Login error:", err);
            setError("Error: " + (err.message || "No se pudo iniciar sesión."));
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#ff0033] rounded-full blur-[150px] opacity-20 animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#00ffff] rounded-full blur-[150px] opacity-20 animate-pulse delay-1000"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full">
                <div className="mb-8 flex items-center gap-3">
                    <Activity size={60} className="text-[#ff0033]" />
                    <h1 className="text-5xl font-black tracking-tighter">
                        Crossfit-<span className="text-[#ff0033]">AI</span>
                    </h1>
                </div>

                <p className="text-gray-400 mb-12 text-lg">
                    Tu entrenador personal inteligente. Analiza tus WODs, controla tu nutrición y supera tus límites.
                </p>

                <button
                    onClick={handleGoogleLogin}
                    className="w-full bg-white text-black font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
                    <span>Continuar con Google</span>
                </button>

                {error && (
                    <p className="mt-4 text-red-500 text-sm font-bold bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                        {error}
                    </p>
                )}

                <div className="mt-16 grid grid-cols-3 gap-4 text-center text-xs text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                        <Dumbbell size={24} className="text-[#ff0033]" />
                        <span>WOD Analysis</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <Activity size={24} className="text-[#00ffff]" />
                        <span>Progress Tracking</span>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <div className="text-2xl">🥗</div>
                        <span>AI Nutritionist</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
