import { Router } from 'express';
import { getServerDb } from '../services/adminFirebase.js';

const router = Router();

// Visualização pública exige token; jamais retorna documentos sensíveis completos.
router.get('/public/os/:orderId', async (req, res) => {
  const { orderId } = req.params;
  const token = typeof req.query.token === 'string' ? req.query.token : '';
  if (!orderId || !token) return res.status(400).json({ error: 'ID e token obrigatórios.' });
  try {
    const db = getServerDb();
    const snap = await db.collection('serviceOrders').doc(orderId).get();
    if (!snap.exists) return res.status(404).json({ error: 'OS não encontrada.' });
    const x = snap.data()!;
    if (x.status === 'cancelled' || !x.shareToken || token !== x.shareToken) {
      return res.status(403).json({ error: 'Acesso negado.' });
    }
    let clientName = 'Cliente';
    if (x.clientId) {
      const client = await db.collection('clients').doc(x.clientId).get();
      if (client.exists && client.data()?.userId === x.userId) clientName = client.data()?.name || clientName;
    }
    let companyName = 'RA | Elétrica & Automação';
    let companyPhone = '';
    const cfg = await db.collection('site_settings').doc('public_config').get();
    if (cfg.exists && (cfg.data()?.ownerId === x.userId || cfg.data()?.userId === x.userId)) {
      companyName = cfg.data()?.companyName || companyName;
      companyPhone = cfg.data()?.whatsappInfo || cfg.data()?.phone || '';
    } else if (x.userId) {
      const user = await db.collection('users').doc(x.userId).get();
      if (user.exists) {
        companyName = user.data()?.companyName || companyName;
        companyPhone = user.data()?.whatsappInfo || user.data()?.phone || '';
      }
    }
    return res.json({
      id: snap.id, status: x.status, description: x.description || '',
      scheduledDate: x.scheduledDate || '', scheduledTime: x.scheduledTime || '',
      finalPrice: x.finalPrice || '', photos: x.photos || [], photosAfter: x.photosAfter || [],
      clientSignatureName: x.clientSignatureName || null,
      signedAt: x.signedAt || null, clientName, companyName, companyPhone,
    });
  } catch (error) {
    console.error('[Public OS Read]', error);
    return res.status(503).json({ error: 'OS indisponível.' });
  }
});

router.post('/public/os/:orderId/sign', async (req, res) => {
  const { orderId } = req.params;
  const { token, clientSignatureName, clientSignatureDoc } = req.body || {};
  if (!orderId || typeof token !== 'string' || !token ||
    typeof clientSignatureName !== 'string' || clientSignatureName.trim().length < 2) {
    return res.status(400).json({ error: 'ID, token e nome são obrigatórios.' });
  }
  const name = clientSignatureName.trim().slice(0, 150);
  const docNumber = typeof clientSignatureDoc === 'string' ? clientSignatureDoc.trim().slice(0, 50) : '';
  try {
    const db = getServerDb();
    const ref = db.collection('serviceOrders').doc(orderId);
    const signedAt = Date.now();
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error('OS_NOT_FOUND');
      const x = snap.data()!;
      if (x.status === 'cancelled') throw new Error('OS_CANCELLED');
      if (!x.shareToken || x.shareToken !== token) throw new Error('INVALID_TOKEN');
      if (x.signedAt && Number(x.signedAt) > 0) throw new Error('ALREADY_SIGNED');
      tx.update(ref, {
        clientSignatureName: name, clientSignatureDoc: docNumber,
        signedAt, updatedAt: signedAt,
      });
    });
    return res.json({ success: true, signedAt, clientSignatureName: name });
  } catch (err: any) {
    const code = err?.message;
    if (code === 'INVALID_TOKEN') return res.status(403).json({ error: code });
    if (code === 'ALREADY_SIGNED') return res.status(409).json({ error: code });
    if (code === 'OS_NOT_FOUND' || code === 'OS_CANCELLED') return res.status(404).json({ error: code });
    console.error('[Public OS Sign]', err);
    return res.status(503).json({ error: 'ASSINATURA_INDISPONIVEL' });
  }
});

export default router;
