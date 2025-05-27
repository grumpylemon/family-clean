import { router } from 'expo-router';
import { useEffect } from 'react';

export default function Index() {
  useEffect(() => {
    // Redirect to login when app loads
    router.replace('/login');
  }, []);

  return null;
}