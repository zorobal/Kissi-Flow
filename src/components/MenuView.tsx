import React, { useState, useMemo, useRef } from 'react';
import { 
  Plus, 
  Trash2, 
  Printer, 
  Calendar, 
  Check, 
  X, 
  FileText, 
  Clock, 
  Award, 
  DollarSign, 
  ChefHat, 
  ListPlus, 
  Eye, 
  Play, 
  Smartphone, 
  CalendarDays,
  Sparkles,
  RefreshCw,
  Download,
  FileImage,
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Dish, MenuDuJour, DetailMenuJour, FormuleDuJour, MealType, Order, User, Tenant } from '../types';

// Helper functions to safely convert OKLCH color declarations to fallback standard RGB colors.
// This is critical to prevent html2canvas's CSS parser from crashing on modern Tailwind CSS v4 variables.
const oklchToRgbStr = (oklchStr: string): string => {
  const normalized = oklchStr.replace(/,/g, ' ');
  const matches = normalized.match(/oklch\s*\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+%?)(?:\s*\/\s*([\d.]+%?))?\s*\)/i);
  if (!matches) return 'rgb(120, 120, 120)';
  
  try {
    let l_pct = matches[1];
    let c_pct = matches[2];
    let h_deg = matches[3];
    let a_pct = matches[4];

    let l = parseFloat(l_pct);
    if (l_pct.includes('%')) l /= 100;
    
    let c = parseFloat(c_pct);
    if (c_pct.includes('%')) c /= 100;
    
    let h = parseFloat(h_deg);
    
    let a_val = 1;
    if (a_pct) {
      a_val = parseFloat(a_pct);
      if (a_pct.includes('%')) a_val /= 100;
    }

    const hRad = (h * Math.PI) / 180;
    const oklab_a = c * Math.cos(hRad);
    const oklab_b = c * Math.sin(hRad);

    const l_ = l + 0.3963377774 * oklab_a + 0.2158037573 * oklab_b;
    const m_ = l - 0.1055613458 * oklab_a - 0.0638541728 * oklab_b;
    const s_ = l - 0.0894841775 * oklab_a - 1.2914855414 * oklab_b;

    const l_cube = Math.pow(l_, 3);
    const m_cube = Math.pow(m_, 3);
    const s_cube = Math.pow(s_, 3);

    const rLinear = 4.0767416621 * l_cube - 3.3077115913 * m_cube + 0.2309699292 * s_cube;
    const gLinear = -1.2684380046 * l_cube + 2.6097574011 * m_cube - 0.3413193965 * s_cube;
    const bLinear = -0.0041960863 * l_cube - 0.7034186147 * m_cube + 1.707614701 * s_cube;

    const rgbC = (val: number) => {
      const abs = Math.abs(val);
      const res = abs > 0.0031308 ? 1.055 * Math.pow(abs, 1 / 2.4) - 0.055 : 12.92 * abs;
      return Math.min(255, Math.max(0, Math.round((val < 0 ? -res : res) * 255)));
    };

    const r = rgbC(rLinear);
    const g = rgbC(gLinear);
    const b = rgbC(bLinear);

    if (a_val < 1) {
      return `rgba(${r}, ${g}, ${b}, ${a_val})`;
    }
    return `rgb(${r}, ${g}, ${b})`;
  } catch (err) {
    return 'rgb(120, 120, 120)';
  }
};

const oklabToRgbStr = (oklabStr: string): string => {
  const normalized = oklabStr.replace(/,/g, ' ');
  const matches = normalized.match(/oklab\s*\(\s*([\d.]+%?)\s+([-+\d.]+%?)\s+([-+\d.]+%?)(?:\s*\/\s*([\d.]+%?))?\s*\)/i);
  if (!matches) return 'rgb(120, 120, 120)';
  
  try {
    let l_pct = matches[1];
    let a_pct = matches[2];
    let b_pct = matches[3];
    let alpha_pct = matches[4];

    let l = parseFloat(l_pct);
    if (l_pct.includes('%')) l /= 100;
    
    let oklab_a = parseFloat(a_pct);
    if (a_pct.includes('%')) oklab_a /= 100;
    
    let oklab_b = parseFloat(b_pct);
    if (b_pct.includes('%')) oklab_b /= 100;
    
    let a_val = 1;
    if (alpha_pct) {
      a_val = parseFloat(alpha_pct);
      if (alpha_pct.includes('%')) a_val /= 100;
    }

    const l_ = l + 0.3963377774 * oklab_a + 0.2158037573 * oklab_b;
    const m_ = l - 0.1055613458 * oklab_a - 0.0638541728 * oklab_b;
    const s_ = l - 0.0894841775 * oklab_a - 1.2914855414 * oklab_b;

    const l_cube = Math.pow(l_, 3);
    const m_cube = Math.pow(m_, 3);
    const s_cube = Math.pow(s_, 3);

    const rLinear = 4.0767416621 * l_cube - 3.3077115913 * m_cube + 0.2309699292 * s_cube;
    const gLinear = -1.2684380046 * l_cube + 2.6097574011 * m_cube - 0.3413193965 * s_cube;
    const bLinear = -0.0041960863 * l_cube - 0.7034186147 * m_cube + 1.707614701 * s_cube;

    const rgbC = (val: number) => {
      const abs = Math.abs(val);
      const res = abs > 0.0031308 ? 1.055 * Math.pow(abs, 1 / 2.4) - 0.055 : 12.92 * abs;
      return Math.min(255, Math.max(0, Math.round((val < 0 ? -res : res) * 255)));
    };

    const r = rgbC(rLinear);
    const g = rgbC(gLinear);
    const b = rgbC(bLinear);

    if (a_val < 1) {
      return `rgba(${r}, ${g}, ${b}, ${a_val})`;
    }
    return `rgb(${r}, ${g}, ${b})`;
  } catch (err) {
    return 'rgb(120, 120, 120)';
  }
};

const cleanUnsupportedColors = (styleText: string): string => {
  if (typeof styleText !== 'string') return styleText;
  let result = styleText;

  if (result.toLowerCase().includes('oklch')) {
    const oklchRegex = /oklch\s*\(([^)]+)\)/gi;
    result = result.replace(oklchRegex, (match) => {
      return oklchToRgbStr(match);
    });
  }

  if (result.toLowerCase().includes('oklab')) {
    const oklabRegex = /oklab\s*\(([^)]+)\)/gi;
    result = result.replace(oklabRegex, (match) => {
      return oklabToRgbStr(match);
    });
  }

  return result;
};

