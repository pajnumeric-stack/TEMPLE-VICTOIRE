

import React, { useState, useEffect, useRef } from 'react';
import { Church, ArrowRight, Lock, Sparkles, Settings, Upload, X, Check, Edit2, User, KeyRound, QrCode } from 'lucide-react';
import { ChurchInfo, Member, SystemRole } from '../types';

interface LoginProps {
  churchInfo: ChurchInfo;
  members: Member[];
  onLogin: (success: boolean) => void;
  onUpdateChurchInfo?: (info: ChurchInfo) => void;
}

export const Login: React.FC<LoginProps> = ({ churchInfo, members, onLogin, onUpdateChurchInfo }) => {
  const [loginMode, setLoginMode] = useState<'code' | 'user'>('code');
  const [animate, setAnimate] = useState(false);

  // Global Code Login State
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);

  // User Login State
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [password, setPassword] = useState('');
  const [userError, setUserError] = useState('');

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSlogan, setEditSlogan] = useState('');
  const [editLogo, setEditLogo] = useState<string | undefined>(undefined);
  const [authCode, setAuthCode] = useState('');
  const [editError, setEditError] = useState('');

  // QR Scanning State
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string>('Placez le code QR dans le cadre');

  // Filter members who have a system role
  const authorizedMembers = members.filter(m => m.systemRole && m.systemRole !== SystemRole.NONE);

  useEffect(() => {
    setAnimate(true);
  }, []);

  // Initialize edit form when entering edit mode
  useEffect(() => {
    if (isEditing) {
        setEditName(churchInfo.name);
        setEditSlogan(churchInfo.slogan);
        setEditLogo(churchInfo.logo);
        setAuthCode('');
        setEditError('');
    }
  }, [isEditing, churchInfo]);

  // Handle QR Scanner Lifecycle
  useEffect(() => {
    // Only run if scanning is active
    if (!isScanning) return;

    let isMounted = true;
    let html5QrCode: any = null;
    const elementId = "qr-reader";

    const startScanner = async () => {
         // @ts-ignore
         if (typeof Html5Qrcode === 'undefined') {
             console.error("Html5Qrcode library not loaded");
             return;
         }
         
         // Wait for element to be present in DOM
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
                    
                    let success = false;
                    
                    // 1. Check if it's a User QR Code (JSON format)
                    try {
                        const credentials = JSON.parse(decodedText);
                        if (credentials.userId && credentials.password) {
                            const user = members.find(m => m.id === credentials.userId);
                            if (user && user.password === credentials.password) {
                                if (user.systemRole && user.systemRole !== SystemRole.NONE) {
                                    // Valid User Login
                                    setScanStatus(`Bienvenue ${user.firstName} !`);
                                    success = true;
                                } else {
                                    setScanStatus("Accès refusé : Rôle insuffisant");
                                }
                            } else {
                                setScanStatus("Identifiants incorrects");
                            }
                        }
                    } catch (e) {
                        // Not JSON, continue to check global code
                    }

                    // 2. Check if it's the Global Admin Code
                    const validCode = churchInfo.accessCode || 'ADMIN';
                    if (!success && decodedText === validCode) {
                        setScanStatus("Code Admin accepté !");
                        success = true;
                    }

                    if (success) {
                        // IMPORTANT: We do NOT call stop() here manually.
                        // We update state, which unmounts the component/effect.
                        // The cleanup function below will handle the stop().
                        setIsScanning(false);
                        onLogin(true);
                    }
                },
                (errorMessage: string) => {
                    // parse error, ignore
                }
            );
         } catch (err) {
             console.error("Error starting scanner", err);
             if (isMounted) setIsScanning(false);
         }
    };

    startScanner();

    return () => {
        isMounted = false;
        if (html5QrCode) {
            html5QrCode.stop().then(() => {
                try { html5QrCode.clear(); } catch(e) {}
            }).catch((err: any) => {
                // Ignore "not running" errors during cleanup
                // This catch is critical to prevent the "Uncaught Cannot stop" error
            });
        }
    }
  }, [isScanning, churchInfo.accessCode, onLogin, members]);

  const handleGlobalCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validCode = churchInfo.accessCode || 'ADMIN';
    if (code === validCode) {
      onLogin(true);
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  const handleUserLoginSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setUserError('');

      if (!selectedMemberId) {
          setUserError("Veuillez sélectionner un membre.");
          return;
      }

      // Find member by ID
      const user = members.find(m => m.id === selectedMemberId);
      
      if (!user) {
          setUserError("Utilisateur introuvable.");
          return;
      }

      if (!user.systemRole || user.systemRole === SystemRole.NONE) {
          setUserError("Cet utilisateur n'a pas accès à l'application.");
          return;
      }

      if (user.password === password) {
          onLogin(true);
      } else {
          setUserError("Mot de passe incorrect.");
      }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditLogo(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveConfig = (e: React.FormEvent) => {
      e.preventDefault();
      const validCode = churchInfo.accessCode || 'ADMIN';
      
      if (authCode !== validCode) {
          setEditError("Code administrateur incorrect.");
          return;
      }

      if (onUpdateChurchInfo) {
          onUpdateChurchInfo({
              ...churchInfo,
              name: editName,
              slogan: editSlogan,
              logo: editLogo
          });
          setIsEditing(false);
      }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden font-sans">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Settings Button */}
      <button 
        onClick={() => setIsEditing(!isEditing)}
        className="absolute top-6 right-6 text-white/40 hover:text-white z-50 p-2 rounded-full hover:bg-white/10 transition-all"
        title="Modifier l'apparence"
      >
        {isEditing ? <X size={24} /> : <Settings size={24} />}
      </button>

      {/* QR Code Scanner Overlay */}
      {isScanning && (
          <div className="absolute inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-4">
              <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden relative">
                  <button 
                    onClick={() => setIsScanning(false)}
                    className="absolute top-4 right-4 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70"
                  >
                      <X size={24} />
                  </button>
                  <div id="qr-reader" className="w-full h-[300px] bg-black"></div>
                  <div className="p-4 text-center bg-slate-100 text-slate-800 font-medium text-sm">
                      {scanStatus}
                  </div>
              </div>
          </div>
      )}

      <div className={`z-10 flex flex-col items-center transition-all duration-1000 transform w-full max-w-md px-4 ${animate ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        
        {/* VIEW MODE: Animated Logo & Title */}
        {!isEditing && (
            <>
                <div className="mb-8 relative group">
                <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 animate-pulse"></div>
                <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl relative z-10 animate-float">
                    {churchInfo.logo ? (
                        <img src={churchInfo.logo} alt="Logo" className="w-full h-full object-cover rounded-full border-4 border-slate-800" />
                    ) : (
                        <Church size={64} className="text-white drop-shadow-md" />
                    )}
                </div>
                </div>

                <div className="text-center mb-10 space-y-2">
                    <h1 className="text-4xl md:text-5xl font-bold text-white tracking-tight drop-shadow-lg">
                    {churchInfo.name || "Ma Paroisse"}
                    </h1>
                    <p className="text-indigo-200 text-lg italic font-light">
                    {churchInfo.slogan || "Gestion & Administration"}
                    </p>
                </div>
            </>
        )}

        {/* CARD CONTAINER */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 p-8 rounded-2xl shadow-2xl w-full">
            
            {/* LOGIN FORM */}
            {!isEditing ? (
                <>
                    {/* Login Tabs */}
                    <div className="flex bg-slate-900/40 p-1 rounded-xl mb-6">
                        <button 
                            onClick={() => setLoginMode('code')}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                                loginMode === 'code' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white'
                            }`}
                        >
                            Administrateur
                        </button>
                        <button 
                            onClick={() => setLoginMode('user')}
                            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                                loginMode === 'user' ? 'bg-white/10 text-white shadow-sm' : 'text-white/40 hover:text-white'
                            }`}
                        >
                            Compte Membre
                        </button>
                    </div>

                    {loginMode === 'code' && (
                        <form onSubmit={handleGlobalCodeSubmit} className="space-y-4">
                            <div className="relative">
                                <Lock className="absolute left-4 top-3.5 text-white/40" size={18} />
                                <input 
                                    type="password"
                                    placeholder="Entrez le code d'accès"
                                    className={`w-full bg-slate-900/50 border ${error ? 'border-red-500 ring-1 ring-red-500' : 'border-white/10 focus:border-indigo-400'} rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/30 tracking-widest text-lg focus:outline-none transition-all`}
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <button 
                                type="submit"
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl shadow-lg transform transition hover:scale-[1.02] flex items-center justify-center gap-2 group"
                            >
                                <span>Connexion</span>
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>

                             <button 
                                type="button"
                                onClick={() => setIsScanning(true)}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-xl shadow transition-all flex items-center justify-center gap-2"
                            >
                                <QrCode size={18} />
                                <span>Scanner un QR Code</span>
                            </button>
                            
                            {error && (
                                <p className="text-red-400 text-sm text-center animate-bounce">
                                    Code incorrect. Veuillez réessayer.
                                </p>
                            )}
                        </form>
                    )}

                    {loginMode === 'user' && (
                        <form onSubmit={handleUserLoginSubmit} className="space-y-4">
                            <div className="relative">
                                <User className="absolute left-4 top-3.5 text-white/40" size={18} />
                                <select 
                                    className="w-full bg-slate-900/50 border border-white/10 focus:border-indigo-400 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none transition-all appearance-none"
                                    value={selectedMemberId}
                                    onChange={(e) => setSelectedMemberId(e.target.value)}
                                >
                                    <option value="" className="text-slate-900">Sélectionner un membre</option>
                                    {authorizedMembers.map(m => (
                                        <option key={m.id} value={m.id} className="text-slate-900">
                                            {m.firstName} {m.lastName} ({m.systemRole})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="relative">
                                <KeyRound className="absolute left-4 top-3.5 text-white/40" size={18} />
                                <input 
                                    type="password"
                                    placeholder="Mot de passe"
                                    className="w-full bg-slate-900/50 border border-white/10 focus:border-indigo-400 rounded-xl pl-12 pr-4 py-3 text-white placeholder-white/30 focus:outline-none transition-all"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>

                            <button 
                                type="submit"
                                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl shadow-lg transform transition hover:scale-[1.02] flex items-center justify-center gap-2 group"
                            >
                                <span>Se Connecter</span>
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                             <button 
                                type="button"
                                onClick={() => setIsScanning(true)}
                                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-medium py-3 rounded-xl shadow transition-all flex items-center justify-center gap-2"
                            >
                                <QrCode size={18} />
                                <span>Scanner un QR Code</span>
                            </button>

                            {userError && (
                                <p className="text-red-400 text-sm text-center">
                                    {userError}
                                </p>
                            )}
                        </form>
                    )}

                    <div className="mt-6 text-center">
                         {loginMode === 'code' && <p className="text-white/20 text-xs">Code par défaut : ADMIN</p>}
                    </div>
                </>
            ) : (
                /* EDIT FORM */
                <form onSubmit={handleSaveConfig} className="space-y-4">
                    <div className="text-center mb-4 text-white/90 font-semibold border-b border-white/10 pb-2">
                        Configuration de l'accueil
                    </div>

                    {/* Logo Upload */}
                    <div className="flex justify-center mb-4">
                        <div className="relative group cursor-pointer w-20 h-20">
                            <div className="w-full h-full rounded-full overflow-hidden bg-slate-800 border-2 border-dashed border-white/30 flex items-center justify-center">
                                {editLogo ? (
                                    <img src={editLogo} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <Upload size={24} className="text-white/50" />
                                )}
                            </div>
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={handleLogoChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div className="absolute bottom-0 right-0 bg-indigo-500 text-white p-1 rounded-full shadow-sm">
                                <Edit2 size={10} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-white/60 mb-1">Nom de l'église</label>
                        <input 
                            type="text"
                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-white/60 mb-1">Slogan</label>
                        <input 
                            type="text"
                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                            value={editSlogan}
                            onChange={(e) => setEditSlogan(e.target.value)}
                        />
                    </div>

                    <div className="pt-2 border-t border-white/10">
                         <label className="block text-xs font-medium text-white/60 mb-1">Code Admin (Confirmation)</label>
                         <input 
                            type="password"
                            placeholder="Code actuel requis"
                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-400"
                            value={authCode}
                            onChange={(e) => setAuthCode(e.target.value)}
                        />
                    </div>

                    {editError && <p className="text-red-400 text-xs text-center">{editError}</p>}

                    <div className="flex gap-3 mt-4">
                        <button 
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="flex-1 py-2 text-white/60 hover:text-white text-sm"
                        >
                            Annuler
                        </button>
                        <button 
                            type="submit"
                            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-sm font-bold shadow-lg"
                        >
                            Enregistrer
                        </button>
                    </div>
                </form>
            )}
        </div>
        
        <p className="mt-8 text-white/20 text-xs">
            Système de Gestion Eclésiale v2.0
        </p>
      </div>
    </div>
  );
};
