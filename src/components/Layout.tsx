import React from 'react';
import { Theme } from '../types';
import { Menu, Activity, Calendar, Camera, Timer, User, Home, Utensils } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: Theme;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, theme }) => {
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
      </header>

      {/* Main Content */}
      <main className={`flex-1 relative md:pl-20 transition-all ${activeTab === 'workout' ? 'overflow-hidden p-0' : 'overflow-y-auto p-4 md:p-6 pb-24 md:pb-6 custom-scrollbar'}`}>
        <div className={`mx-auto h-full ${activeTab === 'workout' ? 'max-w-full' : 'max-w-4xl'}`}>
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="flex-none md:fixed md:left-0 md:top-0 md:h-screen md:w-20 md:flex-col md:justify-start md:pt-20 border-t md:border-t-0 md:border-r border-[var(--color-secondary)] bg-[var(--color-card)] z-20">
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
    </div>
  );
};

export default Layout;