const executeSafeHtml2Canvas = async (element: HTMLElement, options: any): Promise<HTMLCanvasElement> => {
  const styleTags = Array.from(document.querySelectorAll('style'));
  const originalContents = styleTags.map(tag => {
    const content = tag.textContent || '';
    if (content.toLowerCase().includes('oklch') || content.toLowerCase().includes('oklab')) {
      tag.textContent = cleanUnsupportedColors(content);
    }
    return { tag, content };
  });

  const cssElements = element.querySelectorAll('*');
  const originalInlineStyles: { element: HTMLElement; style: string }[] = [];
  cssElements.forEach(el => {
    const htmlEl = el as HTMLElement;
    if (htmlEl.style && htmlEl.style.cssText && (
      htmlEl.style.cssText.toLowerCase().includes('oklch') ||
      htmlEl.style.cssText.toLowerCase().includes('oklab')
    )) {
      originalInlineStyles.push({ element: htmlEl, style: htmlEl.style.cssText });
      htmlEl.style.cssText = cleanUnsupportedColors(htmlEl.style.cssText);
    }
  });

  const originalGetComputedStyle = window.getComputedStyle;
  window.getComputedStyle = function(elt, pseudoElt) {
    const style = originalGetComputedStyle.call(window, elt, pseudoElt);
    return new Proxy(style, {
      get(target, prop) {
        if (prop === 'getPropertyValue') {
          return function(propertyName: string) {
            const val = target.getPropertyValue(propertyName);
            if (typeof val === 'string' && (val.toLowerCase().includes('oklch') || val.toLowerCase().includes('oklab'))) {
              return cleanUnsupportedColors(val);
            }
            return val;
          };
        }
        const val = target[prop as any];
        if (typeof val === 'string' && (val.toLowerCase().includes('oklch') || val.toLowerCase().includes('oklab'))) {
          return cleanUnsupportedColors(val);
        }
        if (typeof val === 'function') {
          return val.bind(target);
        }
        return val;
      }
    });
  };

  const originalOnClone = options.onclone;
  options.onclone = (clonedDoc: Document) => {
    if (clonedDoc && clonedDoc.defaultView) {
      const originalIFrameGetComputedStyle = clonedDoc.defaultView.getComputedStyle;
      clonedDoc.defaultView.getComputedStyle = function(elt, pseudoElt) {
        const style = originalIFrameGetComputedStyle.call(clonedDoc.defaultView, elt, pseudoElt);
        return new Proxy(style, {
          get(target, prop) {
            if (prop === 'getPropertyValue') {
              return function(propertyName: string) {
                const val = target.getPropertyValue(propertyName);
                if (typeof val === 'string' && (val.toLowerCase().includes('oklch') || val.toLowerCase().includes('oklab'))) {
                  return cleanUnsupportedColors(val);
                }
                return val;
              };
            }
            const val = target[prop as any];
            if (typeof val === 'string' && (val.toLowerCase().includes('oklch') || val.toLowerCase().includes('oklab'))) {
              return cleanUnsupportedColors(val);
            }
            if (typeof val === 'function') {
              return val.bind(target);
            }
            return val;
          }
        });
      };
    }
    if (originalOnClone) {
      originalOnClone(clonedDoc);
    }
  };

  // Install iframe append and window.fetch write bypass trap
  const originalAppend = document.body.appendChild;
  const originalInsertBefore = document.body.insertBefore;

  const patchIframe = (node: any) => {
    if (node && (node.tagName === 'IFRAME' || node instanceof HTMLIFrameElement)) {
      try {
        Object.defineProperty(node, 'contentWindow', {
          get: function() {
            try {
              const win = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, 'contentWindow')?.get?.call(node);
              if (win && !win.__fetch_patched) {
                win.__fetch_patched = true;
                const originalFetch = win.fetch;
                let currentFetch = originalFetch;
                try {
                  Object.defineProperty(win, 'fetch', {
                    get() { return currentFetch; },
                    set(val) { currentFetch = val; },
                    configurable: true,
                    enumerable: true
                  });
                } catch (e) {
                  try {
                    const protoWin = Object.getPrototypeOf(win);
                    Object.defineProperty(protoWin, 'fetch', {
                      get() { return currentFetch; },
                      set(val) { currentFetch = val; },
                      configurable: true,
                      enumerable: true
                    });
                  } catch (err) {
                    console.error("Failed to patch fetch proto", err);
                  }
                }
              }
              return win;
            } catch (err) {
              return null;
            }
          },
          configurable: true
        });
      } catch (err) {
        console.error("Failed to configure property descriptor on iframe", err);
      }
    }
  };

  document.body.appendChild = function <T extends Node>(node: T): T {
    patchIframe(node);
    return originalAppend.call(this, node);
  };

  document.body.insertBefore = function <T extends Node>(node: T, child: Node | null): T {
    patchIframe(node);
    return originalInsertBefore.call(this, node, child);
  };

  try {
    const canvas = await html2canvas(element, options);
    return canvas;
  } finally {
    originalContents.forEach(({ tag, content }) => {
      tag.textContent = content;
    });
    originalInlineStyles.forEach(({ element: el, style }) => {
      el.style.cssText = style;
    });
    window.getComputedStyle = originalGetComputedStyle;
    document.body.appendChild = originalAppend;
    document.body.insertBefore = originalInsertBefore;
  }
};

interface MenuViewProps {
  dishes: Dish[];
  activeUser: User;
  logsAction: (action: string, module: string, oldValue?: string, newValue?: string) => void;
  tenantId: string;
  activeTenant: Tenant | null;
  orders: Order[];
  
  menusDuJour: MenuDuJour[];
  setMenusDuJour: React.Dispatch<React.SetStateAction<MenuDuJour[]>>;
  
  detailMenusJour: DetailMenuJour[];
  setDetailMenusJour: React.Dispatch<React.SetStateAction<DetailMenuJour[]>>;
  
  formulesDuJour: FormuleDuJour[];
  setFormulesDuJour: React.Dispatch<React.SetStateAction<FormuleDuJour[]>>;
}

// Localized mapping for MealType
export const MEAL_TYPES_LABELS: Record<MealType, string> = {
  PETIT_DEJEUNER: 'Petit-déjeuner',
  DEJEUNER: 'Déjeuner',
  DINER: 'Dîner',
  SUGGESTION: 'Suggestion du Chef',
  PLAT_DU_JOUR: 'Plat du Jour',
  DESSERT_DU_JOUR: 'Dessert du Jour',
  BOISSON_DU_JOUR: 'Boisson du Jour'
};

