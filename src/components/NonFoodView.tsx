import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  History,
  ClipboardList,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  FileText,
  Building2,
  User,
  Calendar,
  BadgeAlert,
  Save,
  Undo
} from 'lucide-react';
import { NonFoodItem, NonFoodMovement, Supplier, User as AppUser } from '../types';

interface NonFoodViewProps {
  items: NonFoodItem[];
  movements: NonFoodMovement[];
  onUpdateItems: (items: NonFoodItem[]) => void;
  onUpdateMovements: (movements: NonFoodMovement[]) => void;
  suppliers: Supplier[];
  tenantId: string;
  activeUser: AppUser;
  logsAction: (action: string, module: string) => void;
}

type SubTab = 'SYNTHESIS' | 'JOURNAL' | 'INVENTORY';

const CATEGORY_LABELS: Record<string, string> = {
  EMBALLAGE: 'Emballages & Boîtes',
  HYGIENE: 'Hygiène & Nettoyage',
  FOURNITURE: 'Fournitures & Bureaux',
  MAINTENANCE: 'Maintenance & Entretien',
  AUTRE: 'Autres Consommables'
};

const CATEGORY_COLORS: Record<string, string> = {
  EMBALLAGE: 'bg-blue-50 text-blue-700 border-blue-150',
  HYGIENE: 'bg-emerald-50 text-emerald-700 border-emerald-150',
  FOURNITURE: 'bg-purple-50 text-purple-700 border-purple-150',
  MAINTENANCE: 'bg-amber-50 text-amber-700 border-amber-150',
  AUTRE: 'bg-gray-100 text-gray-700 border-gray-200'
};

