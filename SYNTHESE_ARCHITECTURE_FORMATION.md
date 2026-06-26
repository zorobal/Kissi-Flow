# 🏛️ Synthèse d'Architecture d'Intégration & Plan Global de Formation
*Système Intégré ERP F&B - Restaurant Cockpit*

Ce document synthétise de manière exhaustive l'architecture technique, le fonctionnement dynamique interconnecté de l'application et structure un dispositif de formation professionnel, module par module.

---

## I. Synthèse de l'Architecture Technique

L'ERP repose sur une architecture moderne de type **SPA (Single Page Application)** développée en **React 18** avec **Vite**, hautement modulaire, typée de manière stricte en **TypeScript**, et stylisée avec les utilitaires de haute précision de **Tailwind CSS**.

### 1. Organisation des Composants et Modularité
L'application évite d'avoir un fichier monolithique en répartissant ses composants au sein du dossier `/src/components/` :
* `App.tsx` : Point d'entrée de l'application, gestion de l'état centralisateur globale, gestion du cycle des transactions et routage applicatif.
* `DateFilter.tsx` : Composant pivot réutilisable de filtrage temporel multi-critères.
* `DashboardView.tsx` : Outil de restitution macro-opérationnelle et visualisation graphique à l'aide de **Recharts**.
* `POSView.tsx` : Terminal d'encaissement et de saisie tactile des commandes clients.
* `OrdersView.tsx` : Outil d'audit et de traçabilité des réquisitions de serveurs.
* `CatalogueView.tsx` : Module de gestion des fiches articles, nomenclature technique (**BOM**) et importateur Excel adaptatif.
* `StocksView.tsx` : Module d'inventaires physiques et d'ajustements de stock cuisine.
* `PurchasesView.tsx` : Chaîne de validation logistique des commandes fournisseurs.
* `AccountingView.tsx` : Suivi comptable des écritures de trésorerie et clôtures journalières.
* `FinanceView.tsx` : Enregistrement et affectation fiscale des charges de fonctionnement.
* `BilanView.tsx` : Compilation automatisée des soldes intermédiaires de gestion et de la rentabilité nette.
* `SuperAdminView.tsx` : Cockpit dédié à la supervision multi-site, à la consolidation des indicateurs avancés, et aux actions de portabilité de données vers Supabase.
* `SettingsView.tsx` : Gestion des paramètres de l'enseigne, des collaborateurs et des préférences système, intégrant désormais des contrôles d'accès restreignant l'accès aux onglets de synchronisation cloud uniquement aux profils `SUPERADMIN`.

### 2. Isolation Multi-Tenant Multi-Établissement
L'ERP implémente une abstraction sémantique où les données de transaction (Commandes, Stocks, Clôtures, Dépenses) sont estampillées d'un identifiant `tenantId`. Cette modélisation permet le passage dynamique d'un établissement à un autre en isolant parfaitement l'intégrité opérationnelle de chaque restaurant d'un même groupe ou d'une même franchise.

---

## II. Le Fonctionnement Interconnecté de la Donnée

La performance de l'ERP repose sur un maillage de transactions en temps réel où aucune donnée n'est isolée. La donnée opérationnelle se déplace horizontalement à travers 4 flux stratégiques :

```
          [FICHE INGRÉDIENT] ──(Définit CMP)──► [FICHE TECHNIQUE - BOM]
                   ▲                                    │
    (Ajuste CMP après réception)                  (Définit Coût Idéal)
                   │                                    ▼
[ACHATS & RÉCEPTIONS] ◄──(Flux Logistique)──  [CATALOGUE PLATS / ARTICLES]
                                                        │
                                                 (Définit Coût Resto)
                                                        ▼
                                                  [CAISSE POS]
                                                        │
                                               (Génère Vente Validée)
                                                        ▼
                                                [BILAN & MARGES]
                                                  - Approche BOM
                                                  - Approche Resto
```

### 1. Le Flux de Vente et Déstockage Automatisé
Lorsqu'un caissier valide un ticket dans le module **POS** :
1. Une commande `Order` est créée avec le statut `CLOSED`.
2. L'instance de vente alimente à la seconde les indicateurs de performance du **Dashboard** et les revenus d'exploitation du **Bilan Analystique**.
3. **Le moteur de déstockage de recettes (BOM Engine)** analyse la fiche technique rattachée à chaque plat vendu : pour chaque ingrédient trouvé, le système soustrait automatiquement la quantité consommée de la quantité globale en rayon dans le module **Stocks**.

