# 📘 Manuel de Référence Fonctionnel & Guide d'Utilisation Applicatif
*Système Intégré de Gestion de Restauration - ERP Cockpit F&B (Food & Beverage)*

Ce document constitue la documentation officielle, fonctionnelle et technique du progiciel de gestion intégrée pour restaurants, hôtellerie et franchises. Il explique en détail le rôle de chaque module, l'architecture des flux d'information, les interconnexions comptables, opérationnelles et de stocks, ainsi qu'un parcours de formation structuré rôle par rôle.

---

## 🗺️ Index Thématique
1. **Introduction & Vision Produit**
2. **Architecture des Informations & Interconnexions Mutuelles**
3. **Analyse Détaillée Module par Module (Rôles, Données, Fonctionnement)**
   * *A. Tableau de bord (Dashboard)*
   * *B. Caisse Tactique & Prise de Commande (POS)*
   * *C. Commandes & Réquisitions*
   * *D. Catalogue & Fiches Techniques (Products & BOM)*
   * *E. Gestion des Stocks & Inventaires*
   * *F. Workflow d'Achats & Suivi Fournisseurs*
   * *G. Clôture de Caisse & Comptabilité de Caisse*
   * *H. Contrôle Financier des Dépenses (Cash-Out)*
   * *I. Bilan Analytique & Soldes Intermédiaires de Gestion (SIG)*
   * *J. Administration des Rôles & Paramètres*
4. **Matrice Multi-Critères de Filtrage Temporel Avancé**
5. **Directives Complètes de Formation par Rôle Utilisateur**

---

## 1. Introduction & Vision Produit

L'ERP a été pensé pour résoudre le problème fondamental de la restauration professionnelle : **le contrôle des marges en temps réel**. Contrairement aux caisses standards qui se contentent d'enregistrer le chiffre d'affaires, ce système interconnecte instantanément :
1. **La Caisse (POS)** : Collecte du cash et des paiements mobiles (Wave, Orange Money, MTN MoMo).
2. **La Fiche Technique (BOM)** : Déstockage automatique des ingrédients à chaque vente.
3. **Le Module Achats / Stocks** : Valorisation en temps réel via le **Coût Moyen Pondéré (CMP)**.
4. **Le Tableau Pivot Resto VS BOM** : Permet au restaurateur de comparer la rentabilité idéale issue des fiches d'ingrédients (**BOM**) avec la rentabilité réelle issue des coûts de revient personnalisés (**Resto**).

---

## 2. Architecture & Interconnexions entre les Modules

Le schéma ci-dessous illustre comment une action dans un module se répercute instantanément sur l'ensemble de l'ERP :

```
       [CATALOGUE DISHES] (Définit les prix, fiches techniques et coûts resto de référence)
               │
               ▼
         [CAISSE POS]  ──(Création Commande Validée)──► [STOCKS DE MATIÈRES]
               │                                                │
       (Génère Vente brut)                               (Consommation BOM / Déstockage)
               │                                                │
               ▼                                                ▼
     [COMMANDES & TICKETS]                              [COUT MOYEN PONDÉRÉ - CMP]
               │                                                │
     (Alimente le chiffre d'affaires)                     (Calcul du Coût d'Achat Réel)
               │                                                │
               ▼                                                ▼
   [COMPTABILITÉ ET CLÔTURE]                            [REVENUS VS CHARGES]
               │                                                │
    (Validation Financière)                                     │
               │                                                │
               └───────────────────────► [BILAN & SIG] ◄────────┘
                                               ▲
                                               │
                                     [FINANCE EXPENSES]
                                (Salaires, Loyers, Achats directs)
```

### Mécanismes clés de synchronisation logicielle :
* **Vente en POS** $\rightarrow$ Génère un ticket dans **Commandes** $\rightarrow$ Soustrait les ingrédients des **Stocks** (selon le coefficient défini dans la **Recette / BOM**) $\rightarrow$ Augmente le montant en caisse comptable dans **Comptabilité** $\rightarrow$ Réajuste le calcul des marges brutes dans le **Dashboard/Bilan**.
* **Réception de Commande d'Achat** $\rightarrow$ Augmente la quantité physique dans **Stocks** $\rightarrow$ Recalcule automatiquement le **CMP (Coût Moyen Pondéré)** de l'ingrédient $\rightarrow$ Met à jour le coût d'achat unitaire pour les calculs de rentabilité future.
* **Saisie d'une Dépense de Charge** $\rightarrow$ Imputée directement sur le **Bilan Analytique** sous la catégorie correspondante (Fixe ou Variable) $\rightarrow$ Met à jour le bénéfice net global de l'exercice pour la période sélectionnée.

