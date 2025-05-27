import { router } from 'expo-router';
import { useEffect } from 'react';

export default function Index() {
  useEffect(() => {
    // Add a small delay to ensure router is ready
    const timer = setTimeout(() => {
      router.replace('/login');
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return null;
}