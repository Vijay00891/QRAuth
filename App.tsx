
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppView, Product, ActivationRecord, User, UserRole, Brand } from './types';
import { MOCK_PRODUCTS, MOCK_BRANDS } from './constants';
import { blockchain } from './services/blockchain';
import QRGenerator from './components/QRGenerator';
import Scanner from './components/ScannerSimulator';
import { 
  ShieldCheck, LogOut, Lock, Mail, Camera, 
  Plus, Globe, Briefcase, Activity, Package, Trash2, ArrowLeft, RefreshCw, CheckCircle2,
  Info, Calendar, Tag, MapPin, Zap, AlertCircle, X, UserPlus, User as UserIcon, Upload, ImageIcon
} from 'lucide-react';

export default function App() {
  const [view, setView] = useState<AppView>(AppView.LANDING);
  const [user, setUser] = useState<User | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [activeResult, setActiveResult] = useState<{product: Product, record: ActivationRecord, brand: Brand} | null>(null);
  const [location, setLocation] = useState<{lat: number, lng: number} | undefined>();
  
  // Auth State
  const [isSignUp, setIsSignUp] = useState(false);
  const [authForm, setAuthForm] = useState({ 
    email: '', 
    password: '', 
    name: '',
    role: 'CONSUMER' as UserRole 
  });
  
  const [products, setProducts] = useState<Product[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({ name: '', sku: '', category: '', description: '' });
  const [productImage, setProductImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showInvalidPopup, setShowInvalidPopup] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadBrandData = useCallback(async () => {
    if (selectedBrand) {
      setLoading(true);
      try {
        const dbProducts = await blockchain.getProductsByBrand(selectedBrand.id);
        const combined = [...dbProducts];
        
        MOCK_PRODUCTS.filter(mp => mp.brandId === selectedBrand.id).forEach(mp => {
          if (!combined.find(p => p.sku === mp.sku)) {
            combined.push(mp);
          }
        });
        
        setProducts(combined);
      } catch (e) {
        console.error("Error loading brand data:", e);
        setProducts(MOCK_PRODUCTS.filter(mp => mp.brandId === selectedBrand.id));
      } finally {
        setLoading(false);
      }
    } else {
      setProducts(MOCK_PRODUCTS); 
    }
  }, [selectedBrand]);

  useEffect(() => {
    loadBrandData();
  }, [loadBrandData]);

  useEffect(() => {
    const saved = localStorage.getItem('auth_user_v2');
    if (saved) {
      const u = JSON.parse(saved);
      setUser(u);
      if (u.role === 'SUPER_ADMIN') setView(AppView.SUPER_ADMIN_DASHBOARD);
      else if (u.role === 'BRAND_MANAGER') {
        const brand = MOCK_BRANDS.find(b => b.id === u.managedBrandId);
        setSelectedBrand(brand || null);
        setView(AppView.BRAND_DASHBOARD);
      } else {
        setView(AppView.CONSUMER_PORTAL);
      }
    }
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        p => setLocation({lat: p.coords.latitude, lng: p.coords.longitude}),
        e => console.warn("Geolocation not available", e)
      );
    }
  }, []);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      let loggedUser: User;
      
      if (isSignUp) {
        loggedUser = { 
          id: 'c-' + Date.now(), 
          email: authForm.email, 
          name: authForm.name || authForm.email.split('@')[0], 
          role: 'CONSUMER' 
        };
      } else {
        if (authForm.role === 'SUPER_ADMIN' && authForm.password === 'password') {
          loggedUser = { id: 'sa-1', email: authForm.email, name: 'System Admin', role: 'SUPER_ADMIN' };
        } else if (authForm.role === 'BRAND_MANAGER' && authForm.password === 'password') {
          const brand = MOCK_BRANDS.find(b => authForm.email.toLowerCase().includes(b.name.toLowerCase().replace(/\s+/g, ''))) || MOCK_BRANDS[0];
          loggedUser = { id: 'bm-' + brand.id, email: authForm.email, name: brand.name + ' Admin', role: 'BRAND_MANAGER', managedBrandId: brand.id };
          setSelectedBrand(brand);
        } else if (authForm.role === 'CONSUMER') {
          loggedUser = { id: 'c-' + Date.now(), email: authForm.email, name: authForm.email.split('@')[0], role: 'CONSUMER' };
        } else {
          alert("Invalid credentials. Hint: use 'password' for admin roles.");
          setLoading(false);
          return;
        }
      }

      setUser(loggedUser);
      localStorage.setItem('auth_user_v2', JSON.stringify(loggedUser));
      setLoading(false);
      
      if (loggedUser.role === 'SUPER_ADMIN') setView(AppView.SUPER_ADMIN_DASHBOARD);
      else if (loggedUser.role === 'BRAND_MANAGER') setView(AppView.BRAND_DASHBOARD);
      else setView(AppView.CONSUMER_PORTAL);
    }, 800);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB Limit for base64
        alert("Image is too large. Please select an image under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBrand) return;
    setLoading(true);
    
    try {
      await blockchain.ensureBrandExists(selectedBrand);
      
      const existing = products.find(p => p.sku === newProduct.sku);
      
      const productId = existing?.id || `PID-${newProduct.sku.toUpperCase().replace(/[^A-Z0-9]/g, '-')}`;
      const unitToken = existing?.unitToken || `UNIT-${productId}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      const product: Product = {
        id: productId,
        brandId: selectedBrand.id,
        name: newProduct.name,
        sku: newProduct.sku,
        category: newProduct.category,
        description: newProduct.description,
        unitToken: unitToken,
        imageUrl: productImage || `https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop`,
        specs: { 'Origin': 'Authentic Factory', 'Warranty': '1 Year International', 'Material': 'Premium Grade' }
      };
      
      await blockchain.saveProduct(product);
      
      setProducts(prev => {
        const index = prev.findIndex(p => p.sku === product.sku);
        if (index !== -1) {
          const updated = [...prev];
          updated[index] = product;
          return updated;
        }
        return [...prev, product];
      });
      
      setNewProduct({ name: '', sku: '', category: '', description: '' });
      setProductImage(null);
      setShowAddProduct(false);
    } catch (err: any) {
      console.error("Product Registration Error:", err);
      alert(err.message || 'Could not register product.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm('Warning: This action is permanent. Proceed?')) return;
    
    setLoading(true);
    try {
      await blockchain.deleteProduct(product.id, product.unitToken);
      setProducts(prev => prev.filter(p => p.id !== product.id));
    } catch (err: any) {
      console.error("Deletion error:", err);
      alert('Error deleting product.');
    } finally {
      setLoading(false);
    }
  };

  const processVerification = useCallback(async (token: string) => {
    setLoading(true);
    
    let match = [...products, ...MOCK_PRODUCTS].find(p => p.unitToken === token);
    
    if (!match && token.startsWith('UNIT-')) {
      try {
        match = await blockchain.getProductByToken(token);
      } catch (err) {
        console.error("Database Token Lookup Error:", err);
      }
    }
    
    if (!match) {
      setShowInvalidPopup(true);
      setLoading(false);
      return;
    }

    try {
      const brand = MOCK_BRANDS.find(b => b.id === match.brandId) || { ...MOCK_BRANDS[0], id: match.brandId, name: 'Registry Partner' };
      await blockchain.ensureBrandExists(brand);
      
      const record = await blockchain.verifyUnit(token, { 
        productId: match.id, 
        brandId: brand.id, 
        location 
      });
      
      setActiveResult({ product: match, record, brand });
      setView(AppView.VERIFICATION_RESULT);
    } catch (e: any) {
      console.error("Verification System Error:", e);
      setShowInvalidPopup(true);
    } finally {
      setLoading(false);
    }
  }, [location, products]);

  const Nav = () => (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView(AppView.LANDING)}>
          <div className="bg-blue-600 p-1.5 rounded-xl text-white shadow-lg">
            <ShieldCheck size={20} />
          </div>
          <span className="text-xl font-black tracking-tighter text-slate-800">Authentix</span>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <div className="text-xs font-black text-slate-900 leading-none">{user.name}</div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.role.replace('_', ' ')}</div>
              </div>
              <button onClick={() => { localStorage.removeItem('auth_user_v2'); setUser(null); setView(AppView.LANDING); }} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
                <LogOut size={20} />
              </button>
            </div>
          ) : (
            <button onClick={() => setView(AppView.LOGIN)} className="bg-slate-900 text-white text-sm px-6 py-2 rounded-full font-bold hover:bg-slate-800 transition-colors">Sign In</button>
          )}
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Nav />
      
      {loading && (
        <div className="fixed inset-0 z-[200] bg-white/60 backdrop-blur-sm flex items-center justify-center">
           <div className="flex flex-col items-center gap-4">
              <RefreshCw className="animate-spin text-blue-600" size={48} />
              <p className="font-black text-slate-900">Accessing Secure Ledger...</p>
           </div>
        </div>
      )}

      {showInvalidPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] p-8 max-sm:w-full max-w-sm shadow-2xl text-center border-4 border-rose-100">
            <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Verification Failed</h3>
            <p className="text-slate-500 mb-8">This QR code is not recognized by the Authentix secure registry.</p>
            <button onClick={() => setShowInvalidPopup(false)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-lg">Try Again</button>
          </div>
        </div>
      )}

      <main className="flex-1">
        {view === AppView.LANDING && (
          <div className="max-w-4xl mx-auto px-4 py-24 text-center">
            <h1 className="text-7xl font-black text-slate-900 mb-6 tracking-tighter leading-none">
              Your Product's <br/><span className="text-blue-600">Digital Identity.</span>
            </h1>
            <p className="text-xl text-slate-500 mb-12">Combat counterfeiting with blockchain-backed origin verification.</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setView(AppView.CONSUMER_PORTAL)} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl shadow-blue-100 hover:scale-105 transition-transform">
                <Camera size={24} /> Start Scanning
              </button>
              {!user && (
                <button onClick={() => { setIsSignUp(true); setView(AppView.LOGIN); }} className="bg-white border-2 border-slate-200 px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:bg-slate-100 transition-colors">
                  <UserPlus size={24} /> Create Account
                </button>
              )}
            </div>
          </div>
        )}

        {view === AppView.LOGIN && (
          <div className="flex items-center justify-center py-20 px-4">
            <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-10 border border-slate-200 animate-in fade-in zoom-in-95 duration-300">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-black text-slate-900">{isSignUp ? 'Join Authentix' : 'Portal Access'}</h2>
                <p className="text-slate-500 mt-2">{isSignUp ? 'Create an account to start verifying products.' : 'Securely access your brand management dashboard.'}</p>
              </div>

              <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
                <button onClick={() => setIsSignUp(false)} className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${!isSignUp ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>Sign In</button>
                <button onClick={() => { setIsSignUp(true); setAuthForm({...authForm, role: 'CONSUMER'}); }} className={`flex-1 py-3 text-sm font-black rounded-xl transition-all ${isSignUp ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>Sign Up</button>
              </div>

              <form onSubmit={handleAuth} className="space-y-4">
                {!isSignUp && (
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {(['CONSUMER', 'BRAND_MANAGER', 'SUPER_ADMIN'] as UserRole[]).map(r => (
                      <button 
                        key={r} 
                        type="button" 
                        onClick={() => setAuthForm({...authForm, role: r})} 
                        className={`py-2 text-[10px] font-black rounded-lg border-2 transition-all ${authForm.role === r ? 'bg-blue-50 border-blue-600 text-blue-600' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                      >
                        {r.split('_')[0]}
                      </button>
                    ))}
                  </div>
                )}

                {isSignUp && (
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600" size={18} />
                    <input type="text" required placeholder="Full Name" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all" value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} />
                  </div>
                )}

                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600" size={18} />
                  <input type="email" required placeholder="Email Address" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} />
                </div>

                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600" size={18} />
                  <input type="password" required placeholder="Password" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition-all" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} />
                </div>

                <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black shadow-xl shadow-blue-100 hover:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 mt-4">
                  {isSignUp ? 'Create Consumer Account' : `Login as ${authForm.role.split('_')[0]}`}
                </button>
              </form>
            </div>
          </div>
        )}

        {view === AppView.CONSUMER_PORTAL && (
          <div className="max-w-xl mx-auto px-4 py-16">
            <div className="space-y-8 text-center">
              <div className="flex items-center justify-center gap-4 mb-4">
                <button onClick={() => setView(AppView.LANDING)} className="p-2 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-slate-900 shadow-sm transition-colors"><X size={20}/></button>
                <h2 className="text-4xl font-black tracking-tight">Scanner</h2>
              </div>
              <Scanner onScan={processVerification} onClose={() => setView(AppView.LANDING)} />
            </div>
          </div>
        )}

        {view === AppView.VERIFICATION_RESULT && activeResult && (
          <div className="max-w-3xl mx-auto px-4 py-16 animate-in fade-in slide-in-from-bottom-8">
            <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-200 overflow-hidden">
              <div className="bg-emerald-500 p-10 text-white flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">Status: Genuine</div>
                  <h2 className="text-4xl font-black flex items-center gap-3">Product Verified <CheckCircle2 size={32}/></h2>
                </div>
                <div className="bg-white/20 p-4 rounded-2xl">
                  <ShieldCheck size={40}/>
                </div>
              </div>
              
              <div className="p-10 space-y-10">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="w-full md:w-64 aspect-square rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white">
                    <img src={activeResult.product.imageUrl} alt={activeResult.product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-2">
                      <img src={activeResult.brand.logo} alt={activeResult.brand.name} className="w-8 h-8 rounded-full shadow-sm" />
                      <span className="text-sm font-black text-blue-600 uppercase tracking-widest">{activeResult.brand.name}</span>
                    </div>
                    <h3 className="text-4xl font-black text-slate-900 leading-tight">{activeResult.product.name}</h3>
                    <p className="text-slate-500 leading-relaxed text-lg">{activeResult.product.description}</p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <span className="bg-blue-50 px-3 py-1 rounded-full text-xs font-bold text-blue-600 border border-blue-100">SKU: {activeResult.product.sku}</span>
                      <span className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-600">{activeResult.product.category}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-center">
                <button onClick={() => setView(AppView.LANDING)} className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black shadow-xl hover:scale-105 transition-all">Finish Verification</button>
              </div>
            </div>
          </div>
        )}

        {view === AppView.BRAND_DASHBOARD && selectedBrand && (
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-white rounded-2xl shadow-sm border border-slate-200">
                  <img src={selectedBrand.logo} alt={selectedBrand.name} className="w-16 h-16 rounded-xl" />
                </div>
                <div>
                  <h2 className="text-4xl font-black text-slate-900 tracking-tight">{selectedBrand.name}</h2>
                  <p className="text-slate-500 font-medium">Digital Registry Management</p>
                </div>
              </div>
              <button onClick={() => { setShowAddProduct(true); setProductImage(null); }} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-blue-700 transition-all"><Plus size={20}/> New Product</button>
            </div>

            {showAddProduct && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-6 animate-in fade-in duration-200 overflow-y-auto">
                <form onSubmit={handleAddProduct} className="bg-white w-full max-w-2xl rounded-[3rem] p-8 md:p-10 shadow-2xl animate-in zoom-in-95 my-8">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-3xl font-black">Register Product</h3>
                    <button type="button" onClick={() => setShowAddProduct(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={24}/></button>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <div className="relative group">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Display Name</label>
                        <input required placeholder="e.g. Premium Wireless Buds" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-colors" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                      </div>
                      <div className="relative group">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">SKU / Model Number</label>
                        <input required placeholder="e.g. PW-200-BLU" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-colors" value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} />
                      </div>
                      <div className="relative group">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Category</label>
                        <input required placeholder="e.g. Electronics" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-colors" value={newProduct.category} onChange={e => setNewProduct({...newProduct, category: e.target.value})} />
                      </div>
                      <div className="relative group">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Brief Description</label>
                        <textarea placeholder="Tell customers about the product..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 transition-colors min-h-[120px]" value={newProduct.description} onChange={e => setNewProduct({...newProduct, description: e.target.value})} />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Product Visual</label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative w-full aspect-square border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all ${productImage ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-400 bg-slate-50'}`}
                      >
                        {productImage ? (
                          <>
                            <img src={productImage} alt="Preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white text-xs font-black uppercase tracking-widest">Change Image</span>
                            </div>
                          </>
                        ) : (
                          <div className="text-center p-6">
                            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                              <Upload size={24} className="text-slate-400" />
                            </div>
                            <p className="text-sm font-bold text-slate-600">Click to upload photo</p>
                            <p className="text-[10px] text-slate-400 mt-1">PNG, JPG up to 2MB</p>
                          </div>
                        )}
                      </div>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                      {productImage && (
                        <button type="button" onClick={() => setProductImage(null)} className="w-full py-2 text-rose-500 text-[10px] font-black uppercase tracking-widest hover:bg-rose-50 rounded-lg transition-colors">
                          Remove Image
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-4 mt-10">
                    <button type="button" onClick={() => setShowAddProduct(false)} className="flex-1 py-5 font-bold text-slate-400 hover:text-slate-600 transition-colors">Cancel</button>
                    <button type="submit" disabled={loading} className="flex-[2] py-5 bg-blue-600 text-white rounded-[1.5rem] font-black shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                      {loading ? 'Registering...' : (
                        <>
                          <CheckCircle2 size={20} />
                          Secure Product Registry
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map(p => (
                <div key={p.id} className="bg-white rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-2xl transition-all group overflow-hidden flex flex-col relative">
                  <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <button onClick={() => handleDeleteProduct(p)} className="p-3 text-slate-400 hover:text-rose-500 transition-colors bg-white/90 backdrop-blur-md rounded-full shadow-sm">
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  <div className="aspect-[4/3] relative overflow-hidden bg-slate-100">
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute bottom-4 left-6 text-white opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">{p.category}</div>
                      <h4 className="text-xl font-black leading-tight">{p.name}</h4>
                    </div>
                  </div>

                  <div className="p-8 space-y-6 flex-1 flex flex-col">
                    <div>
                       <div className="flex items-center justify-between mb-4">
                        <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black font-mono">
                          {p.sku}
                        </div>
                       </div>
                       <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed">{p.description}</p>
                    </div>

                    <div className="pt-6 border-t border-slate-100 flex flex-col items-center bg-slate-50/50 rounded-[2rem] p-6 mt-auto">
                      <QRGenerator value={p.unitToken} size={160} label={`${p.sku}-QR`} showDownload={true} />
                      <div className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Master Identity Token</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
