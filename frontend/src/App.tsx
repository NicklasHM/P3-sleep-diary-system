import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './context/ToastContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import './i18n/config';
import LoginPage from './pages/LoginPage';
import CitizenDashboard from './pages/CitizenDashboard';
import AdvisorDashboard from './pages/AdvisorDashboard';
import QuestionnaireWizard from './components/QuestionnaireWizard';
import QuestionnaireReview from './pages/QuestionnaireReview';
import AdvisorQuestionnaireEditor from './pages/AdvisorQuestionnaireEditor';
import AdvisorUserOverview from './pages/AdvisorUserOverview';
import AppSkeleton from './components/AppSkeleton';
import './App.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({
  children,
  allowedRoles,
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return <AppSkeleton />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/citizen"
        element={
          <ProtectedRoute allowedRoles={['BORGER']}>
            <CitizenDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/citizen/questionnaire/:type"
        element={
          <ProtectedRoute allowedRoles={['BORGER']}>
            <QuestionnaireWizard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/citizen/questionnaire/review"
        element={
          <ProtectedRoute allowedRoles={['BORGER']}>
            <QuestionnaireReview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/advisor"
        element={
          <ProtectedRoute allowedRoles={['RÅDGIVER']}>
            <AdvisorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/advisor/users"
        element={
          <ProtectedRoute allowedRoles={['RÅDGIVER']}>
            <AdvisorUserOverview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/advisor/questionnaire/:type"
        element={
          <ProtectedRoute allowedRoles={['RÅDGIVER']}>
            <AdvisorQuestionnaireEditor />
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          user?.role === 'BORGER' ? (
            <Navigate to="/citizen" replace />
          ) : user?.role === 'RÅDGIVER' ? (
            <Navigate to="/advisor" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <Router>
                <AppRoutes />
              </Router>
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;





