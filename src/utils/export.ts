import * as XLSX from 'xlsx';

/**
 * Utility to export dynamic Javascript object arrays into styled Microsoft Excel spreadsheets.
 * Uses XLSX library to assemble workbooks.
 */
export function exportToExcel(data: any[], sheetName: string, fileName: string) {
  try {
    if (!data || data.length === 0) {
      alert('Aucune donnée disponible pour l\'exportation de ce rapport.');
      return;
    }
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  } catch (error) {
    console.error('Failed to export report to Excel:', error);
    alert('Une erreur est survenue lors de l\'exportation du rapport.');
  }
}