const MEAL_TYPES_COLORS: Record<MealType, { bg: string, text: string, border: string }> = {
  PETIT_DEJEUNER: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  DEJEUNER: { bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  DINER: { bg: 'bg-indigo-50', text: 'text-indigo-800', border: 'border-indigo-200' },
  SUGGESTION: { bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
  PLAT_DU_JOUR: { bg: 'bg-purple-50', text: 'text-purple-800', border: 'border-purple-200' },
  DESSERT_DU_JOUR: { bg: 'bg-pink-50', text: 'text-pink-800', border: 'border-pink-200' },
  BOISSON_DU_JOUR: { bg: 'bg-sky-50', text: 'text-sky-800', border: 'border-sky-200' }
};

export default function MenuView({
  dishes,
  activeUser,
  logsAction,
  tenantId,
  activeTenant,
  orders,
  menusDuJour,
  setMenusDuJour,
  detailMenusJour,
  setDetailMenusJour,
  formulesDuJour,
  setFormulesDuJour
}: MenuViewProps) {
  
  // Tab states
  const [activeSubTab, setActiveSubTab] = useState<'MANAGE' | 'PREVIEW_A4' | 'DIAGNOSTICS'>('MANAGE');
  
  // Filter/Date states
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [menuSearch, setMenuSearch] = useState('');

  // Form states for creating a new MenuDuJour for selectedDate
  const [showAddMenuModal, setShowAddMenuModal] = useState(false);
  const [newMenuTitle, setNewMenuTitle] = useState('');
  const [newMenuDescription, setNewMenuDescription] = useState('');
  const [newMenuAccompaniments, setNewMenuAccompaniments] = useState('Riz Parfumé • Frites de pomme • Frites de plantain mûr (Alloco) • Miondo de pays • Couscous de manioc.');
  
  // Detail selection states
  const [selectedDishId, setSelectedDishId] = useState('');
  const [selectedMealType, setSelectedMealType] = useState<MealType>('DEJEUNER');
  const [customSpecialPrice, setCustomSpecialPrice] = useState<string>('');
  
  // Formula states
  const [formulaName, setFormulaName] = useState('');
  const [formulaPrice, setFormulaPrice] = useState<string>('');
  const [formulaDesc, setFormulaDesc] = useState('');

  // References and custom states for print
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  
  // Find menu for selected date
  const selectedMenu = useMemo(() => {
    return menusDuJour.find(m => m.dateMenu === selectedDate && m.tenantId === tenantId);
  }, [menusDuJour, selectedDate, tenantId]);

  // Current active tenant dishes
  const activeTenantDishes = useMemo(() => {
    return dishes.filter(d => d.tenantId === tenantId && d.active);
  }, [dishes, tenantId]);

  // Details for current menu
  const currentMenuDetails = useMemo(() => {
    if (!selectedMenu) return [];
    return detailMenusJour.filter(d => d.menuJourId === selectedMenu.id);
  }, [detailMenusJour, selectedMenu]);

  // Formulas for current menu
  const currentMenuFormules = useMemo(() => {
    if (!selectedMenu) return [];
    return formulesDuJour.filter(f => f.menuJourId === selectedMenu.id);
  }, [formulesDuJour, selectedMenu]);

  // Handle menu creation
  const handleCreateMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMenu) return; // Already exists

    const newMenu: MenuDuJour = {
      id: `menu-${Date.now()}`,
      dateMenu: selectedDate,
      title: newMenuTitle || `Menu du ${new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`,
      description: newMenuDescription || 'Notre sélection gourmande pour aujourd\'hui.',
      active: true,
      createdBy: activeUser.name,
      createdAt: new Date().toISOString(),
      tenantId: tenantId,
      accompaniments: newMenuAccompaniments
    };

    setMenusDuJour(prev => [...prev, newMenu]);
    logsAction(`Création du Menu du Jour pour le ${selectedDate}: ${newMenu.title}`, 'GESTION_MENUS');
    setShowAddMenuModal(false);
    setNewMenuTitle('');
    setNewMenuDescription('');
    setNewMenuAccompaniments('Riz Parfumé • Frites de pomme • Frites de plantain mûr (Alloco) • Miondo de pays • Couscous de manioc.');
  };

  // Toggle active status of selected menu
  const handleToggleMenuStatus = () => {
    if (!selectedMenu) return;
    setMenusDuJour(prev => prev.map(m => {
      if (m.id === selectedMenu.id) {
        const nextStatus = !m.active;
        logsAction(`Changement statut du menu ${m.title} vers ${nextStatus ? 'ACTIF' : 'INACTIF'}`, 'GESTION_MENUS');
        return { ...m, active: nextStatus };
      }
      return m;
    }));
  };

  // Add dish detail to selected menu
  const handleAddDishToMenu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMenu || !selectedDishId) return;

    // Check if dish is already in this category
    const alreadyExists = currentMenuDetails.some(d => d.platId === selectedDishId && d.typeRepas === selectedMealType);
    if (alreadyExists) {
      alert('Ce plat est déjà affecté à cette catégorie de repas du jour.');
      return;
    }

    const price = customSpecialPrice ? parseFloat(customSpecialPrice) : undefined;

    const newDetail: DetailMenuJour = {
      id: `detail-${Date.now()}`,
      menuJourId: selectedMenu.id,
      platId: selectedDishId,
      typeRepas: selectedMealType,
      specialPrice: price && !isNaN(price) ? price : undefined,
      displayOrder: currentMenuDetails.length + 1,
      availability: 'DISPONIBLE'
    };

    setDetailMenusJour(prev => [...prev, newDetail]);
    const platName = activeTenantDishes.find(d => d.id === selectedDishId)?.name || '';
    logsAction(`Ajout de ${platName} au menu du ${selectedDate} en tant que ${MEAL_TYPES_LABELS[selectedMealType]}`, 'GESTION_MENUS');
    
    // Reset selection fields
    setSelectedDishId('');
    setCustomSpecialPrice('');
  };

  // Toggle dish availability
  const handleToggleAvailability = (detailId: string, current: 'DISPONIBLE' | 'EPUISE' | 'SUSPENDU') => {
    let next: 'DISPONIBLE' | 'EPUISE' | 'SUSPENDU' = 'DISPONIBLE';
    if (current === 'DISPONIBLE') next = 'EPUISE';
    else if (current === 'EPUISE') next = 'SUSPENDU';
    else next = 'DISPONIBLE';

    setDetailMenusJour(prev => prev.map(d => {
      if (d.id === detailId) {
        return { ...d, availability: next };
      }
      return d;
    }));

    const detailsObj = detailMenusJour.find(d => d.id === detailId);
    if (detailsObj) {
      const pName = activeTenantDishes.find(dp => dp.id === detailsObj.platId)?.name || '';
      logsAction(`Disponibilité de ${pName} changée en ${next} pour le menu du ${selectedDate}`, 'GESTION_MENUS');
    }
  };

  // Remove dish detail
  const handleRemoveDetail = (detailId: string) => {
    const detailObj = detailMenusJour.find(d => d.id === detailId);
    setDetailMenusJour(prev => prev.filter(d => d.id !== detailId));
    
    if (detailObj) {
      const pName = activeTenantDishes.find(dp => dp.id === detailObj.platId)?.name || '';
      logsAction(`Retrait de ${pName} du menu du jour ${selectedDate}`, 'GESTION_MENUS');
    }
  };

  // Add formula to selected menu
  const handleAddFormula = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMenu || !formulaName || !formulaPrice) return;

    const fPrice = parseFloat(formulaPrice);
    if (isNaN(fPrice)) return;

    const newFormula: FormuleDuJour = {
      id: `formula-${Date.now()}`,
      menuJourId: selectedMenu.id,
      name: formulaName,
      price: fPrice,
      description: formulaDesc || undefined
    };

    setFormulesDuJour(prev => [...prev, newFormula]);
    logsAction(`Formule ajoutée au menu du ${selectedDate} : ${formulaName} (${fPrice} FCFA)`, 'GESTION_MENUS');

    // Reset formula state
    setFormulaName('');
    setFormulaPrice('');
    setFormulaDesc('');
  };

  // Remove formula
  const handleRemoveFormula = (formulaId: string) => {
    const fObj = formulesDuJour.find(f => f.id === formulaId);
    setFormulesDuJour(prev => prev.filter(f => f.id !== formulaId));

    if (fObj) {
      logsAction(`Retrait de la formule ${fObj.name} du menu du jour ${selectedDate}`, 'GESTION_MENUS');
    }
  };

  // Re-order details
  const handleMoveDetailOrder = (detailId: string, direction: 'UP' | 'DOWN') => {
    const listIndex = currentMenuDetails.findIndex(d => d.id === detailId);
    if (listIndex === -1) return;
    
    const targetIndex = direction === 'UP' ? listIndex - 1 : listIndex + 1;
    if (targetIndex < 0 || targetIndex >= currentMenuDetails.length) return;

    // Direct swap in local array or bulk update
    const updatedDetails = [...detailMenusJour];
    const originalDetail = currentMenuDetails[listIndex];
    const swapedDetail = currentMenuDetails[targetIndex];

    setDetailMenusJour(prev => prev.map(item => {
      if (item.id === originalDetail.id) {
        return { ...item, displayOrder: swapedDetail.displayOrder };
      }
      if (item.id === swapedDetail.id) {
        return { ...item, displayOrder: originalDetail.displayOrder };
      }
      return item;
    }));
  };

  // --- ANALYTICS AND KPIs CALCULATIONS ---
  const kpis = useMemo(() => {
    const now = new Date();
    const currentMonthPrefix = selectedDate.substring(0, 7); // e.g., '2026-06'
    
    // 1. Menus du jour créés ce mois
    const menusCreatedThisMonth = menusDuJour.filter(m => m.tenantId === tenantId && m.dateMenu.startsWith(currentMonthPrefix)).length;

    // 2. Chiffre d'affaires lié aux plats du jour
    // Let's analyze orders and their items that matched Menu du Jour items of the SAME date.
    let totalMenuCA = 0;
    let totalMenuOrdersCount = 0;
    const dishSalesWeights: Record<string, number> = {};

    orders.forEach(order => {
      if (order.tenantId !== tenantId || order.status !== 'CLOSED') return;
      
      // Is there a Menu du Jour for this order date?
      const targetMenu = menusDuJour.find(m => m.dateMenu === order.date && m.tenantId === tenantId);
      if (!targetMenu) return;

      const menuDetails = detailMenusJour.filter(d => d.menuJourId === targetMenu.id);
      const featuredDishIds = menuDetails.map(d => d.platId);

      order.lines.forEach(line => {
        if (featuredDishIds.includes(line.dishId)) {
          totalMenuCA += line.total;
          totalMenuOrdersCount += line.quantity;
          
          dishSalesWeights[line.dishId] = (dishSalesWeights[line.dishId] || 0) + line.quantity;
        }
      });
    });

    // Find custom top-seller featured dish
    let topSellerDishId = '';
    let maxQtySold = 0;
    Object.entries(dishSalesWeights).forEach(([dishId, qty]) => {
      if (qty > maxQtySold) {
        maxQtySold = qty;
        topSellerDishId = dishId;
      }
    });

    const topSellerDishObj = dishes.find(d => d.id === topSellerDishId);

    // 3. Rupture rate for selectedMenu (or overall today)
    let selectedMenuStockRuptureRate = 0;
    if (selectedMenu && currentMenuDetails.length > 0) {
      const suspendedOrOut = currentMenuDetails.filter(d => d.availability === 'EPUISE' || d.availability === 'SUSPENDU').length;
      selectedMenuStockRuptureRate = Math.round((suspendedOrOut / currentMenuDetails.length) * 100);
    }

    return {
      menusCreatedThisMonth,
      totalMenuCA,
      totalMenuOrdersCount,
      topSellerDish: topSellerDishObj ? { name: topSellerDishObj.name, image: topSellerDishObj.image, count: maxQtySold } : null,
      ruptureRate: selectedMenuStockRuptureRate
    };
  }, [menusDuJour, detailMenusJour, orders, dishes, tenantId, selectedDate, selectedMenu, currentMenuDetails]);

  // Grouping details for rendering
  const detailsByMealType = useMemo(() => {
    const groups: Record<MealType, typeof currentMenuDetails> = {
      PETIT_DEJEUNER: [],
      DEJEUNER: [],
      DINER: [],
      SUGGESTION: [],
      PLAT_DU_JOUR: [],
      DESSERT_DU_JOUR: [],
      BOISSON_DU_JOUR: []
    };

    currentMenuDetails.forEach(detail => {
      if (groups[detail.typeRepas]) {
        groups[detail.typeRepas].push(detail);
      }
    });

    // Sort within groups by order
    Object.keys(groups).forEach(key => {
      groups[key as MealType].sort((a, b) => a.displayOrder - b.displayOrder);
    });

    return groups;
  }, [currentMenuDetails]);

  // Handle direct local web print
  const handlePrintMenu = () => {
    const printContent = printAreaRef.current?.innerHTML;
    if (!printContent) return;

    const originalContent = document.body.innerHTML;
    
    // Create iframe-safe printing window or overwrite style for standard print
    // To ensure perfect layout, we program a temporary css injection style
    const styleElement = document.createElement('style');
    styleElement.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #printable-a4-area, #printable-a4-area * {
          visibility: visible;
        }
        #printable-a4-area {
          position: absolute;
          left: 0;
          top: 0;
          width: 210mm;
          height: auto;
          background: #FDFBF7 !important;
          color: #1a1a1a !important;
          box-shadow: none !important;
          border: none !important;
          padding: 0 !important;
          margin: 0 !important;
        }
      }
    `;

    document.head.appendChild(styleElement);
    window.print();
    logsAction(`SuperAdmin: Impression du Menu A4 pour le restaurant ${activeTenant?.name || tenantId}`, 'GESTION_MENUS');
    
    // Clean up
    styleElement.remove();
  };

  // Export to high-quality PDF document using html2canvas & jsPDF
  const handleExportPDF = async () => {
    const element = printAreaRef.current;
    if (!element) return;
    setIsGeneratingPDF(true);

    try {
      const canvas = await executeSafeHtml2Canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FDFBF7',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const formattedDate = selectedDate || new Date().toISOString().split('T')[0];
      const filename = `Menu_du_Jour_${formattedDate}_${activeTenant?.name?.replace(/\s+/g, '_') || 'La_Isla_Bonita'}.pdf`;
      pdf.save(filename);

      logsAction(`SuperAdmin: Export PDF du Menu A4 pour le restaurant ${activeTenant?.name || tenantId}`, 'GESTION_MENUS');
    } catch (error) {
      console.error("Erreur d'export PDF :", error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Export to high-density PNG image
  const handleExportPNG = async () => {
    const element = printAreaRef.current;
    if (!element) return;
    setIsGeneratingImage(true);

    try {
      const canvas = await executeSafeHtml2Canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FDFBF7',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const formattedDate = selectedDate || new Date().toISOString().split('T')[0];
      link.download = `Menu_du_Jour_${formattedDate}_${activeTenant?.name?.replace(/\s+/g, '_') || 'La_Isla_Bonita'}.png`;
      link.href = imgData;
      link.click();

      logsAction(`SuperAdmin: Export Image PNG du Menu A4 pour le restaurant ${activeTenant?.name || tenantId}`, 'GESTION_MENUS');
    } catch (error) {
      console.error("Erreur d'export Image :", error);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="space-y-6" id="gestion-menus-root">
      
      {/* Top action context banner */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2.5 bg-gradient-to-br from-[#0B1F3F] to-[#1E4E8C] text-white rounded-xl">
              <ChefHat size={20} className="text-[#F26522]" />
            </span>
            <div>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Gestion Stratégique du Menu</h2>
              <p className="text-slate-500 text-[11px] font-medium leading-relaxed">
                Configurez, programmez et imprimez les plats phares et formules spéciales de vos points de vente quotidiennement, sans créer de doublons dans le catalogue d'Ingrédients.
              </p>
            </div>
          </div>
        </div>

        {/* Date Selector Navigation Bar */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            <CalendarDays size={14} className="text-indigo-600" />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-xs font-black text-slate-700 bg-transparent focus:outline-none focus:ring-0 w-28 cursor-pointer"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
            <button
              onClick={() => {
                const date = new Date(selectedDate);
                date.setDate(date.getDate() - 1);
                setSelectedDate(date.toISOString().split('T')[0]);
              }}
              className="p-1 hover:bg-white text-slate-600 rounded text-xs font-bold transition"
            >
              ◄ Précédent
            </button>
            <span className="text-[10px] text-slate-400 font-extrabold uppercase">Naviguer</span>
            <button
              onClick={() => {
                const date = new Date(selectedDate);
                date.setDate(date.getDate() + 1);
                setSelectedDate(date.toISOString().split('T')[0]);
              }}
              className="p-1 hover:bg-white text-slate-600 rounded text-xs font-bold transition"
            >
              Suivant ►
            </button>
          </div>
        </div>
      </div>

      {/* Main navigation local tabs */}
      <div className="flex border-b border-slate-200 gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveSubTab('MANAGE')}
          className={`px-4 py-2 text-xs font-black uppercase rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'MANAGE' 
              ? 'bg-[#0B1F3F] text-white shadow-xs' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <ListPlus size={14} />
          <span>📋 Composer le Menu</span>
        </button>
        <button
          onClick={() => setActiveSubTab('PREVIEW_A4')}
          className={`px-4 py-2 text-xs font-black uppercase rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'PREVIEW_A4' 
              ? 'bg-[#0B1F3F] text-white shadow-xs' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Printer size={14} />
          <span>🖨️ Aperçu & Impression A4</span>
        </button>
        <button
          onClick={() => setActiveSubTab('DIAGNOSTICS')}
          className={`px-4 py-2 text-xs font-black uppercase rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'DIAGNOSTICS' 
              ? 'bg-[#0B1F3F] text-white shadow-xs' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Sparkles size={14} className="text-amber-500" />
          <span>📊 Business BI & KPIs des Menus</span>
        </button>
      </div>

      {/* ----------------- SUB-TAB: MANAGE ----------------- */}
      {activeSubTab === 'MANAGE' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Menu configuration sidebar (Left column) */}
          <div className="space-y-6 lg:col-span-1">
            
            {/* Active Date Menu Status Box */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">État de programmation</h3>
                <span className="text-[10px] text-slate-400 font-mono font-bold tracking-wider">{selectedDate}</span>
              </div>

              {!selectedMenu ? (
                <div className="text-center py-6 px-4 space-y-4">
                  <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                    <Calendar size={22} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-700">Aucun menu pour cette date</h4>
                    <p className="text-[10px] text-slate-400 leading-normal font-medium">Vous devez initialiser la fiche de menu avant de pouvoir lier des plats existants.</p>
                  </div>
                  <button
                    onClick={() => {
                      setNewMenuTitle(`Menu du ${new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}`);
                      setShowAddMenuModal(true);
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-black uppercase transition cursor-pointer flex items-center justify-center gap-1 shadow-xs"
                  >
                    <Plus size={14} />
                    <span>Créer le Menu du Jour</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-xl space-y-3.5 border border-slate-100">
                    <div className="flex justify-between items-center border-b border-slate-205 pb-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Configuration du menu</span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${selectedMenu.active ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        {selectedMenu.active ? 'ACTIF' : 'INACTIF'}
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 block">Titre de la carte</label>
                        <input
                          type="text"
                          value={selectedMenu.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMenusDuJour(prev => prev.map(m => m.id === selectedMenu.id ? { ...m, title: val } : m));
                          }}
                          className="w-full px-2 py-1 text-xs border border-slate-200 bg-white rounded focus:outline-[#1E4E8C] font-extrabold text-slate-900"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 block">Description / Slogan</label>
                        <input
                          type="text"
                          value={selectedMenu.description}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMenusDuJour(prev => prev.map(m => m.id === selectedMenu.id ? { ...m, description: val } : m));
                          }}
                          className="w-full px-2 py-1 text-xs border border-slate-200 bg-white rounded focus:outline-[#1E4E8C] text-slate-700"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] font-black uppercase text-slate-400 block">Accompagnements au choix</label>
                        <textarea
                          rows={3}
                          value={selectedMenu.accompaniments || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMenusDuJour(prev => prev.map(m => m.id === selectedMenu.id ? { ...m, accompaniments: val } : m));
                          }}
                          className="w-full px-2 py-1 text-xs border border-slate-200 bg-white rounded focus:outline-[#1E4E8C] text-slate-700 font-sans"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleToggleMenuStatus}
                      className={`flex-1 py-2 text-[10px] font-extrabold uppercase rounded-lg border transition text-center cursor-pointer ${
                        selectedMenu.active 
                          ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100' 
                          : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                      }`}
                    >
                      {selectedMenu.active ? '🚫 Suspendre les ventes' : '✅ Activer l\'offre'}
                    </button>
                    
                    <button
                      onClick={() => {
                        if(confirm('Êtes-vous sûr de vouloir supprimer définitivement le menu du jour d\'aujourd\'hui ainsi que toutes ses liaisons de plats ?')) {
                          setMenusDuJour(prev => prev.filter(m => m.id !== selectedMenu.id));
                          setDetailMenusJour(prev => prev.filter(d => d.menuJourId !== selectedMenu.id));
                          setFormulesDuJour(prev => prev.filter(f => f.menuJourId !== selectedMenu.id));
                          logsAction(`Suppression globale du menu du ${selectedDate}`, 'GESTION_MENUS');
                        }
                      }}
                      className="p-2 border border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded-lg transition"
                      title="Supprimer entièrement le menu du jour"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Form to bind dishes to active menu */}
            {selectedMenu && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ListPlus size={14} className="text-[#F26522]" />
                    <span>Lier un plat du catalogue</span>
                  </h3>
                </div>

                <form onSubmit={handleAddDishToMenu} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Filtrer & Sélectionner le Plat</label>
                    <select
                      required
                      value={selectedDishId}
                      onChange={(e) => setSelectedDishId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 text-slate-800 text-xs rounded-lg focus:outline-none focus:border-[#1E4E8C] font-extrabold"
                    >
                      <option value="">-- Sélectionner un plat --</option>
                      {activeTenantDishes.map(dish => (
                        <option key={dish.id} value={dish.id}>🍲 {dish.name} ({dish.price.toLocaleString('fr-FR')} FCFA)</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Catégorie de Repas</label>
                      <select
                        value={selectedMealType}
                        onChange={(e) => setSelectedMealType(e.target.value as MealType)}
                        className="w-full px-3 py-2 border border-slate-200 text-slate-800 text-xs rounded-lg focus:outline-none focus:border-[#1E4E8C] font-bold"
                      >
                        {Object.entries(MEAL_TYPES_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Tarif Spécial (Optional)</label>
                      <input
                        type="number"
                        placeholder="ex: 4000 (FCFA)"
                        value={customSpecialPrice}
                        onChange={(e) => setCustomSpecialPrice(e.target.value)}
                        className="w-full px-3 py-1.8 border border-slate-200 text-slate-800 text-xs rounded-lg focus:outline-none focus:border-[#1E4E8C] font-mono font-bold"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-[#0B1F3F] hover:bg-slate-900 text-white rounded-lg text-xs font-black uppercase transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <Plus size={14} />
                    <span>Lier à la Carte du Jour</span>
                  </button>
                </form>
              </div>
            )}

            {/* Custom Formules Form */}
            {selectedMenu && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
                <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign size={14} className="text-emerald-700" />
                    <span>Formule / Formule du jour</span>
                  </h3>
                </div>

                <form onSubmit={handleAddFormula} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5 col-span-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Nom Formule</label>
                      <input
                        required
                        type="text"
                        placeholder="ex: Formule Express"
                        value={formulaName}
                        onChange={(e) => setFormulaName(e.target.value)}
                        className="w-full px-3 py-1.8 border border-slate-200 text-slate-800 text-xs rounded-lg focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5 col-span-1">
                      <label className="text-[10px] font-bold text-gray-500 uppercase">Prix Total (FCFA)</label>
                      <input
                        required
                        type="number"
                        placeholder="ex: 4000"
                        value={formulaPrice}
                        onChange={(e) => setFormulaPrice(e.target.value)}
                        className="w-full px-3 py-1.8 border border-slate-200 text-slate-800 text-xs rounded-lg focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Nomenclature / Composition</label>
                    <textarea
                      placeholder="ex: Entrée + Plat + Boisson"
                      value={formulaDesc}
                      onChange={(e) => setFormulaDesc(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-200 text-slate-800 text-xs rounded-lg focus:outline-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-black uppercase transition cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Plus size={14} />
                    <span>Enregistrer la Formule</span>
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Connected Dishes and Status Management (Right column) */}
          <div className="lg:col-span-2 space-y-6">
            
            {!selectedMenu ? (
              <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-500">
                <p className="text-xs font-bold font-sans">Sélectionnez une date et créez ou chargez le Menu du Jour pour commencer l'administration d'aujourd'hui.</p>
              </div>
            ) : (
              <>
                {/* Linked Dishes List grouped by custom order types */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <ChefHat size={16} className="text-[#F26522]" />
                      <span>Arborescence Active du Menu ({currentMenuDetails.length} Articles)</span>
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase leading-none">Rupture :</span>
                      <span className={`text-[10px] font-black font-mono leading-none ${kpis.ruptureRate > 25 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {kpis.ruptureRate}%
                      </span>
                    </div>
                  </div>

                  {currentMenuDetails.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 space-y-2">
                      <p className="text-xs font-sans font-extrabold leading-normal">aucun plat lié à ce menu pour le moment.</p>
                      <p className="text-[10px] leading-relaxed">Utilisez le panneau latéral gauche "Lier un plat du catalogue" pour affecter et cataloguer vos plats dans l'offre commerciale active.</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {Object.entries(detailsByMealType).map(([typeKey, listObj]) => {
                        const list = listObj as DetailMenuJour[];
                        if (list.length === 0) return null;
                        const label = MEAL_TYPES_LABELS[typeKey as MealType];
                        const colors = MEAL_TYPES_COLORS[typeKey as MealType];

                        return (
                          <div key={typeKey} className="space-y-3">
                            <div className={`p-2 border rounded-lg ${colors.bg} ${colors.border} flex justify-between items-center`}>
                              <span className={`text-xs font-black uppercase ${colors.text}`}>{label}</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase">{list.length} Article(s)</span>
                            </div>

                            <div className="divide-y divide-slate-100 bg-slate-50 border border-slate-100 rounded-xl overflow-hidden">
                              {list.map((item, idx) => {
                                const dishObj = dishes.find(d => d.id === item.platId);
                                if (!dishObj) return null;

                                const displayPrice = item.specialPrice !== undefined ? item.specialPrice : dishObj.price;
                                const hasSpecialPrice = item.specialPrice !== undefined;

                                return (
                                  <div key={item.id} className="p-3.5 flex items-center justify-between gap-4 bg-white hover:bg-slate-50/50 transition">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <img 
                                        src={dishObj.image} 
                                        alt={dishObj.name}
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=150&auto=format&fit=crop';
                                        }}
                                        className="w-10 h-10 object-cover rounded-lg"
                                      />
                                      <div className="min-w-0 space-y-0.5">
                                        <h5 className="text-xs font-black text-slate-900 leading-tight truncate">{dishObj.name}</h5>
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] font-mono text-slate-400 font-medium">Original : {dishObj.price.toLocaleString('fr-FR')} FCFA</span>
                                          {hasSpecialPrice && (
                                            <span className="text-[10px] text-emerald-700 font-extrabold uppercase bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-100">
                                              Promo : {item.specialPrice?.toLocaleString('fr-FR')} FCFA
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                      
                                      {/* Order adjusters button */}
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={() => handleMoveDetailOrder(item.id, 'UP')}
                                          disabled={idx === 0}
                                          className="p-1 hover:bg-slate-100 text-slate-500 rounded disabled:opacity-20 transition"
                                          title="Monter de tri"
                                        >
                                          ▲
                                        </button>
                                        <button
                                          onClick={() => handleMoveDetailOrder(item.id, 'DOWN')}
                                          disabled={idx === list.length - 1}
                                          className="p-1 hover:bg-slate-100 text-slate-500 rounded disabled:opacity-20 transition"
                                          title="Descendre de tri"
                                        >
                                          ▼
                                        </button>
                                      </div>

                                      {/* Interactive status indicators */}
                                      <button
                                        onClick={() => handleToggleAvailability(item.id, item.availability)}
                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border transition w-24 text-center cursor-pointer ${
                                          item.availability === 'DISPONIBLE'
                                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                            : item.availability === 'EPUISE'
                                            ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100 line-through'
                                            : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                        }`}
                                      >
                                        {item.availability === 'DISPONIBLE' ? '● Disponible' : item.availability === 'EPUISE' ? '✕ Épuisé' : '⚠ Suspendu'}
                                      </button>

                                      {/* Delete connection */}
                                      <button
                                        onClick={() => handleRemoveDetail(item.id)}
                                        className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                        title="Retirer du menu"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Connected Formulas List */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
                  <div className="border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Award size={16} className="text-emerald-700" />
                      <span>Formules et Packs du Jour ({currentMenuFormules.length} Enregistrés)</span>
                    </h3>
                  </div>

                  {currentMenuFormules.length === 0 ? (
                    <div className="text-center py-6 text-slate-400">
                      <p className="text-[11px] font-sans">Aucune formule active liée pour le moment.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentMenuFormules.map(formula => (
                        <div key={formula.id} className="p-4 bg-emerald-50/50 border border-emerald-200/60 rounded-xl relative flex flex-col justify-between">
                          <button
                            onClick={() => handleRemoveFormula(formula.id)}
                            className="absolute top-2.5 right-2.5 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition"
                          >
                            <Trash2 size={12} />
                          </button>

                          <div className="space-y-1 pr-6">
                            <h4 className="text-xs font-black text-emerald-900 uppercase tracking-wide">{formula.name}</h4>
                            {formula.description && (
                              <p className="text-[10px] text-emerald-800 italic leading-snug">
                                {formula.description}
                              </p>
                            )}
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-emerald-100 flex justify-between items-center">
                            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Tarification formule</span>
                            <span className="text-xs font-semibold text-emerald-900 font-mono">
                              {formula.price.toLocaleString('fr-FR')} FCFA
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ----------------- SUB-TAB: PREVIEW & IMPRESSION (A4) ----------------- */}
      {activeSubTab === 'PREVIEW_A4' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Printer size={15} className="text-[#F26522]" />
                <span>Format d'Impression A4 - La Isla Bonita Premium Template</span>
              </h3>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Voici le modèle de document optimisé au format A4. Cliquez sur le bouton d'impression pour le matérialiser en version papier ou PDF de table client.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleExportPDF}
                disabled={!selectedMenu || isGeneratingPDF || isGeneratingImage}
                className="px-4 py-2 bg-[#0B1F3F] text-white hover:bg-[#1E4E8C] font-extrabold rounded-lg text-xs flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 transition-all"
                id="btn-export-pdf-main"
              >
                {isGeneratingPDF ? (
                  <Loader2 size={14} className="animate-spin text-amber-500" />
                ) : (
                  <Download size={14} className="text-[#F26522]" />
                )}
                <span>{isGeneratingPDF ? "Génération..." : "Exporter en PDF (A4)"}</span>
              </button>

              <button
                onClick={handleExportPNG}
                disabled={!selectedMenu || isGeneratingPDF || isGeneratingImage}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold rounded-lg text-xs flex items-center gap-2 cursor-pointer border border-slate-200 shadow-3xs disabled:opacity-50 transition-all"
                id="btn-export-image-main"
              >
                {isGeneratingImage ? (
                  <Loader2 size={14} className="animate-spin text-amber-500" />
                ) : (
                  <FileImage size={14} className="text-[#F26522]" />
                )}
                <span>{isGeneratingImage ? "Génération..." : "Exporter en Image"}</span>
              </button>

              <button
                onClick={handlePrintMenu}
                disabled={!selectedMenu || isGeneratingPDF || isGeneratingImage}
                className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-600 font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer border border-slate-200 disabled:opacity-50 transition-all"
                id="btn-fallback-print"
              >
                <Printer size={13} className="text-slate-450" />
                <span>Imprimer</span>
              </button>
            </div>
          </div>

          {!selectedMenu ? (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-500">
              <p className="text-xs font-bold font-sans">Créez d'abord le Menu du Jour pour le configurer et l'imprimer.</p>
            </div>
          ) : (
            <div className="flex justify-center p-2 bg-slate-900/10 rounded-2xl border border-slate-200 overflow-auto">
              
              {/* PRINT CONTAINER WITH THE ACCURATE GOLD CARD LAYOUT IN A4 ASPECT RATIO */}
              <div 
                ref={printAreaRef}
                id="printable-a4-area"
                className="bg-[#FDFBF7] text-[#3e2723] p-10 font-serif border-[10px] border-double border-[#C5A880] rounded-xl flex flex-col justify-between shadow-2xl relative select-none w-[210mm] min-h-[297mm] mx-auto text-slate-800 print:shadow-none print:border-none print:rounded-none"
              >
                
                {/* Upper Tropics themed header card with restaurant logo */}
                <div className="border-b-[3px] border-[#C5A880] pb-6 mb-6 text-center space-y-4">
                  <div className="flex flex-col items-center justify-center gap-2">
                    {activeTenant?.logoUrl ? (
                      <img 
                        src={activeTenant.logoUrl} 
                        alt="Logo du restaurant" 
                        className="h-16 w-auto object-contain mb-2 rounded-lg"
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <span className="text-3xl block mb-1">🍽️</span>
                    )}
                    <div>
                      <h1 className="text-4xl font-extrabold uppercase tracking-widest text-[#1a0f0d] font-serif leading-none italic">
                        {activeTenant?.name || "La Isla Bonita"}
                      </h1>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2">
                    <span className="h-0.5 w-12 bg-[#C5A880]"></span>
                    <span className="text-sm tracking-[0.4em] font-sans font-black uppercase text-[#F26522] leading-none">
                      MENU
                    </span>
                    <span className="h-0.5 w-12 bg-[#C5A880]"></span>
                  </div>
                </div>

                {/* Primary Content grouped categories */}
                <div className="space-y-8 flex-1">
                  
                  {currentMenuDetails.length === 0 && (
                    <div className="text-center py-24 text-[#C5A880] italic">
                      <p className="text-lg">Aucun plat n'a été inséré dans la carte d'aujourd'hui.</p>
                    </div>
                  )}

                  {Object.entries(detailsByMealType).map(([typeKey, listObj]) => {
                    const list = listObj as DetailMenuJour[];
                    if (list.length === 0) return null;
                    const label = MEAL_TYPES_LABELS[typeKey as MealType];

                    return (
                      <div key={typeKey} className="space-y-4">
                        {/* Categorized header line with dot brackets matching "Burgers", "Poulet" dividers */}
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex-1 border-b border-[#C5A880]"></span>
                          <h3 className="text-base font-black tracking-widest uppercase text-[#9e7031] font-sans px-2">
                            {label}
                          </h3>
                          <span className="flex-1 border-b border-[#C5A880]"></span>
                        </div>

                        {/* Dish List with connection lead lines */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-3">
                          {list.map(item => {
                            const dishObj = dishes.find(d => d.id === item.platId);
                            if (!dishObj) return null;

                            const finalPrice = item.specialPrice !== undefined ? item.specialPrice : dishObj.price;
                            const isOut = item.availability === 'EPUISE' || item.availability === 'SUSPENDU';

                            return (
                              <div key={item.id} className={`flex flex-col space-y-1 ${isOut ? 'opacity-30 line-through' : ''}`}>
                                <div className="flex justify-between items-baseline">
                                  <span className="text-sm font-bold text-slate-900 font-serif">
                                    {dishObj.name}
                                  </span>
                                  
                                  {/* CSS Dotted Leader */}
                                  <span className="flex-1 border-b border-dotted border-[#C5A880]/80 mx-2"></span>
                                  
                                  <span className="text-sm font-extrabold text-slate-900 font-mono shrink-0">
                                    {finalPrice.toLocaleString('fr-FR')}
                                  </span>
                                </div>
                                {dishObj.description && (
                                  <span className="text-[11px] text-slate-500 italic leading-snug">
                                    — {dishObj.description}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Formula sections rendered beautifully like the "PACKS" yellow boxes in image */}
                {currentMenuFormules.length > 0 && (
                  <div className="mt-10 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="flex-1 border-b-[2px] border-[#C5A880]"></span>
                      <h3 className="text-sm font-black tracking-widest uppercase text-[#9e7031] font-sans px-2">
                        🌟 FORMULES DU CHEF ET OFFRES DE GROUPE 🌟
                      </h3>
                      <span className="flex-1 border-b-[2px] border-[#C5A880]"></span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {currentMenuFormules.map(formula => (
                        <div 
                          key={formula.id} 
                          className="bg-[#FFFDF4] border border-[#C5A880] p-4 rounded-xl flex flex-col justify-between text-center space-y-2 shadow-xs"
                        >
                          <div className="space-y-1">
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest leading-normal">
                              {formula.name}
                            </h4>
                            {formula.description && (
                              <p className="text-[10px] text-slate-500 italic leading-relaxed">
                                {formula.description}
                              </p>
                            )}
                          </div>
                          
                          <div className="pt-2 border-t border-[#C5A880]/50 text-center font-mono font-black text-[#F26522] text-xs">
                            {formula.price.toLocaleString('fr-FR')} FCFA
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Dynamic accompaniment line */}
                {selectedMenu.accompaniments && (
                  <div className="mt-8 bg-[#FFF9EA] border border-[#C5A880] p-2.5 rounded-lg text-center">
                    <span id="printed-menu-accompaniments" className="text-[11px] font-sans font-black text-[#5C4010] uppercase tracking-wider">
                      Accompagnements au choix : {selectedMenu.accompaniments}
                    </span>
                  </div>
                )}

                {/* Footer and slogan */}
                <div className="mt-6 pt-4 border-t border-[#C5A880] text-center space-y-1">
                  <span id="printed-menu-slogan" className="text-xs font-sans tracking-widest uppercase text-slate-400 font-black">
                    {activeTenant?.slogan ? activeTenant.slogan : "BIENVENUE CHEZ NOUS"}
                  </span>
                  <p className="text-[10px] text-slate-400 font-sans italic font-semibold">
                    * Toutes nos fiches de viandes et poissons de saison subissent des contrôles de qualité constants.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ----------------- SUB-TAB: DIAGNOSTICS & KPIs ----------------- */}
      {activeSubTab === 'DIAGNOSTICS' && (
        <div className="space-y-6">
          
          {/* Dashboard KPIs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* KPI 1 */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-1.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Programmation Mensuelle</span>
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-black text-indigo-900">{kpis.menusCreatedThisMonth}</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase">Menus Créés</span>
              </div>
              <p className="text-slate-400 text-[10px] leading-normal font-medium">Nombre de fiches de menus journaliers mis en service ce mois.</p>
            </div>

            {/* KPI 2 */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-1.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Chiffre d'Affaires Menus</span>
              <div className="flex justify-between items-baseline">
                <span className="text-xl font-black text-emerald-700">{kpis.totalMenuCA.toLocaleString('fr-FR')} FCFA</span>
              </div>
              <p className="text-slate-400 text-[10px] leading-normal font-medium">Recettes cumulées liées aux plats de menus de cuisine clôturés.</p>
            </div>

            {/* KPI 3 */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-1.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Commandes Liées</span>
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-black text-slate-800">{kpis.totalMenuOrdersCount}</span>
                <span className="text-[10px] text-slate-500 font-bold uppercase">Assiettes servies</span>
              </div>
              <p className="text-slate-400 text-[10px] leading-normal font-medium">Nombre total de commandes directes correspondantes traitées en salle.</p>
            </div>

            {/* KPI 4 */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-1.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Rupture du Jour</span>
              <div className="flex justify-between items-baseline">
                <span className={`text-2xl font-black ${kpis.ruptureRate > 25 ? 'text-rose-600 animate-pulse' : 'text-emerald-700'}`}>
                  {kpis.ruptureRate}%
                </span>
                <span className="text-[10px] text-slate-500 font-bold uppercase">Taux de Rupture</span>
              </div>
              <p className="text-slate-400 text-[10px] leading-normal font-medium">Ratio des plats du jour déclarés "Épuisé" ou "Suspendu" aujourd'hui.</p>
            </div>
          </div>

          {/* Deep Insight Analysis Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Top Seller Card inside menu context */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <Award size={15} className="text-rose-600" />
                <span>Plat Favori du Menu Clôturé</span>
              </h3>

              {!kpis.topSellerDish ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Aucun historique de vente de menus de cuisine pour le moment.
                </div>
              ) : (
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <img 
                    src={kpis.topSellerDish.image} 
                    alt={kpis.topSellerDish.name}
                    className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                  />
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                      ★ Best-Seller du Mois
                    </span>
                    <h4 className="text-sm font-black text-slate-800">{kpis.topSellerDish.name}</h4>
                    <p className="text-slate-500 text-[10px] font-medium">
                      Plat commandé avec ferveur : <strong className="text-indigo-900 font-mono">{kpis.topSellerDish.count} portion(s)</strong>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Diagnostic analysis and advice */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-6 space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-3">
                <Clock size={15} className="text-amber-500" />
                <span>Recommandations du Conseiller d'Exploitation ERP</span>
              </h3>

              <div className="space-y-3">
                <div className="flex gap-2 text-[11px] leading-relaxed">
                  <span className="text-amber-500">💡</span>
                  <p className="text-slate-600 font-medium">
                    <strong>Rupture de cuisine :</strong> Votre taux de rupture du jour est à {kpis.ruptureRate}%. Un taux inférieur à 10% indique une excellente maîtrise des approvisionnements de la part des économes.
                  </p>
                </div>

                <div className="flex gap-2 text-[11px] leading-relaxed">
                  <span className="text-amber-500">💡</span>
                  <p className="text-slate-600 font-medium">
                    <strong>Rotation d'ingrédients :</strong> Programmez les menus avec fiches d'alertes stocks croisées pour utiliser en priorité les ingrédients à date de péremption proche (rotation FIFO).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GLOBAL CREATE DATE MENU MODAL */}
      {showAddMenuModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-slate-800">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden border border-slate-100">
            <div className="bg-[#0B1F3F] text-white p-4 flex justify-between items-center bg-gradient-to-r from-[#0B1F3F] to-[#1E4E8C]">
              <div className="flex items-center gap-2">
                <ChefHat size={18} className="text-[#F26522]" />
                <h3 className="font-extrabold text-sm uppercase tracking-wide">Initialiser le Menu du Jour</h3>
              </div>
              <button 
                onClick={() => setShowAddMenuModal(false)}
                className="text-white opacity-70 hover:opacity-100 transition"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateMenu} className="p-6 space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-400 uppercase">date programmée</span>
                <p className="text-xs font-black text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg font-mono">
                  {selectedDate}
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Titre Commercial de l'Offre du Jour</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Menu Spécial du Mardi"
                  value={newMenuTitle}
                  onChange={(e) => setNewMenuTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:border-[#1E4E8C] font-extrabold text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Slogan d'Accompagnement (Optionnel)</label>
                <input
                  type="text"
                  placeholder="ex: Nos meilleures grillades pour vous régaler !"
                  value={newMenuDescription}
                  onChange={(e) => setNewMenuDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:border-[#1E4E8C]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase">Accompagnements au choix</label>
                <textarea
                  rows={2}
                  value={newMenuAccompaniments}
                  onChange={(e) => setNewMenuAccompaniments(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:border-[#1E4E8C]"
                />
              </div>

              <div className="flex gap-2.5 pt-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddMenuModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-xs cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Check size={14} />
                  <span>Enregistrer l'Entête</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
