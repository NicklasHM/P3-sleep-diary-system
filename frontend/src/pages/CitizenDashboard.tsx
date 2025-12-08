import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import LanguageToggle from '../components/LanguageToggle';
import { responseAPI } from '../services/api';
import './Dashboard.css';

const CitizenDashboard = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [morningAnswered, setMorningAnswered] = useState<boolean | null>(null);
  const [eveningAnswered, setEveningAnswered] = useState<boolean | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const [morning, evening] = await Promise.all([
          responseAPI.checkResponseForToday('morning'),
          responseAPI.checkResponseForToday('evening')
        ]);
        setMorningAnswered(morning.hasResponse);
        setEveningAnswered(evening.hasResponse);
      } catch (err) {
        // Hvis tjekket fejler, vis spørgeskemaer som normalt (fail-open)
        setMorningAnswered(false);
        setEveningAnswered(false);
      } finally {
        setLoadingStatus(false);
      }
    };
    
    checkStatus();
  }, []);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>{t('dashboard.citizen.title', { fullName: user?.fullName || user?.username })}</h1>
        <div className="header-actions">
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
          <div 
            className="card dashboard-card" 
            onClick={!morningAnswered ? () => navigate('/citizen/questionnaire/morning') : undefined}
            style={{ 
              cursor: morningAnswered ? 'default' : 'pointer', 
              opacity: morningAnswered ? 0.7 : 1 
            }}
          >
            <h2>🌅 {t('dashboard.citizen.morningQuestionnaire')}</h2>
            <p>{t('dashboard.citizen.morningDescription')}</p>
            {loadingStatus ? (
              <p>{t('common.loading')}</p>
            ) : morningAnswered ? (
              <p style={{ color: 'var(--text-secondary)', fontWeight: 'bold', marginTop: '1rem' }}>
                {t('dashboard.citizen.alreadyAnswered')}
              </p>
            ) : (
              <button className="btn btn-primary">{t('dashboard.citizen.morningButton')}</button>
            )}
          </div>

          <div 
            className="card dashboard-card" 
            onClick={!eveningAnswered ? () => navigate('/citizen/questionnaire/evening') : undefined}
            style={{ 
              cursor: eveningAnswered ? 'default' : 'pointer', 
              opacity: eveningAnswered ? 0.7 : 1 
            }}
          >
            <h2>🌙 {t('dashboard.citizen.eveningQuestionnaire')}</h2>
            <p>{t('dashboard.citizen.eveningDescription')}</p>
            {loadingStatus ? (
              <p>{t('common.loading')}</p>
            ) : eveningAnswered ? (
              <p style={{ color: 'var(--text-secondary)', fontWeight: 'bold', marginTop: '1rem' }}>
                {t('dashboard.citizen.alreadyAnswered')}
              </p>
            ) : (
              <button className="btn btn-primary">{t('dashboard.citizen.eveningButton')}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;





