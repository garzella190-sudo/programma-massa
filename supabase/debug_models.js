const GEMINI_API_KEY = 'AIzaSyDpR-9LvUa5UHVhJjLMnqAbjA7R5k1vk9g'; // From .env.local

async function listModels() {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`
    );
    const data = await response.json();
    if (data.models) {
      console.log('--- AVAILABLE MODELS ---');
      data.models.forEach(m => console.log(m.name));
    } else {
      console.log('No models found or error:', data);
    }
  } catch (err) {
    console.error(err);
  }
}

listModels();