export default function NonFoodView({
  items,
  movements,
  onUpdateItems,
  onUpdateMovements,
  suppliers,
  tenantId,
  activeUser,
  logsAction
}: NonFoodViewProps) {
  // Navigation states
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('SYNTHESIS');
  
  // Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [filterAlertsOnly, setFilterAlertsOnly] = useState(false);

  // Modal open states
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState<NonFoodItem | null>(null);
  const [showMovementModal, setShowMovementModal] = useState<NonFoodItem | null>(null);

  // Form input states
  // New/Edit product form
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<'EMBALLAGE' | 'HYGIENE' | 'FOURNITURE' | 'MAINTENANCE' | 'AUTRE'>('EMBALLAGE');
  const [newDescription, setNewDescription] = useState('');
  const [newStockMin, setNewStockMin] = useState<number>(10);
  const [newStockMax, setNewStockMax] = useState<number>(100);
  const [newUnit, setNewUnit] = useState('Pièce');
  const [newCmp, setNewCmp] = useState<number>(500);
  const [newSupplierId, setNewSupplierId] = useState('');
  const [newInitialStock, setNewInitialStock] = useState<number>(0);

  // Movement formulation form
  const [mvtType, setMvtType] = useState<'IN' | 'OUT' | 'ADJUST_PLUS' | 'ADJUST_MINUS'>('OUT');
  const [mvtQty, setMvtQty] = useState<number>(0);
  const [mvtComment, setMvtComment] = useState('');
  const [mvtReference, setMvtReference] = useState('');

  // Physical count inventory sheet state (key: itemId, value: physicalCount)
  const [isAuditingInventory, setIsAuditingInventory] = useState(false);
  const [countingSheets, setCountingSheets] = useState<Record<string, number>>({});

  // 1. ISOLATE BY TENANT (Multi SaaS)
  const tenantItems = items.filter(it => it.tenantId === tenantId);
  const tenantMovements = movements.filter(mv => mv.tenantId === tenantId);

  // 2. CALCULATE KPIS
  const totalAssetsValue = tenantItems.reduce((acc, it) => acc + (it.stockActual * it.cmp), 0);
  const lowStockAlertItems = tenantItems.filter(it => it.active && it.stockActual <= it.stockMin);
  
  // Total OUT movements financial value in current site
  const nonFoodConsumptionVal = tenantMovements
    .filter(mv => mv.type === 'OUT' || mv.type === 'ADJUST_MINUS')
    .reduce((acc, mv) => acc + mv.value, 0);

  // Average coverage level
  const activeItemsCount = tenantItems.filter(it => it.active).length;

  // 3. APPLY FILTERS
  const filteredItems = tenantItems.filter(it => {
    const matchesSearch = it.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          it.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          it.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || it.category === selectedCategory;
    const matchesAlert = !filterAlertsOnly || (it.active && it.stockActual <= it.stockMin);
    return matchesSearch && matchesCategory && matchesAlert;
  });

  // Action: Launch create non-food item
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) return;

    const newItemId = `nf-${Date.now()}`;
    const generatedProduct: NonFoodItem = {
      id: newItemId,
      code: newCode.trim().toUpperCase(),
      name: newName.trim(),
      category: newCategory,
      description: newDescription.trim(),
      stockActual: Math.max(0, newInitialStock),
      stockMin: Math.max(0, newStockMin),
      stockMax: Math.max(0, newStockMax),
      unit: newUnit.trim(),
      cmp: Math.max(0, newCmp),
      lastPurchasePrice: Math.max(0, newCmp),
      supplierId: newSupplierId ? newSupplierId : undefined,
      active: true,
      tenantId: tenantId
    };

    const updatedItems = [...items, generatedProduct];
    onUpdateItems(updatedItems);

    // If an initial stock is specified, create an entry movement
    if (newInitialStock > 0) {
      const initMovement: NonFoodMovement = {
        id: `nfm-${Date.now()}`,
        date: new Date().toISOString().replace('T', ' ').slice(0, 16),
        itemId: newItemId,
        itemName: generatedProduct.name,
        type: 'IN',
        quantity: newInitialStock,
        unitCost: generatedProduct.cmp,
        value: newInitialStock * generatedProduct.cmp,
        reference: 'Stock Initial',
        userId: activeUser.id,
        userName: activeUser.name,
        comment: 'Initialisation des stocks lors du référencement.',
        tenantId: tenantId
      };
      onUpdateMovements([...movements, initMovement]);
    }

    // Log safety audits
    logsAction(
      `Création produit Hors-Alimentation : ${generatedProduct.name} (${CATEGORY_LABELS[newCategory]}) Code : ${generatedProduct.code}`,
      'HORS-ALIMENTATION'
    );

    // Reset fields & close modal
    setNewCode('');
    setNewName('');
    setNewDescription('');
    setNewInitialStock(0);
    setNewSupplierId('');
    setNewStockMin(10);
    setNewStockMax(100);
    setShowAddProductModal(false);
  };

  // Action: Launch Edit product
  const handleEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditProductModal) return;

    const updated = items.map(it => {
      if (it.id === showEditProductModal.id) {
        return {
          ...it,
          code: newCode.trim().toUpperCase(),
          name: newName.trim(),
          category: newCategory,
          description: newDescription.trim(),
          stockMin: Math.max(0, newStockMin),
          stockMax: Math.max(0, newStockMax),
          unit: newUnit.trim(),
          cmp: Math.max(0, newCmp),
          supplierId: newSupplierId ? newSupplierId : undefined
        };
      }
      return it;
    });

    onUpdateItems(updated);
    logsAction(
      `Modification produit Hors-Alimentation : ${newName.trim()} [Code : ${newCode.trim().toUpperCase()}]`,
      'HORS-ALIMENTATION'
    );

    setShowEditProductModal(null);
  };

  // Action: Delete/Deactivate product
  const handleToggleActiveProduct = (p: NonFoodItem) => {
    const updated = items.map(it => {
      if (it.id === p.id) {
        return { ...it, active: !it.active };
      }
      return it;
    });
    onUpdateItems(updated);
    logsAction(
      `${p.active ? 'Désactivation' : 'Réactivation'} produit Hors-Alimentation : ${p.name}`,
      'HORS-ALIMENTATION'
    );
  };

  // Action: Launch direct store movement (manual register)
  const handleRegisterMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showMovementModal || mvtQty <= 0) return;

    const targetProduct = showMovementModal;
    const isOutflow = mvtType === 'OUT' || mvtType === 'ADJUST_MINUS';
    const computedMultiplier = isOutflow ? -1 : 1;
    
    // Check stock boundaries for outflows
    if (isOutflow && targetProduct.stockActual < mvtQty) {
      alert(`⚠️ Erreur : Le stock restant est insuffisant (${targetProduct.stockActual} ${targetProduct.unit} disponibles) pour satisfaire cette sortie.`);
      return;
    }

    const calculatedMovementValue = mvtQty * targetProduct.cmp;

    // 1. Create movement record
    const newMvt: NonFoodMovement = {
      id: `nfm-${Date.now()}`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      itemId: targetProduct.id,
      itemName: targetProduct.name,
      type: mvtType,
      quantity: mvtQty,
      unitCost: targetProduct.cmp,
      value: calculatedMovementValue,
      reference: mvtReference.trim() || (isOutflow ? 'Sortie d’utilisation service' : 'Réapprovisionnement manuel'),
      userId: activeUser.id,
      userName: activeUser.name,
      comment: mvtComment.trim() || (isOutflow ? 'Consommation interne opérationnelle' : 'Entrée en stock corrigée'),
      tenantId: tenantId
    };

    // 2. Adjust item actual stock volume
    const updatedItems = items.map(it => {
      if (it.id === targetProduct.id) {
        return {
          ...it,
          stockActual: it.stockActual + (mvtQty * computedMultiplier)
        };
      }
      return it;
    });

    onUpdateItems(updatedItems);
    onUpdateMovements([newMvt, ...movements]);

    logsAction(
      `Mouvement de stock [${mvtType}] sur ${targetProduct.name} : ${mvtQty} ${targetProduct.unit} | Val : ${calculatedMovementValue.toLocaleString()} FCFA`,
      'HORS-ALIMENTATION'
    );

    // Reset forms & close
    setMvtQty(0);
    setMvtComment('');
    setMvtReference('');
    setShowMovementModal(null);
  };

  // 4. PHYSICAL COUNT FORM CONTROLS
  const startAuditWalk = () => {
    const initialSheets: Record<string, number> = {};
    tenantItems.forEach(it => {
      if (it.active) {
        initialSheets[it.id] = it.stockActual;
      }
    });
    setCountingSheets(initialSheets);
    setIsAuditingInventory(true);
  };

  const updateCountState = (itemId: string, val: number) => {
    setCountingSheets(prev => ({
      ...prev,
      [itemId]: Math.max(0, val)
    }));
  };

  const validatePhysicalAudit = () => {
    const changesItems: NonFoodItem[] = [];
    const generatedAdjustments: NonFoodMovement[] = [];
    const rightNow = new Date().toISOString().replace('T', ' ').slice(0, 16);

    let logsSummary = '';
    let adjustmentsMadeCount = 0;

    items.forEach(it => {
      // Only audit products belonging to the active operational site
      if (it.tenantId === tenantId && it.active) {
        const physicalValue = countingSheets[it.id] ?? it.stockActual;
        const gap = physicalValue - it.stockActual;

        if (gap !== 0) {
          adjustmentsMadeCount++;
          const absoluteGap = Math.abs(gap);
          const computedValue = absoluteGap * it.cmp;
          const correctionType = gap > 0 ? 'ADJUST_PLUS' : 'ADJUST_MINUS';

          generatedAdjustments.push({
            id: `nfm-audit-${Date.now()}-${it.id}`,
            date: rightNow,
            itemId: it.id,
            itemName: it.name,
            type: correctionType,
            quantity: absoluteGap,
            unitCost: it.cmp,
            value: computedValue,
            reference: 'Audit Physique / Inventaire',
            userId: activeUser.id,
            userName: activeUser.name,
            comment: `Ajustement automatique d’écart physique de stock constaté. (Écart : ${gap > 0 ? '+' : ''}${gap} ${it.unit})`,
            tenantId: tenantId
          });

          changesItems.push({
            ...it,
            stockActual: physicalValue
          });

          logsSummary += `${it.name}: Écart de ${gap > 0 ? '+' : ''}${gap} ${it.unit} rectifié. `;
        } else {
          changesItems.push(it);
        }
      } else {
        // Keep non-tenant items untouched
        changesItems.push(it);
      }
    });

    onUpdateItems(changesItems);
    if (generatedAdjustments.length > 0) {
      onUpdateMovements([...generatedAdjustments, ...movements]);
    }

    logsAction(
      `Inventaire physique Hors-Alimentation validé | ${adjustmentsMadeCount} écarts de stock rectifiés automatiquement.`,
      'HORS-ALIMENTATION'
    );

    setIsAuditingInventory(false);
    alert('✅ Clôture de l\'inventaire validée avec succès ! Les fiches de stock sont ajustées et les écarts sont documentés dans le journal.');
  };

  return (
    <div className="space-y-6 animate-fade-in" id="non-food-module-view">
      
      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-lg border border-gray-100 shadow-3xs" id="non-food-header">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-sky-50 text-sky-600 rounded">
              <Package className="h-5 w-5" />
            </span>
            <h2 className="text-xl font-bold font-sans text-gray-950">Gestion des Produits Hors-Alimentation</h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Suivi et contrôle rigoureux des consommables d’exploitation non alimentaires (emballages, savon, produits hygiène).
          </p>
        </div>
        
        {!isAuditingInventory && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={startAuditWalk}
              className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded hover:bg-slate-800 transition active:translate-y-px inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <ClipboardList className="h-4 w-4" />
              <span>Lancer un Inventaire Physique</span>
            </button>
            <button
              onClick={() => {
                // Pre-fill defaults
                setNewCode(`NF-${Math.floor(1000 + Math.random() * 9000)}`);
                setNewName('');
                setNewDescription('');
                setNewInitialStock(0);
                setNewStockMin(10);
                setNewStockMax(150);
                setNewCmp(500);
                setNewUnit('Pièce');
                setShowAddProductModal(true);
              }}
              className="px-4 py-2 bg-[#F26522] text-white font-extrabold text-xs rounded hover:bg-[#d65319] transition active:translate-y-px inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Ajouter un Article Hors-Alim</span>
            </button>
          </div>
        )}
      </div>

      {/* KPI STATS CARD GRID */}
      {!isAuditingInventory && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="non-food-kpi-bar">
          
          <div className="bg-white p-4 rounded-lg border border-gray-150 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider block">Valeur Globale Active</span>
              <p className="text-xl font-bold font-sans text-[#1E4E8C] mt-1">{totalAssetsValue.toLocaleString()} FCFA</p>
            </div>
            <div className="p-2.5 bg-blue-50 text-[#1E4E8C] rounded">
              <Package className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-150 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider block">Ruptures & Alertes Min</span>
              <p className={`text-xl font-bold font-sans mt-1 ${lowStockAlertItems.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {lowStockAlertItems.length} article{lowStockAlertItems.length > 1 ? 's' : ''} fâcheux
              </p>
            </div>
            <div className={`p-2.5 rounded ${lowStockAlertItems.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-150 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] text-gray-550 font-medium uppercase tracking-wider block leading-tight">Consommation & Sorties (Mois)</span>
              <p className="text-xl font-bold font-sans text-amber-600 mt-1">{nonFoodConsumptionVal.toLocaleString()} FCFA</p>
            </div>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded">
              <ArrowDownRight className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-150 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider block">Références Actives</span>
              <p className="text-xl font-bold font-sans text-slate-900 mt-1">{activeItemsCount} Produits</p>
            </div>
            <div className="p-2.5 bg-slate-50 text-slate-700 rounded">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>

        </div>
      )}

      {/* CORE DISPLAY WORKSPACE (INVENTAIRE EN COURS OU TABS DES VUES) */}
      {isAuditingInventory ? (
        
        /* ---------------------------------------------------- */
        /* INVENTAIRE PHYSIQUE ACTIF ACCORDÉ                    */
        /* ---------------------------------------------------- */
        <div className="bg-white border border-gray-150 rounded-lg p-6 shadow-2xs space-y-4" id="nonfood-audit-panel">
          <div className="flex justify-between items-start border-b pb-4 border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-900">Formulaire d'Inventaire & Réconciliation de Stock Physique</h3>
              <p className="text-xs text-gray-500 mt-1">Saisissez les quantités réelles d’articles mesurées dans les stocks. L’ERP Kissine Flow ajustera de manière proactive la caisse.</p>
            </div>
            <button
              onClick={() => setIsAuditingInventory(false)}
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded cursor-pointer"
            >
              Annuler
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-500 border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-550/5 text-gray-700 uppercase text-[10px] font-black tracking-wider">
                  <th className="py-2.5 px-3">Code / Produit</th>
                  <th className="py-2.5 px-3">Catégorie</th>
                  <th className="py-2.5 px-3">Unité de Mesure</th>
                  <th className="py-2.5 px-3 text-right">Stock Théorique (ERP)</th>
                  <th className="py-2.5 px-3 text-right w-44">Quantité Réelle Physique</th>
                  <th className="py-2.5 px-3 text-right">Écart Estimé</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tenantItems.filter(it => it.active).map(it => {
                  const physicalVal = countingSheets[it.id] ?? it.stockActual;
                  const gap = physicalVal - it.stockActual;
                  
                  return (
                    <tr key={it.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3">
                        <p className="font-mono font-bold text-gray-905">{it.code}</p>
                        <p className="font-semibold text-gray-950 text-xs">{it.name}</p>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] uppercase font-bold text-gray-500">{CATEGORY_LABELS[it.category]}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-bold text-[10px]">{it.unit}</span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-gray-900">
                        {it.stockActual}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex justify-end">
                          <input
                            type="number"
                            step="any"
                            value={physicalVal}
                            onChange={(e) => updateCountState(it.id, parseFloat(e.target.value) || 0)}
                            className="w-28 px-2 py-1 text-right text-xs bg-white border border-gray-350 rounded font-mono font-bold text-slate-900 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                          />
                        </div>
                      </td>
                      <td className={`py-3 px-3 text-right font-mono font-bold ${
                        gap > 0 ? 'text-emerald-600' : gap < 0 ? 'text-red-600' : 'text-gray-400'
                      }`}>
                        {gap > 0 ? `+${gap}` : gap} {it.unit}
                      </td>
                    </tr>
                  );
                })}

                {tenantItems.filter(it => it.active).length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-gray-400 font-bold">
                      Aucun produit hors-alimentation référencé sur ce site pour l'inventaire.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-between items-center bg-sky-50/45 p-4 rounded-lg">
            <p className="text-xs text-slate-650 max-w-lg">
              ⚠️ <strong>Instructions :</strong> La validation enregistrera immédiatement des mouvements d'ajustement de stock pour combler les écarts éventuels. L'empreinte financière sera répercutée.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setIsAuditingInventory(false)}
                className="px-4 py-2 bg-white hover:bg-gray-150 text-gray-700 text-xs font-bold rounded border border-gray-300 transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={validatePhysicalAudit}
                disabled={tenantItems.filter(it => it.active).length === 0}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded shadow-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
              >
                <Save className="h-4 w-4" />
                <span>Valider et Enregistrer l'Inventaire</span>
              </button>
            </div>
          </div>

        </div>

      ) : (

        /* ---------------------------------------------------- */
        /* MODULE NORMAL AVEC VUES PAR TAB                      */
        /* ---------------------------------------------------- */
        <div className="space-y-4">
          
          {/* TAB BAR SENSORS */}
          <div className="flex border-b border-gray-200 bg-white px-2 rounded-t-lg border-t border-x border-gray-100" id="nonfood-tabs">
            <button
              onClick={() => setActiveSubTab('SYNTHESIS')}
              className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeSubTab === 'SYNTHESIS'
                  ? 'border-[#F26522] text-[#F26522]'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <Package className="h-4 w-4" />
              <span>Synthèse Actifs & Catalogue</span>
            </button>
            
            <button
              onClick={() => setActiveSubTab('JOURNAL')}
              className={`px-5 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
                activeSubTab === 'JOURNAL'
                  ? 'border-[#F26522] text-[#F26522]'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <History className="h-4 w-4" />
              <span>Journal des Mouvements</span>
            </button>
          </div>

          {/* RENDER ACTIVE TAB */}
          {activeSubTab === 'SYNTHESIS' ? (
            
            /* SYNTHÈSE DES ACTIFS (CATALOGUE DES STOCK AVEC BOUTTON DE MOUVEMENT) */
            <div className="bg-white border border-gray-150 rounded-b-lg p-6 shadow-3xs space-y-4">
              
              {/* FILTERS AREA */}
              <div className="flex flex-col md:flex-row gap-2 justify-between items-stretch md:items-center">
                
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Chercher par nom, code, description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-xs font-semibold focus:outline-none focus:border-sky-500 transition-all bg-white text-gray-900 placeholder:text-gray-400"
                  />
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-md border border-gray-200">
                    <Filter className="h-3.5 w-3.5 text-gray-500" />
                    <span className="text-[10px] font-black uppercase text-gray-500">Filtrer par Catégorie :</span>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="bg-transparent border-none text-[10px] font-bold text-gray-800 p-0 focus:outline-none cursor-pointer"
                    >
                      <option value="ALL">Tous les consommables</option>
                      <option value="EMBALLAGE">Emballages & Boîtes</option>
                      <option value="HYGIENE">Hygiène & Nettoyage</option>
                      <option value="FOURNITURE">Fournitures & Bureaux</option>
                      <option value="MAINTENANCE">Maintenance & Entretien</option>
                      <option value="AUTRE">Autres</option>
                    </select>
                  </div>

                  {/* Toggle alerts only */}
                  <button
                    onClick={() => setFilterAlertsOnly(!filterAlertsOnly)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md border transition flex items-center gap-1.5 cursor-pointer ${
                      filterAlertsOnly 
                        ? 'bg-rose-50 text-rose-700 border-rose-200' 
                        : 'bg-white text-gray-600 border-gray-250 hover:bg-slate-50'
                    }`}
                  >
                    <BadgeAlert className={`h-4 w-4 ${filterAlertsOnly ? 'text-rose-600' : 'text-gray-400'}`} />
                    <span>Seulement les Alertes Stock</span>
                  </button>
                </div>

              </div>

              {/* PRODUCTS LIST TABLE */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-gray-600 uppercase text-[10px] font-black tracking-wider">
                      <th className="py-2.5 px-3">Statut</th>
                      <th className="py-2.5 px-3">Réf / Désignation</th>
                      <th className="py-2.5 px-3">Catégorie</th>
                      <th className="py-2.5 px-3">Unité</th>
                      <th className="py-2.5 px-3 text-right">Stock Actuel</th>
                      <th className="py-2.5 px-3 text-right">Min / Max</th>
                      <th className="py-2.5 px-3 text-right">CMP (Achat)</th>
                      <th className="py-2.5 px-3 text-right">Valorisation</th>
                      <th className="py-2.5 px-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredItems.map(p => {
                      const isLow = p.active && p.stockActual <= p.stockMin;
                      const hasExpiredOut = p.active && p.stockActual === 0;
                      const totalValue = p.stockActual * p.cmp;

                      return (
                        <tr 
                          key={p.id} 
                          className={`hover:bg-slate-50/75 select-none ${
                            !p.active ? 'opacity-55 bg-gray-50/50' : ''
                          }`}
                        >
                          <td className="py-3 px-3">
                            {p.active ? (
                              isLow ? (
                                <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-850 text-[9px] font-black uppercase">Alerte</span>
                              ) : hasExpiredOut ? (
                                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[9px] font-black uppercase">Rupture</span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase">Sain</span>
                              )
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-gray-200 text-gray-550 text-[9px] font-extrabold uppercase">Archivé</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex flex-col">
                              <span className="font-mono text-[10px] text-[#1E4E8C] font-bold">{p.code}</span>
                              <span className="font-bold text-gray-905 w-60 truncate" title={p.name}>{p.name}</span>
                              {p.description && (
                                <span className="text-[10px] text-gray-400 font-semibold truncate w-60">{p.description}</span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 text-[10px] rounded-sm font-bold border ${CATEGORY_COLORS[p.category]}`}>
                              {CATEGORY_LABELS[p.category]}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-semibold text-gray-600">
                            {p.unit}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span className={`font-mono font-black text-xs ${
                              hasExpiredOut ? 'text-red-700 font-extrabold' : isLow ? 'text-orange-600 font-extrabold' : 'text-slate-900 font-bold'
                            }`}>
                              {p.stockActual}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-gray-400 font-semibold text-[11px]">
                            {p.stockMin} / {p.stockMax}
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                            {p.cmp.toLocaleString()} <span className="text-[9px] text-gray-400">F</span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-black text-slate-905">
                            {totalValue.toLocaleString()} <span className="text-[9px] text-gray-400">FCFA</span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center justify-center gap-1">
                              
                              {p.active && (
                                <button
                                  onClick={() => {
                                    setMvtType('OUT');
                                    setMvtQty(1);
                                    setMvtComment('');
                                    setMvtReference('');
                                    setShowMovementModal(p);
                                  }}
                                  className="px-2 py-1 bg-sky-50 text-sky-700 border border-sky-150 rounded text-[10px] font-black transition cursor-pointer hover:bg-sky-100 flex items-center gap-0.5"
                                  title="Enregistrer une sortie ou entrée manuelle pour ce consommable"
                                >
                                  Mouvementer
                                </button>
                              )}

                              <button
                                onClick={() => {
                                  setNewCode(p.code);
                                  setNewName(p.name);
                                  setNewCategory(p.category);
                                  setNewDescription(p.description);
                                  setNewStockMin(p.stockMin);
                                  setNewStockMax(p.stockMax);
                                  setNewUnit(p.unit);
                                  setNewCmp(p.cmp);
                                  setNewSupplierId(p.supplierId || '');
                                  setShowEditProductModal(p);
                                }}
                                className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded transition cursor-pointer"
                                title="Modifier la fiche produit"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>

                              <button
                                onClick={() => handleToggleActiveProduct(p)}
                                className={`p-1 rounded transition cursor-pointer ${
                                  p.active 
                                    ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' 
                                    : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
                                }`}
                                title={p.active ? 'Désactiver / Archiver le produit' : 'Réactiver et réintégrer le produit'}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredItems.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-10 text-center text-gray-400 font-bold">
                          Aucun consommable d’exploitation trouvé pour les filtres sélectionnés.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>

          ) : (
            
            /* JOURNAL DE MIGRATION CHRONOLOGIQUE DES FLUX */
            <div className="bg-white border border-gray-150 rounded-b-lg p-6 shadow-3xs space-y-4">
              
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900">Flux Historique du Matériel Hors-Alimentation</h3>
                <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-black">
                  {tenantMovements.length} Mouvement(s)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-500 border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-gray-700 uppercase text-[10px] font-black tracking-wider">
                      <th className="py-2.5 px-3">Date du Flux</th>
                      <th className="py-2.5 px-3">Article Consommable</th>
                      <th className="py-2.5 px-3">Flux</th>
                      <th className="py-2.5 px-3 text-right">Quantité</th>
                      <th className="py-2.5 px-3 text-right font-mono">Coût Unitaire CMP</th>
                      <th className="py-2.5 px-3 text-right font-mono">Impact Financier</th>
                      <th className="py-2.5 px-3">Origine / Réf de pièce</th>
                      <th className="py-2.5 px-3">Opérateur</th>
                      <th className="py-2.5 px-3">Motif & Observations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {tenantMovements.map(m => {
                      const isMinus = m.type === 'OUT' || m.type === 'ADJUST_MINUS';

                      return (
                        <tr key={m.id} className="hover:bg-slate-50/75 select-none">
                          <td className="py-3 px-3 text-gray-400 font-medium whitespace-nowrap">
                            {m.date}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-bold text-gray-950 font-sans block">{m.itemName}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase flex items-center w-max gap-0.5 font-mono ${
                              m.type === 'IN' ? 'bg-emerald-50 text-emerald-700' :
                              m.type === 'OUT' ? 'bg-blue-50 text-[#1E4E8C]' :
                              m.type.includes('ADJUST_PLUS') ? 'bg-teal-50 text-teal-700' : 'bg-red-50 text-red-700'
                            }`}>
                              {m.type === 'IN' || m.type === 'ADJUST_PLUS' ? (
                                <ArrowUpRight className="h-3 w-3" />
                              ) : (
                                <ArrowDownRight className="h-3 w-3" />
                              )}
                              {m.type === 'IN' ? 'Appro (Entrée)' :
                               m.type === 'OUT' ? 'Sortie Utilisation' :
                               m.type === 'ADJUST_PLUS' ? 'Correction (+)' : 'Ajustement Écart (-)'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-gray-900">
                            {isMinus ? '-' : '+'}{m.quantity}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-gray-650">
                            {m.unitCost.toLocaleString()} F
                          </td>
                          <td className={`py-3 px-3 text-right font-mono font-black ${
                            isMinus ? 'text-red-650' : 'text-emerald-700'
                          }`}>
                            {isMinus ? '-' : ''}{m.value.toLocaleString()} FCFA
                          </td>
                          <td className="py-3 px-3 font-semibold text-gray-500">
                            {m.reference}
                          </td>
                          <td className="py-3 px-3 text-gray-400 text-[10px] font-extrabold flex items-center gap-1 pt-4">
                            <User className="h-3 w-3" />
                            <span>{m.userName}</span>
                          </td>
                          <td className="py-3 px-3 text-gray-500 italic max-w-xs truncate" title={m.comment}>
                            {m.comment}
                          </td>
                        </tr>
                      );
                    })}

                    {tenantMovements.length === 0 && (
                      <tr>
                        <td colSpan={9} className="py-10 text-center text-gray-400 font-bold">
                          Aucun mouvement enregistré à ce jour pour les produits hors-alimentation.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

        </div>

      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: AJOUTER UN PRODUIT HORS-ALIMENTATION          */}
      {/* ---------------------------------------------------- */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-gray-150 max-w-lg w-full overflow-hidden animate-scale-in">
            
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-[#0B1F3F] text-white">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-[#F26522]" />
                <h3 className="text-sm font-bold">Référencer un nouvel Article Hors-Alimentation</h3>
              </div>
              <button 
                onClick={() => setShowAddProductModal(false)}
                className="text-gray-350 hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-6 space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 block">Code unique matériel</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: NF-EMB-B01"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-gray-900 font-bold focus:outline-none focus:border-sky-500"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 block">Catégorie d'affectation</label>
                  <select
                    value={newCategory}
                    onChange={(e: any) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs font-bold focus:outline-none focus:border-sky-500 cursor-pointer bg-white"
                  >
                    <option value="EMBALLAGE">Emballages & Boîtes</option>
                    <option value="HYGIENE">Hygiène & Nettoyage</option>
                    <option value="FOURNITURE">Fournitures & Bureaux</option>
                    <option value="MAINTENANCE">Maintenance & Entretien</option>
                    <option value="AUTRE">Autres</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 block">Désignation / Nom du consommable</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Savon Liquide Doseur 10L"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-gray-900 font-bold focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 block">Description détaillée</label>
                <textarea
                  placeholder="Usage, caractéristiques techniques, dimensions..."
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-gray-900 font-medium focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 block">Unité d'usage</label>
                  <input
                    type="text"
                    required
                    placeholder="Boîte, Pièce, Litre"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-gray-900 font-bold focus:outline-none focus:border-sky-500"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 block">Stock Min (Alerte)</label>
                  <input
                    type="number"
                    required
                    value={newStockMin}
                    onChange={(e) => setNewStockMin(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 block">Stock Max conseillé</label>
                  <input
                    type="number"
                    required
                    value={newStockMax}
                    onChange={(e) => setNewStockMax(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block">Coût estimatif d'achat (FCFA)</label>
                  <input
                    type="number"
                    required
                    value={newCmp}
                    onChange={(e) => setNewCmp(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 block">Stock Initial Actuellement Restant</label>
                  <input
                    type="number"
                    required
                    value={newInitialStock}
                    onChange={(e) => setNewInitialStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 block">Fournisseur préférentiel</label>
                <select
                  value={newSupplierId}
                  onChange={(e) => setNewSupplierId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-xs font-bold focus:outline-none focus:border-sky-500 cursor-pointer bg-white"
                >
                  <option value="">-- Aucun fournisseur affilié --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded cursor-pointer transition select-none"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#F26522] hover:bg-[#d65319] text-white text-xs font-black rounded cursor-pointer transition select-none inline-flex items-center gap-1 shadow-xs"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Enregistrer le Matériel</span>
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: MODIFIER UN PRODUIT HORS-ALIMENTATION         */}
      {/* ---------------------------------------------------- */}
      {showEditProductModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-gray-150 max-w-lg w-full overflow-hidden animate-scale-in">
            
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-slate-950 text-white">
              <div className="flex items-center gap-2">
                <Edit2 className="h-4 w-4 text-[#F26522]" />
                <h3 className="text-sm font-bold">Modifier l'Article {showEditProductModal.code}</h3>
              </div>
              <button 
                onClick={() => setShowEditProductModal(null)}
                className="text-gray-300 hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditProduct} className="p-6 space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 block">Code brut</label>
                  <input
                    type="text"
                    required
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-gray-900 font-bold bg-gray-50 focus:outline-none"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 block">Catégorie</label>
                  <select
                    value={newCategory}
                    onChange={(e: any) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs font-bold focus:outline-none cursor-pointer bg-white"
                  >
                    <option value="EMBALLAGE">Emballages & Boîtes</option>
                    <option value="HYGIENE">Hygiène & Nettoyage</option>
                    <option value="FOURNITURE">Fournitures & Bureaux</option>
                    <option value="MAINTENANCE">Maintenance & Entretien</option>
                    <option value="AUTRE">Autres</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 block">Désignation</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-gray-900 font-bold focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 block">Description</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-gray-900 font-medium focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 block">Unité d'usage</label>
                  <input
                    type="text"
                    required
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-gray-900 font-bold focus:outline-none"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 block">Stock Min</label>
                  <input
                    type="number"
                    required
                    value={newStockMin}
                    onChange={(e) => setNewStockMin(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-slate-900 font-mono font-bold focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 block">Stock Max</label>
                  <input
                    type="number"
                    required
                    value={newStockMax}
                    onChange={(e) => setNewStockMax(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-slate-900 font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-slate-500 block">Coût Moyen Pondéré (CMP)</label>
                <input
                  type="number"
                  required
                  value={newCmp}
                  onChange={(e) => setNewCmp(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-303 rounded text-xs text-slate-900 font-mono font-bold focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 block">Fournisseur préférentiel</label>
                <select
                  value={newSupplierId}
                  onChange={(e) => setNewSupplierId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-xs font-bold focus:outline-none cursor-pointer bg-white"
                >
                  <option value="">-- Aucun fournisseur affilié --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.city})</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditProductModal(null)}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded cursor-pointer transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded cursor-pointer transition shadow-xs"
                >
                  Modifier l'Article
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* MODAL: MOUVEMENTER STOCK MANUELLEMENT (IN / OUT)      */}
      {/* ---------------------------------------------------- */}
      {showMovementModal && (
        <div className="fixed inset-0 bg-slate-905/45 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-gray-150 max-w-md w-full overflow-hidden animate-scale-in">
            
            <div className={`px-6 py-4 border-b border-gray-100 text-white font-bold flex items-center gap-2 ${
              mvtType === 'IN' || mvtType === 'ADJUST_PLUS' ? 'bg-emerald-850' : 'bg-slate-900'
            }`}>
              <Undo className="h-4 w-4 text-[#F26522]" />
              <div className="flex flex-col">
                <h3 className="text-xs font-black uppercase tracking-wider leading-none">Formuler un Flux de Stock</h3>
                <span className="text-xs text-gray-200 font-medium mt-1">{showMovementModal.name}</span>
              </div>
            </div>

            <form onSubmit={handleRegisterMovement} className="p-6 space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 block">Nature de l'écriture (Type)</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMvtType('OUT')}
                    className={`py-2 px-3 border text-center text-xs font-extrabold rounded-md cursor-pointer transition ${
                      mvtType === 'OUT'
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-200 text-gray-500 hover:bg-slate-50'
                    }`}
                  >
                    Sortie Consommation (-)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMvtType('IN')}
                    className={`py-2 px-3 border text-center text-xs font-extrabold rounded-md cursor-pointer transition ${
                      mvtType === 'IN'
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                        : 'bg-white border-gray-200 text-gray-500 hover:bg-slate-50'
                    }`}
                  >
                    Appro / Rentrer (+)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 block">Quantité ({showMovementModal.unit})</label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="0.01"
                    placeholder="Saisir quantité"
                    value={mvtQty || ''}
                    onChange={(e) => setMvtQty(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-sky-500"
                  />
                  <span className="text-[10px] text-gray-400 block mt-0.5">
                    Stock d’origine : <strong>{showMovementModal.stockActual} {showMovementModal.unit}</strong>
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-gray-500 block">Coût unitaire (Calculé)</label>
                  <div className="w-full px-3 py-2 bg-gray-50 border border-gray-250 rounded text-xs font-mono font-medium text-gray-500">
                    {showMovementModal.cmp.toLocaleString()} FCFA
                  </div>
                  <span className="text-[10px] text-gray-400 block mt-0.5">
                    Valorisation : <strong>{(mvtQty * showMovementModal.cmp).toLocaleString()} F</strong>
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 block">Document ou Pièce justificative de Référence</label>
                <input
                  type="text"
                  placeholder="Ex: Sortie service resto, Livraison BL-X"
                  value={mvtReference}
                  onChange={(e) => setMvtReference(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-gray-900 font-bold focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-gray-500 block">Observations / Remarques</label>
                <textarea
                  placeholder="Pourquoi est effectué ce mouvement ?"
                  rows={2}
                  value={mvtComment}
                  onChange={(e) => setMvtComment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-xs text-gray-900 font-medium focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-gray-150 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMovementModal(null)}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded cursor-pointer transition select-none"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={mvtQty <= 0}
                  className={`px-4 py-2 text-white text-xs font-black rounded cursor-pointer transition select-none disabled:opacity-50 disabled:cursor-not-allowed ${
                    mvtType === 'IN' || mvtType === 'ADJUST_PLUS'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-slate-900 hover:bg-slate-800'
                  }`}
                >
                  Valider le Mouvement
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
