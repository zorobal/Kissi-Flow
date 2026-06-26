/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Building2,
  Users,
  TrendingUp,
  Plus,
  Trash2,
  Edit,
  ShieldCheck,
  Search,
  Check,
  AlertCircle,
  X,
  FileDown,
  FileUp,
  Sliders,
  DollarSign,
  Layers,
  Activity,
  Maximize2,
  Shield,
  Filter,
  Server,
  RefreshCw,
  UserCheck,
  UserX,
  UserPlus,
  FileText,
  Cloud,
  Database,
  Save,
  Copy,
  Percent,
  ShoppingBag
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { Tenant, User, Order, Ingredient, Expense, UserPermission, AuditLog } from '../types';

interface SuperAdminViewProps {
  tenants: Tenant[];
  users: User[];
  orders: Order[];
  ingredients: Ingredient[];
  expenses: Expense[];
  auditLogs?: AuditLog[];
  onAddTenant: (t: Tenant, adminUser: User, prefill?: boolean) => void;
  onUpdateTenant: (t: Tenant) => void;
  onDeleteTenant: (id: string) => void;
  onRestoreTenantData: (tenantId: string, importedData: any) => void;
  onExportTenantData: (tenantId: string) => any;
  logsAction: (action: string, module: string) => void;
  onUpdateUsers?: (updatedUsers: User[]) => void;

  // Additional optional collections for Cloud Syncing
  dishes?: any[];
  recipes?: any[];
  stockMovements?: any[];
  physicalInventories?: any[];
  suppliers?: any[];
  purchaseOrders?: any[];
  purchaseRequests?: any[];
  cashMovements?: any[];
  dailyClosures?: any[];
  paymentMethods?: any[];
  unitsOfMeasurement?: any[];
  businessYears?: any[];
  dishCategories?: any[];
  ingredientCategories?: any[];
  chargeTypes?: any[];
  activeTenantId?: string;
  onUpdateTenants?: (updated: any[]) => void;
  onUpdateDishes?: (updated: any[]) => void;
  onUpdateIngredients?: (updated: any[]) => void;
  onUpdateRecipes?: (updated: any[]) => void;
  onUpdateOrders?: (updated: any[]) => void;
  onUpdateStockMovements?: (updated: any[]) => void;
  onUpdatePhysicalInventories?: (updated: any[]) => void;
  onUpdateSuppliers?: (updated: any[]) => void;
  onUpdatePurchaseRequests?: (updated: any[]) => void;
  onUpdatePurchaseOrders?: (updated: any[]) => void;
  onUpdateCashMovements?: (updated: any[]) => void;
  onUpdateDailyClosures?: (updated: any[]) => void;
  onUpdateAuditLogs?: (updated: any[]) => void;
  onUpdateExpenses?: (updated: any[]) => void;
  onChangePaymentMethods?: (updated: any[]) => void;
  onChangeUnitsOfMeasurement?: (updated: any[]) => void;
  onChangeBusinessYears?: (updated: any[]) => void;
  onChangeDishCategories?: (updated: any[]) => void;
  onChangeIngredientCategories?: (updated: any[]) => void;
  onChangeChargeTypes?: (updated: any[]) => void;
}

