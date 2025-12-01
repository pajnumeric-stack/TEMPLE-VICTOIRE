
import React from 'react';
import { LayoutDashboard, Users, Package, Wallet, Church, Network, Calendar, ShieldCheck, LogOut } from 'lucide-react';
import { ChurchInfo } from '../types';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  onLogout: () => void;
  churchInfo: ChurchInfo;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, onLogout, churchInfo }) => {
  const navItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'members', label: 'Ressources Humaines', icon: Users },
    { id: 'events', label: 'Événements', icon: Calendar },
    { id: 'ministries', label: 'Ministères & Groupes', icon: Network },
    { id: 'assets', label: 'Matériel', icon: Package },
    { id: 'finance', label: 'Finances', icon: Wallet },
    { id: 'access', label: 'Sécurité & Accès', icon: ShieldCheck },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white flex flex-col h-screen fixed left-0 top-0 shadow-xl z-50">
      <div className="p-6 flex items-center space-x-3 border-b border-slate-800">
        {churchInfo.logo ? (
             <img src={churchInfo.logo} alt="Logo" className="w-8 h-8 rounded-full object-cover border border-slate-600" />
        ) : (
            <Church className="w-8 h-8 text-indigo-400 shrink-0" />
        )}
        <span className="text-lg font-bold font-sans truncate" title={churchInfo.name || 'Eglise'}>
            {churchInfo.name || 'Eglise'}
        </span>
      </div>
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                isActive 
                  ? 'bg-indigo-600 text-white' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-800 space-y-2">
        <button
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sortir</span>
        </button>
        <p className="text-xs text-slate-600 text-center pt-2">© 2024 Gestion Eglise</p>
      </div>
    </div>
  );
};
