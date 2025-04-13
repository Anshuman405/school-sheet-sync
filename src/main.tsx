import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import { Analytics } from '@vercel/analytics/react'; // Added import
import App from './App.tsx';
import './index.css';

const PUBLISHABLE_KEY = "pk_test_aW50aW1hdGUtdGFycG9uLTU5LmNsZXJrLmFjY291bnRzLmRldiQ";

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

createRoot(document.getElementById("root")!).render(
  <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
    <App />
    <Analytics /> {/* Added Analytics component */}
  </ClerkProvider>
);
