import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const reqBody = {
    message: "Olá, preciso de ajuda com instalações elétricas.",
    history: [],
    stream: false
  };

  const res = await fetch("https://ais-pre-iwtrno4f7pot4oi6fzn3cc-248261757368.us-east5.run.app/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(reqBody)
  });

  console.log("Status:", res.status);
  const reader = res.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    console.log("CHUNK:", decoder.decode(value));
  }
}

run();
