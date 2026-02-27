import React, { useState } from 'react';
import { Post, User, Role } from '../types';
import { MessageSquare, Heart, Share2, MoreHorizontal, Trash2, Zap, ArrowRight, Image as ImageIcon, Plus, X, Clock, Loader2, CheckCircle } from 'lucide-react';
import { simulateDynamicTranslation, Language } from '../services/translations';
import { compressImage } from '../services/imageUtils';
import { FEED_BATCH_SIZE, MAX_FEED_POSTS } from '../services/config';

interface FeedProps {
    currentUser: User;
    posts: Post[];
    onAddPost: (content: string, image?: string, isNotice?: boolean, expiryHours?: number) => void;
    onDeletePost?: (id: string) => void;
    onNoticeClick?: (post: Post) => void;
    onLikePost?: (id: string, isLiked: boolean) => void;
    t: any;
    currentLang: Language;
}

export const Feed: React.FC<FeedProps> = ({ currentUser, posts, onAddPost, onDeletePost, onNoticeClick, onLikePost, t, currentLang }) => {
    const [newPostContent, setNewPostContent] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isCompressing, setIsCompressing] = useState(false);
    
    // Pagination State
    const [visibleCount, setVisibleCount] = useState(FEED_BATCH_SIZE);
    
    // Local Optimistic Interaction State
    const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

    // Admin Notice State
    const [showNoticeModal, setShowNoticeModal] = useState(false);
    const [noticeContent, setNoticeContent] = useState('');
    const [noticeExpiry, setNoticeExpiry] = useState(72); 

    const now = Date.now();

    // Logic: Active notices
    const activeNotices = posts
        .filter(p => p.isNotice && p.expiryDate && p.expiryDate > now)
        .sort((a, b) => b.timestamp - a.timestamp);

    // Feed posts
    const feedPostsAll = posts.filter(p => !p.isNotice);
    const feedPosts = feedPostsAll.slice(0, visibleCount);
    const isEndOfFeed = visibleCount >= feedPostsAll.length || visibleCount >= MAX_FEED_POSTS;

    const handleLoadMore = () => {
        setVisibleCount(prev => Math.min(prev + FEED_BATCH_SIZE, MAX_FEED_POSTS));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsCompressing(true);
            try {
                const compressedDataUrl = await compressImage(file);
                setImagePreview(compressedDataUrl);
            } catch (err) {
                console.error("Compression failed", err);
                alert("Failed to process image.");
            } finally {
                setIsCompressing(false);
            }
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPostContent.trim()) return;
        onAddPost(newPostContent, imagePreview || undefined);
        setNewPostContent('');
        setImagePreview(null);
    };

    const handleNoticeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!noticeContent.trim()) return;
        onAddPost(noticeContent, undefined, true, noticeExpiry);
        setNoticeContent('');
        setShowNoticeModal(false);
    };

    const toggleLike = (postId: string) => {
        const isLiked = likedPosts.has(postId);
        const newSet = new Set(likedPosts);
        
        if (isLiked) {
            newSet.delete(postId);
        } else {
            newSet.add(postId);
        }
        setLikedPosts(newSet);
        
        // Propagate to parent handler (Firestore)
        if (onLikePost) {
            onLikePost(postId, isLiked);
        }
    };

    const canDelete = (post: Post) => {
        if (currentUser.role === Role.SUPER_ADMIN) return true;
        if (post.userId === currentUser.id) return true;
        return false;
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-2xl mx-auto pb-24 pt-2">
            
            {/* --- Active Notices Carousel --- */}
            <div className="w-full mb-2">
                <div className="flex items-center justify-between mb-3 px-1">
                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Zap size={14} className="text-ljp-accent fill-current" /> {t.officialNotices}
                    </h3>
                    {currentUser.role === Role.SUPER_ADMIN && (
                        <button 
                            onClick={() => setShowNoticeModal(true)}
                            className="bg-ljp-secondary text-white px-3 py-1.5 rounded-full text-[10px] font-bold shadow-md hover:bg-ljp-secondary/90 flex items-center gap-1"
                        >
                            <Plus size={12} /> {t.createNotice}
                        </button>
                    )}
                </div>
                
                {activeNotices.length > 0 ? (
                    <div className="flex gap-4 overflow-x-auto pb-4 px-2 scrollbar-hide no-scrollbar snap-x">
                        {activeNotices.map(notice => (
                            <div 
                                key={notice.id} 
                                className="snap-start shrink-0 w-80 h-44 bg-gradient-to-br from-ljp-secondary to-black rounded-2xl p-5 relative overflow-hidden shadow-lg border border-white/10"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                                <div className="absolute bottom-0 left-0 w-16 h-16 bg-ljp-accent/20 rounded-full blur-xl -ml-5 -mb-5"></div>
                                
                                <div className="relative z-10 flex flex-col h-full justify-between">
                                    <div className="flex items-center justify-between">
                                        <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-sm">
                                            Official
                                        </span>
                                        <span className="text-[10px] text-white/60 font-medium bg-black/20 px-2 py-0.5 rounded-full">
                                            Expires in {Math.ceil((notice.expiryDate! - Date.now()) / (1000 * 60 * 60))}h
                                        </span>
                                    </div>
                                    
                                    <p className="text-white font-semibold text-sm leading-relaxed line-clamp-2 mt-2">
                                        {simulateDynamicTranslation(notice.content, currentLang)}
                                    </p>
                                    
                                    <div className="flex items-center justify-between mt-auto pt-3">
                                        <div className="flex items-center gap-2">
                                            <img src={notice.userPhoto} className="w-6 h-6 rounded-full border border-white/30" alt="" />
                                            <span className="text-[10px] text-white/80 font-medium truncate w-24">{notice.userName}</span>
                                        </div>
                                        <button 
                                            onClick={() => onNoticeClick && onNoticeClick(notice)}
                                            className="text-[10px] text-ljp-accent font-bold hover:underline flex items-center bg-white/10 px-2 py-1 rounded-lg hover:bg-white/20 transition-colors"
                                        >
                                            {t.viewNotice} <ArrowRight size={10} className="ml-1" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-4 bg-gray-100 dark:bg-gray-800 rounded-xl text-xs text-gray-500">No active notices</div>
                )}
            </div>

            {/* --- Create Post Card --- */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 transition-colors">
                <form onSubmit={handleSubmit}>
                    <div className="flex gap-3 mb-2">
                        <img 
                            src={currentUser.photoUrl || "https://picsum.photos/50/50"} 
                            alt="User" 
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-800" 
                        />
                        <div className="flex-1">
                            <textarea
                                value={newPostContent}
                                onChange={(e) => setNewPostContent(e.target.value)}
                                placeholder={t.postPlaceholder}
                                className="w-full bg-transparent border-none focus:ring-0 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 resize-none min-h-[50px] p-2 leading-relaxed"
                            />
                        </div>
                    </div>
                    
                    {imagePreview && (
                        <div className="mb-3 relative rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 group">
                            <img src={imagePreview} alt="Preview" className="w-full h-auto object-contain" />
                            <button 
                                type="button" 
                                onClick={() => setImagePreview(null)} 
                                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80 backdrop-blur-sm transition-colors"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    <div className="flex justify-between items-center pt-2 border-t border-gray-50 dark:border-gray-800">
                        <label className={`cursor-pointer flex items-center gap-2 text-ljp-secondary dark:text-blue-400 px-3 py-1.5 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors ${isCompressing ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <ImageIcon size={18} />
                            <span className="text-xs font-bold">{isCompressing ? 'Compressing...' : t.addPhoto}</span>
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isCompressing} />
                        </label>
                        
                        <button 
                            type="submit" 
                            disabled={!newPostContent.trim() || isCompressing}
                            className="bg-ljp-primary dark:bg-white text-white dark:text-black px-5 py-1.5 rounded-full text-xs font-bold hover:shadow-lg disabled:opacity-50 disabled:shadow-none transition-all"
                        >
                            {t.postBtn}
                        </button>
                    </div>
                </form>
            </div>

            {/* --- Feed List --- */}
            <div className="space-y-6">
                {feedPosts.map(post => (
                    <div key={post.id} className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors">
                        
                        <div className="p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <img 
                                    src={post.userPhoto || "https://picsum.photos/50/50"} 
                                    alt={post.userName} 
                                    className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-50 dark:ring-gray-800" 
                                />
                                <div>
                                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">{post.userName}</h4>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">{simulateDynamicTranslation(post.userDesignation, currentLang)}</p>
                                </div>
                            </div>
                            <div className="flex items-center text-gray-400">
                                <span className="text-[10px] mr-2">{new Date(post.timestamp).toLocaleDateString()}</span>
                            </div>
                        </div>

                        <div className="px-4 pb-2">
                            <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                                {simulateDynamicTranslation(post.content, currentLang)}
                            </p>
                        </div>

                        {post.imageUrl && (
                            <div className="mt-3 w-full bg-gray-50 dark:bg-black">
                                <img 
                                    src={post.imageUrl} 
                                    alt="Post content" 
                                    className="w-full h-auto" 
                                    loading="lazy"
                                />
                            </div>
                        )}

                        <div className="p-4 flex items-center justify-between border-t border-gray-50 dark:border-gray-800 mt-2">
                            <div className="flex space-x-6">
                                <button 
                                    onClick={() => toggleLike(post.id)}
                                    className={`flex items-center space-x-2 transition-colors group ${likedPosts.has(post.id) ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                                >
                                    <Heart size={20} className={`transition-transform group-active:scale-75 ${likedPosts.has(post.id) ? 'fill-red-500' : ''}`} />
                                    <span className="text-xs font-bold">{post.likes}</span>
                                </button>
                                <button className="flex items-center space-x-2 text-gray-500 hover:text-ljp-secondary dark:hover:text-blue-400 transition-colors">
                                    <MessageSquare size={20} />
                                    <span className="text-xs font-bold">{post.comments || 0}</span>
                                </button>
                                <button className="flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors">
                                    <Share2 size={20} />
                                    <span className="text-xs font-bold">{post.shares || 0}</span>
                                </button>
                            </div>
                            
                            {canDelete(post) && onDeletePost && (
                                <button onClick={() => { if(confirm('Delete post?')) onDeletePost(post.id); }} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                <div className="text-center pb-8">
                    {!isEndOfFeed ? (
                        <button 
                            onClick={handleLoadMore}
                            className="bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-6 py-2 rounded-full font-bold text-xs shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-700 transition-all"
                        >
                            Load More
                        </button>
                    ) : (
                        <div className="flex items-center justify-center gap-2 text-gray-400 text-xs font-bold py-4">
                            <CheckCircle size={14} /> You're all caught up
                        </div>
                    )}
                </div>
            </div>

            {showNoticeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNoticeModal(false)}></div>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-3xl p-6 relative z-10 shadow-2xl animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Create Official Notice</h3>
                            <button onClick={() => setShowNoticeModal(false)}><X size={20} className="text-gray-500" /></button>
                        </div>
                        <form onSubmit={handleNoticeSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Notice Content</label>
                                <textarea 
                                    value={noticeContent}
                                    onChange={e => setNoticeContent(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-ljp-secondary dark:text-white"
                                    rows={4}
                                    placeholder="Enter notice details..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Expiry Duration (Hours)</label>
                                <select 
                                    value={noticeExpiry}
                                    onChange={e => setNoticeExpiry(Number(e.target.value))}
                                    className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-xl p-3 text-sm font-bold dark:text-white"
                                >
                                    <option value={24}>24 Hours</option>
                                    <option value={48}>48 Hours</option>
                                    <option value={72}>72 Hours (Default)</option>
                                    <option value={168}>1 Week</option>
                                </select>
                            </div>
                            <button className="w-full bg-ljp-secondary text-white py-3 rounded-xl font-bold hover:brightness-110">
                                Publish Notice
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};