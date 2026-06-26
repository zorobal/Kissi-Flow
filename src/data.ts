/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Tenant,
  User,
  DishCategory,
  Dish,
  Ingredient,
  Recipe,
  Order,
  StockMovement,
  Supplier,
  PurchaseOrder,
  PurchaseRequest,
  CashRegisterMovement,
  DailyClosure,
  AuditLog
} from './types';

// Initial Tenants (Multi-tenant)
export const initialTenants: Tenant[] = [
  {
    id: 'tenant-douala',
    name: 'Kissine Douala Elite',
    address: 'Boulevard de la Liberté, Akwa',
    phone: '+237 677 88 99 00',
    logoUrl: '',
    city: 'Douala',
    country: 'Cameroun'
  },
  {
    id: 'tenant-yaounde',
    name: 'Yaoundé Express Snack d\'Or',
    address: 'Avenue Kennedy, Centre-Ville',
    phone: '+237 699 11 22 33',
    logoUrl: '',
    city: 'Yaoundé',
    country: 'Cameroun'
  }
];

// Initial Users simulating role-based permissions (RBAC)
export const initialUsers: User[] = [
  {
    id: 'user-admin',
    name: 'Alain Patrick',
    email: 'admin@kissineflow.com',
    role: 'ADMIN',
    tenantId: 'tenant-douala',
    active: true,
    password: 'admin2026'
  },
  {
    id: 'user-manager',
    name: 'Kengne Sylvain',
    email: 'manager@kissineflow.com',
    role: 'MANAGER',
    tenantId: 'tenant-douala',
    active: true,
    password: 'manager2026'
  },
  {
    id: 'user-cashier',
    name: 'Marie Caissière',
    email: 'marie@kissineflow.com',
    role: 'CASHIER',
    tenantId: 'tenant-douala',
    active: true,
    password: 'cashier2026'
  },
  {
    id: 'user-warehouse',
    name: 'Jean Magasinier',
    email: 'jean@kissineflow.com',
    role: 'WAREHOUSE',
    tenantId: 'tenant-douala',
    active: true,
    password: 'warehouse2026'
  },
  {
    id: 'user-accounting',
    name: 'Paul Comptable',
    email: 'paul@kissineflow.com',
    role: 'ACCOUNTING',
    tenantId: 'tenant-douala',
    active: true,
    password: 'accounting2026'
  }
];

// Categories of Dishes at the Restaurant
export const initialDishCategories: DishCategory[] = [
  { id: 'cat-ent', code: 'ENT', name: 'Entrées', description: 'Amuse-bouches et salades rafraîchissantes', active: true, tenantId: 'all' },
  { id: 'cat-res', code: 'RES', name: 'Résistances', description: 'Plats principaux lourds et spécialités locales', active: true, tenantId: 'all' },
  { id: 'cat-des', code: 'DES', name: 'Desserts', description: 'Douceurs, fruits frais de saison et crèmes', active: true, tenantId: 'all' },
  { id: 'cat-boi', code: 'BOI', name: 'Boissons', description: 'Sodas, bières locales, eaux minérales', active: true, tenantId: 'all' },
  { id: 'cat-cok', code: 'COK', name: 'Cocktails', description: 'Cocktails maison avec ou sans alcool', active: true, tenantId: 'all' }
];

export const initialSuppliers: Supplier[] = [
  {
    id: 'sup-mboa',
    code: 'SUP-MBOA',
    name: 'ETS MBOA DISTRIBUTION',
    raisonSociale: 'Mboa Distribution Sarl',
    phone: '+237 677 00 01 02',
    email: 'contact@mboadistribution.cm',
    address: 'Marché Central, Hall 2',
    city: 'Douala',
    country: 'Cameroun',
    contactName: 'M. Mboa Guy',
    deliveryDays: 2,
    paymentTerms: 'Comptant à la livraison',
    active: true,
    tenantId: 'tenant-douala'
  },
  {
    id: 'sup-kribi',
    code: 'SUP-KRIBI',
    name: 'SOCIETE DES MAREYEURS DE KRIBI',
    raisonSociale: 'Kribi Fish Group',
    phone: '+237 699 44 55 66',
    email: 'sales@kribifish.cm',
    address: 'Débarcadère de Mboa-Manga',
    city: 'Kribi',
    country: 'Cameroun',
    contactName: 'Mme. Ekotto Thérèse',
    deliveryDays: 1,
    paymentTerms: 'Paiement sous 15 jours',
    active: true,
    tenantId: 'tenant-douala'
  },
  {
    id: 'sup-agri',
    code: 'SUP-AGRI',
    name: 'COOPÉRATIVE MARAÎCHÈRE DU NOUN',
    raisonSociale: 'Noun Agro Coop',
    phone: '+237 655 33 22 11',
    email: 'nouncoop@nounagro.org',
    address: 'Quartier Administratif',
    city: 'Foumban',
    country: 'Cameroun',
    contactName: 'M. Njoya Ibrahim',
    deliveryDays: 3,
    paymentTerms: 'Comptant à la commande',
    active: true,
    tenantId: 'tenant-douala'
  }
];

