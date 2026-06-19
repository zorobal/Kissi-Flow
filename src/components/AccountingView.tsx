/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  TrendingUp,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Calculator,
  Calendar,
  Lock,
  LockKeyhole,
  FileSpreadsheet,
  PlusCircle,
  Clock,
  Sparkles,
  Percent,
  TrendingDown,
  Activity,
  User,
  CheckCircle,
  FileText,
  Download,
  Edit,
  Trash2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { CashRegisterMovement, DailyClosure, Order, StockMovement, Dish } from '../types';

interface AccountingViewProps {
  cashMovements: CashRegisterMovement[];
  dailyClosures: DailyClosure[];
  orders: Order[];
  stockMovements: StockMovement[];
  isDayStarted: boolean;
  onStartDay: () => void;
  onAddCashMovement: (mvt: CashRegisterMovement) => void;
  onAddDailyClosure: (closure: DailyClosure) => void;
  onLockOrders: (date: string) => void; // Locked day orders status CLOSED
  onUpdateCashMovements?: (mvts: CashRegisterMovement[]) => void;
  onUpdateDailyClosures?: (closures: DailyClosure[]) => void;
  logsAction: (action: string, module: string) => void;
  tenantId: string;
  activeUser: { name: string; id: string; role: string };
  onResetDailyClosure?: (date: string) => void;
  dishes?: Dish[];
}

