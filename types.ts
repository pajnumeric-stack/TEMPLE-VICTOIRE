

export enum Role {
  PASTOR = 'Pasteur',
  DEACON = 'Diacre',
  MUSICIAN = 'Musicien',
  MEMBER = 'Membre',
  STAFF = 'Staff',
  VOLUNTEER = 'Bénévole'
}

export enum SystemRole {
  ADMIN = 'Administrateur', // Accès total
  EDITOR = 'Éditeur',       // Peut modifier mais pas supprimer ou configurer
  VIEWER = 'Observateur',   // Lecture seule
  NONE = 'Aucun Accès'      // Ne peut pas se connecter
}

export enum AssetStatus {
  GOOD = 'Bon état',
  NEEDS_REPAIR = 'À réparer',
  BROKEN = 'Hors service',
  LOST = 'Perdu'
}

export enum TransactionType {
  INCOME = 'Revenu',
  EXPENSE = 'Dépense'
}

export enum MaritalStatus {
  SINGLE = 'Célibataire',
  MARRIED = 'Marié(e)',
  DIVORCED = 'Divorcé(e)',
  WIDOWED = 'Veuf/Veuve'
}

export interface Ministry {
  id: string;
  name: string;
  description: string;
  leaderId?: string; // ID of the member leading the ministry
  meetingDay?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  description: string;
  type: string; // 'Culte', 'Réunion', 'Autre'
  location: string;
  usedAssetIds?: string[]; // IDs of assets used during this event
}

export interface AttendanceRecord {
    eventId: string;
    date: string;
    presentMemberIds: string[];
    absentMemberIds?: string[]; // List of explicitly absent members
    visitorCount: number;
    notes?: string;
}

export interface Child {
  name: string;
  ministryId?: string; // ID of the ministry the child belongs to (e.g. Sunday School)
}

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  familyName?: string;
  role: string; // Changed from Role enum to string to allow dynamic roles
  systemRole?: SystemRole; // New field for app access control
  email: string;
  phone: string;
  password?: string; // User password for login
  address?: string;
  photo?: string;
  birthDate?: string;
  maritalStatus?: MaritalStatus;
  profession?: string;
  joinDate: string;
  ministryIds?: string[]; // IDs of ministries the member belongs to
  
  // Documents & Identity
  nationality?: string;
  passportNumber?: string;
  drivingLicense?: string; // e.g., "Permis B", "A, B"
  identityDocument?: string; // Base64 scan of ID/Passport

  // Children
  children?: Child[];

  // Emergency Contact
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}

export interface Asset {
  id: string;
  name: string;
  category: string;
  value: number;
  purchaseDate: string;
  status: AssetStatus;
  location: string; // Storage location
  
  // Borrowing logic
  isBorrowed?: boolean;
  borrowedBy?: string; // Name of the person
  borrowDate?: string;
  usageLocation?: string; // Where it is being used currently
}

export interface AssetLog {
    id: string;
    assetId: string;
    assetName: string;
    // Fix: Changed from 'CHECK_OUT' | 'CHECK_IN' to string to support maintenance, legacy values (Sortie/Entrée), and other custom actions
    action: string; 
    date: string;
    memberName: string; // Who took it or returned it
    location: string; // Where it was used
    notes?: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  date: string;
  category: string;
  description: string;
}

export interface ChurchInfo {
  name: string;
  slogan: string;
  idRef: string;
  logo?: string; // Base64 string
  accessCode?: string; // Code d'accès administrateur
}

export interface AppData {
  churchInfo: ChurchInfo;
  members: Member[];
  assets: Asset[];
  assetLogs: AssetLog[]; // History of asset movements
  transactions: Transaction[];
  ministries: Ministry[];
  events: CalendarEvent[];
  attendance: AttendanceRecord[];
  roles: string[]; // List of available member roles
  transactionCategories: string[]; // List of available transaction categories
  assetCategories: string[]; // List of available asset categories
  
  // Permissions: Key is SystemRole, Value is array of view IDs (e.g. 'finance', 'members')
  rolePermissions: Record<string, string[]>; 
}