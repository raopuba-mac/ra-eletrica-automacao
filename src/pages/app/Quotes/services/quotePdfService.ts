import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { Quote, Client, QuoteParsedDescription } from '../types/quote.types';

export const sanitizeForPDF = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F000}-\u{1F0FF}]/gu, '') // Remove wide emojis
    .replace(/[\u2022\u2023\u25B8\u2043\u2219]/g, '-') // Replace bullets with dash
    .replace(/[\u2018\u2019\u201A\u201B\u2039\u203A]/g, "'") // Replace smart single quotes
    .replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB]/g, '"') // Replace smart double quotes
    .replace(/[\u2013\u2014]/g, '-') // Replace em/en dashes
    .replace(/[^\x00-\xFF\n\r]/g, ''); // Strip remaining non-Latin1 characters
};

export const getBase64ImageFromUrl = async (imageUrl: string): Promise<string> => {
  try {
    const res = await fetch(imageUrl);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("Error loading image as base64", e);
    return '';
  }
};

export const generateAndShareQuotePDF = async (
  quote: Quote,
  client: Client | undefined,
  user: any,
  showToast: (msg: string, type?: 'success' | 'error') => void
): Promise<void> => {
  if (!client) {
    showToast('Cliente não encontrado.', 'error');
    return;
  }

  let parsed: QuoteParsedDescription = {
    items: [],
    remarks: '',
    photo: '',
    photos: [],
    discount: 0,
    includesMaterial: false,
    applyCashDiscount: false,
    hideDetailedPrices: false
  };
  let isJson = false;
  try {
    if (quote.description && (quote.description.startsWith('{') || quote.description.startsWith('['))) {
      parsed = JSON.parse(quote.description);
      isJson = true;
    }
  } catch (e) {}

  // Fetch professional company profile for the PDF footer
  let companyNameFooter = "RA | ELÉTRICA & AUTOMAÇÃO";
  let contactFooter = "WhatsApp: (34) 99260-9206";
  let emailFooter = "E-mail: raop.uba@gmail.com";

  if (user) {
    try {
      const userSnap = await getDoc(doc(db, 'users', user.uid));
      if (userSnap.exists()) {
        const uData = userSnap.data();
        if (uData.companyName) companyNameFooter = uData.companyName.toUpperCase();
        if (uData.whatsappInfo || uData.phone) {
          contactFooter = `WhatsApp: ${uData.whatsappInfo || uData.phone}`;
        }
      }
      if (user.email) {
        emailFooter = `E-mail: ${user.email}`;
      }
    } catch (e) {
      console.error("Error loading user profile for quote PDF", e);
    }
  }

  // Fetch and load logo
  let logoBase64 = '';
  try {
    logoBase64 = await getBase64ImageFromUrl('/logo.jpg?v=6');
  } catch (e) {
    console.error('Error loading logo', e);
  }

  // Generate PDF
  try {
    const pdf = new jsPDF();
    
    // Config colors and fonts
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(22);
    pdf.setTextColor(15, 23, 42); // slate-900
    pdf.text("ORÇAMENTO PROFISSIONAL", 14, 22);

    if (logoBase64) {
      try {
        pdf.addImage(logoBase64, 'JPEG', 166, 10, 30, 30);
      } catch (e) {
        console.error("Error drawing logo in PDF", e);
      }
    }

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100); // gray
    pdf.text(`Protocolo: ${quote.id.slice(0, 8).toUpperCase()}`, 14, 30);
    pdf.text(`Data: ${new Date(quote.updatedAt || quote.createdAt || Date.now()).toLocaleDateString('pt-BR')}`, 14, 35);

    // Client Info
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(15, 23, 42);
    pdf.text("DADOS DO CLIENTE", 14, 50);
    
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.setTextColor(71, 85, 105); // slate-600
    pdf.text(`Nome/Empresa: ${sanitizeForPDF(client.name || '')}`, 14, 57);
    if(client.phone) pdf.text(`Telefone: ${sanitizeForPDF(client.phone || '')}`, 14, 63);
    if(client.email) pdf.text(`E-mail: ${sanitizeForPDF(client.email || '')}`, 14, 69);
    
    let endY = 85;

    const showDetails = !parsed.hideDetailedPrices;

    if (isJson && parsed.items && parsed.items.length > 0) {
      const tableColumn = showDetails 
        ? ["Item / Serviço", "Qtd", "Preço Unit.", "Total"]
        : ["Item / Serviço", "Qtd"];
      
      const tableRows = parsed.items.map((item: any) => showDetails ? [
        sanitizeForPDF(item.name || ''),
        (item.quantity || 1).toString(),
        `R$ ${Number(item.price || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`,
        `R$ ${Number((item.price || 0) * (item.quantity || 1)).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`
      ] : [
        sanitizeForPDF(item.name || ''),
        (item.quantity || 1).toString()
      ]);

      autoTable(pdf, {
        startY: endY,
        head: [tableColumn],
        body: tableRows,
        theme: 'striped',
        headStyles: { fillColor: [15, 23, 42] }, // slate-900
        styles: { font: "helvetica", fontSize: 9 },
        margin: { top: 10 },
      });

      endY = (pdf as any).lastAutoTable.finalY + 15;
    } else {
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(15, 23, 42);
      pdf.text("DESCRIÇÃO", 14, endY);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(71, 85, 105);
      
      const splitText = pdf.splitTextToSize(sanitizeForPDF(quote.description || ''), 180);
      pdf.text(splitText, 14, endY + 7);
      endY += (splitText.length * 5) + 15;
    }

    if (parsed.remarks) {
      const splitRemarks = pdf.splitTextToSize(sanitizeForPDF(parsed.remarks), 180);
      const remarksHeight = (splitRemarks.length * 5) + 15;
      
      if (endY + remarksHeight > 275) {
        pdf.addPage();
        endY = 20;
      }

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);
      pdf.setTextColor(15, 23, 42);
      pdf.text("OBSERVAÇÕES ADICIONAIS", 14, endY);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      pdf.setTextColor(71, 85, 105);
      
      pdf.text(splitRemarks, 14, endY + 7);
      endY += remarksHeight;
    }

    // Total Amount
    const subtotal = parsed.items?.reduce((acc, it) => acc + (Number(it.price) * (Number(it.quantity) || 1)), 0) || Number(quote.totalAmount);
    const discountValue = parsed.discount || 0;

    const summaryHeightNeeded = (discountValue > 0 && showDetails ? 15 : 0) + 15 + (parsed.applyCashDiscount ? 10 : 0) + 10;
    if (endY + summaryHeightNeeded > 270) {
      pdf.addPage();
      endY = 20;
    }

    if (discountValue > 0 && showDetails) {
      endY += 5;
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(71, 85, 105);
      pdf.text(`Subtotal: R$ ${subtotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 14, endY);
      
      endY += 7;
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(225, 29, 72); // rose-600
      pdf.text(`Desconto: - R$ ${discountValue.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 14, endY);
      endY += 5;
    }

    endY += 10;
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(15, 23, 42);
    
    const totalFormatted = `R$ ${Number(quote.totalAmount || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    pdf.text(`Total Previsto de Investimento: ${totalFormatted}`, 14, endY);
    
    endY += 10;

    if (parsed.applyCashDiscount) {
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(225, 29, 72); // red
      const descAvista = Number(quote.totalAmount || 0) * 0.85;
      pdf.text(`*Pagamento à vista tem 15% de desconto: R$ ${descAvista.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`, 14, endY);
      endY += 8;
    }
    
    if (parsed.includesMaterial) {
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(34, 197, 94); // green-500
      pdf.text("MATERIAL INCLUSO NESTE ORÇAMENTO", 14, endY);
    } else {
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(245, 158, 11); // amber-500
      pdf.text("MATERIAL NÃO INCLUSO (APENAS MÃO DE OBRA)", 14, endY);
    }

    endY += 15;

    const quotePhotos = parsed.photos || (parsed.photo ? [parsed.photo] : []);
    if (quotePhotos.length > 0) {
       if (endY > 180) {
           pdf.addPage();
           endY = 20;
       }
       pdf.setFontSize(11);
       pdf.setFont("helvetica", "bold");
       pdf.setTextColor(15, 23, 42);
       pdf.text("REGISTRO FOTOGRÁFICO / IMAGENS DE REFERÊNCIA", 14, endY);
       
       endY += 10;
       
       const imgWidth = 85;
       const imgHeight = 65;
       const gap = 10;
       let currentX = 14;
       
       for (const imgSrc of quotePhotos) {
           if (!imgSrc) continue;
           if (endY + imgHeight > 270) {
               pdf.addPage();
               endY = 20;
               currentX = 14;
           }
           
           try {
               const base64Data = imgSrc.startsWith('http') ? await getBase64ImageFromUrl(imgSrc) : imgSrc;
               if (base64Data) {
                 const formatMatch = base64Data.match(/data:image\/([a-zA-Z0-9]+);/);
                 const format = formatMatch ? formatMatch[1].toUpperCase() : 'JPEG';
                 pdf.addImage(base64Data, format === 'JPG' ? 'JPEG' : format, currentX, endY, imgWidth, imgHeight);
               }
               
               if (currentX === 14) {
                   currentX = 14 + imgWidth + gap;
               } else {
                   currentX = 14;
                   endY += imgHeight + gap;
               }
           } catch(e) {
               console.error("Could not add image to PDF", e);
           }
       }
       
       if (currentX !== 14) {
           endY += imgHeight + gap;
       }
    }

    // Draw footer divider line
    pdf.setDrawColor(226, 232, 240); // border-slate-200
    pdf.setLineWidth(0.5);
    pdf.line(14, 275, 196, 275);

    // Footer texts
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(15, 23, 42); // slate-900 / dark color
    pdf.text(companyNameFooter, 14, 282);
    
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(71, 85, 105); // slate-600
    pdf.text(contactFooter, 105, 282, { align: "center" });
    pdf.text(emailFooter, 196, 282, { align: "right" });

    pdf.setFontSize(7);
    pdf.setFont("helvetica", "italic");
    pdf.setTextColor(148, 163, 184); // slate-400
    pdf.text("Documento gerado eletronicamente. Aguardando aprovação.", 14, 288);

    // Save PDF
    pdf.save(`Orçamento_${client.name.replace(/\s+/g, '_')}_${quote.id.slice(0, 5).toUpperCase()}.pdf`);
    showToast("PDF Gerado com sucesso! Baixando arquivo...", "success");
    
  } catch(err) {
    console.error(err);
    showToast("Erro ao gerar PDF", "error");
  }

  if (client.phone) {
    const text = `Olá, *${client.name}*! \nEstou enviando em anexo o *Orçamento Profissional* solicitado em formato PDF. \n\n*Protocolo:* ${quote.id.slice(0, 8).toUpperCase()}\n*Valor Total:* R$ ${Number(quote.totalAmount).toLocaleString('pt-BR', {minimumFractionDigits: 2})}\n\nQualquer dúvida estou à disposição!`;
    const phone = client.phone.replace(/\D/g, '');
    if(phone) {
      setTimeout(() => {
        const url = `https://wa.me/55${phone}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
      }, 1500);
    }
  }
};
