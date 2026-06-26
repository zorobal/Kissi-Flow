/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Tenant {
  id: string;
  name: string;
  address: string;
  phone: string;
  logoUrl?: string;
  city: string;
  country: string;
  active?: boolean; // Can be suspended or active
  createdAt?: string;
  raisonSociale?: string;
  rccm?: string;
  niu?: string;
  regimeFiscal?: string;
  parentId?: string; // Parent client/restaurant group ID for multi-site isolation
  slogan?: string;
}

export interface UserPermission {
  read: boolean;
  write: boolean;
  edit: boolean;
  delete: boolean;
  export: boolean;
  import: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'CASHIER' | 'WAREHOUSE' | 'ACCOUNTING' | 'SUPERADMIN';
  tenantId: string;
  active: boolean;
  allowedModules?: string[];
  password?: string;
  mustChangePassword?: boolean; // first-time login flag to force password change
  passwordChanged?: boolean; // tracks if user has changed their password
  permissions?: Record<string, UserPermission>; // granular module-by-module permission matrix
}

export interface DishCategory {
  id: string;
  code: string;
  name: string;
  description: string;
  active: boolean;
  tenantId: string;
}

export interface Dish {
  id: string;
  code: string;
  name: string;
  description: string;
  categoryId: string;
  image: string;
  price: number;
  tvaApplicable: boolean;
  theoreticalCost: number; // calculated from recipe (BOM)
  margin: number;
  marginPercent: number;
  prepTime: number; // in mins
  availablePOS: boolean;
  availableDelivery: boolean;
  availableTakeaway: boolean;
  active: boolean;
  tenantId: string;
  userCostPrice?: number; // Coût de revient resto
  userMargin?: number; // Marge resto (FCFA)
  userMarginPercent?: number; // Marge % resto
}

export interface IngredientCategory {
  id: string;
  name: string;
  tenantId: string;
}

export interface Ingredient {
  id: string;
  code: string;
  name: string;
  description: string;
  categoryId: string;
  unit: string; // kg, g, L, mL, Unité, Boîte, Sachet, Carton, Bouteille
  stockActual: number;
  stockMin: number;
  stockMax: number;
  supplierId?: string;
  cmp: number; // Coût Moyen Pondéré
  lastPurchasePrice: number;
  active: boolean;
  tenantId: string;
}

export interface Recipe {
  id: string;
  dishId: string;
  version: number;
  active: boolean;
  tenantId: string;
  lines: RecipeLine[];
}

export interface RecipeLine {
  ingredientId: string;
  quantity: number; // e.g., 0.5 kg for Poulet
  isSecondary?: boolean; // true = Secondary, false/undefined = Principal
}

export interface OrderLine {
  id: string;
  dishId: string;
  dishName: string;
  quantity: number;
  price: number;
  discount: number; // relative discount or amount
  total: number;
  notes?: string;
}

export interface Order {
  id: string;
  number: string; // CMD-YYYYMM-XXXX
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  canal: 'SUR_PLACE' | 'A_EMPORTER' | 'LIVRAISON';
  covers: number;
  status: 'DRAFT' | 'VALIDATED' | 'CANCELLED' | 'CLOSED';
  paymentMethod: string;
  userId: string;
  userName: string;
  subtotal: number;
  discount: number;
  total: number;
  costTotal: number;
  margin: number;
  notes?: string;
  tenantId: string;
  lines: OrderLine[];
  cancelMotif?: string;
}

export interface StockMovement {
  id: string;
  date: string; // YYYY-MM-DD HH:MM
  ingredientId: string;
  ingredientName: string;
  type: 'IN' | 'OUT' | 'ADJUST_PLUS' | 'ADJUST_MINUS' | 'INVENTORY' | 'SALE' | 'CANCEL';
  quantity: number;
  unitCost: number;
  value: number;
  reference: string;
  userId: string;
  userName: string;
  comment: string;
  tenantId: string;
}

export interface PhysicalInventory {
  id: string;
  date: string;
  status: 'DRAFT' | 'VALIDATED' | 'CANCELLED';
  userId: string;
  userName: string;
  tenantId: string;
  lines: PhysicalInventoryLine[];
}

export interface PhysicalInventoryLine {
  ingredientId: string;
  ingredientName: string;
  theoreticalQty: number;
  realQty: number;
  gap: number;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  raisonSociale: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  contactName: string;
  deliveryDays: number;
  paymentTerms: string;
  active: boolean;
  tenantId: string;
}

export interface PurchaseLine {
  id: string;
  ingredientId: string;
  ingredientName: string;
  quantity: number;
  quantityReceived: number;
  unit: string;
  lastPrice: number;
  total: number;
}

