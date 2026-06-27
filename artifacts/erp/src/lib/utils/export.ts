import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportToExcel(filename: string, headers: string[], data: any[][]) {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportToPDF(filename: string, title: string, headers: string[], data: any[][]) {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(16);
  doc.text(title, 14, 20);
  
  // Date
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
  
  // Table
  autoTable(doc, {
    startY: 35,
    head: [headers],
    body: data,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [79, 70, 229] }, // Indigo 600
  });
  
  doc.save(`${filename}.pdf`);
}
