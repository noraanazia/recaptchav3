import axios from 'axios';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setAuthenticated } from './../authActions'

export const useSessionValidation = () => {
	const dispatch = useDispatch();
// Get isAuthenticated state from Redux store
  const isAuthenticated = useSelector((state: any) => state.auth.isAuthenticated);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAccessToken = async () => {
    try {
    //   const response = await axios.post('/refresh-token');
	const response = await axios.post('/refresh-token', {}, { withCredentials: true });
	  console.log('refresh accessToken status in useSessionHook', response)

      // Return an object with a structure similar to jwtResponse
		// return response.data.accessToken ? true : false;
		return response.data.success;
    } catch (error: any) {
		if (error.response && error.response.status === 401) {
			// This is an expected error when no valid refresh token is available
			console.info("Refresh token not available or expired. User needs to authenticate.");
		  } else {
			// Log other unexpected errors more verbosely
			console.error('Unexpected error during token refresh', error);
		  }
		  
		  return false  // Indicate failure to refresh the token
    }
  };

  // Function to check session validity
  const checkSession = async () => {
	setIsLoading(true);
    try {
      const jwtResponse = await axios.get('/validate-jwt');
	  console.log('auth status in useSessionHook', jwtResponse)
	  const isAuthenticatedResponse = jwtResponse.data.isAuthenticated;

      if (!isAuthenticatedResponse) {
        // If the access token is invalid, try to refresh it
        const refreshed = await refreshAccessToken();
		dispatch(setAuthenticated(refreshed))
		console.log('refresh status in useSessionHook', refreshed)
	} else {
		dispatch(setAuthenticated(isAuthenticatedResponse))
	}
    } catch (error) {
      console.error('Error validating session', error);
	  dispatch(setAuthenticated(false))
    } finally {
      setIsLoading(false); // Set loading to false once the check is complete
    }
  };

  useEffect(() => {
    checkSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  console.log('isAuth', isAuthenticated)

  return { isAuthenticated, isLoading };
};