
import { Brand, Product } from './types';

export const MOCK_BRANDS: Brand[] = [
  {
    id: 'BR-001',
    name: 'SonicStream',
    logo: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?q=80&w=100&h=100&auto=format&fit=crop',
    description: 'Premium audio equipment and wireless solutions.',
    contactEmail: 'support@sonicstream.com',
    totalProducts: 12
  },
  {
    id: 'BR-002',
    name: 'DermaPure',
    logo: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=100&h=100&auto=format&fit=crop',
    description: 'Clinical grade pharmaceutical skincare.',
    contactEmail: 'verify@dermapure.fr',
    totalProducts: 8
  },
  {
    id: 'BR-003',
    name: 'GreenLife',
    logo: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=100&h=100&auto=format&fit=crop',
    description: 'Sustainable personal care products.',
    contactEmail: 'eco@greenlife.org',
    totalProducts: 5
  }
];

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'P-101',
    brandId: 'BR-001',
    name: 'Pro-Audio X900 Earbuds',
    sku: 'SS-X900-BLK',
    category: 'Electronics',
    description: 'Active Noise Cancelling True Wireless Earbuds with spatial audio and 40-hour battery life.',
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=800&auto=format&fit=crop',
    unitToken: 'UNIT-P-101-MASTER-77',
    specs: { 'Driver': '12mm Dynamic', 'Battery': '40h Total', 'Waterproof': 'IPX7', 'Bluetooth': '5.3' }
  },
  {
    id: 'P-102',
    brandId: 'BR-001',
    name: 'Sonic Over-Ear Studio',
    sku: 'SS-STUDIO-H1',
    category: 'Electronics',
    description: 'Professional grade studio monitor headphones for high-fidelity audio production.',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop',
    unitToken: 'UNIT-P-102-MASTER-99',
    specs: { 'Frequency': '5Hz-40kHz', 'Impedance': '32 Ohm', 'Type': 'Closed-back' }
  },
  {
    id: 'P-201',
    brandId: 'BR-002',
    name: 'Vitamin C Serum 30ml',
    sku: 'DP-VC-30',
    category: 'Pharmaceuticals',
    description: '15% L-Ascorbic Acid skin rejuvenation serum with Ferulic acid for advanced antioxidant protection.',
    imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?q=80&w=800&auto=format&fit=crop',
    unitToken: 'UNIT-P-201-MASTER-SKIN',
    specs: { 'Concentration': '15%', 'pH Level': '3.2', 'Size': '30ml', 'Shelf Life': '24 Months' }
  },
  {
    id: 'P-202',
    brandId: 'BR-002',
    name: 'Hydrating Face Cream',
    sku: 'DP-HC-50',
    category: 'Pharmaceuticals',
    description: 'Deep hydration formula with multi-molecular hyaluronic acid for 24-hour moisture barrier.',
    imageUrl: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?q=80&w=800&auto=format&fit=crop',
    unitToken: 'UNIT-P-202-MASTER-GLOW',
    specs: { 'Main Active': 'Hyaluronic Acid', 'Size': '50ml', 'Fragrance': 'None' }
  },
  {
    id: 'P-301',
    brandId: 'BR-003',
    name: 'Bamboo Body Brush',
    sku: 'GL-BBB-01',
    category: 'Sustainability',
    description: 'Eco-friendly exfoliating body brush made from FSC-certified bamboo and natural agave bristles.',
    imageUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800&auto=format&fit=crop',
    unitToken: 'UNIT-P-301-MASTER-ECO',
    specs: { 'Material': 'Natural Bamboo', 'Bristles': 'Agave Fiber', 'Impact': '100% Biodegradable' }
  }
];
