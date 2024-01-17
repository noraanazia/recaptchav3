import axios from 'axios';
import { useEffect, useState } from 'react';

export const useSessionValidation = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await axios.get('/validate-jwt');
		setIsAuthenticated(response.data.isAuthenticated);
		} 
		catch (error) {
			setIsAuthenticated(false);
		}
	finally {
        setIsLoading(false); // Set loading to false once the check is complete
      }
    };
    checkSession();
  }, []);
  console.log('isAuth', isAuthenticated)
  console.log('isAuth load', isLoading)

  return { isAuthenticated, isLoading }; // Return both states
		};