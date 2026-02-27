import { User, Role, UserStatus, Post, Meeting } from '../types';

// Initial Mock Users
export const MOCK_USERS: User[] = [
    {
        id: 'admin_test',
        name: 'Test Admin',
        fatherName: 'System',
        mobile: '9341749399',
        district: 'Patna',
        designation: 'State President',
        jurisdiction: 'State Head',
        role: Role.SUPER_ADMIN,
        status: UserStatus.APPROVED,
        photoUrl: 'https://ui-avatars.com/api/?name=Admin&background=2B0080&color=fff'
    },
    {
        id: 'member_test',
        name: 'Test Member',
        fatherName: 'Test Father',
        mobile: '1234567890',
        district: 'Gaya',
        designation: 'Karyakarta',
        role: Role.MEMBER,
        status: UserStatus.APPROVED,
        photoUrl: 'https://ui-avatars.com/api/?name=Member&background=random'
    },
    {
        id: 'admin1',
        name: 'Ram Vilas (Legacy)',
        fatherName: 'Late Leader',
        mobile: '9876543210',
        district: 'Patna',
        designation: 'Pradesh Adhyaksh',
        jurisdiction: 'State Head',
        role: Role.SUPER_ADMIN,
        status: UserStatus.APPROVED,
        photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
    },
    {
        id: 'member1',
        name: 'Amit Kumar',
        fatherName: 'Suresh Kumar',
        mobile: '9123456789',
        district: 'Patna',
        designation: 'Zila Adhyaksh',
        jurisdiction: 'Patna West',
        role: Role.MEMBER,
        status: UserStatus.APPROVED,
        photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
    },
    {
        id: 'member2',
        name: 'Rahul Singh',
        fatherName: 'Vijay Singh',
        mobile: '9988776655',
        district: 'Gaya',
        designation: 'General Secretary',
        role: Role.MEMBER,
        status: UserStatus.PENDING,
        appointmentLetterUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80'
    }
];

export const MOCK_MEETINGS: Meeting[] = [
    {
        id: 'meet1',
        title: 'Strategy Session 2025',
        date: '2023-11-20',
        time: '14:00',
        venue: 'Party Office, Patna',
        meetingType: 'physical',
        agenda: 'Election Roadmap and booth management strategy.',
        targetDistrict: 'All Bihar',
        createdBy: 'admin1'
    }
];

export const MOCK_POSTS: Post[] = [
    {
        id: 'notice1',
        userId: 'admin1',
        userName: 'Ram Vilas (Admin)',
        userDesignation: 'Pradesh Adhyaksh',
        content: 'URGENT: State Executive Meeting scheduled for next Monday. Click to view details.',
        timestamp: Date.now(),
        likes: 150,
        isNotice: true,
        expiryDate: Date.now() + 86400000 * 7,
        relatedMeetingId: 'meet1'
    },
    {
        id: 'post1',
        userId: 'member1',
        userName: 'Amit Kumar',
        userDesignation: 'Zila Adhyaksh',
        content: 'Membership drive successful in Muzaffarpur block today! Jai Bihar.',
        imageUrl: 'https://images.unsplash.com/photo-1541535650810-10d26f5c2ab3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80',
        timestamp: Date.now() - 3600000,
        likes: 45
    }
];