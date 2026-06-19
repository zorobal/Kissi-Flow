/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  TrendingUp,
  Truck,
  FileSpreadsheet,
  Plus,
  ArrowRight,
  ClipboardCheck,
  PackageOpen,
  ChevronDown,
  ChevronRight,
  Activity,
  Coins,
  X,
  PlusCircle,
  Clock,
  ThumbsUp,
  CheckCircle,
  Tag,
  AlertTriangle,
  Edit,
  Trash2,
  FileText
} from 'lucide-react';
import { Supplier, Ingredient, PurchaseOrder, PurchaseLine, PurchaseRequest, StockMovement } from '../types';
import { jsPDF } from 'jspdf';

interface PurchasesViewProps {
  suppliers: Supplier[];
  ingredients: Ingredient[];
  purchaseOrders: PurchaseOrder[];
  purchaseRequests: PurchaseRequest[];
  onAddPurchaseOrder: (po: PurchaseOrder) => void;
  onUpdatePurchaseOrderStatus: (
    poId: string,
    status: 'DRAFT' | 'SENT' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED',
    receivedLines?: PurchaseLine[],
    batchInfos?: { [ingredientId: string]: { batchNum: string; expiryDate: string; qtyReceived: number } }
  ) => void;
  onAddPurchaseRequest: (pr: PurchaseRequest) => void;
  onApprovePurchaseRequest: (prId: string, convertedBC?: PurchaseOrder) => void;
  onUpdateSuppliers: (sups: Supplier[]) => void;
  onUpdatePurchaseRequests: (reqs: PurchaseRequest[]) => void;
  onUpdatePurchaseOrders: (orders: PurchaseOrder[]) => void;
  logsAction: (action: string, module: string) => void;
  tenantId: string;
  activeUser: { name: string; role: string; id: string };
}

