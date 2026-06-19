/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Settings,
  Upload,
  UserCheck,
  Trash2,
  Plus,
  Users,
  Calendar,
  CreditCard,
  Scale,
  FolderHeart,
  Save,
  Check,
  ShieldAlert,
  Edit2,
  AlertCircle,
  FileSpreadsheet,
  Download,
  CheckCircle,
  TrendingUp,
  MapPin,
  Edit
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Tenant, User, DishCategory, Dish, Ingredient, Recipe, RecipeLine, IngredientCategory, ChargeType, Expense } from '../types';

interface SettingsViewProps {
  tenants: Tenant[];
  activeTenantId: string;
  onUpdateTenant: (t: Tenant) => void;
  onUpdateTenants?: (tenants: Tenant[]) => void;
  users: User[];
  onAddUser: (u: User) => void;
  onUpdateUser: (u: User) => void;
  paymentMethods: string[];
  onChangePaymentMethods: (methods: string[]) => void;
  unitsOfMeasurement: string[];
  onChangeUnitsOfMeasurement: (units: string[]) => void;
  dishCategories: DishCategory[];
  onChangeDishCategories: (categories: DishCategory[]) => void;
  logsAction: (action: string, module: string) => void;
  dishes: Dish[];
  onAddDish: (dish: Dish) => void;
  ingredients: Ingredient[];
  onAddIngredient: (ing: Ingredient) => void;
  recipes: Recipe[];
  onAddRecipe: (rec: Recipe) => void;
  ingredientCategories: IngredientCategory[];
  onChangeIngredientCategories: (cats: IngredientCategory[]) => void;
  onUpdateIngredient?: (ing: Ingredient) => void;
  chargeTypes: ChargeType[];
  onChangeChargeTypes: (types: ChargeType[]) => void;
  activeUser: { id: string; name: string; role: string };
  onUpdateUsers?: (u: User[]) => void;
  onUpdateSuppliers?: (suppliers: any[]) => void;
  onUpdatePurchaseRequests?: (requests: any[]) => void;
  onUpdatePurchaseOrders?: (orders: any[]) => void;
  onUpdateCashMovements?: (movements: any[]) => void;
  onUpdateDailyClosures?: (closures: any[]) => void;
  onUpdateAuditLogs?: (logs: any[]) => void;
  onAddTenant?: (t: Tenant) => void;
  onDeleteTenant?: (tid: any) => void;
  orders?: any[];
  onUpdateOrders?: (orders: any[]) => void;
  stockMovements?: any[];
  onUpdateStockMovements?: (movements: any[]) => void;
  physicalInventories?: any[];
  onUpdatePhysicalInventories?: (inventories: any[]) => void;
  onUpdateDishes?: (dishes: any[]) => void;
  onUpdateIngredients?: (ingredients: any[]) => void;
  onUpdateRecipes?: (recipes: any[]) => void;
  suppliers?: any[];
  purchaseRequests?: any[];
  purchaseOrders?: any[];
  cashMovements?: any[];
  dailyClosures?: any[];
  auditLogs?: any[];
  businessYears?: number[];
  onChangeBusinessYears?: (years: number[]) => void;
  expenses?: Expense[];
  onUpdateExpenses?: (expenses: Expense[]) => void;
}

