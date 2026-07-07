import OpenAI from "openai";

import * as pdfjsLib from "pdfjs-dist";

//nst AIKEY = new HfInference(import.meta.env.VITE_API_HF_KEY);

//import { HfInference } from "@huggingface/inference";

//use with AIKEY huggin face

//const response = await AIKEY.chatCompletion({

// Required
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

let text = "";

const loadingTask = pdfjsLib.getDocument({
  url: "/Academic_Prospectus_2026-27.pdf",
});

const pdf = await loadingTask.promise;

console.log("Pages:", pdf.numPages);
const pages = [];

for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
  const page = await pdf.getPage(pageNum);

  const content = await page.getTextContent();

  const text = content.items.map((item) => item.str).join(" ");

  pages.push({
    page: pageNum,
    text,
  });
}

const newClient = new OpenAI({
  apiKey: import.meta.env.VITE_API_KEY,
  baseURL: import.meta.env.VITE_API_URL,
  dangerouslyAllowBrowser: true,
});

//setup message

async function GetResponse(prompt) {
  const message = [
    {
      role: "user",
      content: prompt,
    },
    {
      role: "system",
      content: `
You are an AI assistant for the NIOS Academic Prospectus.

Answer the user's question ONLY using the provided context.

Context:
${text}

Rules:
- Use only the information in the context.
- Keep the answer under 200 words.
`,
    },
  ];

  try {
    const response = await newClient.chat.completions.create({
      model: import.meta.env.VITE_API_MODEL,
      messages: message,
      max_tokens: 500,
      stream: true,
    });

    for await (const chunk of response) {
      // console.log(JSON.stringify(chunk, null, 2));
      // return response.choices[0].message.content;

      console.log("Chunk:", chunk.choices[0].delta.content);
      chunk.choices[0].delta.content &&
        (text += chunk.choices[0].delta.content);
    }

    return text;
  } catch (error) {
    return "Latest error: " + error;
  }
}

export default GetResponse;

//return response.choices[0].message.content;
