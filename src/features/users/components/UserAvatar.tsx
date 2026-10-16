import React from 'react';
import type { UserRow } from '../types';

// Lingkaran berisi huruf pertama nama (atau email) pengguna
const UserAvatar: React.FC<{ user: Pick<UserRow, 'full_name' | 'email'> }> = ({ user }) => (
  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center font-bold text-primary text-sm uppercase">
    {(user.full_name || user.email)?.[0] || '?'}
  </div>
);

export default UserAvatar;
