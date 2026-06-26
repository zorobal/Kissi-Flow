/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Percent,
  CheckCircle,
  Pause,
  Printer,
  X,
  MapPin,
  Utensils,
  Truck,
  Bookmark,
  Coins,
  ChevronRight,
  User,
  AlertCircle,
  ArrowLeft,
  Download
} from 'lucide-react';
import { Dish, DishCategory, Ingredient, Recipe, Order, Tenant, DetailMenuJour, MenuDuJour } from '../types';

interface POSViewProps {
  dishes: Dish[];
  categories: DishCategory[];
  ingredients: Ingredient[];
  recipes: Recipe[];
  onAddOrder: (order: Order) => void;
  onUpdateStocksAndCMP: (updates: { ingredientId: string; quantityToDecrement: number }[]) => void;
  logsAction: (action: string, module: string) => void;
  tenantId: string;
  activeUser: { name: string; role: string; id: string };
  activeTenant?: Tenant;
  paymentMethods?: string[];
  isDayStarted?: boolean;
  menusDuJour?: MenuDuJour[];
  detailMenusJour?: DetailMenuJour[];
}

// Held Cart representation
interface HeldCart {
  id: string;
  timestamp: string;
  canal: 'SUR_PLACE' | 'A_EMPORTER' | 'LIVRAISON';
  covers: number;
  paymentMethod: string;
  lines: {
    dish: Dish;
    quantity: number;
    discount: number; // in FCFA
    notes: string;
  }[];
}

