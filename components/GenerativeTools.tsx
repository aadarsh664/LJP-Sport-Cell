import React, { useState } from 'react';
import { generateImage, editImage } from '../services/geminiService';
import { Wand2, Image as ImageIcon, Loader2, Download } from 'lucide-react';

export const GenerativeTools: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'generate' | 'edit'>('generate');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Generation State
    const [genPrompt, setGenPrompt] = useState('');
    const [genSize, setGenSize] = useState<'1K' | '2K' | '4K'>('1K');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    // Edit State
    const [editPrompt, setEditPrompt] = useState('');
    const [editBaseImage, setEditBaseImage] = useState<string | null>(null);
    const [editedImage, setEditedImage] = useState<string | null>(null);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const result = await generateImage(genPrompt, genSize);
            setGeneratedImage(result);
            if(!result) setError("No image generated. Try a different prompt.");
        } catch (err: any) {
            setError(err.message || "Failed to generate image.");
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editBaseImage) {
            setError("Please upload an image first.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const result = await editImage(editBaseImage, editPrompt);
            setEditedImage(result);
            if(!result) setError("No changes made. Try a clearer prompt.");
        } catch (err: any) {
            setError(err.message || "Failed to edit image.");
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setEditBaseImage(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
                <Wand2 className="mr-2 text-ljp-blue" /> AI Creative Studio
            </h2>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg w-fit">
                <button 
                    onClick={() => setActiveTab('generate')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'generate' ? 'bg-white shadow text-ljp-blue' : 'text-gray-600 hover:text-gray-900'}`}
                >
                    Generate Image (Pro)
                </button>
                <button 
                    onClick={() => setActiveTab('edit')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'edit' ? 'bg-white shadow text-ljp-blue' : 'text-gray-600 hover:text-gray-900'}`}
                >
                    Edit Image (Flash)
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Generate View */}
            {activeTab === 'generate' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <form onSubmit={handleGenerate} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Prompt</label>
                            <textarea 
                                value={genPrompt}
                                onChange={(e) => setGenPrompt(e.target.value)}
                                placeholder="E.g., A crowd waving flags at a political rally in Patna..."
                                className="w-full border rounded-lg p-3 text-sm focus:ring-ljp-blue focus:border-ljp-blue"
                                rows={3}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Resolution</label>
                            <select 
                                value={genSize} 
                                onChange={(e) => setGenSize(e.target.value as any)}
                                className="w-full border rounded-lg p-2 text-sm"
                            >
                                <option value="1K">1K (Standard)</option>
                                <option value="2K">2K (High Res)</option>
                                <option value="4K">4K (Ultra)</option>
                            </select>
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading || !genPrompt}
                            className="w-full bg-ljp-blue text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "Generate with Nano Banana Pro"}
                        </button>
                    </form>

                    {generatedImage && (
                        <div className="mt-6">
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Result:</h3>
                            <img src={generatedImage} alt="Generated" className="w-full rounded-lg shadow-lg" />
                            <a href={generatedImage} download="generated-ai.png" className="mt-2 inline-flex items-center text-sm text-ljp-blue hover:underline">
                                <Download size={14} className="mr-1" /> Download
                            </a>
                        </div>
                    )}
                </div>
            )}

            {/* Edit View */}
            {activeTab === 'edit' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <form onSubmit={handleEdit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">1. Upload Base Image</label>
                            <input 
                                type="file" 
                                accept="image/*"
                                onChange={handleFileUpload}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-ljp-blue hover:file:bg-blue-100"
                            />
                            {editBaseImage && (
                                <img src={editBaseImage} alt="Base" className="mt-2 h-32 rounded object-cover border" />
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">2. Edit Instruction</label>
                            <input 
                                type="text"
                                value={editPrompt}
                                onChange={(e) => setEditPrompt(e.target.value)}
                                placeholder="E.g., Add a retro filter, remove background..."
                                className="w-full border rounded-lg p-2 text-sm focus:ring-ljp-blue focus:border-ljp-blue"
                                required
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading || !editPrompt || !editBaseImage}
                            className="w-full bg-orange-500 text-white py-2 rounded-lg font-semibold hover:bg-orange-600 disabled:opacity-50 flex justify-center items-center"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : "Edit with Nano Banana (Flash)"}
                        </button>
                    </form>

                    {editedImage && (
                        <div className="mt-6">
                            <h3 className="text-sm font-medium text-gray-500 mb-2">Edited Result:</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-xs text-gray-400 block mb-1">Original</span>
                                    <img src={editBaseImage!} alt="Original" className="w-full rounded-lg opacity-75" />
                                </div>
                                <div>
                                    <span className="text-xs text-ljp-blue font-bold block mb-1">AI Edited</span>
                                    <img src={editedImage} alt="Edited" className="w-full rounded-lg shadow-lg border-2 border-ljp-blue" />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
