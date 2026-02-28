import React from 'react';
import { User, Post, UserStatus, Role } from '../types';
import { Users, UserCheck, MapPin, Bell, Calendar, ChevronRight, FileText, Download, Sparkles } from 'lucide-react';
import { Language, translations } from '../services/translations';

interface DashboardProps {
    users: User[];
    posts: Post[];
    currentLang: Language;
    onViewNotice: (notice: Post) => void;
    onDownloadLetterhead: (notice: Post) => void;
    onEnhanceNotice: (notice: Post) => void;
    onCreateNotice: () => void;
    currentUser: User | null;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
    users, 
    posts, 
    currentLang, 
    onViewNotice, 
    onDownloadLetterhead,
    onEnhanceNotice,
    onCreateNotice,
    currentUser
}) => {
    const t = translations[currentLang];
    
    // Stats
    const totalMembers = users.filter(u => u.status === UserStatus.APPROVED).length;
    const pendingApprovals = users.filter(u => u.status === UserStatus.PENDING).length;
    const activeDistricts = new Set(users.filter(u => u.status === UserStatus.APPROVED).map(u => u.district)).size;
    
    const notices = posts.filter(p => p.isNotice).sort((a, b) => b.timestamp - a.timestamp);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-900 p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center space-x-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">{t.totalMembers}</p>
                        <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{totalMembers}</p>
                    </div>
                </div>
                
                {currentUser?.role !== Role.MEMBER && (
                    <div className="bg-white dark:bg-gray-900 p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center space-x-4">
                        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-amber-600 dark:text-amber-400">
                            <UserCheck size={24} />
                        </div>
                        <div>
                            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">{t.pendingApprovals}</p>
                            <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{pendingApprovals}</p>
                        </div>
                    </div>
                )}
                
                <div className="bg-white dark:bg-gray-900 p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center space-x-4">
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-600 dark:text-emerald-400">
                        <MapPin size={24} />
                    </div>
                    <div>
                        <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">{t.totalLocations}</p>
                        <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{activeDistricts}</p>
                    </div>
                </div>
            </div>

            {/* Notice Board */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Bell className="text-ljp-accent" size={20} />
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t.noticeBoard}</h2>
                    </div>
                    {(currentUser?.role === Role.SUPER_ADMIN || currentUser?.role === Role.SUB_ADMIN) && (
                        <button 
                            onClick={onCreateNotice} 
                            className="bg-ljp-secondary text-white px-4 py-2 rounded-xl text-xs font-bold hover:brightness-110 transition-all"
                        >
                            + {t.createNotice}
                        </button>
                    )}
                </div>
                
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {notices.length > 0 ? (
                        notices.map((notice) => (
                            <div key={notice.id} className="p-4 md:p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center space-x-3">
                                        {notice.userPhoto ? (
                                            <img src={notice.userPhoto} alt="" className="w-10 h-10 rounded-full object-cover" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500">
                                                <Users size={20} />
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">{notice.userName}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{notice.userDesignation}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-400 flex items-center">
                                        <Calendar size={12} className="mr-1" />
                                        {new Date(notice.timestamp).toLocaleDateString()}
                                    </span>
                                </div>
                                
                                <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-3 text-sm md:text-base">
                                    {notice.content}
                                </p>
                                
                                <div className="flex flex-wrap gap-2">
                                    <button 
                                        onClick={() => onViewNotice(notice)}
                                        className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs md:text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <FileText size={14} />
                                        <span>{t.viewNotice}</span>
                                    </button>
                                    
                                    <button 
                                        onClick={() => onDownloadLetterhead(notice)}
                                        className="flex items-center space-x-1 px-3 py-1.5 bg-ljp-secondary/10 text-ljp-secondary dark:text-blue-400 rounded-lg text-xs md:text-sm font-medium hover:bg-ljp-secondary/20 transition-colors"
                                    >
                                        <Download size={14} />
                                        <span>{t.downloadLetterhead}</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-12 text-center">
                            <Bell size={48} className="mx-auto text-gray-200 dark:text-gray-700 mb-4" />
                            <p className="text-gray-500 dark:text-gray-400">No official notices yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
