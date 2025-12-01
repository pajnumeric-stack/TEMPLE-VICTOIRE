

import React, { useState } from 'react';
import { Member, Role, AppData, MaritalStatus, Child } from '../types';
import { Plus, Search, User, Download, MapPin, Upload, Briefcase, Users, Filter, Pencil, Trash2, AlertTriangle, Calendar, Settings, ShieldAlert, Phone, Baby, FileText, X, QrCode, Printer } from 'lucide-react';
import { exportToCSV } from '../services/exportService';
import QRCode from "react-qr-code";

interface MembersProps {
  data: AppData;
  onAddMember: (member: Omit<Member, 'id'>) => void;
  onUpdateMember: (member: Member) => void;
  onDeleteMember: (id: string) => void;
  onAddRole: (role: string) => void;
  onDeleteRole: (role: string) => void;
}

const PROFESSIONS_LIST = [
  "Étudiant",
  "Enseignant / Éducation",
  "Ingénieur / Technique",
  "Santé (Médecin, Infirmier...)",
  "Commerçant / Artisan",
  "Fonctionnaire",
  "Employé de bureau",
  "Entrepreneur",
  "Ouvrier",
  "Retraité",
  "Au foyer",
  "Sans emploi",
  "Autre"
];

const INITIAL_MEMBER_STATE: Omit<Member, 'id'> = {
    firstName: '',
    lastName: '',
    familyName: '',
    role: 'Membre',
    email: '',
    phone: '',
    address: '',
    photo: '',
    birthDate: '',
    maritalStatus: MaritalStatus.SINGLE,
    profession: 'Autre',
    joinDate: new Date().toISOString().split('T')[0],
    ministryIds: [],
    emergencyContactName: '',
    emergencyContactPhone: '',
    children: [],
    nationality: '',
    passportNumber: '',
    drivingLicense: '',
    identityDocument: ''
};

