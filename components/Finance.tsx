

import React, { useState } from 'react';
import { Transaction, TransactionType, AppData } from '../types';
import { Plus, ArrowUpRight, ArrowDownRight, Filter, Download, Settings, Trash2 } from 'lucide-react';
import { exportToCSV } from '../services/exportService';

interface FinanceProps {
  data: AppData;
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  onAddCategory: (category: string) => void;
  onDeleteCategory: (category: string) => void;
}

export const Finance: React.FC<FinanceProps> = ({ data, onAddTransaction, onAddCategory, onDeleteCategory }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  
  const [newTransaction, setNewTransaction] = useState({
    type: TransactionType.INCOME,
    amount: 0,
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [newCategoryName, setNewCategoryName] = useState('');

  const totalIncome = data.transactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = data.transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddTransaction(newTransaction);
    setIsModalOpen(false);
    setNewTransaction({
        type: TransactionType.INCOME,
        amount: 0,
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
  };

  const handleAddCategorySubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if(newCategoryName.trim()) {
          onAddCategory(newCategoryName.trim());
          setNewCategoryName('');
      }
  }

  const handleExport = () => {
    const exportData = data.transactions.map(t => ({
      'Date': t.date,
      'Type': t.type,
      'Catégorie': t.category,
      'Description': t.description,
      'Montant': t.amount
    }));
    exportToCSV(exportData, `transactions_eglise_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-slate-800">Finances</h2>
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
            <span className="hidden sm:inline">Exporter CSV</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus size={20} />
            Nouvelle Transaction
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
            <div>
                <p className="text-sm text-slate-500 font-medium uppercase">Revenus Totaux</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">+{totalIncome.toLocaleString()} €</p>
            </div>
            <div className="bg-emerald-100 p-3 rounded-full text-emerald-600">
                <ArrowUpRight size={24} />
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
            <div>
                <p className="text-sm text-slate-500 font-medium uppercase">Dépenses Totales</p>
                <p className="text-2xl font-bold text-red-600 mt-1">-{totalExpense.toLocaleString()} €</p>
            </div>
            <div className="bg-red-100 p-3 rounded-full text-red-600">
                <ArrowDownRight size={24} />
            </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex justify-between items-center">
            <div>
                <p className="text-sm text-slate-500 font-medium uppercase">Solde Actuel</p>
                <p className={`text-2xl font-bold mt-1 ${balance >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                    {balance.toLocaleString()} €
                </p>
            </div>
            <div className="bg-indigo-100 p-3 rounded-full text-indigo-600">
                <Filter size={24} />
            </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <h3 className="text-lg font-bold text-slate-800 mb-4 px-2">Historique des transactions</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600">Date</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600">Description</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600">Catégorie</th>
                <th className="px-6 py-3 text-sm font-semibold text-slate-600 text-right">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.transactions.slice().reverse().map(t => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-slate-600">{t.date}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">{t.description}</td>
                  <td className="px-6 py-4 text-slate-600">
                    <span className="px-2 py-1 bg-slate-100 rounded text-xs">{t.category}</span>
                  </td>
                  <td className={`px-6 py-4 font-bold text-right ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-red-600'}`}>
                    {t.type === TransactionType.INCOME ? '+' : '-'}{t.amount} €
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Management Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold">Gérer les Catégories</h3>
                    <button onClick={() => setIsCategoryModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        Fermer
                    </button>
                </div>
                
                <form onSubmit={handleAddCategorySubmit} className="flex gap-2 mb-4">
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
                    {data.transactionCategories.map(cat => (
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Nouvelle Transaction</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex gap-4 mb-4">
                    <button 
                        type="button"
                        className={`flex-1 py-2 rounded-lg font-medium border ${newTransaction.type === TransactionType.INCOME ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-slate-200'}`}
                        onClick={() => setNewTransaction({...newTransaction, type: TransactionType.INCOME})}
                    >
                        Revenu
                    </button>
                    <button 
                        type="button"
                        className={`flex-1 py-2 rounded-lg font-medium border ${newTransaction.type === TransactionType.EXPENSE ? 'bg-red-50 border-red-500 text-red-700' : 'border-slate-200'}`}
                        onClick={() => setNewTransaction({...newTransaction, type: TransactionType.EXPENSE})}
                    >
                        Dépense
                    </button>
                </div>

                <input 
                  type="date"
                  required
                  className="p-2 border rounded-lg w-full"
                  value={newTransaction.date}
                  onChange={e => setNewTransaction({...newTransaction, date: e.target.value})}
                />
                <input 
                  type="number"
                  required
                  placeholder="Montant (€)"
                  className="p-2 border rounded-lg w-full"
                  value={newTransaction.amount || ''}
                  onChange={e => setNewTransaction({...newTransaction, amount: Number(e.target.value)})}
                />
                
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Catégorie</label>
                    <select 
                        required
                        className="p-2 border rounded-lg w-full"
                        value={newTransaction.category}
                        onChange={e => setNewTransaction({...newTransaction, category: e.target.value})}
                    >
                        <option value="">Sélectionner une catégorie</option>
                        {data.transactionCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                 <input 
                  required
                  placeholder="Description"
                  className="p-2 border rounded-lg w-full"
                  value={newTransaction.description}
                  onChange={e => setNewTransaction({...newTransaction, description: e.target.value})}
                />

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Valider</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};