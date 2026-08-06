import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Film, PlusCircle, MessageCircle, Settings as SettingsIcon, Clapperboard } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export const Sidebar: React.FC = () => {
  const { t } = useLanguage();
  
  const navItems = [
    { to: "/", icon: Home, label: t('nav.home') },
    { to: "/movies", icon: Film, label: t('nav.movies') },
    { to: "/add-movie", icon: PlusCircle, label: t('nav.add_movie') },
    { to: "/chat", icon: MessageCircle, label: t('nav.chat') },
    { to: "/settings", icon: SettingsIcon, label: t('nav.settings') }
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen fixed left-0 top-0 bg-slate-900/60 backdrop-blur-md border-r border-slate-800/80 z-50 shadow-xl shadow-black/50 transition-all duration-300">
        <div className="p-8 pb-12">
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-br from-red-500 to-red-800 tracking-tighter flex items-center gap-3 drop-shadow-sm uppercase">
            <div className="bg-red-600/20 p-2 rounded-xl border border-red-500/30 shadow-[0_0_15px_rgba(220,38,38,0.5)]">
              <Clapperboard className="text-red-500" size={24} />
            </div>
            SAKORING
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all duration-300 ease-out font-bold tracking-wide ${
                  isActive 
                    ? 'text-slate-50 bg-gradient-to-r from-red-600/20 to-transparent border-l-4 border-red-600 shadow-xl shadow-black/30' 
                    : 'text-slate-400 hover:text-slate-50 hover:bg-slate-900/60 hover:backdrop-blur-md border-l-4 border-transparent hover:translate-x-1'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={22} className={isActive ? 'text-red-500 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]' : ''} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-3xl border-t border-white/5 z-50 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <div className="flex justify-around items-center h-[72px]">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center w-full h-full space-y-1.5 transition-all duration-300 ${
                  isActive ? 'text-slate-50 -translate-y-1' : 'text-slate-500 hover:text-slate-300'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`p-1.5 rounded-full transition-all duration-300 ${isActive ? 'bg-red-600/20 text-red-500 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : ''}`}>
                    <item.icon size={22} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
};
