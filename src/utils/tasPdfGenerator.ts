import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const tasPdfGenerator = {
  /**
   * Gera um PDF oficial com base nos dados brutos e estatísticas do censo.
   */
  generateCensoReport: (fichas: unknown[], pesquisadorNome: string, escolaNome: string) => {
    console.info("[TAS Relatórios] Gerando PDF Sintético...");
    
    // Inicializa o documento PDF (formato A4)
    const doc = new jsPDF();
    
    // Cores e estilos do Censo CEEP
    const primaryColor: [number, number, number] = [124, 58, 237]; // Indigo/Purple
    
    // Cabeçalho
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(...primaryColor);
    doc.text("Relatório Oficial - Censo CEEP", 14, 22);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Escola: ${escolaNome}`, 14, 30);
    doc.text(`Pesquisador Responsável: ${pesquisadorNome}`, 14, 36);
    doc.text(`Data de Geração: ${new Date().toLocaleDateString("pt-BR")}`, 14, 42);
    doc.text(`Total de Autodeclarações Coletadas: ${fichas.length}`, 14, 48);
    
    // Linha divisória
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 54, 196, 54);

    // Corpo: Resumo Sintético
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(20, 20, 20);
    doc.text("1. Amostra de Dados Processados", 14, 66);

    // Preparando os dados para a tabela
    const tableData = fichas.map((ficha, index) => [
      index + 1,
      ficha.nome || "Não informado",
      ficha.idade || "-",
      ficha.cor_raca || "Mista",
      ficha.local_moradia || "Urbana",
      new Date(ficha.criado_em).toLocaleDateString("pt-BR")
    ]);

    // Tabela usando autotable
    autoTable(doc, {
      startY: 72,
      head: [['#', 'Nome Entrevistado', 'Idade', 'Cor/Raça', 'Moradia', 'Data']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 9, cellPadding: 4 },
      margin: { top: 10 }
    });

    // Rodapé de segurança do TAS
    const finalY = (doc as any).lastAutoTable.finalY || 100;
    
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(
      "Documento gerado e autenticado pelo TAS (Task Automation System) - Ecossistema PentaIA.",
      14, finalY + 20
    );

    // Salva o PDF
    const fileName = `CensoCEEP_Relatorio_${new Date().getTime()}.pdf`;
    doc.save(fileName);
    console.info(`[TAS Relatórios] PDF '${fileName}' salvo com sucesso!`);
  }
};
