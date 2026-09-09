import { Router } from 'express';
import { doc, getDoc, runTransaction } from 'firebase/firestore';
import { db, ensureAuthenticated } from '../services/notification.service.js';

const router = Router();

/**
 * GET /api/public/os/:orderId?token=...
 * Public sanitized endpoint for viewing a Service Order.
 */
router.get('/public/os/:orderId', async (req, res) => {
  const { orderId } = req.params;
  const token = req.query.token as string | undefined;

  if (!orderId) {
    return res.status(400).json({ error: 'ID da Ordem de Serviço não informado.' });
  }

  try {
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      return res.status(500).json({ error: 'Erro de autenticação no servidor.' });
    }

    const orderRef = doc(db, 'serviceOrders', orderId);
    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      return res.status(404).json({ error: 'Ordem de Serviço não encontrada.' });
    }

    const orderData = orderSnap.data();

    if (orderData.status === 'cancelled') {
      return res.status(404).json({ error: 'Ordem de Serviço não encontrada ou cancelada.' });
    }

    // Token validation - Strict match required
    if (!orderData.shareToken || !token || token !== orderData.shareToken) {
      return res.status(403).json({ error: 'Acesso negado. Token de compartilhamento inválido ou ausente.' });
    }

    // Fetch client name
    let clientName = 'Cliente';
    if (orderData.clientId) {
      try {
        const clientSnap = await getDoc(doc(db, 'clients', orderData.clientId));
        if (clientSnap.exists()) {
          clientName = clientSnap.data().name || 'Cliente';
        }
      } catch (e) {
        console.warn('[Public OS API] Error fetching client:', e);
      }
    }

    // Fetch company info from public_config or user doc
    let companyName = 'RA | Elétrica & Automação';
    let companyPhone = '';
    
    try {
      const configSnap = await getDoc(doc(db, 'site_settings', 'public_config'));
      if (configSnap.exists()) {
        const cfg = configSnap.data();
        if (cfg.companyName) companyName = cfg.companyName;
        if (cfg.whatsappInfo) companyPhone = cfg.whatsappInfo;
      } else if (orderData.userId) {
        const userSnap = await getDoc(doc(db, 'users', orderData.userId));
        if (userSnap.exists()) {
          const u = userSnap.data();
          if (u.companyName) companyName = u.companyName;
          if (u.phone || u.whatsappInfo) companyPhone = u.phone || u.whatsappInfo || '';
        }
      }
    } catch (e) {
      console.warn('[Public OS API] Error fetching company profile:', e);
    }

    // Return strictly sanitized public fields (excluding clientSignatureDoc, shareToken, userId, etc.)
    return res.json({
      id: orderSnap.id,
      status: orderData.status,
      description: orderData.description || '',
      scheduledDate: orderData.scheduledDate || '',
      scheduledTime: orderData.scheduledTime || '',
      finalPrice: orderData.finalPrice || '',
      photos: orderData.photos || [],
      photosAfter: orderData.photosAfter || [],
      clientSignatureName: orderData.clientSignatureName || null,
      signedAt: orderData.signedAt || null,
      clientName,
      companyName,
      companyPhone,
    });
  } catch (err: any) {
    console.error('[Public OS API Error]', err);
    return res.status(500).json({ error: 'Erro ao carregar Ordem de Serviço.' });
  }
});

/**
 * POST /api/public/os/:orderId/sign
 * Public endpoint for signing a Service Order atomically using runTransaction.
 */
router.post('/public/os/:orderId/sign', async (req, res) => {
  const { orderId } = req.params;
  const { token, clientSignatureName, clientSignatureDoc } = req.body || {};

  if (!orderId || !token) {
    return res.status(400).json({ error: 'ID da Ordem de Serviço e Token são obrigatórios.' });
  }

  if (!clientSignatureName || typeof clientSignatureName !== 'string' || clientSignatureName.trim().length < 2) {
    return res.status(400).json({ error: 'Nome do assinante é obrigatório e deve ter no mínimo 2 caracteres.' });
  }

  try {
    const isAuth = await ensureAuthenticated();
    if (!isAuth) {
      return res.status(500).json({ error: 'Erro de autenticação no servidor.' });
    }

    const timestamp = Date.now();
    const cleanName = clientSignatureName.trim().slice(0, 150);
    const cleanDoc = String(clientSignatureDoc || '').trim().slice(0, 50);

    await runTransaction(db, async (transaction) => {
      const orderRef = doc(db, 'serviceOrders', orderId);
      const orderSnap = await transaction.get(orderRef);

      if (!orderSnap.exists()) {
        throw new Error('OS_NOT_FOUND');
      }

      const orderData = orderSnap.data();

      if (orderData.status === 'cancelled') {
        throw new Error('OS_CANCELLED');
      }

      // Verify token
      if (!orderData.shareToken || orderData.shareToken !== token) {
        throw new Error('INVALID_TOKEN');
      }

      // Single-use signature protection
      if (orderData.signedAt && Number(orderData.signedAt) > 0) {
        throw new Error('ALREADY_SIGNED');
      }

      transaction.update(orderRef, {
        clientSignatureName: cleanName,
        clientSignatureDoc: cleanDoc,
        signedAt: timestamp,
        updatedAt: timestamp,
      });
    });

    return res.json({
      success: true,
      message: 'Assinatura digital registrada com sucesso.',
      signedAt: timestamp,
      clientSignatureName: cleanName,
    });
  } catch (err: any) {
    if (err?.message === 'OS_NOT_FOUND') {
      return res.status(404).json({ error: 'Ordem de Serviço não encontrada.' });
    }
    if (err?.message === 'OS_CANCELLED') {
      return res.status(404).json({ error: 'Ordem de Serviço não encontrada ou cancelada.' });
    }
    if (err?.message === 'INVALID_TOKEN') {
      return res.status(403).json({ error: 'Token de compartilhamento inválido.' });
    }
    if (err?.message === 'ALREADY_SIGNED') {
      return res.status(400).json({ error: 'Esta Ordem de Serviço já foi assinada.' });
    }

    console.error('[Public OS Sign Error]', err);
    return res.status(500).json({ error: 'Erro ao registrar assinatura digital.' });
  }
});

export default router;

