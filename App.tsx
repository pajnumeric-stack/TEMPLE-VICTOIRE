
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Members } from './components/Members';
import { Assets } from './components/Assets';
import { Finance } from './components/Finance';
import { Ministries } from './components/Ministries';
import { Events } from './components/Events';
import { Planning } from './components/Planning';
import { AccessControl } from './components/AccessControl';
import { Login } from './components/Login';
import { 
  loadData, 
  addMember, 
  updateMember,
  deleteMember,
  addAsset,
  updateAsset,
  toggleAssetBorrowStatus, 
  addTransaction, 
  addMinistry,
  deleteMinistry,
  updateChurchInfo,
  addEvent,
  updateEvent,
  deleteEvent,
  addAttendanceRecord,
  addRole,
  deleteRole,
  addTransactionCategory,
  deleteTransactionCategory,
  addAssetCategory,
  deleteAssetCategory,
  addAssetLog,
  deleteAssetLog,
  updateRolePermissions,
  markMemberAttendance,
  markAssetUsage
} from './services/storageService';
import { AppData, Member, Asset, Transaction, Ministry, ChurchInfo, CalendarEvent, AttendanceRecord, AssetLog } from './types';
import { MessageCircle, X, Send } from 'lucide-react';
import { askAssistant } from './services/geminiService';