### 2. Le Flux d'Approvisionnement et Réévaluation du Coût Moyen Pondéré (CMP)
Lorsqu'un responsable logistique traite des approvisionnements dans le module **Achats** :
1. La commande fournisseur passe par le cycle *Demande d'Achat $\rightarrow$ Bon de Commande $\rightarrow$ Réception physique*.
2. La validation du bon de réception met immédiatement à jour les quantités physiques en **Stocks**.
3. **La formule du CMP (Coût Moyen Pondéré)** est réévaluée dynamiquement :
$$\text{Nouveau CMP} = \frac{(\text{Stock Initial} \times \text{CMP Initial}) + (\text{Quantité Reçue} \times \text{Prix d'Achat Unitaire})}{\text{Stock Initial} + \text{Quantité Reçue}}$$
4. Le coût théorique d'achat calculé dans le **Catalogue** s'ajuste en continu de cette fluctuation de marché.

### 3. Le Pilotage Double Marge : BOM vs Resto
L'ERP résout le problème de l'écart classique entre la théorie et le terrain réel :
* **Marge Matières Premières (BOM / Bill Of Materials)** : Basée sur la composition idéale de la recette configurée au CMP. C'est l'objectif d'efficacité absolue de la cuisine.
* **Marge brute Resto globale (Coûts Personnalisés)** : Repose sur les coûts de revient réels et spécifiques que le gérant peut saisir manuellement pour chaque plat. Cette rentabilité inclut l'intégration des pertes habituelles, des écarts d'inventaires d'ingrédients ou du packaging, offrant ainsi la vision la plus fidèle de la rentabilité brute.

### 4. Gestion Intégrée des Pertes Multi-Motifs & Actifs Circulants Conjoints
Pour faire face aux aléas structurels d'une cuisine professionnelle, deux flux transverses majeurs ont été intégrés :
* **Détection Multi-Motifs des Pertes d'Exploitation** : Le système propose un menu déroulant d'origine de perte (Péremption, Coupure de courant, Accident de cuisine/Casse, Altération qualité, Avarie transport, Vol/Écart de stock, Autre exception). Toute perte déclarée engendre :
  1. Une soustraction physique instantanée de l'inventaire en stocks.
  2. Un flux de traçabilité commenté consigné dans l'audit-trail.
  3. L'apparition automatique d'un badge rouge d'alerte explicite dans le **Dashboard BI** (`Dont gaspillages / pertes : -X F` sous le Bénéfice Net) pour alerter les décideurs.
  4. L'imputation automatique en charge directe d'exploitation déductible dans le **Bilan Financier (SIG)**.
* **Synthèse Globale des Stocks Conjoints** : La valorisation de l'actif circulant en réserve consolide dynamiquement le stock alimentaire (ingrédients) et le stock hors-alimentation (consommables, packaging, hygiène) valorisés au coût moyen pondéré (CMP). Cette double métrique donne une visibilité stratégique exhaustive de la trésorerie immobilisée en réserve.

---

## III. Programme Global de Formation Module par Module

Ce parcours est conçu de manière directive pour assurer une prise de poste structurée des collaborateurs.

### Module 1 : Pilotage Analytique & Veille Stratégique (Administrateurs & Décideurs)
* **Contenu** : Tableau de bord, Bilan SIG et Administration.
* **Objectifs de compétence** :
  * Interpréter la dispersion des charges (Fixes vs Variables) du Bilan.
  * Analyser les performances comparées entre la rentabilité optimale BOM et réelle Resto.
  * Superviser l'intégrité opérationnelle via l'outil des **Logs d'Audit**.
* **Points critiques** : Comprendre pourquoi l'accès de modification du catalogue de prix doit rester confidentiel et contrôlé via la gestion des droits.

### Module 2 : Gestion des Matières & Nomenclature Technique (Chefs de Cuisine & Food & Beverage Manager)
* **Contenu** : Fiches Ingrédients, Fiches Desserts/Plats, Recettes et Fiches Techniques.
* **Objectifs de compétence** :
  * Définir l'organigramme de composition d'un plat (matière première principale, composants secondaires).
  * Maîtriser l'outil d'importation de masse Excel pour charger rapidement un catalogue de recettes.
  * Coordonner les ingrédients alternatifs pour pallier les ruptures logistiques temporaires.
* **Points critiques** : Saisir les ingrédients dans la même unité de mesure (ex: kg ou L) que celle utilisée pour paramétrer les fiches d'inventaires.

### Module 3 : Logistique physique, Flux Achats & Inventaires (Responsables Logistiques & Magasiniers)
* **Contenu** : Stocks, Ajustements, Inventaires, Commandes d'achats.
* **Objectifs de compétence** :
  * Déclarer les variations manuelles de stock de cuisine en motivant judicieusement chaque écart (Ex: Casse, Vol, Offert).
  * Réaliser une clôture d'inventaire rigoureuse, en reportant le comptage physique pour dresser l'écart théorique.
  * Valider une réception fournisseur pour générer la mise à jour automatique des stocks de sécurité.
* **Points critiques** : Un inventaire validé écrase la valeur théorique système. À réaliser uniquement en dehors des heures de service actifs.

### Module 4 : Encaissement & Relation Client (Caissiers & Maîtres d'Hôtel)
* **Contenu** : Terminal POS Tactile, Gestion des tables de salle.
* **Objectifs de compétence** :
  * Encaisser rapidement en scindant les paiements selon la demande du client (Espèces et monnaie électronique).
  * Appliquer des remises commerciales de ligne ou globales lors de gestes commerciaux décidés par la direction.
  * Naviguer d'une table à l'autre pour assurer le service fluide des commandes de boissons et plats chauds.
* **Points critiques** : S'assurer du bon statut final `CLOSED` du ticket pour garantir la comptabilisation correcte des fonds en caisse.

### Module 5 : Finances d'Exploitation & Clôture Comptable (Comptables & Managers de caisse)
* **Contenu** : Comptabilité d'exploitation, Clôtures journalières, Suivi des dépenses.
* **Objectifs de compétence** :
  * Enregistrer les mouvements divers de caisse (entrées de fonds de roulement de départ, retraits de cash pour les coursiers).
  * Produire la clôture journalière définitive (Zero-Out) figeant l'exercice opérationnel du jour.
  * Imputer les factures de dépenses courantes (électricité, salaires, charges matériels) en répartissant la base HT et la TVA correspondante.
* **Points critiques** : Les dépenses de caisse doivent correspondre aux tickets d'achats physiques pour éviter les écarts d'audit à la validation.

### Module 6 : Supervision Multi-Site, Synchronisation Cloud \& Planification Réseau (SuperAdmin)
* **Contenu** : Cockpit SuperAdmin, Détection Cloud Automatique, Restauration \& Sauvegarde Supabase, Workspace de Simulation de Topologie Réseau.
* **Objectifs de compétence** :
  * Analyser la performance consolidée du parc de restaurants (AOV, marge bénéficiaire nette %, couverts cumulés, Expense Ratio).
  * Évaluer, configurer et simuler les 4 scénarios d'architecture pour le déploiement client (Cloud, Réseau local LAN PostgreSQL, Serveur Web local centralisé, Tauri Desktop SQLite autonome).
  * Personnaliser les variables de la topologie réseau (IP fixe locale, port de connexion, nom de la base SQL) et générer les fichiers `.env` correspondants.
  * Auditer l'indice de faisabilité opérationnelle basé sur les prérequis matériels d'un client restaurateur.
  * Déclencher des sauvegardes ou restaurations manuelles par site/établissement pour assurer la portabilité absolue.
  * Auditer le terminal de logs réseau en direct pour diagnostiquer la connectivité avec l'API Supabase et les pings de la topologie simulée.
* **Points critiques** : La synchronisation Supabase gère l'ensemble des 19 collections locales en un seul bloc pour garantir la cohérence des relations transactionnelles. L'outil de simulation de topologies permet d'anticiper les contraintes réseau réelles sur site avant le déploiement physique des machines de caisse. Accès strictement confidentiel réservé au rôle `SUPERADMIN`.
