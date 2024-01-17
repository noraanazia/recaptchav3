import React, { useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export const HandleLogout = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const logout = async () => {
            try {
                await axios.post('/logout');
                // Redirect to the home page or login page after logout
				setTimeout(() => navigate('/login'), 3000);
            } catch (error) {
                console.error('Logout failed', error);
                // Optionally handle error, maybe redirect to an error page
            }
        };

        logout();
    }, [navigate]);

    // Optionally show a loading message or spinner while logging out
    return <div>Logging out...</div>;
};
