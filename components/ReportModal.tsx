
import React, { useState } from 'react';
import { X, Download, FileText, Package, Loader2, Eye, ShieldCheck, AlertTriangle } from 'lucide-react';
import { ConferenceBatch } from '../types';
import { INITIAL_BRANCHES } from '../constants';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportModalProps {
  batch: ConferenceBatch;
  onClose: () => void;
}

/**
 * LOGO NORMATEL - PNG BASE64 VÁLIDO (Símbolo Laranja Institucional)
 */
const NORMATEL_LOGO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAADICAMAAACahl6sAAAAaVBMVEX///8Asf8Arv8Asf8Atf8Asv8Atf8AsP8Asf8Arv8Asf8ArP8Asf8Asv8Asf8AsP8Asf8Asf8AsP8Asf8Asf8Asf8Asf8Asf8Asf8Asf8Asf8Asf8Asf8Asf8Asf8Asf8Asf8Asf8Asf8Aq98XAAAAInRSTlMA9PPY9vX87uPlfXFrZGFWUVFBPDo2MC0pIh8YFhMOAQA63YMAAALFSURBVHja7Z3ZchoxEEWpWULY7///7Y6YgLG7jYVLVVAnz6mD8Uhr6S5dkpIkSdP3mSIdBBBAIAABCEAAAIEABCAAARAIQAACEIAACAIQgAAEIAACAQgAAEAABEIgAAEIQAACAAgEIAACEACBAAIQgAAEIAACAXoG8re6LpeLi/ntxfK+iL8Xi++5bPexvdn6vr68XT7GdwEEIBDAbwFidIvR5f1te5+by7k873Wfz3uPThid97pufpf73zeXy/sIBBCAQM6ldYyvz2/X+by6r699X5/v+XiM7vS0v8XuF5fXtfgngAAE8l8gz6/39S1Hl3u9zpNrztu/V//vS9Pr66vLv9vS9wkEIBAlAnE6X8v7xeieju736f3zefr60+Xp6WqXh9/tDvNPIACBRAnE6fW+fM/T6fV+XZfL6fP0+vPz5elyv9/fH9/fS9P734r3CAQgkEiBPL0+XS5vV/cyPd6/L5fL6fHycXm6uK/v74/v3yXvEwhAIEkCcdrG+BzzdF0+Pk+nd9fXePF08XL/ur8X7xEIgEDuTSAf7tfX9fX9O06PT9fX+Xp9vjxdni6vV/f1/f378v7d8v634j0CAQgkSSB+x3u9OJ3vV++jfX0vL06vLp/T6/Tu8vS/Vf7HAAEIJN/+gZPLxNPa6av76Xp6eXp5vLxc7i+X9/XpPzz9T7xHIAACuTeBfLqfX19fX9/L+fX96bx/fPqf8uH7t8v738r3CAQgkCSB+B3v9fXydN18vDwfnk9v6vH8fDp+uPr0/+4W978V7xEIgECSBOJ0jPHp9PweX0/Pr59Py8ePnz99+p94j0AABHIvgTi9Y/x8fT8/X59+X4fPnz79h6f/ifcIBEAg9xKIs0un1+Xy9PT6Oj2/fF4v36/vy/P6fl3v77X7xeV1LX8CCEAgdxOI86er6+X6+vT8+n6+vF+f18vX+fI+Lr6e798l7xEIgECSBOL0Pl/f78v7fb2+vtfz67q+XteX+7W8X8v7Nf4JIACHXU0gLh+vX5+un69fv6/L5eP6fb1+Xy7X8/1pffXv5f1vln8C6BkAAAIQAEEAAnDYv2E/8vC39m/Z6QsAAAAASUVORK5CYII=';

