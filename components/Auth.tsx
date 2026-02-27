import React, { useState } from 'react';
import { BIHAR_DISTRICTS, DESIGNATIONS } from '../types';
import { Upload, CheckCircle, Clock, ChevronRight, AlertCircle, Globe, Loader2, Lock, Play, Volume2, VolumeX } from 'lucide-react';
import { Language, translations } from '../services/translations';
import { compressImage } from '../services/imageUtils';
import { MAX_USERS, REGISTRATION_DISABLED_MSG } from '../services/config';

interface AuthProps {
    onLogin: (mobile: string) => void;
    onSignup: (data: any) => void;
    currentLang: Language;
    onLangChange: (lang: Language) => void;
    totalUsers: number;
    onStart: () => void;
    hasStarted: boolean;
    isMuted: boolean;
    onToggleMute: () => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin, onSignup, currentLang, onLangChange, totalUsers, onStart, hasStarted, isMuted, onToggleMute }) => {
    const [isSignup, setIsSignup] = useState(false);
    const [loginMobile, setLoginMobile] = useState('');
    const [showUploadError, setShowUploadError] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const t = translations[currentLang];
    const isRegistrationDisabled = totalUsers >= MAX_USERS;

    // Signup State
    const [formData, setFormData] = useState({
        name: '',
        fatherName: '',
        mobile: '',
        district: BIHAR_DISTRICTS[0],
        designation: DESIGNATIONS[DESIGNATIONS.length - 1], // Default to 'Other'
        jurisdiction: '', // New Field
        appointmentLetter: null as File | null
    });

    if (!hasStarted) {
        return (
            <div className="min-h-screen bg-ljp-primary flex flex-col items-center justify-center p-4 text-center relative overflow-hidden">
                {/* Background Accents */}
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-ljp-accent/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-ljp-secondary/20 rounded-full blur-3xl"></div>

                <div className="w-24 h-24 bg-ljp-accent rounded-3xl flex items-center justify-center mb-8 animate-bounce relative z-10">
                    <span className="text-ljp-primary font-black text-4xl">LJP</span>
                </div>
                <h1 className="text-3xl font-bold text-white mb-4 relative z-10">{t.appTitle}</h1>
                <p className="text-ljp-accent font-medium mb-12 relative z-10">{t.appSubtitle}</p>
                
                <div className="flex flex-col items-center gap-6 relative z-10">
                    <button 
                        onClick={onStart}
                        className="bg-white text-ljp-primary px-10 py-5 rounded-2xl font-bold text-xl shadow-2xl flex items-center space-x-3 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Play size={24} fill="currentColor" />
                        <span>{t.tapToStart}</span>
                    </button>

                    <button 
                        onClick={onToggleMute}
                        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm font-bold"
                    >
                        {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        {isMuted ? t.unmuteAudio : t.muteAudio}
                    </button>
                </div>

                <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3 z-10">
                    {(['en', 'hi', 'hn'] as Language[]).map(lang => (
                        <button
                            key={lang}
                            onClick={() => onLangChange(lang)}
                            className={`text-[10px] font-bold py-1 px-3 rounded-full transition-all border ${
                                currentLang === lang 
                                ? 'bg-ljp-accent text-ljp-primary border-transparent' 
                                : 'bg-white/10 text-white/60 border-white/10 hover:bg-white/20'
                            }`}
                        >
                            {lang.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // Helper to enforce number only and 10 digits
    const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>, isLogin: boolean) => {
        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
        if (isLogin) {
            setLoginMobile(val);
        } else {
            setFormData({ ...formData, mobile: val });
        }
    };

    const handleSignupSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isRegistrationDisabled) {
            alert(REGISTRATION_DISABLED_MSG);
            return;
        }

        if (formData.mobile.length !== 10) {
            alert("Please enter a valid 10-digit mobile number.");
            return;
        }
        if (!formData.appointmentLetter) {
            setShowUploadError(true);
            return;
        }
        
        setShowUploadError(false);
        setIsSubmitting(true);

        try {
            // 1. Client-Side Compression (Target 50-60KB WebP)
            const compressedImageBase64 = await compressImage(formData.appointmentLetter);

            // 3. Create User in App with the Base64 String
            onSignup({
                ...formData,
                appointmentLetterUrl: compressedImageBase64,
                joinedDate: Date.now()
            });

        } catch (error) {
            console.error("Registration Error:", error);
            alert("Failed to process registration.");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col items-center justify-center p-4 transition-colors duration-300 relative overflow-hidden">
            
            {/* Background Accents */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-ljp-secondary/10 dark:bg-ljp-secondary/20 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 -right-24 w-80 h-80 bg-ljp-accent/10 dark:bg-ljp-accent/20 rounded-full blur-3xl"></div>
            </div>

            <div className="absolute top-6 right-6 flex gap-2 z-10">
                 {(['en', 'hi', 'hn'] as Language[]).map(lang => (
                    <button
                        key={lang}
                        onClick={() => onLangChange(lang)}
                        className={`text-xs font-bold py-1.5 px-3 rounded-full transition-all border ${
                            currentLang === lang 
                            ? 'bg-ljp-primary dark:bg-white text-white dark:text-black border-transparent shadow-md' 
                            : 'bg-white/50 dark:bg-black/20 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                    >
                        {lang.toUpperCase()}
                    </button>
                ))}
            </div>

            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl max-w-md w-full rounded-3xl shadow-2xl overflow-hidden border border-white/20 dark:border-gray-700 z-10 transition-colors">
                <div className="p-8 pb-4 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-ljp-secondary to-black rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
                        <span className="text-white font-bold text-2xl">LJP</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.appTitle}</h1>
                    <p className="text-ljp-secondary dark:text-blue-400 font-medium text-sm mt-1 uppercase tracking-wide">{t.appSubtitle}</p>
                </div>
                
                <div className="px-8 pb-8 pt-2">
                    {/* Toggle */}
                    <div className="flex bg-gray-100 dark:bg-gray-900/50 p-1 rounded-xl mb-6">
                        <button 
                            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all shadow-sm ${!isSignup ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                            onClick={() => setIsSignup(false)}
                        >
                            {t.login}
                        </button>
                        <button 
                            className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all shadow-sm ${isSignup ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                            onClick={() => setIsSignup(true)}
                        >
                            {t.signup}
                        </button>
                    </div>

                    {!isSignup ? (
                        <form onSubmit={(e) => { e.preventDefault(); onLogin(loginMobile); }} className="space-y-5 animate-fade-in">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1.5 ml-1">{t.mobilePlaceholder}</label>
                                <input 
                                    type="tel" 
                                    required 
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3.5 outline-none focus:border-ljp-secondary dark:focus:border-blue-500 focus:ring-2 focus:ring-ljp-secondary/20 transition-all placeholder-gray-400 text-gray-900 dark:text-white font-medium"
                                    placeholder="9876543210"
                                    value={loginMobile}
                                    onChange={(e) => handleMobileChange(e, true)}
                                />
                                <p className="text-[10px] text-gray-400 mt-2 text-center">Demo: Admin (9341749399) | Member (1234567890)</p>
                            </div>
                            <button className="w-full bg-ljp-primary dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all flex items-center justify-center gap-2 group">
                                {t.loginBtn}
                                <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleSignupSubmit} className="space-y-3 animate-fade-in relative">
                            {isRegistrationDisabled && (
                                <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 z-20 flex flex-col items-center justify-center text-center p-4 rounded-xl backdrop-blur-sm border border-red-100">
                                    <Lock className="text-red-500 mb-2" size={32} />
                                    <p className="text-red-600 font-bold text-sm">{REGISTRATION_DISABLED_MSG}</p>
                                </div>
                            )}

                            <input type="text" placeholder={t.namePlaceholder} required className="auth-input" 
                                onChange={e => setFormData({...formData, name: e.target.value})} disabled={isSubmitting} />
                            
                            <input type="text" placeholder={t.fatherPlaceholder} required className="auth-input" 
                                onChange={e => setFormData({...formData, fatherName: e.target.value})} disabled={isSubmitting} />
                            
                            <input type="tel" placeholder={t.mobilePlaceholder} required className="auth-input" 
                                value={formData.mobile}
                                onChange={(e) => handleMobileChange(e, false)} disabled={isSubmitting} />
                            
                            <select className="auth-input bg-gray-50 dark:bg-gray-900" 
                                onChange={e => setFormData({...formData, district: e.target.value})} disabled={isSubmitting}>
                                {BIHAR_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>

                            <select className="auth-input bg-gray-50 dark:bg-gray-900" 
                                value={formData.designation}
                                onChange={e => setFormData({...formData, designation: e.target.value})} disabled={isSubmitting}>
                                {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                                
                            <input type="text" placeholder="Area/Jurisdiction (Optional)" className="auth-input" 
                                onChange={e => setFormData({...formData, jurisdiction: e.target.value})} disabled={isSubmitting} />

                            <div className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${showUploadError ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50'}`}>
                                <label className={`cursor-pointer block ${isSubmitting ? 'pointer-events-none opacity-50' : ''}`}>
                                    <div className="flex flex-col items-center">
                                        <Upload className={`mb-2 ${showUploadError ? 'text-red-500' : 'text-ljp-secondary dark:text-blue-400'}`} size={24} />
                                        <span className={`text-xs font-bold ${showUploadError ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'}`}>{t.uploadLetter}</span>
                                    </div>
                                    <input 
                                        type="file" 
                                        accept="image/*"
                                        className="hidden" 
                                        onChange={e => {
                                            setFormData({...formData, appointmentLetter: e.target.files?.[0] || null});
                                            setShowUploadError(false);
                                        }}
                                        disabled={isSubmitting}
                                    />
                                </label>
                                {formData.appointmentLetter && (
                                    <p className="text-xs text-green-600 dark:text-green-400 mt-2 flex items-center justify-center font-bold">
                                        <CheckCircle size={12} className="mr-1" /> {formData.appointmentLetter.name}
                                    </p>
                                )}
                            </div>

                            <button 
                                disabled={isSubmitting || isRegistrationDisabled}
                                className="w-full bg-ljp-accent text-ljp-primary py-3.5 rounded-xl font-bold shadow-lg hover:shadow-xl hover:brightness-110 transition-all mt-2 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? <><Loader2 size={18} className="animate-spin"/> Processing...</> : t.submit}
                            </button>
                            
                            {showUploadError && (
                                <p className="text-center text-xs text-red-500 font-bold flex items-center justify-center mt-1">
                                    <AlertCircle size={12} className="mr-1" />
                                    {t.uploadWarning}
                                </p>
                            )}
                        </form>
                    )}
                </div>
            </div>

            {/* Watermark */}
            <div className="mt-8 z-10 text-center">
                <p className="text-[10px] text-gray-500 dark:text-gray-400">Developed by Guru Printing Press</p>
                <div className="flex items-center justify-center gap-1">
                    <Globe size={10} className="text-gray-400 dark:text-gray-500" />
                    <a href="https://guruprintingpress.com" target="_blank" rel="noopener noreferrer" className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-ljp-secondary dark:hover:text-blue-400 transition-colors">guruprintingpress.com</a>
                </div>
            </div>
            
            <style>{`
                .auth-input {
                    width: 100%;
                    background-color: #F9FAFB;
                    border: 1px solid #E5E7EB;
                    border-radius: 0.75rem;
                    padding: 0.75rem 1rem;
                    font-size: 0.875rem;
                    outline: none;
                    transition: all 0.2s;
                    color: #111827;
                }
                .dark .auth-input {
                    background-color: #111827;
                    border-color: #374151;
                    color: #F3F4F6;
                }
                .auth-input:focus {
                    border-color: #2B0080;
                    box-shadow: 0 0 0 2px rgba(43, 0, 128, 0.1);
                }
                .dark .auth-input:focus {
                    border-color: #3B82F6;
                    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
                }
                .dark select.auth-input option {
                    background-color: #111827;
                    color: #F3F4F6;
                }
            `}</style>
        </div>
    );
};

export const PendingApprovalScreen = ({ onLogout, t }: { onLogout: () => void, t: any }) => (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-3xl shadow-xl max-w-sm text-center border border-gray-100 dark:border-gray-700">
            <div className="w-20 h-20 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="text-yellow-600 dark:text-yellow-500" size={40} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{t.approvalPending}</h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-8 leading-relaxed">
                {t.approvalMsg}
            </p>
            <button onClick={onLogout} className="text-ljp-secondary dark:text-blue-400 font-bold text-sm hover:underline">
                {t.backToLogin}
            </button>
        </div>
    </div>
);