import jsPDF from 'jspdf';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { ServiceOrder, Client } from '../types/serviceOrder.types';
import { sanitizeForPDF, getBase64ImageFromUrl, statusNames } from '../utils/serviceOrderUtils';

export async function generateServiceOrderPDF(order: ServiceOrder, clients: Client[], user: any): Promise<void> {
  if (!order) return;
  const client = clients.find(c => c.id === order.clientId) || { id: '', name: 'Desconhecido', phone: '', email: '' };

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
      console.error("Error loading user profile for OS PDF", e);
    }
  }

  // Fetch and load logo
  let logoBase64 = '';
  try {
    logoBase64 = await getBase64ImageFromUrl('/logo.jpg?v=6');
  } catch (e) {
    console.error('Error loading logo', e);
  }

  try {
    const docPdf = new jsPDF();

    // Header
    docPdf.setFont("helvetica", "bold");
    docPdf.setFontSize(22);
    docPdf.setTextColor(15, 23, 42); // slate-900
    docPdf.text("ORDEM DE SERVIÇO", 14, 22);

    if (logoBase64) {
      try {
        docPdf.addImage(logoBase64, 'JPEG', 166, 10, 30, 30);
      } catch (e) {
        console.error("Error drawing logo in PDF", e);
      }
    }

    docPdf.setFont("helvetica", "normal");
    docPdf.setFontSize(10);
    docPdf.setTextColor(100, 100, 100);
    docPdf.text(`Protocolo: ${order.id.slice(0, 8).toUpperCase()}`, 14, 30);

    const formattedDate = order.scheduledDate
        ? new Date(order.scheduledDate + 'T00:00:00').toLocaleDateString('pt-BR')
        : new Date(order.createdAt || Date.now()).toLocaleDateString('pt-BR');
    docPdf.text(`Data: ${formattedDate}`, 14, 35);

    // Client Info
    docPdf.setFont("helvetica", "bold");
    docPdf.setFontSize(12);
    docPdf.setTextColor(15, 23, 42);
    docPdf.text("DADOS DO CLIENTE", 14, 50);

    docPdf.setFont("helvetica", "normal");
    docPdf.setFontSize(10);
    docPdf.setTextColor(71, 85, 105);
    docPdf.text(`Nome/Empresa: ${sanitizeForPDF(client.name || '')}`, 14, 57);
    if(client.phone) docPdf.text(`Telefone: ${sanitizeForPDF(client.phone || '')}`, 14, 63);
    if(client.email) docPdf.text(`E-mail: ${sanitizeForPDF(client.email || '')}`, 14, 69);

    // Status
    docPdf.setFont("helvetica", "bold");
    docPdf.setFontSize(12);
    docPdf.setTextColor(15, 23, 42);
    docPdf.text("STATUS DO SERVIÇO", 120, 50);

    docPdf.setFont("helvetica", "normal");
    docPdf.setFontSize(10);
    docPdf.setTextColor(71, 85, 105);
    docPdf.text(sanitizeForPDF(statusNames[order.status] || order.status), 120, 57);

    let endY = 85;

    // Description
    docPdf.setFont("helvetica", "bold");
    docPdf.setFontSize(12);
    docPdf.setTextColor(15, 23, 42);
    docPdf.text("MEMORIAL DESCRITIVO / SERVIÇOS", 14, endY);
    docPdf.setFont("helvetica", "normal");
    docPdf.setFontSize(10);
    docPdf.setTextColor(71, 85, 105);

    const splitText = docPdf.splitTextToSize(sanitizeForPDF(order.description || ''), 180);
    docPdf.text(splitText, 14, endY + 7);
    endY += (splitText.length * 5) + 15;

    // Final Price
    // Prevent page overflow for Final Price title and value text
    if (endY > 260) {
      docPdf.addPage();
      endY = 20;
    }

    docPdf.setFontSize(14);
    docPdf.setFont("helvetica", "bold");
    docPdf.setTextColor(15, 23, 42);
    const totalFormatted = order.finalPrice ? `R$ ${Number(order.finalPrice).toLocaleString('pt-BR', {minimumFractionDigits: 2})}` : 'R$ 0,00';
    docPdf.text(`Valor Final do Serviço: ${totalFormatted}`, 14, endY);
    endY += 20;

    // Photos
    const drawPhotos = async (photos: string[] | undefined, title: string, startY: number) => {
      if (!photos || photos.length === 0) return startY;

      // Ensure we don't go out of page
      if (startY > 230) {
          docPdf.addPage();
          startY = 20;
      }

      docPdf.setFontSize(11);
      docPdf.setFont("helvetica", "bold");
      docPdf.setTextColor(15, 23, 42);
      docPdf.text(title, 14, startY);

      let currentY = startY + 5;
      let pX = 14;

      const imgSize = 45;
      const margin = 10;

      for (const p of photos) {
         if (pX + imgSize > 200) {
             pX = 14;
             currentY += imgSize + margin;
             if (currentY + imgSize > 270) {
                 docPdf.addPage();
                 currentY = 20;
             }
         }

         if (p.startsWith('data:video')) {
            docPdf.setFontSize(9);
            docPdf.setFont("helvetica", "italic");
            docPdf.setTextColor(100, 100, 100);
            docPdf.text("[Vídeo anexado - Ver no Sistema]", pX, currentY + (imgSize/2));
         } else if (p) {
             try {
                 const base64Data = p.startsWith('http') ? await getBase64ImageFromUrl(p) : p;
                 if (base64Data) {
                   const formatMatch = base64Data.match(/data:image\/([a-zA-Z0-9]+);/);
                   const format = formatMatch ? formatMatch[1].toUpperCase() : 'JPEG';
                   docPdf.addImage(base64Data, format === 'JPG' ? 'JPEG' : format, pX, currentY, imgSize, imgSize);
                 }
             } catch(e) {
                 console.error("Could not add image to PDF", e);
             }
         }
         pX += imgSize + margin;
      }

      return currentY + imgSize + 15;
    };

    endY = await drawPhotos(order.photos, "EVIDÊNCIAS (ANTES)", endY);
    endY = await drawPhotos(order.photosAfter, "EVIDÊNCIAS (DEPOIS)", endY);

    // Draw footer divider line
    docPdf.setDrawColor(226, 232, 240); // border-slate-200
    docPdf.setLineWidth(0.5);
    docPdf.line(14, 275, 196, 275);

    // Footer texts
    docPdf.setFontSize(8);
    docPdf.setFont("helvetica", "bold");
    docPdf.setTextColor(15, 23, 42); // slate-900 / dark color
    docPdf.text(companyNameFooter, 14, 282);

    docPdf.setFont("helvetica", "normal");
    docPdf.setTextColor(71, 85, 105); // slate-600
    docPdf.text(contactFooter, 105, 282, { align: "center" });
    docPdf.text(emailFooter, 196, 282, { align: "right" });

    docPdf.setFontSize(7);
    docPdf.setFont("helvetica", "italic");
    docPdf.setTextColor(148, 163, 184); // slate-400
    docPdf.text(`Documento gerado eletronicamente em ${new Date().toLocaleDateString('pt-BR')}.`, 14, 288);

    docPdf.save(`OS_${client.name.replace(/\s+/g, '_')}_${order.id.slice(0, 5).toUpperCase()}.pdf`);
  } catch(err) {
    console.error(err);
    alert('Erro ao gerar PDF da OS.');
  }
}
