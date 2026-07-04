export type AdminProductImage = {
  id?: string;
  image_url: string;
  thumbnail_url?: string | null;
  medium_url?: string | null;
  full_url?: string | null;
  sort_order: number;
  is_primary?: boolean;
  alt_text?: string | null;
};

export type AdminProduct = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  stock_quantity: number;
  available_stock: number;
  low_stock_threshold: number;
  is_visible: boolean;
  is_featured: boolean;
  archived_at: string | null;
  categories: { name: string } | null;
  product_images: AdminProductImage[];
};

export type ProductRecycleTarget = Pick<AdminProduct, "id" | "name">;
