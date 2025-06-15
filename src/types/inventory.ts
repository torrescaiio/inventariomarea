export interface MaterialItem {
  id: string;
  name: string;
  currentQuantity: number;
  reorderPoint: number;
  image?: string;
  category: string;
  setor: string;
}

export interface BeverageItem {
  id: string;
  name: string;
  currentQuantity: number;
  reorderPoint: number;
  image?: string;
}
