# Principes de Calcul et Interactions de Données - KISSINE FLOW™

Ce document présente l'architecture mathématique, les équations comptables et le fonctionnement des flux d'informations financières entre les différents modules de l'application **KISSINE FLOW™**.

---

## 1. Différences Constatées (CA HT vs. CA de Tableau de Bord)

### A. Non-concordance du Chiffre d'Affaires (CA)
Certains utilisateurs relèvent des écarts entre le **Chiffre d'Affaires (CA) du Tableau de Bord** et le **Chiffre d'Affaires Comptable Hors Taxes (CA HT) du Bilan & Compte de Résultat**. Cet écart est **normal, systématique et purement fiscal**.

1. **L'isolation de la TVA (Taxe sur la Valeur Ajoutée) :**
   * Le **Tableau de Bord** capture les encaissements directs aux caisses tactiles (POS). Ces ventes sont comptabilisées **Toutes Taxes Comprises (TTC)** car elles reflètent la trésorerie brute entrée.
   * Le **Bilan & Compte de Résultat** doit respecter les règles comptables de l'OHADA. Il doit donc isoler la taxe (TVA) pour ne comptabiliser que la fraction **Hors Taxes (HT)** qui revient légitimement à l'entreprise.

   **Formule de conversion d'un montant de CA de TTC en HT :**
   $$\text{CA HT} = \frac{\text{CA TTC}}{1 + \left(\frac{\text{Taux TVA}}{100}\right)}$$

   *Exemple avec le taux par défaut du Cameroun (19,25%) :*
   $$\text{CA HT} = \frac{\text{CA TTC}}{1,1925}$$
   Pour $1\,000\,000 \text{ FCFA}$ encaissés sur le POS (Tableau de Bord), la fraction HT comptabilisée au Compte de Résultat sera de $838\,574 \text{ FCFA}$. L'écart de $161\,426 \text{ FCFA}$ représente la TVA due à l'État.

2. **Configuration du Taux de TVA :**
   Le taux de TVA de référence peut désormais être ajusté librement dans les **Paramètres Système → Coordonnées de l'Enseigne**. Tout changement de ce taux recalcule instantanément l'assiette du CA Hors Taxes du Bilan.

---

## 2. Pourquoi le Profit Net Graphique d'Exploitation peut être de 0

Dans le module **Tableau de Bord BI**, le graphique d'analyse des flux économiques affiche un **Profit Net de 0 FCFA** lorsque l'établissement est dans l'une des situations suivantes :

