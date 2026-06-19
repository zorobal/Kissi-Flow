/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  TrendingUp,
  Target,
  UtensilsCrossed,
  ChefHat,
  Users,
  Coins,
  ArrowRight,
  TrendingDown,
  Percent,
  CheckCircle,
  HelpCircle,
  Clock,
  Briefcase,
  DollarSign,
  Plus,
  Trash2,
  FileSpreadsheet,
  AlertCircle,
  Search,
  Download
} from 'lucide-react';
import { Ingredient, Order, StockMovement } from '../types';

interface PrestationsViewProps {
  tenantId: string;
  ingredients: Ingredient[];
  orders: Order[];
  onUpdateIngredients: (ings: Ingredient[]) => void;
  onAddStockMovement?: (mov: any) => void;
  logsAction: (action: string, module: string) => void;
}

// Interfaces for our custom operational models
interface RevenueGoal {
  id: string;
  date: string;
  targetAmount: number;
  description: string;
  reminderFrequency?: 'DAILY' | 'APPROACHING' | 'URGENT';
}

interface BuffetProject {
  id: string;
  title: string;
  date: string;
  additionalCharges: number; // costs like decoration, temporary staff
  costPerPlate: number; // calculated raw materials + cost of others
  pricePerPlateSold: number; // selling price per plate
  platesExpected: number;
  platesRealSold: number;
  ingredientsSelected: { ingredientId: string; quantity: number; cost: number }[];
  status?: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  cancelReason?: string;
  reminderFrequency?: 'DAILY' | 'APPROACHING' | 'URGENT';
}

interface CateringContract {
  id: string;
  clientName: string;
  date: string;
  platesRequested: number;
  proposedPrice: number; // what client pays for the whole service
  estimatedCost: number; // staff + transport + ingredients
  actualCost: number; // real spent
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  cancelReason?: string;
  reminderFrequency?: 'DAILY' | 'APPROACHING' | 'URGENT';
}

