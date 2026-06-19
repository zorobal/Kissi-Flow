/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  Search,
  RotateCcw,
  Printer,
  XCircle,
  Eye,
  Filter,
  TrendingUp,
  X,
  ShieldAlert,
  Calendar,
  Layers,
  CheckCircle,
  Download,
  Utensils
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Order, Dish, Recipe, Ingredient, Tenant } from '../types';
import DateFilterComponent, {
  DateFilterState,
  initialDateFilterState,
  matchDateFilter
} from './DateFilter';


interface OrdersViewProps {
  orders: Order[];
  dishes: Dish[];
  recipes: Recipe[];
  ingredients: Ingredient[];
  onCancelOrder: (orderId: string, motif: string, restoredIngredients: { ingredientId: string; quantityToRestore: number }[]) => void;
  logsAction: (action: string, module: string) => void;
  tenantId: string;
  activeUser: { name: string; role: string; id: string };
  activeTenant?: Tenant;
}

export default function OrdersView({
  orders,
  dishes,
  recipes,
  ingredients,
  onCancelOrder,
  logsAction,
  tenantId,
  activeUser,
  activeTenant
}: OrdersViewProps) {
  // Query and Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCanal, setFilterCanal] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPayment, setFilterPayment] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<DateFilterState>(initialDateFilterState);

  // Cancel order modal state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelMotif, setCancelMotif] = useState('');
  const [motifError, setMotifError] = useState('');

  // active tenant filter
  const tenantOrders = orders.filter(o => o.tenantId === tenantId);

  // Helper Custom PDF invoice generator matching POS receipt standard
  const generateReceiptPDF = (order: Order) => {
    let logoSpacing = 0;
    if (activeTenant?.logoUrl) {
      logoSpacing = 22;
    }
    let calculatedHeight = 35 + 25 + 10 + 20 + 25 + logoSpacing;
    order.lines.forEach(l => {
      calculatedHeight += 7;
      if (l.notes) calculatedHeight += 4;
    });
    const pageHeight = Math.max(125, calculatedHeight);

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, pageHeight]
    });

    let currentY = 10;

    if (activeTenant?.logoUrl) {
      try {
        doc.addImage(activeTenant.logoUrl, 'PNG', 32, currentY, 16, 11);
        currentY += 16;
      } catch (err) {
        console.warn("Could not print brand logo in PDF receipt:", err);
      }
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text((activeTenant?.name || "KISSINEFLOW RESTAURANT").toUpperCase(), 40, currentY, { align: "center" });
    currentY += 4.5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(activeTenant?.address || "Boulevard de la Liberté, Akwa, Douala", 40, currentY, { align: "center" });
    currentY += 3.5;
    doc.text(`Tél: ${activeTenant?.phone || "+237 677 88 99 00"}`, 40, currentY, { align: "center" });
    currentY += 4;

    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.text("--------------------------------------------", 40, currentY, { align: "center" });
    currentY += 4;

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

    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.text("--------------------------------------------", 40, y, { align: "center" });
    y += 4;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("PLAT", 5, y);
    doc.text("QTÉ", 52, y, { align: "center" });
    doc.text("TOTAL", 75, y, { align: "right" });
    y += 3;

    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.text("--------------------------------------------", 40, y, { align: "center" });
    y += 4;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    order.lines.forEach((line) => {
      const splitName = doc.splitTextToSize(line.dishName, 42);
      splitName.forEach((part: string, idx: number) => {
        doc.text(part, 5, y + (idx * 3.5));
      });

      doc.text(line.quantity.toString(), 52, y, { align: "center" });
      doc.text(`${line.total.toLocaleString()} F`, 75, y, { align: "right" });

      y += Math.max(splitName.length * 3.5, 4);

      if (line.notes) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(6.5);
        const splitNotes = doc.splitTextToSize(`(${line.notes})`, 42);
        splitNotes.forEach((notePart: string, idx: number) => {
          doc.text(notePart, 7, y + (idx * 3));
        });
        y += (splitNotes.length * 3) + 1.5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
      }
      y += 1;
    });

    y -= 1;
    doc.setFont("courier", "normal");
    doc.setFontSize(8);
    doc.text("--------------------------------------------", 40, y, { align: "center" });
    y += 4;

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

    doc.setFont("courier", "bold");
    doc.setFontSize(8);
    doc.text("============================================", 40, y, { align: "center" });
    y += 4.5;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("MERCI POUR VOTRE COMMANDE !", 40, y, { align: "center" });
    y += 4;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(6.5);
    doc.text("La saveur authentique de nos terroirs !", 40, y, { align: "center" });
    y += 3.5;
    
    const printTimestamp = new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
    doc.text(`Imprimé le ${printTimestamp}`, 40, y, { align: "center" });

    doc.save(`Facture-${order.number}.pdf`);
  };

  // Growth & totals for upper metrics
  const dateFilteredOrders = tenantOrders.filter(o => matchDateFilter(o.date, dateFilter));
  const validTenantOrders = dateFilteredOrders.filter(o => o.status === 'VALIDATED' || o.status === 'CLOSED');
  const canceledOrders = dateFilteredOrders.filter(o => o.status === 'CANCELLED');
  const totalRevenue = validTenantOrders.reduce((sum, o) => sum + o.total, 0);
  const averageBasket = validTenantOrders.length > 0 ? Math.round(totalRevenue / validTenantOrders.length) : 0;

  // Filter application
  const filteredOrders = dateFilteredOrders.filter(o => {
    // universal text search (CMD number, cash name, total)
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesNum = o.number.toLowerCase().includes(q);
      const matchesStaff = o.userName.toLowerCase().includes(q);
      const matchesTotal = o.total.toString().includes(q);
      if (!matchesNum && !matchesStaff && !matchesTotal) return false;
    }

    // canal
    if (filterCanal !== 'ALL' && o.canal !== filterCanal) return false;

    // payment
    if (filterPayment !== 'ALL' && o.paymentMethod !== filterPayment) return false;

    // status
    if (filterStatus !== 'ALL' && o.status !== filterStatus) return false;

    return true;
  });

  // Calculate ingredients to restore when canceling
  const getRestorationList = (order: Order) => {
    const restorations: { ingredientId: string; quantityToRestore: number }[] = [];
    order.lines.forEach(line => {
      const recipe = recipes.find(r => r.dishId === line.dishId && r.active);
      if (recipe) {
        recipe.lines.forEach(lineItem => {
          restorations.push({
            ingredientId: lineItem.ingredientId,
            quantityToRestore: lineItem.quantity * line.quantity
          });
        });
      }
    });
    return restorations;
  };

  // Perform Cancel Submission
  const submitCancellation = () => {
    if (!selectedOrder) return;
    if (!cancelMotif.trim()) {
      setMotifError('Veuillez saisir un motif explicite d\'annulation');
      return;
    }

    // compile ingredients to add back into stocks
    const restoredIngredients = getRestorationList(selectedOrder);

    onCancelOrder(selectedOrder.id, cancelMotif, restoredIngredients);
    logsAction(`Annulation Commande : ${selectedOrder.number} - Motif: "${cancelMotif}"`, 'COMMANDES / VENTES');
    
    // update current detail panel
    setSelectedOrder({
      ...selectedOrder,
      status: 'CANCELLED',
      cancelMotif
    });
    setShowCancelPrompt(false);
    setCancelMotif('');
    setMotifError('');
  };

  return (
    <div className="space-y-6" id="orders-module">
      <DateFilterComponent idPrefix="orders-tab" state={dateFilter} onChange={setDateFilter} />

      {/* Top statistics summary strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI: Total bills */}
        <div className="bg-white p-4 rounded-lg border border-gray-150 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Volume des réquisitions</span>
            <p className="text-xl font-bold font-sans text-gray-950 mt-1">{dateFilteredOrders.length} enregistrées</p>
          </div>
          <div className="p-2.5 bg-blue-50 text-[#1E4E8C] rounded">
            <Layers className="h-4 w-4" />
          </div>
        </div>

        {/* KPI: Encaissé */}
        <div className="bg-white p-4 rounded-lg border border-gray-150 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Cumul d'affaires</span>
            <p className="text-xl font-bold font-sans text-gray-950 mt-1">{totalRevenue.toLocaleString()} FCFA</p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>

        {/* KPI: Panic cases (Annulations) */}
        <div className="bg-white p-4 rounded-lg border border-gray-150 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Ventes annulées</span>
            <p className="text-xl font-bold font-sans text-gray-950 mt-1">{canceledOrders.length} tickets</p>
          </div>
          <div className="p-2.5 bg-red-50 text-red-600 rounded">
            <ShieldAlert className="h-4 w-4" />
          </div>
        </div>

        {/* KPI: average plate basket */}
        <div className="bg-white p-4 rounded-lg border border-gray-150 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Ticket Client</span>
            <p className="text-xl font-bold font-sans text-gray-950 mt-1">{averageBasket.toLocaleString()} FCFA</p>
          </div>
          <div className="p-2.5 bg-violet-50 text-violet-600 rounded">
            <CheckCircle className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Filter panel & Orders list layout */}
      <div className="bg-white rounded-lg border border-gray-150 shadow-2xs">
        {/* Quick actions & Search bar */}
        <div className="p-4 border-b border-gray-150 space-y-3 lg:space-y-0 lg:flex lg:items-center lg:justify-between lg:gap-4">
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              id="orders-search"
              type="text"
              placeholder="Rechercher par numéro de commande, montant, caissier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 border border-gray-250 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1E4E8C] text-gray-950"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Channels */}
            <select
              id="orders-filter-canal"
              value={filterCanal}
              onChange={(e) => setFilterCanal(e.target.value)}
              className="text-xs border rounded-lg bg-gray-50 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1E4E8C] text-gray-700"
            >
              <option value="ALL">Tous les canaux</option>
              <option value="SUR_PLACE">Sur place (Salles)</option>
              <option value="A_EMPORTER">À emporter</option>
              <option value="LIVRAISON">Livraison</option>
            </select>

            {/* Filter Payments */}
            <select
              id="orders-filter-payment"
              value={filterPayment}
              onChange={(e) => setFilterPayment(e.target.value)}
              className="text-xs border rounded-lg bg-gray-50 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1E4E8C] text-gray-700"
            >
              <option value="ALL">Tous les paiements</option>
              <option value="CASH">Espèces</option>
              <option value="OM">Orange Money</option>
              <option value="MOMO">MTN MoMo</option>
            </select>

            {/* Filter Status */}
            <select
              id="orders-filter-status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs border rounded-lg bg-gray-50 px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#1E4E8C] text-gray-700"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="VALIDATED">Validatée (Payée)</option>
              <option value="CANCELLED">Annulée (Crédit d'exc)</option>
              <option value="CLOSED">Clôturée (Livre-fermé)</option>
            </select>

            <button
              id="orders-export-excel-btn"
              onClick={() => {
                logsAction('Export comptable Excel des ventes', 'COMMANDES');
                const schema = filteredOrders.map(o => ({
                  'Numéro': o.number,
                  'Date': o.date,
                  'Heure': o.time,
                  'Canal': o.canal === 'SUR_PLACE' ? 'Sur place' : o.canal === 'A_EMPORTER' ? 'À emporter' : 'Livraison',
                  'Couverts': o.covers,
                  'Vendeur/Caissier': o.userName,
                  'Sous-total (FCFA)': o.subtotal,
                  'Remise (FCFA)': o.discount,
                  'Total Net (FCFA)': o.total,
                  'Mode de Paiement': o.paymentMethod,
                  'Statut': o.status === 'VALIDATED' ? 'Payée' : o.status === 'CLOSED' ? 'Clôturée' : 'Annulée'
                }));
                import('../utils/export').then(m => m.exportToExcel(schema, 'Journal_Ventes', 'Historique_Ventes_RESTO'));
              }}
              className="p-1.5 px-3 rounded-lg border text-xs font-semibold flex items-center gap-1.5 hover:bg-gray-50 text-gray-600 bg-white shadow-2xs cursor-pointer hover:border-gray-300"
            >
              <Download className="h-4 w-4 text-green-700" />
              <span>Export Excel</span>
            </button>
          </div>
        </div>

        {/* Master Database Table Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-gray-600">
            <thead className="text-[10px] uppercase font-bold tracking-wider text-gray-500 bg-gray-50 border-b">
              <tr>
                <th className="px-5 py-3">Numéro</th>
                <th className="px-5 py-3">Date & Heure</th>
                <th className="px-5 py-3">Canal</th>
                <th className="px-5 py-3">Couverts</th>
                <th className="px-5 py-3">Caissier</th>
                <th className="px-5 py-3 text-right">Net à payer</th>
                <th className="px-5 py-3">Mode Paiement</th>
                <th className="px-5 py-3">Statut</th>
                <th className="px-5 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {filteredOrders.sort((a,b) => b.number.localeCompare(a.number)).map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-gray-900 font-mono">
                    {order.number}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-gray-650">
                    {order.date} <span className="text-gray-400 font-mono ml-1">{order.time}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-semibold text-gray-800">
                      {order.canal === 'SUR_PLACE' ? 'Sur place' : order.canal === 'A_EMPORTER' ? 'À emporter' : 'Livraison'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-700">{order.covers} pax</td>
                  <td className="px-5 py-3 text-gray-700">{order.userName}</td>
                  <td className="px-5 py-3.5 text-right font-bold text-gray-900 font-mono">
                    {order.total.toLocaleString()} FCFA
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-sans ${
                      order.paymentMethod === 'CASH' ? 'bg-blue-50 text-[#1E4E8C]' :
                      order.paymentMethod === 'OM' ? 'bg-orange-50 text-orange-600' : 'bg-yellow-50 text-yellow-700'
                    }`}>
                      {order.paymentMethod}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      order.status === 'VALIDATED' ? 'bg-green-100 text-green-800' :
                      order.status === 'CLOSED' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                    }`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                      {order.status === 'VALIDATED' ? 'Validée' : order.status === 'CLOSED' ? 'Clôturée' : 'Annulée'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button
                      id={`view-order-details-${order.id}`}
                      onClick={() => setSelectedOrder(order)}
                      className="p-1.5 hover:bg-gray-100 text-[#1E4E8C] rounded flex items-center gap-1 mx-auto"
                      title="Détails"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Fiche</span>
                    </button>
                  </td>
                </tr>
              ))}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-20 text-center text-gray-400">
                    <Layers className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">Aucune commande ne correspond aux filtres appliqués</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details & actions Drawer/Modal overlay */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full shadow-2xl overflow-hidden border">
            {/* Header */}
            <div className="px-6 py-4 bg-[#1E4E8C] text-white flex justify-between items-center">
              <div>
                <span className="text-xs uppercase font-semibold text-blue-200 tracking-wider">Fiche Commande</span>
                <h3 className="text-base font-bold font-mono text-white">{selectedOrder.number}</h3>
              </div>
              <button
                id="close-order-modal-btn"
                onClick={() => { setSelectedOrder(null); setShowCancelPrompt(false); }}
                className="p-1 hover:bg-blue-800 rounded text-blue-100 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content body */}
            <div className="p-6 space-y-4 max-h-[480px] overflow-y-auto">
              {/* Restaurant branding header inside the invoice/receipt preview */}
              <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-4 text-center space-y-1 font-mono text-gray-800">
                {activeTenant?.logoUrl && (
                  <div className="flex justify-center pb-2">
                    <img src={activeTenant.logoUrl} alt="Logo" className="h-12 w-auto object-contain" referrerPolicy="no-referrer" />
                  </div>
                )}
                <h4 className="text-sm font-bold uppercase tracking-widest text-[#1E4E8C]">
                  {activeTenant?.name || "KISSINEFLOW RESTAURANT"}
                </h4>
                <p className="text-[10px] text-gray-500">
                  {activeTenant?.address || "Boulevard de la Liberté, Akwa, Douala"}
                  {activeTenant?.city ? `, ${activeTenant.city}` : ""}
                  {activeTenant?.country ? `, ${activeTenant.country}` : ""}
                </p>
                <p className="text-[10px] text-gray-500">Tél: {activeTenant?.phone || "+237 677 88 99 00"}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs border-b pb-4 border-gray-100">
                <div className="space-y-1 text-gray-600">
                  <div><strong>Heure d'entrée:</strong> {selectedOrder.date} à {selectedOrder.time}</div>
                  <div><strong>Servi par:</strong> {selectedOrder.userName}</div>
                  <div><strong>Nombre couverts:</strong> {selectedOrder.covers} pax</div>
                </div>
                <div className="space-y-1 text-gray-600">
                  <div><strong>Canal de vente:</strong> {selectedOrder.canal}</div>
                  <div><strong>Paiement de caisse:</strong> {selectedOrder.paymentMethod}</div>
                  <div><strong>Statut d'intégration:</strong> {selectedOrder.status}</div>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wide">Détail des plats commandés</h4>
                <div className="border rounded-lg overflow-hidden text-xs text-gray-700 bg-gray-50 divide-y">
                  {selectedOrder.lines.map((item) => (
                    <div key={item.id} className="p-3 flex justify-between items-center">
                      <div>
                        <span className="font-semibold block">{item.dishName}</span>
                        <span className="text-[10px] text-gray-500">{item.quantity} x {item.price.toLocaleString()} FCFA</span>
                        {item.notes && <div className="text-[9px] text-amber-800 italic">(Note: {item.notes})</div>}
                      </div>
                      <div className="text-right">
                        <span className="font-bold">{item.total.toLocaleString()} FCFA</span>
                        {item.discount > 0 && <span className="text-[10px] text-red-500 block">Déd: -{item.discount.toLocaleString()}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Margin & profits (Managers, Admins Only) */}
              {(activeUser.role === 'ADMIN' || activeUser.role === 'MANAGER') && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex justify-between text-xs text-blue-900">
                  <div>
                    <span className="block font-semibold">Marge du chef sur cette commande :</span>
                    <span className="text-[10px] text-blue-700">Calculée sur le coût théorique des recettes (BOM)</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm block">{(selectedOrder.total - (selectedOrder.costTotal || 0)).toLocaleString()} FCFA</span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded">
                      {((selectedOrder.total - (selectedOrder.costTotal || 0)) / selectedOrder.total * 100 || 0).toFixed(1)}% marge
                    </span>
                  </div>
                </div>
              )}

              {/* Cancel Motive Display if order was already cancelled */}
              {selectedOrder.status === 'CANCELLED' && (
                <div className="p-3 bg-red-50 text-red-900 border border-red-150 rounded-lg text-xs space-y-1">
                  <span className="font-bold flex items-center gap-1.5 uppercase tracking-wide">
                    <XCircle className="h-4 w-4" /> Commande Annulée
                  </span>
                  <p className="font-semibold">Motif renseigné: <span className="italic">"{selectedOrder.cancelMotif || 'Non spécifié'}"</span></p>
                  <p className="text-[10px] text-red-600">Note: Les stocks d'ingrédients ont été restaurés et les écritures financières inversées.</p>
                </div>
              )}

              {/* Action Prompt inputs (Motive for cancel) */}
              {showCancelPrompt && (
                <div className="bg-red-55 border bg-red-50 border-red-200 p-4 rounded-lg space-y-3">
                  <label className="text-xs font-bold text-red-950 block">Renseigner le motif d'annulation (Obligatoire) :</label>
                  <input
                    id="orders-cancel-motive-input"
                    type="text"
                    placeholder="Saisissez la raison (ex: Erreur de saisie canule, Doublon, Client parti...)"
                    value={cancelMotif}
                    onChange={(e) => { setCancelMotif(e.target.value); setMotifError(''); }}
                    className="w-full text-xs p-2 border border-red-200 bg-white rounded-md text-red-950 placeholder-red-400 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  {motifError && <p className="text-[10px] text-red-650 font-bold">{motifError}</p>}
                  
                  <div className="flex gap-2 justify-end">
                    <button
                      id="orders-cancel-abort-btn"
                      onClick={() => setShowCancelPrompt(false)}
                      className="px-3 py-1.5 bg-white text-gray-700 rounded text-xs"
                    >
                      Retour
                    </button>
                    <button
                      id="orders-cancel-confirm-btn"
                      onClick={submitCancellation}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded text-xs"
                    >
                      Confirmer Restauration & Annulation
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer triggers */}
            <div className="px-6 py-4 bg-gray-50 border-t flex gap-2 justify-between">
              <button
                id="orders-reprint-receipt-btn"
                onClick={() => {
                  generateReceiptPDF(selectedOrder);
                  logsAction(`Réimpression ticket commande ${selectedOrder.number}`, 'COMMANDES');
                }}
                className="px-3 py-2 bg-white border hover:bg-gray-100 rounded-lg text-xs font-semibold flex items-center gap-1.5 text-gray-700 pointer-events-auto"
              >
                <Printer className="h-4 w-4" />
                <span>Ressortir Ticket/Facture</span>
              </button>

              {selectedOrder.status !== 'CANCELLED' && (activeUser.role === 'ADMIN' || activeUser.role === 'MANAGER') && !showCancelPrompt && (
                <button
                  id="orders-trigger-cancel-btn"
                  onClick={() => setShowCancelPrompt(true)}
                  className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold border border-red-200 rounded-lg text-xs flex items-center gap-1.5"
                >
                  <XCircle className="h-4 w-4" />
                  <span>Annuler & Restaurer Stock</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