export default function SettingsView({
  tenants,
  activeTenantId,
  onUpdateTenant,
  onUpdateTenants,
  users,
  onAddUser,
  onUpdateUser,
  paymentMethods,
  onChangePaymentMethods,
  unitsOfMeasurement,
  onChangeUnitsOfMeasurement,
  dishCategories,
  onChangeDishCategories,
  logsAction,
  dishes,
  onAddDish,
  ingredients,
  onAddIngredient,
  recipes,
  onAddRecipe,
  ingredientCategories,
  onChangeIngredientCategories,
  onUpdateIngredient,
  chargeTypes,
  onChangeChargeTypes,
  activeUser,
  onUpdateUsers,
  onUpdateSuppliers,
  onUpdatePurchaseRequests,
  onUpdatePurchaseOrders,
  onUpdateCashMovements,
  onUpdateDailyClosures,
  onUpdateAuditLogs,
  onAddTenant,
  onDeleteTenant,
  orders = [],
  onUpdateOrders,
  stockMovements = [],
  onUpdateStockMovements,
  physicalInventories = [],
  onUpdatePhysicalInventories,
  onUpdateDishes,
  onUpdateIngredients,
  onUpdateRecipes,
  suppliers = [],
  purchaseRequests = [],
  purchaseOrders = [],
  cashMovements = [],
  dailyClosures = [],
  auditLogs = [],
  businessYears = [2025, 2026, 2027],
  onChangeBusinessYears,
  expenses = [],
  onUpdateExpenses
}: SettingsViewProps) {
  // Tabs inside Paramètres: 'RESTAURANT' | 'USERS' | 'REFERENCES' | 'IMPORT_EXCEL' | 'JSON_BACKUP'
  const [activeSubTab, setActiveSubTab] = useState<'RESTAURANT' | 'USERS' | 'REFERENCES' | 'IMPORT_EXCEL' | 'JSON_BACKUP'>('RESTAURANT');

  // OPERATIONAL MULTI-SITE STATES
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [siteToEdit, setSiteToEdit] = useState<Tenant | null>(null);
  const [siteName, setSiteName] = useState('');
  const [sitePhone, setSitePhone] = useState('');
  const [siteAddress, setSiteAddress] = useState('');
  const [siteCity, setSiteCity] = useState('');
  const [siteCountry, setSiteCountry] = useState('');

  const handleOpenSiteAdd = () => {
    setSiteToEdit(null);
    setSiteName('');
    setSitePhone('');
    setSiteAddress('');
    setSiteCity('Yaoundé');
    setSiteCountry('Cameroun');
    setShowSiteModal(true);
  };

  const handleOpenSiteEdit = (site: Tenant) => {
    setSiteToEdit(site);
    setSiteName(site.name);
    setSitePhone(site.phone || '');
    setSiteAddress(site.address || '');
    setSiteCity(site.city || '');
    setSiteCountry(site.country || '');
    setShowSiteModal(true);
  };

  const handleSaveSite = () => {
    if (!siteName.trim()) {
      showToast("Veuillez saisir le nom d'enseigne du site.", "error");
      return;
    }

    if (siteToEdit) {
      const updated: Tenant = {
        ...siteToEdit,
        name: siteName.trim(),
        phone: sitePhone.trim(),
        address: siteAddress.trim(),
        city: siteCity.trim(),
        country: siteCountry.trim()
      };
      if (onUpdateTenants) {
        onUpdateTenants(tenants.map(t => t.id === siteToEdit.id ? updated : t));
      }
      showToast("Site opérationnel mis à jour avec succès !", "success");
      logsAction(`Site opérationnel modifié : ${siteName}`, 'ADMINISTRATION');
    } else {
      const newSite: Tenant = {
        id: `tenant-${Date.now()}`,
        name: siteName.trim(),
        phone: sitePhone.trim(),
        address: siteAddress.trim(),
        city: siteCity.trim(),
        country: siteCountry.trim(),
        logoUrl: ''
      };
      if (onUpdateTenants) {
        onUpdateTenants([...tenants, newSite]);
      }
      showToast("Nouveau site opérationnel créé avec succès !", "success");
      logsAction(`Nouveau site opérationnel ajouté : ${siteName}`, 'ADMINISTRATION');
    }
    setShowSiteModal(false);
    setSiteToEdit(null);
  };

  const handleDeleteSite = (siteId: string, name: string) => {
    if (tenants.length <= 1) {
      showToast("Opération impossible. L'ERP exige au moins un site d'exploitation actif.", "error");
      return;
    }
    if (siteId === activeTenantId) {
      showToast("Impossible de supprimer le site sur lequel vous êtes actuellement connecté.", "error");
      return;
    }
    if (confirm(`Êtes-vous absolument sûr de vouloir supprimer définitivement le site opérationnel "${name}" ?`)) {
      if (onUpdateTenants) {
        onUpdateTenants(tenants.filter(t => t.id !== siteId));
      }
      showToast("Site opérationnel supprimé de l'ERP.", "success");
      logsAction(`Site fonctionnel supprimé : ${name}`, 'ADMINISTRATION');
    }
  };

  // LOCAL STATES FOR CHARGE TYPES MANAGEMENT
  const [newChargeName, setNewChargeName] = useState('');
  const [editingChargeId, setEditingChargeId] = useState<string | null>(null);
  const [editingChargeName, setEditingChargeName] = useState('');

  const handleAddChargeType = () => {
    if (!newChargeName.trim()) {
      showToast("Veuillez saisir un nom pour le type de charge.", "error");
      return;
    }
    const exists = chargeTypes.some(t => t.tenantId === activeTenantId && t.name.toLowerCase() === newChargeName.trim().toLowerCase());
    if (exists) {
      showToast("Ce type de charge existe déjà.", "error");
      return;
    }
    const newObj: ChargeType = {
      id: `chg-${activeTenantId}-${Date.now()}`,
      name: newChargeName.trim(),
      tenantId: activeTenantId
    };
    onChangeChargeTypes([...chargeTypes, newObj]);
    setNewChargeName('');
    showToast("Type de charge créé avec succès.", "success");
    logsAction(`Création du type de charge : ${newObj.name}`, 'CONFIGURATION');
  };

  const handleEditChargeType = (id: string, name: string) => {
    setEditingChargeId(id);
    setEditingChargeName(name);
  };

  const handleSaveChargeType = () => {
    if (!editingChargeName.trim()) {
      showToast("Le nom ne peut pas être vide.", "error");
      return;
    }
    const updated = chargeTypes.map(t => {
      if (t.id === editingChargeId) {
        return { ...t, name: editingChargeName.trim() };
      }
      return t;
    });
    onChangeChargeTypes(updated);
    showToast("Type de charge modifié.", "success");
    logsAction(`Modification du type de charge ID ${editingChargeId} vers : ${editingChargeName.trim()}`, 'CONFIGURATION');
    setEditingChargeId(null);
    setEditingChargeName('');
  };

  const handleDeleteChargeType = (id: string, name: string) => {
    const updated = chargeTypes.filter(t => t.id !== id);
    onChangeChargeTypes(updated);
    showToast(`Type de charge "${name}" supprimé.`, "success");
    logsAction(`Suppression du type de charge : ${name}`, 'CONFIGURATION');
  };

  // Custom inline Toast system to replace blocked browser window.alert inside the sandbox iframe
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const activeTenant = tenants.find(t => t.id === activeTenantId) || tenants[0];
  const tenantUsers = users.filter(u => u.tenantId === activeTenantId);

  // LOCAL LOCKSCREEN PASSWORD SUPPORT
  const [localPassword, setLocalPassword] = useState<string>(() => {
    return localStorage.getItem('custom-app-password') || 'kissine2026';
  });

  const handleSavePassword = () => {
    if (!localPassword.trim()) {
      showToast("Le mot de passe ne peut pas être vide !", "error");
      return;
    }
    localStorage.setItem('custom-app-password', localPassword);
    logsAction(`Mise à jour du mot de passe de l'application`, 'PARAMÈTRES');
    showToast("Le mot de passe de l'application a été mis à jour avec succès !", "success");
    window.dispatchEvent(new Event('app-password-changed'));
  };

  // 1. STATE FOR RESTAURANT INFO
  const [systemTva, setSystemTva] = useState<number>(() => {
    return parseFloat(localStorage.getItem('system-tva') || '19.25');
  });

  const [tvaInput, setTvaInput] = useState<string>(() => {
    return localStorage.getItem('system-tva') || '19.25';
  });

  const handleSaveTva = () => {
    const parsed = parseFloat(tvaInput);
    if (isNaN(parsed) || parsed < 0 || parsed > 100) {
      showToast("Veuillez entrer un taux de TVA valide entre 0% et 100%", "error");
      return;
    }
    setSystemTva(parsed);
    localStorage.setItem('system-tva', String(parsed));
    logsAction(`Mise à jour du taux de TVA système à ${parsed}%`, 'PARAMÈTRES');
    showToast(`Le taux de TVA de l'application a été mis à jour à ${parsed}% avec succès !`, "success");
    window.dispatchEvent(new Event('system-tva-changed'));
  };

  const [restName, setRestName] = useState(activeTenant?.name || '');
  const [restPhone, setRestPhone] = useState(activeTenant?.phone || '');
  const [restAddress, setRestAddress] = useState(activeTenant?.address || '');
  const [restCity, setRestCity] = useState(activeTenant?.city || '');
  const [restCountry, setRestCountry] = useState(activeTenant?.country || '');
  const [restSlogan, setRestSlogan] = useState(activeTenant?.logoUrl?.startsWith('data:image') ? '' : ''); // we'll use a separate state
  const [restLogo, setRestLogo] = useState(activeTenant?.logoUrl || '');

  // Synchronize dynamic tenant settings when activeTenant switches
  useEffect(() => {
    if (activeTenant) {
      setRestName(activeTenant.name || '');
      setRestPhone(activeTenant.phone || '');
      setRestAddress(activeTenant.address || '');
      setRestCity(activeTenant.city || '');
      setRestCountry(activeTenant.country || '');
      setRestLogo(activeTenant.logoUrl || '');
    }
  }, [activeTenantId, activeTenant]);

  // 2. STATE FOR USER CREATION / EDITING
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<'ADMIN' | 'MANAGER' | 'CASHIER' | 'WAREHOUSE' | 'ACCOUNTING'>('CASHIER');
  const [userStatus, setUserStatus] = useState(true);
  const [userModules, setUserModules] = useState<string[]>([]);

  // List of all system modules for selection
  const moduleChoices = [
    { id: 'DASHBOARD', label: "Tableau de Bord BI" },
    { id: 'POS', label: "Caisse Tactile POS" },
    { id: 'ORDERS', label: "Commandes Tickets" },
    { id: 'CATALOGUE', label: "Catalogue & Fiches Recettes" },
    { id: 'STOCKS', label: "Actifs & Valorisation Stock" },
    { id: 'PURCHASES', label: "Chaîne d'Achat (BC / BL)" },
    { id: 'ACCOUNTING', label: "Compta & Clôtures Actives" },
    { id: 'ADMIN', label: "Administration Audits" },
    { id: 'SETTINGS', label: "Configuration & Paramètres" }
  ];

  // 3. STATS FOR REFERENCE VALUES
  const [newPayment, setNewPayment] = useState('');
  const [newUnit, setNewUnit] = useState('');
  const [newCatCode, setNewCatCode] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');
  const [newIngCatName, setNewIngCatName] = useState('');
  const [newYear, setNewYear] = useState('');

  // 4. STATES & METHODS FOR EXCEL IMPORT
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'IDLE' | 'PARSED' | 'SAVED'>('IDLE');
  const [importSummary, setImportSummary] = useState({
    dishes: [] as any[],
    ingredients: [] as any[],
    recipes: [] as any[],
    logs: [] as string[]
  });

  // 5. UNIFIED JSON BACKUP & PORTABILITY (CRASH RECOVERY)
  const jsonBackupRef = useRef<HTMLInputElement>(null);

  const exportFullDatabase = () => {
    try {
      const fullBackup = {
        backupDate: new Date().toISOString(),
        backupVersion: "1.0",
        tenants,
        users,
        dishes,
        ingredients,
        recipes,
        orders,
        stockMovements,
        physicalInventories,
        suppliers,
        purchaseOrders,
        purchaseRequests,
        cashMovements,
        dailyClosures,
        auditLogs,
        chargeTypes,
        paymentMethods,
        unitsOfMeasurement,
        dishCategories,
        ingredientCategories,
        businessYears,
        expenses
      };

      const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup_kissineflow_${activeUser.role.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Sauvegarde complète (.json) décodée et exportée avec succès !", "success");
      logsAction(`Sauvegarde unifiée de la base de données exportée par ${activeUser.name}`, 'PARAMÈTRES');
    } catch (err: any) {
      showToast("Échec de l'exportation: " + err.message, "error");
    }
  };

  const importFullDatabase = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (!parsed || parsed.backupVersion !== "1.0") {
          throw new Error("Le fichier importé n'est pas un fichier de sauvegarde Kissineflow valide (version 1.0 requise).");
        }

        // Apply state updates using callback modifiers (with safety guards)
        if (parsed.tenants && onUpdateTenants) onUpdateTenants(parsed.tenants);
        if (parsed.users && onUpdateUsers) onUpdateUsers(parsed.users);
        if (parsed.dishes && onUpdateDishes) onUpdateDishes(parsed.dishes);
        if (parsed.ingredients && onUpdateIngredients) onUpdateIngredients(parsed.ingredients);
        if (parsed.recipes && onUpdateRecipes) onUpdateRecipes(parsed.recipes);
        if (parsed.orders && onUpdateOrders) onUpdateOrders(parsed.orders);
        if (parsed.stockMovements && onUpdateStockMovements) onUpdateStockMovements(parsed.stockMovements);
        if (parsed.physicalInventories && onUpdatePhysicalInventories) onUpdatePhysicalInventories(parsed.physicalInventories);
        if (parsed.suppliers && onUpdateSuppliers) onUpdateSuppliers(parsed.suppliers);
        if (parsed.purchaseOrders && onUpdatePurchaseOrders) onUpdatePurchaseOrders(parsed.purchaseOrders);
        if (parsed.purchaseRequests && onUpdatePurchaseRequests) onUpdatePurchaseRequests(parsed.purchaseRequests);
        if (parsed.cashMovements && onUpdateCashMovements) onUpdateCashMovements(parsed.cashMovements);
        if (parsed.dailyClosures && onUpdateDailyClosures) onUpdateDailyClosures(parsed.dailyClosures);
        if (parsed.auditLogs && onUpdateAuditLogs) onUpdateAuditLogs(parsed.auditLogs);
        if (parsed.chargeTypes && onChangeChargeTypes) onChangeChargeTypes(parsed.chargeTypes);
        if (parsed.paymentMethods && onChangePaymentMethods) onChangePaymentMethods(parsed.paymentMethods);
        if (parsed.unitsOfMeasurement && onChangeUnitsOfMeasurement) onChangeUnitsOfMeasurement(parsed.unitsOfMeasurement);
        if (parsed.dishCategories && onChangeDishCategories) onChangeDishCategories(parsed.dishCategories);
        if (parsed.ingredientCategories && onChangeIngredientCategories) onChangeIngredientCategories(parsed.ingredientCategories);
        if (parsed.businessYears && onChangeBusinessYears) onChangeBusinessYears(parsed.businessYears);
        if (parsed.expenses && onUpdateExpenses) onUpdateExpenses(parsed.expenses);

        showToast("Base de données complète et configurations restaurées !", "success");
        logsAction(`Restauration complète de la base de données par ${activeUser.name}`, 'PARAMÈTRES');
      } catch (err: any) {
        showToast("Erreur d'importation : " + err.message, "error");
      }
    };
    reader.readAsText(file);
    // Reset file input value
    if (event.target) {
      event.target.value = '';
    }
  };

  const generateCodeFromName = (name: string, prefix: string, existingCodes: string[]): string => {
    const cleanName = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase();
    
    let base = cleanName.slice(0, 3);
    if (!base) base = 'ELM';
    if (base.length < 3) base = (base + "XXX").slice(0, 3);
    
    let candidate = `${prefix}-${base}`;
    let count = 1;
    while (existingCodes.includes(candidate)) {
      candidate = `${prefix}-${base}${count}`;
      count++;
    }
    return candidate;
  };

  const handleExcelImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const bstr = e.target?.result;
        if (!bstr) throw new Error("Impossible de lire les octets du fichier.");
        
        const wb = XLSX.read(bstr, { type: 'binary' });
        const sheetNames = wb.SheetNames;
        const logs: string[] = [];
        
        const findSheet = (keywords: string[]) => {
          return sheetNames.find(name => 
            keywords.some(kw => name.toLowerCase().includes(kw))
          );
        };
        
        const dishesSheetName = findSheet(['plat', 'dish', 'menu']);
        const ingredientsSheetName = findSheet(['ingred', 'matiere', 'matieres', 'raw']);
        const recipesSheetName = findSheet(['recette', 'fiche', 'tech', 'bom']);
        
        if (!dishesSheetName && !ingredientsSheetName && !recipesSheetName) {
          throw new Error("Aucun onglet valide trouvé dans le fichier Excel. Le fichier doit contenir au moins un des onglets suivants : 'Plats & Menus', 'Ingredients' ou 'Fiches Techniques'.");
        }

        let parsedDishesList: any[] = [];
        let parsedIngredientsList: any[] = [];
        let parsedRecipesList: any[] = [];

        if (ingredientsSheetName) {
          const ws = wb.Sheets[ingredientsSheetName];
          const rawRows = XLSX.utils.sheet_to_json(ws);
          
          rawRows.forEach((row: any, idx) => {
            const getVal = (keys: string[]) => {
              const matchedKey = Object.keys(row).find(k => keys.includes(k.toLowerCase().trim()));
              return matchedKey ? row[matchedKey] : undefined;
            };

            const name = getVal(['nom', 'name', 'ingredient', 'matiere', 'matiere premiere', 'ingrédient']);
            if (name && String(name).trim()) {
              const desc = getVal(['description', 'desc', 'details', 'detail']) || '';
              const unit = getVal(['unité', 'unite', 'unit']) || 'kg';
              const cmp = Number(getVal(['coût', 'cout', 'coûtmoyen', 'cout moyen', 'cmp', 'cout unitaire', 'prixachat', 'prix achat', 'purchaseprice', 'price', 'coutunitaire'])) || 0;
              const stock = Number(getVal(['stock', 'quantité', 'qty', 'quantite', 'stock actuel', 'stockactuel'])) || 0;
              const min = Number(getVal(['min', 'stock min', 'stock_min', 'seuil min', 'seuil', 'stockmin'])) || 0;
              const max = Number(getVal(['max', 'stock max', 'stock_max'])) || 100;

              parsedIngredientsList.push({
                rowNum: idx + 2,
                name: String(name).trim(),
                description: String(desc).trim(),
                unit: String(unit).trim(),
                cmp,
                stockActual: stock,
                stockMin: min,
                stockMax: max
              });
            }
          });
          logs.push(`✔️ Onglet "${ingredientsSheetName}" : ${parsedIngredientsList.length} matières premières lues.`);
        } else {
          logs.push(`⚠️ Aucun onglet "Ingredients" détecté. Cet import sera ignoré.`);
        }

        if (dishesSheetName) {
          const ws = wb.Sheets[dishesSheetName];
          const rawRows = XLSX.utils.sheet_to_json(ws);
          
          rawRows.forEach((row: any, idx) => {
            const getVal = (keys: string[]) => {
              const matchedKey = Object.keys(row).find(k => keys.includes(k.toLowerCase().trim()));
              return matchedKey ? row[matchedKey] : undefined;
            };

            const name = getVal(['nom', 'name', 'plat', 'désignation', 'designation']);
            if (name && String(name).trim()) {
              const price = Number(getVal(['prix', 'price', 'tarif', 'valeur', 'prix public'])) || 0;
              const categoryStr = getVal(['catégorie', 'categorie', 'category', 'classe', 'code_categorie']) || 'RESTO';
              const description = getVal(['description', 'desc', 'details']) || '';
              const prepTime = Number(getVal(['temps', 'tempprep', 'prep', 'temps de préparation', 'prep time'])) || 15;

              parsedDishesList.push({
                rowNum: idx + 2,
                name: String(name).trim(),
                price,
                categoryStr: String(categoryStr).trim(),
                description: String(description).trim(),
                prepTime
              });
            }
          });
          logs.push(`✔️ Onglet "${dishesSheetName}" : ${parsedDishesList.length} plats et menus lus.`);
        } else {
          logs.push(`⚠️ Aucun onglet "Plats & Menus" détecté. Cet import sera ignoré.`);
        }

        if (recipesSheetName) {
          const ws = wb.Sheets[recipesSheetName];
          const rawRows = XLSX.utils.sheet_to_json(ws);
          
          rawRows.forEach((row: any, idx) => {
            const getVal = (keys: string[]) => {
              const matchedKey = Object.keys(row).find(k => keys.includes(k.toLowerCase().trim()));
              return matchedKey ? row[matchedKey] : undefined;
            };

            const platNom = getVal(['nom plat', 'nom_plat', 'plat_nom', 'plat', 'dish', 'recipe dish', 'recette']);
            const ingNom = getVal(['nom ingrédient', 'nom_ingredient', 'ingredient_nom', 'ingredient', 'matière première', 'matiere']);
            const quantity = Number(getVal(['quantité', 'quantite', 'qty', 'quantity', 'dosage', 'poids', 'volume'])) || 0;

            if (platNom && ingNom && quantity > 0) {
              parsedRecipesList.push({
                rowNum: idx + 2,
                platNom: String(platNom).trim(),
                ingNom: String(ingNom).trim(),
                quantity
              });
            }
          });
          logs.push(`✔️ Onglet "${recipesSheetName}" : ${parsedRecipesList.length} lignes d'ingrédients de fiches techniques (BOM) lues.`);
        } else {
          logs.push(`⚠️ Aucun onglet "Fiches Techniques" détecté. Cet import sera ignoré.`);
        }

        setImportSummary({
          dishes: parsedDishesList,
          ingredients: parsedIngredientsList,
          recipes: parsedRecipesList,
          logs
        });
        setImportStatus('PARSED');
        logsAction(`Lecture de fichier Excel réussi`, 'PARAMÈTRES');
      } catch (err: any) {
        showToast("Erreur de lecture du document: " + err.message, "error");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExecuteImport = () => {
    let dishesImported = 0;
    let ingredientsImported = 0;
    let recipesImported = 0;
    let categoriesCreated = 0;

    let localDishes = [...dishes];
    let localIngredients = [...ingredients];
    let localCategories = [...dishCategories];
    let localRecipes = [...recipes];

    const finalLogs: string[] = [];

    const existingDishCodes = localDishes.map(d => d.code);
    const existingIngCodes = localIngredients.map(i => i.code);

    // 1. PROCESS INGREDIENTS
    const ingMap: { [name: string]: string } = {};
    
    importSummary.ingredients.forEach(rawIng => {
      const exists = localIngredients.find(i => i.name.toLowerCase() === rawIng.name.toLowerCase() && i.tenantId === activeTenantId);
      if (exists) {
        ingMap[rawIng.name.toLowerCase()] = exists.id;
        exists.cmp = rawIng.cmp || exists.cmp;
        exists.lastPurchasePrice = rawIng.cmp || exists.lastPurchasePrice;
        exists.stockActual = rawIng.stockActual !== undefined ? rawIng.stockActual : exists.stockActual;
        exists.stockMin = rawIng.stockMin !== undefined ? rawIng.stockMin : exists.stockMin;
        exists.stockMax = rawIng.stockMax !== undefined ? rawIng.stockMax : exists.stockMax;
        if (onUpdateIngredient) {
          onUpdateIngredient(exists);
        }
        finalLogs.push(`Matériel "${rawIng.name}" existe déjà. Mis à jour avec les nouveaux stocks (Stock: ${exists.stockActual}, Min: ${exists.stockMin}) et coûts (${exists.cmp} F).`);
        return;
      }
      
      const newCode = generateCodeFromName(rawIng.name, 'ING', existingIngCodes);
      existingIngCodes.push(newCode);

      const ingId = `ing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const ingObj: Ingredient = {
        id: ingId,
        code: newCode,
        name: rawIng.name,
        description: rawIng.description,
        categoryId: 'cat-ing-raw',
        unit: rawIng.unit,
        stockActual: rawIng.stockActual,
        stockMin: rawIng.stockMin,
        stockMax: rawIng.stockMax,
        cmp: rawIng.cmp,
        lastPurchasePrice: rawIng.cmp,
        active: true,
        tenantId: activeTenantId
      };
      
      onAddIngredient(ingObj);
      localIngredients.push(ingObj);
      ingMap[rawIng.name.toLowerCase()] = ingId;
      ingredientsImported++;
    });

    // 2. PROCESS DISHES
    const dishMap: { [name: string]: string } = {};

    importSummary.dishes.forEach(rawDish => {
      const exists = localDishes.find(d => d.name.toLowerCase() === rawDish.name.toLowerCase() && d.tenantId === activeTenantId);
      if (exists) {
        dishMap[rawDish.name.toLowerCase()] = exists.id;
        finalLogs.push(`Plat "${rawDish.name}" existe déjà.`);
        return;
      }

      let catObj = localCategories.find(c => 
        (c.name.toLowerCase() === rawDish.categoryStr.toLowerCase() || c.code.toLowerCase() === rawDish.categoryStr.toLowerCase()) && 
        c.tenantId === activeTenantId
      );
      
      if (!catObj) {
        const catCode = rawDish.categoryStr.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5) || 'RESTO';
        const catId = `cat-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        
        catObj = {
          id: catId,
          code: catCode,
          name: rawDish.categoryStr,
          description: `Catégorie créée automatiquement lors de l'import Excel`,
          active: true,
          tenantId: activeTenantId
        };
        
        localCategories.push(catObj);
        categoriesCreated++;
        onChangeDishCategories([...localCategories]);
        finalLogs.push(`Création de catégorie automatisée : "${catObj.name}"`);
      }

      const newCode = generateCodeFromName(rawDish.name, 'PL', existingDishCodes);
      existingDishCodes.push(newCode);

      const dishId = `dish-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const dishObj: Dish = {
        id: dishId,
        code: newCode,
        name: rawDish.name,
        description: rawDish.description,
        categoryId: catObj.id,
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop',
        price: rawDish.price,
        tvaApplicable: true,
        prepTime: rawDish.prepTime,
        theoreticalCost: 0,
        margin: rawDish.price,
        marginPercent: 100,
        availablePOS: true,
        availableDelivery: true,
        availableTakeaway: true,
        active: true,
        tenantId: activeTenantId
      };

      localDishes.push(dishObj);
      dishMap[rawDish.name.toLowerCase()] = dishId;
      dishesImported++;
    });

    // 3. PROCESS RECIPES (BOM)
    const recipeGroups: { [dishId: string]: RecipeLine[] } = {};

    importSummary.recipes.forEach(row => {
      const dishId = dishMap[row.platNom.toLowerCase()] || localDishes.find(d => d.name.toLowerCase() === row.platNom.toLowerCase() && d.tenantId === activeTenantId)?.id;
      const ingredientId = ingMap[row.ingNom.toLowerCase()] || localIngredients.find(i => i.name.toLowerCase() === row.ingNom.toLowerCase() && i.tenantId === activeTenantId)?.id;

      if (dishId && ingredientId) {
        if (!recipeGroups[dishId]) {
          recipeGroups[dishId] = [];
        }
        if (!recipeGroups[dishId].some(line => line.ingredientId === ingredientId)) {
          recipeGroups[dishId].push({
            ingredientId,
            quantity: row.quantity
          });
        }
      }
    });

    Object.entries(recipeGroups).forEach(([dishId, lines]) => {
      const exists = localRecipes.find(r => r.dishId === dishId && r.tenantId === activeTenantId);
      if (exists) {
        exists.lines = [...exists.lines, ...lines];
        recipesImported++;
      } else {
        const newRec: Recipe = {
          id: `recipe-${dishId}`,
          dishId,
          version: 1,
          active: true,
          tenantId: activeTenantId,
          lines
        };
        onAddRecipe(newRec);
        localRecipes.push(newRec);
        recipesImported++;
      }

      const targetDishIndex = localDishes.findIndex(d => d.id === dishId);
      if (targetDishIndex !== -1) {
        const dish = localDishes[targetDishIndex];
        let calculatedBOMCost = 0;
        lines.forEach(l => {
          const ingObj = localIngredients.find(i => i.id === l.ingredientId);
          if (ingObj) {
            calculatedBOMCost += ingObj.cmp * l.quantity;
          }
        });

        const activeBOMCost = Math.round(calculatedBOMCost);
        const margin = dish.price - activeBOMCost;
        const marginPercent = dish.price > 0 ? Number(((margin / dish.price) * 100).toFixed(1)) : 0;

        dish.theoreticalCost = activeBOMCost;
        dish.margin = margin;
        dish.marginPercent = marginPercent;
      }
    });

    localDishes.forEach(d => {
      const alreadyInCore = dishes.some(cd => cd.id === d.id);
      if (!alreadyInCore) {
        onAddDish(d);
      }
    });

    logsAction(`Importation en masse réussie de catalogue`, 'PARAMÈTRES');
    setImportStatus('SAVED');
    setImportSummary(prev => ({
      ...prev,
      logs: [...prev.logs, ...finalLogs, `🎉 Importation active et finalisée à ${new Date().toLocaleTimeString()} !`]
    }));
  };

  const downloadSampleExcel = () => {
    const wb = XLSX.utils.book_new();
    
    const platData = [
      { "Nom": "Poulet DG Classique", "Description": "Poulet sauté aux plantains mûrs frits", "Prix": 4500, "Categorie": "RESTO", "TempsPrep": 25 },
      { "Nom": "Jus d'Ananas Bio", "Description": "Jus d'ananas pressé frais sans sucres ajoutés", "Prix": 1500, "Categorie": "BOISSON", "TempsPrep": 5 },
      { "Nom": "Ndolé Viande", "Description": "Feuilles de ndolé aux arachides frites et viande de boeuf", "Prix": 5000, "Categorie": "RESTO", "TempsPrep": 35 }
    ];
    const wsPlats = XLSX.utils.json_to_sheet(platData);
    XLSX.utils.book_append_sheet(wb, wsPlats, "Plats & Menus");
    
    const ingData = [
      { "Nom": "Poulet Entier", "Description": "Poulet bio entier plumé et vidé", "Unite": "kg", "CoutUnitaire": 2200, "StockActuel": 15, "StockMin": 5 },
      { "Nom": "Plantain Mûr", "Description": "Régime de plantains frais", "Unite": "kg", "CoutUnitaire": 800, "StockActuel": 30, "StockMin": 10 },
      { "Nom": "Ananas", "Description": "Ananas mûrs pelés", "Unite": "kg", "CoutUnitaire": 400, "StockActuel": 12, "StockMin": 3 },
      { "Nom": "Feuilles de Ndolé", "Description": "Ndolé lavé précuit", "Unite": "kg", "CoutUnitaire": 1500, "StockActuel": 8, "StockMin": 2 }
    ];
    const wsIngs = XLSX.utils.json_to_sheet(ingData);
    XLSX.utils.book_append_sheet(wb, wsIngs, "Ingredients");
    
    const ftData = [
      { "Plat_Nom": "Poulet DG Classique", "Ingredient_Nom": "Poulet Entier", "Quantite": 0.5 },
      { "Plat_Nom": "Poulet DG Classique", "Ingredient_Nom": "Plantain Mûr", "Quantite": 0.75 },
      { "Plat_Nom": "Jus d'Ananas Bio", "Ingredient_Nom": "Ananas", "Quantite": 0.4 },
      { "Plat_Nom": "Ndolé Viande", "Ingredient_Nom": "Feuilles de Ndolé", "Quantite": 0.3 }
    ];
    const wsFt = XLSX.utils.json_to_sheet(ftData);
    XLSX.utils.book_append_sheet(wb, wsFt, "Fiches Techniques");
    
    XLSX.writeFile(wb, "Modele_Catalogue_KissineFlow.xlsx");
    logsAction("Téléchargement du modèle Excel d'importation", "PARAMÈTRES");
  };

  // ---------------------------------------------------------------------------------
  // HANDLERS
  // ---------------------------------------------------------------------------------

  // Handlers for Restaurant information save
  const handleSaveRestaurantInfo = () => {
    if (!restName.trim()) {
      showToast("Le nom du restaurant est obligatoire !", "error");
      return;
    }
    onUpdateTenant({
      ...activeTenant,
      name: restName,
      phone: restPhone,
      address: restAddress,
      city: restCity,
      country: restCountry,
      logoUrl: restLogo
    });
    logsAction(`Mise à jour des informations de l'établissement: ${restName}`, 'PARAMÈTRES');
    showToast("Les informations du restaurant ont été enregistrées avec succès !", "success");
  };

  // Drag and drop or manual selection for restaurant logo file loader
  const handleLogoFileChange = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setRestLogo(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } else {
      showToast("Veuillez sélectionner un fichier image valide (PNG/JPG).", "error");
    }
  };

  const handleOpenAddUserModal = () => {
    setEditingUser(null);
    setUserName('');
    setUserEmail('');
    setUserRole('CASHIER');
    setUserStatus(true);
    // Set default modules based on role (standard)
    setUserModules(['POS', 'ORDERS']);
    setShowUserModal(true);
  };

  const handleOpenEditUserModal = (user: User) => {
    setEditingUser(user);
    setUserName(user.name);
    setUserEmail(user.email);
    setUserRole(user.role);
    setUserStatus(user.active);
    // modules setup
    if (user.allowedModules && user.allowedModules.length > 0) {
      setUserModules(user.allowedModules);
    } else {
      // Default fallback list
      if (user.role === 'ADMIN' || user.role === 'MANAGER') {
        setUserModules(['DASHBOARD', 'POS', 'ORDERS', 'CATALOGUE', 'STOCKS', 'PURCHASES', 'ACCOUNTING', 'ADMIN', 'SETTINGS']);
      } else if (user.role === 'CASHIER') {
        setUserModules(['POS', 'ORDERS']);
      } else if (user.role === 'WAREHOUSE') {
        setUserModules(['STOCKS', 'PURCHASES']);
      } else if (user.role === 'ACCOUNTING') {
        setUserModules(['DASHBOARD', 'ACCOUNTING']);
      } else {
        setUserModules(['DASHBOARD']);
      }
    }
    setShowUserModal(true);
  };

  // Submit User creation/edit
  const handleSaveUser = () => {
    if (!userName.trim() || !userEmail.trim()) {
      showToast("Le nom et l'adresse email sont obligatoires.", "error");
      return;
    }

    if (editingUser) {
      const updated: User = {
        ...editingUser,
        name: userName,
        email: userEmail,
        role: userRole,
        active: userStatus,
        allowedModules: userModules
      };
      onUpdateUser(updated);
      logsAction(`Mise à jour du profil de ${userName} et de ses autorisations de modules`, 'PARAMÈTRES');
      showToast(`Les modifications du collaborateur "${userName}" ont été enregistrées !`, "success");
    } else {
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: userName,
        email: userEmail,
        role: userRole,
        tenantId: activeTenantId,
        active: userStatus,
        allowedModules: userModules
      };
      onAddUser(newUser);
      logsAction(`Création d'un nouveau collaborateur "${userName}" avec autorisations personnalisées`, 'PARAMÈTRES');
      showToast(`Le collaborateur "${userName}" a été inscrit avec succès !`, "success");
    }
    setShowUserModal(false);
  };

  const handleToggleModuleInList = (moduleId: string) => {
    setUserModules(prev => {
      if (prev.includes(moduleId)) {
        return prev.filter(m => m !== moduleId);
      } else {
        return [...prev, moduleId];
      }
    });
  };

  // Dynamic automatic checks selection helper
  const handleSetRolePreset = (role: typeof userRole) => {
    setUserRole(role);
    if (role === 'ADMIN' || role === 'MANAGER') {
      setUserModules(['DASHBOARD', 'POS', 'ORDERS', 'CATALOGUE', 'STOCKS', 'PURCHASES', 'ACCOUNTING', 'ADMIN', 'SETTINGS']);
    } else if (role === 'CASHIER') {
      setUserModules(['POS', 'ORDERS']);
    } else if (role === 'WAREHOUSE') {
      setUserModules(['STOCKS', 'PURCHASES']);
    } else if (role === 'ACCOUNTING') {
      setUserModules(['DASHBOARD', 'ACCOUNTING']);
    }
  };

  // 3. HANDLERS FOR REFERENCE SUB-SYSTEMS
  // Add payment method
  const handleAddPaymentMethod = () => {
    const cleanPay = newPayment.trim().toUpperCase();
    if (!cleanPay) return;
    if (paymentMethods.includes(cleanPay)) {
      showToast("Ce mode de paiement est déjà enregistré !", "error");
      return;
    }
    const updated = [...paymentMethods, cleanPay];
    onChangePaymentMethods(updated);
    logsAction(`Ajout du mode d'encaissement "${cleanPay}" dans les configurations`, 'PARAMÈTRES');
    setNewPayment('');
  };

  // Delete payment method
  const handleDeletePaymentMethod = (method: string) => {
    if (method === 'CASH') {
      showToast("Le mode de paiement Espèces (CASH) ne peut pas être supprimé car il est indispensable au système.", "error");
      return;
    }
    const confirmDel = window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le mode d'encaissement "${method}" ?`);
    if (confirmDel) {
      const updated = paymentMethods.filter(m => m !== method);
      onChangePaymentMethods(updated);
      logsAction(`Suppression du mode d'encaissement "${method}"`, 'PARAMÈTRES');
    }
  };

  // Add Unit
  const handleAddUnit = () => {
    const cleanUnit = newUnit.trim();
    if (!cleanUnit) return;
    if (unitsOfMeasurement.includes(cleanUnit)) {
      showToast("Cette unité de mesure existe déjà !", "error");
      return;
    }
    const updated = [...unitsOfMeasurement, cleanUnit];
    onChangeUnitsOfMeasurement(updated);
    logsAction(`Ajout de l'unité de mesure "${cleanUnit}"`, 'PARAMÈTRES');
    setNewUnit('');
  };

  // Delete Unit
  const handleDeleteUnit = (unit: string) => {
    const confirmDel = window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement l'unité "${unit}" ?`);
    if (confirmDel) {
      const updated = unitsOfMeasurement.filter(u => u !== unit);
      onChangeUnitsOfMeasurement(updated);
      logsAction(`Suppression de l'unité de mesure "${unit}"`, 'PARAMÈTRES');
    }
  };

  // Add Business Year
  const handleAddBusinessYear = () => {
    const yearNum = parseInt(newYear.trim(), 10);
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      showToast("Veuillez saisir une année d'affaires valide (ex: 2028) !", "error");
      return;
    }
    if (businessYears.includes(yearNum)) {
      showToast("Cette année d'affaires est déjà enregistrée !", "error");
      return;
    }
    const updated = [...businessYears, yearNum].sort((a,b) => b - a); // descending order
    if (onChangeBusinessYears) {
      onChangeBusinessYears(updated);
    }
    logsAction(`Ajout de l'année d'affaires "${yearNum}" dans les configurations`, 'PARAMÈTRES');
    setNewYear('');
  };

  // Delete Business Year
  const handleDeleteBusinessYear = (year: number) => {
    if (businessYears.length <= 1) {
      showToast("Vous devez conserver au moins une année d'affaires active !", "error");
      return;
    }
    const confirmDel = window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement l'année d'affaires "${year}" ?`);
    if (confirmDel) {
      const updated = businessYears.filter(y => y !== year);
      if (onChangeBusinessYears) {
        onChangeBusinessYears(updated);
      }
      logsAction(`Suppression de l'année d'affaires "${year}"`, 'PARAMÈTRES');
    }
  };

  // Add Restaurant/Dish Category
  const handleAddDishCategory = () => {
    const cleanCode = newCatCode.trim().toUpperCase();
    const cleanName = newCatName.trim();
    if (!cleanCode || !cleanName) {
      showToast("Veuillez renseigner au moins le code et le nom de la catégorie.", "error");
      return;
    }
    if (dishCategories.some(c => c.code === cleanCode && c.tenantId === activeTenantId)) {
      showToast("Une catégorie avec ce code existe déjà !", "error");
      return;
    }

    const newCat: DishCategory = {
      id: `cat-${Date.now()}`,
      code: cleanCode,
      name: cleanName,
      description: newCatDesc,
      active: true,
      tenantId: activeTenantId
    };

    const updated = [...dishCategories, newCat];
    onChangeDishCategories(updated);
    logsAction(`Création de la catégorie plat "${cleanName}" (Code: ${cleanCode})`, 'PARAMÈTRES');
    
    // Reset inputs
    setNewCatCode('');
    setNewCatName('');
    setNewCatDesc('');
  };

  // Delete Category
  const handleDeleteDishCategory = (catId: string, catName: string) => {
    const confirmDel = window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement la catégorie "${catName}" ? Attention, les plats liés à cette catégorie risquent de ne plus s'afficher.`);
    if (confirmDel) {
      const updated = dishCategories.filter(c => c.id !== catId);
      onChangeDishCategories(updated);
      logsAction(`Suppression de la catégorie plat ${catName}`, 'PARAMÈTRES');
    }
  };

  // Add / Edit / Delete Ingredient Category
  const handleAddIngCategory = () => {
    const cleanName = newIngCatName.trim();
    if (!cleanName) {
      showToast("Veuillez saisir le nom de la catégorie d'ingrédients.", "error");
      return;
    }
    const id = `cat-ing-${Date.now()}`;
    const newCat: IngredientCategory = {
      id,
      name: cleanName,
      tenantId: activeTenantId
    };
    onChangeIngredientCategories([...ingredientCategories, newCat]);
    setNewIngCatName('');
    logsAction(`Création de la catégorie d'ingrédients "${cleanName}"`, 'PARAMÈTRES');
  };

  const handleEditIngCategory = (id: string, currentName: string) => {
    const newName = window.prompt(`Modifier le nom de la catégorie d'ingrédients :`, currentName);
    if (newName && newName.trim() && newName.trim() !== currentName) {
      onChangeIngredientCategories(ingredientCategories.map(c => c.id === id ? { ...c, name: newName.trim() } : c));
      logsAction(`Catégorie d'ingrédients renommée : ${currentName} -> ${newName.trim()}`, 'PARAMÈTRES');
    }
  };

  const handleDeleteIngCategory = (catId: string, catName: string) => {
    const confirmDel = window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement la catégorie d'ingrédients "${catName}" ?`);
    if (confirmDel) {
      onChangeIngredientCategories(ingredientCategories.filter(c => c.id !== catId));
      logsAction(`Suppression de la catégorie d'ingrédients "${catName}"`, 'PARAMÈTRES');
    }
  };

  return (
    <div className="space-y-6" id="settings-module-view">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-6 border border-gray-150 rounded-xl shadow-2xs gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-gray-950 flex items-center gap-2">
            <Settings className="h-5 w-5 text-[#1E4E8C]" />
            <span>Module Paramètres Système</span>
          </h2>
          <p className="text-xs text-gray-550 mt-1">Configurez l'établissement, les collaborateurs et leurs autorisations visuelles, ainsi que les tables de référence.</p>
        </div>

        <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-105 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#1E4E8C]">
          <span>Site Actif :</span>
          <span className="font-extrabold">{activeTenant?.name}</span>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex flex-wrap border-b border-gray-200">
        <button
          id="tab-settings-restaurant"
          onClick={() => setActiveSubTab('RESTAURANT')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'RESTAURANT'
              ? 'border-[#1E4E8C] text-[#1E4E8C] bg-white font-extrabold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <FolderHeart className="h-4 w-4" />
          <span>Fiche Restaurant & Logo</span>
        </button>

        <button
          id="tab-settings-users"
          onClick={() => setActiveSubTab('USERS')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'USERS'
              ? 'border-[#1E4E8C] text-[#1E4E8C] bg-white font-extrabold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Collaborateurs & Visibilités</span>
        </button>

        <button
          id="tab-settings-references"
          onClick={() => setActiveSubTab('REFERENCES')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'REFERENCES'
              ? 'border-[#1E4E8C] text-[#1E4E8C] bg-white font-extrabold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Scale className="h-4 w-4" />
          <span>Information & Listes de Référence</span>
        </button>

        <button
          id="tab-settings-import"
          onClick={() => setActiveSubTab('IMPORT_EXCEL')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'IMPORT_EXCEL'
              ? 'border-[#1E4E8C] text-[#1E4E8C] bg-white font-extrabold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          <span>Importation Catalogue Excel</span>
        </button>

        <button
          id="tab-settings-backup"
          onClick={() => setActiveSubTab('JSON_BACKUP')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'JSON_BACKUP'
              ? 'border-[#1E4E8C] text-[#1E4E8C] bg-white font-extrabold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Download className="h-4 w-4 animate-bounce" />
          <span className="font-extrabold uppercase text-[#1E4E8C] text-[10px] tracking-wider">Sauvegarde & Portabilité (JSON)</span>
        </button>
      </div>

      {/* CONTENT FOR SUB-TABS */}

      {/* SUB-TAB 1: RESTAURANT COORDINATES AND LOGO */}
      {activeSubTab === 'RESTAURANT' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column with Details and Security */}
          <div className="lg:col-span-2 space-y-6">
            {/* General info form */}
            <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-2xs space-y-4">
              <h3 className="text-sm font-extrabold text-gray-900 border-b pb-2 flex items-center gap-1.5">
                <span>Coordonnées de l'Enseigne</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="text-gray-650 block font-semibold">Nom commercial *</label>
                  <input
                    id="settings-company-name"
                    type="text"
                    placeholder="ex: Kissine Bali..."
                    value={restName}
                    onChange={(e) => setRestName(e.target.value)}
                    className="w-full p-2.5 border border-gray-250 bg-gray-50 rounded text-gray-950 focus:outline-[#1E4E8C]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-gray-650 block font-semibold">Téléphone standard *</label>
                  <input
                    id="settings-company-phone"
                    type="text"
                    placeholder="ex: +237 677 ..."
                    value={restPhone}
                    onChange={(e) => setRestPhone(e.target.value)}
                    className="w-full p-2.5 border border-gray-250 bg-gray-50 rounded text-gray-950 focus:outline-[#1E4E8C]"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1">
                  <label className="text-gray-650 block font-semibold">Adresse physique complète</label>
                  <input
                    id="settings-company-address"
                    type="text"
                    placeholder="ex: Boulevard de la Liberté, Akwa..."
                    value={restAddress}
                    onChange={(e) => setRestAddress(e.target.value)}
                    className="w-full p-2.5 border border-gray-250 bg-gray-50 rounded text-gray-950 focus:outline-[#1E4E8C]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-gray-650 block font-semibold">Ville</label>
                  <input
                    id="settings-company-city"
                    type="text"
                    value={restCity}
                    onChange={(e) => setRestCity(e.target.value)}
                    className="w-full p-2.5 border border-gray-250 bg-gray-50 rounded text-gray-950 focus:outline-[#1E4E8C]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-gray-650 block font-semibold">Pays d'implantation</label>
                  <input
                    id="settings-company-country"
                    type="text"
                    value={restCountry}
                    onChange={(e) => setRestCountry(e.target.value)}
                    className="w-full p-2.5 border border-gray-250 bg-gray-50 rounded text-gray-950 focus:outline-[#1E4E8C]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end">
                <button
                  id="save-restaurant-info-btn"
                  onClick={handleSaveRestaurantInfo}
                  className="px-5 py-2.5 bg-[#1E4E8C] select-none hover:bg-blue-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-100"
                >
                  <Save className="h-4 w-4" />
                  <span>Enregistrer Coordonnées</span>
                </button>
              </div>
            </div>

            {/* Local Security App lock config */}
            <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-2xs space-y-4">
              <h3 className="text-sm font-extrabold text-gray-900 border-b pb-2 flex items-center gap-1.5">
                <span>Sécurité & Contrôle d'Accès local</span>
              </h3>
              <p className="text-xs text-gray-500">
                Protégez l'accès intégral de votre caisse locale face au public. Ce mot de passe sera exigé lors du chargement initial de l’application.
              </p>

              <div className="grid grid-cols-1 gap-4 text-xs">
                <div className="space-y-1">
                  <label className="text-gray-650 block font-semibold">Mot de passe général du système</label>
                  <input
                    id="settings-company-password"
                    type="text"
                    placeholder="Saisissez un nouveau mot de passe"
                    value={localPassword}
                    onChange={(e) => setLocalPassword(e.target.value)}
                    className="w-full p-2.5 border border-gray-250 bg-gray-50 rounded text-gray-950 focus:outline-[#1E4E8C] font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end">
                <button
                  id="save-security-password-btn"
                  onClick={handleSavePassword}
                  className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Save className="h-4 w-4" />
                  <span>Mettre à jour le Mot de passe</span>
                </button>
              </div>
            </div>

            {/* CONFIGURATION FISCALE (TVA) */}
            <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-2xs space-y-4">
              <h3 className="text-sm font-extrabold text-gray-900 border-b pb-2 flex items-center gap-1.5 font-sans">
                <TrendingUp className="h-4 w-4 text-[#1E4E8C]" />
                <span>Configuration de la Taxe sur la Valeur Ajoutée (TVA)</span>
              </h3>
              <p className="text-xs text-gray-500">
                Définissez le taux de TVA standard utilisé pour la conversion du Chiffre d'Affaires POS (TTC) vers le Chiffre d'Affaires Comptable (HT), ainsi que pour les calculs de taxes de charges consolidées.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-gray-650 block">Taux de TVA standard en vigueur (%)</label>
                  <div className="flex items-center gap-1.5">
                    <input
                      id="settings-system-tva"
                      type="number"
                      step="0.01"
                      placeholder="ex: 19.25"
                      value={tvaInput}
                      onChange={(e) => setTvaInput(e.target.value)}
                      className="w-full p-2.5 border border-gray-250 bg-gray-50 rounded text-gray-950 focus:outline-[#1E4E8C] font-mono font-bold"
                    />
                    <span className="text-sm text-gray-400 font-bold">%</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end">
                <button
                  id="save-system-tva-btn"
                  onClick={handleSaveTva}
                  className="px-5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                >
                  <Save className="h-4 w-4" />
                  <span>Enregistrer Taux de TVA</span>
                </button>
              </div>
            </div>

            {/* GESTION DES SITES OPÉRATIONNELS */}
            <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-2xs space-y-4">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-[#1E4E8C]" />
                  <span>Sites Opérationnels & Points de Vente</span>
                </h3>
                {(activeUser.role === 'ADMIN' || activeUser.role === 'MANAGER') && (
                  <button
                    onClick={handleOpenSiteAdd}
                    className="p-1 px-2.5 bg-[#1E4E8C] hover:bg-blue-800 text-white font-bold rounded text-[11px] flex items-center gap-1 cursor-pointer transition"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Créer un Site</span>
                  </button>
                )}
              </div>

              <p className="text-xs text-gray-500">
                Kissineflow supporte le pilotage multi-site unifié. Administrez les adresses de chaque antenne locale.
              </p>

              <div className="overflow-hidden border rounded-lg text-xs">
                <table className="w-full text-left font-sans">
                  <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase border-b">
                    <tr>
                      <th className="px-4 py-2.5">Nom d'Enseigne</th>
                      <th className="px-4 py-2.5">Ville & Pays</th>
                      <th className="px-4 py-2.5">Téléphone</th>
                      <th className="px-4 py-2.5">Adresse</th>
                      {(activeUser.role === 'ADMIN' || activeUser.role === 'MANAGER') && (
                        <th className="px-4 py-2.5 text-center">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y font-semibold text-gray-700">
                    {tenants.map(site => (
                      <tr key={site.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900 flex items-center gap-1.5">
                          {site.id === activeTenantId && (
                            <span className="h-2 w-2 rounded-full bg-emerald-500 mr-0.5 animate-pulse" title="Site connecté actuellement" />
                          )}
                          <span>{site.name}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 font-normal">
                          {site.city}, {site.country}
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-400 font-normal">{site.phone || '-'}</td>
                        <td className="px-4 py-3 text-gray-500 font-normal max-w-[150px] truncate">{site.address || '-'}</td>
                        {(activeUser.role === 'ADMIN' || activeUser.role === 'MANAGER') && (
                          <td className="px-4 py-3 text-center">
                            <div className="flex gap-1.5 justify-center">
                              <button
                                onClick={() => handleOpenSiteEdit(site)}
                                className="p-1 px-1.5 border rounded bg-white hover:bg-blue-50 text-[#1E4E8C] flex items-center gap-0.5 text-[10px] font-bold cursor-pointer transition select-none"
                                title="Modifier ce site"
                              >
                                <Edit className="h-2.5 w-2.5" />
                                <span>Éditer</span>
                              </button>
                              <button
                                onClick={() => handleDeleteSite(site.id, site.name)}
                                className="p-1 px-1.5 border border-red-200 rounded bg-white hover:bg-red-50 text-red-650 flex items-center gap-0.5 text-[10px] font-bold cursor-pointer transition select-none"
                                title="Supprimer ce site"
                              >
                                <Trash2 className="h-2.5 w-2.5" />
                                <span>Suppr.</span>
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Logo uploader */}
          <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-2xs flex flex-col justify-between">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900">Logo Établissement</h3>
                <p className="text-[11px] text-gray-500 mt-1">Ce logo sera imprimé en en-tête de toutes vos factures de ventes et tickets de caisse POS.</p>
              </div>

              {/* Upload Drag drop zone */}
              <div
                className="border-2 border-dashed border-gray-250 hover:border-[#1E4E8C] bg-gray-50 hover:bg-blue-50/15 p-6 rounded-lg text-center transition cursor-pointer"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleLogoFileChange(file);
                }}
                onClick={() => document.getElementById('company-logo-file-input')?.click()}
              >
                <input
                  id="company-logo-file-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleLogoFileChange(file);
                  }}
                  className="hidden"
                />

                {restLogo ? (
                  <div className="flex flex-col items-center gap-3">
                    <img
                      src={restLogo}
                      alt="Logo restaurant"
                      className="max-h-24 max-w-full object-contain rounded border bg-white shadow-2xs p-1"
                      referrerPolicy="no-referrer"
                    />
                    <div className="text-[11px] font-semibold text-[#1E4E8C] hover:underline">
                      Remplacer l'image
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4">
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="font-bold text-gray-700 text-xs">Déposer le logo ici</p>
                    <p className="text-[10px] text-gray-400 mt-1">Glissez-déposez ou cliquez pour parcourir</p>
                  </div>
                )}
              </div>

              {restLogo && (
                <button
                  id="remove-logo-btn"
                  onClick={() => {
                    setRestLogo('');
                    onUpdateTenant({
                      ...activeTenant,
                      logoUrl: ''
                    });
                  }}
                  className="w-full py-2 bg-red-50 hover:bg-red-100/50 text-red-600 rounded text-xs font-bold border border-red-100 flex items-center justify-center gap-1 cursor-pointer transition"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Enlever le Logo</span>
                </button>
              )}
            </div>

            <div className="p-3 bg-yellow-50/70 border border-yellow-105 rounded-lg text-[11px] text-yellow-850 mt-4 leading-relaxed">
              <span className="font-bold block text-yellow-900 mb-0.5">ℹ️ Recommandation</span>
              Utilisez un logo au format carré ou horizontal de petite taille, de préférence monochrome sur fond blanc, pour un rendu thermique papier optimal.
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: USER ISOLATION VISIBILITIES AND MODULES */}
      {activeSubTab === 'USERS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-5 border border-gray-150 rounded-xl shadow-2xs gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-gray-900">Droits des Utilisateurs & Autorisations de Visibilité</h3>
              <p className="text-xs text-gray-500 mt-1">Créez des profils d'employés et cochez individuellement les modules dont ils auront la visibilité dans leur interface.</p>
            </div>

            <button
              id="btn-trigger-add-user"
              onClick={handleOpenAddUserModal}
              className="px-4 py-2 bg-[#1E4E8C] hover:bg-blue-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer select-none self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Inscrire un Collaborateur</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tenantUsers.map(user => {
              // Derive visible modules text fallback
              const userMods = user.allowedModules && user.allowedModules.length > 0 
                ? user.allowedModules 
                : (user.role === 'ADMIN' || user.role === 'MANAGER' 
                  ? ['DASHBOARD', 'POS', 'ORDERS', 'CATALOGUE', 'STOCKS', 'PURCHASES', 'ACCOUNTING', 'ADMIN', 'SETTINGS']
                  : (user.role === 'CASHIER' ? ['POS', 'ORDERS'] : (user.role === 'WAREHOUSE' ? ['STOCKS', 'PURCHASES'] : ['DASHBOARD', 'ACCOUNTING'])));

              return (
                <div key={user.id} className="bg-white border text-xs rounded-xl overflow-hidden shadow-2xs flex flex-col justify-between hover:border-blue-300 transition-colors p-5 space-y-4 relative">
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-sans font-extrabold tracking-wider ${
                          user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                          user.role === 'MANAGER' ? 'bg-orange-100 text-orange-900' :
                          user.role === 'CASHIER' ? 'bg-blue-100 text-blue-800' :
                          user.role === 'WAREHOUSE' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {user.role}
                        </span>
                        <h4 className="font-extrabold text-[#1E4E8C] text-sm pt-1">{user.name}</h4>
                        <p className="text-gray-400 font-mono font-normal text-[10px]">{user.email}</p>
                      </div>

                      <div className="flex flex-col items-end gap-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold ${
                          user.active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-650'
                        }`}>
                          {user.active ? 'Actif' : 'Suspendu'}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t">
                      <span className="text-[10px] text-gray-400 block font-bold mb-1.5 uppercase tracking-wide">Modules Visibles ({userMods.length}) :</span>
                      <div className="flex flex-wrap gap-1">
                        {userMods.map(m => (
                          <span key={m} className="px-1.5 py-0.5 bg-gray-50 border text-gray-700 text-[10px] font-semibold rounded">
                            {moduleChoices.find(c => c.id === m)?.label || m}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t flex justify-end">
                    <button
                      id={`edit-user-btn-${user.id}`}
                      onClick={() => handleOpenEditUserModal(user)}
                      className="px-3 py-1.5 bg-gray-50 hover:bg-[#1E4E8C]/5 hover:text-[#1E4E8C] border text-gray-700 font-bold text-[11px] rounded flex items-center gap-1 cursor-pointer transition"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>Modifier Autorisations</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: REFERENCE LISTS */}
      {activeSubTab === 'REFERENCES' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* SEC 1: MODES D'ENCAISSEMENT */}
          <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-2xs space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900 border-b pb-2 flex items-center gap-2">
              <CreditCard className="h-4.5 w-4.5 text-[#1E4E8C]" />
              <span>Modes d'Encaissement</span>
            </h3>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  id="tag-new-payment-input"
                  type="text"
                  placeholder="ex: CARD, MOOV, CB..."
                  value={newPayment}
                  onChange={(e) => setNewPayment(e.target.value)}
                  className="flex-1 p-2 border border-gray-250 rounded text-xs uppercase"
                />
                <button
                  id="btn-add-payment-method"
                  onClick={handleAddPaymentMethod}
                  className="px-3 py-2 bg-[#1E4E8C] hover:bg-blue-800 text-white text-xs font-bold rounded cursor-pointer"
                >
                  Ajouter
                </button>
              </div>

              <div className="border rounded-lg overflow-hidden divide-y divide-gray-100 text-xs">
                {paymentMethods.map(m => (
                  <div key={m} className="flex justify-between items-center px-4 py-2.5 hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                      <span className="font-bold text-gray-800">{m}</span>
                      {m === 'CASH' && <span className="text-[9px] text-gray-400 bg-gray-100 px-1 py-0.2 rounded font-normal">Requis</span>}
                    </div>
                    {m !== 'CASH' && (
                      <button
                        id={`del-payment-btn-${m}`}
                        onClick={() => handleDeletePaymentMethod(m)}
                        className="text-gray-400 hover:text-red-650 p-1 rounded hover:bg-red-50 cursor-pointer transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SEC 2: UNITÉS DE MESURE */}
          <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-2xs space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900 border-b pb-2 flex items-center gap-2">
              <Scale className="h-4.5 w-4.5 text-[#1E4E8C]" />
              <span>Unités de Mesure</span>
            </h3>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  id="tag-new-unit-input"
                  type="text"
                  placeholder="ex: pièce, litre, g..."
                  value={newUnit}
                  onChange={(e) => setNewUnit(e.target.value)}
                  className="flex-1 p-2 border border-gray-250 rounded text-xs"
                />
                <button
                  id="btn-add-unit"
                  onClick={handleAddUnit}
                  className="px-3 py-2 bg-[#1E4E8C] hover:bg-blue-800 text-white text-xs font-bold rounded cursor-pointer"
                >
                  Ajouter
                </button>
              </div>

              <div className="border rounded-lg overflow-hidden divide-y divide-gray-100 text-xs text-gray-700">
                {unitsOfMeasurement.map(u => (
                  <div key={u} className="flex justify-between items-center px-4 py-2.5 hover:bg-gray-50">
                    <span className="font-semibold">{u}</span>
                    <button
                      id={`del-unit-btn-${u}`}
                      onClick={() => handleDeleteUnit(u)}
                      className="text-gray-400 hover:text-red-650 p-1 rounded hover:bg-red-50 cursor-pointer transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SEC 3: CATÉGORIES RESTO */}
          <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-2xs space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900 border-b pb-2 flex items-center gap-2">
              <FolderHeart className="h-4.5 w-4.5 text-[#1E4E8C]" />
              <span>Catégories RESTO</span>
            </h3>

            <div className="space-y-4">
              {/* Form Category */}
              <div className="p-3.5 bg-gray-50 rounded-lg space-y-2.5 text-xs text-gray-750 border">
                <span className="font-bold text-[#1E4E8C] block uppercase text-[10px] tracking-wide">Créer une catégorie</span>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-0.5">
                    <label className="text-[10px] text-gray-500 font-semibold">Code unique *</label>
                    <input
                      id="new-cat-code"
                      type="text"
                      placeholder="BOIS"
                      value={newCatCode}
                      onChange={(e) => setNewCatCode(e.target.value)}
                      className="w-full p-2 border bg-white rounded text-xs uppercase"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <label className="text-[10px] text-gray-500 font-semibold">Désignation *</label>
                    <input
                      id="new-cat-name"
                      type="text"
                      placeholder="Boissons"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="w-full p-2 border bg-white rounded text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-0.5">
                  <label className="text-[10px] text-gray-500 font-semibold">Description</label>
                  <input
                    id="new-cat-desc"
                    type="text"
                    placeholder="Sodas, jus et bières..."
                    value={newCatDesc}
                    onChange={(e) => setNewCatDesc(e.target.value)}
                    className="w-full p-2 border bg-white rounded text-xs"
                  />
                </div>

                <button
                  id="btn-add-category"
                  onClick={handleAddDishCategory}
                  className="w-full py-2 bg-[#1E4E8C] hover:bg-blue-800 text-white font-bold rounded cursor-pointer transition select-none"
                >
                  Ajouter la Catégorie
                </button>
              </div>

              {/* List of categories */}
              <div className="border rounded-lg overflow-hidden divide-y divide-gray-100 text-xs max-h-[175px] overflow-y-auto">
                {dishCategories.filter(c => c.tenantId === activeTenantId).map(c => (
                  <div key={c.id} className="flex justify-between items-start px-4 py-2.5 hover:bg-gray-50">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold bg-blue-50 text-[#1E4E8C] px-1 rounded">{c.code}</span>
                        <span className="font-bold text-gray-900">{c.name}</span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5 italic">{c.description || 'Aucune description'}</p>
                    </div>
                    
                    <button
                      id={`del-cat-btn-${c.id}`}
                      onClick={() => handleDeleteDishCategory(c.id, c.name)}
                      className="text-gray-400 hover:text-red-650 p-1 rounded hover:bg-red-50 cursor-pointer transition shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SEC 4: CATÉGORIES D'INGRÉDIENTS */}
          <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-2xs space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900 border-b pb-2 flex items-center gap-2">
              <FolderHeart className="h-4.5 w-4.5 text-[#1E4E8C]" />
              <span>Catégories d'Ingrédients</span>
            </h3>

            <div className="space-y-4">
              {/* Form Ingredient Category */}
              <div className="p-3.5 bg-gray-50 rounded-lg space-y-2.5 text-xs text-gray-750 border">
                <span className="font-bold text-[#1E4E8C] block uppercase text-[10px] tracking-wide">Créer une catégorie</span>
                
                <div className="space-y-0.5">
                  <label className="text-[10px] text-gray-500 font-semibold">Désignation *</label>
                  <input
                    id="new-ing-cat-name"
                    type="text"
                    placeholder="ex: Viande, Produits de nettoyage..."
                    value={newIngCatName}
                    onChange={(e) => setNewIngCatName(e.target.value)}
                    className="w-full p-2 border bg-white rounded text-xs"
                  />
                </div>

                <button
                  id="btn-add-ing-category"
                  onClick={handleAddIngCategory}
                  className="w-full py-2 bg-[#1E4E8C] hover:bg-blue-800 text-white font-bold rounded cursor-pointer transition select-none"
                >
                  Ajouter la Catégorie
                </button>
              </div>

              {/* List of ingredient categories */}
              <div className="border rounded-lg overflow-hidden divide-y divide-gray-100 text-xs max-h-[175px] overflow-y-auto">
                {ingredientCategories.filter(c => c.tenantId === activeTenantId).map(c => (
                  <div key={c.id} className="flex justify-between items-center px-4 py-2.5 hover:bg-gray-50">
                    <div className="flex-1 truncate">
                      <span className="font-bold text-gray-900">{c.name}</span>
                    </div>
                    
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEditIngCategory(c.id, c.name)}
                        className="text-gray-400 hover:text-blue-650 p-1 rounded hover:bg-blue-50 cursor-pointer transition shrink-0"
                        title="Modifier"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteIngCategory(c.id, c.name)}
                        className="text-gray-400 hover:text-red-650 p-1 rounded hover:bg-red-50 cursor-pointer transition shrink-0"
                        title="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SEC 5: TYPES DE CHARGES (FINANCE) */}
          <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-2xs space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900 border-b pb-2 flex items-center gap-2">
              <FolderHeart className="h-4.5 w-4.5 text-emerald-600" />
              <span>Types de Charges (Finance)</span>
            </h3>

            <div className="space-y-4">
              <p className="text-[10px] text-gray-500">
                Nature des charges et flux financiers du module de dépenses/bilan.
              </p>

              {/* Add form */}
              <div className="p-3 bg-gray-50 rounded-lg space-y-2 border text-xs">
                {editingChargeId ? (
                  <div className="space-y-2">
                    <span className="font-bold text-amber-700 block uppercase text-[9px] tracking-wide">Modifier le Type</span>
                    <input
                      id="edit-charge-name"
                      type="text"
                      placeholder="Nom de la charge..."
                      value={editingChargeName}
                      onChange={(e) => setEditingChargeName(e.target.value)}
                      className="w-full p-2 border bg-white rounded text-xs"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveChargeType}
                        className="flex-1 py-1 px-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-[11px]"
                      >
                        Enregistrer
                      </button>
                      <button
                        onClick={() => { setEditingChargeId(null); setEditingChargeName(''); }}
                        className="py-1 px-2.5 bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold rounded text-[11px]"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <span className="font-bold text-[#1E4E8C] block uppercase text-[9px] tracking-wide">Ajouter un Type</span>
                    <div className="flex gap-1.5">
                      <input
                        id="new-charge-name"
                        type="text"
                        placeholder="ex: Loyers, Assurance..."
                        value={newChargeName}
                        onChange={(e) => setNewChargeName(e.target.value)}
                        className="flex-1 p-2 border bg-white rounded text-xs"
                      />
                      <button
                        onClick={handleAddChargeType}
                        className="px-3 bg-[#1E4E8C] hover:bg-blue-800 text-white font-bold rounded"
                      >
                        +
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* List */}
              <div className="border rounded-lg overflow-hidden divide-y divide-gray-100 text-xs max-h-[175px] overflow-y-auto">
                {chargeTypes.filter(c => c.tenantId === activeTenantId).map(c => (
                  <div key={c.id} className="flex justify-between items-center px-3 py-2 hover:bg-gray-50">
                    <span className="font-bold text-gray-800 truncate">{c.name}</span>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => handleEditChargeType(c.id, c.name)}
                        className="text-gray-400 hover:text-blue-650 p-1 rounded hover:bg-blue-50 transition"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteChargeType(c.id, c.name)}
                        className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SEC 6: ANNÉES D'AFFAIRES */}
          <div className="bg-white p-5 border border-gray-200 rounded-xl shadow-2xs space-y-4">
            <h3 className="text-sm font-extrabold text-gray-900 border-b pb-2 flex items-center gap-2">
              <Calendar className="h-4.5 w-4.5 text-[#1E4E8C]" />
              <span>Années d'Affaires (Bilan)</span>
            </h3>

            <div className="space-y-4">
              <p className="text-[10px] text-gray-500">
                Configurez les années d'analyse comptables disponibles dans les filtres de périodes.
              </p>

              {/* Add form */}
              <div className="p-3 bg-gray-50 rounded-lg space-y-2 border text-xs">
                <span className="font-bold text-[#1E4E8C] block uppercase text-[9px] tracking-wide">Ajouter une Année</span>
                <div className="flex gap-1.5">
                  <input
                    id="new-business-year-input"
                    type="number"
                    min="2000"
                    max="2100"
                    placeholder="ex: 2028"
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    className="flex-1 p-2 border bg-white rounded text-xs animate-none"
                  />
                  <button
                    id="btn-add-business-year"
                    onClick={handleAddBusinessYear}
                    className="px-3 bg-[#1E4E8C] hover:bg-blue-800 text-white font-bold rounded cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* List */}
              <div className="border rounded-lg overflow-hidden divide-y divide-gray-100 text-xs max-h-[175px] overflow-y-auto">
                {businessYears.map(year => (
                  <div key={year} className="flex justify-between items-center px-4 py-2.5 hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse animate-none"></span>
                      <span className="font-bold text-gray-800">{year}</span>
                    </div>
                    <button
                      id={`del-year-btn-${year}`}
                      onClick={() => handleDeleteBusinessYear(year)}
                      className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: EXCEL BULK MASTER DATA IMPORT */}
      {activeSubTab === 'IMPORT_EXCEL' && (
        <div className="space-y-6">
          {/* Top banner / Guidance */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-[#1E4E8C] flex items-center gap-1.5">
                <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                <span>Assistant d'Importation de Données Excel</span>
              </h4>
              <p className="text-xs text-gray-600">
                Configurez rapidement votre établissement en important en masse votre catalogue d'articles, vos fiches d'ingrédients et vos fiches techniques de production (BOM).
              </p>
            </div>
            <button
              id="btn-download-sample-excel"
              onClick={downloadSampleExcel}
              className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-750 text-xs font-bold border border-gray-250 rounded shadow-2xs flex items-center justify-center gap-1.5 transition shrink-0 cursor-pointer"
            >
              <Download className="h-4 w-4 text-blue-600" />
              <span>Télécharger le Fichier Modèle</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* COLUMN 1: WIDGET UPLOAD & PREVIEW */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white p-6 border border-gray-255 rounded-xl shadow-2xs space-y-4">
                <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider pb-2 border-b">
                  1. Charger le Fichier Excel
                </h3>

                {/* Drag and drop input */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#1E4E8C] hover:bg-gray-50/50 transition duration-150 group"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleExcelImport(file);
                    }}
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                  />
                  <div className="p-3 bg-blue-50 text-[#1E4E8C] rounded-full group-hover:scale-110 transition duration-155">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-extrabold text-[#1E4E8C]">Sélectionner ou Glisser le fichier excel</p>
                    <p className="text-[10px] text-gray-400 mt-1">Accepte les formats .xlsx, .xls, .csv</p>
                  </div>
                </div>

                {/* State: Idle / Parsed / Saved */}
                {importStatus !== 'IDLE' && (
                  <div className="space-y-4 pt-2">
                    <div className="bg-gray-50 rounded p-4 text-xs space-y-3">
                      <span className="font-bold text-gray-900 block border-b pb-1">Statut de l'Analyse :</span>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-semibold">
                          <span className="text-gray-500">Plats et Menus :</span>
                          <span className="font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">
                            {importSummary.dishes.length} trouvé(s)
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-semibold">
                          <span className="text-gray-500">Matières Premières :</span>
                          <span className="font-mono bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                            {importSummary.ingredients.length} trouvé(s)
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-semibold">
                          <span className="text-gray-500">Lignes Fiches Techniques :</span>
                          <span className="font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                            {importSummary.recipes.length} trouvé(s)
                          </span>
                        </div>
                      </div>

                      {/* Display parsing logs */}
                      <div className="bg-gray-950 text-gray-100 p-2.5 rounded font-mono text-[10px] max-h-36 overflow-y-auto leading-relaxed space-y-1">
                        {importSummary.logs.map((log, lidx) => (
                          <div key={lidx}>{log}</div>
                        ))}
                      </div>
                    </div>

                    {importStatus === 'PARSED' && (
                      <button
                        id="btn-execute-excel-import"
                        onClick={handleExecuteImport}
                        className="w-full py-2.5 bg-green-700 hover:bg-green-800 text-white font-extrabold rounded text-xs flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs cursor-pointer select-none active:scale-98 transition transform duration-155"
                      >
                        <CheckCircle className="h-4.5 w-4.5" />
                        <span>Confirmer l'Importation Réelle</span>
                      </button>
                    )}

                    {importStatus === 'SAVED' && (
                      <div className="p-3 bg-emerald-50 text-emerald-850 border border-emerald-200 rounded text-center text-xs font-bold leading-relaxed">
                        🎉 Données du catalogue stockées avec succès dans l'établissement ! Tous les codes d'articles et matières premières ont été générés de manière unique automatiquement.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* COLUMN 2: EXCEL STRUCTURE GUIDE */}
            <div className="lg:col-span-3 bg-white p-6 border border-gray-255 rounded-xl shadow-2xs space-y-5">
              <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider pb-2 border-b flex items-center gap-1.5">
                <span>Structure Obligatoire des Onglets d'Importation</span>
              </h3>

              <p className="text-xs text-gray-500 leading-relaxed">
                Votre fichier Excel doit être structuré avec **trois onglets séparés** (ou au moins l'un d'entre eux). Le système détecte automatiquement les colonnes correspondantes. Les identifiants uniques et <strong>les codes d'articles sont générés de manière entièrement automatique</strong>.
              </p>

              <div className="space-y-6">
                {/* 1. Onglet Plats & Menus */}
                <div className="space-y-2">
                  <span className="text-xs font-extrabold text-[#1E4E8C] block">
                    Onglet 1 : « Plats & Menus »
                  </span>
                  <p className="text-[11px] text-gray-650">Définit les plats vendus aux clients (avec affectation automatique ou création de nouvelles catégories).</p>
                  
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-[11px] text-left">
                      <thead>
                        <tr className="bg-gray-50 text-gray-700 border-b border-gray-200 font-bold">
                          <th className="p-2 font-mono text-[10px]">Nom</th>
                          <th className="p-2 font-mono text-[10px]">Description</th>
                          <th className="p-2 font-mono text-[10px]">Prix</th>
                          <th className="p-2 font-mono text-[10px]">Categorie</th>
                          <th className="p-2 font-mono text-[10px]">TempsPrep</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-150">
                        <tr className="text-gray-655">
                          <td className="p-2 font-semibold text-gray-800">Poulet DG Classique</td>
                          <td className="p-2 italic text-gray-400">Poulet sauté aux plantains mûrs...</td>
                          <td className="p-2 font-mono text-gray-800">4500</td>
                          <td className="p-2 text-gray-800 font-semibold text-blue-600">RESTO</td>
                          <td className="p-2 font-mono">25</td>
                        </tr>
                        <tr className="text-gray-655">
                          <td className="p-2 font-semibold text-gray-800">Jus d'Ananas Bio</td>
                          <td className="p-2 italic text-gray-400">Jus d'ananas pressé frais...</td>
                          <td className="p-2 font-mono text-gray-800">1500</td>
                          <td className="p-2 text-gray-800 font-semibold text-emerald-600">BOISSON</td>
                          <td className="p-2 font-mono">5</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="text-[10px] text-gray-400 italic font-semibold">
                    * Note : Si la Catégorie n'existe pas, elle sera créée spontanément de manière automatique.
                  </div>
                </div>

                {/* 2. Onglet Ingrédients */}
                <div className="space-y-2">
                  <span className="text-xs font-extrabold text-amber-700 block">
                    Onglet 2 : « Ingredients » ou « Ingrédients »
                  </span>
                  <p className="text-[11px] text-gray-650">Modélise la liste des matières premières stockées et valorisées.</p>
                  
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-[11px] text-left">
                      <thead>
                        <tr className="bg-gray-50 text-gray-700 border-b border-gray-200 font-bold">
                          <th className="p-2 font-mono text-[10px]">Nom</th>
                          <th className="p-2 font-mono text-[10px]">Unite</th>
                          <th className="p-2 font-mono text-[10px]">CoutUnitaire</th>
                          <th className="p-2 font-mono text-[10px]">StockActuel</th>
                          <th className="p-2 font-mono text-[10px]">StockMin</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-150">
                        <tr className="text-gray-655">
                          <td className="p-2 font-semibold text-gray-800">Poulet Entier</td>
                          <td className="p-2 text-gray-700">kg</td>
                          <td className="p-2 font-mono text-gray-800">2200</td>
                          <td className="p-2 font-mono text-gray-750">15</td>
                          <td className="p-2 font-mono text-red-600">5</td>
                        </tr>
                        <tr className="text-gray-655">
                          <td className="p-2 font-semibold text-gray-800">Plantain Mûr</td>
                          <td className="p-2 text-gray-700">kg</td>
                          <td className="p-2 font-mono text-gray-800">800</td>
                          <td className="p-2 font-mono text-gray-750">30</td>
                          <td className="p-2 font-mono text-red-600">10</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Onglet Fiches Techniques */}
                <div className="space-y-2">
                  <span className="text-xs font-extrabold text-emerald-700 block">
                    Onglet 3 : « Fiches Techniques » ou « Recettes »
                  </span>
                  <p className="text-[11px] text-gray-650">Fait le pont (liaison BOM / Fiches Ratios) entre les plats vendus et leurs matières premières.</p>
                  
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-[11px] text-left">
                      <thead>
                        <tr className="bg-gray-50 text-gray-700 border-b border-gray-200 font-bold">
                          <th className="p-2 font-mono text-[10px]">Plat_Nom</th>
                          <th className="p-2 font-mono text-[10px]">Ingredient_Nom</th>
                          <th className="p-2 font-mono text-[10px]">Quantite</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-150">
                        <tr className="text-gray-655">
                          <td className="p-2 font-semibold text-gray-800">Poulet DG Classique</td>
                          <td className="p-2 text-gray-700">Poulet Entier</td>
                          <td className="p-2 font-mono font-bold text-gray-800">0.5</td>
                        </tr>
                        <tr className="text-gray-655">
                          <td className="p-2 font-semibold text-gray-800">Poulet DG Classique</td>
                          <td className="p-2 text-gray-700">Plantain Mûr</td>
                          <td className="p-2 font-mono font-bold text-gray-800">0.75</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-emerald-50 text-emerald-850 p-3 rounded text-[10.5px] leading-relaxed font-semibold">
                    💡 <strong>Calcul Atomique de Marge</strong> : Le système recalculera de manière immédiate le Coût de Revient (BOM) théorique de vos plats ainsi que <strong>votre Pourcentage de Marge</strong> en synthétisant vos fiches techniques lors de la validation !
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: UNIFIED JSON BACKUP & PORTABILITY */}
      {activeSubTab === 'JSON_BACKUP' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1 font-sans">
              <h3 className="text-sm font-extrabold text-[#1E4E8C] flex items-center gap-2">
                <Settings className="h-5 w-5 text-[#1E4E8C]" />
                <span>Sauvegarde Unifiée & Portabilité de Crash (Import / Export JSON)</span>
              </h3>
              <p className="text-xs text-gray-650 leading-relaxed max-w-2xl font-semibold">
                Ce module professionnel vous permet d'exporter l'intégralité de la base de données ERP en un unique fichier portable <strong className="font-bold">JSON</strong>, garantissant une protection maximale contre les pannes et une portabilité instantanée de vos données d'un équipement à l'autre.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* EXPORT BLOCK */}
            <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-2xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3 font-sans">
                <span className="text-[10px] font-bold text-[#1E4E8C] bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider inline-block">Étape 1 : Sauvegarder</span>
                <h4 className="text-sm font-bold text-gray-900">Exporter la Base de Données</h4>
                <p className="text-xs text-gray-500 font-normal leading-relaxed">
                  Générez instantanément un fichier de sauvegarde codé au format JSON de tous vos sites, fiches de recettes d'ingrédients, plats, stocks, achats, financiers, collaborateurs et logs d'audit. Conservez ce fichier dans un dossier sécurisé de votre ordinateur.
                </p>
              </div>

              <div className="pt-4 border-t mt-4">
                <button
                  id="btn-export-database-json"
                  onClick={exportFullDatabase}
                  className="w-full md:w-auto px-5 py-2.5 bg-[#1E4E8C] hover:bg-blue-800 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer transition select-none active:scale-95"
                >
                  <Download className="h-4 w-4" />
                  <span>Exporter les données complètes (JSON)</span>
                </button>
              </div>
            </div>

            {/* IMPORT BLOCK */}
            <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-2xs space-y-4 flex flex-col justify-between">
              <div className="space-y-3 font-sans">
                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded uppercase tracking-wider inline-block">Étape 2 : Restaurer</span>
                <h4 className="text-sm font-bold text-gray-900">Importer un fichier de sauvegarde</h4>
                <p className="text-xs text-gray-500 font-normal leading-relaxed">
                  En cas d'incident matériel majeur, de panne réseau locale, ou pour copier vos bases de données sur une autre antenne Kissineflow, importez votre fichier de sauvegarde JSON pour restaurer l'intégralité du système à l'état sauvegardé exact.
                </p>
              </div>

              <div className="pt-4 border-t mt-4">
                <input
                  type="file"
                  id="json-db-uploader"
                  ref={jsonBackupRef}
                  onChange={importFullDatabase}
                  accept=".json"
                  className="hidden"
                />
                <button
                  id="btn-import-database-json"
                  onClick={() => jsonBackupRef.current?.click()}
                  className="w-full md:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-[#FFF] font-bold rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer transition select-none active:scale-95"
                >
                  <Upload className="h-4 w-4" />
                  <span>Importer & Restaurer un Fichier (JSON)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL USER EDIT OR INSCRIPTION */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 border shadow-2xl relative">
            <h3 className="text-base font-extrabold text-gray-900 mb-4 pb-2 border-b flex items-center gap-1.5">
              <UserCheck className="h-5 w-5 text-[#1E4E8C]" />
              <span>{editingUser ? `Modifier les accès de ${userName}` : "Inscrire un nouveau collaborateur"}</span>
            </h3>

            <div className="space-y-4 text-xs text-gray-750 max-h-[75vh] overflow-y-auto pr-1">
              {/* Profile detail */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-650 block font-semibold">Nom complet *</label>
                  <input
                    id="user-modal-name"
                    type="text"
                    placeholder="ex: Seydou Ndiaye..."
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-full p-2 border rounded text-gray-950 focus:ring-1 focus:ring-[#1E4E8C]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-gray-650 block font-semibold">Adresse email d'affaires *</label>
                  <input
                    id="user-modal-email"
                    type="email"
                    placeholder="seydou@restaurant.com"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full p-2 border rounded text-gray-950 focus:ring-1 focus:ring-[#1E4E8C]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-650 block font-semibold">Rôle Métier (Générateur de modèle automatique)</label>
                  <select
                    id="user-modal-role"
                    value={userRole}
                    onChange={(e) => handleSetRolePreset(e.target.value as any)}
                    className="w-full p-2 border bg-white rounded text-gray-750 focus:outline-[#1E4E8C]"
                  >
                    <option value="CASHIER">CASHIER (Caisse tactile POS)</option>
                    <option value="WAREHOUSE">WAREHOUSE (Stocks et achats)</option>
                    <option value="ACCOUNTING">ACCOUNTING (Registres financiers et closures)</option>
                    <option value="MANAGER">MANAGER (Gestion opérationnelle d'établissement)</option>
                    <option value="ADMIN">ADMIN (Contrôle total système)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-gray-650 block font-semibold">Statut d'accès au système</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setUserStatus(true)}
                      className={`flex-1 py-2 text-xs font-bold rounded border transition-colors cursor-pointer ${
                        userStatus ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-gray-50 text-gray-400'
                      }`}
                    >
                      Actif (Autorisé)
                    </button>
                    <button
                      type="button"
                      onClick={() => setUserStatus(false)}
                      className={`flex-1 py-2 text-xs font-bold rounded border transition-colors cursor-pointer ${
                        !userStatus ? 'bg-red-50 border-red-500 text-red-700' : 'bg-gray-50 text-gray-400'
                      }`}
                    >
                      Suspendu (Bloqué)
                    </button>
                  </div>
                </div>
              </div>

              {/* MODULE VISIBILITIES CHECKBOXES */}
              <div className="bg-gray-50 p-4 border rounded-xl space-y-2.5">
                <span className="font-extrabold text-[#1E4E8C] block uppercase text-[10px] tracking-wide flex items-center gap-1">
                  <ShieldAlert className="h-4 w-4 text-orange-600" />
                  <span>Modules Visibles dans l'interface de l'employé</span>
                </span>
                <p className="text-[10px] text-gray-500 leading-relaxed mb-2">Cochez individuellement les modules que ce collaborateur pourra voir et utiliser dans son espace de travail.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-2 text-xs">
                  {moduleChoices.map(c => {
                    const isChecked = userModules.includes(c.id);
                    return (
                      <label key={c.id} className="flex items-center gap-2 p-2 bg-white rounded border hover:bg-gray-50/70 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleModuleInList(c.id)}
                          className="h-4 w-4 rounded border-gray-300 text-[#1E4E8C] focus:ring-[#1E4E8C]"
                        />
                        <span className="font-semibold text-gray-700">{c.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-5 pt-3 border-t">
              <button
                id="user-modal-cancel"
                onClick={() => setShowUserModal(false)}
                className="px-4 py-2 bg-gray-100 rounded text-gray-700 hover:bg-gray-200 text-xs font-bold cursor-pointer"
              >
                Annuler
              </button>
              <button
                id="user-modal-submit"
                onClick={handleSaveUser}
                className="px-5 py-2 bg-[#1E4E8C] hover:bg-blue-800 text-white font-extrabold rounded text-xs cursor-pointer active:scale-95 transition-transform"
              >
                Enregistrer l'Employé
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-[99999] max-w-sm p-4 rounded-xl shadow-xl flex items-center gap-3 border transition-all duration-300 animate-fade-in ${
          toast.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-900 shadow-rose-100/40'
            : 'bg-emerald-50 border-emerald-200 text-emerald-950 shadow-emerald-100/40'
        }`}>
          {toast.type === 'error' ? (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          )}
          <span className="text-xs font-semibold leading-relaxed">
            {toast.text}
          </span>
        </div>
      )}

      {/* CREATION/MODIFICATION SITE MODAL */}
      {showSiteModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 border shadow-2xl relative text-xs text-gray-750">
            <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b flex items-center gap-1.5 font-sans">
              <MapPin className="h-5 w-5 text-[#1E4E8C]" />
              {siteToEdit ? `Ajuster le Site : ${siteToEdit.name}` : "Créer un Nouveau Site Opérationnel"}
            </h3>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-gray-650 block font-semibold">Nom d'Enseigne du Site *</label>
                <input
                  type="text"
                  placeholder="ex: Kissine Bastos, Douala Akwa..."
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full p-2 border bg-white rounded font-semibold text-gray-900 focus:ring-1 focus:ring-[#1E4E8C]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-650 block font-semibold">Téléphone standard</label>
                <input
                  type="text"
                  placeholder="ex: +237 6xx..."
                  value={sitePhone}
                  onChange={(e) => setSitePhone(e.target.value)}
                  className="w-full p-2 border bg-white rounded font-mono text-gray-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-650 block font-semibold">Adresse physique complète</label>
                <input
                  type="text"
                  placeholder="ex: Boulevard de la Liberté..."
                  value={siteAddress}
                  onChange={(e) => setSiteAddress(e.target.value)}
                  className="w-full p-2 border bg-white rounded text-gray-905"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-gray-650 block font-semibold">Ville *</label>
                  <input
                    type="text"
                    placeholder="Yaoundé"
                    value={siteCity}
                    onChange={(e) => setSiteCity(e.target.value)}
                    className="w-full p-2 border bg-white rounded text-gray-905"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-650 block font-semibold">Pays *</label>
                  <input
                    type="text"
                    placeholder="Cameroun"
                    value={siteCountry}
                    onChange={(e) => setSiteCountry(e.target.value)}
                    className="w-full p-2 border bg-white rounded text-gray-905"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-5 pt-3 border-t">
              <button
                onClick={() => { setShowSiteModal(false); setSiteToEdit(null); }}
                className="px-4 py-2 bg-gray-100 rounded text-gray-700 hover:bg-gray-200 cursor-pointer text-xs"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveSite}
                className="px-4 py-2 bg-[#1E4E8C] text-white font-bold rounded hover:bg-blue-800 cursor-pointer text-xs"
              >
                {siteToEdit ? "Sauvegarder" : "Créer le Site"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
