/**
 * Settings view: name, timezone, change password.
 */

import { useState } from 'react';
import { useAuth } from '../contexts/auth-context';
import { useUpdateUser, useChangePassword } from '../hooks/api';

const TIMEZONES = Intl.supportedValuesOf
  ? Intl.supportedValuesOf('timeZone')
  : ['UTC', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Kolkata', 'Australia/Sydney'];

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const updateUser = useUpdateUser();
  const changePassword = useChangePassword();

  const [name, setName] = useState(user?.name ?? '');
  const [timezone, setTimezone] = useState(user?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [profileSaved, setProfileSaved] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);

  async function handleProfileSave() {
    try {
      const updated = await updateUser.mutateAsync({ name: name.trim(), timezone });
      setUser(updated);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2000);
    } catch {
      // handled by mutation
    }
  }

  async function handlePasswordSave() {
    setPasswordError('');
    setPasswordSaved(false);
    try {
      await changePassword.mutateAsync({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to change password';
      setPasswordError(msg);
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="page-title">Settings</h1>

      {/* Profile section */}
      <section className="mt-6">
        <h2 className="text-sm font-semibold text-ink">Profile</h2>
        <div className="mt-3 space-y-4">
          <div>
            <label className="block text-xs font-medium text-sidebar-muted mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-sidebar-muted mb-1">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="input"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleProfileSave}
              disabled={updateUser.isPending}
              className="btn btn-primary btn-sm"
            >
              Save
            </button>
            {profileSaved && <span className="text-xs text-green-600">Saved!</span>}
          </div>
        </div>
      </section>

      {/* Password section */}
      <section className="mt-10 border-t border-surface-border pt-6">
        <h2 className="text-sm font-semibold text-ink">Change password</h2>
        <div className="mt-3 space-y-4">
          <div>
            <label className="block text-xs font-medium text-sidebar-muted mb-1">Current password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-sidebar-muted mb-1">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input"
              minLength={8}
            />
          </div>
          {passwordError && <p className="text-xs text-danger">{passwordError}</p>}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePasswordSave}
              disabled={changePassword.isPending || !currentPassword || !newPassword}
              className="btn btn-primary btn-sm"
            >
              Update password
            </button>
            {passwordSaved && <span className="text-xs text-green-600">Password updated!</span>}
          </div>
        </div>
      </section>

      {/* Account info */}
      <section className="mt-10 border-t border-surface-border pt-6">
        <h2 className="text-sm font-semibold text-ink">Account</h2>
        <p className="mt-2 text-xs text-sidebar-muted">{user?.email}</p>
        <p className="mt-1 text-xs text-sidebar-muted">
          Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'unknown'}
        </p>
      </section>
    </div>
  );
}
