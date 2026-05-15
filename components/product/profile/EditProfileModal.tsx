'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Loader2, Camera, Trash2, CheckCircle2, User, Plus } from 'lucide-react';
import { supabase } from '@/lib/utils/supabase';
import { useAuth } from '@/lib/contexts/AuthContext';

const EditProfileModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const { user, profile, setProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [rank, setRank] = useState(profile?.rank || 'First Officer');
  const [airline, setAirline] = useState(profile?.airline || 'Malaysia Airlines');
  const [bio, setBio] = useState(profile?.bio || '');
  
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>(profile?.gallery_urls || []);
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setRank(profile.rank || 'First Officer');
      setAirline(profile.airline || 'Malaysia Airlines');
      setBio(profile.bio || '');
      setPreviews(profile.gallery_urls || []);
    }
  }, [profile]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (previews.length + files.length > 5) {
      alert("Max 5 photos allowed in the gallery");
      return;
    }

    setNewFiles(prev => [...prev, ...files]);
    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
    // Note: In a more complex app, we'd specifically track which File to remove from newFiles
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      console.error("DEBUG: No user found in AuthStore");
      setStatus({ type: 'error', text: 'Auth Error: No user session found.' });
      return;
    }

    console.log("DEBUG: Starting Profile Update for user:", user.id);
    setIsUpdating(true);
    setStatus(null);

    try {
      // 1. Filter existing URLs
      let finalGalleryUrls = previews.filter(url => url.startsWith('http'));
      console.log("DEBUG: Retained existing photos:", finalGalleryUrls.length);

      // 2. Upload NEW Images
      for (const file of newFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user.id}/gallery/${fileName}`;

        console.log("DEBUG: Uploading new file:", filePath);
        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(filePath, file);

        if (uploadError) {
          console.error("DEBUG: Upload Error:", uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('profile-photos')
          .getPublicUrl(filePath);
        
        finalGalleryUrls.push(publicUrl);
      }

      const updateData = {
        id: user.id,
        full_name: fullName,
        rank,
        airline,
        bio,
        gallery_urls: finalGalleryUrls.slice(0, 5),
        updated_at: new Date().toISOString()
      };

      console.log("DEBUG: Upserting into 'profiles' table:", updateData);

      // 3. Update Profile in DB
      const { data, error: dbError } = await supabase
        .from('profiles')
        .upsert(updateData)
        .select();

      if (dbError) {
        console.error("DEBUG: Database Error:", dbError);
        throw dbError;
      }

      console.log("DEBUG: Database success:", data);

      // 4. Update Global State
      setProfile({
        id: user.id,
        full_name: fullName,
        rank,
        airline,
        bio,
        gallery_urls: finalGalleryUrls.slice(0, 5)
      });

      setStatus({ type: 'success', text: 'Profile saved! Refreshing...' });
      
      setTimeout(() => {
        onClose();
        setStatus(null);
        setNewFiles([]);
      }, 1500);

    } catch (err: any) {
      console.error("DEBUG: Final Catch Error:", err);
      setStatus({ 
        type: 'error', 
        text: err.message || 'Failed to update profile. Check Supabase RLS policies.' 
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-bg w-full max-w-2xl rounded-[2.5rem] p-10 relative z-10 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar"
        >
          <button onClick={onClose} className="absolute top-8 right-8 p-2 hover:bg-surface-2 rounded-full transition-colors">
            <X size={20} className="text-text-subtle" />
          </button>

          <h2 className="text-3xl font-black text-text mb-2">Edit Profile</h2>
          <p className="text-text-muted font-medium mb-10 text-lg italic">Build your pilot persona.</p>

          {status && (
            <div className={`mb-8 p-5 rounded-2xl flex items-center gap-3 text-sm font-bold border ${
              status.type === 'success' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
            }`}>
              {status.type === 'success' ? <CheckCircle2 size={20} /> : <Trash2 size={20} />}
              <p>{status.text}</p>
            </div>
          )}

          <form className="space-y-8" onSubmit={handleUpdate}>
            <div className="space-y-6">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-subtle">Identity</label>
                <input 
                  type="text" 
                  required
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-surface border border-border p-5 rounded-2xl font-bold focus:outline-none focus:ring-2 focus:ring-accent/20 focus:bg-bg transition-all text-text"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-subtle">Rank</label>
                  <input 
                    type="text" 
                    value={rank}
                    onChange={(e) => setRank(e.target.value)}
                    className="w-full bg-surface border border-border p-5 rounded-2xl font-bold focus:outline-none text-text"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-text-subtle">Airline</label>
                  <input 
                    type="text" 
                    value={airline}
                    onChange={(e) => setAirline(e.target.value)}
                    className="w-full bg-surface border border-border p-5 rounded-2xl font-bold focus:outline-none text-text"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-text-subtle">Short Bio</label>
                <textarea 
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell your story..."
                  className="w-full bg-surface border border-border p-5 rounded-2xl font-bold focus:outline-none text-text"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-text-subtle">Gallery (Max 5 Photos)</label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                {previews.map((src, i) => (
                  <div key={i} className="aspect-square rounded-2xl overflow-hidden relative group border border-border">
                    <img src={src} alt="Preview" className="w-full h-full object-cover" />
                    <button 
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute inset-0 bg-accent/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
                
                {previews.length < 5 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 hover:border-accent/50 hover:bg-surface transition-all text-text-subtle hover:text-accent"
                  >
                    <Plus size={24} />
                    <span className="text-[10px] font-black uppercase">Upload</span>
                  </button>
                )}
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" multiple className="hidden" />
            </div>

            <button 
              type="submit"
              disabled={isUpdating}
              className="w-full bg-black text-white py-6 rounded-2xl font-black text-lg hover:bg-gray-800 transition-all active:scale-[0.98] shadow-xl disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-3"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="animate-spin" />
                  Updating...
                </>
              ) : 'Save Profile Changes'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default EditProfileModal;