export default function PurchasesView({
  suppliers,
  ingredients,
  purchaseOrders,
  purchaseRequests,
  onAddPurchaseOrder,
  onUpdatePurchaseOrderStatus,
  onAddPurchaseRequest,
  onApprovePurchaseRequest,
  onUpdateSuppliers,
  onUpdatePurchaseRequests,
  onUpdatePurchaseOrders,
  logsAction,
  tenantId,
  activeUser
}: PurchasesViewProps) {
  // Sub tab: 'SUPPLIERS' | 'REQUESTS' | 'ORDERS'
  const [purchaseSubTab, setPurchaseSubTab] = useState<'SUPPLIERS' | 'REQUESTS' | 'ORDERS'>('ORDERS');

  const tenantSuppliers = suppliers.filter(s => s.tenantId === tenantId);
  const tenantIngredients = ingredients.filter(i => i.tenantId === tenantId);
  const tenantOrders = purchaseOrders.filter(po => po.tenantId === tenantId);
  const tenantRequests = purchaseRequests.filter(pr => pr.tenantId === tenantId);

  // States for Suppliers CRUD
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);
  const [supCode, setSupCode] = useState('');
  const [supName, setSupName] = useState('');
  const [supRaison, setSupRaison] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supAddress, setSupAddress] = useState('');
  const [supCity, setSupCity] = useState('');
  const [supCountry, setSupCountry] = useState('Cameroun');
  const [supDays, setSupDays] = useState(3);
  const [supTerms, setSupTerms] = useState('Paiement à réception');

  // States for DAs (Purchase Requests) CRUD
  const [showDAModal, setShowDAModal] = useState(false);
  const [daToEdit, setDaToEdit] = useState<PurchaseRequest | null>(null);
  const [daLines, setDaLines] = useState<{ ingredientId: string; quantity: number }[]>([]);
  const [daIngToAdd, setDaIngToAdd] = useState('');
  const [daQtyToAdd, setDaQtyToAdd] = useState(5);

  // States for creating/modifying a Supplier Purchase Order (BC)
  const [showAddBCModal, setShowAddBCModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(suppliers[0]?.id || '');
  const [bcToEdit, setBcToEdit] = useState<PurchaseOrder | null>(null);

  // BC lines builder
  const [bcLines, setBcLines] = useState<{ ingredientId: string; quantity: number; price: number }[]>([]);
  const [bcIngToAdd, setBcIngToAdd] = useState('');
  const [bcQtyToAdd, setBcQtyToAdd] = useState(10);
  const [bcPriceToAdd, setBcPriceToAdd] = useState(1000);

  // States for receiving delivery (Part 2 Module 6.6)
  const [selectedOrderForReception, setSelectedOrderForReception] = useState<PurchaseOrder | null>(null);
  const [receptionQuantities, setReceptionQuantities] = useState<{ [lineId: string]: number }>({});
  const [receptionBatches, setReceptionBatches] = useState<{ [lineId: string]: string }>({});
  const [receptionExpiries, setReceptionExpiries] = useState<{ [lineId: string]: string }>({});

  const handleAddBcLine = () => {
    if (!bcIngToAdd) return;
    const exists = bcLines.some(b => b.ingredientId === bcIngToAdd);
    if (exists) return;
    setBcLines([...bcLines, { ingredientId: bcIngToAdd, quantity: bcQtyToAdd, price: bcPriceToAdd }]);
    setBcIngToAdd('');
  };

  const handleRemoveBcLine = (ingId: string) => {
    setBcLines(bcLines.filter(line => line.ingredientId !== ingId));
  };

  // Sync pricing input when selecting component.
  const handleSelectBCIng = (ingId: string) => {
    setBcIngToAdd(ingId);
    const ingObj = tenantIngredients.find(i => i.id === ingId);
    if (ingObj) {
      setBcPriceToAdd(ingObj.cmp || ingObj.lastPurchasePrice || 1000);
    }
  };

  // Trigger BC Submission / Edition
  const handleSubmitBC = () => {
    if (bcLines.length === 0) {
      alert('Veuillez ajouter au moins une ligne d\'achat');
      return;
    }

    const supObj = tenantSuppliers.find(s => s.id === selectedSupplier);

    if (bcToEdit) {
      // Modify existing
      const updatedPO: PurchaseOrder = {
        ...bcToEdit,
        supplierId: selectedSupplier,
        supplierName: supObj?.name || 'Inconnu',
        lines: bcLines.map((line, idx) => {
          const ing = tenantIngredients.find(i => i.id === line.ingredientId);
          return {
            id: line.ingredientId + `-${idx}`,
            ingredientId: line.ingredientId,
            ingredientName: ing?.name || 'Inconnu',
            quantity: line.quantity,
            quantityReceived: 0,
            unit: ing?.unit || 'kg',
            lastPrice: line.price,
            total: line.quantity * line.price
          };
        })
      };
      
      onUpdatePurchaseOrders(purchaseOrders.map(p => p.id === bcToEdit.id ? updatedPO : p));
      logsAction(`Bon de commande fournisseur modifié : ${updatedPO.number}`, 'ACHATS & APPROS');
      setShowAddBCModal(false);
      setBcLines([]);
      setBcToEdit(null);
      alert(`Bon de commande modifié avec succès : ${updatedPO.number}`);
    } else {
      const todayStr = new Date().toISOString().slice(0, 10);
      const dateCompact = todayStr.replace(/-/g, ''); // e.g. "20260618"
      const supNameClean = (supObj?.name || 'FOURNISSEUR').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
      const rNum = Math.floor(100 + Math.random() * 900); // 3 digits
      const bcNumber = `BC-${dateCompact}-${supNameClean}-${rNum}`;

      const newPO: PurchaseOrder = {
        id: `bc-${Date.now()}`,
        number: bcNumber,
        date: todayStr, // Dynamically use today's actual date
        supplierId: selectedSupplier,
        supplierName: supObj?.name || 'Inconnu',
        status: activeUser.role === 'ADMIN' ? 'SENT' : 'DRAFT', // If admin, auto-approve to SENT, else DRAFT awaiting validation!
        tenantId,
        lines: bcLines.map((line, idx) => {
          const ing = tenantIngredients.find(i => i.id === line.ingredientId);
          return {
            id: `bcl-${idx}-${Date.now()}`,
            ingredientId: line.ingredientId,
            ingredientName: ing?.name || 'Inconnu',
            quantity: line.quantity,
            quantityReceived: 0,
            unit: ing?.unit || 'kg',
            lastPrice: line.price,
            total: line.quantity * line.price
          };
        })
      };

      onAddPurchaseOrder(newPO);
      logsAction(`Bon de commande fournisseur créé : ${newPO.number} (${supObj?.name})`, 'ACHATS & APPROS');
      setShowAddBCModal(false);
      setBcLines([]);
      alert(`Bon de commande fournisseur généré avec succès : ${bcNumber}`);
    }
  };

  // Suppliers CRUD Helpers
  const handleOpenSupplierAdd = () => {
    setSupplierToEdit(null);
    setSupCode(`FOUR-${Date.now().toString().slice(-4)}`);
    setSupName('');
    setSupRaison('');
    setSupContact('');
    setSupPhone('');
    setSupEmail('');
    setSupAddress('');
    setSupCity('');
    setSupCountry('Cameroun');
    setSupDays(3);
    setSupTerms('Paiement à réception');
    setShowSupplierModal(true);
  };

  const handleOpenSupplierEdit = (sup: Supplier) => {
    setSupplierToEdit(sup);
    setSupCode(sup.code);
    setSupName(sup.name);
    setSupRaison(sup.raisonSociale);
    setSupContact(sup.contactName);
    setSupPhone(sup.phone);
    setSupEmail(sup.email);
    setSupAddress(sup.address);
    setSupCity(sup.city);
    setSupCountry(sup.country);
    setSupDays(sup.deliveryDays);
    setSupTerms(sup.paymentTerms);
    setShowSupplierModal(true);
  };

  const handleSaveSupplier = () => {
    if (!supName || !supRaison) {
      alert("Veuillez saisir le nom et la raison sociale.");
      return;
    }
    if (supplierToEdit) {
      const updated: Supplier = {
        ...supplierToEdit,
        code: supCode,
        name: supName,
        raisonSociale: supRaison,
        contactName: supContact,
        phone: supPhone,
        email: supEmail,
        address: supAddress,
        city: supCity,
        country: supCountry,
        deliveryDays: Number(supDays),
        paymentTerms: supTerms
      };
      onUpdateSuppliers(suppliers.map(s => s.id === supplierToEdit.id ? updated : s));
      logsAction(`Fournisseur modifié : ${supName}`, 'ACHATS & APPROS');
    } else {
      const added: Supplier = {
        id: `sup-${Date.now()}`,
        code: supCode,
        name: supName,
        raisonSociale: supRaison,
        contactName: supContact,
        phone: supPhone,
        email: supEmail,
        address: supAddress,
        city: supCity,
        country: supCountry,
        deliveryDays: Number(supDays),
        paymentTerms: supTerms,
        active: true,
        tenantId
      };
      onUpdateSuppliers([...suppliers, added]);
      logsAction(`Fournisseur ajouté : ${supName}`, 'ACHATS & APPROS');
    }
    setShowSupplierModal(false);
    setSupplierToEdit(null);
  };

  const handleDeleteSupplier = (supId: string, name: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le fournisseur "${name}" ?`)) {
      onUpdateSuppliers(suppliers.filter(s => s.id !== supId));
      logsAction(`Fournisseur supprimé : ${name}`, 'ACHATS & APPROS');
    }
  };

  // DAs CRUD Helpers
  const handleOpenDAAdd = () => {
    setDaToEdit(null);
    setDaLines([]);
    setDaIngToAdd('');
    setDaQtyToAdd(5);
    setShowDAModal(true);
  };

  const handleOpenDAEdit = (pr: PurchaseRequest) => {
    setDaToEdit(pr);
    setDaLines(pr.lines.map(line => ({
      ingredientId: line.ingredientId,
      quantity: line.quantity
    })));
    setDaIngToAdd('');
    setDaQtyToAdd(5);
    setShowDAModal(true);
  };

  const handleAddDaLine = () => {
    if (!daIngToAdd) return;
    const exists = daLines.some(l => l.ingredientId === daIngToAdd);
    if (exists) return;
    setDaLines([...daLines, { ingredientId: daIngToAdd, quantity: daQtyToAdd }]);
    setDaIngToAdd('');
  };

  const handleRemoveDaLine = (ingId: string) => {
    setDaLines(daLines.filter(line => line.ingredientId !== ingId));
  };

  const handleSaveDA = () => {
    if (daLines.length === 0) {
      alert("Veuillez ajouter au moins un ingrédient.");
      return;
    }
    if (daToEdit) {
      const updated: PurchaseRequest = {
        ...daToEdit,
        lines: daLines.map(line => {
          const ing = tenantIngredients.find(i => i.id === line.ingredientId);
          return {
            ingredientId: line.ingredientId,
            ingredientName: ing?.name || 'Inconnu',
            quantity: line.quantity,
            unit: ing?.unit || 'kg'
          };
        })
      };
      onUpdatePurchaseRequests(purchaseRequests.map(r => r.id === daToEdit.id ? updated : r));
      logsAction(`Demande d'achat modifiée : ${updated.number}`, 'ACHATS & APPROS');
    } else {
      const todayStr = new Date().toISOString().slice(0, 10);
      const dateCompact = todayStr.replace(/-/g, ''); // e.g. "20260618"
      const authorPref = activeUser.name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0,3) || 'REQ';
      const rNum = Math.floor(100 + Math.random() * 900); // 3 digits
      const daNumber = `DA-${dateCompact}-${authorPref}-${rNum}`;

      const added: PurchaseRequest = {
        id: `pr-${Date.now()}`,
        number: daNumber,
        date: todayStr,
        requesterName: activeUser.name,
        status: 'SUBMITTED',
        tenantId,
        lines: daLines.map(line => {
          const ing = tenantIngredients.find(i => i.id === line.ingredientId);
          return {
            ingredientId: line.ingredientId,
            ingredientName: ing?.name || 'Inconnu',
            quantity: line.quantity,
            unit: ing?.unit || 'kg'
          };
        })
      };
      onUpdatePurchaseRequests([...purchaseRequests, added]);
      logsAction(`Demande d'achat créée : ${added.number}`, 'ACHATS & APPROS');
    }
    setShowDAModal(false);
    setDaToEdit(null);
    setDaLines([]);
  };

  const handleDeleteDA = (daId: string, num: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la DA "${num}" ?`)) {
      onUpdatePurchaseRequests(purchaseRequests.filter(r => r.id !== daId));
      logsAction(`Demande d'achat supprimée : ${num}`, 'ACHATS & APPROS');
    }
  };

  // BC CRUD Helpers
  const handleOpenBCEdit = (po: PurchaseOrder) => {
    setBcToEdit(po);
    setSelectedSupplier(po.supplierId);
    setBcLines(po.lines.map(line => ({
      ingredientId: line.ingredientId,
      quantity: line.quantity,
      price: line.lastPrice
    })));
    setShowAddBCModal(true);
  };

  const handleDeleteBC = (poId: string, num: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le Bon de Commande "${num}" ?`)) {
      onUpdatePurchaseOrders(purchaseOrders.filter(p => p.id !== poId));
      logsAction(`Bon de Commande supprimé : ${num}`, 'ACHATS & APPROS');
    }
  };

  // Setup reception lines with traceability and auto-generated batch / quality variables
  const handleOpenReceptionDraft = (po: PurchaseOrder) => {
    setSelectedOrderForReception(po);
    const initialRecs: { [lineId: string]: number } = {};
    const initialBatches: { [lineId: string]: string } = {};
    const initialExpiries: { [lineId: string]: string } = {};

    po.lines.forEach(l => {
      // pre-fill with remaining quantities to receive
      const remaining = l.quantity - (l.quantityReceived || 0);
      initialRecs[l.id] = remaining;
      initialBatches[l.id] = `LOT-26-${l.ingredientId.toUpperCase().replace('ING-', '')}-${Math.floor(100 + Math.random() * 900)}`;
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15); // Suggest 15 days of shelf life
      initialExpiries[l.id] = futureDate.toISOString().slice(0, 10);
    });

    setReceptionQuantities(initialRecs);
    setReceptionBatches(initialBatches);
    setReceptionExpiries(initialExpiries);
  };

  // Submit Reception results including batch number & expiration date tracking
  const handleValidateReception = () => {
    if (!selectedOrderForReception) return;

    let allFullReceived = true;
    let containsPartial = false;

    // construct the receiving lines structure
    const updatedLines: PurchaseLine[] = selectedOrderForReception.lines.map(line => {
      const actualReceivedInput = receptionQuantities[line.id] ?? 0;
      const computedTotalReceived = line.quantityReceived + actualReceivedInput;
      
      const updatedLineObj: PurchaseLine = {
        ...line,
        quantityReceived: computedTotalReceived
      };

      if (computedTotalReceived < line.quantity) {
        allFullReceived = false;
        containsPartial = true;
      }
      return updatedLineObj;
    });

    const statusResult = allFullReceived ? 'RECEIVED' : containsPartial ? 'PARTIALLY_RECEIVED' : 'SENT';

    // Compile batchInfo structure
    const batchInfos: { [ingredientId: string]: { batchNum: string; expiryDate: string; qtyReceived: number } } = {};
    selectedOrderForReception.lines.forEach(line => {
      const qty = receptionQuantities[line.id] ?? 0;
      if (qty > 0) {
        batchInfos[line.ingredientId] = {
          batchNum: receptionBatches[line.id] || `LOT-26-AUTO`,
          expiryDate: receptionExpiries[line.id] || new Date().toISOString().slice(0, 10),
          qtyReceived: qty
        };
      }
    });

    onUpdatePurchaseOrderStatus(selectedOrderForReception.id, statusResult, updatedLines, batchInfos);
    logsAction(`Réception de marchandises sur le BC ${selectedOrderForReception.number} (${statusResult})`, 'ACHATS & APPROS');
    setSelectedOrderForReception(null);
    alert('Réception validée ! Les lots correspondants ont été enregistrés pour la traçabilité des péremptions.');
  };

  // EXPORT SUPPLIER PURCHASE ORDER (BC) TO PDF
  const handleExportBCPDF = (po: PurchaseOrder) => {
    logsAction(`Export PDF du Bon de Commande ${po.number}`, 'ACHATS & APPROS');
    const doc = new jsPDF();
    
    // Header banner with branding palette
    doc.setFillColor(30, 78, 140); // Deep Blue (#1E4E8C)
    doc.rect(0, 0, 210, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("BON DE COMMANDE FOURNISSEUR (BC)", 15, 22);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`N° BC : ${po.number}`, 150, 16);
    doc.text(`Date : ${po.date}`, 150, 22);
    doc.text(`Statut : ${po.status === 'RECEIVED' ? 'Reçu complet' : po.status === 'PARTIALLY_RECEIVED' ? 'Reçu partiel' : 'BC Émis'}`, 150, 28);
    
    // Buyer details
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("DESTINATAIRE DE LIVRAISON :", 15, 52);
    doc.setFont("helvetica", "normal");
    doc.text("KISSINE FLOW RESTAURANT GROUP", 15, 58);
    doc.text("Boulevard de la Liberté, Akwa, Douala, Cameroun", 15, 64);
    doc.text("Téléphone: +237 677 88 99 00", 15, 70);
    
    // Supplier detail
    const sup = tenantSuppliers.find(s => s.id === po.supplierId);
    doc.setFont("helvetica", "bold");
    doc.text("FOURNISSEUR AGRÉÉ :", 115, 52);
    doc.setFont("helvetica", "normal");
    doc.text((po.supplierName || 'ETS MBOA DISTRIBUTION').toUpperCase(), 115, 58);
    doc.text(`Adresse: ${sup?.address || "Zone Industrielle Bassa"}, ${sup?.city || "Douala"}`, 115, 64);
    doc.text(`Règlement: ${sup?.paymentTerms || "Paiement à réception"}`, 115, 70);
    doc.text(`Contact: ${sup?.contactName || "Chef Commercial"}`, 115, 76);
    
    doc.setDrawColor(220, 220, 220);
    doc.line(15, 84, 195, 84);
    
    // Items table header
    let y = 96;
    doc.setFillColor(242, 245, 249);
    doc.rect(15, y - 5, 180, 7, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.text("COMPOSANT INGRÉDIENT", 17, y);
    doc.text("QTÉ COMMANDE", 80, y);
    doc.text("UNITÉ", 115, y);
    doc.text("P.U. (FCFA)", 140, y);
    doc.text("TOTAL (FCFA)", 170, y);
    
    doc.line(15, y + 3, 195, y + 3);
    y += 11;
    
    doc.setFont("helvetica", "normal");
    let totalVal = 0;
    po.lines.forEach(line => {
      doc.text(line.ingredientName, 17, y);
      doc.text(line.quantity.toLocaleString(), 80, y);
      doc.text(line.unit, 115, y);
      doc.text(line.lastPrice.toLocaleString(), 140, y);
      doc.text((line.quantity * line.lastPrice).toLocaleString(), 170, y);
      totalVal += line.quantity * line.lastPrice;
      y += 8;
    });
    
    doc.line(15, y - 4, 195, y - 4);
    
    // Net total block
    y += 4;
    doc.setFont("helvetica", "bold");
    doc.text("VALORISATION TOTALE NETTE DU BC :", 90, y);
    doc.text(`${totalVal.toLocaleString()} FCFA`, 170, y);
    
    // Sign-off signature areas
    y += 28;
    doc.line(15, y, 195, y);
    y += 8;
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "italic");
    doc.text("Certifié par la direction d'exploitation Kissine Flow. Ce document fait foi d'accord commercial.", 15, y);
    y += 12;
    doc.setFont("helvetica", "bold");
    doc.text("L'Économe (Acheteur)", 25, y);
    doc.text("Cachet et Signature Fournisseur", 125, y);
    
    doc.save(`KissineFlow_BC_${po.number}.pdf`);
  };

  // EXPORT INTERNAL PURCHASE REQUEST (DA) TO PDF
  const handleExportDAPDF = (pr: PurchaseRequest) => {
    logsAction(`Export PDF de la Demande d'Achat ${pr.number}`, 'ACHATS & APPROS');
    const doc = new jsPDF();
    
    // Orange/amber branding header
    doc.setFillColor(242, 101, 34); // Kissine Glow or nice amber (#F26522)
    doc.rect(0, 0, 210, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("DEMANDE D'ACHAT INTERNE KITCHEN (DA)", 15, 22);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`N° Dossier: ${pr.number}`, 150, 16);
    doc.text(`Date Émission: ${pr.date}`, 150, 22);
    doc.text(`Statut: ${pr.status === 'CONVERTED' ? 'Approuvée' : 'À Valider'}`, 150, 28);
    
    // Office and requester details
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("INFORMATIONS DU REQUÉRANT :", 15, 52);
    doc.setFont("helvetica", "normal");
    doc.text(`Nom de l'émetteur : ${pr.requesterName}`, 15, 58);
    doc.text("Département : Cuisine & Recettes", 15, 64);
    doc.text("Secteur : Restauration et Stocks d'Approvisionnement", 100, 58);
    doc.text("Établissement : Kissine Flow Intégral", 100, 64);
    
    doc.setDrawColor(220, 220, 220);
    doc.line(15, 74, 195, 74);
    
    // Items table header
    let y = 86;
    doc.setFillColor(252, 246, 242);
    doc.rect(15, y - 5, 180, 7, 'F');
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("DÉSIGNATION DU MATÉRIEL OU COMPOSANT", 17, y);
    doc.text("QUANTITÉ REQUISE", 105, y);
    doc.text("UNITÉ D'INVENTAIRE", 155, y);
    
    doc.line(15, y + 3, 195, y + 3);
    y += 11;
    
    doc.setFont("helvetica", "normal");
    pr.lines.forEach(line => {
      doc.text(line.ingredientName, 17, y);
      doc.text(line.quantity.toLocaleString(), 105, y);
      doc.text(line.unit, 155, y);
      y += 8;
    });
    
    doc.line(15, y - 4, 195, y - 4);
    
    // Sign-off areas
    y += 24;
    doc.line(15, y, 195, y);
    y += 8;
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "italic");
    doc.text("Document interne destiné exclusivement au service d'économat de Kissine Flow.", 15, y);
    y += 12;
    doc.setFont("helvetica", "bold");
    doc.text("Le Chef de Cuisine / Demandeur", 25, y);
    doc.text("Le Gestionnaire / Approbateur", 125, y);
    
    doc.save(`KissineFlow_DA_${pr.number}.pdf`);
  };

  // Automated suggestions based on stock constraints (Part 2 Module 6.12 Suggestion BC)
  const sugLowStockIngredients = tenantIngredients.filter(ing => ing.stockActual <= ing.stockMin && ing.active);

  const totalBCValue = (po: PurchaseOrder) => {
    return po.lines.reduce((sum, l) => sum + (l.quantity * l.lastPrice), 0);
  };

  return (
    <div className="space-y-6" id="purchases-module">
      {/* Visual KPI highlights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Suppliers count */}
        <div className="bg-white p-4 rounded-lg border border-gray-150 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-550 font-medium tracking-wide block uppercase">Fournisseurs homologués</span>
            <p className="text-xl font-bold font-sans text-gray-950 mt-1">{tenantSuppliers.length} agrées</p>
          </div>
          <div className="p-2.5 bg-blue-50 text-[#1E4E8C] rounded">
            <Truck className="h-4 w-4" />
          </div>
        </div>

        {/* Requisitions count */}
        <div className="bg-white p-4 rounded-lg border border-gray-150 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-550 font-medium tracking-wide block uppercase">Requêtes de cuisine (DA)</span>
            <p className="text-xl font-bold font-sans text-gray-950 mt-1">{tenantRequests.length} dossiers</p>
          </div>
          <div className="p-2.5 bg-yellow-50 text-yellow-600 rounded">
            <Clock className="h-4 w-4" />
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-white p-4 rounded-lg border border-gray-150 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-550 font-medium tracking-wide block uppercase">Commandes d'achats en cours</span>
            <p className="text-xl font-bold font-sans text-gray-950 mt-1">
              {tenantOrders.filter(po => po.status === 'SENT' || po.status === 'PARTIALLY_RECEIVED').length} en cours
            </p>
          </div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded">
            <PackageOpen className="h-4 w-4" />
          </div>
        </div>

        {/* Suggestion BC box (AI and alert trigger) */}
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-orange-850 font-bold block uppercase tracking-wide">Période critique de réappro</span>
            <p className="text-xs text-orange-950 font-medium mt-1">
              {sugLowStockIngredients.length > 0 ? `Besoin de réappro pour ${sugLowStockIngredients.length} produits.` : 'Stock sécurité optimal.'}
            </p>
          </div>
          <div className="p-2 bg-orange-100 text-orange-600 rounded-lg animate-pulse">
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Sub menu tabs in Purchases */}
      <div className="flex border-b border-gray-150">
        <button
          id="purch-orders-tab"
          onClick={() => setPurchaseSubTab('ORDERS')}
          className={`px-6 py-3 text-xs font-bold border-b-2 transition-all ${
            purchaseSubTab === 'ORDERS'
              ? 'border-[#1E4E8C] text-[#1E4E8C] bg-blue-50/20'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Bons de Commandes Fournisseurs (BC)
        </button>
        <button
          id="purch-requests-tab"
          onClick={() => setPurchaseSubTab('REQUESTS')}
          className={`px-6 py-3 text-xs font-bold border-b-2 transition-all ${
            purchaseSubTab === 'REQUESTS'
              ? 'border-[#1E4E8C] text-[#1E4E8C] bg-blue-50/20'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Demandes d'Achats Interne (DA)
        </button>
        <button
          id="purch-suppliers-tab"
          onClick={() => setPurchaseSubTab('SUPPLIERS')}
          className={`px-6 py-3 text-xs font-bold border-b-2 transition-all ${
            purchaseSubTab === 'SUPPLIERS'
              ? 'border-[#1E4E8C] text-[#1E4E8C] bg-blue-50/20'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Répertoire Fournisseurs
        </button>
      </div>

      {/* RENDER COMPONENT PANELS */}
      {purchaseSubTab === 'ORDERS' && (
        <div className="space-y-4">
          <div className="flex md:items-center md:justify-between bg-white p-4 rounded-lg border flex-col sm:flex-row gap-3">
            <div>
              <h3 className="text-base font-semibold text-gray-950">Suivi des Approvisionnements Resto</h3>
              <p className="text-xs text-gray-500 mt-1">Enregistrez de nouvelles commandes et validez les réceptions pour mettre à jour les stocks.</p>
            </div>

            <button
              id="purch-trigger-bc-modal"
              onClick={() => setShowAddBCModal(true)}
              className="px-4 py-2 bg-[#1E4E8C] hover:bg-blue-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Nouveau BC Fournisseur</span>
            </button>
          </div>

          <div className="bg-white border rounded-lg overflow-hidden shadow-2xs">
            <table className="w-full text-xs text-left text-gray-650">
              <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 border-b uppercase">
                <tr>
                  <th className="px-5 py-3">Numéro</th>
                  <th className="px-5 py-3">Date d'édition</th>
                  <th className="px-5 py-3">Raison Sociale Fournisseur</th>
                  <th className="px-5 py-3">Composants commandés</th>
                  <th className="px-5 py-3 text-right">Valorisation Total BC</th>
                  <th className="px-5 py-3">Statut BC</th>
                  <th className="px-5 py-3 text-center">Opérations</th>
                </tr>
              </thead>
              <tbody className="divide-y font-semibold text-gray-700">
                {tenantOrders.sort((a,b)=> b.number.localeCompare(a.number)).map(po => {
                  const val = totalBCValue(po);
                  return (
                    <tr key={po.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3.5 font-mono text-gray-950 font-bold">{po.number}</td>
                      <td className="px-5 py-3.5 text-gray-500">{po.date}</td>
                      <td className="px-5 py-3.5 text-gray-900">{po.supplierName}</td>
                      <td className="px-5 py-3.5 text-[11px] text-gray-500">
                        {po.lines.map(l => `${l.quantity} ${l.unit} de ${l.ingredientName}`).join(', ')}
                      </td>
                      <td className="px-5 py-3.5 text-right font-bold text-[#1E4E8C] font-mono">
                        {val.toLocaleString()} FCFA
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold inline-block font-sans ${
                          po.status === 'RECEIVED' ? 'bg-green-100 text-green-800' :
                          po.status === 'PARTIALLY_RECEIVED' ? 'bg-amber-100 text-amber-800' :
                          po.status === 'DRAFT' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {po.status === 'RECEIVED' ? 'Reçu complet' :
                           po.status === 'PARTIALLY_RECEIVED' ? 'Partiel reçu' :
                           po.status === 'DRAFT' ? 'En Attente' : 'BC Envoyé'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleExportBCPDF(po)}
                          className="bg-blue-50 hover:bg-blue-100 border text-blue-800 border-blue-300 font-bold rounded px-2 py-1 text-[11px] flex items-center gap-1 cursor-pointer"
                          title="Exporter en PDF"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          <span>PDF</span>
                        </button>
                        {po.status !== 'RECEIVED' && po.status !== 'DRAFT' && (
                          <button
                            id={`bc-reception-btn-${po.id}`}
                            onClick={() => handleOpenReceptionDraft(po)}
                            className="bg-emerald-50 hover:bg-emerald-100 border text-emerald-800 border-emerald-300 font-bold rounded px-2 py-1 text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <ClipboardCheck className="h-3.5 w-3.5" />
                            <span>Réceptionner</span>
                          </button>
                        )}
                        {po.status === 'DRAFT' && activeUser.role === 'ADMIN' && (
                          <button
                            id={`bc-approve-btn-${po.id}`}
                            onClick={() => {
                              onUpdatePurchaseOrderStatus(po.id, 'SENT');
                              logsAction(`Validation du bon de commande ${po.number} par l'ADMIN`, 'ACHATS & APPROS');
                              alert(`Le Bon de Commande ${po.number} a été validé avec succès par l'ADMIN.`);
                            }}
                            className="bg-[#1E4E8C] text-white hover:bg-blue-800 border border-[#1E4E8C] font-extrabold rounded px-2 py-1 text-[11px] flex items-center gap-1 cursor-pointer"
                          >
                            <span className="font-extrabold">Valider BC</span>
                          </button>
                        )}
                        {(activeUser.role === 'ADMIN' || activeUser.role === 'MANAGER') && (
                          <>
                            <button
                              onClick={() => handleOpenBCEdit(po)}
                              className="p-1 px-2 border rounded hover:bg-blue-50 text-[#1E4E8C] flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                              title="Modifier ce Bon de Commande"
                            >
                              <Edit className="h-3 w-3" />
                              <span>Modifier</span>
                            </button>
                            <button
                              onClick={() => handleDeleteBC(po.id, po.number)}
                              className="p-1 px-2 border border-red-205 rounded hover:bg-red-50 text-red-600 flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                              title="Supprimer ce Bon de Commande"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>Supprimer</span>
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REQUESTS Tab panel */}
      {purchaseSubTab === 'REQUESTS' && (
        <div className="space-y-4">
          <div className="bg-white p-5 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Workflow des Demandes d'Achats (DA) de cuisine</h3>
              <p className="text-xs text-gray-500 leading-relaxed">Les magasiniers émettent les besoins d'achats en brouillon, les administrateurs les approuvent et les convertissent instantanément en bons de commandes fournisseurs.</p>
            </div>
            {(activeUser.role === 'ADMIN' || activeUser.role === 'MANAGER' || activeUser.role === 'KITCHEN' || activeUser.role === 'USER') && (
              <button
                id="add-da-btn"
                onClick={handleOpenDAAdd}
                className="px-4 py-2 bg-[#1E4E8C] hover:bg-blue-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>Nouvelle DA de cuisine</span>
              </button>
            )}
          </div>

          <div className="bg-white border rounded-lg overflow-hidden shadow-2xs">
            <table className="w-full text-xs text-left text-gray-650 font-sans">
              <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 border-b uppercase">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Numéro DA</th>
                  <th className="px-5 py-3">Demandeur</th>
                  <th className="px-5 py-3">Matériaux requis</th>
                  <th className="px-5 py-3">Statut validation</th>
                  <th className="px-5 py-3 text-center">Actions / Workflow</th>
                </tr>
              </thead>
              <tbody className="divide-y font-semibold text-gray-700">
                {tenantRequests.map(pr => (
                  <tr key={pr.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5 text-gray-500 font-mono">{pr.date}</td>
                    <td className="px-5 py-3.5 font-mono text-gray-950 font-bold">{pr.number}</td>
                    <td className="px-5 py-3.5 text-gray-750 font-bold">{pr.requesterName}</td>
                    <td className="px-5 py-3.5 text-[11px] text-gray-600">
                      {pr.lines.map(l => `${l.quantity} ${l.unit} x ${l.ingredientName}`).join(' | ')}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase inline-block font-sans ${
                        pr.status === 'CONVERTED' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-850'
                      }`}>
                        {pr.status === 'CONVERTED' ? 'Approuvée & BC généré' : 'En attente validation'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center flex items-center justify-center gap-2">
                      {pr.status === 'SUBMITTED' && activeUser.role === 'ADMIN' && (
                        <button
                          id={`approve-da-${pr.id}`}
                          onClick={() => {
                            // Convert standard DA to BC order
                            const todayStr = new Date().toISOString().slice(0, 10);
                            const dateCompact = todayStr.replace(/-/g, ''); // "20260618"
                            const supObj = tenantSuppliers[0];
                            const supNameClean = (supObj?.name || 'MBOA').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
                            const rNum = Math.floor(100 + Math.random() * 900); // 3 digits
                            const bcNumber = `BC-${dateCompact}-${supNameClean}-${rNum}`;
                            
                            const convertedBC: PurchaseOrder = {
                              id: `bc-conv-${Date.now()}`,
                              number: bcNumber,
                              date: todayStr,
                              supplierId: supObj?.id || 'sup-mboa',
                              supplierName: supObj?.name || 'ETS MBOA DISTRIBUTION',
                              status: 'SENT',
                              tenantId,
                              lines: pr.lines.map((pl, idx) => ({
                                id: `bcl-conv-${idx}`,
                                ingredientId: pl.ingredientId,
                                ingredientName: pl.ingredientName,
                                quantity: pl.quantity,
                                quantityReceived: 0,
                                unit: pl.unit,
                                lastPrice: 1500, // standard placeholder cost
                                total: pl.quantity * 1500
                              }))
                            };
                            onApprovePurchaseRequest(pr.id, convertedBC);
                            logsAction(`Approbation cuisine de la DA ${pr.number} (Convertie en BC ${bcNumber})`, 'ACHATS & APPROS');
                            alert(`Demande d'achat approuvée ! Bon de commande fournisseur auto-généré : ${bcNumber}`);
                          }}
                          className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border-emerald-300 border text-[11px] px-2 py-1 rounded cursor-pointer"
                        >
                          Approuver
                        </button>
                      )}
                      <button
                        onClick={() => handleExportDAPDF(pr)}
                        className="bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300 font-bold rounded px-2 py-1 text-[11px] flex items-center gap-1 cursor-pointer"
                        title="Exporter en PDF"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>PDF</span>
                      </button>
                      {(activeUser.role === 'ADMIN' || activeUser.role === 'MANAGER') && (
                        <>
                          <button
                            onClick={() => handleOpenDAEdit(pr)}
                            className="p-1 px-2 border rounded hover:bg-blue-50 text-[#1E4E8C] flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                          >
                            <Edit className="h-3 w-3" />
                            <span>Modifier</span>
                          </button>
                          <button
                            onClick={() => handleDeleteDA(pr.id, pr.number)}
                            className="p-1 px-2 border border-red-200 rounded hover:bg-red-50 text-red-600 flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Supprimer</span>
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUPPLIERS Tab panel */}
      {purchaseSubTab === 'SUPPLIERS' && (
        <div className="space-y-4">
          <div className="bg-white p-4 border rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Répertoire des Fournisseurs Homologués</h3>
              <p className="text-xs text-gray-500">Gérez les coordonnées, les conditions de règlement et délais de livraison de vos fournisseurs agréés.</p>
            </div>
            {(activeUser.role === 'ADMIN' || activeUser.role === 'MANAGER') && (
              <button
                id="add-supplier-btn"
                onClick={handleOpenSupplierAdd}
                className="px-4 py-2 bg-[#1E4E8C] hover:bg-blue-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Nouveau Fournisseur</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenantSuppliers.map(sup => (
              <div key={sup.id} className="bg-white border rounded-lg shadow-2xs p-5 hover:border-blue-400 transition-colors flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono font-bold text-gray-500 border px-1.5 py-0.3 rounded bg-gray-50">
                      {sup.code}
                    </span>
                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-bold">Actif agrée</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-950">{sup.name}</h3>
                    <p className="text-xs text-gray-400 font-serif italic">{sup.raisonSociale}</p>
                  </div>

                  <div className="text-xs text-gray-650 space-y-1.5 pt-3 border-t">
                    <div><strong>Contact Principal :</strong> {sup.contactName}</div>
                    <div><strong>Téléphone direct :</strong> {sup.phone}</div>
                    <div><strong>Email achats :</strong> <span className="font-mono text-[11px]">{sup.email}</span></div>
                    <div><strong>Délai moyen appro :</strong> {sup.deliveryDays} jour(s)</div>
                    <div><strong>Modalités comptables :</strong> {sup.paymentTerms}</div>
                  </div>
                </div>

                <div className="pt-4 border-t mt-4 flex justify-between items-center">
                  <span className="text-[10px] uppercase text-gray-400 font-bold">Provenance: {sup.city}, {sup.country}</span>
                  {(activeUser.role === 'ADMIN' || activeUser.role === 'MANAGER') && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleOpenSupplierEdit(sup)}
                        className="p-1 px-1.5 border rounded hover:bg-blue-50 text-[#1E4E8C] flex items-center gap-0.5 text-[10px] font-bold cursor-pointer"
                      >
                        <Edit className="h-2.5 w-2.5" />
                        <span>Éditer</span>
                      </button>
                      <button
                        onClick={() => handleDeleteSupplier(sup.id, sup.name)}
                        className="p-1 px-1.5 border border-red-200 rounded hover:bg-red-50 text-red-600 flex items-center gap-0.5 text-[10px] font-bold cursor-pointer"
                      >
                        <Trash2 className="h-2.5 w-2.5" />
                        <span>Sup.</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BC ADD PREPARATION MODAL */}
      {showAddBCModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 border shadow-2xl overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center pb-3 border-b mb-4">
                <h3 className="text-base font-bold text-gray-905 flex items-center gap-1.5">
                  <Tag className="h-5 w-5 text-[#1E4E8C]" />
                  Nouveau Bon de Commande Fournisseur (BC)
                </h3>
                <button onClick={() => setShowAddBCModal(false)} className="p-1 hover:bg-gray-100 rounded text-gray-400">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs text-gray-750">
                <div className="space-y-1">
                  <label className="text-gray-600 font-semibold block">Sélectionnez le Fournisseur *</label>
                  <select
                    id="new-bc-supplier-select"
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    className="w-full p-2 border bg-white rounded text-gray-805"
                  >
                    {tenantSuppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.contactName})</option>)}
                  </select>
                </div>

                {/* Sub BC line items inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end bg-gray-50 p-2.5 rounded-lg border">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase font-semibold">Ingrédient requis</label>
                    <select
                      id="new-bc-ing-select"
                      value={bcIngToAdd}
                      onChange={(e) => handleSelectBCIng(e.target.value)}
                      className="w-full text-xs p-1.5 border bg-white rounded"
                    >
                      <option value="">-- Choisir --</option>
                      {tenantIngredients.map(ing => (
                        <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase font-semibold">Quantité</label>
                    <input
                      id="new-bc-qty-input"
                      type="number"
                      value={bcQtyToAdd}
                      onChange={(e) => setBcQtyToAdd(Math.max(1, parseFloat(e.target.value) || 0))}
                      className="w-full text-xs p-1.5 border rounded"
                    />
                  </div>
                  <button
                    id="new-bc-add-line-btn"
                    onClick={handleAddBcLine}
                    disabled={!bcIngToAdd}
                    className="p-1.5 bg-[#1E4E8C] hover:bg-blue-800 text-white rounded text-xs font-semibold disabled:opacity-50"
                  >
                    Ajouter portion
                  </button>
                </div>

                {/* Lines tabular rendering list */}
                <div className="border rounded-lg overflow-hidden max-h-40 overflow-y-auto">
                  <table className="w-full text-left bg-white text-xs">
                    <thead className="bg-gray-100 text-[10px] font-bold text-gray-500 border-b">
                      <tr>
                        <th className="px-3 py-1.5">Article d'achat</th>
                        <th className="px-3 py-1.5 text-center">Quantité</th>
                        <th className="px-3 py-1.5 text-right">PU (FCFA)</th>
                        <th className="px-3 py-1.5 text-right">Total</th>
                        <th className="px-3 py-1.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-semibold">
                      {bcLines.map(line => {
                        const ing = tenantIngredients.find(i => i.id === line.ingredientId);
                        return (
                          <tr key={line.ingredientId}>
                            <td className="px-3 py-1.5">{ing?.name}</td>
                            <td className="px-3 py-1.5 text-center">{line.quantity} {ing?.unit}</td>
                            <td className="px-3 py-1.5 text-right">{line.price} F</td>
                            <td className="px-3 py-1.5 text-right text-[#1E4E8C] font-bold">{(line.quantity * line.price).toLocaleString()} F</td>
                            <td className="px-3 py-1.5 text-center">
                              <button
                                onClick={() => handleRemoveBcLine(line.ingredientId)}
                                className="text-red-500 font-bold p-1 hover:bg-red-50 rounded"
                              >
                                RET
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {bcLines.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-10 text-center text-gray-400 font-normal">
                            Bon de commande vierge. Ajoutez des ingrédients ci-dessus.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-5 pt-3 border-t">
              <button
                id="cancel-bc-btn"
                onClick={() => setShowAddBCModal(false)}
                className="px-4 py-2 bg-gray-100 rounded text-gray-700 text-xs hover:bg-gray-200"
              >
                Annuler
              </button>
              <button
                id="submit-bc-btn"
                onClick={handleSubmitBC}
                disabled={bcLines.length === 0}
                className="px-4 py-2 bg-[#1E4E8C] text-white font-bold rounded text-xs hover:bg-blue-800 disabled:opacity-50"
              >
                Générer Bon de Commande BC
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECEPTION DRAWER SHEETS OVERLAY */}
      {selectedOrderForReception && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 border border-gray-100 shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center pb-2 border-b mb-4">
              <div>
                <span className="text-[10px] text-gray-400 uppercase font-semibold">Vérification Livraison</span>
                <h3 className="text-base font-bold text-gray-905">{selectedOrderForReception.number}</h3>
              </div>
              <button onClick={() => setSelectedOrderForReception(null)} className="p-1 hover:bg-gray-100 rounded text-gray-400">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-gray-700 max-h-96 overflow-y-auto pr-1">
              <p className="text-gray-500">Pour chaque ligne commandée ci-dessous, renseignez la portion réelle physique reçue (Soutient la réception partielle) :</p>
              
              <div className="border rounded-lg overflow-hidden divide-y bg-gray-50">
                {selectedOrderForReception.lines.map(line => {
                  const orderedQty = line.quantity;
                  const alreadyReceived = line.quantityReceived || 0;
                  const remaining = orderedQty - alreadyReceived;
                  return (
                    <div key={line.id} className="p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="font-bold text-gray-900 block">{line.ingredientName}</span>
                          <span className="text-gray-500 text-[10px]">
                            Commandé: {orderedQty} {line.unit} / déjà reçu: {alreadyReceived} {line.unit}
                          </span>
                        </div>
                        <span className="text-[#1E4E8C] font-mono font-bold font-sans">Reste {remaining} {line.unit}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-gray-550 shrink-0 font-semibold">Portion reçue ce jour :</span>
                        <input
                          id={`reception-qty-${line.id}`}
                          type="number"
                          step={0.1}
                          min={0}
                          value={receptionQuantities[line.id] ?? remaining}
                          onChange={(e) => {
                            const val = Math.max(0, Math.min(remaining, parseFloat(e.target.value) || 0));
                            setReceptionQuantities({
                              ...receptionQuantities,
                              [line.id]: val
                            });
                          }}
                          className="w-24 p-1 px-2 border rounded font-mono text-center bg-white text-gray-950 focus:outline-[#1E4E8C]"
                        />
                      </div>

                      {(receptionQuantities[line.id] ?? remaining) > 0 && (
                        <div className="grid grid-cols-2 gap-2 bg-sky-50/50 p-2 rounded border border-blue-100 text-[10px] mt-2">
                          <div className="space-y-0.5">
                            <label className="text-[#1E4E8C] font-bold block">Numéro de Lot :</label>
                            <input
                              type="text"
                              value={receptionBatches[line.id] || ''}
                              onChange={(e) => setReceptionBatches({
                                ...receptionBatches,
                                [line.id]: e.target.value
                              })}
                              className="w-full p-1 border rounded bg-white text-gray-900 font-mono text-[10px]"
                            />
                          </div>
                          <div className="space-y-0.5">
                            <label className="text-[#1E4E8C] font-bold block">Date Péremption :</label>
                            <input
                              type="date"
                              value={receptionExpiries[line.id] || ''}
                              onChange={(e) => setReceptionExpiries({
                                ...receptionExpiries,
                                [line.id]: e.target.value
                              })}
                              className="w-full p-1 border rounded bg-white text-gray-900 text-[10px]"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-5 pt-3 border-t">
              <button
                onClick={() => setSelectedOrderForReception(null)}
                className="px-4 py-2 bg-gray-100 rounded text-gray-700 text-xs"
              >
                Retour
              </button>
              <button
                id="submit-reception-validation-btn"
                onClick={handleValidateReception}
                className="px-4 py-2 bg-[#1E4E8C] text-white font-bold rounded text-xs hover:bg-blue-800"
              >
                Enregistrer la Livraison
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUPPLIER MODAL FOR CRUD */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 border shadow-2xl overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center pb-2 border-b mb-4">
                <h3 className="text-base font-bold text-gray-950 flex items-center gap-1.5">
                  <Truck className="h-5 w-5 text-[#1E4E8C]" />
                  {supplierToEdit ? "Modifier le Fournisseur" : "Renseigner un Nouveau Fournisseur"}
                </h3>
                <button onClick={() => { setShowSupplierModal(false); setSupplierToEdit(null); }} className="p-1 hover:bg-gray-100 rounded text-gray-400">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-gray-700 max-h-96 overflow-y-auto p-1">
                <div className="space-y-1">
                  <label className="text-gray-600 font-semibold block">Code unique (Généré)</label>
                  <input
                    type="text"
                    value={supCode}
                    readOnly
                    className="w-full p-2 border bg-gray-50 rounded text-gray-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-600 font-semibold block">Nom commercial ou Enseigne *</label>
                  <input
                    type="text"
                    placeholder="ex: ETS MBOA DISTRIBUTION"
                    value={supName}
                    onChange={(e) => setSupName(e.target.value)}
                    className="w-full p-2 border rounded text-gray-900 font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-600 font-semibold block">Raison Sociale / Slogan *</label>
                  <input
                    type="text"
                    placeholder="S.A.R.L Grossiste Agroalimentaire"
                    value={supRaison}
                    onChange={(e) => setSupRaison(e.target.value)}
                    className="w-full p-2 border rounded text-gray-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-600 font-semibold block">Nom du gestionnaire de compte</label>
                  <input
                    type="text"
                    placeholder="M. Jean Dupont"
                    value={supContact}
                    onChange={(e) => setSupContact(e.target.value)}
                    className="w-full p-2 border rounded text-gray-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-600 font-semibold block">Téléphone direct *</label>
                  <input
                    type="text"
                    placeholder="+237 6xx xxx xxx"
                    value={supPhone}
                    onChange={(e) => setSupPhone(e.target.value)}
                    className="w-full p-2 border rounded text-gray-900 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-600 font-semibold block">Email de facturation / Commandes *</label>
                  <input
                    type="email"
                    placeholder="achats@fournisseur.com"
                    value={supEmail}
                    onChange={(e) => setSupEmail(e.target.value)}
                    className="w-full p-2 border rounded text-gray-900 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-600 font-semibold block">Adresse physique</label>
                  <input
                    type="text"
                    placeholder="Rue de l'indépendance"
                    value={supAddress}
                    onChange={(e) => setSupAddress(e.target.value)}
                    className="w-full p-2 border rounded text-gray-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-650 font-semibold block">Ville d'origine</label>
                  <input
                    type="text"
                    placeholder="Douala"
                    value={supCity}
                    onChange={(e) => setSupCity(e.target.value)}
                    className="w-full p-2 border rounded text-gray-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-650 font-semibold block">Délai moyen approvisionnement (jours)</label>
                  <input
                    type="number"
                    value={supDays}
                    onChange={(e) => setSupDays(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full p-2 border rounded text-gray-950 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-650 font-semibold block">Modalités de règlement comptables</label>
                  <select
                    value={supTerms}
                    onChange={(e) => setSupTerms(e.target.value)}
                    className="w-full p-2 border bg-white rounded text-gray-950"
                  >
                    <option value="Paiement à réception">Paiement à réception</option>
                    <option value="Contre remboursement">Contre remboursement</option>
                    <option value="Crédit 15 jours fin de mois">Crédit 15 jours fin de mois</option>
                    <option value="Crédit 30 jours net">Crédit 30 jours net</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-5 pt-3 border-t">
              <button
                onClick={() => { setShowSupplierModal(false); setSupplierToEdit(null); }}
                className="px-4 py-2 bg-gray-100 rounded text-gray-700 text-xs hover:bg-gray-200 cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveSupplier}
                className="px-4 py-2 bg-[#1E4E8C] text-white font-bold rounded text-xs hover:bg-blue-800 cursor-pointer"
              >
                Sauvegarder Fournisseur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INTERN DA REQUISITIONS MODAL (CRUD) */}
      {showDAModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 border shadow-2xl overflow-hidden flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center pb-2 border-b mb-4">
                <h3 className="text-base font-bold text-gray-950 flex items-center gap-1.5">
                  <ClipboardCheck className="h-5 w-5 text-[#1E4E8C]" />
                  {daToEdit ? `Modifier la Demande d'Achat : ${daToEdit.number}` : "Créer une Demande d'Achat Interne (DA)"}
                </h3>
                <button onClick={() => { setShowDAModal(false); setDaToEdit(null); }} className="p-1 hover:bg-gray-100 rounded text-gray-400">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs text-gray-700">
                <p className="text-gray-500 leading-relaxed">
                  L'équipe de cuisine émet ici une demande d'approvisionnement interne pour combler les manques matières.
                </p>

                {/* Grid inputs for adding an ingredient snippet */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end bg-gray-50 p-3 rounded-lg border">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-550 uppercase font-semibold">Ingrédient requis</label>
                    <select
                      value={daIngToAdd}
                      onChange={(e) => setDaIngToAdd(e.target.value)}
                      className="w-full text-xs p-1.5 border bg-white rounded text-gray-900"
                    >
                      <option value="">-- Choisir --</option>
                      {tenantIngredients.map(ing => (
                        <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-550 uppercase font-semibold">Quantité</label>
                    <input
                      type="number"
                      value={daQtyToAdd}
                      onChange={(e) => setDaQtyToAdd(Math.max(1, parseFloat(e.target.value) || 0))}
                      className="w-full text-xs p-1.5 border rounded text-gray-900"
                    />
                  </div>
                  <button
                    onClick={handleAddDaLine}
                    disabled={!daIngToAdd}
                    className="p-1.5 bg-[#1E4E8C] text-white hover:bg-blue-800 rounded font-semibold text-xs disabled:opacity-50 select-none cursor-pointer"
                  >
                    Ajouter au Panier DA
                  </button>
                </div>

                {/* Items preview grid */}
                <div className="border rounded-lg overflow-hidden max-h-44 overflow-y-auto">
                  <table className="w-full text-left bg-white text-xs">
                    <thead className="bg-gray-100 text-[10px] uppercase font-bold text-gray-500 border-b">
                      <tr>
                        <th className="px-3 py-2">Ingrédient</th>
                        <th className="px-3 py-2 text-center">Quantité demandée</th>
                        <th className="px-3 py-2 text-right">Id Stock</th>
                        <th className="px-3 py-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-semibold">
                      {daLines.map(line => {
                        const ing = tenantIngredients.find(i => i.id === line.ingredientId);
                        return (
                          <tr key={line.ingredientId} className="hover:bg-gray-50">
                            <td className="px-3 py-2 text-gray-900">{ing?.name}</td>
                            <td className="px-3 py-2 text-center text-blue-900 font-bold">{line.quantity} {ing?.unit}</td>
                            <td className="px-3 py-2 text-right text-gray-400 font-mono text-[10px]">{ing?.code}</td>
                            <td className="px-3 py-2 text-center">
                              <button
                                onClick={() => handleRemoveDaLine(line.ingredientId)}
                                className="text-red-500 hover:text-red-700 font-bold p-1 hover:bg-red-50 rounded cursor-pointer"
                              >
                                Retirer
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {daLines.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-gray-400 font-normal">
                            Aucun ingrédient sélectionné. Panier DA vierge.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-5 pt-3 border-t">
              <button
                onClick={() => { setShowDAModal(false); setDaToEdit(null); }}
                className="px-4 py-2 bg-gray-100 rounded text-gray-700 text-xs cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveDA}
                disabled={daLines.length === 0}
                className="px-4 py-2 bg-[#1E4E8C] text-white font-bold rounded text-xs hover:bg-blue-800 disabled:opacity-50 cursor-pointer"
              >
                {daToEdit ? "Appliquer Modifications" : "Émettre Demande d'Achat (DA)"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
