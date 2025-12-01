
import React, { useState, useEffect } from 'react';
import { AppData, CalendarEvent, AttendanceRecord, Member } from '../types';
import { Calendar as CalendarIcon, CheckSquare, Users, ChevronLeft, ChevronRight, Search, Save, UserPlus, FileText, CheckCircle, XCircle, UserCheck, UserX } from 'lucide-react';

interface PlanningProps {
  data: AppData;
  onAddEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  onUpdateEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (id: string) => void;
  onAddAttendance: (record: AttendanceRecord) => void;
}

export const Planning: React.FC<PlanningProps> = ({ data, onAddEvent, onUpdateEvent, onDeleteEvent, onAddAttendance }) => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'attendance'>('calendar');
  
  // --- Calendar State ---
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // --- Attendance State ---
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [presentMemberIds, setPresentMemberIds] = useState<string[]>([]);
  const [absentMemberIds, setAbsentMemberIds] = useState<string[]>([]); // New state for absences
  const [visitorCount, setVisitorCount] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [memberSearch, setMemberSearch] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

  // Load attendance data when an event is selected
  useEffect(() => {
    if (selectedEventId) {
      const existingRecord = data.attendance.find(a => a.eventId === selectedEventId);
      if (existingRecord) {
        setPresentMemberIds(existingRecord.presentMemberIds || []);
        setAbsentMemberIds(existingRecord.absentMemberIds || []);
        setVisitorCount(existingRecord.visitorCount || 0);
        setNotes(existingRecord.notes || '');
      } else {
        setPresentMemberIds([]);
        setAbsentMemberIds([]);
        setVisitorCount(0);
        setNotes('');
      }
      setSaveStatus('idle');
    }
  }, [selectedEventId, data.attendance]);

  // --- Calendar Logic ---
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
    return { days, firstDay };
  };

  const { days, firstDay } = getDaysInMonth(currentDate);
  // Adjust firstDay to start on Monday (1) instead of Sunday (0) for French context
  const adjustedFirstDay = firstDay === 0 ? 6 : firstDay - 1; 

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate.setMonth(currentDate.getMonth() + offset));
    setCurrentDate(new Date(newDate));
  };

  const getEventsForDay = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toISOString().split('T')[0]; 
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day, 12).toISOString().split('T')[0];
    return data.events.filter(e => e.date === checkDate);
  };

  // --- Attendance Logic ---
  const setMemberStatus = (memberId: string, status: 'present' | 'absent' | 'none') => {
      setSaveStatus('idle');
      if (status === 'present') {
          // Add to present, remove from absent
          setPresentMemberIds(prev => [...new Set([...prev, memberId])]);
          setAbsentMemberIds(prev => prev.filter(id => id !== memberId));
      } else if (status === 'absent') {
          // Add to absent, remove from present
          setAbsentMemberIds(prev => [...new Set([...prev, memberId])]);
          setPresentMemberIds(prev => prev.filter(id => id !== memberId));
      } else {
          // Remove from both
          setPresentMemberIds(prev => prev.filter(id => id !== memberId));
          setAbsentMemberIds(prev => prev.filter(id => id !== memberId));
      }
  };

  const markAll = (status: 'present' | 'absent') => {
      setSaveStatus('idle');
      const allIds = filteredMembers.map(m => m.id);
      if (status === 'present') {
          setPresentMemberIds(prev => [...new Set([...prev, ...allIds])]);
          setAbsentMemberIds(prev => prev.filter(id => !allIds.includes(id)));
      } else {
          setAbsentMemberIds(prev => [...new Set([...prev, ...allIds])]);
          setPresentMemberIds(prev => prev.filter(id => !allIds.includes(id)));
      }
  };

  const handleSaveAttendance = () => {
    if (!selectedEventId) return;
    
    // Find event date for the record
    const evt = data.events.find(e => e.id === selectedEventId);
    
    onAddAttendance({
      eventId: selectedEventId,
      date: evt ? evt.date : new Date().toISOString().split('T')[0],
      presentMemberIds,
      absentMemberIds,
      visitorCount,
      notes
    });
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const filteredMembers = data.members.filter(m => 
    m.lastName.toLowerCase().includes(memberSearch.toLowerCase()) ||
    m.firstName.toLowerCase().includes(memberSearch.toLowerCase())
  );

  // Sort events for dropdown (most recent first)
  const sortedEvents = [...data.events].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Stats
  const totalMarked = presentMemberIds.length + absentMemberIds.length;
  const participationRate = totalMarked > 0 ? Math.round((presentMemberIds.length / totalMarked) * 100) : 0;

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-3xl font-bold text-slate-800">Planning & Présences</h2>
            <p className="text-slate-500 mt-1">Gérez le calendrier et suivez l'assiduité de l'église</p>
        </div>
        
        <div className="bg-white p-1 rounded-lg border border-slate-200 flex shadow-sm">
            <button
                onClick={() => setActiveTab('calendar')}
                className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${activeTab === 'calendar' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
                <CalendarIcon size={18} />
                Calendrier
            </button>
            <button
                onClick={() => setActiveTab('attendance')}
                className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${activeTab === 'attendance' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
                <CheckSquare size={18} />
                Suivi Présences
            </button>
        </div>
      </div>

      {activeTab === 'calendar' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800 capitalize">
                    {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex gap-2">
                    <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-full border border-slate-200">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-full border border-slate-200">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-px bg-slate-200 border border-slate-200 rounded-lg overflow-hidden">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(day => (
                    <div key={day} className="bg-slate-50 p-2 text-center text-xs font-semibold text-slate-500 uppercase">
                        {day}
                    </div>
                ))}
                
                {Array.from({ length: adjustedFirstDay }).map((_, i) => (
                    <div key={`empty-${i}`} className="bg-white min-h-[100px]" />
                ))}

                {Array.from({ length: days }).map((_, i) => {
                    const day = i + 1;
                    const dayEvents = getEventsForDay(day);
                    const isToday = new Date().getDate() === day && new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();
                    
                    return (
                        <div key={day} className={`bg-white min-h-[100px] p-2 hover:bg-slate-50 transition-colors ${isToday ? 'bg-indigo-50/30' : ''}`}>
                            <div className={`text-sm font-medium mb-1 ${isToday ? 'text-indigo-600' : 'text-slate-700'}`}>
                                {day}
                            </div>
                            <div className="space-y-1">
                                {dayEvents.map(evt => (
                                    <div key={evt.id} className="text-xs p-1 rounded bg-indigo-100 text-indigo-700 truncate" title={evt.title}>
                                        {evt.time} {evt.title}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Panel: Event Selection & Stats */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Sélectionner un événement</label>
                    <select 
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                    >
                        <option value="">-- Choisir --</option>
                        {sortedEvents.map(evt => (
                            <option key={evt.id} value={evt.id}>
                                {evt.date} - {evt.title} ({evt.type})
                            </option>
                        ))}
                    </select>

                    {selectedEventId && (
                        <div className="mt-6 space-y-4">
                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center">
                                <span className="block text-sm text-slate-500 font-medium">Participation Globale</span>
                                <div className="flex items-end justify-center gap-2 mt-1">
                                    <span className="text-4xl font-bold text-indigo-600">
                                        {presentMemberIds.length + visitorCount}
                                    </span>
                                    <span className="text-sm text-slate-400 mb-1">personnes</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div className="bg-green-50 p-2 rounded-lg border border-green-100 text-center">
                                    <span className="block text-[10px] text-green-600 uppercase font-bold">Présents</span>
                                    <span className="block text-lg font-bold text-green-700">{presentMemberIds.length}</span>
                                </div>
                                <div className="bg-red-50 p-2 rounded-lg border border-red-100 text-center">
                                    <span className="block text-[10px] text-red-600 uppercase font-bold">Absents</span>
                                    <span className="block text-lg font-bold text-red-700">{absentMemberIds.length}</span>
                                </div>
                                <div className="bg-blue-50 p-2 rounded-lg border border-blue-100 text-center">
                                    <span className="block text-[10px] text-blue-600 uppercase font-bold">Visiteurs</span>
                                    <span className="block text-lg font-bold text-blue-700">{visitorCount}</span>
                                </div>
                            </div>

                            {totalMarked > 0 && (
                                <div className="text-xs text-center text-slate-500">
                                    Taux de présence membres : <span className="font-bold">{participationRate}%</span>
                                </div>
                            )}
                            
                            <div className="pt-4 border-t border-slate-100">
                                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                    <UserPlus size={16} /> Compteur Visiteurs
                                </label>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => setVisitorCount(Math.max(0, visitorCount - 1))}
                                        className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600"
                                    >
                                        -
                                    </button>
                                    <input 
                                        type="number" 
                                        className="flex-1 text-center p-2 border border-slate-300 rounded-lg"
                                        value={visitorCount}
                                        onChange={(e) => setVisitorCount(Math.max(0, parseInt(e.target.value) || 0))}
                                    />
                                    <button 
                                        onClick={() => setVisitorCount(visitorCount + 1)}
                                        className="w-10 h-10 rounded-full bg-indigo-100 hover:bg-indigo-200 flex items-center justify-center font-bold text-indigo-600"
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                                    <FileText size={16} /> Notes / Remarques
                                </label>
                                <textarea 
                                    className="w-full p-2 border border-slate-300 rounded-lg text-sm h-24"
                                    placeholder="Ex: Prédication par Pasteur Jean, pluie torrentielle..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>

                            <button 
                                onClick={handleSaveAttendance}
                                className={`w-full py-3 rounded-lg flex items-center justify-center gap-2 font-bold shadow-md transition-all ${
                                    saveStatus === 'saved' 
                                    ? 'bg-green-600 hover:bg-green-700 text-white' 
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                }`}
                            >
                                {saveStatus === 'saved' ? <CheckCircle size={20} /> : <Save size={20} />}
                                {saveStatus === 'saved' ? 'Enregistré !' : 'Enregistrer la fiche'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Panel: Member List */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col h-[700px]">
                {!selectedEventId ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400">
                        <CalendarIcon size={48} className="mb-4 opacity-50" />
                        <p className="text-lg">Veuillez sélectionner un événement pour faire l'appel.</p>
                    </div>
                ) : (
                    <>
                        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Users size={20} className="text-indigo-600" />
                                    Liste des Membres
                                </h3>
                                <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full">{filteredMembers.length}</span>
                            </div>
                            
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => markAll('present')}
                                    className="text-xs flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1.5 rounded hover:bg-green-100 transition-colors"
                                >
                                    <UserCheck size={14} /> Tout Présent
                                </button>
                                <button 
                                    onClick={() => markAll('absent')}
                                    className="text-xs flex items-center gap-1 bg-red-50 text-red-700 px-2 py-1.5 rounded hover:bg-red-100 transition-colors"
                                >
                                    <UserX size={14} /> Tout Absent
                                </button>
                            </div>
                        </div>
                        
                        <div className="relative w-full mb-4">
                            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                            <input 
                                type="text"
                                placeholder="Chercher un membre..."
                                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={memberSearch}
                                onChange={(e) => setMemberSearch(e.target.value)}
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                            {filteredMembers.map(member => {
                                const isPresent = presentMemberIds.includes(member.id);
                                const isAbsent = absentMemberIds.includes(member.id);
                                
                                return (
                                    <div 
                                        key={member.id}
                                        className={`p-3 rounded-lg border transition-all flex items-center justify-between ${
                                            isPresent 
                                            ? 'bg-green-50 border-green-200' 
                                            : isAbsent 
                                                ? 'bg-red-50 border-red-200' 
                                                : 'bg-white border-slate-100'
                                        }`}
                                    >
                                        <div className="flex-1">
                                            <div className={`font-medium ${
                                                isPresent ? 'text-green-900' : isAbsent ? 'text-red-900' : 'text-slate-700'
                                            }`}>
                                                {member.firstName} {member.lastName}
                                            </div>
                                            {member.familyName && (
                                                <div className="text-xs text-slate-500">{member.familyName}</div>
                                            )}
                                        </div>

                                        <div className="flex bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
                                            <button 
                                                onClick={() => setMemberStatus(member.id, 'present')}
                                                className={`p-1.5 rounded flex items-center gap-1 text-xs font-semibold transition-all ${
                                                    isPresent 
                                                    ? 'bg-green-600 text-white shadow-sm' 
                                                    : 'text-slate-500 hover:bg-slate-50'
                                                }`}
                                                title="Marquer Présent"
                                            >
                                                <CheckCircle size={16} />
                                                <span className="hidden sm:inline">Présent</span>
                                            </button>
                                            <div className="w-px bg-slate-200 mx-1 my-0.5"></div>
                                            <button 
                                                onClick={() => setMemberStatus(member.id, 'absent')}
                                                className={`p-1.5 rounded flex items-center gap-1 text-xs font-semibold transition-all ${
                                                    isAbsent 
                                                    ? 'bg-red-600 text-white shadow-sm' 
                                                    : 'text-slate-500 hover:bg-slate-50'
                                                }`}
                                                title="Marquer Absent"
                                            >
                                                <XCircle size={16} />
                                                <span className="hidden sm:inline">Absent</span>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                            {filteredMembers.length === 0 && (
                                <p className="text-center text-slate-500 mt-10">Aucun membre trouvé.</p>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
      )}
    </div>
  );
};