---

## 3. Analyse Détaillée de Chaque Module

### A. Tableau de bord (Dashboard)
* **Description** : Le poste de pilotage stratégique de l'établissement. Il affiche les indicateurs clés de performance ajustables dynamiquement selon le filtre temporel consolidé.
* **Indicateurs calculés** :
  * *Chiffre d'Affaires global (TTC / HT).*
  * *Panier Moyen par ticket (Ticket Moyen).*
  * *Marge brute (BOM)* : Rapprochement prévisionnel basé sur les matières premières.
  * *Marge brute (Resto)* : Calcul exact reposant sur le coût de revient personnalisé défini par le gérant.
  * *Tendance d'évolution chronologique* : Graphique de courbe pour les ventes et diagrammes à barres pour les catégories populaires.
* **Interconnexion** : Alimenté en amont par la validation des ventes du POS, et en aval, il oriente les décisions de réapprovisionnement de cuisine.

### B. Caisse Tactique & Prise de Commande (POS)
* **Description** : L'interface tactile ultra-rapide destinée aux serveurs et caissiers pour la saisie des commandes.
* **Fonctions clés** :
  * *Gestion multi-canaux* : Sur Place, À Emporter, Livraison.
  * *Plan de salle interactif* : Sélection du numéro de table et suivi des couverts.
  * *Split de facturation (modes de règlement multiples)* : Espèces, Wave, Orange Money, Mobile Money, Cartes Bancaires.
  * *Remises à la ligne ou globales* en montant fixe ou pourcentage.
* **Interconnexion** : Envoie le flux financier vers le module **Comptabilité (Clôtures journalières)** et applique instantanément la déduction de matières au module **Stocks**.

### C. Commandes & Réquisitions
* **Description** : Le terminal de vérification et d'audit de toutes les transactions de l'établissement.
* **Fonctions clés** :
  * *Recherche croisée multicritère* : Par numéro de commande, table, serveur et statut (Brouillon, Validé, Annulé, Clôturé).
  * *Module d'annulation avec motif obligatoire* pour des fins de traçabilité anti-fraude.
  * *Filtrage temporel universel* : Permet d'analyser le détail cumulatif de périodes arbitraires.
  * *Exportation au format PDF et Excel* : Permet de générer des états certifiés des transactions validées.

### D. Catalogue & Fiches Techniques (Products & BOM)
* **Description** : Le référentiel central de tous les articles mis en vente (produits finis, boissons, plats transformés).
* **Fonctions clés** :
  * *Création de fiches techniques (Nomenclature / Bill of Materials - BOM)* : Spécification des ingrédients requis, de leur quantité et assignation de substituts (composants secondaires).
  * *Calcul automatique du coût théorique d'achat* à partir des ingrédients configurés et de leur CMP.
  * *Chant de Redéfinition du Coût de Revient Restant (userCostPrice)* : Si votre établissement subit des pertes, inclut des coûts de main d'oeuvre ou des emballages spécifiques, vous pouvez forcer un coût de revient "Resto". L'ERP calculera les deux marges d'analyse en parallèle.
  * *Importateur de masse Excel* : Permet d'injecter des milliers de fiches, d'ingrédients et de fiches techniques d'un seul coup grâce à la structure d'onglets intelligents.

