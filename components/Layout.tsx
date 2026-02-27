import React, { useState } from 'react';
import { Home, Users, Calendar, UserCircle, LogOut, Globe, Moon, Sun, Monitor, Menu, X, Bell, ChevronRight, Settings, AlertCircle } from 'lucide-react';
import { Role, ThemeMode, Post } from '../types';
import { Language } from '../services/translations';

interface LayoutProps {
    children: React.ReactNode;
    currentTab: string;
    onTabChange: (tab: string) => void;
    userRole: Role;
    onLogout: () => void;
    currentLang: Language;
    onLangChange: (lang: Language) => void;
    t: any;
    themeMode: ThemeMode;
    onThemeChange: (mode: ThemeMode) => void;
    hasNotices: boolean;
    allNotices: Post[]; // Pass all notices for history
    onNoticeClick: (post: Post) => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
    children, currentTab, onTabChange, userRole, onLogout, currentLang, onLangChange, t, themeMode, onThemeChange, hasNotices, allNotices, onNoticeClick 
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);

    const navItems = [
        { id: 'home', label: t.feed, icon: Home },
        { id: 'directory', label: t.directory, icon: Users },
        { id: 'meetings', label: t.meetings, icon: Calendar },
        { id: 'profile', label: t.profile, icon: UserCircle },
    ];

    // Sort notices: Newest first
    const sortedNotices = [...allNotices].filter(p => p.isNotice).sort((a, b) => b.timestamp - a.timestamp);

    const Watermark = () => (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-center pb-2">
             <p className="text-[9px] text-gray-400 dark:text-gray-500">Developed by Guru Printing Press</p>
             <div className="flex items-center justify-center gap-1">
                <Globe size={10} className="text-gray-400 dark:text-gray-500" />
                <a href="https://guruprintingpress.com" target="_blank" rel="noopener noreferrer" className="text-[9px] text-gray-300 dark:text-gray-600 hover:text-ljp-secondary dark:hover:text-blue-400 transition-colors">guruprintingpress.com</a>
             </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-ljp-neutral dark:bg-black flex flex-col md:flex-row transition-colors duration-300 font-sans">
            
            {/* --- Desktop Sidebar --- */}
            <aside className="hidden md:flex flex-col w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 h-screen sticky top-0 p-6 z-30">
                <div className="mb-12 flex items-center space-x-3">
                    <div className="w-10 h-10 bg-ljp-secondary rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-md">L</div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-ljp-primary dark:text-white leading-none">LJP Sports</h1>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Bihar Cell</p>
                    </div>
                </div>
                
                <nav className="flex-1 space-y-2">
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => onTabChange(item.id)}
                            className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-200 group ${
                                currentTab === item.id 
                                ? 'bg-ljp-secondary text-white shadow-lg shadow-ljp-secondary/20 font-medium' 
                                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            <item.icon size={20} className={currentTab === item.id ? 'text-white' : 'group-hover:scale-110 transition-transform'} />
                            <span>{item.label}</span>
                        </button>
                    ))}
                    
                    {/* Notification Button Desktop */}
                    <button 
                         onClick={() => setIsNotifOpen(true)}
                         className="w-full flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-200 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                        <div className="relative">
                            <Bell size={20} />
                            {hasNotices && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>}
                        </div>
                        <span>Notices</span>
                    </button>
                </nav>

                <div className="mt-auto pt-6 border-t border-gray-100 dark:border-gray-800 space-y-4">
                    {/* Compact Desktop Settings */}
                    <div className="flex items-center justify-between">
                        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                            <button onClick={() => onThemeChange('light')} className={`p-1.5 rounded-md ${themeMode === 'light' ? 'bg-white dark:bg-gray-700 shadow-sm text-yellow-500' : 'text-gray-400 hover:text-gray-600'}`}><Sun size={16}/></button>
                            <button onClick={() => onThemeChange('dark')} className={`p-1.5 rounded-md ${themeMode === 'dark' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-400' : 'text-gray-400 hover:text-gray-600'}`}><Moon size={16}/></button>
                            <button onClick={() => onThemeChange('system')} className={`p-1.5 rounded-md ${themeMode === 'system' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-800 dark:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}><Monitor size={16}/></button>
                        </div>
                        
                        <div className="relative">
                            <button 
                                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                                className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                <Globe size={14} />
                                <span>{currentLang.toUpperCase()}</span>
                            </button>
                            {isLangMenuOpen && (
                                <div className="absolute bottom-full mb-2 left-0 w-24 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden py-1 animate-fade-in z-50">
                                    {(['en', 'hi', 'hn'] as Language[]).map(lang => (
                                        <button
                                            key={lang}
                                            onClick={() => { onLangChange(lang); setIsLangMenuOpen(false); }}
                                            className="w-full text-left px-4 py-2 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-gray-200 text-gray-700"
                                        >
                                            {lang === 'en' ? 'English' : lang === 'hi' ? 'Hindi' : 'Hinglish'}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <button 
                        onClick={onLogout}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-colors text-sm font-semibold"
                    >
                        <LogOut size={18} />
                        <span>{t.logout}</span>
                    </button>
                </div>
                <Watermark />
            </aside>

            {/* --- Mobile Header --- */}
            <header className="md:hidden bg-white/80 dark:bg-gray-900/80 backdrop-blur-md text-gray-900 dark:text-white p-4 sticky top-0 z-50 flex justify-between items-center border-b border-gray-100 dark:border-gray-800 transition-colors">
                <div className="flex items-center space-x-2">
                     <div className="w-8 h-8 bg-ljp-secondary rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">LS</div>
                    <span className="font-bold text-lg tracking-tight">Sports Cell</span>
                </div>
                
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => setIsNotifOpen(true)}
                        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                        <Bell size={22} className="text-gray-700 dark:text-gray-300" />
                        {hasNotices && <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>}
                    </button>
                    
                    <button onClick={() => setIsMenuOpen(true)} className="p-2 -mr-2 text-gray-800 dark:text-gray-200">
                        <Menu size={26} strokeWidth={2.5} />
                    </button>
                </div>
            </header>

            {/* --- Notification Drawer --- */}
            {isNotifOpen && (
                <div className="fixed inset-0 z-[70]">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsNotifOpen(false)}></div>
                    <div className="absolute top-0 right-0 h-full w-full md:w-96 bg-white dark:bg-gray-900 shadow-2xl animate-slide-in flex flex-col">
                        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                            <h2 className="text-lg font-bold flex items-center gap-2 dark:text-white"><Bell size={18} className="text-ljp-secondary" /> Notice History</h2>
                            <button onClick={() => setIsNotifOpen(false)} className="p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {sortedNotices.length === 0 ? (
                                <div className="text-center text-gray-500 mt-10">No notices found.</div>
                            ) : (
                                sortedNotices.map(notice => (
                                    <div 
                                        key={notice.id} 
                                        onClick={() => { onNoticeClick(notice); setIsNotifOpen(false); }}
                                        className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="bg-red-50 text-red-600 dark:bg-red-900/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Official</span>
                                            <span className="text-[10px] text-gray-400">{new Date(notice.timestamp).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 line-clamp-2">{notice.content}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- Mobile Menu Drawer --- */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-[60] md:hidden">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
                    <div className="absolute top-0 right-0 h-full w-3/4 max-w-xs bg-white dark:bg-gray-900 shadow-2xl animate-slide-in flex flex-col p-6">
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t.settings}</h2>
                            <button onClick={() => setIsMenuOpen(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-800 dark:text-gray-200">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-8 flex-1">
                            {/* Theme Toggle */}
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t.theme}</h3>
                                <div className="grid grid-cols-3 gap-2 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl">
                                    {(['light', 'dark', 'system'] as const).map(mode => (
                                        <button
                                            key={mode}
                                            onClick={() => onThemeChange(mode)}
                                            className={`flex flex-col items-center justify-center py-2 rounded-lg text-[10px] font-bold transition-all ${
                                                themeMode === mode 
                                                ? 'bg-white dark:bg-gray-700 shadow-sm text-ljp-secondary dark:text-white' 
                                                : 'text-gray-500 dark:text-gray-400'
                                            }`}
                                        >
                                            {mode === 'light' ? <Sun size={16} className="mb-1"/> : mode === 'dark' ? <Moon size={16} className="mb-1"/> : <Monitor size={16} className="mb-1"/>}
                                            {mode === 'light' ? t.lightMode : mode === 'dark' ? t.darkMode : t.systemMode}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Language Selector */}
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t.selectLang}</h3>
                                <div className="space-y-2">
                                    {(['en', 'hi', 'hn'] as Language[]).map(lang => (
                                        <button
                                            key={lang}
                                            onClick={() => onLangChange(lang)}
                                            className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                                                currentLang === lang 
                                                ? 'border-ljp-secondary bg-blue-50/50 dark:bg-blue-900/10 text-ljp-secondary dark:text-blue-400 font-bold' 
                                                : 'border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-400 font-medium'
                                            }`}
                                        >
                                            <span className="flex items-center"><Globe size={16} className="mr-2"/> {lang === 'en' ? 'English' : lang === 'hi' ? 'Hindi' : 'Hinglish'}</span>
                                            {currentLang === lang && <div className="w-2 h-2 bg-ljp-secondary rounded-full"></div>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <Watermark />
                        <button 
                            onClick={onLogout}
                            className="mt-4 flex items-center justify-center space-x-2 w-full py-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl font-bold"
                        >
                            <LogOut size={20} />
                            <span>{t.logout}</span>
                        </button>
                    </div>
                </div>
            )}

            {/* --- Main Content --- */}
            <main className="flex-1 max-w-7xl mx-auto w-full relative overflow-y-auto no-scrollbar">
                <div className="p-4 pb-32 md:p-8">
                    {children}
                </div>
            </main>

            {/* --- Mobile Bottom Nav (Clean, No Logout) --- */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-100 dark:border-gray-800 flex justify-around items-center px-2 pb-safe pt-2 z-40 transition-colors">
                {navItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => onTabChange(item.id)}
                        className={`flex flex-col items-center justify-center w-full py-2 transition-all duration-300 relative group`}
                    >
                        <div className={`p-1.5 rounded-full transition-all duration-300 ${
                            currentTab === item.id 
                            ? 'bg-ljp-secondary text-white -translate-y-1 shadow-md shadow-ljp-secondary/30' 
                            : 'text-gray-400 dark:text-gray-500'
                        }`}>
                            <item.icon size={24} strokeWidth={currentTab === item.id ? 2.5 : 2} />
                        </div>
                        <span className={`text-[10px] font-bold mt-1 transition-colors ${
                            currentTab === item.id 
                            ? 'text-ljp-secondary dark:text-white' 
                            : 'text-gray-400 dark:text-gray-600'
                        }`}>
                            {item.label}
                        </span>
                    </button>
                ))}
            </nav>
        </div>
    );
};