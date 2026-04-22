export type ProductListItem = {
  id: string;
  name: string;
  sku: string | null;
  stock: number;
  price: number;
  source: "demo" | "supabase";
};

export type CreateProductInput = {
  name: string;
  sku?: string;
  stock: number;
  price: number;
  description?: string;
};