export const initialIngredients: Ingredient[] = [
  { id: 'ing-pou', code: 'ING-POU', name: 'Poulet Entier', description: 'Poulet local pacifié nettoyé', categoryId: 'cat-ing-viandes', unit: 'kg', stockActual: 32.5, stockMin: 10, stockMax: 100, supplierId: 'sup-mboa', cmp: 2200, lastPurchasePrice: 2200, active: true, tenantId: 'tenant-douala' },
  { id: 'ing-pla', code: 'ING-PLA', name: 'Plantain Mûr', description: 'Régime de plantains du Noun', categoryId: 'cat-ing-legumes', unit: 'kg', stockActual: 45.0, stockMin: 15, stockMax: 150, supplierId: 'sup-agri', cmp: 800, lastPurchasePrice: 800, active: true, tenantId: 'tenant-douala' },
  { id: 'ing-boe', code: 'ING-BOE', name: 'Filet de Boeuf', description: 'Filet de boeuf tendre désossé', categoryId: 'cat-ing-viandes', unit: 'kg', stockActual: 24.0, stockMin: 8, stockMax: 80, supplierId: 'sup-mboa', cmp: 2500, lastPurchasePrice: 2500, active: true, tenantId: 'tenant-douala' },
  { id: 'ing-tom', code: 'ING-TOM', name: 'Tomate de Foumbot', description: 'Tomates fraîches fermes de saison', categoryId: 'cat-ing-legumes', unit: 'kg', stockActual: 18.5, stockMin: 8, stockMax: 50, supplierId: 'sup-agri', cmp: 600, lastPurchasePrice: 600, active: true, tenantId: 'tenant-douala' },
  { id: 'ing-oig', code: 'ING-OIG', name: 'Oignons Violacés', description: 'Oignons de Garoua de gros calibre', categoryId: 'cat-ing-legumes', unit: 'kg', stockActual: 12.0, stockMin: 5, stockMax: 30, supplierId: 'sup-agri', cmp: 500, lastPurchasePrice: 500, active: true, tenantId: 'tenant-douala' },
  { id: 'ing-hui', code: 'ING-HUI', name: 'Huile de Palme Raffinée', description: 'Huile Mayor ou Diamaor', categoryId: 'cat-ing-epicerie', unit: 'L', stockActual: 28.0, stockMin: 10, stockMax: 100, supplierId: 'sup-mboa', cmp: 1200, lastPurchasePrice: 1200, active: true, tenantId: 'tenant-douala' },
  { id: 'ing-maq', code: 'ING-MAQ', name: 'Maquereau de Kribi', description: 'Maquereau frais de mer', categoryId: 'cat-ing-poissons', unit: 'Unité', stockActual: 42.0, stockMin: 10, stockMax: 80, supplierId: 'sup-kribi', cmp: 1500, lastPurchasePrice: 1500, active: true, tenantId: 'tenant-douala' },
  { id: 'ing-coc', code: 'ING-COC', name: 'Coca Cola 33cl', description: 'Cannettes Coca Cola originales', categoryId: 'cat-ing-boissons', unit: 'Unité', stockActual: 67.0, stockMin: 15, stockMax: 200, supplierId: 'sup-mboa', cmp: 500, lastPurchasePrice: 500, active: true, tenantId: 'tenant-douala' },
  { id: 'ing-kok', code: 'ING-KOK', name: 'Graine de Koki', description: 'Spécialité haricot blanc broyé', categoryId: 'cat-ing-epicerie', unit: 'kg', stockActual: 9.0, stockMin: 3, stockMax: 20, supplierId: 'sup-mboa', cmp: 1000, lastPurchasePrice: 1000, active: true, tenantId: 'tenant-douala' }
];

