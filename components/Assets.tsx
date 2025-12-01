

import React, { useState } from 'react';
import { Asset, AssetStatus, AppData, AssetLog } from '../types';
import { Plus, Search, Box, Download, Edit2, ArrowRightCircle, ArrowLeftCircle, History, Package, Settings, Trash2, Calendar, User, MapPin, QrCode, Printer, X } from 'lucide-react';
import { exportToCSV } from '../services/exportService';
import QRCode from "react-qr-code";

interface AssetsProps {
  data: AppData;
  onAddAsset: (asset: Omit<Asset, 'id'>) => void;
  onUpdateAsset?: (asset: Asset) => void;
  onToggleBorrow: (assetId: string, action: 'CHECK_OUT' | 'CHECK_IN', details: { memberName: string, date: string, location: string }) => void;
  onAddCategory: (category: string) => void;
  onDeleteCategory: (category: string) => void;
  onAddLog?: (log: Omit<AssetLog, 'id'>) => void;
  onDeleteLog?: (logId: string) => void;
}

export const Assets: React.FC<AssetsProps> = ({ data, onAddAsset, onUpdateAsset, onToggleBorrow, onAddCategory, onDeleteCategory, onAddLog, onDeleteLog }) => {
  const [activeTab, setActiveTab] = useState<'inventory' | 'history'>('inventory');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  
  // QR Code State
  const [selectedQrAsset, setSelectedQrAsset] = useState<Asset | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [newCategoryName, setNewCategoryName] = useState('');

  // State for adding/editing assets
  const [assetForm, setAssetForm] = useState({
    name: '',
    category: '',
    value: 0,
    status: AssetStatus.GOOD,
    location: '',
    purchaseDate: new Date().toISOString().split('T')[0]
  });

  // State for Borrow/Return forms
  const [actionForm, setActionForm] = useState({
      memberName: '',
      date: new Date().toISOString().split('T')[0],
      location: ''
  });

  // State for Manual Log Entry
  const [logForm, setLogForm] = useState({
      // Fix: Removed restrictive type casting to allow other action types (like MAINTENANCE)
      action: 'CHECK_OUT', 
      date: new Date().toISOString().split('T')[0],
      assetId: '',
      memberName: '',
      location: ''
  });

  const filteredAssets = data.assets.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedLogs = [...data.assetLogs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // --- Asset CRUD Handlers ---

  const handleOpenAddModal = () => {
      setAssetForm({
        name: '',
        category: data.assetCategories[0] || 'Divers',
        value: 0,
        status: AssetStatus.GOOD,
        location: '',
        purchaseDate: new Date().toISOString().split('T')[0]
      });
      setEditingId(null);
      setIsModalOpen(true);
  };

  const handleOpenEditModal = (asset: Asset) => {
      setAssetForm({
          name: asset.name,
          category: asset.category,
          value: asset.value,
          status: asset.status,
          location: asset.location,
          purchaseDate: asset.purchaseDate
      });
      setEditingId(asset.id);
      setIsModalOpen(true);
  }

  const handleAssetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId && onUpdateAsset) {
        onUpdateAsset({ ...assetForm, id: editingId });
    } else {
        onAddAsset(assetForm);
    }
    setIsModalOpen(false);
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(newCategoryName.trim()) {
          onAddCategory(newCategoryName.trim());
          setNewCategoryName('');
      }
  }

  // --- Borrow/Return Handlers ---

  const handleOpenBorrowModal = (asset: Asset) => {
      setSelectedAsset(asset);
      setActionForm({
          memberName: '',
          date: new Date().toISOString().split('T')[0],
          location: ''
      });
      setIsBorrowModalOpen(true);
  }

  const handleOpenReturnModal = (asset: Asset) => {
      setSelectedAsset(asset);
      setActionForm({
          memberName: asset.borrowedBy || '',
          date: new Date().toISOString().split('T')[0],
          location: asset.location || 'Stockage' // Default return location
      });
      setIsReturnModalOpen(true);
  }

  const handleBorrowSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedAsset) {
          onToggleBorrow(selectedAsset.id, 'CHECK_OUT', {
              memberName: actionForm.memberName,
              date: actionForm.date,
              location: actionForm.location
          });
          setIsBorrowModalOpen(false);
      }
  }

  const handleReturnSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (selectedAsset) {
          onToggleBorrow(selectedAsset.id, 'CHECK_IN', {
              memberName: selectedAsset.borrowedBy || 'Inconnu', // Log who returned it
              date: actionForm.date,
              location: actionForm.location // Where it is being stored now
          });
          // Also update the asset location permanently to where it was returned
          if(onUpdateAsset) {
              onUpdateAsset({...selectedAsset, location: actionForm.location, isBorrowed: false});
          }
          setIsReturnModalOpen(false);
      }
  }

  // --- Manual Log Handlers ---
  const handleOpenLogModal = () => {
      setLogForm({
          action: 'CHECK_OUT',
          date: new Date().toISOString().split('T')[0],
          assetId: data.assets[0]?.id || '',
          memberName: '',
          location: ''
      });
      setIsLogModalOpen(true);
  }

  const handleLogSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(onAddLog && logForm.assetId) {
          const assetName = data.assets.find(a => a.id === logForm.assetId)?.name || 'Inconnu';
          onAddLog({
              assetId: logForm.assetId,
              assetName: assetName,
              action: logForm.action,
              date: logForm.date,
              memberName: logForm.memberName,
              location: logForm.location
          });
          setIsLogModalOpen(false);
      }
  }

  // --- Export ---

  const handleExport = () => {
    const exportData = data.assets.map(a => ({
      'Nom': a.name,
      'Catégorie': a.category,
      'Valeur': a.value,
      'Date Achat': a.purchaseDate,
      'État': a.status,
      'Localisation': a.location,
      'Statut Emprunt': a.isBorrowed ? `Emprunté par ${a.borrowedBy}` : 'Disponible'
    }));
    exportToCSV(exportData, `inventaire_eglise_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-3xl font-bold text-slate-800">Gestion du Matériel</h2>
            <p className="text-slate-500 mt-1">Suivi des équipements, emprunts et retours</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsCategoryModalOpen(true)}
            className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all"
            title="Gérer les catégories"
          >
            <Settings size={20} />
            <span className="hidden sm:inline">Catégories</span>
          </button>
          <button 
            onClick={handleExport}
            className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all"
          >
            <Download size={20} />
            <span className="hidden sm:inline">Exporter</span>
          </button>
          {activeTab === 'inventory' ? (
              <button 
                onClick={handleOpenAddModal}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all"
              >
                <Plus size={20} />
                Ajouter un équipement
              </button>
          ) : (
              <button 
                onClick={handleOpenLogModal}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all"
              >
                <Plus size={20} />
                Nouveau Mouvement
              </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 font-medium uppercase">Valeur Totale</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {data.assets.reduce((sum, a) => sum + a.value, 0).toLocaleString()} €
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <p className="text-sm text-slate-500 font-medium uppercase">Total Inventaire</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{data.assets.length}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500 font-medium uppercase">Matériel Emprunté</p>
            <p className="text-2xl font-bold text-orange-600 mt-1">
                {data.assets.filter(a => a.isBorrowed).length}
            </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <p className="text-sm text-slate-500 font-medium uppercase">À réparer / HS</p>
            <p className="text-2xl font-bold text-red-600 mt-1">
                {data.assets.filter(a => a.status === AssetStatus.NEEDS_REPAIR || a.status === AssetStatus.BROKEN).length}
            </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white p-1 rounded-lg border border-slate-200 inline-flex shadow-sm mb-4">
            <button
                onClick={() => setActiveTab('inventory')}
                className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${activeTab === 'inventory' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
                <Package size={18} />
                Inventaire
            </button>
            <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
                <History size={18} />
                Historique Mouvements
            </button>
      </div>

      {activeTab === 'inventory' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
            <div className="relative mb-6">
            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
            <input 
                type="text"
                placeholder="Rechercher équipement par nom ou catégorie..."
                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            </div>

            <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                    <th className="px-6 py-3 text-sm font-semibold text-slate-600">Matériel</th>
                    <th className="px-6 py-3 text-sm font-semibold text-slate-600">Valeur</th>
                    <th className="px-6 py-3 text-sm font-semibold text-slate-600">Localisation / État</th>
                    <th className="px-6 py-3 text-sm font-semibold text-slate-600">Disponibilité</th>
                    <th className="px-6 py-3 text-sm font-semibold text-slate-600 text-right">Actions</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                {filteredAssets.map(asset => (
                    <tr key={asset.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-slate-100 p-2 rounded text-slate-500">
                                <Box size={20} />
                            </div>
                            <div>
                                <div className="font-medium text-slate-900">{asset.name}</div>
                                <div className="text-xs text-slate-500">{asset.category}</div>
                            </div>
                        </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{asset.value} €</td>
                    <td className="px-6 py-4">
                        <div className="text-sm text-slate-800">{asset.location}</div>
                        <span className={`text-[10px] font-bold uppercase tracking-wide
                        ${asset.status === AssetStatus.GOOD ? 'text-green-600' : 
                            asset.status === AssetStatus.NEEDS_REPAIR ? 'text-orange-600' : 'text-red-600'}`}>
                        {asset.status}
                        </span>
                    </td>
                    <td className="px-6 py-4">
                        {asset.isBorrowed ? (
                            <div className="bg-orange-50 border border-orange-100 p-2 rounded-lg">
                                <div className="text-xs text-orange-800 font-bold flex items-center gap-1 mb-1">
                                    <ArrowRightCircle size={12} /> Emprunté
                                </div>
                                <div className="text-xs text-orange-700">
                                    Par : <span className="font-semibold">{asset.borrowedBy}</span>
                                </div>
                                <div className="text-[10px] text-orange-600">
                                    Depuis : {new Date(asset.borrowDate || '').toLocaleDateString()}
                                </div>
                                {asset.usageLocation && (
                                     <div className="text-[10px] text-orange-600 truncate max-w-[120px]" title={asset.usageLocation}>
                                        À : {asset.usageLocation}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <ArrowLeftCircle size={12} />
                                Disponible
                            </span>
                        )}
                    </td>
                    <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                             <button 
                                onClick={() => setSelectedQrAsset(asset)}
                                className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 hover:text-indigo-600 rounded transition-colors text-slate-500"
                                title="QR Code Matériel"
                             >
                                <QrCode size={18} />
                             </button>
                            {asset.isBorrowed ? (
                                <button 
                                    onClick={() => handleOpenReturnModal(asset)}
                                    className="p-1.5 bg-white border border-slate-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 rounded transition-colors text-slate-500"
                                    title="Retourner le matériel"
                                >
                                    <ArrowLeftCircle size={18} />
                                </button>
                            ) : (
                                <button 
                                    onClick={() => handleOpenBorrowModal(asset)}
                                    className="p-1.5 bg-white border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 rounded transition-colors text-slate-500"
                                    title="Emprunter le matériel"
                                >
                                    <ArrowRightCircle size={18} />
                                </button>
                            )}
                            <button 
                                onClick={() => handleOpenEditModal(asset)}
                                className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 hover:text-indigo-600 rounded transition-colors text-slate-500"
                                title="Modifier"
                            >
                                <Edit2 size={18} />
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

      {activeTab === 'history' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg text-slate-800">Historique des Entrées / Sorties</h3>
                  {/* Button moved to top header for consistency */}
              </div>
              <div className="overflow-x-auto">
                  <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                              <th className="px-6 py-3 text-sm font-semibold text-slate-600">Date</th>
                              <th className="px-6 py-3 text-sm font-semibold text-slate-600">Action</th>
                              <th className="px-6 py-3 text-sm font-semibold text-slate-600">Matériel</th>
                              <th className="px-6 py-3 text-sm font-semibold text-slate-600">Personne Concernée</th>
                              <th className="px-6 py-3 text-sm font-semibold text-slate-600">Lieu d'usage</th>
                              <th className="px-6 py-3 text-sm font-semibold text-slate-600 text-right">Option</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          {sortedLogs.map(log => (
                              <tr key={log.id} className="hover:bg-slate-50 group">
                                  <td className="px-6 py-4 text-sm text-slate-600">{new Date(log.date).toLocaleDateString()}</td>
                                  <td className="px-6 py-4">
                                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                                          log.action === 'CHECK_OUT' || log.action === 'Sortie' ? 'bg-orange-100 text-orange-700' : 
                                          log.action === 'CHECK_IN' || log.action === 'Entrée' ? 'bg-green-100 text-green-700' :
                                          'bg-slate-100 text-slate-700'
                                      }`}>
                                          {log.action === 'CHECK_OUT' ? 'SORTIE' : log.action === 'CHECK_IN' ? 'ENTRÉE' : log.action}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 font-medium text-slate-900">{log.assetName}</td>
                                  <td className="px-6 py-4 text-sm text-slate-700">{log.memberName}</td>
                                  <td className="px-6 py-4 text-sm text-slate-500">{log.location}</td>
                                  <td className="px-6 py-4 text-right">
                                      <button 
                                          onClick={() => onDeleteLog && onDeleteLog(log.id)}
                                          className="text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-all"
                                          title="Supprimer cette ligne d'historique"
                                      >
                                          <Trash2 size={16} />
                                      </button>
                                  </td>
                              </tr>
                          ))}
                          {sortedLogs.length === 0 && (
                              <tr>
                                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 italic">
                                      Aucun mouvement enregistré pour le moment.
                                  </td>
                              </tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>
      )}

      {/* MODAL: QR Code Asset */}
      {selectedQrAsset && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-sm flex flex-col items-center shadow-2xl">
                  <div className="flex justify-between items-center w-full mb-6">
                      <h3 className="text-lg font-bold text-slate-800">QR Code Matériel</h3>
                      <button onClick={() => setSelectedQrAsset(null)} className="text-slate-400 hover:text-slate-600">
                          <X size={24} />
                      </button>
                  </div>
                  
                  <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-100 mb-4 flex flex-col items-center w-full print-area">
                      <div className="bg-slate-100 p-3 rounded-full mb-3 text-slate-600">
                          <Box size={32} />
                      </div>
                      
                      <h4 className="text-xl font-bold text-slate-900 text-center">{selectedQrAsset.name}</h4>
                      <span className="inline-block mt-1 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold mb-6">
                          {selectedQrAsset.category}
                      </span>
                      
                      <div className="p-2 bg-white border border-slate-200 rounded-lg">
                        <QRCode 
                            value={JSON.stringify({ assetId: selectedQrAsset.id, name: selectedQrAsset.name })} 
                            size={180} 
                            level="H"
                        />
                      </div>
                      
                      <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-widest font-semibold">
                          ID: {selectedQrAsset.id}
                      </p>
                  </div>
                  
                  <p className="text-xs text-slate-500 text-center mb-6">
                      Ce code permet d'identifier le matériel lors des événements.
                  </p>

                  <button 
                    onClick={() => window.print()} 
                    className="w-full py-2.5 bg-slate-800 text-white font-medium rounded-lg hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                  >
                      <Printer size={18} />
                      Imprimer l'étiquette
                  </button>
              </div>
          </div>
      )}

      {/* MODAL: Category Management */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Gérer les Catégories</h3>
                    <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        Fermer
                    </button>
                </div>
                
                <form onSubmit={handleCategorySubmit} className="flex gap-2 mb-4">
                    <input 
                        placeholder="Nouvelle catégorie..."
                        className="flex-1 p-2 border rounded-lg"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                    />
                    <button type="submit" className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                        Ajouter
                    </button>
                </form>

                <div className="max-h-60 overflow-y-auto space-y-2 border-t pt-2">
                    {data.assetCategories.map(cat => (
                        <div key={cat} className="flex justify-between items-center p-2 bg-slate-50 rounded border border-slate-100">
                            <span className="text-slate-700 font-medium">{cat}</span>
                            <button 
                                onClick={() => onDeleteCategory(cat)}
                                className="text-slate-400 hover:text-red-600 p-1"
                                title="Supprimer"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      )}

      {/* MODAL: Add/Edit Asset */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">{editingId ? 'Modifier équipement' : 'Ajouter un équipement'}</h3>
            <form onSubmit={handleAssetSubmit} className="space-y-4">
                <input 
                  required
                  placeholder="Nom de l'objet"
                  className="p-2 border rounded-lg w-full"
                  value={assetForm.name}
                  onChange={e => setAssetForm({...assetForm, name: e.target.value})}
                />
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Catégorie</label>
                        <select 
                            className="p-2 border rounded-lg w-full"
                            value={assetForm.category}
                            onChange={e => setAssetForm({...assetForm, category: e.target.value})}
                        >
                            {data.assetCategories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Valeur (€)</label>
                        <input 
                            type="number"
                            placeholder="Valeur"
                            className="p-2 border rounded-lg w-full"
                            value={assetForm.value}
                            onChange={e => setAssetForm({...assetForm, value: Number(e.target.value)})}
                        />
                    </div>
                </div>
                <input 
                  placeholder="Localisation de stockage"
                  className="p-2 border rounded-lg w-full"
                  value={assetForm.location}
                  onChange={e => setAssetForm({...assetForm, location: e.target.value})}
                />
                <select 
                    className="p-2 border rounded-lg w-full"
                    value={assetForm.status}
                    onChange={e => setAssetForm({...assetForm, status: e.target.value as AssetStatus})}
                >
                    {Object.values(AssetStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <div>
                     <label className="block text-xs text-slate-500 mb-1">Date d'achat</label>
                     <input 
                        type="date"
                        className="p-2 border rounded-lg w-full"
                        value={assetForm.purchaseDate}
                        onChange={e => setAssetForm({...assetForm, purchaseDate: e.target.value})}
                    />
                </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Borrow (Check Out) */}
      {isBorrowModalOpen && selectedAsset && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="border-b pb-3 mb-4">
                <h3 className="text-xl font-bold text-orange-600 flex items-center gap-2">
                    <ArrowRightCircle /> Sortie de Matériel
                </h3>
                <p className="text-sm text-slate-500 mt-1">Vous sortez : <span className="font-semibold text-slate-800">{selectedAsset.name}</span></p>
            </div>
            
            <form onSubmit={handleBorrowSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Utilisateur (Membre)</label>
                    <select 
                        required
                        className="p-2 border rounded-lg w-full"
                        value={actionForm.memberName}
                        onChange={e => setActionForm({...actionForm, memberName: e.target.value})}
                    >
                        <option value="">Sélectionner un membre</option>
                        {data.members.map(m => (
                            <option key={m.id} value={`${m.firstName} ${m.lastName}`}>
                                {m.firstName} {m.lastName}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date de sortie</label>
                    <input 
                        type="date"
                        required
                        className="p-2 border rounded-lg w-full"
                        value={actionForm.date}
                        onChange={e => setActionForm({...actionForm, date: e.target.value})}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Lieu d'utilisation</label>
                    <input 
                        required
                        placeholder="Ex: Salle de jeunesse, Extérieur..."
                        className="p-2 border rounded-lg w-full"
                        value={actionForm.location}
                        onChange={e => setActionForm({...actionForm, location: e.target.value})}
                    />
                </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsBorrowModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium">Confirmer la Sortie</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Return (Check In) */}
      {isReturnModalOpen && selectedAsset && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="border-b pb-3 mb-4">
                <h3 className="text-xl font-bold text-green-700 flex items-center gap-2">
                    <ArrowLeftCircle /> Retour de Matériel
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                    Retour de : <span className="font-semibold text-slate-800">{selectedAsset.name}</span>
                    <br/>
                    Emprunté par : {selectedAsset.borrowedBy}
                </p>
            </div>
            
            <form onSubmit={handleReturnSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date de retour</label>
                    <input 
                        type="date"
                        required
                        className="p-2 border rounded-lg w-full"
                        value={actionForm.date}
                        onChange={e => setActionForm({...actionForm, date: e.target.value})}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Lieu de rangement (Stockage)</label>
                    <input 
                        required
                        placeholder="Ex: Armoire A, Placard..."
                        className="p-2 border rounded-lg w-full"
                        value={actionForm.location}
                        onChange={e => setActionForm({...actionForm, location: e.target.value})}
                    />
                </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsReturnModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">Confirmer le Retour</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Manual Log Entry */}
      {isLogModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <div className="border-b pb-3 mb-4">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <History size={24} className="text-indigo-600" />
                    Enregistrer un mouvement
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                    Ajouter manuellement une entrée dans l'historique
                </p>
            </div>
            
            <form onSubmit={handleLogSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Action</label>
                        <select 
                            required
                            className="p-2 border rounded-lg w-full bg-white"
                            value={logForm.action}
                            // Fix: Removed restrictive type casting
                            onChange={e => setLogForm({...logForm, action: e.target.value})}
                        >
                            <option value="CHECK_OUT">Sortie</option>
                            <option value="CHECK_IN">Entrée</option>
                            <option value="MAINTENANCE">Maintenance</option>
                            <option value="AUTRE">Autre</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                            <Calendar size={14} /> Date
                        </label>
                        <input 
                            type="date"
                            required
                            className="p-2 border rounded-lg w-full"
                            value={logForm.date}
                            onChange={e => setLogForm({...logForm, date: e.target.value})}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                        <Box size={14} /> Matériel
                    </label>
                    <select 
                        required
                        className="p-2 border rounded-lg w-full bg-white"
                        value={logForm.assetId}
                        onChange={e => setLogForm({...logForm, assetId: e.target.value})}
                    >
                        <option value="">Sélectionner un équipement...</option>
                        {data.assets.map(a => (
                            <option key={a.id} value={a.id}>{a.name} ({a.category})</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                        <User size={14} /> Personne Concernée
                    </label>
                    <input 
                        required
                        placeholder="Ex: Jean Dupont"
                        className="p-2 border rounded-lg w-full"
                        value={logForm.memberName}
                        onChange={e => setLogForm({...logForm, memberName: e.target.value})}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                        <MapPin size={14} /> Lieu d'utilisation / Stockage
                    </label>
                    <input 
                        required
                        placeholder="Ex: Salle A, Placard..."
                        className="p-2 border rounded-lg w-full"
                        value={logForm.location}
                        onChange={e => setLogForm({...logForm, location: e.target.value})}
                    />
                </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsLogModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};