import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import './LanguageToggle.css';

const LanguageToggle = () => {
  const { t } = useTranslation();
  const { language, toggleLanguage } = useLanguage();

  return (
    <button 
      onClick={toggleLanguage} 
      className="language-toggle"
      title={language === 'da' ? t('language.english') : t('language.danish')}
    >
      {language === 'da' ? <img src="../../img/GB_flag.png" alt="English" /> : <img src="../../img/DK_flag.png" alt="Danish" />}
    </button>
  );
};

export default LanguageToggle;

