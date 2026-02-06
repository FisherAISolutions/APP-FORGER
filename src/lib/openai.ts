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

const MOBILE_SYSTEM_PROMPT = `You are an expert mobile app developer specializing in Expo React Native with TypeScript. You generate production-ready, professional mobile applications that look like they belong on the App Store.

When given an app description, you create:
1. Beautiful, polished UI with modern design patterns
2. Multiple screens with proper navigation (expo-router)
3. Supabase authentication (login/register screens)
4. Professional styling with consistent color schemes, shadows, and spacing
5. Proper TypeScript types throughout
6. Loading states, error handling, and empty states
7. Icons from @expo/vector-icons
8. Animations where appropriate

Your output must be a valid JSON object with this structure:
{
  "files": {
    "path/to/file.tsx": "file content as string",
    ...
  },
  "features": ["feature 1", "feature 2", ...]
}

Required base files to always include:
- package.json (with expo, expo-router, @supabase/supabase-js, @expo/vector-icons, react-native-safe-area-context)
- app.json (expo config)
- tsconfig.json
- app/_layout.tsx (root layout with Stack navigation)
- app/(auth)/_layout.tsx
- app/(auth)/login.tsx (beautiful login screen)
- app/(auth)/register.tsx (beautiful register screen)
- app/(app)/_layout.tsx (authenticated app layout with tabs or drawer)
- lib/supabase.ts (supabase client setup)

Design guidelines:
- Use a cohesive color palette (define colors in a constants file)
- Add proper padding, margins, and spacing
- Include subtle shadows and rounded corners
- Use proper typography hierarchy
- Add loading spinners and skeleton screens
- Include pull-to-refresh where appropriate
- Add haptic feedback for important actions
- Use SafeAreaView properly

Generate a complete, runnable app - not just stubs. Every screen should have full implementation.`;

const WEB_SYSTEM_PROMPT = `You are an expert web developer specializing in Next.js 14+ with TypeScript and Tailwind CSS. You generate production-ready, professional web applications with beautiful, modern UI.

When given an app description, you create:
1. Beautiful, polished UI with modern design (dark mode by default)
2. Multiple pages with proper routing (App Router)
3. Supabase authentication with SSR support
4. Professional styling with Tailwind CSS, gradients, shadows
5. Proper TypeScript types throughout
6. Loading states, error handling, and empty states
7. Responsive design (mobile-first)
8. Smooth animations and transitions

Your output must be a valid JSON object with this structure:
{
  "files": {
    "path/to/file.tsx": "file content as string",
    ...
  },
  "features": ["feature 1", "feature 2", ...]
}

Required base files to always include:
- package.json (with next, react, @supabase/supabase-js, @supabase/ssr, tailwindcss)
- next.config.js
- tsconfig.json
- tailwind.config.ts (with custom colors and design tokens)
- postcss.config.js
- src/app/globals.css (with Tailwind directives and custom styles)
- src/app/layout.tsx (root layout with metadata)
- src/app/page.tsx (landing/home page)
- src/app/(auth)/signin/page.tsx (beautiful sign in)
- src/app/(auth)/signup/page.tsx (beautiful sign up)
- src/lib/supabase/client.ts
- src/lib/supabase/server.ts

Design guidelines:
- Dark mode as default with cyan/teal accent colors
- Use gradients for backgrounds and buttons
- Add subtle glow effects on interactive elements
- Include hover and active states
- Use proper typography with good contrast
- Add smooth transitions (transform, opacity)
- Include loading skeletons
- Make it mobile-responsive

Generate a complete, runnable app - not just stubs. Every page should have full implementation with real functionality.`;

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
    throw new Error(`AI generated only ${fileCount} files - insufficient for a complete app`);
  }

  const missingFiles: string[] = [];
  for (const required of requiredFiles) {
    const hasFile = Object.keys(files).some(
      (path) => path === required || path.endsWith(`/${required}`)
    );
    if (!hasFile) {
      missingFiles.push(required);
    }
  }

  if (missingFiles.length > 0) {
    throw new Error(
      `AI output missing required ${appType} files: ${missingFiles.join(", ")}`
    );
  }

  for (const [path, content] of Object.entries(files)) {
    if (typeof content !== "string" || content.trim().length === 0) {
      throw new Error(`AI generated empty or invalid content for file: ${path}`);
    }
  }
}

export async function generateMobileApp(request: AppGenerationRequest): Promise<GeneratedAppFiles> {
  const userPrompt = `Create a professional mobile app called "${request.projectName}".

App Description: ${request.description}

Generate a complete, production-ready Expo React Native app with TypeScript. Include all necessary screens, components, and functionality to make this a polished App Store-ready application.

Remember to output valid JSON with "files" (object mapping file paths to contents) and "features" (array of feature names).`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: MOBILE_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 16000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  let parsed: GeneratedAppFiles;
  try {
    parsed = JSON.parse(content) as GeneratedAppFiles;
  } catch (error) {
    console.error("Failed to parse OpenAI response:", content);
    throw new Error("Failed to parse AI-generated app structure");
  }

  const files = parsed.files || {};
  validateGeneratedFiles(files, REQUIRED_MOBILE_FILES, "mobile");

  return {
    files,
    appName: request.projectName,
    features: parsed.features || [],
  };
}

export async function generateWebApp(request: AppGenerationRequest): Promise<GeneratedAppFiles> {
  const userPrompt = `Create a professional web app called "${request.projectName}".

App Description: ${request.description}

Generate a complete, production-ready Next.js 14+ app with TypeScript and Tailwind CSS. Include all necessary pages, components, and functionality to make this a polished, deployable web application.

Remember to output valid JSON with "files" (object mapping file paths to contents) and "features" (array of feature names).`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: WEB_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
    max_tokens: 16000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No response from OpenAI");
  }

  let parsed: GeneratedAppFiles;
  try {
    parsed = JSON.parse(content) as GeneratedAppFiles;
  } catch (error) {
    console.error("Failed to parse OpenAI response:", content);
    throw new Error("Failed to parse AI-generated app structure");
  }

  const files = parsed.files || {};
  validateGeneratedFiles(files, REQUIRED_WEB_FILES, "web");

  return {
    files,
    appName: request.projectName,
    features: parsed.features || [],
  };
}

export async function generateApp(request: AppGenerationRequest): Promise<GeneratedAppFiles> {
  if (request.appType === "mobile") {
    return generateMobileApp(request);
  } else {
    return generateWebApp(request);
  }
}

export function isOpenAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}
