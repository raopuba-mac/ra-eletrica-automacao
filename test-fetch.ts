import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const reqBody = {
    message: "",
    history: []
  };

  const res = await fetch("http://localhost:3000/api/chat", {
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
