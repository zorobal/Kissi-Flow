/**
 * @license
 * SPDX-License-Identifier: Apache-2.5
 */

import { useState, useRef, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Edit,
  Layers,
  ShoppingBag,
  Coins,
  AlertCircle,
  TrendingUp,
  ChevronRight,
  Sparkles,
  ClipboardList,
  Activity,
  Trash2,
  Trash,
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle,
  Edit2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Dish, DishCategory, Ingredient, Recipe, RecipeLine, IngredientCategory } from '../types';

interface CatalogueViewProps {
  dishes: Dish[];
  categories: DishCategory[];
  ingredients: Ingredient[];
  recipes: Recipe[];
  onAddDish: (dish: Dish) => void;
  onUpdateDish: (dish: Dish) => void;
  onDeleteDish: (dishId: string) => void;
  onAddIngredient: (ing: Ingredient) => void;
  onUpdateRecipe: (recipeId: string, lines: RecipeLine[]) => void;
  onAddRecipe?: (rec: Recipe) => void;
  onChangeCategories?: (categories: DishCategory[]) => void;
  logsAction: (action: string, module: string) => void;
  tenantId: string;
  unitsOfMeasurement?: string[];
  onUpdateIngredient?: (ing: Ingredient) => void;
  onDeleteIngredient?: (id: string) => void;
  ingredientCategories?: IngredientCategory[];
}