export const initialDishes: Dish[] = [
  {
    id: 'dish-poulet-dg',
    code: 'PL-PDG',
    name: 'Poulet DG Royal',
    description: 'Poulet braisé, sauté de plantains mûrs frits, poivrons rouges et jaunes, sauce tomate relevée.',
    categoryId: 'cat-res',
    image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?q=80&w=600&auto=format&fit=crop',
    price: 4500,
    tvaApplicable: true,
    theoreticalCost: 2350,
    margin: 2150,
    marginPercent: 47.7,
    prepTime: 25,
    availablePOS: true,
    availableDelivery: true,
    availableTakeaway: true,
    active: true,
    tenantId: 'tenant-douala'
  },
  {
    id: 'dish-pizza-royale',
    code: 'PL-PIZ',
    name: 'Pizza Royale du Terroir',
    description: 'Pâte artisanale, sauce oignon/ail, filet de boeuf haché épicé, tomates fraîches, basilic.',
    categoryId: 'cat-res',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=600&auto=format&fit=crop',
    price: 5000,
    tvaApplicable: true,
    theoreticalCost: 2100,
    margin: 2900,
    marginPercent: 58.0,
    prepTime: 15,
    availablePOS: true,
    availableDelivery: true,
    availableTakeaway: true,
    active: true,
    tenantId: 'tenant-douala'
  },
  {
    id: 'dish-brochette-beef',
    code: 'PL-BRO',
    name: 'Brochettes Suya de Boeuf',
    description: 'Gros dés de filet de boeuf épicé, grillés et roulés dans l\'arachide rôtie écrasée.',
    categoryId: 'cat-res',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=600&auto=format&fit=crop',
    price: 3500,
    tvaApplicable: true,
    theoreticalCost: 1550,
    margin: 1950,
    marginPercent: 55.7,
    prepTime: 10,
    availablePOS: true,
    availableDelivery: true,
    availableTakeaway: true,
    active: true,
    tenantId: 'tenant-douala'
  },
  {
    id: 'dish-jus-naturel',
    code: 'PL-JUS',
    name: 'Jus d\'Ananas-Passion',
    description: 'Pur jus pressé de fruits locaux de l\'Ouest, sans conservateur.',
    categoryId: 'cat-boi',
    image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?q=80&w=600&auto=format&fit=crop',
    price: 1500,
    tvaApplicable: false,
    theoreticalCost: 500,
    margin: 1000,
    marginPercent: 66.7,
    prepTime: 5,
    availablePOS: true,
    availableDelivery: true,
    availableTakeaway: true,
    active: true,
    tenantId: 'tenant-douala'
  },
  {
    id: 'dish-ndole',
    code: 'PL-NDO',
    name: 'Ndolé Impérial',
    description: 'Ndolé de feuilles locales, crème d\'arachides frites, crevettes et boeuf, servi avec miondo.',
    categoryId: 'cat-res',
    image: 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?q=80&w=600&auto=format&fit=crop',
    price: 5500,
    tvaApplicable: true,
    theoreticalCost: 2800,
    margin: 2700,
    marginPercent: 49.1,
    prepTime: 30,
    availablePOS: true,
    availableDelivery: true,
    availableTakeaway: false,
    active: true,
    tenantId: 'tenant-douala'
  },
  {
    id: 'dish-koki',
    code: 'PL-KOK',
    name: 'Beignets Koki de Grand-Mère',
    description: 'Pâte de Koki épicée à l\'huile de palme, vapeur traditionnelle enveloppée dans les feuilles de bananier.',
    categoryId: 'cat-res',
    image: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?q=80&w=600&auto=format&fit=crop',
    price: 2000,
    tvaApplicable: false,
    theoreticalCost: 900,
    margin: 1100,
    marginPercent: 55.0,
    prepTime: 15,
    availablePOS: true,
    availableDelivery: false,
    availableTakeaway: true,
    active: true,
    tenantId: 'tenant-douala'
  },
  {
    id: 'dish-poisson-braise',
    code: 'PL-POB',
    name: 'Poisson Maquereau Braisé',
    description: 'Poisson maquereau entier mariné aux épices du terroir, braisé au charbon de bois, frites de plantain.',
    categoryId: 'cat-res',
    image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?q=80&w=600&auto=format&fit=crop',
    price: 6000,
    tvaApplicable: true,
    theoreticalCost: 3200,
    margin: 2800,
    marginPercent: 46.7,
    prepTime: 20,
    availablePOS: true,
    availableDelivery: true,
    availableTakeaway: true,
    active: true,
    tenantId: 'tenant-douala'
  },
  {
    id: 'dish-coca-cola',
    code: 'PL-COCA',
    name: 'Coca Cola Frais',
    description: 'Canette ou bouteille en verre de Coca-Cola classique bien fraîche.',
    categoryId: 'cat-boi',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?q=80&w=600&auto=format&fit=crop',
    price: 1000,
    tvaApplicable: true,
    theoreticalCost: 500,
    margin: 500,
    marginPercent: 50.0,
    prepTime: 1,
    availablePOS: true,
    availableDelivery: true,
    availableTakeaway: true,
    active: true,
    tenantId: 'tenant-douala'
  }
];

// Recipes (BOM) linking Dishes/Dishes to Ingredients/Materials
export const initialRecipes: Recipe[] = [
  {
    id: 'rec-pdg',
    dishId: 'dish-poulet-dg',
    version: 1,
    active: true,
    tenantId: 'tenant-douala',
    lines: [
      { ingredientId: 'ing-pou', quantity: 0.5 }, // 0.5 kg Poulet
      { ingredientId: 'ing-pla', quantity: 0.8 }, // 0.8 kg Plantain mûr
      { ingredientId: 'ing-tom', quantity: 0.2 }, // 0.2 kg tom
      { ingredientId: 'ing-oig', quantity: 0.1 }, // 0.1 kg oignon
      { ingredientId: 'ing-hui', quantity: 0.05 } // 0.05 L huile
    ]
  },
  {
    id: 'rec-piz',
    dishId: 'dish-pizza-royale',
    version: 1,
    active: true,
    tenantId: 'tenant-douala',
    lines: [
      { ingredientId: 'ing-boe', quantity: 0.35 }, // 0.35 kg Boeuf
      { ingredientId: 'ing-tom', quantity: 0.2 },
      { ingredientId: 'ing-oig', quantity: 0.10 },
      { ingredientId: 'ing-hui', quantity: 0.03 }
    ]
  },
  {
    id: 'rec-bro',
    dishId: 'dish-brochette-beef',
    version: 1,
    active: true,
    tenantId: 'tenant-douala',
    lines: [
      { ingredientId: 'ing-boe', quantity: 0.25 },
      { ingredientId: 'ing-oig', quantity: 0.05 },
      { ingredientId: 'ing-hui', quantity: 0.02 }
    ]
  },
  {
    id: 'rec-ndole',
    dishId: 'dish-ndole',
    version: 1,
    active: true,
    tenantId: 'tenant-douala',
    lines: [
      { ingredientId: 'ing-boe', quantity: 0.2 },
      { ingredientId: 'ing-oig', quantity: 0.15 },
      { ingredientId: 'ing-hui', quantity: 0.1 }
    ]
  },
  {
    id: 'rec-koki',
    dishId: 'dish-koki',
    version: 1,
    active: true,
    tenantId: 'tenant-douala',
    lines: [
      { ingredientId: 'ing-kok', quantity: 0.3 },
      { ingredientId: 'ing-hui', quantity: 0.08 }
    ]
  },
  {
    id: 'rec-pob',
    dishId: 'dish-poisson-braise',
    version: 1,
    active: true,
    tenantId: 'tenant-douala',
    lines: [
      { ingredientId: 'ing-maq', quantity: 1.0 }, // 1 Unit
      { ingredientId: 'ing-pla', quantity: 0.5 },
      { ingredientId: 'ing-oig', quantity: 0.1 },
      { ingredientId: 'ing-hui', quantity: 0.04 }
    ]
  },
  {
    id: 'rec-coca',
    dishId: 'dish-coca-cola',
    version: 1,
    active: true,
    tenantId: 'tenant-douala',
    lines: [
      { ingredientId: 'ing-coc', quantity: 1.0 }
    ]
  }
];

