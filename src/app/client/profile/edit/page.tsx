'use client';

import { AuthProvider } from '../../../contexts/AuthContext';
import Navbar from '../../../components/Navbar';
import EditProfile from '../../../components/EditProfile';

export default function EditProfilePage() {
  return (
    <AuthProvider>
      <Navbar />
      <EditProfile />
    </AuthProvider>
  );
}
