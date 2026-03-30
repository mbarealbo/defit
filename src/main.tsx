import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { ProfileProvider } from './context/ProfileContext.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <ProfileProvider>
      <App />
    </ProfileProvider>
  </AuthProvider>
);
