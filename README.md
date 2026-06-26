# 🍳 ERP F&B Cockpit - Système Intégré de Gestion de Restauration

Bienvenue dans le dépôt officiel de l'**ERP F&B Cockpit (Food & Beverage)**, une solution complète de gestion hôtelière et de restauration (groupe, franchise ou établissement unique). Ce progiciel a été développé en **React 18**, **Vite** et **TypeScript**, avec une esthétique poussée et responsive grâce à **Tailwind CSS**.

https://kissineflow-485011842329.europe-west3.run.app/

---

## 🚀 Fonctionnalités Clés par Compétence Métier

*   **🖥️ Tableau de Bord Stratégique (Dashboard)** : Indicateurs clés (CA HT/TTC, panier moyen, nombre de tickets, etc.) et doubles ratios de marge brute en temps réel (Approche théorique **BOM** vs Approche personnalisée **Resto**).
*   **🛒 Caisse Enregistreuse Tactile (POS)** : Saisie rapide des commandes (Sur place, livraison, à emporter), plan de salle interactif (tables/couverts), et gestion flexible des encaissements multisignaux (Espèces, Wave, Orange Money, etc.).
*   **📋 Filtre Date Avancé Multi-Critères** : Implémenté de manière transverse sur les modules **Commandes & Tickets**, **Dashboard**, **Bilan SIG** et **Finance**, permettant l'étude temporelle par jour précis, semaine, mois entier, tout l'historique ou des périodes arbitraires cumulées personnalisées.
*   **📦 Gestion Logistique (Stocks & Inventaires - Multi-Motifs)** : Fiches ingrédients complexes, seuils d'alertes critiques, déclaration des pertes d'exploitation par motif d'origine (Péremption, Coupure d'électricité, Casse/Accident de cuisine, Altération qualité, Avarie transport, Vol, Autre) avec propagation automatique en charges financières directes et alertes sur le Dashboard.
*   **📊 Synthèse Globale d'Actifs de Stock** : Fusion synchrone et valorisation au Coût Moyen Pondéré (CMP) des actifs de réserve alimentaires (ingrédients) et hors-alimentation (matériels, emballages, consommables d'hygiène/entretien) dans le Dashboard et le Bilan.
*   **🧾 Chaîne d'Achat & Valorisation Automatique (CMP)** : Workflow d'achat complet (*Demande d'Achat ➔ Bon de Commande ➔ Réception*) avec réévaluation automatique et en temps réel du **CMP (Coût Moyen Pondéré)** à chaque entrée logistique.
*   **🏷️ Catalogue & Fiches Techniques (BOM)** : Configuration de la nomenclature technique des recettes et dissociation fine entre le coût théorique matière et la redéfinition du coût de revient gérant ("Resto"). Importateur de masse Excel intégré.
*   **💴 Comptabilité, Clôtures de Caisse & Finance** : Clôtures journalières certifiées (Z-Out), mouvements de cash divers en cours de service, et imputations des factures de charges d'exploitation fixes ou variables (Salaires, Loyers, Énergie) avec répartition fiscale.
*   **📊 Bilan Analytique & Soldes Intermédiaires de Gestion (SIG)** : Calcul automatisé du compte de résultat d'exploitation complet (Consolidation Produits vs Charges, Food Cost, Pertes de Cuisine & Consommables isolés, Résultat Net comparatif BOM/Resto).
*   **🔑 Administration des Rôles** : Droits restrictifs pour sécuriser l'organisation par profil collaborateur (Admin, Manager, Caissier, Économe/Stocks, Comptable).

---

## 🏛️ Architecture Fonctionnelle Pro-Resto

L'application résout l'écart classique entre la théorie d'une recette et l'exploitation vécue en proposant une **double vision de marge** :
1.  **Rentabilité BOM (Bill of Materials)** : Basée sur la fiche technique théorique et le CMP des ingrédients.
2.  **Rentabilité Resto (Coûts Personnalisés)** : Reposant sur vos coûts de revient réels et de structure, intégrant les pertes inhérentes à l'établissement ou de main d'œuvre spécifique.

Le déstockage des ingrédients en cuisine est calculé en temps réel lors du passage d'une commande au POS grâce aux configurations de fiches techniques (BOM).

---

## 💻 Installation & Initialisation Locale

### Prérequis
*   [Node.js](https://nodejs.org/) (Version 18.0 ou supérieure)
*   [npm](https://www.npmjs.com/) (ou yarn)

### Lancement en mode Développement
1.  Installez les dépendances du progiciel :
    ```bash
    npm install
    ```
2.  Démarrez le serveur de développement local :
    ```bash
    npm run dev
    ```
3.  Ouvrez votre navigateur à l'adresse : `http://localhost:3000` (ou le port défini en sortie console).

### Compiler pour la Production
1.  Générez la build optimisée et minifiée du code client :
    ```bash
    npm run build
    ```
2.  Lancez le linter pour valider le typage strict et la propreté du code :
    ```bash
    npm run lint
    ```

---

## 📚 Ressources Additionnelles & Documentation Interne

Pour approfondir les mécanismes intégrés ou mettre en place un plan de formation rigoureux de vos collaborateurs :
*   📘 **[MANUEL_D_UTILISATION.md](./MANUEL_D_UTILISATION.md)** : Étude pas-à-pas de chaque module opérationnel et des guides de formation détaillés par rôle utilisateur (Chef de Cuisine, Caissier, Comptable, Gérant Audit).
*   🏛️ **[SYNTHESE_ARCHITECTURE_FORMATION.md](./SYNTHESE_ARCHITECTURE_FORMATION.md)** : Synthèse de l'architecture technique des composants React, de l'isolation multi-tenant, et du fonctionnement des flux transverses d'information.
