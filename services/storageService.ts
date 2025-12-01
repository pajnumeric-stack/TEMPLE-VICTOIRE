

import { Member, Asset, Transaction, Role, AssetStatus, TransactionType, AppData, MaritalStatus, Ministry, ChurchInfo, CalendarEvent, AttendanceRecord, SystemRole, AssetLog } from '../types';

const STORAGE_KEY = 'ecclesia_data_v13'; // Bump version for passwords

const generateId = () => Math.random().toString(36).substr(2, 9);

const INITIAL_DATA: AppData = {
  churchInfo: {
    name: "Église Évangélique de la Grâce",
    slogan: "\"Une maison de prière pour tous les peuples\"",
    idRef: "EGL-2024-FR",
    accessCode: "ADMIN",
    loginBackground: "#0f172a", // Couleur par défaut (Slate 900)
    titleAnimation: "fade" // Animation par défaut
  },
  roles: ['Pasteur', 'Diacre', 'Musicien', 'Membre', 'Staff', 'Bénévole'],
  transactionCategories: [
      'Dîmes', 
      'Offrandes', 
      'Dons Spéciaux', 
      'Loyer', 
      'Électricité & Eau', 
      'Internet & Téléphone', 
      'Salaire', 
      'Mission & Entraide',
      'Matériel & Équipement',
      'Maintenance',
      'Événements',
      'Autre'
  ],
  assetCategories: [
      'Instruments de Musique',
      'Sonorisation',
      'Éclairage',
      'Vidéo & Multimédia',
      'Informatique',
      'Mobilier',
      'Cuisine',
      'Décoration',
      'Véhicules',
      'Divers'
  ],
  ministries: [
    { id: 'm1', name: 'Chorale & Louange', description: 'Groupe musical et technique', meetingDay: 'Jeudi 19h', leaderId: '3' },
    { id: 'm2', name: 'Accueil & Protocole', description: 'Accueil des nouveaux et gestion du culte', meetingDay: 'Dimanche 9h' },
    { id: 'm3', name: 'Jeunesse (J-Christ)', description: 'Activités pour les 15-25 ans', meetingDay: 'Samedi 16h' },
    { id: 'm4', name: 'École du Dimanche', description: 'Enseignement pour les enfants', meetingDay: 'Dimanche 10h', leaderId: '2' },
  ],
  members: [
    { 
      id: '1', 
      firstName: 'Jean', 
      lastName: 'Dupont',
      familyName: 'Famille Dupont',
      role: 'Pasteur',
      systemRole: SystemRole.ADMIN, // Admin par défaut
      email: 'jean.dupont@eglise.com', 
      password: 'admin',
      phone: '0601020304', 
      address: '12 Rue de la Paix, Paris',
      birthDate: '1975-04-12',
      maritalStatus: MaritalStatus.MARRIED,
      profession: 'Théologien',
      joinDate: '2020-01-15',
      ministryIds: [],
      emergencyContactName: 'Sarah Dupont',
      emergencyContactPhone: '0600000000',
      nationality: 'Française',
      passportNumber: 'AB12345678',
      drivingLicense: 'Permis B',
      children: [
          { name: 'Lucas Dupont', ministryId: 'm4' },
          { name: 'Emma Dupont', ministryId: 'm3' }
      ]
    },
    { 
      id: '2', 
      firstName: 'Marie', 
      lastName: 'Curie',
      familyName: 'Famille Pierre & Marie',
      role: 'Diacre',
      systemRole: SystemRole.EDITOR, // Editeur par défaut
      email: 'marie.c@eglise.com', 
      password: 'editor',
      phone: '0605060708', 
      address: '45 Avenue de la République, Lyon',
      birthDate: '1982-11-07',
      maritalStatus: MaritalStatus.WIDOWED,
      profession: 'Enseignant',
      joinDate: '2021-03-10',
      ministryIds: ['m2', 'm4'],
      emergencyContactName: 'Pierre Curie',
      emergencyContactPhone: '0699887766',
      nationality: 'Polonaise',
      drivingLicense: 'Aucun',
      children: []
    },
    { 
      id: '3', 
      firstName: 'Paul', 
      lastName: 'Martin',
      familyName: 'Famille Martin',
      role: 'Musicien',
      systemRole: SystemRole.VIEWER, // Observateur par défaut
      email: 'paul.m@eglise.com', 
      password: 'viewer',
      phone: '0611121314', 
      address: '8 Boulevard Victor Hugo, Marseille',
      birthDate: '1995-06-20',
      maritalStatus: MaritalStatus.SINGLE,
      profession: 'Ingénieur',
      joinDate: '2022-06-20',
      ministryIds: ['m1'],
      nationality: 'Française',
      drivingLicense: 'Permis B, A'
    },
  ],
  assets: [
    { id: '1', name: 'Piano Yamaha', category: 'Instruments de Musique', value: 1500, purchaseDate: '2019-05-12', status: AssetStatus.GOOD, location: 'Sanctuaire', isBorrowed: false },
    { id: '2', name: 'Projecteur Epson', category: 'Vidéo & Multimédia', value: 600, purchaseDate: '2021-08-20', status: AssetStatus.NEEDS_REPAIR, location: 'Salle Principale', isBorrowed: false },
    { id: '3', name: 'Chaises (50)', category: 'Mobilier', value: 1000, purchaseDate: '2020-01-05', status: AssetStatus.GOOD, location: 'Salle Polyvalente', isBorrowed: false },
  ],
  assetLogs: [],
  transactions: [
    { id: '1', type: TransactionType.INCOME, amount: 1200, date: '2023-10-01', category: 'Dîmes', description: 'Dîmes mensuelles' },
    { id: '2', type: TransactionType.INCOME, amount: 450, date: '2023-10-08', category: 'Offrandes', description: 'Culte du dimanche' },
    { id: '3', type: TransactionType.EXPENSE, amount: 200, date: '2023-10-10', category: 'Maintenance', description: 'Réparation plomberie' },
    { id: '4', type: TransactionType.EXPENSE, amount: 150, date: '2023-10-12', category: 'Matériel & Équipement', description: 'Papier et stylos' },
    { id: '5', type: TransactionType.INCOME, amount: 3000, date: '2023-10-15', category: 'Dons Spéciaux', description: 'Don spécial rénovation' },
  ],
  events: [
    { id: 'e1', title: 'Culte Dominical', date: new Date().toISOString().split('T')[0], time: '10:00', description: 'Culte de louange et adoration', type: 'Culte', location: 'Sanctuaire', usedAssetIds: [] },
    { id: 'e2', title: 'Réunion de Prière', date: '2023-11-15', time: '19:00', description: 'Temps de prière pour les malades', type: 'Réunion', location: 'Salle annexe', usedAssetIds: [] },
  ],
  attendance: [],
  // Default permissions:
  // Admin has ALL access implicitly (logic handled in UI/App)
  // Editor: All except 'access' (Security)
  // Viewer: Dashboard, Planning/Events
  rolePermissions: {
      [SystemRole.EDITOR]: ['dashboard', 'members', 'planning', 'ministries', 'assets', 'finance'],
      [SystemRole.VIEWER]: ['dashboard', 'planning', 'events'],
      [SystemRole.NONE]: []
  }
};