// Historical database over the last 5 days up to index date (2026-06-11)
// Generating rich chart sales to make metrics immediate and useful
export const initialOrders: Order[] = [
  {
    id: 'cmd-01',
    number: 'CMD-202606-0001',
    date: '2026-06-07',
    time: '12:15',
    canal: 'SUR_PLACE',
    covers: 2,
    status: 'CLOSED',
    paymentMethod: 'CASH',
    userId: 'user-cashier',
    userName: 'Marie Caissière',
    subtotal: 10000,
    discount: 0,
    total: 10000,
    costTotal: 5200,
    margin: 4800,
    notes: 'Pas trop épicé',
    tenantId: 'tenant-douala',
    lines: [
      { id: 'l1', dishId: 'dish-poulet-dg', dishName: 'Poulet DG Royal', quantity: 2, price: 4500, discount: 0, total: 9000, notes: 'Pas trop épicé' },
      { id: 'l2', dishId: 'dish-coca-cola', dishName: 'Coca Cola Frais', quantity: 1, price: 1000, discount: 0, total: 1000 }
    ]
  },
  {
    id: 'cmd-02',
    number: 'CMD-202606-0002',
    date: '2026-06-07',
    time: '19:40',
    canal: 'LIVRAISON',
    covers: 1,
    status: 'CLOSED',
    paymentMethod: 'OM',
    userId: 'user-cashier',
    userName: 'Marie Caissière',
    subtotal: 11000,
    discount: 500,
    total: 10500,
    costTotal: 4600,
    margin: 5900,
    tenantId: 'tenant-douala',
    lines: [
      { id: 'l3', dishId: 'dish-pizza-royale', dishName: 'Pizza Royale du Terroir', quantity: 2, price: 5000, discount: 500, total: 9500 },
      { id: 'l4', dishId: 'dish-jus-naturel', dishName: 'Jus d\'Ananas-Passion', quantity: 1, price: 1500, discount: 0, total: 1500 }
    ]
  },
  {
    id: 'cmd-03',
    number: 'CMD-202606-0003',
    date: '2026-06-08',
    time: '13:02',
    canal: 'A_EMPORTER',
    covers: 3,
    status: 'CLOSED',
    paymentMethod: 'MOMO',
    userId: 'user-cashier',
    userName: 'Marie Caissière',
    subtotal: 21500,
    discount: 1000,
    total: 20500,
    costTotal: 10300,
    margin: 10200,
    tenantId: 'tenant-douala',
    lines: [
      { id: 'l5', dishId: 'dish-poulet-dg', dishName: 'Poulet DG Royal', quantity: 3, price: 4500, discount: 0, total: 13500 },
      { id: 'l6', dishId: 'dish-ndole', dishName: 'Ndolé Impérial', quantity: 1, price: 5500, discount: 1000, total: 4500 },
      { id: 'l7', dishId: 'dish-jus-naturel', dishName: 'Jus d\'Ananas-Passion', quantity: 1, price: 1500, discount: 0, total: 1500 },
      { id: 'l8', dishId: 'dish-coca-cola', dishName: 'Coca Cola Frais', quantity: 2, price: 1000, discount: 0, total: 2000 }
    ]
  },
  {
    id: 'cmd-04',
    number: 'CMD-202606-0004',
    date: '2026-06-08',
    time: '20:10',
    canal: 'SUR_PLACE',
    covers: 2,
    status: 'CLOSED',
    paymentMethod: 'CASH',
    userId: 'user-cashier',
    userName: 'Marie Caissière',
    subtotal: 12000,
    discount: 0,
    total: 12000,
    costTotal: 6400,
    margin: 5600,
    tenantId: 'tenant-douala',
    lines: [
      { id: 'l9', dishId: 'dish-poisson-braise', dishName: 'Poisson Maquereau Braisé', quantity: 2, price: 6000, discount: 0, total: 12000 }
    ]
  },
  {
    id: 'cmd-05',
    number: 'CMD-202606-0005',
    date: '2026-06-09',
    time: '12:50',
    canal: 'SUR_PLACE',
    covers: 4,
    status: 'CLOSED',
    paymentMethod: 'CASH',
    userId: 'user-cashier',
    userName: 'Marie Caissière',
    subtotal: 35000,
    discount: 0,
    total: 35000,
    costTotal: 17200,
    margin: 17800,
    tenantId: 'tenant-douala',
    lines: [
      { id: 'l10', dishId: 'dish-poulet-dg', dishName: 'Poulet DG Royal', quantity: 4, price: 4500, discount: 0, total: 18000 },
      { id: 'l11', dishId: 'dish-ndole', dishName: 'Ndolé Impérial', quantity: 2, price: 5500, discount: 0, total: 11000 },
      { id: 'l12', dishId: 'dish-jus-naturel', dishName: 'Jus d\'Ananas-Passion', quantity: 4, price: 1500, discount: 0, total: 6000 }
    ]
  },
  {
    id: 'cmd-06',
    number: 'CMD-202606-0006',
    date: '2026-06-09',
    time: '19:15',
    canal: 'SUR_PLACE',
    covers: 2,
    status: 'CLOSED',
    paymentMethod: 'OM',
    userId: 'user-cashier',
    userName: 'Marie Caissière',
    subtotal: 10000,
    discount: 500,
    total: 9500,
    costTotal: 4200,
    margin: 5300,
    tenantId: 'tenant-douala',
    lines: [
      { id: 'l13', dishId: 'dish-pizza-royale', dishName: 'Pizza Royale du Terroir', quantity: 2, price: 5000, discount: 500, total: 9500 },
      { id: 'l14', dishId: 'dish-jus-naturel', dishName: 'Jus d\'Ananas-Passion', quantity: 0, price: 1500, discount: 0, total: 0 } // Cancelled line placeholder
    ]
  },
  {
    id: 'cmd-07',
    number: 'CMD-202606-0007',
    date: '2026-06-10',
    time: '13:10',
    canal: 'A_EMPORTER',
    covers: 1,
    status: 'CLOSED',
    paymentMethod: 'CASH',
    userId: 'user-cashier',
    userName: 'Marie Caissière',
    subtotal: 6500,
    discount: 0,
    total: 6500,
    costTotal: 3250,
    margin: 3250,
    tenantId: 'tenant-douala',
    lines: [
      { id: 'l15', dishId: 'dish-poulet-dg', dishName: 'Poulet DG Royal', quantity: 1, price: 4500, discount: 0, total: 4500 },
      { id: 'l16', dishId: 'dish-koki', dishName: 'Beignets Koki de Grand-Mère', quantity: 1, price: 2000, discount: 0, total: 2000 }
    ]
  },
  {
    id: 'cmd-08',
    number: 'CMD-202606-0008',
    date: '2026-06-10',
    time: '21:00',
    canal: 'LIVRAISON',
    covers: 2,
    status: 'CLOSED',
    paymentMethod: 'MOMO',
    userId: 'user-cashier',
    userName: 'Marie Caissière',
    subtotal: 17500,
    discount: 1000,
    total: 16500,
    costTotal: 8500,
    margin: 8000,
    tenantId: 'tenant-douala',
    lines: [
      { id: 'l17', dishId: 'dish-poisson-braise', dishName: 'Poisson Maquereau Braisé', quantity: 2, price: 6000, discount: 0, total: 12000 },
      { id: 'l18', dishId: 'dish-pizza-royale', dishName: 'Pizza Royale du Terroir', quantity: 1, price: 5000, discount: 1000, total: 4000 },
      { id: 'l19', dishId: 'dish-jus-naturel', dishName: 'Jus d\'Ananas-Passion', quantity: 1, price: 1500, discount: 0, total: 1500 }
    ]
  },
  {
    id: 'cmd-09',
    number: 'CMD-202606-0009',
    date: '2026-06-11',
    time: '09:30',
    canal: 'A_EMPORTER',
    covers: 1,
    status: 'VALIDATED', // Active for today
    paymentMethod: 'CASH',
    userId: 'user-cashier',
    userName: 'Marie Caissière',
    subtotal: 5500,
    discount: 0,
    total: 5500,
    costTotal: 2850,
    margin: 2650,
    tenantId: 'tenant-douala',
    lines: [
      { id: 'l20', dishId: 'dish-poulet-dg', dishName: 'Poulet DG Royal', quantity: 1, price: 4500, discount: 0, total: 4500 },
      { id: 'l21', dishId: 'dish-coca-cola', dishName: 'Coca Cola Frais', quantity: 1, price: 1000, discount: 0, total: 1000 }
    ]
  },
  {
    id: 'cmd-10',
    number: 'CMD-202606-0010',
    date: '2026-06-11',
    time: '10:15',
    canal: 'SUR_PLACE',
    covers: 2,
    status: 'VALIDATED', // Active for today
    paymentMethod: 'OM',
    userId: 'user-cashier',
    userName: 'Marie Caissière',
    subtotal: 12000,
    discount: 500,
    total: 11500,
    costTotal: 4700,
    margin: 6800,
    tenantId: 'tenant-douala',
    lines: [
      { id: 'l22', dishId: 'dish-pizza-royale', dishName: 'Pizza Royale du Terroir', quantity: 2, price: 5000, discount: 500, total: 9500 },
      { id: 'l23', dishId: 'dish-jus-naturel', dishName: 'Jus d\'Ananas-Passion', quantity: 2, price: 1500, discount: 0, total: 2000 }
    ]
  }
];

