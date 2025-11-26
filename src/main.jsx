import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
// تأكد من أن ملف الإعدادات FirebaseConfig يتم استيراده (حتى لو لم يكن مستخدماً هنا مباشرة) لضمان تهيئة قاعدة البيانات
import './firebaseConfig.js'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);