export default function SuperAdminView({
  tenants,
  users,
  orders,
  ingredients,
  expenses,
  auditLogs = [],
  onAddTenant,
  onUpdateTenant,
  onDeleteTenant,
  onRestoreTenantData,
  onExportTenantData,
  logsAction,
  onUpdateUsers,

  // Destructure optional collections with empty fallbacks
  dishes = [],
  recipes = [],
  stockMovements = [],
  physicalInventories = [],
  suppliers = [],
  purchaseOrders = [],
  purchaseRequests = [],
  cashMovements = [],
  dailyClosures = [],
  paymentMethods = [],
  unitsOfMeasurement = [],
  businessYears = [],
  dishCategories = [],
  ingredientCategories = [],
  chargeTypes = [],
  activeTenantId = '',
  onUpdateTenants,
  onUpdateDishes,
  onUpdateIngredients,
  onUpdateRecipes,
  onUpdateOrders,
  onUpdateStockMovements,
  onUpdatePhysicalInventories,
  onUpdateSuppliers,
  onUpdatePurchaseRequests,
  onUpdatePurchaseOrders,
  onUpdateCashMovements,
  onUpdateDailyClosures,
  onUpdateAuditLogs,
  onUpdateExpenses,
  onChangePaymentMethods,
  onChangeUnitsOfMeasurement,
  onChangeBusinessYears,
  onChangeDishCategories,
  onChangeIngredientCategories,
  onChangeChargeTypes
}: SuperAdminViewProps) {
  const [activeTab, setActiveTab] = useState<'LIST' | 'KPI_EXPLORER' | 'AUDIT_LOGS' | 'COLLABORATORS_GLOBAL' | 'SUPABASE_SYNC' | 'SCENARIOS'>('LIST');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create client form
  const [showAddModal, setShowAddModal] = useState(false);
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientCity, setClientCity] = useState('');
  const [clientCountry, setClientCountry] = useState('Cameroun');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('activation2026'); // Temporary pass
  const [prefillCatalog, setPrefillCatalog] = useState(true);

  // Edit client state
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  // Selected client for synthetic dashboard
  const [selectedKpiTenantId, setSelectedKpiTenantId] = useState<string>(tenants[0]?.id || '');

  // File import state
  const [importStatus, setImportStatus] = useState<{ success?: boolean; msg?: string } | null>(null);

  // Password reset inline state
  const [editingUserPasswordId, setEditingUserPasswordId] = useState<string | null>(null);
  const [tempNewUserPassword, setTempNewUserPassword] = useState('');

  // SUPABASE CLOUD SYNC STATES & HELPER FUNCTIONS
  const [supabaseUrl, setSupabaseUrl] = useState<string>(() => localStorage.getItem('supabase-sync-url') || (import.meta as any).env?.VITE_SUPABASE_URL || '');
  const [supabaseKey, setSupabaseKey] = useState<string>(() => localStorage.getItem('supabase-sync-key') || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '');
  const [syncStatus, setSyncStatus] = useState<'IDLE' | 'SYNCING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [syncLog, setSyncLog] = useState<string[]>([]);
  const [showSqlInstructions, setShowSqlInstructions] = useState<boolean>(false);
  const [selectedSyncTenantId, setSelectedSyncTenantId] = useState<string>(() => activeTenantId || (tenants[0]?.id || ''));
  const [detectedTenants, setDetectedTenants] = useState<string[]>([]);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [useManualSyncId, setUseManualSyncId] = useState<boolean>(false);
  const [manualSyncId, setManualSyncId] = useState<string>('');
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // 4 ARCHITECTURAL SCENARIOS STATES
  const [selectedScenarioId, setSelectedScenarioId] = useState<number>(1);
  const [simulatedLocalIp, setSimulatedLocalIp] = useState<string>('192.168.1.100');
  const [simulatedPort, setSimulatedPort] = useState<string>('54321');
  const [simulatedDbName, setSimulatedDbName] = useState<string>('kissineflow_local_db');
  const [selectedScenarioTenantId, setSelectedScenarioTenantId] = useState<string>(() => tenants[0]?.id || 'le-paradis');
  const [simulatedConsoleLogs, setSimulatedConsoleLogs] = useState<string[]>(['[SYSTÈME] Terminal de simulation prêt. Sélectionnez un scénario pour tester sa topologie.']);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  
  // Checklist for each scenario
  const [checklistScen2, setChecklistScen2] = useState({
    postgresInstalled: false,
    fixedIpConfigured: false,
    portOpened: false,
  });
  const [checklistScen3, setChecklistScen3] = useState({
    serverNodeInstalled: false,
    lanConnected: false,
    firewallConfigured: false,
  });
  const [checklistScen4, setChecklistScen4] = useState({
    tauriInstalled: false,
    sqliteDatabaseConfigured: false,
    electronPackaged: false,
  });

  const handleRunSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimulatedConsoleLogs([`[INIT] Déclenchement de la simulation d'architecture pour le Scénario ${selectedScenarioId}...`]);
    
    const steps: string[] = [];
    if (selectedScenarioId === 1) {
      steps.push(
        `📡 [RÉSEAU] Résolution de l'URL Cloud Supabase...`,
        `🔒 [SÉCURITÉ] Vérification du certificat SSL de Supabase.io (HTTPS)...`,
        `🔑 [AUTH] Envoi de la clé publique anon-key...`,
        `📥 [REQUÊTE] SELECT * FROM public.kissineflow_sync WHERE tenant_id = '${selectedScenarioTenantId}'...`,
        `💾 [DONNÉES] Chargement de l'état local dans le navigateur depuis le Cloud...`,
        `✅ [SUCCÈS] Connexion établie ! Latence : 42ms. Vos données transitent de manière sécurisée par Internet.`
      );
    } else if (selectedScenarioId === 2) {
      steps.push(
        `🖥️ [LAN] Ping de l'IP du serveur local : ${simulatedLocalIp}...`,
        `🔌 [PORT] Tentative de connexion sur le port PostgreSQL : ${simulatedPort}...`,
        `🛡️ [FIREWALL] Passage des règles de sécurité du réseau local...`,
        `🗄️ [DATABASE] Authentification réussie sur la base PostgreSQL '${simulatedDbName}'...`,
        `📊 [SQL] Exécution de la requête de synchronisation pour l'établissement '${selectedScenarioTenantId}'...`,
        `🔌 [STATUT] Connecté en réseau local (LAN). Latence : < 1ms (Ultra-rapide, 100% Hors-ligne d'Internet !)`
      );
    } else if (selectedScenarioId === 3) {
      steps.push(
        `🌐 [BROWSER] Client se connecte à l'URL HTTP : http://${simulatedLocalIp}...`,
        `🚀 [SERVEUR] Le serveur Node/Express local reçoit la connexion HTTP...`,
        `📄 [VITE] Serveur de fichiers statiques distribue l'ERP (Fichiers HTML/JS compilés)...`,
        `🗃️ [DOCKER/SQL] Connexion à la base PostgreSQL locale '${simulatedDbName}'...`,
        `📱 [APPAREIL] Rendu complet de l'interface ERP sur l'appareil client (Tablette/Smartphones)...`,
        `🏆 [SUCCÈS] Mode "Serveur Web Local" opérationnel. Zéro installation requise sur les terminaux clients.`
      );
    } else {
      steps.push(
        `📦 [TAURI] Lancement de l'exécutable natif compilé KissineFlow.exe...`,
        `📂 [FICHIER] Chargement du fichier de base de données embarqué : ~/.kissineflow/${simulatedDbName}.db...`,
        `🧩 [SQLITE] Initialisation du pilote SQLite (Pilote rust-sqlite à thread unique)...`,
        `💾 [PERSISTANCE] Les 19 tables de l'ERP ont été indexées localement sur le SSD de l'ordinateur...`,
        `⚡ [PERFORMANCES] Chargement de 10 000 lignes d'inventaire en 5ms...`,
        `🔒 [CONFIDENTIALITÉ] 100% Hors-ligne. Les données restent strictement confinées sur le stockage local.`
      );
    }

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < steps.length) {
        setSimulatedConsoleLogs(prev => [...prev, steps[currentStep]]);
        currentStep++;
      } else {
        clearInterval(interval);
        setIsSimulating(false);
      }
    }, 600);
  };

  const getSupabaseClient = (url: string, key: string) => {
    try {
      if (!url || !key) return null;
      return createClient(url.trim(), key.trim(), {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      });
    } catch (e) {
      console.error("Error creating supabase client:", e);
      return null;
    }
  };

  const handleSaveKeys = () => {
    localStorage.setItem('supabase-sync-url', supabaseUrl.trim());
    localStorage.setItem('supabase-sync-key', supabaseKey.trim());
    setToast({ text: "Clés API Supabase enregistrées localement !", type: 'success' });
    setTimeout(() => setToast(null), 3000);
    logsAction("SuperAdmin: Enregistrement local des clés d'API Supabase", 'SÉCURITÉ');
  };

  const handleTestConnection = async () => {
    if (!supabaseUrl || !supabaseKey) {
      setSyncLog(["❌ URL ou Clé d'API Supabase manquante."]);
      setSyncStatus('ERROR');
      return;
    }

    setSyncStatus('SYNCING');
    setSyncLog(["🔄 Test de la connexion à Supabase...", `URL : ${supabaseUrl.trim()}`]);

    const client = getSupabaseClient(supabaseUrl, supabaseKey);
    if (!client) {
      setSyncLog(prev => [...prev, "❌ Impossible d'initialiser le client Supabase. Vérifiez les formats."]);
      setSyncStatus('ERROR');
      return;
    }

    try {
      const { error } = await client
        .from('kissineflow_sync')
        .select('id')
        .limit(1);

      if (error) {
        setSyncLog(prev => [
          ...prev,
          `❌ Échec de la connexion à la table 'kissineflow_sync' : ${error.message}`,
          "💡 Astuce : Assurez-vous d'avoir exécuté le script SQL d'initialisation dans votre éditeur SQL Supabase pour créer la table."
        ]);
        setSyncStatus('ERROR');
      } else {
        setSyncLog(prev => [
          ...prev,
          "✅ Connexion réussie !",
          "🎉 L'application peut communiquer de manière sécurisée avec votre base Supabase et la table 'kissineflow_sync' est opérationnelle."
        ]);
        setSyncStatus('SUCCESS');
        logsAction("SuperAdmin: Test de connexion réussi vers Supabase", 'SÉCURITÉ');
      }
    } catch (err: any) {
      setSyncLog(prev => [...prev, `❌ Erreur inattendue : ${err.message || err}`]);
      setSyncStatus('ERROR');
    }
  };

  const handleDetectTenants = async () => {
    if (!supabaseUrl || !supabaseKey) {
      setSyncLog(prev => [...prev, "❌ URL ou Clé d'API Supabase manquante."]);
      return;
    }
    setIsDetecting(true);
    setSyncLog(prev => [...prev, "📡 Détection des établissements disponibles sur Supabase..."]);
    try {
      const client = getSupabaseClient(supabaseUrl, supabaseKey);
      if (!client) {
        setSyncLog(prev => [...prev, "❌ Impossible d'initialiser le client Supabase."]);
        setIsDetecting(false);
        return;
      }
      const { data, error } = await client
        .from('kissineflow_sync')
        .select('tenant_id');
      
      if (error) {
        setSyncLog(prev => [...prev, `❌ Échec de la détection : ${error.message}`]);
      } else if (data) {
        const rawKeys = Array.from(new Set(data.map(item => item.tenant_id)));
        const mode = (localStorage.getItem('erp-global-mode') as string || 'CLIENT').toLowerCase();
        const prefix = `${mode}_`;
        const filtered = rawKeys
          .filter(key => key.startsWith(prefix))
          .map(key => key.replace(prefix, ''));
        
        setDetectedTenants(filtered);
        setSyncLog(prev => [
          ...prev, 
          `✅ Détection réussie ! ${filtered.length} établissement(s) trouvé(s) pour le mode ${mode.toUpperCase()} : [${filtered.join(', ')}]`
        ]);
        if (filtered.length > 0) {
          setSelectedSyncTenantId(filtered[0]);
        }
      }
    } catch (err: any) {
      setSyncLog(prev => [...prev, `❌ Erreur lors de la détection : ${err.message || err}`]);
    } finally {
      setIsDetecting(false);
    }
  };

  const handlePushToSupabase = async () => {
    if (!supabaseUrl || !supabaseKey) {
      setSyncLog(prev => [...prev, "❌ URL ou Clé d'API Supabase manquante."]);
      setSyncStatus('ERROR');
      return;
    }
    const targetTenantId = useManualSyncId ? manualSyncId.trim() : selectedSyncTenantId;
    if (!targetTenantId) {
      setSyncLog(prev => [...prev, "❌ Veuillez spécifier ou sélectionner un établissement client à sauvegarder."]);
      setSyncStatus('ERROR');
      return;
    }

    setSyncStatus('SYNCING');
    setSyncLog(["🔄 Initialisation de la sauvegarde globale (Push) vers Supabase...", `Établissement : ${targetTenantId}`, `URL : ${supabaseUrl.trim()}`]);

    const client = getSupabaseClient(supabaseUrl, supabaseKey);
    if (!client) {
      setSyncLog(prev => [...prev, "❌ Impossible d'initialiser le client Supabase."]);
      setSyncStatus('ERROR');
      return;
    }

    try {
      const mode = (localStorage.getItem('erp-global-mode') as string || 'CLIENT').toLowerCase();
      
      const collections = [
        { key: 'tenants', data: tenants },
        { key: 'users', data: users },
        { key: 'dishes', data: dishes },
        { key: 'ingredients', data: ingredients },
        { key: 'recipes', data: recipes },
        { key: 'orders', data: orders },
        { key: 'stock-movements', data: stockMovements },
        { key: 'physical-inventories', data: physicalInventories },
        { key: 'suppliers', data: suppliers },
        { key: 'purchase-orders', data: purchaseOrders },
        { key: 'purchase-requests', data: purchaseRequests },
        { key: 'cash-movements', data: cashMovements },
        { key: 'daily-closures', data: dailyClosures },
        { key: 'audit-logs', data: auditLogs },
        { key: 'non-food-items', data: localStorage.getItem(`erp-${mode}-non-food-items`) ? JSON.parse(localStorage.getItem(`erp-${mode}-non-food-items`)!) : [] },
        { key: 'non-food-movements', data: localStorage.getItem(`erp-${mode}-non-food-movements`) ? JSON.parse(localStorage.getItem(`erp-${mode}-non-food-movements`)!) : [] },
        { key: 'menus-du-jour', data: localStorage.getItem(`erp-${mode}-menus-du-jour`) ? JSON.parse(localStorage.getItem(`erp-${mode}-menus-du-jour`)!) : [] },
        { key: 'detail-menus-jour', data: localStorage.getItem(`erp-${mode}-detail-menus-jour`) ? JSON.parse(localStorage.getItem(`erp-${mode}-detail-menus-jour`)!) : [] },
        { key: 'formules-du-jour', data: localStorage.getItem(`erp-${mode}-formules-du-jour`) ? JSON.parse(localStorage.getItem(`erp-${mode}-formules-du-jour`)!) : [] },
        { key: 'payment-methods', data: paymentMethods },
        { key: 'units-measurement', data: unitsOfMeasurement },
        { key: 'business-years', data: businessYears },
        { key: 'dish-categories', data: dishCategories },
        { key: 'ingredient-categories', data: ingredientCategories },
        { key: 'charge-types', data: chargeTypes },
        { key: 'expenses', data: expenses }
      ];

      setSyncLog(prev => [...prev, `📦 Compilation de ${collections.length} collections d'entités pour le mode ${mode.toUpperCase()}...`]);

      let successCount = 0;
      for (const col of collections) {
        const tenantKey = `${mode}_${targetTenantId}`;
        setSyncLog(prev => [...prev, `📤 Envoi de la collection '${col.key}' en cours...`]);
        
        const { error } = await client
          .from('kissineflow_sync')
          .upsert({
            tenant_id: tenantKey,
            data_key: col.key,
            payload: col.data || [],
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'tenant_id,data_key'
          });

        if (error) {
          setSyncLog(prev => [...prev, `⚠️ Échec d'envoi de '${col.key}' : ${error.message}`]);
          console.error(`Error syncing ${col.key}:`, error);
        } else {
          successCount++;
        }
      }

      setSyncLog(prev => [
        ...prev,
        `🎉 Sauvegarde SuperAdmin réussie ! ${successCount}/${collections.length} collections ont été sécurisées dans Supabase pour l'établissement '${targetTenantId}'.`,
        `📈 Horodatage : ${new Date().toLocaleTimeString()}`
      ]);
      setSyncStatus('SUCCESS');
      setToast({ text: `Sauvegarde Cloud réussie pour ${targetTenantId} !`, type: 'success' });
      setTimeout(() => setToast(null), 3000);
      logsAction(`SuperAdmin: Sauvegarde Cloud complète vers Supabase (${successCount} collections) pour le site ${targetTenantId}`, 'SÉCURITÉ');
    } catch (err: any) {
      setSyncLog(prev => [...prev, `❌ Erreur inattendue : ${err.message || err}`]);
      setSyncStatus('ERROR');
    }
  };

  const handlePullFromSupabase = async () => {
    if (!supabaseUrl || !supabaseKey) {
      setSyncLog(prev => [...prev, "❌ URL ou Clé d'API Supabase manquante."]);
      setSyncStatus('ERROR');
      return;
    }
    const targetTenantId = useManualSyncId ? manualSyncId.trim() : selectedSyncTenantId;
    if (!targetTenantId) {
      setSyncLog(prev => [...prev, "❌ Veuillez spécifier ou sélectionner un établissement client à récupérer."]);
      setSyncStatus('ERROR');
      return;
    }

    setSyncStatus('SYNCING');
    setSyncLog(["🔄 Initialisation de la récupération globale (Pull) depuis Supabase...", `Établissement : ${targetTenantId}`, `URL : ${supabaseUrl.trim()}`]);

    const client = getSupabaseClient(supabaseUrl, supabaseKey);
    if (!client) {
      setSyncLog(prev => [...prev, "❌ Impossible d'initialiser le client Supabase."]);
      setSyncStatus('ERROR');
      return;
    }

    try {
      const mode = (localStorage.getItem('erp-global-mode') as string || 'CLIENT').toLowerCase();
      const tenantKey = `${mode}_${targetTenantId}`;
      
      setSyncLog(prev => [...prev, `📡 Récupération des enregistrements pour le site '${tenantKey}'...`]);
      
      const { data, error } = await client
        .from('kissineflow_sync')
        .select('*')
        .eq('tenant_id', tenantKey);

      if (error) {
        setSyncLog(prev => [...prev, `❌ Échec de la récupération : ${error.message}`]);
        setSyncStatus('ERROR');
        return;
      }

      if (!data || data.length === 0) {
        setSyncLog(prev => [
          ...prev,
          `⚠️ Aucun enregistrement trouvé pour l'établissement '${targetTenantId}' sous le mode ${mode.toUpperCase()}.`,
          "👉 Effectuez d'abord une sauvegarde ('Push Cloud') depuis un appareil contenant vos données récentes."
        ]);
        setSyncStatus('SUCCESS');
        return;
      }

      setSyncLog(prev => [...prev, `📥 ${data.length} collections de données reçues. Application en cours...`]);

      let restoredCount = 0;
      for (const row of data) {
        const { data_key, payload } = row;
        if (!payload) continue;

        let restored = false;
        switch (data_key) {
          case 'tenants':
            if (onUpdateTenants) { onUpdateTenants(payload); restored = true; }
            break;
          case 'users':
            if (onUpdateUsers) { onUpdateUsers(payload); restored = true; }
            break;
          case 'dishes':
            if (onUpdateDishes) { onUpdateDishes(payload); restored = true; }
            break;
          case 'ingredients':
            if (onUpdateIngredients) { onUpdateIngredients(payload); restored = true; }
            break;
          case 'recipes':
            if (onUpdateRecipes) { onUpdateRecipes(payload); restored = true; }
            break;
          case 'orders':
            if (onUpdateOrders) { onUpdateOrders(payload); restored = true; }
            break;
          case 'stock-movements':
            if (onUpdateStockMovements) { onUpdateStockMovements(payload); restored = true; }
            break;
          case 'physical-inventories':
            if (onUpdatePhysicalInventories) { onUpdatePhysicalInventories(payload); restored = true; }
            break;
          case 'suppliers':
            if (onUpdateSuppliers) { onUpdateSuppliers(payload); restored = true; }
            break;
          case 'purchase-orders':
            if (onUpdatePurchaseOrders) { onUpdatePurchaseOrders(payload); restored = true; }
            break;
          case 'purchase-requests':
            if (onUpdatePurchaseRequests) { onUpdatePurchaseRequests(payload); restored = true; }
            break;
          case 'cash-movements':
            if (onUpdateCashMovements) { onUpdateCashMovements(payload); restored = true; }
            break;
          case 'daily-closures':
            if (onUpdateDailyClosures) { onUpdateDailyClosures(payload); restored = true; }
            break;
          case 'audit-logs':
            if (onUpdateAuditLogs) { onUpdateAuditLogs(payload); restored = true; }
            break;
          case 'payment-methods':
            if (onChangePaymentMethods) { onChangePaymentMethods(payload); restored = true; }
            break;
          case 'units-measurement':
            if (onChangeUnitsOfMeasurement) { onChangeUnitsOfMeasurement(payload); restored = true; }
            break;
          case 'business-years':
            if (onChangeBusinessYears) { onChangeBusinessYears(payload); restored = true; }
            break;
          case 'dish-categories':
            if (onChangeDishCategories) { onChangeDishCategories(payload); restored = true; }
            break;
          case 'ingredient-categories':
            if (onChangeIngredientCategories) { onChangeIngredientCategories(payload); restored = true; }
            break;
          case 'charge-types':
            if (onChangeChargeTypes) { onChangeChargeTypes(payload); restored = true; }
            break;
          case 'expenses':
            if (onUpdateExpenses) { onUpdateExpenses(payload); restored = true; }
            break;
          default:
            localStorage.setItem(`erp-${mode}-${data_key}`, JSON.stringify(payload));
            restored = true;
            break;
        }

        if (restored) {
          localStorage.setItem(`erp-${mode}-${data_key}`, JSON.stringify(payload));
          restoredCount++;
        }
      }

      setSyncLog(prev => [
        ...prev,
        `🎉 Restauration globale terminée ! ${restoredCount} collections de données appliquées localement avec succès pour l'établissement '${targetTenantId}'.`
      ]);
      setSyncStatus('SUCCESS');
      setToast({ text: `Restauration Cloud réussie pour ${targetTenantId} !`, type: 'success' });
      setTimeout(() => setToast(null), 3000);
      logsAction(`SuperAdmin: Restauration Cloud complète depuis Supabase pour le site ${targetTenantId}`, 'SÉCURITÉ');
    } catch (err: any) {
      setSyncLog(prev => [...prev, `❌ Erreur inattendue : ${err.message || err}`]);
      setSyncStatus('ERROR');
    }
  };

  // Delete Tenant Confirmation Modal
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    tenantId: string;
    tenantName: string;
  } | null>(null);

  // Audit Logs Filter States
  const [logSearch, setLogSearch] = useState('');
  const [logModuleFilter, setLogModuleFilter] = useState('ALL');
  const [logTenantFilter, setLogTenantFilter] = useState('ALL');

  // Global Collaborator States
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'ADMIN' | 'MANAGER' | 'CASHIER' | 'WAREHOUSE' | 'ACCOUNTING'>('CASHIER');
  const [newUserTenantId, setNewUserTenantId] = useState(tenants[0]?.id || '');
  const [newUserPassword, setNewUserPassword] = useState('password2026');

  // Collaborator Search & Filters
  const [collabSearch, setCollabSearch] = useState('');
  const [collabRoleFilter, setCollabRoleFilter] = useState('ALL');
  const [collabStatusFilter, setCollabStatusFilter] = useState('ALL');

  // Handle Client Creation
  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !clientName || !adminName || !adminEmail) {
      alert("Veuillez remplir les informations obligatoires (ID, Nom, Email et Nom de l'admin).");
      return;
    }

    const tid = clientId.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
    if (tenants.some(t => t.id === tid)) {
      alert("Le code client d'identification existe déjà.");
      return;
    }

    const newTenant: Tenant = {
      id: tid,
      name: clientName,
      address: clientAddress,
      phone: clientPhone,
      city: clientCity,
      country: clientCountry,
      active: true,
      createdAt: new Date().toISOString()
    };

    // First administrator account
    const defaultPermissions: Record<string, UserPermission> = {
      DASHBOARD: { read: true, write: true, edit: true, delete: true, export: true, import: true },
      POS: { read: true, write: true, edit: true, delete: true, export: true, import: true },
      ORDERS: { read: true, write: true, edit: true, delete: true, export: true, import: true },
      CATALOGUE: { read: true, write: true, edit: true, delete: true, export: true, import: true },
      STOCKS: { read: true, write: true, edit: true, delete: true, export: true, import: true },
      PURCHASES: { read: true, write: true, edit: true, delete: true, export: true, import: true },
      ACCOUNTING: { read: true, write: true, edit: true, delete: true, export: true, import: true },
      FINANCE: { read: true, write: true, edit: true, delete: true, export: true, import: true },
      BILAN: { read: true, write: true, edit: true, delete: true, export: true, import: true },
      NON_FOOD: { read: true, write: true, edit: true, delete: true, export: true, import: true },
      PRESTATIONS: { read: true, write: true, edit: true, delete: true, export: true, import: true }
    };

    const firstAdmin: User = {
      id: `user-admin-${tid}`,
      name: adminName,
      email: adminEmail,
      role: 'ADMIN',
      tenantId: tid,
      active: true,
      password: adminPassword,
      mustChangePassword: true, // MUST modify password on first login
      permissions: defaultPermissions
    };

    onAddTenant(newTenant, firstAdmin, prefillCatalog);
    logsAction(`SuperAdmin: Création du client ${clientName} (${tid}) avec admin ${adminName}`, 'SUPERADMIN');
    
    // Reset modal
    setClientId('');
    setClientName('');
    setClientAddress('');
    setClientPhone('');
    setClientCity('');
    setAdminName('');
    setAdminEmail('');
    setAdminPassword('activation2026');
    setShowAddModal(false);
  };

  // Handle Edit Save
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;
    onUpdateTenant(editingTenant);
    logsAction(`SuperAdmin: Modification du client ${editingTenant.name}`, 'SUPERADMIN');
    setEditingTenant(null);
  };

  // Toggle active / suspend state
  const handleToggleState = (t: Tenant) => {
    const nextState = t.active === undefined ? false : !t.active;
    onUpdateTenant({ ...t, active: nextState });
    logsAction(`SuperAdmin: Statut du client ${t.name} changé vers ${nextState ? 'ACTIF' : 'SUSPENDU'}`, 'SUPERADMIN');
  };

  // Handle Global Add User
  const handleCreateUserGlobal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserTenantId || !newUserPassword.trim()) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    if (users.some(u => u.email.toLowerCase() === newUserEmail.toLowerCase().trim())) {
      alert("Un utilisateur avec cette adresse email existe déjà sur la plateforme.");
      return;
    }

    const defaultPermissions: Record<string, UserPermission> = {
      DASHBOARD: { read: true, write: true, edit: true, delete: true, export: true, import: true },
      POS: { read: true, write: true, edit: true, delete: true, export: true, import: true },
      ORDERS: { read: true, write: true, edit: true, delete: true, export: true, import: true },
      CATALOGUE: { read: true, write: true, edit: true, delete: true, export: true, import: true },
      STOCKS: { read: true, write: true, edit: true, delete: true, export: true, import: true },
      PURCHASES: { read: true, write: true, edit: true, delete: true, export: true, import: true },
      ACCOUNTING: { read: true, write: true, edit: true, delete: true, export: true, import: true },
      FINANCE: { read: true, write: true, edit: true, delete: true, export: true, import: true },
      BILAN: { read: true, write: true, edit: true, delete: true, export: true, import: true },
      NON_FOOD: { read: true, write: true, edit: true, delete: true, export: true, import: true },
      PRESTATIONS: { read: true, write: true, edit: true, delete: true, export: true, import: true }
    };

    const addedUser: User = {
      id: `user-${Date.now()}`,
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      role: newUserRole,
      tenantId: newUserTenantId,
      active: true,
      password: newUserPassword.trim(),
      mustChangePassword: true,
      passwordChanged: false,
      permissions: defaultPermissions
    };

    if (onUpdateUsers) {
      onUpdateUsers([...users, addedUser]);
      logsAction(`SuperAdmin: Création du collaborateur ${addedUser.name} (${addedUser.role}) pour l'établissement ${newUserTenantId}`, 'SUPERADMIN');
    }

    // Reset Form
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('password2026');
    setShowAddUserModal(false);
  };

  // Export JSON file for client
  const triggerJSONExport = (tenantId: string) => {
    const dataPackage = onExportTenantData(tenantId);
    if (!dataPackage) return;
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataPackage, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `kissine_erp_backup_${tenantId}_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    logsAction(`SuperAdmin: Sauvegarde JSON exportée pour le client ${tenantId}`, 'SUPERADMIN');
  };

  // Import JSON file for client
  const handleJSONImport = (tenantId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const targetFile = event.target.files?.[0];
    if (!targetFile) return;

    fileReader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (!parsed.tenant || parsed.tenant.id !== tenantId) {
          setImportStatus({
            success: false,
            msg: `Erreur: Le fichier JSON ne correspond pas au Code Client de destination (${tenantId}).`
          });
          return;
        }

        onRestoreTenantData(tenantId, parsed);
        setImportStatus({
          success: true,
          msg: `Base de données (${parsed.data?.orders?.length || 0} commandes, ${parsed.data?.ingredients?.length || 0} ingrédients) restaurée avec succès !`
        });
        logsAction(`SuperAdmin: Import et restauration JSON réussis pour le client ${tenantId}`, 'SUPERADMIN');
      } catch (err) {
        setImportStatus({ success: false, msg: "Fichier invalide ou structure JSON défaillante." });
      }
    };
    fileReader.readAsText(targetFile);
  };

  const filteredTenants = tenants.filter(t => {
    const query = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(query) ||
      t.id.toLowerCase().includes(query) ||
      t.city.toLowerCase().includes(query)
    );
  });

  // Calculate stats for synthetic dashboard
  const globalRevenue = orders.filter(o => o.status === 'CLOSED').reduce((sum, o) => sum + o.total, 0);
  const globalOrdersCount = orders.filter(o => o.status === 'CLOSED').length;
  
  // Specific tenant KPIs
  const selectedTenant = tenants.find(t => t.id === selectedKpiTenantId) || tenants[0];
  const tOrders = orders.filter(o => o.tenantId === selectedKpiTenantId && o.status === 'CLOSED');
  const tRevenue = tOrders.reduce((sum, o) => sum + o.total, 0);
  const tVat = tOrders.reduce((sum, o) => sum + (o.total * 0.1925), 0); // Approx
  const tStaff = users.filter(u => u.tenantId === selectedKpiTenantId && u.role !== 'SUPERADMIN').length;
  const tIngredientsCount = ingredients.filter(i => i.tenantId === selectedKpiTenantId).length;
  const tExpenses = expenses.filter(e => e.tenantId === selectedKpiTenantId).reduce((sum, e) => sum + e.amountTtc, 0);

  // Export textual explanation of the active page's content
  const handleExportActivePageExplanation = () => {
    let title = "";
    let content = "";
    const dateStr = new Date().toLocaleString('fr-FR');
    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');

    if (activeTab === 'LIST') {
      title = "RAPPORT ET EXPLICATION DU CONTENU - CLIENTS ET SAUVEGARDES";
      const activeCount = tenants.filter(t => t.active !== false).length;
      const suspendedCount = tenants.filter(t => t.active === false).length;
      
      content = `========================================================================
${title}
Généré le : ${dateStr}
Fichier : explication_clients_sauvegardes.txt
========================================================================

1. PRÉSENTATION DE CETTE PAGE
La page "Clients & Sauvegardes" permet au Super-Administrateur de piloter tous les établissements (restaurants, cafétérias, boulangeries) connectés à la plateforme centralisée ERP. Elle regroupe les actions d'ajout de compte client, de suivi du statut d'exploitation (actif ou suspendu), d'initialisation rapide de base de données à partir de modèles catalogues pré-remplis de matières premières, ainsi que l'exportation et l'importation de sauvegardes locales compressées au format JSON.

2. STATISTIQUES DES ÉTABLISSEMENTS DE LA PLATEFORME
- Nombre total de restaurants enregistrés : ${tenants.length} Établissement(s)
- Activés (Opérationnels) : ${activeCount}
- Suspendus (Facturation en attente / Suspendus) : ${suspendedCount}

3. RÉPERTOIRE DES CLIENTS FILTRÉS ET LEUR ÉTAT SYSTÈME
${filteredTenants.length === 0 ? "Aucun établissement ne correspond aux filtres de recherche actuels." : filteredTenants.map((t, idx) => {
  const isSuspended = t.active === false;
  return `-------------------------------------------------------
[Site #${idx + 1}] ID du Client : ${t.id}
- Nom Commercial : ${t.name}
- Adresse Physique : ${t.address}, ${t.city} (${t.country})
- Téléphone : ${t.phone}
- Statut Actuel : ${isSuspended ? "SUSPENDU / ARRÊTÉ" : "ACTIF / EN LIGNE"}
- Raison Sociale : ${t.raisonSociale || "Non définie"}
- RCCM : ${t.rccm || "Non renseigné"}
- NIU : ${t.niu || "Non renseigné"}
- Régime Fiscal : ${t.regimeFiscal || "Non renseigné"}`;
}).join('\n')}

4. RECOMMANDATIONS DU SYSTÈME POUR LES SAUVEGARDES ET LA SÉCURITÉ
- Sauvegarde Fréquente : Avant toute modification majeure, ou lors de visites de contrôle, il est recommandé de cliquer sur l'icône de téléchargement verte pour extraire le package JSON sécurisé.
- Restauration : L'importation d'une archive JSON remplace l'état actuel de l'établissement sélectionné. Assurez-vous d'avoir exporté l'ancienne version avant d'initier cette procédure d'importation irréversible.`;

    } else if (activeTab === 'KPI_EXPLORER') {
      title = "RAPPORT EXECUTIVE - ANALYSE PERFORMANCE & DIAGNOSTIC DES KPI";
      const totalKpiRevenue = tOrders.reduce((sum, o) => sum + o.total, 0);
      const totalKpiOrders = tOrders.length;
      const averageTicket = totalKpiOrders ? (totalKpiRevenue / totalKpiOrders).toFixed(0) : "0";
      const formatNumber = (num: number) => num.toLocaleString('fr-FR');
      
      // Diagnostic messages based on metrics
      let ticketDiagnostic = "Panier moyen bas. Pensez à former les serveurs à la vente suggestive additionnelle (boissons, vins fins, desserts premium).";
      if (Number(averageTicket) > 25000) {
        ticketDiagnostic = "Performance exceptionnelle ! Votre panier moyen d'achat est très élevé. Le positionnement de la carte et les accords mets-boissons sont optimaux.";
      } else if (Number(averageTicket) > 10000) {
        ticketDiagnostic = "Panier d'achat sain et équilibré pour un service standard. Pour solliciter une hausse de 10%, introduisez des suppléments cuisiniers de saison.";
      }

      let financialDiagnostic = "Structure financière équilibrée.";
      if (tExpenses > totalKpiRevenue) {
        financialDiagnostic = "Alerte de trésorerie critique : Vos dépenses opérationnelles enregistrées dépassent le chiffre d'affaires net encaissé ! Réduisez immédiatement la perte de stocks et optimisez les plannings du personnel.";
      } else if (tExpenses > totalKpiRevenue * 0.7) {
        financialDiagnostic = "Attention, vos dépenses représentent plus de 70% de vos ventes nettes. Vos marges bénéficiaires directes sont serrées. Négociez les prix de gros des denrées.";
      } else {
        financialDiagnostic = "Structure financière hautement rentable. Excellente maîtrise des charges fixes et des coûts d'ingrédients.";
      }

      let stockDiagnostic = "Structure de stock saine.";
      if (tIngredientsCount > 60) {
        stockDiagnostic = "Diversité de fiches d'ingrédients élevée. Attention aux risques de surstockage et de détériorations de denrées périssables. Mettez en place une rotation systématique du type FIFO.";
      }

      content = `========================================================================
${title}
Généré le : ${dateStr}
Fichier : explication_kpi_diagnostics.txt
========================================================================

1. PRÉSENTATION DE CETTE PAGE
Le "Suivi KPIs & Diagnostics" offre une vue de contrôle de gestion d'élite. Il compile d'une part le chiffre d'affaires cumulé par site et les transactions validées, et propose d'autre part une analyse financière granulaire par point de vente. Il permet d'évaluer la rentabilité d'un site à travers le prisme de son chiffre d'affaires net d'exploitation, de ses prélèvements TVA, de la taille de ses équipes d'accueil, de sa diversité de stocks et de son flux de dépenses périodiques.

2. RECONNAISSANCE DU PÉRIMÈTRE D'ANALYSE
- Établissement sélectionné : ${selectedTenant ? selectedTenant.name : "Aucun"} (ID: ${selectedKpiTenantId || "Aucun"})
- Localisation du restaurant : ${selectedTenant?.address || "N/A"}, ${selectedTenant?.city || "N/A"}

3. INDICATEURS CLÉS DE PERFORMANCE (KPI) DYNAMIQUES
- Chiffre d'Affaires Encaissé (Ventes Validées H.T + T.T.C) : ${formatNumber(totalKpiRevenue)} FCFA
- Volume des Commandes Clôturées : ${totalKpiOrders} Bons de transaction de caisse
- Panier Moyen par Client : ${formatNumber(Number(averageTicket))} FCFA par couvert/commande
- Prélèvement TVA Estimé (Régime à 19.25%) : ${formatNumber(tVat)} FCFA
- Personnels et Équipes rattachés : ${tStaff} collaborateur(s) affecté(s) au site
- Diversité du Catalogue d'Ingrédients Actifs : ${tIngredientsCount} références stockées
- Consommation des Charges Opérationnelles Périodiques : ${formatNumber(tExpenses)} FCFA
- Solde Net Projeté Actuel (Chiffre d'Affaires - Charges) : ${formatNumber(totalKpiRevenue - tExpenses)} FCFA

4. RENDU DE DIAGNOSTIC AUTOMATISÉ ET SOLUTIONS BUSINESS
- Analyse du Panier Moyen par Couvert :
  --> [Valeur : ${formatNumber(Number(averageTicket))} FCFA]
  --> Diagnostic : ${ticketDiagnostic}

- Santé Financière & Rationalisation des Charges :
  --> [Frais encoulés : ${formatNumber(tExpenses)} FCFA face à ${formatNumber(totalKpiRevenue)} FCFA de ventes]
  --> Diagnostic : ${financialDiagnostic}

- Maîtrise des Stocks de Marchandises :
  --> [Articles en gestion : ${tIngredientsCount} ingrédients différents]
  --> Diagnostic : ${stockDiagnostic}

------------------------------------------------------------------------
Fin du diagnostic opérationnel de l'établissement : ${selectedTenant ? selectedTenant.name : "Aucun"}.
========================================================================`;

    } else if (activeTab === 'AUDIT_LOGS') {
      title = "RAPPORT DE SÉCURITÉ ET CONFORMITÉ - JOURNAL D'ACTIVITÉ GLOBAL";
      const filteredAllLogs = auditLogs.filter(log => {
        const matchesSearch = 
          log.action.toLowerCase().includes(logSearch.toLowerCase()) || 
          log.userName.toLowerCase().includes(logSearch.toLowerCase()) ||
          log.module.toLowerCase().includes(logSearch.toLowerCase());
        const matchesModule = logModuleFilter === 'ALL' || log.module === logModuleFilter;
        const matchesTenant = logTenantFilter === 'ALL' || log.tenantId === logTenantFilter;
        return matchesSearch && matchesModule && matchesTenant;
      });

      const securityTracesCount = filteredAllLogs.filter(l => l.module === 'SÉCURITÉ' || l.action.toLowerCase().includes('désactivé') || l.action.toLowerCase().includes('refus')).length;

      content = `========================================================================
${title}
Généré le : ${dateStr}
Fichier : explication_journal_audit.txt
========================================================================

1. PRÉSENTATION DE CETTE PAGE
Le "Journal d'Activité Global" fournit une traçabilité immuable conforme aux obligations réglementaires d'audit de sécurité logicielle. Chaque connexion réussie ou rejetée, chaque changement de mot de passe de collaborateur, chaque modification de droit, chaque export ou restauration de sauvegarde ainsi que les modifications tarifaires réalisées sur les Établissements y sont catalogués en temps réel avec identification de l'opérateur et horodatage milliseconde.

2. CRITÈRES DE FILTRE DES TRACES ACTUELS
- Recherche textuelle complémentaire : "${logSearch || "Aucune recherche"}"
- Module cible : ${logModuleFilter === 'ALL' ? "Tous les modules" : logModuleFilter}
- Établissement d'origine filtre : ${logTenantFilter === 'ALL' ? "Tous les établissements" : logTenantFilter}
- Total des lignes d'audit identifiées selon filtre : ${filteredAllLogs.length} traces

3. LISTING CHRONOLOGIQUE DES ACTIVITÉS ENREGISTRÉES (200 DERNIERS MAINDAYS)
${filteredAllLogs.length === 0 ? "Aucune trace d'activité ne correspond aux filtres de recherche actuels du journal." : filteredAllLogs.slice(0, 200).map((log, idx) => {
  const targetTenant = tenants.find(t => t.id === log.tenantId);
  const siteLabel = targetTenant?.name || log.tenantId || "SuperInfrastructure (Global)";
  return `[Log #${idx + 1}] | Statut: ${log.timestamp} | Site: ${siteLabel} | Opérateur: ${log.userName}
  --> Module : ${log.module}
  --> Action : ${log.action}
  ${log.oldValue ? `--> Valeur Précédente : ${log.oldValue}` : ''}
  ${log.newValue ? `--> Nouvelle Valeur : ${log.newValue}` : ''}
-----------------------------------------------------------------------`;
}).join('\n')}

4. DIAGNOSTIC DE CONFORMITÉ CYBERSÉCURITÉ
- Traces à Niveau Critique / Sécurité détectées dans ce filtre : ${securityTracesCount} alerte(s).
- Note de sécurité : Assurez-vous qu'aucun identifiant d'opérateur récurrent ne subisse de tentatives de refus de connexion sans réinitialisation sécurisée de sa clé par son SuperAdmin d'agence.`;

    } else if (activeTab === 'COLLABORATORS_GLOBAL') {
      title = "RAPPORT DE STRUCTURE RH ET ACCÈS - COLLABORATEURS ET ACCÈS";
      const sysUsers = users.filter(u => u.role !== 'SUPERADMIN');
      const filteredUsers = sysUsers.filter(u => {
        const matchesSearch = 
          u.name.toLowerCase().includes(collabSearch.toLowerCase()) || 
          u.email.toLowerCase().includes(collabSearch.toLowerCase());
        const matchesRole = collabRoleFilter === 'ALL' || u.role === collabRoleFilter;
        
        const isUserActive = u.active !== false;
        const matchesStatus = 
          collabStatusFilter === 'ALL' ||
          (collabStatusFilter === 'ACTIVE' && isUserActive) ||
          (collabStatusFilter === 'INACTIVE' && !isUserActive);

        return matchesSearch && matchesRole && matchesStatus;
      });

      const adminsCount = filteredUsers.filter(u => u.role === 'ADMIN').length;
      const managersCount = filteredUsers.filter(u => u.role === 'MANAGER').length;
      const cashiersCount = filteredUsers.filter(u => u.role === 'CASHIER').length;
      const stockStaffCount = filteredUsers.filter(u => u.role === 'WAREHOUSE').length;
      const accountingCount = filteredUsers.filter(u => u.role === 'ACCOUNTING').length;

      content = `========================================================================
${title}
Généré le : ${dateStr}
Fichier : explication_collaborateurs_acces.txt
========================================================================

1. PRÉSENTATION DE CETTE PAGE
La console "Collaborateurs & Accès" centralise d'une part la création, la modification permanente et l'extinction/suppression des profils de collaborateurs pour tous les restaurants de la plateforme. Elle permet au SuperAdmin d'allouer les rôles métier (Admins de site, Managers de salle, Caissiers POS, Économes/Stocks, Comptables), de renouveler leurs mots de passe d'activation d'un clic en cas de perte, et de contrôler les verrous d'accès instantanément sans perturber le fonctionnement des terminaux de vente physiques.

2. SYNTHÈSE DES RESSOURCES HUMAINES ENREGISTRÉES (FILTRÉES)
- Effectif comptabilisé : ${filteredUsers.length} collaborateur(s)
  --> Gérants de Site (ADMIN) : ${adminsCount}
  --> Managers de restaurant (MANAGER) : ${managersCount}
  --> Caissiers Point de Vente (CASHIER) : ${cashiersCount}
  --> Responsables Économes (WAREHOUSE) : ${stockStaffCount}
  --> Comptabilité & Factures (ACCOUNTING) : ${accountingCount}

3. SÉQUENCE DES COLLABORATEURS EN ACTIVITÉ ET LEURS LIENS SITE
${filteredUsers.length === 0 ? "Aucun profil de collaborateur ne correspond aux critères de recherche actuels." : filteredUsers.map((u, idx) => {
  const currentTenantObj = tenants.find(t => t.id === u.tenantId);
  const isSuspended = u.active === false;
  return `-------------------------------------------------------
[Collaborateur #${idx + 1}] Nom : ${u.name}
- Adresse de Connexion (Email) : ${u.email}
- Rôle Système Attribué : ${u.role}
- Affectation Restaurant : ${currentTenantObj?.name || u.tenantId}
- État d'Accès Réseau : ${isSuspended ? "DÉSACTIVÉ / INTERDIT" : "ACTIF / AUTORISÉ"}
- Clé d'Accès Actuelle : ${u.password || "Non configuré"}`;
}).join('\n')}