export interface PurchaseOrder {
  id: string;
  number: string; // BC-YYYYMM-XXXX
  date: string;
  supplierId: string;
  supplierName: string;
  status: 'DRAFT' | 'SENT' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';
  lines: PurchaseLine[];
  tenantId: string;
}

export interface PurchaseRequest {
  id: string;
  number: string; // DA-YYYYMM-XXXX
  date: string;
  requesterName: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CONVERTED';
  lines: {
    ingredientId: string;
    ingredientName: string;
    quantity: number;
    unit: string;
  }[];
  tenantId: string;
}

export interface CashRegisterMovement {
  id: string;
  date: string; // YYYY-MM-DD HH:MM
  type: 'IN' | 'OUT' | 'TRANSFER' | 'CORRECTION';
  canal?: 'SUR_PLACE' | 'A_EMPORTER' | 'LIVRAISON';
  amount: number;
  reference: string;
  comment: string;
  paymentMethod: string;
  userId: string;
  userName: string;
  tenantId: string;
}

export interface DailyClosure {
  id: string;
  date: string;
  validated: boolean;
  validatedBy: string;
  time: string;
  revenue: number;
  expenses: number;
  netProfit: number;
  ordersCount: number;
  ticketAverage: number;
  marginAmount: number;
  cashRevenue: number;
  omRevenue: number;
  momoRevenue: number;
  tenantId: string;
}

export interface AuditLog {
  id: string;
  timestamp: string; // ISO String
  userId: string;
  userName: string;
  action: string;
  module: string;
  oldValue?: string;
  newValue?: string;
  tenantId: string;
}

export interface ChargeType {
  id: string;
  name: string;
  tenantId: string;
}

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  category: string; // Type de charge (Loyer, Salaires, etc.)
  type: 'FIXE' | 'VARIABLE';
  description: string;
  amountHt: number;
  tvaPercent: number;
  amountTtc: number;
  reference: string; // Réf. document
  tenantId: string;
}

export interface StockBatch {
  id: string;
  ingredientId: string;
  ingredientName: string;
  batchNum: string;
  dateReceived: string; // YYYY-MM-DD
  quantity: number;
  unit: string;
  expiryDate: string; // YYYY-MM-DD
  tenantId: string;
  lossDeclared?: boolean; // Indique si la perte a été déclarée / constatée
  lossQty?: number; // Quantité déclarée en perte
  lossCmpUsed?: number; // CMP ou prix unitaire utilisé pour la valorisation de la perte
  lossAmount?: number; // Montant financier de la perte = lossQty * lossCmpUsed
  lossValidated?: boolean; // Validé par l'Admin ou Manager
  lossValidatedBy?: string; // Nom de l'utilisateur qui a validé la perte
  lossValidatedDate?: string; // Date de validation
  lossComment?: string; // Commentaire explicatif de la perte
}

export interface NonFoodItem {
  id: string;
  code: string;
  name: string;
  category: 'EMBALLAGE' | 'HYGIENE' | 'FOURNITURE' | 'MAINTENANCE' | 'AUTRE';
  description: string;
  stockActual: number;
  stockMin: number;
  stockMax: number;
  unit: string; // Unité, Boîte, Carton, Rouleau, Litre, etc.
  cmp: number; // Coût Moyen Pondéré
  lastPurchasePrice: number;
  supplierId?: string;
  active: boolean;
  tenantId: string;
}

export interface NonFoodMovement {
  id: string;
  date: string; // YYYY-MM-DD HH:MM
  itemId: string;
  itemName: string;
  type: 'IN' | 'OUT' | 'ADJUST_PLUS' | 'ADJUST_MINUS' | 'INVENTORY';
  quantity: number;
  unitCost: number;
  value: number;
  reference: string; // Consommation Service, Achat, Ajustement, etc.
  userId: string;
  userName: string;
  comment: string;
  tenantId: string;
}

export type MealType = 'PETIT_DEJEUNER' | 'DEJEUNER' | 'DINER' | 'SUGGESTION' | 'PLAT_DU_JOUR' | 'DESSERT_DU_JOUR' | 'BOISSON_DU_JOUR';

export interface MenuDuJour {
  id: string;
  dateMenu: string; // YYYY-MM-DD
  title: string;
  description: string;
  image?: string;
  active: boolean;
  createdBy: string;
  createdAt: string;
  tenantId: string;
  accompaniments?: string;
}

export interface DetailMenuJour {
  id: string;
  menuJourId: string;
  platId: string; // Ref to Dish.id
  typeRepas: MealType;
  specialPrice?: number;
  displayOrder: number;
  availability: 'DISPONIBLE' | 'EPUISE' | 'SUSPENDU';
}

export interface FormuleDuJour {
  id: string;
  menuJourId: string;
  name: string;
  price: number;
  description?: string;
}



