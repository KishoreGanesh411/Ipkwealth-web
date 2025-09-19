import { Navigate } from 'react-router-dom';
import AppLayout from '../layout/AppLayout';

interface PrivateRouteProps {
  isAuthenticated: boolean;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ isAuthenticated }) => {
  if (!isAuthenticated) {
    return <Navigate to={'/login'} />;
  }
  return <AppLayout />;
};

export { PrivateRoute };

