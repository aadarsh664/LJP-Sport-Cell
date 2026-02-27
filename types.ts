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
    fatherName: string;
    mobile: string;
    district: string;
    designation: string;
    jurisdiction?: string; // New: Area/Jurisdiction for large districts
    role: Role;
    status: UserStatus;
    photoUrl?: string;
    appointmentLetterUrl?: string;
    pendingChanges?: Partial<User>; 
    badge?: 'blue' | 'green' | 'red' | null; // Blue=Head, Green=Mid, Red=Low
    rejectionReason?: string; // To show why changes were rejected
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
    relatedMeetingId?: string; 
}

export interface Meeting {
    id: string;
    title: string;
    date: string;
    time: string;
    venue: string;
    meetingType: 'physical' | 'whatsapp'; // New Field
    agenda: string;
    targetDistrict: 'All Bihar' | string;
    createdBy: string;
}

export const BIHAR_DISTRICTS = [
    "Araria", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar", 
    "Darbhanga", "East Champaran", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Kaimur", 
    "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger", 
    "Muzaffarpur", "Nalanda", "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur", 
    "Saran", "Sheikhpura", "Sheohar", "Sitamarhi", "Siwan", "Supaul", "Vaishali", "West Champaran"
]; 

export type ThemeMode = 'light' | 'dark' | 'system';