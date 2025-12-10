import React, { useState, useRef } from 'react';
import { UserProfile, THEMES, Theme } from '../types';
import { Save, User as UserIcon, Menu, X, Globe, Palette, Camera, Sun, Moon, Edit2, Trash2, LogOut, ChevronDown, ChevronUp } from 'lucide-react';
import { auth } from '../services/firebase';



interface ProfileProps {
  user: UserProfile;
  onUpdateUser: (u: UserProfile) => void;
  currentTheme: Theme;
  onUpdateTheme: (t: Theme) => void;
  onReset: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser, currentTheme, onUpdateTheme, onReset }) => {
  const [formData, setFormData] = useState<UserProfile>(user);
  const [saved, setSaved] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(!user.isRegistered); // Edit if not registered
  const fileInputRef = useRef<HTMLInputElement>(null);


  // Determine if current mode is light based on background color
  const isLightMode = currentTheme.colors.bg === '#ffffff';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'age' || name === 'weight' || name === 'height'
        ? Number(value)
        : value
    }));
    setSaved(false);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFormData(prev => ({ ...prev, avatar: base64String }));
        onUpdateUser({ ...user, avatar: base64String }); // Auto-save avatar
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser = { ...formData, isRegistered: true };
    onUpdateUser(updatedUser);
    setFormData(updatedUser);
    setSaved(true);
    setIsEditing(false); // Exit edit mode after save
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleLanguage = () => {
    const newLang = formData.language === 'es' ? 'en' : 'es';
    const updatedUser = { ...formData, language: newLang };
    setFormData(updatedUser);
    onUpdateUser(updatedUser);
  };

  const toggleMode = () => {
    if (isLightMode) {
      // Switch to Dark: Find the original theme from THEMES based on primary color or ID
      // Since we modify ID for light mode (e.g. 'neon-red-light'), we can strip '-light'
      const originalId = currentTheme.id.replace('-light', '');
      const originalTheme = THEMES.find(t => t.id === originalId) || THEMES[0];
      onUpdateTheme(originalTheme);
    } else {
      // Switch to Light: Create a light version of the current theme
      const lightTheme: Theme = {
        ...currentTheme,
        id: `${currentTheme.id}-light`,
        colors: {
          ...currentTheme.colors,
          bg: '#ffffff',
          card: '#f3f4f6',
          text: '#111827'
        }
      };
      onUpdateTheme(lightTheme);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      // App.tsx handles the redirect via onAuthStateChanged
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };


  return (
    <div className="relative min-h-full animate-fade-in">

      {/* Header with Avatar and Menu Button */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
            <div className="w-20 h-20 rounded-full bg-[var(--color-card)] flex items-center justify-center border-2 border-[var(--color-primary)] overflow-hidden shadow-[0_0_15px_var(--color-primary)] transition-all group-hover:scale-105">
              {formData.avatar ? (
                <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <UserIcon size={40} className="text-[var(--color-text)] opacity-80" />
              )}
            </div>
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={24} className="text-white" />
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-text)]">{formData.name}</h2>
            <p className="text-sm text-[var(--color-primary)] font-medium uppercase tracking-wider">
              Nivel {formData.fitnessLevel}
            </p>
            {/* XP Progress Bar */}
            <div className="mt-2 w-48">
              <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                <span>XP: {formData.xp || 0}</span>
                <span>{Math.floor(formData.levelProgress || 0)}%</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--color-primary)] transition-all duration-500"
                  style={{ width: `${formData.levelProgress || 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {/* Edit Button (Only if registered) */}
          {user.isRegistered && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="p-3 bg-[var(--color-card)] rounded-full hover:bg-[var(--color-primary)]/20 transition-colors border border-gray-800/20"
            >
              <Edit2 size={24} className="text-[var(--color-text)]" />
            </button>
          )}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-3 bg-[var(--color-card)] rounded-full hover:bg-[var(--color-primary)]/20 transition-colors border border-gray-800/20"
          >
            <Menu size={24} className="text-[var(--color-text)]" />
          </button>
        </div>
      </div>

      {/* Main Form */}
      <div className="bg-[var(--color-card)] p-6 rounded-3xl shadow-2xl border border-[var(--color-secondary)]/30 backdrop-blur-sm">
        <h3 className="text-xl font-bold mb-6 text-[var(--color-text)] flex items-center gap-2">
          <UserIcon size={20} className="text-[var(--color-primary)]" />
          Datos Biométricos
        </h3>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Nombre</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={!isEditing}
              className={`w-full bg-[var(--color-bg)] text-[var(--color-text)] rounded-xl p-4 border border-gray-800/20 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">País (Para dietas locales)</label>
            <input
              type="text"
              name="country"
              value={formData.country || ''}
              onChange={handleChange}
              placeholder="Ej: Argentina, México, España"
              disabled={!isEditing}
              className={`w-full bg-[var(--color-bg)] text-[var(--color-text)] rounded-xl p-4 border border-gray-800/20 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Edad</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full bg-[var(--color-bg)] text-[var(--color-text)] rounded-xl p-4 border border-gray-800/20 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Sexo</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full bg-[var(--color-bg)] text-[var(--color-text)] rounded-xl p-4 border border-gray-800/20 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all appearance-none ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <option value="male">Hombre</option>
                <option value="female">Mujer</option>
                <option value="other">Otro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Peso (kg)</label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full bg-[var(--color-bg)] text-[var(--color-text)] rounded-xl p-4 border border-gray-800/20 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Altura (cm)</label>
              <input
                type="number"
                name="height"
                value={formData.height}
                onChange={handleChange}
                disabled={!isEditing}
                className={`w-full bg-[var(--color-bg)] text-[var(--color-text)] rounded-xl p-4 border border-gray-800/20 focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] outline-none transition-all ${!isEditing ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Nivel (Auto)</label>
            <div className="w-full bg-[var(--color-bg)]/50 rounded-xl p-4 border border-gray-800/20 text-gray-400 capitalize cursor-not-allowed flex justify-between items-center">
              <span>
                {formData.fitnessLevel === 'rx' ? 'RX' :
                  formData.fitnessLevel === 'beginner' ? 'Principiante (Scaled)' :
                    formData.fitnessLevel === 'intermediate' ? 'Intermedio' :
                      formData.fitnessLevel === 'elite' ? 'Elite' : formData.fitnessLevel}
              </span>
              <span className="text-xs bg-gray-800/50 px-2 py-1 rounded text-gray-500">Solo Lectura</span>
            </div>
          </div>

          {isEditing && (
            <button
              type="submit"
              className="w-full mt-6 bg-[var(--color-primary)] hover:opacity-90 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-[0_4px_20px_-5px_var(--color-primary)]"
            >
              <Save size={20} />
              {saved ? 'Guardado Exitosamente' : (user.isRegistered ? 'Guardar Cambios' : 'Registrar Perfil')}
            </button>
          )}
        </form>
      </div>

      {/* Settings Drawer (Hamburger Menu) */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsMenuOpen(false)}
          ></div>

          {/* Drawer Content */}
          <div className="relative w-80 h-full bg-[#0a0a0a] border-l border-gray-800 p-6 shadow-2xl animate-slide-left overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-white">Configuración</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400"
              >
                <X size={24} />
              </button>
            </div>

            {/* Light/Dark Mode Toggle */}
            <div className="mb-8">
              <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 flex items-center gap-2">
                {isLightMode ? <Sun size={16} /> : <Moon size={16} />} Modo
              </h3>
              <button
                onClick={toggleMode}
                className="w-full flex items-center justify-between p-4 bg-[var(--color-card)] rounded-xl border border-gray-800 hover:border-[var(--color-primary)] transition-all group"
              >
                <span className="text-[var(--color-text)] font-medium">
                  {isLightMode ? 'Modo Claro' : 'Modo Oscuro'}
                </span>
                <span className={`text-xs font-bold px-2 py-1 rounded transition-colors ${isLightMode ? 'bg-yellow-500/20 text-yellow-500' : 'bg-blue-500/20 text-blue-500'}`}>
                  {isLightMode ? 'ACTIVADO' : 'ACTIVADO'}
                </span>
              </button>
            </div>

            {/* Language Selector */}
            <div className="mb-8">
              <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 flex items-center gap-2">
                <Globe size={16} /> Idioma
              </h3>
              <button
                onClick={toggleLanguage}
                className="w-full flex items-center justify-between p-4 bg-[var(--color-card)] rounded-xl border border-gray-800 hover:border-[var(--color-primary)] transition-all group"
              >
                <span className="text-[var(--color-text)] font-medium">
                  {formData.language === 'en' ? 'English' : 'Español'}
                </span>
                <span className="text-[var(--color-primary)] text-xs font-bold bg-[var(--color-primary)]/10 px-2 py-1 rounded group-hover:bg-[var(--color-primary)] group-hover:text-white transition-colors">
                  CAMBIAR
                </span>
              </button>
            </div>

            {/* Theme Selector */}
            <div>
              <button
                onClick={() => setIsThemeSelectorOpen(!isThemeSelectorOpen)}
                className="w-full flex items-center justify-between text-sm font-bold text-gray-500 uppercase mb-4 hover:text-[var(--color-primary)] transition-colors"
              >
                <span className="flex items-center gap-2"><Palette size={16} /> Tema Neon</span>
                {isThemeSelectorOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {isThemeSelectorOpen && (
                <div className="grid grid-cols-2 gap-3 animate-fade-in">
                  {THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => {
                        // If in light mode, apply light version of selected theme
                        if (isLightMode) {
                          const lightTheme = {
                            ...theme,
                            id: `${theme.id}-light`,
                            colors: { ...theme.colors, bg: '#ffffff', card: '#f3f4f6', text: '#111827' }
                          };
                          onUpdateTheme(lightTheme);
                        } else {
                          onUpdateTheme(theme);
                        }
                      }}
                      className={`
                        relative p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2
                        ${currentTheme.id.includes(theme.id)
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                          : 'border-gray-800 bg-[var(--color-card)] hover:border-gray-600'}
                      `}
                    >
                      <div
                        className="w-8 h-8 rounded-full shadow-[0_0_10px]"
                        style={{
                          backgroundColor: theme.colors.primary,
                          boxShadow: `0 0 10px ${theme.colors.primary}`
                        }}
                      ></div>
                      <span className={`text-xs font-medium ${currentTheme.id.includes(theme.id) ? 'text-[var(--color-text)]' : 'text-gray-400'}`}>
                        {theme.name.replace('Neon ', '')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>


            {/* Reset Progress Section */}
            <div className="mt-8 pt-8 border-t border-gray-800 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-red-500 uppercase mb-4 flex items-center gap-2">
                  <Trash2 size={16} /> Zona de Peligro
                </h3>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onReset();
                  }}
                  className="w-full flex items-center justify-between p-4 bg-red-500/10 rounded-xl border border-red-500/30 hover:bg-red-500 hover:text-white transition-all group"
                >
                  <span className="text-red-500 font-medium group-hover:text-white">
                    Reiniciar Progreso
                  </span>
                  <span className="text-xs font-bold px-2 py-1 rounded bg-red-500/20 text-red-500 group-hover:bg-white/20 group-hover:text-white transition-colors">
                    RESET
                  </span>
                </button>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:bg-gray-800 hover:text-white transition-all group"
              >
                <span className="text-gray-400 font-medium group-hover:text-white flex items-center gap-2">
                  <LogOut size={18} /> Cerrar Sesión
                </span>
              </button>
            </div>


            <div className="mt-12 pt-6 border-t border-gray-800 text-center">
              <p className="text-xs text-gray-600">CrossFit App v1.0</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
