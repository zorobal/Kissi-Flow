/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Sparkles,
  LayoutDashboard,
  Calculator,
  ShoppingBag,
  ListCollapse,
  Layers,
  Truck,
  Coins,
  ShieldCheck,
  Building2,
  LockKeyhole,
  Users2,
  Search,
  ChevronRight,
  UserCheck,
  MapPin,
  Menu,
  X,
  Database,
  Settings,
  Unlock,
  Eye,
  EyeOff,
  KeyRound,
  Check,
  Printer,
  UtensilsCrossed
} from 'lucide-react';

import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// Import Types
import {
  Tenant,
  User,
  Dish,
  DishCategory,
  Ingredient,
  Recipe,
  Order,
  StockMovement,
  PhysicalInventory,
  Supplier,
  PurchaseOrder,
  PurchaseRequest,
  CashRegisterMovement,
  DailyClosure,
  AuditLog,
  IngredientCategory,
  Expense,
  ChargeType,
  StockBatch
} from './types';

// Import initial seed datasets
import {
  initialTenants,
  initialUsers,
  initialDishCategories,
  initialDishes,
  initialIngredients,
  initialRecipes,
  initialOrders,
  initialStockMovements,
  initialSuppliers,
  initialPurchaseOrders,
  initialPurchaseRequests,
  initialCashMovements,
  initialDailyClosures,
  initialAuditLogs
} from './data';

// Import Sub views
import DashboardView from './components/DashboardView';
import POSView from './components/POSView';
import OrdersView from './components/OrdersView';
import CatalogueView from './components/CatalogueView';
import StocksView from './components/StocksView';
import PurchasesView from './components/PurchasesView';
import AccountingView from './components/AccountingView';
import AdminView from './components/AdminView';
import SettingsView from './components/SettingsView';
import FinanceView from './components/FinanceView';
import BilanView from './components/BilanView';
import PrestationsView from './components/PrestationsView';
import { LogoIcon, LogoFull } from './components/Logo';
import NotificationCenter from './components/NotificationCenter';