export const loadData = (): AppData => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    // Migration helpers for old data versions
    if (!parsed.ministries) parsed.ministries = INITIAL_DATA.ministries;
    if (!parsed.churchInfo) parsed.churchInfo = INITIAL_DATA.churchInfo;
    
    // Ensure accessCode exists
    if (!parsed.churchInfo.accessCode) parsed.churchInfo.accessCode = "ADMIN";
    // Ensure loginBackground exists
    if (!parsed.churchInfo.loginBackground) parsed.churchInfo.loginBackground = "#0f172a";
    // Ensure titleAnimation exists
    if (!parsed.churchInfo.titleAnimation) parsed.churchInfo.titleAnimation = "fade";

    if (!parsed.events) parsed.events = INITIAL_DATA.events;
    if (!parsed.attendance) parsed.attendance = INITIAL_DATA.attendance;
    if (!parsed.roles) parsed.roles = INITIAL_DATA.roles;
    if (!parsed.transactionCategories) parsed.transactionCategories = INITIAL_DATA.transactionCategories;
    if (!parsed.assetLogs) parsed.assetLogs = INITIAL_DATA.assetLogs;
    if (!parsed.assetCategories) parsed.assetCategories = INITIAL_DATA.assetCategories;
    if (!parsed.rolePermissions) parsed.rolePermissions = INITIAL_DATA.rolePermissions;
    
    // Ensure existing members have a system role if migrating
    if (parsed.members) {
        parsed.members = parsed.members.map((m: any) => ({
            ...m,
            systemRole: m.systemRole || SystemRole.NONE,
            password: m.password || (m.systemRole && m.systemRole !== SystemRole.NONE ? '1234' : ''), // Default password for existing admins
            children: m.children || [] // Migration for children
        }));
    }
    
    return parsed;
  }
  return INITIAL_DATA;
};

export const saveData = (data: AppData) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// --- Church Info ---
export const updateChurchInfo = (info: ChurchInfo, currentData: AppData): AppData => {
  const newData = { ...currentData, churchInfo: info };
  saveData(newData);
  return newData;
};