const App: React.FC = () => {
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<Member | null>(null); // Track logged in user

  const [currentView, setCurrentView] = useState('dashboard');
  const [data, setData] = useState<AppData>(loadData());
  
  // Assistant State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'assistant', content: string}[]>([
      {role: 'assistant', content: 'Bonjour! Je suis votre assistant Eglise. Comment puis-je vous aider aujourd\'hui ?'}
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Sync Data handlers
  const handleUpdateChurchInfo = (info: ChurchInfo) => {
    const newData = updateChurchInfo(info, data);
    setData(newData);
  }

  const handleAddMember = (member: Omit<Member, 'id'>) => {
    const newData = addMember(member, data);
    setData(newData);
  };

  const handleUpdateMember = (member: Member) => {
    const newData = updateMember(member, data);
    setData(newData);
  }

  const handleDeleteMember = (id: string) => {
    const newData = deleteMember(id, data);
    setData(newData);
  }

  // Role handlers
  const handleAddRole = (role: string) => {
      const newData = addRole(role, data);
      setData(newData);
  }

  const handleDeleteRole = (role: string) => {
      const newData = deleteRole(role, data);
      setData(newData);
  }

  // Permissions handler
  const handleUpdateRolePermissions = (role: string, modules: string[]) => {
      const newData = updateRolePermissions(role, modules, data);
      setData(newData);
  }

  // Transaction Category handlers
  const handleAddTransactionCategory = (category: string) => {
    const newData = addTransactionCategory(category, data);
    setData(newData);
  }

  const handleDeleteTransactionCategory = (category: string) => {
    const newData = deleteTransactionCategory(category, data);
    setData(newData);
  }

  // Asset Category handlers
  const handleAddAssetCategory = (category: string) => {
    const newData = addAssetCategory(category, data);
    setData(newData);
  }

  const handleDeleteAssetCategory = (category: string) => {
    const newData = deleteAssetCategory(category, data);
    setData(newData);
  }

  const handleAddAsset = (asset: Omit<Asset, 'id'>) => {
    const newData = addAsset(asset, data);
    setData(newData);
  };

  const handleUpdateAsset = (asset: Asset) => {
      const newData = updateAsset(asset, data);
      setData(newData);
  }

  const handleToggleAssetBorrow = (assetId: string, action: 'CHECK_OUT' | 'CHECK_IN', details: { memberName: string, date: string, location: string }) => {
      const newData = toggleAssetBorrowStatus(assetId, action, details, data);
      setData(newData);
  }

  const handleAddAssetLog = (log: Omit<AssetLog, 'id'>) => {
    const newData = addAssetLog(log, data);
    setData(newData);
  }

  const handleDeleteAssetLog = (logId: string) => {
    const newData = deleteAssetLog(logId, data);
    setData(newData);
  }

  const handleAddTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newData = addTransaction(transaction, data);
    setData(newData);
  };

  const handleAddMinistry = (ministry: Omit<Ministry, 'id'>) => {
    const newData = addMinistry(ministry, data);
    setData(newData);
  };

  const handleDeleteMinistry = (id: string) => {
    const newData = deleteMinistry(id, data);
    setData(newData);
  }

  const handleAddEvent = (event: Omit<CalendarEvent, 'id'>) => {
    const newData = addEvent(event, data);
    setData(newData);
  }

  const handleUpdateEvent = (event: CalendarEvent) => {
    const newData = updateEvent(event, data);
    setData(newData);
  }

  const handleDeleteEvent = (id: string) => {
    const newData = deleteEvent(id, data);
    setData(newData);
  }

  const handleAddAttendance = (record: AttendanceRecord) => {
      const newData = addAttendanceRecord(record, data);
      setData(newData);
  }

  const handleMarkMemberAttendance = (eventId: string, memberId: string) => {
      const newData = markMemberAttendance(eventId, memberId, data);
      setData(newData);
  }

  const handleMarkAssetUsage = (eventId: string, assetId: string) => {
      const newData = markAssetUsage(eventId, assetId, data);
      setData(newData);
  }

  const handleChatSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!chatMessage.trim()) return;

      const userMsg = chatMessage;
      setChatMessage('');
      setChatHistory(prev => [...prev, {role: 'user', content: userMsg}]);
      setIsChatLoading(true);

      const response = await askAssistant(userMsg, data);
      
      setChatHistory(prev => [...prev, {role: 'assistant', content: response || "Désolé, je n'ai pas compris."}]);
      setIsChatLoading(false);
  }

  const handleLogin = (success: boolean) => {
    if (success) {
      setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentView('dashboard'); // Reset view to dashboard upon logout so it's fresh next time
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard data={data} onUpdateChurchInfo={handleUpdateChurchInfo} />;
      case 'members':
        return <Members 
            data={data} 
            onAddMember={handleAddMember} 
            onUpdateMember={handleUpdateMember}
            onDeleteMember={handleDeleteMember}
            onAddRole={handleAddRole}
            onDeleteRole={handleDeleteRole}
        />;
      case 'ministries':
        return <Ministries 
            data={data} 
            onAddMinistry={handleAddMinistry}
            onDeleteMinistry={handleDeleteMinistry}
        />;
      case 'events': 
        return <Events 
            data={data}
            onAddEvent={handleAddEvent}
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
            onMarkPresence={handleMarkMemberAttendance}
            onMarkAssetUsage={handleMarkAssetUsage}
        />;
      case 'planning': 
        return <Planning
            data={data}
            onAddEvent={handleAddEvent}
            onUpdateEvent={handleUpdateEvent}
            onDeleteEvent={handleDeleteEvent}
            onAddAttendance={handleAddAttendance}
        />;
      case 'assets':
        return <Assets 
            data={data} 
            onAddAsset={handleAddAsset} 
            onUpdateAsset={handleUpdateAsset}
            onToggleBorrow={handleToggleAssetBorrow}
            onAddCategory={handleAddAssetCategory}
            onDeleteCategory={handleDeleteAssetCategory}
            onAddLog={handleAddAssetLog}
            onDeleteLog={handleDeleteAssetLog}
        />;
      case 'finance':
        return <Finance 
            data={data} 
            onAddTransaction={handleAddTransaction} 
            onAddCategory={handleAddTransactionCategory}
            onDeleteCategory={handleDeleteTransactionCategory}
        />;
      case 'access':
        return <AccessControl 
          data={data} 
          onUpdateMember={handleUpdateMember} 
          onUpdateRolePermissions={handleUpdateRolePermissions}
          onUpdateChurchInfo={handleUpdateChurchInfo}
        />;
      default:
        return <Dashboard data={data} onUpdateChurchInfo={handleUpdateChurchInfo} />;
    }
  };

  // If not authenticated, show Login Screen
  if (!isAuthenticated) {
    return <Login 
        churchInfo={data.churchInfo} 
        members={data.members}
        onLogin={handleLogin} 
        onUpdateChurchInfo={handleUpdateChurchInfo} 
    />;
  }

  // Main App Interface
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <Sidebar 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        onLogout={handleLogout} 
        churchInfo={data.churchInfo}
      />
      
      <main className="flex-1 ml-64 relative">
        {renderView()}

        {/* Floating Assistant Button */}
        <button 
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="fixed bottom-8 right-8 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-all z-40"
        >
            {isChatOpen ? <X size={24} /> : <MessageCircle size={24} />}
        </button>

        {/* Assistant Chat Window */}
        {isChatOpen && (
            <div className="fixed bottom-24 right-8 w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-40 overflow-hidden" style={{height: '500px'}}>
                <div className="bg-indigo-600 p-4 text-white font-bold flex justify-between items-center">
                    <span>Assistant Eglise</span>
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50">
                    {chatHistory.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'}`}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {isChatLoading && (
                         <div className="flex justify-start">
                            <div className="bg-slate-200 p-3 rounded-lg rounded-bl-none text-slate-500 text-xs animate-pulse">
                                Écriture en cours...
                            </div>
                        </div>
                    )}
                </div>

                <form onSubmit={handleChatSubmit} className="p-3 bg-white border-t border-slate-100 flex gap-2">
                    <input 
                        className="flex-1 border border-slate-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
                        placeholder="Posez une question..."
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                    />
                    <button type="submit" disabled={isChatLoading} className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 disabled:opacity-50">
                        <Send size={18} />
                    </button>
                </form>
            </div>
        )}
      </main>
    </div>
  );
};

export default App;
