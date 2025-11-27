initDB().then(() => {
  loadProfiles();
  
  document.getElementById('saveBtn').addEventListener('click', async function() {
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const address = document.getElementById('address').value.trim();
    
    if (!name) {
      alert('Name is required!');
      return;
    }
    
    if (!validateEmail(email)) {
      alert('Please enter a valid email!');
      return;
    }
    
    if (!validatePhone(phone)) {
      alert('Please enter a valid phone number (10 digits)!');
      return;
    }
    
    if (!address) {
      alert('Address is required!');
      return;
    }
    
    const data = { name, email, phone, address };
    await saveProfile(data);
    await saveProfileToStorage(data);
    alert('Profile saved successfully!');
    
    document.getElementById('name').value = '';
    document.getElementById('email').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('address').value = '';
    
    loadProfiles();
  });
});

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length !== 10) {
    return false;
  }
  
  const firstDigit = parseInt(cleaned[0]);
  if (firstDigit < 6 || firstDigit > 9) {
    return false;
  }
  
  return true;
}

async function loadProfiles() {
  const profiles = await getProfiles();
  const profilesList = document.getElementById('profilesList');
  const profileSelect = document.getElementById('profileSelect');
  
  profilesList.innerHTML = '';
  profileSelect.innerHTML = '<option value="">-- Select Profile --</option>';
  
  profiles.forEach(profile => {
    // Add to dropdown
    const option = document.createElement('option');
    option.value = profile.id;
    option.textContent = profile.name;
    profileSelect.appendChild(option);
    
    // Add to list
    const div = document.createElement('div');
    div.className = 'profile-item';
    div.innerHTML = `
      <p><strong>Name:</strong> ${profile.name}</p>
      <p><strong>Email:</strong> ${profile.email}</p>
      <p><strong>Phone:</strong> ${profile.phone}</p>
      <p><strong>Address:</strong> ${profile.address}</p>
    `;
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', async () => {
      await deleteProfileById(profile.id);
      loadProfiles();
    });
    
    div.appendChild(deleteBtn);
    profilesList.appendChild(div);
  });
}

async function deleteProfileById(id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['profiles'], 'readwrite');
    const store = transaction.objectStore('profiles');
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function saveProfileToStorage(data) {
  return new Promise(resolve => {
    chrome.storage.local.get('profiles', (result) => {
      const profiles = result.profiles || [];
      profiles.push(data);
      chrome.storage.local.set({ profiles }, () => {
        loadProfiles();
        resolve();
      });
    });
  });
}

document.getElementById('profileSelect').addEventListener('change', function() {
  const selectedId = this.value;
  chrome.storage.local.set({ selectedProfile: selectedId });
});

document.getElementById('suggestBtn').addEventListener('click', async function() {
  const question = document.getElementById('questionInput').value.trim();
  
  if (!question) {
    alert('Please enter a question!');
    return;
  }
  
  const selectedProfile = document.getElementById('profileSelect').value;
  if (!selectedProfile) {
    alert('Please select a profile first!');
    return;
  }
  
  try {
    const suggestion = await getAISuggestion(question);
    document.getElementById('suggestionText').textContent = suggestion;
    document.getElementById('suggestionBox').style.display = 'block';
  } catch (error) {
    alert('Error getting suggestion: ' + error.message);
  }
});

document.getElementById('copySuggestion').addEventListener('click', function() {
  const text = document.getElementById('suggestionText').textContent;
  navigator.clipboard.writeText(text);
  alert('Copied!');
});

document.getElementById('regenerate').addEventListener('click', async function() {
  const question = document.getElementById('questionInput').value.trim();
  try {
    const suggestion = await getAISuggestion(question);
    document.getElementById('suggestionText').textContent = suggestion;
  } catch (error) {
    alert('Error: ' + error.message);
  }
});

async function getAISuggestion(question) {
  const GEMINI_API_KEY = 'AIzaSyAHXXQrbYvtPy6S8MgeKl05qWappux6fBc'; // Use same key
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `A user is filling out a form. Here's the question: "${question}"\n\nGive a helpful, natural answer for this question. Only provide the answer, nothing else.`
        }]
      }]
    })
  });
  
  const data = await response.json();
  return data.candidates[0].content.parts[0].text.trim();
}