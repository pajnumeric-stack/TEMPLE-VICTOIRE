
import React, { useState } from 'react';
import { AppData, Ministry } from '../types';
import { Plus, Users, Calendar, Trash2 } from 'lucide-react';

interface MinistriesProps {
  data: AppData;
  onAddMinistry: (ministry: Omit<Ministry, 'id'>) => void;
  onDeleteMinistry: (id: string) => void;
}

export const Ministries: React.FC<MinistriesProps> = ({ data, onAddMinistry, onDeleteMinistry }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMinistry, setNewMinistry] = useState<Omit<Ministry, 'id'>>({
    name: '',
    description: '',
    meetingDay: '',
    leaderId: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddMinistry(newMinistry);
    setIsModalOpen(false);
    setNewMinistry({ name: '', description: '', meetingDay: '', leaderId: '' });
  };

  const getLeaderName = (id?: string) => {
    if (!id) return 'Non assigné';
    const member = data.members.find(m => m.id === id);
    return member ? `${member.firstName} ${member.lastName}` : 'Inconnu';
  };

  const getMemberCount = (ministryId: string) => {
    return data.members.filter(m => m.ministryIds?.includes(ministryId)).length;
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-3xl font-bold text-slate-800">Ministères & Groupes</h2>
            <p className="text-slate-500 mt-1">Gérez les départements et la vie de l'église</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus size={20} />
          Créer un groupe
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data.ministries.map(ministry => (
            <div key={ministry.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                    <div className="bg-indigo-50 p-3 rounded-lg text-indigo-600">
                        <Users size={24} />
                    </div>
                    <button 
                        onClick={() => onDeleteMinistry(ministry.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors"
                        title="Supprimer le groupe"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-2">{ministry.name}</h3>
                <p className="text-slate-600 text-sm mb-4 min-h-[40px]">{ministry.description}</p>
                
                <div className="space-y-3 pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Membres</span>
                        <span className="font-semibold bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                            {getMemberCount(ministry.id)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Responsable</span>
                        <span className="font-medium text-slate-900 truncate max-w-[150px]">
                            {getLeaderName(ministry.leaderId)}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Calendar size={14} />
                        <span>{ministry.meetingDay || 'Horaire non défini'}</span>
                    </div>
                </div>
            </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Nouveau Ministère</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input 
                  required
                  placeholder="Nom du groupe (ex: Chorale)"
                  className="p-2 border rounded-lg w-full"
                  value={newMinistry.name}
                  onChange={e => setNewMinistry({...newMinistry, name: e.target.value})}
                />
                <textarea 
                  required
                  placeholder="Description du groupe"
                  className="p-2 border rounded-lg w-full"
                  rows={3}
                  value={newMinistry.description}
                  onChange={e => setNewMinistry({...newMinistry, description: e.target.value})}
                />
                <input 
                  placeholder="Jour de réunion (ex: Jeudi 19h)"
                  className="p-2 border rounded-lg w-full"
                  value={newMinistry.meetingDay}
                  onChange={e => setNewMinistry({...newMinistry, meetingDay: e.target.value})}
                />
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Responsable</label>
                    <select 
                        className="p-2 border rounded-lg w-full"
                        value={newMinistry.leaderId}
                        onChange={e => setNewMinistry({...newMinistry, leaderId: e.target.value})}
                    >
                        <option value="">Sélectionner un responsable</option>
                        {data.members.map(m => (
                            <option key={m.id} value={m.id}>{m.firstName} {m.lastName}</option>
                        ))}
                    </select>
                </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