export default function POSView({
  dishes,
  categories,
  ingredients,
  recipes,
  onAddOrder,
  onUpdateStocksAndCMP,
  logsAction,
  tenantId,
  activeUser,
  activeTenant,
  paymentMethods,
  isDayStarted = true,
  menusDuJour = [],
  detailMenusJour = []
}: POSViewProps) {
  // POS States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [canal, setCanal] = useState<'SUR_PLACE' | 'A_EMPORTER' | 'LIVRAISON'>('SUR_PLACE');
  const [covers, setCovers] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  
  // Special Order States
  const [showSpecialOrderModal, setShowSpecialOrderModal] = useState(false);
  const [specialOrderDescription, setSpecialOrderDescription] = useState('');
  const [specialOrderPrice, setSpecialOrderPrice] = useState<number>(1000);
  
  // Cart lines state
  interface CartLine {
    dish: Dish;
    quantity: number;
    discount: number; // absolute discount in FCFA
    notes: string;
  }
  const [cartLines, setCartLines] = useState<CartLine[]>([]);
  const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(null);

  // Discount & notes modal editor inline states
  const [discountType, setDiscountType] = useState<'AMOUNT' | 'PERCENT'>('AMOUNT');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [notesInput, setNotesInput] = useState('');

  // Held Carts stack
  const [heldCarts, setHeldCarts] = useState<HeldCart[]>([]);

  // Receipt modal state
  const [printedOrder, setPrintedOrder] = useState<Order | null>(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Helper: Generate structured 80mm PDF for restaurant receipt printing
  const generateReceiptPDF = (order: Order) => {
    // 1. Calculate dynamic height based on lines inside order and presence of logo
    let logoSpacing = 0;
    if (activeTenant?.logoUrl) {
      logoSpacing = 22;
    }
    let calculatedHeight = 35 + 25 + 10 + 20 + 25 + logoSpacing; // baseline margin
    order.lines.forEach(l => {
      calculatedHeight += 7;
      if (l.notes) calculatedHeight += 4;
    });
    const pageHeight = Math.max(125, calculatedHeight);

    // 2. Initialize jsPDF in portrait mode with 80mm width and calculated variable length
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, pageHeight]
    });

    let currentY = 10;

    // Draw dynamic brand logo if uploaded in settings
    if (activeTenant?.logoUrl) {
      try {
        // Draw centered logo of size ~16mm x 11mm
        doc.addImage(activeTenant.logoUrl, 'PNG', 32, currentY, 16, 11);
        currentY += 16;
      } catch (err) {
        console.warn("Could not print brand logo in PDF receipt:", err);
      }
    }

    // 3. Draw Brand header info from settings
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    // Print custom slogan fallback or brand name
    doc.text((activeTenant?.name || "KISSINEFLOW RESTAURANT").toUpperCase(), 40, currentY, { align: "center" });
    currentY += 4.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(activeTenant?.address || "Boulevard de la Liberté, Akwa, Douala", 40, currentY, { align: "center" });
    currentY += 3.5;
    doc.text(`Tél: ${activeTenant?.phone || "+237 677 88 99 00"}`, 40, currentY, { align: "center" });
    currentY += 4;

    // Dotted separator
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.text("--------------------------------------------", 40, currentY, { align: "center" });
    currentY += 4;

    // 4. Ticket Metadata info below header
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    let y = currentY;
    doc.text(`N° Commande : ${order.number}`, 5, y);
    y += 4;
    doc.text(`Date : ${order.date} ${order.time}`, 5, y);
    y += 4;
    doc.text(`Canal : ${order.canal} (Cov: ${order.covers})`, 5, y);
    y += 4;
    doc.text(`Mode Paiement : ${order.paymentMethod}`, 5, y);
    y += 4;
    doc.text(`Caissier : ${order.userName}`, 5, y);
    y += 4;

    // Dotted separator
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.text("--------------------------------------------", 40, y, { align: "center" });
    y += 4;

    // 5. Table head
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("PLAT", 5, y);
    doc.text("QTÉ", 52, y, { align: "center" });
    doc.text("TOTAL", 75, y, { align: "right" });
    y += 3;

    // Dotted separator
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.text("--------------------------------------------", 40, y, { align: "center" });
    y += 4;

    // 6. Loop and draw order lines
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    order.lines.forEach((line) => {
      // Split dish name to wrap perfectly under 42mm boundaries
      const splitName = doc.splitTextToSize(line.dishName, 42);
      
      // Draw wrapped dish name text lines
      splitName.forEach((part: string, idx: number) => {
        doc.text(part, 5, y + (idx * 3.5));
      });

      // Draw quantity and subtotal aligned perfectly with the first line of text
      doc.text(line.quantity.toString(), 52, y, { align: "center" });
      doc.text(`${line.total.toLocaleString()} F`, 75, y, { align: "right" });

      // Shift Y down
      y += Math.max(splitName.length * 3.5, 4);

      // If line level notes exist, draw them in a small italic font
      if (line.notes) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(6.5);
        const splitNotes = doc.splitTextToSize(`(${line.notes})`, 42);
        splitNotes.forEach((notePart: string, idx: number) => {
          doc.text(notePart, 7, y + (idx * 3));
        });
        y += (splitNotes.length * 3) + 1.5;
        // Restore standard font settings
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
      }
      y += 1; // subtle padding
    });

    // Dotted separator
    y -= 1;
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.text("--------------------------------------------", 40, y, { align: "center" });
    y += 4;

    // 7. Balance amounts & Net Subtotals
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("Sous-Total :", 5, y);
    doc.text(`${order.subtotal.toLocaleString()} FCFA`, 75, y, { align: "right" });
    y += 4;

    if (order.discount > 0) {
      doc.text("Remise :", 5, y);
      doc.text(`-${order.discount.toLocaleString()} FCFA`, 75, y, { align: "right" });
      y += 4;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.text("TOTAL NET :", 5, y);
    doc.text(`${order.total.toLocaleString()} FCFA`, 75, y, { align: "right" });
    y += 5;

    // Border design bottom
    doc.setFont("courier", "bold");
    doc.setFontSize(8);
    doc.text("============================================", 40, y, { align: "center" });
    y += 4.5;

    // 8. Visual thank you notes footers
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("MERCI POUR VOTRE COMMANDE !", 40, y, { align: "center" });
    y += 4;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(6.5);
    doc.text(activeTenant?.slogan || "La saveur authentique de nos terroirs !", 40, y, { align: "center" });
    y += 3.5;
    
    const printTimestamp = new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
    doc.text(`Imprimé le ${printTimestamp}`, 40, y, { align: "center" });

    // 9. Process download callback
    doc.save(`Facture-${order.number}.pdf`);
  };

  // Find current menu of today to respect real-time availability adjustments
  const todayStr = '2026-06-23'; // Align with platform mock date for reliable evaluation
  const todayMenu = menusDuJour.find(m => m.dateMenu === todayStr && m.tenantId === tenantId);
  const todayMenuDetails = todayMenu ? detailMenusJour.filter(d => d.menuJourId === todayMenu.id) : [];

  // Filter Dishes
  const filteredDishes = dishes.filter(dish => {
    if (!dish.active || dish.tenantId !== tenantId) return false;
    // category
    if (selectedCategory !== 'all' && dish.categoryId !== selectedCategory) return false;
    // search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return dish.name.toLowerCase().includes(q) || dish.code.toLowerCase().includes(q);
    }
    return true;
  });

  // Helper: check if stock permits of key ingredients for a dish (optional visual warning)
  const getIngredientStockLevel = (dishId: string) => {
    const dishRecipe = recipes.find(r => r.dishId === dishId && r.active);
    if (!dishRecipe) return 'OK';
    let minLimit = 999;
    dishRecipe.lines.forEach(line => {
      const ing = ingredients.find(i => i.id === line.ingredientId);
      if (ing) {
        const potentialDishesCount = ing.stockActual / line.quantity;
        if (potentialDishesCount < minLimit) {
          minLimit = potentialDishesCount;
        }
      }
    });
    if (minLimit <= 0) return 'RUPTURE';
    if (minLimit <= 2) return 'FAIBLE';
    return 'OK';
  };

  const handleConfirmSpecialOrder = () => {
    if (!specialOrderDescription) {
      alert('Veuillez renseigner la description de la commande spéciale.');
      return;
    }
    if (specialOrderPrice <= 0) {
      alert('Veuillez renseigner un prix de vente valide.');
      return;
    }

    const specialDishObj: Dish = {
      id: `special-${Date.now()}`,
      code: 'SPE',
      name: `[COMMANDE SPÉCIALE] ${specialOrderDescription}`,
      description: 'Commande spéciale saisie à la caisse tactile client',
      categoryId: 'special',
      image: '',
      price: specialOrderPrice,
      tvaApplicable: false,
      theoreticalCost: 0,
      margin: specialOrderPrice,
      marginPercent: 100,
      prepTime: 15,
      availablePOS: true,
      availableDelivery: false,
      availableTakeaway: true,
      active: true,
      tenantId: tenantId
    };

    handleAddDish(specialDishObj);
    
    // reset form
    setShowSpecialOrderModal(false);
    setSpecialOrderDescription('');
    setSpecialOrderPrice(1000);
  };

  // Add Dish to Cart
  const handleAddDish = (dish: Dish) => {
    const existingIndex = cartLines.findIndex(line => line.dish.id === dish.id);
    if (existingIndex > -1) {
      const updated = [...cartLines];
      updated[existingIndex].quantity += 1;
      setCartLines(updated);
      setSelectedLineIndex(existingIndex);
    } else {
      const newLine = { dish, quantity: 1, discount: 0, notes: '' };
      setCartLines([...cartLines, newLine]);
      setSelectedLineIndex(cartLines.length);
    }
  };

  // Quick adjust line quantity
  const handleAdjustQuantity = (index: number, delta: number) => {
    const updated = [...cartLines];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      // Remove line
      updated.splice(index, 1);
      setCartLines(updated);
      setSelectedLineIndex(null);
    } else {
      updated[index].quantity = newQty;
      setCartLines(updated);
    }
  };

  // Remove specific line entirely
  const handleRemoveLine = (index: number) => {
    const updated = [...cartLines];
    updated.splice(index, 1);
    setCartLines(updated);
    setSelectedLineIndex(null);
  };

  // Apply Line Edit (Notes + Discount)
  const handleApplyLineEdit = () => {
    if (selectedLineIndex === null) return;
    const updated = [...cartLines];
    const item = updated[selectedLineIndex];
    
    let resolvedDiscount = 0;
    if (discountType === 'PERCENT') {
      resolvedDiscount = (item.dish.price * item.quantity * discountValue) / 100;
    } else {
      resolvedDiscount = Math.min(discountValue, item.dish.price * item.quantity);
    }

    updated[selectedLineIndex].discount = resolvedDiscount;
    updated[selectedLineIndex].notes = notesInput;
    setCartLines(updated);

    // Reset inputs
    setDiscountValue(0);
    setNotesInput('');
  };

  // Select line to edit
  const selectLineForEditing = (index: number) => {
    setSelectedLineIndex(index);
    const line = cartLines[index];
    setNotesInput(line.notes);
    setDiscountValue(0);
  };

  // Calculations for POS Cart
  const subtotal = cartLines.reduce((sum, line) => sum + (line.dish.price * line.quantity), 0);
  const discountTotal = cartLines.reduce((sum, line) => sum + line.discount, 0);
  const total = Math.max(0, subtotal - discountTotal);

  // Validate collection
  const handleValidateSale = () => {
    if (!isDayStarted) {
      alert("Impossible de valider la vente : La journée d'affaires n'est pas encore ouverte. Veuillez d'abord l'activer et la commencer depuis le module Comptabilité !");
      return;
    }
    if (cartLines.length === 0) return;

    // 1. Verify and compute recipe decrements (BOM Stock decrements)
    const decrements: { ingredientId: string; quantityToDecrement: number }[] = [];
    let stockAlertMessage = '';

    cartLines.forEach(line => {
      const recipe = recipes.find(r => r.dishId === line.dish.id && r.active);
      if (recipe) {
        recipe.lines.forEach(bLine => {
          const totalQtyNeeded = bLine.quantity * line.quantity;
          decrements.push({
            ingredientId: bLine.ingredientId,
            quantityToDecrement: totalQtyNeeded
          });

          // check warning
          const ing = ingredients.find(i => i.id === bLine.ingredientId);
          if (ing && (ing.stockActual - totalQtyNeeded < 0)) {
            stockAlertMessage += `Attention: Le stock de "${ing.name}" sera négatif (${(ing.stockActual - totalQtyNeeded).toFixed(1)} ${ing.unit}).\n`;
          }
        });
      }
    });

    // Proceed and decrement stocks
    onUpdateStocksAndCMP(decrements);

    // 2. Compute cost total of order (needed for margin)
    const costTotal = cartLines.reduce((sum, line) => {
      const theoreticalCost = line.dish.theoreticalCost || 0;
      return sum + (theoreticalCost * line.quantity);
    }, 0);

    const marginAmount = total - costTotal;

    // 3. Create the standard Order representation
    const timestamp = new Date();
    const formattedDate = timestamp.toISOString().slice(0, 10);
    const formattedTime = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    
    // Generates a nice explanatory serial CMD sequence containing date, sales channel, and random digits
    const dateStr = formattedDate.replace(/-/g, ''); // e.g. "20260618"
    const canalClean = (canal || 'SURPLACE').toUpperCase().slice(0,3); // e.g. SUR, EMP, LIV
    const rNum = Math.floor(100 + Math.random() * 900); // 3 digits
    const cmdNumber = `CMD-${dateStr}-${canalClean}-${rNum}`;

    const newOrder: Order = {
      id: `cmd-${Date.now()}`,
      number: cmdNumber,
      date: formattedDate,
      time: formattedTime,
      canal,
      covers,
      status: 'VALIDATED', // validated = paid and completed
      paymentMethod,
      userId: activeUser.id,
      userName: activeUser.name,
      subtotal,
      discount: discountTotal,
      total,
      costTotal,
      margin: marginAmount,
      notes: cartLines.map(l => l.notes).filter(Boolean).join(' | '),
      tenantId,
      lines: cartLines.map((line, idx) => ({
        id: `line-${idx}-${Date.now()}`,
        dishId: line.dish.id,
        dishName: line.dish.name,
        quantity: line.quantity,
        price: line.dish.price,
        discount: line.discount,
        total: (line.dish.price * line.quantity) - line.discount,
        notes: line.notes
      }))
    };

    onAddOrder(newOrder);
    logsAction(`Vente validée : ${cmdNumber} (${total.toLocaleString()} FCFA)`, 'POS / CAISSE');

    // Save printed order copy and show invoice modal simulation
    setPrintedOrder(newOrder);
    setShowInvoiceModal(true);

    // Clear cart state
    setCartLines([]);
    setCovers(1);
    setSelectedLineIndex(null);
  };

  // Suspend Cart (Mise en Attente)
  const handleHoldCart = () => {
    if (cartLines.length === 0) return;
    const newHeld: HeldCart = {
      id: `held-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      canal,
      covers,
      paymentMethod,
      lines: [...cartLines]
    };
    setHeldCarts([...heldCarts, newHeld]);
    setCartLines([]);
    setSelectedLineIndex(null);
    logsAction('Commande mise en attente temporaire', 'POS / CAISSE');
  };

  // Resume Suspended Cart
  const handleResumeCart = (held: HeldCart) => {
    setCartLines(held.lines);
    setCanal(held.canal);
    setCovers(held.covers);
    setPaymentMethod(held.paymentMethod);
    setHeldCarts(prev => prev.filter(c => c.id !== held.id));
    setSelectedLineIndex(0);
    logsAction('Commande récupérée depuis la mise en attente', 'POS / CAISSE');
  };

  return (
    <div className="space-y-4 font-sans" id="pos-module">
      {!isDayStarted && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs font-semibold text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs select-none">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-extrabold text-sm text-amber-950">Mode Consultation Seul — Journée d'affaires inactive</p>
              <p className="text-amber-800 text-[11px] font-normal mt-0.5">Pour pouvoir facturer et enregistrer des ventes dans la caisse tactile, vous devez impérativement commencer la journée d’affaires dans l'onglet Comptabilité.</p>
            </div>
          </div>
          <span className="text-[10px] uppercase tracking-widest font-extrabold bg-amber-100 text-amber-800 px-2 py-1 rounded border border-amber-200 whitespace-nowrap">
            Caisse inactive
          </span>
        </div>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
      {/* 3 Columns architecture: Left categories + plates block (cols-span 3) */}
      <div className="xl:col-span-3 space-y-4">
        {/* Universal Search & Category strip */}
        <div className="bg-white p-4 rounded-lg border border-gray-150 shadow-xs space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Search className="h-5 w-5" />
              </span>
              <input
                id="pos-search-input"
                type="text"
                placeholder="Rechercher un plat par nom ou code (ex: Poulet, PL-PDG)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-250 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E4E8C] focus:border-transparent text-gray-900 placeholder-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-650"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            <button
              id="pos-export-catalog-btn"
              onClick={() => {
                const schema = filteredDishes.map(d => ({
                  'Code': d.code,
                  'Désignation': d.name,
                  'Tarif Vente (FCFA)': d.price,
                  'Temps Préparation (min)': d.prepTime,
                  'Coût théorique (FCFA)': d.theoreticalCost || 0,
                  'Marge théorique (FCFA)': d.margin || 0,
                  'Pourcentage de Marge': `${d.marginPercent || 0}%`
                }));
                import('../utils/export').then(m => m.exportToExcel(schema, 'Grille_Tarifs_POS', 'Export_Catalogue_Caisses'));
              }}
              className="px-3.5 py-1.5 bg-[#1E4E8C] text-white hover:bg-blue-800 text-xs font-semibold rounded-lg flex items-center gap-1.5 shrink-0 shadow-xs transition cursor-pointer"
              title="Exporter le catalogue des plats sous Excel"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exporter Catalogue</span>
            </button>
            
            <div className="flex items-center gap-2 border-l pl-3 border-gray-200">
              <span className="text-xs font-semibold text-gray-650 whitespace-nowrap hidden sm:inline">Couverts:</span>
              <input
                id="pos-covers-input"
                type="number"
                min={1}
                value={covers}
                onChange={(e) => setCovers(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-14 px-1.5 py-1 text-center text-sm border rounded-lg font-semibold bg-gray-50 text-[#1E4E8C]"
              />
            </div>
          </div>

          {/* Scrolling horizontal Category strips */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            <button
              id="cat-tab-all"
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-[#1E4E8C] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Tous les plats
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                id={`cat-tab-${cat.id}`}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-[#1E4E8C] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Carts Held (Mise en Attente) bar if empty to remind user */}
        {heldCarts.length > 0 && (
          <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-orange-800 text-sm">
              <Bookmark className="h-4 w-4 text-orange-600 fill-orange-200 animate-pulse" />
              <span>Vous avez <strong>{heldCarts.length}</strong> ticket(s) en attente de traitement.</span>
            </div>
            <div className="flex gap-1.5 overflow-x-auto max-w-xs md:max-w-lg">
              {heldCarts.map((held, i) => (
                <button
                  key={held.id}
                  onClick={() => handleResumeCart(held)}
                  className="bg-white hover:bg-orange-100 text-orange-900 border border-orange-300 px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5"
                >
                  <Utensils className="h-3 w-3" />
                  Cmd #{i+1} ({held.timestamp})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Master Active Plate Grid list */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[580px] overflow-y-auto pr-1">
          {/* Permanent button for special custom order */}
          <div
            id="pos-special-order-card"
            onClick={() => setShowSpecialOrderModal(true)}
            className="bg-amber-50 rounded-lg border-2 border-dashed border-amber-300 overflow-hidden cursor-pointer hover:bg-amber-100 hover:border-amber-400 transition-all flex flex-col justify-between p-4 group shadow-md text-amber-950 min-h-[180px]"
          >
            <div className="space-y-2 text-left">
              <span className="text-[10px] bg-amber-600 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Commande Spéciale
              </span>
              <h4 className="text-sm font-bold text-amber-950 mt-1">Saisie Libre Hors-Carte</h4>
              <p className="text-[11px] text-amber-800 font-medium leading-normal">Pour les plats personnalisés ou les tarifs libres demandés par le client.</p>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-xs mt-3 bg-amber-200/50 py-1.5 px-2 rounded-md justify-center">
              <Plus className="h-4 w-4 shrink-0 text-amber-700" />
              <span>Saisir Tarif & Libellé</span>
            </div>
          </div>

          {filteredDishes.map((dish) => {
            const stockLevel = getIngredientStockLevel(dish.id);
            const menuDetail = todayMenuDetails.find(d => d.platId === dish.id);
            const isEpuise = menuDetail ? menuDetail.availability === 'EPUISE' : false;
            const isSuspendu = menuDetail ? menuDetail.availability === 'SUSPENDU' : false;
            const isIndisponible = isEpuise || isSuspendu;

            return (
              <div
                key={dish.id}
                id={`pos-dish-${dish.id}`}
                onClick={() => {
                  if (isEpuise) {
                    alert("Ce plat est marqué comme ÉPUISÉ sur le menu du jour.");
                    return;
                  }
                  if (isSuspendu) {
                    alert("Ce plat est suspendu sur le menu d'aujourd'hui.");
                    return;
                  }
                  handleAddDish(dish);
                }}
                className={`bg-white rounded-lg border border-gray-150 overflow-hidden transition-all flex flex-col justify-between group shadow-2xs hover:shadow-xs relative ${
                  isIndisponible ? 'opacity-85 cursor-not-allowed select-none' : 'cursor-pointer hover:border-[#1E4E8C]'
                }`}
              >
                {/* Visual image container */}
                <div className="h-28 overflow-hidden relative bg-gray-100">
                  <img
                    src={dish.image}
                    alt={dish.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  {/* Stock / Menu availability flags */}
                  {isEpuise ? (
                    <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center p-2 text-center">
                      <span className="bg-red-650 text-white font-extrabold text-[10px] px-2 py-1 rounded-sm uppercase tracking-wider animate-pulse mb-1">
                        ÉPUISÉ
                      </span>
                      <span className="text-[9px] text-gray-300">Indisponible en cuisine</span>
                    </div>
                  ) : isSuspendu ? (
                    <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center p-2 text-center">
                      <span className="bg-amber-600 text-white font-extrabold text-[10px] px-2 py-1 rounded-sm uppercase tracking-wider mb-1">
                        SUSPENDU
                      </span>
                      <span className="text-[9px] text-gray-300">Temporairement retiré</span>
                    </div>
                  ) : stockLevel === 'RUPTURE' ? (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="bg-red-650 text-white font-bold text-[10px] px-2 py-0.5 rounded uppercase tracking-wider">
                        Rupture ing.
                      </span>
                    </div>
                  ) : stockLevel === 'FAIBLE' ? (
                    <span className="absolute top-2 right-2 bg-amber-500 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded uppercase">
                      Ing. Faible
                    </span>
                  ) : null}

                  {/* Cooking time badge */}
                  <span className="absolute bottom-2 left-2 bg-black/65 text-white font-mono text-[10px] px-1.5 py-0.3 rounded-sm">
                    {dish.prepTime} min
                  </span>
                </div>

                {/* Technical descriptors */}
                <div className="p-3 space-y-1 flex-1 flex flex-col justify-between hover:bg-gray-50">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-gray-500 tracking-wider">
                      {dish.code}
                    </span>
                    <h3 className="text-sm font-semibold text-gray-805 group-hover:text-[#1E4E8C] transition-colors line-clamp-2">
                      {dish.name}
                    </h3>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-50">
                    <span className="text-sm font-bold text-[#1E4E8C]">
                      {dish.price.toLocaleString()} FCFA
                    </span>
                    <span className="bg-blue-50 text-[#1E4E8C] p-1 rounded group-hover:bg-[#1E4E8C] group-hover:text-white transition-all">
                      <Plus className="h-4 w-4" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredDishes.length === 0 && (
            <div className="col-span-full py-16 text-center text-gray-500 bg-white rounded-lg border border-dashed">
              <Search className="h-10 w-10 mx-auto mb-3 text-gray-400" />
              <p className="text-sm font-semibold">Aucun plat ne correspond à vos filtres</p>
              <p className="text-xs mt-1 text-gray-400">Essayez de saisir d'autres termes ou sélectionnez une autre catégorie.</p>
            </div>
          )}
        </div>
      </div>

      {/* Right column: Cart panel and checkout (col-span 1) */}
      <div className="bg-white rounded-lg border border-gray-150 shadow-xs p-4 flex flex-col justify-between max-h-[730px]">
        <div>
          {/* Header & Canal configuration */}
          <div className="border-b border-gray-100 pb-3 mb-3">
            <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center justify-between">
              <span>Ticket en Cours</span>
              {cartLines.length > 0 && (
                <span className="text-xs bg-blue-100 text-[#1E4E8C] font-mono px-2 py-0.5 rounded">
                  {cartLines.length} ligne(s)
                </span>
              )}
            </h2>

            {/* Canal buttons Sur-place, emporter, delivery */}
            <div className="grid grid-cols-3 gap-1">
              <button
                id="canal-sur-place"
                onClick={() => setCanal('SUR_PLACE')}
                className={`py-1.5 px-1 rounded text-xs font-semibold flex flex-col items-center gap-1 border transition-all ${
                  canal === 'SUR_PLACE'
                    ? 'border-[#1E4E8C] bg-blue-50 text-[#1E4E8C]'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                }`}
              >
                <Utensils className="h-3.5 w-3.5" />
                <span>En salle</span>
              </button>
              <button
                id="canal-a-emporter"
                onClick={() => setCanal('A_EMPORTER')}
                className={`py-1.5 px-1 rounded text-xs font-semibold flex flex-col items-center gap-1 border transition-all ${
                  canal === 'A_EMPORTER'
                    ? 'border-[#1E4E8C] bg-blue-50 text-[#1E4E8C]'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                }`}
              >
                <MapPin className="h-3.5 w-3.5" />
                <span>Emporter</span>
              </button>
              <button
                id="canal-livraison"
                onClick={() => setCanal('LIVRAISON')}
                className={`py-1.5 px-1 rounded text-xs font-semibold flex flex-col items-center gap-1 border transition-all ${
                  canal === 'LIVRAISON'
                    ? 'border-[#1E4E8C] bg-blue-50 text-[#1E4E8C]'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                }`}
              >
                <Truck className="h-3.5 w-3.5" />
                <span>Livraison</span>
              </button>
            </div>
          </div>

          {/* Cart item lines layout */}
          <div className="overflow-y-auto max-h-56 pr-1 divide-y divide-gray-100 mb-3">
            {cartLines.map((line, idx) => (
              <div
                key={line.dish.id}
                onClick={() => selectLineForEditing(idx)}
                className={`py-2 text-xs transition-colors cursor-pointer rounded px-1.5 ${
                  selectedLineIndex === idx ? 'bg-blue-50/50 border-l-2 border-[#1E4E8C]' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="font-semibold text-gray-900">{line.dish.name}</div>
                  <div className="font-bold text-gray-950">
                    {((line.dish.price * line.quantity) - line.discount).toLocaleString()} FCFA
                  </div>
                </div>

                {/* Price summary & custom notes */}
                <div className="flex justify-between items-center text-gray-500 mt-1">
                  <div>
                    <span>{line.quantity} x {line.dish.price.toLocaleString()} FCFA</span>
                    {line.discount > 0 && <span className="text-red-600 ml-1.5 font-semibold">(-{line.discount.toLocaleString()})</span>}
                  </div>
                  
                  {/* Line action buttons (+ / - / delete) */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAdjustQuantity(idx, -1); }}
                      className="p-1 hover:bg-gray-200 rounded text-gray-600"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAdjustQuantity(idx, 1); }}
                      className="p-1 hover:bg-gray-200 rounded text-gray-600"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemoveLine(idx); }}
                      className="p-1 hover:bg-red-100 text-red-500 rounded"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>

                {/* Sub annotations and cooking feedback */}
                {line.notes && (
                  <div className="text-[10px] bg-amber-50 text-amber-800 border-l border-amber-300 pl-1.5 py-0.5 mt-1 rounded-sm">
                    Note: "{line.notes}"
                  </div>
                )}
              </div>
            ))}

            {cartLines.length === 0 && (
              <div className="py-12 text-center text-gray-400">
                <Utensils className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-xs">Le panier est vierge</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Cliquez sur un plat de la grille pour lancer une vente tactile.</p>
              </div>
            )}
          </div>

          {/* Sub-panels for selected active line edits (Apply inline discount and notes) */}
          {selectedLineIndex !== null && cartLines[selectedLineIndex] && (
            <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200 mb-3 space-y-2">
              <div className="flex justify-between items-center text-[11px] font-semibold text-gray-700">
                <span>Option line #{selectedLineIndex + 1} ({cartLines[selectedLineIndex].dish.name})</span>
                <button onClick={() => setSelectedLineIndex(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Discount inputs */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 block">Réduction sur cette ligne :</label>
                <div className="flex gap-1.5">
                  <div className="flex rounded-md border text-xs bg-white flex-1 overflow-hidden">
                    <button
                      onClick={() => setDiscountType('AMOUNT')}
                      className={`px-1.5 ${discountType === 'AMOUNT' ? 'bg-[#1E4E8C] text-white' : 'text-gray-600'}`}
                    >
                      FCFA
                    </button>
                    <button
                      onClick={() => setDiscountType('PERCENT')}
                      className={`px-1.5 ${discountType === 'PERCENT' ? 'bg-[#1E4E8C] text-white' : 'text-[#1E4E8C]'}`}
                    >
                      %
                    </button>
                    <input
                      id="line-discount-input"
                      type="number"
                      placeholder="Valeur..."
                      value={discountValue || ''}
                      onChange={(e) => setDiscountValue(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full text-xs py-1 px-1 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Kitchen note inputs */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-500 block">Notes spécifiques cuisine :</label>
                <input
                  id="line-notes-input"
                  type="text"
                  placeholder="Ex: Sans piment, frites croustillantes..."
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="w-full text-xs border bg-white rounded-md py-1 px-1.5 focus:outline-none text-gray-800"
                />
              </div>

              <button
                id="apply-line-changes-btn"
                onClick={handleApplyLineEdit}
                className="w-full py-1 bg-[#1E4E8C] text-white text-[11px] rounded-md font-semibold hover:bg-blue-800 transition-colors"
              >
                Appliquer modifications
              </button>
            </div>
          )}

          {/* Payment Method selector */}
          <div className="border-t border-gray-100 pt-3 mb-3">
            <span className="text-[11px] font-semibold text-gray-500 block mb-1.5 uppercase">Mode d'Encaissement :</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
              {(paymentMethods || ['CASH', 'OM', 'MOMO']).map(method => {
                const isSelected = paymentMethod === method;
                return (
                  <button
                    key={method}
                    id={`pay-${method.toLowerCase()}`}
                    onClick={() => setPaymentMethod(method)}
                    className={`py-1 px-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 border transition-all truncate ${
                      isSelected
                        ? 'border-[#1E4E8C] bg-blue-50 text-[#1E4E8C] font-extrabold'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    }`}
                  >
                    {method === 'CASH' && <Coins className="h-3.5 w-3.5" />}
                    <span>{method}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mathematical summary and trigger operations */}
        <div className="border-t border-gray-200 pt-3 space-y-3">
          <div className="space-y-1 bg-gray-50 p-2.5 rounded-lg">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Sous-total:</span>
              <span>{subtotal.toLocaleString()} FCFA</span>
            </div>
            {discountTotal > 0 && (
              <div className="flex justify-between text-xs text-red-600 font-medium">
                <span>Remise appliquée:</span>
                <span>-{discountTotal.toLocaleString()} FCFA</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-900 font-bold border-t pt-1 mt-1 border-gray-200">
              <span>Net à payer:</span>
              <span className="text-[#1E4E8C] text-base">{total.toLocaleString()} FCFA</span>
            </div>
          </div>

          {/* Trigger validation button grids */}
          <div className="grid grid-cols-2 gap-2">
            <button
              id="pos-hold-btn"
              onClick={handleHoldCart}
              disabled={cartLines.length === 0}
              className="py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors border border-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Pause className="h-4 w-4" />
              <span>En attente</span>
            </button>
            <button
              id="pos-clear-btn"
              onClick={() => { setCartLines([]); setSelectedLineIndex(null); }}
              disabled={cartLines.length === 0}
              className="py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-4 w-4" />
              <span>Vider</span>
            </button>
          </div>

          <button
            id="pos-validate-checkout-btn"
            onClick={handleValidateSale}
            disabled={cartLines.length === 0}
            className="w-full py-3.5 bg-gradient-to-r from-[#1E4E8C] to-blue-800 text-white font-bold rounded-lg text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="h-5 w-5" />
            <span>VALIDER & ENCAISSER</span>
          </button>
        </div>
      </div>

      {/* Ticket Invoice modal (Part 2 Module 3.16 Impression Ticket print visualizer) */}
      {showInvoiceModal && printedOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full shadow-2xl p-6 border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center pb-4 border-b">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Printer className="h-5 w-5 text-gray-500" />
                  Génération Ticket
                </h3>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Receipt Visual layout */}
              <div className="bg-gray-50 p-4 rounded-lg my-4 text-xs font-mono border border-dashed text-gray-800 max-h-96 overflow-y-auto">
                <div className="text-center space-y-1 border-b pb-3 mb-3 border-gray-350">
                  {activeTenant?.logoUrl && (
                    <div className="flex justify-center pb-2">
                      <img src={activeTenant.logoUrl} alt="Logo" className="h-12 w-auto object-contain" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  <h4 className="text-sm font-bold uppercase tracking-widest text-[#1E4E8C]">
                    {(activeTenant?.name || "KISSINEFLOW RESTAURANT").toUpperCase()}
                  </h4>
                  <p className="text-[10px] text-gray-500">
                    {activeTenant?.address || "Boulevard de la Liberté, Akwa, Douala"}
                    {activeTenant?.city ? `, ${activeTenant.city}` : ""}
                    {activeTenant?.country ? `, ${activeTenant.country}` : ""}
                  </p>
                  <p className="text-[10px] text-gray-500">Tél: {activeTenant?.phone || "+237 677 88 99 00"}</p>
                </div>

                <div className="space-y-1 mb-2">
                  <div><strong>N° Commande :</strong> {printedOrder.number}</div>
                  <div><strong>Date :</strong> {printedOrder.date} {printedOrder.time}</div>
                  <div><strong>Canal :</strong> {printedOrder.canal} (Cov: {printedOrder.covers})</div>
                  <div><strong>Mode Paiement :</strong> {printedOrder.paymentMethod}</div>
                  <div><strong>Caissier :</strong> {printedOrder.userName}</div>
                </div>

                <table className="w-full text-left border-t border-b border-gray-350 py-2 my-2 break-all">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="pb-1">Plat</th>
                      <th className="pb-1 text-center">Qté</th>
                      <th className="pb-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printedOrder.lines.map((line) => (
                      <tr key={line.id} className="text-[10px]">
                        <td className="py-1">
                          {line.dishName}
                          {line.notes && <div className="text-[9px] text-gray-500 italic">({line.notes})</div>}
                        </td>
                        <td className="py-1 text-center">{line.quantity}</td>
                        <td className="py-1 text-right">{line.total.toLocaleString()} FCFA</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="space-y-1 pt-1 text-right">
                  <div className="flex justify-between">
                    <span>Sous-Total:</span>
                    <span>{printedOrder.subtotal.toLocaleString()} FCFA</span>
                  </div>
                  {printedOrder.discount > 0 && (
                    <div className="flex justify-between text-red-650 font-semibold">
                      <span>Remise:</span>
                      <span>-{printedOrder.discount.toLocaleString()} FCFA</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm border-t pt-1.5 text-gray-950">
                    <span>TOTAL NET:</span>
                    <span>{printedOrder.total.toLocaleString()} FCFA</span>
                  </div>
                </div>

                <div className="text-center pt-4 border-t border-gray-350 mt-4">
                  <p className="font-semibold text-[10px]">MERCI POUR VOTRE COMMANDE !</p>
                  <p className="text-[9px] text-gray-400 italic mt-0.5 font-sans">{activeTenant?.slogan || "La saveur authentique de nos terroirs !"}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <button
                id="pos-print-ticket-btn"
                onClick={() => {
                  generateReceiptPDF(printedOrder);
                  logsAction(`Export Facture PDF 80mm pour ticket de caisse : ${printedOrder.number}`, 'POS / CAISSE');
                }}
                className="w-full py-2.5 bg-[#1E4E8C] text-white hover:bg-blue-800 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-transform"
              >
                <Printer className="h-4 w-4" />
                <span>Exporter Facture en PDF (Standard 80mm)</span>
              </button>
              <button
                id="close-ticket-modal-btn"
                onClick={() => setShowInvoiceModal(false)}
                className="w-full py-2.5 bg-green-600 text-white hover:bg-green-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-transform"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Revenir à l'application / Nouvelle vente</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SPECIAL ORDER MODAL */}
      {showSpecialOrderModal && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 border relative animate-fade-in text-xs">
            <h3 className="text-base font-bold text-gray-900 mb-3 pb-2 border-b">
              Saisie d'une Commande Spéciale
            </h3>
            
            <p className="text-gray-500 mb-4 font-normal">
              Saisissez la désignation du plat spécial demandé ainsi que son tarif de vente direct. Celui-ci sera directement intégré au panier de commande.
            </p>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-gray-650 block font-semibold text-left">Désignation du Plat Spécial *</label>
                <input
                  id="special-order-desc-input"
                  type="text"
                  placeholder="ex: Poisson braisé entier avec frites..."
                  value={specialOrderDescription}
                  onChange={(e) => setSpecialOrderDescription(e.target.value)}
                  className="w-full p-2.5 border rounded text-gray-950 focus:outline-none focus:ring-1 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-650 block font-semibold text-left">Tarif d'Affectation (FCFA) *</label>
                <input
                  id="special-order-price-input"
                  type="number"
                  placeholder="ex: 5000"
                  value={specialOrderPrice || ''}
                  onChange={(e) => setSpecialOrderPrice(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full p-2.5 border rounded text-gray-950 focus:outline-none focus:ring-1 font-mono font-bold text-xs bg-amber-50/20"
                />
              </div>
            </div>

            <div className="flex gap-2.5 justify-end mt-6 pt-3 border-t">
              <button
                id="cancel-special-order-btn"
                onClick={() => {
                  setShowSpecialOrderModal(false);
                  setSpecialOrderDescription('');
                  setSpecialOrderPrice(1000);
                }}
                className="px-4 py-2 bg-gray-100 rounded-lg text-gray-750 hover:bg-gray-200 text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                id="submit-special-order-btn"
                onClick={handleConfirmSpecialOrder}
                className="px-4 py-2 bg-amber-600 font-bold rounded-lg hover:bg-amber-700 text-white text-xs whitespace-nowrap"
              >
                Ajouter au panier
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