export default function PrestationsView({
  tenantId,
  ingredients,
  orders,
  onUpdateIngredients,
  onAddStockMovement,
  logsAction
}: PrestationsViewProps) {
  const [activeSubSection, setActiveSubSection] = useState<'GOALS' | 'BUFFET' | 'CATERING'>('GOALS');
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [showSummaryTable, setShowSummaryTable] = useState(false);
  const [closingContractId, setClosingContractId] = useState<string | null>(null);
  const [closingCost, setClosingCost] = useState<number>(0);
  const [cancellingContractId, setCancellingContractId] = useState<string | null>(null);
  const [cancellingBuffetId, setCancellingBuffetId] = useState<string | null>(null);
  const [cancelReasonText, setCancelReasonText] = useState<string>('');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 1. REVENUE GOALS STATE
  const [goals, setGoals] = useState<RevenueGoal[]>(() => {
    try {
      const saved = localStorage.getItem(`kissine-goals-${tenantId}`);
      return saved ? JSON.parse(saved) : [
        { id: 'g-1', date: '2026-06-18', targetAmount: 1500000, description: 'Objectif Standard Journalier' }
      ];
    } catch {
      return [];
    }
  });

  const saveGoals = (newGoals: RevenueGoal[]) => {
    setGoals(newGoals);
    localStorage.setItem(`kissine-goals-${tenantId}`, JSON.stringify(newGoals));
  };

  // Temporary inputs for new Goals
  const [goalDate, setGoalDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [goalAmount, setGoalAmount] = useState<number>(1000000);
  const [goalDesc, setGoalDesc] = useState('');
  const [goalReminderFrequency, setGoalReminderFrequency] = useState<'DAILY' | 'APPROACHING' | 'URGENT'>('DAILY');

  const handleAddGoal = () => {
    if (!goalDate) {
      showToast("Veuillez sélectionner une date cible", "error");
      return;
    }
    if (goalAmount <= 0) {
      showToast("Le montant cible doit être supérieur à 0", "error");
      return;
    }
    const newGoal: RevenueGoal = {
      id: `goal-${Date.now()}`,
      date: goalDate,
      targetAmount: goalAmount,
      description: goalDesc.trim() || 'Objectif de ventes',
      reminderFrequency: goalReminderFrequency
    };
    const updated = [...goals, newGoal];
    saveGoals(updated);
    logsAction(`Création d'un objectif de CA de ${goalAmount} FCFA pour le ${goalDate}`, 'PRESTATIONS');
    showToast("Objectif de chiffre d'affaires sauvegardé !", "success");
    setGoalDesc('');
  };

  const handleDeleteGoal = (id: string) => {
    const updated = goals.filter(g => g.id !== id);
    saveGoals(updated);
    showToast("Objectif supprimé.", "success");
  };

  // Utility to fetch actual POS validated sales (TTC) for a specific date
  const getActualSalesForDate = (dateStr: string) => {
    const dayOrders = orders.filter(
      o => o.tenantId === tenantId &&
      o.date === dateStr &&
      (o.status === 'VALIDATED' || o.status === 'CLOSED')
    );
    return dayOrders.reduce((sum, o) => sum + o.total, 0);
  };


  // 2. BUFFETS STATE
  const [buffets, setBuffets] = useState<BuffetProject[]>(() => {
    try {
      const saved = localStorage.getItem(`kissine-buffets-${tenantId}`);
      return saved ? JSON.parse(saved) : [
        {
          id: 'b-demo',
          title: 'Grande Réception Ministérielle',
          date: '2026-06-25',
          additionalCharges: 150000,
          pricePerPlateSold: 12500,
          platesExpected: 100,
          platesRealSold: 85,
          ingredientsSelected: [
            { ingredientId: 'ing-pou', quantity: 25, cost: 55000 },
            { ingredientId: 'ing-pla', quantity: 40, cost: 32000 }
          ],
          costPerPlate: 0 // Will auto calculate
        }
      ];
    } catch {
      return [];
    }
  });

  const saveBuffets = (newBuffets: BuffetProject[]) => {
    setBuffets(newBuffets);
    localStorage.setItem(`kissine-buffets-${tenantId}`, JSON.stringify(newBuffets));
  };

  // Buffet Form Fields
  const [buffetTitle, setBuffetTitle] = useState('');
  const [buffetDate, setBuffetDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [buffetCharges, setBuffetCharges] = useState<number>(0);
  const [buffetPricePlate, setBuffetPricePlate] = useState<number>(0);
  const [buffetPlatesExpected, setBuffetPlatesExpected] = useState<number>(0);
  const [buffetPlatesSold, setBuffetPlatesSold] = useState<number>(0);
  const [buffetReminderFrequency, setBuffetReminderFrequency] = useState<'DAILY' | 'APPROACHING' | 'URGENT'>('DAILY');

  // Selected ingredients during buffet configuration
  const [activeIngredients, setActiveIngredients] = useState<{ ingredientId: string; quantity: number }[]>([]);
  const [selectedIngId, setSelectedIngId] = useState('');
  const [selectedIngQty, setSelectedIngQty] = useState<number>(1);

  const handleAddIngredientToBuffet = () => {
    if (!selectedIngId) return;
    const ing = ingredients.find(i => i.id === selectedIngId);
    if (!ing) return;

    if (selectedIngQty <= 0) {
      showToast("La quantité doit être supérieure à 0", "error");
      return;
    }

    // Check if food stock is available
    const activeStock = ing.stockActual || 0;
    if (activeStock <= 0) {
      showToast(`Sélection bloquée : L'ingrédient ${ing.name} est en rupture de stock !`, "error");
      return;
    }

    // Calculate total requested quantity if already added to list
    const existsIdx = activeIngredients.findIndex(item => item.ingredientId === selectedIngId);
    let totalRequestedQty = selectedIngQty;
    if (existsIdx >= 0) {
      totalRequestedQty += activeIngredients[existsIdx].quantity;
    }

    if (activeStock < totalRequestedQty) {
      showToast(`Sélection bloquée : Stock insuffisant pour ${ing.name} ! (Stock : ${activeStock} ${ing.unit}, demandé en cumulé : ${totalRequestedQty} ${ing.unit})`, "error");
      return;
    }

    // Add or merge safely
    if (existsIdx >= 0) {
      const updated = [...activeIngredients];
      updated[existsIdx].quantity = totalRequestedQty;
      setActiveIngredients(updated);
    } else {
      setActiveIngredients([...activeIngredients, { ingredientId: selectedIngId, quantity: selectedIngQty }]);
    }

    setSelectedIngId('');
    setSelectedIngQty(1);
    showToast("Ingrédient ajouté au devis de buffet avec succès !", "success");
  };

  const handleRemoveIngFromBuffet = (idx: number) => {
    setActiveIngredients(activeIngredients.filter((_, i) => i !== idx));
  };

  const handleCreateBuffet = () => {
    if (!buffetTitle.trim()) {
      showToast("Veuillez saisir un titre de buffet", "error");
      return;
    }
    if (!buffetDate) {
      showToast("Veuillez choisir une date", "error");
      return;
    }
    if (buffetPricePlate <= 0) {
      showToast("Veuillez saisir un prix de revente par plat", "error");
      return;
    }
    if (buffetPlatesExpected <= 0) {
      showToast("Veuillez spécifier un nombre de plats attendu", "error");
      return;
    }

    // 💡 ULTRA SECURE BLOCK: Final validation verify all stocks are sufficient before recording anything
    const outOfStockNames: string[] = [];
    activeIngredients.forEach(item => {
      const ing = ingredients.find(i => i.id === item.ingredientId);
      const stock = ing ? (ing.stockActual || 0) : 0;
      if (stock < item.quantity) {
        outOfStockNames.push(`${ing ? ing.name : 'Inconnu'} (requis: ${item.quantity}, en stock: ${stock})`);
      }
    });

    if (outOfStockNames.length > 0) {
      showToast(`Enregistrement annulé ! Ingrédients insuffisants ou en rupture de stock : ${outOfStockNames.join(', ')}`, "error");
      return;
    }

    // Map ingredients to compute individual item costs
    const ingredientsSelected = activeIngredients.map(item => {
      const ing = ingredients.find(i => i.id === item.ingredientId);
      const unitCost = ing ? (ing.cmp || ing.lastPurchasePrice || 0) : 0;
      return {
        ingredientId: item.ingredientId,
        quantity: item.quantity,
        cost: Math.round(item.quantity * unitCost)
      };
    });

    const newBuffet: BuffetProject = {
      id: `buffet-${Date.now()}`,
      title: buffetTitle.trim(),
      date: buffetDate,
      additionalCharges: buffetCharges,
      pricePerPlateSold: buffetPricePlate,
      platesExpected: buffetPlatesExpected,
      platesRealSold: buffetPlatesSold || 0,
      ingredientsSelected,
      costPerPlate: 0, // calculated in render dynamically
      status: 'CONFIRMED',
      reminderFrequency: buffetReminderFrequency
    };

    // DECOUPLE & SUBTRACT STOCK: Deduct selected ingredients from inventories & generate stock movements!
    let ingredientsUpdated = [...ingredients];
    ingredientsSelected.forEach(item => {
      const targetIng = ingredientsUpdated.find(i => i.id === item.ingredientId);
      if (targetIng) {
        const oldStock = targetIng.stockActual || 0;
        targetIng.stockActual = Math.max(0, oldStock - item.quantity);

        // Generate dynamic stock movement
        if (onAddStockMovement) {
          onAddStockMovement({
            id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            ingredientId: item.ingredientId,
            type: 'SORTIE',
            quantity: item.quantity,
            date: buffetDate,
            reason: `Prélèvement Buffet - ${buffetTitle}`,
            reference: `BUFFET-${newBuffet.id.slice(-4).toUpperCase()}`,
            tenantId
          });
        }
      }
    });

    // Save updated stock state
    onUpdateIngredients(ingredientsUpdated);

    saveBuffets([...buffets, newBuffet]);
    logsAction(`Création d'un buffet "${buffetTitle}" de ${buffetPlatesExpected} personnes et déstockage ingrédient(s)`, 'PRESTATIONS');
    showToast("Buffet plannifié et ingrédients déstockés avec succès !", "success");

    // Clear Form
    setBuffetTitle('');
    setBuffetCharges(0);
    setBuffetPricePlate(0);
    setBuffetPlatesExpected(0);
    setBuffetPlatesSold(0);
    setActiveIngredients([]);
  };

  const handleDeleteBuffet = (id: string, titleStr: string) => {
    const updated = buffets.filter(b => b.id !== id);
    saveBuffets(updated);
    logsAction(`Suppression du projet Buffet : ${titleStr}`, 'PRESTATIONS');
    showToast("Buffet supprimé.", "success");
  };

  const handleUpdateBuffetRealClients = (id: string, realClients: number) => {
    const updated = buffets.map(b => {
      if (b.id === id) {
        return {
          ...b,
          platesRealSold: realClients,
          status: 'COMPLETED' as const
        };
      }
      return b;
    });
    saveBuffets(updated);
    showToast("Buffet validé et clôturé avec succès !", "success");
    logsAction(`Validation des clients réels (${realClients}) et clôture du buffet ${id}`, 'PRESTATIONS');
  };

  const handleUpdateBuffetStatus = (
    id: string,
    newStatus: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED',
    realClients?: number,
    cancelReason?: string
  ) => {
    const updated = buffets.map(b => {
      if (b.id === id) {
        return {
          ...b,
          status: newStatus,
          platesRealSold: realClients !== undefined ? realClients : b.platesRealSold,
          cancelReason: cancelReason !== undefined ? cancelReason : b.cancelReason
        };
      }
      return b;
    });
    saveBuffets(updated);
    logsAction(`Transition statut de buffet ${id} vers ${newStatus}${cancelReason ? ` (Raison: ${cancelReason})` : ''}`, 'PRESTATIONS');
    showToast(`Statut de buffet mis à jour vers ${newStatus === 'COMPLETED' ? 'Terminé' : newStatus === 'CANCELLED' ? 'Annulé' : newStatus} !`, "success");
  };

  const handleExportTextIndicators = () => {
    // Collect all data
    const activeGoals = goals.filter(g => {
      const matchesSearch = g.description.toLowerCase().includes(searchQuery.toLowerCase()) || g.date.includes(searchQuery);
      const matchesDate = !searchDate || g.date === searchDate;
      return matchesSearch && matchesDate;
    });

    const activeBuffets = buffets.filter(b => {
      const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) || b.date.includes(searchQuery);
      const matchesDate = !searchDate || b.date === searchDate;
      return matchesSearch && matchesDate;
    });

    const activeCatering = cateringContracts.filter(c => {
      const matchesSearch = c.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || c.date.includes(searchQuery);
      const matchesDate = !searchDate || c.date === searchDate;
      return matchesSearch && matchesDate;
    });

    let text = `================================================================================
          RAPPORT DES PRESTATIONS & OBJECTIFS COMMERCIAUX - KISSINE FLOW
================================================================================
Généré le: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')} (Heure locale)
Restauration ID: ${tenantId}

Filtre Actuel:
* Recherche par intitulé: ${searchQuery || 'Aucun'}
* Date filtrée: ${searchDate || 'Toutes les dates'}

--------------------------------------------------------------------------------
1. OBJECTIFS FINANCIERS DE VENTE JOURNALIERE
--------------------------------------------------------------------------------
Nombre de cibles enregistrées: ${activeGoals.length}

${activeGoals.map((g, idx) => {
  const actualVal = getActualSalesForDate(g.date);
  const ratio = g.targetAmount > 0 ? (actualVal / g.targetAmount) * 100 : 0;
  return `[#${idx + 1}] Date: ${g.date} - Intitule: ${g.description}
  * CA Cible visé : ${g.targetAmount.toLocaleString()} FCFA
  * CA Réel encaissé : ${actualVal.toLocaleString()} FCFA
  * Taux de réalisation : ${ratio.toFixed(2)} %
  * Écart : ${(actualVal - g.targetAmount).toLocaleString()} FCFA (${actualVal >= g.targetAmount ? 'SUCCESS: ATTEINT' : 'MANQUE'})`;
}).join('\n\n')}

--------------------------------------------------------------------------------
2. GESTION ANALYTIQUE DES BUFFETS D'ENTREPRISE
--------------------------------------------------------------------------------
Nombre de buffets listés: ${activeBuffets.length}

${activeBuffets.map((b, idx) => {
  const ingCost = b.ingredientsSelected.reduce((sum, item) => sum + (item.cost || 0), 0);
  const totalCost = ingCost + b.additionalCharges;
  const caReal = b.platesRealSold * b.pricePerPlateSold;
  const expectedTurnover = b.platesExpected * b.pricePerPlateSold;
  const realProfit = caReal - totalCost;
  return `[#${idx + 1}] Buffet: ${b.title} (Le ${b.date})
  * Prix unitaire d'entrée par client : ${b.pricePerPlateSold.toLocaleString()} FCFA
  * Volume de clients : ${b.platesRealSold} réels / ${b.platesExpected} attendus
  * Coût global du Buffet : ${totalCost.toLocaleString()} FCFA (Matière: ${ingCost.toLocaleString()} FCFA, Annexes: ${b.additionalCharges.toLocaleString()} FCFA)
  * CA récolté en Caisse : ${caReal.toLocaleString()} FCFA (Attendu: ${expectedTurnover.toLocaleString()} FCFA)
  * Bénéfice Réel de l'événement : ${realProfit.toLocaleString()} FCFA`;
}).join('\n\n')}

--------------------------------------------------------------------------------
3. CONTRATS DE SERVICE TRAITEUR AUTONOME
--------------------------------------------------------------------------------
Nombre total de prestations de banquet: ${activeCatering.length}

${activeCatering.map((c, idx) => {
  const actProfit = c.status === 'COMPLETED' ? (c.proposedPrice - (c.actualCost || c.estimatedCost)) : (c.proposedPrice - c.estimatedCost);
  return `[#${idx + 1}] Client: ${c.clientName} (Prévu le: ${c.date})
  * Statut du contrat : ${c.status}
  * Budget global proposé : ${c.proposedPrice.toLocaleString()} FCFA (Plats requis: ${c.platesRequested})
  * Coût de revient estimé : ${c.estimatedCost.toLocaleString()} FCFA
  * Coût réel consigné : ${c.actualCost > 0 ? `${c.actualCost.toLocaleString()} FCFA` : 'Non clôturé'}
  * Bénéfice estimé/réel : ${actProfit.toLocaleString()} FCFA`;
}).join('\n\n')}

================================================================================
                   Kissine Flow - Intelligence & Pilotage CHR
================================================================================`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `KissineFlow_Prestations_Objectifs_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Indicateurs des prestations exportés en format texte !", "success");
  };


  // 3. CATERING STATE
  const [cateringContracts, setCateringContracts] = useState<CateringContract[]>(() => {
    try {
      const saved = localStorage.getItem(`kissine-catering-${tenantId}`);
      return saved ? JSON.parse(saved) : [
        {
          id: 'c-demo',
          clientName: 'Banquet de Mariage SNH',
          date: '2026-07-12',
          platesRequested: 250,
          proposedPrice: 3500000,
          estimatedCost: 1800000,
          actualCost: 1650000,
          status: 'CONFIRMED'
        }
      ];
    } catch {
      return [];
    }
  });

  const saveCatering = (newCatering: CateringContract[]) => {
    setCateringContracts(newCatering);
    localStorage.setItem(`kissine-catering-${tenantId}`, JSON.stringify(newCatering));
  };

  // Catering form fields
  const [catClient, setCatClient] = useState('');
  const [catDate, setCatDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [catPlates, setCatPlates] = useState<number>(0);
  const [catPrice, setCatPrice] = useState<number>(0);
  const [catEstCost, setCatEstCost] = useState<number>(0);
  const [catActCost, setCatActCost] = useState<number>(0);
  const [catStatus, setCatStatus] = useState<'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'>('PENDING');
  const [catReminderFrequency, setCatReminderFrequency] = useState<'DAILY' | 'APPROACHING' | 'URGENT'>('DAILY');

  const handleCreateCatering = () => {
    if (!catClient.trim()) {
      showToast("Veuillez saisir le nom d'un client", "error");
      return;
    }
    if (catPrice <= 0 || catPlates <= 0) {
      showToast("Veuillez remplir correctement les volumes et prix proposés", "error");
      return;
    }

    const newContract: CateringContract = {
      id: `c-contract-${Date.now()}`,
      clientName: catClient.trim(),
      date: catDate,
      platesRequested: catPlates,
      proposedPrice: catPrice,
      estimatedCost: catEstCost || Math.round(catPrice * 0.5), // standard 50% food cost fallback
      actualCost: catActCost || 0,
      status: catStatus,
      reminderFrequency: catReminderFrequency
    };

    saveCatering([...cateringContracts, newContract]);
    logsAction(`Création contrat Traiteur pour ${catClient} - Budget ${catPrice} FCFA`, 'PRESTATIONS');
    showToast("Contrat traiteur enregistré avec succès !", "success");

    // Clear
    setCatClient('');
    setCatPlates(0);
    setCatPrice(0);
    setCatEstCost(0);
    setCatActCost(0);
    setCatStatus('PENDING');
  };

  const handleUpdateCateringStatus = (
    id: string,
    newStatus: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED',
    actCost?: number,
    cancelReason?: string
  ) => {
    const updated = cateringContracts.map(c => {
      if (c.id === id) {
        return {
          ...c,
          status: newStatus,
          actualCost: actCost !== undefined ? actCost : c.actualCost,
          cancelReason: cancelReason !== undefined ? cancelReason : c.cancelReason
        };
      }
      return c;
    });
    saveCatering(updated);
    logsAction(`Transition statut de contrat traiteur ${id} vers ${newStatus}${cancelReason ? ` (Raison: ${cancelReason})` : ''}`, 'PRESTATIONS');
    showToast(`Statut mis à jour vers ${newStatus === 'COMPLETED' ? 'Terminé' : newStatus === 'CANCELLED' ? 'Annulé' : newStatus} !`, "success");
  };

  const handleDeleteCatering = (id: string) => {
    const updated = cateringContracts.filter(c => c.id !== id);
    saveCatering(updated);
    showToast("Contrat supprimé.", "success");
  };

  const filteredGoals = goals.filter(g => {
    const matchesSearch = g.description.toLowerCase().includes(searchQuery.toLowerCase()) || g.date.includes(searchQuery);
    const matchesDate = !searchDate || g.date === searchDate;
    return matchesSearch && matchesDate;
  });

  const filteredBuffets = buffets.filter(b => {
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) || b.date.includes(searchQuery);
    const matchesDate = !searchDate || b.date === searchDate;
    return matchesSearch && matchesDate;
  });

  const filteredCatering = cateringContracts.filter(c => {
    const matchesSearch = c.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || c.date.includes(searchQuery);
    const matchesDate = !searchDate || c.date === searchDate;
    return matchesSearch && matchesDate;
  });


  return (
    <div className="space-y-6 max-w-7xl mx-auto p-1 font-sans selection:bg-indigo-700 selection:text-white" id="prestations-module-root">
      
      {/* Toast Alert Element */}
      {toast && (
        <div className={`fixed top-5 right-5 z-55 flex items-center gap-2 px-4 py-3 rounded-lg shadow-xl border text-xs font-bold transition-all animate-bounce ${
          toast.type === 'success' ? 'bg-indigo-700 text-white border-indigo-500' : 'bg-red-600 text-white border-red-500'
        }`}>
          {toast.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{toast.text}</span>
        </div>
      )}

      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-150 pb-5">
        <div>
          <span className="text-[10px] bg-orange-100 text-orange-700 font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full">Prestations & Objectifs</span>
          <h1 className="text-2xl font-black text-gray-950 uppercase tracking-tight flex items-center gap-2 mt-1">
            <UtensilsCrossed className="h-6 w-6 text-indigo-700" />
            Activités Optionnelles, Buffets & KPI
          </h1>
          <p className="text-xs text-gray-500 font-medium mt-0.5">Planification tactique des buffets d'entreprise, prestations traiteur autonomes et suivi des objectifs journaliers de ventes.</p>
        </div>

        {/* SUB-TABS SELECTOR */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-gray-200">
          <button
            onClick={() => setActiveSubSection('GOALS')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubSection === 'GOALS' ? 'bg-white text-slate-950 shadow-3xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Target className="h-3.5 w-3.5" />
            Objectifs de Vente
          </button>
          <button
            onClick={() => setActiveSubSection('BUFFET')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubSection === 'BUFFET' ? 'bg-white text-slate-950 shadow-3xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <ChefHat className="h-3.5 w-3.5" />
            Gestion des Buffets
          </button>
          <button
            onClick={() => setActiveSubSection('CATERING')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeSubSection === 'CATERING' ? 'bg-white text-slate-950 shadow-3xs' : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Briefcase className="h-3.5 w-3.5" />
            Service Traiteur
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH BAR WITH EXPORT INDICATORS */}
      <div className="bg-white border border-gray-150 rounded-xl overflow-hidden shadow-3xs" id="prestations-filter-and-summary-container">
        <div className="p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex flex-1 flex-col md:flex-row gap-3 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Filtrer par intitulé, description, client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-250 rounded-lg text-xs font-semibold focus:outline-hidden text-gray-900 w-full"
              />
            </div>
            <div className="relative w-full md:w-48">
              <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-250 rounded-lg text-xs font-semibold focus:outline-hidden text-gray-900 font-bold w-full"
              />
            </div>
            {(searchQuery || searchDate) && (
              <button
                onClick={() => { setSearchQuery(''); setSearchDate(''); }}
                className="text-xs text-red-600 font-bold hover:underline cursor-pointer"
              >
                Réinitialiser
              </button>
            )}
          </div>

          {/* Text export and summary show button */}
          <button
            id="prestations-export-indicators-btn"
            onClick={() => {
              handleExportTextIndicators();
              setShowSummaryTable(true);
            }}
            className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Export Texte Indicateurs</span>
          </button>
        </div>

        {/* INTEGRATED SUMMARY TABLE */}
        {showSummaryTable && (
          <div className="p-5 bg-slate-50 border-t border-gray-150 text-xs animate-fade-in space-y-5" id="prestations-summary-table-panel">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="p-1 px-2 bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-sm uppercase">RECAP</span>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Tableau Récapitulatif Analytique des Prestations (Filtres Actifs)
                </h4>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportTextIndicators}
                  className="text-indigo-700 hover:text-indigo-900 font-semibold text-[11px] underline cursor-pointer"
                >
                  Télécharger Rapport (.txt)
                </button>
                <span className="text-gray-350">|</span>
                <button
                  onClick={() => setShowSummaryTable(false)}
                  className="text-gray-500 hover:text-gray-800 font-semibold text-[11px] hover:underline cursor-pointer"
                >
                  Masquer le tableau
                </button>
              </div>
            </div>

            {/* QUICK STATS TOTALS ROWS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Goals stat */}
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <span className="text-[9px] text-gray-400 font-extrabold uppercase block tracking-wider">Cumul Objectifs</span>
                <div className="flex justify-between items-baseline mt-1">
                  <span className="text-xs text-gray-500 font-semibold">Réussis :</span>
                  <span className="text-xs font-black text-indigo-700 font-mono">
                    {filteredGoals.filter(g => getActualSalesForDate(g.date) >= g.targetAmount).length} / {filteredGoals.length}
                  </span>
                </div>
              </div>

              {/* Buffets stat */}
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <span className="text-[9px] text-gray-400 font-extrabold uppercase block tracking-wider">Indicateurs Buffets</span>
                <div className="flex justify-between items-baseline mt-1">
                  <span className="text-xs text-gray-500 font-semibold">Bénéfice total :</span>
                  <span className="text-xs font-black text-emerald-600 font-mono">
                    {filteredBuffets.reduce((sum, b) => {
                      const ingCost = b.ingredientsSelected.reduce((s, i) => s + (i.cost || 0), 0);
                      const cost = ingCost + b.additionalCharges;
                      const sales = b.platesRealSold * b.pricePerPlateSold;
                      return sum + (sales - cost);
                    }, 0).toLocaleString()} F
                  </span>
                </div>
              </div>

              {/* Catering stat */}
              <div className="bg-white p-3 rounded-lg border border-gray-200">
                <span className="text-[9px] text-gray-400 font-extrabold uppercase block tracking-wider">Prestations Traiteur</span>
                <div className="flex justify-between items-baseline mt-1">
                  <span className="text-xs text-gray-500 font-semibold">Bénéfice Net :</span>
                  <span className="text-xs font-black text-indigo-700 font-mono">
                    {filteredCatering.reduce((sum, c) => {
                      const cost = c.status === 'COMPLETED' ? (c.actualCost || c.estimatedCost) : c.estimatedCost;
                      return sum + (c.proposedPrice - cost);
                    }, 0).toLocaleString()} F
                  </span>
                </div>
              </div>
            </div>

            {/* --- GOALS TABLE --- */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-gray-700">
                <span className="text-[10px] bg-indigo-50 text-indigo-700 py-0.5 px-1.5 rounded font-black">🎯</span>
                <span>Objectifs de Caisse Filtrés ({filteredGoals.length})</span>
              </div>
              {filteredGoals.length > 0 ? (
                <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-gray-50 text-gray-400 text-[9px] font-black uppercase border-b border-gray-200">
                        <th className="p-2.5 pl-3">Date</th>
                        <th className="p-2.5">Description</th>
                        <th className="p-2.5 text-right">CA Cible (F)</th>
                        <th className="p-2.5 text-right">CA Réel Encaissé (F)</th>
                        <th className="p-2.5 text-right">Taux de Réalisation</th>
                        <th className="p-2.5 text-center">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150">
                      {filteredGoals.map((g) => {
                        const actualVal = getActualSalesForDate(g.date);
                        const ratio = g.targetAmount > 0 ? (actualVal / g.targetAmount) * 100 : 0;
                        const isAchieved = actualVal >= g.targetAmount;
                        return (
                          <tr key={g.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-2.5 pl-3 font-semibold text-slate-900 font-mono">{g.date}</td>
                            <td className="p-2.5 text-gray-600 font-medium">{g.description}</td>
                            <td className="p-2.5 text-right font-bold text-slate-800 font-mono">{g.targetAmount.toLocaleString()}</td>
                            <td className="p-2.5 text-right font-bold text-indigo-700 font-mono">{actualVal.toLocaleString()}</td>
                            <td className="p-2.5 text-right font-black font-mono text-gray-700">{ratio.toFixed(1)}%</td>
                            <td className="p-2.5 text-center">
                              <span className={`inline-block px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded ${
                                isAchieved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                              }`}>
                                {isAchieved ? "Atteint" : "En cours"}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-3 bg-white text-center rounded-lg border border-gray-200 text-gray-400 font-medium italic">
                  Aucun objectif de caisse ne correspond aux critères de filtrage.
                </div>
              )}
            </div>

            {/* --- BUFFETS TABLE --- */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-gray-700">
                <span className="text-[10px] bg-orange-50 text-orange-700 py-0.5 px-1.5 rounded font-black">🍲</span>
                <span>Projets de Buffet d’Entreprise Filtrés ({filteredBuffets.length})</span>
              </div>
              {filteredBuffets.length > 0 ? (
                <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-gray-50 text-gray-400 text-[9px] font-black uppercase border-b border-gray-200">
                        <th className="p-2.5 pl-3">Date</th>
                        <th className="p-2.5">Nom du Buffet</th>
                        <th className="p-2.5 text-right">Tarif Unitaire (F)</th>
                        <th className="p-2.5 text-right">Volume Clients (Réel / Prévu)</th>
                        <th className="p-2.5 text-right">Coût Total (F)</th>
                        <th className="p-2.5 text-right">CA Réel Récolté (F)</th>
                        <th className="p-2.5 text-right">Bénéfice Net (F)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150">
                      {filteredBuffets.map((b) => {
                        const ingCost = b.ingredientsSelected.reduce((sum, item) => sum + (item.cost || 0), 0);
                        const totalCost = ingCost + b.additionalCharges;
                        const caReal = b.platesRealSold * b.pricePerPlateSold;
                        const realProfit = caReal - totalCost;
                        return (
                          <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-2.5 pl-3 font-semibold text-slate-900 font-mono">{b.date}</td>
                            <td className="p-2.5 text-gray-600 font-medium">{b.title}</td>
                            <td className="p-2.5 text-right font-bold text-slate-800 font-mono">{b.pricePerPlateSold.toLocaleString()}</td>
                            <td className="p-2.5 text-right font-mono text-gray-700 font-medium">
                              <span className="font-bold text-slate-900">{b.platesRealSold}</span> / {b.platesExpected}
                            </td>
                            <td className="p-2.5 text-right font-bold text-rose-600 font-mono">{totalCost.toLocaleString()}</td>
                            <td className="p-2.5 text-right font-bold text-indigo-700 font-mono">{caReal.toLocaleString()}</td>
                            <td className="p-2.5 text-right font-black font-mono">
                              <span className={realProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                                {realProfit.toLocaleString()} F
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-3 bg-white text-center rounded-lg border border-gray-200 text-gray-400 font-medium italic">
                  Aucun buffet ne correspond à vos filtres.
                </div>
              )}
            </div>

            {/* --- CATERING TABLE --- */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-gray-700">
                <span className="text-[10px] bg-sky-50 text-sky-700 py-0.5 px-1.5 rounded font-black">💼</span>
                <span>Contrats Traiteur Filtrés ({filteredCatering.length})</span>
              </div>
              {filteredCatering.length > 0 ? (
                <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-gray-50 text-gray-400 text-[9px] font-black uppercase border-b border-gray-200">
                        <th className="p-2.5 pl-3">Prévu le</th>
                        <th className="p-2.5">Nom du Client</th>
                        <th className="p-2.5 text-center">Statut</th>
                        <th className="p-2.5 text-right">Plats requis</th>
                        <th className="p-2.5 text-right">CA proposé (F)</th>
                        <th className="p-2.5 text-right">Coût consigné / estimé (F)</th>
                        <th className="p-2.5 text-right">Bénéfice net (F)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150">
                      {filteredCatering.map((c) => {
                        const finalCost = c.status === 'COMPLETED' ? (c.actualCost || c.estimatedCost) : c.estimatedCost;
                        const profit = c.proposedPrice - finalCost;
                        return (
                          <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-2.5 pl-3 font-semibold text-slate-900 font-mono">{c.date}</td>
                            <td className="p-2.5 text-gray-600 font-medium">{c.clientName}</td>
                            <td className="p-2.5 text-center">
                              <span className={`inline-block px-1.5 py-0.5 text-[8.5px] font-black uppercase rounded ${
                                c.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                                c.status === 'CONFIRMED' ? 'bg-indigo-100 text-indigo-700' :
                                c.status === 'CANCELLED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-yellow-800'
                              }`}>
                                {c.status}
                              </span>
                            </td>
                            <td className="p-2.5 text-right font-bold text-gray-700 font-mono">{c.platesRequested}</td>
                            <td className="p-2.5 text-right font-black text-indigo-700 font-mono">{c.proposedPrice.toLocaleString()}</td>
                            <td className="p-2.5 text-right font-bold text-rose-600 font-mono">{finalCost.toLocaleString()}</td>
                            <td className="p-2.5 text-right font-black font-mono text-emerald-600">
                              {profit.toLocaleString()} F
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-3 bg-white text-center rounded-lg border border-gray-200 text-gray-400 font-medium italic">
                  Aucune prestation traiteur sous les critères de filtres actifs.
                </div>
              )}
            </div>
          </div>
        )}
      </div>


      {/* TAB 1: OBJECTIVES OF DAILY SALES */}
      {activeSubSection === 'GOALS' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Form Side */}
          <div className="bg-white p-5 border border-gray-150 rounded-2xl shadow-3xs space-y-4">
            <h3 className="text-xs font-black text-slate-950 uppercase tracking-widest border-b pb-2.5 flex items-center gap-1.5">
              <Target className="h-4 w-4 text-indigo-700" />
              Définir un Nouvel Objectif Financier
            </h3>

            <div className="space-y-3.5 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-gray-650 block">Date de l'objectif opérationnel *</label>
                <div className="relative">
                  <input
                    type="date"
                    value={goalDate}
                    onChange={(e) => setGoalDate(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-250 rounded-lg text-gray-950 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-650 block">Chiffre d'Affaires cible espéré (TTC FCFA) *</label>
                <input
                  type="number"
                  placeholder="ex: 1500000"
                  value={goalAmount || ''}
                  onChange={(e) => setGoalAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-250 rounded-lg text-gray-950 font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-650 block">Commentaires / Contexte stratégique</label>
                <textarea
                  placeholder="ex: Réception fin d’année, match de football..."
                  value={goalDesc}
                  rows={2}
                  onChange={(e) => setGoalDesc(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-250 rounded-lg text-gray-950 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-650 block">Fréquence des alertes de rappel</label>
                <select
                  value={goalReminderFrequency}
                  onChange={(e) => setGoalReminderFrequency(e.target.value as any)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-250 rounded-lg text-gray-950 text-xs font-bold"
                >
                  <option value="DAILY">Rappel quotidien (Tous les jours)</option>
                  <option value="APPROACHING">À l'approche de la date (-3 jours)</option>
                  <option value="URGENT">Urgent et instantané (-1 jour)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleAddGoal}
                className="w-full py-2.5 bg-indigo-700 text-white hover:bg-indigo-800 rounded-lg font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Enregistrer l'Objectif</span>
              </button>
            </div>
          </div>

          {/* Goals Dashboard List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-5 border border-gray-150 rounded-2xl shadow-3xs">
              <h3 className="text-xs font-black text-slate-950 uppercase tracking-widest border-b pb-2.5 mb-4 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-indigo-700" />
                  Suivi & Comparatif Réel vs Objectif
                </span>
                <span className="text-[10px] bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-bold">Consolidation Instantanée</span>
              </h3>

              <div className="space-y-4">
                {filteredGoals.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-xs italic">
                    Aucun objectif ne correspond aux critères de recherche actuels.
                  </div>
                ) : (
                  filteredGoals.map(g => {
                    const actualTotal = getActualSalesForDate(g.date);
                    const isAchieved = actualTotal >= g.targetAmount;
                    const percentRatio = g.targetAmount > 0 ? (actualTotal / g.targetAmount) * 100 : 0;
                    const rest = g.targetAmount - actualTotal;

                    return (
                      <div key={g.id} className="p-4 bg-slate-50/40 border border-gray-150 rounded-xl relative hover:bg-slate-50 transition-colors">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-gray-100 pb-2.5 mb-3">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-black text-gray-400 bg-white border px-2 py-0.5 rounded">📅 {g.date}</span>
                              <span className="text-xs font-black text-gray-900 truncate max-w-[200px]">{g.description}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleDeleteGoal(g.id)}
                              className="text-red-500 p-1 rounded hover:bg-red-50 hover:text-red-700 cursor-pointer"
                              title="Supprimer l'objectif"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3.5">
                          <div className="p-2 border bg-white rounded-lg">
                            <span className="text-[9px] text-gray-400 font-extrabold uppercase block leading-none">Chiffre d’Affaires Visé</span>
                            <span className="text-sm font-black text-indigo-700 font-mono leading-normal">{g.targetAmount.toLocaleString()} F</span>
                          </div>
                          <div className="p-2 border bg-white rounded-lg">
                            <span className="text-[9px] text-gray-400 font-extrabold uppercase block leading-none">Réalisé en Caisse (TTC)</span>
                            <span className="text-sm font-black text-gray-900 font-mono leading-normal">{actualTotal.toLocaleString()} F</span>
                          </div>
                          <div className="p-2 border bg-white rounded-lg">
                            <span className="text-[9px] text-gray-400 font-extrabold uppercase block leading-none">Statut de Performance</span>
                            {percentRatio === 0 ? (
                              <span className="text-[10px] text-slate-400 font-bold block leading-normal italic">Aucune vente POS</span>
                            ) : isAchieved ? (
                              <span className="text-[10px] text-emerald-600 font-black flex items-center gap-1 leading-normal uppercase">
                                🎉 Atteint (+{(actualTotal - g.targetAmount).toLocaleString()} F)
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-600 font-black flex items-center gap-0.5 leading-normal uppercase">
                                ⚠️ En cours (-{rest.toLocaleString()} F)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Progress bar info */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-gray-500">
                            <span>Progression vers l’objectif</span>
                            <span className={isAchieved ? "text-emerald-600" : "text-indigo-700"}>{percentRatio.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${isAchieved ? 'bg-emerald-500' : 'bg-indigo-700'}`}
                              style={{ width: `${Math.min(100, percentRatio)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

              {goals.length === 0 && (
                  <div className="text-center py-12 bg-gray-50 border border-dashed rounded-xl space-y-2">
                    <HelpCircle className="h-8 w-8 text-gray-300 mx-auto" />
                    <p className="text-xs text-gray-400 font-bold">Aucun objectif financier configuré pour le site actif.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* TAB 2: BUFFET MANAGEMENT */}
      {activeSubSection === 'BUFFET' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Creator side */}
          <div className="bg-white p-5 border border-gray-150 rounded-2xl shadow-3xs space-y-4">
            <h3 className="text-xs font-black text-slate-950 uppercase tracking-widest border-b pb-2.5 flex items-center gap-1.5">
              <ChefHat className="h-4 w-4 text-[#1E4E8C]" />
              Formulaire de Plan Buffet
            </h3>

            <div className="space-y-3.5 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-gray-650 block">Intitulé / Nom du Buffet *</label>
                <input
                  type="text"
                  placeholder="ex: Buffet Anniversaire SABC"
                  value={buffetTitle}
                  onChange={(e) => setBuffetTitle(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-250 rounded-lg text-gray-950 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-gray-650 block">Date du Buffet *</label>
                  <input
                    type="date"
                    value={buffetDate}
                    onChange={(e) => setBuffetDate(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-gray-250 rounded-lg text-gray-950 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-650 block">Charges Annexes (FCFA)</label>
                  <input
                    type="number"
                    placeholder="Déco, extras..."
                    value={buffetCharges || ''}
                    onChange={(e) => setBuffetCharges(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-gray-50 border border-gray-250 rounded-lg text-gray-950 font-mono font-bold"
                  />
                </div>
              </div>

              {/* SECTION: PICK STOCK INGREDIENTS */}
              <div className="p-3 bg-slate-50 border border-gray-200 rounded-xl space-y-2">
                <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wide block">1. Prélever Ingrédients du Stock</span>
                
                <div className="grid grid-cols-2 gap-1.5">
                  <select
                    value={selectedIngId}
                    onChange={(e) => setSelectedIngId(e.target.value)}
                    className="p-1.5 border rounded bg-white text-[11px] font-bold"
                  >
                    <option value="">-- Choisir Ingrédient --</option>
                    {ingredients.filter(i => i.active).map(i => (
                      <option key={i.id} value={i.id}>
                        {i.name} ({i.stockActual} {i.unit} dispo)
                      </option>
                    ))}
                  </select>
                  
                  <div className="flex gap-1">
                    <input
                      type="number"
                      step="any"
                      placeholder="Qté"
                      value={selectedIngQty || ''}
                      onChange={(e) => setSelectedIngQty(parseFloat(e.target.value) || 1)}
                      className="w-12 p-1.5 border rounded bg-white text-[11px] font-mono font-bold"
                    />
                    <button
                      type="button"
                      onClick={handleAddIngredientToBuffet}
                      className="px-2 py-1.5 bg-slate-800 text-white hover:bg-slate-750 text-[10px] rounded font-black max-w-[50px] cursor-pointer shrink-0"
                    >
                      OK
                    </button>
                  </div>
                </div>

                {/* Ingredients selected lists */}
                {activeIngredients.length > 0 && (
                  <div className="space-y-1 mt-1.5 max-h-32 overflow-y-auto pr-1">
                    {activeIngredients.map((item, idx) => {
                      const ing = ingredients.find(i => i.id === item.ingredientId);
                      const unitCost = ing ? (ing.cmp || ing.lastPurchasePrice || 0) : 0;
                      return (
                        <div key={idx} className="flex justify-between items-center bg-white p-1 rounded border border-gray-150 text-[10px]">
                          <span className="text-gray-800 truncate font-semibold">
                            {ing?.name || 'Inconnu'} x{item.quantity} {ing?.unit}
                          </span>
                          <div className="flex items-center gap-1 font-mono">
                            <span className="text-gray-400">({(item.quantity * unitCost).toLocaleString()} F)</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveIngFromBuffet(idx)}
                              className="text-red-500 font-bold shrink-0 p-0.5 hover:bg-red-50 rounded"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* PLAT SPECS */}
              <div className="grid grid-cols-3 gap-1.5">
                <div className="space-y-1">
                  <label className="text-gray-600 block text-[9px] uppercase leading-none">P.U de Revente / Plat</label>
                  <input
                    type="number"
                    value={buffetPricePlate || ''}
                    onChange={(e) => setBuffetPricePlate(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-gray-50 border border-gray-250 rounded-lg text-gray-950 font-mono text-[11px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-600 block text-[9px] uppercase leading-none">Plats Visés (Prévu) *</label>
                  <input
                    type="number"
                    value={buffetPlatesExpected || ''}
                    onChange={(e) => setBuffetPlatesExpected(parseInt(e.target.value) || 0)}
                    className="w-full p-2 bg-gray-50 border border-gray-250 rounded-lg text-gray-950 font-mono text-[11px]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-600 block text-[9px] uppercase leading-none">Plats Vendus (Réel)</label>
                  <input
                    type="number"
                    value={buffetPlatesSold || ''}
                    onChange={(e) => setBuffetPlatesSold(parseInt(e.target.value) || 0)}
                    className="w-full p-2 bg-gray-50 border border-gray-250 rounded-lg text-gray-950 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-600 block text-[9px] uppercase leading-none mt-2">Fréquence de rappel / d'Alerte</label>
                <select
                  value={buffetReminderFrequency}
                  onChange={(e) => setBuffetReminderFrequency(e.target.value as any)}
                  className="w-full p-2 bg-gray-50 border border-gray-250 rounded-lg text-gray-950 font-bold text-[11px] block"
                >
                  <option value="DAILY">Rappel quotidien (Tous les jours)</option>
                  <option value="APPROACHING">À l'approche de la prestation (-3 jours)</option>
                  <option value="URGENT">Urgent et immédiat (-1 jour)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleCreateBuffet}
                className="w-full py-2.5 bg-indigo-700 text-white hover:bg-indigo-800 rounded-lg font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all mt-2.5"
              >
                <Plus className="h-4 w-4" />
                <span>Enregistrer Buffet & Ajuster Stock</span>
              </button>
            </div>
          </div>

          {/* List side */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-5 border border-gray-150 rounded-2xl shadow-3xs">
              <h3 className="text-xs font-black text-slate-950 uppercase tracking-widest border-b pb-2.5 mb-4 flex items-center justify-between">
                <span>Buffets programmés & Seuils atteints</span>
                <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded">Rapport d'écarts de Buffet</span>
              </h3>

              <div className="space-y-4">
                {(() => {
                  const filteredBuffets = buffets.filter(b => {
                    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) || b.date.includes(searchQuery);
                    const matchesDate = !searchDate || b.date === searchDate;
                    return matchesSearch && matchesDate;
                  });

                  if (filteredBuffets.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-400 text-xs italic">
                        Aucun buffet ne correspond aux critères de recherche actuels.
                      </div>
                    );
                  }

                  return filteredBuffets.map(b => {
                    // Calculate total cost of selected ingredients
                    let ingredientsSumCost = b.ingredientsSelected.reduce((sum, item) => sum + (item.cost || 0), 0);
                    const totalBuffetChargesCost = ingredientsSumCost + b.additionalCharges;

                    // Selling metrics
                    const expectedTurnover = b.platesExpected * b.pricePerPlateSold;
                    const realTurnover = b.platesRealSold * b.pricePerPlateSold;
                    const ratioPlates = b.platesExpected > 0 ? (b.platesRealSold / b.platesExpected) * 100 : 0;
                    const ratioAchieved = b.platesRealSold >= b.platesExpected;

                    // Profit computation
                    const estimatedProfit = expectedTurnover - totalBuffetChargesCost;
                    const realProfit = realTurnover - totalBuffetChargesCost;

                    const buffetStatus = b.status || 'CONFIRMED';

                    return (
                      <div key={b.id} className="p-4 bg-slate-50/50 border border-gray-150 rounded-xl relative">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-gray-100 pb-2 mb-3.5">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{b.title}</h4>
                              <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold font-mono tracking-wider border ${
                                buffetStatus === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-250' :
                                buffetStatus === 'CANCELLED' ? 'bg-red-50 text-red-750 border-red-250' :
                                'bg-indigo-50 text-indigo-700 border-indigo-200'
                              }`}>
                                {buffetStatus === 'COMPLETED' ? '✓ RÉALISÉ' : buffetStatus === 'CANCELLED' ? '✕ ANNULÉ' : 'PROGRAMMÉ'}
                              </span>
                            </div>
                            <span className="text-[10px] uppercase font-bold text-gray-400">Date de l’événement : {b.date}</span>
                          </div>
                          
                          <div className="flex items-center gap-1.5">
                            {/* Hide delete button if completed or cancelled */}
                            {buffetStatus !== 'COMPLETED' && buffetStatus !== 'CANCELLED' && (
                              <button
                                type="button"
                                onClick={() => handleDeleteBuffet(b.id, b.title)}
                                className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 cursor-pointer"
                                title="Supprimer ce buffet"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Status Message Banners */}
                        {buffetStatus === 'COMPLETED' ? (
                          <div className="p-3 bg-emerald-50 border border-emerald-250 text-emerald-950 rounded-lg text-[11px] font-bold flex items-center gap-2 mb-3">
                            <span className="text-emerald-600 text-sm font-black">✓</span>
                            <span>Prestation Buffet Validée et clôturée (Chiffres verrouillés & comptabilisés)</span>
                          </div>
                        ) : buffetStatus === 'CANCELLED' ? (
                          <div className="p-3 bg-red-50 border border-red-250 text-red-950 rounded-lg text-[11px] font-bold flex flex-col gap-1 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-red-500 text-sm font-black">✕</span>
                              <span className="font-extrabold uppercase">Prestation Buffet Annulée</span>
                            </div>
                            {b.cancelReason && (
                              <p className="text-[10px] font-semibold text-red-700">
                                Motif de l'annulation : <span className="italic font-bold">"{b.cancelReason}"</span>
                              </p>
                            )}
                          </div>
                        ) : null}

                        {/* Detail calculations */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-3">
                          <div className="p-2.5 border bg-white rounded-lg">
                            <span className="text-[9px] text-gray-400 font-extrabold block">Coût global buffet</span>
                            <span className="font-extrabold text-indigo-700 font-mono text-[11px] block">{totalBuffetChargesCost.toLocaleString()} F</span>
                            <span className="text-[8px] text-gray-400">(Ing: {ingredientsSumCost.toLocaleString()} F, Chg: {b.additionalCharges.toLocaleString()} F)</span>
                          </div>

                          <div className="p-2.5 border bg-white rounded-lg">
                            <span className="text-[9px] text-gray-400 font-extrabold block">CA Visé vs Réel</span>
                            <span className="font-bold text-gray-800 font-mono text-[10px] block">Prévu: {expectedTurnover.toLocaleString()} F</span>
                            <span className="font-extrabold text-slate-900 font-mono text-[10px] block">Vendu: {realTurnover.toLocaleString()} F</span>
                          </div>

                          <div className="p-2.5 border bg-white rounded-lg">
                            <span className="text-[9px] text-gray-400 font-extrabold block">Fréquentation Clients</span>
                            <span className="font-extrabold text-gray-900 text-[11px] block">{b.platesRealSold} / {b.platesExpected} clients</span>
                            <span className="text-[8px] text-gray-400">({ratioPlates.toFixed(1)}% atteint)</span>
                          </div>

                          <div className="p-2.5 border bg-white rounded-lg">
                            <span className="text-[9px] text-gray-400 font-extrabold block">Bénéfice Net Écart</span>
                            <span className="font-bold text-gray-500 font-mono text-[10px] block">Prévu: {estimatedProfit.toLocaleString()} F</span>
                            <span className={`font-black font-mono text-[11px] block ${realProfit >= estimatedProfit ? 'text-emerald-600' : 'text-amber-600'}`}>
                              Réel: {realProfit.toLocaleString()} F
                            </span>
                          </div>
                        </div>

                        {/* Achievement flag bar */}
                        <div className="flex items-center gap-2 mb-3">
                          {ratioAchieved ? (
                            <span className="text-[9px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded border border-emerald-250 font-extrabold block uppercase">
                              ✅ Objectif des clients attendus de buffet Atteint !
                            </span>
                          ) : (
                            <span className="text-[9px] bg-amber-50 text-amber-700 px-2.5 py-1 rounded border border-amber-250 font-extrabold block uppercase">
                              ⚠️ Objectif sous-vendu (-{b.platesExpected - b.platesRealSold} clients de l'estimation originale)
                            </span>
                          )}
                        </div>

                        {/* Action: Enregistrer/Valider le nombre réel de clients après l'événement */}
                        {buffetStatus !== 'COMPLETED' && buffetStatus !== 'CANCELLED' && (
                          <div className="mt-3.5 pt-3 border-t border-gray-150 flex flex-col gap-3 bg-gray-50/50 p-2.5 rounded-lg border border-dashed">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-indigo-700 shrink-0" />
                                <span className="text-[11px] text-gray-700 font-bold">Valider les entrées réelles après le buffet :</span>
                              </div>
                              <div className="flex items-center gap-2 w-full sm:w-auto">
                                <input
                                  type="number"
                                  placeholder="Clients réels"
                                  defaultValue={b.platesRealSold}
                                  id={`real-clients-${b.id}`}
                                  className="w-24 p-1 pb-1.5 border border-gray-300 bg-white text-gray-900 rounded font-black font-mono text-xs text-center border-solid"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const valInput = document.getElementById(`real-clients-${b.id}`) as HTMLInputElement;
                                    const val = valInput ? parseInt(valInput.value) || 0 : 0;
                                    handleUpdateBuffetRealClients(b.id, val);
                                  }}
                                  className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded text-[10px] font-black transition cursor-pointer shrink-0"
                                >
                                  Valider la Fréquentation
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCancellingBuffetId(b.id);
                                    setCancelReasonText('');
                                  }}
                                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-750 border border-red-250 rounded text-[10px] font-black transition cursor-pointer shrink-0"
                                >
                                  Annuler Buffet
                                </button>
                              </div>
                            </div>

                            {/* INLINE CUSTOM PROMPT INPUT FOR BUFFET CANCELLATION */}
                            {cancellingBuffetId === b.id && (
                              <div className="flex flex-col gap-2 p-3 bg-red-50/70 border border-red-150 rounded-lg animate-fade-in text-[11px] font-semibold text-red-950 mt-1">
                                <span className="font-extrabold">Saisissez le motif de l'annulation de ce buffet :</span>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={cancelReasonText}
                                    onChange={(e) => setCancelReasonText(e.target.value)}
                                    placeholder="ex: Reporté par le client, manque d'affluence..."
                                    className="flex-1 p-1.5 px-2 border border-red-200 rounded-md bg-white font-bold text-xs text-slate-950 focus:outline-hidden"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!cancelReasonText.trim()) {
                                        showToast("Veuillez saisir un motif", "error");
                                        return;
                                      }
                                      handleUpdateBuffetStatus(b.id, 'CANCELLED', undefined, cancelReasonText.trim());
                                      setCancellingBuffetId(null);
                                    }}
                                    className="bg-red-700 hover:bg-red-800 text-white font-extrabold px-3 py-1.5 rounded-md transition cursor-pointer text-[10px]"
                                  >
                                    Confirmer l'annulation
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setCancellingBuffetId(null)}
                                    className="text-gray-500 hover:text-gray-800 font-bold px-2 py-1.5 hover:underline cursor-pointer text-[10px]"
                                  >
                                    Annuler
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}

                {buffets.length === 0 && (
                  <div className="text-center py-12 bg-gray-50 border border-dashed rounded-xl space-y-2">
                    <HelpCircle className="h-8 w-8 text-gray-300 mx-auto" />
                    <p className="text-xs text-gray-400 font-bold">Aucun buffet plannifié ou enregistré pour le moment.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* TAB 3: CATERING SERVICES CONTRACTS */}
      {activeSubSection === 'CATERING' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Creator form */}
          <div className="bg-white p-5 border border-gray-150 rounded-2xl shadow-3xs space-y-4">
            <h3 className="text-xs font-black text-slate-950 uppercase tracking-widest border-b pb-2.5 flex items-center gap-1.5">
              <Briefcase className="h-4 w-4 text-indigo-700" />
              Formulaire Prestation Traiteur
            </h3>

            <div className="space-y-3.5 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-gray-650 block">Nom du Client / Événement *</label>
                <input
                  type="text"
                  placeholder="ex: Séminaire SNH Douala"
                  value={catClient}
                  onChange={(e) => setCatClient(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-250 rounded-lg text-gray-950 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-gray-650 block">Date demandée *</label>
                  <input
                    type="date"
                    value={catDate}
                    onChange={(e) => setCatDate(e.target.value)}
                    className="w-full p-2 bg-gray-50 border border-gray-250 rounded-lg text-gray-950 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-650 block">Plats Commandés *</label>
                  <input
                    type="number"
                    placeholder="ex: 150"
                    value={catPlates || ''}
                    onChange={(e) => setCatPlates(parseInt(e.target.value) || 0)}
                    className="w-full p-2 bg-gray-50 border border-gray-250 rounded-lg text-gray-950 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-650 block">Prix Proposé par le Client (Budget Global FCFA) *</label>
                <input
                  type="number"
                  placeholder="ex: 1800000"
                  value={catPrice || ''}
                  onChange={(e) => setCatPrice(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-250 rounded-lg text-gray-950 font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-gray-650 block">Coût Estimé Traiteur</label>
                  <input
                    type="number"
                    placeholder="Approvisionnements..."
                    value={catEstCost || ''}
                    onChange={(e) => setCatEstCost(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-gray-50 border border-gray-250 rounded-lg text-gray-950 font-mono text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-650 block">Coût Réel Traiteur</label>
                  <input
                    type="number"
                    placeholder="Débours réels..."
                    value={catActCost || ''}
                    onChange={(e) => setCatActCost(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-gray-50 border border-gray-250 rounded-lg text-gray-950 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-650 block">Statut du Contrat</label>
                <select
                  value={catStatus}
                  onChange={(e) => setCatStatus(e.target.value as any)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-250 rounded-lg text-gray-950 font-bold"
                >
                  <option value="PENDING">En Négociation / Attente</option>
                  <option value="CONFIRMED">Confirmé / Prévu</option>
                  <option value="COMPLETED">Réalisé / Terminé</option>
                  <option value="CANCELLED">Annulé</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-gray-650 block text-xs">Fréquence des Rappels / Notifications</label>
                <select
                  value={catReminderFrequency}
                  onChange={(e) => setCatReminderFrequency(e.target.value as any)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-250 rounded-lg text-gray-950 text-xs font-bold"
                >
                  <option value="DAILY">Rappel quotidien</option>
                  <option value="APPROACHING">À l'approche (-3 jours)</option>
                  <option value="URGENT">Urgent (-1 jour)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={handleCreateCatering}
                className="w-full py-2.5 bg-indigo-700 text-white hover:bg-indigo-800 rounded-lg font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all mt-2.5"
              >
                <Plus className="h-4 w-4" />
                <span>Créer Dossier Traiteur</span>
              </button>
            </div>
          </div>

          {/* List Contracts */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-5 border border-gray-150 rounded-2xl shadow-3xs">
              <h3 className="text-xs font-black text-slate-950 uppercase tracking-widest border-b pb-2.5 mb-4 flex items-center justify-between">
                <span>Dossiers Clients & Marges de Traiteur</span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-black border border-indigo-150 uppercase">Suivi de Rentabilité</span>
              </h3>

              <div className="space-y-4">
                {(() => {
                  const filteredCatering = cateringContracts.filter(c => {
                    const matchesSearch = c.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || c.date.includes(searchQuery);
                    const matchesDate = !searchDate || c.date === searchDate;
                    return matchesSearch && matchesDate;
                  });

                  if (filteredCatering.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-400 text-xs italic">
                        Aucune prestation traiteur ne correspond aux critères de recherche actuels.
                      </div>
                    );
                  }

                  return filteredCatering.map(c => {
                    const estProfit = c.proposedPrice - c.estimatedCost;
                    const finalCostValue = c.status === 'COMPLETED' ? (c.actualCost || c.estimatedCost) : c.estimatedCost;
                    const actProfit = c.proposedPrice - finalCostValue;
                    const profitRatio = c.proposedPrice > 0 ? (actProfit / c.proposedPrice) * 100 : 0;

                    return (
                      <div key={c.id} className="p-4 bg-slate-50/50 border border-gray-150 rounded-xl relative">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-gray-100 pb-2 mb-3.5">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{c.clientName}</h4>
                              <span className={`text-[9px] px-2 py-0.5 rounded font-extrabold font-mono tracking-wider border ${
                                c.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-250' :
                                c.status === 'CONFIRMED' ? 'bg-indigo-50 text-indigo-700 border border-indigo-250' :
                                c.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border border-red-250' :
                                'bg-amber-50 text-amber-700 border border-amber-250'
                              }`}>{c.status === 'COMPLETED' ? '✓ RÉALISÉ' : c.status === 'CONFIRMED' ? 'PRÉVU / CONFIRMÉ' : c.status === 'CANCELLED' ? '✕ ANNULÉ' : 'EN NÉGOCIATION'}</span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-extrabold tracking-wide uppercase">Cérémonie attendue le : {c.date} | Volume: {c.platesRequested} couverts</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {c.status !== 'COMPLETED' && c.status !== 'CANCELLED' && (
                              <button
                                type="button"
                                onClick={() => handleDeleteCatering(c.id)}
                                className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 cursor-pointer"
                                title="Supprimer la fiche traiteur"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Status Message Banners */}
                        {c.status === 'COMPLETED' ? (
                          <div className="p-3 bg-emerald-50 border border-emerald-250 text-emerald-950 rounded-lg text-[11px] font-bold flex items-center gap-2 mb-4">
                            <span className="text-emerald-600 text-sm font-black">✓</span>
                            <span>Prestation Validée (Chiffres enregistrés & verrouillés)</span>
                          </div>
                        ) : c.status === 'CANCELLED' ? (
                          <div className="p-3 bg-red-50 border border-red-250 text-red-950 rounded-lg text-[11px] font-bold flex flex-col gap-1 mb-4">
                            <div className="flex items-center gap-2">
                              <span className="text-red-500 text-sm font-black">✕</span>
                              <span className="font-extrabold uppercase">Prestation Annulée</span>
                            </div>
                            {c.cancelReason && (
                              <p className="text-[10px] font-semibold text-red-700">
                                Motif de l'annulation : <span className="italic font-bold">"{c.cancelReason}"</span>
                              </p>
                            )}
                          </div>
                        ) : null}

                        {/* Profit comparative widgets */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-3.5">
                          <div className="p-2 border bg-white rounded-lg">
                            <span className="text-[9px] text-gray-400 font-extrabold block">PRIX DU TRAITEUR</span>
                            <span className="font-mono font-black text-gray-900 text-[11px] block">{c.proposedPrice.toLocaleString()} F</span>
                            <span className="text-[8px] text-gray-400">({Math.round(c.proposedPrice / c.platesRequested).toLocaleString()} F par plat)</span>
                          </div>

                          <div className="p-2 border bg-white rounded-lg">
                            <span className="text-[9px] text-gray-400 font-extrabold block">Débours / Coût Estimé</span>
                            <span className="font-mono text-gray-600 block">{c.estimatedCost.toLocaleString()} F</span>
                            <span className="text-[8px] text-gray-400">(Estimatif initial)</span>
                          </div>

                          <div className="p-2 border bg-white rounded-lg">
                            <span className="text-[9px] text-gray-400 font-extrabold block">Débours / Coût Réel</span>
                            <span className="font-mono text-gray-800 font-bold block">
                              {c.actualCost > 0 ? `${c.actualCost.toLocaleString()} F` : 'Non comptabilisé'}
                            </span>
                          </div>

                          <div className="p-2 border bg-white rounded-lg">
                            <span className="text-[9px] text-gray-400 font-extrabold block">Bénéfice Réel Traiteur</span>
                            <span className={`font-mono font-black text-[11px] block ${actProfit >= estProfit ? 'text-emerald-600' : 'text-amber-600'}`}>
                              {actProfit.toLocaleString()} F
                            </span>
                            <span className="text-[8px] text-gray-400">({profitRatio.toFixed(1)}% Taux de Marge)</span>
                          </div>
                        </div>

                        {/* Status quick transitions actions - HIDE IF COMPLETED OR CANCELLED */}
                        {c.status !== 'COMPLETED' && c.status !== 'CANCELLED' && (
                          <div className="flex flex-col gap-2 pt-1.5 border-t border-gray-100 font-semibold text-gray-700">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[9px] font-extrabold text-gray-400 uppercase tracking-widest mr-1.5">Changer Statut :</span>
                              {c.status !== 'CONFIRMED' && (
                                <button
                                  type="button"
                                  onClick={() => handleUpdateCateringStatus(c.id, 'CONFIRMED')}
                                  className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold text-[9px] px-2 py-1 rounded transition-all cursor-pointer border border-indigo-200"
                                >
                                  Valider Contrat
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setClosingContractId(c.id);
                                  setClosingCost(c.estimatedCost);
                                }}
                                className="bg-emerald-50 text-emerald-750 hover:bg-emerald-100 font-bold text-[9px] px-2 py-1 rounded transition-all cursor-pointer border border-emerald-250"
                              >
                                ✓ Clôturer le Service
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCancellingContractId(c.id);
                                  setCancelReasonText('');
                                }}
                                className="bg-red-50 text-red-750 hover:bg-red-100 font-bold text-[9px] px-2 py-1 rounded transition-all cursor-pointer border border-red-250"
                              >
                                Annuler Prestation
                              </button>
                            </div>

                            {/* INLINE CUSTOM PROMPT INPUT */}
                            {closingContractId === c.id && (
                              <div className="flex flex-col gap-2 p-3 bg-indigo-50/70 border border-indigo-150 rounded-lg animate-fade-in text-[11px] font-semibold text-indigo-950 mt-1">
                                <span className="font-extrabold">Saisissez le coût de revient réel engagé pour ce service traiteur (FCFA) :</span>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={closingCost || ''}
                                    onChange={(e) => setClosingCost(parseFloat(e.target.value) || 0)}
                                    className="p-1.5 px-2 border border-indigo-200 rounded-md bg-white font-mono font-bold w-36 text-xs text-slate-950 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                                    placeholder={String(c.estimatedCost)}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleUpdateCateringStatus(c.id, 'COMPLETED', closingCost);
                                      setClosingContractId(null);
                                    }}
                                    className="bg-indigo-700 hover:bg-indigo-800 text-white font-extrabold px-3 py-1.5 rounded-md transition cursor-pointer text-[10px]"
                                  >
                                    Valider la clôture
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setClosingContractId(null)}
                                    className="text-gray-500 hover:text-gray-800 font-bold px-2 py-1.5 hover:underline cursor-pointer text-[10px]"
                                  >
                                    Annuler
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* INLINE CUSTOM PROMPT INPUT FOR CATERING CANCELLATION */}
                            {cancellingContractId === c.id && (
                              <div className="flex flex-col gap-2 p-3 bg-red-50/70 border border-red-150 rounded-lg animate-fade-in text-[11px] font-semibold text-red-950 mt-1 font-sans">
                                <span className="font-extrabold">Saisissez le motif de l'annulation du service traiteur de {c.clientName} :</span>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={cancelReasonText}
                                    onChange={(e) => setCancelReasonText(e.target.value)}
                                    placeholder="ex: Désaccord de prix, événement annulé..."
                                    className="flex-1 p-1.5 px-2 border border-red-200 rounded-md bg-white font-bold text-xs text-slate-950 focus:outline-hidden"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!cancelReasonText.trim()) {
                                        showToast("Veuillez saisir un motif", "error");
                                        return;
                                      }
                                      handleUpdateCateringStatus(c.id, 'CANCELLED', undefined, cancelReasonText.trim());
                                      setCancellingContractId(null);
                                    }}
                                    className="bg-red-700 hover:bg-red-800 text-white font-extrabold px-3 py-1.5 rounded-md transition cursor-pointer text-[10px]"
                                  >
                                    Confirmer l'annulation
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setCancellingContractId(null)}
                                    className="text-gray-500 hover:text-gray-800 font-bold px-2 py-1.5 hover:underline cursor-pointer text-[10px]"
                                  >
                                    Annuler
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}

                {cateringContracts.length === 0 && (
                  <div className="text-center py-12 bg-gray-50 border border-dashed rounded-xl space-y-2">
                    <HelpCircle className="h-8 w-8 text-gray-300 mx-auto" />
                    <p className="text-xs text-gray-400 font-bold">Aucune proposition ou contrat traiteur enregistré.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