// Historical stock movements (IN and SALE consumption, inventory gaps)
export const initialStockMovements: StockMovement[] = [
  { id: 'mov-1', date: '2026-06-06 08:30', ingredientId: 'ing-pou', ingredientName: 'Poulet Entier', type: 'IN', quantity: 50, unitCost: 2200, value: 110000, reference: 'BL-MBOA-1088', userId: 'user-warehouse', userName: 'Jean Magasinier', comment: 'Approvisionnement initial', tenantId: 'tenant-douala' },
  { id: 'mov-2', date: '2026-06-06 08:45', ingredientId: 'ing-pla', ingredientName: 'Plantain Mûr', type: 'IN', quantity: 80, unitCost: 800, value: 64000, reference: 'BL-AGRI-405', userId: 'user-warehouse', userName: 'Jean Magasinier', comment: 'Réception cargaison Noun', tenantId: 'tenant-douala' },
  { id: 'mov-3', date: '2026-06-06 09:00', ingredientId: 'ing-boe', ingredientName: 'Filet de Boeuf', type: 'IN', quantity: 30, unitCost: 2500, value: 75000, reference: 'BL-MBOA-1088', userId: 'user-warehouse', userName: 'Jean Magasinier', comment: 'Approvisionnement initial viande', tenantId: 'tenant-douala' },
  { id: 'mov-4', date: '2026-06-07 23:00', ingredientId: 'ing-pou', ingredientName: 'Poulet Entier', type: 'SALE', quantity: -1, unitCost: 2200, value: -2200, reference: 'CMD-202606-0001', userId: 'user-cashier', userName: 'Marie Caissière', comment: 'Sortie automatique sur vente', tenantId: 'tenant-douala' },
  { id: 'mov-5', date: '2026-06-07 23:00', ingredientId: 'ing-pla', ingredientName: 'Plantain Mûr', type: 'SALE', quantity: -1.6, unitCost: 800, value: -1280, reference: 'CMD-202606-0001', userId: 'user-cashier', userName: 'Marie Caissière', comment: 'Sortie automatique sur vente', tenantId: 'tenant-douala' },
  { id: 'mov-6', date: '2026-06-09 10:00', ingredientId: 'ing-tom', ingredientName: 'Tomate de Foumbot', type: 'ADJUST_PLUS', quantity: 10, unitCost: 600, value: 6000, reference: 'CORR-998', userId: 'user-manager', userName: 'Kengne Sylvain', comment: 'Réconciliation stock d\'urgence', tenantId: 'tenant-douala' },
  { id: 'mov-7', date: '2026-06-10 17:30', ingredientId: 'ing-kok', ingredientName: 'Graine de Koki', type: 'INVENTORY', quantity: -1, unitCost: 1000, value: -1000, reference: 'INV-202606-001', userId: 'user-warehouse', userName: 'Jean Magasinier', comment: 'Écart d\'inventaire constaté', tenantId: 'tenant-douala' }
];

