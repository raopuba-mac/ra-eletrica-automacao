# RA ERP 5.0 — Checklist de estabilização

**Ambiente:** branch `preview/ra-erp-5.0`. Nenhuma alteração deste lote publica regras ou produção automaticamente.

## Etapa A — Backend/Agenda/Push
- [ ] CI (TypeScript, testes de horários, build) verde no GitHub Actions
- [ ] Vercel Preview Ready, Copiloto Comercial continua funcionando
- [ ] `GET /api/cron/health` com bearer `PREVIEW_CRON_SECRET` + Vercel bypass responde 200
- [ ] `PREVIEW_PUSH_TEST_UID` configurado só para Preview antes de chamar o cron (bloqueio de env protege outros usuários)
- [ ] Notificações Web Push inscritas após login; teste real com iPad bloqueado aprovado
- [ ] Avaliar regra Firestore `notifyTime: 5_min`, preparar difusão segura no Firebase antes de testar a opção
- [ ] Lembretes recorrentes testados (diário, semanal, mensal), com ausência de duplicatas
- [ ] Escolher agendador gratuito com execução a cada ~5 minutos; GitHub `schedule` só funciona na branch `main`

## Etapa B — Módulos críticos
- [ ] Financeiro: criar, editar, marcar pago, vencidos, vínculo OS→conta a receber e não duplicar
- [ ] Orçamento: criar, editar, PDF, descontos, leitura do cliente e impressão
- [ ] OS: criar, editar, fotos antes/depois, PDF, assinatura via token compartilhado, segurança do token
- [ ] Backup V2: exportar, validar, restaurar em ambiente controlado, conferir integridade
- [ ] IA de voz, Copiloto, leads, serviços, portfólio e configurações: regressão no iPad
- [ ] Testes de permissão: usuário A não acessa dados do usuário B; rotas públicas minimizadas

## Etapa C — Lançamento
- [ ] Conferir REGRAS FIRESTORE realmente publicadas (o arquivo no repositório não prova a versão ativa)
- [ ] Verificar comportamento no plano Firebase Spark (cotas) e Vercel Hobby
- [ ] Revisar segredos: não publicar conta de serviço, CRON_SECRET ou bypass em cliente/logs
- [ ] Revisar site público, contraste e responsividade; aprovar visual Premium
- [ ] Congelar tag/commit estável, planejar migração com rollback explícito

## Observações de segurança
- `firebase-admin` é privilegiado e ignora Security Rules. API sempre deve validar autenticação ou token de acesso.
- A opção 5 minutos exige compatibilidade com as regras implantadas no Firestore; **não publicar regras automaticamente**.
- GitHub Actions programado para `schedule` executa no branch padrão `main`. Este lote instala CI do Preview, não instala agendamento periódico em `main`.
