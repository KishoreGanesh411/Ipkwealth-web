import OpenAI from "openai";
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  organization: process.env.OPENAI_ORG_ID,
  project: process.env.OPENAI_PROJECT
});
const r = await client.responses.create({ model: "gpt-4o-mini", input: "OK" });
console.log(r.output_text);