// Purchase Orders (Bons de Commande) from suppliers
export const initialPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'bc-1',
    number: 'BC-202606-0001',
    date: '2026-06-05',
    supplierId: 'sup-mboa',
    supplierName: 'ETS MBOA DISTRIBUTION',
    status: 'RECEIVED',
    tenantId: 'tenant-douala',
    lines: [
      { id: 'bcl-1', ingredientId: 'ing-pou', ingredientName: 'Poulet Entier', quantity: 30, quantityReceived: 30, unit: 'kg', lastPrice: 2200, total: 66000 },
      { id: 'bcl-2', ingredientId: 'ing-coc', ingredientName: 'Coca Cola 33cl', quantity: 50, quantityReceived: 50, unit: 'Unité', lastPrice: 500, total: 25000 }
    ]
  },
  {
    id: 'bc-2',
    number: 'BC-202606-0002',
    date: '2026-06-10',
    supplierId: 'sup-kribi',
    supplierName: 'SOCIETE DES MAREYEURS DE KRIBI',
    status: 'SENT',
    tenantId: 'tenant-douala',
    lines: [
      { id: 'bcl-3', ingredientId: 'ing-maq', ingredientName: 'Maquereau de Kribi', quantity: 20, quantityReceived: 0, unit: 'Unité', lastPrice: 1500, total: 30000 }
    ]
  }
];