### E. Gestion des Stocks & Inventaires
* **Description** : Module d'approvisionnement et de contrôle de la cuisine pour limiter le gaspillage alimentaire et sécuriser l'actif circulant de l'établissement.
* **Fonctions clés** :
  * *Fiches Ingrédients* : Unités de mesure flexibles (kg, g, L, Unités, Cartons), seuil de stock minimal et maximal d'alerte.
  * *Validation Multicritères des Pertes d'Exploitation* : Pour faire face aux aléas d'un restaurant d'envergure, tout retrait de stock négatif s'accompagne d'un motif précis :
    * 🚨 `Péremption / DLC Dépassée` : Retrait standard des produits arrivés à péremption.
    * 🔌 `Coupure de courant / Rupture de chaîne du froid` : Mesure directe de l'impact financier d'une panne d'électricité ou d'un congélateur défectueux.
    * 🍳 `Accident de cuisine / Casse / Renversement` : Comptabilise une maladresse, un contenant brisé ou un plat manqué à jeter.
    * 🦠 `Altération qualité / Produit moisi` : Détérioration prématurée d'un ingrédient (ex: humidité).
    * 🚛 `Avarie durant le transport / Livraison` : Produits inutilisables reçus directement du fournisseur.
    * 🔍 `Vol ou Écart d'inventaire constaté` : Réajustement suite à une démarque inconnue constatée.
    * ❓ `Autre motif exceptionnel / Force majeure`.
  * *Moteur de Propagation des Pertes* :
    * **Audit-Trail** : Historique exhaustif avec le motif exact sélectionné et le commentaire du manager.
    * **Tableau de Bord** : Badge d'alerte dynamique rouge sous la boîte du Bénéfice Net (`Dont gaspillages / pertes : -X F`).
    * **Bilan SIG** : Ligne de charge déductible comptable isolée s'imputant sur le résultat net global.
  * *Synthèse Globale & Conjointe des Stocks (Actifs)* :
    * Visualise de manière synchronisée la valeur globale des stocks de réserve en divisant l'actif circulant : **Alimentaire** (ingrédients) d'un côté, et **Hors-Alimentation** (consommables, packaging, hygiène, entretien) de l'autre.
    * Permet de suivre les alertes de sous-seuil et ruptures de stock d'actifs pour chaque catégorie dans le Dashboard et sur la colonne latérale du Bilan Financier.
  * *Inventaire physique périodique* : Saisie des stocks réels constatés en rayon, calcul automatique des écarts de quantité et valorisation comptable de la démarque.

### F. Workflow d'Achats & Suivi Fournisseurs
* **Description** : Gestion de la chaîne logistique d'approvisionnement, des demandes internes jusqu'au paiement final.
* **Fonctions clés** :
  * *Demande d'Achat (DA)* : Émise par le chef de cuisine ou responsable des stocks lors du franchissement du stock d'alerte.
  * *Bon de Commande (BC) Fournisseur* : Généré après approbation avec tarifs négociés et envoyés au fournisseur attitré.
  * *Bon de Réception (BR)* : Permet d'intégrer les livraisons (qu'elles soient complètes ou partielles) et de réévaluer le CMP des matières en cascade de manière automatique.

### G. Clôture de Caisse & Comptabilité de Caisse
* **Description** : Rapprochement financier opéré en fin de shift ou en fin de journée par le manager ou chef comptable.
* **Fonctions clés** :
  * *Suivi du tiroir-caisse* : Entrées de caisse de départ, mouvements de décaissements au cours du service, dépôts bancaires.
  * *Clôture de Caisse Journalière validée* : Gèle définitivement la journée financière opérationnelle.
  * *Exportation de rapports PDF de clôtures* : Reprenant la distribution exacte par canal de vente et méthode de paiement pour vérification physique des dépôts de fonds.