1. **Seuil de Rentabilité non Atteint (Situation de Perte d'Activité) :**
   Si la somme des **Charges d'Exploitation Globales** (Salaires, Loyers, Énergie, Eau) et du **Coût Matière d'Ingrédients (Marge Brûlée)** dépasse le Chiffre d'Affaires réalisé sur la période sélectionnée, le profit net théorique est **négatif** (déficit opérationnel) :
   $$\text{Profit Net} = \text{Marge Brute} - \text{Charges de Fonctionnement} < 0$$

2. **Écrêtage de Protection Graphique :**
   Pour des raisons de lisibilité des graphiques à colonnes ou sectoriels d'indicateurs financiers, les pertes négatives ne peuvent pas s'afficher sous forme géométrique inversée standard. Le code graphique applique la fonction de sécurité :
   $$\text{Profit Net Graphique} = \max(0, \text{Profit Net Réel})$$
   Ainsi, si l'établissement perd de l'argent (Profit Net négatif), la colonne affiche **0 FCFA**. Le montant réel exact reste cependant consultable en valeur absolue négative dans le résumé analytique.

---

## 3. Formules Clés par Module Système

### A. Module : Actifs & Valorisation Stock
* **Coût Moyen Pondéré (CMP) par Ingrédient :**
  Calculé dynamiquement à chaque validation de Bon de Livraison (BL) d’achats :
  $$\text{CMP}_{\text{nouveau}} = \frac{(\text{Stock Actuel} \times \text{CMP}_{\text{actuel}}) + (\text{Quantité Reçue} \times \text{Prix Unitaire Achat})}{\text{Stock Actuel} + \text{Quantité Reçue}}$$

* **Valorisation Financière Globale du Stock (Actif Circulant) :**
  Calculée de manière conjointe entre le stock d'ingrédients alimentaires et le stock de matériels/consommables hors-alimentation (packaging, hygiène, entretien) :
  $$\text{Valorisation Alimentaire} = \sum \left(\text{Stock Actuel d'un Ingrédient} \times \text{CMP}\right)$$
  $$\text{Valorisation Hors-Alimentation} = \sum \left(\text{Stock Actuel d'un Article Hors-Alim} \times \text{CMP}\right)$$
  $$\text{Valorisation Globale Consolidée} = \text{Valorisation Alimentaire} + \text{Valorisation Hors-Alimentation}$$

### B. Module : Catalogue & Fiches Recettes (BOM / Food Cost)
* **Coût de Revient Théorique d'un Plat (BOM Cost) :**
  $$\text{Coût Théorique Plat} = \sum \left(\text{Quantité requise par ingrédient} \times \text{CMP de l'ingrédient}\right)$$
* **Taux de Marge Brute Théorique d'un Plat :**
  $$\text{Taux de Marge} (\%) = \left(\frac{\text{Prix Vente HT} - \text{Coût Théorique}}{\text{Prix Vente HT}}\right) \times 100$$

### C. Moteur de Pertes Multi-Motifs & Impact sur la Rentabilité Nette
Les anomalies de cuisine sont documentées au sein de l'ERP par motif d'origine (Péremption, Coupure de courant/Chaîne du froid, Casse/Accident de cuisine, Altération qualité, Avarie transport, Écart d'inventaire, Vol) :
* **Valorisation d'une Perte de Cuisine :**
  $$\text{Perte Financière de Lot} = \text{Quantité Perdue} \times \text{CMP de l'article}$$
* **Sorties & Pertes de Consommables Hors-Alimentation (Période) :**
  $$\text{Total Pertes Hors-Alim} = \sum_{\text{Mouvements OUT / ADJUST\_MINUS}} \left(\text{Quantité Sortie} \times \text{CMP de l'article}\right)$$
* **Formule Complète du Bénéfice Net Réel (Dashboard & Bilan SIG) :**
  $$\text{Bénéfice Net Réel} = \text{Marge Brute Resto} - \text{Charges de Fonctionnement (Dépenses)} - \text{Total Pertes Alimentaires} - \text{Total Pertes Hors-Alimentation}$$

### D. Nouveau Module : Prestations, Buffets & Traiteur (KPI d'Écarts)
Ce module gère deux activités majeures et calcule les écarts de performance par rapport aux objectifs fixés.

#### 1. Planification & Déstockage des Buffets Organisés
Pour un buffet, les matières premières sont sorties directement du stock physique pour alimenter la cuisine :
* **Déstockage Réel :** Les ingrédients sélectionnés voient leur quantité soustraite immédiatement dans l'inventaire actif de l'ERP. Un mouvement de stock de type `SORTIE` estampillé `BUFFET-[ID]` est consigné dans l'audit-trail.
* **Coût de Revient Réel Matériel (Ingredients Spent) :**
  $$\text{Coût Matières Premières} = \sum \left(\text{Quantité Prélevée} \times \text{CMP de l'ingrédient}\right)$$
* **Coût Global du Buffet :**
  $$\text{Coût Global} = \text{Coût Matières Premières} + \text{Charges Annexes (Personnel, Déco, Logistique)}$$
* **Indicateurs d'Écart de Ventes (Objectifs atteints ?) :**
  $$\text{Écart sur Volume Plats} = \text{Plats Réels Vendus} - \text{Nombre de Plats Prévus (Objectif)}$$
  $$\text{Bénéfice Réel Établi} = (\text{Plats Réels Vendus} \times \text{Prix de Vente Plat}) - \text{Coût Global}$$

#### 2. Service Traiteur Autonome
Activité commerciale sur-mesure de banquet/mariage pour laquelle le client propose son budget :
* **Bénéfice Espéré (Prévisionnel) :**
  $$\text{Bénéfice Prévisionnel} = \text{Budget Global Proposé par Client} - \text{Coût Estimé de Prestation}$$
* **Bénéfice Réel (Clôturé) :**
  $$\text{Bénéfice Réel} = \text{Budget Global Proposé par Client} - \text{Coût Réel Réellement Engagé}$$
* **Écart de Rentabilité Traiteur (Performance Marge) :**
  $$\text{Écart de Rentabilité} = \text{Bénéfice Réel} - \text{Bénéfice Prévisionnel}$$

---

### E. Nouveau Module : Indicateurs Avancés & d'Analyse Financière Consolidée (SuperAdmin)
Le Cockpit SuperAdmin propose une série de métriques financières consolides et de ratios de performance pour analyser de manière transverse l'activité de tous les sites d'une franchise ou d'un groupe.

* **Panier Moyen Consolidé (Average Order Value - AOV) :**
  $$\text{AOV} = \frac{\text{Chiffre d'Affaires Global}}{\text{Nombre Total de Bons de Caisse}}$$
  *Mesure le montant moyen dépensé par transaction sur l'ensemble des sites.*

* **Marge Bénéficiaire Nette Consolidée :**
  $$\text{Marge Nette} (\%) = \left(\frac{\text{Résultat Net Cumulé}}{\text{Chiffre d'Affaires Global}}\right) \times 100$$
  *Rend compte de l'efficacité de rentabilité finale nette une fois l'ensemble des charges d'exploitation déduites.*

* **Ticket Moyen par Couvert (Fréquentation) :**
  $$\text{Ticket Moyen par Couvert} = \frac{\text{Chiffre d'Affaires Global}}{\text{Total Couverts (Fréquentation Cumulée)}}$$
  *Définit la dépense moyenne d'un client attablé sur l'ensemble du réseau.*

* **Efficacité des Charges d'Exploitation (Expense Ratio) :**
  $$\text{Expense Ratio} (\%) = \left(\frac{\text{Dépenses \& Charges Totales}}{\text{Chiffre d'Affaires Global}}\right) \times 100$$
  *Indique la part du chiffre d'affaires absorbée par le fonctionnement et l'approvisionnement.*

---

## 4. Interactions et Flux de Données Entre Modules

Les données voyagent en temps réel pour assurer une cohérence absolue :

```
[Mouvements / Factures Achats] ──> Met à jour le CMP ──> [Valorisation du Stock]
                                       │
                                       ▼
  [Ventes du POS (Caisse)] ───> Consomme la Recette ───> [Coût Théorique d'Ingrédient (BOM)]
         │                             │
         ▼                             ▼
  [Tableau de bord (CA TTC)]    [Valorisation Bilan (Mat. Premières)]
         │                             │
         ▼ (Soustrait la TVA)          ▼
        [Assiette CA HT au Bilan & Compte de Résultat]
```

1. **Achat grossiste (BL Validé) :** Réajuste le coût moyen pondéré (CMP) de l'ingrédient et augmente la valeur d'actif du stock.
2. **Sortie d'ingrédients Buffet :** Décrémente instantanément le stock physique dans le module **Stocks** et calcule la masse de coût de matières utilisées pour l'analyse de marge de ce buffet.
3. **Caisse Tactile (Vente POS) :** Exporte les transactions de ventes vers le **Tableau de Bord** et alimente le module **Bilan** sous forme de CA. Elle permet également aux **Objectifs Financiers** de comparer instantanément la cible de vente fixée à une date donnée par rapport aux encaissements réels constatés à la seconde près.
4. **Paramètres Système :** La définition de la TVA s'applique globalement à l’application, mettant à jour la conversion de l'assiette du Chiffre d'Affaires de tous les calculs analytiques.
5. **Gestion des Pertes & Actifs Conjoints :** La validation d'une perte d'ingrédient alimente directement le badge d'alerte sous la carte bénèfice net du **Tableau de Bord** (mettant en exergue le préjudice de gaspillage) et s'impute comme charge directe brute déductible dans le **Bilan SIG**. Parallèlement, la valorisation globale intègre de manière synchrone l'actif circulant alimentaire et les consommables hors-alimentation (matériels, emballages, hygiène).
6. **Portabilité Supabase Cloud (SuperAdmin) :** Les données locales stockées en localStorage par l'ERP (tenants, users, orders, dishes, ingredients, stocks, receipts, expenses, etc.) pour un site ou mode donné sont structurées sous forme de payload JSON et exportées de manière sécurisée (`Push`) vers la table `kissineflow_sync` de Supabase. À l'inverse, l'opération de `Pull` rapatrie ces données et écrase l'état local pour rafraîchir instantanément les KPIs multi-sites consolidés du SuperAdmin.

