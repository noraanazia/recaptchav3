import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SecuredPage } from './pages/SecuredPage';
import { NotFound } from './pages/NotFoundPage';
import { AppHome } from './pages/AppHome';
import { PropertyReport } from './pages/Propertyreport';
import React from 'react';
import LoginPage from './pages/LoginPage';
import { useSessionValidation } from './hooks/useSessionValidation';
import { HandleLogout } from './pages/LogoutPage';

export const RouteComponent = () => {
	//  Use useSessionValidation hook to protect propertyReport route.
	const { isAuthenticated, isLoading } = useSessionValidation();

	if (isLoading) {
        return <div>Loading...</div>;
    }

	return (
		<Router>
			<Routes>
				<Route path="/" element={<AppHome />} exact/>
				<Route path="/login" element={<LoginPage />} />
				<Route path="/page" element={<PropertyReport />} />
				<Route path="/secure" element={
          isAuthenticated ? <SecuredPage /> : <Navigate to="/login" />} />
				<Route path="/logout" element={<HandleLogout />} />
				<Route path="*" element={<NotFound />} />
        	</Routes>
		</Router>
	)
}