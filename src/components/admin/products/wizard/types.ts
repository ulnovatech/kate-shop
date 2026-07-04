export type ProductWizardImage = {
  id?: string;
  image_url: string;
  thumbnail_url?: string;
  medium_url?: string;
  full_url?: string;
  sort_order: number;
  alt_text: string;
  isNew?: boolean;
};

export type ExistingProductRecord = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  material?: string | null;
  category_id?: string | null;
  price: number;
  sku?: string | null;
  stock_quantity: number;
  available_stock?: number;
  reserved_stock?: number;
  low_stock_threshold?: number;
  is_visible: boolean;
  is_featured: boolean;
  meta_title?: string | null;
  meta_description?: string | null;
  product_images?: ProductWizardImage[];
};