4. CONSEILS DU SUPERADMIN POUR LA SÉCURITÉ DE L'ÉTABLISSEMENT
- Politique d'Identifiant Unique : Interdisez le partage de comptes de caisse génériques. Chaque caissier de quart doit posséder son propre compte nominatif afin de responsabiliser les saisies et les écarts de caisse en fin de journée.
- Clé d'accès provisoire : À la création d'un collaborateur, sa clé par défaut doit idéalement être d'un format fort et modifiée dès sa première utilisation dans sa console locale de connexion d'établissement.`;
    } else if (activeTab === 'SUPABASE_SYNC') {
      title = "RAPPORT DE SYNCHRONISATION ET BACKUP CLOUD - SUPABASE";
      content = `========================================================================
${title}
Généré le : ${dateStr}
Fichier : explication_synchronisation_supabase.txt
========================================================================

1. PRÉSENTATION DE CETTE PAGE
La console de synchronisation cloud permet au SuperAdmin de KissineFlow de sauvegarder l'intégralité des données d'un établissement client vers un hébergement sécurisé en ligne (Supabase), permettant ainsi la réplication instantanée sur tablette ou smartphone de livraison tout en hébergeant l'application en ligne sur Vercel.

2. CONFIGURATION ACTUELLE DU CANAL CLOUD
- URL de votre API Supabase : ${supabaseUrl || "Non renseigné"}
- Établissement sélectionné : ${selectedSyncTenantId || "Aucun"}
- Statut opérationnel de la connexion : ${syncStatus}

3. AVANTAGES DE CETTE ARCHITECTURE DECENTRALISÉE
- Résilience maximale : En cas de crash du disque ou de perte du navigateur principal, vos ventes et stocks sont à l'abri dans le cloud.
- Travail collaboratif multi-appareils : Vos serveurs et livreurs peuvent travailler en simultané sur smartphones, les bases de données d'exploitation fusionnant via Supabase de manière fluide.
- Déploiement transparent : Renseignez simplement VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sur votre hébergement Vercel pour rendre KissineFlow disponible partout en ligne !`;
    } else if (activeTab === 'SCENARIOS') {
      title = "RAPPORT D'ETUDE ET DE DEPLOIEMENT ARCHITECTURAL - 4 SCENARIOS";
      content = `========================================================================
${title}
Généré le : ${dateStr}
Fichier : explication_scenarios_architecture.txt
========================================================================

1. SYNTHÈSE DES 4 SCÉNARIOS DE DEPLOIEMENT PROPOSÉS
Ce document dresse une comparaison exhaustive des quatre architectures envisageables pour KissineFlow afin de concilier travail hors-ligne, centralisation réseau, résilience de stockage et simplicité opérationnelle.

* SCÉNARIO 1 : Base de données dans le Cloud (Supabase en ligne) - ACTIF & RECOMMANDÉ EN LIGNE
  - Description : L'application s'exécute sur le poste client (sous forme de client léger ou site Vercel), mais les requêtes et les sauvegardes s'effectuent sur le cloud via Internet.
  - Feasibility : 100% Fonctionnel. C'est l'architecture native actuellement déployée et utilisée par KissineFlow.

* SCÉNARIO 2 : Base de données en Réseau Local (LAN Hors-ligne)
  - Description : Un PostgreSQL local ou le CLI Supabase tourne sur une machine dédiée au sein du restaurant avec une adresse IP locale fixe (ex: 192.168.1.100). Les postes clients s'y connectent en local.
  - Feasibility : Partiellement faisable. Nécessite l'ouverture des ports PostgreSQL (5432) ou de l'API locale Supabase (54321) dans le routeur/switch LAN.

* SCÉNARIO 3 : Approche "Serveur Web Local" (LAN Centralisé)
  - Description : L'application web complète et la base de données sont hébergées sur un unique ordinateur-serveur local du restaurant. Les tablettes, smartphones et ordinateurs clients s'y connectent simplement via un navigateur web à l'adresse IP locale du serveur.
  - Feasibility : Fortement recommandé pour une entreprise multiservice sans accès Internet stable. Simplifie drastiquement les mises à jour logicielles.

