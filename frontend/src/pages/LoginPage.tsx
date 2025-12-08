import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import LanguageToggle from '../components/LanguageToggle';
import { UserRole } from '../types';
import { authAPI } from '../services/api';
import './LoginPage.css';

const LoginPage = () => {
  const { t } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.BORGER);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameAvailable, setUsernameAvailable] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const usernameCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [firstNameTouched, setFirstNameTouched] = useState(false);
  const [lastNameTouched, setLastNameTouched] = useState(false);

  const { login, register } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const validatePassword = (password: string): string | null => {
    if (!password) {
      return null; // Don't show error if empty (handled by required attribute)
    }
    if (password.length < 8) {
      return t('login.passwordMinLength');
    }
    if (!/[a-zA-Z]/.test(password)) {
      return t('login.passwordMustContainLetters');
    }
    if (!/[0-9]/.test(password)) {
      return t('login.passwordMustContainNumbers');
    }
    return null;
  };

  const validateConfirmPassword = (confirmPassword: string, password: string): string | null => {
    if (!confirmPassword) {
      return null; // Don't show error if empty (handled by required attribute)
    }
    if (confirmPassword !== password) {
      return t('login.passwordsDoNotMatch');
    }
    return null;
  };

  const validateName = (name: string): string | null => {
    if (!name) {
      return null; // Don't show error if empty (handled by required attribute)
    }
    // Tillader kun bogstaver, bindestreger, mellemrum og apostrofer (for navne som O'Brien, Mary-Jane, etc.)
    const namePattern = /^[a-zA-ZæøåÆØÅ\s\-']+$/;
    if (!namePattern.test(name)) {
      return t('login.nameOnlyLetters');
    }
    return null;
  };

  const firstNameErrorDisplay = !isLogin && firstNameTouched ? validateName(firstName) : null;
  const lastNameErrorDisplay = !isLogin && lastNameTouched ? validateName(lastName) : null;

  const passwordError = !isLogin && passwordTouched ? validatePassword(password) : null;
  // Show confirmPassword error in real-time if password is filled and confirmPassword is touched or has value
  const confirmPasswordError = !isLogin && (confirmPasswordTouched || (confirmPassword && password)) 
    ? validateConfirmPassword(confirmPassword, password) 
    : null;

  // Check username availability with debouncing
  useEffect(() => {
    if (isLogin || !username.trim()) {
      setUsernameError(null);
      return;
    }

    // Clear previous timeout
    if (usernameCheckTimeoutRef.current) {
      clearTimeout(usernameCheckTimeoutRef.current);
    }

    // Only check if username has been touched or has a value
    if (usernameTouched || username.trim().length > 0) {
      setCheckingUsername(true);
      
      // Debounce: wait 500ms after user stops typing
      usernameCheckTimeoutRef.current = setTimeout(async () => {
        try {
          const response = await authAPI.checkUsername(username.trim());
          if (response.exists) {
            setUsernameError(t('login.usernameExists'));
            setUsernameAvailable(false);
          } else {
            setUsernameError(null);
            setUsernameAvailable(true);
          }
        } catch (err) {
          // Silently fail - don't show error on network issues
          setUsernameError(null);
          setUsernameAvailable(false);
        } finally {
          setCheckingUsername(false);
        }
      }, 500);
    }

    // Cleanup
    return () => {
      if (usernameCheckTimeoutRef.current) {
        clearTimeout(usernameCheckTimeoutRef.current);
      }
    };
  }, [username, usernameTouched, isLogin, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(username, password);
      } else {
        // Valider at alle felter er udfyldt
        if (!firstName.trim() || !lastName.trim() || !username.trim()) {
          setError(t('login.allFieldsRequired'));
          setLoading(false);
          return;
        }

        // Valider username ikke allerede eksisterer
        if (usernameError) {
          setError(usernameError);
          setLoading(false);
          return;
        }

        // Valider password match
        if (password !== confirmPassword) {
          setError(t('login.passwordsDoNotMatch'));
          setLoading(false);
          return;
        }

        // Valider password krav
        const passwordError = validatePassword(password);
        if (passwordError) {
          setError(passwordError);
          setLoading(false);
          return;
        }

        await register(username, firstName, lastName, password, confirmPassword, role);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || t('login.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header-actions">
          <LanguageToggle />
          <button 
            onClick={toggleTheme} 
            className="theme-toggle" 
            title={theme === 'light' ? t('theme.toggleDark') : t('theme.toggleLight')}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
        <h1>{t('login.title')}</h1>
        <div className="login-tabs">
          <button
            className={isLogin ? 'active' : ''}
            onClick={() => {
              setIsLogin(true);
              setPasswordTouched(false);
              setConfirmPasswordTouched(false);
              setUsernameTouched(false);
              setUsernameError(null);
              setUsernameAvailable(false);
              setFirstNameTouched(false);
              setLastNameTouched(false);
              setError('');
            }}
          >
            {t('login.login')}
          </button>
          <button
            className={!isLogin ? 'active' : ''}
            onClick={() => {
              setIsLogin(false);
              setPasswordTouched(false);
              setConfirmPasswordTouched(false);
              setUsernameTouched(false);
              setUsernameError(null);
              setUsernameAvailable(false);
              setFirstNameTouched(false);
              setLastNameTouched(false);
              setError('');
            }}
          >
            {t('login.register')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {isLogin ? (
            <>
              <div className="form-group">
                <label htmlFor="username">{t('login.username')}</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">{t('login.password')}</label>
                <div className="password-input-wrapper">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="form-input"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                  >
                    {showPassword ? '👁️' : '👁'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="firstName">{t('login.firstName')}</label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    // Mark as touched when user starts typing
                    if (!firstNameTouched) {
                      setFirstNameTouched(true);
                    }
                  }}
                  onBlur={() => setFirstNameTouched(true)}
                  required
                  className={`form-input ${firstNameErrorDisplay ? 'input-error' : ''}`}
                />
                {firstNameErrorDisplay && (
                  <div className="field-error">{firstNameErrorDisplay}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="lastName">{t('login.lastName')}</label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    // Mark as touched when user starts typing
                    if (!lastNameTouched) {
                      setLastNameTouched(true);
                    }
                  }}
                  onBlur={() => setLastNameTouched(true)}
                  required
                  className={`form-input ${lastNameErrorDisplay ? 'input-error' : ''}`}
                />
                {lastNameErrorDisplay && (
                  <div className="field-error">{lastNameErrorDisplay}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="registerUsername">{t('login.username')} <span className="form-hint">({t('login.usernameHint')})</span></label>
                <input
                  id="registerUsername"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    // Mark as touched when user starts typing
                    if (!usernameTouched) {
                      setUsernameTouched(true);
                    }
                    // Clear error and availability status while typing
                    setUsernameError(null);
                    setUsernameAvailable(false);
                  }}
                  onBlur={() => setUsernameTouched(true)}
                  required
                  className={`form-input ${usernameError ? 'input-error' : usernameAvailable ? 'input-success' : ''}`}
                />
                {checkingUsername && (
                  <small className="form-hint" style={{ fontStyle: 'normal' }}>{t('login.checkingUsername')}...</small>
                )}
                {usernameError && !checkingUsername && (
                  <div className="field-error">{usernameError}</div>
                )}
                {usernameAvailable && !checkingUsername && !usernameError && (
                  <div className="field-success">✓ {t('login.usernameAvailable')}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="registerPassword">{t('login.password')}</label>
                <div className="password-input-wrapper">
                  <input
                    id="registerPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      // Reset confirmPassword touched when password changes
                      if (confirmPasswordTouched) {
                        setConfirmPasswordTouched(false);
                      }
                    }}
                    onBlur={() => setPasswordTouched(true)}
                    required
                    className={`form-input ${passwordError ? 'input-error' : ''}`}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                  >
                    {showPassword ? '👁️' : '👁'}
                  </button>
                </div>
                {passwordError && (
                  <div className="field-error">{passwordError}</div>
                )}
                {!passwordError && (
                  <small className="form-hint">{t('login.passwordRequirements')}</small>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">{t('login.confirmPassword')}</label>
                <div className="password-input-wrapper">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      // Mark as touched when user starts typing
                      if (!confirmPasswordTouched) {
                        setConfirmPasswordTouched(true);
                      }
                    }}
                    onBlur={() => setConfirmPasswordTouched(true)}
                    required
                    className={`form-input ${confirmPasswordError ? 'input-error' : ''}`}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? t('login.hidePassword') : t('login.showPassword')}
                  >
                    {showConfirmPassword ? '👁️' : '👁'}
                  </button>
                </div>
                {confirmPasswordError && (
                  <div className="field-error">{confirmPasswordError}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="role">{t('login.role')}</label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="form-input"
                >
                  <option value={UserRole.BORGER}>{t('login.roleCitizen')}</option>
                  <option value={UserRole.RÅDGIVER}>{t('login.roleAdvisor')}</option>
                </select>
              </div>
            </>
          )}

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? t('common.loading') : isLogin ? t('login.login') : t('login.register')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

