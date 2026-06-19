/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import {
  Users,
  ShieldAlert,
  Settings,
  ShieldCheck,
  Search,
  Plus,
  Trash2,
  Bell,
  CheckCircle,
  Clock,
  ExternalLink,
  Save,
  Activity,
  UserCheck,
  Edit
} from 'lucide-react';
import { User as UserType, AuditLog, Tenant } from '../types';

interface AdminViewProps {
  users: UserType[];
  auditLogs: AuditLog[];
  tenants: Tenant[];
  onAddUser: (u: UserType) => void;
  onUpdateUser: (u: UserType) => void;
  onUpdateTenant: (t: Tenant) => void;
  onUpdateAuditLogs?: (logs: AuditLog[]) => void;
  logsAction: (action: string, module: string) => void;
  tenantId: string;
  activeSubTab?: 'USERS' | 'AUDIT' | 'SETTINGS';
  setActiveSubTab?: (tab: 'USERS' | 'AUDIT' | 'SETTINGS') => void;
  activeUser: { id: string; name: string; role: string };
}

export default function AdminView({
  users,
  auditLogs,
  tenants,
  onAddUser,
  onUpdateUser,
  onUpdateTenant,
  onUpdateAuditLogs,
  logsAction,
  tenantId,
  activeSubTab,
  setActiveSubTab,
  activeUser
}: AdminViewProps) {
  // Tabs inside administration: 'USERS' | 'AUDIT' | 'SETTINGS'
  const [localAdminTab, setLocalAdminTab] = useState<'USERS' | 'AUDIT' | 'SETTINGS'>('USERS');
  const adminTab = activeSubTab !== undefined ? activeSubTab : localAdminTab;
  const setAdminTab = setActiveSubTab !== undefined ? setActiveSubTab : setLocalAdminTab;

  // Search filter inside audits logs
  const [auditQuery, setAuditQuery] = useState('');
  const [auditModuleFilter, setAuditModuleFilter] = useState('ALL');
  const [auditTimestampFilter, setAuditTimestampFilter] = useState('');

  // States for Editing/Adding Audit log
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditToEdit, setAuditToEdit] = useState<AuditLog | null>(null);
  const [auditTimestamp, setAuditTimestamp] = useState('');
  const [auditUserName, setAuditUserName] = useState('');
  const [auditActionText, setAuditActionText] = useState('');
  const [auditModule, setAuditModule] = useState('POS / CAISSE');

  const tenantUsers = users.filter(u => u.tenantId === tenantId);
  const tenantLogs = auditLogs.filter(l => l.tenantId === tenantId);
  const activeTenant = tenants.find(t => t.id === tenantId) || tenants[0];

  // Manual User Creation Form states
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'ADMIN' | 'MANAGER' | 'CASHIER' | 'WAREHOUSE' | 'ACCOUNTING'>('CASHIER');

  // Settings inputs state
  const [restaurantName, setRestaurantName] = useState(activeTenant?.name || '');
  const [restaurantPhone, setRestaurantPhone] = useState(activeTenant?.phone || '');
  const [restaurantAddress, setRestaurantAddress] = useState(activeTenant?.address || '');
  const [restaurantCity, setRestaurantCity] = useState(activeTenant?.city || '');
  const [restaurantCountry, setRestaurantCountry] = useState(activeTenant?.country || '');
  const [vatToggle, setVatToggle] = useState(true);
  const [currencySymbol, setCurrencySymbol] = useState('FCFA');

  // Audit Logs Filtering apply
  const filteredAuditLogs = tenantLogs.filter(log => {
    if (auditModuleFilter !== 'ALL' && log.module !== auditModuleFilter) return false;
    if (auditTimestampFilter && !log.timestamp.includes(auditTimestampFilter)) return false;
    if (auditQuery) {
      const q = auditQuery.toLowerCase();
      return log.action.toLowerCase().includes(q) || log.userName.toLowerCase().includes(q);
    }
    return true;
  });

  // Create accounts handle
  const handleCreateUser = () => {
    if (!newUserName || !newUserEmail) {
      alert("Saisissez le nom et l'adresse email.");
      return;
    }

    const newUser: UserType = {
      id: `user-${Date.now()}`,
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      tenantId,
      active: true,
      password: newUserPassword || 'password123'
    };

    onAddUser(newUser);
    logsAction(`Création de l'utilisateur : ${newUserName} (${newUserRole})`, 'ADMINISTRATION');
    setShowAddUserModal(false);

    // reset forms
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('');
  };

  const handleOpenAuditAdd = () => {
    setAuditToEdit(null);
    setAuditTimestamp(new Date().toISOString().replace('T', ' ').slice(0, 19).replace('T', ' '));
    setAuditUserName(activeUser.name);
    setAuditActionText('');
    setAuditModule('ADMINISTRATION');
    setShowAuditModal(true);
  };

  const handleOpenAuditEdit = (log: AuditLog) => {
    setAuditToEdit(log);
    setAuditTimestamp(log.timestamp);
    setAuditUserName(log.userName);
    setAuditActionText(log.action);
    setAuditModule(log.module);
    setShowAuditModal(true);
  };

  const handleSaveAudit = () => {
    if (!auditActionText || !auditUserName) {
      alert("Saisissez l'action et le nom d'intervenant.");
      return;
    }

    if (auditToEdit) {
      const updated: AuditLog = {
        ...auditToEdit,
        timestamp: auditTimestamp,
        userName: auditUserName,
        action: auditActionText,
        module: auditModule
      };
      if (onUpdateAuditLogs) {
        onUpdateAuditLogs(auditLogs.map(l => l.id === auditToEdit.id ? updated : l));
      }
      logsAction(`Journal d'audit modifié : ID ${auditToEdit.id}`, 'ADMINISTRATION');
    } else {
      const newLog: AuditLog = {
        id: `aud-${Date.now()}`,
        timestamp: auditTimestamp || new Date().toISOString().replace('T', ' ').slice(0, 19).replace('T', ' '),
        userId: `usr-${Date.now()}`,
        userName: auditUserName,
        action: auditActionText,
        module: auditModule,
        tenantId
      };
      if (onUpdateAuditLogs) {
        onUpdateAuditLogs([newLog, ...auditLogs]);
      }
      logsAction(`Journal d'audit ajouté manuellement : ${auditActionText}`, 'ADMINISTRATION');
    }

    setShowAuditModal(false);
    setAuditToEdit(null);
  };

  const handleDeleteAudit = (logId: string, text: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer définitivement cet enregistrement d'audit "${text}" ?`)) {
      if (onUpdateAuditLogs) {
        onUpdateAuditLogs(auditLogs.filter(l => l.id !== logId));
      }
      logsAction(`Enregistrement d'audit supprimé : ${text}`, 'ADMINISTRATION');
    }
  };

  // Switch Active Status of simulated person (Part 2 Module 1.10 Activer / Désactiver)
  const handleToggleUserStatus = (u: UserType) => {
    const updatedUserObj = {
      ...u,
      active: !u.active
    };
    onUpdateUser(updatedUserObj);
    logsAction(`Statut d'accès modifié : ${u.name} - ${updatedUserObj.active ? 'ACTIVAL' : 'SUSPENDU'}`, 'ADMINISTRATION');
  };

  // Save Tenant corporate settings
  const handleSaveCorporateSettings = () => {
    if (!restaurantName) return;
    onUpdateTenant({
      ...activeTenant,
      name: restaurantName,
      phone: restaurantPhone,
      address: restaurantAddress,
      city: restaurantCity,
      country: restaurantCountry
    });
    logsAction("Paramètres généraux de l'établissement sauvegardés", 'ADMINISTRATION');
    alert('Paramètres de configuration générale enregistrés avec succès !');
  };

  return (
    <div className="space-y-6" id="settings-module">
      {/* Selector sub tab triggers */}
      <div className="flex border-b border-gray-150">
        <button
          id="admin-users-tab"
          onClick={() => setAdminTab('USERS')}
          className={`px-6 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            adminTab === 'USERS'
              ? 'border-[#1E4E8C] text-[#1E4E8C] bg-blue-50/20'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Gestion des Utilisateurs</span>
        </button>
        <button
          id="admin-audit-tab"
          onClick={() => setAdminTab('AUDIT')}
          className={`px-6 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            adminTab === 'AUDIT'
              ? 'border-[#1E4E8C] text-[#1E4E8C] bg-blue-50/20'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Journal d'Audit & Sécurité</span>
        </button>
        <button
          id="admin-settings-tab"
          onClick={() => setAdminTab('SETTINGS')}
          className={`px-6 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            adminTab === 'SETTINGS'
              ? 'border-[#1E4E8C] text-[#1E4E8C] bg-blue-50/20'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Settings className="h-4 w-4" />
          <span>Paramètres de l'Établissement</span>
        </button>
      </div>

      {/* COMPONENT SCENARIOS */}
      {adminTab === 'USERS' && (
        <div className="space-y-4">
          <div className="flex sm:items-center sm:justify-between bg-white p-4 border rounded-lg shadow-2xs">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Personnel & Rôles d'Établissement</h3>
              <p className="text-xs text-gray-500 mt-0.5">Configurez les droits, et simulez l'isolation d'accès RBAC (Admin, Manager, Caissier, Stockiste, Comptable).</p>
            </div>

            <button
              id="admin-trigger-add-user-modal"
              onClick={() => setShowAddUserModal(true)}
              className="px-4 py-2 bg-[#1E4E8C] hover:bg-blue-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="h-4 w-4" />
              <span>Créer Collaborateur</span>
            </button>
          </div>

          <div className="bg-white border text-xs text-gray-750 rounded-lg overflow-hidden shadow-2xs">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 border-b uppercase">
                <tr>
                  <th className="px-5 py-3">Rôle attitré</th>
                  <th className="px-5 py-3">Identité Collaborateur</th>
                  <th className="px-5 py-3">Adresse de messagerie</th>
                  <th className="px-5 py-3">Mot de passe de caisse</th>
                  <th className="px-5 py-3 text-center">Statut d'accès</th>
                  <th className="px-5 py-3 text-center">Autorisation RBAC</th>
                </tr>
              </thead>
              <tbody className="divide-y font-semibold text-gray-700">
                {tenantUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-sans font-extrabold ${
                        user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                        user.role === 'MANAGER' ? 'bg-orange-100 text-orange-850' :
                        user.role === 'CASHIER' ? 'bg-blue-100 text-blue-800' :
                        user.role === 'WAREHOUSE' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-gray-900">{user.name}</td>
                    <td className="px-5 py-3.5 text-gray-500 font-mono font-normal">{user.email}</td>
                    <td className="px-5 py-3.5 text-amber-950 font-mono text-[11px] font-bold bg-amber-50/40">{user.password || 'password123'}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                        user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-500'
                      }`}>
                        {user.active ? 'Actif' : 'Suspendu'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center text-xs">
                      <button
                        id={`toggle-user-status-${user.id}`}
                        onClick={() => handleToggleUserStatus(user)}
                        className={`font-semibold text-[11px] px-3 py-1 rounded transition-colors ${
                          user.active
                            ? 'bg-red-50 hover:bg-red-100 text-red-650 border border-red-200'
                            : 'bg-green-50 hover:bg-green-100 text-green-700 border border-green-200'
                        }`}
                      >
                        {user.active ? 'Suspendre' : 'Réactiver'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AUDIT JOURNAL DATABASE */}
      {adminTab === 'AUDIT' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-2 bg-white p-4 border rounded-lg shadow-2xs justify-between items-center">
            <div className="flex gap-2 flex-1 max-w-lg items-center relative w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                id="audit-logs-search"
                type="text"
                placeholder="Filtrer par action, intervenant ou mot clé..."
                value={auditQuery}
                onChange={(e) => setAuditQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2 border border-gray-250 rounded-lg text-gray-950 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 items-center w-full sm:w-auto justify-end flex-wrap">
              <div className="flex items-center gap-1.5 bg-gray-50 border rounded-lg px-2.5 py-1">
                <span className="text-[10px] uppercase font-extrabold text-gray-500">Timestamp ISO :</span>
                <input
                  type="text"
                  placeholder="Ex: 2026-06"
                  value={auditTimestampFilter}
                  onChange={(e) => setAuditTimestampFilter(e.target.value)}
                  className="w-24 bg-white text-xs px-1.5 py-0.5 border border-gray-250 rounded font-mono font-bold text-gray-950 focus:outline-none"
                  title="Filtre par date, année, mois ou heure (ex: '2026-06' ou '2026-06-11')"
                />
                {auditTimestampFilter && (
                  <button
                    onClick={() => setAuditTimestampFilter('')}
                    className="text-red-500 hover:text-red-750 font-black text-xs px-1"
                    title="Effacer le filtre"
                  >
                    ✕
                  </button>
                )}
              </div>

              <select
                id="audit-module-filter"
                value={auditModuleFilter}
                onChange={(e) => setAuditModuleFilter(e.target.value)}
                className="text-xs border rounded-lg bg-gray-50 px-3 py-1.5 text-gray-700 font-bold"
              >
                <option value="ALL">Tous les modules</option>
                <option value="POS / CAISSE">Caisse Tactile</option>
                <option value="COMMANDES / VENTES">Commandes</option>
                <option value="CATALOGUE & RECETTES">Recettes (BOM)</option>
                <option value="STOCK / INVENTAIRE">Inventaires</option>
                <option value="ACHATS & APPROS">Achats</option>
                <option value="COMPTABILITÉ & TRÉSORERIE">Comptabilité</option>
                <option value="ADMINISTRATION">Administration</option>
              </select>

              {(activeUser.role === 'ADMIN' || activeUser.role === 'MANAGER') && (
                <button
                  id="add-audit-log-btn"
                  onClick={handleOpenAuditAdd}
                  className="px-3 py-1.5 bg-[#1E4E8C] hover:bg-blue-800 text-white font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition whitespace-nowrap"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nouveau Log</span>
                </button>
              )}
            </div>
          </div>

          <div className="bg-white border rounded-lg shadow-2xs overflow-hidden text-xs text-gray-650">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 border-b uppercase">
                <tr>
                  <th className="px-5 py-3">Timestamp ISO</th>
                  <th className="px-5 py-3">Intervenant</th>
                  <th className="px-5 py-3">Action tracée</th>
                  <th className="px-5 py-3">Module affecté</th>
                  <th className="px-5 py-3 text-center">Intégrité</th>
                  {activeUser.role === 'ADMIN' && (
                    <th className="px-5 py-3 text-center">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y font-semibold text-gray-700">
                {filteredAuditLogs.sort((a,b)=> b.timestamp.localeCompare(a.timestamp)).map(log => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5 font-mono text-gray-400 whitespace-nowrap">{log.timestamp}</td>
                    <td className="px-5 py-3.5 font-bold text-gray-905">{log.userName}</td>
                    <td className="px-5 py-3.5 text-gray-800">{log.action}</td>
                    <td className="px-5 py-3.5 font-mono">
                      <span className="bg-blue-50 text-[#1E4E8C] text-[10px] px-2 py-0.5 rounded border border-blue-100">
                        {log.module}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center text-xs text-emerald-600 font-bold font-sans">
                      ✓ INTÈGRE
                    </td>
                    {activeUser.role === 'ADMIN' && (
                      <td className="px-5 py-3 text-center">
                        <div className="flex gap-1.5 justify-center">
                          <button
                            onClick={() => handleOpenAuditEdit(log)}
                            className="p-1 px-1.5 border rounded bg-white hover:bg-blue-50 text-[#1E4E8C] flex items-center gap-0.5 text-[10px] font-bold cursor-pointer transition select-none"
                            title="Modifier ce journal"
                          >
                            <Edit className="h-2.5 w-2.5" />
                            <span>Éditer</span>
                          </button>
                          <button
                            onClick={() => handleDeleteAudit(log.id, log.action)}
                            className="p-1 px-1.5 border border-red-200 rounded bg-white hover:bg-red-50 text-red-650 flex items-center gap-0.5 text-[10px] font-bold cursor-pointer transition select-none"
                            title="Supprimer ce journal"
                          >
                            <Trash2 className="h-2.5 w-2.5" />
                            <span>Suppr.</span>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}

                {filteredAuditLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-gray-400">
                      Aucun enregistrement d'audit ne correspond aux filtres
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SETTINGS PANEL (Part 2 Module 1.8 Paramètres généraux) */}
      {adminTab === 'SETTINGS' && (
        <div className="bg-white border rounded-lg shadow-2xs p-6 space-y-6">
          <div className="border-b pb-3 mb-4">
            <h3 className="text-base font-bold text-gray-900">Configurez l'Etablissement</h3>
            <p className="text-xs text-gray-500 mt-1">Gérez l'enseigne, les coordonnées, les taux d'imposition et les devises d'affaires.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs text-gray-700">
            {/* Identity coordinates */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#1E4E8C] uppercase pb-1 border-b">Coordonnées Enseigne</h4>

              <div className="space-y-1">
                <label className="text-gray-600 block">Nom commercial de l'établissement</label>
                <input
                  id="settings-restname-input"
                  type="text"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  className="w-full p-2 border border-gray-250 bg-gray-50 rounded text-gray-950 font-semibold focus:outline-[#1E4E8C]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-600 block">Téléphone standard</label>
                <input
                  id="settings-restphone-input"
                  type="text"
                  value={restaurantPhone}
                  onChange={(e) => setRestaurantPhone(e.target.value)}
                  className="w-full p-2 border border-gray-250 bg-gray-50 rounded text-gray-950 font-semibold focus:outline-[#1E4E8C]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-600 block">Adresse physique</label>
                <input
                  id="settings-restaddr-input"
                  type="text"
                  value={restaurantAddress}
                  onChange={(e) => setRestaurantAddress(e.target.value)}
                  className="w-full p-2 border border-gray-250 bg-gray-50 rounded text-gray-950 font-semibold focus:outline-[#1E4E8C]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-600 block">Ville</label>
                  <input
                    id="settings-restcity-input"
                    type="text"
                    value={restaurantCity}
                    onChange={(e) => setRestaurantCity(e.target.value)}
                    className="w-full p-2 border border-gray-250 bg-gray-50 rounded text-gray-950 font-semibold focus:outline-[#1E4E8C]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-600 block">Pays d'Implantation</label>
                  <input
                    id="settings-restcountry-input"
                    type="text"
                    value={restaurantCountry}
                    onChange={(e) => setRestaurantCountry(e.target.value)}
                    className="w-full p-2 border border-gray-250 bg-gray-50 rounded text-gray-950 font-semibold focus:outline-[#1E4E8C]"
                  />
                </div>
              </div>
            </div>

            {/* Business parameters */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#1E4E8C] uppercase pb-1 border-b">Paramètres Métiers</h4>

              <div className="space-y-1">
                <label className="text-gray-650 block">Devise Monétaire V1</label>
                <select
                  id="settings-currency-select"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  className="w-full p-2 border border-gray-250 bg-white rounded text-gray-700"
                >
                  <option value="FCFA">Franc CFA (FCFA) - Par défaut</option>
                  <option value="USD">Dollar Américain ($)</option>
                  <option value="EUR">Euro (€)</option>
                </select>
              </div>

              <div className="p-4 bg-gray-50 border rounded-lg space-y-3">
                <span className="text-[11px] font-bold text-[#1E4E8C] block uppercase tracking-wide">Comportement Fiscal</span>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-gray-800">
                  <input
                    id="settings-vattoggle-checkbox"
                    type="checkbox"
                    checked={vatToggle}
                    onChange={(e) => setVatToggle(e.target.checked)}
                    className="h-4 w-4 bg-white text-[#1E4E8C] border-gray-350"
                  />
                  <span>Soumettre les factures d'Aliments à la TVA (19.25% en vigueur)</span>
                </label>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-150 rounded-lg text-blue-950 text-xs">
                <span className="font-bold block flex items-center gap-1">
                  <Clock className="h-4 w-4 text-blue-800" />
                  Fuseau Horaire de l'ERP : G.M.T +1
                </span>
                <p className="mt-1 text-[11px] text-blue-700 leading-relaxed">Les fermetures comptables et les rapports d'impression se figeront sur l'heure locale camerounaise de l'enseigne.</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end">
            <button
              id="settings-save-setup-btn"
              onClick={handleSaveCorporateSettings}
              className="px-5 py-2.5 bg-[#1E4E8C] text-white hover:bg-blue-800 hover:shadow font-bold text-xs rounded-lg flex items-center gap-1.5"
            >
              <Save className="h-4 w-4" />
              <span>Enregistrer Coordonnées</span>
            </button>
          </div>
        </div>
      )}

      {/* USER CREATION DIALOG DRAWER */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 border shadow-2xl relative">
            <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b flex items-center gap-1.5">
              <UserCheck className="h-5 w-5 text-[#1E4E8C]" />
              Inscrire Collaborateur
            </h3>

            <div className="space-y-4 text-xs text-gray-750">
              <div className="space-y-1">
                <label className="text-gray-600 block">Rôle / Droits applicables (RBAC)</label>
                <select
                  id="new-user-role-select"
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="w-full p-2 border bg-white rounded text-gray-750"
                >
                  <option value="CASHIER">CASHIER (Caisse tactile POS uniquement)</option>
                  <option value="WAREHOUSE">WAREHOUSE (Mouvements de Stocks et inventaires)</option>
                  <option value="ACCOUNTING">ACCOUNTING (Registres financiers et closures)</option>
                  <option value="MANAGER">MANAGER (Exploitation, annulations et appros)</option>
                  <option value="ADMIN">ADMIN (Contrôle total administration)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-gray-600 block">Nom complet *</label>
                <input
                  id="new-user-name-input"
                  type="text"
                  placeholder="ex: Marie Caissière..."
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full p-2 border rounded text-gray-950 focus:ring-1 focus:ring-[#1E4E8C]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-600 block">Adresse email d'authentification *</label>
                <input
                  id="new-user-email-input"
                  type="email"
                  placeholder="ex: marie@kissineflow.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full p-2 border rounded text-gray-950 focus:ring-1 focus:ring-[#1E4E8C]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-600 block">Mot de passe de sécurité *</label>
                <input
                  id="new-user-password-input"
                  type="password"
                  placeholder="ex: password123 (par défaut)"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  className="w-full p-2 border rounded text-gray-950 focus:ring-1 focus:ring-[#1E4E8C] font-mono"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-5 pt-3 border-t">
              <button
                id="cancel-add-user-btn"
                onClick={() => setShowAddUserModal(false)}
                className="px-4 py-2 bg-gray-100 rounded text-gray-700 hover:bg-gray-200 text-xs"
              >
                Annuler
              </button>
              <button
                id="submit-add-user-btn"
                onClick={handleCreateUser}
                className="px-4 py-2 bg-[#1E4E8C] text-white font-bold rounded text-xs hover:bg-blue-800"
              >
                Enregistrer Collaborateur
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANUAL AUDIT LOG ADD/EDIT MODAL FOR ADMIN/MANAGER */}
      {showAuditModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 border shadow-2xl relative text-xs text-gray-700">
            <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b flex items-center gap-1.5 font-sans">
              <ShieldAlert className="h-5 w-5 text-[#1E4E8C]" />
              {auditToEdit ? "Ajuster l'Enregistrement de Sécurité" : "Ajouter un Log d'Audit Manuel"}
            </h3>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-gray-650 block font-semibold">Timestamp ISO d'Événement *</label>
                <input
                  type="text"
                  placeholder="AAAA-MM-JJ HH:MM:SS"
                  value={auditTimestamp}
                  onChange={(e) => setAuditTimestamp(e.target.value)}
                  className="w-full p-2 border rounded font-mono text-gray-900"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-650 block font-semibold">Nom du Collaborateur / Intervenant *</label>
                <input
                  type="text"
                  placeholder="ex: Marie Caissière..."
                  value={auditUserName}
                  onChange={(e) => setAuditUserName(e.target.value)}
                  className="w-full p-2 border rounded text-gray-900 font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-650 block font-semibold">Module d'Appartenance *</label>
                <select
                  value={auditModule}
                  onChange={(e) => setAuditModule(e.target.value)}
                  className="w-full p-2 border bg-white rounded text-gray-900"
                >
                  <option value="POS / CAISSE">Caisse Tactile</option>
                  <option value="COMMANDES / VENTES">Commandes</option>
                  <option value="CATALOGUE & RECETTES">Recettes (BOM)</option>
                  <option value="STOCK / INVENTAIRE">Inventaires</option>
                  <option value="ACHATS & APPROS">Achats</option>
                  <option value="COMPTABILITÉ & TRÉSORERIE">Comptabilité</option>
                  <option value="ADMINISTRATION">Administration</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-gray-650 block font-semibold">Description de l'Action tracée *</label>
                <textarea
                  rows={3}
                  placeholder="Décrivez l'activité, modification de paramètre, ou incident..."
                  value={auditActionText}
                  onChange={(e) => setAuditActionText(e.target.value)}
                  className="w-full p-2 border border-blue-200 rounded text-gray-900 focus:outline-[#1E4E8C]"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-5 pt-3 border-t">
              <button
                onClick={() => { setShowAuditModal(false); setAuditToEdit(null); }}
                className="px-4 py-2 bg-gray-100 rounded text-gray-700 text-xs hover:bg-gray-200 cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveAudit}
                className="px-4 py-2 bg-[#1E4E8C] text-white font-bold rounded text-xs hover:bg-blue-800 cursor-pointer"
              >
                {auditToEdit ? "Sauvegarder Ajustements" : "Ajouter Événement d'Audit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
