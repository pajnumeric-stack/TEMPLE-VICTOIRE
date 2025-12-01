

import React, { useState, useEffect } from 'react';
import { AppData, CalendarEvent, Member, Asset } from '../types';
import { Plus, Calendar, Clock, MapPin, Edit2, Trash2, X, QrCode, ScanLine, Users, CheckCircle, Box } from 'lucide-react';
import QRCode from "react-qr-code";

interface EventsProps {
  data: AppData;
  onAddEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  onUpdateEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (id: string) => void;
  onMarkPresence: (eventId: string, memberId: string) => void;
  onMarkAssetUsage?: (eventId: string, assetId: string) => void;
}

export const Events: React.FC<EventsProps> = ({ data, onAddEvent, onUpdateEvent, onDeleteEvent, onMarkPresence, onMarkAssetUsage }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Scanner Modal State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);
  const [lastScannedMember, setLastScannedMember] = useState<Member | null>(null);
  const [lastScannedAsset, setLastScannedAsset] = useState<Asset | null>(null);
  const [scanFeedback, setScanFeedback] = useState<string>('');
  
  const [formData, setFormData] = useState<Omit<CalendarEvent, 'id'>>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00',
    description: '',
    type: 'Culte',
    location: ''
  });

  // Sort events by date (descending)
  const sortedEvents = [...data.events].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleOpenModal = (event?: CalendarEvent) => {
    if (event) {
      setFormData(event);
      setEditingId(event.id);
    } else {
      setFormData({
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: '10:00',
        description: '',
        type: 'Culte',
        location: ''
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleOpenScanner = (event: CalendarEvent) => {
      setActiveEvent(event);
      setLastScannedMember(null);
      setLastScannedAsset(null);
      setScanFeedback('');
      setIsScannerOpen(true);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdateEvent({ ...formData, id: editingId });
    } else {
      onAddEvent(formData);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet événement ?")) {
      onDeleteEvent(id);
    }
  };

  const getAttendanceCount = (eventId: string) => {
      const record = data.attendance.find(a => a.eventId === eventId);
      if (!record) return 0;
      return (record.presentMemberIds?.length || 0) + (record.visitorCount || 0);
  }

  // Scanner Logic
  useEffect(() => {
    if (!isScannerOpen || !activeEvent) return;

    let isMounted = true;
    let html5QrCode: any = null;
    const elementId = "event-qr-reader";

    const startScanner = async () => {
         // @ts-ignore
         if (typeof Html5Qrcode === 'undefined') {
             console.error("Html5Qrcode library not loaded");
             return;
         }
         
         if (!document.getElementById(elementId)) {
             if (isMounted) setTimeout(startScanner, 100);
             return;
         }

         try {
            // @ts-ignore
            html5QrCode = new Html5Qrcode(elementId);
            
            await html5QrCode.start(
                { facingMode: "environment" },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText: string) => {
                    if (!isMounted) return;
                    
                    try {
                        // Attempt to parse JSON
                        const scannedData = JSON.parse(decodedText);
                        
                        // 1. Check for MEMBER QR (userId)
                        if (scannedData.userId) {
                            const member = data.members.find(m => m.id === scannedData.userId);
                            if (member) {
                                // Mark presence
                                onMarkPresence(activeEvent.id, member.id);
                                setLastScannedMember(member);
                                setLastScannedAsset(null);
                                setScanFeedback(`Présence confirmée : ${member.firstName} ${member.lastName}`);
                            } else {
                                setScanFeedback("Membre non trouvé");
                            }
                        } 
                        // 2. Check for ASSET QR (assetId)
                        else if (scannedData.assetId) {
                            const asset = data.assets.find(a => a.id === scannedData.assetId);
                            if (asset) {
                                if (onMarkAssetUsage) {
                                    onMarkAssetUsage(activeEvent.id, asset.id);
                                    setLastScannedAsset(asset);
                                    setLastScannedMember(null);
                                    setScanFeedback(`Matériel identifié : ${asset.name}`);
                                }
                            } else {
                                setScanFeedback("Matériel non trouvé");
                            }
                        }

                        // Reset feedback after a delay
                        setTimeout(() => {
                            if(isMounted) setScanFeedback('');
                        }, 3000);

                    } catch (e) {
                        // Not JSON or invalid format
                    }
                },
                (errorMessage: string) => {}
            );
         } catch (err) {
             console.error("Error starting scanner", err);
         }
    };

    startScanner();

    return () => {
        isMounted = false;
        if (html5QrCode) {
            html5QrCode.stop().then(() => {
                try { html5QrCode.clear(); } catch(e) {}
            }).catch((err: any) => {});
        }
    }
  }, [isScannerOpen, activeEvent, data.members, data.assets, onMarkPresence, onMarkAssetUsage]);

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Événements</h2>
          <p className="text-slate-500 mt-1">Planification des cultes et activités</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all"
        >
          <Plus size={20} />
          Créer un événement
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedEvents.map(event => {
            const isPast = new Date(event.date + 'T' + event.time) < new Date();
            const attendance = getAttendanceCount(event.id);
            const usedAssetsCount = event.usedAssetIds?.length || 0;

            return (
                <div key={event.id} className={`bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col hover:shadow-md transition-shadow ${isPast ? 'opacity-75' : ''}`}>
                    <div className="flex justify-between items-start mb-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            event.type === 'Culte' ? 'bg-indigo-100 text-indigo-700' :
                            event.type === 'Réunion' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-slate-100 text-slate-700'
                        }`}>
                            {event.type}
                        </span>
                        <div className="flex gap-1">
                            <button 
                                onClick={() => handleOpenModal(event)}
                                className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-indigo-600 rounded transition-colors"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button 
                                onClick={() => handleDelete(event.id)}
                                className="p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-600 rounded transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mb-2">{event.title}</h3>
                    
                    <div className="space-y-2 mb-4 text-sm text-slate-600 flex-1">
                        <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-indigo-500" />
                            <span>{new Date(event.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock size={14} className="text-indigo-500" />
                            <span>{event.time}</span>
                        </div>
                        {event.location && (
                            <div className="flex items-center gap-2">
                                <MapPin size={14} className="text-indigo-500" />
                                <span>{event.location}</span>
                            </div>
                        )}
                        
                        <div className="flex flex-col gap-1 mt-3 pt-3 border-t border-slate-100">
                             <div className="flex items-center gap-2 text-slate-600">
                                 <Users size={14} className="text-slate-400" />
                                 <span className="font-semibold">{attendance} présent(s)</span>
                             </div>
                             {usedAssetsCount > 0 && (
                                <div className="flex items-center gap-2 text-slate-600">
                                     <Box size={14} className="text-slate-400" />
                                     <span className="font-semibold">{usedAssetsCount} équipement(s) utilisé(s)</span>
                                </div>
                             )}
                         </div>
                    </div>
                    
                    <button 
                        onClick={() => handleOpenScanner(event)}
                        className="w-full mt-2 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
                    >
                        <QrCode size={16} />
                        QR / Pointage
                    </button>
                </div>
            );
        })}
      </div>

      {/* MODAL: QR Scanner & Check-in */}
      {isScannerOpen && activeEvent && (
          <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-[60] p-4">
              <div className="w-full max-w-4xl bg-white rounded-2xl overflow-hidden relative flex flex-col md:flex-row h-[80vh]">
                  <button 
                    onClick={() => setIsScannerOpen(false)}
                    className="absolute top-4 right-4 z-20 bg-black/10 text-slate-600 p-2 rounded-full hover:bg-black/20"
                  >
                      <X size={24} />
                  </button>

                  {/* Left Panel: Scanner */}
                  <div className="w-full md:w-1/2 bg-black relative flex flex-col">
                      <div id="event-qr-reader" className="w-full h-full object-cover"></div>
                      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-4 text-white text-center">
                          <ScanLine className="mx-auto mb-2 animate-pulse" />
                          <p className="text-sm font-medium">Scannez le QR Code (Membre ou Matériel)</p>
                      </div>
                      
                      {/* Scan Success Feedback Overlay */}
                      {scanFeedback && (
                          <div className="absolute inset-0 bg-green-500/90 flex flex-col items-center justify-center text-white z-10 animate-fade-in">
                              <CheckCircle size={64} className="mb-4" />
                              <h3 className="text-2xl font-bold text-center px-4">{scanFeedback}</h3>
                          </div>
                      )}
                  </div>

                  {/* Right Panel: Event Info & Stats */}
                  <div className="w-full md:w-1/2 p-8 flex flex-col bg-slate-50">
                      <div className="mb-6">
                          <h3 className="text-2xl font-bold text-slate-800">{activeEvent.title}</h3>
                          <p className="text-slate-500">{new Date(activeEvent.date).toLocaleDateString()} à {activeEvent.time}</p>
                      </div>

                      <div className="flex-1 flex flex-col items-center justify-center space-y-6">
                          {/* Live Counter */}
                          <div className="text-center">
                              <span className="text-slate-400 uppercase text-sm font-bold tracking-wider">Total Présents</span>
                              <div className="text-7xl font-bold text-indigo-600 mt-2">
                                  {getAttendanceCount(activeEvent.id)}
                              </div>
                          </div>

                          <div className="w-full grid grid-cols-2 gap-4">
                                <div className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 text-center">
                                    <span className="block text-xs text-slate-500 uppercase font-bold">Matériel Utilisé</span>
                                    <span className="block text-2xl font-bold text-orange-600">{activeEvent.usedAssetIds?.length || 0}</span>
                                </div>
                          </div>

                          {/* Last Scanned Member Info */}
                          {lastScannedMember && (
                              <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100 w-full animate-bounce-short">
                                  <p className="text-xs text-green-600 font-bold uppercase mb-1">Dernier scan (Membre)</p>
                                  <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                                          {lastScannedMember.firstName[0]}
                                      </div>
                                      <div>
                                          <div className="font-bold text-slate-800">{lastScannedMember.firstName} {lastScannedMember.lastName}</div>
                                          <div className="text-xs text-slate-500">{new Date().toLocaleTimeString()}</div>
                                      </div>
                                  </div>
                              </div>
                          )}

                          {/* Last Scanned Asset Info */}
                          {lastScannedAsset && (
                              <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-100 w-full animate-bounce-short">
                                  <p className="text-xs text-orange-600 font-bold uppercase mb-1">Dernier scan (Matériel)</p>
                                  <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">
                                          <Box size={20} />
                                      </div>
                                      <div>
                                          <div className="font-bold text-slate-800">{lastScannedAsset.name}</div>
                                          <div className="text-xs text-slate-500">{lastScannedAsset.category}</div>
                                      </div>
                                  </div>
                              </div>
                          )}

                          {/* Event QR Code (Passive) */}
                          <div className="mt-auto pt-8 border-t border-slate-200 w-full flex flex-col items-center">
                              <p className="text-xs text-slate-400 mb-2">Code de l'événement</p>
                              <div className="bg-white p-2 rounded shadow-sm">
                                  <QRCode value={JSON.stringify({eventId: activeEvent.id, title: activeEvent.title})} size={80} />
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex justify-between items-center mb-4 border-b pb-3">
                <h3 className="text-xl font-bold text-slate-800">
                    {editingId ? 'Modifier l\'événement' : 'Nouvel événement'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={24} />
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Titre de l'événement</label>
                <input 
                  required
                  placeholder="Ex: Culte de Louange"
                  className="p-2 border border-slate-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                    <select 
                        className="p-2 border border-slate-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                        value={formData.type}
                        onChange={e => setFormData({...formData, type: e.target.value})}
                    >
                        <option value="Culte">Culte</option>
                        <option value="Réunion">Réunion</option>
                        <option value="Répétition">Répétition</option>
                        <option value="Enseignement">Enseignement</option>
                        <option value="Autre">Autre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Lieu</label>
                    <input 
                      placeholder="Ex: Sanctuaire"
                      className="p-2 border border-slate-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={formData.location}
                      onChange={e => setFormData({...formData, location: e.target.value})}
                    />
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                    <input 
                      type="date"
                      required
                      className="p-2 border border-slate-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={formData.date}
                      onChange={e => setFormData({...formData, date: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Heure</label>
                    <input 
                      type="time"
                      required
                      className="p-2 border border-slate-300 rounded-lg w-full focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      value={formData.time}
                      onChange={e => setFormData({...formData, time: e.target.value})}
                    />
                  </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optionnel)</label>
                <textarea 
                  placeholder="Détails supplémentaires..."
                  className="p-2 border border-slate-300 rounded-lg w-full h-24 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm">
                    {editingId ? 'Mettre à jour' : 'Créer l\'événement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};