export const Members: React.FC<MembersProps> = ({ data, onAddMember, onUpdateMember, onDeleteMember, onAddRole, onDeleteRole }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Delete confirmation state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // QR Code state
  const [selectedQrMember, setSelectedQrMember] = useState<Member | null>(null);
  
  // Role management state
  const [newRoleName, setNewRoleName] = useState('');

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [ministryFilter, setMinistryFilter] = useState<string>('all');
  
  const [formData, setFormData] = useState<Omit<Member, 'id'> | Member>(INITIAL_MEMBER_STATE);

  const filteredMembers = data.members.filter(m => {
    const matchesSearch = 
        m.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.familyName && m.familyName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || m.role === roleFilter;
    const matchesMinistry = ministryFilter === 'all' || (m.ministryIds && m.ministryIds.includes(ministryFilter));

    return matchesSearch && matchesRole && matchesMinistry;
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIdentityDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, identityDocument: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditClick = (member: Member) => {
    setFormData(member);
    setEditingId(member.id);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
        onDeleteMember(deleteId);
        setDeleteId(null);
    }
  };

  const handleOpenModal = () => {
      setFormData(INITIAL_MEMBER_STATE);
      setEditingId(null);
      setIsModalOpen(true);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
        onUpdateMember({ ...formData as Member, id: editingId });
    } else {
        onAddMember(formData);
    }
    setIsModalOpen(false);
    setFormData(INITIAL_MEMBER_STATE);
    setEditingId(null);
  };

  const handleMinistryChange = (ministryId: string) => {
      const currentMinistries = formData.ministryIds || [];
      const newMinistries = currentMinistries.includes(ministryId)
        ? currentMinistries.filter(id => id !== ministryId)
        : [...currentMinistries, ministryId];
      setFormData({...formData, ministryIds: newMinistries});
  }

  const handleAddRoleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (newRoleName.trim()) {
          onAddRole(newRoleName.trim());
          setNewRoleName('');
      }
  }

  // --- Child Management Handlers ---
  const handleAddChild = () => {
      const currentChildren = formData.children || [];
      setFormData({
          ...formData,
          children: [...currentChildren, { name: '', ministryId: '' }]
      });
  };

  const handleRemoveChild = (index: number) => {
      const currentChildren = formData.children || [];
      const newChildren = currentChildren.filter((_, i) => i !== index);
      setFormData({ ...formData, children: newChildren });
  };

  const handleChildChange = (index: number, field: keyof Child, value: string) => {
      const currentChildren = formData.children || [];
      const newChildren = [...currentChildren];
      newChildren[index] = { ...newChildren[index], [field]: value };
      setFormData({ ...formData, children: newChildren });
  };

  const handleExport = () => {
    const exportData = data.members.map(m => {
        const memberMinistries = m.ministryIds 
            ? m.ministryIds.map(mid => data.ministries.find(min => min.id === mid)?.name).join(', ')
            : '';
        
        const childrenString = m.children 
            ? m.children.map(c => {
                const ministryName = c.ministryId ? data.ministries.find(min => min.id === c.ministryId)?.name : 'Aucun';
                return `${c.name} (${ministryName})`;
            }).join('; ')
            : '';

        return {
            'Prénom': m.firstName,
            'Nom': m.lastName,
            'Famille': m.familyName || '',
            'Rôle': m.role,
            'Situation Matrimoniale': m.maritalStatus || '',
            'Profession': m.profession || '',
            'Ministères': memberMinistries,
            'Email': m.email,
            'Téléphone': m.phone,
            'Adresse': m.address || '',
            'Date Naissance': m.birthDate || '',
            'Date arrivée': m.joinDate,
            'Nationalité': m.nationality || '',
            'Passeport': m.passportNumber || '',
            'Permis': m.drivingLicense || '',
            'Pièce Identité': m.identityDocument ? 'Oui' : 'Non',
            'Urgence Nom': m.emergencyContactName || '',
            'Urgence Tél': m.emergencyContactPhone || '',
            'Enfants': childrenString
        };
    });
    exportToCSV(exportData, `membres_eglise_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-800">Ressources Humaines</h2>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsRoleModalOpen(true)}
            className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all"
            title="Gérer les rôles"
          >
            <Settings size={20} />
            <span className="hidden sm:inline">Rôles</span>
          </button>
          <button 
            onClick={handleExport}
            className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all"
          >
            <Download size={20} />
            <span className="hidden sm:inline">Exporter</span>
          </button>
          <button 
            onClick={handleOpenModal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Nouveau</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        {/* Search and Filters Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-3 text-slate-400" size={20} />
                <input 
                    type="text"
                    placeholder="Rechercher par nom, famille..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="flex gap-2">
                <div className="relative">
                    <Filter className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <select 
                        className="pl-9 pr-8 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white appearance-none"
                        value={roleFilter}
                        onChange={(e) => setRoleFilter(e.target.value)}
                    >
                        <option value="all">Tous les rôles</option>
                        {data.roles.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </div>
                
                <div className="relative">
                    <Users className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <select 
                        className="pl-9 pr-8 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white appearance-none"
                        value={ministryFilter}
                        onChange={(e) => setMinistryFilter(e.target.value)}
                    >
                        <option value="all">Tous les ministères</option>
                        {data.ministries.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600">Membre</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600">Rôle & Famille</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600">Ministères</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600">Infos Perso</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map(member => (
                <tr key={member.id} className="hover:bg-slate-50 group">
                  <td className="px-6 py-4 flex items-center gap-3">
                    {member.photo ? (
                      <img src={member.photo} alt={`${member.firstName} ${member.lastName}`} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center border border-slate-200">
                        <User size={20} />
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-slate-900">{member.firstName} {member.lastName}</div>
                      <div className="text-xs text-slate-500">{member.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                        <span className={`w-fit px-2 py-0.5 rounded-full text-xs font-medium 
                        ${member.role === 'Pasteur' ? 'bg-purple-100 text-purple-700' : 
                            member.role === 'Diacre' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                        {member.role}
                        </span>
                        {member.familyName && (
                             <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Users size={10} /> {member.familyName}
                             </span>
                        )}
                        {member.children && member.children.length > 0 && (
                            <span className="text-xs text-pink-500 flex items-center gap-1" title={`${member.children.length} enfant(s)`}>
                                <Baby size={10} /> {member.children.length} enf.
                            </span>
                        )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {member.ministryIds && member.ministryIds.length > 0 ? (
                            member.ministryIds.map(mid => {
                                const min = data.ministries.find(m => m.id === mid);
                                return min ? (
                                    <span key={mid} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100">
                                        {min.name}
                                    </span>
                                ) : null;
                            })
                        ) : (
                            <span className="text-xs text-slate-400 italic">Aucun</span>
                        )}
                      </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-sm">
                    <div className="flex flex-col gap-1">
                         <div className="flex items-center gap-2" title="Profession">
                            <Briefcase size={14} className="text-slate-400" />
                            <span>{member.profession || '-'}</span>
                        </div>
                         <div className="flex items-center gap-2" title="Adresse">
                            <MapPin size={14} className="text-slate-400" />
                            <span className="truncate max-w-[150px]">{member.address || '-'}</span>
                        </div>
                        {member.emergencyContactName && (
                            <div className="flex items-center gap-2 text-red-500" title={`Urgence: ${member.emergencyContactName} (${member.emergencyContactPhone})`}>
                                <ShieldAlert size={14} />
                                <span className="text-xs font-semibold">SOS Configuré</span>
                            </div>
                        )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setSelectedQrMember(member)}
                            className="p-1 hover:bg-indigo-100 rounded text-slate-500 hover:text-indigo-600"
                            title="Code QR de Présence"
                          >
                              <QrCode size={18} />
                          </button>
                          <button 
                            onClick={() => handleEditClick(member)}
                            className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-indigo-600"
                            title="Modifier"
                          >
                              <Pencil size={18} />
                          </button>
                          <button 
                             onClick={() => handleDeleteClick(member.id)}
                             className="p-1 hover:bg-slate-200 rounded text-slate-500 hover:text-red-600"
                             title="Supprimer"
                          >
                              <Trash2 size={18} />
                          </button>
                      </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Management Modal */}
      {isRoleModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 w-full max-w-md">
                  <h3 className="text-xl font-bold mb-4">Gestion des Rôles</h3>
                  <div className="space-y-4">
                      <form onSubmit={handleAddRoleSubmit} className="flex gap-2">
                          <input 
                              placeholder="Nouveau rôle (ex: Ancien)"
                              className="flex-1 p-2 border rounded-lg"
                              value={newRoleName}
                              onChange={(e) => setNewRoleName(e.target.value)}
                          />
                          <button type="submit" className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                              Ajouter
                          </button>
                      </form>
                      
                      <div className="max-h-60 overflow-y-auto space-y-2 border-t pt-2">
                          {data.roles.map(role => (
                              <div key={role} className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100">
                                  <span className="text-slate-700 font-medium">{role}</span>
                                  <button 
                                      onClick={() => onDeleteRole(role)}
                                      className="text-slate-400 hover:text-red-600 p-1"
                                      title="Supprimer"
                                  >
                                      <Trash2 size={16} />
                                  </button>
                              </div>
                          ))}
                      </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                      <button onClick={() => setIsRoleModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200">
                          Fermer
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Member QR Code Modal */}
      {selectedQrMember && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-sm flex flex-col items-center shadow-2xl">
                  <div className="flex justify-between items-center w-full mb-6">
                      <h3 className="text-lg font-bold text-slate-800">Badge & QR Code</h3>
                      <button onClick={() => setSelectedQrMember(null)} className="text-slate-400 hover:text-slate-600">
                          <X size={24} />
                      </button>
                  </div>
                  
                  <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-100 mb-4 flex flex-col items-center w-full print-area">
                      {selectedQrMember.photo ? (
                          <img src={selectedQrMember.photo} alt="Profile" className="w-20 h-20 rounded-full object-cover border-4 border-indigo-50 mb-3" />
                      ) : (
                          <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 mb-3">
                              <User size={32} />
                          </div>
                      )}
                      
                      <h4 className="text-xl font-bold text-slate-900 text-center">{selectedQrMember.firstName} {selectedQrMember.lastName}</h4>
                      <span className="inline-block mt-1 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold mb-6">
                          {selectedQrMember.role}
                      </span>
                      
                      {/* Generates a QR Code containing just the User ID in JSON format for the Event Scanner */}
                      <div className="p-2 bg-white border border-slate-200 rounded-lg">
                        <QRCode 
                            value={JSON.stringify({ userId: selectedQrMember.id })} 
                            size={180} 
                            level="H"
                        />
                      </div>
                      
                      <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest font-semibold">
                          ID: {selectedQrMember.id}
                      </p>
                  </div>
                  
                  <p className="text-xs text-slate-500 text-center mb-6">
                      Ce code permet de valider la présence du membre lors des événements de l'église.
                  </p>

                  <button 
                    onClick={() => window.print()} 
                    className="w-full py-2.5 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                  >
                      <Printer size={18} />
                      Imprimer le Badge
                  </button>
              </div>
          </div>
      )}

      {/* Edit/Add Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{editingId ? 'Modifier le membre' : 'Nouveau Membre'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex justify-center mb-4">
                <div className="relative group cursor-pointer">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
                    {formData.photo ? (
                      <img src={formData.photo} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center text-slate-400">
                        <User size={32} className="mx-auto" />
                        <span className="text-xs">Photo</span>
                      </div>
                    )}
                  </div>
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1 rounded-full shadow-sm">
                    <Upload size={14} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input 
                  required
                  placeholder="Prénom"
                  className="p-2 border rounded-lg w-full"
                  value={formData.firstName}
                  onChange={e => setFormData({...formData, firstName: e.target.value})}
                />
                <input 
                  required
                  placeholder="Nom"
                  className="p-2 border rounded-lg w-full"
                  value={formData.lastName}
                  onChange={e => setFormData({...formData, lastName: e.target.value})}
                />
              </div>

              <input 
                  placeholder="Nom de la famille (ex: Famille Dupont)"
                  className="p-2 border rounded-lg w-full"
                  value={formData.familyName}
                  onChange={e => setFormData({...formData, familyName: e.target.value})}
              />

              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Rôle</label>
                    <select 
                        className="p-2 border rounded-lg w-full"
                        value={formData.role}
                        onChange={e => setFormData({...formData, role: e.target.value})}
                    >
                        {data.roles.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Situation Matrimoniale</label>
                    <select 
                        className="p-2 border rounded-lg w-full"
                        value={formData.maritalStatus}
                        onChange={e => setFormData({...formData, maritalStatus: e.target.value as MaritalStatus})}
                    >
                        {Object.values(MaritalStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
              </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Date de Naissance</label>
                    <input 
                      type="date"
                      className="p-2 border rounded-lg w-full"
                      value={formData.birthDate || ''}
                      onChange={e => setFormData({...formData, birthDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Date d'arrivée</label>
                    <input 
                      type="date"
                      className="p-2 border rounded-lg w-full"
                      value={formData.joinDate}
                      onChange={e => setFormData({...formData, joinDate: e.target.value})}
                    />
                  </div>
              </div>

              {/* Identity Documents Section */}
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                  <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                      <FileText size={16} /> Documents & Identité
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                      <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Nationalité</label>
                          <input 
                              placeholder="Ex: Française"
                              className="p-2 border rounded-lg w-full text-sm"
                              value={formData.nationality || ''}
                              onChange={e => setFormData({...formData, nationality: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">N° Passeport</label>
                          <input 
                              placeholder="Ex: 12AB..."
                              className="p-2 border rounded-lg w-full text-sm"
                              value={formData.passportNumber || ''}
                              onChange={e => setFormData({...formData, passportNumber: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Permis de Conduire</label>
                          <input 
                              placeholder="Ex: Permis B"
                              className="p-2 border rounded-lg w-full text-sm"
                              value={formData.drivingLicense || ''}
                              onChange={e => setFormData({...formData, drivingLicense: e.target.value})}
                          />
                      </div>
                  </div>

                  {/* ID Document Upload */}
                  <div className="mt-3 border-t border-slate-200 pt-3">
                      <label className="block text-xs font-medium text-slate-500 mb-2">Scan / Photo Pièce d'Identité</label>
                      <div className="flex items-start gap-4">
                          {formData.identityDocument ? (
                              <div className="relative group">
                                  <img 
                                      src={formData.identityDocument} 
                                      alt="ID Document" 
                                      className="h-24 w-auto object-contain border rounded-lg bg-white"
                                  />
                                  <button
                                      type="button"
                                      onClick={() => setFormData({...formData, identityDocument: ''})}
                                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                  >
                                      <X size={12} />
                                  </button>
                              </div>
                          ) : (
                              <div className="h-24 w-32 border-2 border-dashed border-slate-300 rounded-lg bg-white flex flex-col items-center justify-center text-slate-400">
                                  <FileText size={24} className="mb-1" />
                                  <span className="text-[10px]">Aucun doc</span>
                              </div>
                          )}
                          
                          <div className="flex-1">
                              <label className="cursor-pointer bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg inline-flex items-center gap-2 text-sm shadow-sm transition-all">
                                  <Upload size={16} />
                                  <span>Télécharger le document</span>
                                  <input 
                                      type="file" 
                                      accept="image/*"
                                      onChange={handleIdentityDocChange}
                                      className="hidden"
                                  />
                              </label>
                              <p className="text-[10px] text-slate-400 mt-2">
                                  Formats acceptés: JPG, PNG. Taille max recommandée: 2Mo.
                              </p>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Ministries Selection */}
              <div>
                  <label className="block text-xs font-medium text-slate-500 mb-2">Ministères & Groupes</label>
                  <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg max-h-32 overflow-y-auto bg-slate-50">
                      {data.ministries.map(ministry => (
                          <label key={ministry.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-100 p-1 rounded">
                              <input 
                                type="checkbox"
                                checked={formData.ministryIds?.includes(ministry.id)}
                                onChange={() => handleMinistryChange(ministry.id)}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                              />
                              <span className="text-slate-700">{ministry.name}</span>
                          </label>
                      ))}
                  </div>
              </div>

              {/* Children Management */}
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                  <div className="flex justify-between items-center mb-2">
                      <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                          <Baby size={16} /> Gestion des Enfants
                      </label>
                      <button 
                          type="button" 
                          onClick={handleAddChild}
                          className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200 flex items-center gap-1"
                      >
                          <Plus size={12} /> Ajouter
                      </button>
                  </div>
                  
                  {formData.children && formData.children.length > 0 ? (
                      <div className="space-y-2">
                          {formData.children.map((child, index) => (
                              <div key={index} className="flex gap-2 items-center">
                                  <input 
                                      placeholder="Nom de l'enfant"
                                      className="flex-1 p-2 border rounded text-sm"
                                      value={child.name}
                                      onChange={(e) => handleChildChange(index, 'name', e.target.value)}
                                  />
                                  <select 
                                      className="flex-1 p-2 border rounded text-sm bg-white"
                                      value={child.ministryId || ''}
                                      onChange={(e) => handleChildChange(index, 'ministryId', e.target.value)}
                                  >
                                      <option value="">Aucun groupe</option>
                                      {data.ministries.map(m => (
                                          <option key={m.id} value={m.id}>{m.name}</option>
                                      ))}
                                  </select>
                                  <button 
                                      type="button"
                                      onClick={() => handleRemoveChild(index)}
                                      className="p-2 text-slate-400 hover:text-red-500"
                                  >
                                      <Trash2 size={16} />
                                  </button>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <p className="text-xs text-slate-400 italic text-center py-2">Aucun enfant ajouté.</p>
                  )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Fonction Professionnelle</label>
                <select 
                    className="p-2 border rounded-lg w-full"
                    value={formData.profession}
                    onChange={e => setFormData({...formData, profession: e.target.value})}
                >
                    {PROFESSIONS_LIST.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="email"
                  placeholder="Email"
                  className="p-2 border rounded-lg w-full"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
                <input 
                  type="tel"
                  placeholder="Téléphone"
                  className="p-2 border rounded-lg w-full"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>

              <input 
                placeholder="Adresse complète (ex: 12 Rue de la Paix, Ville)"
                className="p-2 border rounded-lg w-full"
                value={formData.address || ''}
                onChange={e => setFormData({...formData, address: e.target.value})}
              />

              {/* Emergency Contact Section */}
              <div className="border-t border-slate-100 pt-4 mt-2">
                  <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                      <ShieldAlert size={16} className="text-red-500"/> Contact d'Urgence
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Nom du contact</label>
                          <input 
                              placeholder="Ex: Maman, Époux..."
                              className="p-2 border rounded-lg w-full"
                              value={formData.emergencyContactName || ''}
                              onChange={e => setFormData({...formData, emergencyContactName: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Téléphone d'urgence</label>
                          <input 
                              type="tel"
                              placeholder="06..."
                              className="p-2 border rounded-lg w-full"
                              value={formData.emergencyContactPhone || ''}
                              onChange={e => setFormData({...formData, emergencyContactPhone: e.target.value})}
                          />
                      </div>
                  </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                    {editingId ? 'Mettre à jour' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl">
            <div className="flex items-center gap-3 text-red-600 mb-4">
                <div className="bg-red-100 p-2 rounded-full">
                    <AlertTriangle size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">Supprimer le membre ?</h3>
            </div>
            
            <p className="text-slate-600 mb-6">
                Êtes-vous sûr de vouloir supprimer ce membre ? Cette action est irréversible et retirera le membre de tous les groupes.
            </p>
            
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button 
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
