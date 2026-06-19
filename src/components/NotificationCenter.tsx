import React, { useState, useEffect } from 'react';
import {
  Bell,
  Trash2,
  Check,
  AlertTriangle,
  Calendar,
  Goal,
  Clock,
  Briefcase,
  X,
  BadgeAlert,
  Inbox
} from 'lucide-react';
import { Order, PurchaseRequest, PurchaseOrder } from '../types';

interface NotificationCenterProps {
  tenantId: string;
  activeUser: { id: string; name: string; role: string; email: string };
  orders: Order[];
  purchaseRequests: PurchaseRequest[];
  purchaseOrders: PurchaseOrder[];
}

export interface GeneratedNotification {
  id: string;
  title: string;
  message: string;
  type: 'GOAL' | 'BUFFET' | 'CATERING' | 'COMMAND_INTERNAL' | 'COMMAND_SUPPLIER';
  severity: 'info' | 'warning' | 'danger' | 'success';
  date: string;
  targetDate?: string;
  statusLabel?: string;
}

export default function NotificationCenter({
  tenantId,
  activeUser,
  orders,
  purchaseRequests,
  purchaseOrders
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showJournal, setShowJournal] = useState(false);

  // Read dismissed notifications from localStorage
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`kissine-dismissed-notifs-${tenantId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save dismissed notifications
  const dismissNotification = (id: string) => {
    const updated = [...dismissedIds, id];
    setDismissedIds(updated);
    localStorage.setItem(`kissine-dismissed-notifs-${tenantId}`, JSON.stringify(updated));
  };

  const dismissAllNotifications = (ids: string[]) => {
    const updated = [...dismissedIds, ...ids];
    setDismissedIds(updated);
    localStorage.setItem(`kissine-dismissed-notifs-${tenantId}`, JSON.stringify(updated));
  };

  const clearJournal = () => {
    // Clear all dismissed history or archive them
    if (window.confirm("Voulez-vous archiver et nettoyer l'ensemble du journal historique ?")) {
      setDismissedIds([]);
      localStorage.setItem(`kissine-dismissed-notifs-${tenantId}`, JSON.stringify([]));
      alert("Journal réinitialisé.");
    }
  };

  // Dynamically generate notifications from state
  const [allNotifications, setAllNotifications] = useState<GeneratedNotification[]>([]);

  useEffect(() => {
    const generated: GeneratedNotification[] = [];

    // 1. Fetch Goals
    let goalsList: any[] = [];
    try {
      const savedGoals = localStorage.getItem(`kissine-goals-${tenantId}`);
      if (savedGoals) {
        goalsList = JSON.parse(savedGoals);
      }
    } catch (e) {
      console.error(e);
    }

    // 2. Fetch Buffets
    let buffetsList: any[] = [];
    try {
      const savedBuffets = localStorage.getItem(`kissine-buffets-${tenantId}`);
      if (savedBuffets) {
        buffetsList = JSON.parse(savedBuffets);
      }
    } catch (e) {
      console.error(e);
    }

    // 3. Fetch Caterings
    let cateringList: any[] = [];
    try {
      const savedCatering = localStorage.getItem(`kissine-catering-${tenantId}`);
      if (savedCatering) {
        cateringList = JSON.parse(savedCatering);
      }
    } catch (e) {
      console.error(e);
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const today = new Date(todayStr);

    // --- ALERTS: OBJECTIFS DE VENTE ---
    goalsList.forEach(goal => {
      // Calculate consolidated sales for target goal date
      const goalOrders = orders.filter(o => o.date === goal.date && (o.status === 'VALIDATED' || o.status === 'CLOSED'));
      const totalSales = goalOrders.reduce((sum, o) => sum + o.total, 0);

      const targetDate = new Date(goal.date);
      const diffTime = targetDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // check frequency constraint on goal
      const freq = goal.reminderFrequency || 'DAILY';
      let matchesFreq = true;
      if (freq === 'APPROACHING' && diffDays > 3) matchesFreq = false;
      if (freq === 'URGENT' && diffDays > 1) matchesFreq = false;

      if (matchesFreq) {
        if (totalSales >= goal.targetAmount) {
          generated.push({
            id: `goal-success-${goal.id}-${goal.date}`,
            title: `🎯 Objectif Réussi : ${goal.description || 'Vente'}`,
            message: `Félicitations ! L'objectif de CA de ${goal.targetAmount.toLocaleString()} FCFA pour le ${goal.date} est atteint et dépassé. CA Réalisé de ${totalSales.toLocaleString()} FCFA (${Math.round((totalSales / goal.targetAmount) * 100)}%).`,
            type: 'GOAL',
            severity: 'success',
            date: goal.date,
            targetDate: goal.date
          });
        } else {
          if (diffDays < 0) {
            generated.push({
              id: `goal-failed-${goal.id}-${goal.date}`,
              title: `⚠️ Objectif Non Atteint : ${goal.description || 'Vente'}`,
              message: `L'échéance de l'objectif de CA de ${goal.targetAmount.toLocaleString()} FCFA du ${goal.date} est passée. CA final s'arrête à ${totalSales.toLocaleString()} FCFA (${Math.round((totalSales / goal.targetAmount) * 100)}%).`,
              type: 'GOAL',
              severity: 'danger',
              date: goal.date,
              targetDate: goal.date
            });
          } else {
            generated.push({
              id: `goal-pending-${goal.id}-${goal.date}`,
              title: `⏱️ Objectif en Cours (${diffDays}j restants) : ${goal.description || 'Vente'}`,
              message: `Objectif visant ${goal.targetAmount.toLocaleString()} FCFA pour le ${goal.date}. CA actuel : ${totalSales.toLocaleString()} FCFA (${Math.round((totalSales / goal.targetAmount) * 100)}%).`,
              type: 'GOAL',
              severity: diffDays <= 1 ? 'warning' : 'info',
              date: goal.date,
              targetDate: goal.date
            });
          }
        }
      }
    });

    // --- ALERTS: GESTION DES BUFFETS ---
    buffetsList.forEach(buffet => {
      if (buffet.status === 'COMPLETED' || buffet.status === 'CANCELLED') return;

      const targetDate = new Date(buffet.date);
      const diffTime = targetDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // check frequency constraint on buffet
      const freq = buffet.reminderFrequency || 'DAILY';
      let matchesFreq = true;
      if (freq === 'APPROACHING' && diffDays > 3) matchesFreq = false;
      if (freq === 'URGENT' && diffDays > 1) matchesFreq = false;

      // Only notify upcoming ones (or active today)
      if (diffDays >= -2 && matchesFreq) {
        generated.push({
          id: `buffet-pending-${buffet.id}`,
          title: `🍲 Prestation Buffet : ${buffet.title}`,
          message: `Le buffet pour ${buffet.platesExpected} personnes est planifié pour le ${buffet.date} (${diffDays < 0 ? 'Passé de ' + Math.abs(diffDays) + 'j' : diffDays === 0 ? "Aujourd'hui !" : diffDays + ' jours restants'}). Rappel paramétré: ${freq === 'DAILY' ? 'Tous les jours' : freq === 'APPROACHING' ? 'À l\'approche' : 'Urgent'}.`,
          type: 'BUFFET',
          severity: diffDays <= 1 ? 'danger' : 'warning',
          date: buffet.date,
          targetDate: buffet.date
        });
      }
    });

    // --- ALERTS: SERVICE TRAITEUR ---
    cateringList.forEach(ct => {
      if (ct.status === 'COMPLETED' || ct.status === 'CANCELLED') return;

      const targetDate = new Date(ct.date);
      const diffTime = targetDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const freq = ct.reminderFrequency || 'DAILY';
      let matchesFreq = true;
      if (freq === 'APPROACHING' && diffDays > 3) matchesFreq = false;
      if (freq === 'URGENT' && diffDays > 1) matchesFreq = false;

      if (diffDays >= -2 && matchesFreq) {
        generated.push({
          id: `catering-pending-${ct.id}`,
          title: `💼 Contrat Traiteur Client : ${ct.clientName}`,
          message: `La prestation traiteur de ${ct.platesRequested} plats (${ct.proposedPrice.toLocaleString()} FCFA) approche pour le ${ct.date} (${diffDays < 0 ? 'Passé de ' + Math.abs(diffDays) + 'j' : diffDays === 0 ? "Aujourd'hui" : diffDays + ' jours restants'}). Rappel: ${freq === 'DAILY' ? 'Tous les jours' : freq === 'APPROACHING' ? 'À l\'approche' : 'Urgent'}.`,
          type: 'CATERING',
          severity: diffDays <= 1 ? 'danger' : 'info',
          date: ct.date,
          targetDate: ct.date
        });
      }
    });

    // --- ALERTS: COMMANDES INTERNES (SUBMITTED) ---
    purchaseRequests.forEach(pr => {
      if (pr.status === 'SUBMITTED') {
        generated.push({
          id: `pr-pending-notif-${pr.id}`,
          title: `📋 Demande d'Achat Cuisine (${pr.number})`,
          message: `Commande interne initiée par ${pr.requesterName} en attente de la validation finale de l'ADMINISTRATEUR.`,
          type: 'COMMAND_INTERNAL',
          severity: 'warning',
          date: pr.date
        });
      }
    });

    // --- ALERTS: COMMANDES FOURNISSEURS (DRAFT) ---
    purchaseOrders.forEach(po => {
      if (po.status === 'DRAFT') {
        const totalCost = po.lines.reduce((sum, l) => sum + (l.total || 0), 0);
        generated.push({
          id: `po-pending-notif-${po.id}`,
          title: `🚚 Commande Fournisseur (${po.number})`,
          message: `Bon de commande fournisseur pour ${po.supplierName} d'une valeur de ${totalCost.toLocaleString()} FCFA en attente de validation ADMIN.`,
          type: 'COMMAND_SUPPLIER',
          severity: 'warning',
          date: po.date
        });
      }
    });

    setAllNotifications(generated);
  }, [tenantId, orders, purchaseRequests, purchaseOrders]);

  // Separate active unread vs historical journal
  const unreadNotifs = allNotifications.filter(n => !dismissedIds.includes(n.id));

  const getSeverityClass = (sev: string) => {
    switch (sev) {
      case 'success': return 'bg-emerald-50 text-emerald-800 border-emerald-250';
      case 'danger': return 'bg-rose-50 text-rose-800 border-rose-250';
      case 'warning': return 'bg-amber-50 text-amber-900 border-amber-250';
      default: return 'bg-blue-50 text-blue-800 border-blue-250';
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'GOAL': return '🎯 Objectif CA';
      case 'BUFFET': return '🍲 Buffet';
      case 'CATERING': return '🍽️ Traiteur';
      case 'COMMAND_INTERNAL': return '📋 Commande Interne';
      case 'COMMAND_SUPPLIER': return '🚚 Fournisseur';
      default: return '📢 Alerte';
    }
  };

  return (
    <div className="relative inline-block font-sans select-none z-50">
      {/* Bell icon Trigger with dynamic unread indicator */}
      <button
        id="notifications-bell-trigger"
        onClick={() => {
          setIsOpen(!isOpen);
          setShowJournal(false);
        }}
        className={`p-2 rounded-xl transition duration-150 flex items-center justify-center relative cursor-pointer border ${
          unreadNotifs.length > 0
            ? 'bg-amber-50 hover:bg-amber-100/80 text-amber-600 border-amber-200'
            : 'bg-gray-50 hover:bg-gray-100 text-gray-500 border-gray-200'
        }`}
        title="Centre de notifications opérationnelles"
      >
        <Bell className={`h-4.5 w-4.5 ${unreadNotifs.length > 0 ? 'animate-bounce' : ''}`} />
        {unreadNotifs.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white font-mono text-[9px] font-black h-4 w-4 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            {unreadNotifs.length}
          </span>
        )}
      </button>

      {/* Popover Card Panel */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-96 max-w-[calc(105vw-2rem)] bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden text-xs">
          {/* Header */}
          <div className="p-3 bg-slate-950 text-white flex items-center justify-between border-b border-slate-900">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-amber-400" />
              <span className="font-extrabold tracking-tight">Centre de Rappel</span>
              <span className="bg-amber-500/10 text-amber-400 font-mono text-[9px] px-1.5 py-0.2 rounded uppercase font-bold tracking-wider">
                Live
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowJournal(!showJournal)}
                className="px-2 py-1 rounded bg-slate-800 text-slate-300 hover:text-white text-[10px] font-bold transition cursor-pointer"
              >
                {showJournal ? "Alertes Actives" : "Journal Historique"}
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          {showJournal ? (
            /* Historical Ledger Journal view */
            <div className="flex flex-col max-h-96">
              <div className="p-2.5 bg-slate-50 border-b flex justify-between items-center text-[10px] uppercase font-bold text-gray-500">
                <span>Journal d'Historique de Rappels</span>
                <button
                  onClick={clearJournal}
                  className="text-red-500 hover:text-red-750 flex items-center gap-1 font-bold cursor-pointer transition uppercase"
                  title="Nettoyer l'index de lecture"
                >
                  <Trash2 className="h-3 w-3" />
                  <span>Vider</span>
                </button>
              </div>

              <div className="overflow-y-auto divide-y max-h-76 select-text">
                {allNotifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 space-y-2">
                    <Inbox className="h-10 w-10 mx-auto opacity-35" />
                    <p className="font-bold">Aucune trace de notification dans le journal.</p>
                  </div>
                ) : (
                  allNotifications.map((n, idx) => {
                    const isRead = dismissedIds.includes(n.id);
                    return (
                      <div key={`${n.id}-${idx}`} className={`p-3 relative ${isRead ? 'bg-gray-50/70 text-gray-500 opacity-80' : 'bg-white border-b border-gray-100'}`}>
                        <div className="flex justify-between items-start gap-1">
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-bold block text-[9px] uppercase leading-none mb-1 shadow-3xs">
                            {getTypeBadge(n.type)}
                          </span>
                          <span className="font-mono text-[9px] text-slate-900 font-extrabold bg-slate-100 px-1.5 py-0.5 rounded">
                            {n.date}
                          </span>
                        </div>
                        <h4 className={`font-extrabold text-[11px] mt-1 ${isRead ? 'text-gray-650' : 'text-gray-950'}`}>
                          {n.title}
                        </h4>
                        <p className="mt-1 leading-relaxed text-[11px] font-medium">
                          {n.message}
                        </p>
                        <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold">
                          {isRead ? (
                            <span className="text-gray-450 flex items-center gap-1">
                              <Check className="h-3.5 w-3.5 text-gray-400" />
                              <span>Lu & Masqué des alertes</span>
                            </span>
                          ) : (
                            <span className="text-[#1E4E8C] flex items-center gap-1 animate-pulse">
                              <BadgeAlert className="h-3.5 w-3.5" />
                              <span>Actif - En attente de lecture</span>
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            /* Active & Unread Notifications List */
            <div className="flex flex-col max-h-96">
              <div className="p-2.5 bg-slate-50 border-b flex justify-between items-center text-[10px] uppercase font-bold text-gray-500">
                <span>Rappels actifs ({unreadNotifs.length})</span>
                {unreadNotifs.length > 0 && (
                  <button
                    onClick={() => dismissAllNotifications(unreadNotifs.map(n => n.id))}
                    className="text-[#1E4E8C] hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer transition uppercase"
                  >
                    <Check className="h-3 w-3" />
                    <span>Tout marquer lu</span>
                  </button>
                )}
              </div>

              <div className="overflow-y-auto divide-y max-h-76">
                {unreadNotifs.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 space-y-2">
                    <div className="text-emerald-500 text-3xl font-bold">✓</div>
                    <p className="font-bold">Zéro alerte en suspens.</p>
                    <p className="text-[11px] text-gray-400 font-medium">
                      Tout est aligné, aucune validation ou date de prestation urgente ne requiert votre attention.
                    </p>
                  </div>
                ) : (
                  unreadNotifs.map((n, idx) => (
                    <div
                      key={`${n.id}-${idx}`}
                      className={`p-3.5 relative border-l-4 transition-all duration-150 py-3 bg-white hover:bg-slate-50/60 ${
                        n.severity === 'danger' ? 'border-rose-500' :
                        n.severity === 'warning' ? 'border-amber-500' :
                        n.severity === 'success' ? 'border-emerald-500' : 'border-blue-500'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className={`px-1.5 py-0.2 rounded font-black text-[8.5px] uppercase shadow-3xs tracking-wider border font-sans ${getSeverityClass(n.severity)}`}>
                          {getTypeBadge(n.type)}
                        </span>
                        
                        <button
                          onClick={() => dismissNotification(n.id)}
                          className="text-gray-400 hover:text-gray-650 p-1 hover:bg-gray-100 rounded transition cursor-pointer"
                          title="Supprimer après lecture"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>

                      <h4 className="font-extrabold text-[11px] text-gray-950 mt-1.5 leading-tight flex items-start gap-1">
                        {n.severity === 'danger' && <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />}
                        <span>{n.title}</span>
                      </h4>

                      <p className="mt-1 text-gray-700 leading-relaxed text-[11px] font-medium selection:bg-indigo-100">
                        {n.message}
                      </p>

                      <div className="flex items-center gap-1.5 mt-2.5 text-[9px] text-slate-950 bg-slate-100 rounded px-2 py-1 w-max font-mono leading-none">
                        <Clock className="h-3 w-3 text-slate-500" />
                        <span className="font-black">Date limite : {n.date}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Footer banner */}
          <div className="bg-slate-50 p-2.5 border-t text-[10px] text-gray-400 text-center font-medium">
            KISSINE FLOW™ • Système de contrôle réglementaire
          </div>
        </div>
      )}
    </div>
  );
}
