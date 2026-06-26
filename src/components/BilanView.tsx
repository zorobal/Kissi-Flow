/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calculator,
  ArrowUpRight,
  Printer,
  ChevronRight,
  Download,
  AlertCircle,
  FileText,
  Building,
  Users,
  Droplet,
  Coffee,
  HelpCircle,
  Trash2
} from 'lucide-react';
import { Order, Expense, ChargeType, Dish, StockBatch, Ingredient } from '../types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import DateFilterComponent, {
  DateFilterState,
  initialDateFilterState,
  matchDateFilter,
  getDateFilterLabel
} from './DateFilter';
import { exportToExcel } from '../utils/export';

interface BilanViewProps {
  orders: Order[];
  expenses: Expense[];
  chargeTypes: ChargeType[];
  tenantId: string;
  dishes?: Dish[];
  stockBatches?: StockBatch[];
  ingredients?: Ingredient[];
  nonFoodItems?: any[];
  nonFoodMovements?: any[];
}

interface CustomOtherRevenue {
  id: string;
  name: string;
  amount: number;
}

export default function BilanView({
  orders,
  expenses,
  chargeTypes,
  tenantId,
  dishes = [],
  stockBatches = [],
  ingredients = [],
  nonFoodItems = [],
  nonFoodMovements = []
}: BilanViewProps) {
  // Date filter state
  const [dateFilter, setDateFilter] = useState<DateFilterState>(initialDateFilterState);

  // Manual Adjustments to fully customize Bilan report
  const [customOtherRevenues, setCustomOtherRevenues] = useState<CustomOtherRevenue[]>(() => {
    try {
      const saved = localStorage.getItem(`bilan-custom-revenues-${tenantId}`);
      if (saved) {
        return JSON.parse(saved);
      }
      // Migrate old otherRevenueName/val if they existed
      const oldName = localStorage.getItem('bilan-other-rev-name') || 'Autres produits et recettes financiers';
      return [
        { id: '1', name: oldName, amount: 0 }
      ];
    } catch (e) {
      console.error(e);
      return [
        { id: '1', name: 'Autres produits et recettes financiers', amount: 0 }
      ];
    }
  });

  const saveCustomRevenues = (revs: CustomOtherRevenue[]) => {
    setCustomOtherRevenues(revs);
    localStorage.setItem(`bilan-custom-revenues-${tenantId}`, JSON.stringify(revs));
  };

  const [systemTvaRate, setSystemTvaRate] = useState<number>(() => {
    return parseFloat(localStorage.getItem('system-tva') || '19.25');
  });

  useEffect(() => {
    const handleTvaChange = () => {
      setSystemTvaRate(parseFloat(localStorage.getItem('system-tva') || '19.25'));
    };
    window.addEventListener('system-tva-changed', handleTvaChange);
    return () => window.removeEventListener('system-tva-changed', handleTvaChange);
  }, []);

  const [adjustMatiere, setAdjustMatiere] = useState<number>(0);
  const [adjustSalaires, setAdjustSalaires] = useState<number>(0);
  const [adjustLoyer, setAdjustLoyer] = useState<number>(0);
  const [adjustEnergieEau, setAdjustEnergieEau] = useState<number>(0);
  const [adjustAutres, setAdjustAutres] = useState<number>(0);
  const [showLedgerBreakdown, setShowLedgerBreakdown] = useState<boolean>(false);

  // Filter systems
  const tenantOrders = orders.filter(o => o.tenantId === tenantId && (o.status === 'VALIDATED' || o.status === 'CLOSED'));
  const tenantExpenses = expenses.filter(e => e.tenantId === tenantId);

  // Time scope matching
  const periodOrders = tenantOrders.filter(o => matchDateFilter(o.date, dateFilter));
  const periodExpenses = tenantExpenses.filter(e => matchDateFilter(e.date, dateFilter));

  // --- PRESTATIONS (BUFFET & TRAITEUR) INTEGRATION ---
  const buffetsData = (() => {
    try {
      const saved = localStorage.getItem(`kissine-buffets-${tenantId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  })();

  const cateringData = (() => {
    try {
      const saved = localStorage.getItem(`kissine-catering-${tenantId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  })();

  // Filter prestations assigned to this period
  const periodBuffets = buffetsData.filter((b: any) => b.status === 'COMPLETED' && matchDateFilter(b.date, dateFilter));
  const periodCatering = cateringData.filter((c: any) => c.status === 'COMPLETED' && matchDateFilter(c.date, dateFilter));

  // Compute Buffet Completed Revenue (TTC & HT)
  const totalBuffetCompletedTtc = periodBuffets.reduce((sum: number, b: any) => {
    const pPrice = b.pricePerPlate !== undefined ? b.pricePerPlate : (b.pricePerPlateSold || 0);
    return sum + (b.platesRealSold || b.platesExpected || 0) * pPrice;
  }, 0);
  const totalBuffetCompletedHt = Math.round(totalBuffetCompletedTtc / (1 + systemTvaRate / 100));

  // Compute Catering Completed Revenue (TTC & HT)
  const totalCateringCompletedTtc = periodCatering.reduce((sum: number, c: any) => sum + (c.proposedPrice || 0), 0);
  const totalCateringCompletedHt = Math.round(totalCateringCompletedTtc / (1 + systemTvaRate / 100));

  // Compute Raw Material costs (Food Cost)
  const buffetCompletedCost = periodBuffets.reduce((sum: number, b: any) => {
    const ingredientsCost = b.ingredientsSelected ? b.ingredientsSelected.reduce((s: number, item: any) => s + (item.cost || 0), 0) : 0;
    return sum + ingredientsCost;
  }, 0);

  const cateringCompletedCost = periodCatering.reduce((sum: number, c: any) => sum + (c.actualCost || c.estimatedCost || 0), 0);

  // --- REVENUE Calculations ---
  // Chiffre d'affaires HT (CA TTC / (1 + systemTvaRate / 100) to isolate taxes)
  const caTtc = periodOrders.reduce((sum, o) => sum + o.total, 0);
  const caHt = Math.round(caTtc / (1 + systemTvaRate / 100));
  const otherRevenue = customOtherRevenues.reduce((sum, r) => sum + r.amount, 0);
  const totalProduits = caHt + totalBuffetCompletedHt + totalCateringCompletedHt + otherRevenue;

  // --- CHARGES SYSTEM (Auto-extracted from Finance Expenses by category) ---
  // 1a. Matières premières = Dish cost totals of orders + explicit prime materials expenses + buffet + catering + manual adjust
  const cogsMatiereVal = periodOrders.reduce((sum, o) => sum + (o.costTotal || 0), 0);
  const expensesMatiere = periodExpenses
    .filter(e => {
      const catNorm = e.category.toLowerCase().trim();
      return catNorm.includes('matière') || catNorm.includes('ingredient') || catNorm.includes('approv');
    })
    .reduce((sum, e) => sum + e.amountHt, 0);
  const totalMatiere = cogsMatiereVal + expensesMatiere + buffetCompletedCost + cateringCompletedCost + adjustMatiere;

  // 1b. Coût Resto personnalisé (user-defined Cost of Goods)
  let cogsRestoVal = 0;
  periodOrders.forEach(o => {
    o.lines.forEach(line => {
      const d = dishes.find(item => item.id === line.dishId);
      const uCost = d?.userCostPrice !== undefined && d?.userCostPrice !== null ? d.userCostPrice : (d?.theoreticalCost || 0);
      cogsRestoVal += uCost * line.quantity;
    });
  });
  const totalMatiereResto = cogsRestoVal + expensesMatiere + buffetCompletedCost + cateringCompletedCost + adjustMatiere;

  // 2. Salaires
  const expensesSalaires = periodExpenses
    .filter(e => e.category.toLowerCase().trim().includes('salaire') || e.category.toLowerCase().trim().includes('personnel'))
    .reduce((sum, e) => sum + e.amountHt, 0);
  const totalSalaires = expensesSalaires + adjustSalaires;

  // 3. Loyer
  const expensesLoyer = periodExpenses
    .filter(e => e.category.toLowerCase().trim().includes('loyer') || e.category.toLowerCase().trim().includes('location'))
    .reduce((sum, e) => sum + e.amountHt, 0);
  const totalLoyer = expensesLoyer + adjustLoyer;

  // 4. Énergie + Eau
  const expensesEnergieEau = periodExpenses
    .filter(e => {
      const catNorm = e.category.toLowerCase().trim();
      return catNorm.includes('énerg') || catNorm.includes('eau') || catNorm.includes('electr') || catNorm.includes('assain') || catNorm.includes('gaz');
    })
    .reduce((sum, e) => sum + e.amountHt, 0);
  const totalEnergieEau = expensesEnergieEau + adjustEnergieEau;

  // 5. Autres charges (any residue charges not accounted above)
  const accountedExpenseIds = new Set(
    periodExpenses
      .filter(e => {
        const catNorm = e.category.toLowerCase().trim();
        const isMatiere = catNorm.includes('matière') || catNorm.includes('ingredient') || catNorm.includes('approv');
        const isSalaires = catNorm.includes('salaire') || catNorm.includes('personnel');
        const isLoyer = catNorm.includes('loyer') || catNorm.includes('location');
        const isEnergie = catNorm.includes('énerg') || catNorm.includes('eau') || catNorm.includes('electr') || catNorm.includes('assain') || catNorm.includes('gaz');
        return isMatiere || isSalaires || isLoyer || isEnergie;
      })
      .map(e => e.id)
  );

  const expensesAutres = periodExpenses
    .filter(e => !accountedExpenseIds.has(e.id))
    .reduce((sum, e) => sum + e.amountHt, 0);
  const totalAutres = expensesAutres + adjustAutres;

  // --- VALORISATION PERTE EN STOCK DEPUIS LOTS ---
  const periodLosses = (stockBatches || [])
    .filter((b: any) => b.tenantId === tenantId && b.lossDeclared && b.lossValidated)
    .filter((b: any) => {
      const lossDate = b.lossValidatedDate || b.dateReceived || b.expiryDate;
      return matchDateFilter(lossDate, dateFilter);
    });

  const totalLossFromBatchesAmount = periodLosses.reduce((sum: number, b: any) => sum + (b.lossAmount || 0), 0);

  // --- VALORISATION CONSOMMATION & PERTES HORS-ALIMENTATION ---
  const tenantNonFoodMovements = nonFoodMovements.filter(mv => mv.tenantId === tenantId);
  const periodNonFoodMovements = tenantNonFoodMovements.filter(mv => matchDateFilter(mv.date.slice(0, 10), dateFilter));
  const totalNonFoodConsumptionAndLossVal = periodNonFoodMovements
    .filter(mv => mv.type === 'OUT' || mv.type === 'ADJUST_MINUS')
    .reduce((sum, mv) => sum + (mv.value || 0), 0);

  const totalCharges = totalMatiere + totalSalaires + totalLoyer + totalEnergieEau + totalAutres + totalLossFromBatchesAmount + totalNonFoodConsumptionAndLossVal;
  const totalChargesResto = totalMatiereResto + totalSalaires + totalLoyer + totalEnergieEau + totalAutres + totalLossFromBatchesAmount + totalNonFoodConsumptionAndLossVal;

  // --- FINAL RATIOS & NET INCOME ---
  const resultatNet = totalProduits - totalCharges;
  const margeNettePercent = totalProduits > 0 ? (resultatNet / totalProduits) * 100 : 0;

  // Custom Resto margins
  const resultatNetResto = totalProduits - totalChargesResto;
  const margeNettePercentResto = totalProduits > 0 ? (resultatNetResto / totalProduits) * 100 : 0;
  
  // Food Cost % = Matières premières / Total CA HT de l'établissement
  const totalAllCAHt = caHt + totalBuffetCompletedHt + totalCateringCompletedHt;
  const foodCostPercent = totalAllCAHt > 0 ? (totalMatiere / totalAllCAHt) * 100 : 0;
  const foodCostPercentResto = totalAllCAHt > 0 ? (totalMatiereResto / totalAllCAHt) * 100 : 0;

  // --- CALCUL VALORISATION SYNTHESE DES STOCKS ---
  const tenantIngredients = ingredients.filter(i => i.tenantId === tenantId && i.active);
  const totalFoodStockValuation = tenantIngredients.reduce((sum, i) => sum + (i.stockActual * (i.cmp || i.lastPurchasePrice || 0)), 0);
  const totalFoodArticlesInStock = tenantIngredients.filter(i => i.stockActual > 0).length;
  const underMinFoodArticles = tenantIngredients.filter(i => i.stockActual > 0 && i.stockActual <= i.stockMin).length;
  const outOfStockFoodArticles = tenantIngredients.filter(i => i.stockActual <= 0).length;

  const tenantNonFoodItems = nonFoodItems.filter(it => it.tenantId === tenantId && it.active);
  const totalNonFoodStockValuation = tenantNonFoodItems.reduce((sum, it) => sum + (it.stockActual * it.cmp), 0);
  const totalNonFoodArticlesInStock = tenantNonFoodItems.filter(i => i.stockActual > 0).length;
  const underMinNonFoodArticles = tenantNonFoodItems.filter(i => i.stockActual > 0 && i.stockActual <= i.stockMin).length;
  const outOfStockNonFoodArticles = tenantNonFoodItems.filter(i => i.stockActual <= 0).length;

  const totalJointStockValuation = totalFoodStockValuation + totalNonFoodStockValuation;
  const percentageFoodExact = totalJointStockValuation > 0 ? (totalFoodStockValuation / totalJointStockValuation) * 100 : 100;
  const percentageNonFoodExact = totalJointStockValuation > 0 ? (totalNonFoodStockValuation / totalJointStockValuation) * 100 : 0;

  // Render Date Period Text label
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
        return `Mois cumulés de ${dateFilter.selectedMonths.map(m => m).join(', ')} (Année ${dateFilter.year})`;
      default:
        return 'Période personnalisée';
    }
  };

  const handleExportExcel = () => {
    const reportText = `================================================================================
            RAPPORT FINANCIER & COMPTE DE RÉSULTAT - KISSINE FLOW
================================================================================
Généré le : ${new Date().toLocaleDateString('fr-FR')} - ${new Date().toLocaleTimeString('fr-FR')} (Heure locale)
Établissement ID : ${tenantId}

--------------------------------------------------------------------------------
1. PÉRIODE D'ANALYSE FINANCIÈRE
--------------------------------------------------------------------------------
La période couverte par cette reconstitution analytique de Compte de Résultat :
  * Type de filtre temporel : ${dateFilter.type}
  * Détails de la période : ${getPeriodLabel()}

--------------------------------------------------------------------------------
2. RECONSTITUTION DU COMPTE DE RÉSULTAT (PRODUITS VS CHARGES)
--------------------------------------------------------------------------------

A. PRODUITS D'EXPLOITATION (REVENUS DE L'ÉTABLISSEMENT)
  * Chiffre d'affaires HT - Restaurant (POS) :
    - Automatique : ${caHt.toLocaleString()} FCFA
    - Ajustement : 0 FCFA
    - Total : ${caHt.toLocaleString()} FCFA
    (Isolant fiscalement la taxe de ${systemTvaRate}% du CA global d'encaissement TTC).

  * Chiffre d'affaires HT - Prestations Buffets :
    - Automatique : ${totalBuffetCompletedHt.toLocaleString()} FCFA
    - Total : ${totalBuffetCompletedHt.toLocaleString()} FCFA
    (Rentrée de service Buffet Restaurant validée).

  * Chiffre d'affaires HT - Service Traiteur (Catering) :
    - Automatique : ${totalCateringCompletedHt.toLocaleString()} FCFA
    - Total : ${totalCateringCompletedHt.toLocaleString()} FCFA
    (Rentrée des prestations traiteurs contractés validée).

${customOtherRevenues.map(rev => `  * ${rev.name} :
    - Automatique : 0 FCFA
    - Ajustement : ${rev.amount.toLocaleString()} FCFA
    - Total : ${rev.amount.toLocaleString()} FCFA
    (Proportion de recettes exceptionnelles issues d'ajustements comptables).`).join('\n\n')}

  => TOTAL PRODUITS COMPTABILISÉS (A) : ${totalProduits.toLocaleString()} FCFA


B. CHARGES D'EXPLOITATION OPÉRATIONNELLES (COÛTS DE PRODUCTION)
  * Matières premières (Food Cost d'Ingrédients) :
    - Automatique (POS orders th. + factures approv + th. buffets + th. traiteurs) : ${(cogsMatiereVal + expensesMatiere + buffetCompletedCost + cateringCompletedCost).toLocaleString()} FCFA
    - Ajustement : ${adjustMatiere.toLocaleString()} FCFA
    - Total (Théorique fiches recettes) : ${totalMatiere.toLocaleString()} FCFA
    - Total (Méthode alternative des coûts de revient personnalisés) : ${totalMatiereResto.toLocaleString()} FCFA

  * Salaires & Emplois (Frais de personnel et rémunération équipe) :
    - Automatique : ${expensesSalaires.toLocaleString()} FCFA
    - Ajustement : ${adjustSalaires.toLocaleString()} FCFA
    - Total : ${totalSalaires.toLocaleString()} FCFA

  * Loyers Commerciaux de la période :
    - Automatique : ${expensesLoyer.toLocaleString()} FCFA
    - Ajustement : ${adjustLoyer.toLocaleString()} FCFA
    - Total : ${totalLoyer.toLocaleString()} FCFA

  * Énergies, Électricité & Eaux d'exploitation :
    - Automatique : ${expensesEnergieEau.toLocaleString()} FCFA
    - Ajustement : ${adjustEnergieEau.toLocaleString()} FCFA
    - Total : ${totalEnergieEau.toLocaleString()} FCFA

  * Autres charges de gestion courante / Frais administratifs :
    - Automatique : ${expensesAutres.toLocaleString()} FCFA
    - Ajustement : ${adjustAutres.toLocaleString()} FCFA
    - Total : ${totalAutres.toLocaleString()} FCFA

  => TOTAL DES CHARGES SUR LA PÉRIODE (B) :
    - En mode théorique (Fiches recettes Nomenclature) : ${totalCharges.toLocaleString()} FCFA
    - En mode réel d'exploitation (Coûts Resto) : ${totalChargesResto.toLocaleString()} FCFA


--------------------------------------------------------------------------------
3. RÉSULTATS GÉNÉRAUX ET RATIOS CLÉS
--------------------------------------------------------------------------------
* RÉSULTAT NET GLOBAL FINANCIER (A - B) :
  - Théorique (Sur fiches recettes idealisées) : ${resultatNet.toLocaleString()} FCFA
  - d'Exploitation Restaurant (Sur vos coûts de revient réels de cuisine) : ${resultatNetResto.toLocaleString()} FCFA

* TAUX DE MARGE NETTE (%) :
  - Moyen théorique modélisé : ${margeNettePercent.toFixed(2)} % du chiffre d'affaires
  - Réel d'exploitation de comptoir : ${margeNettePercentResto.toFixed(2)} % du chiffre d'affaires

* PROPORTION COÛT MATIÈRE / FOOD COST COMPTABLE (%) :
  - Ratio théorique modélisé : ${foodCostPercent.toFixed(2)} %
  - Ratio réel d'exploitation : ${foodCostPercentResto.toFixed(2)} %

================================================================================
                    Rapport de Pilotage Comptable KISSINE FLOW 2026
================================================================================`;

    const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `KissineFlow_Bilan_Financier_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBilanPrintPDF = async () => {
    const element = document.getElementById('layout-print-content') || document.querySelector('.p-6.space-y-6.font-sans');
    if (!element) return;

    // Save previous style
    const originalStyle = (element as HTMLElement).style.cssText;

    // Create custom printable header for Bilan PDF report
    const printHeader = document.createElement('div');
    printHeader.style.display = "flex";
    printHeader.style.justifyContent = "space-between";
    printHeader.style.alignItems = "center";
    printHeader.style.borderBottom = "2.5px solid #4338ca"; // Indigo theme for BilanView
    printHeader.style.paddingBottom = "18px";
    printHeader.style.marginBottom = "28px";
    printHeader.style.backgroundColor = "#ffffff";
    printHeader.style.color = "#000000";
    printHeader.style.fontFamily = "sans-serif";

    const leftDiv = document.createElement('div');
    leftDiv.style.display = "flex";
    leftDiv.style.alignItems = "center";
    leftDiv.style.gap = "14px";

    const logoIcon = document.createElement('div');
    logoIcon.innerText = "K";
    logoIcon.style.height = "50px";
    logoIcon.style.width = "50px";
    logoIcon.style.backgroundColor = "#4338ca"; // Indigo for bilan
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
    mainTitle.style.color = "#4338ca";
    mainTitle.style.margin = "0";

    const subTitle = document.createElement('p');
    subTitle.innerText = "RAPPORT FINANCIER & COMPTE DE RESULTAT";
    subTitle.style.fontSize = "8.5px";
    subTitle.style.fontWeight = "800";
    subTitle.style.color = "#4b5563";
    subTitle.style.margin = "3px 0 0 0";
    subTitle.style.letterSpacing = "0.08em";

    titleWrapper.appendChild(mainTitle);
    titleWrapper.appendChild(subTitle);
    leftDiv.appendChild(logoIcon);
    leftDiv.appendChild(titleWrapper);

    const rightDiv = document.createElement('div');
    rightDiv.style.textAlign = "right";
    rightDiv.style.fontSize = "11.5px";
    rightDiv.style.color = "#1f2937";
    rightDiv.style.lineHeight = "1.45";

    const tagLabel = document.createElement('p');
    tagLabel.innerText = "RAPPORT FINANCIER CERTIFIÉ";
    tagLabel.style.fontSize = "9.5px";
    tagLabel.style.backgroundColor = "#e0e7ff"; // Indigo tint
    tagLabel.style.color = "#4338ca";
    tagLabel.style.padding = "2px 8px";
    tagLabel.style.borderRadius = "4px";
    tagLabel.style.display = "inline-block";
    tagLabel.style.fontWeight = "800";
    tagLabel.style.border = "1px solid #c7d2fe";
    tagLabel.style.marginBottom = "5px";

    const restText = document.createElement('p');
    restText.innerHTML = `Restaurant : <strong style="color:#000000">RESTAURANT KISSINE</strong>`;

    const siteText = document.createElement('p');
    siteText.innerHTML = `Site Opérationnel : <strong style="color:#4338ca">${tenantId === 'tenant-douala' ? 'Douala Akwa' : 'Yaoundé Bastos'}</strong>`;

    const dateText = document.createElement('p');
    dateText.innerHTML = `Généré le : <strong>${new Date().toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</strong>`;

    const periodText = document.createElement('p');
    periodText.innerHTML = `Période : <strong style="color:#1e4e8c">${getDateFilterLabel(dateFilter)}</strong>`;

    rightDiv.appendChild(tagLabel);
    rightDiv.appendChild(restText);
    rightDiv.appendChild(siteText);
    rightDiv.appendChild(dateText);
    rightDiv.appendChild(periodText);

    printHeader.appendChild(leftDiv);
    printHeader.appendChild(rightDiv);

    element.insertBefore(printHeader, element.firstChild);

    (element as HTMLElement).style.backgroundColor = "#ffffff";
    (element as HTMLElement).style.color = "#000000";
    (element as HTMLElement).style.width = "1024px";
    (element as HTMLElement).style.padding = "24px";

    const nonPrintableElements = element.querySelectorAll('.print\\:hidden, button, #bilan-print-btn, #bilan-export-btn');
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

    const stripUnsupportedColors = (cssText: string, fallbackColor = '#4338ca'): string => {
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
          tag.innerHTML = stripUnsupportedColors(tag.innerHTML, '#4338ca');
        }
      });

      // Fetch and sanitize linked stylesheets
      for (const link of linkTags) {
        try {
          const response = await fetch(link.href);
          if (response.ok) {
            const cssText = await response.text();
            if (cssText.includes('oklch') || cssText.includes('oklab') || cssText.includes('OKLCH') || cssText.includes('OKLAB')) {
              const cleanCss = stripUnsupportedColors(cssText, '#4338ca');
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
          htmlEl.style.cssText = stripUnsupportedColors(htmlEl.style.cssText, '#4338ca');
        }
      });

      const toastDiv = document.createElement('div');
      toastDiv.innerHTML = `
        <div style="position:fixed; bottom:24px; right:24px; background-color:#4338ca; color:white; padding:12px 20px; border-radius:8px; font-weight:bold; font-size:12px; font-family:sans-serif; box-shadow:0 4px 12px rgba(0,0,0,0.15); z-index:9999; display:flex; align-items:center; gap:8px;">
          <svg class="animate-spin" style="height:16px; width:16px; color:white;" fill="none" viewBox="0 0 24 24">
            <circle style="opacity:0.25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path style="opacity:0.75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Compilation du Bilan PDF en cours...</span>
        </div>
      `;
      document.body.appendChild(toastDiv);

      const finalWidth = Math.max(1200, element ? element.scrollWidth : 1200);
      const canvas = await html2canvas(element as HTMLElement, {
        scale: 2,
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

      pdf.save(`bilan_financier_${tenantId === 'tenant-douala' ? 'douala' : 'yaounde'}_${new Date().toISOString().slice(0, 10)}.pdf`);

    } catch (err: any) {
      console.error("Erreur PDF Bilan :", err);
      alert("Impossible de compléter l'impression : " + err.message);
    } finally {
      // Restore window getComputedStyle
      window.getComputedStyle = originalGetComputedStyle;

      // Restore style sheets (re-enabling original oklch values for browser rendering)
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

      nonPrintableElements.forEach((el: any, idx) => {
        el.style.display = originalDisplays[idx];
      });
      element.removeChild(printHeader);
      (element as HTMLElement).style.cssText = originalStyle;
    }
  };

  return (
    <div className="p-6 space-y-6 font-sans">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-5">
        <div>
          <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
            <Calculator className="h-6 w-6 text-indigo-700" />
            <span>Rapport & Bilan Financier d'Exploitation</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Reconstitution automatique du Compte de Résultat (Produits vs Charges), ratios de marge nette, et structure analytique du Food Cost.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="bilan-print-btn"
            onClick={handleBilanPrintPDF}
            className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 hover:border-gray-300 border border-gray-250 text-xs font-bold rounded-lg flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimer</span>
          </button>

          <button
            id="bilan-export-btn"
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-2xs cursor-pointer"
          >
            <Download className="h-4 w-4" />
            <span>Exporter le Bilan</span>
          </button>
        </div>
      </div>

      {/* Date Filter Widget */}
      <DateFilterComponent idPrefix="bilan-tab" state={dateFilter} onChange={setDateFilter} />

      {/* Quick Summary Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* TOTAL PRODUITS */}
        <div className="bg-white p-5 border border-indigo-150 rounded-xl shadow-2xs space-y-2 relative overflow-hidden">
          <div className="absolute right-0 top-0 h-16 w-16 bg-blue-50/40 rounded-bl-full flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-indigo-650" />
          </div>
          <span className="text-[10px] text-gray-450 font-extrabold uppercase tracking-widest block">TOTAL PRODUITS (A)</span>
          <p className="text-2xl font-black text-indigo-900 font-mono">
            {totalProduits.toLocaleString()} FCFA
          </p>
          <div className="text-[10px] pt-2 text-gray-500 border-t space-y-1 mt-1 font-medium">
            <div className="flex justify-between">
              <span>Resto (POS) CA HT :</span>
              <strong className="text-gray-950 font-mono">{caHt.toLocaleString()} F</strong>
            </div>
            <div className="flex justify-between text-blue-700">
              <span>Prestations Buffets :</span>
              <strong className="font-mono font-bold">{totalBuffetCompletedHt.toLocaleString()} F</strong>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span>Service Traiteur :</span>
              <strong className="font-mono font-bold">{totalCateringCompletedHt.toLocaleString()} F</strong>
            </div>
            {otherRevenue > 0 && (
              <div className="flex justify-between text-amber-700">
                <span>Ajustements Divers :</span>
                <strong className="font-mono">{otherRevenue.toLocaleString()} F</strong>
              </div>
            )}
          </div>
        </div>
        <div className="bg-white p-5 border border-red-150 rounded-xl shadow-2xs space-y-2 relative overflow-hidden">
          <div className="absolute right-0 top-0 h-16 w-16 bg-red-50/40 rounded-bl-full flex items-center justify-center">
            <TrendingDown className="h-5 w-5 text-red-655" />
          </div>
          <span className="text-[10px] text-gray-450 font-extrabold uppercase tracking-widest block">TOTAL CHARGES (B)</span>
          <div className="space-y-1">
            <p className="text-base font-bold text-red-600 font-mono" title="Basé sur la BOM matières premières">
              BOM: {totalCharges.toLocaleString()} FCFA
            </p>
            <p className="text-base font-bold text-teal-850 font-mono" title="Basé sur votre coût de revient resto">
              Resto: {totalChargesResto.toLocaleString()} FCFA
            </p>
          </div>
          
          <div className="text-[10px] pt-2 text-gray-500 border-t space-y-1 mt-1 font-medium">
            <div className="flex justify-between text-red-650">
              <span>BOM Food Cost totalisé :</span>
              <strong className="font-mono">{totalMatiere.toLocaleString()} F</strong>
            </div>
            <div className="flex justify-between text-teal-750">
              <span>Resto Coût Ingrédients :</span>
              <strong className="font-mono">{totalMatiereResto.toLocaleString()} F</strong>
            </div>
            <div className="flex justify-between text-[#1E4E8C] pt-1.5 border-t border-dashed">
              <span>Autres Charges Exploitation :</span>
              <strong className="font-mono">{(totalSalaires + totalLoyer + totalEnergieEau + totalAutres).toLocaleString()} F</strong>
            </div>
            <div className="text-[9px] text-gray-400 pl-2 mt-0.5 space-y-0.5">
              <div className="flex justify-between">
                <span>• Personnel & Salaires :</span>
                <span>{totalSalaires.toLocaleString()} F</span>
              </div>
              <div className="flex justify-between">
                <span>• Loyers Commerciaux :</span>
                <span>{totalLoyer.toLocaleString()} F</span>
              </div>
              <div className="flex justify-between">
                <span>• Énergie, Eau & Gaz :</span>
                <span>{totalEnergieEau.toLocaleString()} F</span>
              </div>
              <div className="flex justify-between">
                <span>• Autres Dépenses Directes :</span>
                <span>{totalAutres.toLocaleString()} F</span>
              </div>
            </div>
            {totalLossFromBatchesAmount > 0 && (
              <div className="flex justify-between text-rose-700 pt-1.5 border-t border-dashed border-red-200 font-bold uppercase text-[9px] tracking-wider">
                <span>📉 Pertes de Stock Valide :</span>
                <strong className="font-mono">{totalLossFromBatchesAmount.toLocaleString()} F</strong>
              </div>
            )}
            {totalNonFoodConsumptionAndLossVal > 0 && (
              <div className="flex justify-between text-sky-750 pt-1.5 border-t border-dashed border-sky-200 font-bold uppercase text-[9px] tracking-wider">
                <span>📦 Consommation Hors-Alim :</span>
                <strong className="font-mono">{totalNonFoodConsumptionAndLossVal.toLocaleString()} F</strong>
              </div>
            )}
          </div>
        </div>

        {/* RESULTAT NET COCKPIT */}
        <div className="bg-gradient-to-br from-[#0B1F3F] to-[#142D55] p-5 rounded-xl text-white shadow-md space-y-2 relative overflow-hidden border-l-4 border-[#F26522]">
          <span className="text-[10px] text-orange-400 font-bold uppercase tracking-widest block">RÉSULTAT NET COCKPIT</span>
          <div className="space-y-2 border-b border-white/10 pb-2">
            <div>
              <div className="flex justify-between items-center text-xs text-gray-300 font-bold">
                <span>Résultat Net (BOM) :</span>
                <span className={`font-mono font-bold ${resultatNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {margeNettePercent.toFixed(1)}%
                </span>
              </div>
              <p className={`text-base font-mono font-black ${resultatNet >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {resultatNet.toLocaleString()} FCFA
              </p>
            </div>

            <div className="pt-2 border-t border-white/5">
              <div className="flex justify-between items-center text-xs text-gray-300 font-bold font-sans">
                <span>Résultat Net (Resto) :</span>
                <span className={`font-mono font-bold ${resultatNetResto >= 0 ? 'text-teal-400' : 'text-red-400'}`}>
                  {margeNettePercentResto.toFixed(1)}%
                </span>
              </div>
              <p className={`text-base font-mono font-black ${resultatNetResto >= 0 ? 'text-teal-405' : 'text-red-405'}`}>
                {resultatNetResto.toLocaleString()} FCFA
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 font-bold">
            <div className="bg-white/5 border border-white/5 p-1.5 rounded">
              <span className="text-gray-300 block text-[9px] uppercase tracking-wider">BOM FOOD COST</span>
              <span className="text-[#F26522] font-mono font-black text-xs">{foodCostPercent.toFixed(1)} %</span>
            </div>
            <div className="bg-white/5 border border-white/5 p-1.5 rounded">
              <span className="text-gray-300 block text-[9px] uppercase tracking-wider">RESTO FOOD COST</span>
              <span className="text-[#F26522] font-mono font-black text-xs">{foodCostPercentResto.toFixed(1)} %</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main analytical Bilan table & controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: THE INCOME STATEMENT LEDGER (COMPTE DE RESULTAT) */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
            <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <Calculator className="h-4 w-4 text-[#1E4E8C]" />
              <span>Détail Analytique du Bilan Économique ({getPeriodLabel()})</span>
            </h3>
            <span className="text-[9px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase">Comptabilité Réelle</span>
          </div>

          <div className="p-4 space-y-4">
            
            {/* PRODUITS (REVENUS) SECTION */}
            <div className="space-y-2">
              <span className="font-black text-[11px] text-[#1E4E8C] tracking-widest block uppercase border-b-2 border-blue-50 pb-1">1. PRODUITS & RECETTES D'EXPLOITATION</span>
              
              <div className="divide-y text-xs text-gray-700">
                <div className="flex justify-between py-2.5 items-center pl-3">
                  <div className="flex items-center gap-2">
                    <ChevronRight className="h-3 w-3 text-gray-400" />
                    <span>Chiffre d'affaires HT - Restaurant (POS)</span>
                    <span className="text-[9px] bg-gray-100 text-gray-500 font-normal px-1 rounded">Ventes réelles HT</span>
                  </div>
                  <div className="font-mono font-bold text-gray-900">{caHt.toLocaleString()} F</div>
                </div>

                <div className="flex justify-between py-2.5 items-center pl-3">
                  <div className="flex items-center gap-2">
                    <ChevronRight className="h-3 w-3 text-blue-400" />
                    <span>Chiffre d'affaires HT - Prestations Buffets</span>
                    <span className="text-[9px] bg-blue-50 text-blue-600 font-bold px-1 rounded">Buffets terminés ({periodBuffets.length})</span>
                  </div>
                  <div className="font-mono font-bold text-gray-900">{totalBuffetCompletedHt.toLocaleString()} F</div>
                </div>

                <div className="flex justify-between py-2.5 items-center pl-3">
                  <div className="flex items-center gap-2">
                    <ChevronRight className="h-3 w-3 text-emerald-400" />
                    <span>Chiffre d'affaires HT - Service Traiteur</span>
                    <span className="text-[9px] bg-emerald-50 text-emerald-600 font-bold px-1 rounded">Contrats terminés ({periodCatering.length})</span>
                  </div>
                  <div className="font-mono font-bold text-gray-900">{totalCateringCompletedHt.toLocaleString()} F</div>
                </div>

                {customOtherRevenues.map((rev, idx) => (
                  <div key={rev.id || idx} className="flex justify-between py-2.5 items-center pl-3">
                    <div className="flex items-center gap-2">
                      <ChevronRight className="h-3 w-3 text-gray-400" />
                      <span>{rev.name || `Autre produit/recette financier #${idx + 1}`}</span>
                      <span className="text-[9px] bg-amber-50 text-amber-600 font-bold px-1 rounded">Ajustement manuel</span>
                    </div>
                    <div className="font-mono font-bold text-gray-900">{rev.amount.toLocaleString()} F</div>
                  </div>
                ))}

                <div className="flex justify-between py-3 items-center bg-indigo-50/20 font-black text-indigo-900 text-sm pl-4 rounded-lg">
                  <span>TOTAL PRODUITS (A)</span>
                  <span className="font-mono">{totalProduits.toLocaleString()} FCFA</span>
                </div>
              </div>
            </div>

            {/* CHARGES (EXPENSES) SECTION */}
            <div className="space-y-2 pt-2">
              <span className="font-black text-[11px] text-red-700 tracking-widest block uppercase border-b-2 border-red-50 pb-1">2. CHARGES & DÉCAISSEMENTS D'EXPLOITATION</span>
              
              <div className="divide-y text-xs text-gray-700">
                
                {/* MATIERE PREMIERE */}
                <div className="flex justify-between py-2.5 items-start pl-3">
                  <div className="flex items-center gap-2">
                    <Coffee className="h-3.5 w-3.5 text-orange-600 shrink-0 mt-0.5" />
                    <div className="flex flex-col">
                      <span>Matières premières (Food Cost combiné)</span>
                      <span className="text-[8px] text-gray-400 font-medium">BOM Ingrédients: {cogsMatiereVal.toLocaleString()} F | Achats direct: {expensesMatiere.toLocaleString()} F | Buffets: {buffetCompletedCost.toLocaleString()} F | Traiteurs: {cateringCompletedCost.toLocaleString()} F</span>
                      <span className="text-[8px] text-teal-600 font-semibold">Resto Coût de revient: {cogsRestoVal.toLocaleString()} F (+ achats & prestations: {(expensesMatiere + buffetCompletedCost + cateringCompletedCost).toLocaleString()} F)</span>
                    </div>
                  </div>
                  <div className="font-mono text-right text-xs">
                    <div className="text-gray-900 font-medium">BOM: {totalMatiere.toLocaleString()} F</div>
                    <div className="text-teal-700 font-bold">Resto: {totalMatiereResto.toLocaleString()} F</div>
                  </div>
                </div>

                {/* SALAIRES */}
                <div className="flex justify-between py-2.5 items-center pl-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <div className="flex flex-col">
                      <span>Charges de personnel & Salaires</span>
                      <span className="text-[8px] text-gray-400 font-medium">Comptabilisés: {expensesSalaires.toLocaleString()} F</span>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-gray-900">{totalSalaires.toLocaleString()} F</div>
                </div>

                {/* LOYER */}
                <div className="flex justify-between py-2.5 items-center pl-3">
                  <div className="flex items-center gap-2">
                    <Building className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                    <div className="flex flex-col">
                      <span>Loyers Commerciaux</span>
                      <span className="text-[8px] text-gray-400 font-medium">Comptabilisés: {expensesLoyer.toLocaleString()} F</span>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-gray-900">{totalLoyer.toLocaleString()} F</div>
                </div>

                {/* ENERGIE + EAU */}
                <div className="flex justify-between py-2.5 items-center pl-3">
                  <div className="flex items-center gap-2">
                    <Droplet className="h-3.5 w-3.5 text-cyan-600 shrink-0" />
                    <div className="flex flex-col">
                      <span>Énergie + Distribution Eau d'exploitation</span>
                      <span className="text-[8px] text-gray-400 font-medium">Comptabilisés: {expensesEnergieEau.toLocaleString()} F</span>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-gray-900">{totalEnergieEau.toLocaleString()} F</div>
                </div>

                {/* AUTRES */}
                <div className="flex justify-between py-2.5 items-center pl-3">
                  <div className="flex items-center gap-2">
                    <ChevronRight className="h-3 w-3 text-gray-400 text-teal-600" />
                    <div className="flex flex-col">
                      <span>Autres charges courantes</span>
                      <span className="text-[8px] text-gray-400 font-medium">Comptabilisés: {expensesAutres.toLocaleString()} F</span>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-gray-900">{totalAutres.toLocaleString()} F</div>
                </div>

                {/* PERTES & GASPILLAGES DE STOCK */}
                {totalLossFromBatchesAmount > 0 && (
                  <div className="flex justify-between py-2.5 items-center pl-3 bg-red-50/15 border-l-2 border-red-500 my-1">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-3.5 w-3.5 text-red-650 shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-bold text-red-800">Pertes & Gaspillages de stock validés</span>
                        <span className="text-[8px] text-gray-400 font-medium font-sans">
                          Valorisation au coût moyen des lots périmés ou constatés en avarie sur la période
                        </span>
                      </div>
                    </div>
                    <div className="font-mono font-black text-red-650 text-xs pr-1">{totalLossFromBatchesAmount.toLocaleString()} F</div>
                  </div>
                )}

                {/* CONSOMMATION HORS-ALIMENTATION */}
                {totalNonFoodConsumptionAndLossVal > 0 && (
                  <div className="flex justify-between py-2.5 items-center pl-3 bg-sky-50/20 border-l-2 border-sky-450 my-1">
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-bold text-sky-850">Charges Consommables Hors-Alim</span>
                        <span className="text-[8px] text-gray-450 font-medium font-sans">
                          Emballages, hygiène, entretien & fournitures consommés/perdus sur la période
                        </span>
                      </div>
                    </div>
                    <div className="font-mono font-black text-sky-700 text-xs pr-1">{totalNonFoodConsumptionAndLossVal.toLocaleString()} F</div>
                  </div>
                )}

                {/* TOTAL CHARGES */}
                <div className="flex justify-between py-3 items-center bg-red-50/20 font-black text-xs pl-4 rounded-lg">
                  <span>TOTAL CHARGES (B)</span>
                  <div className="font-mono text-right text-xs">
                    <div className="text-red-900">BOM: {totalCharges.toLocaleString()} FCFA</div>
                    <div className="text-teal-900 font-bold">Resto: {totalChargesResto.toLocaleString()} FCFA</div>
                  </div>
                </div>

              </div>
            </div>

            {/* SYNTHESE SIG */}
            <div className="space-y-2 pt-2">
              <span className="font-black text-[11px] text-indigo-950 tracking-widest block uppercase border-b-2 border-indigo-950 pb-1">3. APPRÉCIATION DES SOLDES INTERMÉDIAIRES DE GESTION</span>
              
              <div className="divide-y text-xs text-gray-700">
                <div className="flex justify-between py-3 items-center bg-gray-100 font-black text-xs pl-4 rounded-lg">
                  <span>RÉSULTAT NET GLOBAL (A - B)</span>
                  <div className="font-mono text-right text-xs">
                    <div className={`${resultatNet >= 0 ? 'text-emerald-700 font-semibold' : 'text-red-700'}`}>BOM Net: {resultatNet.toLocaleString()} FCFA ({margeNettePercent.toFixed(1)}%)</div>
                    <div className={`${resultatNetResto >= 0 ? 'text-teal-700 font-extrabold' : 'text-red-700'}`}>Resto Net: {resultatNetResto.toLocaleString()} FCFA ({margeNettePercentResto.toFixed(1)}%)</div>
                  </div>
                </div>
              </div>
            </div>

            {/* IN-SITE CHARGES LEDGER VERIFICATION */}
            <div className="space-y-2 pt-4 border-t border-gray-100 mt-4">
              <div className="flex justify-between items-center">
                <span className="font-black text-[11px] text-[#1E4E8C] tracking-widest block uppercase">
                  4. JUSTIFICATION DES CHARGES DE LA PÉRIODE ({periodExpenses.length})
                </span>
                <button
                  type="button"
                  onClick={() => setShowLedgerBreakdown(!showLedgerBreakdown)}
                  className="px-2.5 py-1 text-[10px] font-black text-slate-700 hover:text-white bg-slate-100 hover:bg-slate-700 rounded transition cursor-pointer flex items-center gap-1 uppercase"
                >
                  {showLedgerBreakdown ? 'Masquer Détails' : 'Voir la liste des charges'}
                </button>
              </div>
              <p className="text-[10px] text-gray-400">
                Chaque dépense directe saisie dans Gestion des Finances pour la période "<strong>{getPeriodLabel()}</strong>" est répertoriée et sommée automatiquement.
              </p>

              {showLedgerBreakdown && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 overflow-x-auto max-h-96">
                  {periodExpenses.length === 0 ? (
                    <div className="text-center py-4 text-gray-400 italic text-[11px]">
                      Aucune dépense directe enregistrée sur cette période.
                    </div>
                  ) : (
                    <table className="w-full text-[10px] text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-250 uppercase font-black text-gray-500 bg-slate-200/50">
                          <th className="p-1 px-2">ID Pièce</th>
                          <th className="p-1 px-2">Date</th>
                          <th className="p-1 px-2">Catégorie</th>
                          <th className="p-1 px-2">Désignation / Note</th>
                          <th className="p-1 px-2 text-right">Montant HT</th>
                          <th className="p-1 px-2 text-center">Classement Analytique</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-semibold text-gray-700 bg-white">
                        {periodExpenses.map((e, idx) => {
                          const catNorm = e.category.toLowerCase().trim();
                          const isMatiere = catNorm.includes('matière') || catNorm.includes('ingredient') || catNorm.includes('approv');
                          const isSalaires = catNorm.includes('salaire') || catNorm.includes('personnel');
                          const isLoyer = catNorm.includes('loyer') || catNorm.includes('location');
                          const isEnergie = catNorm.includes('énerg') || catNorm.includes('eau') || catNorm.includes('electr') || catNorm.includes('assain') || catNorm.includes('gaz');
                          
                          let trackingLabel = "Autres charges d'exploitation";
                          let bgBadge = "bg-slate-50 text-slate-650 border-slate-200";
                          if (isMatiere) {
                            trackingLabel = "Matières premières";
                            bgBadge = "bg-orange-50 text-orange-700 border-orange-250";
                          } else if (isSalaires) {
                            trackingLabel = "Charges de personnel & Salaires";
                            bgBadge = "bg-blue-50 text-blue-700 border-blue-250";
                          } else if (isLoyer) {
                            trackingLabel = "Loyers Commerciaux";
                            bgBadge = "bg-indigo-50 text-indigo-700 border-indigo-250";
                          } else if (isEnergie) {
                            trackingLabel = "Énergie & Distribution d'Eau & Gaz";
                            bgBadge = "bg-cyan-50 text-cyan-750 border-cyan-250";
                          }

                          return (
                            <tr key={`${e.id}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                              <td className="p-1.5 px-2 font-mono font-bold text-[#1E4E8C] text-[9.5px] whitespace-nowrap">{e.id}</td>
                              <td className="p-1.5 px-2 font-mono whitespace-nowrap">{e.date}</td>
                              <td className="p-1.5 px-2">
                                <span className="bg-white border rounded px-1.5 py-0.2 font-black text-[9px] uppercase">
                                  {e.category}
                                </span>
                              </td>
                              <td className="p-1.5 px-2 text-[9.5px] max-w-xs truncate" title={e.description}>
                                {e.description}
                              </td>
                              <td className="p-1.5 px-2 text-right font-mono font-black text-gray-950 whitespace-nowrap">
                                {e.amountHt.toLocaleString()} F
                              </td>
                              <td className="p-1.5 px-2 text-center whitespace-nowrap">
                                <span className={`px-1.5 py-0.2 rounded border text-[9px] font-black uppercase ${bgBadge}`}>
                                  {trackingLabel}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: STOCKS SYNTHESIS & MANUAL ADJUSTMENTS */}
        <div className="space-y-6 lg:col-span-1">
          {/* STOCKS SYNTHESIS CARD */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-3xs space-y-4 text-xs" id="bilan-stock-synthesis">
            <div className="border-b pb-2">
              <h3 className="font-extrabold text-[#1E4E8C] flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                <TrendingUp className="h-4 w-4 text-[#F26522]" />
                <span>Synthèse Globale des Stocks d'Actifs</span>
              </h3>
              <p className="text-[10px] text-gray-400 mt-1">
                Aperçu consolidé de l'actif circulant (valorisé au coût moyen pondéré) en stock de réserve.
              </p>
            </div>

            <div className="space-y-3.5">
              {/* GRAND TOTAL VALUATION */}
              <div className="bg-slate-50/75 p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider block">Valorisation Actifs Stocks</span>
                  <p className="text-lg font-black font-mono text-gray-950 mt-0.5">{totalJointStockValuation.toLocaleString()} FCFA</p>
                </div>
                <div className="p-2 bg-indigo-50 text-indigo-700 rounded-lg">
                  <Calculator className="h-4 w-4" />
                </div>
              </div>

              {/* COMPARATIVE BAR */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-black text-gray-500 uppercase tracking-wide">
                  <span>Alimentaire (Ingrédients)</span>
                  <span>Hors-Alimentation</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div className="bg-indigo-600 h-full" style={{ width: `${percentageFoodExact}%` }} title={`Ingrédients: ${percentageFoodExact.toFixed(1)}%`} />
                  <div className="bg-sky-400 h-full" style={{ width: `${percentageNonFoodExact}%` }} title={`Hors-Alim: ${percentageNonFoodExact.toFixed(1)}%`} />
                </div>
                <div className="flex justify-between text-[10px] font-mono mt-0.5 font-bold">
                  <span className="text-indigo-700">{percentageFoodExact.toFixed(1)}% ({totalFoodStockValuation.toLocaleString()} F)</span>
                  <span className="text-sky-700">{percentageNonFoodExact.toFixed(1)}% ({totalNonFoodStockValuation.toLocaleString()} F)</span>
                </div>
              </div>

              {/* DETAILED STATS */}
              <div className="space-y-2 pt-2 border-t border-gray-100/50">
                {/* INGREDIENTS STATUS */}
                <div className="flex items-start justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-gray-900 text-[11px]">Stock d'Ingrédients</span>
                    <p className="text-[9px] text-gray-400 leading-none">{totalFoodArticlesInStock} matière(s) active(s) en réserve</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-indigo-700">{totalFoodStockValuation.toLocaleString()} F</p>
                    <div className="flex gap-1.5 justify-end text-[9px] font-black uppercase mt-0.5">
                      {underMinFoodArticles > 0 && <span className="text-orange-600 font-bold">⚠️ {underMinFoodArticles} Alerte{underMinFoodArticles > 1 ? 's' : ''}</span>}
                      {outOfStockFoodArticles > 0 && <span className="text-rose-600 font-bold font-sans">❌ {outOfStockFoodArticles} Rupture{outOfStockFoodArticles > 1 ? 's' : ''}</span>}
                    </div>
                  </div>
                </div>

                {/* NON-FOOD STATUS */}
                <div className="flex items-start justify-between pt-2 border-t border-dashed border-gray-100">
                  <div className="space-y-0.5">
                    <span className="font-bold text-gray-900 text-[11px]">Stock Hors-Alimentation</span>
                    <p className="text-[9px] text-gray-400 leading-none">{totalNonFoodArticlesInStock} matériels & emballages actif(s)</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-sky-700">{totalNonFoodStockValuation.toLocaleString()} F</p>
                    <div className="flex gap-1.5 justify-end text-[9px] font-black uppercase mt-0.5">
                      {underMinNonFoodArticles > 0 && <span className="text-orange-600 font-bold">⚠️ {underMinNonFoodArticles} Alerte{underMinNonFoodArticles > 1 ? 's' : ''}</span>}
                      {outOfStockNonFoodArticles > 0 && <span className="text-rose-600 font-bold font-sans">❌ {outOfStockNonFoodArticles} Rupture{outOfStockNonFoodArticles > 1 ? 's' : ''}</span>}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: MANUAL ADJUSTMENTS & CORRECTIONS */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-2xs space-y-5 text-xs">
          <div className="border-b pb-2">
            <h3 className="font-extrabold text-gray-900 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
              <Calculator className="h-4 w-4 text-[#1E4E8C]" />
              <span>Ajuster le Bilan d'Exploitation</span>
            </h3>
            <p className="text-[10px] text-gray-400 mt-1">
              Renseignez des revenus additionnels ou corrigez les lignes de charges par des ajustements positifs ou négatifs.
            </p>
          </div>

          <div className="space-y-4">
            
            <div className="space-y-2.5 p-3.5 bg-slate-50 border rounded-xl">
              <div className="flex justify-between items-center pb-1.5 border-b border-gray-200">
                <span className="font-extrabold text-[#1E4E8C] text-[10px] uppercase tracking-wider">Autres Produits & Recettes ({customOtherRevenues.length})</span>
                <button
                  type="button"
                  onClick={() => {
                    const newId = `rev-${Date.now()}`;
                    saveCustomRevenues([...customOtherRevenues, { id: newId, name: 'Autre produit/recette financier', amount: 0 }]);
                  }}
                  className="bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold px-2 py-1 rounded text-[10px] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  + Ajouter
                </button>
              </div>

              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {customOtherRevenues.map((rev, index) => (
                  <div key={rev.id || index} className="space-y-1.5 p-2 bg-white rounded-lg border border-gray-200 relative shadow-3xs">
                    <div className="flex items-center justify-between gap-1.5">
                      <input
                        type="text"
                        value={rev.name}
                        onChange={(e) => {
                          const updated = [...customOtherRevenues];
                          updated[index].name = e.target.value;
                          saveCustomRevenues(updated);
                        }}
                        placeholder="Désignation (ex: Subventions, Catering...)"
                        className="w-full p-1.5 border rounded bg-white text-gray-800 font-bold text-[11px]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = customOtherRevenues.filter((_, i) => i !== index);
                          saveCustomRevenues(updated);
                        }}
                        className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors shrink-0"
                        title="Supprimer cette ligne"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-gray-400 shrink-0">Montant :</span>
                      <input
                        type="number"
                        value={rev.amount || ''}
                        onChange={(e) => {
                          const updated = [...customOtherRevenues];
                          updated[index].amount = parseFloat(e.target.value) || 0;
                          saveCustomRevenues(updated);
                        }}
                        placeholder="0"
                        className="w-full p-1 border rounded bg-white text-gray-900 font-mono font-bold text-[11px]"
                      />
                      <span className="text-[10px] font-mono font-black text-gray-400 shrink-0">FCFA</span>
                    </div>
                  </div>
                ))}
                
                {customOtherRevenues.length === 0 && (
                  <div className="text-center py-4 text-gray-400 italic text-[10px] font-medium">
                    Aucun produit additionnel saisi. Cliquez sur "+ Ajouter" pour insérer des revenus.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-gray-700 block text-orange-655 text-orange-600">Ajustements Matières premières (FCFA)</label>
              <input
                type="number"
                value={adjustMatiere || ''}
                onChange={(e) => setAdjustMatiere(parseFloat(e.target.value) || 0)}
                placeholder="ex: pertes, stocks périmés d'inventaires..."
                className="w-full p-2 border bg-white rounded font-mono font-bold text-gray-950 focus:ring-1 focus:ring-blue-650"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-gray-700 block text-blue-600">Ajustements Salaires (FCFA)</label>
              <input
                type="number"
                value={adjustSalaires || ''}
                onChange={(e) => setAdjustSalaires(parseFloat(e.target.value) || 0)}
                placeholder="ex: Bonus, charges patronales additionnelles..."
                className="w-full p-2 border bg-white rounded font-mono font-bold text-gray-950 focus:ring-1 focus:ring-blue-650"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-gray-700 block text-indigo-600">Ajustements Loyer (FCFA)</label>
              <input
                type="number"
                value={adjustLoyer || ''}
                onChange={(e) => setAdjustLoyer(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border bg-white rounded font-mono font-bold text-gray-950 focus:ring-1 focus:ring-blue-650"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-gray-700 block text-cyan-600">Ajustements Énergies + Eau (FCFA)</label>
              <input
                type="number"
                value={adjustEnergieEau || ''}
                onChange={(e) => setAdjustEnergieEau(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border bg-white rounded font-mono font-bold text-gray-950 focus:ring-1 focus:ring-blue-650"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-gray-700 block">Ajustement Autres charges (FCFA)</label>
              <input
                type="number"
                value={adjustAutres || ''}
                onChange={(e) => setAdjustAutres(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border bg-white rounded font-mono font-bold text-gray-950 focus:ring-1 focus:ring-blue-650"
              />
            </div>

            <div className="bg-amber-50 text-amber-850 p-3.5 rounded-lg border border-amber-200 text-[10px] space-y-1.5 leading-relaxed text-amber-900">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                <span>Notice relative aux ajustements</span>
              </div>
              <p>
                Les valeurs saisies ici affectent immédiatement le calcul analytique du Bilan. Mettez à chaque fois les valeurs à zéro pour revenir strictement aux totaux réels consolidés du module Finance (Dépenses).
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  </div>
  );
}
