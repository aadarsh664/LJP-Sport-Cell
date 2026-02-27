import React, { useState } from 'react';
import { User, Role, BIHAR_DISTRICTS, UserStatus } from '../types';
import { Download, Search, MapPin, ChevronRight, MoreVertical, Trash2, Eye, EyeOff, BadgeCheck, UserPlus, X, Phone, User as UserIcon, CheckCircle, Shield, AlertTriangle, Ban } from 'lucide-react';
import { Language } from '../services/translations';

interface DirectoryProps {
    currentUser: User;
    users: User[];
    onUserClick: (user: User) => void;
    t: any;
    onUpdateUserStatus?: (userId: string, status: UserStatus) => void;
    onDeleteUser?: (userId: string) => void;
    onAddMember?: (memberData: any) => void;
    onPromoteUser?: (userId: string) => void;
    onAssignBadge?: (userId: string, badge: any) => void;
    currentLang: Language;
}

export const Directory: React.FC<DirectoryProps> = ({ currentUser, users, onUserClick, t, onUpdateUserStatus, onDeleteUser, onAddMember, onPromoteUser, onAssignBadge, currentLang }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [viewAllBihar, setViewAllBihar] = useState(false);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    
    // UI State for Actions
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
    const [confirmAction, setConfirmAction] = useState<{
        type: 'delete' | 'suspend' | 'activate' | 'promote' | 'badge';
        userId: string;
        badge?: any;
    } | null>(null);
    
    // Admin Filter Logic
    const [adminSelectedDistrict, setAdminSelectedDistrict] = useState('All');

    // Add Member Form State
    const [newMember, setNewMember] = useState({
        name: '',
        fatherName: '',
        mobile: '',
        district: BIHAR_DISTRICTS[0],
        designation: '',
        jurisdiction: ''
    });

    const handleAddMemberSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddMember && onAddMember(newMember);
        setShowAddMemberModal(false);
        setNewMember({ name: '', fatherName: '', mobile: '', district: BIHAR_DISTRICTS[0], designation: '', jurisdiction: '' });
    };

    // Filter Users Logic
    const filteredUsers = users.filter(user => {
        if (user.status === UserStatus.PENDING) return false;
        if (user.status === UserStatus.DELETED) return false;
        if (currentUser.role !== Role.SUPER_ADMIN && user.status === UserStatus.SUSPENDED) return false;

        let isInScope = false;
        if (currentUser.role === Role.SUPER_ADMIN) {
             isInScope = adminSelectedDistrict === 'All' || user.district === adminSelectedDistrict;
        } else {
             if (viewAllBihar) {
                 isInScope = true; 
             } else {
                 isInScope = user.district === currentUser.district;
             }
        }

        const searchMatch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.designation.toLowerCase().includes(searchTerm.toLowerCase());

        return isInScope && searchMatch;
    });

    const handleExport = () => {
        const headers = ["Name", "Father's Name", "District", "Designation", "Jurisdiction", "Mobile", "Status"];
        const rows = filteredUsers.map(u => [u.name, u.fatherName, u.district, u.designation, u.jurisdiction || '', u.mobile, u.status]);
        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "ljp_members_data.csv");
        document.body.appendChild(link);
        link.click();
    };

    const BadgeIcon = ({ type }: { type?: 'blue' | 'green' | 'red' | null }) => {
        if (!type) return null;
        let color = '';
        if (type === 'blue') color = 'text-blue-500 fill-blue-500/10';
        if (type === 'green') color = 'text-green-500 fill-green-500/10';
        if (type === 'red') color = 'text-red-500 fill-red-500/10';
        return <BadgeCheck size={16} className={`ml-1 ${color}`} />;
    };

    const executeAction = () => {
        if (!confirmAction) return;
        const { type, userId, badge } = confirmAction;
        
        if (type === 'delete' && onDeleteUser) onDeleteUser(userId);
        if (type === 'suspend' && onUpdateUserStatus) onUpdateUserStatus(userId, UserStatus.SUSPENDED);
        if (type === 'activate' && onUpdateUserStatus) onUpdateUserStatus(userId, UserStatus.APPROVED);
        if (type === 'promote' && onPromoteUser) onPromoteUser(userId);
        if (type === 'badge' && onAssignBadge) onAssignBadge(userId, badge);

        setConfirmAction(null);
        setActiveMenuId(null);
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20" onClick={() => setActiveMenuId(null)}>
            <div className="flex flex-row justify-between items-center gap-4 mt-2">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {t.directory} 
                        <span className="text-sm font-medium bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full text-gray-500">
                            {filteredUsers.length} Member
                        </span>
                    </h2>
                </div>
                
                <div className="flex items-center gap-2">
                    {currentUser.role === Role.SUPER_ADMIN && (
                        <button onClick={() => setShowAddMemberModal(true)} className="bg-ljp-secondary text-white p-2 rounded-lg hover:bg-ljp-secondary/90 transition-colors shadow-sm">
                            <UserPlus size={18} />
                        </button>
                    )}
                    {currentUser.role !== Role.SUPER_ADMIN && (
                        <button onClick={() => setViewAllBihar(!viewAllBihar)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-sm h-9 ${viewAllBihar ? 'bg-ljp-secondary text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'}`}>
                            {viewAllBihar ? <Eye size={16}/> : <EyeOff size={16}/>}
                            <span className="hidden sm:inline">{viewAllBihar ? t.viewAllMembers : t.targetDistrict}</span>
                        </button>
                    )}
                    {currentUser.role === Role.SUPER_ADMIN && (
                        <button onClick={handleExport} className="flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-green-700 transition-colors shadow-sm h-9">
                            <Download size={16} />
                            <span className="hidden sm:inline">{t.exportCsv}</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col md:flex-row gap-4 transition-colors">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input 
                        type="text" placeholder={t.searchPlaceholder} value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-1 focus:ring-ljp-secondary dark:focus:ring-blue-500 outline-none text-sm text-gray-900 dark:text-white transition-all"
                    />
                </div>
                {currentUser.role === Role.SUPER_ADMIN && (
                    <select value={adminSelectedDistrict} onChange={(e) => setAdminSelectedDistrict(e.target.value)} className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none">
                        <option value="All">{t.allDistricts}</option>
                        {BIHAR_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredUsers.map(user => (
                    <div 
                        key={user.id} 
                        onClick={() => onUserClick(user)}
                        className={`bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 relative group transition-all hover:shadow-md cursor-pointer hover:border-ljp-secondary/30`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="relative">
                                    <img 
                                        src={user.photoUrl || "https://picsum.photos/100/100"} 
                                        alt={user.name} 
                                        className={`w-12 h-12 rounded-full object-cover border-2 ${user.status === UserStatus.SUSPENDED ? 'border-red-500 grayscale' : 'border-gray-100 dark:border-gray-700'}`}
                                    />
                                    {user.badge && <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-900 rounded-full p-0.5"><BadgeIcon type={user.badge} /></div>}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight flex items-center gap-1">
                                        {user.name}
                                        {user.role === Role.SUB_ADMIN && <span className="text-[8px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-bold uppercase">ADMIN</span>}
                                    </h3>
                                    <p className="text-[10px] text-ljp-secondary dark:text-blue-400 font-bold uppercase tracking-wide mt-0.5 truncate max-w-[150px]">
                                        {user.designation}
                                        {user.jurisdiction ? `, ${user.jurisdiction}` : ''}
                                    </p>
                                    <div className="flex items-center text-gray-500 dark:text-gray-400 text-[10px] mt-1">
                                        <MapPin size={10} className="mr-1" /> {user.district}
                                    </div>
                                </div>
                            </div>

                            {/* 3-Dots Menu for Admin */}
                            {currentUser.role === Role.SUPER_ADMIN && (
                                <div className="relative" onClick={(e) => e.stopPropagation()}>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === user.id ? null : user.id); }}
                                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <MoreVertical size={16} />
                                    </button>
                                    
                                    {activeMenuId === user.id && (
                                        <div className="absolute right-0 top-8 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 py-1 z-20 overflow-hidden animate-fade-in">
                                            {/* Status Actions */}
                                            {user.status === UserStatus.APPROVED ? (
                                                <button onClick={() => setConfirmAction({ type: 'suspend', userId: user.id })} className="w-full text-left px-4 py-2.5 text-xs font-medium text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/10 flex items-center">
                                                    <Ban size={14} className="mr-2"/> {t.suspendMember}
                                                </button>
                                            ) : (
                                                <button onClick={() => setConfirmAction({ type: 'activate', userId: user.id })} className="w-full text-left px-4 py-2.5 text-xs font-medium text-green-600 hover:bg-green-50 dark:hover:bg-green-900/10 flex items-center">
                                                    <CheckCircle size={14} className="mr-2"/> {t.activateMember}
                                                </button>
                                            )}
                                            
                                            {/* Role Actions */}
                                            {user.role !== Role.SUB_ADMIN ? (
                                                <button onClick={() => setConfirmAction({ type: 'promote', userId: user.id })} className="w-full text-left px-4 py-2.5 text-xs font-medium text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/10 flex items-center">
                                                    <Shield size={14} className="mr-2"/> {t.promoteSubAdmin}
                                                </button>
                                            ) : (
                                                <button className="w-full text-left px-4 py-2.5 text-xs font-medium text-gray-400 cursor-not-allowed flex items-center">
                                                    <Shield size={14} className="mr-2"/> Already Admin
                                                </button>
                                            )}

                                            {/* Badge Actions */}
                                            <div className="border-t border-gray-100 dark:border-gray-700 my-1 pt-1 px-4">
                                                <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">{t.assignBadge}</p>
                                                <div className="flex justify-between gap-1 mb-1">
                                                    <button onClick={() => setConfirmAction({ type: 'badge', userId: user.id, badge: 'blue' })} className="w-4 h-4 rounded-full bg-blue-500 hover:scale-110 transition-transform"></button>
                                                    <button onClick={() => setConfirmAction({ type: 'badge', userId: user.id, badge: 'green' })} className="w-4 h-4 rounded-full bg-green-500 hover:scale-110 transition-transform"></button>
                                                    <button onClick={() => setConfirmAction({ type: 'badge', userId: user.id, badge: 'red' })} className="w-4 h-4 rounded-full bg-red-500 hover:scale-110 transition-transform"></button>
                                                    <button onClick={() => setConfirmAction({ type: 'badge', userId: user.id, badge: null })} className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center text-gray-400 hover:text-red-500"><X size={10}/></button>
                                                </div>
                                            </div>

                                            {/* Delete Action */}
                                            <div className="border-t border-gray-100 dark:border-gray-700 mt-1">
                                                <button onClick={() => setConfirmAction({ type: 'delete', userId: user.id })} className="w-full text-left px-4 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center">
                                                    <Trash2 size={14} className="mr-2"/> {t.deleteMember}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            
                            {currentUser.role !== Role.SUPER_ADMIN && (
                                <ChevronRight className="text-gray-300 dark:text-gray-600 mt-2" size={18} />
                            )}
                        </div>
                        
                        {user.status === UserStatus.SUSPENDED && (
                            <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-[1px] rounded-2xl flex items-center justify-center z-10 cursor-default">
                                <span className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg transform -rotate-12 border-2 border-white">SUSPENDED</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {filteredUsers.length === 0 && (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    No members found.
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmAction && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmAction(null)}></div>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-3xl p-6 relative z-10 shadow-2xl animate-fade-in text-center">
                        <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                            {confirmAction.type === 'delete' && <Trash2 size={32} />}
                            {confirmAction.type === 'suspend' && <Ban size={32} />}
                            {confirmAction.type === 'activate' && <CheckCircle size={32} className="text-green-500" />}
                            {(confirmAction.type === 'promote' || confirmAction.type === 'badge') && <Shield size={32} className="text-blue-500" />}
                        </div>
                        
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{t.areYouSure}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 leading-relaxed">
                            {confirmAction.type === 'delete' && t.deleteConfirm}
                            {confirmAction.type === 'suspend' && t.suspendConfirm}
                            {confirmAction.type === 'activate' && t.activateConfirm}
                            {confirmAction.type === 'promote' && t.promoteConfirm}
                            {confirmAction.type === 'badge' && t.badgeConfirm}
                        </p>

                        <div className="flex gap-3">
                            <button onClick={() => setConfirmAction(null)} className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm">{t.cancel}</button>
                            <button 
                                onClick={executeAction}
                                className={`flex-1 py-3 rounded-xl font-bold text-white text-sm shadow-lg transition-transform active:scale-95 ${
                                    confirmAction.type === 'delete' ? 'bg-red-500 hover:bg-red-600 shadow-red-200' :
                                    confirmAction.type === 'suspend' ? 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-200' :
                                    'bg-ljp-secondary hover:brightness-110 shadow-blue-200'
                                }`}
                            >
                                {t.confirm}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Member Modal */}
            {showAddMemberModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddMemberModal(false)}></div>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl p-6 relative z-10 shadow-2xl animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{t.addMember}</h3>
                            <button onClick={() => setShowAddMemberModal(false)}><X size={20} className="text-gray-500" /></button>
                        </div>
                        <form onSubmit={handleAddMemberSubmit} className="space-y-4">
                            <input type="text" placeholder={t.namePlaceholder} required className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-ljp-secondary dark:text-white" onChange={e => setNewMember({...newMember, name: e.target.value})} />
                            <input type="text" placeholder={t.fatherPlaceholder} required className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-ljp-secondary dark:text-white" onChange={e => setNewMember({...newMember, fatherName: e.target.value})} />
                            <input type="tel" placeholder={t.mobilePlaceholder} required className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-ljp-secondary dark:text-white" onChange={e => { const val = e.target.value.replace(/\D/g, '').slice(0, 10); setNewMember({...newMember, mobile: val}); }} value={newMember.mobile} />
                            <select className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-ljp-secondary dark:text-white" onChange={e => setNewMember({...newMember, district: e.target.value})}>
                                {BIHAR_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <input type="text" placeholder={t.designationPlaceholder} required className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-ljp-secondary dark:text-white" onChange={e => setNewMember({...newMember, designation: e.target.value})} />
                            <input type="text" placeholder="Area/Jurisdiction (Optional)" className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-ljp-secondary dark:text-white" onChange={e => setNewMember({...newMember, jurisdiction: e.target.value})} />
                            <button className="w-full bg-ljp-secondary text-white py-3 rounded-xl font-bold hover:brightness-110">
                                {t.addMember}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};