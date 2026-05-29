import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDefaultUserPath } from '../utils/featureAccess';

const DashboardRedirect = () => {
    const { user } = useAuth();

    return <Navigate to={getDefaultUserPath(user)} replace />;
};

export default DashboardRedirect;
