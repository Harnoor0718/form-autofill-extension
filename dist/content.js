const GEMINI_API_KEY = 'AIzaSyAHXXQrbYvtPy6S8MgeKl05qWappux6fBc'; // Replace with your actual key

function detectForms() {
  const forms = document.querySelectorAll('form');
  const inputs = document.querySelectorAll('input[type="text"], textarea');
  
  console.log('Forms found:', forms.length);
  console.log('Input fields found:', inputs.length);
  
  if (forms.length > 0) {
    forms.forEach((form, index) => {
      addAIAutofillButton(form, index);
    });
  } else if (inputs.length > 0) {
    // For Google Forms that don't use <form> tags
    addGoogleFormButton();
  }
}

function addAIAutofillButton(form, index) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = '🤖 AI Autofill';
  btn.style.padding = '10px 15px';
  btn.style.marginTop = '10px';
  btn.style.background = '#667eea';
  btn.style.color = 'white';
  btn.style.border = 'none';
  btn.style.borderRadius = '5px';
  btn.style.cursor = 'pointer';
  btn.style.fontSize = '14px';
  
  btn.addEventListener('click', () => {
    autofillWithAI(form);
  });
  
  form.appendChild(btn);
}

function addGoogleFormButton() {
  const btn = document.createElement('button');
  btn.textContent = '🤖 AI Helper Mode';
  btn.style.padding = '10px 15px';
  btn.style.margin = '10px';
  btn.style.background = '#667eea';
  btn.style.color = 'white';
  btn.style.border = 'none';
  btn.style.borderRadius = '5px';
  btn.style.cursor = 'pointer';
  btn.style.fontSize = '14px';
  btn.style.position = 'fixed';
  btn.style.bottom = '20px';
  btn.style.right = '20px';
  btn.style.zIndex = '10000';
  
  btn.addEventListener('click', () => {
    alert('Use the AI Form Helper in the extension popup to get suggestions for each question!');
  });
  
  document.body.appendChild(btn);
}

async function autofillWithAI(form) {
  chrome.storage.local.get('selectedProfile', async (result) => {
    const selectedProfileId = result.selectedProfile;
    
    if (!selectedProfileId) {
      alert('Please select a profile from the extension popup first!');
      return;
    }
    
    const inputs = form.querySelectorAll('input[type="text"], textarea, select');
    
    if (inputs.length === 0) {
      alert('No text fields found in this form!');
      return;
    }
    
    for (let input of inputs) {
      const fieldLabel = input.placeholder || input.name || input.id || 'field';
      const question = `Answer this question for a form: "${fieldLabel}". Give a short, natural answer. Only provide the answer, nothing else.`;
      
      try {
        const answer = await callGeminiAPI(question);
        input.value = answer;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      } catch (error) {
        console.error('Error filling field:', error);
      }
    }
    
    alert('Form filled with AI!');
  });
}

async function callGeminiAPI(prompt) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    })
  });
  
  if (!response.ok) {
    throw new Error('API error: ' + response.statusText);
  }
  
  const data = await response.json();
  
  if (!data.candidates || !data.candidates[0]) {
    throw new Error('No response from API');
  }
  
  return data.candidates[0].content.parts[0].text.trim();
}

document.addEventListener('DOMContentLoaded', detectForms);
detectForms();