// Initial Demandes de d'Achat (DA)
export const initialPurchaseRequests: PurchaseRequest[] = [
  {
    id: 'da-1',
    number: 'DA-202606-0001',
    date: '2026-06-04',
    requesterName: 'Jean Magasinier',
    status: 'CONVERTED',
    tenantId: 'tenant-douala',
    lines: [
      { ingredientId: 'ing-pou', ingredientName: 'Poulet Entier', quantity: 30, unit: 'kg' }
    ]
  },
  {
    id: 'da-2',
    number: 'DA-202606-0002',
    date: '2026-06-11',
    requesterName: 'Jean Magasinier',
    status: 'SUBMITTED',
    tenantId: 'tenant-douala',
    lines: [
      { ingredientId: 'ing-pla', ingredientName: 'Plantain Mûr', quantity: 50, unit: 'kg' },
      { ingredientId: 'ing-oig', ingredientName: 'Oignons Violacés', quantity: 15, unit: 'kg' }
    ]
  }
];

// Historic cash registry movement logs
export const initialCashMovements: CashRegisterMovement[] = [
  { id: 'csh-1', date: '2026-06-07 23:55', type: 'IN', amount: 20500, reference: 'Ventes du 07/06', comment: 'Versement cash journalier', paymentMethod: 'CASH', userId: 'user-manager', userName: 'Kengne Sylvain', tenantId: 'tenant-douala' },
  { id: 'csh-2', date: '2026-06-08 08:30', type: 'OUT', amount: 91000, reference: 'BC-202606-0001', comment: 'Paiement Espèces Mboa Guy', paymentMethod: 'CASH', userId: 'user-manager', userName: 'Kengne Sylvain', tenantId: 'tenant-douala' },
  { id: 'csh-3', date: '2026-06-11 08:00', type: 'OUT', amount: 7500, reference: 'DEC-045', comment: 'Achat ampoules et savon vaisselle', paymentMethod: 'CASH', userId: 'user-manager', userName: 'Kengne Sylvain', tenantId: 'tenant-douala' }
];

// Historical Daily Closures
export const initialDailyClosures: DailyClosure[] = [
  { id: 'cl-1', date: '2026-06-07', validated: true, validatedBy: 'Kengne Sylvain (MANAGER)', time: '23:55', revenue: 20500, expenses: 0, netProfit: 20500, ordersCount: 2, ticketAverage: 10250, marginAmount: 10700, cashRevenue: 10000, omRevenue: 10500, momoRevenue: 0, tenantId: 'tenant-douala' },
  { id: 'cl-2', date: '2026-06-08', validated: true, validatedBy: 'Kengne Sylvain (MANAGER)', time: '23:58', revenue: 32500, expenses: 91000, netProfit: -58500, ordersCount: 2, ticketAverage: 16250, marginAmount: 15800, cashRevenue: 12000, omRevenue: 0, momoRevenue: 20500, tenantId: 'tenant-douala' },
  { id: 'cl-3', date: '2026-06-09', validated: true, validatedBy: 'Kengne Sylvain (MANAGER)', time: '23:50', revenue: 44500, expenses: 0, netProfit: 44500, ordersCount: 2, ticketAverage: 22250, marginAmount: 23100, cashRevenue: 35000, omRevenue: 9500, momoRevenue: 0, tenantId: 'tenant-douala' },
  { id: 'cl-4', date: '2026-06-10', validated: true, validatedBy: 'Kengne Sylvain (MANAGER)', time: '23:59', revenue: 23000, expenses: 0, netProfit: 23000, ordersCount: 2, ticketAverage: 11500, marginAmount: 11250, cashRevenue: 6500, omRevenue: 0, momoRevenue: 16500, tenantId: 'tenant-douala' }
];

// Initial Audit Logs (RBAC & traceability complete)
export const initialAuditLogs: AuditLog[] = [
  { id: 'aud-1', timestamp: '2026-06-06T08:30:00Z', userId: 'user-warehouse', userName: 'Jean Magasinier', action: 'Création ingredient ING-POU', module: 'STOCKS', tenantId: 'tenant-douala' },
  { id: 'aud-2', timestamp: '2026-06-06T09:00:00Z', userId: 'user-warehouse', userName: 'Jean Magasinier', action: 'Réception cargaison BL-MBOA-1088', module: 'ACHATS', tenantId: 'tenant-douala' },
  { id: 'aud-3', timestamp: '2026-06-07T12:15:00Z', userId: 'user-cashier', userName: 'Marie Caissière', action: 'Création de la commande CMD-202606-0001', module: 'POS / CAISSE', tenantId: 'tenant-douala' },
  { id: 'aud-4', timestamp: '2026-06-08T08:30:00Z', userId: 'user-manager', userName: 'Kengne Sylvain', action: 'Paiement facture d\'achat BC-202606-0001 (91,000 FCFA)', module: 'COMPTABILITÉ', tenantId: 'tenant-douala' }
];

