import React, { useState, useEffect } from 'react';
import { User, Role, UserStatus, Post, Meeting, ThemeMode, BIHAR_DISTRICTS } from './types';
import { Auth, PendingApprovalScreen } from './components/Auth';
import { Layout } from './components/Layout';
import { Feed } from './components/Feed';
import { Directory } from './components/Directory';
import { MapPin, Calendar, Check, X, Clock, CheckCircle, ArrowLeft, Phone, User as UserIcon, Bell, BadgeCheck, Shield, Edit2, Video, MoreVertical, Trash2, Ban, AlertTriangle, LandPlot, RefreshCw, FileText } from 'lucide-react';
import { Language, translations, simulateDynamicTranslation } from './services/translations';
import { STORAGE_LIMIT_GB } from './services/config';
import { MOCK_USERS, MOCK_POSTS, MOCK_MEETINGS } from './services/mockData';

export const App: React.FC = () => {
    // Global State
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [currentTab, setCurrentTab] = useState('home');
    const [currentLang, setCurrentLang] = useState<Language>('en');
    
    // Theme State
    const [themeMode, setThemeMode] = useState<ThemeMode>('system');

    // UI State
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
    const [viewingNotice, setViewingNotice] = useState<Post | null>(null);
    const [showCreateMeetingModal, setShowCreateMeetingModal] = useState(false);
    const [showEditProfileModal, setShowEditProfileModal] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [approvalTarget, setApprovalTarget] = useState<User | null>(null);
    
    // Detailed Profile Admin Menu State
    const [showDetailAdminMenu, setShowDetailAdminMenu] = useState(false);

    // Data State (LOCAL MOCKS INSTEAD OF FIREBASE)
    const [users, setUsers] = useState<User[]>(MOCK_USERS);
    const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
    const [meetings, setMeetings] = useState<Meeting[]>(MOCK_MEETINGS);
    const [readNoticeIds, setReadNoticeIds] = useState<Set<string>>(new Set());

    const t = translations[currentLang];
    
    // Derived State
    const hasNotices = posts.some(p => p.isNotice && !readNoticeIds.has(p.id));
    const allNotices = posts.filter(p => p.isNotice);

    // Forms
    const [newMeeting, setNewMeeting] = useState<{
        title: string; date: string; time: string; venue: string; meetingType: 'physical' | 'whatsapp'; agenda: string; targetDistrict: string;
    }>({
        title: '', date: '', time: '', venue: '', meetingType: 'physical', agenda: '', targetDistrict: 'All Bihar'
    });
    
    const [editProfileData, setEditProfileData] = useState({
        name: '', mobile: '', district: '', designation: '', fatherName: ''
    });

    // --- Lifecycle Logic: Theme Only (No Firebase Listeners) ---
    useEffect(() => {
        // Theme
        const root = window.document.documentElement;
        root.classList.remove('light', 'dark');
        if (themeMode === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            root.classList.add(systemTheme);
        } else {
            root.classList.add(themeMode);
        }
    }, [themeMode]);

    // Handlers
    const checkStorageAndCleanup = () => {
        // Placeholder for future storage logic
        const mockStorageUsage = 4.5; 
        if (mockStorageUsage > STORAGE_LIMIT_GB) {
            console.warn("Storage Limit Warning");
        }
    };

    const handleLogin = async (mobile: string) => {
        // MOCK LOGIN: Check local state array
        const foundUser = users.find(u => u.mobile === mobile);
        
        if (foundUser) {
            if (foundUser.status === UserStatus.SUSPENDED) { 
                alert("Your account has been suspended."); 
                return; 
            }
            if (foundUser.status === UserStatus.DELETED) { 
                alert("Account not found."); 
                return; 
            }
            setCurrentUser(foundUser);
            
            if (foundUser.role === Role.SUPER_ADMIN) {
                checkStorageAndCleanup();
            }
        } else {
            alert('User not found! Please sign up.');
        }
    };

    const handleSignup = async (data: any) => {
        // MOCK SIGNUP: Update local state
        const newUserId = `user${Date.now()}`;
        const newUser: User = {
            id: newUserId,
            name: data.name,
            fatherName: data.fatherName,
            mobile: data.mobile,
            district: data.district,
            designation: data.designation,
            jurisdiction: data.jurisdiction,
            role: Role.MEMBER,
            status: UserStatus.PENDING, 
            appointmentLetterUrl: data.appointmentLetterUrl
        };
        
        setUsers(prev => [...prev, newUser]);
        setCurrentUser(newUser); 
        alert("Signup successful! Pending approval.");
    };

    const handleLogout = () => {
        setCurrentUser(null);
        setCurrentTab('home');
        setSelectedUser(null);
        setSelectedMeeting(null);
        setViewingNotice(null);
    };

    const handleAddPost = async (content: string, imageUrl?: string, isNotice: boolean = false, expiryHours: number = 72) => {
        if (!currentUser) return;
        
        const newPost: Post = {
            id: `post_${Date.now()}`,
            userId: currentUser.id,
            userName: currentUser.name,
            userDesignation: currentUser.designation,
            userPhoto: currentUser.photoUrl,
            content,
            imageUrl, 
            timestamp: Date.now(),
            likes: 0,
            isNotice,
            expiryDate: isNotice ? Date.now() + (expiryHours * 60 * 60 * 1000) : undefined
        };
        
        setPosts(prev => [newPost, ...prev]);
    };

    const handleLikePost = async (postId: string, isLiked: boolean) => {
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                return { ...p, likes: p.likes + (isLiked ? -1 : 1) };
            }
            return p;
        }));
    };

    const handleAddMember = async (memberData: any) => {
        if (!currentUser || currentUser.role !== Role.SUPER_ADMIN) return;
        
        const newUserId = `user${Date.now()}`;
        const newUser: User = {
            id: newUserId,
            ...memberData,
            role: Role.MEMBER,
            status: UserStatus.APPROVED,
            photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
        };
        
        setUsers(prev => [...prev, newUser]);
        alert("Member added successfully!");
    };

    const handleUpdateUserStatus = async (userId: string, status: UserStatus) => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
        if (selectedUser && selectedUser.id === userId) {
            setSelectedUser(prev => prev ? { ...prev, status } : null);
        }
    };

    const handleApproveUser = async (userId: string) => {
        setUsers(prev => prev.map(u => {
            if (u.id === userId) {
                if (u.pendingChanges) {
                    return { ...u, ...u.pendingChanges, pendingChanges: undefined, status: UserStatus.APPROVED };
                }
                return { ...u, status: UserStatus.APPROVED };
            }
            return u;
        }));
        setShowApprovalModal(false);
        setApprovalTarget(null);
    };

    const handleRejectUser = async (userId: string) => {
        setUsers(prev => prev.map(u => {
            if (u.id === userId) {
                if (u.pendingChanges) {
                    return { ...u, pendingChanges: undefined, rejectionReason: "Changes Rejected" };
                }
                return { ...u, status: UserStatus.REJECTED };
            }
            return u;
        }));
        setShowApprovalModal(false);
        setApprovalTarget(null);
    };

    const handleDeleteUser = async (userId: string) => {
        setUsers(prev => prev.filter(u => u.id !== userId));
        setSelectedUser(null);
    };

    const handlePromoteToSubAdmin = async (userId: string) => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: Role.SUB_ADMIN } : u));
        if (selectedUser && selectedUser.id === userId) setSelectedUser({ ...selectedUser, role: Role.SUB_ADMIN });
    };

    const handleAssignBadge = async (userId: string, badge: 'blue' | 'green' | 'red' | null) => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, badge } : u));
        if (selectedUser && selectedUser.id === userId) setSelectedUser({ ...selectedUser, badge: badge });
    };

    const handleCreateMeeting = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!currentUser) return;
        
        const meetingId = `meet${Date.now()}`;
        const newMeet: Meeting = { id: meetingId, ...newMeeting, createdBy: currentUser.id };
        
        setMeetings(prev => [...prev, newMeet]);
        
        const locationText = newMeeting.meetingType === 'whatsapp' ? 'WhatsApp Video Call' : newMeeting.venue;
        const noticeContent = `NEW EVENT: ${newMeeting.title} on ${newMeeting.date} at ${newMeeting.time}. Location: ${locationText}. Target: ${newMeeting.targetDistrict}`;
        
        handleAddPost(noticeContent, undefined, true);

        setShowCreateMeetingModal(false);
        setNewMeeting({ title: '', date: '', time: '', venue: '', meetingType: 'physical', agenda: '', targetDistrict: 'All Bihar' });
    };

    const handleEditProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!currentUser) return;
        
        const updatedUser = { ...currentUser, pendingChanges: editProfileData };
        setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
        setCurrentUser(updatedUser);
        
        setShowEditProfileModal(false);
        alert("Profile update request submitted!");
    };

    const openEditProfile = () => {
        if (currentUser) {
            setEditProfileData({
                name: currentUser.name,
                mobile: currentUser.mobile,
                district: currentUser.district,
                designation: currentUser.designation,
                fatherName: currentUser.fatherName
            });
            setShowEditProfileModal(true);
        }
    };

    const handleNoticeClick = (post: Post) => {
        setReadNoticeIds(prev => new Set(prev).add(post.id));
        if (post.relatedMeetingId) {
            const meeting = meetings.find(m => m.id === post.relatedMeetingId);
            if (meeting) {
                setCurrentTab('meetings');
                setSelectedMeeting(meeting);
                return;
            }
        }
        setViewingNotice(post);
    };

    // Render Components
    if (!currentUser) return <Auth onLogin={handleLogin} onSignup={handleSignup} currentLang={currentLang} onLangChange={setCurrentLang} totalUsers={users.length} />;
    if (currentUser.status === UserStatus.PENDING) return <PendingApprovalScreen onLogout={handleLogout} t={t} />;

    const renderContent = () => {
        if (viewingNotice) {
            return <div className="p-4">Notice View Placeholder</div>; 
        }

        switch (currentTab) {
            case 'home':
                const handleDeletePost = (id: string) => {
                    setPosts(prev => prev.filter(p => p.id !== id));
                };

                return <Feed currentUser={currentUser} posts={posts} onAddPost={handleAddPost} onDeletePost={handleDeletePost} onLikePost={handleLikePost} t={t} currentLang={currentLang} onNoticeClick={handleNoticeClick} />;
            
            case 'directory':
                if (selectedUser) {
                    const isPrivileged = currentUser.role === Role.SUPER_ADMIN || currentUser.role === Role.SUB_ADMIN || currentUser.id === selectedUser.id;

                    return (
                        <div className="animate-fade-in space-y-6">
                             <div className="flex justify-between items-center mb-4">
                                <button onClick={() => setSelectedUser(null)} className="flex items-center text-gray-500 hover:text-ljp-secondary dark:hover:text-blue-400 font-bold transition-colors">
                                    <ArrowLeft size={20} className="mr-2" /> {t.back}
                                </button>
                                
                                {currentUser.role === Role.SUPER_ADMIN && selectedUser.id !== currentUser.id && (
                                    <div className="relative">
                                        <button onClick={() => setShowDetailAdminMenu(!showDetailAdminMenu)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                                            <MoreVertical size={20} />
                                        </button>
                                        {showDetailAdminMenu && (
                                            <div className="absolute right-0 top-12 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 py-2 z-30 animate-fade-in">
                                                <button onClick={() => { handlePromoteToSubAdmin(selectedUser.id); setShowDetailAdminMenu(false); }} className="w-full text-left px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center"><Shield size={16} className="mr-3 text-purple-500"/> {t.promoteSubAdmin}</button>
                                                <div className="border-t my-1 dark:border-gray-700"></div>
                                                <button onClick={() => { handleAssignBadge(selectedUser.id, 'blue'); setShowDetailAdminMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center"><span className="w-3 h-3 rounded-full bg-blue-500 mr-3"></span> {t.badgeBlue}</button>
                                                <button onClick={() => { handleAssignBadge(selectedUser.id, 'green'); setShowDetailAdminMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center"><span className="w-3 h-3 rounded-full bg-green-500 mr-3"></span> {t.badgeGreen}</button>
                                                <button onClick={() => { handleAssignBadge(selectedUser.id, 'red'); setShowDetailAdminMenu(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center"><span className="w-3 h-3 rounded-full bg-red-500 mr-3"></span> {t.badgeRed}</button>
                                                <div className="border-t my-1 dark:border-gray-700"></div>
                                                <button onClick={() => { if(confirm(t.deleteConfirm)) handleDeleteUser(selectedUser.id); setShowDetailAdminMenu(false); setSelectedUser(null); }} className="w-full text-left px-4 py-3 text-sm hover:bg-red-50 dark:hover:bg-red-900/10 text-red-600 flex items-center"><Trash2 size={16} className="mr-3"/> {t.deleteMember}</button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 relative">
                                <div className="h-40 bg-gradient-to-r from-ljp-secondary to-black dark:from-blue-900 dark:to-gray-900"></div>
                                <div className="px-8 relative">
                                    <div className="absolute -top-20">
                                        <div className="relative inline-block">
                                            <img src={selectedUser.photoUrl || "https://picsum.photos/150/150"} className="w-40 h-40 rounded-full border-4 border-white dark:border-gray-800 shadow-lg object-cover bg-gray-200" alt={selectedUser.name} />
                                            {selectedUser.badge && (
                                                <div className="absolute bottom-2 right-2 bg-white dark:bg-gray-900 rounded-full p-1.5 shadow-md z-10">
                                                    {selectedUser.badge === 'blue' && <BadgeCheck size={28} className="text-blue-500 fill-blue-500/10" />}
                                                    {selectedUser.badge === 'green' && <BadgeCheck size={28} className="text-green-500 fill-green-500/10" />}
                                                    {selectedUser.badge === 'red' && <BadgeCheck size={28} className="text-red-500 fill-red-500/10" />}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-24 px-8 pb-10">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                                                {selectedUser.name}
                                                {selectedUser.role === Role.SUB_ADMIN && <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-full font-bold">SUB-ADMIN</span>}
                                            </h2>
                                            <p className="text-ljp-secondary dark:text-blue-400 font-bold text-lg">{simulateDynamicTranslation(selectedUser.designation, currentLang)}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                                        <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
                                            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-2">{t.targetDistrict}</label>
                                            <p className="font-semibold flex items-center text-gray-700 dark:text-gray-200 text-lg"><MapPin size={20} className="mr-2 text-ljp-accent" /> {selectedUser.district}</p>
                                        </div>
                                        
                                        {/* Hide Sensitive Info for non-privileged users viewing others */}
                                        {isPrivileged ? (
                                            <>
                                                <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
                                                    <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-2">Mobile</label>
                                                    <p className="font-semibold flex items-center text-gray-700 dark:text-gray-200 text-lg"><Phone size={20} className="mr-2 text-ljp-accent" /> {selectedUser.mobile}</p>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
                                                    <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-2">Father's Name</label>
                                                    <p className="font-semibold flex items-center text-gray-700 dark:text-gray-200 text-lg"><UserIcon size={20} className="mr-2 text-ljp-accent" /> {selectedUser.fatherName}</p>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 opacity-60">
                                                    <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-2">Mobile</label>
                                                    <p className="font-semibold flex items-center text-gray-500 dark:text-gray-400 text-lg italic"><Phone size={20} className="mr-2" /> Hidden</p>
                                                </div>
                                                <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 opacity-60">
                                                    <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-2">Father's Name</label>
                                                    <p className="font-semibold flex items-center text-gray-500 dark:text-gray-400 text-lg italic"><UserIcon size={20} className="mr-2" /> Hidden</p>
                                                </div>
                                            </>
                                        )}

                                        <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
                                            <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-2">Area / Jurisdiction</label>
                                            <p className="font-semibold flex items-center text-gray-700 dark:text-gray-200 text-lg">
                                                <LandPlot size={20} className="mr-2 text-ljp-accent" /> 
                                                {selectedUser.jurisdiction || 'Not Specified'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {currentUser.role === Role.SUPER_ADMIN && selectedUser.id !== currentUser.id && (
                                        <div className="mt-8 border-t border-gray-100 dark:border-gray-700 pt-6">
                                            <h4 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">Admin Quick Actions</h4>
                                            <div className="flex flex-wrap gap-2">
                                                <button onClick={() => handleUpdateUserStatus(selectedUser.id, UserStatus.SUSPENDED)} className="px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg text-xs font-bold hover:bg-yellow-100"><Ban size={14} className="inline mr-1"/> {t.suspendMember}</button>
                                                <button onClick={() => handleDeleteUser(selectedUser.id)} className="px-4 py-2 bg-red-50 text-red-700 rounded-lg text-xs font-bold hover:bg-red-100"><Trash2 size={14} className="inline mr-1"/> {t.deleteMember}</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                }
                return <Directory currentUser={currentUser} users={users} onUserClick={setSelectedUser} t={t} onUpdateUserStatus={handleUpdateUserStatus} onDeleteUser={handleDeleteUser} onAddMember={handleAddMember} onPromoteUser={handlePromoteToSubAdmin} onAssignBadge={handleAssignBadge} currentLang={currentLang} />;

            case 'meetings':
                if (selectedMeeting) {
                    return (
                        <div className="animate-fade-in space-y-6">
                            <button onClick={() => setSelectedMeeting(null)} className="flex items-center text-gray-500 font-bold"><ArrowLeft size={20} className="mr-2"/> {t.back}</button>
                            <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl">
                                <h2 className="text-3xl font-bold mb-4 dark:text-white">{selectedMeeting.title}</h2>
                                <p className="dark:text-gray-300 mb-6">{selectedMeeting.agenda}</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl"><Calendar className="mb-2 text-ljp-secondary"/>{selectedMeeting.date}</div>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl"><MapPin className="mb-2 text-ljp-secondary"/>{selectedMeeting.venue}</div>
                                </div>
                            </div>
                        </div>
                    );
                }
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.meetings}</h2>
                            {currentUser.role === Role.SUPER_ADMIN && <button onClick={() => setShowCreateMeetingModal(true)} className="bg-ljp-secondary text-white px-5 py-2.5 rounded-xl font-bold text-sm">+ {t.scheduleMeeting}</button>}
                        </div>
                        {meetings.map(m => (
                            <div key={m.id} onClick={() => setSelectedMeeting(m)} className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-all">
                                <h3 className="font-bold text-lg dark:text-white">{simulateDynamicTranslation(m.title, currentLang)}</h3>
                                <div className="flex gap-4 text-xs text-gray-500 mt-2">
                                    <span className="flex items-center"><Calendar size={14} className="mr-1"/> {m.date}</span>
                                    <span className="flex items-center">{m.meetingType === 'whatsapp' ? <Video size={14} className="mr-1 text-green-500"/> : <MapPin size={14} className="mr-1"/>} {m.meetingType === 'whatsapp' ? 'WhatsApp' : m.venue}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                );

            case 'profile':
                if (currentUser.role === Role.SUPER_ADMIN || currentUser.role === Role.SUB_ADMIN) {
                    const pendingUsers = users.filter(u => (u.status === UserStatus.PENDING || u.pendingChanges) && (currentUser.role === Role.SUPER_ADMIN || u.district === currentUser.district));
                    
                    return (
                        <div className="space-y-6 animate-fade-in">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.adminDashboard}</h2>
                             
                             <div onClick={() => setSelectedUser(currentUser)} className="bg-gradient-to-r from-ljp-secondary to-black dark:from-gray-800 dark:to-gray-900 p-6 rounded-3xl shadow-lg border border-white/10 cursor-pointer hover:scale-[1.01] transition-transform">
                                <div className="flex items-center space-x-5">
                                    <div className="relative">
                                        <img src={currentUser.photoUrl} className="w-20 h-20 rounded-full border-4 border-white/20 object-cover" alt="Profile" />
                                        {currentUser.badge && <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1"><BadgeCheck size={20} className="text-blue-500 fill-blue-500/10" /></div>}
                                    </div>
                                    <div>
                                        <p className="font-bold text-xl text-white mb-1">{currentUser.name}</p>
                                        <p className="text-white/70 font-medium">{simulateDynamicTranslation(currentUser.designation, currentLang)}</p>
                                        <span className="text-xs text-ljp-accent font-bold mt-2 inline-block uppercase tracking-wider">{t.tapToView}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                                <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
                                        <Clock size={18} className="text-yellow-500" /> {t.approvalPending} ({pendingUsers.length})
                                    </h3>
                                </div>
                                {pendingUsers.length === 0 ? (
                                    <div className="p-6 text-center text-gray-500 dark:text-gray-400 text-xs">No pending requests</div>
                                ) : (
                                    <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-60 overflow-y-auto">
                                        {pendingUsers.map(u => (
                                            <div key={u.id} className="p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer" onClick={() => { setApprovalTarget(u); setShowApprovalModal(true); }}>
                                                <div>
                                                    <h4 className="font-bold text-sm dark:text-white flex items-center gap-2">
                                                        {u.name}
                                                    </h4>
                                                    <p className="text-xs text-gray-500">{u.designation}</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {u.pendingChanges ? (
                                                        <span className="bg-blue-50 text-blue-600 dark:bg-blue-900/20 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1">
                                                            <RefreshCw size={10} /> {t.profileUpdateReq}
                                                        </span>
                                                    ) : (
                                                        <span className="bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1">
                                                            <Clock size={10} /> Verification
                                                        </span>
                                                    )}
                                                    <button className="bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg text-xs font-bold">{t.review}</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                }
                
                return (
                    <div className="animate-fade-in space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.myProfile}</h2>
                            <button onClick={openEditProfile} className="flex items-center gap-2 bg-ljp-secondary text-white px-4 py-2 rounded-xl text-xs font-bold hover:brightness-110 shadow-lg shadow-blue-200 dark:shadow-none transition-all">
                                <Edit2 size={16} /> <span className="hidden sm:inline">{t.requestEdit}</span>
                            </button>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 relative">
                            <div className="h-40 bg-gradient-to-r from-ljp-secondary to-black dark:from-blue-900 dark:to-gray-900"></div>
                            <div className="px-8 relative">
                                <div className="absolute -top-20">
                                    <div className="relative inline-block">
                                        <img src={currentUser.photoUrl || "https://picsum.photos/150/150"} className="w-40 h-40 rounded-full border-4 border-white dark:border-gray-800 shadow-lg object-cover bg-gray-200" alt={currentUser.name} />
                                        {currentUser.badge && (
                                            <div className="absolute bottom-2 right-2 bg-white dark:bg-gray-900 rounded-full p-1.5 shadow-md z-10">
                                                {currentUser.badge === 'blue' && <BadgeCheck size={28} className="text-blue-500 fill-blue-500/10" />}
                                                {currentUser.badge === 'green' && <BadgeCheck size={28} className="text-green-500 fill-green-500/10" />}
                                                {currentUser.badge === 'red' && <BadgeCheck size={28} className="text-red-500 fill-red-500/10" />}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-24 px-8 pb-10">
                                <div>
                                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                                        {currentUser.name}
                                    </h2>
                                    <p className="text-ljp-secondary dark:text-blue-400 font-bold text-lg">{simulateDynamicTranslation(currentUser.designation, currentLang)}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                                    <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
                                        <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-2">{t.targetDistrict}</label>
                                        <p className="font-semibold flex items-center text-gray-700 dark:text-gray-200 text-lg"><MapPin size={20} className="mr-2 text-ljp-accent" /> {currentUser.district}</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
                                        <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-2">Mobile</label>
                                        <p className="font-semibold flex items-center text-gray-700 dark:text-gray-200 text-lg"><Phone size={20} className="mr-2 text-ljp-accent" /> {currentUser.mobile}</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
                                        <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-2">Area / Jurisdiction</label>
                                        <p className="font-semibold flex items-center text-gray-700 dark:text-gray-200 text-lg">
                                            <LandPlot size={20} className="mr-2 text-ljp-accent" /> 
                                            {currentUser.jurisdiction || 'Not Specified'}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
                                        <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-2">Status</label>
                                        <p className="font-bold text-green-600 flex items-center text-lg">
                                            <CheckCircle size={20} className="mr-2" /> Active Member
                                        </p>
                                    </div>
                                </div>

                                {currentUser.pendingChanges && (
                                     <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 p-4 rounded-xl flex items-start gap-3">
                                        <AlertTriangle className="text-yellow-600 shrink-0" size={20} />
                                        <div>
                                            <h4 className="font-bold text-yellow-800 dark:text-yellow-500 text-sm">{t.changesPending}</h4>
                                            <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">Changes submitted: {currentUser.pendingChanges.designation} ({currentUser.pendingChanges.district})</p>
                                        </div>
                                     </div>
                                )}
                            </div>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <Layout 
            currentTab={currentTab} 
            onTabChange={(tab) => { setCurrentTab(tab); setSelectedUser(null); setSelectedMeeting(null); setViewingNotice(null); }} 
            userRole={currentUser.role}
            onLogout={handleLogout}
            currentLang={currentLang}
            onLangChange={setCurrentLang}
            t={t}
            themeMode={themeMode}
            onThemeChange={setThemeMode}
            hasNotices={hasNotices}
            allNotices={allNotices}
            onNoticeClick={handleNoticeClick}
        >
            {renderContent()}
            
            {showCreateMeetingModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateMeetingModal(false)}></div>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl p-6 relative z-10 shadow-2xl animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{t.scheduleMeeting}</h3>
                            <button onClick={() => setShowCreateMeetingModal(false)}><X size={20} className="text-gray-500" /></button>
                        </div>
                        <form onSubmit={handleCreateMeeting} className="space-y-4">
                            <input type="text" placeholder={t.title} required className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 text-sm dark:text-white" onChange={e => setNewMeeting({...newMeeting, title: e.target.value})} />
                            <div className="grid grid-cols-2 gap-4">
                                <input type="date" required className="bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 text-sm dark:text-white" onChange={e => setNewMeeting({...newMeeting, date: e.target.value})} />
                                <input type="time" required className="bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 text-sm dark:text-white" onChange={e => setNewMeeting({...newMeeting, time: e.target.value})} />
                            </div>
                            <div className="flex gap-2 bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
                                <button type="button" onClick={() => setNewMeeting({...newMeeting, meetingType: 'physical'})} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${newMeeting.meetingType === 'physical' ? 'bg-white dark:bg-gray-700 shadow-sm text-black dark:text-white' : 'text-gray-500'}`}>{t.physical}</button>
                                <button type="button" onClick={() => setNewMeeting({...newMeeting, meetingType: 'whatsapp'})} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${newMeeting.meetingType === 'whatsapp' ? 'bg-green-100 text-green-700' : 'text-gray-500'}`}>{t.whatsapp}</button>
                            </div>
                            {newMeeting.meetingType === 'physical' ? (
                                <input type="text" placeholder={t.venue} required className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 text-sm dark:text-white" onChange={e => setNewMeeting({...newMeeting, venue: e.target.value})} />
                            ) : (
                                <div className="p-3 bg-green-50 text-green-700 rounded-xl text-sm font-bold flex items-center justify-center border border-green-100"><Video size={18} className="mr-2" /> {t.whatsappCall}</div>
                            )}
                            <textarea placeholder={t.agenda} className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 text-sm dark:text-white" rows={3} onChange={e => setNewMeeting({...newMeeting, agenda: e.target.value})} />
                            <select className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 text-sm dark:text-white" onChange={e => setNewMeeting({...newMeeting, targetDistrict: e.target.value})}>
                                <option value="All Bihar">{t.allDistricts}</option>
                                {BIHAR_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <button className="w-full bg-ljp-secondary text-white py-3 rounded-xl font-bold hover:brightness-110">{t.scheduleMeeting}</button>
                        </form>
                    </div>
                </div>
            )}

            {showApprovalModal && approvalTarget && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowApprovalModal(false)}></div>
                    <div className={`bg-white dark:bg-gray-800 w-full ${approvalTarget.pendingChanges ? 'max-w-3xl' : 'max-w-lg'} rounded-3xl p-6 relative z-10 shadow-2xl animate-fade-in flex flex-col max-h-[95vh] overflow-hidden transition-all`}>
                        
                        <div className="flex justify-between items-start mb-1">
                            <div>
                                <h3 className="font-bold text-xs text-gray-400 uppercase tracking-widest">{approvalTarget.pendingChanges ? t.compareChanges : 'New Member Review'}</h3>
                            </div>
                            <button onClick={() => setShowApprovalModal(false)} className="p-1 -mr-2 -mt-2"><X size={20} className="text-gray-400" /></button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto no-scrollbar pb-2">
                            {approvalTarget.pendingChanges ? (
                                <div className="space-y-6 pt-2">
                                     <div className="flex items-center gap-4 bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                         <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                            <RefreshCw size={20} />
                                         </div>
                                         <div>
                                             <h4 className="font-bold text-gray-900 dark:text-white text-sm">Profile Update Request</h4>
                                             <p className="text-xs text-gray-500">Requested by {approvalTarget.name}</p>
                                         </div>
                                     </div>

                                     <div className="grid grid-cols-2 gap-8 relative">
                                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-100 dark:bg-gray-700 -ml-px hidden md:block"></div>
                                        
                                        <div className="space-y-4">
                                            <h4 className="font-bold text-gray-500 uppercase text-xs tracking-wider">{t.current}</h4>
                                            
                                            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 opacity-60">
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-gray-400 block">Name</label>
                                                        <p className="font-semibold text-gray-900 dark:text-white">{approvalTarget.name}</p>
                                                    </div>
                                                     <div>
                                                        <label className="text-[10px] font-bold text-gray-400 block">Designation</label>
                                                        <p className="font-semibold text-gray-900 dark:text-white">{approvalTarget.designation}</p>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-gray-400 block">District</label>
                                                        <p className="font-semibold text-gray-900 dark:text-white">{approvalTarget.district}</p>
                                                    </div>
                                                     <div>
                                                        <label className="text-[10px] font-bold text-gray-400 block">Mobile</label>
                                                        <p className="font-semibold text-gray-900 dark:text-white">{approvalTarget.mobile}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <h4 className="font-bold text-blue-600 uppercase text-xs tracking-wider">{t.new}</h4>
                                             <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border-2 border-blue-500/20 shadow-sm">
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-gray-400 block">Name</label>
                                                        <p className={`font-semibold ${approvalTarget.pendingChanges.name && approvalTarget.pendingChanges.name !== approvalTarget.name ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                                                            {approvalTarget.pendingChanges.name || approvalTarget.name}
                                                        </p>
                                                    </div>
                                                     <div>
                                                        <label className="text-[10px] font-bold text-gray-400 block">Designation</label>
                                                        <p className={`font-semibold ${approvalTarget.pendingChanges.designation && approvalTarget.pendingChanges.designation !== approvalTarget.designation ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                                                            {approvalTarget.pendingChanges.designation || approvalTarget.designation}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-gray-400 block">District</label>
                                                        <p className={`font-semibold ${approvalTarget.pendingChanges.district && approvalTarget.pendingChanges.district !== approvalTarget.district ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                                                            {approvalTarget.pendingChanges.district || approvalTarget.district}
                                                        </p>
                                                    </div>
                                                     <div>
                                                        <label className="text-[10px] font-bold text-gray-400 block">Mobile</label>
                                                        <p className={`font-semibold ${approvalTarget.pendingChanges.mobile && approvalTarget.pendingChanges.mobile !== approvalTarget.mobile ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                                                            {approvalTarget.pendingChanges.mobile || approvalTarget.mobile}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                     </div>
                                </div>
                            ) : (
                                <div className="space-y-6 pt-2">
                                    <div className="text-center">
                                        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">{approvalTarget.name}</h2>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Applied For</p>
                                            <p className="font-bold text-ljp-secondary dark:text-blue-400 leading-tight">{approvalTarget.designation}</p>
                                            {approvalTarget.jurisdiction && <p className="text-xs text-gray-500">{approvalTarget.jurisdiction}</p>}
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">District</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">{approvalTarget.district}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Father's Name</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">{approvalTarget.fatherName}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Mobile</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">{approvalTarget.mobile}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 ml-1 flex items-center gap-1">
                                            <BadgeCheck size={14} className="text-green-600" /> Appointment Letter / ID Proof
                                        </p>
                                        <div className="aspect-[4/3] w-full bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-700 relative group">
                                            {approvalTarget.appointmentLetterUrl ? (
                                                <img 
                                                    src={approvalTarget.appointmentLetterUrl} 
                                                    alt="Document" 
                                                    className="w-full h-full object-contain"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                                    <AlertTriangle size={32} className="mb-2 opacity-50"/>
                                                    <span className="text-xs">No Document Uploaded</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 pt-4 mt-2 border-t border-gray-100 dark:border-gray-700">
                            <button onClick={() => handleRejectUser(approvalTarget.id)} className="flex-1 bg-red-50 text-red-600 py-3.5 rounded-xl font-bold hover:bg-red-100 transition-colors">{t.reject}</button>
                            <button onClick={() => handleApproveUser(approvalTarget.id)} className="flex-[2] bg-green-600 text-white py-3.5 rounded-xl font-bold hover:bg-green-700 transition-colors shadow-lg shadow-green-200 dark:shadow-none">{t.approve}</button>
                        </div>
                    </div>
                </div>
            )}
            
            {showEditProfileModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowEditProfileModal(false)}></div>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl p-6 relative z-10 shadow-2xl animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{t.requestEdit}</h3>
                            <button onClick={() => setShowEditProfileModal(false)}><X size={20} className="text-gray-500" /></button>
                        </div>
                        <form onSubmit={handleEditProfileSubmit} className="space-y-4">
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Update your details for admin approval.</p>
                            <input type="text" placeholder={t.namePlaceholder} value={editProfileData.name} onChange={e => setEditProfileData({...editProfileData, name: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 text-sm dark:text-white" />
                             <input type="text" placeholder={t.fatherPlaceholder} value={editProfileData.fatherName} onChange={e => setEditProfileData({...editProfileData, fatherName: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 text-sm dark:text-white" />
                            <input type="tel" placeholder={t.mobilePlaceholder} value={editProfileData.mobile} onChange={e => setEditProfileData({...editProfileData, mobile: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 text-sm dark:text-white" />
                             <select value={editProfileData.district} onChange={e => setEditProfileData({...editProfileData, district: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 text-sm dark:text-white">
                                {BIHAR_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <input type="text" placeholder={t.designationPlaceholder} value={editProfileData.designation} onChange={e => setEditProfileData({...editProfileData, designation: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 text-sm dark:text-white" />
                            
                            <button className="w-full bg-ljp-secondary text-white py-3 rounded-xl font-bold hover:brightness-110">
                                {t.submit}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};