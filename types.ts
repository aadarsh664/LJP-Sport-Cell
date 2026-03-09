export enum Role {
    SUPER_ADMIN = 'SUPER_ADMIN',
    SUB_ADMIN = 'SUB_ADMIN',
    MEMBER = 'MEMBER'
}

export enum UserStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    SUSPENDED = 'SUSPENDED',
    DELETED = 'DELETED' // Soft delete status
}

export interface User {
    id: string;
    name: string;
    name_hi?: string; // New: Translated name
    fatherName: string;
    fatherName_hi?: string; // New: Translated father's name
    mobile: string;
    district: string;
    designation: string;
    jurisdiction?: string;
    jurisdiction_hi?: string; // New: Translated jurisdiction
    role: Role;
    status: UserStatus;
    photoUrl?: string;
    appointmentLetterUrl?: string;
    pendingChanges?: Partial<User>;
    badge?: 'blue' | 'green' | 'red' | null;
    rejectionReason?: string;
    joinedDate: number;
}

export interface Post {
    id: string;
    userId: string;
    userName: string;
    userDesignation: string;
    userPhoto?: string;
    content: string;
    imageUrl?: string;
    timestamp: number;
    likes: number;
    shares?: number;
    comments?: number;
    isNotice?: boolean;
    expiryDate?: number;
    targetDistrict?: string; // New: For filtering notices
    relatedMeetingId?: string;
}

export interface Meeting {
    id: string;
    title: string;
    date: string;
    time: string;
    venue?: string;
    meetingLink?: string; // New: For virtual meetings
    meetingType: 'physical' | 'whatsapp' | 'virtual'; // Added virtual
    agenda: string;
    targetDistrict: 'All Bihar' | string;
    createdBy: string;
}

export const DESIGNATIONS = [
    'Pradesh Adhyaksh',
    'Zila Adhyaksh',
    'Prakhand Adhyaksh',
    'Ward Sadasya',
    'Karyakarta',
    'Other'
];

export const BIHAR_DISTRICTS = [
    "Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar",
    "Darbhanga", "East Champaran", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur",
    "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger",
    "Muzaffarpur", "Nalanda", "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur",
    "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran"
];

export type ThemeMode = 'light' | 'dark' | 'system';