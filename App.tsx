import React, { useState, useEffect, useRef } from 'react';
import { User, Role, UserStatus, Post, Meeting, ThemeMode, BIHAR_DISTRICTS, DESIGNATIONS } from './types';
import { Auth, PendingApprovalScreen } from './components/Auth';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Directory } from './components/Directory';
import { MapPin, Calendar, Check, X, Clock, CheckCircle, ArrowLeft, Phone, User as UserIcon, Bell, BadgeCheck, Shield, Edit2, Video, MoreVertical, Trash2, Ban, AlertTriangle, LandPlot, RefreshCw, FileText, Download, Share2, ExternalLink, Globe, Sparkles } from 'lucide-react';
import { Language, translations, dynamicTransliterate } from './services/translations';
import { STORAGE_LIMIT_GB } from './services/config';
import { MOCK_USERS, MOCK_POSTS, MOCK_MEETINGS } from './services/mockData';
import { audioService } from './services/audioService';
import { enhanceNotice } from './services/geminiService';
import { toJpeg } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { QRCodeSVG } from 'qrcode.react';

export const App: React.FC = () => {
    // Global State
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [currentTab, setCurrentTab] = useState('home');
    const [currentLang, setCurrentLang] = useState<Language>('en');
    const [hasStarted, setHasStarted] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    
    // Theme State
    const [themeMode, setThemeMode] = useState<ThemeMode>('system');

    // UI State
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
    const [viewingNotice, setViewingNotice] = useState<Post | null>(null);
    const [showCreateMeetingModal, setShowCreateMeetingModal] = useState(false);
    const [showCreateNoticeModal, setShowCreateNoticeModal] = useState(false);
    const [showEditProfileModal, setShowEditProfileModal] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [approvalTarget, setApprovalTarget] = useState<User | null>(null);
    const [meetingFilter, setMeetingFilter] = useState<'All' | 'State Level' | 'District Level'>('All');
    
    // Download Modal State
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [downloadTargetNotice, setDownloadTargetNotice] = useState<Post | null>(null);
    const [downloadFormat, setDownloadFormat] = useState<'jpg' | 'pdf'>('jpg');

    // Detailed Profile Admin Menu State
    const [showDetailAdminMenu, setShowDetailAdminMenu] = useState(false);

    // Data State (LOCAL MOCKS INSTEAD OF FIREBASE)
    const [users, setUsers] = useState<User[]>(MOCK_USERS);
    const [posts, setPosts] = useState<Post[]>(MOCK_POSTS);
    const [meetings, setMeetings] = useState<Meeting[]>(MOCK_MEETINGS);
    const [readNoticeIds, setReadNoticeIds] = useState<Set<string>>(new Set());

    const t = translations[currentLang];
    
    // Refs for Image Generation
    const letterheadRef = useRef<HTMLDivElement>(null);
    const idCardRef = useRef<HTMLDivElement>(null);

    // Derived State
    const hasNotices = posts.some(p => p.isNotice && !readNoticeIds.has(p.id));
    const allNotices = posts.filter(p => p.isNotice);

    // Forms
    const [newMeeting, setNewMeeting] = useState<{
        title: string; date: string; time: string; venue: string; meetingType: 'physical' | 'whatsapp' | 'virtual'; meetingLink?: string; agenda: string; targetDistrict: string;
    }>({
        title: '', date: '', time: '', venue: '', meetingType: 'physical', agenda: '', targetDistrict: 'All Bihar'
    });
    
    const [editProfileData, setEditProfileData] = useState({
        name: '', mobile: '', district: '', designation: '', fatherName: ''
    });

    const [newNoticeContent, setNewNoticeContent] = useState('');
    const [isEnhancing, setIsEnhancing] = useState(false);

    // --- Audio Tour Logic ---
    useEffect(() => {
        if (hasStarted && currentUser) {
            audioService.play(currentTab, isMuted);
        }
    }, [currentTab, hasStarted, currentUser, isMuted]);

    const handleStartTour = () => {
        setHasStarted(true);
        audioService.play(currentTab, isMuted);
    };

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
    const handleToggleMute = () => {
        const newMute = !isMuted;
        setIsMuted(newMute);
        audioService.setMute(newMute);
    };

    const handleEnhanceNotice = async (content: string) => {
        try {
            // Apply dynamic transliteration first if Hindi
            let textToEnhance = content;
            if (currentLang === 'hi') {
                textToEnhance = dynamicTransliterate(content, 'hi');
            }

            const enhanced = await enhanceNotice(textToEnhance, currentLang);
            return enhanced;
        } catch (error) {
            console.error("AI Enhancement failed", error);
            alert("AI Enhancement failed. Please try again.");
            return content;
        }
    };

    const handleDownloadLetterhead = (notice: Post) => {
        setDownloadTargetNotice(notice);
        setShowDownloadModal(true);
    };

    const handleProcessDownload = async () => {
        if (!letterheadRef.current || !downloadTargetNotice) return;
        
        try {
            // Ensure the letterhead is rendered and visible (it's off-screen but rendered)
            const canvas = await toJpeg(letterheadRef.current, { quality: 0.95, pixelRatio: 2 });
            
            if (downloadFormat === 'jpg') {
                const link = document.createElement('a');
                link.download = `LJP_Notice_${downloadTargetNotice.id}.jpg`;
                link.href = canvas;
                link.click();
            } else {
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'px',
                    format: [794, 1123] // A4 size in pixels at 96 DPI approx
                });
                
                const imgProps = pdf.getImageProperties(canvas);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                
                pdf.addImage(canvas, 'JPEG', 0, 0, pdfWidth, pdfHeight);
                pdf.save(`LJP_Notice_${downloadTargetNotice.id}.pdf`);
            }
            setShowDownloadModal(false);
            setDownloadTargetNotice(null);
        } catch (err) {
            console.error('Download failed', err);
            alert("Download failed. Please try again.");
        }
    };

    const handleDownloadIDCard = async () => {
        if (!idCardRef.current) return;
        try {
            const dataUrl = await toJpeg(idCardRef.current, { quality: 0.95 });
            const link = document.createElement('a');
            link.download = `LJP_ID_Card_${currentUser?.name}.jpg`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('ID Card generation failed', err);
        }
    };

    const calculateTenure = (joinedDate?: string) => {
        if (!joinedDate) return t.newMember;
        const joined = new Date(joinedDate);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - joined.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 30) return `${diffDays} ${t.days}`;
        const diffMonths = Math.floor(diffDays / 30);
        if (diffMonths < 12) return `${diffMonths} ${t.months}`;
        const diffYears = Math.floor(diffMonths / 12);
        return `${diffYears} ${t.years}`;
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
                // checkStorageAndCleanup();
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
            appointmentLetterUrl: data.appointmentLetterUrl,
            joinedDate: Date.now()
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

        if (currentUser.role === Role.MEMBER) {
            alert("Members cannot post notices.");
            return;
        }
        
        let finalContent = content;
        if (currentLang === 'hi') {
            finalContent = dynamicTransliterate(content, 'hi');
        }
        
        const newPost: Post = {
            id: `post_${Date.now()}`,
            userId: currentUser.id,
            userName: currentUser.name,
            userDesignation: currentUser.designation,
            userPhoto: currentUser.photoUrl,
            content: finalContent,
            imageUrl, 
            timestamp: Date.now(),
            likes: 0,
            isNotice,
            targetDistrict: currentUser.role === Role.SUB_ADMIN ? currentUser.district : 'All Bihar',
            expiryDate: isNotice ? Date.now() + (expiryHours * 60 * 60 * 1000) : undefined
        };
        
        setPosts(prev => [newPost, ...prev]);
        setShowCreateNoticeModal(false);
        setNewNoticeContent('');
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
        
        let title = newMeeting.title;
        let venue = newMeeting.venue;
        let agenda = newMeeting.agenda;

        if (currentLang === 'hi') {
            title = dynamicTransliterate(title, 'hi');
            venue = dynamicTransliterate(venue, 'hi');
            agenda = dynamicTransliterate(agenda, 'hi');
        }

        const newMeet: Meeting = { id: meetingId, ...newMeeting, title, venue, agenda, createdBy: currentUser.id };
        
        setMeetings(prev => [...prev, newMeet]);
        
        let locationText = newMeeting.venue;
        if (newMeeting.meetingType === 'whatsapp') locationText = 'WhatsApp Video Call';
        if (newMeeting.meetingType === 'virtual') locationText = `Virtual Meeting: ${newMeeting.meetingLink}`;

        const noticeContent = `NEW EVENT: ${title} on ${newMeeting.date} at ${newMeeting.time}. Location: ${locationText}. Target: ${newMeeting.targetDistrict}`;
        
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
    if (!navigator.onLine) {
        return (
            <div className="min-h-screen bg-ljp-primary flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-red-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg animate-pulse">
                    <Globe size={40} className="text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">{t.noInternet}</h1>
                <p className="text-white/60 text-sm mb-8">{t.offlineMsg}</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="bg-white text-ljp-primary px-6 py-3 rounded-xl font-bold flex items-center gap-2"
                >
                    <RefreshCw size={18} />
                    {t.tryAgain}
                </button>
            </div>
        );
    }

    if (!currentUser) return <Auth onLogin={handleLogin} onSignup={handleSignup} currentLang={currentLang} onLangChange={setCurrentLang} totalUsers={users.length} onStart={() => setHasStarted(true)} hasStarted={hasStarted} isMuted={isMuted} onToggleMute={handleToggleMute} />;
    if (currentUser.status === UserStatus.PENDING) return <PendingApprovalScreen onLogout={handleLogout} t={t} />;

    const renderContent = () => {
        if (viewingNotice) {
            return (
                <div className="p-4 max-w-2xl mx-auto">
                    <button onClick={() => setViewingNotice(null)} className="flex items-center text-gray-500 mb-6 font-bold">
                        <ArrowLeft size={20} className="mr-2" /> {t.back}
                    </button>
                    <Dashboard 
                        currentUser={currentUser}
                        users={users}
                        posts={[viewingNotice]}
                        onAddNotice={handleAddPost}
                        onDeleteNotice={(id) => { setPosts(prev => prev.filter(p => p.id !== id)); setViewingNotice(null); }}
                        onEnhanceNotice={handleEnhanceNotice}
                        onDownloadLetterhead={handleDownloadLetterhead}
                        onCreateNotice={() => setShowCreateNoticeModal(true)}
                        letterheadRef={letterheadRef}
                        t={t}
                        currentLang={currentLang}
                    />
                </div>
            ); 
        }

        switch (currentTab) {
            case 'home':
                return (
                    <Dashboard 
                        currentUser={currentUser}
                        users={users}
                        posts={posts}
                        onAddNotice={handleAddPost}
                        onDeleteNotice={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
                        onEnhanceNotice={handleEnhanceNotice}
                        onDownloadLetterhead={handleDownloadLetterhead}
                        onCreateNotice={() => setShowCreateNoticeModal(true)}
                        letterheadRef={letterheadRef}
                        t={t}
                        currentLang={currentLang}
                    />
                );
            
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
                                            <p className="text-ljp-secondary dark:text-blue-400 font-bold text-lg">{selectedUser.designation}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{t.memberSince} {calculateTenure(selectedUser.joinedDate)}</p>
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
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-3xl font-bold dark:text-white">{selectedMeeting.title}</h2>
                                    {selectedMeeting.meetingType === 'virtual' && (
                                        <a href={selectedMeeting.meetingLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-700 transition-all">
                                            <ExternalLink size={16} /> {t.joinMeeting}
                                        </a>
                                    )}
                                </div>
                                <p className="dark:text-gray-300 mb-6">{selectedMeeting.agenda}</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                                        <Calendar className="mb-2 text-ljp-secondary"/>
                                        <p className="text-xs text-gray-400 font-bold uppercase">{t.date}</p>
                                        <p className="font-bold dark:text-white">{selectedMeeting.date} at {selectedMeeting.time}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
                                        <MapPin className="mb-2 text-ljp-secondary"/>
                                        <p className="text-xs text-gray-400 font-bold uppercase">{t.venue}</p>
                                        <p className="font-bold dark:text-white">{selectedMeeting.meetingType === 'whatsapp' ? 'WhatsApp' : selectedMeeting.meetingType === 'virtual' ? 'Virtual' : selectedMeeting.venue}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }

                const filteredMeetings = meetings.filter(m => {
                    if (meetingFilter === 'All') return true;
                    if (meetingFilter === 'State Level') return m.targetDistrict === 'All Bihar';
                    if (meetingFilter === 'District Level') return m.targetDistrict !== 'All Bihar';
                    return true;
                });

                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.meetings}</h2>
                            {currentUser.role === Role.SUPER_ADMIN && <button onClick={() => setShowCreateMeetingModal(true)} className="bg-ljp-secondary text-white px-5 py-2.5 rounded-xl font-bold text-sm">+ {t.scheduleMeeting}</button>}
                        </div>

                        {/* Filter Chips */}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                            {(['All', 'State Level', 'District Level'] as const).map(filter => (
                                <button
                                    key={filter}
                                    onClick={() => setMeetingFilter(filter)}
                                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                                        meetingFilter === filter 
                                        ? 'bg-ljp-secondary text-white shadow-md' 
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                                    }`}
                                >
                                    {filter === 'All' ? t.allEvents : filter === 'State Level' ? t.stateLevel : t.districtLevel}
                                </button>
                            ))}
                        </div>

                        {filteredMeetings.length === 0 ? (
                            <div className="text-center py-20 text-gray-500">{t.noMeetings}</div>
                        ) : (
                            filteredMeetings.map(m => (
                                <div key={m.id} onClick={() => setSelectedMeeting(m)} className="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-lg dark:text-white">{m.title}</h3>
                                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-lg ${m.targetDistrict === 'All Bihar' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                                            {m.targetDistrict === 'All Bihar' ? t.stateLevel : t.districtLevel}
                                        </span>
                                    </div>
                                    <div className="flex gap-4 text-xs text-gray-500 mt-2">
                                        <span className="flex items-center"><Calendar size={14} className="mr-1"/> {m.date}</span>
                                        <span className="flex items-center">
                                            {m.meetingType === 'whatsapp' ? <Video size={14} className="mr-1 text-green-500"/> : m.meetingType === 'virtual' ? <Globe size={14} className="mr-1 text-blue-500"/> : <MapPin size={14} className="mr-1"/>} 
                                            {m.meetingType === 'whatsapp' ? 'WhatsApp' : m.meetingType === 'virtual' ? 'Virtual' : m.venue}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
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
                                        <p className="text-white/70 font-medium">{currentUser.designation}</p>
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
                                    <p className="text-ljp-secondary dark:text-blue-400 font-bold text-lg">{currentUser.designation}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{t.memberSince} {calculateTenure(currentUser.joinedDate)}</p>
                                </div>

                                <div className="mt-4">
                                    <button 
                                        onClick={handleDownloadIDCard}
                                        className="w-full flex items-center justify-center gap-2 bg-black dark:bg-gray-700 text-white py-3 rounded-xl font-bold text-sm hover:brightness-110 transition-all"
                                    >
                                        <Download size={18} /> {t.downloadIDCard}
                                    </button>
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
                                            <CheckCircle size={20} className="mr-2" /> {t.activeMember}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-2xl border border-gray-100 dark:border-gray-700">
                                        <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block mb-2">{t.joinedDate}</label>
                                        <p className="font-semibold flex items-center text-gray-700 dark:text-gray-200 text-lg">
                                            <Calendar size={20} className="mr-2 text-ljp-accent" /> 
                                            {currentUser.joinedDate ? new Date(currentUser.joinedDate).toLocaleDateString() : 'N/A'}
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
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onStartTour={handleStartTour}
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
                            <input type="text" placeholder={t.meetingTitle} value={newMeeting.title} onChange={e => setNewMeeting({...newMeeting, title: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 text-sm dark:text-white" required />
                            <div className="grid grid-cols-2 gap-3">
                                <input type="date" value={newMeeting.date} onChange={e => setNewMeeting({...newMeeting, date: e.target.value})} className="bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 text-sm dark:text-white" required />
                                <input type="time" value={newMeeting.time} onChange={e => setNewMeeting({...newMeeting, time: e.target.value})} className="bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 text-sm dark:text-white" required />
                            </div>
                            <select value={newMeeting.meetingType} onChange={e => setNewMeeting({...newMeeting, meetingType: e.target.value as any})} className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 text-sm dark:text-white">
                                <option value="physical">{t.physical}</option>
                                <option value="whatsapp">WhatsApp</option>
                                <option value="virtual">Virtual (Meet/Zoom)</option>
                            </select>
                            {newMeeting.meetingType === 'virtual' ? (
                                <input type="url" placeholder="Meeting Link (https://...)" value={newMeeting.meetingLink} onChange={e => setNewMeeting({...newMeeting, meetingLink: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 text-sm dark:text-white" required />
                            ) : (
                                <input type="text" placeholder={t.venue} value={newMeeting.venue} onChange={e => setNewMeeting({...newMeeting, venue: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 text-sm dark:text-white" required={newMeeting.meetingType === 'physical'} />
                            )}
                            <textarea placeholder={t.agenda} value={newMeeting.agenda} onChange={e => setNewMeeting({...newMeeting, agenda: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 text-sm min-h-[100px] dark:text-white" required></textarea>
                            
                            {currentUser.role === Role.SUPER_ADMIN && (
                                <select value={newMeeting.targetDistrict} onChange={e => setNewMeeting({...newMeeting, targetDistrict: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 text-sm dark:text-white">
                                    <option value="All Bihar">{t.allBihar}</option>
                                    {BIHAR_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                                </select>
                            )}

                            <button className="w-full bg-ljp-secondary text-white py-3 rounded-xl font-bold hover:brightness-110">
                                {t.schedule}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showCreateNoticeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateNoticeModal(false)}></div>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-3xl p-6 relative z-10 shadow-2xl animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{t.createNotice}</h3>
                            <button onClick={() => setShowCreateNoticeModal(false)}><X size={20} className="text-gray-500" /></button>
                        </div>
                        <div className="space-y-4">
                            <div className="relative">
                                <textarea 
                                    placeholder={t.noticePlaceholder} 
                                    value={newNoticeContent} 
                                    onChange={e => setNewNoticeContent(e.target.value)} 
                                    className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-4 text-sm min-h-[200px] dark:text-white"
                                ></textarea>
                                <button 
                                    onClick={async () => {
                                        if (!newNoticeContent) return;
                                        setIsEnhancing(true);
                                        const enhanced = await handleEnhanceNotice(newNoticeContent);
                                        setNewNoticeContent(enhanced);
                                        setIsEnhancing(false);
                                    }}
                                    disabled={isEnhancing || !newNoticeContent}
                                    className="absolute bottom-4 right-4 flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-purple-700 disabled:opacity-50 transition-all shadow-lg shadow-purple-200 dark:shadow-none"
                                >
                                    {isEnhancing ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                    {t.enhanceWithAI}
                                </button>
                            </div>
                            
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setShowCreateNoticeModal(false)}
                                    className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-bold"
                                >
                                    {t.cancel}
                                </button>
                                <button 
                                    onClick={() => handleAddPost(newNoticeContent, undefined, true)}
                                    disabled={!newNoticeContent}
                                    className="flex-[2] bg-ljp-secondary text-white py-3 rounded-xl font-bold hover:brightness-110 disabled:opacity-50"
                                >
                                    {t.publishNotice}
                                </button>
                            </div>
                        </div>
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
                            <select value={editProfileData.designation} onChange={e => setEditProfileData({...editProfileData, designation: e.target.value})} className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 text-sm dark:text-white">
                                {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            
                            <button className="w-full bg-ljp-secondary text-white py-3 rounded-xl font-bold hover:brightness-110">
                                {t.submit}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {showDownloadModal && downloadTargetNotice && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowDownloadModal(false)}></div>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-3xl p-6 relative z-10 shadow-2xl animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{t.chooseFormat}</h3>
                            <button onClick={() => setShowDownloadModal(false)}><X size={20} className="text-gray-500" /></button>
                        </div>
                        
                        <div className="space-y-3">
                            <button 
                                onClick={() => { setDownloadFormat('jpg'); handleProcessDownload(); }}
                                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-ljp-secondary transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                        <FileText size={20} />
                                    </div>
                                    <span className="font-bold text-gray-700 dark:text-gray-200">{t.downloadJPG}</span>
                                </div>
                                <div className={`w-4 h-4 rounded-full border-2 ${downloadFormat === 'jpg' ? 'border-ljp-secondary bg-ljp-secondary' : 'border-gray-300'}`}></div>
                            </button>

                            <button 
                                onClick={() => { setDownloadFormat('pdf'); handleProcessDownload(); }}
                                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-ljp-secondary transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                                        <FileText size={20} />
                                    </div>
                                    <span className="font-bold text-gray-700 dark:text-gray-200">{t.downloadPDF}</span>
                                </div>
                                <div className={`w-4 h-4 rounded-full border-2 ${downloadFormat === 'pdf' ? 'border-ljp-secondary bg-ljp-secondary' : 'border-gray-300'}`}></div>
                            </button>
                        </div>

                        <button 
                            onClick={handleProcessDownload}
                            className="w-full mt-6 bg-ljp-secondary text-white py-3 rounded-xl font-bold hover:brightness-110 shadow-lg shadow-blue-200 dark:shadow-none transition-all flex items-center justify-center gap-2"
                        >
                            <Download size={18} />
                            Download
                        </button>
                    </div>
                </div>
            )}
            {/* --- Hidden Letterhead for Generation --- */}
            <div className="fixed -left-[3000px] top-0">
                <div 
                    ref={letterheadRef}
                    className="w-[800px] bg-white p-12 font-serif relative"
                    style={{ minHeight: '1100px' }}
                >
                    {/* Header */}
                    <div className="border-b-4 border-ljp-secondary pb-6 mb-8 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 bg-ljp-secondary rounded-2xl flex items-center justify-center text-white font-bold text-4xl">L</div>
                            <div>
                                <h1 className="text-4xl font-black text-gray-900 tracking-tighter">LJP SPORTS CELL</h1>
                                <p className="text-ljp-secondary font-bold text-sm tracking-[0.3em] uppercase">Bihar State Committee</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-gray-400 uppercase">Official Correspondence</p>
                            <p className="text-sm font-bold text-gray-900">Ref: LJP/SC/{viewingNotice?.id.substring(0,6).toUpperCase()}</p>
                            <p className="text-sm font-bold text-gray-900">Date: {viewingNotice ? new Date(viewingNotice.timestamp).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="py-10">
                        <h2 className="text-center text-3xl font-black underline mb-12 uppercase tracking-widest">OFFICIAL NOTICE</h2>
                        <div className="text-xl leading-relaxed text-gray-800 whitespace-pre-wrap min-h-[400px]">
                            {viewingNotice?.content}
                        </div>
                    </div>

                    {/* Footer / Signature */}
                    <div className="mt-20 pt-12 border-t border-gray-100 flex justify-between items-end">
                        <div className="w-48">
                            <div className="p-2 border border-gray-100 rounded-lg inline-block">
                                <QRCodeSVG value={`LJP-NOTICE-${viewingNotice?.id}`} size={80} />
                            </div>
                            <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase">Scan to verify authenticity</p>
                        </div>
                        <div className="text-right">
                            <div className="mb-4 h-16 flex items-end justify-end">
                                <p className="font-serif italic text-2xl text-gray-400 opacity-50">Digital Signature</p>
                            </div>
                            <p className="text-2xl font-black text-gray-900 uppercase">{viewingNotice?.userName}</p>
                            <p className="text-ljp-secondary font-bold text-lg">{viewingNotice?.userDesignation}</p>
                            <p className="text-sm font-bold text-gray-500">LJP Sports Cell, Bihar</p>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-4 bg-ljp-secondary"></div>
                </div>
            </div>

            {/* --- Hidden ID Card for Generation --- */}
            <div className="fixed -left-[2000px] top-0">
                <div 
                    ref={idCardRef}
                    className="w-[400px] h-[600px] bg-white relative overflow-hidden font-sans"
                    style={{ backgroundImage: 'linear-gradient(135deg, #003366 0%, #000000 100%)' }}
                >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                    
                    {/* Header */}
                    <div className="p-6 text-center border-b border-white/20">
                        <div className="w-16 h-16 bg-ljp-secondary rounded-xl mx-auto mb-3 flex items-center justify-center text-white font-bold text-2xl shadow-lg">L</div>
                        <h1 className="text-white font-bold text-xl tracking-tight">LJP SPORTS CELL</h1>
                        <p className="text-ljp-accent text-[10px] font-bold tracking-[0.2em] uppercase">Bihar State Committee</p>
                    </div>

                    {/* Photo */}
                    <div className="mt-8 flex justify-center">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-2xl border-4 border-ljp-secondary overflow-hidden shadow-2xl bg-gray-800">
                                <img src={currentUser.photoUrl} className="w-full h-full object-cover" alt="ID" />
                            </div>
                            {currentUser.badge && (
                                <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-lg">
                                    <BadgeCheck size={24} className="text-blue-500" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Details */}
                    <div className="mt-6 px-8 text-center">
                        <h2 className="text-white font-bold text-2xl mb-1">{currentUser.name}</h2>
                        <p className="text-ljp-secondary font-bold text-sm uppercase tracking-wider">{currentUser.designation}</p>
                        <div className="mt-4 inline-block px-3 py-1 bg-white/10 rounded-full border border-white/10">
                            <p className="text-white/60 text-[10px] font-bold uppercase">{currentUser.district} District</p>
                        </div>
                    </div>

                    {/* Info Grid */}
                    <div className="mt-8 px-8 grid grid-cols-2 gap-4">
                        <div className="text-left">
                            <p className="text-white/40 text-[8px] font-bold uppercase">Member ID</p>
                            <p className="text-white text-xs font-mono">{currentUser.id.substring(0, 8).toUpperCase()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-white/40 text-[8px] font-bold uppercase">Joined</p>
                            <p className="text-white text-xs">{currentUser.joinedDate ? new Date(currentUser.joinedDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                    </div>

                    {/* QR Code */}
                    <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center">
                        <div className="p-2 bg-white rounded-lg shadow-xl">
                            <QRCodeSVG value={`LJP-SPORTS-${currentUser.id}`} size={60} />
                        </div>
                        <p className="text-white/30 text-[8px] mt-2 font-bold tracking-widest uppercase underline decoration-ljp-secondary">Verify at ljpbihar.org</p>
                    </div>

                    {/* Footer */}
                    <div className="absolute bottom-0 left-0 right-0 h-2 bg-ljp-secondary"></div>
                </div>
            </div>
        </Layout>
    );
};