// --- Roles ---
export const addRole = (role: string, currentData: AppData): AppData => {
    if (currentData.roles.includes(role)) return currentData;
    const newData = { ...currentData, roles: [...currentData.roles, role] };
    saveData(newData);
    return newData;
};

export const deleteRole = (role: string, currentData: AppData): AppData => {
    const newData = { ...currentData, roles: currentData.roles.filter(r => r !== role) };
    saveData(newData);
    return newData;
};

// --- Permissions ---
export const updateRolePermissions = (role: string, modules: string[], currentData: AppData): AppData => {
    const newData = {
        ...currentData,
        rolePermissions: {
            ...currentData.rolePermissions,
            [role]: modules
        }
    };
    saveData(newData);
    return newData;
};

// --- Transaction Categories ---
export const addTransactionCategory = (category: string, currentData: AppData): AppData => {
    if (currentData.transactionCategories.includes(category)) return currentData;
    const newData = { ...currentData, transactionCategories: [...currentData.transactionCategories, category] };
    saveData(newData);
    return newData;
};

export const deleteTransactionCategory = (category: string, currentData: AppData): AppData => {
    const newData = { ...currentData, transactionCategories: currentData.transactionCategories.filter(c => c !== category) };
    saveData(newData);
    return newData;
};

// --- Asset Categories ---
export const addAssetCategory = (category: string, currentData: AppData): AppData => {
    if (currentData.assetCategories.includes(category)) return currentData;
    const newData = { ...currentData, assetCategories: [...currentData.assetCategories, category] };
    saveData(newData);
    return newData;
};

export const deleteAssetCategory = (category: string, currentData: AppData): AppData => {
    const newData = { ...currentData, assetCategories: currentData.assetCategories.filter(c => c !== category) };
    saveData(newData);
    return newData;
};

// --- Members ---
export const addMember = (member: Omit<Member, 'id'>, currentData: AppData): AppData => {
  const newData = { ...currentData, members: [...currentData.members, { ...member, id: generateId() }] };
  saveData(newData);
  return newData;
};

export const updateMember = (member: Member, currentData: AppData): AppData => {
  const newData = {
    ...currentData,
    members: currentData.members.map(m => m.id === member.id ? member : m)
  };
  saveData(newData);
  return newData;
};

export const deleteMember = (id: string, currentData: AppData): AppData => {
  const newData = {
    ...currentData,
    members: currentData.members.filter(m => m.id !== id)
  };
  saveData(newData);
  return newData;
};

// --- Assets ---
export const addAsset = (asset: Omit<Asset, 'id'>, currentData: AppData): AppData => {
  const newData = { ...currentData, assets: [...currentData.assets, { ...asset, id: generateId() }] };
  saveData(newData);
  return newData;
};

export const updateAsset = (asset: Asset, currentData: AppData): AppData => {
    const newData = {
        ...currentData,
        assets: currentData.assets.map(a => a.id === asset.id ? asset : a)
    };
    saveData(newData);
    return newData;
};

// Handles Borrowing and Returning
export const toggleAssetBorrowStatus = (
    assetId: string, 
    action: 'CHECK_OUT' | 'CHECK_IN', 
    details: { memberName: string, date: string, location: string },
    currentData: AppData
): AppData => {
    const asset = currentData.assets.find(a => a.id === assetId);
    if (!asset) return currentData;

    // 1. Update Asset Status
    const updatedAsset: Asset = { ...asset };
    if (action === 'CHECK_OUT') {
        updatedAsset.isBorrowed = true;
        updatedAsset.borrowedBy = details.memberName;
        updatedAsset.borrowDate = details.date;
        updatedAsset.usageLocation = details.location;
    } else {
        updatedAsset.isBorrowed = false;
        updatedAsset.borrowedBy = undefined;
        updatedAsset.borrowDate = undefined;
        updatedAsset.usageLocation = undefined;
    }

    // 2. Create Log Entry
    const newLog: AssetLog = {
        id: generateId(),
        assetId: asset.id,
        assetName: asset.name,
        action: action,
        date: details.date,
        memberName: details.memberName,
        location: details.location
    };

    const newData = {
        ...currentData,
        assets: currentData.assets.map(a => a.id === assetId ? updatedAsset : a),
        assetLogs: [newLog, ...currentData.assetLogs]
    };
    
    saveData(newData);
    return newData;
};

// --- Asset Logs (Manual) ---
export const addAssetLog = (log: Omit<AssetLog, 'id'>, currentData: AppData): AppData => {
    const newLog = { ...log, id: generateId() };
    const newData = {
        ...currentData,
        assetLogs: [newLog, ...currentData.assetLogs]
    };
    saveData(newData);
    return newData;
};