* SCÉNARIO 4 : Approche Native Bureau Bureau (Tauri + SQLite / Electron)
  - Description : Encapsulation complète de KissineFlow dans un conteneur lourd avec persistance locale dans une base de données embarquée SQLite autonome (.db) sur le disque dur.
  - Feasibility : Idéal pour les configurations à un seul poste de caisse ultra-robuste avec des volumétries massives sans réseau requis.`;
    }

    // Download compiled text as file
    const element = document.createElement("a");
    const file = new Blob([content], {type: 'text/plain;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = `plateforme_erp_explication_${activeTab.toLowerCase()}_${timestampStr}.txt`;
    document.body.appendChild(element);
    element.click();
    element.remove();
    logsAction(`SuperAdmin: Exportation de l'explication textuelle du contenu de la page ${activeTab}`, 'ADMINISTRATION');
  };

  return (
    <div className="space-y-6" id="super-admin-view">
      {/* Top Banner */}
      <div className="bg-[#0B1F3F] text-white p-6 rounded-2xl shadow-md border border-[#1E4E8C] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-15 transform translate-x-6 -translate-y-4">
          <Building2 size={180} className="text-blue-400" />
        </div>
        
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="bg-[#F26522] text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
              Développeur d'Application
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight font-sans">
            Console de Super-Administration & Contrôle Clients
          </h2>
          <p className="text-slate-350 text-xs max-w-xl">
            Pilotez les sous-comptes restaurants, configurez les politiques d'accès, observez les performances en temps réel et sécurisez les sauvegardes de vos clients.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 relative z-10 self-stretch md:self-auto">
          <button
            onClick={() => setActiveTab('LIST')}
            className={`flex-1 md:flex-none px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'LIST' ? 'bg-[#F26522] text-white shadow-lg' : 'bg-white/10 hover:bg-white/15 text-slate-200'
            }`}
          >
            <Building2 size={13} />
            <span>Clients & Sauvegardes</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('KPI_EXPLORER');
              if (tenants.length > 0 && !selectedKpiTenantId) {
                setSelectedKpiTenantId(tenants[0].id);
              }
            }}
            className={`flex-1 md:flex-none px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'KPI_EXPLORER' ? 'bg-[#F26522] text-white shadow-lg' : 'bg-white/10 hover:bg-white/15 text-slate-200'
            }`}
          >
            <Maximize2 size={13} />
            <span>Suivi KPIs & Diagnostics</span>
          </button>
          <button
            onClick={() => setActiveTab('AUDIT_LOGS')}
            className={`flex-1 md:flex-none px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'AUDIT_LOGS' ? 'bg-[#F26522] text-white shadow-lg' : 'bg-white/10 hover:bg-white/15 text-slate-200'
            }`}
          >
            <Shield size={13} />
            <span>Journal d'Activité Global</span>
          </button>
          <button
            onClick={() => setActiveTab('COLLABORATORS_GLOBAL')}
            className={`flex-1 md:flex-none px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'COLLABORATORS_GLOBAL' ? 'bg-[#F26522] text-white shadow-lg' : 'bg-white/10 hover:bg-white/15 text-slate-200'
            }`}
          >
            <Users size={13} />
            <span>Collaborateurs & Accès</span>
          </button>
          <button
            onClick={() => { setActiveTab('SUPABASE_SYNC'); setSyncLog([]); }}
            className={`flex-1 md:flex-none px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'SUPABASE_SYNC' ? 'bg-[#F26522] text-white shadow-lg' : 'bg-white/10 hover:bg-white/15 text-slate-200'
            }`}
          >
            <Cloud size={13} className={activeTab === 'SUPABASE_SYNC' ? 'text-white' : 'text-emerald-400 animate-pulse'} />
            <span>Synchronisation Cloud (Supabase)</span>
          </button>
          <button
            onClick={() => { setActiveTab('SCENARIOS'); }}
            className={`flex-1 md:flex-none px-4 py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'SCENARIOS' ? 'bg-[#F26522] text-white shadow-lg' : 'bg-white/10 hover:bg-white/15 text-slate-200'
            }`}
          >
            <Layers size={13} className="text-[#F26522]" />
            <span>4 Scénarios d'Architecture LAN & Cloud</span>
          </button>
        </div>
      </div>

      {/* Synthetic Global Health Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-150 flex items-center gap-4 shadow-3xs">
          <div className="p-3 bg-blue-50 text-[#1E4E8C] rounded-xl">
            <Building2 size={22} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wide">Total Clients</p>
            <p className="text-xl font-bold text-gray-900">{tenants.length}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-150 flex items-center gap-4 shadow-3xs">
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <Users size={22} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wide">Utilisateurs Globaux</p>
            <p className="text-xl font-bold text-gray-900">{users.filter(u => u.role !== 'SUPERADMIN').length}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-150 flex items-center gap-4 shadow-3xs">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wide">CA Cumulé (Explorateur)</p>
            <p className="text-xl font-bold text-gray-900">{globalRevenue.toLocaleString()} FCFA</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-150 flex items-center gap-4 shadow-3xs">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <Activity size={22} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wide">Transactions Total</p>
            <p className="text-xl font-bold text-gray-900">{globalOrdersCount} Bons de Caisse</p>
          </div>
        </div>
      </div>

      {/* Dynamic Active Page Explanation Exporter banner */}
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl shadow-3xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
              <FileText size={16} />
            </span>
            <span className="text-xs font-black uppercase text-slate-800 tracking-wide">
              Analyseur de Page Réseau : <span className="text-[#F26522]">{activeTab === 'LIST' ? "Clients & Sauvegardes" : activeTab === 'KPI_EXPLORER' ? "Suivi KPIs & Diagnostics" : activeTab === 'AUDIT_LOGS' ? "Journal d'Activité Global" : activeTab === 'COLLABORATORS_GLOBAL' ? "Collaborateurs & Accès" : activeTab === 'SUPABASE_SYNC' ? "Synchronisation Cloud (Supabase)" : "Scénarios d'Architecture LAN & Cloud"}</span>
            </span>
          </div>
          <p className="text-slate-500 text-[11px] leading-snug font-medium">
            Télécharge instantanément un rapport d'audit exhaustif et explicatif au format texte (.txt) décrivant de manière structurée l'état système, les données actives et les diagnostics d'exploitation de ce panneau.
          </p>
        </div>
        
        <button
          onClick={handleExportActivePageExplanation}
          className="self-stretch md:self-auto px-5 py-2.5 bg-[#0B1F3F] text-white hover:bg-slate-900 font-extrabold rounded-lg text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm border border-slate-700 whitespace-nowrap"
        >
          <FileText size={14} className="text-[#F26522]" />
          <span>Exporter l'explication active (.txt)</span>
        </button>
      </div>

      {importStatus && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-bold ${
          importStatus.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {importStatus.success ? <Check size={18} /> : <AlertCircle size={18} />}
          <div className="flex-1">
            <p>{importStatus.msg}</p>
          </div>
          <button onClick={() => setImportStatus(null)} className="hover:opacity-75">
            <X size={15} />
          </button>
        </div>
      )}

      {/* Main View Area */}
      {activeTab === 'LIST' ? (
        <div className="bg-white border border-gray-150 rounded-xl shadow-3xs overflow-hidden">
          {/* Header Action Row */}
          <div className="p-5 border-b border-gray-150 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50">
            <div className="relative w-full md:w-80">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <Search size={15} />
              </span>
              <input
                type="text"
                placeholder="Filtrer par nom, ID ou ville..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 text-xs rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#1E4E8C]"
              />
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full md:w-auto px-4 py-2 bg-[#1E4E8C] hover:bg-[#1E4E8C]/90 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus size={15} />
              <span>Créer un Nouveau Client Restaurant</span>
            </button>
          </div>

          {/* Tenants List Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-150 text-[10px] text-gray-400 font-extrabold uppercase bg-slate-50 bg-opacity-50">
                  <th className="px-6 py-3.5">Code Client ID</th>
                  <th className="px-6 py-3.5">Etablissement / Restaurant</th>
                  <th className="px-6 py-3.5">Ville & Pays</th>
                  <th className="px-6 py-3.5">Données & Status</th>
                  <th className="px-6 py-3.5 text-center">Accès Client</th>
                  <th className="px-6 py-3.5 text-right">Actions techniques & Sauvegardes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 text-xs text-gray-700">
                {filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-450 font-medium">
                      Aucun client configuré. Utilisez le bouton ci-dessus pour initialiser un restaurant.
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map(t => {
                    const cOrders = orders.filter(o => o.tenantId === t.id);
                    const cUsers = users.filter(u => u.tenantId === t.id && u.role !== 'SUPERADMIN');
                    const cIngs = ingredients.filter(i => i.tenantId === t.id);
                    const cAdmin = cUsers.find(u => u.role === 'ADMIN');
                    const isClientActive = t.active !== false;

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4 font-mono font-bold text-gray-900">
                          <span className="bg-slate-100 border border-gray-200 px-2 py-0.5 rounded text-gray-700">
                            {t.id}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-extrabold text-gray-900 text-sm">{t.name}</p>
                            <p className="text-gray-450 text-[10px] mt-0.5">{t.address || 'Pas d\'adresse configurée'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-700">{t.city}</p>
                          <p className="text-gray-400 text-[10px]">{t.country}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1 items-center">
                            <span className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[9px] font-bold">
                              {cUsers.length} staff
                            </span>
                            <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded text-[9px] font-bold">
                              {cOrders.length} tickets
                            </span>
                            <span className="bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded text-[9px] font-bold">
                              {cIngs.length} ingred.
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleToggleState(t)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition cursor-pointer ${
                              isClientActive 
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200' 
                                : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                            }`}
                          >
                            {isClientActive ? '● Actif' : '✖ Suspendu'}
                          </button>
                        </td>
                        <td className="px-6 py-4 space-y-2 text-right">
                          {/* Top Row: Edit & Delete */}
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => {
                                setSelectedKpiTenantId(t.id);
                                setActiveTab('KPI_EXPLORER');
                              }}
                              className="p-1.5 bg-indigo-50 hover:bg-indigo-100 rounded text-indigo-700 transition cursor-pointer"
                              title="Voir Diagnostic, Sites & Collaborateurs"
                            >
                              <Activity size={14} />
                            </button>
                            <button
                              onClick={() => setEditingTenant(t)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition"
                              title="Modifier informations"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteConfirmation({
                                  tenantId: t.id,
                                  tenantName: t.name
                                });
                              }}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 rounded text-rose-600 transition cursor-pointer"
                              title="Déconnecter / Supprimer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>

                          {/* Bottom Row: Export & Import */}
                          <div className="flex items-center gap-1.5 justify-end">
                            {/* JSON Export */}
                            <button
                              onClick={() => triggerJSONExport(t.id)}
                              className="px-2 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 transition rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                              title="Exporter le fichier de sauvegarde"
                            >
                              <FileDown size={11} />
                              <span>Exporter</span>
                            </button>

                            {/* JSON Import */}
                            <label className="px-2 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 transition rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer relative">
                              <FileUp size={11} />
                              <span>Restaurer</span>
                              <input
                                type="file"
                                accept=".json"
                                onChange={(e) => handleJSONImport(t.id, e)}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              />
                            </label>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'KPI_EXPLORER' ? (
        /* KPI & DIAGNOSTICS TAB - HIGH END GLOBAL & PER-SITE VISIBILITY */
        <div className="space-y-6">
          <div className="bg-white p-5 border border-gray-150 rounded-xl shadow-3xs space-y-5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b">
              <div>
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight flex items-center gap-2">
                  <Activity className="text-[#F26522] h-4 w-4" />
                  Sélecteur de Restaurant pour Audit & Diagnostic 360°
                </h3>
                <p className="text-gray-450 text-xs">
                  Analysez les informations juridiques, les sites opérationnels, les indicateurs de performance financiers consolidés, et administrez les accès des collaborateurs.
                </p>
              </div>
              
              <select
                value={selectedKpiTenantId}
                onChange={(e) => {
                  setSelectedKpiTenantId(e.target.value);
                  setEditingUserPasswordId(null);
                }}
                className="w-full md:w-64 px-3 py-2 bg-slate-50 border border-gray-200 text-xs font-bold text-gray-800 rounded-lg cursor-pointer focus:outline-none focus:border-orange-500"
              >
                {tenants.filter(t => !t.parentId).map(t => (
                  <option key={t.id} value={t.id}>🏢 {t.name} (ID: {t.id})</option>
                ))}
              </select>
            </div>
            
            {selectedTenant ? (() => {
              // Get all sites (parent + child sites)
              const clientSites = tenants.filter(t => t.id === selectedTenant.id || t.parentId === selectedTenant.id);
              const clientSiteIds = clientSites.map(s => s.id);
              
              // Get all users for all sites
              const clientUsers = users.filter(u => clientSiteIds.includes(u.tenantId) && u.role !== 'SUPERADMIN');
              
              // Aggregations
              const clientOrders = orders.filter(o => clientSiteIds.includes(o.tenantId) && o.status === 'CLOSED');
              const clientRevenue = clientOrders.reduce((sum, o) => sum + o.total, 0);
              const clientVat = clientOrders.reduce((sum, o) => sum + (o.total * 0.1925), 0);
              const clientExpensesTotal = expenses.filter(e => clientSiteIds.includes(e.tenantId)).reduce((sum, e) => sum + e.amountTtc, 0);
              const clientNetProfit = clientRevenue - clientExpensesTotal;

              // Advanced indicators calculation
              const clientOrdersCount = clientOrders.length;
              const averageOrderValue = clientOrdersCount > 0 ? Math.round(clientRevenue / clientOrdersCount) : 0;
              const totalCovers = clientOrders.reduce((sum, o) => sum + (o.covers || 0), 0);
              const averageCoverValue = totalCovers > 0 ? Math.round(clientRevenue / totalCovers) : 0;
              const netMarginPercent = clientRevenue > 0 ? (clientNetProfit / clientRevenue) * 100 : 0;
              const expenseToRevenueRatio = clientRevenue > 0 ? (clientExpensesTotal / clientRevenue) * 100 : 0;
              
              return (
                <div className="space-y-6">
                  {/* SECTION 1: GLOBAL CUMULATIVE METRICS */}
                  <div>
                    <h4 className="text-xs font-extrabold uppercase text-gray-400 tracking-wider mb-2.5 flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-blue-600" />
                      1. Indicateurs Globaux Consolidés & Analyse de Performance (Tous les sites rattachés)
                    </h4>
                    
                    {/* Sub-section: Cash Flows */}
                    <div className="mb-5">
                      <div className="text-[9px] font-black uppercase text-indigo-600 mb-2 tracking-wider flex items-center gap-1 bg-indigo-50/50 py-1 px-2.5 rounded-md inline-block">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                        <span>Flux Financiers et Trésorerie Consolidés</span>
                      </div>
                      <div className="border border-slate-150 rounded-xl p-5 bg-gradient-to-r from-slate-50/70 to-slate-50/30 grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-1">
                          <span className="text-[9px] font-black uppercase text-gray-450 block">CHIFFRE D'AFFAIRES GLOBAL</span>
                          <p className="text-xl font-bold font-mono text-indigo-950">{clientRevenue.toLocaleString()} FCFA</p>
                          <span className="text-[10px] text-gray-500 font-medium">{clientOrdersCount} Bons de caisse clôturés</span>
                        </div>
                        
                        <div className="space-y-1">
                          <span className="text-[9px] font-black uppercase text-gray-450 block">TVA COLLECTÉE CUMULÉE (19.25%)</span>
                          <p className="text-xl font-bold font-mono text-indigo-700">{Math.round(clientVat).toLocaleString()} FCFA</p>
                          <span className="text-[10px] text-gray-500 font-medium">Reversable théorique estimé</span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] font-black uppercase text-gray-450 block">DÉPENSES & CHARGES TOTALES</span>
                          <p className="text-xl font-bold font-mono text-rose-600">{clientExpensesTotal.toLocaleString()} FCFA</p>
                          <span className="text-[10px] text-gray-500 font-medium font-semibold text-rose-700 bg-rose-50 border border-rose-100 rounded px-1 mt-0.5 inline-block">Exploitation et approvisionnements</span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] font-black uppercase text-gray-450 block font-bold">RÉSULTAT NET CUMULÉ</span>
                          <p className={`text-xl font-bold font-mono ${clientNetProfit >= 0 ? 'text-emerald-600' : 'text-red-650'}`}>
                            {clientNetProfit.toLocaleString()} FCFA
                          </p>
                          <span className={`text-[10px] font-semibold ${clientNetProfit >= 0 ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-red-750 bg-red-50 border-red-100'} py-0.5 px-1.5 rounded border inline-block mt-0.5`}>
                            {clientNetProfit >= 0 ? 'Diagnostic Rentable' : 'Résultat Général Déficitaire'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Sub-section: Advanced performance indicators */}
                    <div>
                      <div className="text-[9px] font-black uppercase text-emerald-700 mb-2 tracking-wider flex items-center gap-1 bg-emerald-50/50 py-1 px-2.5 rounded-md inline-block">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Performance Opérationnelle & Rentabilité Consolidées</span>
                      </div>
                      <div className="border border-slate-150 rounded-xl p-5 bg-gradient-to-r from-slate-50/70 to-slate-50/30 grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="space-y-1">
                          <span className="text-[9px] font-black uppercase text-gray-450 block">PANIER MOYEN (AOV)</span>
                          <p className="text-xl font-bold font-mono text-[#F26522]">{averageOrderValue.toLocaleString()} FCFA</p>
                          <span className="text-[10px] text-gray-500 font-medium">Montant moyen par ticket</span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] font-black uppercase text-gray-450 block">MARGE BÉNÉFICIAIRE NETTE</span>
                          <p className={`text-xl font-bold font-mono ${netMarginPercent >= 0 ? 'text-emerald-600' : 'text-red-650'}`}>
                            {netMarginPercent.toFixed(2)} %
                          </p>
                          <span className="text-[10px] text-gray-500 font-medium">Rentabilité nette du CA global</span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] font-black uppercase text-gray-450 block">FRÉQUENTATION (COUVERTS)</span>
                          <p className="text-xl font-bold font-mono text-indigo-950">
                            {totalCovers.toLocaleString()} <span className="text-xs font-normal text-slate-500">couv.</span>
                          </p>
                          <span className="text-[10px] text-gray-500 font-medium">Ticket / couvert : {averageCoverValue.toLocaleString()} FCFA</span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] font-black uppercase text-gray-450 block">EFFICACITÉ DES CHARGES (EXPENSE RATIO)</span>
                          <p className="text-xl font-bold font-mono text-blue-950">{expenseToRevenueRatio.toFixed(2)} %</p>
                          <span className="text-[10px] text-gray-500 font-medium">Part du CA consommée par les charges</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: ESTABLISHMENT JURIDIQUE INFO & DETAIL */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="border border-gray-150 p-4 rounded-xl space-y-3 md:col-span-1 bg-white">
                      <h4 className="text-xs font-bold text-gray-900 border-b pb-2 flex items-center justify-between">
                        <span>Fiche d'Identité Client</span>
                        <span className="bg-slate-100 text-slate-700 border text-[9px] uppercase px-1.5 py-0.5 rounded font-mono font-bold">Siège</span>
                      </h4>
                      <div className="space-y-3 text-xs">
                        <div>
                          <p className="text-gray-450 font-bold">Raison Sociale</p>
                          <p className="font-extrabold text-gray-800 text-sm mt-0.5">{selectedTenant.name}</p>
                        </div>
                        <div>
                          <p className="text-gray-450 font-bold">Code Client Système de Référence</p>
                          <p className="font-mono bg-slate-100 border px-1.5 py-0.5 rounded inline-block text-[11px] font-bold mt-1 text-gray-700">{selectedTenant.id}</p>
                        </div>
                        <div>
                          <p className="text-gray-450 font-bold">Coordonnées Téléphoniques</p>
                          <p className="font-extrabold text-gray-800 mt-0.5">{selectedTenant.phone || 'Non renseigné'}</p>
                        </div>
                        <div>
                          <p className="text-gray-450 font-bold">Adresse Géographique</p>
                          <p className="font-semibold text-gray-800 mt-0.5">{selectedTenant.address || 'Non spécifiée'}</p>
                          <p className="font-medium text-gray-500 text-[11px] mt-0.5">{selectedTenant.city}, {selectedTenant.country}</p>
                        </div>
                      </div>
                    </div>

                    {/* PIECE 3: SITES GRID AND DETAILED BREAKDOWN OF SYSTEM SITES */}
                    <div className="border border-gray-150 p-4 rounded-xl space-y-3 md:col-span-2 bg-white">
                      <h4 className="text-xs font-bold text-gray-900 border-b pb-2 flex items-center justify-between">
                        <span>Mouvements opérationnels par Site Rattaché ({clientSites.length})</span>
                        <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded">Multi-Site Isolé</span>
                      </h4>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[11px]">
                          <thead>
                            <tr className="border-b text-gray-400 font-extrabold text-[9px] uppercase">
                              <th className="py-2">Code ID</th>
                              <th className="py-2">Nom de l'Établissement</th>
                              <th className="py-2 text-center">Rôle site</th>
                              <th className="py-2 text-center">Staff</th>
                              <th className="py-2 text-right">CA validé</th>
                              <th className="py-2 text-right">Dépenses</th>
                              <th className="py-2 text-right">Excédent Net</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y text-gray-700">
                            {clientSites.map(s => {
                              const sOrders = orders.filter(o => o.tenantId === s.id && o.status === 'CLOSED');
                              const sRevenue = sOrders.reduce((sum, o) => sum + o.total, 0);
                              const sExpenses = expenses.filter(e => e.tenantId === s.id).reduce((sum, e) => sum + e.amountTtc, 0);
                              const sNet = sRevenue - sExpenses;
                              const sStaff = users.filter(u => u.tenantId === s.id && u.role !== 'SUPERADMIN').length;
                              const isParent = s.id === selectedTenant.id;
                              
                              return (
                                <tr key={s.id} className="hover:bg-slate-50/50">
                                  <td className="py-2.5 font-mono font-bold text-gray-900">{s.id}</td>
                                  <td className="py-2.5 font-extrabold text-gray-800">{s.name}</td>
                                  <td className="py-2.5 text-center">
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                                      isParent ? 'bg-orange-50 text-orange-700 border border-orange-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                                    }`}>
                                      {isParent ? 'Siège / Principal' : 'Succursale'}
                                    </span>
                                  </td>
                                  <td className="py-2.5 text-center font-bold">{sStaff} pers.</td>
                                  <td className="py-2.5 text-right font-mono font-bold text-indigo-900">{sRevenue.toLocaleString()} FCFA</td>
                                  <td className="py-2.5 text-right font-mono text-rose-600">{sExpenses.toLocaleString()} FCFA</td>
                                  <td className={`py-2.5 text-right font-mono font-bold ${sNet >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {sNet >= 0 ? '+' : ''}{sNet.toLocaleString()} FCFA
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: STAFF MANAGEMENT & UNIFIED PASSWORD RESET ACTION */}
                  <div className="border border-gray-150 p-4 rounded-xl space-y-4 bg-white">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-2 gap-2">
                      <div>
                        <h4 className="text-xs font-black text-gray-900 uppercase">
                          Index des Collaborateurs & Habilitations d'Accès ({clientUsers.length})
                        </h4>
                        <p className="text-[10px] text-gray-450 font-medium">
                          Vous possédez les privilèges requis pour modifier ou réaffecter manuellement les mots de passe de connexion des collaborateurs de ce restaurant.
                        </p>
                      </div>
                      <span className="bg-red-50 text-red-700 text-[10px] font-black px-2 py-1 rounded border border-red-100 flex items-center gap-1 w-fit self-start uppercase tracking-wider">
                        🛡️ Contrôle d'Accès d'Infrastructure Établi
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b text-gray-400 font-extrabold uppercase text-[9px] bg-slate-50 bg-opacity-70">
                            <th className="px-4 py-2.5">Nom Collaborateur</th>
                            <th className="px-4 py-2.5">Adresse de Connexion (Login)</th>
                            <th className="px-4 py-2.5 text-center">Rôle Système</th>
                            <th className="px-4 py-2.5">Site Affecté</th>
                            <th className="px-4 py-2.5 text-right w-1/3">Gestion Clé d'Accès Privée</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y text-gray-700">
                          {clientUsers.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="text-center py-6 text-gray-450 font-medium">
                                Aucun collaborateur trouvé pour ce restaurant.
                              </td>
                            </tr>
                          ) : (
                            clientUsers.map(u => {
                              const userSiteName = clientSites.find(s => s.id === u.tenantId)?.name || u.tenantId;
                              return (
                                <tr key={u.id} className="hover:bg-slate-50/50">
                                  <td className="px-4 py-3 font-extrabold text-gray-900">{u.name}</td>
                                  <td className="px-4 py-3 font-mono text-gray-500 font-semibold">{u.email}</td>
                                  <td className="px-4 py-3 text-center">
                                    <span className="bg-indigo-50 text-indigo-800 border border-indigo-100 text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase">
                                      {u.role}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className="font-semibold text-gray-700 block truncate max-w-[150px]" title={userSiteName}>
                                      📍 {userSiteName}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex justify-end">
                                      {editingUserPasswordId === u.id ? (
                                        <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-lg border border-slate-200">
                                          <input
                                            type="text"
                                            className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono font-bold w-44 focus:outline-none focus:border-indigo-500 text-indigo-950 shadow-3xs"
                                            value={tempNewUserPassword}
                                            onChange={(e) => setTempNewUserPassword(e.target.value)}
                                            placeholder="Nouveau mot de passe..."
                                            autoFocus
                                          />
                                          <button
                                            onClick={() => {
                                              if (!tempNewUserPassword.trim()) {
                                                alert("Le mot de passe ne peut pas être vide.");
                                                return;
                                              }
                                              // Perform password reset action!
                                              if (onUpdateUsers) {
                                                const upgradedUsers = users.map(userItem => {
                                                  if (userItem.id === u.id) {
                                                    return {
                                                      ...userItem,
                                                      password: tempNewUserPassword,
                                                      mustChangePassword: true, // Force changes
                                                      passwordChanged: false // reset flag
                                                    };
                                                  }
                                                  return userItem;
                                                });
                                                onUpdateUsers(upgradedUsers);
                                                logsAction(`SuperAdmin: Changement de mot de passe de ${u.name} pour ${tempNewUserPassword}`, 'SÉCURITÉ');
                                              }
                                              setEditingUserPasswordId(null);
                                            }}
                                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-black tracking-wide cursor-pointer transition uppercase"
                                          >
                                            Valider
                                          </button>
                                          <button
                                            onClick={() => setEditingUserPasswordId(null)}
                                            className="px-1.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded text-[10px] font-bold cursor-pointer transition"
                                          >
                                            <X size={12} />
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-2">
                                          <span className="font-mono text-[11px] font-extrabold bg-amber-50 text-amber-955 px-2.5 py-0.5 rounded border border-amber-200 tracking-wide select-all">
                                            {u.password || 'password123'}
                                          </span>
                                          <button
                                            onClick={() => {
                                              setEditingUserPasswordId(u.id);
                                              setTempNewUserPassword(u.password || 'password123');
                                            }}
                                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded text-[10px] font-bold tracking-wide cursor-pointer transition flex items-center gap-1 shrink-0"
                                          >
                                            <span>Réinitialiser</span>
                                            <span>🔑</span>
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })() : (
              <div className="text-center py-8 text-gray-400 font-medium">
                Aucun établissement sélectionné ou disponible pour le moment.
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'AUDIT_LOGS' ? (
        /* AUDIT_LOGS VIEW */
        <div className="space-y-6">
          <div className="bg-white border border-gray-150 rounded-xl shadow-3xs overflow-hidden">
            {/* Header: Filters & Actions */}
            <div className="p-5 border-b border-gray-150 flex flex-col xl:flex-row gap-4 justify-between items-stretch bg-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1">
                {/* Search */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    placeholder="Chercher une action, anomalie..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 text-xs rounded-lg text-gray-800 focus:outline-none focus:border-[#1E4E8C]"
                  />
                </div>
                {/* Module Filter */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Filter size={14} />
                  </span>
                  <select
                    value={logModuleFilter}
                    onChange={(e) => setLogModuleFilter(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 text-xs rounded-lg text-gray-800 cursor-pointer focus:outline-none focus:border-[#1E4E8C]"
                  >
                    <option value="ALL">Tous les modules</option>
                    <option value="SÉCURITÉ">Sécurité & Connexions</option>
                    <option value="SUPERADMIN">SuperAdministration</option>
                    <option value="COMPTABILITÉ">Comptabilité</option>
                    <option value="FINANCE">Finance & Charges</option>
                    <option value="ADMINISTRATION">Rapports & Exports</option>
                  </select>
                </div>
                {/* Tenant Filter */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Building2 size={14} />
                  </span>
                  <select
                    value={logTenantFilter}
                    onChange={(e) => setLogTenantFilter(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 text-xs rounded-lg text-gray-800 cursor-pointer focus:outline-none focus:border-[#1E4E8C]"
                  >
                    <option value="ALL">Tous les Établissements</option>
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>🏢 {t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end">
                <button
                  type="button"
                  onClick={() => {
                    // Export logs to JSON
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
                    const downloadAnchor = document.createElement('a');
                    downloadAnchor.setAttribute("href", dataStr);
                    downloadAnchor.setAttribute("download", `plateforme_audit_logs_${new Date().toISOString().slice(0, 10)}.json`);
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    downloadAnchor.remove();
                    logsAction("Export global du journal d'audit de la plateforme", 'SUPERADMIN');
                  }}
                  className="px-4 py-2 bg-slate-900 border border-slate-900 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm hover:bg-slate-800"
                >
                  <FileDown size={14} />
                  <span>Exporter Journal</span>
                </button>
              </div>
            </div>

            {/* Logs Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b text-gray-400 font-extrabold uppercase text-[9px] bg-slate-100/70">
                    <th className="px-5 py-3">Horodatage</th>
                    <th className="px-5 py-3">Site / Établissement</th>
                    <th className="px-5 py-3">Opérateur / Profil</th>
                    <th className="px-5 py-3">Module</th>
                    <th className="px-5 py-3 font-medium">Trace & Action Réalisée</th>
                    <th className="px-5 py-3 text-center">Niveau</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-gray-700">
                  {(() => {
                    const filteredLogs = auditLogs.filter(log => {
                      const matchesSearch = 
                        log.action.toLowerCase().includes(logSearch.toLowerCase()) || 
                        log.userName.toLowerCase().includes(logSearch.toLowerCase()) ||
                        log.module.toLowerCase().includes(logSearch.toLowerCase());
                      const matchesModule = logModuleFilter === 'ALL' || log.module === logModuleFilter;
                      const matchesTenant = logTenantFilter === 'ALL' || log.tenantId === logTenantFilter;
                      return matchesSearch && matchesModule && matchesTenant;
                    });

                    if (filteredLogs.length === 0) {
                      return (
                        <tr>
                          <td colSpan={6} className="text-center py-10 text-gray-400 font-medium">
                            <Server className="mx-auto mb-2 text-slate-350" size={24} />
                            Aucun enregistrement d'audit trouvé pour ces critères de recherche.
                          </td>
                        </tr>
                      );
                    }

                    return filteredLogs.slice(0, 200).map((log) => {
                      const targetTenant = tenants.find(t => t.id === log.tenantId);
                      const isSecIssue = log.module === 'SÉCURITÉ' || log.action.includes('désactivé') || log.action.includes('Refus');
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/50">
                          <td className="px-5 py-3.5 font-mono text-gray-500 font-bold whitespace-nowrap">{log.timestamp}</td>
                          <td className="px-5 py-3.5">
                            <span className="font-extrabold text-blue-900 block max-w-[150px] truncate" title={targetTenant?.name || log.tenantId}>
                              🏢 {targetTenant?.name || log.tenantId || 'Infrastructure'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 font-semibold text-slate-800">
                            👤 {log.userName}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border border-slate-150 text-slate-600 bg-slate-100">
                              {log.module}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-600 leading-relaxed font-medium font-sans">
                            {log.action}
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            {isSecIssue ? (
                              <span className="bg-rose-50 text-rose-700 border border-rose-105 text-[8px] font-extrabold px-1.5 py-0.5 rounded tracking-wider uppercase whitespace-nowrap">
                                Critique 🚨
                              </span>
                            ) : (
                              <span className="bg-blue-50 text-blue-700 border border-blue-105 text-[8px] font-extrabold px-1.5 py-0.5 rounded tracking-wider uppercase whitespace-nowrap">
                                Info 📝
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-slate-50 border-t text-right text-[10px] text-gray-405 font-bold">
              Affichage des 200 derniers événements d'audit en temps réel
            </div>
          </div>
        </div>
      ) : activeTab === 'COLLABORATORS_GLOBAL' ? (
        /* COLLABORATORS_GLOBAL VIEW */
        <div className="space-y-6 animate-fade-in">
          <div className="bg-white border border-gray-150 rounded-xl shadow-3xs overflow-hidden">
            {/* Header: Search and New Collaborator */}
            <div className="p-5 border-b border-gray-150 flex flex-col xl:flex-row gap-4 justify-between items-center bg-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1 w-full">
                {/* Search */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Search size={14} />
                  </span>
                  <input
                    type="text"
                    placeholder="Chercher par nom, email..."
                    value={collabSearch}
                    onChange={(e) => setCollabSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 text-xs rounded-lg text-gray-800 focus:outline-none focus:border-[#1E4E8C]"
                  />
                </div>
                {/* Role filter */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Sliders size={14} />
                  </span>
                  <select
                    value={collabRoleFilter}
                    onChange={(e) => setCollabRoleFilter(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 text-xs rounded-lg text-gray-800 cursor-pointer focus:outline-none focus:border-[#1E4E8C]"
                  >
                    <option value="ALL">Tous les Rôles</option>
                    <option value="ADMIN">ADMIN (Gérant de site)</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="CASHIER">CASHIER (Caissier POS)</option>
                    <option value="WAREHOUSE">STOCKS (Économe)</option>
                    <option value="ACCOUNTING">COMPTABILITÉ (Comptable)</option>
                  </select>
                </div>
                {/* Active/Status Filter */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <AlertCircle size={14} />
                  </span>
                  <select
                    value={collabStatusFilter}
                    onChange={(e) => setCollabStatusFilter(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 text-xs rounded-lg text-gray-800 cursor-pointer focus:outline-none focus:border-[#1E4E8C]"
                  >
                    <option value="ALL">Tous les statuts</option>
                    <option value="ACTIVE">Actifs uniquement</option>
                    <option value="INACTIVE">Désactivés/Suspendus uniquement</option>
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (tenants.length > 0) {
                    setNewUserTenantId(tenants[0].id);
                  }
                  setShowAddUserModal(true);
                }}
                className="w-full xl:w-auto px-4 py-2 bg-[#F26522] hover:bg-[#F26522]/95 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
              >
                <UserPlus size={14} />
                <span>Nouveau Collaborateur Global</span>
              </button>
            </div>

            {/* Collaborators Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b text-gray-400 font-extrabold uppercase text-[9px] bg-slate-100/70">
                    <th className="px-5 py-3">Données Collaborateur</th>
                    <th className="px-5 py-3">Adresse de Connexion (Login)</th>
                    <th className="px-5 py-3">Rôle Système</th>
                    <th className="px-5 py-3">Établissement rattaché</th>
                    <th className="px-5 py-3 text-center">État Système</th>
                    <th className="px-5 py-3 text-right">Contrôle Clés & Sécurité</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-gray-700">
                  {(() => {
                    const sysUsers = users.filter(u => u.role !== 'SUPERADMIN');
                    const filteredUsers = sysUsers.filter(u => {
                      const matchesSearch = 
                        u.name.toLowerCase().includes(collabSearch.toLowerCase()) || 
                        u.email.toLowerCase().includes(collabSearch.toLowerCase());
                      const matchesRole = collabRoleFilter === 'ALL' || u.role === collabRoleFilter;
                      
                      const isUserActive = u.active !== false;
                      const matchesStatus = 
                        collabStatusFilter === 'ALL' ||
                        (collabStatusFilter === 'ACTIVE' && isUserActive) ||
                        (collabStatusFilter === 'INACTIVE' && !isUserActive);

                      return matchesSearch && matchesRole && matchesStatus;
                    });

                    if (filteredUsers.length === 0) {
                      return (
                        <tr>
                          <td colSpan={6} className="text-center py-10 text-gray-400 font-medium whitespace-nowrap">
                            <Users className="mx-auto mb-2 text-slate-350" size={24} />
                            Aucun utilisateur trouvé pour ces critères de filtrage.
                          </td>
                        </tr>
                      );
                    }

                    return filteredUsers.map((u) => {
                      const currentTenantObj = tenants.find(t => t.id === u.tenantId);
                      const isUserActive = u.active !== false;
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/50">
                          <td className="px-5 py-3.5">
                            <div className="font-extrabold text-slate-900 flex items-center gap-1.5 whitespace-nowrap">
                              <span>👤 {u.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 font-mono text-gray-500 font-semibold">{u.email}</td>
                          <td className="px-5 py-3.5">
                            <span className="inline-block bg-indigo-50 text-indigo-700 border border-indigo-100 text-[9px] font-extrabold px-2 py-0.5 rounded uppercase font-mono tracking-wider">
                              {u.role}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="font-extrabold text-blue-900 block truncate max-w-[150px]" title={currentTenantObj?.name || u.tenantId}>
                              🏢 {currentTenantObj?.name || u.tenantId}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                if (onUpdateUsers) {
                                  const updated = users.map(user => {
                                    if (user.id === u.id) {
                                      const nextActive = !isUserActive;
                                      logsAction(`SuperAdmin: Changement du statut actif pour ${u.name} à ${nextActive ? 'Actif' : 'Désactivé'}`, 'SUPERADMIN');
                                      return { ...user, active: nextActive };
                                    }
                                    return user;
                                  });
                                  onUpdateUsers(updated);
                                }
                              }}
                              className={`px-2 py-1 rounded inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider border cursor-pointer transition ${
                                isUserActive 
                                  ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800' 
                                  : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-800'
                              }`}
                              title={isUserActive ? "Suspendre l'utilisateur" : "Activer l'utilisateur"}
                            >
                              {isUserActive ? <UserCheck size={11} /> : <UserX size={11} />}
                              <span>{isUserActive ? "Actif" : "Désactivé"}</span>
                            </button>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex justify-end items-center gap-2">
                              {/* inline change password */}
                              <div className="relative">
                                {editingUserPasswordId === u.id ? (
                                  <div className="flex items-center gap-1 bg-slate-150 p-1 rounded-lg border border-slate-205">
                                    <input
                                      type="text"
                                      className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono font-bold w-36 focus:outline-none focus:border-indigo-500 text-indigo-950"
                                      value={tempNewUserPassword}
                                      onChange={(e) => setTempNewUserPassword(e.target.value)}
                                      placeholder="Pass..."
                                      autoFocus
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (!tempNewUserPassword.trim()) {
                                          alert("Le mot de passe ne peut pas être vide.");
                                          return;
                                        }
                                        if (onUpdateUsers) {
                                          const updated = users.map(user => {
                                            if (user.id === u.id) {
                                              return {
                                                ...user,
                                                password: tempNewUserPassword.trim(),
                                                mustChangePassword: true,
                                                passwordChanged: false
                                              };
                                            }
                                            return user;
                                          });
                                          onUpdateUsers(updated);
                                          logsAction(`SuperAdmin: Changement de mot de passe de ${u.name} pour ${tempNewUserPassword}`, 'SÉCURITÉ');
                                        }
                                        setEditingUserPasswordId(null);
                                      }}
                                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-black cursor-pointer uppercase"
                                    >
                                      Valider
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingUserPasswordId(null)}
                                      className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                                    >
                                      <X size={13} />
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingUserPasswordId(u.id);
                                      setTempNewUserPassword(u.password || 'password2026');
                                    }}
                                    className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded text-[9px] font-extrabold transition cursor-pointer flex items-center gap-1.5"
                                    title="Changer le mot de passe"
                                  >
                                    <span>🔑 Clé :</span>
                                    <span className="font-mono font-bold text-gray-800">{u.password || 'password123'}</span>
                                  </button>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement le collaborateur "${u.name}" ?`)) {
                                    if (onUpdateUsers) {
                                      const updated = users.filter(user => user.id !== u.id);
                                      onUpdateUsers(updated);
                                      logsAction(`SuperAdmin: Suppression définitive du collaborateur ${u.name}`, 'SUPERADMIN');
                                    }
                                  }
                                }}
                                className="p-1 bg-rose-50 hover:bg-rose-100 rounded text-rose-600 border border-rose-100 cursor-pointer transition shrink-0"
                                title="Supprimer définitivement"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-slate-50 border-t text-left text-[10px] text-gray-400 font-bold">
              Total collaborateurs répertoriés : {users.filter(u => u.role !== 'SUPERADMIN').length}
            </div>
          </div>
        </div>
      ) : activeTab === 'SCENARIOS' ? (
        /* INTERACTIVE ARCHITECTURE SCENARIOS WORKSPACE */
        <div className="space-y-6 text-slate-800 animate-fade-in" id="scenarios-workspace">
          <div className="bg-[#0B1F3F] text-white p-6 rounded-2xl shadow-md border border-[#1E4E8C] relative overflow-hidden">
            <div className="absolute right-0 top-0 opacity-15 transform translate-x-6 -translate-y-4">
              <Layers size={150} className="text-blue-400" />
            </div>
            <div className="space-y-2 relative z-10">
              <div className="flex items-center gap-2">
                <span className="bg-amber-500 text-[#0B1F3F] text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                  WORKSPACE DE PLANIFICATION D'ARCHITECTURE (4 MODÈLES)
                </span>
              </div>
              <h3 className="text-xl font-extrabold tracking-tight">
                Simulateur de Topologies Réseau & Portabilité Client
              </h3>
              <p className="text-slate-300 text-xs max-w-2xl leading-relaxed">
                Configurez, analysez et simulez les 4 scénarios d'infrastructure réseau pour vos clients restaurateurs. Choisissez la topologie la plus adaptée selon leurs besoins de connectivité Internet et d'isolation LAN.
              </p>
            </div>
          </div>

          {/* Scenario Selection Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {
                id: 1,
                title: "Scénario 1 : Base de Données Cloud (En ligne)",
                desc: "L'ERP tourne localement, mais les données transitent via Internet. (Mode de travail actuel)",
                badge: "ACTIF EN COOPÉRATION",
                badgeClass: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
                icon: Cloud,
                feasibility: "100% opérationnel",
                localCache: "Optionnel",
                net: "Requis"
              },
              {
                id: 2,
                title: "Scénario 2 : Base locale en Réseau Local (LAN / Hors-ligne)",
                desc: "Serveur centralisé avec PostgreSQL local sur le LAN. Les clients s'y connectent en local.",
                badge: "FAISABLE ET PRÊT",
                badgeClass: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
                icon: Server,
                feasibility: "Faisable (Redirection IP)",
                localCache: "Oui (PostgreSQL LAN)",
                net: "Non Requis"
              },
              {
                id: 3,
                title: "Scénario 3 : Serveur Web Local (LAN Centralisé)",
                desc: "ERP et base sur une machine unique. Les clients s'y connectent via leur navigateur.",
                badge: "FORTEMENT RECOMMANDÉ",
                badgeClass: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
                icon: Building2,
                feasibility: "Recommandé (Zéro-install)",
                localCache: "Complet (Centralisé)",
                net: "Non Requis"
              },
              {
                id: 4,
                title: "Scénario 4 : Format Lourd (Tauri / Electron + SQLite)",
                desc: "Base relationnelle SQLite autonome stockée localement dans un conteneur lourd.",
                badge: "DISPONIBLE SUR DEMANDE",
                badgeClass: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20",
                icon: Database,
                feasibility: "Prêt pour Poste Unique",
                localCache: "Fichier .db local",
                net: "Non Requis"
              }
            ].map((scen) => {
              const ScenIcon = scen.icon;
              const isSelected = selectedScenarioId === scen.id;
              return (
                <div
                  key={scen.id}
                  onClick={() => {
                    setSelectedScenarioId(scen.id);
                    setSimulatedConsoleLogs(prev => [
                      ...prev,
                      `[SYSTÈME] Passage au Scénario ${scen.id} : ${scen.title}`
                    ]);
                  }}
                  className={`p-5 rounded-2xl border transition cursor-pointer flex flex-col justify-between text-left h-full ${
                    isSelected
                      ? 'bg-[#0B1F3F] border-[#1E4E8C] text-white shadow-md scale-[1.02]'
                      : 'bg-white border-gray-150 hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <span className={`p-2 rounded-xl ${isSelected ? 'bg-white/10 text-[#F26522]' : 'bg-slate-100 text-[#0B1F3F]'}`}>
                        <ScenIcon size={18} />
                      </span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${scen.badgeClass}`}>
                        {scen.badge}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs leading-snug">{scen.title}</h4>
                      <p className={`text-[10px] mt-1.5 leading-relaxed ${isSelected ? 'text-slate-300 font-medium' : 'text-gray-500 font-medium'}`}>
                        {scen.desc}
                      </p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-dashed mt-4 grid grid-cols-2 gap-2 text-[9px] font-extrabold uppercase tracking-wide">
                    <div>
                      <span className={isSelected ? 'text-slate-400' : 'text-gray-400'}>Internet :</span>
                      <span className={`ml-1 ${isSelected ? 'text-emerald-400' : 'text-slate-800'}`}> {scen.net}</span>
                    </div>
                    <div>
                      <span className={isSelected ? 'text-slate-400' : 'text-gray-400'}>Faisabilité :</span>
                      <span className={`ml-1 ${isSelected ? 'text-amber-400' : 'text-slate-800'}`}> {scen.feasibility.split(' ')[0]}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Comparison & Simulator Variables */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Variable configuration & code builder */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="bg-white border border-gray-150 rounded-2xl shadow-3xs p-6 space-y-6">
                <h4 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
                  <Sliders size={14} className="text-[#F26522]" />
                  <span>1. Personnaliser les variables de la topologie réseau</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                      <span>Établissement Restaurant Cible</span>
                    </label>
                    <select
                      value={selectedScenarioTenantId}
                      onChange={(e) => setSelectedScenarioTenantId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 text-xs rounded-lg focus:outline-none focus:border-[#1E4E8C] font-extrabold text-gray-800 bg-white"
                    >
                      {tenants.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.city})</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wide">
                      Adresse IP Fixe du Serveur Local (LAN)
                    </label>
                    <input
                      type="text"
                      value={simulatedLocalIp}
                      onChange={(e) => setSimulatedLocalIp(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 text-xs rounded-lg focus:outline-none focus:border-[#1E4E8C] font-mono font-bold text-slate-800"
                      placeholder="e.g. 192.168.1.100"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wide">
                      Port de Connexion de la Base de Données
                    </label>
                    <input
                      type="text"
                      value={simulatedPort}
                      onChange={(e) => setSimulatedPort(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 text-xs rounded-lg focus:outline-none focus:border-[#1E4E8C] font-mono font-bold text-slate-800"
                      placeholder="54321"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wide">
                      Nom de la Base SQL de destination
                    </label>
                    <input
                      type="text"
                      value={simulatedDbName}
                      onChange={(e) => setSimulatedDbName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 text-xs rounded-lg focus:outline-none focus:border-[#1E4E8C] font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>

                {/* Interactive visual layout diagram */}
                <div className="bg-slate-50 border border-slate-150 p-5 rounded-2xl space-y-4">
                  <h5 className="font-extrabold text-[10px] text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity size={13} className="text-[#F26522]" />
                    <span>Schéma conceptuel des flux de données (Scénario {selectedScenarioId})</span>
                  </h5>

                  <div className="flex flex-col md:flex-row justify-between items-center gap-4 py-4 px-2 bg-white rounded-xl border border-slate-200 relative">
                    {/* Device Client */}
                    <div className="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-150 w-28 text-center">
                      <span className="p-1.5 bg-[#0B1F3F] text-white rounded-lg">
                        <Users size={16} />
                      </span>
                      <span className="text-[9px] font-black text-slate-800 leading-none">ERP Client</span>
                      <span className="text-[8px] font-semibold text-gray-400">Postes de caisse</span>
                    </div>

                    {/* Arrow/Line */}
                    <div className="flex-1 h-0.5 border-t border-dashed border-slate-300 relative w-full md:w-auto flex justify-center items-center">
                      <span className="bg-slate-100 text-[8px] text-indigo-700 font-extrabold px-2 py-0.5 rounded-full border border-slate-200 absolute -translate-y-0.5">
                        {selectedScenarioId === 1 ? "WIFI + WAN" : "WIFI local LAN"}
                      </span>
                    </div>

                    {/* Central Router / Server */}
                    {selectedScenarioId !== 4 && (
                      <>
                        <div className="flex flex-col items-center gap-2 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 w-32 text-center">
                          <span className="p-1.5 bg-[#1E4E8C] text-white rounded-lg">
                            <Server size={16} />
                          </span>
                          <span className="text-[9px] font-black text-slate-800 leading-none">
                            {selectedScenarioId === 1 ? "Routeur Internet" : `Serveur LAN (${simulatedLocalIp})`}
                          </span>
                          <span className="text-[8px] font-semibold text-indigo-500">
                            {selectedScenarioId === 1 ? "Passerelle DNS" : "Relais Local"}
                          </span>
                        </div>

                        {/* Arrow/Line */}
                        <div className="flex-1 h-0.5 border-t border-dashed border-slate-300 relative w-full md:w-auto flex justify-center items-center">
                          <span className="bg-slate-100 text-[8px] text-indigo-700 font-extrabold px-2 py-0.5 rounded-full border border-slate-200 absolute -translate-y-0.5">
                            {selectedScenarioId === 1 ? "Cloud SQL" : "SQL local"}
                          </span>
                        </div>
                      </>
                    )}

                    {/* Database Container */}
                    <div className="flex flex-col items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-150 w-28 text-center">
                      <span className="p-1.5 bg-emerald-600 text-white rounded-lg">
                        <Database size={16} />
                      </span>
                      <span className="text-[9px] font-black text-slate-800 leading-none">
                        {selectedScenarioId === 1 ? "Supabase Cloud" : selectedScenarioId === 4 ? "SQLite local" : "PostgreSQL local"}
                      </span>
                      <span className="text-[8px] font-semibold text-emerald-600">
                        {selectedScenarioId === 1 ? "En ligne" : `Nom: ${simulatedDbName}`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Code snippets depending on selected scenario */}
                <div className="space-y-3 text-left">
                  <div className="flex justify-between items-center">
                    <h5 className="font-extrabold text-[10px] text-slate-700 uppercase tracking-wider">
                      Fichier de Configuration Généré (.env)
                    </h5>
                    <button
                      type="button"
                      onClick={() => {
                        let text = "";
                        if (selectedScenarioId === 1) {
                          text = `VITE_SUPABASE_URL=https://votre-projet.supabase.co\nVITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\nPORT=3000\nNODE_ENV=production`;
                        } else if (selectedScenarioId === 2) {
                          text = `VITE_SUPABASE_URL=http://${simulatedLocalIp}:${simulatedPort}\nVITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\nPORT=3000\nLOCAL_DATABASE_URL=postgres://postgres:secret@${simulatedLocalIp}:${simulatedPort}/${simulatedDbName}`;
                        } else if (selectedScenarioId === 3) {
                          text = `VITE_SERVER_HOST=0.0.0.0\nPORT=3000\nDATABASE_URL=postgres://postgres:secret@127.0.0.1:5432/${simulatedDbName}\nLOCAL_SERVER_IP=http://${simulatedLocalIp}:3000`;
                        } else {
                          text = `SQLITE_DB_PATH=~/.kissineflow/${simulatedDbName}.db\nRUN_MODE=tauri-desktop\nOFFLINE_COMPATIBLE=true`;
                        }
                        navigator.clipboard.writeText(text);
                        alert("Fichier .env copié dans le presse-papiers !");
                      }}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-extrabold rounded border border-slate-200 transition cursor-pointer flex items-center gap-1"
                    >
                      <Copy size={11} />
                      <span>Copier .env</span>
                    </button>
                  </div>

                  <pre className="bg-[#111827] text-[#f3f4f6] p-4 rounded-xl font-mono text-[10px] overflow-x-auto leading-relaxed max-h-48 shadow-md">
                    {selectedScenarioId === 1 ? (
`# CONFIGURATION ACTIVE - CLOUD SUPABASE (EN LIGNE)
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PORT=3000
NODE_ENV=production
# Toutes les bases locales se synchronisent sur cette unique instance cloud.`
                    ) : selectedScenarioId === 2 ? (
`# CONFIGURATION RÉSEAU LOCAL HORS-LIGNE
VITE_SUPABASE_URL=http://${simulatedLocalIp}:${simulatedPort}
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# Url de connexion PostgreSQL locale directe pour les serveurs internes:
LOCAL_DATABASE_URL=postgres://postgres:secret@${simulatedLocalIp}:${simulatedPort}/${simulatedDbName}`
                    ) : selectedScenarioId === 3 ? (
`# CONFIGURATION SERVEUR WEB LOCAL CENTRALISÉ
PORT=3000
NODE_ENV=production
# Connexion PostgreSQL locale sur la machine serveur:
DATABASE_URL=postgres://postgres:secret@127.0.0.1:5432/${simulatedDbName}
# Adresse de diffusion à saisir sur les tablettes / téléphones:
LOCAL_SERVER_IP=http://${simulatedLocalIp}:3000`
                    ) : (
`# CONFIGURATION APPLICATION BUREAU UNIQUE (SQLITE)
SQLITE_DB_PATH=~/.kissineflow/${simulatedDbName}.db
RUN_MODE=tauri-desktop
OFFLINE_COMPATIBLE=true
# Zéro connexion réseau externe requise. Fichier .db autonome.`
                    )}
                  </pre>
                </div>

              </div>

              {/* Feasibility Evaluator */}
              <div className="bg-white border border-gray-150 rounded-2xl shadow-3xs p-6 space-y-4 text-left">
                <h4 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
                  <ShieldCheck size={14} className="text-emerald-600" />
                  <span>2. Évaluer la faisabilité opérationnelle pour ce client</span>
                </h4>

                <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                  Cochez les prérequis matériels ou de réseau disponibles chez votre client pour calculer instantanément l'indice de viabilité de cette architecture :
                </p>

                {selectedScenarioId === 1 && (
                  <div className="space-y-3 animate-fade-in">
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-2.5">
                      <Check size={16} className="text-emerald-600 mt-0.5 shrink-0" />
                      <div>
                        <h5 className="font-extrabold text-xs text-emerald-950">Architecture 100% Validée par Défaut</h5>
                        <p className="text-[10px] text-emerald-800 leading-normal mt-0.5 font-medium">
                          C'est l'approche actuelle que nous implémentons. Elle s'appuie sur la synchronisation cloud intégrée dans votre console SuperAdmin. Elle ne requiert aucune installation complexe d'infrastructure sur site, uniquement une connexion Internet de base.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedScenarioId === 2 && (
                  <div className="space-y-3 animate-fade-in text-xs">
                    <label className="flex items-start gap-2.5 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checklistScen2.postgresInstalled}
                        onChange={(e) => setChecklistScen2({ ...checklistScen2, postgresInstalled: e.target.checked })}
                        className="mt-0.5"
                      />
                      <div>
                        <span className="font-bold block text-[11px] text-slate-800">Le client possède une machine désignée comme serveur local avec PostgreSQL ou le CLI Supabase installé ?</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checklistScen2.fixedIpConfigured}
                        onChange={(e) => setChecklistScen2({ ...checklistScen2, fixedIpConfigured: e.target.checked })}
                        className="mt-0.5"
                      />
                      <div>
                        <span className="font-bold block text-[11px] text-slate-800">L'IP de cette machine a été configurée comme fixe (IP statique) dans les paramètres réseau Windows/Linux (ex : {simulatedLocalIp}) ?</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checklistScen2.portOpened}
                        onChange={(e) => setChecklistScen2({ ...checklistScen2, portOpened: e.target.checked })}
                        className="mt-0.5"
                      />
                      <div>
                        <span className="font-bold block text-[11px] text-slate-800">Le port de communication {simulatedPort} est autorisé en entrée dans le pare-feu du serveur et du routeur Wi-Fi ?</span>
                      </div>
                    </label>

                    {/* Result score */}
                    {(() => {
                      const score = Object.values(checklistScen2).filter(Boolean).length;
                      const percent = Math.round((score / 3) * 100);
                      return (
                        <div className="pt-3 border-t border-dashed mt-3 flex justify-between items-center">
                          <div>
                            <span className="text-[10px] text-gray-400 font-extrabold uppercase">Indice de faisabilité :</span>
                            <span className={`text-sm font-black ml-1.5 ${percent === 100 ? 'text-emerald-600' : percent >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                              {percent}% {percent === 100 ? "(Optimal)" : "(Action Requise)"}
                            </span>
                          </div>
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-extrabold">
                            {score}/3 Prérequis
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {selectedScenarioId === 3 && (
                  <div className="space-y-3 animate-fade-in text-xs">
                    <label className="flex items-start gap-2.5 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checklistScen3.serverNodeInstalled}
                        onChange={(e) => setChecklistScen3({ ...checklistScen3, serverNodeInstalled: e.target.checked })}
                        className="mt-0.5"
                      />
                      <div>
                        <span className="font-bold block text-[11px] text-slate-800">Le serveur local dispose de Node.js installé afin de lancer l'ERP et son serveur Express en direct ?</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checklistScen3.lanConnected}
                        onChange={(e) => setChecklistScen3({ ...checklistScen3, lanConnected: e.target.checked })}
                        className="mt-0.5"
                      />
                      <div>
                        <span className="font-bold block text-[11px] text-slate-800">Tous les téléphones et tablettes des serveurs/caissiers sont connectés sur le même réseau Wi-Fi local que le serveur ?</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checklistScen3.firewallConfigured}
                        onChange={(e) => setChecklistScen3({ ...checklistScen3, firewallConfigured: e.target.checked })}
                        className="mt-0.5"
                      />
                      <div>
                        <span className="font-bold block text-[11px] text-slate-800">Le pare-feu autorise le trafic entrant HTTP sur le port 3000 de la machine serveur ?</span>
                      </div>
                    </label>

                    {/* Result score */}
                    {(() => {
                      const score = Object.values(checklistScen3).filter(Boolean).length;
                      const percent = Math.round((score / 3) * 100);
                      return (
                        <div className="pt-3 border-t border-dashed mt-3 flex justify-between items-center">
                          <div>
                            <span className="text-[10px] text-gray-400 font-extrabold uppercase">Indice de faisabilité :</span>
                            <span className={`text-sm font-black ml-1.5 ${percent === 100 ? 'text-emerald-600' : percent >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                              {percent}% {percent === 100 ? "(Optimal)" : "(Action Requise)"}
                            </span>
                          </div>
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-extrabold">
                            {score}/3 Prérequis
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {selectedScenarioId === 4 && (
                  <div className="space-y-3 animate-fade-in text-xs">
                    <label className="flex items-start gap-2.5 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checklistScen4.tauriInstalled}
                        onChange={(e) => setChecklistScen4({ ...checklistScen4, tauriInstalled: e.target.checked })}
                        className="mt-0.5"
                      />
                      <div>
                        <span className="font-bold block text-[11px] text-slate-800">Le framework Tauri est configuré avec l'extension Rust pour builder l'application native légère ?</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checklistScen4.sqliteDatabaseConfigured}
                        onChange={(e) => setChecklistScen4({ ...checklistScen4, sqliteDatabaseConfigured: e.target.checked })}
                        className="mt-0.5"
                      />
                      <div>
                        <span className="font-bold block text-[11px] text-slate-800">Le pilote SQLite est correctement intégré pour stocker les collections sous forme de fichiers .db sur disque ?</span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checklistScen4.electronPackaged}
                        onChange={(e) => setChecklistScen4({ ...checklistScen4, electronPackaged: e.target.checked })}
                        className="mt-0.5"
                      />
                      <div>
                        <span className="font-bold block text-[11px] text-slate-800">Le packaging d'installation final (.exe pour Windows ou .dmg pour Mac) est prêt à être distribué ?</span>
                      </div>
                    </label>

                    {/* Result score */}
                    {(() => {
                      const score = Object.values(checklistScen4).filter(Boolean).length;
                      const percent = Math.round((score / 3) * 100);
                      return (
                        <div className="pt-3 border-t border-dashed mt-3 flex justify-between items-center">
                          <div>
                            <span className="text-[10px] text-gray-400 font-extrabold uppercase">Indice de faisabilité :</span>
                            <span className={`text-sm font-black ml-1.5 ${percent === 100 ? 'text-emerald-600' : percent >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                              {percent}% {percent === 100 ? "(Optimal)" : "(Action Requise)"}
                            </span>
                          </div>
                          <span className="text-[10px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-extrabold">
                            {score}/3 Prérequis
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                )}

              </div>

            </div>

            {/* Sandbox network interactive console logs */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="bg-white border border-gray-150 rounded-2xl shadow-3xs p-6 space-y-4 flex flex-col h-full justify-between">
                
                <div className="space-y-4 text-left">
                  <h4 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
                    <Activity size={14} className="text-[#F26522]" />
                    <span>3. Simulateur d'exécution de topologie</span>
                  </h4>
                  <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                    Déclenchez une simulation en temps réel pour auditer le routage des paquets SQL et la cinématique des requêtes réseau dans le scénario {selectedScenarioId} :
                  </p>

                  <button
                    type="button"
                    disabled={isSimulating}
                    onClick={handleRunSimulation}
                    className="w-full py-2.5 bg-[#0B1F3F] text-white hover:bg-slate-900 font-extrabold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-sm border border-slate-700 disabled:opacity-50"
                  >
                    {isSimulating ? (
                      <>
                        <RefreshCw size={13} className="animate-spin text-[#F26522]" />
                        <span>Simulation en cours...</span>
                      </>
                    ) : (
                      <>
                        <Activity size={13} className="text-[#F26522]" />
                        <span>Lancer le Test de Routage Réseau</span>
                      </>
                    )}
                  </button>

                  <div className="bg-[#0c1017] text-[#39ff14] p-4 rounded-xl font-mono text-[10px] h-[360px] overflow-y-auto border border-slate-800 shadow-inner flex flex-col gap-1 leading-relaxed">
                    <div className="text-slate-500 pb-1 border-b border-slate-900 flex justify-between items-center font-bold">
                      <span>TERMINAL DE SIMULATION RÉSEAU</span>
                      <span className="animate-pulse text-emerald-400">● LIVE</span>
                    </div>
                    {simulatedConsoleLogs.map((log, index) => (
                      <div key={index} className="whitespace-pre-wrap">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 text-left space-y-2 mt-4">
                  <h5 className="font-extrabold text-[10px] text-gray-400 uppercase tracking-wider">Aide & Recommandation</h5>
                  <p className="text-[10px] text-gray-500 font-medium leading-relaxed">
                    {selectedScenarioId === 1 ? (
                      "Le Scénario 1 est idéal pour débuter instantanément avec une administration à distance simplifiée. C'est l'infrastructure par défaut de KissineFlow."
                    ) : selectedScenarioId === 2 ? (
                      "Le Scénario 2 convient aux restaurants souhaitant isoler leurs transactions locales tout en profitant du travail multi-postes. Exige une maintenance informatique régulière de l'adresse IP."
                    ) : selectedScenarioId === 3 ? (
                      "Le Scénario 3 est l'approche la plus stable et moderne pour un restaurant autonome hors-ligne. Un seul serveur puissant sert toutes les tablettes et smartphones sans rien installer dessus."
                    ) : (
                      "Le Scénario 4 est réservé aux configurations mono-poste hautement résilientes où l'ordinateur fait office de caisse physique totalement isolée."
                    )}
                  </p>
                </div>

              </div>

            </div>

          </div>

          {/* Guide de Déploiement Pas-à-Pas pour Personnel Non-Technique */}
          <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 border border-indigo-100 rounded-2xl p-6 text-left space-y-6">
            <div className="flex items-center gap-3 border-b border-indigo-100 pb-4">
              <span className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-sm">
                <Sliders size={20} />
              </span>
              <div>
                <h4 className="font-extrabold text-sm text-[#0B1F3F] uppercase tracking-wide flex items-center gap-2">
                  <span>Guide d'Installation Simple</span>
                  <span className="bg-[#F26522] text-white text-[9px] font-black px-2 py-0.5 rounded-full">
                    Spécial Non-Informaticiens 👨‍🍳
                  </span>
                </h4>
                <p className="text-gray-500 text-xs font-medium mt-1">
                  Suivez ces étapes claires et illustrées pour configurer l'architecture du <strong>Scénario {selectedScenarioId}</strong> directement dans votre restaurant sans connaissances informatiques complexes.
                </p>
              </div>
            </div>

            {/* Step-by-Step interactive cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {selectedScenarioId === 1 ? [
                {
                  step: "Étape 1",
                  title: "Brancher la Box Internet",
                  desc: "Assurez-vous que votre ordinateur de caisse principal ou tablette est connecté(e) au réseau Wi-Fi ou par câble réseau de votre Box Internet (Orange, Free, SFR, Bouygues, etc.).",
                  badge: "Internet requis",
                  badgeColor: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                },
                {
                  step: "Étape 2",
                  title: "Activer les codes Cloud",
                  desc: "Le Super-Admin de KissineFlow vous remettra une adresse URL et une Clé d'API sécurisée. Entrez-les simplement dans votre panneau de configuration pour ouvrir la connexion.",
                  badge: "Saisie unique",
                  badgeColor: "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20"
                },
                {
                  step: "Étape 3",
                  title: "Lancement de l'ERP",
                  desc: "Ouvrez l'application KissineFlow sur votre appareil. L'ensemble de vos ventes et opérations commencera immédiatement à se synchroniser de manière sécurisée.",
                  badge: "Automatique",
                  badgeColor: "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                },
                {
                  step: "Étape 4",
                  title: "Suivi à distance",
                  desc: "Vous pouvez désormais consulter vos statistiques et chiffres d'affaires en direct depuis chez vous ou en déplacement sur votre smartphone ou ordinateur portable.",
                  badge: "Accès mobile direct",
                  badgeColor: "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                }
              ].map((item, index) => (
                <div key={index} className="bg-white border border-gray-150 p-4 rounded-xl shadow-3xs flex flex-col justify-between space-y-3 relative hover:shadow-xs transition">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-[#F26522] tracking-wider">
                        {item.step}
                      </span>
                      <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    </div>
                    <h5 className="font-extrabold text-xs text-gray-900 leading-snug">{item.title}</h5>
                    <p className="text-[11px] text-gray-500 leading-relaxed font-medium">{item.desc}</p>
                  </div>
                </div>
              )) : selectedScenarioId === 2 ? [
                {
                  step: "Étape 1",
                  title: "Choisir la machine 'Chef'",
                  desc: "Désignez un ordinateur principal dans le restaurant (ex: la caisse principale). C'est elle qui servira de cerveau central pour stocker toutes les transactions locales.",
                  badge: "Caisse principale",
                  badgeColor: "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20"
                },
                {
                  step: "Étape 2",
                  title: "Figer l'adresse IP",
                  desc: `Pour éviter que les autres tablettes ne perdent de vue l'ordinateur Chef, demandez à fixer l'IP de cette machine (adresse actuelle : ${simulatedLocalIp}) dans vos paramètres réseau.`,
                  badge: "IP Statique",
                  badgeColor: "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                },
                {
                  step: "Étape 3",
                  title: "Wi-Fi local partagé",
                  desc: "Connectez toutes les tablettes et les smartphones de vos serveurs sur le même boîtier Wi-Fi local de votre restaurant. Pas besoin d'Internet, juste le Wi-Fi local !",
                  badge: "Même Wi-Fi requis",
                  badgeColor: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                },
                {
                  step: "Étape 4",
                  title: "Lier les tablettes",
                  desc: "Dans les réglages de chaque tablette, saisissez l'adresse de la caisse principale. Les commandes s'enverront instantanément entre vos terminaux et la cuisine.",
                  badge: "Réseau Local direct",
                  badgeColor: "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                }
              ].map((item, index) => (
                <div key={index} className="bg-white border border-gray-150 p-4 rounded-xl shadow-3xs flex flex-col justify-between space-y-3 relative hover:shadow-xs transition">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-[#F26522] tracking-wider">
                        {item.step}
                      </span>
                      <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    </div>
                    <h5 className="font-extrabold text-xs text-gray-900 leading-snug">{item.title}</h5>
                    <p className="text-[11px] text-gray-500 leading-relaxed font-medium">{item.desc}</p>
                  </div>
                </div>
              )) : selectedScenarioId === 3 ? [
                {
                  step: "Étape 1",
                  title: "Lancer le Serveur local",
                  desc: "Démarrez l'ordinateur principal du restaurant qui fait office de serveur. Lancez KissineFlow en mode d'hébergement pour diffuser l'application.",
                  badge: "Un seul clic",
                  badgeColor: "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20"
                },
                {
                  step: "Étape 2",
                  title: "Connexion Wi-Fi",
                  desc: "Assurez-vous que vos téléphones et tablettes de prise de commande sont connectés au Wi-Fi privé du restaurant (aucun accès internet externe n'est requis).",
                  badge: "Wi-Fi Restaurant",
                  badgeColor: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                },
                {
                  step: "Étape 3",
                  title: "Ouvrir votre navigateur",
                  desc: `Sur les terminaux des serveurs, ouvrez Google Chrome ou Safari et saisissez simplement l'adresse web locale : http://${simulatedLocalIp}:3000.`,
                  badge: "Zéro installation",
                  badgeColor: "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                },
                {
                  step: "Étape 4",
                  title: "Prendre les commandes",
                  desc: "L'application s'ouvre instantanément. Tout est centralisé sur la machine de caisse principale, ce qui garantit la synchronisation immédiate des commandes.",
                  badge: "Faisabilité 100%",
                  badgeColor: "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                }
              ].map((item, index) => (
                <div key={index} className="bg-white border border-gray-150 p-4 rounded-xl shadow-3xs flex flex-col justify-between space-y-3 relative hover:shadow-xs transition">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-[#F26522] tracking-wider">
                        {item.step}
                      </span>
                      <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    </div>
                    <h5 className="font-extrabold text-xs text-gray-900 leading-snug">{item.title}</h5>
                    <p className="text-[11px] text-gray-500 leading-relaxed font-medium">{item.desc}</p>
                  </div>
                </div>
              )) : [
                {
                  step: "Étape 1",
                  title: "Installer l'application",
                  desc: "Installez l'application native sur votre ordinateur via le fichier fourni (.exe pour Windows ou .dmg pour macOS) en double-cliquant dessus.",
                  badge: "Fichier d'installation",
                  badgeColor: "bg-indigo-500/10 text-indigo-600 border border-indigo-500/20"
                },
                {
                  step: "Étape 2",
                  title: "Lancement autonome",
                  desc: "Double-cliquez sur l'icône KissineFlow sur votre bureau pour démarrer l'application. Elle s'exécute localement de manière ultra-rapide.",
                  badge: "Super fluide",
                  badgeColor: "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                },
                {
                  step: "Étape 3",
                  title: "Aucun réseau requis",
                  desc: "Vos données sont sauvegardées en toute sécurité directement dans un fichier sur votre disque dur local. Parfait pour une caisse autonome sans Wi-Fi.",
                  badge: "Totalement isolé",
                  badgeColor: "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                },
                {
                  step: "Étape 4",
                  title: "Sauvegardes simples",
                  desc: `Pour sécuriser vos données, copiez régulièrement le fichier de base de données sqlite (${simulatedDbName}.db) sur une clé USB extérieure.`,
                  badge: "Sécurité physique",
                  badgeColor: "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                }
              ].map((item, index) => (
                <div key={index} className="bg-white border border-gray-150 p-4 rounded-xl shadow-3xs flex flex-col justify-between space-y-3 relative hover:shadow-xs transition">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-[#F26522] tracking-wider">
                        {item.step}
                      </span>
                      <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded-full ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    </div>
                    <h5 className="font-extrabold text-xs text-gray-900 leading-snug">{item.title}</h5>
                    <p className="text-[11px] text-gray-500 leading-relaxed font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Note explicative pour rassurer les restaurateurs */}
            <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
              <span className="text-amber-500 mt-0.5">⚠️</span>
              <div>
                <h5 className="font-extrabold text-xs text-amber-950">Conseil de l'Équipe KissineFlow pour votre restaurant</h5>
                <p className="text-[11px] text-amber-800 leading-normal font-medium mt-0.5">
                  Si vous avez des serveurs mobiles équipés de tablettes/téléphones pour prendre les commandes en salle, nous vous conseillons vivement le <strong>Scénario 3 (Serveur Web Local)</strong> ou le <strong>Scénario 1 (Cloud)</strong>. Ils offrent la meilleure flexibilité opérationnelle au quotidien sans surcharger votre équipe en paramétrages techniques.
                </p>
              </div>
            </div>
          </div>

        </div>
      ) : (
        /* SUPABASE_SYNC VIEW */
        <div className="space-y-6 text-slate-800 animate-fade-in" id="supabase-sync-panel">
          {/* Main Sync Controls Panel */}
          <div className="bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-[#0B1F3F] to-[#1E4E8C] text-white p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Cloud className="text-emerald-400 animate-pulse" size={20} />
                  <h3 className="font-extrabold text-sm uppercase tracking-wider">Console de Synchronisation Cloud Centrale</h3>
                </div>
                <p className="text-slate-300 text-xs font-medium">
                  Sauvegardez ou restaurez en temps réel l'ensemble de la base de données d'un établissement client vers votre serveur Supabase.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowSqlInstructions(!showSqlInstructions)}
                  className="px-3.5 py-1.5 bg-white/10 hover:bg-white/15 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-white/20"
                >
                  <Database size={13} />
                  <span>{showSqlInstructions ? "Masquer Instructions SQL" : "Afficher Instructions SQL"}</span>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* API Credentials Config */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
                    <Sliders size={14} className="text-[#F26522]" />
                    <span>1. Paramètres de Connexion API</span>
                  </h4>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">URL du projet Supabase</label>
                      <input
                        type="text"
                        placeholder="https://your-project-id.supabase.co"
                        value={supabaseUrl}
                        onChange={(e) => setSupabaseUrl(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-xs rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#1E4E8C] focus:bg-white transition"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">Clé d'API Publique Anon Key</label>
                      <input
                        type="password"
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                        value={supabaseKey}
                        onChange={(e) => setSupabaseKey(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-xs rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#1E4E8C] focus:bg-white transition font-mono"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <button
                        type="button"
                        onClick={handleSaveKeys}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm animate-fade-in"
                      >
                        <Save size={13} />
                        <span>Enregistrer les Clés</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleTestConnection}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <RefreshCw size={13} className={syncStatus === 'SYNCING' ? 'animate-spin' : ''} />
                        <span>Tester la Connexion</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Tenant Target and Sync Actions */}
                <div className="space-y-4">
                  <h4 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5 border-b border-gray-100 pb-2">
                    <Building2 size={14} className="text-[#F26522]" />
                    <span>2. Établissement et Actions</span>
                  </h4>
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wide">Établissement Client à Synchroniser</label>
                        <button
                          type="button"
                          onClick={handleDetectTenants}
                          disabled={isDetecting}
                          className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 disabled:bg-slate-100 disabled:text-slate-400 rounded text-[9px] font-extrabold uppercase tracking-wider border border-indigo-150 transition flex items-center gap-1 cursor-pointer"
                        >
                          <Search size={10} className={isDetecting ? 'animate-spin' : ''} />
                          <span>{isDetecting ? 'Détection...' : 'Détecter sur Supabase'}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-4 py-1">
                        <label className="flex items-center gap-1.5 text-[11px] text-gray-700 cursor-pointer font-semibold">
                          <input
                            type="radio"
                            checked={!useManualSyncId}
                            onChange={() => setUseManualSyncId(false)}
                            className="text-[#1E4E8C] focus:ring-[#1E4E8C] h-3.5 w-3.5"
                          />
                          <span>Sélection de la liste ({tenants.length + detectedTenants.length} dispo)</span>
                        </label>
                        <label className="flex items-center gap-1.5 text-[11px] text-gray-700 cursor-pointer font-semibold">
                          <input
                            type="radio"
                            checked={useManualSyncId}
                            onChange={() => setUseManualSyncId(true)}
                            className="text-[#1E4E8C] focus:ring-[#1E4E8C] h-3.5 w-3.5"
                          />
                          <span>Saisie manuelle de l'ID</span>
                        </label>
                      </div>

                      {!useManualSyncId ? (
                        <select
                          value={selectedSyncTenantId}
                          onChange={(e) => setSelectedSyncTenantId(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-xs rounded-lg text-gray-800 focus:outline-none focus:border-[#1E4E8C] focus:bg-white transition font-bold"
                        >
                          <option value="">-- Choisir un site restaurant --</option>
                          {tenants.map((t) => (
                            <option key={`local_${t.id}`} value={t.id}>
                              [Local] {t.name} ({t.id})
                            </option>
                          ))}
                          {detectedTenants.filter(id => !tenants.some(t => t.id === id)).map((id) => (
                            <option key={`detected_${id}`} value={id}>
                              [Cloud Supabase] {id} (Détecté)
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="space-y-1">
                          <input
                            type="text"
                            placeholder="Ex: mon-super-restaurant, etc."
                            value={manualSyncId}
                            onChange={(e) => setManualSyncId(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-gray-200 text-xs rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#1E4E8C] focus:bg-white transition font-mono font-bold"
                          />
                          <p className="text-[10px] text-gray-500 font-semibold italic">
                            Saisissez l'identifiant exact de l'établissement à restaurer depuis Supabase.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl space-y-1.5">
                      <p className="text-[10px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-1">
                        <AlertCircle size={12} />
                        <span>Avertissement de Restauration (Pull) :</span>
                      </p>
                      <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
                        Le chargement des données depuis Supabase écrasera les informations locales de cet établissement sur votre navigateur actuel. La sauvegarde vers le Cloud (Push) est totalement sécurisée.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handlePushToSupabase}
                        disabled={syncStatus === 'SYNCING'}
                        className="px-4 py-3 bg-[#1E4E8C] hover:bg-[#1E4E8C]/95 text-white disabled:bg-slate-300 rounded-xl text-xs font-black transition flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-sm border border-[#163a6a]"
                      >
                        <FileUp size={16} />
                        <span>Sauvegarder vers le Cloud (Push)</span>
                      </button>
                      <button
                        type="button"
                        onClick={handlePullFromSupabase}
                        disabled={syncStatus === 'SYNCING'}
                        className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-slate-300 rounded-xl text-xs font-black transition flex flex-col items-center justify-center gap-1.5 cursor-pointer shadow-sm border border-indigo-700"
                      >
                        <FileDown size={16} />
                        <span>Restaurer depuis le Cloud (Pull)</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Retro Terminal Logging */}
              <div className="space-y-2 pt-2">
                <h4 className="font-extrabold text-xs text-gray-900 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                  <Activity size={14} className="text-[#F26522]" />
                  <span>3. Journal d'Audit de Synchronisation en Direct</span>
                </h4>
                <div className="bg-[#0c1017] text-[#39ff14] p-4 rounded-xl font-mono text-[10px] h-60 overflow-y-auto border border-slate-800 shadow-inner flex flex-col gap-1 leading-relaxed">
                  <div className="text-slate-500 pb-1 border-b border-slate-900 flex justify-between items-center font-bold">
                    <span>TERMINAL D'AUDIT CLOUD KISSINEFLOW v2.8</span>
                    <span>STATUT: {syncStatus}</span>
                  </div>
                  {syncLog.length === 0 ? (
                    <div className="text-slate-500 italic py-2">
                      Prêt pour la synchronisation. Sélectionnez un établissement et lancez une action...
                    </div>
                  ) : (
                    syncLog.map((log, index) => (
                      <div key={index} className="whitespace-pre-wrap">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* SQL instructions (Collapsible) */}
              {showSqlInstructions && (
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-4 animate-fade-in text-slate-800">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <Database size={16} className="text-indigo-600" />
                      <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide">Initialisation SQL de la Base de Données</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`create table if not exists public.kissineflow_sync (
  id uuid default gen_random_uuid() primary key,
  tenant_id text not null,
  data_key text not null,
  payload jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (tenant_id, data_key)
);

alter table public.kissineflow_sync enable row level security;

create policy "Allow public read access" on public.kissineflow_sync for select using (true);
create policy "Allow public insert" on public.kissineflow_sync for insert with check (true);
create policy "Allow public update" on public.kissineflow_sync for update using (true);
create policy "Allow public delete" on public.kissineflow_sync for delete using (true);`);
                        alert("Script SQL copié dans le presse-papiers !");
                      }}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-250 text-[10px] font-bold rounded flex items-center gap-1 cursor-pointer transition animate-fade-in"
                    >
                      <Copy size={11} />
                      <span>Copier le Script SQL</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
                    Exécutez ce script SQL dans l'éditeur de requêtes de votre console de projet Supabase (<strong>SQL Editor</strong>) pour créer la table de destination <code>kissineflow_sync</code> et ouvrir ses accès via Row Level Security (RLS) :
                  </p>
                  <pre className="bg-[#111827] text-[#f3f4f6] p-4 rounded-xl font-mono text-[9px] overflow-x-auto leading-relaxed max-h-60 shadow-md">
{`-- 1. Créer la table de synchronisation KissineFlow
create table if not exists public.kissineflow_sync (
  id uuid default gen_random_uuid() primary key,
  tenant_id text not null,
  data_key text not null,
  payload jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (tenant_id, data_key)
);

-- 2. Configurer Row Level Security (RLS) pour autoriser l'accès anonyme via la clé publique anon
alter table public.kissineflow_sync enable row level security;

create policy "Allow public read access" on public.kissineflow_sync
  for select using (true);

create policy "Allow public insert" on public.kissineflow_sync
  for insert with check (true);

create policy "Allow public update" on public.kissineflow_sync
  for update using (true);

create policy "Allow public delete" on public.kissineflow_sync
  for delete using (true);`}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FLOATING TOAST */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 p-4 bg-slate-900 text-white rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 animate-slide-up">
          <div className="p-1.5 bg-emerald-500 rounded-full text-white">
            <Check size={14} />
          </div>
          <span className="text-xs font-bold leading-none">{toast.text}</span>
        </div>
      )}

      {/* CREATE CLIENT MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-slate-800">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-gray-100 flex flex-col">
            <div className="bg-[#0B1F3F] text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Building2 size={18} className="text-[#F26522]" />
                <h3 className="font-extrabold text-sm uppercase tracking-wide">Créer un Nouveau Client Restaurant</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-white bg-white/10 hover:bg-white/15 p-1 rounded transition">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 space-y-1">
                <p className="text-[10px] font-black text-blue-800 uppercase">Avis de configuration :</p>
                <p className="text-[11px] text-blue-650 leading-relaxed">
                  Cette action crée un nouveau site/restaurant isolé (Tenant) et instancie automatiquement le premier compte **Administrateur** de ce site. Le premier mot de passe fourni devra être changé lors de sa première connexion obligatoire.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase">1. IDENTIFIANT CODE UNIQUE (Miniscules, chiffres, tirets)</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: tenant-yaounde-express"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value.toLowerCase())}
                    className="w-full px-3 py-2 border border-gray-200 text-xs rounded-lg focus:outline-none focus:border-[#1E4E8C] font-mono text-gray-800"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase">2. NOM COMMERCIAL DE L'ETABLISSEMENT</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Snack d'Or Yaoundé"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 text-xs rounded-lg focus:outline-none focus:border-[#1E4E8C] font-semibold text-gray-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase">Téléphone de contact</label>
                  <input
                    type="text"
                    placeholder="ex: +237 600..."
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 text-xs rounded-lg focus:outline-none focus:border-[#1E4E8C] font-medium text-gray-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase">Ville de domiciliation</label>
                  <input
                    type="text"
                    placeholder="ex: Yaoundé"
                    value={clientCity}
                    onChange={(e) => setClientCity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 text-xs rounded-lg focus:outline-none focus:border-[#1E4E8C] font-medium text-gray-800"
                  />
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-[11px] font-bold text-gray-500 uppercase">Adresse physique complète</label>
                  <input
                    type="text"
                    placeholder="ex: Avenue Kennedy..."
                    value={clientAddress}
                    onChange={(e) => setClientAddress(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 text-xs rounded-lg focus:outline-none focus:border-[#1E4E8C] font-medium text-gray-800"
                  />
                </div>
              </div>

              <div className="border-t border-dashed border-gray-200 pt-3 space-y-3">
                <span className="text-xs font-black text-[#1E4E8C] uppercase tracking-wide block">
                  3. Identifiants de l'Administrateur Restaurant
                </span>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase">Nom complet</label>
                    <input
                      type="text"
                      required
                      placeholder="ex: Alain Patrick"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 text-xs rounded-lg focus:outline-none focus:border-[#1E4E8C] font-bold text-gray-800"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase">Adresse courriel (Login ID)</label>
                    <input
                      type="email"
                      required
                      placeholder="admin@kissinesnack.com"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 text-xs rounded-lg focus:outline-none focus:border-[#1E4E8C] font-semibold text-gray-800"
                    />
                  </div>

                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[11px] font-bold text-gray-400 uppercase">Mot de passe temporaire provisoire</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-200 text-xs rounded-lg focus:outline-none focus:border-[#1E4E8C] font-mono font-bold tracking-wider text-indigo-700 bg-slate-50"
                      />
                      <button
                        type="button"
                        onClick={() => setAdminPassword(`pass-${Math.floor(1000 + Math.random() * 9000)}`)}
                        className="px-3 bg-slate-100 hover:bg-slate-200 text-gray-600 text-[10px] font-extrabold rounded-lg border border-gray-200 transition"
                      >
                        Générer
                      </button>
                    </div>
                  </div>
                </div>

                {/* CATALOG PREFILL CONVENIENCE ONBOARDING FLAG */}
                <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl space-y-2 mt-4">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={prefillCatalog}
                      onChange={(e) => setPrefillCatalog(e.target.checked)}
                      className="mt-0.5 h-4 w-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                    />
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">🪄 Initialisation Automatique du Catalogue Standard</span>
                      <span className="text-[10.5px] text-gray-500 font-semibold leading-relaxed block mt-0.5">
                        Si activé, l'ERP pré-remplira automatiquement ce nouveau restaurant avec un catalogue d'exploitation standard (7 Plats Gastronomiques Camerounais, 22 Matières Premières, Fiches techniques d'ingrédients et Fournisseurs de référence pour faciliter les démonstrations immédiates).
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex gap-2.5 pt-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-lg text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Check size={14} />
                  <span>Activer & Créer le Compte</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CLIENT DETAILS MODAL */}
      {editingTenant && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-slate-800">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-gray-100">
            <div className="bg-[#0B1F3F] text-white p-4 flex justify-between items-center">
              <h3 className="font-extrabold text-sm uppercase tracking-wide">Modifier le Profil de Tenant</h3>
              <button onClick={() => setEditingTenant(null)} className="text-white hover:opacity-75 p-1">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Nom Commercial</label>
                <input
                  type="text"
                  required
                  value={editingTenant.name}
                  onChange={(e) => setEditingTenant({ ...editingTenant, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 text-xs rounded-lg text-gray-800 font-extrabold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Adresse Physique</label>
                <input
                  type="text"
                  value={editingTenant.address}
                  onChange={(e) => setEditingTenant({ ...editingTenant, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 text-xs rounded-lg text-gray-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase">Téléphone</label>
                  <input
                    type="text"
                    value={editingTenant.phone}
                    onChange={(e) => setEditingTenant({ ...editingTenant, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 text-xs rounded-lg text-gray-800"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase">Ville</label>
                  <input
                    type="text"
                    value={editingTenant.city}
                    onChange={(e) => setEditingTenant({ ...editingTenant, city: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 text-xs rounded-lg text-gray-800"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingTenant(null)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-lg text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1E4E8C] hover:bg-[#1E4E8C]/90 text-white font-bold rounded-lg text-xs"
                >
                  Sauvegarder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern Soft Delete Confirmation Dialog */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-gray-250 shadow-2xl relative space-y-4 animate-in fade-in zoom-in-95 duration-100 text-slate-800">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-full w-fit mx-auto">
              <Trash2 className="h-6 w-6" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-base font-extrabold text-slate-900">Confirmer la suppression ?</h3>
              <p className="text-slate-500 text-xs leading-relaxed">
                Êtes-vous absolument sûr de vouloir supprimer le client <strong className="text-slate-900 font-bold">"{deleteConfirmation.tenantName}"</strong> ainsi que toutes ses données rattachées (collaborateurs, fiches techniques, etc.) ?
              </p>
              <span className="text-rose-600 text-[10px] font-black uppercase tracking-wider bg-rose-50 border border-rose-100 py-1 px-2.5 rounded-lg inline-block">
                ⚠️ Cette action est définitive et irréversible
              </span>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  onDeleteTenant(deleteConfirmation.tenantId);
                  setDeleteConfirmation(null);
                }}
                className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition shadow-md shadow-rose-600/10 cursor-pointer"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL CREATE USER MODAL */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-slate-800 font-sans">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-gray-100 flex flex-col">
            <div className="bg-[#0B1F3F] text-white p-4 flex justify-between items-center bg-gradient-to-r from-[#0B1F3F] to-[#1E4E8C]">
              <div className="flex items-center gap-2">
                <UserPlus size={18} className="text-[#F26522]" />
                <h3 className="font-extrabold text-sm uppercase tracking-wide">Ajouter un Nouveau Collaborateur</h3>
              </div>
              <button 
                onClick={() => setShowAddUserModal(false)} 
                className="text-white hover:opacity-75 p-1 rounded transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateUserGlobal} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Nom Complet du Collaborateur</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Alain Patrick"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 text-xs rounded-lg focus:outline-none focus:border-[#1E4E8C] font-extrabold text-gray-850"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Adresse de Connexion (Login @email)</label>
                <input
                  type="email"
                  required
                  placeholder="nom@restaurant.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 text-xs rounded-lg focus:outline-none focus:border-[#1E4E8C] font-mono text-gray-800 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase">Rattacher au Restaurant</label>
                  <select
                    value={newUserTenantId}
                    onChange={(e) => setNewUserTenantId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 text-xs rounded-lg focus:outline-none focus:border-[#1E4E8C] font-extrabold text-gray-800"
                  >
                    {tenants.map(t => (
                      <option key={t.id} value={t.id}>🏢 {t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase">Rôle & Profil Système</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-200 text-xs rounded-lg focus:outline-none focus:border-[#1E4E8C] font-extrabold text-gray-800"
                  >
                    <option value="ADMIN">ADMIN (Gérant)</option>
                    <option value="MANAGER">MANAGER</option>
                    <option value="CASHIER">CASHIER (Caissier)</option>
                    <option value="WAREHOUSE">STOCKS (Économe)</option>
                    <option value="ACCOUNTING">COMPTABILITÉ</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Clé d'Accès Initiale (Mot de passe)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-200 text-xs rounded-lg focus:outline-none focus:border-[#1E4E8C] font-mono font-bold tracking-wider text-indigo-700 bg-slate-50"
                  />
                  <button
                    type="button"
                    onClick={() => setNewUserPassword(`pass-${Math.floor(1000 + Math.random() * 9000)}`)}
                    className="px-3 bg-slate-100 hover:bg-slate-200 text-gray-600 text-[10px] font-extrabold rounded-lg border border-gray-200 transition"
                  >
                    Générer
                  </button>
                </div>
              </div>

              <div className="flex gap-2.5 pt-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-lg text-xs cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Check size={14} />
                  <span>Enregistrer Collaborateur</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
