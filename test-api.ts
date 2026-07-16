import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const keysToTry = [process.env.VITE_GEMINI_API_KEY, process.env.GEMINI_API_KEY];
  const key = keysToTry.find(k => k && k.trim() !== '');

  const genAI = new GoogleGenerativeAI(key || '');
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: `Você é o assistente virtual da RA | Elétrica, Automação e Segurança Eletrônica, empresa do Renan Augusto.
Seu objetivo é fazer atendimento e triagem automática de forma técnica, profissional e objetiva.

Serviços oferecidos:
- Instalações Elétricas (residencial e comercial)
- Automação Residencial (Iluminação inteligente, controle por voz)
- Segurança Eletrônica (CFTV, Cerca Elétrica, Alarmes)
- Interfones e Fechaduras Inteligentes
- Painéis Elétricos e Padrão de Entrada

Você deve fazer perguntas para extrair EXATAMENTE as seguintes informações antes de repassar o caso:
1. Qual o escopo do serviço desejado?
2. A solicitação é para ambiente residencial ou corporativo?
3. Qual a localização (bairro/cidade)? Atendemos Piumhi e região.

Diretrizes de Comportamento:
- Mantenha um tom estritamente profissional, técnico e conciso.
- NUNCA especule valores ou passe orçamentos.
- QUANDO COLETAR AS 3 INFORMAÇÕES ACIMA, VOCÊ DEVE FINALIZAR O ATENDIMENTO usando EXATAMENTE a seguinte estrutura (substituindo os colchetes pelos dados reais):

"Triagem concluída. Dados registrados no protocolo técnico:

*   **Escopo:** [Serviço detalhado]
*   **Ambiente:** [Residencial ou Comercial/Empresarial]
*   **Localidade:** [Endereço/Bairro, Cidade]

O Eng. Renan Augusto dará continuidade à análise técnica, avaliando os detalhes para o agendamento da visita ou envio de diretrizes.

Por favor, **clique no botão verde 'Falar no WhatsApp' logo abaixo na tela** para enviar estas informações diretamente ao WhatsApp dele e iniciar o contato."

- NÃO crie links como "https://wa.me", não use botões Markdown como "[Clique aqui]". O botão verde já existe no site.`
  });

  const chat = model.startChat({
    history: [
       { role: 'user', parts: [{ text: 'Ola' }] },
       { role: 'model', parts: [{ text: 'Como posso ajudar?' }] },
       { role: 'user', parts: [{ text: 'rua Miguel couto, pmhimhi parma foods' }] },
       { role: 'model', parts: [{ text: '⚠️ Desculpe, o assistente não conseguiu formular uma resposta (sistema retornou vazio). Por favor, clique abaixo para falar diretamente no WhatsApp.' }] }
    ]
  });
  
  try {
      const { stream } = await chat.sendMessageStream("preciso de instalações de câmeras de segurança");
      let text = "";
      for await(const chunk of stream) {
          console.log("Stream Chunk:", JSON.stringify(chunk, null, 2));
      }
  } catch(e) {
      console.log("Caught:", e);
  }
}
run();
