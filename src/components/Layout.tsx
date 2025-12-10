import React from 'react';
import { Theme, UserProfile } from '../types';
import { Menu, Activity, Calendar, Camera, Timer, User, Home, Utensils, X, Sun, Moon, Globe, Palette, ChevronUp, ChevronDown, Trash2, LogOut } from 'lucide-react';
import { auth } from '../services/firebase';
import { THEMES } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: Theme;
  user?: UserProfile;
  onUpdateUser?: (u: UserProfile) => void;
  onUpdateTheme?: (t: Theme) => void;
  onReset?: () => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
  theme,
  user,
  onUpdateUser,
  onUpdateTheme,
  onReset
}) => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isThemeSelectorOpen, setIsThemeSelectorOpen] = React.useState(false);

  // Determine if current mode is light based on background color
  const isLightMode = theme.colors.bg === '#ffffff';

  const toggleMode = () => {
    if (!onUpdateTheme) return;

    if (isLightMode) {
      // Switch to Dark: Find the original theme from THEMES based on primary color or ID
      const originalId = theme.id.replace('-light', '');
      const originalTheme = THEMES.find(t => t.id === originalId) || THEMES[0];
      onUpdateTheme(originalTheme);
    } else {
      // Switch to Light: Create a light version of the current theme
      const lightTheme: Theme = {
        ...theme,
        id: `${theme.id}-light`,
        colors: {
          ...theme.colors,
          bg: '#ffffff',
          card: '#f3f4f6',
          text: '#111827'
        }
      };
      onUpdateTheme(lightTheme);
    }
  };

  const toggleLanguage = () => {
    if (!user || !onUpdateUser) return;
    const newLang = user.language === 'es' ? 'en' : 'es';
    const updatedUser = { ...user, language: newLang };
    onUpdateUser(updatedUser);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  // Apply theme variables dynamically
  const style = {
    '--color-primary': theme.colors.primary,
    '--color-secondary': theme.colors.secondary,
    '--color-bg': theme.colors.bg,
    '--color-card': theme.colors.card,
    '--color-text': theme.colors.text,
  } as React.CSSProperties;

  const navItems = [
    { id: 'dashboard', label: 'Inicio', icon: <Home size={20} /> },
    { id: 'workout', label: 'Escanear WOD', icon: <Camera size={20} /> },
    { id: 'timers', label: 'Timers', icon: <Timer size={20} /> },
    { id: 'nutrition', label: 'Nutrición', icon: <Utensils size={20} /> },
    { id: 'movements', label: 'Técnica', icon: <Activity size={20} /> },
    { id: 'profile', label: 'Perfil', icon: <User size={20} /> },
  ];

  return (
    <div style={style} className="flex flex-col h-screen w-full bg-[var(--color-bg)] text-[var(--color-text)] transition-colors duration-300">

      {/* Header */}
      <header className="flex-none p-4 flex items-center justify-between border-b border-[var(--color-secondary)] bg-[var(--color-card)] shadow-lg z-10 md:pl-24 transition-all">
        <div className="flex items-center gap-2">
          <Activity className="text-[var(--color-primary)]" size={28} />
          <h1 className="text-xl font-bold tracking-tight">Crossfit-<span className="text-[var(--color-primary)]">AI</span></h1>
        </div>

        {/* Mobile Hamburger Menu Button */}
        <button
          className="md:hidden p-2 text-[var(--color-text)]"
          onClick={() => setIsMenuOpen(true)}
        >
          <Menu size={24} />
        </button>

      </header>

      {/* Main Content */}
      <main className={`flex-1 relative md:pl-20 transition-all ${activeTab === 'workout' ? 'overflow-hidden p-0' : 'overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 custom-scrollbar'}`}>
        <div className={`mx-auto h-full ${activeTab === 'workout' ? 'max-w-full' : 'max-w-4xl'}`}>
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation - HIDDEN on Mobile now, handled by Drawer */}
      <nav className="hidden md:flex flex-none md:fixed md:left-0 md:top-0 md:h-screen md:w-20 md:flex-col md:justify-start md:pt-20 border-t md:border-t-0 md:border-r border-[var(--color-secondary)] bg-[var(--color-card)] z-20">
        <div className="flex md:flex-col justify-around md:justify-start md:gap-8 h-16 md:h-auto items-center w-full">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center w-full md:w-full md:py-4 gap-1 transition-all ${activeTab === item.id
                ? 'text-[var(--color-primary)] scale-110'
                : 'text-gray-400 hover:text-[var(--color-primary)]'
                }`}
            >
              <div className={`p-1 rounded-lg ${activeTab === item.id ? 'bg-[var(--color-secondary)] bg-opacity-20' : ''}`}>
                {item.icon}
              </div>
              <span className="text-[10px] md:text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsMenuOpen(false)}
          ></div>

          {/* Drawer Content */}
          <div className="relative w-80 h-full bg-[#0a0a0a] border-l border-gray-800 p-6 shadow-2xl animate-slide-left overflow-y-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-bold text-white">Menú</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400"
              >
                <X size={24} />
              </button>
            </div>

            {/* Navigation Links */}
            <div className="space-y-2 mb-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${activeTab === item.id
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                    : 'text-gray-400 hover:bg-gray-800'
                    }`}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>

            <div className="h-px bg-gray-800 my-6"></div>

            <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 px-2">Configuración</h3>

            {/* Light/Dark Mode Toggle */}
            <div className="mb-4">
              <button
                onClick={toggleMode}
                className="w-full flex items-center justify-between p-4 bg-[var(--color-card)] rounded-xl border border-gray-800 hover:border-[var(--color-primary)] transition-all group"
              >
                <div className="flex items-center gap-3">
                  {isLightMode ? <Sun size={18} /> : <Moon size={18} />}
                  <span className="text-[var(--color-text)] font-medium">Tema</span>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded transition-colors ${isLightMode ? 'bg-yellow-500/20 text-yellow-500' : 'bg-blue-500/20 text-blue-500'}`}>
                  {isLightMode ? 'CLARO' : 'OSCURO'}
                </span>
              </button>
            </div>

            {/* Language Selector */}
            <div className="mb-4">
              <button
                onClick={toggleLanguage}
                className="w-full flex items-center justify-between p-4 bg-[var(--color-card)] rounded-xl border border-gray-800 hover:border-[var(--color-primary)] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Globe size={18} />
                  <span className="text-[var(--color-text)] font-medium">Idioma</span>
                </div>
                <span className="text-[var(--color-text)]">{user?.language === 'en' ? 'EN' : 'ES'}</span>
              </button>
            </div>

            {/* Theme Selector */}
            <div className="mb-4">
              <button
                onClick={() => setIsThemeSelectorOpen(!isThemeSelectorOpen)}
                className="w-full flex items-center justify-between p-4 bg-[var(--color-card)] rounded-xl border border-gray-800 hover:border-[var(--color-primary)] transition-all"
              >
                <div className="flex items-center gap-3">
                  <Palette size={18} />
                  <span className="text-[var(--color-text)] font-medium">Color</span>
                </div>
                {isThemeSelectorOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {isThemeSelectorOpen && (
                <div className="grid grid-cols-2 gap-3 mt-3 animate-fade-in">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        if (isLightMode && onUpdateTheme) {
                          const lightTheme = {
                            ...t,
                            id: `${t.id}-light`,
                            colors: { ...t.colors, bg: '#ffffff', card: '#f3f4f6', text: '#111827' }
                          };
                          onUpdateTheme(lightTheme);
                        } else if (onUpdateTheme) {
                          onUpdateTheme(t);
                        }
                      }}
                      className={`
                        relative p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-2
                        ${theme.id.includes(t.id)
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                          : 'border-gray-800 bg-[var(--color-card)] hover:border-gray-600'}
                      `}
                    >
                      <div
                        className="w-6 h-6 rounded-full shadow-[0_0_10px]"
                        style={{
                          backgroundColor: t.colors.primary,
                          boxShadow: `0 0 10px ${t.colors.primary}`
                        }}
                      ></div>
                      <span className={`text-[10px] font-medium ${theme.id.includes(t.id) ? 'text-[var(--color-text)]' : 'text-gray-400'}`}>
                        {t.name.replace('Neon ', '')}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Reset & Logout */}
            <div className="mt-8 pt-8 border-t border-gray-800 space-y-4">
              {onReset && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onReset();
                  }}
                  className="w-full flex items-center justify-between p-4 bg-red-500/10 rounded-xl border border-red-500/30 hover:bg-red-500 hover:text-white transition-all group"
                >
                  <span className="text-red-500 font-medium group-hover:text-white flex items-center gap-3">
                    <Trash2 size={18} /> Reset
                  </span>
                </button>
              )}

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-between p-4 bg-gray-800/50 rounded-xl border border-gray-700 hover:bg-gray-800 hover:text-white transition-all group"
              >
                <span className="text-gray-400 font-medium group-hover:text-white flex items-center gap-3">
                  <LogOut size={18} /> Cerrar Sesión
                </span>
              </button>
            </div>

            <div className="mt-8 text-center">
              <p className="text-xs text-gray-600">CrossFit App v1.1 Mobile</p>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
