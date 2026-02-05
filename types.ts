
export type UserRole = 'SUPER_ADMIN' | 'BRAND_MANAGER' | 'CONSUMER';

export interface Brand {
  id: string;
  name: string;
  logo: string;
  description: string;
  contactEmail: string;
  totalProducts: number;
}

export interface Product {
  id: string;
  brandId: string;
  name: string;
  sku: string;
  category: string;
  description: string;
  imageUrl: string;
  unitToken: string; // Persistent QR identifier
  specs: Record<string, string>;
}

export interface ProductUnit {
  id: string; // The unique serial number/UUID
  productId: string;
  batchId: string;
  mfgDate: string;
  qrToken: string; // The cryptographically unique token
}

export interface ActivationRecord {
  unitId: string;
  productId: string;
  brandId: string;
  status: 'GENUINE' | 'DUPLICATE' | 'SUSPICIOUS';
  activatedAt?: string;
  activatedLocation?: {
    lat: number;
    lng: number;
    address?: string;
  };
  scanCount: number;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  managedBrandId?: string; // Only for BRAND_MANAGER
}

export enum AppView {
  LANDING = 'LANDING',
  LOGIN = 'LOGIN',
  SUPER_ADMIN_DASHBOARD = 'SUPER_ADMIN_DASHBOARD',
  BRAND_DASHBOARD = 'BRAND_DASHBOARD',
  CONSUMER_PORTAL = 'CONSUMER_PORTAL',
  VERIFICATION_RESULT = 'VERIFICATION_RESULT'
}