export default function CatalogueView({
  dishes,
  categories,
  ingredients,
  recipes,
  onAddDish,
  onUpdateDish,
  onDeleteDish,
  onAddIngredient,
  onUpdateRecipe,
  onAddRecipe,
  onChangeCategories,
  logsAction,
  tenantId,
  unitsOfMeasurement,
  onUpdateIngredient,
  onDeleteIngredient,
  ingredientCategories
}: CatalogueViewProps) {
  // Sub-tabs in catalog module: 'DISHES' | 'INGREDIENTS' | 'RECIPES' | 'IMPORT_EXCEL'
  const [subTab, setSubTab] = useState<'DISHES' | 'INGREDIENTS' | 'RECIPES' | 'IMPORT_EXCEL'>('DISHES');

  // Excel Bulk Import States
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<'IDLE' | 'PARSED' | 'SAVED'>('IDLE');
  const [importSummary, setImportSummary] = useState({
    dishes: [] as any[],
    ingredients: [] as any[],
    recipes: [] as any[],
    logs: [] as string[]
  });

  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const generateCodeFromName = (name: string, prefix: string, existingCodes: string[]): string => {
    const cleanName = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase();
    
    let base = cleanName.slice(0, 4);
    if (!base) base = 'ELM';
    if (base.length < 3) base = (base + "XXX").slice(0, 4);
    
    let candidate = `${prefix}-${base}`;
    let count = 1;
    while (existingCodes.includes(candidate)) {
      candidate = `${prefix}-${base}${count}`;
      count++;
    }
    return candidate;
  };

  const handleExcelImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const bstr = e.target?.result;
        if (!bstr) throw new Error("Impossible de lire les octets du fichier.");
        
        const wb = XLSX.read(bstr, { type: 'binary' });
        const sheetNames = wb.SheetNames;
        const logs: string[] = [];
        
        const findSheet = (keywords: string[]) => {
          return sheetNames.find(name => 
            keywords.some(kw => name.toLowerCase().includes(kw))
          );
        };
        
        const dishesSheetName = findSheet(['plat', 'dish', 'menu']);
        const ingredientsSheetName = findSheet(['ingred', 'matiere', 'matieres', 'raw']);
        const recipesSheetName = findSheet(['recette', 'fiche', 'tech', 'bom']);
        
        if (!dishesSheetName && !ingredientsSheetName && !recipesSheetName) {
          throw new Error("Aucun onglet valide trouvé dans le fichier Excel. Le fichier doit contenir au moins un des onglets suivants : 'Plats & Menus', 'Ingredients' ou 'Fiches Techniques'.");
        }

        let parsedDishesList: any[] = [];
        let parsedIngredientsList: any[] = [];
        let parsedRecipesList: any[] = [];

        if (ingredientsSheetName) {
          const ws = wb.Sheets[ingredientsSheetName];
          const rawRows = XLSX.utils.sheet_to_json(ws);
          
          rawRows.forEach((row: any, idx) => {
            const getVal = (keys: string[]) => {
              const matchedKey = Object.keys(row).find(k => keys.includes(k.toLowerCase().trim()));
              return matchedKey ? row[matchedKey] : undefined;
            };

            const name = getVal(['nom', 'name', 'ingredient', 'matiere', 'matiere premiere', 'ingrédient']);
            if (name && String(name).trim()) {
              const desc = getVal(['description', 'desc', 'details', 'detail']) || '';
              const unit = getVal(['unité', 'unite', 'unit']) || 'kg';
              const cmp = Number(getVal(['coût', 'cout', 'coûtmoyen', 'cout moyen', 'cmp', 'cout unitaire', 'prixachat', 'prix achat', 'purchaseprice', 'price', 'coutunitaire'])) || 0;
              const stock = Number(getVal(['stock', 'quantité', 'qty', 'quantite', 'stock actuel', 'stockactuel', 'stock_actuel'])) || 0;
              const min = Number(getVal(['min', 'stock min', 'stock_min', 'seuil min', 'seuil', 'stockmin'])) || 0;
              const max = Number(getVal(['max', 'stock max', 'stock_max'])) || 100;

              parsedIngredientsList.push({
                rowNum: idx + 2,
                name: String(name).trim(),
                description: String(desc).trim(),
                unit: String(unit).trim(),
                cmp,
                stockActual: stock,
                stockMin: min,
                stockMax: max
              });
            }
          });
          logs.push(`✔️ Onglet "${ingredientsSheetName}" : ${parsedIngredientsList.length} matières premières lues.`);
        } else {
          logs.push(`⚠️ Aucun onglet "Ingredients" détecté. Cet import d'ingrédients sera ignoré.`);
        }

        if (dishesSheetName) {
          const ws = wb.Sheets[dishesSheetName];
          const rawRows = XLSX.utils.sheet_to_json(ws);
          
          rawRows.forEach((row: any, idx) => {
            const getVal = (keys: string[]) => {
              const matchedKey = Object.keys(row).find(k => keys.includes(k.toLowerCase().trim()));
              return matchedKey ? row[matchedKey] : undefined;
            };

            const name = getVal(['nom', 'name', 'plat', 'désignation', 'designation']);
            if (name && String(name).trim()) {
              const price = Number(getVal(['prix', 'price', 'tarif', 'valeur', 'prix public'])) || 0;
              const categoryStr = getVal(['catégorie', 'categorie', 'category', 'classe', 'code_categorie']) || 'RESTO';
              const description = getVal(['description', 'desc', 'details']) || '';
              const prepTime = Number(getVal(['temps', 'tempprep', 'prep', 'temps de préparation', 'prep time'])) || 15;
              const userCostPriceVal = Number(getVal(['coût de revient resto', 'cout de revient resto', 'cost price', 'cout_revient_resto', 'revient resto', 'usercostprice'])) || undefined;

              parsedDishesList.push({
                rowNum: idx + 2,
                name: String(name).trim(),
                price,
                categoryStr: String(categoryStr).trim(),
                description: String(description).trim(),
                prepTime,
                userCostPrice: userCostPriceVal
              });
            }
          });
          logs.push(`✔️ Onglet "${dishesSheetName}" : ${parsedDishesList.length} plats et menus lus.`);
        } else {
          logs.push(`⚠️ Aucun onglet "Plats & Menus" détecté. Cet import de plats sera ignoré.`);
        }

        if (recipesSheetName) {
          const ws = wb.Sheets[recipesSheetName];
          const rawRows = XLSX.utils.sheet_to_json(ws);
          
          rawRows.forEach((row: any, idx) => {
            const getVal = (keys: string[]) => {
              const matchedKey = Object.keys(row).find(k => keys.includes(k.toLowerCase().trim()));
              return matchedKey ? row[matchedKey] : undefined;
            };

            const platNom = getVal(['nom plat', 'nom_plat', 'plat_nom', 'plat', 'dish', 'recipe dish', 'recette']);
            const ingNom = getVal(['nom ingrédient', 'nom_ingredient', 'ingredient_nom', 'ingredient', 'matière première', 'matiere']);
            const quantity = Number(getVal(['quantité', 'quantite', 'qty', 'quantity', 'dosage', 'poids', 'volume'])) || 0;

            if (platNom && ingNom && quantity > 0) {
              parsedRecipesList.push({
                rowNum: idx + 2,
                platNom: String(platNom).trim(),
                ingNom: String(ingNom).trim(),
                quantity
              });
            }
          });
          logs.push(`✔️ Onglet "${recipesSheetName}" : ${parsedRecipesList.length} lignes d'ingrédients de fiches techniques (BOM) lues.`);
        } else {
          logs.push(`⚠️ Aucun onglet "Fiches Techniques" détecté. Cet import de recettes sera ignoré.`);
        }

        setImportSummary({
          dishes: parsedDishesList,
          ingredients: parsedIngredientsList,
          recipes: parsedRecipesList,
          logs
        });
        setImportStatus('PARSED');
        logsAction(`Analyse réussie du fichier d'importation de catalogue`, 'CATALOGUE & IMPORTS');
        showToast("Analyse du fichier Excel effectuée avec succès !");
      } catch (err: any) {
        showToast("Erreur de lecture du document: " + err.message, "error");
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExecuteImport = () => {
    let dishesImported = 0;
    let ingredientsImported = 0;
    let recipesImported = 0;
    let categoriesCreated = 0;

    let localDishes = [...dishes];
    let localIngredients = [...ingredients];
    let localCategories = [...categories];
    let localRecipes = [...recipes];

    const finalLogs: string[] = [];

    const existingDishCodes = localDishes.map(d => d.code);
    const existingIngCodes = localIngredients.map(i => i.code);

    // 1. PROCESS INGREDIENTS
    const ingMap: { [name: string]: string } = {};
    
    importSummary.ingredients.forEach(rawIng => {
      const exists = localIngredients.find(i => i.name.toLowerCase() === rawIng.name.toLowerCase() && i.tenantId === tenantId);
      if (exists) {
        ingMap[rawIng.name.toLowerCase()] = exists.id;
        exists.cmp = rawIng.cmp || exists.cmp;
        exists.lastPurchasePrice = rawIng.cmp || exists.lastPurchasePrice;
        exists.stockActual = rawIng.stockActual !== undefined ? rawIng.stockActual : exists.stockActual;
        exists.stockMin = rawIng.stockMin !== undefined ? rawIng.stockMin : exists.stockMin;
        exists.stockMax = rawIng.stockMax !== undefined ? rawIng.stockMax : exists.stockMax;
        if (onUpdateIngredient) {
          onUpdateIngredient(exists);
        }
        finalLogs.push(`Matière première "${rawIng.name}" existe déjà (ID: ${exists.id}). Mise à jour des stocks et des coûts effectuée.`);
        return;
      }
      
      const newCode = generateCodeFromName(rawIng.name, 'ING', existingIngCodes);
      existingIngCodes.push(newCode);

      const ingId = `ing-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const ingObj: Ingredient = {
        id: ingId,
        code: newCode,
        name: rawIng.name,
        description: rawIng.description,
        categoryId: 'cat-ing-raw',
        unit: rawIng.unit,
        stockActual: rawIng.stockActual,
        stockMin: rawIng.stockMin,
        stockMax: rawIng.stockMax,
        cmp: rawIng.cmp,
        lastPurchasePrice: rawIng.cmp,
        active: true,
        tenantId: tenantId
      };
      
      onAddIngredient(ingObj);
      localIngredients.push(ingObj);
      ingMap[rawIng.name.toLowerCase()] = ingId;
      ingredientsImported++;
    });

    // 2. PROCESS DISHES
    const dishMap: { [name: string]: string } = {};

    importSummary.dishes.forEach(rawDish => {
      const exists = localDishes.find(d => d.name.toLowerCase() === rawDish.name.toLowerCase() && d.tenantId === tenantId);
      if (exists) {
        dishMap[rawDish.name.toLowerCase()] = exists.id;
        finalLogs.push(`Le plat "${rawDish.name}" existe déjà (ID: ${exists.id}).`);
        return;
      }

      let catObj = localCategories.find(c => 
        (c.name.toLowerCase() === rawDish.categoryStr.toLowerCase() || c.code.toLowerCase() === rawDish.categoryStr.toLowerCase()) && 
        c.tenantId === tenantId
      );
      
      if (!catObj && onChangeCategories) {
        const catCode = rawDish.categoryStr.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5) || 'RESTO';
        const catId = `cat-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        
        catObj = {
          id: catId,
          code: catCode,
          name: rawDish.categoryStr,
          description: `Catégorie créée via l'import de catalogue`,
          active: true,
          tenantId: tenantId
        };
        
        localCategories.push(catObj);
        categoriesCreated++;
        onChangeCategories([...localCategories]);
        finalLogs.push(`Création de la catégorie : "${catObj.name}"`);
      }

      const categoryId = catObj ? catObj.id : (localCategories[0]?.id || 'cat-general');

      const newCode = generateCodeFromName(rawDish.name, 'PL', existingDishCodes);
      existingDishCodes.push(newCode);

      const dishId = `dish-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const uCost = rawDish.userCostPrice || 0;
      const uMargin = uCost > 0 ? (rawDish.price - uCost) : 0;
      const uMarginPct = uCost > 0 ? Math.round((uMargin / uCost) * 100) : 0;

      const dishObj: Dish = {
        id: dishId,
        code: newCode,
        name: rawDish.name,
        description: rawDish.description,
        categoryId,
        image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop',
        price: rawDish.price,
        tvaApplicable: true,
        prepTime: rawDish.prepTime,
        theoreticalCost: 0,
        margin: rawDish.price,
        marginPercent: 100,
        availablePOS: true,
        availableDelivery: true,
        availableTakeaway: true,
        active: true,
        tenantId: tenantId,
        userCostPrice: uCost || undefined,
        userMargin: uMargin || undefined,
        userMarginPercent: uMarginPct || undefined
      };

      onAddDish(dishObj);
      localDishes.push(dishObj);
      dishMap[rawDish.name.toLowerCase()] = dishId;
      dishesImported++;
    });

    // 3. PROCESS RECIPES (BOM)
    const recipeGroups: { [dishId: string]: RecipeLine[] } = {};

    importSummary.recipes.forEach(row => {
      const dishId = dishMap[row.platNom.toLowerCase()] || localDishes.find(d => d.name.toLowerCase() === row.platNom.toLowerCase() && d.tenantId === tenantId)?.id;
      const ingredientId = ingMap[row.ingNom.toLowerCase()] || localIngredients.find(i => i.name.toLowerCase() === row.ingNom.toLowerCase() && i.tenantId === tenantId)?.id;

      if (dishId && ingredientId) {
        if (!recipeGroups[dishId]) {
          recipeGroups[dishId] = [];
        }
        if (!recipeGroups[dishId].some(line => line.ingredientId === ingredientId)) {
          recipeGroups[dishId].push({
            ingredientId,
            quantity: row.quantity
          });
        }
      }
    });

    Object.entries(recipeGroups).forEach(([dishId, lines]) => {
      const exists = localRecipes.find(r => r.dishId === dishId && r.tenantId === tenantId);
      if (exists) {
        const mergedLines = [...exists.lines];
        lines.forEach(line => {
          const idx = mergedLines.findIndex(ml => ml.ingredientId === line.ingredientId);
          if (idx !== -1) {
            mergedLines[idx].quantity = line.quantity;
          } else {
            mergedLines.push(line);
          }
        });
        onUpdateRecipe(exists.id, mergedLines);
        recipesImported++;
      } else if (onAddRecipe) {
        const newRec: Recipe = {
          id: `recipe-${dishId}`,
          dishId,
          version: 1,
          active: true,
          tenantId: tenantId,
          lines
        };
        onAddRecipe(newRec);
        localRecipes.push(newRec);
        recipesImported++;
      }

      // Update theoretical cost of dish in local storage/parent state
      const targetDishIndex = localDishes.findIndex(d => d.id === dishId);
      if (targetDishIndex !== -1) {
        const dish = localDishes[targetDishIndex];
        let calculatedBOMCost = 0;
        lines.forEach(l => {
          const ingObj = localIngredients.find(i => i.id === l.ingredientId);
          if (ingObj) {
            calculatedBOMCost += ingObj.cmp * l.quantity;
          }
        });

        const activeBOMCost = Math.round(calculatedBOMCost);
        const margin = dish.price - activeBOMCost;
        const marginPercent = dish.price > 0 ? Number(((margin / dish.price) * 100).toFixed(1)) : 0;

        onUpdateDish({
          ...dish,
          theoreticalCost: activeBOMCost,
          margin,
          marginPercent
        });
      }
    });

    logsAction(`Importation en masse réussie de catalogue : ${dishesImported} plats, ${ingredientsImported} matières premières, ${recipesImported} fiches techniques.`, 'CATALOGUE & IMPORTS');
    setImportStatus('SAVED');
    setImportSummary(prev => ({
      ...prev,
      logs: [...prev.logs, ...finalLogs, `🎉 Importation complétée ! ${dishesImported} Plats, ${ingredientsImported} Ingrédients, ${recipesImported} Recettes ajoutés ou synchronisés.`]
    }));
    showToast("Importation en masse effectuée avec succès !");
  };

  const downloadSampleExcel = () => {
    const wb = XLSX.utils.book_new();
    
    const platData = [
      { "Nom": "Poulet DG Classique", "Description": "Poulet sauté aux plantains mûrs frits", "Prix": 4500, "Categorie": "RESTO", "TempsPrep": 25 },
      { "Nom": "Jus d'Ananas Bio", "Description": "Jus d'ananas pressé frais sans sucres ajoutés", "Prix": 1500, "Categorie": "BOISSON", "TempsPrep": 5 },
      { "Nom": "Ndolé Viande", "Description": "Feuilles de ndolé aux arachides frites et viande de boeuf", "Prix": 5000, "Categorie": "RESTO", "TempsPrep": 35 }
    ];
    const wsPlats = XLSX.utils.json_to_sheet(platData);
    XLSX.utils.book_append_sheet(wb, wsPlats, "Plats & Menus");
    
    const ingData = [
      { "Nom": "Poulet Entier", "Description": "Poulet bio entier plumé et vidé", "Unite": "kg", "CoutUnitaire": 2200, "StockActuel": 15, "StockMin": 5 },
      { "Nom": "Plantain Mûr", "Description": "Régime de plantains frais", "Unite": "kg", "CoutUnitaire": 800, "StockActuel": 30, "StockMin": 10 },
      { "Nom": "Ananas", "Description": "Ananas mûrs pelés", "Unite": "kg", "CoutUnitaire": 400, "StockActuel": 12, "StockMin": 3 },
      { "Nom": "Feuilles de Ndolé", "Description": "Ndolé lavé précuit", "Unite": "kg", "CoutUnitaire": 1500, "StockActuel": 8, "StockMin": 2 }
    ];
    const wsIngs = XLSX.utils.json_to_sheet(ingData);
    XLSX.utils.book_append_sheet(wb, wsIngs, "Ingredients");
    
    const ftData = [
      { "Plat_Nom": "Poulet DG Classique", "Ingredient_Nom": "Poulet Entier", "Quantite": 0.5 },
      { "Plat_Nom": "Poulet DG Classique", "Ingredient_Nom": "Plantain Mûr", "Quantite": 0.75 },
      { "Plat_Nom": "Jus d'Ananas Bio", "Ingredient_Nom": "Ananas", "Quantite": 0.4 },
      { "Plat_Nom": "Ndolé Viande", "Ingredient_Nom": "Feuilles de Ndolé", "Quantite": 0.3 }
    ];
    const wsFt = XLSX.utils.json_to_sheet(ftData);
    XLSX.utils.book_append_sheet(wb, wsFt, "Fiches Techniques");
    
    XLSX.writeFile(wb, "Modele_Catalogue_Import.xlsx");
    logsAction("Téléchargement du modèle Excel d'importation de catalogue", "CATALOGUE & REDÉFINITIONS");
    showToast("Fichier modèle Excel téléchargé !");
  };

  // Active Tenant filtering
  const tenantDishes = dishes.filter(d => d.tenantId === tenantId);
  const tenantIngredients = ingredients.filter(i => i.tenantId === tenantId);
  const tenantRecipes = recipes.filter(r => r.tenantId === tenantId);

  // Filter Search
  const [dishQuery, setDishQuery] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('ALL');

  const filteredTenantDishes = tenantDishes.filter(d => {
    if (selectedCatFilter !== 'ALL' && d.categoryId !== selectedCatFilter) return false;
    if (dishQuery) {
      const q = dishQuery.toLowerCase();
      return d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q);
    }
    return true;
  });

  // State for adding new Dish
  const [showAddDishModal, setShowAddDishModal] = useState(false);
  const [newDishCode, setNewDishCode] = useState('');
  const [newDishName, setNewDishName] = useState('');
  const [newDishPrice, setNewDishPrice] = useState(0);
  const [newDishUserCostPrice, setNewDishUserCostPrice] = useState(0);
  const [newDishCategory, setNewDishCategory] = useState(categories[0]?.id || '');
  const [newDishPrepTime, setNewDishPrepTime] = useState(15);
  const [newDishDesc, setNewDishDesc] = useState('');
  const [newDishImage, setNewDishImage] = useState('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop');

  // State for editing a Dish
  const [showEditDishModal, setShowEditDishModal] = useState(false);
  const [editingDish, setEditingDish] = useState<Dish | null>(null);
  const [editDishName, setEditDishName] = useState('');
  const [editDishPrice, setEditDishPrice] = useState(0);
  const [editDishUserCostPrice, setEditDishUserCostPrice] = useState(0);
  const [editDishCategory, setEditDishCategory] = useState('');
  const [editDishPrepTime, setEditDishPrepTime] = useState(15);
  const [editDishDesc, setEditDishDesc] = useState('');
  const [editDishImage, setEditDishImage] = useState('');

  // State for adding new Ingredient
  const [showAddIngModal, setShowAddIngModal] = useState(false);
  const [newIngCode, setNewIngCode] = useState('');
  const [newIngName, setNewIngName] = useState('');
  const [newIngUnit, setNewIngUnit] = useState('kg');
  const [newIngMinStock, setNewIngMinStock] = useState(5);
  const [newIngMaxStock, setNewIngMaxStock] = useState(50);
  const [newIngCMP, setNewIngCMP] = useState(1000);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [selectedIngCategoryId, setSelectedIngCategoryId] = useState<string>('cat-ing-raw');

  // States for interactive BOM/Recipe Editor
  const [selectedBOMDish, setSelectedBOMDish] = useState<string>(tenantDishes[0]?.id || '');
  const activeBOM = tenantRecipes.find(r => r.dishId === selectedBOMDish && r.active);
  const activeBOMDish = tenantDishes.find(d => d.id === selectedBOMDish);

  // Quick edit Recipe Lines state
  const [bIngredients, setBIngredients] = useState<{ id: string; qty: number; isSecondary?: boolean }[]>(() => {
    if (activeBOM) {
      return activeBOM.lines.map(line => ({ id: line.ingredientId, qty: line.quantity, isSecondary: line.isSecondary }));
    }
    return [];
  });

  // Sync BOM editor state when dish selected changes
  const handleSelectBOMDish = (dishId: string) => {
    setSelectedBOMDish(dishId);
    const targetBOM = tenantRecipes.find(r => r.dishId === dishId && r.active);
    if (targetBOM) {
      setBIngredients(targetBOM.lines.map(line => ({ id: line.ingredientId, qty: line.quantity, isSecondary: line.isSecondary })));
    } else {
      setBIngredients([]);
    }
  };

  const [bomIngToAdd, setBomIngToAdd] = useState('');
  const [bomIngQtyToAdd, setBomIngQtyToAdd] = useState(0.1);
  const [bomIngIsSecondary, setBomIngIsSecondary] = useState(false);

  // Add line to active Recipe editor
  const handleAddBOMLine = () => {
    if (!bomIngToAdd) return;
    const exists = bIngredients.some(b => b.id === bomIngToAdd);
    if (exists) return;
    setBIngredients([...bIngredients, { id: bomIngToAdd, qty: bomIngQtyToAdd, isSecondary: bomIngIsSecondary }]);
    setBomIngToAdd('');
    setBomIngQtyToAdd(0.1);
    setBomIngIsSecondary(false);
  };

  // Remove line from active Recipe editor
  const handleRemoveBOMLine = (ingId: string) => {
    setBIngredients(bIngredients.filter(b => b.id !== ingId));
  };

  // Adjust portion value
  const handleUpdateBOMPortion = (ingId: string, value: number) => {
    setBIngredients(bIngredients.map(b => b.id === ingId ? { ...b, qty: Math.max(0.001, value) } : b));
  };

  // Toggle primary vs secondary
  const handleToggleBOMSecondary = (ingId: string, isSec: boolean) => {
    setBIngredients(bIngredients.map(b => b.id === ingId ? { ...b, isSecondary: isSec } : b));
  };

  // Compute live total cost of current custom BOM elements (Part 2 Module 2.12 & 2.13)
  const computeLiveBOMCost = () => {
    let totalCostVal = 0;
    bIngredients.forEach(b => {
      const ingObj = tenantIngredients.find(i => i.id === b.id);
      if (ingObj) {
        totalCostVal += (ingObj.cmp || ingObj.lastPurchasePrice || 0) * b.qty;
      }
    });
    return Math.round(totalCostVal);
  };

  // Save active Custom Recipes formula
  const handleSaveRecipeBOM = () => {
    if (!selectedBOMDish) return;
    const computedCost = computeLiveBOMCost();

    // Find if a recipe exists, if not we will mock creation
    let recId = activeBOM?.id;
    if (!recId) {
      recId = `rec-${Date.now()}`;
    }

    // compile RecipeLines payload
    const finalLines: RecipeLine[] = bIngredients.map(b => ({
      ingredientId: b.id,
      quantity: b.qty,
      isSecondary: !!b.isSecondary
    }));

    onUpdateRecipe(selectedBOMDish, finalLines);

    // Also update parent cost and margins on Dish model itself (Cascade margins)
    const originalDish = tenantDishes.find(d => d.id === selectedBOMDish);
    if (originalDish) {
      const activePrice = originalDish.price;
      const margin = activePrice - computedCost;
      const marginPercent = activePrice > 0 ? parseFloat(((margin / activePrice) * 100).toFixed(1)) : 0;
      onUpdateDish({
        ...originalDish,
        theoreticalCost: computedCost,
        margin,
        marginPercent
      });
    }

    logsAction(`Formule de recette mise à jour pour le plat "${originalDish?.name}" (Coût recalculé: ${computedCost.toLocaleString()} FCFA)`, 'CATALOGUE & RECETTES');
    alert('Recette (BOM) enregistrée avec succès ! Le coût de revient et les marges du produit ont été mis à jour.');
  };

  // Submit new Dish
  const handleSubmitDish = () => {
    let finalCode = newDishCode;
    if (!finalCode) {
      let nextNum = tenantDishes.length + 1;
      finalCode = `PL-${String(nextNum).padStart(3, '0')}`;
      while (dishes.some(d => d.code === finalCode)) {
        nextNum++;
        finalCode = `PL-${String(nextNum).padStart(3, '0')}`;
      }
    }

    if (!newDishName || !newDishPrice) {
      alert('Veuillez renseigner tous les champs obligatoires');
      return;
    }

    // Calculations of User Cost margins
    const userRevient = newDishUserCostPrice;
    const userMarginVal = newDishPrice - userRevient;
    const userMarginPctVal = userRevient > 0 ? Math.round((userMarginVal / userRevient) * 100) : 0;

    const newDish: Dish = {
      id: `dish-${Date.now()}`,
      code: finalCode.toUpperCase(),
      name: newDishName,
      description: newDishDesc,
      categoryId: newDishCategory,
      image: newDishImage,
      price: newDishPrice,
      tvaApplicable: true,
      theoreticalCost: 0, // initially 0, needs Recipe
      margin: newDishPrice,
      marginPercent: 100,
      prepTime: newDishPrepTime,
      availablePOS: true,
      availableDelivery: true,
      availableTakeaway: true,
      active: true,
      tenantId,
      userCostPrice: userRevient,
      userMargin: userMarginVal,
      userMarginPercent: userMarginPctVal
    };

    onAddDish(newDish);
    logsAction(`Création du plat : ${newDish.code} - ${newDish.name} (Revient Resto: ${userRevient} FCFA)`, 'CATALOGUE & RECETTES');

    // Reset Form
    setShowAddDishModal(false);
    setNewDishCode('');
    setNewDishName('');
    setNewDishPrice(0);
    setNewDishUserCostPrice(0);
    setNewDishDesc('');
  };

  const handleOpenAddDishModal = () => {
    let nextNum = tenantDishes.length + 1;
    let candidateCode = `PL-${String(nextNum).padStart(3, '0')}`;
    while (dishes.some(d => d.code === candidateCode)) {
      nextNum++;
      candidateCode = `PL-${String(nextNum).padStart(3, '0')}`;
    }
    setNewDishCode(candidateCode);
    setNewDishName('');
    setNewDishPrice(0);
    setNewDishUserCostPrice(0);
    setNewDishDesc('');
    setNewDishImage('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop');
    setShowAddDishModal(true);
  };

  const handleOpenEditDishModal = (dish: Dish) => {
    setEditingDish(dish);
    setEditDishName(dish.name);
    setEditDishPrice(dish.price);
    setEditDishUserCostPrice(dish.userCostPrice || 0);
    setEditDishCategory(dish.categoryId);
    setEditDishPrepTime(dish.prepTime || 15);
    setEditDishDesc(dish.description || '');
    setEditDishImage(dish.image || '');
    setShowEditDishModal(true);
  };

  const handleSubmitEditDish = () => {
    if (!editingDish) return;
    if (!editDishName || !editDishPrice) {
      alert('Veuillez renseigner tous les champs obligatoires');
      return;
    }

    // Recalculate margins with edit dish price & user cost price
    const computedCost = editingDish.theoreticalCost || 0;
    const margin = editDishPrice - computedCost;
    const marginPercent = editDishPrice > 0 ? parseFloat(((margin / editDishPrice) * 100).toFixed(1)) : 0;

    const userRevient = editDishUserCostPrice;
    const userMarginVal = editDishPrice - userRevient;
    const userMarginPctVal = userRevient > 0 ? parseFloat(((userMarginVal / userRevient) * 100).toFixed(1)) : 0;

    const updatedDish: Dish = {
      ...editingDish,
      name: editDishName,
      price: editDishPrice,
      categoryId: editDishCategory,
      prepTime: editDishPrepTime,
      description: editDishDesc,
      image: editDishImage,
      margin,
      marginPercent,
      userCostPrice: userRevient,
      userMargin: userMarginVal,
      userMarginPercent: userMarginPctVal
    };

    onUpdateDish(updatedDish);
    logsAction(`Mise à jour du plat "${editDishName}" (Code: ${editingDish.code}, Revient Resto: ${userRevient} FCFA)`, 'CATALOGUE & REDÉFINITIONS');
    setShowEditDishModal(false);
    setEditingDish(null);
  };

  const handleDeleteDishClick = (dish: Dish) => {
    const confirmDelete = window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement le plat "${dish.name}" (Code: ${dish.code}) ?`);
    if (confirmDelete) {
      onDeleteDish(dish.id);
      logsAction(`Suppression définitive du plat "${dish.name}" (Code: ${dish.code})`, 'CATALOGUE & NETTOYAGES');
    }
  };

  // Submit new / edited Ingredient
  const handleSubmitIngredient = () => {
    if (!newIngCode || !newIngName || !newIngCMP) {
      alert('Veuillez renseigner le code, le nom et le coût unitaire moyen.');
      return;
    }

    if (editingIngredient) {
      const updatedIng: Ingredient = {
        ...editingIngredient,
        code: newIngCode.toUpperCase(),
        name: newIngName,
        categoryId: selectedIngCategoryId,
        unit: newIngUnit,
        stockMin: newIngMinStock,
        stockMax: newIngMaxStock,
        cmp: newIngCMP,
        lastPurchasePrice: newIngCMP,
      };
      if (onUpdateIngredient) {
        onUpdateIngredient(updatedIng);
      }
      logsAction(`Modification de la matière première : ${updatedIng.code} - ${updatedIng.name}`, 'CATALOGUE & RECETTES');
      showToast(`Matière première "${updatedIng.name}" modifiée avec succès!`, 'success');
    } else {
      const newIng: Ingredient = {
        id: `ing-${Date.now()}`,
        code: newIngCode.toUpperCase(),
        name: newIngName,
        description: '',
        categoryId: selectedIngCategoryId,
        unit: newIngUnit,
        stockActual: 0, // Starts at 0, needs purchase
        stockMin: newIngMinStock,
        stockMax: newIngMaxStock,
        cmp: newIngCMP,
        lastPurchasePrice: newIngCMP,
        active: true,
        tenantId
      };

      onAddIngredient(newIng);
      logsAction(`Matière première créée : ${newIng.code} - ${newIng.name}`, 'CATALOGUE & RECETTES');
      showToast(`Matière première "${newIng.name}" créée avec succès!`, 'success');
    }

    setShowAddIngModal(false);
    setEditingIngredient(null);
    setNewIngCode('');
    setNewIngName('');
    setSelectedIngCategoryId('cat-ing-raw');
  };

  const handleStartEditIngredient = (ing: Ingredient) => {
    setEditingIngredient(ing);
    setNewIngCode(ing.code);
    setNewIngName(ing.name);
    setNewIngUnit(ing.unit);
    setNewIngCMP(ing.cmp);
    setNewIngMinStock(ing.stockMin);
    setNewIngMaxStock(ing.stockMax);
    setSelectedIngCategoryId(ing.categoryId || 'cat-ing-raw');
    setShowAddIngModal(true);
  };

  const handleDeleteIngredientClick = (ing: Ingredient) => {
    const confirmDelete = window.confirm(`Êtes-vous sûr de vouloir supprimer définitivement l'ingrédient "${ing.name}" (Code: ${ing.code}) ? Attention, d'autres fiches techniques associées risquent d'être impactées.`);
    if (confirmDelete) {
      if (onDeleteIngredient) {
        onDeleteIngredient(ing.id);
      }
      logsAction(`Suppression définitive de l'ingrédient "${ing.name}" (Code: ${ing.code})`, 'CATALOGUE & RECETTES');
      showToast(`Matière première "${ing.name}" supprimée avec succès!`, 'success');
    }
  };

  const getIngredientCategoryName = (catId: string) => {
    if (catId === 'cat-ing-raw') return 'Matière première générale';
    return (ingredientCategories || []).find(c => c.id === catId)?.name || 'Matière première générale';
  };

  const getCategoryName = (catId: string) => {
    return categories.find(c => c.id === catId)?.name || 'Général';
  };

  return (
    <div className="space-y-6" id="catalogue-module">
      {/* Upper Module selector tabs: Odoo modular grid layout */}
      <div className="flex border-b border-gray-150">
        <button
          id="tab-catalog-dishes"
          onClick={() => setSubTab('DISHES')}
          className={`px-6 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            subTab === 'DISHES'
              ? 'border-[#1E4E8C] text-[#1E4E8C] bg-blue-50/20'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>Fiche des Plats & Menus</span>
        </button>
        <button
          id="tab-catalog-ingredients"
          onClick={() => setSubTab('INGREDIENTS')}
          className={`px-6 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            subTab === 'INGREDIENTS'
              ? 'border-[#1E4E8C] text-[#1E4E8C] bg-blue-50/20'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Ingrédients & Matières Premières</span>
        </button>
        <button
          id="tab-catalog-recipes"
          onClick={() => {
            setSubTab('RECIPES');
            if (tenantDishes.length > 0) handleSelectBOMDish(selectedBOMDish || tenantDishes[0].id);
          }}
          className={`px-6 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            subTab === 'RECIPES'
              ? 'border-[#1E4E8C] text-[#1E4E8C] bg-blue-50/20'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Activity className="h-4 w-4" />
          <span>Fiches Techniques (Recettes BOM)</span>
        </button>
        <button
          id="tab-catalog-import-excel"
          onClick={() => setSubTab('IMPORT_EXCEL')}
          className={`px-6 py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            subTab === 'IMPORT_EXCEL'
              ? 'border-[#1E4E8C] text-[#1E4E8C] bg-blue-50/20'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
          <span>Importation en masse (Excel)</span>
        </button>
      </div>

      {/* DISHES SUB-TAB */}
      {subTab === 'DISHES' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 rounded-lg border border-gray-150 shadow-2xs">
            <div className="flex gap-2 flex-1 max-w-lg">
              <input
                id="search-dish-input"
                type="text"
                placeholder="Filtrer les plats (Poulet DG, Ndolé, PL-COCA)..."
                value={dishQuery}
                onChange={(e) => setDishQuery(e.target.value)}
                className="w-full text-xs py-1.5 px-3 border border-gray-250 rounded-lg bg-gray-50 text-gray-950 focus:outline-none"
              />
              <select
                id="filter-dish-cat"
                value={selectedCatFilter}
                onChange={(e) => setSelectedCatFilter(e.target.value)}
                className="text-xs border rounded-lg px-2.5 py-1.5 bg-gray-50 text-gray-750"
              >
                <option value="ALL">Toutes catégories</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div className="flex gap-2 self-start md:self-auto">
              <button
                id="export-dishes-btn"
                onClick={() => {
                  const schema = filteredTenantDishes.map(d => ({
                    'Code': d.code,
                    'Désignation': d.name,
                    'Tarif (FCFA)': d.price,
                    'Temps Prépa (min)': d.prepTime,
                    'Coût Matière Théorique (FCFA)': d.theoreticalCost,
                    'Marge BOM (FCFA)': d.margin,
                    'Marge BOM %': `${d.marginPercent}%`,
                    'Coût de revient Resto (FCFA)': d.userCostPrice || 0,
                    'Marge brute resto (FCFA)': d.userMargin || 0,
                    'Marge resto %': d.userMarginPercent ? `${d.userMarginPercent}%` : '0%'
                  }));
                  import('../utils/export').then(m => m.exportToExcel(schema, 'Catalogue_Plats', 'Rapport_Plats_Resto'));
                }}
                className="px-3.5 py-2 border border-gray-250 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
                title="Exporter la liste des plats sous Excel"
              >
                <Download className="h-4 w-4 text-green-700" />
                <span className="hidden sm:inline">Exporter Plats</span>
              </button>

              <button
                id="add-new-dish-btn"
                onClick={handleOpenAddDishModal}
                className="px-4 py-2 bg-[#1E4E8C] hover:bg-blue-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Créer Plat / Produit</span>
              </button>
            </div>
          </div>

          {/* Grid of dishes item details */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTenantDishes.map((dish) => (
              <div key={dish.id} className="relative group bg-white rounded-lg border border-gray-150 overflow-hidden shadow-2xs flex flex-col justify-between hover:border-blue-400 transition-colors">
                
                {/* Actions overlay for editing/deleting */}
                <div className="absolute top-2 right-2 flex items-center gap-1 bg-white/90 backdrop-blur-xs p-1 rounded-md border border-gray-150 shadow-2xs opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleOpenEditDishModal(dish)}
                    title="Modifier"
                    className="p-1 text-gray-550 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteDishClick(dish)}
                    title="Supprimer"
                    className="p-1 text-gray-550 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex gap-3 p-4">
                  <div className="h-20 w-20 rounded-lg overflow-hidden bg-gray-50 border shrink-0">
                    <img src={dish.image} alt={dish.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="space-y-1 pr-14 flex-1">
                    <span className="text-[10px] font-mono font-bold text-gray-550 border px-1.5 py-0.2 rounded-sm bg-gray-50">
                      {dish.code}
                    </span>
                    <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">{dish.name}</h3>
                    <p className="text-[11px] text-gray-500 line-clamp-1 leading-relaxed">{dish.description || 'Aucune description disponible'}</p>

                    {/* Costing grid detail section */}
                    <div className="grid grid-cols-2 gap-x-2 pt-1 text-[10px] text-gray-400 font-medium leading-normal border-t border-gray-100 mt-1.5">
                      <div>
                        <span>Revient Resto: </span>
                        <strong className="text-gray-800 font-mono">{dish.userCostPrice ? `${dish.userCostPrice.toLocaleString()} F` : 'N/A'}</strong>
                      </div>
                      <div>
                        <span>Marge brute resto: </span>
                        <strong className="text-[#1E4E8C] font-mono">{dish.userMargin ? `${dish.userMargin.toLocaleString()} F` : 'N/A'}</strong>
                      </div>
                      <div>
                        <span>% Marge resto: </span>
                        <strong className="text-indigo-600 font-mono">{dish.userMarginPercent ? `${dish.userMarginPercent}%` : 'N/A'}</strong>
                      </div>
                      <div>
                        <span>% Marge matière: </span>
                        <strong className="text-emerald-600 font-mono">
                          {dish.theoreticalCost ? `${Math.round(((dish.price - dish.theoreticalCost) / dish.theoreticalCost) * 100)}%` : 'N/A'}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3 bg-gray-50 border-t flex items-center justify-between text-xs">
                  <div>
                    <span className="text-gray-500 block text-[10px] uppercase">Prix Public</span>
                    <span className="font-bold text-gray-900 font-mono">{dish.price.toLocaleString()} FCFA</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] uppercase">Coût Matière BOM</span>
                    <span className="font-bold text-gray-700 font-mono">{dish.theoreticalCost ? `${dish.theoreticalCost.toLocaleString()} FCFA` : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] uppercase">Marge BOM</span>
                    <span className={`font-bold font-mono ${dish.marginPercent >= 50 ? 'text-green-600' : 'text-amber-650'}`}>
                      {dish.margin ? `${dish.marginPercent}%` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INGREDIENTS SUB-TAB */}
      {subTab === 'INGREDIENTS' && (
        <div className="space-y-4">
          <div className="sm:flex sm:items-center sm:justify-between bg-white p-4 rounded-lg border border-gray-150 shadow-2xs">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Ingrédients de Cuisine & Stocks Réels</h3>
              <p className="text-xs text-gray-500 mt-1">Bibliothèque d'ingrédients bruts liés au calcul des recettes et fiche de stock.</p>
            </div>
            
            <div className="flex items-center gap-2 self-start md:self-auto mt-3 sm:mt-0">
              <button
                id="export-ingredients-btn"
                onClick={() => {
                  const schema = tenantIngredients.map(ing => ({
                    'Code': ing.code,
                    'Désignation': ing.name,
                    'Catégorie': getIngredientCategoryName(ing.categoryId),
                    'Unité': ing.unit,
                    'Dernier Prix Achat (FCFA)': ing.lastPurchasePrice || ing.cmp,
                    'Coût Moyen CMP (FCFA)': ing.cmp,
                    'Stock Min (Sécurité)': ing.stockMin,
                    'Stock Actuel': ing.stockActual
                  }));
                  import('../utils/export').then(m => m.exportToExcel(schema, 'Ingrédients', 'Rapport_Matières_Premières'));
                }}
                className="px-3.5 py-2 border border-gray-250 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs transition"
                title="Exporter les matières premières au format Excel"
              >
                <Download className="h-4 w-4 text-green-700" />
                <span className="hidden sm:inline">Exporter Ingrédients</span>
              </button>

              <button
                id="add-new-ing-btn"
                onClick={() => setShowAddIngModal(true)}
                className="px-4 py-2 bg-[#1E4E8C] hover:bg-blue-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Créer Ingrédient</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-150 rounded-lg overflow-hidden shadow-2xs">
            <table className="w-full text-xs text-left text-gray-600 font-medium">
              <thead className="text-[10px] uppercase font-bold tracking-wider text-gray-500 bg-gray-50 border-b">
                <tr>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Désignation</th>
                  <th className="px-5 py-3">Catégorie</th>
                  <th className="px-5 py-2">Unité</th>
                  <th className="px-5 py-3 text-right">Dernier prix d'Achat</th>
                  <th className="px-5 py-3 text-right">Coût unitaire moyen (CMP)</th>
                  <th className="px-5 py-3 text-right">Stock de sécurité min</th>
                  <th className="px-5 py-3 text-right">Stock actuel</th>
                  <th className="px-5 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                {tenantIngredients.map(ing => (
                  <tr key={ing.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3.5 font-mono text-gray-950 font-bold">{ing.code}</td>
                    <td className="px-5 py-3.5">{ing.name}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] uppercase tracking-wide font-bold">
                        {getIngredientCategoryName(ing.categoryId)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">{ing.unit}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-gray-900 border-r border-gray-55">
                      {(ing.lastPurchasePrice || ing.cmp).toLocaleString()} FCFA
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-gray-900 bg-blue-50/20 font-semibold">
                      {ing.cmp?.toLocaleString()} FCFA
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-gray-550">{ing.stockMin} {ing.unit}</td>
                    <td className="px-5 py-3.5 text-right font-mono">
                      <span className={`px-2 py-0.5 rounded-sm font-bold ${
                        ing.stockActual <= 0 ? 'bg-red-100 text-red-800' :
                        ing.stockActual <= ing.stockMin ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-900'
                      }`}>
                        {ing.stockActual.toFixed(1)} {ing.unit}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex justify-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleStartEditIngredient(ing)}
                          className="px-2 py-1 bg-blue-50 text-[#1E4E8C] hover:bg-blue-100 rounded text-[10px] font-bold cursor-pointer transition flex items-center gap-1"
                          title="Modifier l'ingrédient"
                        >
                          <Edit className="h-3 w-3" />
                          <span>Modifier</span>
                        </button>
                        <button
                          onClick={() => handleDeleteIngredientClick(ing)}
                          className="px-2 py-1 bg-rose-50 text-red-700 hover:bg-rose-100 rounded text-[10px] font-bold cursor-pointer transition flex items-center gap-1"
                          title="Supprimer l'ingrédient"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Supprimer</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RECIPES/BOM EDITOR SUB-TAB */}
      {subTab === 'RECIPES' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: dishes list selector */}
          <div className="bg-white rounded-lg border border-gray-150 p-4 space-y-3 h-[525px] overflow-y-auto">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sélectionnez un Plat</h3>
            <div className="space-y-1">
              {tenantDishes.map(dish => (
                <div
                  key={dish.id}
                  onClick={() => handleSelectBOMDish(dish.id)}
                  className={`p-2 rounded-lg cursor-pointer text-xs font-semibold flex items-center justify-between transition-colors ${
                    selectedBOMDish === dish.id
                      ? 'bg-[#1E4E8C] text-white shadow-xs'
                      : 'hover:bg-gray-50 text-gray-750'
                  }`}
                >
                  <div className="truncate pr-2">
                    <span className="text-[10px] block opacity-80 font-mono">{dish.code}</span>
                    <span className="block truncate">{dish.name}</span>
                  </div>
                  <span className="font-mono text-[10px] whitespace-nowrap bg-black/10 px-1.5 py-0.5 rounded-sm">
                    {dish.price.toLocaleString()} F
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel: Recipe lines and cost parameters */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-gray-150 shadow-2xs p-6 flex flex-col justify-between h-[525px]">
            {activeBOMDish ? (
              <div className="space-y-4 overflow-y-auto flex-1 pr-1">
                {/* Header indicators */}
                <div className="flex border-b border-gray-100 pb-3 justify-between items-start gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Nomenclature Recette (BOM) : {activeBOMDish.name}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Associez des portions de matières premières pour calculer automatiquement les fiches de marge.</p>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-300 rounded px-2 py-0.5 font-bold">
                    Version Actuelle: v1
                  </span>
                </div>

                {/* Sub-form to add raw ingredients to line structure */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end bg-gray-50 p-3 rounded-lg">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase tracking-wide block font-semibold">Matière Première</label>
                    <select
                      id="bom-add-ing-select"
                      value={bomIngToAdd}
                      onChange={(e) => setBomIngToAdd(e.target.value)}
                      className="w-full text-xs p-1.5 border rounded bg-white focus:outline-none"
                    >
                      <option value="">-- Choisir ingrédient --</option>
                      {tenantIngredients.map(ing => (
                        <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase tracking-wide block font-semibold">Portion requise</label>
                    <input
                      id="bom-add-qty-input"
                      type="number"
                      step={0.01}
                      min={0.001}
                      value={bomIngQtyToAdd}
                      onChange={(e) => setBomIngQtyToAdd(Math.max(0.001, parseFloat(e.target.value) || 0))}
                      className="w-full text-xs p-1.5 border rounded bg-white text-gray-950 focus:outline-none focus:ring-1"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-500 uppercase tracking-wide block font-semibold">Classification</label>
                    <select
                      id="bom-add-type-select"
                      value={bomIngIsSecondary ? 'secondary' : 'principal'}
                      onChange={(e) => setBomIngIsSecondary(e.target.value === 'secondary')}
                      className="w-full text-xs p-1.5 border rounded bg-white focus:outline-none"
                    >
                      <option value="principal">Ingrédient Principal</option>
                      <option value="secondary">Ingrédient Secondaire</option>
                    </select>
                  </div>
                  <button
                    id="bom-add-line-btn"
                    onClick={handleAddBOMLine}
                    disabled={!bomIngToAdd}
                    className="p-1 px-4 text-xs font-semibold bg-[#1E4E8C] text-white hover:bg-blue-800 rounded py-1.5 disabled:opacity-50 flex items-center justify-center h-[34px]"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Ajouter portion
                  </button>
                </div>

                {/* Table list of ingredients active in recipe */}
                <div className="border rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left bg-white text-gray-600">
                    <thead className="bg-gray-100 text-[10px] font-bold text-gray-550 border-b">
                      <tr>
                        <th className="px-4 py-2">Composant de base</th>
                        <th className="px-4 py-2">Classification</th>
                        <th className="px-4 py-2 text-center">Quantité unitaire</th>
                        <th className="px-4 py-2">Unité de mesure</th>
                        <th className="px-4 py-2 text-right">Coût Moyen CMP</th>
                        <th className="px-4 py-2 text-right">Montant valorisé</th>
                        <th className="px-4 py-2 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y font-semibold">
                      {bIngredients.map((ingLine) => {
                        const rawIng = tenantIngredients.find(i => i.id === ingLine.id);
                        const ingCost = rawIng ? (rawIng.cmp || rawIng.lastPurchasePrice || 0) : 0;
                        const lineValue = Math.round(ingCost * ingLine.qty);
                        return (
                          <tr key={ingLine.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 font-bold text-gray-800">{rawIng?.name || 'Inconnu'}</td>
                            <td className="px-4 py-2">
                              <select
                                id={`bom-classification-${ingLine.id}`}
                                value={ingLine.isSecondary ? 'secondary' : 'principal'}
                                onChange={(e) => handleToggleBOMSecondary(ingLine.id, e.target.value === 'secondary')}
                                className="p-1 text-[11px] border rounded bg-white focus:outline-none font-medium text-gray-750"
                              >
                                <option value="principal">⭐ Principal</option>
                                <option value="secondary">🌿 Secondaire</option>
                              </select>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <input
                                id={`bom-qty-${ingLine.id}`}
                                type="number"
                                step={0.01}
                                value={ingLine.qty}
                                onChange={(e) => handleUpdateBOMPortion(ingLine.id, parseFloat(e.target.value) || 0)}
                                className="w-16 p-0.5 text-center border rounded bg-white text-gray-905"
                              />
                            </td>
                            <td className="px-4 py-2 text-gray-550">{rawIng?.unit}</td>
                            <td className="px-4 py-2 text-right font-mono text-gray-500">{ingCost.toLocaleString()} F</td>
                            <td className="px-4 py-2 text-right font-mono text-gray-905">{lineValue.toLocaleString()} FCFA</td>
                            <td className="px-4 py-2 text-center">
                              <button
                                onClick={() => handleRemoveBOMLine(ingLine.id)}
                                className="p-1 text-red-500 hover:bg-red-50 rounded"
                                title="Supprimer"
                              >
                                <Trash2 className="h-4 w-4 mx-auto" strokeWidth={2.5} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}

                      {bIngredients.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-gray-400 font-normal">
                            Nomenclature vierge. Saisissez des ingrédients ci-dessus pour composer la recette.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                <ClipboardList className="h-12 w-12 text-gray-300 mb-2" />
                <p className="text-sm font-semibold">Aucun plat configuré</p>
                <p className="text-xs mt-0.5">Rendez-vous sur l'onglet Plat pour en créer un dans l'ERP.</p>
              </div>
            )}

            {activeBOMDish && (
              <div className="border-t border-gray-150 pt-4 mt-4 space-y-4">
                {/* Visual mathematical margins strip (Part 2 Module 2.12 & 2.13) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-3 rounded-lg border text-xs">
                  <div>
                    <span className="text-gray-500 block text-[10px] uppercase">Prix de vente:</span>
                    <strong className="font-mono text-gray-950 block">{activeBOMDish.price.toLocaleString()} FCFA</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] uppercase">Coût de revient matière:</span>
                    <strong className="font-mono text-gray-950 block">{computeLiveBOMCost().toLocaleString()} FCFA</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] uppercase">Marge brute espérée:</span>
                    <strong className="font-mono text-emerald-600 block">{(activeBOMDish.price - computeLiveBOMCost()).toLocaleString()} FCFA</strong>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px] uppercase">Marge % :</span>
                    <strong className={`font-mono block ${(activeBOMDish.price - computeLiveBOMCost()) / activeBOMDish.price >= 0.5 ? 'text-green-600' : 'text-amber-600'}`}>
                      {(((activeBOMDish.price - computeLiveBOMCost()) / activeBOMDish.price) * 100 || 0).toFixed(1)}%
                    </strong>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    id="save-recipe-bom-btn"
                    onClick={handleSaveRecipeBOM}
                    className="px-6 py-2.5 bg-[#1E4E8C] text-white hover:bg-blue-800 hover:shadow shadow-xs text-xs font-semibold rounded-lg"
                  >
                    Enregistrer Recette (BOM)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EXCEL IMPORT SUB-TAB */}
      {subTab === 'IMPORT_EXCEL' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-[#1E4E8C] flex items-center gap-1.5">
                <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                <span>Assistant d'Importation de Données Excel (Catalogue & Recettes)</span>
              </h4>
              <p className="text-xs text-gray-600">
                Configurez rapidement votre établissement en important en masse votre catalogue de plats, vos ingrédients de base et les fiches techniques des recettes (BOM).
              </p>
            </div>
            <button
              id="btn-download-sample-excel-catalog"
              onClick={downloadSampleExcel}
              className="px-4 py-2 bg-white hover:bg-gray-50 text-gray-750 text-xs font-bold border border-gray-250 rounded shadow-2xs flex items-center justify-center gap-1.5 transition shrink-0 cursor-pointer"
            >
              <Download className="h-4 w-4 text-blue-600" />
              <span>Télécharger le Fichier Modèle</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* COLUMN 1: WIDGET UPLOAD & PREVIEW */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white p-6 border border-gray-200 rounded-xl shadow-2xs space-y-4">
                <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider pb-2 border-b">
                  1. Charger le Fichier Excel
                </h3>

                {/* Drag and drop input */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#1E4E8C] hover:bg-gray-50/50 transition duration-150 group"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleExcelImport(file);
                    }}
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                  />
                  <div className="p-3 bg-blue-50 text-[#1E4E8C] rounded-full group-hover:scale-110 transition duration-155">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-extrabold text-[#1E4E8C]">Sélectionner ou Glisser le fichier excel</p>
                    <p className="text-[10px] text-gray-400 mt-1">Accepte les formats .xlsx, .xls, .csv</p>
                  </div>
                </div>

                {/* State: Idle / Parsed / Saved */}
                {importStatus !== 'IDLE' && (
                  <div className="space-y-4 pt-2">
                    <div className="bg-gray-50 rounded p-4 text-xs space-y-3">
                      <span className="font-bold text-gray-900 block border-b pb-1">Statut de l'Analyse :</span>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] font-semibold">
                          <span className="text-gray-500">Plats et Menus :</span>
                          <span className="font-mono bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">
                            {importSummary.dishes.length} trouvé(s)
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-semibold">
                          <span className="text-gray-500">Matières Premières :</span>
                          <span className="font-mono bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                            {importSummary.ingredients.length} trouvé(s)
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-semibold">
                          <span className="text-gray-500">Recettes (Liaisons BOM) :</span>
                          <span className="font-mono bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                            {importSummary.recipes.length} trouvé(s)
                          </span>
                        </div>
                      </div>

                      {/* Display parsing logs */}
                      <div className="bg-gray-950 text-gray-100 p-2.5 rounded font-mono text-[10px] max-h-36 overflow-y-auto leading-relaxed space-y-1">
                        {importSummary.logs.map((log, lidx) => (
                          <div key={lidx}>{log}</div>
                        ))}
                      </div>
                    </div>

                    {importStatus === 'PARSED' && (
                      <button
                        id="btn-execute-excel-import-catalog"
                        onClick={handleExecuteImport}
                        className="w-full py-2.5 bg-green-700 hover:bg-green-800 text-white font-extrabold rounded text-xs flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs cursor-pointer select-none active:scale-98 transition transform duration-155"
                      >
                        <CheckCircle className="h-4.5 w-4.5" />
                        <span>Confirmer l'Importation Réelle</span>
                      </button>
                    )}

                    {importStatus === 'SAVED' && (
                      <div className="p-3 bg-emerald-50 text-emerald-850 border border-emerald-200 rounded text-center text-xs font-bold leading-relaxed">
                        🎉 Données du catalogue stockées avec succès dans l'établissement ! Tous les codes d'articles et matières premières ont été générés de manière unique automatiquement.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* COLUMN 2: EXCEL STRUCTURE GUIDE */}
            <div className="lg:col-span-3 bg-white p-6 border border-gray-200 rounded-xl shadow-2xs space-y-5">
              <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider pb-2 border-b">
                Structure de Gabarit Obligatoire des Onglets
              </h3>

              <p className="text-xs text-gray-500 leading-relaxed">
                Votre fichier Excel doit être structuré avec **trois onglets séparés** (ou au moins l'un d'entre eux). Le système détecte automatiquement les colonnes correspondantes. Les identifiants uniques et <strong>les codes d'articles sont générés de manière entièrement automatique</strong>.
              </p>

              <div className="space-y-6">
                {/* 1. Onglet Plats & Menus */}
                <div className="space-y-2">
                  <span className="text-xs font-extrabold text-[#1E4E8C] block">
                    Onglet 1 : « Plats & Menus »
                  </span>
                  <p className="text-[11px] text-gray-650">Définit les plats vendus aux clients (avec affectation automatique ou création de nouvelles catégories).</p>
                  
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-[11px] text-left">
                      <thead>
                        <tr className="bg-gray-50 text-gray-700 border-b border-gray-200 font-bold">
                          <th className="p-2 font-mono text-[10px]">Nom</th>
                          <th className="p-2 font-mono text-[10px]">Description</th>
                          <th className="p-2 font-mono text-[10px]">Prix</th>
                          <th className="p-2 font-mono text-[10px]">Categorie</th>
                          <th className="p-2 font-mono text-[10px]">TempsPrep</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-150">
                        <tr className="text-gray-650">
                          <td className="p-2 font-semibold text-gray-850">Poulet DG Classique</td>
                          <td className="p-2 italic text-gray-400">Poulet sauté aux plantains mûrs...</td>
                          <td className="p-2 font-mono text-gray-800">4500</td>
                          <td className="p-2 text-gray-800 font-semibold text-blue-600">RESTO</td>
                          <td className="p-2 font-mono">25</td>
                        </tr>
                        <tr className="text-gray-655">
                          <td className="p-2 font-semibold text-gray-850">Jus d'Ananas Bio</td>
                          <td className="p-2 italic text-gray-400">Jus d'ananas pressé frais...</td>
                          <td className="p-2 font-mono text-gray-800">1500</td>
                          <td className="p-2 text-gray-800 font-semibold text-emerald-600">BOISSON</td>
                          <td className="p-2 font-mono">5</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="text-[10px] text-gray-400 italic font-semibold">
                    * Note : Si la Catégorie n'existe pas dans le catalogue, elle sera automatiquement initiée de manière fluide.
                  </div>
                </div>

                {/* 2. Onglet Ingrédients */}
                <div className="space-y-2">
                  <span className="text-xs font-extrabold text-amber-700 block">
                    Onglet 2 : « Ingredients » ou « Ingrédients »
                  </span>
                  <p className="text-[11px] text-gray-655">Modélise la liste des matières premières stockées et valorisées.</p>
                  
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-[11px] text-left">
                      <thead>
                        <tr className="bg-gray-50 text-gray-700 border-b border-gray-200 font-bold">
                          <th className="p-2 font-mono text-[10px]">Nom</th>
                          <th className="p-2 font-mono text-[10px]">Unite</th>
                          <th className="p-2 font-mono text-[10px]">CoutUnitaire</th>
                          <th className="p-2 font-mono text-[10px]">StockActuel</th>
                          <th className="p-2 font-mono text-[10px]">StockMin</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-150">
                        <tr className="text-gray-655">
                          <td className="p-2 font-semibold text-gray-855">Poulet Entier</td>
                          <td className="p-2 text-gray-750">kg</td>
                          <td className="p-2 font-mono text-gray-800">2200</td>
                          <td className="p-2 font-mono text-gray-750">15</td>
                          <td className="p-2 font-mono text-red-650">5</td>
                        </tr>
                        <tr className="text-gray-655">
                          <td className="p-2 font-semibold text-gray-855">Plantain Mûr</td>
                          <td className="p-2 text-gray-750">kg</td>
                          <td className="p-2 font-mono text-gray-800">800</td>
                          <td className="p-2 font-mono text-gray-750">30</td>
                          <td className="p-2 font-mono text-red-650">10</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. Onglet Fiches Techniques */}
                <div className="space-y-2">
                  <span className="text-xs font-extrabold text-emerald-700 block">
                    Onglet 3 : « Fiches Techniques » ou « Recettes »
                  </span>
                  <p className="text-[11px] text-gray-655">Organise les doses (Recettes BOM / Fiches Ratios) entre les produits finis et leurs constituants.</p>
                  
                  <div className="overflow-x-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-[11px] text-left">
                      <thead>
                        <tr className="bg-gray-50 text-gray-700 border-b border-gray-200 font-bold">
                          <th className="p-2 font-mono text-[10px]">Plat_Nom</th>
                          <th className="p-2 font-mono text-[10px]">Ingredient_Nom</th>
                          <th className="p-2 font-mono text-[10px]">Quantite</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-150">
                        <tr className="text-gray-655">
                          <td className="p-2 font-semibold text-gray-855">Poulet DG Classique</td>
                          <td className="p-2 text-gray-750">Poulet Entier</td>
                          <td className="p-2 font-mono font-bold text-gray-850">0.5</td>
                        </tr>
                        <tr className="text-gray-655">
                          <td className="p-2 font-semibold text-gray-855">Poulet DG Classique</td>
                          <td className="p-2 text-gray-750">Plantain Mûr</td>
                          <td className="p-2 font-mono font-bold text-gray-855">0.75</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-emerald-50 text-emerald-850 p-3 rounded text-[10.5px] leading-relaxed font-semibold">
                    💡 <strong>Calcul de marge atomique</strong> : Le système recalculera instantanément le coût théorique des plats et ré-estimera vos pourcentages de marges brut attendus suite aux fiches techniques importées.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DISH ADD MODAL */}
      {showAddDishModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 border shadow-2xl relative">
            <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b flex items-center gap-1.5">
              <Sparkles className="h-5 w-5 text-[#1E4E8C]" />
              Créer Nouveau Plat / Article Resto
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-550 block font-medium">Code Plat (Automatique)</label>
                  <input
                    id="new-dish-code-input"
                    type="text"
                    disabled
                    value={newDishCode}
                    placeholder="Généré..."
                    className="w-full p-2 border border-gray-200 bg-gray-50 text-gray-500 rounded font-mono select-none cursor-not-allowed text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-650 block font-medium">Prix Public (FCFA) *</label>
                  <input
                    id="new-dish-price-input"
                    type="number"
                    placeholder="ex: 4000..."
                    value={newDishPrice || ''}
                    onChange={(e) => setNewDishPrice(parseInt(e.target.value) || 0)}
                    className="w-full p-2 border border-gray-250 rounded text-gray-950 focus:outline-none focus:ring-1 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-650 block font-medium">Désignation *</label>
                <input
                  id="new-dish-name-input"
                  type="text"
                  placeholder="ex: Yassa de Poulet, etc..."
                  value={newDishName}
                  onChange={(e) => setNewDishName(e.target.value)}
                  className="w-full p-2 border border-gray-250 rounded text-gray-950 focus:outline-none focus:ring-1 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-650 block font-medium font-bold text-gray-900">Coût de revient Resto (FCFA)</label>
                  <input
                    id="new-dish-user-cost-input"
                    type="number"
                    placeholder="ex: 1500..."
                    value={newDishUserCostPrice || ''}
                    onChange={(e) => setNewDishUserCostPrice(parseInt(e.target.value) || 0)}
                    className="w-full p-2 border border-gray-250 rounded text-gray-950 focus:outline-none focus:ring-1 text-xs"
                  />
                </div>
                <div className="space-y-1 bg-gray-50 p-2 rounded border border-gray-200 flex flex-col justify-center">
                  <span className="font-extrabold text-[9px] uppercase text-[#1E4E8C]">Détails Marges Resto</span>
                  <div className="flex justify-between text-[9px] text-gray-500 font-bold mt-0.5">
                    <span>Marge brute (F) :</span>
                    <span className="font-bold text-emerald-600 font-mono">{(newDishPrice - newDishUserCostPrice).toLocaleString()} F</span>
                  </div>
                  <div className="flex justify-between text-[9px] text-gray-500 font-bold">
                    <span>Marge % resto :</span>
                    <span className="font-bold text-indigo-650 font-mono">
                      {newDishUserCostPrice > 0 ? Math.round(((newDishPrice - newDishUserCostPrice) / newDishUserCostPrice) * 100) : 0} %
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-650 block font-medium">Catégorie RESTO</label>
                  <select
                    id="new-dish-cat-select"
                    value={newDishCategory}
                    onChange={(e) => setNewDishCategory(e.target.value)}
                    className="w-full p-2 border border-gray-250 rounded bg-white text-gray-750 focus:outline-none text-xs"
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-gray-650 block font-medium">Temps Prep. (min)</label>
                  <input
                    id="new-dish-preptime-input"
                    type="number"
                    value={newDishPrepTime}
                    onChange={(e) => setNewDishPrepTime(parseInt(e.target.value) || 15)}
                    className="w-full p-2 border border-gray-250 rounded text-gray-950 focus:outline-none focus:ring-1 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-650 block font-medium">Description Commerciale</label>
                <textarea
                  id="new-dish-desc-input"
                  rows={2}
                  placeholder="Inscrivez la composition commerciale visible en POS..."
                  value={newDishDesc}
                  onChange={(e) => setNewDishDesc(e.target.value)}
                  className="w-full p-2 border border-gray-250 rounded text-gray-950 focus:outline-none focus:ring-1 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-650 block font-medium">Image du plat *</label>
                
                <div 
                  className="border-2 border-dashed border-gray-250 hover:border-[#1E4E8C] rounded-lg p-3 text-center bg-gray-50 hover:bg-blue-50/20 transition cursor-pointer relative"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type.startsWith('image/')) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        if (event.target?.result) {
                          setNewDishImage(event.target.result as string);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  onClick={() => document.getElementById('new-dish-image-input')?.click()}
                >
                  <input
                    id="new-dish-image-input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target?.result) {
                            setNewDishImage(event.target.result as string);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />

                  {newDishImage ? (
                    <div className="flex flex-col items-center gap-2 py-1">
                      <img 
                        src={newDishImage} 
                        alt="Aperçu" 
                        className="h-16 w-28 object-cover rounded-md border border-gray-200 shadow-2xs"
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-[10px] text-[#1E4E8C] font-semibold hover:underline">
                        Modifier l'image (cliquer ou glisser)
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-2.5">
                      <Upload className="h-7 w-7 text-gray-400 mb-1" />
                      <p className="font-semibold text-gray-700 text-[10px]">
                        Ajouter une image du plat
                      </p>
                      <p className="text-gray-400 text-[9px] mt-0.5">
                        Glissez-déposez une image ou cliquez pour parcourir
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-5 pt-3 border-t">
              <button
                id="cancel-add-dish-btn"
                onClick={() => setShowAddDishModal(false)}
                className="px-4 py-2 bg-gray-100 rounded text-gray-700 hover:bg-gray-200 text-xs"
              >
                Annuler
              </button>
              <button
                id="submit-add-dish-btn"
                onClick={handleSubmitDish}
                className="px-4 py-2 bg-[#1E4E8C] text-white font-bold rounded hover:bg-blue-800 text-xs"
              >
                Inscrire Nouveau Plat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISH EDIT MODAL */}
      {showEditDishModal && editingDish && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 border shadow-2xl relative">
            <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b flex items-center gap-1.5">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Modifier le Plat : {editingDish.code}
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-550 block font-medium">Code Plat (Non modifiable)</label>
                  <input
                    id="edit-dish-code-input"
                    type="text"
                    disabled
                    value={editingDish.code}
                    className="w-full p-2 border border-gray-200 bg-gray-50 text-gray-400 rounded font-mono select-none cursor-not-allowed text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-650 block font-medium">Prix Public (FCFA) *</label>
                  <input
                    id="edit-dish-price-input"
                    type="number"
                    placeholder="ex: 4000..."
                    value={editDishPrice || ''}
                    onChange={(e) => setEditDishPrice(parseInt(e.target.value) || 0)}
                    className="w-full p-2 border border-gray-250 rounded text-gray-950 focus:outline-none focus:ring-1 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-650 block font-medium">Désignation *</label>
                <input
                  id="edit-dish-name-input"
                  type="text"
                  placeholder="ex: Yassa de Poulet, etc..."
                  value={editDishName}
                  onChange={(e) => setEditDishName(e.target.value)}
                  className="w-full p-2 border border-gray-250 rounded text-gray-950 focus:outline-none focus:ring-1 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-650 block font-medium font-bold text-gray-900">Coût de revient Resto (FCFA)</label>
                  <input
                    id="edit-dish-user-cost-input"
                    type="number"
                    placeholder="ex: 1500..."
                    value={editDishUserCostPrice || ''}
                    onChange={(e) => setEditDishUserCostPrice(parseInt(e.target.value) || 0)}
                    className="w-full p-2 border border-gray-250 rounded text-gray-950 focus:outline-none focus:ring-1 text-xs"
                  />
                </div>
                <div className="space-y-1 bg-gray-50 p-2 rounded border border-gray-200 flex flex-col justify-center">
                  <span className="font-extrabold text-[9px] uppercase text-[#1E4E8C]">Détails Marges Resto</span>
                  <div className="flex justify-between text-[9px] text-gray-500 font-bold mt-0.5">
                    <span>Marge brute (F) :</span>
                    <span className="font-bold text-emerald-600 font-mono">{(editDishPrice - editDishUserCostPrice).toLocaleString()} F</span>
                  </div>
                  <div className="flex justify-between text-[9px] text-gray-500 font-bold">
                    <span>Marge % resto :</span>
                    <span className="font-bold text-indigo-650 font-mono">
                      {editDishUserCostPrice > 0 ? Math.round(((editDishPrice - editDishUserCostPrice) / editDishUserCostPrice) * 100) : 0} %
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-650 block font-medium">Catégorie RESTO</label>
                  <select
                    id="edit-dish-cat-select"
                    value={editDishCategory}
                    onChange={(e) => setEditDishCategory(e.target.value)}
                    className="w-full p-2 border border-gray-250 rounded bg-white text-gray-750 focus:outline-none text-xs"
                  >
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-gray-650 block font-medium">Temps Prep. (min)</label>
                  <input
                    id="edit-dish-preptime-input"
                    type="number"
                    value={editDishPrepTime}
                    onChange={(e) => setEditDishPrepTime(parseInt(e.target.value) || 15)}
                    className="w-full p-2 border border-gray-250 rounded text-gray-950 focus:outline-none focus:ring-1 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-gray-650 block font-medium">Description Commerciale</label>
                <textarea
                  id="edit-dish-desc-input"
                  rows={2}
                  placeholder="Inscrivez la composition commerciale visible en POS..."
                  value={editDishDesc}
                  onChange={(e) => setEditDishDesc(e.target.value)}
                  className="w-full p-2 border border-gray-250 rounded text-gray-950 focus:outline-none focus:ring-1 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-650 block font-medium">Image du plat *</label>
                
                <div 
                  className="border-2 border-dashed border-gray-250 hover:border-[#1E4E8C] rounded-lg p-3 text-center bg-gray-50 hover:bg-blue-50/20 transition cursor-pointer relative"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type.startsWith('image/')) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        if (event.target?.result) {
                          setEditDishImage(event.target.result as string);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  onClick={() => document.getElementById('edit-dish-image-input-hidden')?.click()}
                >
                  <input
                    id="edit-dish-image-input-hidden"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          if (event.target?.result) {
                            setEditDishImage(event.target.result as string);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                  />

                  {editDishImage ? (
                    <div className="flex flex-col items-center gap-2 py-1">
                      <img 
                        src={editDishImage} 
                        alt="Aperçu" 
                        className="h-16 w-28 object-cover rounded-md border border-gray-250 shadow-2xs"
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-[10px] text-[#1E4E8C] font-semibold hover:underline">
                        Modifier l'image (cliquer ou glisser)
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-2.5">
                      <Upload className="h-7 w-7 text-gray-400 mb-1" />
                      <p className="font-semibold text-gray-700 text-[10px]">
                        Ajouter une image du plat
                      </p>
                      <p className="text-gray-400 text-[9px] mt-0.5">
                        Glissez-déposez une image ou cliquez pour parcourir
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-5 pt-3 border-t">
              <button
                id="cancel-edit-dish-btn"
                onClick={() => {
                  setShowEditDishModal(false);
                  setEditingDish(null);
                }}
                className="px-4 py-2 bg-gray-100 rounded text-gray-750 hover:bg-gray-200 text-xs cursor-pointer font-medium"
              >
                Annuler
              </button>
              <button
                id="submit-edit-dish-btn"
                onClick={handleSubmitEditDish}
                className="px-4 py-2 bg-green-600 text-white font-bold rounded hover:bg-green-700 text-xs cursor-pointer shadow-sm active:scale-95 transition-transform"
              >
                Enregistrer les Modifications
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INGREDIENT ADD MODAL */}
      {showAddIngModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 border shadow-2xl relative">
            <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b">
              {editingIngredient ? 'Modifier l\'Ingrédient' : 'Créer Nouveau Composant Ingrédient'}
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-gray-650 block">Code unique (ex: ING-AIL)</label>
                <input
                  id="new-ing-code-input"
                  type="text"
                  placeholder="ING-..."
                  value={newIngCode}
                  onChange={(e) => setNewIngCode(e.target.value)}
                  className="w-full p-2 border border-gray-250 rounded text-gray-950 focus:outline-none uppercase"
                  disabled={!!editingIngredient}
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-650 block">Désignation matière *</label>
                <input
                  id="new-ing-name-input"
                  type="text"
                  placeholder="ex: Gousses d'Ail frais..."
                  value={newIngName}
                  onChange={(e) => setNewIngName(e.target.value)}
                  className="w-full p-2 border border-gray-250 rounded text-gray-950 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-gray-650 block">Catégorie d'Ingrédient</label>
                <select
                  id="new-ing-category-select"
                  value={selectedIngCategoryId}
                  onChange={(e) => setSelectedIngCategoryId(e.target.value)}
                  className="w-full p-2 border border-gray-250 bg-white rounded text-gray-750 focus:outline-none"
                >
                  <option value="cat-ing-raw">Matière Première Générale</option>
                  {(ingredientCategories || []).filter(c => c.tenantId === tenantId).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-650 block">Unité de Mesure</label>
                  <select
                    id="new-ing-unit-select"
                    value={newIngUnit}
                    onChange={(e) => setNewIngUnit(e.target.value)}
                    className="w-full p-2 border border-gray-250 rounded bg-white text-gray-750 focus:outline-none"
                  >
                    {(unitsOfMeasurement || ['kg', 'g', 'L', 'mL', 'Unité', 'Boîte', 'Sachet', 'Carton', 'Bouteille']).map(unit => (
                      <option key={unit} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-gray-650 block">CMP standard (FCFA)</label>
                  <input
                    id="new-ing-cmp-input"
                    type="number"
                    value={newIngCMP}
                    onChange={(e) => setNewIngCMP(parseInt(e.target.value) || 1000)}
                    className="w-full p-2 border border-gray-250 rounded text-gray-950 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-gray-650 block">Stock min de sécurité</label>
                  <input
                    id="new-ing-minstock-input"
                    type="number"
                    value={newIngMinStock}
                    onChange={(e) => setNewIngMinStock(parseInt(e.target.value) || 5)}
                    className="w-full p-2 border border-gray-250 rounded text-gray-950 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-gray-650 block">Stock maximum (Capacité)</label>
                  <input
                    id="new-ing-maxstock-input"
                    type="number"
                    value={newIngMaxStock}
                    onChange={(e) => setNewIngMaxStock(parseInt(e.target.value) || 50)}
                    className="w-full p-2 border border-gray-250 rounded text-gray-950 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-5 pt-3 border-t">
              <button
                id="cancel-add-ing-btn"
                onClick={() => {
                  setShowAddIngModal(false);
                  setEditingIngredient(null);
                }}
                className="px-4 py-2 bg-gray-100 rounded text-gray-700 hover:bg-gray-200 text-xs"
              >
                Annuler
              </button>
              <button
                id="submit-add-ing-btn"
                onClick={handleSubmitIngredient}
                className="px-4 py-2 bg-[#1E4E8C] text-white font-bold rounded hover:bg-blue-800 text-xs"
              >
                {editingIngredient ? 'Enregistrer' : 'Inscrire Ingrédient'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-[99999] max-w-sm p-4 rounded-xl shadow-xl flex items-center gap-3 border transition-all duration-300 animate-fade-in ${
          toast.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-900 shadow-rose-100/40'
            : 'bg-emerald-50 border-emerald-200 text-emerald-950 shadow-emerald-100/40'
        }`}>
          {toast.type === 'error' ? (
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          )}
          <span className="text-xs font-semibold leading-relaxed">
            {toast.text}
          </span>
        </div>
      )}
    </div>
  );
}
