'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Globe,
  Home,
  Camera,
  Save,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  Upload,
  X,
} from 'lucide-react';

// ============================================
// INTERFACES
// ============================================
interface UserProfileForm {
  name: string;
  surname: string;
  email: string;
  phone: string;
  birthDate: string;
  profileImgUrl: string;

  // Dirección desglosada
  street: string; // Calle
  extNumber: string; // Número exterior
  intNumber: string; // Número interior
  neighborhood: string; // Colonia / Barrio

  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

// ============================================
// COMPONENTE
// ============================================
export default function EditProfile() {
  const { user, token, logout } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Estados para subida de imagen
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState<UserProfileForm>({
    name: '',
    surname: '',
    email: '',
    phone: '',
    birthDate: '',
    profileImgUrl: '',

    street: '',
    extNumber: '',
    intNumber: '',
    neighborhood: '',

    city: '',
    state: '',
    country: 'México',
    postalCode: '',
  });

  useEffect(() => {
    if (!user || !token) {
      router.push('/login');
      return;
    }

    fetchProfile();
  }, [user, token, router]);

  const fetchProfile = async () => {
    if (!user || !token) return;

    setLoading(true);
    setError(null);

    try {
      const backendUrl = process.env.VITE_BACKEND_URL;
      const response = await fetch(`${backendUrl}/user/profile/${user.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          logout();
          router.push('/login');
          return;
        }
        throw new Error('Error al cargar el perfil');
      }

      const data = await response.json();

      // De momento, usamos address completo recibido como "street"
      setFormData({
        name: data.name || '',
        surname: data.surname || '',
        email: user.email || '',
        phone: data.phone || '',
        birthDate: data.birthDate || '',
        profileImgUrl: data.profileImgUrl || '',

        street: data.address || '',
        extNumber: '',
        intNumber: '',
        neighborhood: '',

        city: data.city || '',
        state: data.state || '',
        country: data.country || 'México',
        postalCode: data.postalCode || '',
      });
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Solo se permiten archivos de imagen (JPG, PNG, WEBP, GIF)');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('La imagen no debe superar los 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setSelectedFile(file);
    setError(null);
  };

  const handleUploadImage = async () => {
    if (!selectedFile || !user) return;

    setUploadingImage(true);
    setError(null);

    try {
      const backendUrl = process.env.VITE_BACKEND_URL;
      const fd = new FormData();
      fd.append('file', selectedFile);

      const response = await fetch(`${backendUrl}/file-upload/avatar/${user.id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: fd,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || 'Error al subir la imagen');
      }

      const data = await response.json();
      const imageUrl = data.url || data.imageUrl || data.avatarUrl;

      if (!imageUrl) {
        throw new Error('El servidor no devolvió una URL de imagen');
      }

      setFormData((prev) => ({ ...prev, profileImgUrl: imageUrl }));

      setImagePreview(null);
      setSelectedFile(null);
    } catch (err) {
      console.error('❌ Error uploading image:', err);
      setError(err instanceof Error ? err.message : 'Error al subir la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCancelImageUpload = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !token) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const backendUrl = process.env.VITE_BACKEND_URL;

      // 👉 Armamos la línea base de dirección con los campos desglosados
      const addressParts: string[] = [];

      if (formData.street) addressParts.push(formData.street);
      if (formData.extNumber) addressParts.push(`No. ${formData.extNumber}`);
      if (formData.intNumber) addressParts.push(`Int. ${formData.intNumber}`);
      if (formData.neighborhood) addressParts.push(formData.neighborhood);

      const baseAddress = addressParts.length > 0 ? addressParts.join(', ') : null;

      // fullAddress pensando ya en Google Maps a futuro
      const fullAddressParts: (string | null | undefined)[] = [
        baseAddress,
        formData.city,
        formData.state,
        formData.postalCode,
        formData.country,
      ];

      const fullAddress = fullAddressParts
        .filter((p) => p && p.toString().trim() !== '')
        .join(', ');

      const updateData: {
        name: string;
        surname: string;
        phone: string;
        birthDate: string;
        address: string | null;
        city: string | null;
        state: string | null;
        country: string | null;
        postalCode: string | null;
        fullAddress: string | null;
        profileImgUrl?: string;
      } = {
        name: formData.name,
        surname: formData.surname,
        phone: formData.phone,
        birthDate: formData.birthDate,

        address: baseAddress,
        city: formData.city || null,
        state: formData.state || null,
        country: formData.country || null,
        postalCode: formData.postalCode || null,

        fullAddress: fullAddress || null,
      };

      if (formData.profileImgUrl?.trim() !== '') {
        updateData.profileImgUrl = formData.profileImgUrl;
      }

      const response = await fetch(`${backendUrl}/user/update-profile/${user.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Error al actualizar el perfil (${response.status})`);
      }

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/client/profile';
      }, 2000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || !token) return;

    if (deleteInput !== 'ELIMINAR') {
      setError('Debes escribir "ELIMINAR" para confirmar');
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      const backendUrl = process.env.VITE_BACKEND_URL;
      const response = await fetch(`${backendUrl}/user/delete-profile/${user.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al eliminar la cuenta');
      }

      logout();
      router.push('/');
    } catch (err) {
      console.error('Error deleting account:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar la cuenta');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50 pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Background blobs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl animate-pulse"></div>
          <div
            className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '1s' }}
          ></div>
        </div>

        {/* Success */}
        {success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative z-10 bg-gradient-to-r from-emerald-50 to-green-50 backdrop-blur-xl border-2 border-emerald-200 rounded-2xl p-6 mb-6 flex items-center gap-4 shadow-xl"
          >
            <div className="p-3 bg-emerald-500 rounded-xl">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-emerald-900 text-lg">¡Perfil actualizado con éxito!</p>
              <p className="text-emerald-700">Redirigiendo al dashboard...</p>
            </div>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative z-10 bg-gradient-to-r from-red-50 to-pink-50 backdrop-blur-xl border-2 border-red-200 rounded-2xl p-6 mb-6 flex items-center gap-4 shadow-xl"
          >
            <div className="p-3 bg-red-500 rounded-xl">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-red-900 text-lg">Oops, algo salió mal</p>
              <p className="text-red-700">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 bg-white/70 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 px-8 py-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-black/5"></div>
            <motion.button
              whileHover={{ x: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.push('/client/profile')}
              className="relative z-10 flex items-center gap-2 text-white hover:text-white/90 mb-4 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-semibold">Volver</span>
            </motion.button>
            <h1 className="relative z-10 text-5xl font-bold text-white mb-2">Editar Perfil</h1>
            <p className="relative z-10 text-white/90 text-lg">
              Mantén tu información actualizada y completa
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-8">
            {/* Avatar */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center -mt-20 mb-8"
            >
              <div className="relative mb-6 group">
                <div className="absolute -inset-2 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 rounded-full blur-xl opacity-30 group-hover:opacity-60 transition-opacity"></div>

                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="relative w-36 h-36 rounded-full object-cover border-4 border-white shadow-2xl"
                  />
                ) : formData.profileImgUrl ? (
                  <img
                    src={formData.profileImgUrl}
                    alt="Foto de perfil"
                    className="relative w-36 h-36 rounded-full object-cover border-4 border-white shadow-2xl"
                  />
                ) : (
                  <div className="relative w-36 h-36 rounded-full bg-gradient-to-br from-blue-500 via-cyan-500 to-emerald-500 flex items-center justify-center border-4 border-white shadow-2xl">
                    <User className="w-20 h-20 text-white" />
                  </div>
                )}

                <label
                  htmlFor="file-upload"
                  className="absolute bottom-2 right-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full p-3 shadow-xl cursor-pointer hover:shadow-2xl transition-all hover:scale-110"
                >
                  <Camera className="w-6 h-6 text-white" />
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
              </div>

              {selectedFile && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 mb-4"
                >
                  <button
                    type="button"
                    onClick={handleUploadImage}
                    disabled={uploadingImage}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50"
                  >
                    {uploadingImage ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        Subir imagen
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelImageUpload}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                  >
                    <X className="w-4 h-4" />
                    Cancelar
                  </button>
                </motion.div>
              )}

              <div className="text-center max-w-md">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Click en el ícono de cámara</strong> para seleccionar una imagen desde tu
                  PC
                </p>
                <p className="text-xs text-gray-500">Formatos: JPG, PNG, WEBP, GIF • Máximo: 5MB</p>
              </div>
            </motion.div>

            {/* Información personal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                  <User className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Información Personal</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                    <User className="w-4 h-4 text-blue-600" />
                    Nombre
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all bg-white/50 backdrop-blur-sm text-gray-900"
                    placeholder="Tu nombre"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                    <User className="w-4 h-4 text-blue-600" />
                    Apellido
                  </label>
                  <input
                    type="text"
                    name="surname"
                    value={formData.surname}
                    onChange={handleChange}
                    required
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all bg-white/50 backdrop-blur-sm text-gray-900"
                    placeholder="Tu apellido"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      readOnly
                      className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl bg-gray-100/80 text-gray-500 cursor-not-allowed backdrop-blur-sm"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-gray-200 px-3 py-1 rounded-full">
                      <span className="text-xs font-semibold text-gray-600">No editable</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                    <Phone className="w-4 h-4 text-blue-600" />
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all bg-white/50 backdrop-blur-sm text-gray-900"
                    placeholder="+52 123 456 7890"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Fecha de Nacimiento
                  </label>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all bg-white/50 backdrop-blur-sm text-gray-900 max-w-md"
                  />
                </div>
              </div>
            </motion.div>

            {/* Ubicación */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="pt-8 border-t-2 border-gray-200"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl shadow-lg">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Ubicación</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Calle */}
                <div className="md:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                    <Home className="w-4 h-4 text-emerald-600" />
                    Calle
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all bg-white/50 backdrop-blur-sm text-gray-900"
                    placeholder="Calle principal"
                  />

                  <button
                    type="button"
                    onClick={() => alert('Próximamente podrás fijar tu ubicación con Google Maps')}
                    className="mt-3 px-4 py-2 bg-cyan-700 text-white rounded-xl hover:bg-cyan-800 transition w-fit text-sm font-semibold"
                  >
                    Configurar ubicación con mapa
                  </button>
                </div>

                {/* Número exterior */}
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-3 block">
                    Número Exterior
                  </label>
                  <input
                    type="text"
                    name="extNumber"
                    value={formData.extNumber}
                    onChange={handleChange}
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all bg-white/50 backdrop-blur-sm text-gray-900"
                    placeholder="Ej. 123"
                  />
                </div>

                {/* Número interior */}
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-3 block">
                    Número Interior
                  </label>
                  <input
                    type="text"
                    name="intNumber"
                    value={formData.intNumber}
                    onChange={handleChange}
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all bg-white/50 backdrop-blur-sm text-gray-900"
                    placeholder="Ej. 4B (opcional)"
                  />
                </div>

                {/* Colonia / Barrio */}
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-3 block">
                    Colonia / Barrio
                  </label>
                  <input
                    type="text"
                    name="neighborhood"
                    value={formData.neighborhood}
                    onChange={handleChange}
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all bg-white/50 backdrop-blur-sm text-gray-900"
                    placeholder="Colonia o barrio"
                  />
                </div>

                {/* Ciudad */}
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-3 block">Ciudad</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all bg-white/50 backdrop-blur-sm text-gray-900"
                    placeholder="Tu ciudad"
                  />
                </div>

                {/* Estado */}
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-3 block">Estado</label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all bg-white/50 backdrop-blur-sm text-gray-900"
                    placeholder="Tu estado"
                  />
                </div>

                {/* País */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-3">
                    <Globe className="w-4 h-4 text-emerald-600" />
                    País
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all bg-white/50 backdrop-blur-sm text-gray-900"
                    placeholder="México"
                  />
                </div>

                {/* Código Postal */}
                <div>
                  <label className="text-sm font-bold text-gray-700 mb-3 block">
                    Código Postal
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 transition-all bg-white/50 backdrop-blur-sm text-gray-900"
                    placeholder="12345"
                  />
                </div>
              </div>
            </motion.div>

            {/* Botones */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 pt-8"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button"
                onClick={() => router.push('/client/profile')}
                className="flex-1 px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 hover:border-gray-400 transition-all font-bold text-lg shadow-md"
              >
                Cancelar
              </motion.button>

              <motion.button
                whileHover={{
                  scale: 1.02,
                  boxShadow: '0 20px 40px rgba(37, 99, 235, 0.3)',
                }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={saving}
                className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 text-white rounded-2xl hover:shadow-2xl transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-cyan-700 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                {saving ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin relative z-10" />
                    <span className="relative z-10">Guardando cambios...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-6 h-6 relative z-10" />
                    <span className="relative z-10">Guardar Cambios</span>
                  </>
                )}
              </motion.button>
            </motion.div>

            {/* Danger zone */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-12 pt-8 border-t border-gray-200"
            >
              <details className="group">
                <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-600 transition-colors list-none flex items-center gap-2">
                  <span>Opciones avanzadas</span>
                  <svg
                    className="w-4 h-4 transition-transform group-open:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>

                <div className="mt-6 p-6 bg-red-50 border-2 border-red-200 rounded-xl">
                  <div className="flex items-start gap-3 mb-4">
                    <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="text-lg font-bold text-red-900 mb-1">Zona de Peligro</h3>
                      <p className="text-sm text-red-700">
                        Esta acción es <strong>permanente</strong> y{' '}
                        <strong>no se puede deshacer</strong>.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full px-4 py-3 bg-white border-2 border-red-300 text-red-700 rounded-xl hover:bg-red-50 hover:border-red-400 transition-all font-semibold text-sm"
                  >
                    Eliminar mi cuenta permanentemente
                  </button>
                </div>
              </details>
            </motion.div>
          </form>
        </motion.div>

        {/* Modal eliminar cuenta */}
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-10 h-10 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  ¿Estás completamente seguro?
                </h2>
                <p className="text-gray-600 mb-4">
                  Esta acción eliminará permanentemente tu cuenta y todos tus datos.
                  <strong className="block mt-2 text-red-600">
                    Esta acción NO se puede deshacer.
                  </strong>
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Escribe <span className="text-red-600">ELIMINAR</span> para confirmar:
                </label>
                <input
                  type="text"
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-black"
                  placeholder="Escribe ELIMINAR"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteInput('');
                  }}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-semibold"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteInput !== 'ELIMINAR' || deleting}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Eliminando...
                    </>
                  ) : (
                    'Eliminar mi cuenta'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
