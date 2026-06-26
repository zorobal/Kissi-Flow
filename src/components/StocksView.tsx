/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  Layers,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ClipboardList,
  AlertTriangle,
  RotateCcw,
  PlusCircle,
  TrendingDown,
  Percent,
  TrendingUp,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { Ingredient, StockMovement, PhysicalInventory, PhysicalInventoryLine, StockBatch } from '../types';

interface StocksViewProps {
  ingredients: Ingredient[];
  stockMovements: StockMovement[];
  physicalInventories: PhysicalInventory[];
  stockBatches: StockBatch[];
  onAddStockMovement: (mvt: StockMovement) => void;
  onValidateInventory: (inv: PhysicalInventory, adjustments: StockMovement[]) => void;
  logsAction: (action: string, module: string) => void;
  tenantId: string;
  activeUser: { name: string; id: string; role: string };
  onUpdateStockBatches?: (batches: StockBatch[]) => void;
}

export default function StocksView({
  ingredients,
  stockMovements,
  physicalInventories,
  stockBatches,
  onAddStockMovement,
  onValidateInventory,
  logsAction,
  tenantId,
  activeUser,
  onUpdateStockBatches
}: StocksViewProps) {
  // Sub-tabs in inventories: 'SYNTHESIS' | 'MOVEMENTS' | 'INVENTORY_AUDIT' | 'LOTS_TRACEABILITY'
  const [activeStockTab, setActiveStockTab] = useState<'SYNTHESIS' | 'MOVEMENTS' | 'INVENTORY_AUDIT' | 'LOTS_TRACEABILITY'>('SYNTHESIS');

  // Filters for sub-modules of stock
  const [synthesisSearch, setSynthesisSearch] = useState('');
  const [synthesisStatus, setSynthesisStatus] = useState('ALL'); // ALL, RUPTURE, FAIBLE, APPRO
  const [movementsSearch, setMovementsSearch] = useState('');
  const [movementsType, setMovementsType] = useState('ALL'); // ALL, IN, OUT, ADJUST, SALE
  const [traceSearch, setTraceSearch] = useState('');
  const [traceStatus, setTraceStatus] = useState('ALL'); // ALL, PERIME, URGENT, SAIN

  // Active Tenant filtering
  const tenantIngredients = ingredients.filter(i => i.tenantId === tenantId);
  const tenantMovements = stockMovements.filter(m => m.tenantId === tenantId);
  const tenantInventories = physicalInventories.filter(pi => pi.tenantId === tenantId);

  // Manual stock movement states
  const [showAddMvtModal, setShowAddMvtModal] = useState(false);
  const [mvtIngId, setMvtIngId] = useState('');
  const [mvtType, setMvtType] = useState<'IN' | 'OUT' | 'ADJUST_PLUS' | 'ADJUST_MINUS'>('IN');
  const [mvtQty, setMvtQty] = useState(0);
  const [mvtCost, setMvtCost] = useState(0);
  const [mvtRef, setMvtRef] = useState('');
  const [mvtComment, setMvtComment] = useState('');

  // Physical Inventory audit sheets creator are active
  const [isAuditingInventory, setIsAuditingInventory] = useState(false);
  const [auditQuantities, setAuditQuantities] = useState<{ [ingId: string]: number }>({});

  // Financial loss valuation states
  const [selectedLossBatch, setSelectedLossBatch] = useState<StockBatch | null>(null);
  const [lossQtyInput, setLossQtyInput] = useState<number>(0);
  const [lossCommentInput, setLossCommentInput] = useState<string>('');
  const [lossReasonType, setLossReasonType] = useState<string>('DLC_PERIME');

  const getReasonLabel = (type: string) => {
    switch (type) {
      case 'DLC_PERIME': return 'Péremption / DLC dépassée';
      case 'PANNE_COURANT': return 'Panne d\'électricité / Coupures';
      case 'ACCIDENT_CUISINE': return 'Accident de cuisine / Casse';
      case 'ALTERATION_QUALITE': return 'Altération qualité / Moisi';
      case 'AVARIE_TRANSPORT': return 'Avarie logistique / Transport';
      case 'VOL_ECART': return 'Vol ou écart d’inventaire';
      default: return 'Autre motif exceptionnel';
    }
  };

  const handleCreateManualMovement = () => {
    if (!mvtIngId || !mvtQty || mvtQty <= 0) {
      alert('Veuillez spécifier l\'ingrédient et une quantité correcte');
      return;
    }

    const ingObj = tenantIngredients.find(i => i.id === mvtIngId);
    if (!ingObj) return;

    // determine multiplier for stock adjustments (+ vs -)
    const factor = (mvtType === 'IN' || mvtType === 'ADJUST_PLUS') ? 1 : -1;
    const finalQty = mvtQty * factor;
    const computedUnitCost = mvtCost || ingObj.cmp || ingObj.lastPurchasePrice || 0;
    const computedValue = finalQty * computedUnitCost;

    const newMvt: StockMovement = {
      id: `mov-${Date.now()}`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      ingredientId: mvtIngId,
      ingredientName: ingObj.name,
      type: mvtType,
      quantity: finalQty,
      unitCost: computedUnitCost,
      value: computedValue,
      reference: mvtRef.toUpperCase() || 'MVT-MANUEL',
      userId: activeUser.id,
      userName: activeUser.name,
      comment: mvtComment || 'Ajustement de stock manuel',
      tenantId
    };

    onAddStockMovement(newMvt);
    logsAction(`Mouvement de stock enregistré : ${mvtType} sur ${ingObj.name} (${mvtQty} ${ingObj.unit})`, 'STOCK / INVENTAIRE');
    setShowAddMvtModal(false);

    // reset inputs
    setMvtIngId('');
    setMvtQty(0);
    setMvtCost(0);
    setMvtRef('');
    setMvtComment('');
  };

  // Launch fresh physical audit
  const handleStartInventoryAudit = () => {
    const freshQuantities: { [ingId: string]: number } = {};
    tenantIngredients.forEach(ing => {
      freshQuantities[ing.id] = ing.stockActual; // prepopulate with system theoretical values
    });
    setAuditQuantities(freshQuantities);
    setIsAuditingInventory(true);
    logsAction('Lancement d\'une feuille d\'inventaire physique', 'STOCK / INVENTAIRE');
  };

  // Enregistrer la perte financière d'un lot d'ingrédient
  const handleSaveLoss = () => {
    if (!selectedLossBatch || lossQtyInput <= 0) {
      alert('Veuillez entrer une quantité supérieure à 0');
      return;
    }

    if (lossQtyInput > selectedLossBatch.quantity) {
      alert(`La quantité à déclarer (${lossQtyInput} ${selectedLossBatch.unit}) dépasse la quantité actuellement en lot (${selectedLossBatch.quantity} ${selectedLossBatch.unit})`);
      return;
    }

    const parentIng = ingredients.find(i => i.id === selectedLossBatch.ingredientId);
    const unitPrice = parentIng ? (parentIng.cmp || parentIng.lastPurchasePrice || 0) : 0;
    const computedLossAmount = lossQtyInput * unitPrice;

    const fullComment = `Perte [${getReasonLabel(lossReasonType)}] : ${lossCommentInput || 'Aucun détail'}`;

    // Update stock batch list
    const updatedBatches = (stockBatches || []).map(b => {
      if (b.id === selectedLossBatch.id) {
        return {
          ...b,
          quantity: Math.max(0, b.quantity - lossQtyInput),
          lossDeclared: true,
          lossQty: (b.lossQty || 0) + lossQtyInput,
          lossCmpUsed: unitPrice,
          lossAmount: (b.lossAmount || 0) + computedLossAmount,
          lossValidated: true,
          lossValidatedBy: activeUser ? activeUser.name : 'ADMIN/MANAGER',
          lossValidatedDate: new Date().toISOString().split('T')[0],
          lossReason: lossReasonType,
          lossComment: [b.lossComment, fullComment].filter(Boolean).join('; ')
        };
      }
      return b;
    });

    if (onUpdateStockBatches) {
      onUpdateStockBatches(updatedBatches);
    }

    // Trigger standard StockMovement (OUT) so the global stock updates
    onAddStockMovement({
      id: `mov-loss-${Date.now()}`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      ingredientId: selectedLossBatch.ingredientId,
      ingredientName: selectedLossBatch.ingredientName,
      type: 'OUT',
      quantity: -lossQtyInput,
      unitCost: unitPrice,
      value: -computedLossAmount,
      reference: lossReasonType,
      userId: activeUser.id,
      userName: activeUser.name,
      comment: `Perte Financière validée [Motif: ${getReasonLabel(lossReasonType)}] - Lot ${selectedLossBatch.batchNum} (${lossQtyInput} ${selectedLossBatch.unit}) - Commentaire: ${lossCommentInput || 'Gaspillage d\'ingrédients'}`,
      tenantId: tenantId
    });

    logsAction(
      `Perte financière validée lot ${selectedLossBatch.batchNum} (${lossQtyInput} ${selectedLossBatch.unit}) | Motif: ${getReasonLabel(lossReasonType)} : ${computedLossAmount.toLocaleString()} FCFA`,
      'STOCK / INVENTAIRE'
    );

    // Reset state
    setSelectedLossBatch(null);
    setLossQtyInput(0);
    setLossCommentInput('');
    setLossReasonType('DLC_PERIME');
  };

  // Update specific physical count quantity input
  const handleUpdateAuditCount = (ingId: string, countVal: number) => {
    setAuditQuantities({
      ...auditQuantities,
      [ingId]: Math.max(0, countVal)
    });
  };

  // Submit and Save Physical Inventory (Reconciliation Gap Audit - Module 5.12)
  const handleValidateInventoryAudit = () => {
    const lines: PhysicalInventoryLine[] = [];
    const derivedAdjustments: StockMovement[] = [];

    tenantIngredients.forEach(ing => {
      const theoretical = ing.stockActual;
      const real = auditQuantities[ing.id] ?? theoretical;
      const gap = real - theoretical;

      lines.push({
        ingredientId: ing.id,
        ingredientName: ing.name,
        theoreticalQty: theoretical,
        realQty: real,
        gap: gap
      });

      // If gap exists, compile standard stock offset movements (+/-)
      if (gap !== 0) {
        const typeMvt = gap > 0 ? 'ADJUST_PLUS' : 'ADJUST_MINUS';
        const costVal = ing.cmp || ing.lastPurchasePrice || 0;
        derivedAdjustments.push({
          id: `mov-adj-${ing.id}-${Date.now()}`,
          date: new Date().toISOString().replace('T', ' ').slice(0, 16),
          ingredientId: ing.id,
          ingredientName: ing.name,
          type: typeMvt,
          quantity: gap,
          unitCost: costVal,
          value: gap * costVal,
          reference: 'INV-ECART-AUTO',
          userId: activeUser.id,
          userName: activeUser.name,
          comment: `Ajustement automatique d'écart d'inventaire (${gap > 0 ? '+' : ''}${gap.toFixed(2)} ${ing.unit})`,
          tenantId
        });
      }
    });

    const newInventory: PhysicalInventory = {
      id: `inv-${Date.now()}`,
      date: new Date().toISOString().replace('T', ' ').slice(0, 10),
      status: 'VALIDATED',
      userId: activeUser.id,
      userName: activeUser.name,
      tenantId,
      lines
    };

    onValidateInventory(newInventory, derivedAdjustments);
    logsAction(`Inventaire physique d'actifs d'établissement complété (Gaps d'écarts ajustés)`, 'STOCK / INVENTAIRE');
    setIsAuditingInventory(false);
    setActiveStockTab('INVENTORY_AUDIT');
    alert('Inventaire physique validé ! Toutes les fiches d\'écarts ont été reconciliées et les quantités de stock physique ré-ajustées dans le livre d\'actifs.');
  };

  // Compute live synthesis metrics
  const totalStockAssetsValue = tenantIngredients.reduce((sum, ing) => sum + (ing.stockActual * (ing.cmp || 0)), 0);
  const lowStockAlertsCount = tenantIngredients.filter(ing => ing.stockActual <= ing.stockMin && ing.active).length;

  const tenantBatches = (stockBatches || []).filter(b => b.tenantId === tenantId);
  const totalLossFromBatchesAmount = tenantBatches
    .filter(b => b.lossDeclared && b.lossValidated)
    .reduce((sum, b) => sum + (b.lossAmount || 0), 0);

  return (
    <div className="space-y-6" id="stocks-module">
      {/* Visual KPI indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-150 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Actifs en Stock</span>
            <p className="text-xl font-bold font-sans text-gray-950 mt-1">{totalStockAssetsValue.toLocaleString()} FCFA</p>
          </div>
          <div className="p-2.5 bg-blue-50 text-[#1E4E8C] rounded">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-150 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gray-550 font-medium uppercase tracking-wider block leading-tight">Pertes d'Ingrédients</span>
            <p className="text-xl font-bold font-sans text-red-600 mt-1">{totalLossFromBatchesAmount.toLocaleString()} FCFA</p>
          </div>
          <div className="p-2.5 bg-rose-50 text-red-650 rounded">
            <TrendingDown className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-150 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Articles Référencés</span>
            <p className="text-xl font-bold font-sans text-gray-950 mt-1">{tenantIngredients.length} Ingrédients</p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded">
            <ClipboardList className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-150 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Ruptures & Alertes</span>
            <p className="text-xl font-bold font-sans text-gray-950 mt-1">{lowStockAlertsCount} produits faibles</p>
          </div>
          <div className="p-2.5 bg-red-50 text-red-600 rounded">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Sub menu tabs inside stock module */}
      <div className="flex border-b border-gray-150">
        <button
          id="stock-tab-synthesis"
          onClick={() => { setActiveStockTab('SYNTHESIS'); setIsAuditingInventory(false); }}
          className={`px-6 py-3 text-xs font-bold border-b-2 transition-all ${
            activeStockTab === 'SYNTHESIS' && !isAuditingInventory
              ? 'border-[#1E4E8C] text-[#1E4E8C] bg-blue-50/20'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Synthèse Actifs
        </button>
        <button
          id="stock-tab-movements"
          onClick={() => { setActiveStockTab('MOVEMENTS'); setIsAuditingInventory(false); }}
          className={`px-6 py-3 text-xs font-bold border-b-2 transition-all ${
            activeStockTab === 'MOVEMENTS' && !isAuditingInventory
              ? 'border-[#1E4E8C] text-[#1E4E8C] bg-blue-50/20'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Journal des Mouvements
        </button>
        <button
          id="stock-tab-audit"
          onClick={() => { setActiveStockTab('INVENTORY_AUDIT'); setIsAuditingInventory(false); }}
          className={`px-6 py-3 text-xs font-bold border-b-2 transition-all ${
            activeStockTab === 'INVENTORY_AUDIT' && !isAuditingInventory
              ? 'border-[#1E4E8C] text-[#1E4E8C] bg-blue-50/20'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Fiches d'Inventaires Physiques
        </button>
        <button
          id="stock-tab-lots-traceability"
          onClick={() => { setActiveStockTab('LOTS_TRACEABILITY'); setIsAuditingInventory(false); }}
          className={`px-6 py-3 text-xs font-bold border-b-2 transition-all ${
            activeStockTab === 'LOTS_TRACEABILITY' && !isAuditingInventory
              ? 'border-[#1E4E8C] text-[#1E4E8C] bg-blue-50/20'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Traçabilité des Lots & Dates (DLC)
        </button>
      </div>

      {/* RENDER ACTIVE SCREEN SECTION */}
      {isAuditingInventory ? (
        /* SÉLECTION 3: PHYSICAL AUDIT IN PROGRESS SCREEN (Comparer les stocks) */
        <div className="bg-white border border-gray-150 rounded-lg p-6 shadow-2xs space-y-4">
          <div className="flex justify-between items-start border-b pb-3 border-gray-100">
            <div>
              <h3 className="text-base font-bold text-gray-900">Reconciliation & Audit Physique du Stock</h3>
              <p className="text-xs text-gray-500 mt-1">Saisissez les quantités exactes comptées en cuisine. L'ERP calculera les écarts (Écart = Réel - Théorique) et balancera les écritures automatiquement.</p>
            </div>
            <button
              onClick={() => setIsAuditingInventory(false)}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded"
            >
              Quitter la feuille
            </button>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-xs text-left text-gray-600 bg-white">
              <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 border-b uppercase">
                <tr>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Ingrédient</th>
                  <th className="px-5 py-3">Unité</th>
                  <th className="px-5 py-3 text-right">Stock théorique (Tableau de bord)</th>
                  <th className="px-4 py-3 text-center w-40">Stock réel compté</th>
                  <th className="px-5 py-3 text-right">Écart Détecté</th>
                </tr>
              </thead>
              <tbody className="divide-y font-semibold text-gray-700">
                {tenantIngredients.map(ing => {
                  const theoretical = ing.stockActual;
                  const real = auditQuantities[ing.id] ?? theoretical;
                  const gap = real - theoretical;
                  return (
                    <tr key={ing.id} className="hover:bg-gray-50">
                      <td className="px-5 py-2.5 font-mono text-gray-500">{ing.code}</td>
                      <td className="px-5 py-2.5 font-bold text-gray-900">{ing.name}</td>
                      <td className="px-5 py-2.5">{ing.unit}</td>
                      <td className="px-5 py-2.5 text-right font-mono text-gray-600">{theoretical.toFixed(1)} {ing.unit}</td>
                      <td className="px-4 py-2 text-center">
                        <input
                          id={`audit-count-${ing.id}`}
                          type="number"
                          step={0.1}
                          value={real}
                          onChange={(e) => handleUpdateAuditCount(ing.id, parseFloat(e.target.value) || 0)}
                          className="w-24 p-1 px-2 border rounded font-mono text-center focus:ring-1 focus:ring-[#1E4E8C] focus:outline-none"
                        />
                      </td>
                      <td className="px-5 py-2.5 text-right font-mono">
                        <span className={`px-1.5 py-0.5 rounded font-bold text-[11px] ${
                          gap === 0 ? 'bg-gray-100 text-gray-600' :
                          gap > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {gap === 0 ? '0.0' : `${gap > 0 ? '+' : ''}${gap.toFixed(1)}`}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              id="validate-inventory-audit-btn"
              onClick={handleValidateInventoryAudit}
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-700 text-white font-bold rounded-lg text-xs hover:brightness-115 flex items-center gap-1.5 shadow"
            >
              <span>Valider & Reconcilier Inventaire</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* SYNTHESIS TAB VIEW */}
          {activeStockTab === 'SYNTHESIS' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-lg border border-gray-150 gap-3 shadow-2xs">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Actifs & Valorisation Monétaire</h3>
                  <p className="text-xs text-gray-500 mt-0.5">La valorisation de notre stock utilise le Coût Moyen Pondéré (CMP).</p>
                </div>

                <div className="flex gap-2">
                  <button
                    id="stock-trigger-mvt-modal-btn"
                    onClick={() => setShowAddMvtModal(true)}
                    className="p-1.5 px-3.5 bg-[#1E4E8C] text-white hover:bg-blue-800 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Mouvement Manuel</span>
                  </button>
                  <button
                    id="stock-start-audit-btn"
                    onClick={handleStartInventoryAudit}
                    className="p-1.5 px-3.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-250 rounded-lg text-xs font-semibold flex items-center gap-1.5"
                  >
                    <ClipboardList className="h-4 w-4" />
                    <span>Faire Fiche d'Inventaire</span>
                  </button>
                </div>
              </div>
              
              {/* FILTERS BAR */}
              <div className="flex flex-col md:flex-row gap-3 bg-white p-3 rounded-lg border border-gray-150 text-xs">
                <div className="flex-1">
                  <input
                    type="text"
                    value={synthesisSearch}
                    onChange={(e) => setSynthesisSearch(e.target.value)}
                    placeholder="🔍 Rechercher par code ou désignation d meuble/ingrédient..."
                    className="w-full p-2 border rounded bg-white text-gray-800 font-semibold"
                  />
                </div>
                <div className="w-full md:w-56">
                  <select
                    value={synthesisStatus}
                    onChange={(e) => setSynthesisStatus(e.target.value)}
                    className="w-full p-2 border rounded bg-white text-gray-800 font-bold"
                  >
                    <option value="ALL">Statut appro : Tous</option>
                    <option value="RUPTURE">{"🔴 En Rupture (<= 0)"}</option>
                    <option value="FAIBLE">🟡 Stock Faible</option>
                    <option value="APPRO">🟢 Stock Satisfaisant</option>
                  </select>
                </div>
              </div>

              {/* Table rendering the material inputs */}
              <div className="bg-white border text-xs text-gray-700 rounded-lg overflow-hidden shadow-2xs">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 border-b uppercase">
                    <tr>
                      <th className="px-5 py-3">Code</th>
                      <th className="px-5 py-3">Désignation de l'Article</th>
                      <th className="px-5 py-3">CMP Valorisé</th>
                      <th className="px-5 py-3 text-right">Seuil d'alerte</th>
                      <th className="px-5 py-3 text-right">Quantité restante</th>
                      <th className="px-5 py-3 text-right">Valeur totale stock</th>
                      <th className="px-5 py-3">Statut d'appro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-semibold text-gray-700">
                    {(() => {
                      const list = tenantIngredients.filter(ing => {
                        const sQuery = synthesisSearch.toLowerCase().trim();
                        const matchesSearch = !sQuery || ing.name.toLowerCase().includes(sQuery) || ing.code.toLowerCase().includes(sQuery);
                        
                        const status = ing.stockActual <= 0 ? 'RUPTURE' : ing.stockActual <= ing.stockMin ? 'FAIBLE' : 'APPRO';
                        const matchesStatus = synthesisStatus === 'ALL' || status === synthesisStatus;
                        
                        return matchesSearch && matchesStatus;
                      });

                      if (list.length === 0) {
                        return (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-gray-400 font-normal italic">
                              Aucun ingrédient ne correspond aux critères de filtrage.
                            </td>
                          </tr>
                        );
                      }

                      return list.map(ing => {
                        const totalVal = ing.stockActual * (ing.cmp || ing.lastPurchasePrice || 0);
                        const statusColorItem = ing.stockActual <= 0 ? 'bg-red-100 text-red-800 border border-red-200' :
                          ing.stockActual <= ing.stockMin ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-green-100 text-green-800 border-green-200';
                        
                        const statusTextVal = ing.stockActual <= 0 ? 'En Rupture' :
                          ing.stockActual <= ing.stockMin ? 'Faible réappro' : 'Approvisionné';

                        return (
                          <tr key={ing.id} className="hover:bg-gray-50">
                            <td className="px-5 py-3.5 font-mono text-gray-550">{ing.code}</td>
                            <td className="px-5 py-3.5 font-bold text-gray-950">{ing.name}</td>
                            <td className="px-5 py-3.5 font-mono text-gray-900">{(ing.cmp || ing.lastPurchasePrice || 0).toLocaleString()} F</td>
                            <td className="px-5 py-3.5 text-right text-gray-500 font-mono">{ing.stockMin} {ing.unit}</td>
                            <td className="px-5 py-3.5 text-right font-mono text-gray-900">{ing.stockActual.toFixed(1)} {ing.unit}</td>
                            <td className="px-5 py-3 text-right font-mono font-bold text-[#1E4E8C]">{totalVal.toLocaleString()} FCFA</td>
                            <td className="px-5 py-3.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block leading-none ${statusColorItem}`}>
                                {statusTextVal}
                              </span>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MOVEMENTS LOG HISTORY */}
          {activeStockTab === 'MOVEMENTS' && (
            <div className="space-y-4">
              {/* MOVEMENTS FILTERS BAR */}
              <div className="flex flex-col md:flex-row gap-3 bg-white p-3 rounded-lg border border-gray-150 text-xs">
                <div className="flex-1">
                  <input
                    type="text"
                    value={movementsSearch}
                    onChange={(e) => setMovementsSearch(e.target.value)}
                    placeholder="🔍 Filtrer les mouvements par nom d'ingrédient ou référence..."
                    className="w-full p-2 border rounded bg-white text-gray-800 font-semibold"
                  />
                </div>
                <div className="w-full md:w-56">
                  <select
                    value={movementsType}
                    onChange={(e) => setMovementsType(e.target.value)}
                    className="w-full p-2 border rounded bg-white text-gray-800 font-bold"
                  >
                    <option value="ALL">Type de mouvement : Tous</option>
                    <option value="IN">Entrées de stock</option>
                    <option value="OUT">Sorties & Pertes</option>
                    <option value="ADJUST">Ajustements Manuels</option>
                    <option value="SALE">Ventes directes POS</option>
                  </select>
                </div>
              </div>

              <div className="bg-white border rounded-lg shadow-2xs overflow-hidden">
                <table className="w-full text-xs text-left text-gray-600">
                  <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 border-b uppercase">
                    <tr>
                      <th className="px-5 py-3 col-span-2">Date & Heure</th>
                      <th className="px-5 py-3">Ingrédient</th>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3 text-right">Quantité</th>
                      <th className="px-5 py-3 text-right">Valeur valorisée</th>
                      <th className="px-5 py-3">Référence</th>
                      <th className="px-5 py-3">Responsable</th>
                      <th className="px-5 py-3">Notes / Commentaire</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-semibold text-gray-700">
                    {(() => {
                      const list = tenantMovements.filter(mvt => {
                        const sQuery = movementsSearch.toLowerCase().trim();
                        const matchesSearch = !sQuery || mvt.ingredientName.toLowerCase().includes(sQuery) || (mvt.reference || '').toLowerCase().includes(sQuery);
                        
                        let matchesType = true;
                        if (movementsType === 'IN') {
                          matchesType = mvt.type === 'IN';
                        } else if (movementsType === 'OUT') {
                          matchesType = mvt.type === 'OUT';
                        } else if (movementsType === 'ADJUST') {
                          matchesType = mvt.type === 'ADJUST_PLUS' || mvt.type === 'ADJUST_MINUS';
                        } else if (movementsType === 'SALE') {
                          matchesType = mvt.type === 'SALE';
                        }

                        return matchesSearch && matchesType;
                      }).sort((a, b) => b.date.localeCompare(a.date));

                      if (list.length === 0) {
                        return (
                          <tr>
                            <td colSpan={8} className="py-20 text-center text-gray-400 font-normal italic">
                              Aucun mouvement de stock correspondant.
                            </td>
                          </tr>
                        );
                      }

                      return list.map(mvt => (
                        <tr key={mvt.id} className="hover:bg-gray-50">
                          <td className="px-5 py-3 font-mono text-gray-400 whitespace-nowrap">{mvt.date}</td>
                          <td className="px-5 py-3 font-bold text-gray-950">{mvt.ingredientName}</td>
                          <td className="px-5 py-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                              mvt.type === 'IN' || mvt.type === 'ADJUST_PLUS' ? 'bg-emerald-50 text-emerald-800' :
                              mvt.type === 'SALE' ? 'bg-gray-100 text-gray-700' : 'bg-red-50 text-red-800'
                            }`}>
                              {mvt.type === 'IN' ? 'Entrée' : mvt.type === 'OUT' ? 'Sortie Perte' :
                               mvt.type === 'ADJUST_PLUS' ? 'Ajust. Positif' : mvt.type === 'ADJUST_MINUS' ? 'Ajust. Négatif' :
                               mvt.type === 'SALE' ? 'Dim. Vente POS' : 'Restauration Annul.'}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right font-mono">
                            <span className={mvt.quantity > 0 ? 'text-green-600' : 'text-red-500'}>
                              {mvt.quantity > 0 ? '+' : ''}{mvt.quantity.toFixed(1)}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right font-mono text-gray-905">{Math.round(mvt.value || 0).toLocaleString()} FCFA</td>
                          <td className="px-5 py-3 font-mono text-gray-500">{mvt.reference}</td>
                          <td className="px-5 py-3 text-gray-550">{mvt.userName}</td>
                          <td className="px-5 py-3 text-gray-500 font-normal italic">{mvt.comment || '--'}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PHYSICAL INVENTORIES SHEETS LOGS */}
          {activeStockTab === 'INVENTORY_AUDIT' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-white p-4 rounded-lg border">
                <span className="text-xs text-gray-500">Derniers rapports de pointages réels complétés dans l'ERP :</span>
                <button
                  id="stock-inventory-audit-launcher-btn"
                  onClick={handleStartInventoryAudit}
                  className="px-4 py-2 bg-[#1E4E8C] hover:bg-blue-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nouveau Pointage</span>
                </button>
              </div>

              <div className="space-y-4">
                {tenantInventories.map(inv => (
                  <div key={inv.id} className="bg-white border rounded-lg p-5 shadow-2xs space-y-3">
                    <div className="flex justify-between items-center text-xs border-b pb-2.5">
                      <div className="font-semibold text-gray-900">
                        Rapport d'inventaire physique du <span className="text-[#1E4E8C] font-mono font-bold">{inv.date}</span>
                      </div>
                      <div className="text-gray-500">
                        Compté par : <strong className="text-gray-800">{inv.userName}</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-xs">
                      {inv.lines.filter(l => l.gap !== 0).map(line => (
                        <div key={line.ingredientId} className="bg-gray-50 p-2.5 rounded border border-gray-150 relative">
                          <span className="text-[10px] uppercase text-gray-500 block truncate font-bold">{line.ingredientName}</span>
                          <span className="font-mono text-gray-900 block mt-1">Réel: {line.realQty} / Th: {line.theoreticalQty}</span>
                          <span className={`absolute top-2 right-2 px-1 font-mono text-[10px] font-bold rounded ${
                            line.gap > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {line.gap > 0 ? '+' : ''}{line.gap}
                          </span>
                        </div>
                      ))}

                      {inv.lines.filter(l => l.gap !== 0).length === 0 && (
                        <p className="text-xs text-emerald-700 italic col-span-full">Ecarts d'inventaires nul ! Parfait accord entre système théorique et stock réel.</p>
                      )}
                    </div>
                  </div>
                ))}

                {tenantInventories.length === 0 && (
                  <div className="bg-white py-16 text-center border text-gray-500 rounded-lg">
                    <ClipboardList className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm">Aucune feuille d'inventaire archivée pour l'instant</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeStockTab === 'LOTS_TRACEABILITY' && (
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Registre des Lots d'Ingrédients & DLC</h4>
                  <p className="text-xs text-gray-500">
                    Suivi analytique de la traçabilité des lots et des dates de péremption pour la sécurité et la conformité d'hygiène alimentaire.
                  </p>
                </div>
                <div className="text-right text-xs">
                  <span className="font-bold text-[#1E4E8C] font-mono bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                    Date du Jour : 18 Juin 2026 (Système)
                  </span>
                </div>
              </div>

              {/* TRACEABILITY FILTERS */}
              <div className="flex flex-col md:flex-row gap-3 bg-white p-3 rounded-lg border border-gray-150 text-xs">
                <div className="flex-1">
                  <input
                    type="text"
                    value={traceSearch}
                    onChange={(e) => setTraceSearch(e.target.value)}
                    placeholder="🔍 Filtrer par nom d'ingrédient ou n° de lot..."
                    className="w-full p-2 border rounded bg-white text-gray-800 font-semibold"
                  />
                </div>
                <div className="w-full md:w-56">
                  <select
                    value={traceStatus}
                    onChange={(e) => setTraceStatus(e.target.value)}
                    className="w-full p-2 border rounded bg-white text-gray-800 font-bold"
                  >
                    <option value="ALL">Sécurité hygiène : Tous les lots</option>
                    <option value="PERIME">🚨 Périmés (DLC dépassée)</option>
                    <option value="URGENT">{"⚠️ Alerte (DLC proche <= 5j)"}</option>
                    <option value="SAIN">🟢 Sain (Conforme)</option>
                  </select>
                </div>
              </div>

              <div className="bg-white border rounded-lg overflow-hidden shadow-2xs">
                <table className="w-full text-xs text-left text-gray-650 font-sans font-medium">
                  <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 border-b uppercase">
                    <tr>
                      <th className="px-5 py-3">Ingrédient</th>
                      <th className="px-5 py-3">N° de Lot (Traceability)</th>
                      <th className="px-5 py-3">Date de Réception</th>
                      <th className="px-5 py-3 text-right">Quantité En Lot</th>
                      <th className="px-5 py-3 text-center">Unité</th>
                      <th className="px-5 py-3">Date de Péremption</th>
                      <th className="px-5 py-3 text-center">Statut Fraîcheur / DLC</th>
                      <th className="px-5 py-3 text-right">Actions / Valorisation Perte</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y font-semibold text-gray-700">
                    {(() => {
                      const getDaysLeft = (expiryDateStr: string) => {
                        const today = new Date('2026-06-18');
                        const exp = new Date(expiryDateStr);
                        const diffTime = exp.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return diffDays;
                      };

                      const filteredBatches = (stockBatches || []).filter(b => b.tenantId === tenantId).filter(batch => {
                        const sQuery = traceSearch.toLowerCase().trim();
                        const matchesSearch = !sQuery || batch.ingredientName.toLowerCase().includes(sQuery) || batch.batchNum.toLowerCase().includes(sQuery);
                        
                        const daysLeft = getDaysLeft(batch.expiryDate);
                        let matchesStatus = true;
                        if (traceStatus === 'PERIME') {
                          matchesStatus = daysLeft <= 0;
                        } else if (traceStatus === 'URGENT') {
                          matchesStatus = daysLeft > 0 && daysLeft <= 5;
                        } else if (traceStatus === 'SAIN') {
                          matchesStatus = daysLeft > 5;
                        }

                        return matchesSearch && matchesStatus;
                      });
                      
                      if (filteredBatches.length === 0) {
                        return (
                          <tr>
                            <td colSpan={8} className="py-20 text-center text-gray-400 font-normal italic">
                              Aucun lot de stock ne correspond aux critères de recherche.
                            </td>
                          </tr>
                        );
                      }

                      return filteredBatches.map(batch => {
                        const daysLeft = getDaysLeft(batch.expiryDate);
                        let badgeColor = "bg-green-100 text-green-800 border border-green-200";
                        let statusText = `Encore ${daysLeft} jours`;
                        
                        if (daysLeft <= 0) {
                          badgeColor = "bg-red-100 text-red-800 border border-red-200 animate-pulse font-bold";
                          statusText = "DÉPASSÉ (PÉRIMÉ) !";
                        } else if (daysLeft <= 5) {
                          badgeColor = "bg-amber-100 text-amber-800 border border-amber-200 font-bold";
                          statusText = `Urgent (DLC J-${daysLeft})`;
                        }

                        const parentIng = ingredients.find(i => i.id === batch.ingredientId);
                        const cmpPrice = parentIng ? (parentIng.cmp || parentIng.lastPurchasePrice || 0) : 0;
                        const lotTotalValuation = batch.quantity * cmpPrice;

                        return (
                          <tr key={batch.id} className="hover:bg-gray-50">
                            <td className="px-5 py-3.5 text-gray-900 font-bold">{batch.ingredientName}</td>
                            <td className="px-5 py-3.5 font-mono text-gray-650">{batch.batchNum}</td>
                            <td className="px-5 py-3.5 text-gray-500">{batch.dateReceived}</td>
                            <td className="px-5 py-3.5 text-right font-mono font-bold text-[#1E4E8C]">
                              {batch.quantity.toLocaleString()}
                            </td>
                            <td className="px-5 py-3.5 text-center text-gray-550">{batch.unit}</td>
                            <td className="px-5 py-3.5 text-gray-950 font-mono font-bold">{batch.expiryDate}</td>
                            <td className="px-5 py-3.5 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${badgeColor}`}>
                                {statusText}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right font-semibold">
                              <div className="flex flex-col items-end gap-1.5 justify-center">
                                {batch.lossDeclared && (
                                  <div className="bg-red-50 text-red-700 p-1.5 rounded border border-red-205 text-[10px] max-w-[260px] text-left leading-relaxed shadow-3xs">
                                    <div className="font-extrabold flex items-center gap-1 uppercase text-[8.5px] text-red-800 tracking-wider">
                                      <span>📉 Perte Constatée & Validée</span>
                                    </div>
                                    <p className="mt-0.5">Montant : <strong className="font-mono font-black">{batch.lossAmount?.toLocaleString()} F</strong></p>
                                    <p className="text-[9px] text-gray-400 mt-0.2">Quantité perdue: {batch.lossQty} {batch.unit} (par {batch.lossValidatedBy})</p>
                                    {batch.lossComment && (
                                      <p className="text-[9px] italic text-rose-600 mt-0.5 leading-tight" title={batch.lossComment}>
                                        💡 {batch.lossComment}
                                      </p>
                                    )}
                                  </div>
                                )}
                                
                                {batch.quantity > 0 ? (
                                  <button
                                    onClick={() => {
                                      setSelectedLossBatch(batch);
                                      setLossQtyInput(batch.quantity);
                                      setLossCommentInput(daysLeft <= 0 ? 'Lot périmé dépassé (DLC)' : 'Avarie d’exploitation');
                                      setLossReasonType(daysLeft <= 0 ? 'DLC_PERIME' : 'ACCIDENT_CUISINE');
                                    }}
                                    className={`px-2.5 py-1 text-[10px] rounded transition font-black uppercase flex items-center gap-1 cursor-pointer ${
                                      daysLeft <= 0 
                                        ? 'bg-red-650 text-white hover:bg-red-700 border border-red-700 shadow-xs' 
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'
                                    }`}
                                  >
                                    {daysLeft <= 0 ? '🚨 Valider Coût Perte' : 'Déclarer Perte'}
                                    <span className="font-mono font-bold pl-0.5">({lotTotalValuation.toLocaleString()} F)</span>
                                  </button>
                                ) : (
                                  !batch.lossDeclared && (
                                    <span className="text-[10px] text-gray-400 italic">Lot entièrement consommé</span>
                                  )
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ADD/MINUS MANUAL MOVEMENT DRAWER MODAL */}
      {showAddMvtModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 border shadow-2xl relative">
            <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b flex items-center gap-1.5">
              <span>Nouveau Mouvement de Stock Manuel</span>
            </h3>

            <div className="space-y-3.5 text-xs text-gray-700">
              <div className="space-y-1">
                <label className="text-gray-650 block">Sélectionnez l'ingrédient *</label>
                <select
                  id="manual-mvt-ing-select"
                  value={mvtIngId}
                  onChange={(e) => setMvtIngId(e.target.value)}
                  className="w-full p-2 border border-gray-250 bg-white rounded text-gray-805 text-xs"
                >
                  <option value="">-- Choisir composant --</option>
                  {tenantIngredients.map(ing => (
                    <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-gray-650 block">Type d'opération interne *</label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => setMvtType('IN')}
                    className={`py-1.5 text-xs rounded border font-semibold ${mvtType === 'IN' ? 'bg-[#1E4E8C] text-white border-transparent' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                  >
                    Entrée Plus (+)
                  </button>
                  <button
                    onClick={() => setMvtType('OUT')}
                    className={`py-1.5 text-xs rounded border font-semibold ${mvtType === 'OUT' ? 'bg-[#1E4E8C] text-white border-transparent' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                  >
                    Sortie Perte (-)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-650 block">Quantité physique *</label>
                  <input
                    id="manual-mvt-qty-input"
                    type="number"
                    step={0.1}
                    value={mvtQty || ''}
                    onChange={(e) => setMvtQty(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-gray-250 rounded text-gray-950 text-xs focus:ring-1"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-650 block">Coût estimé / Unit.</label>
                  <input
                    id="manual-mvt-cost-input"
                    type="number"
                    placeholder="CMP par défaut"
                    value={mvtCost || ''}
                    onChange={(e) => setMvtCost(parseInt(e.target.value) || 0)}
                    className="w-full p-2 border border-gray-250 rounded text-gray-950 text-xs focus:ring-1"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-650 block">Référence document (ex: BL-409, PERTE-88) *</label>
                <input
                  id="manual-mvt-ref-input"
                  type="text"
                  placeholder="ex: AJUST-JUIN..."
                  value={mvtRef}
                  onChange={(e) => setMvtRef(e.target.value)}
                  className="w-full p-2 border border-gray-250 rounded text-gray-950 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-650 block">Commentaire / Justification</label>
                <textarea
                  id="manual-mvt-comment-input"
                  rows={2}
                  placeholder="Justifiez le motif de l'ajustement de stock..."
                  value={mvtComment}
                  onChange={(e) => setMvtComment(e.target.value)}
                  className="w-full p-2 border border-blue-200 rounded text-gray-950 text-xs focus:outline-none focus:ring-1"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-5 pt-3 border-t">
              <button
                id="cancel-manual-mvt-btn"
                onClick={() => setShowAddMvtModal(false)}
                className="px-4 py-2 bg-gray-100 rounded text-gray-700 hover:bg-gray-200 text-xs"
              >
                Annuler
              </button>
              <button
                id="submit-manual-mvt-btn"
                onClick={handleCreateManualMovement}
                className="px-4 py-2 bg-[#1E4E8C] text-white font-bold rounded hover:bg-blue-800 text-xs"
              >
                Inscrire mouvement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DECLARE STOCK LOSS MODAL */}
      {selectedLossBatch && (() => {
        const parentIng = ingredients.find(i => i.id === selectedLossBatch.ingredientId);
        const unitPrice = parentIng ? (parentIng.cmp || parentIng.lastPurchasePrice || 0) : 0;
        const liveComputedLossAmount = (lossQtyInput || 0) * unitPrice;

        return (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
            <div className="bg-white rounded-xl max-w-md w-full p-6 border shadow-2xl relative">
              {/* Close Button */}
              <button 
                onClick={() => setSelectedLossBatch(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100">
                <div className="bg-red-50 p-2 rounded-lg text-red-650">
                  <TrendingDown className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-950 uppercase tracking-wide">
                    Validation Perte Financière
                  </h3>
                  <p className="text-[10px] text-gray-400 font-bold font-mono">Lot: {selectedLossBatch.batchNum}</p>
                </div>
              </div>

              <div className="space-y-4 text-xs text-gray-700">
                {/* Info Card */}
                <div className="bg-slate-50 border border-slate-200/60 rounded-lg p-3 space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Ingrédient :</span>
                    <strong className="text-gray-900 font-black">{selectedLossBatch.ingredientName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Quantité disponible en lot :</span>
                    <strong className="text-[#1E4E8C] font-mono">{selectedLossBatch.quantity} {selectedLossBatch.unit}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Coût Unitaire (CMP) :</span>
                    <strong className="text-gray-950 font-mono">{unitPrice.toLocaleString()} F / {selectedLossBatch.unit}</strong>
                  </div>
                </div>

                {/* Input Fields */}
                <div className="space-y-1.5">
                  <label className="text-gray-650 font-black block text-[10px] uppercase tracking-wider">
                    Quantité à déclarer en perte ({selectedLossBatch.unit}) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedLossBatch.quantity}
                    value={lossQtyInput || ''}
                    onChange={(e) => setLossQtyInput(Math.min(selectedLossBatch.quantity, Math.max(0, parseFloat(e.target.value) || 0)))}
                    className="w-full p-2.5 border border-red-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 font-semibold text-gray-950 rounded-lg text-sm"
                  />
                  <p className="text-[10px] text-gray-450 italic">
                    Saisissez la quantité gaspillée ou expirée à détruire. Maximum: {selectedLossBatch.quantity}
                  </p>
                </div>

                {/* Live Cost Area */}
                <div className="bg-red-50/65 border border-red-150 rounded-xl p-3 text-center">
                  <span className="text-[9px] uppercase tracking-widest font-black text-red-800">
                    📉 VALEUR FINANCIÈRE DE LA PERTE
                  </span>
                  <div className="text-lg font-mono font-black text-red-650 mt-1">
                    -{liveComputedLossAmount.toLocaleString()} FCFA
                  </div>
                  <p className="text-[9.5px] text-gray-500 mt-1">
                    Cette somme sera immédiatement intégrée comme coût opérationnel de perte dans le <strong>Bilan Cockpit</strong> et déduite de la balance des stocks.
                  </p>
                </div>

                {/* Reason Selection */}
                <div className="space-y-1.5">
                  <label className="text-gray-650 font-black block text-[10px] uppercase tracking-wider">
                    Motif / Origine de la perte *
                  </label>
                  <select
                    value={lossReasonType}
                    onChange={(e) => setLossReasonType(e.target.value)}
                    className="w-full p-2.5 border border-[#1E4E8C]/20 rounded-lg bg-white font-semibold text-gray-950 focus:border-[#1E4E8C] focus:ring-1 text-xs"
                  >
                    <option value="DLC_PERIME">🚨 Péremption / DLC Dépassée</option>
                    <option value="PANNE_COURANT">🔌 Coupure de courant / Rupture chaîne du froid</option>
                    <option value="ACCIDENT_CUISINE">🍳 Accident de cuisine / Casse / Renversement</option>
                    <option value="ALTERATION_QUALITE">🦠 Altération qualité / Produit moisi</option>
                    <option value="AVARIE_TRANSPORT">🚛 Avarie durant le transport / Livraison</option>
                    <option value="VOL_ECART">🔍 Vol ou écart d'inventaire constaté</option>
                    <option value="AUTRE">❓ Autre motif exceptionnel / Force majeure</option>
                  </select>
                </div>

                {/* Comments Field */}
                <div className="space-y-1.5">
                  <label className="text-gray-650 font-black block text-[10px] uppercase tracking-wider">
                    Détails ou Précisions *
                  </label>
                  <textarea
                    rows={2}
                    placeholder="ex: coupure prolongée, cuisinière brisée, lot endommagé..."
                    value={lossCommentInput}
                    onChange={(e) => setLossCommentInput(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-lg bg-white font-medium text-gray-950 focus:outline-none focus:ring-1"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end mt-5 pt-3 border-t border-gray-100">
                <button
                  onClick={() => setSelectedLossBatch(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-xs uppercase"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveLoss}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-lg text-xs uppercase shadow-sm flex items-center gap-1 cursor-pointer"
                >
                  📉 Confirmer & Déduire
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
