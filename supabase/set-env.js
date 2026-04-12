const { execSync } = require('child_process');

const envVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY
};

// First remove existing production vars to avoid duplicates or conflicts
for (const [name, value] of Object.entries(envVars)) {
  try {
    console.log(`Removing ${name}...`);
    execSync(`npx vercel env rm ${name} production --yes`);
  } catch (e) {
    // Ignore if it doesn't exist
  }
}

// Add them back with clean values
for (const [name, value] of Object.entries(envVars)) {
  console.log(`Adding ${name}...`);
  // Use a temporary command to pipe the exact string
  // In Node, we can use spawn or just use a trick to not add newline
  execSync(`npx vercel env add ${name} production`, {
    input: value
  });
}

console.log('Environment variables updated successfully.');