### H. Contrôle Financier des Dépenses (Cash-Out)
* **Description** : Suivi rigoureux de l'ensemble des dépenses d'exploitation indirectes de l'établissement (hors chaîne logistique).
* **Fonctions clés** :
  * *Enregistrement des charges* : Nature de la dépense (Salaires, Loyers, Électricité, Achats d'équipements, Entretien).
  * *Distinction comptable* : Charges de type **Fixe** ou **Variable** pour une analyse de rentabilité performante.
  * *Intégration fiscale* : Gestion du taux de TVA et distinction entre montant Hors-Taxes (HT) et Toutes Taxes Comprises (TTC) pour le recouvrement.

### I. Bilan Analytique & Soldes Intermédiaires de Gestion (SIG)
* **Description** : Ce module fournit le compte de résultat d'exploitation consolidé de l'établissement sur n'importe quelle période de temps sélectionnée.
* **Indicateurs maîtres** :
  * **Produits d'Exploitation (A)** : Somme du Chiffre d'Affaires Net des ventes et des autres revenus d'exploitation.
  * **Charges d'Exploitation (B)** :
    * *Matières premières* : Somme du coût d'achat idéal (BOM) ajusté des achats directs, OU somme du coût de revient resto plus englobant des variables opérationnelles.
    * *Charges internes* : Salaires, Loyers et fluides (eau, énergie).
  * **Résultat Net Global (A - B)** : Résultat final de l'exercice comptable (Bénéfice/Perte) calculé et comparé sous l'angle BOM (Matières pures) et sous l'angle Resto (Coûts réels de structure).
  * **Graphes structurels des charges** : Diagramme de répartition pour isoler immédiatement les postes de surcoût ou d'inefficacité.

### J. Administration des Rôles & Paramètres
* **Description** : Contrôle d'accès rigoureux pour restreindre les modules de l'ERP aux utilisateurs autorisés selon leur profil opérationnel.
* **Rôles natifs de l'application** :
  * `SUPERADMIN` : Rôle suprême de pilotage de groupe et de franchise. Il accède au **Cockpit SuperAdmin** exclusif permettant de superviser les KPI consolidés multi-sites, de gérer l'architecture multi-établissement, et de piloter l'importation, l'exportation et la synchronisation cloud sécurisée via Supabase. L'onglet de synchronisation dans les paramètres lui est entièrement réservé.
  * `ADMIN` : Accès universel non-restreint au niveau de son établissement d'affectation aux indicateurs stratégiques, bilans, exports et à la configuration globale de l'organisation.
  * `MANAGER` : Supervision des équipes, modification du catalogue de prix, validation d'inventaires physiques et ré-ajustement des fiches techniques.
  * `CASHIER` : Limité strictement au module **POS (Caisse Tactile)** et à la saisie des encaissements de service.
  * `WAREHOUSE` : Accès restreint à la gestion des **Stocks**, séléction des inventaires et réception des commandes d'achats fournisseurs.
  * `ACCOUNTING` : Accès focalisé sur les rapports financiers, enregistrement des factures de charges du module **Finance**, **Comptabilité (Clôtures)** et consultation du **Bilan SIG**.

---

## 4. Matrice Multi-Critères de Filtrage Temporel Avancé

L'une des innovations de notre ERP réside dans son **moteur de filtrage temporel unifié**. Présent sur le Dashboard, Bilan, Finance et Commandes, il vous libère des contraintes de vision de dates prédéfinies :

| Sélecteur Rapide | Usage Typique | Comportement Technique de la Requête |
| :--- | :--- | :--- |
| **Aujourd'hui** | Shift opérationnel en cours | Filtre toutes les données datées de la date système courante (`2026-06-11` dans le simulateur). |
| **Cette semaine** | Analyse hebdomadaire de trafic | Filtre les opérations sur une fenêtre dynamique des 7 derniers jours par rapport à la date de référence. |
| **Mois courant** | Clôtures fiscales intermédiaires | Isole les flux ayant lieu du premier au dernier jour du mois en cours. |
| **Toutes les dates** | Historique complet | Lève toutes les limites temporelles pour exposer les données consolidées globales de l'ERP. |
| **Date Unique Spécifique** | Audit d'un jour précis | Permet de cibler n'importe quel jour historique et d'en étudier le Bilan de Performance, les stocks vendus et les écarts de caisse. |
| **Période Personnalisée** | Analyse de saisonnalité | Grâce aux sélecteurs de `Date Début` et `Date Fin`, l'utilisateur peut cumuler plusieurs jours spécifiques, des quinzaines, ou consolider plusieurs mois consécutifs de gestion. |

---

## 5. Directives de Formation par Profil Opérationnel

### 🧑‍🍳 Rôle : Chef de Cuisine / Responsable F&B
#### Objectifs clés : Assurer la consistance des recettes et éviter les ruptures d'ingrédients.
1. **Étape 1 : Le Catalogue de Recettes**
   * Accéder à *Catalogue $\rightarrow$ Fiches Techniques*.
   * Pour chaque plat, renseigner rigoureusement la liste des ingrédients requis au gramme ou au millilitre près.
   * Assigner les ingrédients secondaires (substituts) pour pallier les ruptures de stock.
2. **Étape 2 : Le Suivi d'Alerte**
   * Renseigner les niveaux de stocks critiques dans l'onglet *Ingrédients*.
   * Si un article passe en orange : se rendre dans *Achats $\rightarrow$ Demandes d'Achat* et soumettre une réquisition pour le responsable logistique.
3. **Étape 3 : L'Inventaire Hebdomadaire**
   * À la fin de chaque semaine, imprimer l'état théorique et effectuer un comptage réel en rayon.
   * Accéder à *Stocks $\rightarrow$ Inventaire*, créer une fiche, reporter les valeurs de comptage et valider les écarts constatés.

---

### 💵 Rôle : Caissier / Serveur d'Établissement
#### Objectifs clés : Enregistrer rapidement le ticket de facturation sans erreur d'encaissement.
1. **Étape 1 : Ouverture & Prise de Commande**
   * Se connecter à l'ERP (votre interface charge par défaut le module *POS*).
   * Sélectionner un canal de vente (ex: *Sur Place*), puis le numéro de table.
   * Cliquer sur les articles demandés. Renseigner les détails de cuisson ou préférences via l'icône de commentaires de ligne.
2. **Étape 2 : Gestion des Remises & Paiement**
   * Appliquer une remise si le client dispose d'un code promotionnel ou d'une faveur de direction.
   * Sélectionner la méthode de paiement choisie par le client (Espèces, Wave, Orange Money).
   * Cliquer sur **Payer et Valider le Ticket** pour imprimer la facture physique ou envoyer le reçu.

---

### 💼 Rôle : Manager Audit / Administrateur
#### Objectifs clés : Piloter les équipes, optimiser le catalogue et gérer les contrôles d'accès.
1. **Étape 1 : Administration des Rôles**
   * Accéder au module *Admin $\rightarrow$ Gérer Collaborateurs*.
   * Créer les fiches de vos employés et leur affecter un rôle restrictif pour protéger les modules sensibles (Comptabilité, Achats globaux).
2. **Étape 2 : Diagnostic de rentabilité**
   * Accéder au *Dashboard* et sélectionner la période d'audit souhaitée.
   * Examiner attentivement l'écart entre le coût théorique issu de votre BOM et le coût réel issu de vos réévaluations de coût personnalisé.
   * Identifier les plats sous-performants (Marge brute Resto faible) et ajuster les prix de vente en conséquence directement dans le catalogue.
3. **Étape 3 : Logs d'Audit**
   * Consulter périodiquement l'historique d'audit pour repérer toutes les suppressions de plats du catalogue, les annulations suspectes de tickets de caisse ou les validations d'inventaires erronées.

---

### 👑 Rôle : Super-Administrateur Groupe / Franchise
#### Objectifs clés : Superviser l'ensemble du parc de restaurants, administrer les flux cloud et gérer la portabilité des données multi-établissements.
1. **Étape 1 : Supervision de la performance multi-sites**
   * Consulter le module **Super-Admin** (accessible uniquement sous le profil `SUPERADMIN`).
   * Analyser l'activité consolidée dans la section des **Indicateurs Globaux Consolidés \& Analyse de Performance** (CA consolidé, TVA, dépenses, résultat net, panier moyen AOV, marge nette %, couverts, expense ratio).
2. **Étape 2 : Gestion de la Portabilité & Synchronisation Cloud**
   * Aller dans les **Paramètres Système $\rightarrow$ Synchronisation Cloud (Supabase)** ou directement dans le **Super-Admin**.
   * Pour un site donné, sauvegarder les données locales vers le cloud (`Push`) ou rapatrier les données cloud vers le navigateur (`Pull`).
   * Utiliser la **Détection automatique des établissements** pour voir immédiatement quels restaurants ont déjà des données synchronisées sur Supabase, ou saisir un identifiant manuellement.
3. **Étape 3 : Traçabilité et Audit-Trail Cloud**
   * Analyser le **Journal d'Audit de Synchronisation en Direct** (console rétro terminal) pour suivre l'état des communications réseau avec Supabase et corriger toute anomalie d'API.
