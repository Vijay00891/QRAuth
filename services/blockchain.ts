
import { ActivationRecord, Brand, Product } from '../types';
import { supabase } from './supabase';

class DatabaseService {
  /**
   * Ensure brand metadata is initialized in the system.
   */
  async ensureBrandExists(brand: Brand) {
    const { error } = await supabase
      .from('brands')
      .upsert({
        id: brand.id,
        name: brand.name,
        logo: brand.logo,
        description: brand.description,
        contact_email: brand.contactEmail
      });
    if (error) {
      console.error("Database Error (ensureBrandExists):", error);
      throw error;
    }
  }

  /**
   * Verify a product unit and record a scan event.
   */
  async verifyUnit(token: string, context: { productId: string, brandId: string, location?: {lat: number, lng: number} }): Promise<ActivationRecord> {
    const { data: existing, error: fetchError } = await supabase
      .from('activations')
      .select('*')
      .eq('unit_id', token)
      .single();

    if (existing) {
      const { data: updated, error: updateError } = await supabase
        .from('activations')
        .update({ scan_count: (existing.scan_count || 0) + 1 })
        .eq('unit_id', token)
        .select()
        .single();
        
      if (updateError) throw updateError;
      return this.mapToType(updated);
    }

    const { data: created, error: createError } = await supabase
      .from('activations')
      .insert({
        unit_id: token,
        product_id: context.productId,
        brand_id: context.brandId,
        status: 'GENUINE',
        activated_location: context.location,
        scan_count: 1
      })
      .select()
      .single();

    if (createError) throw createError;
    return this.mapToType(created);
  }

  /**
   * Retrieve all products registered for a specific brand.
   */
  async getProductsByBrand(brandId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('brand_id', brandId);
    if (error) throw error;
    
    return (data || []).map((p: any) => this.mapProduct(p));
  }

  /**
   * Retrieve a single product by its unique unit token (Global Lookup).
   */
  async getProductByToken(token: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('unit_token', token)
      .single();
    
    if (error || !data) return null;
    return this.mapProduct(data);
  }

  /**
   * Upsert a product record. Uses 'sku' as the conflict target.
   */
  async saveProduct(product: Product) {
    const payload = {
      id: product.id,
      brand_id: product.brandId,
      name: product.name,
      sku: product.sku,
      category: product.category,
      description: product.description,
      image_url: product.imageUrl,
      unit_token: product.unitToken,
      specs: product.specs
    };

    const { data, error } = await supabase
      .from('products')
      .upsert(payload, { onConflict: 'sku' });
      
    if (error) {
      console.error("Database Error (saveProduct):", error);
      if (error.message?.includes("unit_token") || error.code === 'PGRST204') {
        throw new Error("The 'unit_token' column is missing from your 'products' table. Add it via: ALTER TABLE products ADD COLUMN unit_token TEXT;");
      }
      throw error;
    }
    return data;
  }

  /**
   * Remove a product model from the registry.
   */
  async deleteProduct(productId: string, unitToken?: string) {
    await supabase.from('activations').delete().eq('product_id', productId);
    if (unitToken) {
      await supabase.from('activations').delete().eq('unit_id', unitToken);
    }
    const { error: productError } = await supabase.from('products').delete().eq('id', productId);
    if (productError) throw productError;
  }

  private mapProduct(p: any): Product {
    return {
      id: p.id,
      brandId: p.brand_id,
      name: p.name,
      sku: p.sku,
      category: p.category,
      description: p.description,
      imageUrl: p.image_url,
      unitToken: p.unit_token,
      specs: p.specs || {}
    };
  }

  private mapToType(dbRow: any): ActivationRecord {
    return {
      unitId: dbRow.unit_id,
      productId: dbRow.product_id,
      brandId: dbRow.brand_id,
      status: dbRow.status,
      activatedAt: dbRow.activated_at,
      activatedLocation: dbRow.activated_location,
      scanCount: dbRow.scan_count
    };
  }
}

export const blockchain = new DatabaseService();