const ReportModal: React.FC<ReportModalProps> = ({ batch, onClose }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const branchName = INITIAL_BRANCHES.find(b => b.cnpj === batch.notes[0]?.vendorCnpj)?.name || 'FILIAL PADRÃO';
  const nfeNumbers = batch.notes.map(n => n.number).join(', ');

  const formatNumber = (num: number) => {
    return num.toLocaleString('pt-BR', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 3 
    });
  };

  const generatePDF = async (action: 'preview' | 'download') => {
    if (action === 'preview') setIsPreviewing(true);
    else setIsExporting(true);

    try {
      // 1. Criar instância jsPDF
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;

      // --- CABEÇALHO ---
      // Adicionar Logo
      try {
        doc.addImage(NORMATEL_LOGO, 'PNG', margin, 10, 22, 22);
      } catch (imgErr) {
        console.warn('Erro ao carregar logo no PDF', imgErr);
      }

      // Nome da Empresa e Título
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(230, 107, 39); // Laranja Normatel
      doc.text('NORMATEL HOME CENTER', 42, 18);
      
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text('RELATÓRIO DE CONFERÊNCIA DE MANIFESTO', 42, 24);

      // Metadados
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Manifesto ID: #${batch.id.toUpperCase()}`, 42, 30);
      doc.text(`Notas Fiscais: ${nfeNumbers}`, 42, 34);
      doc.text(`Filial Destino: ${branchName}`, 42, 38);
      
      doc.text(`Data: ${new Date(batch.endTime || batch.startTime).toLocaleString('pt-BR')}`, pageWidth - margin, 30, { align: 'right' });
      doc.text(`Conferente: ${batch.conferenteName.toUpperCase()}`, pageWidth - margin, 34, { align: 'right' });

      // Linha Separadora de Cabeçalho
      doc.setDrawColor(230, 107, 39);
      doc.setLineWidth(0.4);
      doc.line(margin, 42, pageWidth - margin, 42);

      // --- DADOS DA TABELA ---
      let totalQtdNota = 0;
      let totalQtdLida = 0;
      let totalDivergencias = 0;

      const tableRows = batch.products.map(p => {
        const diff = p.quantityChecked - p.quantityExpected;
        const status = diff === 0 ? 'CONFORME' : diff > 0 ? 'SOBRA' : 'FALTA';
        
        totalQtdNota += p.quantityExpected;
        totalQtdLida += p.quantityChecked;
        if (diff !== 0) totalDivergencias++;

        return [
          p.code,
          p.ean,
          p.description.toUpperCase(),
          formatNumber(p.quantityExpected),
          formatNumber(p.quantityChecked),
          formatNumber(diff),
          status
        ];
      });

      // --- AUTO-TABLE ---
      autoTable(doc, {
        startY: 48,
        head: [['CÓDIGO', 'EAN', 'DESCRIÇÃO DO PRODUTO', 'QTD NOTA', 'QTD LIDA', 'DIFF', 'STATUS']],
        body: tableRows,
        theme: 'grid',
        styles: {
          fontSize: 8.5,
          cellPadding: 2.5,
          overflow: 'linebreak',
          valign: 'middle',
          font: 'helvetica'
        },
        headStyles: {
          fillColor: [50, 50, 50],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 20, halign: 'left' },
          1: { cellWidth: 28, halign: 'left' },
          2: { cellWidth: 'auto', halign: 'left' }, // Descrição (Ocupará ~40%+)
          3: { cellWidth: 18, halign: 'center' },
          4: { cellWidth: 18, halign: 'center' },
          5: { cellWidth: 15, halign: 'center' },
          6: { cellWidth: 20, halign: 'center' }
        },
        didParseCell: (data) => {
          if (data.section === 'body') {
            const rowData = data.row.raw as string[];
            const diffValue = parseFloat(rowData[5].replace(/\./g, '').replace(',', '.')); // Index 5 é a coluna DIFF agora
            if (diffValue !== 0) {
              data.cell.styles.fillColor = [255, 235, 235]; 
              data.cell.styles.textColor = [190, 0, 0];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        },
        didDrawPage: (data) => {
          const pageCount = doc.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(150);
          doc.text(`Página ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
          doc.text('SISTEMA DE CONFERÊNCIA NORMATEL', margin, pageHeight - 10);
        },
        margin: { top: 20, bottom: 40, left: margin, right: margin }
      });

      // --- RESUMO E ASSINATURA ---
      const finalY = (doc as any).lastAutoTable.finalY + 12;

      doc.setFillColor(248, 248, 248);
      doc.setDrawColor(220);
      doc.roundedRect(margin, finalY, 100, 25, 2, 2, 'FD');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(40, 40, 40);
      doc.text('RESUMO DA CONFERÊNCIA', margin + 5, finalY + 7);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`• Total SKUs: ${batch.products.length}`, margin + 5, finalY + 13);
      doc.text(`• Qtd. Total no XML: ${formatNumber(totalQtdNota)}`, margin + 5, finalY + 17);
      doc.text(`• Qtd. Total Lido: ${formatNumber(totalQtdLida)}`, margin + 5, finalY + 21);

      if (totalDivergencias > 0) {
        doc.setTextColor(200, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.text(`• DIVERGÊNCIAS: ${totalDivergencias} ITENS`, margin + 55, finalY + 13);
      }

      const signY = pageHeight - 35;
      doc.setDrawColor(180);
      doc.setLineWidth(0.2);
      doc.line(pageWidth / 2 - 40, signY, pageWidth / 2 + 40, signY);
      doc.setFontSize(8);
      doc.setTextColor(100);
      doc.text('ASSINATURA DO CONFERENTE RESPONSÁVEL', pageWidth / 2, signY + 5, { align: 'center' });
      doc.text(batch.conferenteName.toUpperCase(), pageWidth / 2, signY + 9, { align: 'center' });

      if (action === 'preview') {
        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        const win = window.open(url, '_blank');
        if (!win) alert('Pop-up bloqueado! Por favor, habilite pop-ups para visualizar o PDF.');
      } else {
        doc.save(`NORMATEL_CONFERENCIA_${batch.id.toUpperCase()}.pdf`);
      }
    } catch (error: any) {
      console.error('Erro crítico na geração do PDF:', error);
      alert('Erro técnico na geração do relatório.');
    } finally {
      setIsPreviewing(false);
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md">
      <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-white/10">
        
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div className="flex items-center gap-4">
            <div className="bg-[#E66B27] p-2.5 rounded-xl text-white shadow-lg shadow-orange-500/20">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="font-black text-slate-800 text-lg uppercase tracking-tight">Exportar Manifesto</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Padrão Normatel • PDF Vetorial</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="p-10 text-center flex flex-col items-center">
          <div className="w-20 h-20 bg-orange-50 text-[#E66B27] rounded-full flex items-center justify-center mb-6 shadow-inner">
            <FileText size={40} />
          </div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-3">Documento Gerado</h3>
          <p className="text-slate-500 text-sm mb-10 max-w-sm leading-relaxed">
            O manifesto <b>#{batch.id.toUpperCase()}</b> está pronto para impressão.
            Divergências estão destacadas em vermelho para facilitar a auditoria.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
            <button 
              onClick={() => generatePDF('preview')}
              disabled={isPreviewing || isExporting}
              className="flex items-center justify-center gap-3 bg-white border-2 border-slate-200 hover:border-[#E66B27] hover:text-[#E66B27] text-slate-700 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50"
            >
              {isPreviewing ? <Loader2 className="animate-spin" size={18} /> : <Eye size={18} />}
              Visualizar
            </button>
            <button 
              onClick={() => generatePDF('download')}
              disabled={isPreviewing || isExporting}
              className="flex items-center justify-center gap-3 bg-[#E66B27] hover:bg-[#d55a1a] text-white px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-orange-500/20 disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
              Baixar PDF
            </button>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">
            SISTEMA DE CONFERÊNCIA NORMATEL v2.9.3
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
