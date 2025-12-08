import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import LanguageToggle from '../components/LanguageToggle';
import './Dashboard.css';

const AdvisorDashboard = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>{t('dashboard.advisor.title')}</h1>
        <div className="header-actions">
          <span>{t('dashboard.advisor.welcome', { fullName: user?.fullName || user?.username })}</span>
          <LanguageToggle />
          <button onClick={toggleTheme} className="theme-toggle" title={theme === 'light' ? t('theme.toggleDark') : t('theme.toggleLight')}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button onClick={logout} className="btn btn-secondary">
            {t('common.logout')}
          </button>
        </div>
      </header>

      <div className="container">
        <div className="dashboard-grid">
          <div className="card dashboard-card" onClick={() => navigate('/advisor/users')}>
            <h2>👥 {t('dashboard.advisor.citizens')}</h2>
            <p>{t('dashboard.advisor.citizensDescription')}</p>
            <button className="btn btn-primary">{t('dashboard.advisor.citizensButton')}</button>
          </div>

          <div className="card dashboard-card" onClick={() => navigate('/advisor/questionnaire/morning')}>
            <h2>🌅 {t('dashboard.advisor.morningQuestionnaire')}</h2>
            <p>{t('dashboard.advisor.morningDescription')}</p>
            <button className="btn btn-primary">{t('dashboard.advisor.morningButton')}</button>
          </div>

          <div className="card dashboard-card" onClick={() => navigate('/advisor/questionnaire/evening')}>
            <h2>🌙 {t('dashboard.advisor.eveningQuestionnaire')}</h2>
            <p>{t('dashboard.advisor.eveningDescription')}</p>
            <button className="btn btn-primary">{t('dashboard.advisor.eveningButton')}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvisorDashboard;





