let db;

function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('FormAutofillDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      if (!database.objectStoreNames.contains('profiles')) {
        database.createObjectStore('profiles', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function saveProfile(data) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['profiles'], 'readwrite');
    const store = transaction.objectStore('profiles');
    const request = store.add(data);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getProfiles() {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['profiles'], 'readonly');
    const store = transaction.objectStore('profiles');
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function deleteProfile(id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['profiles'], 'readwrite');
    const store = transaction.objectStore('profiles');
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}