// Seed data for Non-Food Products (Hors-Alimentation)
export const initialNonFoodItems = [
  {
    id: 'nf-boite-douala',
    code: 'NF-EMB-BOITE',
    name: 'Boîtes Emballage Carton (M)',
    category: 'EMBALLAGE',
    description: 'Boîtes pliables en carton kraft pour emporter les repas de taille Moyenne.',
    stockActual: 450,
    stockMin: 100,
    stockMax: 1000,
    unit: 'Pièce',
    cmp: 150,
    lastPurchasePrice: 150,
    supplierId: 'sup-coop',
    active: true,
    tenantId: 'tenant-douala'
  },
  {
    id: 'nf-boite-yaounde',
    code: 'NF-EMB-BOITE',
    name: 'Boîtes Emballage Carton (M)',
    category: 'EMBALLAGE',
    description: 'Boîtes pliables en carton kraft pour emporter les repas de taille Moyenne.',
    stockActual: 220,
    stockMin: 100,
    stockMax: 1000,
    unit: 'Pièce',
    cmp: 150,
    lastPurchasePrice: 150,
    active: true,
    tenantId: 'tenant-yaounde'
  },
  {
    id: 'nf-savon-douala',
    code: 'NF-HYG-SAVON',
    name: 'Savon Liquide Mains (Doseur Marie)',
    category: 'HYGIENE',
    description: 'Savon liquide antiseptique pour le lavage des mains du personnel et des clients.',
    stockActual: 18,
    stockMin: 5,
    stockMax: 40,
    unit: 'Litre',
    cmp: 1200,
    lastPurchasePrice: 1250,
    active: true,
    tenantId: 'tenant-douala'
  },
  {
    id: 'nf-savon-yaounde',
    code: 'NF-HYG-SAVON',
    name: 'Savon Liquide Mains (Doseur Marie)',
    category: 'HYGIENE',
    description: 'Savon liquide antiseptique pour le lavage des mains du personnel et des clients.',
    stockActual: 12,
    stockMin: 5,
    stockMax: 40,
    unit: 'Litre',
    cmp: 1200,
    lastPurchasePrice: 1200,
    active: true,
    tenantId: 'tenant-yaounde'
  },
  {
    id: 'nf-deter-douala',
    code: 'NF-HYG-DETER',
    name: 'Détergent Sol Sols Lavande (5L)',
    category: 'HYGIENE',
    description: 'Produit détergent désinfectant parfumé pour l’entretien des sols du restaurant.',
    stockActual: 8,
    stockMin: 2,
    stockMax: 20,
    unit: 'Bidon 5L',
    cmp: 4500,
    lastPurchasePrice: 4500,
    active: true,
    tenantId: 'tenant-douala'
  },
  {
    id: 'nf-essui-douala',
    code: 'NF-FOUR-ESSUI',
    name: 'Papier Essuie-tout Professionnel',
    category: 'FOURNITURE',
    description: 'Bobine d\'essuie-tout fort pouvoir absorbant pour la cuisine et la plonge.',
    stockActual: 24,
    stockMin: 10,
    stockMax: 80,
    unit: 'Rouleau',
    cmp: 850,
    lastPurchasePrice: 850,
    active: true,
    tenantId: 'tenant-douala'
  },
  {
    id: 'nf-sac-douala',
    code: 'NF-EMB-SAC',
    name: 'Sacs Plastiques Biodégradables (G)',
    category: 'EMBALLAGE',
    description: 'Grands sacs de transport poignées bretelles pour les livraisons volumineuses.',
    stockActual: 110,
    stockMin: 50,
    stockMax: 500,
    unit: 'Pièce',
    cmp: 85,
    lastPurchasePrice: 85,
    active: true,
    tenantId: 'tenant-douala'
  },
  {
    id: 'nf-gants-douala',
    code: 'NF-SEC-GANTS',
    name: 'Gants de Cuisine Jetables (M)',
    category: 'MAINTENANCE',
    description: 'Boîtes de gants jetables en vinyle pour le dressage et les préparations froides.',
    stockActual: 1, // Alerte stock faible récurrent
    stockMin: 3,
    stockMax: 20,
    unit: 'Boîte',
    cmp: 2500,
    lastPurchasePrice: 2400,
    active: true,
    tenantId: 'tenant-douala'
  }
];

export const initialNonFoodMovements = [
  {
    id: 'nfmvt-1',
    date: '2026-06-05 09:00',
    itemId: 'nf-boite-douala',
    itemName: 'Boîtes Emballage Carton (M)',
    type: 'IN',
    quantity: 500,
    unitCost: 150,
    value: 75000,
    reference: 'Avis de Livraison BL-90812',
    userId: 'user-warehouse',
    userName: 'Jean Magasinier',
    comment: 'Approvisionnement grossiste de cartons d’emballages pour ventes à emporter.',
    tenantId: 'tenant-douala'
  },
  {
    id: 'nfmvt-2',
    date: '2026-06-06 18:30',
    itemId: 'nf-boite-douala',
    itemName: 'Boîtes Emballage Carton (M)',
    type: 'OUT',
    quantity: 50,
    unitCost: 150,
    value: 7500,
    reference: 'Sortie Directe Service',
    userId: 'user-cashier',
    userName: 'Marie Caissière',
    comment: 'Mise à disposition en salle pour les emballages à emporter pour le week-end.',
    tenantId: 'tenant-douala'
  },
  {
    id: 'nfmvt-3',
    date: '2026-06-08 10:30',
    itemId: 'nf-essui-douala',
    itemName: 'Papier Essuie-tout Professionnel',
    type: 'OUT',
    quantity: 6,
    unitCost: 850,
    value: 5100,
    reference: 'Usage Interne Plonge/Cuisine',
    userId: 'user-warehouse',
    userName: 'Jean Magasinier',
    comment: 'Remise de 6 rouleaux au chef de plonge pour l’hygiène hebdomadaire.',
    tenantId: 'tenant-douala'
  }
];

