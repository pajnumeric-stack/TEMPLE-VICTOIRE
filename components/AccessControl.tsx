

import React, { useState } from 'react';
import { AppData, Member, SystemRole, Role, ChurchInfo } from '../types';
import { Search, Shield, User, Lock, Eye, Edit3, ShieldAlert, CheckCircle, Settings, Users, ToggleLeft, ToggleRight, LayoutDashboard, Wallet, Package, Network, Calendar, KeyRound, Save, EyeOff, QrCode, X } from 'lucide-react';
import QRCode from "react-qr-code";

interface AccessControlProps {
  data: AppData;
  onUpdateMember: (member: Member) => void;
  onUpdateRolePermissions: (role: string, modules: string[]) => void;
  onUpdateChurchInfo: (info: ChurchInfo) => void;
}

export const AccessControl: React.FC<AccessControlProps> = ({ data, onUpdateMember, onUpdateRolePermissions, onUpdateChurchInfo }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'security'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for Access Code Change
  const [newAccessCode, setNewAccessCode] = useState('');
  const [showAccessCode, setShowAccessCode] = useState(false);
  const [accessCodeStatus, setAccessCodeStatus] = useState<'idle' | 'saved'>('idle');
  
  // Global QR Code Visibility
  const [showQrCode, setShowQrCode] = useState(false);

  // User Specific QR Code
  const [selectedQrMember, setSelectedQrMember] = useState<Member | null>(null);

  // Password Visibility State (Key is member ID)
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const filteredMembers = data.members.filter(m => 
    m.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.firstName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter members who have system access (not NONE) for the credentials list
  const authorizedMembers = data.members.filter(m => m.systemRole && m.systemRole !== SystemRole.NONE);

  const handleRoleChange = (member: Member, newRole: SystemRole) => {
    onUpdateMember({ ...member, systemRole: newRole });
  };

  const handlePasswordChange = (member: Member, newPassword: string) => {
    onUpdateMember({ ...member, password: newPassword });
  };

  const togglePasswordVisibility = (id: string) => {
      setVisiblePasswords(prev => ({
          ...prev,
          [id]: !prev[id]
      }));
  }

  const handlePermissionToggle = (role: string, moduleId: string) => {
      const currentPermissions = data.rolePermissions[role] || [];
      const newPermissions = currentPermissions.includes(moduleId)
        ? currentPermissions.filter(id => id !== moduleId)
        : [...currentPermissions, moduleId];
      
      onUpdateRolePermissions(role, newPermissions);
  }

  const handleUpdateAccessCode = (e: React.FormEvent) => {
      e.preventDefault();
      if (newAccessCode.trim().length < 4) {
          alert("Le code doit contenir au moins 4 caractères.");
          return;
      }
      onUpdateChurchInfo({
          ...data.churchInfo,
          accessCode: newAccessCode.trim()
      });
      setAccessCodeStatus('saved');
      setNewAccessCode('');
      setTimeout(() => setAccessCodeStatus('idle'), 3000);
  }

  const getRoleBadgeColor = (role?: SystemRole) => {
    switch (role) {
      case SystemRole.ADMIN: return 'bg-red-100 text-red-700 border-red-200';
      case SystemRole.EDITOR: return 'bg-blue-100 text-blue-700 border-blue-200';
      case SystemRole.VIEWER: return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-gray-50 text-gray-400 border-gray-100';
    }
  };

  const getRoleIcon = (role?: SystemRole) => {
    switch (role) {
      case SystemRole.ADMIN: return <ShieldAlert size={16} />;
      case SystemRole.EDITOR: return <Edit3 size={16} />;
      case SystemRole.VIEWER: return <Eye size={16} />;
      default: return <Lock size={16} />;
    }
  };

  const getRoleDescription = (role: SystemRole) => {
    switch (role) {
      case SystemRole.ADMIN: return "Accès complet : Gestion des utilisateurs, finances, suppression de données.";
      case SystemRole.EDITOR: return "Accès standard : Modification des données (membres, événements, matériel).";
      case SystemRole.VIEWER: return "Accès lecture : Consultation des informations autorisées uniquement.";
      case SystemRole.NONE: return "Aucun accès au système.";
    }
  };

  // Modules that can be toggled
  const MODULES = [
      { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
      { id: 'members', label: 'Ressources Humaines', icon: Users },
      { id: 'planning', label: 'Planning & Événements', icon: Calendar },
      { id: 'ministries', label: 'Ministères', icon: Network },
      { id: 'assets', label: 'Matériel', icon: Package },
      { id: 'finance', label: 'Finances', icon: Wallet },
      // Access Control module is reserved for Admins
  ];

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                <Shield className="text-indigo-600" />
                Contrôle d'Accès & Sécurité
            </h2>
            <p className="text-slate-500 mt-1">Gérez les utilisateurs et configurez les permissions.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white p-1 rounded-lg border border-slate-200 inline-flex shadow-sm">
            <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
                <Users size={18} />
                Utilisateurs
            </button>
            <button
                onClick={() => setActiveTab('roles')}
                className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${activeTab === 'roles' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
                <Settings size={18} />
                Configuration des Rôles
            </button>
            <button
                onClick={() => setActiveTab('security')}
                className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${activeTab === 'security' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
                <KeyRound size={18} />
                Sécurité & Mots de passe
            </button>
      </div>

      {activeTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Roles Legend */}
            <div className="lg:col-span-1 space-y-4">
                <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4">Définition des Rôles</h3>
                    <div className="space-y-4">
                        {Object.values(SystemRole).map((role) => (
                            <div key={role} className="group">
                                <div className={`flex items-center gap-2 text-sm font-semibold mb-1 ${getRoleBadgeColor(role as SystemRole).split(' ')[1]}`}>
                                    {getRoleIcon(role as SystemRole)}
                                    {role}
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    {getRoleDescription(role as SystemRole)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100">
                    <h4 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                        <CheckCircle size={16} />
                        Bonnes pratiques
                    </h4>
                    <p className="text-xs text-indigo-700">
                        Limitez le nombre d'Administrateurs pour sécuriser les données sensibles. 
                        Privilégiez le rôle "Éditeur" pour le staff opérationnel.
                    </p>
                </div>
            </div>

            {/* Users Table */}
            <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-slate-800">Utilisateurs ({filteredMembers.length})</h3>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input 
                            type="text"
                            placeholder="Rechercher un membre..."
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 text-sm font-semibold text-slate-600">Membre</th>
                                <th className="px-4 py-3 text-sm font-semibold text-slate-600">Rôle Église</th>
                                <th className="px-4 py-3 text-sm font-semibold text-slate-600">Niveau d'Accès Système</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredMembers.map(member => (
                                <tr key={member.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            {member.photo ? (
                                                <img src={member.photo} alt="" className="w-9 h-9 rounded-full object-cover" />
                                            ) : (
                                                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                                    <User size={18} />
                                                </div>
                                            )}
                                            <div>
                                                <div className="font-medium text-slate-900">{member.firstName} {member.lastName}</div>
                                                <div className="text-xs text-slate-500">{member.email || 'Pas d\'email'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                            {member.role}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="relative">
                                            <select 
                                                value={member.systemRole || SystemRole.NONE}
                                                onChange={(e) => handleRoleChange(member, e.target.value as SystemRole)}
                                                className={`appearance-none w-full md:w-48 pl-3 pr-8 py-1.5 rounded-lg text-sm font-medium border focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-colors ${getRoleBadgeColor(member.systemRole as SystemRole)}`}
                                            >
                                                {Object.values(SystemRole).map(role => (
                                                    <option key={role} value={role}>{role}</option>
                                                ))}
                                            </select>
                                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                                                <Edit3 size={12} />
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-800">Matrice de Permissions</h3>
                <p className="text-slate-500 text-sm">Cochez les modules accessibles pour chaque rôle. L'Administrateur a toujours accès à tout.</p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="p-4 text-left text-sm font-semibold text-slate-600 w-1/4">Module / Formulaire</th>
                            <th className="p-4 text-center text-sm font-semibold text-slate-600 w-1/4">
                                <div className="flex items-center justify-center gap-2">
                                    <ShieldAlert size={16} /> Administrateur
                                </div>
                            </th>
                            <th className="p-4 text-center text-sm font-semibold text-slate-600 w-1/4">
                                <div className="flex items-center justify-center gap-2">
                                    <Edit3 size={16} /> Éditeur
                                </div>
                            </th>
                            <th className="p-4 text-center text-sm font-semibold text-slate-600 w-1/4">
                                <div className="flex items-center justify-center gap-2">
                                    <Eye size={16} /> Observateur
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {MODULES.map(module => (
                            <tr key={module.id} className="hover:bg-slate-50">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                                            <module.icon size={20} />
                                        </div>
                                        <span className="font-medium text-slate-800">{module.label}</span>
                                    </div>
                                </td>
                                
                                {/* ADMIN - Always Checked & Disabled */}
                                <td className="p-4 text-center">
                                    <div className="flex justify-center">
                                        <div className="w-10 h-6 bg-green-200 rounded-full flex items-center justify-end px-1 opacity-50 cursor-not-allowed">
                                            <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                                        </div>
                                    </div>
                                </td>

                                {/* EDITOR */}
                                <td className="p-4 text-center">
                                    <div className="flex justify-center">
                                        <button 
                                            onClick={() => handlePermissionToggle(SystemRole.EDITOR, module.id)}
                                            className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${
                                                data.rolePermissions[SystemRole.EDITOR]?.includes(module.id) 
                                                ? 'bg-indigo-600 justify-end' 
                                                : 'bg-slate-300 justify-start'
                                            }`}
                                        >
                                            <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                                        </button>
                                    </div>
                                </td>

                                {/* VIEWER */}
                                <td className="p-4 text-center">
                                    <div className="flex justify-center">
                                        <button 
                                            onClick={() => handlePermissionToggle(SystemRole.VIEWER, module.id)}
                                            className={`w-10 h-6 rounded-full flex items-center px-1 transition-colors ${
                                                data.rolePermissions[SystemRole.VIEWER]?.includes(module.id) 
                                                ? 'bg-indigo-600 justify-end' 
                                                : 'bg-slate-300 justify-start'
                                            }`}
                                        >
                                            <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {activeTab === 'security' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Global Access Code */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-fit">
                  <div className="mb-6 flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <KeyRound className="text-indigo-600" size={20} />
                            Code d'Accès Admin
                        </h3>
                        <p className="text-slate-500 text-sm mt-1">
                            Code administrateur requis pour la connexion si aucun compte n'est utilisé (Défaut: ADMIN).
                        </p>
                      </div>
                      <button 
                         onClick={() => setShowQrCode(!showQrCode)}
                         className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                         title="Afficher le QR Code"
                      >
                          <QrCode size={24} />
                      </button>
                  </div>

                  {showQrCode && (
                      <div className="mb-6 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                          <div className="bg-white p-2 rounded-lg shadow-sm mb-2">
                            <QRCode value={data.churchInfo.accessCode || 'ADMIN'} size={128} />
                          </div>
                          <p className="text-xs text-slate-500 text-center">
                              Scannez ce code sur l'écran de connexion pour accéder à l'administration.
                          </p>
                      </div>
                  )}

                  <form onSubmit={handleUpdateAccessCode} className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Nouveau Code Admin</label>
                          <div className="relative">
                            <input 
                                type={showAccessCode ? "text" : "password"}
                                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none pr-10"
                                placeholder="Entrez le nouveau code"
                                value={newAccessCode}
                                onChange={(e) => setNewAccessCode(e.target.value)}
                            />
                            <button 
                                type="button"
                                onClick={() => setShowAccessCode(!showAccessCode)}
                                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                            >
                                {showAccessCode ? <Eye size={18} /> : <Lock size={18} />}
                            </button>
                          </div>
                      </div>

                      <button 
                        type="submit" 
                        className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                      >
                          {accessCodeStatus === 'saved' ? <CheckCircle size={20} /> : <Save />}
                          {accessCodeStatus === 'saved' ? 'Code Modifié !' : 'Mettre à jour le code'}
                      </button>
                  </form>
              </div>

              {/* Authorized Users & Passwords */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                      <Users className="text-indigo-600" size={20} />
                      Membres Autorisés
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                      Liste des membres ayant un rôle système. Vous pouvez définir leurs mots de passe personnels ou générer un QR code de connexion.
                  </p>

                  <div className="overflow-y-auto max-h-[500px] space-y-3">
                      {authorizedMembers.length > 0 ? (
                          authorizedMembers.map(member => (
                              <div key={member.id} className="p-3 border border-slate-200 rounded-lg bg-slate-50">
                                  <div className="flex justify-between items-start mb-2">
                                      <div className="flex items-center gap-2">
                                          {member.photo ? (
                                              <img src={member.photo} className="w-8 h-8 rounded-full object-cover" />
                                          ) : (
                                              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xs">
                                                  {member.firstName[0]}
                                              </div>
                                          )}
                                          <div>
                                              <div className="font-bold text-sm text-slate-800">{member.firstName} {member.lastName}</div>
                                              <span className={`text-[10px] px-2 py-0.5 rounded border ${getRoleBadgeColor(member.systemRole)}`}>
                                                  {member.systemRole}
                                              </span>
                                          </div>
                                      </div>
                                      
                                      <button 
                                        onClick={() => setSelectedQrMember(member)}
                                        className="p-1.5 bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 rounded transition-colors"
                                        title="Générer QR Code de connexion"
                                      >
                                          <QrCode size={18} />
                                      </button>
                                  </div>
                                  
                                  <div className="relative">
                                      <input 
                                          type={visiblePasswords[member.id] ? "text" : "password"}
                                          className="w-full p-2 text-sm border border-slate-300 rounded bg-white pr-8"
                                          placeholder="Définir mot de passe..."
                                          value={member.password || ''}
                                          onChange={(e) => handlePasswordChange(member, e.target.value)}
                                      />
                                      <button 
                                          onClick={() => togglePasswordVisibility(member.id)}
                                          className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                                      >
                                          {visiblePasswords[member.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                                      </button>
                                  </div>
                              </div>
                          ))
                      ) : (
                          <p className="text-center text-slate-400 text-sm py-4">Aucun membre autorisé.</p>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* QR Code Modal for Individual User */}
      {selectedQrMember && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-sm flex flex-col items-center">
                  <div className="flex justify-between items-center w-full mb-6">
                      <h3 className="text-lg font-bold text-slate-800">QR Code de Connexion</h3>
                      <button onClick={() => setSelectedQrMember(null)} className="text-slate-400 hover:text-slate-600">
                          <X size={24} />
                      </button>
                  </div>
                  
                  <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-100 mb-4">
                      {/* Embed JSON credentials in QR Code */}
                      <QRCode 
                        value={JSON.stringify({ userId: selectedQrMember.id, password: selectedQrMember.password })} 
                        size={200} 
                        level="M"
                      />
                  </div>
                  
                  <div className="text-center">
                      <p className="font-bold text-slate-800 text-lg">
                          {selectedQrMember.firstName} {selectedQrMember.lastName}
                      </p>
                      <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded border ${getRoleBadgeColor(selectedQrMember.systemRole)}`}>
                          {selectedQrMember.systemRole}
                      </span>
                      <p className="text-xs text-slate-500 mt-4 max-w-[200px] mx-auto">
                          L'utilisateur peut scanner ce code sur l'écran d'accueil pour se connecter instantanément.
                      </p>
                  </div>

                  <button 
                    onClick={() => window.print()} 
                    className="mt-6 w-full py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
                  >
                      Imprimer
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};