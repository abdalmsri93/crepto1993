// Simple test for Groq API
// Run this in browser console to test your API key

const testGroqAPI = async () => {
  const apiKey = localStorage.getItem('groq_api_key');
  
  if (!apiKey) {
    console.error('❌ No API key found in localStorage');
    console.log('💡 Add it in Settings page first');
    return;
  }
  
  console.log('🔑 API Key found:', apiKey.substring(0, 20) + '...');
  console.log('📡 Testing Groq API...');
  
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-70b-versatile',
        messages: [
          {
            role: 'user',
            content: 'Say "API works!" in Arabic'
          }
        ],
        max_tokens: 50,
      }),
    });
    
    console.log('📊 Status:', response.status);
    
    if (!response.ok) {
      const error = await response.text();
      console.error('❌ API Error:', error);
      return;
    }
    
    const data = await response.json();
    console.log('✅ API Response:', data.choices[0].message.content);
    console.log('🎉 API is working correctly!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

// Run the test
testGroqAPI();
