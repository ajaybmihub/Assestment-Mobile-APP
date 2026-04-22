const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  try {
    // There is no direct listModels in the SDK for some versions, but we can try fetching one
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    console.log('Gemini AI initialized. Testing model...');
    // We can't actually list without a specific API call but we can try to guess or use the V1 API
    const fetch = require('node-fetch');
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    console.log('Available Models:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  }
}

listModels();
