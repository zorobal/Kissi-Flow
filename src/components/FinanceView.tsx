/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  TrendingDown,
  Plus,
  Trash2,
  Edit2,
  Download,
  Upload,
  Coins,
  Receipt,
  FileSpreadsheet,
  AlertCircle,
  FileText,
  DollarSign
} from 'lucide-react';
import { Expense, ChargeType, User } from '../types';
import DateFilterComponent, {
  DateFilterState,
  initialDateFilterState,
  matchDateFilter
} from './DateFilter';

interface FinanceViewProps {
  expenses: Expense[];
  onAddExpense: (expense: Expense) => void;
  onUpdateExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  chargeTypes: ChargeType[];
  tenantId: string;
  activeUser: User;
  logsAction: (action: string, module: string) => void;
}

export default function FinanceView({
  expenses,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  chargeTypes,
  tenantId,
  activeUser,
  logsAction
}: FinanceViewProps) {
  // Master Date Filter and general layout state
  const [dateFilter, setDateFilter] = useState<DateFilterState>(initialDateFilterState);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'LIST' | 'GROUPED'>('LIST');

  const systemTvaRate = parseFloat(localStorage.getItem('system-tva') || '19.25');

  // Form Fields
  const [expenseIdInput, setExpenseIdInput] = useState(''); // Auto-generated & disabled
  const [dateField, setDateField] = useState(() => new Date().toISOString().split('T')[0]);
  const [categoryField, setCategoryField] = useState('');
  const [typeField, setTypeField] = useState<'FIXE' | 'VARIABLE'>('FIXE');
  const [descriptionField, setDescriptionField] = useState('');
  const [amountHtField, setAmountHtField] = useState<number>(0);
  const [tvaPercentField, setTvaPercentField] = useState<number>(systemTvaRate);
  const [referenceField, setReferenceField] = useState('');

  // Toast Alerts
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Auto-generate Unique Exp ID – Simple, explanatory, automatic nomenclature
  const generateUniqueExpId = (category?: string) => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, ''); // e.g. "20260618"
    const catClean = (category || categoryField || 'AUTRE').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5); // e.g. LOYER / CHG
    const rand = Math.floor(100 + Math.random() * 900); // 3 digits
    return `EXP-${dateStr}-${catClean}-${rand}`;
  };

  const handleOpenAdd = () => {
    setEditingExpenseId(null);
    const tenantCharges = chargeTypes.filter(c => c.tenantId === tenantId);
    const defaultCat = tenantCharges.length > 0 ? tenantCharges[0].name : 'Loyer';
    setExpenseIdInput(generateUniqueExpId(defaultCat));
    setDateField(new Date().toISOString().split('T')[0]);
    setCategoryField(defaultCat);
    setTypeField('FIXE');
    setDescriptionField('');
    setAmountHtField(0);
    setTvaPercentField(systemTvaRate);
    setReferenceField('');
    setShowAddForm(true);
  };

  const handleOpenEdit = (exp: Expense) => {
    setEditingExpenseId(exp.id);
    setExpenseIdInput(exp.id);
    setDateField(exp.date);
    setCategoryField(exp.category);
    setTypeField(exp.type);
    setDescriptionField(exp.description);
    setAmountHtField(exp.amountHt);
    setTvaPercentField(exp.tvaPercent);
    setReferenceField(exp.reference);
    setShowAddForm(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descriptionField.trim()) {
      showToast('Veuillez renseigner une description.', 'error');
      return;
    }
    if (amountHtField <= 0) {
      showToast('Le montant HT doit être strictement supérieur à 0 FCFA.', 'error');
      return;
    }

    const calculatedTtc = Math.round(amountHtField * (1 + tvaPercentField / 100));

    if (editingExpenseId) {
      const updated: Expense = {
        id: editingExpenseId,
        date: dateField,
        category: categoryField,
        type: typeField,
        description: descriptionField.trim(),
        amountHt: amountHtField,
        tvaPercent: tvaPercentField,
        amountTtc: calculatedTtc,
        reference: referenceField.trim() || 'SANS_REF',
        tenantId
      };
      onUpdateExpense(updated);
      showToast('Dépense mise à jour avec succès.', 'success');
      logsAction(`Modification de la dépense ${updated.id} (${updated.amountTtc} FCFA)`, 'FINANCE');
    } else {
      const created: Expense = {
        id: expenseIdInput,
        date: dateField,
        category: categoryField,
        type: typeField,
        description: descriptionField.trim(),
        amountHt: amountHtField,
        tvaPercent: tvaPercentField,
        amountTtc: calculatedTtc,
        reference: referenceField.trim() || 'N/A',
        tenantId
      };
      onAddExpense(created);
      showToast('Dépense enregistrée avec succès.', 'success');
      logsAction(`Saisie d'une nouvelle dépense ${created.id} - ${created.category} (${created.amountTtc} FCFA)`, 'FINANCE');
    }

    setShowAddForm(false);
  };

  const handleDelete = (id: string, ttc: number) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement cette dépense (${id}) ?`)) {
      onDeleteExpense(id);
      showToast('Dépense supprimée de la trésorerie.', 'success');
      logsAction(`Suppression de la dépense ${id} d'un montant de ${ttc} FCFA`, 'FINANCE');
    }
  };

  // Filter local tenant's expense records
  const tenantExpenses = expenses.filter(e => e.tenantId === tenantId);

  // Search & dynamic date range filtering logic
  const filteredExpenses = tenantExpenses.filter(e => {
    // 1. Apply universal search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchDesc = e.description.toLowerCase().includes(q);
      const matchRef = e.reference.toLowerCase().includes(q);
      const matchCat = e.category.toLowerCase().includes(q);
      const matchId = e.id.toLowerCase().includes(q);
      if (!matchDesc && !matchRef && !matchCat && !matchId) return false;
    }

    // 2. Apply Custom Date Filter Component algorithm
    return matchDateFilter(e.date, dateFilter);
  });

  // Calculate Cumulative Metrics
  const totalHt = filteredExpenses.reduce((sum, e) => sum + e.amountHt, 0);
  const totalTtc = filteredExpenses.reduce((sum, e) => sum + e.amountTtc, 0);
  const totalTva = totalTtc - totalHt;

  const countFixe = filteredExpenses.filter(e => e.type === 'FIXE').length;
  const countVariable = filteredExpenses.filter(e => e.type === 'VARIABLE').length;

  // EXPORT TO EXCEL
  const handleExportExcel = () => {
    logsAction('Export analytique textuel des dépenses directes', 'FINANCE');

    const getPeriodLabel = () => {
      switch (dateFilter.type) {
        case 'ALL':
          return 'Toutes les dates enregistrées';
        case 'TODAY':
          return "Aujourd'hui (11 Juin 2026 / Date d'affaires)";
        case 'WEEK':
          return 'Semaine en cours (Glissante 7 jours)';
        case 'SPECIFIC':
          return `Journée d'affaires spécifique du ${dateFilter.specificDate}`;
        case 'RANGE':
          return `Période du ${dateFilter.startDate} au ${dateFilter.endDate}`;
        case 'MONTHS':
          return `Mois cumulés de ${dateFilter.selectedMonths?.map(m => m).join(', ')} (Année ${dateFilter.year})`;
        default:
          return 'Période personnalisée';
      }
    };

    const categoriesMap: { [cat: string]: { ht: number; ttc: number; count: number } } = {};
    filteredExpenses.forEach(e => {
      if (!categoriesMap[e.category]) {
        categoriesMap[e.category] = { ht: 0, ttc: 0, count: 0 };
      }
      categoriesMap[e.category].ht += e.amountHt;
      categoriesMap[e.category].ttc += e.amountTtc;
      categoriesMap[e.category].count += 1;
    });

    // Control groups for major operational charges
    let totalLoyerTtc = 0;
    let totalEnergieTtc = 0;
    let totalSalairesTtc = 0;
    let totalApprovTtc = 0;
    let totalAutresTtc = 0;

    filteredExpenses.forEach(e => {
      const catNorm = e.category.toLowerCase().trim();
      if (catNorm.includes('loyer') || catNorm.includes('location')) {
        totalLoyerTtc += e.amountTtc;
      } else if (catNorm.includes('énerg') || catNorm.includes('eau') || catNorm.includes('electr') || catNorm.includes('assain')) {
        totalEnergieTtc += e.amountTtc;
      } else if (catNorm.includes('salaire') || catNorm.includes('personnel')) {
        totalSalairesTtc += e.amountTtc;
      } else if (catNorm.includes('matière') || catNorm.includes('ingredient') || catNorm.includes('approv')) {
        totalApprovTtc += e.amountTtc;
      } else {
        totalAutresTtc += e.amountTtc;
      }
    });

    const nowStr = new Date().toLocaleDateString('fr-FR') + ' ' + new Date().toLocaleTimeString('fr-FR');
    
    const reportText = `================================================================================
    RAPPORT ANALYTIQUE ET GESTION DES DÉPENSES DIRECTES - KISSINE FLOW
================================================================================
Généré le : ${nowStr} (Heure locale)
Établissement ID : ${tenantId}

--------------------------------------------------------------------------------
1. PÉRIODE D'ANALYSE SÉLECTIONNÉE
--------------------------------------------------------------------------------
La période opérationnelle couverte par cette analyse d'exploitation :
  * Type de filtre temporel : ${dateFilter.type}
  * Détails de la période : ${getPeriodLabel()}
  * Nombre de factures / pièces enregistrées : ${filteredExpenses.length} transaction(s)

La cohérence de vos écritures sur cette période permet d'assurer un suivi rigoureux
de vos flux de caisse et de votre trésorerie opérationnelle.

--------------------------------------------------------------------------------
2. SYNTHÈSE DES CHARGES & ENCADREMENT FISCAL (TVA)
--------------------------------------------------------------------------------
Pour la période sélectionnée, les coûts de trésorerie consolidés sont :

  * Total des Charges Hors Taxes (HT) : ${totalHt.toLocaleString()} FCFA
    (Base d'évaluation brute avant application des prélèvements légaux).

  * Total de la TVA payée / Estimée : ${totalTva.toLocaleString()} FCFA
    (Calculée d'après les bordereaux réels des taux de taxes à 19.25%).

  * Total des Décaissements de Trésorerie (TTC) : ${totalTtc.toLocaleString()} FCFA
    (Il s'agit de la sortie nette de trésorerie physique et digitale cumulée).

--------------------------------------------------------------------------------
3. CLASSIFICATION TEMPORELLE ET NATURE DES CHARGES
--------------------------------------------------------------------------------
Les charges directes se décomposent selon leur récurrence et volatilité :

  * Charges Fixes (Récurrentes, Loyers, abonnements stables) :
    - Volume : ${countFixe} facture(s) enregistrée(s)
    - Proportion : ${filteredExpenses.length ? Math.round((countFixe / filteredExpenses.length) * 100) : 0}% du volume d'écritures.

  * Charges Variables (Logistique, achats ingrédients, imprévus opérationnels) :
    - Volume : ${countVariable} facture(s) enregistrée(s)
    - Proportion : ${filteredExpenses.length ? Math.round((countVariable / filteredExpenses.length) * 100) : 0}% du volume d'écritures.

Observation critique : Un niveau de charges fixes élevé restreint l'agilité financière en cas de baisse 
de fréquentation. Nous vous préconisons de maintenir les dépenses variables flexibles en accord avec 
les niveaux d'activité de la heatmap des ventes.

--------------------------------------------------------------------------------
4. CONTRÔLE DES CHARGES STRATÉGIQUES D'EXPLOITATION (PILIERS MAJEURS)
--------------------------------------------------------------------------------
Enregistrement et contrôle des charges d'exploitation demandées :

  * ENG-L01 - CONTRÔLE DES LOYERS ET CHARGES LOCATIVES :
    - Budget Consommé : ${totalLoyerTtc.toLocaleString()} FCFA (TTC)
    - Observation : Rentrées stables, loyer commercial de l'établissement.

  * ENG-E02 - CONTRÔLE DES ÉNERGIES (Électricité & Eau) :
    - Budget Consommé : ${totalEnergieTtc.toLocaleString()} FCFA (TTC)
    - Observation : Factures fluides de service, électricité cuisine et consommation d'eau.

  * ENG-S03 - GESTION DES SALAIRES ET FRAIS DE PERSONNEL :
    - Budget Consommé : ${totalSalairesTtc.toLocaleString()} FCFA (TTC)
    - Observation : Rémunérations directes, indemnités et émoluments de l'équipe active.

  * ENG-A04 - APPROVISIONNEMENTS RESTAURANT & CUISINE :
    - Budget Consommé : ${totalApprovTtc.toLocaleString()} FCFA (TTC)
    - Observation : Achats alimentaires, matières premières et approvisionnements de stocks cuisine.

  * AUTRES ENREGISTREMENTS DE CHARGES COURANTES :
    - Budget Consommé : ${totalAutresTtc.toLocaleString()} FCFA (TTC)

--------------------------------------------------------------------------------
5. RÉPARTITION ANALYTIQUE DES DÉPENSES PAR CATÉGORIE ENREGISTRÉE
--------------------------------------------------------------------------------
Analyse approfondie de la concentration budgétaire par poste de dépenses :

${Object.entries(categoriesMap).map(([cat, val]) => {
  const percent = totalTtc ? ((val.ttc / totalTtc) * 100).toFixed(1) : '0.0';
  return `  * ${cat.padEnd(25)} : ${val.ttc.toLocaleString().padStart(12)} FCFA (${percent.padStart(5)}% du budget) | Base HT: ${val.ht.toLocaleString().padStart(12)} FCFA | ${val.count} pièce(s)`;
}).join('\n') || '  (Aucune catégorie enregistrée)'}

Méthode règlementaire : Le suivi rigoureux des ratios d'approvisionnement cuisine (Matières premières),
permet d'écarter le coulage et de maintenir un coût de revient de menu cohérent.

--------------------------------------------------------------------------------
6. JOURNAL CHRONOLOGIQUE DETAIL COMPTABLE (LIVRE DES DEPENSES)
--------------------------------------------------------------------------------
Liste exhaustive de toutes les lignes d'écritures pour la période et filtres appliqués :

${filteredExpenses.sort((a,b)=> b.date.localeCompare(a.date)).map(e => {
  return `  [${e.date}] ID: ${e.id.padEnd(12)} | Catégorie: ${e.category.padEnd(15)} | ${e.type.padEnd(8)} | Réf: ${e.reference.padEnd(12)} | TTC: ${e.amountTtc.toLocaleString().padStart(10)} FCFA (HT: ${e.amountHt.toLocaleString()} F, TVA: ${e.tvaPercent}%) | Note: ${e.description}`;
}).join('\n') || '  (Aucun mouvement à lister dans cette période)'}

================================================================================
                   FIN DU RAPPORT TECHNIQUE - KISSINE FLOW 2026
================================================================================`;

    try {
      const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `KissineFlow_Rapport_Depenses_${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast("Rapport analytique exporté avec succès !", "success");
    } catch (err) {
      showToast("Erreur lors de l'exportation du fichier de rapport.", "error");
    }
  };

  // IMPORT FROM EXCEL
  const handleImportExcel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        import('xlsx').then((XLSX) => {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const json: any[] = XLSX.utils.sheet_to_json(worksheet);

          let count = 0;
          json.forEach((row) => {
            // Mapping file headers securely
            const dateVal = row['Date Facture'] || row['Date'] || new Date().toISOString().split('T')[0];
            const catVal = row['Catégorie de Charge'] || row['Catégorie'] || 'Autres';
            const typeVal = (row['Nature Temporel'] || row['Type'] || 'FIXE').toUpperCase() === 'VARIABLE' ? 'VARIABLE' : 'FIXE';
            const descVal = row['Libellé / Désignation'] || row['Description'] || 'Importation Excel';
            const htVal = parseFloat(row['Base Hors Taxes (HT)'] || row['Montant HT'] || '0');
            const tvaVal = parseFloat(row['Taux TVA (%)'] || row['TVA (%)'] || '19.25');
            const refVal = String(row['Réf. document / Facture'] || row['Réf. document'] || 'EXCEL-IMPORT');

            if (htVal > 0) {
              const ttcVal = Math.round(htVal * (1 + tvaVal / 100));
              const newDep: Expense = {
                id: generateUniqueExpId(String(catVal)) + `-${count}`,
                date: String(dateVal).split(' ')[0],
                category: String(catVal),
                type: typeVal,
                description: String(descVal),
                amountHt: htVal,
                tvaPercent: tvaVal,
                amountTtc: ttcVal,
                reference: refVal,
                tenantId
              };
              onAddExpense(newDep);
              count++;
            }
          });

          if (count > 0) {
            showToast(`${count} dépenses importées depuis Excel.`, 'success');
            logsAction(`Import massif de ${count} dépenses via fichier Excel`, 'FINANCE');
          } else {
            showToast("Aucun enregistrement valide n'a été inséré.", 'error');
          }
        });
      } catch (err) {
        showToast('Fichier Excel incompatible ou corrompu.', 'error');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // IMPORT FROM TXT - Simple, robust text loader supporting pipe |, semi-colon ; and tab characters
  const handleImportTxt = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        let count = 0;

        lines.forEach((line) => {
          const cleanLine = line.trim();
          if (!cleanLine || cleanLine.startsWith('#') || cleanLine.startsWith('=')) return;

          // Try splitters
          let parts = cleanLine.split('|');
          if (parts.length < 3) parts = cleanLine.split(';');
          if (parts.length < 3) parts = cleanLine.split('\t');

          if (parts.length >= 3) {
            // Format: Date | Catégorie de Charge | Description | Réf Facture | Montant HT | Taux TVA
            const dateVal = parts[0]?.trim() || new Date().toISOString().split('T')[0];
            const catVal = parts[1]?.trim() || 'Autres';
            const descVal = parts[2]?.trim() || 'Importation TXT';
            const refVal = parts[3]?.trim() || 'TXT-REC';
            const htVal = parseFloat(parts[4]?.trim() || '0');
            const tvaVal = parseFloat(parts[5]?.trim() || '19.25');

            if (htVal > 0) {
              const ttcVal = Math.round(htVal * (1 + tvaVal / 100));
              const newDep: Expense = {
                id: generateUniqueExpId(catVal) + `-txt-${count}`,
                date: dateVal,
                category: catVal,
                type: 'VARIABLE', // Default to variable charge
                description: descVal,
                amountHt: htVal,
                tvaPercent: tvaVal,
                amountTtc: ttcVal,
                reference: refVal,
                tenantId
              };
              onAddExpense(newDep);
              count++;
            }
          }
        });

        if (count > 0) {
          showToast(`${count} dépenses chargées avec succès depuis TXT !`, 'success');
          logsAction(`Saisie en lot de ${count} dépenses par fichier plat TXT`, 'FINANCE');
        } else {
          showToast("Aucun lot valide trouvé. Format attendu : Date | Catégorie | Description | Réf | Montant HT | TVA", "error");
        }
      } catch (err) {
        showToast('Erreur de lecture du fichier texte.', 'error');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="p-6 space-y-6 font-sans">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-xl flex items-center gap-3 animate-bounce border text-xs font-bold ${
          toast.type === 'success'
            ? 'bg-emerald-50 text-emerald-850 border-emerald-250 bg-green-50 text-green-900 border-green-200'
            : 'bg-red-50 text-red-900 border-red-200'
        }`}>
          <AlertCircle className="h-5 w-5" />
          <span>{toast.text}</span>
        </div>
      )}

      {/* Head header segment */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-gray-905 text-gray-900 flex items-center gap-2">
            <Coins className="h-6 w-6 text-emerald-600" />
            <span>Gestion des Finances & Dépenses Directes</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Enregistrement et contrôle des charges d'exploitation (Loyers, Énergies, Salaires, Approvisionnements restau).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Action buttons */}
          <button
            id="finance-add-btn"
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1.5 transition select-none cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Nouvelle Dépense</span>
          </button>

          <button
            id="finance-export-btn"
            onClick={handleExportExcel}
            className="px-3 py-2 bg-white hover:bg-gray-50 text-gray-750 hover:border-gray-300 border border-gray-250 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
            title="Exporter l'affichage actif en Excel"
          >
            <Download className="h-4 w-4 text-green-700" />
            <span>Exporter</span>
          </button>

          <label className="px-3 py-2 bg-white hover:bg-gray-50 text-gray-750 hover:border-gray-300 border border-gray-250 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer select-none">
            <Upload className="h-4 w-4 text-blue-700" />
            <span>Importer Excel</span>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleImportExcel}
              className="hidden"
            />
          </label>

          <label className="px-3 py-2 bg-white hover:bg-gray-50 text-gray-750 hover:border-gray-300 border border-gray-250 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition cursor-pointer select-none">
            <Upload className="h-4 w-4 text-orange-700" />
            <span>Importer TXT</span>
            <input
              type="file"
              accept=".txt"
              onChange={handleImportTxt}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* High-fidelity custom Date Filter Component */}
      <DateFilterComponent idPrefix="finance-tab" state={dateFilter} onChange={setDateFilter} />

      {/* Performance Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 border border-gray-200 rounded-xl shadow-3xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wide">Volume des d'épenses</span>
            <span className="p-1 px-2.5 bg-gray-100 text-gray-600 text-[10px] rounded-full font-bold">
              {filteredExpenses.length} Factures
            </span>
          </div>
          <p className="text-2xl font-black text-gray-900 font-mono">
            {filteredExpenses.length}
          </p>
          <div className="text-[10px] text-gray-400 flex items-center gap-1">
            <span>Fixes : <strong>{countFixe}</strong></span>
            <span>•</span>
            <span>Variables : <strong>{countVariable}</strong></span>
          </div>
        </div>

        <div className="bg-white p-4.5 border border-gray-200 rounded-xl shadow-3xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wide">Total Hors Taxes (HT)</span>
            <div className="p-1.5 bg-emerald-50 rounded-lg text-emerald-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#1E4E8C] font-mono">
            {totalHt.toLocaleString()} <span className="text-xs font-bold text-gray-500">FCFA</span>
          </p>
          <p className="text-[10px] text-gray-400 italic">Méthode de comptabilité brute HT</p>
        </div>

        <div className="bg-white p-4.5 border border-gray-200 rounded-xl shadow-3xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wide">Frais de TVA collectée</span>
            <div className="p-1.5 bg-yellow-50 rounded-lg text-yellow-600">
              <Receipt className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 font-mono">
            {totalTva.toLocaleString()} <span className="text-xs font-bold text-gray-500">FCFA</span>
          </p>
          <p className="text-[10px] text-gray-400 italic">Moyenne calculée d'après le taux standard de {systemTvaRate}%</p>
        </div>

        <div className="bg-white p-4.5 border border-emerald-250 bg-emerald-50/10 rounded-xl shadow-3xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-emerald-800 font-extrabold uppercase tracking-wide">Dépenses Globales (TTC)</span>
            <div className="p-1.5 bg-red-100 rounded-lg text-red-600">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-red-650 text-red-600 font-mono">
            {totalTtc.toLocaleString()} <span className="text-xs font-bold text-gray-500">FCFA</span>
          </p>
          <p className="text-[10px] text-red-500/75 font-semibold">Décaissement net de trésorerie</p>
        </div>
      </div>

      {/* Creation/Edit Form collapsible block */}
      {showAddForm && (
        <div className="bg-gray-50/50 border border-gray-200 rounded-xl p-5 space-y-4 animate-fade-in text-xs max-w-4xl">
          <h3 className="text-sm font-extrabold text-gray-900 border-b pb-2">
            {editingExpenseId ? 'Modifier la fiche de dépense' : 'Saisir une facture ou dépense directe'}
          </h3>

          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="font-bold text-gray-700 block">ID Dépense Code unique (Automatique)</label>
              <input
                type="text"
                value={expenseIdInput}
                disabled
                className="w-full p-2.5 bg-gray-150 text-gray-550 border border-gray-300 rounded font-mono font-bold cursor-not-allowed select-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700 block text-gray-900">Date d'affaires *</label>
              <input
                type="date"
                required
                value={dateField}
                onChange={(e) => setDateField(e.target.value)}
                className="w-full p-2 border bg-white rounded font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700 block">Type de Charge (Catégorie) *</label>
              <select
                value={categoryField}
                onChange={(e) => setCategoryField(e.target.value)}
                className="w-full p-2 border bg-white rounded font-bold"
              >
                {chargeTypes.filter(c => c.tenantId === tenantId).map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
                {chargeTypes.filter(c => c.tenantId === tenantId).length === 0 && (
                  <>
                    <option value="Loyer">Loyer</option>
                    <option value="Salaires">Salaires</option>
                    <option value="Énergie">Énergie</option>
                    <option value="Eau">Eau</option>
                    <option value="Autres">Autres</option>
                  </>
                )}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700 block">Temporalité *</label>
              <select
                value={typeField}
                onChange={(e) => setTypeField(e.target.value as any)}
                className="w-full p-2 border bg-white rounded"
              >
                <option value="FIXE">Fixe (Factures récurrentes stables)</option>
                <option value="VARIABLE">Variable (Logistique, ingrédients restau...)</option>
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="font-bold text-gray-700 block">Description détaillée *</label>
              <input
                type="text"
                required
                placeholder="ex: Facture d'électricité Bali Juin 2026..."
                value={descriptionField}
                onChange={(e) => setDescriptionField(e.target.value)}
                className="w-full p-2 border bg-white rounded"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700 block">Réf. Document / Facture *</label>
              <input
                type="text"
                required
                placeholder="ex: ENEO-984213, FACT-2026-06"
                value={referenceField}
                onChange={(e) => setReferenceField(e.target.value)}
                className="w-full p-2 border bg-white text-gray-950 rounded uppercase"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700 block">Montant Hors Taxes * (FCFA)</label>
              <input
                type="number"
                required
                min="0"
                value={amountHtField || ''}
                onChange={(e) => setAmountHtField(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full p-2 border bg-white rounded font-mono font-bold text-gray-950"
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-gray-700 block">Taux TVA applicables (%)</label>
              <select
                value={tvaPercentField}
                onChange={(e) => setTvaPercentField(parseFloat(e.target.value))}
                className="w-full p-2 border bg-white rounded font-mono"
              >
                <option value={19.25}>19.25 % (Taux standard Cameroun)</option>
                <option value={0}>0.00 % (Exonéré de taxes)</option>
                <option value={5.5}>5.50 % (Taux réduit)</option>
              </select>
            </div>

            <div className="md:col-span-3 flex justify-end gap-2 pt-2 border-t">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-750 font-bold rounded-lg cursor-pointer transition select-none"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs cursor-pointer transition select-none"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main ledger table list */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-2xs overflow-hidden">
        {/* Sub filter bar */}
        <div className="p-4 border-b bg-gray-50/50 flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400 pointer-events-none text-xs">🔍</span>
              <input
                type="text"
                placeholder="Chercher ID, description, référence..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-250 rounded-lg text-xs placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-650 focus:border-blue-650 text-gray-900"
              />
            </div>

            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
              <button
                id="finance-toggle-list"
                onClick={() => setViewMode('LIST')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${viewMode === 'LIST' ? 'bg-[#1E4E8C] text-white' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Détail Chronologique
              </button>
              <button
                id="finance-toggle-grouped"
                onClick={() => setViewMode('GROUPED')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${viewMode === 'GROUPED' ? 'bg-[#1E4E8C] text-white' : 'text-gray-500 hover:text-gray-900'}`}
              >
                Groupé par Date & Catégorie (CHARGE)
              </button>
            </div>
          </div>

          <div className="text-xs text-gray-500 font-semibold">
            {viewMode === 'LIST' 
              ? `${filteredExpenses.length} Factures d'écritures` 
              : `${Array.from(new Set(filteredExpenses.map(e => `${e.date}_${e.category}`))).length} Catégories de Charges consolidées`
            } sur la période
          </div>
        </div>

        {/* Data list viewport */}
        <div className="overflow-x-auto">
          {viewMode === 'LIST' ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100 text-gray-700 border-b border-gray-200 uppercase text-[10px] font-extrabold tracking-wider">
                  <th className="p-3">ID DEPENSE</th>
                  <th className="p-3">DATE / JOURNAL</th>
                  <th className="p-3">CATÉGORIE (CHARGE)</th>
                  <th className="p-3">TYPE</th>
                  <th className="p-3">DESCRIPTION</th>
                  <th className="p-3 text-right">MONTANT HT</th>
                  <th className="p-3 text-right">TVA (%)</th>
                  <th className="p-3 text-right">MONTANT TTC</th>
                  <th className="p-3">RÉF. DOCUMENT</th>
                  <th className="p-3 text-center">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredExpenses.sort((a, b) => b.date.localeCompare(a.date)).map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/40">
                    <td className="p-3 font-mono font-bold text-[#1E4E8C] whitespace-nowrap">{exp.id}</td>
                    <td className="p-3 font-mono whitespace-nowrap">{exp.date}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-800 rounded font-bold uppercase text-[9px] tracking-wider">
                        {exp.category}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                        exp.type === 'FIXE' ? 'bg-orange-50 text-orange-850' : 'bg-cyan-50 text-cyan-850'
                      }`}>
                        {exp.type}
                      </span>
                    </td>
                    <td className="p-3 text-gray-850 max-w-xs truncate" title={exp.description}>
                      {exp.description}
                    </td>
                    <td className="p-3 text-right font-mono font-semibold">{exp.amountHt.toLocaleString()}</td>
                    <td className="p-3 text-right font-mono text-gray-400">{exp.tvaPercent}%</td>
                    <td className="p-3 text-right font-mono font-extrabold text-red-600 whitespace-nowrap">
                      {exp.amountTtc.toLocaleString()} <span className="text-[10px] text-gray-400 font-bold">F</span>
                    </td>
                    <td className="p-3 font-mono text-gray-500 uppercase whitespace-nowrap">{exp.reference}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(exp)}
                          className="text-gray-400 hover:text-blue-700 p-1 rounded hover:bg-blue-50 transition cursor-pointer"
                          title="Modifier la dépense"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(exp.id, exp.amountTtc)}
                          className="text-gray-400 hover:text-red-700 p-1 rounded hover:bg-red-50 transition cursor-pointer"
                          title="Détruire la dépense"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredExpenses.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-10 text-center text-gray-400 italic">
                      Aucune dépense enregistrée ne correspond à la période sélectionnée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            // GROUPED BY DATE & CATEGORY OF CHARGE VIEW
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100 text-gray-700 border-b border-gray-200 uppercase text-[10px] font-extrabold tracking-wider">
                  <th className="p-3">DATE DU JOURNAL</th>
                  <th className="p-3">CATÉGORIE DE CHARGE</th>
                  <th className="p-3 text-center">N° PIÈCES</th>
                  <th className="p-3">DESCRIPTIONS CONSOLIDÉES</th>
                  <th className="p-3">RÉFÉRENCES JUSTIFICATIFS</th>
                  <th className="p-3 text-right">CUMUL HORS TAXES (HT)</th>
                  <th className="p-3 text-right">VALORISATION RECOUVREE (TTC)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {(() => {
                  const groups: { [key: string]: { date: string; category: string; amountHt: number; amountTtc: number; count: number; refs: string[]; descs: string[] } } = {};
                  filteredExpenses.forEach(exp => {
                    const key = `${exp.date}_${exp.category}`;
                    if (!groups[key]) {
                      groups[key] = {
                        date: exp.date,
                        category: exp.category,
                        amountHt: 0,
                        amountTtc: 0,
                        count: 0,
                        refs: [],
                        descs: []
                      };
                    }
                    groups[key].amountHt += exp.amountHt;
                    groups[key].amountTtc += exp.amountTtc;
                    groups[key].count += 1;
                    if (exp.reference && exp.reference !== 'N/A' && !groups[key].refs.includes(exp.reference)) {
                      groups[key].refs.push(exp.reference);
                    }
                    if (exp.description && !groups[key].descs.includes(exp.description)) {
                      groups[key].descs.push(exp.description);
                    }
                  });
                  return Object.values(groups).sort((a,b) => b.date.localeCompare(a.date));
                })().map((g, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/40">
                    <td className="p-3.5 font-mono font-bold text-gray-900 whitespace-nowrap">{g.date}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 bg-orange-50 text-orange-850 rounded font-bold uppercase text-[9px] tracking-wider border border-orange-200">
                        {g.category}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="p-1 px-2.5 bg-gray-100 text-gray-700 font-extrabold font-mono text-[10px] rounded-full">
                        {g.count}
                      </span>
                    </td>
                    <td className="p-3.5 text-gray-600 max-w-xs truncate" title={g.descs.join(', ')}>
                      {g.descs.join('; ')}
                    </td>
                    <td className="p-3.5 font-mono text-gray-500 truncate max-w-xs" title={g.refs.join(', ')}>
                      {g.refs.length > 0 ? g.refs.join(', ') : 'N/A'}
                    </td>
                    <td className="p-3.5 text-right font-mono font-semibold text-gray-900">{g.amountHt.toLocaleString()} F</td>
                    <td className="p-3.5 text-right font-mono font-black text-red-600 whitespace-nowrap border-l border-gray-50 bg-red-50/15">
                      {g.amountTtc.toLocaleString()} <span className="text-[10px] text-gray-400 font-bold">FCFA</span>
                    </td>
                  </tr>
                ))}

                {filteredExpenses.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-gray-400 italic">
                      Aucune écriture de charge correspondante disponible.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
