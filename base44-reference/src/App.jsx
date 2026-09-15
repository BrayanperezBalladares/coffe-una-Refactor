import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import Products from '@/pages/Products';
import Categories from '@/pages/Categories';
import Movements from '@/pages/Movements';
import Transfers from '@/pages/Transfers';
import Sales from '@/pages/Sales';
import SalesPoints from '@/pages/SalesPoints';
import CoffeeLots from '@/pages/CoffeeLots';
import Alerts from '@/pages/Alerts';
import Reports from '@/pages/Reports';
import OAuthConsent from '@/pages/OAuthConsent';
import Connect from '@/pages/Connect';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-amber-200 border-t-amber-700 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-stone-500">Cargando Café-UNA...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/oauth/consent" element={<OAuthConsent />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/movements" element={<Movements />} />
          <Route path="/transfers" element={<Transfers />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/sales-points" element={<SalesPoints />} />
          <Route path="/lots" element={<CoffeeLots />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/connect" element={<Connect />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App