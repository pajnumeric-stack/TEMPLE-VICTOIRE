

import React, { useState } from 'react';
import { AppData, TransactionType, ChurchInfo } from '../types';
import { generateChurchReport } from '../services/geminiService';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, AreaChart, Area, CartesianGrid } from 'recharts';
import { Sparkles, Loader2, FileText, Church, Pencil, Upload, Image as ImageIcon, Cake, CalendarHeart, Calendar, MapPin, Users, TrendingUp, Box } from 'lucide-react';

interface DashboardProps {
  data: AppData;
  onUpdateChurchInfo: (info: ChurchInfo) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ data, onUpdateChurchInfo }) => {
  const [report, setReport] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState<ChurchInfo>(data.churchInfo || { name: '', slogan: '', idRef: '' });

  const totalIncome = data.transactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = data.transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + t.amount, 0);

  const handleGenerateReport = async () => {
    setLoading(true);
    const result = await generateChurchReport(data);
    setReport(result || "Erreur de génération.");
    setLoading(false);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm({ ...editForm, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateChurchInfo(editForm);
    setIsEditModalOpen(false);
  }

  // Calculate upcoming birthdays and anniversaries (next 30 days)
  const getUpcomingCelebrations = () => {
    const today = new Date();
    const nextMonth = new Date();
    nextMonth.setDate(today.getDate() + 30);
    
    const celebrations: { type: 'birthday' | 'anniversary', date: Date, memberName: string, id: string, years?: number }[] = [];

    data.members.forEach(member => {
        // Birthdays
        if (member.birthDate) {
            const birth = new Date(member.birthDate);
            const nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
            if (nextBirthday < today) {
                nextBirthday.setFullYear(today.getFullYear() + 1);
            }
            if (nextBirthday <= nextMonth && nextBirthday >= today) {
                celebrations.push({
                    type: 'birthday',
                    date: nextBirthday,
                    memberName: `${member.firstName} ${member.lastName}`,
                    id: `b-${member.id}`
                });
            }
        }

        // Church Anniversaries
        if (member.joinDate) {
            const join = new Date(member.joinDate);
            const nextAnniversary = new Date(today.getFullYear(), join.getMonth(), join.getDate());
            if (nextAnniversary < today) {
                nextAnniversary.setFullYear(today.getFullYear() + 1);
            }
             // Calculate years of membership
             const years = nextAnniversary.getFullYear() - join.getFullYear();

            if (nextAnniversary <= nextMonth && nextAnniversary >= today && years > 0) {
                celebrations.push({
                    type: 'anniversary',
                    date: nextAnniversary,
                    memberName: `${member.firstName} ${member.lastName}`,
                    id: `a-${member.id}`,
                    years: years
                });
            }
        }
    });

    return celebrations.sort((a, b) => a.date.getTime() - b.date.getTime());
  };

  const upcomingCelebrations = getUpcomingCelebrations();
  const upcomingEvents = data.events
    .filter(e => new Date(e.date) >= new Date(new Date().setHours(0,0,0,0)))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);


  // Prepare Chart Data
  const financialData = [
    { name: 'Revenus', value: totalIncome, color: '#10b981' },
    { name: 'Dépenses', value: totalExpense, color: '#ef4444' }
  ];

  // Role Distribution for Pie Chart
  const roleCounts = data.members.reduce((acc, member) => {
    acc[member.role] = (acc[member.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const roleData = Object.keys(roleCounts).map((key, index) => ({
    name: key,
    value: roleCounts[key]
  }));

  // Attendance Trends Calculation
  const getAttendanceTrends = () => {
    const stats: Record<string, { total: number; count: number; date: Date }> = {};

    data.attendance.forEach(record => {
      const date = new Date(record.date);
      const key = `${date.getFullYear()}-${date.getMonth()}`; // Group by month
      
      if (!stats[key]) {
        stats[key] = { total: 0, count: 0, date: date };
      }
      
      const count = (record.presentMemberIds?.length || 0) + (record.visitorCount || 0);
      stats[key].total += count;
      stats[key].count += 1;
    });

    return Object.values(stats)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((stat: { total: number; count: number; date: Date }) => ({
        name: stat.date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
        moyenne: Math.round(stat.total / stat.count),
        total: stat.total,
        events: stat.count
      }))
      .slice(-6); // Last 6 months
  };

  const attendanceData = getAttendanceTrends();


  // Family Stats Calculation
  const familyDistribution = data.members.reduce((acc, member) => {
    if (member.familyName && member.familyName.trim() !== '') {
        acc[member.familyName] = (acc[member.familyName] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const sortedFamilies = Object.entries(familyDistribution)
    .map(([name, count]) => ({ name, count: count as number }))
    .sort((a, b) => b.count - a.count);

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

  return (
    <div className="p-8 space-y-8">
      {/* Header with Church Logo & Name */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative group">
        <button 
            onClick={() => {
                setEditForm(data.churchInfo);
                setIsEditModalOpen(true);
            }}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-colors opacity-0 group-hover:opacity-100"
            title="Modifier les infos de l'église"
        >
            <Pencil size={20} />
        </button>
        
        <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg text-white overflow-hidden bg-slate-100">
                {data.churchInfo.logo ? (
                    <img src={data.churchInfo.logo} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                    <Church size={48} />
                )}
            </div>
            <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl font-bold text-slate-800">{data.churchInfo.name || "Mon Église"}</h1>
                <p className="text-slate-500 mt-2 italic">{data.churchInfo.slogan}</p>
                <div className="mt-4 flex gap-4 justify-center md:justify-start">
                    <span className="text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100">
                        ID: {data.churchInfo.idRef || 'Non défini'}
                    </span>
                    <span className="text-xs font-semibold px-3 py-1 bg-green-50 text-green-700 rounded-full border border-green-100">
                        Statut: Actif
                    </span>
                </div>
            </div>
        </div>
      </div>

      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Aperçu Global</h2>
        </div>
        <button 
          onClick={handleGenerateReport}
          disabled={loading}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 shadow-md transition-all disabled:opacity-70"
        >
          {loading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
          {loading ? 'Génération...' : 'Rapport IA'}
        </button>
      </div>

      {report && (
        <div className="bg-white border-l-4 border-indigo-500 p-6 rounded-r-xl shadow-md animate-fade-in">
          <div className="flex items-center gap-2 mb-3 text-indigo-700 font-semibold">
            <FileText size={20} />
            <h3>Rapport Généré par IA</h3>
          </div>
          <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap">
            {report}
          </div>
          <button onClick={() => setReport(null)} className="text-sm text-slate-400 mt-4 hover:text-slate-600 underline">Fermer le rapport</button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 font-medium">Membres Totaux</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{data.members.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 font-medium">Solde Financier</p>
          <p className={`text-3xl font-bold mt-2 ${totalIncome - totalExpense >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
            {(totalIncome - totalExpense).toLocaleString()} €
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 font-medium">Actifs Matériels</p>
          <p className="text-3xl font-bold text-slate-900 mt-2">{data.assets.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
           <p className="text-sm text-slate-500 font-medium">Ministères</p>
           <p className="text-3xl font-bold text-slate-900 mt-2">{data.ministries?.length || 0}</p>
        </div>
      </div>

      {/* Attendance Chart (New Section) */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="text-indigo-600" size={20} />
                Évolution de la Fréquentation (Moyenne Mensuelle)
            </h3>
            {attendanceData.length === 0 && (
                <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded">
                    Aucune donnée disponible. Remplissez les fiches dans "Planning".
                </span>
            )}
        </div>
        <div className="h-64">
             <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorMoyenne" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number, name: string) => [
                            name === 'moyenne' ? `${value} pers.` : name === 'total' ? `${value} (cumul)` : value,
                            name === 'moyenne' ? 'Moyenne / Événement' : name === 'total' ? 'Total Participants' : name
                        ]}
                        labelStyle={{ fontWeight: 'bold', color: '#1e293b' }}
                    />
                    <Area 
                        type="monotone" 
                        dataKey="moyenne" 
                        stroke="#6366f1" 
                        strokeWidth={3}
                        fillOpacity={1} 
                        fill="url(#colorMoyenne)" 
                        activeDot={{ r: 6 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Financial Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Répartition Financière</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={financialData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `${value} €`} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {financialData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Members Role Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Répartition des Rôles</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={roleData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                paddingAngle={5}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {roleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Life of Church Section: Events, Birthdays, and Families */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Upcoming Events List */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Calendar className="text-indigo-600" size={20} />
                  Prochains Événements
              </h3>
              {upcomingEvents.length > 0 ? (
                  <div className="space-y-4">
                      {upcomingEvents.map(event => {
                          const eventAssets = data.assets.filter(a => event.usedAssetIds?.includes(a.id));
                          
                          return (
                          <div key={event.id} className="flex gap-4 items-start pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                              <div className="bg-indigo-50 text-indigo-700 rounded-lg p-2 text-center min-w-[60px]">
                                  <div className="text-xs font-bold uppercase">{new Date(event.date).toLocaleDateString('fr-FR', { month: 'short' })}</div>
                                  <div className="text-xl font-bold">{new Date(event.date).getDate()}</div>
                              </div>
                              <div className="flex-1">
                                  <h4 className="font-semibold text-slate-800">{event.title}</h4>
                                  <div className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                                      <span>{event.time}</span>
                                      <span>•</span>
                                      <span className="flex items-center gap-1"><MapPin size={12}/> {event.location}</span>
                                  </div>
                                  
                                  {/* Matériel utilisé */}
                                  {eventAssets.length > 0 && (
                                    <div className="flex items-start gap-2 mt-2 pt-2 border-t border-slate-100">
                                        <Box size={14} className="text-slate-400 mt-0.5 shrink-0" />
                                        <div className="flex flex-wrap gap-1">
                                            {eventAssets.map(asset => (
                                                <span key={asset.id} className="text-[10px] bg-orange-50 text-orange-700 px-2 py-0.5 rounded border border-orange-100 truncate max-w-[120px]">
                                                    {asset.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                  )}
                              </div>
                          </div>
                      )})}
                  </div>
              ) : (
                  <p className="text-slate-500 text-sm italic">Aucun événement planifié prochainement.</p>
              )}
          </div>

          {/* Celebrations */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Cake className="text-pink-500" size={20} />
                  Célébrations à venir (30j)
              </h3>
              {upcomingCelebrations.length > 0 ? (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                      {upcomingCelebrations.map(cel => (
                          <div key={cel.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                              <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-full ${cel.type === 'birthday' ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
                                      {cel.type === 'birthday' ? <Cake size={18} /> : <CalendarHeart size={18} />}
                                  </div>
                                  <div>
                                      <div className="font-medium text-slate-800">{cel.memberName}</div>
                                      <div className="text-xs text-slate-500">
                                          {cel.type === 'birthday' ? 'Anniversaire' : `${cel.years} an(s)`}
                                      </div>
                                  </div>
                              </div>
                              <div className="text-sm font-semibold text-slate-600">
                                  {cel.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                              </div>
                          </div>
                      ))}
                  </div>
              ) : (
                  <div className="text-center py-8 text-slate-500">
                      <Cake className="mx-auto mb-2 opacity-20" size={40} />
                      <p>Aucune célébration prévue ce mois-ci.</p>
                  </div>
              )}
          </div>

          {/* Family Stats */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <Users className="text-emerald-500" size={20} />
                  Répartition par Famille
              </h3>
              {sortedFamilies.length > 0 ? (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                      {sortedFamilies.map(({name, count}) => (
                          <div key={name} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors">
                              <span className="font-medium text-slate-700">{name}</span>
                              <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full text-xs font-bold">
                                  {count} membre{count > 1 ? 's' : ''}
                              </span>
                          </div>
                      ))}
                  </div>
              ) : (
                  <p className="text-slate-500 text-sm italic text-center py-8">
                      Aucune donnée familiale disponible.
                  </p>
              )}
          </div>
      </div>

      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold mb-4">Modifier les informations de l'église</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
                
                <div className="flex justify-center mb-4">
                    <div className="relative group cursor-pointer">
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center">
                            {editForm.logo ? (
                                <img src={editForm.logo} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center text-slate-400">
                                    <ImageIcon size={32} className="mx-auto" />
                                    <span className="text-xs">Logo</span>
                                </div>
                            )}
                        </div>
                        <input 
                            type="file" 
                            accept="image/*"
                            onChange={handleLogoChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="absolute bottom-0 right-0 bg-indigo-600 text-white p-1 rounded-full shadow-sm">
                            <Upload size={14} />
                        </div>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nom de l'église</label>
                    <input 
                        required
                        className="p-2 border rounded-lg w-full"
                        value={editForm.name}
                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Slogan / Verset</label>
                    <textarea 
                        className="p-2 border rounded-lg w-full"
                        rows={2}
                        value={editForm.slogan}
                        onChange={e => setEditForm({...editForm, slogan: e.target.value})}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Identifiant / Référence</label>
                    <input 
                        className="p-2 border rounded-lg w-full"
                        value={editForm.idRef}
                        onChange={e => setEditForm({...editForm, idRef: e.target.value})}
                    />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Enregistrer</button>
                </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};