import { GoogleGenAI } from '@google/genai';
async function test() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const chat = ai.chats.create({ model: "gemini-3-flash-preview" });
    const stream = await chat.sendMessageStream({ message: "Hello" });
    let text = "";
    for await (const chunk of stream) text += chunk.text;
    console.log("Success:", text);
  } catch(e) {
    console.error("Error:", e);
  }
}
test();
