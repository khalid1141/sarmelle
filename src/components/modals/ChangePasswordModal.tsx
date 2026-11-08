import React, { useState } from 'react';
import { KeyRound, X, AlertCircle } from 'lucide-react';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
  onSuccess
}: ChangePasswordModalProps) {
  const [oldPasswordInput, setOldPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setPasswordChangeError('');
    setOldPasswordInput('');
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPasswordInput.trim()) {
      setPasswordChangeError('Please enter your current password.');
      return;
    }
    if (newPasswordInput.length < 6) {
      setPasswordChangeError('New password must be at least 6 characters long.');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordChangeError('New password and confirm password do not match.');
      return;
    }
    handleClose();
    onSuccess('Your account password has been updated successfully.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200 select-none">
      <div className="bg-[#121212] border border-[#D4AF37]/40 max-w-md w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#D4AF37]/25 flex justify-between items-center bg-[#171717]">
          <div>
            <span className="text-[10px] text-[#D4AF37] uppercase tracking-wider font-semibold block">Security & Credentials</span>
            <h3 className="text-lg font-serif font-bold text-white mt-0.5 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#D4AF37]" /> Change Password
            </h3>
          </div>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form 
          onSubmit={handleSubmit}
          className="p-5 sm:p-6 space-y-4 text-xs"
        >
          {passwordChangeError && (
            <div className="p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{passwordChangeError}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-gray-300 font-semibold block uppercase tracking-wider text-[11px]">Old Password</label>
            <input
              type="password"
              placeholder="Enter current password"
              value={oldPasswordInput}
              onChange={(e) => { setOldPasswordInput(e.target.value); setPasswordChangeError(''); }}
              required
              className="w-full bg-black border border-gray-700 focus:border-[#D4AF37] rounded-lg p-2.5 text-white outline-none text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-gray-300 font-semibold block uppercase tracking-wider text-[11px]">New Password</label>
            <input
              type="password"
              placeholder="Enter new password (min. 6 characters)"
              value={newPasswordInput}
              onChange={(e) => { setNewPasswordInput(e.target.value); setPasswordChangeError(''); }}
              required
              className="w-full bg-black border border-gray-700 focus:border-[#D4AF37] rounded-lg p-2.5 text-white outline-none text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-gray-300 font-semibold block uppercase tracking-wider text-[11px]">Confirm New Password</label>
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPasswordInput}
              onChange={(e) => { setConfirmPasswordInput(e.target.value); setPasswordChangeError(''); }}
              required
              className="w-full bg-black border border-gray-700 focus:border-[#D4AF37] rounded-lg p-2.5 text-white outline-none text-xs"
            />
          </div>

          <div className="pt-2 flex justify-end gap-3 border-t border-gray-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 border border-gray-700 text-gray-300 hover:text-white rounded-lg text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-[#D4AF37] to-[#AA771C] text-black font-bold rounded-lg text-xs hover:brightness-110 transition-all cursor-pointer shadow-lg"
            >
              Update Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
