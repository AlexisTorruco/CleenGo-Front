// Interfaz del proveedor
export interface Provider {
  street?: string | null;
  exteriorNumber?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  about?: string | null;
  hours?: string[] | null;
  days?: string[] | null;
  [key: string]: string | string[] | null | undefined;
}

// Calcular completitud del perfil del proveedor
export const calculateProfileCompleteness = (provider: Provider): number => {
  if (!provider) return 0;

  const requiredFields = [
    'street',
    'exteriorNumber',
    'neighborhood',
    'city',
    'state',
    'postalCode',
    'about',
    'hours',
    'days',
  ];

  let completedFields = 0;

  requiredFields.forEach((field) => {
    const value = provider[field];
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value) && value.length > 0) {
        completedFields++;
      } else if (!Array.isArray(value)) {
        completedFields++;
      }
    }
  });

  return Math.round((completedFields / requiredFields.length) * 100);
};

// Verificar si el perfil está completo
export const isProfileComplete = (provider: Provider): boolean => {
  return calculateProfileCompleteness(provider) === 100;
};