export const deleteAssetLog = (logId: string, currentData: AppData): AppData => {
    const newData = {
        ...currentData,
        assetLogs: currentData.assetLogs.filter(log => log.id !== logId)
    };
    saveData(newData);
    return newData;
};


// --- Transactions ---
export const addTransaction = (transaction: Omit<Transaction, 'id'>, currentData: AppData): AppData => {
  const newData = { ...currentData, transactions: [...currentData.transactions, { ...transaction, id: generateId() }] };
  saveData(newData);
  return newData;
};

// --- Ministries ---
export const addMinistry = (ministry: Omit<Ministry, 'id'>, currentData: AppData): AppData => {
  const newData = { ...currentData, ministries: [...currentData.ministries, { ...ministry, id: generateId() }] };
  saveData(newData);
  return newData;
};

export const deleteMinistry = (id: string, currentData: AppData): AppData => {
  const newData = {
    ...currentData,
    ministries: currentData.ministries.filter(m => m.id !== id),
    // Also remove this ministry ID from all members
    members: currentData.members.map(m => ({
      ...m,
      ministryIds: m.ministryIds?.filter(mid => mid !== id)
    }))
  };
  saveData(newData);
  return newData;
};

// --- Events ---
export const addEvent = (event: Omit<CalendarEvent, 'id'>, currentData: AppData): AppData => {
  const newData = { ...currentData, events: [...currentData.events, { ...event, id: generateId() }] };
  saveData(newData);
  return newData;
};

export const updateEvent = (event: CalendarEvent, currentData: AppData): AppData => {
    const newData = {
        ...currentData,
        events: currentData.events.map(e => e.id === event.id ? event : e)
    };
    saveData(newData);
    return newData;
};

export const deleteEvent = (id: string, currentData: AppData): AppData => {
    const newData = {
        ...currentData,
        events: currentData.events.filter(e => e.id !== id)
    };
    saveData(newData);
    return newData;
};

// --- Attendance ---
export const addAttendanceRecord = (record: AttendanceRecord, currentData: AppData): AppData => {
    // Check if record exists for this event
    const existingIndex = currentData.attendance.findIndex(a => a.eventId === record.eventId);
    let newAttendance = [...currentData.attendance];
    
    if (existingIndex >= 0) {
        newAttendance[existingIndex] = record;
    } else {
        newAttendance.push(record);
    }

    const newData = { ...currentData, attendance: newAttendance };
    saveData(newData);
    return newData;
}

// Scans a member QR code and marks them as present for a specific event
export const markMemberAttendance = (eventId: string, memberId: string, currentData: AppData): AppData => {
    const existingIndex = currentData.attendance.findIndex(a => a.eventId === eventId);
    let newAttendance = [...currentData.attendance];
    
    if (existingIndex >= 0) {
        // Update existing record
        const record = { ...newAttendance[existingIndex] };
        
        // Initialize arrays if they don't exist
        if (!record.presentMemberIds) record.presentMemberIds = [];
        if (!record.absentMemberIds) record.absentMemberIds = [];

        // Check if already marked present
        if (!record.presentMemberIds.includes(memberId)) {
            record.presentMemberIds = [...record.presentMemberIds, memberId];
            
            // Remove from absent list if they were marked absent
            record.absentMemberIds = record.absentMemberIds.filter(id => id !== memberId);
            
            newAttendance[existingIndex] = record;
        } else {
            return currentData; // No change needed
        }
    } else {
        // Create new record for this event
        const event = currentData.events.find(e => e.id === eventId);
        const newRecord: AttendanceRecord = {
            eventId,
            date: event ? event.date : new Date().toISOString().split('T')[0],
            presentMemberIds: [memberId],
            visitorCount: 0
        };
        newAttendance.push(newRecord);
    }

    const newData = { ...currentData, attendance: newAttendance };
    saveData(newData);
    return newData;
};

// Scans an asset QR code and marks it as used for a specific event
export const markAssetUsage = (eventId: string, assetId: string, currentData: AppData): AppData => {
    const eventIndex = currentData.events.findIndex(e => e.id === eventId);
    if (eventIndex === -1) return currentData;

    const updatedEvents = [...currentData.events];
    const event = { ...updatedEvents[eventIndex] };
    const usedAssets = event.usedAssetIds || [];

    // Check if already marked
    if (!usedAssets.includes(assetId)) {
        event.usedAssetIds = [...usedAssets, assetId];
        updatedEvents[eventIndex] = event;
        
        const newData = { ...currentData, events: updatedEvents };
        saveData(newData);
        return newData;
    }

    return currentData;
};