export default function AccountingView({
  cashMovements,
  dailyClosures,
  orders,
  stockMovements,
  isDayStarted,
  onStartDay,
  onAddCashMovement,
  onAddDailyClosure,
  onLockOrders,
  onUpdateCashMovements,
  onUpdateDailyClosures,
  logsAction,
  tenantId,
  activeUser,
  onResetDailyClosure,
  dishes = []
}: AccountingViewProps) {
  // Tabs: 'REGISTRY' | 'CLOSURES' | 'MANAGE_CLOSURE'
  const [accountingTab, setAccountingTab] = useState<'REGISTRY' | 'CLOSURES' | 'MANAGE_CLOSURE'>('REGISTRY');

  const tenantMovements = cashMovements.filter(m => m.tenantId === tenantId);
  const tenantClosures = dailyClosures.filter(c => c.tenantId === tenantId);
  const tenantOrders = orders.filter(o => o.tenantId === tenantId);

  // States for Manual Cash Movement
  const [showMvtModal, setShowMvtModal] = useState(false);
  const [newMvtType, setNewMvtType] = useState<'IN' | 'OUT'>('OUT');
  const [newMvtAmount, setNewMvtAmount] = useState(0);
  const [newMvtRef, setNewMvtRef] = useState('');
  const [newMvtComment, setNewMvtComment] = useState('');
  const [newMvtPayment, setNewMvtPayment] = useState<'CASH' | 'OM' | 'MOMO'>('CASH');
  const [showConfirmReopen, setShowConfirmReopen] = useState(false);

  // States for editing manual movements
  const [mvtToEdit, setMvtToEdit] = useState<CashRegisterMovement | null>(null);

  // States for Grand Livre (Accounting Register) filtering
  const [registryDateFilter, setRegistryDateFilter] = useState('');
  const [registryTypeFilter, setRegistryTypeFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');

  // States for Editing closures
  const [showClosureEditModal, setShowClosureEditModal] = useState(false);
  const [closureToEdit, setClosureToEdit] = useState<DailyClosure | null>(null);
  const [clRevenue, setClRevenue] = useState(0);
  const [clExpenses, setClExpenses] = useState(0);
  const [clCash, setClCash] = useState(0);
  const [clOM, setClOM] = useState(0);
  const [clMoMo, setClMoMo] = useState(0);
  const [clValidator, setClValidator] = useState('');

  // Today dates reference '2026-06-11'
  const targetToday = '2026-06-11';

  // Dynamic calculations of Today's Business (not closed yet!)
  const todayOrders = tenantOrders.filter(o => o.date === targetToday && (o.status === 'VALIDATED'));
  const todayRevenues = todayOrders.reduce((sum, o) => sum + o.total, 0);
  
  // Todays breakdown
  const todayCashRev = todayOrders.filter(o => o.paymentMethod === 'CASH').reduce((sum, o) => sum + o.total, 0);
  const todayOMRev = todayOrders.filter(o => o.paymentMethod === 'OM').reduce((sum, o) => sum + o.total, 0);
  const todayMoMoRev = todayOrders.filter(o => o.paymentMethod === 'MOMO').reduce((sum, o) => sum + o.total, 0);

  const todayExpenses = tenantMovements.filter(m => m.date.startsWith(targetToday) && m.type === 'OUT').reduce((sum, m) => sum + m.amount, 0);
  const todayNetProfit = todayRevenues - todayExpenses;
  const todayOrdersCount = todayOrders.length;
  const todayBasketAverage = todayOrdersCount > 0 ? Math.round(todayRevenues / todayOrdersCount) : 0;
  
  const todayCostGoods = todayOrders.reduce((sum, o) => sum + (o.costTotal || 0), 0);
  const todayMarginValue = todayRevenues - todayCostGoods;

  // Custom User/Resto Cost of Goods & Margins calculations
  let todayCostGoodsResto = 0;
  todayOrders.forEach(o => {
    o.lines.forEach(line => {
      const dish = dishes.find(d => d.id === line.dishId);
      const uCost = dish?.userCostPrice !== undefined && dish?.userCostPrice !== null ? dish.userCostPrice : (dish?.theoreticalCost || 0);
      todayCostGoodsResto += uCost * line.quantity;
    });
  });
  const todayMarginValueResto = todayRevenues - todayCostGoodsResto;

  const isTodayAlreadyClosed = tenantClosures.some(c => c.date === targetToday && c.validated);

  // Handle Manual Cash movement save
  const handleSaveMovement = () => {
    if (!newMvtAmount || newMvtAmount <= 0) {
      alert("Saisissez un montant valide.");
      return;
    }

    if (mvtToEdit) {
      const updated: CashRegisterMovement = {
        ...mvtToEdit,
        type: newMvtType,
        amount: newMvtAmount,
        reference: newMvtRef.toUpperCase() || 'AUTRE-RECU',
        comment: newMvtComment || 'Dépense / Recette manuelle',
        paymentMethod: newMvtPayment
      };
      if (onUpdateCashMovements) {
        onUpdateCashMovements(cashMovements.map(m => m.id === mvtToEdit.id ? updated : m));
      }
      logsAction(`Mouvement financier modifié : ID ${mvtToEdit.id}`, 'COMPTABILITÉ & TRÉSORERIE');
    } else {
      const newMvt: CashRegisterMovement = {
        id: `csh-${Date.now()}`,
        date: new Date().toISOString().replace('T', ' ').slice(0, 16),
        type: newMvtType,
        amount: newMvtAmount,
        reference: newMvtRef.toUpperCase() || 'AUTRE-RECU',
        comment: newMvtComment || 'Dépense / Recette manuelle',
        paymentMethod: newMvtPayment,
        userId: activeUser.id,
        userName: activeUser.name,
        tenantId
      };

      onAddCashMovement(newMvt);
      logsAction(`Mouvement financier enregistré : ${newMvtType} de ${newMvtAmount.toLocaleString()} FCFA (${newMvtPayment})`, 'COMPTABILITÉ & TRÉSORERIE');
    }

    setShowMvtModal(false);
    setMvtToEdit(null);

    // Reset Form
    setNewMvtAmount(0);
    setNewMvtRef('');
    setNewMvtComment('');
  };

  const handleOpenMvtEdit = (mvt: CashRegisterMovement) => {
    setMvtToEdit(mvt);
    setNewMvtType(mvt.type);
    setNewMvtAmount(mvt.amount);
    setNewMvtRef(mvt.reference);
    setNewMvtComment(mvt.comment || '');
    setNewMvtPayment(mvt.paymentMethod);
    setShowMvtModal(true);
  };

  const handleDeleteMvt = (mvtId: string, ref: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le mouvement de caisse "${ref}" ?`)) {
      if (onUpdateCashMovements) {
        onUpdateCashMovements(cashMovements.filter(m => m.id !== mvtId));
      }
      logsAction(`Mouvement financier supprimé : Réf ${ref}`, 'COMPTABILITÉ & TRÉSORERIE');
    }
  };

  const handleOpenClosureEdit = (cl: DailyClosure) => {
    setClosureToEdit(cl);
    setClRevenue(cl.revenue);
    setClExpenses(cl.expenses);
    setClCash(cl.cashRevenue);
    setClOM(cl.omRevenue);
    setClMoMo(cl.momoRevenue);
    setClValidator(cl.validatedBy);
    setShowClosureEditModal(true);
  };

  const handleSaveClosureEdit = () => {
    if (!closureToEdit) return;
    const updated: DailyClosure = {
      ...closureToEdit,
      revenue: clRevenue,
      expenses: clExpenses,
      netProfit: clRevenue - clExpenses,
      cashRevenue: clCash,
      omRevenue: clOM,
      momoRevenue: clMoMo,
      validatedBy: clValidator
    };
    if (onUpdateDailyClosures) {
      onUpdateDailyClosures(dailyClosures.map(c => c.id === closureToEdit.id ? updated : c));
    }
    logsAction(`Clôture d'archive modifiée : Journée du ${closureToEdit.date}`, 'COMPTABILITÉ & TRÉSORERIE');
    setShowClosureEditModal(false);
    setClosureToEdit(null);
  };

  const handleDeleteClosure = (clId: string, date: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'archive de clôture de la journée d'affaires du "${date}" ?`)) {
      if (onUpdateDailyClosures) {
        onUpdateDailyClosures(dailyClosures.filter(c => c.id !== clId));
      }
      logsAction(`Clôture d'archive supprimée : Journée du ${date}`, 'COMPTABILITÉ & TRÉSORERIE');
    }
  };

  // Export daily ledger overview & warehouse movements as printable PDF
  const generatePDFReport = (closureDate: string) => {
    const doc = new jsPDF();
    
    // Find closure or compute dynamically
    const activeClosure = tenantClosures.find(c => c.date === closureDate) || {
      date: closureDate,
      revenue: todayRevenues,
      expenses: todayExpenses,
      netProfit: todayNetProfit,
      ordersCount: todayOrdersCount,
      ticketAverage: todayBasketAverage,
      marginAmount: todayMarginValue,
      cashRevenue: todayCashRev,
      omRevenue: todayOMRev,
      momoRevenue: todayMoMoRev,
      validatedBy: `${activeUser.name} (${activeUser.role})`
    };

    // Gather ledger movements
    const dayMovements = [
      ...tenantMovements.filter(m => m.date.startsWith(closureDate)),
      ...tenantOrders.filter(o => o.date === closureDate && (o.status === 'VALIDATED' || o.status === 'CLOSED')).map(o => ({
        id: o.id,
        date: `${o.date} ${o.time}`,
        type: 'IN' as const,
        amount: o.total,
        reference: o.number,
        comment: `Encaissement Vente Tactile POS - canal ${o.canal}`,
        paymentMethod: o.paymentMethod,
        userName: o.userName
      }))
    ].sort((a,b) => b.date.localeCompare(a.date));

    // Gather stock movements
    const dayStockMovements = stockMovements.filter(m => m.tenantId === tenantId && m.date.startsWith(closureDate));

    // Cover/Header rect
    doc.setFillColor(30, 78, 140); // Deep Blue #1E4E8C
    doc.rect(0, 0, 210, 38, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("Helvetica", "bold");
    doc.text("KISSINEFLOW — BILAN JOURNALIER", 14, 18);
    
    doc.setFontSize(9);
    doc.setFont("Helvetica", "normal");
    doc.text(`Établissement ID : ${tenantId.toUpperCase()} | Date d'affaires : ${closureDate}`, 14, 26);
    doc.text(`Rapport généré le : ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 14, 31);
    
    doc.setTextColor(30, 40, 50);
    doc.setFontSize(12);
    doc.setFont("Helvetica", "bold");
    doc.text("1. STATISTIQUES D'EXPLOITATION COMMERCIALE", 14, 48);
    
    // Separation rule
    doc.setDrawColor(220, 225, 230);
    doc.line(14, 51, 196, 51);
    
    doc.setFontSize(10);
    let y = 58;
    const addLine = (label: string, val: string, isBold = false) => {
      doc.setFont("Helvetica", isBold ? "bold" : "normal");
      doc.text(label, 14, y);
      doc.text(val, 130, y);
      y += 6.5;
    };

    addLine("Chiffre d'Affaires Brut (Ventes POS)", `${activeClosure.revenue.toLocaleString()} FCFA`);
    addLine("Total Charges / Décaissements Caisse", `${activeClosure.expenses.toLocaleString()} FCFA`);
    
    // Benefit banner
    doc.setFillColor(240, 248, 244);
    doc.rect(14, y - 4, 182, 8, 'F');
    doc.setTextColor(20, 110, 60);
    addLine("Bénéfice Net théorique d'exploitation", `${activeClosure.netProfit.toLocaleString()} FCFA`, true);
    doc.setTextColor(30, 40, 50);
    
    addLine("Nombre de commandes honorées", `${activeClosure.ordersCount} tickets enregistrés`);
    addLine("Ticket Moyen / Panier Moyen", `${activeClosure.ticketAverage.toLocaleString()} FCFA`);
    addLine("Marge commerciale brute dégagée", `${(activeClosure.marginAmount || 0).toLocaleString()} FCFA`);
    
    y += 2.5;
    doc.setFont("Helvetica", "bold");
    doc.text("Détail par Mode d'encaissement :", 14, y);
    y += 6;
    doc.setFont("Helvetica", "normal");
    doc.text(`- Espèces en caisse (CASH) : ${(activeClosure.cashRevenue || 0).toLocaleString()} FCFA`, 20, y); y += 5;
    doc.text(`- Orange Money (OM) : ${(activeClosure.omRevenue || 0).toLocaleString()} FCFA`, 20, y); y += 5;
    doc.text(`- MTN Mobile Money (MoMo) : ${(activeClosure.momoRevenue || 0).toLocaleString()} FCFA`, 20, y); y += 5;

    // STOCK MOVEMENTS
    y += 10;
    doc.setFontSize(12);
    doc.setFont("Helvetica", "bold");
    doc.text("2. SYNTHÈSE DES MOUVEMENTS DE STOCKS DU JOUR", 14, y);
    doc.line(14, y + 2.5, 196, y + 2.5);
    y += 9;

    doc.setFontSize(9);
    if (dayStockMovements.length === 0) {
      doc.setFont("Helvetica", "italic");
      doc.text("Aucun mouvement de stock recensé sur cette date d'affaires.", 14, y);
      y += 8;
    } else {
      // Stock table header
      doc.setFillColor(245, 247, 250);
      doc.rect(14, y - 4, 182, 6, 'F');
      doc.setFont("Helvetica", "bold");
      doc.text("Ingrédient", 16, y);
      doc.text("Type Mvt", 80, y);
      doc.text("Quantité", 115, y);
      doc.text("Coût Unitaire", 145, y);
      doc.text("Référence", 175, y);
      y += 6;
      doc.setFont("Helvetica", "normal");

      dayStockMovements.forEach(m => {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
        // Truncate ingredient name if too long
        const shortName = m.ingredientName.length > 28 ? m.ingredientName.substring(0, 26) + "..." : m.ingredientName;
        doc.text(shortName, 16, y);
        doc.text(m.type, 80, y);
        doc.text(`${m.quantity} u.`, 115, y);
        doc.text(`${m.unitCost.toLocaleString()} F`, 145, y);
        doc.text(m.reference, 175, y);
        y += 5.5;
      });
    }

    // CASH FLOWS
    y += 8;
    if (y > 240) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(12);
    doc.setFont("Helvetica", "bold");
    doc.text("3. FLUX & ÉCRITURES DE CAISSE DE LA JOURNÉE", 14, y);
    doc.line(14, y + 2.5, 196, y + 2.5);
    y += 9;

    doc.setFontSize(9);
    if (dayMovements.length === 0) {
      doc.setFont("Helvetica", "italic");
      doc.text("Aucun flux ou mouvement de cash enregistré sur cette date d'affaires.", 14, y);
      y += 8;
    } else {
      // Cash table header
      doc.setFillColor(245, 247, 250);
      doc.rect(14, y - 4, 182, 6, 'F');
      doc.setFont("Helvetica", "bold");
      doc.text("Heure / Justification", 16, y);
      doc.text("Moyen", 65, y);
      doc.text("Sens", 90, y);
      doc.text("Montant", 115, y);
      doc.text("Commentaire explicatif", 142, y);
      y += 6;
      doc.setFont("Helvetica", "normal");

      dayMovements.forEach(m => {
        if (y > 275) {
          doc.addPage();
          y = 20;
        }
        const hourOrRef = m.date.length > 10 ? m.date.split(' ')[1] : m.reference;
        const shortRef = m.reference.length > 15 ? m.reference.substring(0, 13) + ".." : m.reference;
        doc.text(`${hourOrRef} [${shortRef}]`, 16, y);
        doc.text(m.paymentMethod || 'CASH', 65, y);
        doc.text(m.type === 'IN' ? 'ENTRÉE +' : 'SORTIE -', 90, y);
        doc.text(`${m.amount.toLocaleString()} FCFA`, 115, y);
        
        const shortComment = (m.comment || '').length > 26 ? m.comment.substring(0, 24) + "..." : m.comment;
        doc.text(shortComment || 'Écriture de caisse', 142, y);
        y += 5.5;
      });
    }

    // Validation Signature
    y += 10;
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setDrawColor(200, 205, 210);
    doc.rect(14, y, 182, 20);
    doc.setFontSize(9.5);
    doc.setFont("Helvetica", "bold");
    doc.text(`Validateur d'exploitation : ${activeClosure.validatedBy || 'Administrateur Général'}`, 18, y + 8);
    doc.setFont("Helvetica", "italic");
    doc.text("Bilan certifié conforme et verrouillé par signature électronique de caisse.", 18, y + 14);

    // Save
    doc.save(`bilan-cloture-journaliere-${closureDate}.pdf`);
  };

  // Perform permanent active Closures compilation (Part 2 Module 7.10)
  const handleExecuteDailyClosure = () => {
    if (isTodayAlreadyClosed) return;
    if (todayOrdersCount === 0 && todayExpenses === 0) {
      alert("Aucune activité commerciale aujourd'hui. Impossible de lancer une clôture vierge.");
      return;
    }

    const newClosure: DailyClosure = {
      id: `cl-${Date.now()}`,
      date: targetToday,
      validated: true,
      validatedBy: `${activeUser.name} (${activeUser.role})`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      revenue: todayRevenues,
      expenses: todayExpenses,
      netProfit: todayNetProfit,
      ordersCount: todayOrdersCount,
      ticketAverage: todayBasketAverage,
      marginAmount: todayMarginValue,
      cashRevenue: todayCashRev,
      omRevenue: todayOMRev,
      momoRevenue: todayMoMoRev,
      tenantId
    };

    onAddDailyClosure(newClosure);
    onLockOrders(targetToday); // locks orders as CLOSED/archived
    logsAction(`CLÔTURE JOURNALIÈRE EFFECTUÉE : Journée du ${targetToday} validée & verrouillée`, 'COMPTABILITÉ & TRÉSORERIE');
    
    alert(`Fermeture validée ! La journée d'affaire ${targetToday} est verrouillée à des fins de régularité comptable. Toutes les écritures de ventes de la journée sont intégrées et figées.`);
    setAccountingTab('CLOSURES');
  };

  // Calcul totals trésorerie
  const cumulVentesCaisseTotal = tenantOrders.filter(o => (o.status === 'VALIDATED' || o.status === 'CLOSED')).reduce((sum, o) => sum + o.total, 0);
  const cumulDepensesCaisseTotal = tenantMovements.filter(m => m.type === 'OUT').reduce((sum,m)=> sum + m.amount, 0);
  const currentCashbookResidue = cumulVentesCaisseTotal - cumulDepensesCaisseTotal;

  return (
    <div className="space-y-6" id="accounting-module">
      {/* Upper ledger summary details */}
      <div className="bg-gradient-to-r from-[#1E4E8C] to-blue-900 text-white rounded-lg p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <span className="text-xs text-blue-200 uppercase tracking-widest font-semibold flex items-center gap-1.5">
            Bilan Financier Liquide 
            <span className="bg-yellow-400 text-slate-900 px-1.5 py-0.2 rounded font-black text-[9px] uppercase">
              Caisse Comptoir Uniquement
            </span>
          </span>
          <h2 className="text-2xl font-bold font-sans">En-Caisse Théorique : {currentCashbookResidue.toLocaleString()} FCFA</h2>
          <p className="text-[11px] text-blue-100 font-medium leading-relaxed max-w-2xl">
            Trésorerie cumulée du Point de Vente (Ventes Tactiles Resto enregistrées moins Décaissements de caisse). <strong className="text-amber-200 font-bold">Exclut</strong> les prestations de Buffets & Service Traiteur qui disposent de leurs propres circuits de facturation indépendants dans l'onglet Prestations.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            id="mvt-accounting-expense-btn"
            onClick={() => { setNewMvtType('OUT'); setShowMvtModal(true); }}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white hover:shadow-md font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all"
          >
            <ArrowDownRight className="h-4 w-4" />
            <span>Saisir Dépense / Sortie</span>
          </button>
          
          <button
            id="mvt-accounting-revenue-btn"
            onClick={() => { setNewMvtType('IN'); setShowMvtModal(true); }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-md font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all"
          >
            <ArrowUpRight className="h-4 w-4" />
            <span>Saisir Recette / Entrée</span>
          </button>
        </div>
      </div>

      {/* Selector Sub tabs in ledger with dynamic Export button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-150 gap-2">
        <div className="flex overflow-x-auto">
          <button
            id="acct-registry-tab"
            onClick={() => setAccountingTab('REGISTRY')}
            className={`px-6 py-3 text-xs font-bold border-b-2 transition-all ${
              accountingTab === 'REGISTRY'
                ? 'border-[#1E4E8C] text-[#1E4E8C] bg-blue-50/20'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Livre de Caisse & Trésorerie
          </button>
          <button
            id="acct-manage-closure-tab"
            onClick={() => setAccountingTab('MANAGE_CLOSURE')}
            className={`px-6 py-3 text-xs font-bold border-b-2 transition-all ${
              accountingTab === 'MANAGE_CLOSURE'
                ? 'border-[#1E4E8C] text-[#1E4E8C] bg-blue-50/20'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Clôture Journalière Active
          </button>
          <button
            id="acct-closures-tab"
            onClick={() => setAccountingTab('CLOSURES')}
            className={`px-6 py-3 text-xs font-bold border-b-2 transition-all ${
              accountingTab === 'CLOSURES'
                ? 'border-[#1E4E8C] text-[#1E4E8C] bg-blue-50/20'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Archives de Clôtures
          </button>
        </div>

        <div className="pr-3 pb-2 sm:pb-0">
          <button
            id="acct-export-excel-btn"
            onClick={() => {
              logsAction('Export comptable textuel détaillé du grand livre', 'COMPTABILITE');
              
              let reportText = '';
              const nowStr = new Date().toLocaleDateString('fr-FR') + ' à ' + new Date().toLocaleTimeString('fr-FR');
              
              if (accountingTab === 'REGISTRY') {
                const combinedFlows = [
                  ...tenantMovements.map(m => ({ ...m, isManual: true })),
                  ...tenantOrders.filter(o => o.status === 'VALIDATED' || o.status === 'CLOSED').map(o => ({
                    id: o.id,
                    date: `${o.date} ${o.time}`,
                    type: 'IN' as const,
                    amount: o.total,
                    reference: o.number,
                    comment: `Vente POS - canal ${o.canal}`,
                    paymentMethod: o.paymentMethod,
                    userName: o.userName,
                    isManual: false
                  }))
                ].sort((a, b) => b.date.localeCompare(a.date));

                const totalIn = combinedFlows.filter(f => f.type === 'IN').reduce((sum, f) => sum + f.amount, 0);
                const totalOut = combinedFlows.filter(f => f.type === 'OUT').reduce((sum, f) => sum + f.amount, 0);
                const netBalance = totalIn - totalOut;

                const cashIn = combinedFlows.filter(f => f.type === 'IN' && f.paymentMethod === 'CASH').reduce((sum, f) => sum + f.amount, 0);
                const omIn = combinedFlows.filter(f => f.type === 'IN' && f.paymentMethod === 'OM').reduce((sum, f) => sum + f.amount, 0);
                const momoIn = combinedFlows.filter(f => f.type === 'IN' && f.paymentMethod === 'MOMO').reduce((sum, f) => sum + f.amount, 0);

                const tableRows = combinedFlows.map(f => 
                  `  [${f.date}] | ${f.type === 'IN' ? 'ENTRÉE' : 'SORTIE'} | ${String(f.amount.toLocaleString() + ' F').padEnd(12)} | Method: ${f.paymentMethod.padEnd(5)} | Ref: ${f.reference.padEnd(12)} | Op: ${f.userName.padEnd(12)} | Note: ${f.comment}`
                ).join('\n') || '  (Aucun mouvement comptabilisé)';

                reportText = `================================================================================
                RAPPORT DE GRAND LIVRE & SÛRETÉ DU COMPTOIR
================================================================================
Généré le : ${nowStr}
Établissement ID : ${tenantId}
Module actif : Grand Livre de Caisse (Livre de Caisse & Trésorerie)

--------------------------------------------------------------------------------
1. PÉRIODE D'ANALYSE COMPTABLE
--------------------------------------------------------------------------------
Cette analyse repose sur la compilation active de tous les enregistrements de flux financiers 
capturés au point de vente (POS) ainsi que les écritures de d'ajustements manuelles déclarées :
  * Statut initial d'exercice de la session : ${isDayStarted ? 'OUVERT - Session continue' : 'FERMÉ - Hors service'}
  * Période globale d'analyse : Historique complet des écritures d'affaires

--------------------------------------------------------------------------------
2. INDICATEURS CLÉS DE PERFORMANCE (KPIs)
--------------------------------------------------------------------------------
Les indicateurs de flux consolidés du grand livre s'établissent comme suit :

  * Total cumulé des Rentrées (Entrées/Recettes) : ${totalIn.toLocaleString()} FCFA
  * Total cumulé des Décaissements (Sorties/Charges) : ${totalOut.toLocaleString()} FCFA
  * Solde de Trésorerie Net Actuel : ${netBalance.toLocaleString()} FCFA
    Un écart ou une baisse peut indiquer des régularisations de stocks ou des dépenses de cuisine.

--------------------------------------------------------------------------------
3. ANALYSE DU CANAL DE PAIEMENT & RÉPARTITION TRÉSORERIE (WIDGETS)
--------------------------------------------------------------------------------
Décomposition analytique des entrées financières en fonction du mode de règlement :
  * Portion liquidité directe en Caisse (Espèces) : ${cashIn.toLocaleString()} FCFA (Moyen le plus fluide)
  * Portion numérique Orange Money Cameroun (OM) : ${omIn.toLocaleString()} FCFA
  * Portion numérique MTN MoMo Mobile Money (MOMO) : ${momoIn.toLocaleString()} FCFA

Le taux d'électronisation de vos encaissements représente un coefficient moderne pour éliminer 
les risques d'erreurs de caisse physiques lors de la réconciliation de fin de journée.

--------------------------------------------------------------------------------
4. TABLEAU DE SYNTHÈSE DES MOUVEMENTS (LIVRE DE CAISSE DÉTAILLÉ)
--------------------------------------------------------------------------------
Retrouvez ci-dessous la table d'audit chronologique de l'ensemble des mouvements enregistrés :

${tableRows}

================================================================================
                  FIN DU RAPPORT COMPTABLE - KISSINE FLOW 2026
================================================================================`;

              } else if (accountingTab === 'CLOSURES') {
                const totalClosedRevenue = tenantClosures.reduce((sum, c) => sum + c.revenue, 0);
                const totalClosedExpenses = tenantClosures.reduce((sum, c) => sum + c.expenses, 0);
                const totalClosedNet = tenantClosures.reduce((sum, c) => sum + c.netProfit, 0);

                const tableRows = tenantClosures.sort((a,b)=> b.date.localeCompare(a.date)).map(c => 
                  `  * Journée du ${c.date} : Recettes: ${c.revenue.toLocaleString()} F | Dépenses: ${c.expenses.toLocaleString()} F | Net: ${c.netProfit.toLocaleString()} F | Tickets: ${c.ordersCount} | Panier Moyen: ${c.ticketAverage.toLocaleString()} F | Validé par: ${c.validatedBy}`
                ).join('\n') || '  (Aucune clôture archivée dans ce journal)';

                reportText = `================================================================================
                JOURNAL CONSOLIDÉ ET ARCHIVES DE CLÔTURES
================================================================================
Généré le : ${nowStr}
Établissement ID : ${tenantId}
Module actif : Archives de Clôtures Journalières

--------------------------------------------------------------------------------
1. PÉRIODE D'ANALYSE COMPTABLE DE L'ARCHIVE
--------------------------------------------------------------------------------
Période d'évaluation compilée sur l'historique complet des journées comptables définitivement 
verrouillées, validées et signées par la comptabilité ou la direction de kissine Flow :
  * Nombre de journées d'affaires clôturées : ${tenantClosures.length} sessions d'affaires verrouillées.

--------------------------------------------------------------------------------
2. INDICATEURS CLÉS DE PERFORMANCE (KPIs HISTORIQUES CUMULÉS)
--------------------------------------------------------------------------------
Les performances cumulées d'exploitation archivées se lisent comme suit :

  * Somme des Chiffres d'Affaires d'activité verouillés : ${totalClosedRevenue.toLocaleString()} FCFA
  * Somme des charges de caisse réelles consolidées : ${totalClosedExpenses.toLocaleString()} FCFA
  * Bénéfice Net validé cumulé : ${totalClosedNet.toLocaleString()} FCFA
  * Performance de rentabilité moyenne calculée sur fiches d'archives.

--------------------------------------------------------------------------------
3. ANALYSE DU PILOTAGE OPÉRATIONNEL HISTORIQUE (WIDGETS COMPTABILITÉ)
--------------------------------------------------------------------------------
* FIABILITÉ DES ENCAISSEMENTS ET POINTAGES DES TIROIRS :
  Le verrouillage obligatoire empêche toute altération rétroactive des écritures. Les recettes 
  digitalisées réduisent l'impact de coulage. Chaque journée archivée atteste la conformité 
  du tiroir-caisse avec un bilan d'inventaire cohérent.

--------------------------------------------------------------------------------
4. TABLEAU CHRONOLOGIQUE DES ARCHIVES DE CLÔTURE DE TIROIR DE CAISSE
--------------------------------------------------------------------------------
Liste structurée des bilans de clôtures archivées sur la plateforme :

${tableRows}

================================================================================
                  FIN DU RAPPORT COMPTABLE - KISSINE FLOW 2026
================================================================================`;

              } else {
                // MANAGE_CLOSURE tab
                reportText = `================================================================================
                SYNTHÈSE TECHNIQUE ET DIAGNOSTIC DE SÉCURITÉ DE SESSION COMPTOIR
================================================================================
Généré le : ${nowStr}
Établissement ID : ${tenantId}
Module actif : Clôture Journalière Active & Statistiques d'Exploitation du Jour

--------------------------------------------------------------------------------
1. PÉRIODE D'ANALYSE & SYSTÈME SÉCURITÉ DE SESSION
--------------------------------------------------------------------------------
Statut de l'environnement d'exploitation commerciale au point de contrôle :
  * Journée d'affaires ciblée comblée : ${targetToday}
  * Statut du verrou de caisse active : ${isTodayAlreadyClosed ? 'CLÔTURÉ (Session Verrouillée)' : isDayStarted ? 'OUVERT (Session en cours)' : 'NON INITIÉ (Alerte)'}
  * Opérateur principal en caisse aujourd'hui : ${activeUser.name} (${activeUser.role.toUpperCase()})

--------------------------------------------------------------------------------
2. INDICATEURS CLÉS DE PERFORMANCE DE LA SESSION DU ${targetToday}
--------------------------------------------------------------------------------
Éléments et flux de caisse comptabilisés :

  * Chiffre d'affaires brut consolidé : ${todayRevenues.toLocaleString()} FCFA
  * Nombre global de tickets validés dans l'imprimante thermique : ${todayOrdersCount} commandes
  * Panier moyen d'une table / client : ${todayBasketAverage.toLocaleString()} FCFA
  * Dépenses de trésorerie manuelles (Décaissements) : ${todayExpenses.toLocaleString()} FCFA

  => SOLDE FINANCIER DU JOUR (BENEFICE NET SIMPLIFIÉ) : ${todayNetProfit.toLocaleString()} FCFA

--------------------------------------------------------------------------------
3. ANALYSE DE LA MARGE ET FOOD COST DE CUISINE (WIDGET COMPRATIF)
--------------------------------------------------------------------------------
Analyse approfondie de l'efficacité matière :
  * Coût théorique des matières (BOM / Recette idéale) : ${todayCostGoods.toLocaleString()} FCFA
  * Marge Brute idéale (Théorique) : ${todayMarginValue.toLocaleString()} FCFA (${todayRevenues ? Math.round((todayMarginValue / todayRevenues) * 100) : 0}% de marge)

  * Coût de revient personnalisé restaurant (Coûts réels déclarés) : ${todayCostGoodsResto.toLocaleString()} FCFA
  * Marge brute d'exploitation réelle : ${todayMarginValueResto.toLocaleString()} FCFA (${todayRevenues ? Math.round((todayMarginValueResto / todayRevenues) * 100) : 0}% de marge)

  * Écart d'inventaire et de coulages direct de la session : ${(todayMarginValue - todayMarginValueResto).toLocaleString()} FCFA de perte ou écart théorique vs personnalisé.

--------------------------------------------------------------------------------
4. STATISTIQUES DES FLUX DE TIROIR DE CAISSE (RÉPARTITION DES FONDS)
--------------------------------------------------------------------------------
Détails de caisse à reporter physiquement lors de la pesée du tiroir-caisse :
  * Espèces physiques attendues en caisse : ${todayCashRev.toLocaleString()} FCFA
  * Chiffre d'affaires à recouvrer Mobile Orange Money : ${todayOMRev.toLocaleString()} FCFA
  * Chiffre d'affaires à recouvrer MTN Mobile Money : ${todayMoMoRev.toLocaleString()} FCFA

================================================================================
                  FIN DU RAPPORT COMPTABLE - KISSINE FLOW 2026
================================================================================`;
              }
              
              const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `KissineFlow_Comptabilite_Rapport_${new Date().toISOString().slice(0, 10)}.txt`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="px-3 py-1.5 border border-gray-250 bg-white hover:bg-gray-50 text-gray-750 hover:border-gray-300 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
            title="Exporter l'onglet comptable actif sous forme de rapport textuel détaillé"
          >
            <Download className="h-4 w-4 text-green-700" />
            <span>Exporter l'onglet actif</span>
          </button>
        </div>
      </div>

      {/* RENDER MODULE COMPONENT VIEWS */}
      {accountingTab === 'REGISTRY' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-gray-50 border p-4 rounded-lg flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-[11px] text-gray-700 uppercase tracking-wider">Filtres du Livre de Caisse & Trésorerie :</span>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-[11px] font-bold text-gray-500 whitespace-nowrap">Date :</label>
                <input
                  type="date"
                  value={registryDateFilter}
                  onChange={(e) => setRegistryDateFilter(e.target.value)}
                  className="p-1 px-2.5 bg-white border border-gray-250 rounded text-xs text-gray-950 font-bold focus:shadow-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <label className="text-[11px] font-bold text-gray-500 whitespace-nowrap">Type de flux :</label>
                <select
                  value={registryTypeFilter}
                  onChange={(e) => setRegistryTypeFilter(e.target.value as any)}
                  className="p-1 px-2.5 bg-white border border-gray-250 rounded text-xs text-gray-950 font-bold"
                >
                  <option value="ALL">Tous les flux (Entrées/Sorties)</option>
                  <option value="IN">Entrées uniquement (Ventes / Recettes +)</option>
                  <option value="OUT">Sorties uniquement (Décaissements -)</option>
                </select>
              </div>

              {(registryDateFilter || registryTypeFilter !== 'ALL') && (
                <button
                  onClick={() => {
                    setRegistryDateFilter('');
                    setRegistryTypeFilter('ALL');
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold text-red-650 hover:text-white bg-white hover:bg-red-600 border border-red-200 hover:border-red-600 rounded transition cursor-pointer"
                >
                  Réinitialiser
                </button>
              )}
            </div>
          </div>

          <div className="bg-white border text-xs text-gray-750 rounded-lg overflow-hidden shadow-2xs">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[10px] uppercase font-bold tracking-wider text-gray-500 border-b">
                <tr>
                  <th className="px-5 py-3">Date Mouvement</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3 text-right">Montant</th>
                  <th className="px-5 py-3">Mode d'Encaissement</th>
                  <th className="px-5 py-3">Référence Justif.</th>
                  <th className="px-5 py-3">Auteur</th>
                  <th className="px-5 py-3">Commentaire explicatif</th>
                  {(activeUser.role === 'ADMIN' || activeUser.role === 'MANAGER') && (
                    <th className="px-5 py-3 text-center">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y font-semibold text-gray-700">
                {/* Combine POS sales + manual movements to represent complete actual cash flows dynamically */}
                {[
                  ...tenantMovements.map(m => ({ ...m, isManual: true })),
                  ...tenantOrders.filter(o => o.status === 'VALIDATED' || o.status === 'CLOSED').map(o => ({
                    id: o.id,
                    date: `${o.date} ${o.time}`,
                    type: 'IN' as const,
                    amount: o.total,
                    reference: o.number,
                    comment: `Encaissement Vente Tactile POS - canal ${o.canal}`,
                    paymentMethod: o.paymentMethod,
                    userName: o.userName,
                    isManual: false
                  }))
                ].filter(flow => {
                  // Date matching
                  if (registryDateFilter && !flow.date.startsWith(registryDateFilter)) {
                    return false;
                  }
                  // Type matching
                  if (registryTypeFilter !== 'ALL' && flow.type !== registryTypeFilter) {
                    return false;
                  }
                  return true;
                }).sort((a,b) => b.date.localeCompare(a.date)).map((flow, flowIdx) => (
                  <tr key={`${flow.id}-${flowIdx}`} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5 font-mono text-gray-400 whitespace-nowrap">{flow.date}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      flow.type === 'IN' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-800'
                    }`}>
                      {flow.type === 'IN' ? 'Entrée Recette' : 'Sortie Décaissement'}
                    </span>
                  </td>
                  <td className={`px-5 py-3.5 text-right font-mono font-bold ${flow.type === 'IN' ? 'text-green-600' : 'text-red-505'}`}>
                    {flow.type === 'IN' ? '+' : '-'}{flow.amount.toLocaleString()} FCFA
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-mono">
                      {flow.paymentMethod}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[#1E4E8C] font-bold">{flow.reference}</td>
                  <td className="px-5 py-3.5 text-gray-500 font-normal">{flow.userName}</td>
                  <td className="px-5 py-3.5 text-gray-600 font-normal italic">{flow.comment}</td>
                  {(activeUser.role === 'ADMIN' || activeUser.role === 'MANAGER') && (
                    <td className="px-5 py-3.5 text-center">
                      {flow.isManual ? (
                        <div className="flex gap-1.5 justify-center">
                          <button
                            onClick={() => handleOpenMvtEdit(flow as any)}
                            className="p-1 px-1.5 border rounded bg-white hover:bg-blue-50 text-[#1E4E8C] flex items-center gap-0.5 text-[10px] font-bold cursor-pointer transition"
                            title="Modifier cette écriture"
                          >
                            <Edit className="h-2.5 w-2.5" />
                            <span>Éditer</span>
                          </button>
                          <button
                            onClick={() => handleDeleteMvt(flow.id, flow.reference)}
                            className="p-1 px-1.5 border border-red-200 rounded bg-white hover:bg-red-50 text-red-600 flex items-center gap-0.5 text-[10px] font-bold cursor-pointer transition"
                            title="Supprimer cette écriture"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                            <span>Suppr.</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-gray-400 font-normal italic">Automatique POS</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>
      )}

      {/* MANAGE CLOSURE (Validate closures checklist - Part 2 Module 7.10) */}
      {accountingTab === 'MANAGE_CLOSURE' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg border shadow-2xs p-6 space-y-4">
            <div className="flex border-b pb-3 justify-between items-start">
              <div>
                <h3 className="text-base font-bold text-gray-950">Générateur Clôture Caisse Actuelle : {targetToday}</h3>
                <p className="text-xs text-gray-500 mt-1">Consolidez les opérations du jour. La validation fige l'intégralité du grand livre d'affaire pour des raisons juridiques et fiscales.</p>
              </div>
              <span className="text-xs text-amber-800 bg-amber-50 px-2.5 py-1 rounded font-bold font-sans">Verrou de Journée</span>
            </div>

            {isTodayAlreadyClosed ? (
              <div className="p-12 text-center text-gray-500 space-y-4">
                <CheckCircle className="h-12 w-12 text-emerald-600 mx-auto" />
                <p className="text-sm font-semibold text-gray-800">Caisse déjà clôturée aujourd'hui !</p>
                <p className="text-xs text-gray-500">La journée d'exploitation commerciale du {targetToday} s'est achevée avec succès. Vous pouvez maintenant télécharger le bilan d'exploitation ou annuler la clôture pour simuler à nouveau.</p>
                <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
                  <button
                    onClick={() => generatePDFReport(targetToday)}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Télécharger / Exporter le Bilan PDF Complet</span>
                  </button>
                  {onResetDailyClosure && (
                    <div className="flex items-center gap-2">
                      {!showConfirmReopen ? (
                        <button
                          type="button"
                          onClick={() => setShowConfirmReopen(true)}
                          className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
                        >
                          <Sparkles className="h-4 w-4 text-amber-200" />
                          <span>Réouvrir la journée / Annuler la clôture</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 bg-amber-50 border border-amber-250 p-2 rounded-lg">
                          <span className="text-xs text-amber-900 font-extrabold px-1">Réouvrir la journée ? (Déverrouillera les ventes)</span>
                          <button
                            type="button"
                            onClick={() => {
                              onResetDailyClosure(targetToday);
                              setShowConfirmReopen(false);
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
                          >
                            Confirmer
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowConfirmReopen(false)}
                            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-lg text-xs transition cursor-pointer"
                          >
                            Annuler
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : !isDayStarted ? (
              <div className="p-12 text-center text-gray-500 space-y-4">
                <LockKeyhole className="h-12 w-12 text-[#1E4E8C] mx-auto animate-pulse" />
                <h4 className="text-sm font-bold text-gray-800 uppercase">La journée d'exploitation n'est pas encore activée</h4>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  Veuillez démarrer la journée d'affaires du {targetToday} pour ouvrir la caisse tactile (POS), permettre la saisie des tickets, ainsi que l'enregistrement des écritures de trésorerie.
                </p>
                <div className="pt-4">
                  <button
                    onClick={onStartDay}
                    className="px-6 py-3 bg-[#1E4E8C] hover:bg-blue-800 text-white font-extrabold rounded-lg text-xs flex items-center justify-center gap-2 mx-auto transition cursor-pointer shadow-md shadow-blue-900/20 active:translate-y-px"
                  >
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    <span>Activer et Commencer la journée d'affaires</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs font-semibold text-gray-650">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3.5 border rounded-lg">
                    <span className="text-gray-500 block text-[10px] uppercase">Cumul d'Affaires POS (Aujourd'hui) :</span>
                    <strong className="text-gray-950 font-bold font-mono text-lg block">{todayRevenues.toLocaleString()} FCFA</strong>
                    <span className="text-[10px] text-gray-500 font-normal block mt-1.5">Commandes conclues en caisse.</span>
                  </div>

                  <div className="bg-gray-50 p-3.5 border rounded-lg">
                    <span className="text-gray-500 block text-[10px] uppercase">Charges décaissements (Aujourd'hui) :</span>
                    <strong className="text-gray-950 font-bold font-mono text-lg block">{todayExpenses.toLocaleString()} FCFA</strong>
                    <span className="text-[10px] text-gray-500 font-normal block mt-1.5">Frais de cuisine et débours.</span>
                  </div>
                </div>

                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg flex justify-between">
                  <div>
                    <span className="text-emerald-900 font-bold text-sm block">Bénéfice Net théorique du jour</span>
                    <span className="text-emerald-700 text-[10px] font-normal font-sans">Revenu brut d'exploitation moins dépenses de caisse recensées.</span>
                  </div>
                  <strong className="text-emerald-800 font-bold font-mono text-xl self-center">{todayNetProfit.toLocaleString()} FCFA</strong>
                </div>

                {/* Validation checklist block */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-bold text-gray-950 uppercase">Rappel de pointage (Cash Breakdown) :</h4>
                  <div className="p-3 bg-gray-50 border rounded-lg divide-y divide-gray-100">
                    <div className="flex justify-between py-1.5 text-xs">
                      <span>Portion en Espèces (CASH) :</span>
                      <strong className="font-mono text-gray-900">{todayCashRev.toLocaleString()} FCFA</strong>
                    </div>
                    <div className="flex justify-between py-1.5 text-xs">
                      <span>Portion Orange Money :</span>
                      <strong className="font-mono text-gray-900">{todayOMRev.toLocaleString()} FCFA</strong>
                    </div>
                    <div className="flex justify-between py-1.5 text-xs">
                      <span>Portion MTN MoMo :</span>
                      <strong className="font-mono text-gray-900">{todayMoMoRev.toLocaleString()} FCFA</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={() => generatePDFReport(targetToday)}
                    className="py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Prévisualiser Bilan (PDF)</span>
                  </button>
                  <button
                    id="execute-daily-closure-btn"
                    onClick={handleExecuteDailyClosure}
                    className="py-3 bg-[#1E4E8C] hover:bg-blue-800 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Lock className="h-4 w-4" />
                    <span>CLÔTURER LA JOURNÉE D’AFFAIRES</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right helper panel: stats on margins and quantities */}
          <div className="bg-white p-5 rounded-lg border shadow-2xs text-xs space-y-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase">Statistiques d'exploitation {targetToday}</h3>
            
            <div className="space-y-3">
              <div className="flex justify-between py-1 border-b">
                <span className="text-gray-600">Nombre de commandes :</span>
                <strong className="font-sans text-gray-900 font-bold">{todayOrdersCount} tickets</strong>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-gray-600">Panier moyen d'une table :</span>
                <strong className="font-sans text-gray-900 font-bold">{todayBasketAverage.toLocaleString()} FCFA</strong>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-gray-600">Coût d'achat théorique (BOM) :</span>
                <strong className="font-sans text-gray-900 font-bold">{todayCostGoods.toLocaleString()} FCFA</strong>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-gray-600">Marge brute théorique (BOM) :</span>
                <strong className="font-sans text-indigo-600 font-bold">{todayMarginValue.toLocaleString()} FCFA</strong>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-slate-700">Coût de revient Resto personnalisé :</span>
                <strong className="font-sans text-emerald-900 font-semibold">{todayCostGoodsResto.toLocaleString()} FCFA</strong>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-700 font-semibold">Marge brute Resto cumulée :</span>
                <strong className="font-sans text-teal-650 font-extrabold">{todayMarginValueResto.toLocaleString()} FCFA</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ARCHIVED CLOSURES HISTORIES */}
      {accountingTab === 'CLOSURES' && (
        <div className="space-y-4 border rounded-lg bg-white overflow-hidden shadow-2xs text-xs text-gray-750">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase border-b">
              <tr>
                <th className="px-5 py-3">Date fermée</th>
                <th className="px-5 py-3 text-right">Rentrées d'Affaires</th>
                <th className="px-5 py-3 text-right">Décaissements / Charges</th>
                <th className="px-5 py-3 text-right">Bénéfice Net final</th>
                <th className="px-5 py-3 text-right">Ticket Moyen</th>
                <th className="px-5 py-3">Pointage Trésor (Espèces / OM / Momo)</th>
                <th className="px-5 py-3">Validateur d'intégration</th>
                <th className="px-5 py-3 text-center">Bilan PDF</th>
                {(activeUser.role === 'ADMIN' || activeUser.role === 'MANAGER') && (
                  <th className="px-5 py-3 text-center">Actions Admin</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y font-semibold text-gray-700">
              {tenantClosures.sort((a,b)=> b.date.localeCompare(a.date)).map(cl => (
                <tr key={cl.id} className="hover:bg-gray-50">
                  <td className="px-5 py-3.5 font-mono text-gray-900 font-bold flex items-center gap-1.5 whitespace-nowrap">
                    <Lock className="h-3.5 w-3.5 text-gray-400" />
                    {cl.date}
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-gray-900">{cl.revenue.toLocaleString()} FCFA</td>
                  <td className="px-5 py-3.5 text-right font-mono text-gray-500">{cl.expenses.toLocaleString()} FCFA</td>
                  <td className={`px-5 py-3.5 text-right font-mono font-bold ${cl.netProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {cl.netProfit.toLocaleString()} FCFA
                  </td>
                  <td className="px-5 py-3.5 text-right font-mono text-gray-600">{cl.ticketAverage.toLocaleString()} F</td>
                  <td className="px-5 py-3.5 text-gray-500 font-normal">
                    Esp: {cl.cashRevenue.toLocaleString()} F / OM: {cl.omRevenue.toLocaleString()} F / Momo: {cl.momoRevenue.toLocaleString()} F
                  </td>
                  <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{cl.validatedBy}</td>
                  <td className="px-5 py-3.5 text-center">
                    <button
                      onClick={() => {
                        generatePDFReport(cl.date);
                        logsAction(`Extrait de bilan PDF de la fermeture du ${cl.date} téléchargé`, 'COMPTABILITÉ & TRÉSORERIE');
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-[#1E4E8C] font-extrabold rounded text-[11px] transition-colors cursor-pointer"
                      title="Télécharger l'extrait complet d'exploitation PDF"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      <span>Exporter</span>
                    </button>
                  </td>
                  {(activeUser.role === 'ADMIN' || activeUser.role === 'MANAGER') && (
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex gap-1.5 justify-center">
                        <button
                          onClick={() => handleOpenClosureEdit(cl)}
                          className="p-1 px-1.5 border rounded bg-white hover:bg-blue-50 text-[#1E4E8C] flex items-center gap-0.5 text-[10px] font-bold cursor-pointer transition"
                          title="Modifier cette clôture"
                        >
                          <Edit className="h-2.5 w-2.5" />
                          <span>Éditer</span>
                        </button>
                        <button
                          onClick={() => handleDeleteClosure(cl.id, cl.date)}
                          className="p-1 px-1.5 border border-red-200 rounded bg-white hover:bg-red-50 text-red-600 flex items-center gap-0.5 text-[10px] font-bold cursor-pointer transition"
                          title="Supprimer cette clôture"
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
      )}

      {/* CREATE MANUAL MOVEMENT MODAL */}
      {showMvtModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 border shadow-2xl relative text-xs">
            <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b flex items-center gap-1.5">
              <Sparkles className="h-5 w-5 text-indigo-505 text-[#1E4E8C]" />
              Saisie Écriture Finançière de Caisse
            </h3>

            <div className="space-y-3.5 text-gray-700">
              <div className="space-y-1">
                <label className="text-gray-600 block">Sélecteur de mode de paiement *</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => setNewMvtPayment('CASH')}
                    className={`py-1.5 text-xs rounded border font-semibold ${newMvtPayment === 'CASH' ? 'bg-[#1E4E8C] text-white border-transparent' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                  >
                    Espèces
                  </button>
                  <button
                    onClick={() => setNewMvtPayment('OM')}
                    className={`py-1.5 text-xs rounded border font-semibold ${newMvtPayment === 'OM' ? 'bg-[#1E4E8C] text-white border-transparent' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                  >
                    O. Money
                  </button>
                  <button
                    onClick={() => setNewMvtPayment('MOMO')}
                    className={`py-1.5 text-xs rounded border font-semibold ${newMvtPayment === 'MOMO' ? 'bg-[#1E4E8C] text-white border-transparent' : 'bg-gray-50 border-gray-200 text-gray-600'}`}
                  >
                    MOMO
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-650 block">Montant brut (FCFA) *</label>
                <input
                  id="accounting-mvt-amount-input"
                  type="number"
                  placeholder="ex: 15000..."
                  value={newMvtAmount || ''}
                  onChange={(e) => setNewMvtAmount(parseInt(e.target.value) || 0)}
                  className="w-full p-2 border border-gray-250 rounded text-gray-950 font-mono focus:ring-1"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-650 block">Numéro de Pièce justificative / Facture *</label>
                <input
                  id="accounting-mvt-ref-input"
                  type="text"
                  placeholder="ex: FACT-YAS, SAL-JUIN..."
                  value={newMvtRef}
                  onChange={(e) => setNewMvtRef(e.target.value)}
                  className="w-full p-2 border border-gray-250 rounded text-gray-950"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-650 block">Libellé descriptif</label>
                <textarea
                  id="accounting-mvt-comment-input"
                  rows={2}
                  placeholder="Libellez clairement l'implication financière (ex: Achat d'ampoules, commission...)"
                  value={newMvtComment}
                  onChange={(e) => setNewMvtComment(e.target.value)}
                  className="w-full p-2 border border-blue-200 rounded text-gray-950 focus:outline-[#1E4E8C]"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-5 pt-3 border-t">
              <button
                id="cancel-acct-mvt-btn"
                onClick={() => { setShowMvtModal(false); setMvtToEdit(null); }}
                className="px-4 py-2 bg-gray-100 rounded text-gray-700 text-xs hover:bg-gray-200 cursor-pointer"
              >
                Annuler
              </button>
              <button
                id="submit-acct-mvt-btn"
                onClick={handleSaveMovement}
                className="px-4 py-2 bg-[#1E4E8C] text-white font-bold rounded text-xs hover:bg-blue-800 cursor-pointer"
              >
                {mvtToEdit ? "Appliquer Modifications" : "Inscrire Écriture de Caisse"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT DAILY CLOSURE MODAL FOR ADMIN/MANAGER */}
      {showClosureEditModal && closureToEdit && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 border shadow-2xl relative text-xs text-gray-700">
            <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b flex items-center gap-1.5 font-sans">
              <Lock className="h-5 w-5 text-[#1E4E8C]" />
              Ajuster Clôture Journalière : {closureToEdit.date}
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-gray-650 block font-semibold">Chiffre d'Affaires Brut (FCFA) *</label>
                <input
                  type="number"
                  value={clRevenue}
                  onChange={(e) => setClRevenue(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full p-2 border rounded font-mono text-gray-900 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-650 block font-semibold">Total charges ou débours (FCFA) *</label>
                <input
                  type="number"
                  value={clExpenses}
                  onChange={(e) => setClExpenses(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full p-2 border rounded font-mono text-gray-900"
                />
              </div>

              <div className="border p-2.5 rounded-lg space-y-2 bg-gray-50">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wide block">Pointages Trésor :</span>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[11px] text-gray-600 font-medium">Espèces (CASH)</span>
                    <input
                      type="number"
                      value={clCash}
                      onChange={(e) => setClCash(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-32 p-1 border rounded text-right font-mono"
                    />
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[11px] text-gray-600 font-medium">Orange Money</span>
                    <input
                      type="number"
                      value={clOM}
                      onChange={(e) => setClOM(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-32 p-1 border rounded text-right font-mono"
                    />
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-[11px] text-gray-600 font-medium">MTN MoMo</span>
                    <input
                      type="number"
                      value={clMoMo}
                      onChange={(e) => setClMoMo(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-32 p-1 border rounded text-right font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-650 block font-semibold">Validateur responsable *</label>
                <input
                  type="text"
                  value={clValidator}
                  onChange={(e) => setClValidator(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-5 pt-3 border-t">
              <button
                onClick={() => { setShowClosureEditModal(false); setClosureToEdit(null); }}
                className="px-4 py-2 bg-gray-100 rounded text-gray-700 text-xs hover:bg-gray-200 cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveClosureEdit}
                className="px-4 py-2 bg-[#1E4E8C] text-white font-bold rounded text-xs hover:bg-blue-800 cursor-pointer"
              >
                Enregistrer Modifications
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