export default function App() {
  // Master states
  const [tenants, setTenants] = useState<Tenant[]>(() => {
    const local = localStorage.getItem('erp-tenants');
    return local ? JSON.parse(local) : initialTenants;
  });
  const [users, setUsers] = useState<User[]>(() => {
    const local = localStorage.getItem('erp-users');
    return local ? JSON.parse(local) : initialUsers;
  });
  const [dishes, setDishes] = useState<Dish[]>(() => {
    const local = localStorage.getItem('erp-dishes');
    return local ? JSON.parse(local) : initialDishes;
  });
  const [ingredients, setIngredients] = useState<Ingredient[]>(() => {
    const local = localStorage.getItem('erp-ingredients');
    return local ? JSON.parse(local) : initialIngredients;
  });
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const local = localStorage.getItem('erp-recipes');
    return local ? JSON.parse(local) : initialRecipes;
  });
  const [orders, setOrders] = useState<Order[]>(() => {
    const local = localStorage.getItem('erp-orders');
    return local ? JSON.parse(local) : initialOrders;
  });
  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    const local = localStorage.getItem('erp-stock-movements');
    return local ? JSON.parse(local) : initialStockMovements;
  });
  const [physicalInventories, setPhysicalInventories] = useState<PhysicalInventory[]>(() => {
    const local = localStorage.getItem('erp-physical-inventories');
    return local ? JSON.parse(local) : [];
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const local = localStorage.getItem('erp-suppliers');
    return local ? JSON.parse(local) : initialSuppliers;
  });
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const local = localStorage.getItem('erp-purchase-orders');
    return local ? JSON.parse(local) : initialPurchaseOrders;
  });
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>(() => {
    const local = localStorage.getItem('erp-purchase-requests');
    return local ? JSON.parse(local) : initialPurchaseRequests;
  });
  const [cashMovements, setCashMovements] = useState<CashRegisterMovement[]>(() => {
    const local = localStorage.getItem('erp-cash-movements');
    return local ? JSON.parse(local) : initialCashMovements;
  });
  const [dailyClosures, setDailyClosures] = useState<DailyClosure[]>(() => {
    const local = localStorage.getItem('erp-daily-closures');
    return local ? JSON.parse(local) : initialDailyClosures;
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const local = localStorage.getItem('erp-audit-logs');
    return local ? JSON.parse(local) : initialAuditLogs;
  });
  const [stockBatches, setStockBatches] = useState<StockBatch[]>(() => {
    const local = localStorage.getItem('erp-stock-batches');
    if (local) return JSON.parse(local);
    return [
      {
        id: 'batch-1',
        ingredientId: 'ing-pou',
        ingredientName: 'Poulet Entier',
        batchNum: 'LOT-202606-pou-01',
        dateReceived: '2026-06-11',
        quantity: 12.5,
        unit: 'kg',
        expiryDate: '2026-06-25',
        tenantId: 'tenant-douala'
      },
      {
        id: 'batch-2',
        ingredientId: 'ing-pou',
        ingredientName: 'Poulet Entier',
        batchNum: 'LOT-202606-pou-02',
        dateReceived: '2026-06-15',
        quantity: 20.0,
        unit: 'kg',
        expiryDate: '2026-07-15',
        tenantId: 'tenant-douala'
      },
      {
        id: 'batch-3',
        ingredientId: 'ing-tom',
        ingredientName: 'Tomate de Foumbot',
        batchNum: 'LOT-202606-tom-01',
        dateReceived: '2026-06-05',
        quantity: 3.5,
        unit: 'kg',
        expiryDate: '2026-06-14',
        tenantId: 'tenant-douala'
      },
      {
        id: 'batch-4',
        ingredientId: 'ing-pla',
        ingredientName: 'Plantain Mûr',
        batchNum: 'LOT-202606-pla-01',
        dateReceived: '2026-06-10',
        quantity: 15.0,
        unit: 'kg',
        expiryDate: '2026-06-19',
        tenantId: 'tenant-douala'
      },
      {
        id: 'batch-5',
        ingredientId: 'ing-pla',
        ingredientName: 'Plantain Mûr',
        batchNum: 'LOT-202606-pla-02',
        dateReceived: '2026-06-14',
        quantity: 30.0,
        unit: 'kg',
        expiryDate: '2026-06-30',
        tenantId: 'tenant-douala'
      }
    ];
  });

  // Synchronize state changes to localStorage
  React.useEffect(() => {
    localStorage.setItem('erp-stock-batches', JSON.stringify(stockBatches));
  }, [stockBatches]);

  React.useEffect(() => {
    localStorage.setItem('erp-tenants', JSON.stringify(tenants));
  }, [tenants]);
  React.useEffect(() => {
    localStorage.setItem('erp-users', JSON.stringify(users));
  }, [users]);
  React.useEffect(() => {
    localStorage.setItem('erp-dishes', JSON.stringify(dishes));
  }, [dishes]);
  React.useEffect(() => {
    localStorage.setItem('erp-ingredients', JSON.stringify(ingredients));
  }, [ingredients]);
  React.useEffect(() => {
    localStorage.setItem('erp-recipes', JSON.stringify(recipes));
  }, [recipes]);
  React.useEffect(() => {
    localStorage.setItem('erp-[#1E4E8C]-orders', JSON.stringify(orders)); // Wait let's use direct key
    localStorage.setItem('erp-orders', JSON.stringify(orders));
  }, [orders]);
  React.useEffect(() => {
    localStorage.setItem('erp-stock-movements', JSON.stringify(stockMovements));
  }, [stockMovements]);
  React.useEffect(() => {
    localStorage.setItem('erp-physical-inventories', JSON.stringify(physicalInventories));
  }, [physicalInventories]);
  React.useEffect(() => {
    localStorage.setItem('erp-suppliers', JSON.stringify(suppliers));
  }, [suppliers]);
  React.useEffect(() => {
    localStorage.setItem('erp-purchase-orders', JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);
  React.useEffect(() => {
    localStorage.setItem('erp-purchase-requests', JSON.stringify(purchaseRequests));
  }, [purchaseRequests]);
  React.useEffect(() => {
    localStorage.setItem('erp-cash-movements', JSON.stringify(cashMovements));
  }, [cashMovements]);
  React.useEffect(() => {
    localStorage.setItem('erp-daily-closures', JSON.stringify(dailyClosures));
  }, [dailyClosures]);
  React.useEffect(() => {
    localStorage.setItem('erp-audit-logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // Dynamic reference states
  const [paymentMethods, setPaymentMethods] = useState<string[]>(() => {
    const local = localStorage.getItem('erp-payment-methods');
    return local ? JSON.parse(local) : ['CASH', 'OM', 'MOMO', 'CARTE'];
  });
  React.useEffect(() => {
    localStorage.setItem('erp-payment-methods', JSON.stringify(paymentMethods));
  }, [paymentMethods]);

  const [unitsOfMeasurement, setUnitsOfMeasurement] = useState<string[]>(() => {
    const local = localStorage.getItem('erp-units-measurement');
    return local ? JSON.parse(local) : ['kg', 'g', 'L', 'mL', 'Unité', 'Boîte', 'Sachet', 'Carton', 'Bouteille'];
  });
  React.useEffect(() => {
    localStorage.setItem('erp-units-measurement', JSON.stringify(unitsOfMeasurement));
  }, [unitsOfMeasurement]);

  const [businessYears, setBusinessYears] = useState<number[]>(() => {
    const local = localStorage.getItem('erp-business-years');
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(Number).sort((a,b) => b - a);
        }
      } catch (e) {
        console.error('Error parsing business years', e);
      }
    }
    return [2027, 2026, 2025];
  });
  React.useEffect(() => {
    localStorage.setItem('erp-business-years', JSON.stringify(businessYears));
  }, [businessYears]);

  const [dishCategories, setDishCategories] = useState<DishCategory[]>(() => {
    const local = localStorage.getItem('erp-dish-categories');
    return local ? JSON.parse(local) : initialDishCategories;
  });
  React.useEffect(() => {
    localStorage.setItem('erp-dish-categories', JSON.stringify(dishCategories));
  }, [dishCategories]);

  const [ingredientCategories, setIngredientCategories] = useState<IngredientCategory[]>(() => {
    const local = localStorage.getItem('erp-ingredient-categories');
    return local ? JSON.parse(local) : [
      { id: 'cat-ing-viandes', name: 'Viande', tenantId: 'tenant-douala' },
      { id: 'cat-ing-viandes-y', name: 'Viande', tenantId: 'tenant-yaounde' },
      { id: 'cat-ing-legumes', name: 'Légumes', tenantId: 'tenant-douala' },
      { id: 'cat-ing-legumes-y', name: 'Légumes', tenantId: 'tenant-yaounde' },
      { id: 'cat-ing-epicerie', name: 'Épicerie', tenantId: 'tenant-douala' },
      { id: 'cat-ing-epicerie-y', name: 'Épicerie', tenantId: 'tenant-yaounde' },
      { id: 'cat-ing-poissons', name: 'Poissons', tenantId: 'tenant-douala' },
      { id: 'cat-ing-poissons-y', name: 'Poissons', tenantId: 'tenant-yaounde' },
      { id: 'cat-ing-boissons', name: 'Boissons', tenantId: 'tenant-douala' },
      { id: 'cat-ing-boissons-y', name: 'Boissons', tenantId: 'tenant-yaounde' },
      { id: 'cat-ing-nettoyage', name: 'Produits de nettoyage', tenantId: 'tenant-douala' },
      { id: 'cat-ing-nettoyage-y', name: 'Produits de nettoyage', tenantId: 'tenant-yaounde' },
      { id: 'cat-ing-herbes', name: 'Herbes & épices', tenantId: 'tenant-douala' },
      { id: 'cat-ing-herbes-y', name: 'Herbes & épices', tenantId: 'tenant-yaounde' }
    ];
  });
  React.useEffect(() => {
    localStorage.setItem('erp-ingredient-categories', JSON.stringify(ingredientCategories));
  }, [ingredientCategories]);

  // Finance related state: chargeTypes & expenses list
  const [chargeTypes, setChargeTypes] = useState<ChargeType[]>(() => {
    const local = localStorage.getItem('erp-charge-types');
    if (local) return JSON.parse(local);
    const defaults = ['Loyer', 'Salaires', 'Énergie', 'Eau', 'Assurance', 'Matières premières', 'Marketing', 'Entretien', 'Équipement', 'Autres'];
    const doubled: ChargeType[] = [];
    ['tenant-douala', 'tenant-yaounde'].forEach(tid => {
      defaults.forEach((name, idx) => {
        doubled.push({ id: `chg-${tid}-${idx}`, name, tenantId: tid });
      });
    });
    return doubled;
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const local = localStorage.getItem('erp-expenses');
    if (local) return JSON.parse(local);
    return [
      { id: 'exp-1', date: '2026-06-10', category: 'Loyer', type: 'FIXE', description: 'Loyer Mensuel Local Bali', amountHt: 1500000, tvaPercent: 19.25, amountTtc: 1788750, reference: 'FACT-RENT-BALI-06', tenantId: 'tenant-douala' },
      { id: 'exp-2', date: '2026-06-12', category: 'Salaires', type: 'FIXE', description: 'Acomptes Salaires Cuisine', amountHt: 800000, tvaPercent: 0, amountTtc: 800000, reference: 'SAL-ACOMPTE-06', tenantId: 'tenant-douala' },
      { id: 'exp-3', date: '2026-06-11', category: 'Énergie', type: 'VARIABLE', description: 'Facture Électricité Eneo', amountHt: 250000, tvaPercent: 19.25, amountTtc: 298125, reference: 'ENEO-98421379', tenantId: 'tenant-douala' },
      { id: 'exp-4', date: '2026-06-13', category: 'Eau', type: 'VARIABLE', description: 'Facture Eau Camwater', amountHt: 85000, tvaPercent: 19.25, amountTtc: 101362, reference: 'CAMW-2039481', tenantId: 'tenant-douala' },
      { id: 'exp-5', date: '2026-06-14', category: 'Matières premières', type: 'VARIABLE', description: 'Frais Approvisionnement Divers', amountHt: 450000, tvaPercent: 0, amountTtc: 450000, reference: 'APPROB-0192', tenantId: 'tenant-douala' },
      // Seed for Yaoundé
      { id: 'exp-y1', date: '2026-06-10', category: 'Loyer', type: 'FIXE', description: 'Loyer Mensuel Bastos', amountHt: 1800000, tvaPercent: 19.25, amountTtc: 2146500, reference: 'FACT-RENT-BASTOS-06', tenantId: 'tenant-yaounde' },
      { id: 'exp-y2', date: '2026-06-12', category: 'Salaires', type: 'FIXE', description: 'Salaires Equipe Salle Yde', amountHt: 950000, tvaPercent: 0, amountTtc: 950000, reference: 'SAL-REGL-06', tenantId: 'tenant-yaounde' },
    ];
  });

  const saveChargeTypes = (newTypes: ChargeType[]) => {
    setChargeTypes(newTypes);
    localStorage.setItem('erp-charge-types', JSON.stringify(newTypes));
  };

  const saveExpenses = (newExpenses: Expense[]) => {
    setExpenses(newExpenses);
    localStorage.setItem('erp-expenses', JSON.stringify(newExpenses));
  };

  // Active Context Controls (Tenant & User Multi-SaaS isolation) with persistence
  const [activeTenantId, setActiveTenantId] = useState<string>(() => {
    return localStorage.getItem('erp-active-tenant-id') || 'tenant-douala';
  });
  const [activeUserId, setActiveUserId] = useState<string>(() => {
    return localStorage.getItem('erp-active-user-id') || 'user-admin';
  });

  // Enforce site isolation: non-ADMIN users belong to only one operational site and cannot switch sites
  React.useEffect(() => {
    const usr = users.find(u => u.id === activeUserId);
    if (usr && usr.role !== 'ADMIN') {
      setActiveTenantId(usr.tenantId);
    }
  }, [activeUserId, users]);

  React.useEffect(() => {
    localStorage.setItem('erp-active-tenant-id', activeTenantId);
  }, [activeTenantId]);

  React.useEffect(() => {
    localStorage.setItem('erp-active-user-id', activeUserId);
  }, [activeUserId]);

  // System sidebar responsive triggers
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Tab control state
  const [activeTab, setActiveTab] = useState<
    'DASHBOARD' | 'POS' | 'ORDERS' | 'CATALOGUE' | 'STOCKS' | 'PURCHASES' | 'ACCOUNTING' | 'ADMIN' | 'SETTINGS' | 'FINANCE' | 'BILAN' | 'ABOUT' | 'PRESTATIONS'
  >('DASHBOARD');

  // Password lock-screen states
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return localStorage.getItem('app-unlocked') === 'true' || sessionStorage.getItem('app-unlocked') === 'true';
  });
  const [appPassword, setAppPassword] = useState<string>(() => {
    return localStorage.getItem('custom-app-password') || 'kissine2026';
  });
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [keepConnected, setKeepConnected] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // User switching verification states
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [pendingPasswordInput, setPendingPasswordInput] = useState<string>('');
  const [pendingPasswordError, setPendingPasswordError] = useState<string>('');
  const [showPendingPassword, setShowPendingPassword] = useState<boolean>(false);

  // Self-service password change modal states (Any active user can change their password)
  const [showMyPasswordModal, setShowMyPasswordModal] = useState<boolean>(false);
  const [myNewPassword, setMyNewPassword] = useState<string>('');
  const [myNewPasswordConfirm, setMyNewPasswordConfirm] = useState<string>('');
  const [myPasswordError, setMyPasswordError] = useState<string>('');

  // Synchronize password changes from settings
  useState(() => {
    const handlePasswordUpdate = () => {
      setAppPassword(localStorage.getItem('custom-app-password') || 'kissine2026');
    };
    window.addEventListener('app-password-changed', handlePasswordUpdate);
    return () => {
      window.removeEventListener('app-password-changed', handlePasswordUpdate);
    };
  });

  // Admin sub-tab state coordination (used for Consulter l'audit complet button link)
  const [adminActiveSubTab, setAdminActiveSubTab] = useState<'USERS' | 'AUDIT' | 'SETTINGS'>('USERS');

  // Business day status controls
  const targetToday = '2026-06-11';
  const [isDayStarted, setIsDayStarted] = useState<boolean>(() => {
    return localStorage.getItem(`day-started-${activeTenantId}-${targetToday}`) === 'true';
  });

  const handleStartDay = () => {
    setIsDayStarted(true);
    localStorage.setItem(`day-started-${activeTenantId}-${targetToday}`, 'true');
    logsAction("Journée d'affaires activée et ouverte avec succès", 'COMPTABILITÉ & TRÉSORERIE');
  };

  const handleResetDailyClosure = (date: string) => {
    setDailyClosures(prev => prev.filter(c => !(c.date === date && c.tenantId === activeTenantId)));
    setOrders(prevOrders => {
      return prevOrders.map(o => {
        if (o.date === date && o.status === 'CLOSED') {
          return { ...o, status: 'VALIDATED' };
        }
        return o;
      });
    });
    setIsDayStarted(false);
    localStorage.removeItem(`day-started-${activeTenantId}-${date}`);
    logsAction(`Journée d'exploitation commerciale du ${date} réouverte (Clôture annulée)`, 'COMPTABILITÉ & TRÉSORERIE');
  };

  const handleUnlockApp = (e: React.FormEvent) => {
    e.preventDefault();
    const activeUser = users.find(u => u.id === activeUserId) || users[0];
    const correctPassword = activeUser.password || 'password123';
    if (passwordInput === correctPassword || passwordInput === appPassword) {
      setIsUnlocked(true);
      setPasswordError('');
      setPasswordInput('');
      
      // Auto set default allowed view/tab based on selected role
      if (activeUser.role === 'CASHIER') setActiveTab('POS');
      else if (activeUser.role === 'WAREHOUSE') setActiveTab('STOCKS');
      else if (activeUser.role === 'ACCOUNTING') setActiveTab('ACCOUNTING');
      else setActiveTab('DASHBOARD');

      if (keepConnected) {
        localStorage.setItem('app-unlocked', 'true');
      } else {
        sessionStorage.setItem('app-unlocked', 'true');
      }
      logsAction(`Terminal déverrouillé avec succès par ${activeUser.name} (${activeUser.role})`, 'SÉCURITÉ');
    } else {
      setPasswordError(`Mot de passe incorrect pour l'utilisateur ${activeUser.name}.`);
      logsAction(`Tentative de déverrouillage infructueuse pour ${activeUser.name}`, 'SÉCURITÉ');
    }
  };

  const handleLockApp = () => {
    setIsUnlocked(false);
    localStorage.removeItem('app-unlocked');
    sessionStorage.removeItem('app-unlocked');
    logsAction('Terminal verrouillé manuellement', 'SÉCURITÉ');
  };

  // Find active tenant and user details
  const activeTenant = tenants.find(t => t.id === activeTenantId) || tenants[0];
  const activeUser = users.find(u => u.id === activeUserId) || users[0];

  // Helper utility: Global Audit logging
  const logsAction = (action: string, module: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      userId: activeUser.id,
      userName: activeUser.name,
      action,
      module,
      tenantId: activeTenantId
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // UNIFIED HIGH-QUALITY PDF CAPTURE & REPORT COMPILER
  const handleGlobalExportPDF = async () => {
    const element = document.getElementById('layout-print-content');
    if (!element) return;

    // Save previous styles
    const originalStyle = element.style.cssText;

    // Create a beautiful premium PDF header
    const printHeader = document.createElement('div');
    printHeader.className = "p-6 mb-6 border-b-2 border-slate-900 flex justify-between items-center font-sans";
    printHeader.style.display = "flex";
    printHeader.style.justifyContent = "space-between";
    printHeader.style.alignItems = "center";
    printHeader.style.borderBottom = "2.5px solid #1E4E8C";
    printHeader.style.paddingBottom = "18px";
    printHeader.style.marginBottom = "28px";
    printHeader.style.backgroundColor = "#ffffff";
    printHeader.style.color = "#000000";

    // Left container: logo initials + corporate title
    const leftDiv = document.createElement('div');
    leftDiv.style.display = "flex";
    leftDiv.style.alignItems = "center";
    leftDiv.style.gap = "14px";

    const logoIcon = document.createElement('div');
    logoIcon.innerText = "K";
    logoIcon.style.height = "50px";
    logoIcon.style.width = "50px";
    logoIcon.style.backgroundColor = "#1E4E8C";
    logoIcon.style.color = "#ffffff";
    logoIcon.style.borderRadius = "12px";
    logoIcon.style.display = "flex";
    logoIcon.style.alignItems = "center";
    logoIcon.style.justifyContent = "center";
    logoIcon.style.fontWeight = "900";
    logoIcon.style.fontSize = "26px";

    const titleWrapper = document.createElement('div');
    const mainTitle = document.createElement('h1');
    mainTitle.innerText = "KISSINEFLOW";
    mainTitle.style.fontSize = "24px";
    mainTitle.style.fontWeight = "900";
    mainTitle.style.color = "#1E4E8C";
    mainTitle.style.margin = "0";
    mainTitle.style.letterSpacing = "-0.05em";

    const subTitle = document.createElement('p');
    subTitle.innerText = "SYSTEME UNIFIE DE GESTION RESTAURATION";
    subTitle.style.fontSize = "8.5px";
    subTitle.style.fontWeight = "800";
    subTitle.style.color = "#64748b";
    subTitle.style.margin = "3px 0 0 0";
    subTitle.style.letterSpacing = "0.08em";

    titleWrapper.appendChild(mainTitle);
    titleWrapper.appendChild(subTitle);
    leftDiv.appendChild(logoIcon);
    leftDiv.appendChild(titleWrapper);

    // Right container: certified metadata
    const rightDiv = document.createElement('div');
    rightDiv.style.textAlign = "right";
    rightDiv.style.fontSize = "11.5px";
    rightDiv.style.color = "#1e293b";
    rightDiv.style.lineHeight = "1.45";
    rightDiv.style.fontWeight = "600";

    const tagLabel = document.createElement('p');
    tagLabel.innerText = "EXPORT DE RAPPORT OFFICIEL";
    tagLabel.style.fontSize = "9.5px";
    tagLabel.style.backgroundColor = "#f1f5f9";
    tagLabel.style.padding = "2px 8px";
    tagLabel.style.borderRadius = "4px";
    tagLabel.style.display = "inline-block";
    tagLabel.style.fontWeight = "800";
    tagLabel.style.border = "1px solid #cbd5e1";
    tagLabel.style.marginBottom = "5px";

    const restText = document.createElement('p');
    restText.innerHTML = `Restaurant : <strong style="color:#000000">RESTAURANT KISSINE</strong>`;

    const siteText = document.createElement('p');
    siteText.innerHTML = `Site Opérationnel : <strong style="color:#1E4E8C">${activeTenant.raisonSociale || activeTenant.name}</strong>`;

    // Try to find the active date filter badge on the screen
    let activePeriod = "Toutes les dates";
    const allSpans = Array.from(document.querySelectorAll('span'));
    const matchedBadge = allSpans.find(span => {
      const parentText = span.parentElement?.textContent || '';
      return parentText.includes("Période d'Analyse") && span !== span.parentElement?.firstChild;
    });
    if (matchedBadge) {
      activePeriod = matchedBadge.textContent?.trim() || "Toutes les dates";
    }

    const periodText = document.createElement('p');
    periodText.innerHTML = `Période d'Analyse : <strong style="color:#1E4E8C">${activePeriod}</strong>`;

    const dateText = document.createElement('p');
    dateText.innerHTML = `Date d'extraction : <strong>${new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>`;

    rightDiv.appendChild(tagLabel);
    rightDiv.appendChild(restText);
    rightDiv.appendChild(siteText);
    rightDiv.appendChild(periodText);
    rightDiv.appendChild(dateText);

    printHeader.appendChild(leftDiv);
    printHeader.appendChild(rightDiv);

    // Dynamically insert header above content area
    element.insertBefore(printHeader, element.firstChild);

    // Style overrides for high-quality static snapshots
    element.style.backgroundColor = "#ffffff";
    element.style.color = "#000000";
    element.style.width = "1024px";
    element.style.padding = "24px";

    // Find and temporarily hide non-printable UI elements inside the snapshot area if any exist
    const nonPrintableElements = element.querySelectorAll('.print\\:hidden, button, input[type="file"]');
    const originalDisplays: string[] = [];
    nonPrintableElements.forEach((el: any, idx) => {
      originalDisplays[idx] = el.style.display;
      el.style.display = 'none';
    });

    // CRITICAL FIX: Yield 300ms to allow Recharts, CSS Grid, Flexbox, and other dynamic layouts to adapt beautifully to the 1024px width
    await new Promise(resolve => setTimeout(resolve, 300));

    // Save style sheets and temporarily replace oklch/oklab functions to prevent html2canvas parsing errors (Tailwind CSS v4 compatibility)
    const styleTags = Array.from(document.querySelectorAll('style'));
    const originalStyles = styleTags.map(tag => tag.innerHTML);

    const linkTags = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
    const tempStyles: HTMLStyleElement[] = [];
    const originalLinks: { link: HTMLLinkElement; disabled: boolean }[] = [];

    // Save element inline styles and temporarily replace oklch/oklab functions
    const cssElements = element.querySelectorAll('*');
    const originalInlineStyles: { element: HTMLElement; style: string }[] = [];

    // Helper to mathematically convert OKLCH and OKLAB models to legacy sRGB text formats
    const convertOklToRgbText = (styleText: string): string => {
      if (typeof styleText !== 'string') return styleText;

      const parseOklch = (str: string) => {
        const clean = str.replace(/deg/g, '').replace(/%/g, '');
        const parts = clean.match(/[\d.-]+/g);
        if (!parts || parts.length < 3) return null;
        let l = parseFloat(parts[0]);
        if (str.includes(parts[0] + '%')) {
          l = l / 100;
        } else if (l > 1) {
          l = l / 100;
        }
        const c = parseFloat(parts[1]);
        const h = parseFloat(parts[2]);
        const alpha = parts[3] ? parseFloat(parts[3]) : 1;
        return { l, c, h, alpha };
      };

      const parseOklab = (str: string) => {
        const clean = str.replace(/%/g, '');
        const parts = clean.match(/[\d.-]+/g);
        if (!parts || parts.length < 3) return null;
        let l = parseFloat(parts[0]);
        if (str.includes(parts[0] + '%')) {
          l = l / 100;
        } else if (l > 1) {
          l = l / 100;
        }
        const a = parseFloat(parts[1]);
        const b = parseFloat(parts[2]);
        const alpha = parts[3] ? parseFloat(parts[3]) : 1;
        return { l, a, b, alpha };
      };

      const oklabToRgb = (L: number, aValue: number, bValue: number, alpha = 1): string => {
        const l_ = L + 0.3963377774 * aValue + 0.2158037573 * bValue;
        const m_ = L - 0.1055613458 * aValue - 0.0638541728 * bValue;
        const s_ = L - 0.0894841775 * aValue - 1.2914855414 * bValue;

        const l = l_ * l_ * l_;
        const m = m_ * m_ * m_;
        const s = s_ * s_ * s_;

        const r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
        const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
        const b_ = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

        const f = (x: number) => {
          const clamped = Math.max(0, Math.min(1, x));
          return clamped > 0.0031308 ? 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055 : 12.92 * clamped;
        };

        const R = Math.round(f(r) * 255);
        const G = Math.round(f(g) * 255);
        const B = Math.round(f(b_) * 255);

        if (alpha < 1) {
          return `rgba(${R}, ${G}, ${B}, ${alpha})`;
        }
        return `rgb(${R}, ${G}, ${B})`;
      };

      const oklchToRgb = (l: number, c: number, h: number, alpha = 1): string => {
        const hRad = (h * Math.PI) / 180;
        const a = c * Math.cos(hRad);
        const b = c * Math.sin(hRad);
        return oklabToRgb(l, a, b, alpha);
      };

      let result = styleText;
      const oklchRegex = /oklch\(([^)]+)\)/gi;
      result = result.replace(oklchRegex, (match) => {
        const parsed = parseOklch(match);
        if (parsed) {
          return oklchToRgb(parsed.l, parsed.c, parsed.h, parsed.alpha);
        }
        return 'rgba(0, 0, 0, 0)';
      });

      const oklabRegex = /oklab\(([^)]+)\)/gi;
      result = result.replace(oklabRegex, (match) => {
        const parsed = parseOklab(match);
        if (parsed) {
          return oklabToRgb(parsed.l, parsed.a, parsed.b, parsed.alpha);
        }
        return 'rgba(0, 0, 0, 0)';
      });

      return result;
    };

    const stripUnsupportedColors = (cssText: string, fallbackColor = '#1E4E8C'): string => {
      return convertOklToRgbText(cssText);
    };

    // Keep references to restore them safely
    const originalGetComputedStyle = window.getComputedStyle;

    try {
      // OVERRIDE getComputedStyle for the main window during core compilation to intercept any oklch styles
      window.getComputedStyle = function(elt, pseudoElt) {
        const style = originalGetComputedStyle.call(window, elt, pseudoElt);
        return new Proxy(style, {
          get(target, prop) {
            if (prop === 'getPropertyValue') {
              return function(propertyName: string) {
                const val = target.getPropertyValue(propertyName);
                if (typeof val === 'string' && (val.toLowerCase().includes('oklch') || val.toLowerCase().includes('oklab'))) {
                  return convertOklToRgbText(val);
                }
                return val;
              };
            }
            const val = target[prop as any];
            if (typeof val === 'string' && (val.toLowerCase().includes('oklch') || val.toLowerCase().includes('oklab'))) {
              return convertOklToRgbText(val);
            }
            if (typeof val === 'function') {
              return val.bind(target);
            }
            return val;
          }
        });
      };

      styleTags.forEach(tag => {
        if (tag.innerHTML.includes('oklch') || tag.innerHTML.includes('oklab') || tag.innerHTML.includes('OKLCH') || tag.innerHTML.includes('OKLAB')) {
          tag.innerHTML = stripUnsupportedColors(tag.innerHTML, '#1E4E8C');
        }
      });

      // Fetch and sanitize linked stylesheets
      for (const link of linkTags) {
        try {
          const response = await fetch(link.href);
          if (response.ok) {
            const cssText = await response.text();
            if (cssText.includes('oklch') || cssText.includes('oklab') || cssText.includes('OKLCH') || cssText.includes('OKLAB')) {
              const cleanCss = stripUnsupportedColors(cssText, '#1E4E8C');
              const tempStyle = document.createElement('style');
              tempStyle.className = "temp-print-style-sheet";
              tempStyle.innerHTML = cleanCss;
              document.head.appendChild(tempStyle);
              tempStyles.push(tempStyle);

              originalLinks.push({ link, disabled: link.disabled });
              link.disabled = true;
            }
          }
        } catch (e) {
          console.warn("Could not sanitize link stylesheet:", link.href, e);
        }
      }

      cssElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (htmlEl.style && htmlEl.style.cssText && (
          htmlEl.style.cssText.includes('oklch') || 
          htmlEl.style.cssText.includes('oklab') ||
          htmlEl.style.cssText.includes('OKLCH') ||
          htmlEl.style.cssText.includes('OKLAB')
        )) {
          originalInlineStyles.push({ element: htmlEl, style: htmlEl.style.cssText });
          htmlEl.style.cssText = stripUnsupportedColors(htmlEl.style.cssText, '#1E4E8C');
        }
      });

      // Direct user notification overlay helper
      const toastDiv = document.createElement('div');
      toastDiv.innerHTML = `
        <div style="position:fixed; bottom:24px; right:24px; background-color:#1E4E8C; color:white; padding:12px 20px; border-radius:8px; font-weight:bold; font-size:12px; font-family:sans-serif; box-shadow:0 4px 12px rgba(0,0,0,0.15); z-index:9999; display:flex; align-items:center; gap:8px;">
          <svg class="animate-spin" style="height:16px; width:16px; color:white;" fill="none" viewBox="0 0 24 24">
            <circle style="opacity:0.25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path style="opacity:0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Impression & Compilation PDF en cours...</span>
        </div>
      `;
      document.body.appendChild(toastDiv);

      const finalWidth = Math.max(1200, element ? element.scrollWidth : 1200);
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution portrait scale
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        width: finalWidth,
        windowWidth: finalWidth,
        onclone: (clonedDoc) => {
          // INTERCEPT getComputedStyle INSIDE CLONED IFRAME TO PREVENT THE FATAL PARSE EXCEPTION
          if (clonedDoc && clonedDoc.defaultView) {
            const originalIFrameGetComputedStyle = clonedDoc.defaultView.getComputedStyle;
            clonedDoc.defaultView.getComputedStyle = function(elt, pseudoElt) {
              const style = originalIFrameGetComputedStyle.call(clonedDoc.defaultView, elt, pseudoElt);
              return new Proxy(style, {
                get(target, prop) {
                  if (prop === 'getPropertyValue') {
                    return function(propertyName: string) {
                      const val = target.getPropertyValue(propertyName);
                      if (typeof val === 'string' && (val.toLowerCase().includes('oklch') || val.toLowerCase().includes('oklab'))) {
                        return convertOklToRgbText(val);
                      }
                      return val;
                    };
                  }
                  const val = target[prop as any];
                  if (typeof val === 'string' && (val.toLowerCase().includes('oklch') || val.toLowerCase().includes('oklab'))) {
                    return convertOklToRgbText(val);
                  }
                  if (typeof val === 'function') {
                    return val.bind(target);
                  }
                  return val;
                }
              });
            };
          }

          // FORCE WHITE BACKGROUNDS AND DARK TEXT FOR GRAPHICAL/METRIC BLOCKS FOR READABLE PRINTING
          if (clonedDoc) {
            // Append a stylesheet directly to clone to resolve scroll region and text descender cut-offs
            const extraStyle = clonedDoc.createElement('style');
            extraStyle.innerHTML = `
              #layout-print-content, 
              #layout-print-content *, 
              [id^="pane-"], 
              [id^="dashboard-"], 
              .overflow-y-auto, 
              .overflow-x-auto, 
              .max-h-24, 
              .max-h-80 {
                max-height: none !important;
                height: auto !important;
                overflow: visible !important;
                overflow-x: visible !important;
                overflow-y: visible !important;
              }
              
              h1, h2, h3, h4, h5, h6, span, p, div, td, th, strong, code {
                line-height: 1.35 !important;
                padding-bottom: 2px !important;
              }

              * {
                transition: none !important;
                transform: none !important;
                animation: none !important;
              }
            `;
            clonedDoc.head.appendChild(extraStyle);

            const clonedElement = clonedDoc.getElementById('layout-print-content') || clonedDoc.querySelector('.p-6.space-y-6.font-sans');
            if (clonedElement) {
              // Reset parent container background and text color to white & black
              (clonedElement as HTMLElement).style.setProperty('background', '#ffffff', 'important');
              (clonedElement as HTMLElement).style.setProperty('background-color', '#ffffff', 'important');
              (clonedElement as HTMLElement).style.setProperty('color', '#000000', 'important');

              const allClonedNodes = clonedElement.querySelectorAll('*');
              allClonedNodes.forEach((node: any) => {
                const htmlNode = node as HTMLElement;
                const classStr = htmlNode.className || '';
                
                if (typeof classStr === 'string') {
                  // Replace dark blue/slate backgrounds with high-contrast light borders/backgrounds
                  if (
                    classStr.includes('bg-indigo-950') ||
                    classStr.includes('bg-indigo-900') ||
                    classStr.includes('bg-slate-900') ||
                    classStr.includes('bg-zinc-900') ||
                    classStr.includes('bg-gray-900') ||
                    classStr.includes('bg-gray-850') ||
                    classStr.includes('from-indigo-950') ||
                    classStr.includes('from-[#0B1F3F]') ||
                    classStr.includes('from-[#0b1f3f]') ||
                    classStr.includes('bg-[#0B1F3F]') ||
                    classStr.includes('bg-[#0b1f3f]') ||
                    classStr.includes('from-slate-900')
                  ) {
                    htmlNode.style.setProperty('background', '#f8fafc', 'important');
                    htmlNode.style.setProperty('background-color', '#f8fafc', 'important');
                    htmlNode.style.setProperty('color', '#000000', 'important');
                    htmlNode.style.setProperty('border', '1px solid #cbd5e1', 'important');
                  }

                  // Force white or near-white text elements to dark gray so they print clearly on the white theme
                  if (
                    classStr.includes('text-white') ||
                    classStr.includes('text-indigo-100') ||
                    classStr.includes('text-indigo-250') ||
                    classStr.includes('text-indigo-200') ||
                    classStr.includes('text-indigo-300') ||
                    classStr.includes('text-slate-100') ||
                    classStr.includes('text-slate-205') ||
                    classStr.includes('text-slate-300') ||
                    classStr.includes('text-slate-350') ||
                    classStr.includes('text-zinc-100') ||
                    classStr.includes('text-gray-100') ||
                    classStr.includes('text-[#F26522]') ||
                    classStr.includes('text-[#f26522]') ||
                    classStr.includes('text-orange-400') ||
                    classStr.includes('text-emerald-400') ||
                    classStr.includes('text-emerald-450') ||
                    classStr.includes('text-teal-350') ||
                    classStr.includes('text-teal-400')
                  ) {
                    htmlNode.style.setProperty('color', '#0f172a', 'important');
                  }
                }

                // If element has style with color white/indigo-100/etc, overwrite it with high contrast dark font
                if (htmlNode.style.color && (
                  htmlNode.style.color.includes('255, 255, 255') || 
                  htmlNode.style.color.includes('#fff') || 
                  htmlNode.style.color.includes('white')
                )) {
                  htmlNode.style.setProperty('color', '#0f172a', 'important');
                }
              });
            }
          }
        }
      });

      document.body.removeChild(toastDiv);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const activeViewSlug = activeTab.toLowerCase().replace('/', '_');
      pdf.save(`rapport_kissineflow_${activeViewSlug}_${activeTenant.name.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
      logsAction(`Rapport officiel PDF extrait pour le module ${activeTab}`, 'ADMINISTRATION');

    } catch (err: any) {
      console.error("Erreur d'impression PDF :", err);
      alert("Impossible de compléter l'impression system : " + err.message);
    } finally {
      // Restore window getComputedStyle
      window.getComputedStyle = originalGetComputedStyle;

      // Restore styles sheets (re-enabling original oklch values for user display rendering)
      styleTags.forEach((tag, idx) => {
        tag.innerHTML = originalStyles[idx];
      });

      // Remove temporary styles and restore link stylesheets
      tempStyles.forEach(tag => {
        if (tag.parentNode) {
          tag.parentNode.removeChild(tag);
        }
      });
      originalLinks.forEach(({ link, disabled }) => {
        link.disabled = disabled;
      });

      // Restore inline element styles
      originalInlineStyles.forEach(({ element: el, style }) => {
        el.style.cssText = style;
      });

      // Re-enable hidden elements to previous display values
      nonPrintableElements.forEach((el: any, idx) => {
        el.style.display = originalDisplays[idx];
      });
      // Restore previous styling properties
      element.removeChild(printHeader);
      element.style.cssText = originalStyle;
    }
  };

  // CALLBACK: Add new dish
  const handleAddDish = (dish: Dish) => {
    setDishes(prev => [...prev, dish]);
  };

  // CALLBACK: Add new ingredient raw material
  const handleAddIngredient = (ing: Ingredient) => {
    setIngredients(prev => [...prev, ing]);
  };

  const handleUpdateIngredient = (updated: Ingredient) => {
    setIngredients(prev => prev.map(i => i.id === updated.id ? updated : i));
  };

  const handleDeleteIngredient = (id: string) => {
    setIngredients(prev => prev.filter(i => i.id !== id));
  };

  // CALLBACK: Add recipe ingredient ratio link (BOM)
  const handleAddRecipe = (rec: Recipe) => {
    setRecipes(prev => [...prev, rec]);
  };

  // CALLBACK: Add physical audit inventory adjustments
  const handleValidateInventory = (inv: PhysicalInventory, adjustments: StockMovement[]) => {
    setPhysicalInventories(prev => [inv, ...prev]);
    // Apply adjusting stock movements to system
    if (adjustments.length > 0) {
      setStockMovements(prev => [...prev, ...adjustments]);
      // Mutate current quantities in main ingredients list
      setIngredients(prevIngredients => {
        return prevIngredients.map(ing => {
          const adj = adjustments.find(a => a.ingredientId === ing.id);
          if (adj) {
            return {
              ...ing,
              stockActual: ing.stockActual + adj.quantity
            };
          }
          return ing;
        });
      });
    }
  };

  // CALLBACK: Log manual stock movement additions
  const handleAddStockMovement = (mvt: StockMovement) => {
    setStockMovements(prev => [...prev, mvt]);
    setIngredients(prevIngredients => {
      return prevIngredients.map(ing => {
        if (ing.id === mvt.ingredientId) {
          const updatedStock = ing.stockActual + mvt.quantity;
          return {
            ...ing,
            stockActual: Math.max(0, updatedStock)
          };
        }
        return ing;
      });
    });
  };

  // CALLBACK: Generate supplier Purchase order (BC)
  const handleAddPurchaseOrder = (po: PurchaseOrder) => {
    setPurchaseOrders(prev => [...prev, po]);
  };

  // CALLBACK: Validate supplier deliveries (recalculate Weighted Cost CMP on the fly!)
  const handleUpdatePurchaseOrderStatus = (
    poId: string,
    status: 'DRAFT' | 'SENT' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED',
    receivedLines?: any[],
    batchInfos?: { [ingredientId: string]: { batchNum: string; expiryDate: string; qtyReceived: number } }
  ) => {
    // 1. Update order lines status
    setPurchaseOrders(prevOrders => {
      return prevOrders.map(po => {
        if (po.id === poId) {
          return {
            ...po,
            status,
            lines: receivedLines || po.lines
          };
        }
        return po;
      });
    });

    // Create stock batches for traceability
    if (batchInfos) {
      const newBatches: StockBatch[] = [];
      Object.entries(batchInfos).forEach(([ingredientId, info]) => {
        const item = receivedLines?.find(l => l.ingredientId === ingredientId);
        if (item && info.qtyReceived > 0) {
          newBatches.push({
            id: `batch-${Date.now()}-${ingredientId}`,
            ingredientId,
            ingredientName: item.ingredientName,
            batchNum: info.batchNum,
            dateReceived: new Date().toISOString().slice(0, 10),
            quantity: info.qtyReceived,
            unit: item.unit,
            expiryDate: info.expiryDate,
            tenantId: activeTenantId
          });
        }
      });
      if (newBatches.length > 0) {
        setStockBatches(prev => [...newBatches, ...prev]);
      }
    }

    // 2. Identify the order to compute stock additions
    const targetPO = purchaseOrders.find(po => po.id === poId);
    if (!targetPO || !receivedLines) return;

    // Compile stock arrivals
    const stockAdditions: StockMovement[] = [];
    
    // Mutate ingredients stock and Weighted average prices (CMP!)
    setIngredients(prevIngredients => {
      return prevIngredients.map(ing => {
        // Find if this ingredient exists in the received delivery lines
        const recLine = receivedLines.find(line => line.ingredientId === ing.id);
        if (recLine) {
          // calculate portion arrived in this execution (difference between previously received vs recently logged)
          const previouslyArrived = targetPO.lines.find(l => l.ingredientId === ing.id)?.quantityReceived || 0;
          const newlyArrivedQty = recLine.quantityReceived - previouslyArrived;

          if (newlyArrivedQty > 0) {
            // Write standard Arrival movement log
            const newCost = recLine.lastPrice || ing.lastPurchasePrice || 0;
            stockAdditions.push({
              id: `mov-rec-${Date.now()}-${ing.id}`,
              date: new Date().toISOString().replace('T', ' ').slice(0, 16),
              ingredientId: ing.id,
              ingredientName: ing.name,
              type: 'IN',
              quantity: newlyArrivedQty,
              unitCost: newCost,
              value: newlyArrivedQty * newCost,
              reference: targetPO.number,
              userId: activeUser.id,
              userName: activeUser.name,
              comment: `Réception de marchandises de ${targetPO.supplierName}`,
              tenantId: activeTenantId
            });

            // Weighted average cost (CMP) recalculations formula:
            // CMP_new = ((Stock_current * CMP_old) + (Qty_arrived * Cost_arrived)) / (Stock_current + Qty_arrived)
            const currentStock = ing.stockActual;
            const currentCmp = ing.cmp || ing.lastPurchasePrice || 0;
            const denominator = currentStock + newlyArrivedQty;
            
            let recalculatedCmp = currentCmp;
            if (denominator > 0) {
              recalculatedCmp = Math.round(((currentStock * currentCmp) + (newlyArrivedQty * newCost)) / denominator);
            }

            return {
              ...ing,
              stockActual: denominator,
              cmp: recalculatedCmp,
              lastPurchasePrice: newCost
            };
          }
        }
        return ing;
      });
    });

    // Save stock movement logs into registry
    if (stockAdditions.length > 0) {
      setStockMovements(prev => [...prev, ...stockAdditions]);
    }
  };

  // CALLBACK: Add chef requisitions requested by kitchen staff
  const handleAddPurchaseRequest = (pr: PurchaseRequest) => {
    setPurchaseRequests(prev => [...prev, pr]);
  };

  // CALLBACK: Approve Chef requisition
  const handleApprovePurchaseRequest = (prId: string, convertedBC?: PurchaseOrder) => {
    setPurchaseRequests(prev => {
      return prev.map(pr => {
        if (pr.id === prId) {
          return { ...pr, status: 'CONVERTED' };
        }
        return pr;
      });
    });

    if (convertedBC) {
      setPurchaseOrders(prev => [...prev, convertedBC]);
    }
  };

  // CALLBACK: Log manual financial cash/bank movement entries
  const handleAddCashMovement = (mvt: CashRegisterMovement) => {
    setCashMovements(prev => [...prev, mvt]);
  };

  // CALLBACK: Log daily business closures
  const handleAddDailyClosure = (closure: DailyClosure) => {
    setDailyClosures(prev => [...prev, closure]);
  };

  // CALLBACK: Lock orders checklist on daily closure
  const handleLockOrdersStatus = (date: string) => {
    setOrders(prevOrders => {
      return prevOrders.map(o => {
        if (o.date === date && o.status === 'VALIDATED') {
          return { ...o, status: 'CLOSED' };
        }
        return o;
      });
    });
  };

  // CALLBACKS: Finance Expenses module
  const handleAddExpense = (expense: Expense) => {
    const upgraded = [...expenses, expense];
    saveExpenses(upgraded);
    logsAction(`Création de la dépense ${expense.id} (Cat: ${expense.category}, Montant: ${expense.amountTtc} FCFA)`, "FINANCE");
  };

  const handleUpdateExpense = (expense: Expense) => {
    const upgraded = expenses.map(e => e.id === expense.id ? expense : e);
    saveExpenses(upgraded);
    logsAction(`Mise à jour de la dépense ${expense.id}`, "FINANCE");
  };

  const handleDeleteExpense = (id: string) => {
    const upgraded = expenses.filter(e => e.id !== id);
    saveExpenses(upgraded);
    logsAction(`Suppression de la dépense ${id}`, "FINANCE");
  };

  // CALLBACK: Add user account
  const handleAddUser = (u: User) => {
    setUsers(prev => [...prev, u]);
  };

  // CALLBACK: Toggle active state of employee
  const handleUpdateUser = (u: User) => {
    setUsers(prev => prev.map(item => item.id === u.id ? u : item));
  };

  // CALLBACK: Update active tenant configurations
  const handleUpdateTenant = (t: Tenant) => {
    setTenants(prev => prev.map(item => item.id === t.id ? t : item));
  };

  // CALLBACK: Self-service password modification
  const handleUpdateMyPassword = (newPass: string) => {
    const updatedUsers = users.map(u => u.id === activeUserId ? { ...u, password: newPass } : u);
    setUsers(updatedUsers);
    localStorage.setItem('erp-users', JSON.stringify(updatedUsers));
    logsAction(`Changement de mot de passe par l'utilisateur ${activeUser.name}`, 'SÉCURITÉ');
  };

  // CALLBACK: Validate and complete POS Cashier orders submissions 
  const handleAddOrder = (order: Order) => {
    setOrders(prev => [order, ...prev]);
  };

  // CALLBACK: Decrement Stocks during POS Checkout
  const handleUpdateStocksAndCMP = (updates: { ingredientId: string; quantityToDecrement: number }[]) => {
    if (updates.length > 0) {
      const saleMovementsObj: StockMovement[] = [];
      
      setIngredients(prevIngredients => {
        return prevIngredients.map(ing => {
          const dec = updates.find(d => d.ingredientId === ing.id);
          if (dec && dec.quantityToDecrement > 0) {
            const standardCost = ing.cmp || ing.lastPurchasePrice || 0;
            const updatedStockActual = Math.max(0, ing.stockActual - dec.quantityToDecrement);

            saleMovementsObj.push({
              id: `mov-sale-${Date.now()}-${ing.id}`,
              date: new Date().toISOString().replace('T', ' ').slice(0, 16),
              ingredientId: ing.id,
              ingredientName: ing.name,
              type: 'SALE',
              quantity: -dec.quantityToDecrement, // minus quantity represents decreasing movement
              unitCost: standardCost,
              value: -dec.quantityToDecrement * standardCost,
              reference: 'VENTE-POS-TACTILE',
              userId: activeUser.id,
              userName: activeUser.name,
              comment: `Sortie de stock automatique - vente de plats`,
              tenantId: activeTenantId
            });

            return {
              ...ing,
              stockActual: updatedStockActual
            };
          }
          return ing;
        });
      });

      if (saleMovementsObj.length > 0) {
        setStockMovements(prev => [...prev, ...saleMovementsObj]);
      }
    }
  };

  // CALLBACK: Process orders cancelllation (re-increments ingredients stock sheets)
  const handleCancelOrder = (
    orderId: string,
    motif: string,
    restoredIngredients: { ingredientId: string; quantityToRestore: number }[]
  ) => {
    // 1. Update order status to CANCELLED in main database
    setOrders(prev => {
      return prev.map(o => {
        if (o.id === orderId) {
          return { ...o, status: 'CANCELLED' };
        }
        return o;
      });
    });

    // 2. Restitute ingredients portions back into warehouse stock
    if (restoredIngredients.length > 0) {
      const returnMovementsObj: StockMovement[] = [];

      setIngredients(prevIngredients => {
        return prevIngredients.map(ing => {
          const ret = restoredIngredients.find(r => r.ingredientId === ing.id);
          if (ret && ret.quantityToRestore > 0) {
            const standardCost = ing.cmp || ing.lastPurchasePrice || 0;
            const restoredStockValue = ing.stockActual + ret.quantityToRestore;

            returnMovementsObj.push({
              id: `mov-ret-${Date.now()}-${ing.id}`,
              date: new Date().toISOString().replace('T', ' ').slice(0, 16),
              ingredientId: ing.id,
              ingredientName: ing.name,
              type: 'CANCEL',
              quantity: ret.quantityToRestore, // Positive restitution value
              unitCost: standardCost,
              value: ret.quantityToRestore * standardCost,
              reference: `ANNUL-${orderId.slice(-4).toUpperCase()}`,
              userId: activeUser.id,
              userName: activeUser.name,
              comment: `Annulation : ${motif}`,
              tenantId: activeTenantId
            });

            return {
              ...ing,
              stockActual: restoredStockValue
            };
          }
          return ing;
        });
      });

      if (returnMovementsObj.length > 0) {
        setStockMovements(prev => [...prev, ...returnMovementsObj]);
      }
    }
  };

  // ----------------------------------------------------
  // EXPERT SECURITY ROLE AND ACCESS PERMISSIONS (RBAC)
  // ----------------------------------------------------
  const hasAccessToTab = (tab: typeof activeTab) => {
    // If the user has custom allowedModules explicitly specified, we respect that list!
    if (activeUser.allowedModules && activeUser.allowedModules.length > 0) {
      return activeUser.allowedModules.includes(tab);
    }

    const role = activeUser.role;
    if (role === 'ADMIN' || role === 'MANAGER') return true; // full global visibility
    
    switch (tab) {
      case 'DASHBOARD':
        return role === 'ACCOUNTING' || role === 'ADMIN' || role === 'MANAGER';
      case 'POS':
        return role === 'CASHIER' || role === 'ADMIN' || role === 'MANAGER';
      case 'ORDERS':
        return role === 'CASHIER' || role === 'ADMIN' || role === 'MANAGER';
      case 'CATALOGUE':
        return role === 'ADMIN' || role === 'MANAGER';
      case 'STOCKS':
        return role === 'WAREHOUSE' || role === 'ADMIN' || role === 'MANAGER';
      case 'PURCHASES':
        return role === 'WAREHOUSE' || role === 'ADMIN' || role === 'MANAGER';
      case 'ACCOUNTING':
        return role === 'ACCOUNTING' || role === 'ADMIN' || role === 'MANAGER';
      case 'FINANCE':
        return role === 'ACCOUNTING' || role === 'ADMIN' || role === 'MANAGER';
      case 'BILAN':
        return role === 'ACCOUNTING' || role === 'ADMIN' || role === 'MANAGER';
      case 'ADMIN':
        return role === 'ADMIN';
      case 'SETTINGS':
        return role === 'ADMIN' || role === 'MANAGER';
      case 'PRESTATIONS':
        return role === 'ACCOUNTING' || role === 'ADMIN' || role === 'MANAGER';
      default:
        return false;
    }
  };

  // Render responsive Tab styling
  const sidebarItemClass = (tab: typeof activeTab) => {
    const isActive = activeTab === tab;
    const isAllowed = hasAccessToTab(tab);

    if (!isAllowed) {
      return "hidden"; // Hide restricted options strictly to provide neat user interfaces
    }

    return `w-full px-4 py-3 rounded-lg text-xs leading-none flex items-center justify-between transition-all ${
      isActive
        ? 'bg-[#0B1F3F] text-white shadow-xs font-extrabold border-l-4 border-[#F26522]'
        : 'text-gray-600 hover:bg-slate-50 hover:text-gray-900 font-bold'
    }`;
  };

  if (!isUnlocked) {
    const activeUser = users.find(u => u.id === activeUserId) || users[0];
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center font-sans selection:bg-slate-800 antialiased text-gray-100 p-4" id="kissineflow-lockscreen">
        <div className="max-w-md w-full bg-slate-950 p-8 border border-slate-850 rounded-2xl shadow-2xl space-y-6 relative overflow-hidden">
          {/* Subtle light effect top */}
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 animate-pulse"></div>

          <div className="flex flex-col items-center text-center space-y-3 pb-2">
            <div className="p-2 bg-white rounded-2xl border border-white/10 shadow-lg select-none">
              <LogoIcon size={80} />
            </div>
            <LogoFull size={38} showSlogan={true} lightMode={true} className="mt-1" />
            <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded font-mono font-black uppercase tracking-wider block mt-1">
              Terminal Sécurisé d'Exploitation
            </span>
          </div>

          <form onSubmit={handleUnlockApp} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs text-slate-350 font-bold block">Sélectionnez votre Profil d'Utilisateur</label>
              <select
                id="lockscreen-user-select"
                value={activeUserId}
                onChange={(e) => {
                  setActiveUserId(e.target.value);
                  setPasswordError('');
                  setPasswordInput('');
                }}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-750 text-slate-100 rounded-lg text-xs font-bold focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {tenants.map(t => {
                  const tenantUsers = users.filter(u => u.tenantId === t.id);
                  if (tenantUsers.length === 0) return null;
                  return (
                    <optgroup key={t.id} label={`Collaborateurs ${t.name} (${t.city})`}>
                      {tenantUsers.map(u => (
                        <option key={u.id} value={u.id} className="bg-slate-950 text-white font-bold">{u.name} ({u.role})</option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-300 font-bold block">Saisissez le mot de passe de {activeUser.name}</label>
              <div className="relative">
                <input
                  id="lockscreen-password-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Saisissez le mot de passe"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full pl-3 pr-10 py-3 bg-slate-900 border border-slate-750 rounded-lg text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 font-mono tracking-widest text-center"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-300 transition focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {passwordError && (
              <p className="text-xs text-red-400 font-semibold bg-red-950/40 border border-red-900/30 p-2 rounded-lg text-center">
                {passwordError}
              </p>
            )}

            {/* Demo guidance so they can test easily */}
            <div className="text-[10px] text-amber-300 bg-amber-950/20 border border-amber-900/35 p-2.5 rounded-lg leading-relaxed select-none">
              <p className="font-extrabold text-amber-400">💡 Indication de démonstration :</p>
              <p className="text-amber-200 mt-0.5">Le mot de passe de <span className="font-bold">{activeUser.name}</span> est : <code className="bg-amber-950/40 px-1.5 py-0.5 rounded font-bold font-mono text-amber-300">{activeUser.password || 'password123'}</code></p>
            </div>

            <div className="flex items-center justify-between text-xs py-1">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-400 hover:text-slate-300 select-none">
                <input
                  type="checkbox"
                  checked={keepConnected}
                  onChange={(e) => setKeepConnected(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-900 text-blue-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <span>Rester connecté sur cet appareil</span>
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold font-sans tracking-wide transition shadow-md shadow-blue-900/20 active:translate-y-px cursor-pointer"
            >
              Déverrouiller le Terminal
            </button>
          </form>

          <div className="border-t border-slate-850 pt-4 text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 border border-slate-800 text-[11px] text-slate-400 rounded-full font-mono">
              <span className="text-yellow-500 font-bold uppercase tracking-widest text-[9px] px-1.5 py-0.5 bg-yellow-400/10 rounded mr-0.5 border border-yellow-500/25">Clé</span>
              <span>Clé Maître Admin : <span className="text-slate-200 font-bold font-mono">{appPassword}</span></span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2.5">
              Vous pouvez personnaliser le mot de passe maître de déverrouillage depuis les Paramètres locaux de l'établissement.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans selection:bg-blue-100 antialiased text-gray-900" id="kissineflow-app">
      
      {/* SaaS UTILITY SUPER-BAR (Tenant & Roles toggle controls) */}
      <div className="bg-gray-900 text-gray-300 text-xs px-4 py-2.5 flex flex-wrap gap-4 items-center justify-between border-b border-gray-800 shrink-0 select-none z-40">
        <div className="flex items-center gap-2 font-mono" id="saas-system-badge">
          <Database className="h-4 w-4 text-blue-400" />
          <span className="font-bold text-gray-200 uppercase tracking-widest text-[11px]">KissineFlow ERP SaaS Workspace</span>
        </div>

        {/* CONTROLS AREA */}
        <div id="saas-switchers" className="flex items-center gap-4 flex-wrap">
          {/* Tenant Selector (SaaS Multi sites Multi locations - Dynamic) */}
          <div className="flex items-center gap-1.5" id="tenant-picker">
            <span className="text-[10px] text-gray-400 uppercase font-semibold">Site Opérationnel :</span>
            <select
              id="tenant-select"
              value={activeTenantId}
              disabled={activeUser?.role !== 'ADMIN'}
              onChange={(e) => {
                setActiveTenantId(e.target.value);
                // switch to first user of of this site if the role is admin and switching sites
                const siteUsers = users.filter(u => u.tenantId === e.target.value);
                const adminForSite = siteUsers.find(u => u.role === 'ADMIN');
                if (adminForSite) {
                  setActiveUserId(adminForSite.id);
                } else if (siteUsers.length > 0) {
                  setActiveUserId(siteUsers[0].id);
                }
              }}
              className={`bg-gray-800 text-gray-100 p-1 border border-gray-700 text-[11px] rounded font-bold ${
                activeUser?.role !== 'ADMIN' ? 'opacity-65 cursor-not-allowed' : 'cursor-pointer'
              } focus:outline-none`}
              title={activeUser?.role !== 'ADMIN' ? "Seul l'Admin peut naviguer d'un site à un autre" : "Choisir un site opérationnel"}
            >
              {tenants.map(t => (
                <option key={t.id} value={t.id} className="bg-gray-905 text-white font-bold">📍 {t.name} ({t.city})</option>
              ))}
            </select>
            {activeUser?.role !== 'ADMIN' && (
              <span className="text-[9px] bg-red-950 text-red-400 px-1 py-0.5 rounded border border-red-800/30" title="Votre compte est affilié à ce site unique">Restreint</span>
            )}
          </div>

          <div className="h-4 w-[1px] bg-gray-800 hidden sm:block"></div>

          {/* Actor RBAC Role switcher */}
          <div className="flex items-center gap-1.5" id="user-role-picker">
            <span className="text-[10px] text-yellow-500 uppercase tracking-wider font-extrabold bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/25 flex items-center gap-1">
              <UserCheck className="h-3.5 w-3.5" />
              Profil Actif :
            </span>
            <select
              id="user-select"
              value={activeUserId}
              onChange={(e) => {
                const targetId = e.target.value;
                if (targetId === activeUserId) return;
                
                setPendingUserId(targetId);
                setPendingPasswordInput('');
                setPendingPasswordError('');
                setShowPendingPassword(false);
              }}
              className="bg-gray-800 text-gray-100 p-1 border border-gray-700 text-[11px] rounded font-bold cursor-pointer focus:outline-none"
            >
              {tenants.map(t => {
                const tenantUsers = users.filter(u => u.tenantId === t.id);
                if (tenantUsers.length === 0) return null;
                return (
                  <optgroup key={t.id} label={`Collaborateurs ${t.name} (${t.city})`}>
                    {tenantUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </div>

          <div className="h-4 w-[1px] bg-gray-800"></div>

          {/* Action lock button */}
          <button
            onClick={handleLockApp}
            className="flex items-center gap-1 bg-red-950 hover:bg-red-900 border border-red-800 hover:border-red-700 text-red-200 text-[11px] font-bold px-2.5 py-1 rounded transition focus:outline-none active:translate-y-px cursor-pointer"
            title="Verrouiller le terminal de caisse"
          >
            <LockKeyhole className="h-3.5 w-3.5" />
            <span>Verrouiller</span>
          </button>
        </div>
      </div>

      {/* CORE FRAMEWORK WORKSPACE */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 relative">
        
        {/* SIDE NAV COODINATOR */}
        <div id="sidebar-navigation" className={`bg-white border-r border-gray-150 flex flex-col justify-between shrink-0 transition-all duration-300 z-30 ${
          sidebarOpen ? 'w-full md:w-64' : 'w-0 overflow-hidden'
        }`}>
          <div className="p-5 flex flex-col space-y-6">
            
            {/* Logotype Branding */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex flex-col gap-1.5 overflow-hidden">
                <LogoFull size={38} showSlogan={true} />
                <p className="text-[10px] text-orange-600 font-bold tracking-wide pl-1">{activeTenant.raisonSociale}</p>
              </div>
              
              {/* Responsive collapse bar */}
              <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1.5 hover:bg-slate-50 border border-transparent hover:border-slate-150 rounded text-gray-450 self-start">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Nav anchors */}
            <nav className="flex flex-col gap-1">
              <button onClick={() => setActiveTab('DASHBOARD')} className={sidebarItemClass('DASHBOARD')}>
                <span className="flex items-center gap-2.5">
                  <LayoutDashboard className="h-4 w-4" />
                  Tableau de Bord BI
                </span>
                <ChevronRight className="h-3 w-3 opacity-50" />
              </button>

              <button onClick={() => setActiveTab('POS')} className={sidebarItemClass('POS')} id="sidebar-pos-anchor">
                <span className="flex items-center gap-2.5">
                  <Calculator className="h-4 w-4" />
                  Caisse Tactile POS
                </span>
                <span className="px-1.5 py-0.3 bg-yellow-400 text-slate-950 font-mono text-[9px] font-bold rounded">Live</span>
              </button>

              <button onClick={() => setActiveTab('ORDERS')} className={sidebarItemClass('ORDERS')}>
                <span className="flex items-center gap-2.5">
                  <ShoppingBag className="h-4 w-4" />
                  Commandes tickets
                </span>
                <ChevronRight className="h-3 w-3 opacity-50" />
              </button>

              <button onClick={() => setActiveTab('CATALOGUE')} className={sidebarItemClass('CATALOGUE')}>
                <span className="flex items-center gap-2.5">
                  <ListCollapse className="h-4 w-4" />
                  Catalogue & Filles Recettes
                </span>
                <ChevronRight className="h-3 w-3 opacity-50" />
              </button>

              <button onClick={() => setActiveTab('STOCKS')} className={sidebarItemClass('STOCKS')}>
                <span className="flex items-center gap-2.5">
                  <Layers className="h-4 w-4" />
                  Actifs & Valorisation Stock
                </span>
                <ChevronRight className="h-3 w-3 opacity-50" />
              </button>

              <button onClick={() => setActiveTab('PURCHASES')} className={sidebarItemClass('PURCHASES')}>
                <span className="flex items-center gap-2.5">
                  <Truck className="h-4 w-4" />
                  Chaîne d'Achat (BC / BL)
                </span>
                <ChevronRight className="h-3 w-3 opacity-50" />
              </button>

              <button onClick={() => setActiveTab('ACCOUNTING')} className={sidebarItemClass('ACCOUNTING')}>
                <span className="flex items-center gap-2.5">
                  <Coins className="h-4 w-4" />
                  Compta & Clôtures Actives
                </span>
                <ChevronRight className="h-3 w-3 opacity-50" />
              </button>

              <button onClick={() => setActiveTab('FINANCE')} className={sidebarItemClass('FINANCE')} id="sidebar-finance-anchor">
                <span className="flex items-center gap-2.5">
                  <Coins className="h-4 w-4 text-emerald-600" />
                  Gestion Dépenses & Finance
                </span>
                <ChevronRight className="h-3 w-3 opacity-50" />
              </button>

              <button onClick={() => setActiveTab('BILAN')} className={sidebarItemClass('BILAN')} id="sidebar-bilan-anchor">
                <span className="flex items-center gap-2.5">
                  <Building2 className="h-4 w-4 text-purple-600" />
                  Compte de Résultat & Bilan
                </span>
                <ChevronRight className="h-3 w-3 opacity-50" />
              </button>

              <button onClick={() => setActiveTab('PRESTATIONS')} className={sidebarItemClass('PRESTATIONS')} id="sidebar-prestations-anchor">
                <span className="flex items-center gap-2.5">
                  <UtensilsCrossed className="h-4 w-4 text-orange-600" />
                  Prestations & Objectifs
                </span>
                <ChevronRight className="h-3 w-3 opacity-50" />
              </button>

              <button onClick={() => setActiveTab('ADMIN')} className={sidebarItemClass('ADMIN')}>
                <span className="flex items-center gap-2.5">
                  <ShieldCheck className="h-4 w-4" />
                  Administration audits
                </span>
                <ChevronRight className="h-3 w-3 opacity-50" />
              </button>

              <button onClick={() => setActiveTab('SETTINGS')} className={sidebarItemClass('SETTINGS')} id="sidebar-settings-anchor">
                <span className="flex items-center gap-2.5">
                  <Settings className="h-4 w-4" />
                  Paramètres Système
                </span>
                <ChevronRight className="h-3 w-3 opacity-50" />
              </button>

              <button onClick={() => setActiveTab('ABOUT')} className={sidebarItemClass('ABOUT')} id="sidebar-about-anchor">
                <span className="flex items-center gap-2.5">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  A Propos : KISSINE FLOW™
                </span>
                <ChevronRight className="h-3 w-3 opacity-50" />
              </button>
            </nav>
          </div>

          <div className="p-5 border-t border-gray-150 bg-gray-50/50 space-y-3">
            <div className="flex items-center gap-2">
              <div className="bg-[#1E4E8C]/10 h-8 w-8 rounded-full flex items-center justify-center font-bold text-[#1E4E8C] text-xs">
                {activeUser.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="text-[11px] truncate">
                <p className="font-bold text-gray-900 leading-none">{activeUser.name}</p>
                <p className="text-gray-400 font-normal leading-none mt-1">Role: <strong className="text-gray-600">{activeUser.role}</strong></p>
              </div>
            </div>

            <button
              id="btn-self-security-password"
              onClick={() => {
                setMyNewPassword('');
                setMyNewPasswordConfirm('');
                setMyPasswordError('');
                setShowMyPasswordModal(true);
              }}
              className="w-full py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-850 text-[10px] font-black border border-slate-200 rounded-lg flex items-center justify-center gap-1.5 transition duration-150 cursor-pointer shadow-3xs active:translate-y-px"
              title="Modifier personnellement votre mot de passe de connexion"
            >
              <KeyRound className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <span>Modifier mon mot de passe</span>
            </button>
          </div>
        </div>

        {/* CORE WORK COMPONENT (Pristine grid layouts) */}
        <main className="flex-1 flex flex-col min-h-0 min-w-0" id="master-work-grid">
          
          {/* Main header navbar elements */}
          <header className="bg-white border-b border-gray-150 px-6 py-4 flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1 px-2.5 bg-gray-50 text-gray-500 rounded border hover:bg-gray-100 flex items-center gap-1 text-xs"
              >
                <Menu className="h-4 w-4" />
                <span className="hidden sm:inline font-bold">Fermer Menu</span>
              </button>

              <NotificationCenter
                tenantId={activeTenantId}
                activeUser={activeUser}
                orders={orders}
                purchaseRequests={purchaseRequests}
                purchaseOrders={purchaseOrders}
              />
              
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-gray-500 uppercase">Kissineflow v1.2</span>
                <span className="px-1.5 py-0.3 bg-blue-50 text-[#1E4E8C] rounded font-mono text-[9px] font-semibold border border-blue-105">PROD</span>
              </div>
            </div>

            {/* active metadata */}
            <div className="flex items-center gap-4">
              <button
                id="btn-global-export-pdf"
                onClick={handleGlobalExportPDF}
                className="px-3 py-2 bg-[#1E4E8C] text-white hover:bg-blue-800 rounded border border-[#1E4E8C] hover:border-blue-800 flex items-center justify-center gap-1.5 text-xs font-extrabold cursor-pointer select-none transition shadow-2xs print:hidden active:scale-95"
                title="Exporter le contenu de la page en PDF"
              >
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Exporter (PDF/Imprimer)</span>
              </button>

              <div className="text-right text-[11px] text-gray-500 flex items-center gap-3">
                <div className="hidden lg:block leading-none">
                  <p className="font-semibold text-gray-800">Caisse active du <span className="text-[#1E4E8C] font-bold">2026-06-11</span></p>
                  <p className="mt-1 font-serif italic text-gray-400 text-[10px]">Devise standard : FCFA</p>
                </div>
                <div className="h-6 w-[1px] bg-gray-200 hidden lg:block"></div>
                <div className="flex items-center gap-1 text-[#1E4E8C] font-bold">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="truncate max-w-[120px]">{activeTenant.name}</span>
                </div>
              </div>
            </div>
          </header>

          {/* INTERNAL ROUTING VIEW RENDERPORT */}
          <div className="flex-1 overflow-y-auto p-6 md:p-8" id="layout-print-content">
            {/* PRINT-ONLY HEADER */}
            <div className="hidden print:block border-b-2 border-[#0B1F3F] pb-5 mb-8">
              <div className="flex justify-between items-center">
                <LogoFull size={48} showSlogan={true} />
                <div className="text-right text-xs text-gray-800 space-y-1 font-sans font-semibold">
                  <p className="text-xs bg-slate-100 px-2 py-1 rounded inline-block font-mono font-bold text-gray-950 uppercase border">EXPORT DE CONTEXTE RÉGLEMENTAIRE</p>
                  <p>Restaurant : <span className="font-mono font-black text-gray-950">RESTAURANT KISSINE</span></p>
                  <p>Site Opérationnel : <span className="font-mono font-black text-[#0B1F3F]">{activeTenant.name}</span></p>
                  <p>Adresse : <span className="font-mono text-gray-650 italic">{activeTenant.address || "Adresse non configurée"}, {activeTenant.city}</span></p>
                  <p>Téléphone : <span className="font-mono text-gray-650">{activeTenant.phone || "---"}</span></p>
                  <p>Date d'extraction : <span className="font-mono font-black text-gray-950">{new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span></p>
                </div>
              </div>
            </div>
            {activeTab === 'DASHBOARD' && (
              <DashboardView
                orders={orders}
                dishes={dishes}
                ingredients={ingredients}
                auditLogs={auditLogs}
                dailyClosures={dailyClosures}
                tenantId={activeTenantId}
                expenses={expenses}
                suppliers={suppliers}
                purchaseOrders={purchaseOrders}
                purchaseRequests={purchaseRequests}
                cashMovements={cashMovements}
                dishCategories={dishCategories}
                chargeTypes={chargeTypes}
                activeUser={activeUser}
                stockBatches={stockBatches}
                onNavigateToAudit={() => {
                  setActiveTab('ADMIN');
                  setAdminActiveSubTab('AUDIT');
                }}
              />
            )}

            {activeTab === 'POS' && (
              <POSView
                dishes={dishes}
                categories={dishCategories}
                ingredients={ingredients}
                recipes={recipes}
                onAddOrder={handleAddOrder}
                onUpdateStocksAndCMP={handleUpdateStocksAndCMP}
                activeUser={activeUser}
                logsAction={logsAction}
                tenantId={activeTenantId}
                activeTenant={activeTenant}
                paymentMethods={paymentMethods}
                isDayStarted={isDayStarted}
              />
            )}

            {activeTab === 'ORDERS' && (
              <OrdersView
                orders={orders}
                dishes={dishes}
                recipes={recipes}
                ingredients={ingredients}
                onCancelOrder={handleCancelOrder}
                activeUser={activeUser}
                logsAction={logsAction}
                tenantId={activeTenantId}
                activeTenant={activeTenant}
              />
            )}

            {activeTab === 'CATALOGUE' && (
              <CatalogueView
                dishes={dishes}
                categories={dishCategories}
                ingredients={ingredients}
                recipes={recipes}
                onAddDish={handleAddDish}
                onUpdateDish={(updated) => setDishes(prev => prev.map(d => d.id === updated.id ? updated : d))}
                onDeleteDish={(dishId) => setDishes(prev => prev.filter(d => d.id !== dishId))}
                onAddIngredient={handleAddIngredient}
                onUpdateRecipe={(recipeId, lines) => setRecipes(prev => prev.map(r => r.id === recipeId ? { ...r, lines } : r))}
                onAddRecipe={handleAddRecipe}
                onChangeCategories={setDishCategories}
                logsAction={logsAction}
                tenantId={activeTenantId}
                unitsOfMeasurement={unitsOfMeasurement}
                onUpdateIngredient={handleUpdateIngredient}
                onDeleteIngredient={handleDeleteIngredient}
                ingredientCategories={ingredientCategories}
              />
            )}

            {activeTab === 'STOCKS' && (
              <StocksView
                ingredients={ingredients}
                stockMovements={stockMovements}
                physicalInventories={physicalInventories}
                stockBatches={stockBatches}
                onAddStockMovement={handleAddStockMovement}
                onValidateInventory={handleValidateInventory}
                logsAction={logsAction}
                tenantId={activeTenantId}
                activeUser={activeUser}
                onUpdateStockBatches={setStockBatches}
              />
            )}

            {activeTab === 'PURCHASES' && (
              <PurchasesView
                suppliers={suppliers}
                ingredients={ingredients}
                purchaseOrders={purchaseOrders}
                purchaseRequests={purchaseRequests}
                onAddPurchaseOrder={handleAddPurchaseOrder}
                onUpdatePurchaseOrderStatus={handleUpdatePurchaseOrderStatus}
                onAddPurchaseRequest={handleAddPurchaseRequest}
                onApprovePurchaseRequest={handleApprovePurchaseRequest}
                onUpdateSuppliers={setSuppliers}
                onUpdatePurchaseRequests={setPurchaseRequests}
                onUpdatePurchaseOrders={setPurchaseOrders}
                logsAction={logsAction}
                tenantId={activeTenantId}
                activeUser={activeUser}
              />
            )}

            {activeTab === 'ACCOUNTING' && (
              <AccountingView
                cashMovements={cashMovements}
                dailyClosures={dailyClosures}
                orders={orders}
                stockMovements={stockMovements}
                isDayStarted={isDayStarted}
                onStartDay={handleStartDay}
                onAddCashMovement={handleAddCashMovement}
                onAddDailyClosure={handleAddDailyClosure}
                onLockOrders={handleLockOrdersStatus}
                onUpdateCashMovements={setCashMovements}
                onUpdateDailyClosures={setDailyClosures}
                logsAction={logsAction}
                tenantId={activeTenantId}
                activeUser={activeUser}
                onResetDailyClosure={handleResetDailyClosure}
                dishes={dishes}
              />
            )}

            {activeTab === 'FINANCE' && (
              <FinanceView
                expenses={expenses}
                onAddExpense={handleAddExpense}
                onUpdateExpense={handleUpdateExpense}
                onDeleteExpense={handleDeleteExpense}
                chargeTypes={chargeTypes}
                tenantId={activeTenantId}
                activeUser={activeUser}
                logsAction={logsAction}
              />
            )}

            {activeTab === 'BILAN' && (
              <BilanView
                orders={orders}
                expenses={expenses}
                chargeTypes={chargeTypes}
                tenantId={activeTenantId}
                dishes={dishes}
                stockBatches={stockBatches}
              />
            )}

            {activeTab === 'PRESTATIONS' && (
              <PrestationsView
                tenantId={activeTenantId}
                ingredients={ingredients}
                orders={orders}
                onUpdateIngredients={setIngredients}
                onAddStockMovement={(mov) => setStockMovements(prev => [...prev, mov])}
                logsAction={logsAction}
              />
            )}

            {activeTab === 'ADMIN' && (
              <AdminView
                users={users}
                auditLogs={auditLogs}
                tenants={tenants}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                onUpdateTenant={handleUpdateTenant}
                onUpdateAuditLogs={setAuditLogs}
                activeUser={activeUser}
                logsAction={logsAction}
                tenantId={activeTenantId}
                activeSubTab={adminActiveSubTab}
                setActiveSubTab={setAdminActiveSubTab}
              />
            )}

            {activeTab === 'SETTINGS' && (
              <SettingsView
                tenants={tenants}
                activeTenantId={activeTenantId}
                onUpdateTenant={handleUpdateTenant}
                users={users}
                onAddUser={handleAddUser}
                onUpdateUser={handleUpdateUser}
                paymentMethods={paymentMethods}
                onChangePaymentMethods={setPaymentMethods}
                unitsOfMeasurement={unitsOfMeasurement}
                onChangeUnitsOfMeasurement={setUnitsOfMeasurement}
                dishCategories={dishCategories}
                onChangeDishCategories={setDishCategories}
                logsAction={logsAction}
                dishes={dishes}
                onAddDish={handleAddDish}
                ingredients={ingredients}
                onAddIngredient={handleAddIngredient}
                recipes={recipes}
                onAddRecipe={handleAddRecipe}
                ingredientCategories={ingredientCategories}
                onChangeIngredientCategories={setIngredientCategories}
                onUpdateIngredient={handleUpdateIngredient}
                chargeTypes={chargeTypes}
                onChangeChargeTypes={saveChargeTypes}
                onUpdateTenants={setTenants}
                onUpdateUsers={setUsers}
                activeUser={activeUser}
                onUpdateSuppliers={setSuppliers}
                onUpdatePurchaseRequests={setPurchaseRequests}
                onUpdatePurchaseOrders={setPurchaseOrders}
                onUpdateCashMovements={setCashMovements}
                onUpdateDailyClosures={setDailyClosures}
                onUpdateAuditLogs={setAuditLogs}
                onAddTenant={(t) => setTenants(prev => [...prev, t])}
                onDeleteTenant={(tid) => setTenants(prev => prev.filter(t => t.id !== tid))}
                orders={orders}
                onUpdateOrders={setOrders}
                stockMovements={stockMovements}
                onUpdateStockMovements={setStockMovements}
                physicalInventories={physicalInventories}
                onUpdatePhysicalInventories={setPhysicalInventories}
                onUpdateDishes={setDishes}
                onUpdateIngredients={setIngredients}
                onUpdateRecipes={setRecipes}
                suppliers={suppliers}
                purchaseRequests={purchaseRequests}
                purchaseOrders={purchaseOrders}
                cashMovements={cashMovements}
                dailyClosures={dailyClosures}
                auditLogs={auditLogs}
                businessYears={businessYears}
                onChangeBusinessYears={setBusinessYears}
                expenses={expenses}
                onUpdateExpenses={setExpenses}
              />
            )}

            {activeTab === 'ABOUT' && (
              <div className="bg-white text-gray-800 p-8 sm:p-10 rounded-2xl border border-gray-150 shadow-md space-y-8 max-w-3xl mx-auto my-8 animate-fade-in" id="kissineflow-about-view">
                <div className="flex flex-col sm:flex-row items-center sm:items-center gap-6 pb-6 border-b border-gray-100">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-gray-150 shadow-3xs shrink-0 select-none">
                    <LogoIcon size={80} />
                  </div>
                  <div className="text-center sm:text-left space-y-1.5">
                    <div className="flex items-center justify-center sm:justify-start gap-2.5 flex-wrap">
                      <h2 className="text-2xl font-black text-[#0B1F3F] tracking-tight">KISSINE <span className="text-[#F26522]">FLOW™</span></h2>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-150 px-2.5 py-0.5 rounded font-bold uppercase tracking-wider">
                        Version recommandée
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 font-bold tracking-wider uppercase font-sans">Système d'Information, d'Opérations & d'Exploitation Resto (ERP/BI)</p>
                  </div>
                </div>

                <div className="space-y-6 text-sm text-gray-700 leading-relaxed font-normal">
                  <p>
                    <strong className="text-[#0B1F3F] font-extrabold">KISSINE FLOW</strong> est une solution complète de gestion de restauration conçue pour centraliser et optimiser les opérations quotidiennes des établissements de restauration.
                  </p>
                  
                  <p>
                    De la prise de commande à l'analyse financière, en passant par la gestion des stocks, des achats, de la caisse et des dépenses, <strong className="text-[#0B1F3F] font-semibold">KISSINE FLOW</strong> fournit les outils nécessaires pour améliorer le contrôle opérationnel et la rentabilité.
                  </p>

                  <p className="bg-slate-50 border border-gray-150 p-4 rounded-xl text-xs font-semibold text-gray-600">
                    💡 L'application peut être déployée localement et fonctionner sans connexion Internet, garantissant ainsi la continuité des activités et la sécurité des données.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100 text-xs">
                    <div className="bg-slate-50/50 p-4 border border-gray-150 rounded-xl space-y-1 hover:bg-slate-50 transition">
                      <span className="text-gray-400 font-bold block uppercase tracking-wider text-[10px]">Contact Assistance</span>
                      <p className="text-slate-900 text-sm font-black font-mono">📞 +237 690 166 582</p>
                    </div>
                    <div className="bg-slate-50/50 p-4 border border-gray-150 rounded-xl space-y-1 hover:bg-slate-50 transition">
                      <span className="text-gray-400 font-bold block uppercase tracking-wider text-[10px]">Version Installée</span>
                      <p className="text-slate-900 text-sm font-black font-mono">🚀 Version : 1.0.0</p>
                    </div>
                  </div>

                  <div className="text-xs text-gray-400 text-center pt-2">
                    <p>© 2026 KISSINE FLOW – Tous droits réservés.</p>
                  </div>
                </div>

                {/* Technical JSON Backup Section in toggle/collapsible for maximum professionalism */}
                <details className="group border border-gray-200 bg-slate-50/70 rounded-xl overflow-hidden mt-6 shadow-3xs animate-fade-in">
                  <summary className="px-4 py-3 text-xs font-bold text-gray-700 hover:text-[#0B1F3F] cursor-pointer select-none flex items-center justify-between transition duration-150 bg-slate-50">
                    <span className="text-[#0B1F3F] font-black">Spécifications de Sauvegarde & Mémoire JSON (ERP local)</span>
                    <ChevronRight className="h-4 w-4 transform transition-transform group-open:rotate-90 text-[#F26522]" />
                  </summary>
                  <div className="p-4 border-t border-gray-200 space-y-4 text-xs font-medium text-gray-600 bg-white">
                    <p className="leading-relaxed">
                      Moteur transactionnel local unifié s'appuyant sur <code className="bg-slate-100 px-1.5 py-0.5 rounded text-[#0B1F3F] font-mono font-extrabold border border-gray-150">LocalStorage</code>. Indexé par <code className="bg-[#0B1F3F] text-white px-1.5 py-0.5 rounded font-mono">tenantId</code> pour assurer l'étanchéité multi-site :
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-gray-150">
                        <h4 className="font-extrabold text-[#0B1F3F]">erp-tenants</h4>
                        <p className="text-[11px] text-gray-500">Coordonnées de l'Enseigne, logo, régime d'imposition.</p>
                      </div>
                      <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-gray-150">
                        <h4 className="font-extrabold text-emerald-600">erp-ingredients & erp-dishes</h4>
                        <p className="text-[11px] text-gray-500">Matières premières, coûts BOM espérés, fiches techniques plats.</p>
                      </div>
                      <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-gray-150">
                        <h4 className="font-extrabold text-blue-600">erp-orders</h4>
                        <p className="text-[11px] text-gray-500">Transactions d'encaissement et canal de vente.</p>
                      </div>
                      <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-gray-150">
                        <h4 className="font-extrabold text-orange-600">erp-expenses</h4>
                        <p className="text-[11px] text-gray-500">Dépenses opérationnelles et types de charges.</p>
                      </div>
                    </div>
                  </div>
                </details>
              </div>
            )}
          </div>
        </main>
      </div>

      {pendingUserId && (
        (() => {
          const pendingUser = users.find(u => u.id === pendingUserId);
          if (!pendingUser) return null;
          return (
            <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs z-50 flex items-center justify-center p-4" id="role-auth-modal">
              <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-gray-200 shadow-2xl relative space-y-4">
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 rounded-t-2xl"></div>
                
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-[#1E4E8C] rounded-full">
                    <KeyRound className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900">Authentification requise</h3>
                    <p className="text-[11px] text-gray-500 font-medium">Contrôle de confidentialité ERP</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-1">
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Profil cible</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900">{pendingUser.name}</span>
                    <span className="px-2.5 py-0.5 bg-blue-50 text-[#1E4E8C] rounded text-[10px] uppercase font-extrabold font-sans">
                      {pendingUser.role}
                    </span>
                  </div>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  const correctPassword = pendingUser.password || 'password123';
                  if (pendingPasswordInput === correctPassword) {
                    setActiveUserId(pendingUserId);
                    const roleObj = pendingUser.role;
                    if (roleObj === 'CASHIER') setActiveTab('POS');
                    else if (roleObj === 'WAREHOUSE') setActiveTab('STOCKS');
                    else if (roleObj === 'ACCOUNTING') setActiveTab('ACCOUNTING');
                    else setActiveTab('DASHBOARD');

                    logsAction(`Changement de profil approuvé : connecté en tant que ${pendingUser.name} (${pendingUser.role})`, 'SÉCURITÉ');
                    setPendingUserId(null);
                  } else {
                    setPendingPasswordError("Mot de passe incorrect.");
                    logsAction(`Échec d'authentification lors du changement vers le profil ${pendingUser.name}`, 'SÉCURITÉ');
                  }
                }} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-gray-600 font-bold block">Saisissez le mot de passe de ce profil</label>
                    <div className="relative">
                      <input
                        id="pending-user-password-input"
                        type={showPendingPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={pendingPasswordInput}
                        onChange={(e) => {
                          setPendingPasswordInput(e.target.value);
                          setPendingPasswordError('');
                        }}
                        className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-gray-200 rounded-lg text-xs font-mono tracking-widest text-center text-gray-900 focus:outline-none focus:border-blue-500"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPendingPassword(!showPendingPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-650 transition focus:outline-none"
                      >
                        {showPendingPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {pendingPasswordError && (
                    <p className="text-[11px] text-red-650 font-bold text-center bg-red-50 p-1.5 rounded border border-red-100">
                      {pendingPasswordError}
                    </p>
                  )}

                  <div className="text-[10px] text-amber-800 bg-amber-50 border border-amber-100 p-2.5 rounded-lg leading-relaxed select-none">
                    <p className="font-extrabold flex items-center gap-1">🔑 Clé de Démo :</p>
                    <p className="font-semibold mt-0.5">Saisissez <code className="bg-amber-100 px-1 py-0.5 rounded font-bold font-mono text-amber-900">{pendingUser.password || 'password123'}</code></p>
                  </div>

                  <div className="flex gap-2 justify-end pt-2 border-t">
                    <button
                      type="button"
                      onClick={() => setPendingUserId(null)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-750 text-xs font-bold rounded-lg cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-[#1E4E8C] hover:bg-blue-800 text-white font-bold text-xs rounded-lg cursor-pointer flex items-center gap-1 shadow-sm"
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Confirmer</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          );
        })()
      )}

      {showMyPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 shadow-2xl" id="my-password-auth-modal">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-gray-200 shadow-2xl relative space-y-4">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-500 to-blue-500 rounded-t-2xl"></div>
            
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-full">
                <KeyRound className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-gray-900">Modifier mon mot de passe</h3>
                <p className="text-[11px] text-gray-500 font-medium">Sécurité personnelle de votre compte</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-2">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Compte connecté</p>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900">{activeUser.name}</span>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 rounded text-[10px] uppercase font-extrabold">
                  {activeUser.role}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] text-gray-650 font-bold block">Nouveau mot de passe</label>
                <input
                  type="password"
                  placeholder="Saisissez un nouveau mot de passe"
                  value={myNewPassword}
                  onChange={(e) => {
                    setMyNewPassword(e.target.value);
                    setMyPasswordError('');
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-gray-250 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500 text-gray-900 font-mono tracking-widest text-center"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-gray-650 font-bold block">Confirmer le nouveau mot de passe</label>
                <input
                  type="password"
                  placeholder="Ressaisissez le mot de passe"
                  value={myNewPasswordConfirm}
                  onChange={(e) => {
                    setMyNewPasswordConfirm(e.target.value);
                    setMyPasswordError('');
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-gray-250 rounded-lg text-xs font-medium focus:outline-none focus:border-emerald-500 text-gray-900 font-mono tracking-widest text-center"
                />
              </div>

              {myPasswordError && (
                <p className="text-[11px] text-red-650 font-bold text-center bg-red-50 p-1.5 rounded border border-red-100 animate-pulse">
                  {myPasswordError}
                </p>
              )}

              <div className="flex gap-2 justify-end pt-2 border-t text-xs">
                <button
                  type="button"
                  onClick={() => setShowMyPasswordModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-750 font-bold rounded-lg cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!myNewPassword.trim()) {
                      setMyPasswordError("Le mot de passe ne peut pas être vide.");
                      return;
                    }
                    if (myNewPassword !== myNewPasswordConfirm) {
                      setMyPasswordError("Les mots de passe ne correspondent pas.");
                      return;
                    }
                    handleUpdateMyPassword(myNewPassword);
                    setShowMyPasswordModal(false);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1 shadow-sm"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Confirmer</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
