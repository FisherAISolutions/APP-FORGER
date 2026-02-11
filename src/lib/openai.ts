import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface GeneratedAppFiles {
  files: Record<string, string>;
  appName: string;
  features: string[];
}

export interface AppGenerationRequest {
  projectName: string;
  description: string;
  appType: "mobile" | "web";
}

/* =========================
   SYSTEM PROMPTS
========================= */

const MOBILE_SYSTEM_PROMPT = `You are an expert mobile app developer specializing in Expo React Native with TypeScript.
You generate production-ready, professional mobile applications.

Return valid JSON only.`;

const WEB_SYSTEM_PROMPT = `You are an expert web developer specializing in Next.js with TypeScript and Tailwind CSS.
You generate production-ready, professional web applications.

Return valid JSON only.`;

/* =========================
   REQUIRED FILE CHECKS
========================= */

const REQUIRED_MOBILE_FILES = [
  "package.json",
  "app.json",
  "tsconfig.json",
  "app/_layout.tsx",
];

const REQUIRED_WEB_FILES = [
  "package.json",
  "next.config.js",
  "tsconfig.json",
  "src/app/layout.tsx",
];

function validateGeneratedFiles(
  files: Record<string, string>,
  requiredFiles: string[],
  appType: "mobile" | "web"
): void {
  if (!files || typeof files !== "object") {
    throw new Error("AI response missing 'files' object");
  }

  const fileCount = Object.keys(files).length;
  if (fileCount < 5) {
    throw new Error(`AI generated only ${fileCount} files`);
  }

  for (const required of requiredFiles) {
    const hasFile = Object.keys(files).some(
      (path) => path === required || path.endsWith(`/${required}`)
    );
    if (!hasFile) {
      throw new Error(`Missing required ${appType} file: ${required}`);
    }
  }
}

/* =========================
   APP GENERATION (UNCHANGED)
========================= */

export async function generateMobileApp(
  request: AppGenerationRequest
): Promise<GeneratedAppFiles> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: MOBILE_SYSTEM_PROMPT },
      { role: "user", content: request.description },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 16000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from OpenAI");

  const parsed = JSON.parse(content) as GeneratedAppFiles;
  validateGeneratedFiles(parsed.files, REQUIRED_MOBILE_FILES, "mobile");

  return parsed;
}

export async function generateWebApp(
  request: AppGenerationRequest
): Promise<GeneratedAppFiles> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: WEB_SYSTEM_PROMPT },
      { role: "user", content: request.description },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 16000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from OpenAI");

  const parsed = JSON.parse(content) as GeneratedAppFiles;
  validateGeneratedFiles(parsed.files, REQUIRED_WEB_FILES, "web");

  return parsed;
}

export async function generateApp(
  request: AppGenerationRequest
): Promise<GeneratedAppFiles> {
  return request.appType === "mobile"
    ? generateMobileApp(request)
    : generateWebApp(request);
}

export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/* =========================
   🔥 NEW: RAW AI HELPER
   (Used ONLY for refine mode)
========================= */

export async function generateWithOpenAI(prompt: string): Promise<string> {
  if (!isOpenAIConfigured()) {
    throw new Error("OpenAI not configured");
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 16000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty OpenAI response");
  }

  return content;
}
