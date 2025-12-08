import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import LanguageToggle from '../components/LanguageToggle';
import { responseAPI, questionAPI } from '../services/api';
import type { Question } from '../types';
import './QuestionnaireReview.css';

interface LocationState {
  answers: Record<string, any>;
  questionnaireId: string;
  type: string;
  allQuestions: Question[];
}

const QuestionnaireReview = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Hvis der ikke er state, redirect tilbage til dashboard
  if (!state || !state.answers || !state.allQuestions) {
    navigate('/citizen');
    return null;
  }

  const { answers, questionnaireId, type, allQuestions } = state;

  // Find alle conditional child question IDs
  const getConditionalChildQuestionIds = (): Set<string> => {
    const conditionalChildIds = new Set<string>();
    for (const question of allQuestions) {
      if (question.conditionalChildren && question.conditionalChildren.length > 0) {
        question.conditionalChildren.forEach(cc => {
          if (cc.childQuestionId) {
            conditionalChildIds.add(cc.childQuestionId);
          }
        });
      }
    }
    return conditionalChildIds;
  };

  // Filtrer kun hovedspørgsmål (ikke conditional children)
  const getRelevantQuestions = (): Question[] => {
    if (allQuestions.length === 0) return [];
    const conditionalChildIds = getConditionalChildQuestionIds();
    const mainQuestions = allQuestions.filter(q => !conditionalChildIds.has(q.id));
    return mainQuestions.sort((a, b) => a.order - b.order);
  };

  // Find conditional questions for et givent spørgsmål
  const getConditionalQuestionsForQuestion = (question: Question): Question[] => {
    if (!question.conditionalChildren || question.conditionalChildren.length === 0) {
      return [];
    }

    const answer = answers[question.id];
    if (!answer) return [];

    // Ekstraher option IDs fra answer
    let selectedOptionIds: string[] = [];
    if (Array.isArray(answer)) {
      selectedOptionIds = answer.map((val: any) => 
        typeof val === 'object' && val?.optionId ? val.optionId : val
      );
    } else if (typeof answer === 'object' && answer?.optionId) {
      selectedOptionIds = [answer.optionId];
    } else if (answer) {
      selectedOptionIds = [answer];
    }

    const matchingConditionals = question.conditionalChildren.filter(
      cc => selectedOptionIds.includes(cc.optionId)
    );

    if (matchingConditionals.length === 0) return [];

    // Hent conditional questions
    const conditionalQuestions: Question[] = [];
    matchingConditionals.forEach(cc => {
      const conditionalQuestion = allQuestions.find(q => q.id === cc.childQuestionId);
      if (conditionalQuestion) {
        conditionalQuestions.push(conditionalQuestion);
      }
    });

    return conditionalQuestions.sort((a, b) => a.order - b.order);
  };

  // Formatér svar baseret på spørgsmålstype
  const formatAnswer = (question: Question, answer: any): string => {
    if (answer === undefined || answer === null || answer === '') {
      return t('review.noAnswer');
    }

    switch (question.type) {
      case 'text':
        return answer.toString();

      case 'time_picker':
        return answer.toString();

      case 'numeric':
        return answer.toString();

      case 'slider':
        return answer.toString();

      case 'multiple_choice':
        if (typeof answer === 'object' && answer.optionId) {
          const option = question.options?.find(opt => opt.id === answer.optionId);
          if (option) {
            const optionText = language === 'en' && option.textEn ? option.textEn : option.textDa || option.text;
            if (option.isOther && answer.customText) {
              return `${optionText}: ${answer.customText}`;
            }
            return optionText;
          }
        } else if (answer) {
          const option = question.options?.find(opt => opt.id === answer);
          if (option) {
            return language === 'en' && option.textEn ? option.textEn : option.textDa || option.text;
          }
        }
        return answer.toString();

      case 'multiple_choice_multiple':
        if (Array.isArray(answer)) {
          return answer.map((val: any) => {
            if (typeof val === 'object' && val.optionId) {
              const option = question.options?.find(opt => opt.id === val.optionId);
              if (option) {
                const optionText = language === 'en' && option.textEn ? option.textEn : option.textDa || option.text;
                if (option.isOther && val.customText) {
                  return `${optionText}: ${val.customText}`;
                }
                return optionText;
              }
            } else if (val) {
              const option = question.options?.find(opt => opt.id === val);
              if (option) {
                return language === 'en' && option.textEn ? option.textEn : option.textDa || option.text;
              }
            }
            return val.toString();
          }).join(', ');
        }
        return answer.toString();

      default:
        return answer.toString();
    }
  };

  const handleEdit = (questionId: string) => {
    // Naviger tilbage til wizard med questionId så den kan navigere til det specifikke spørgsmål
    navigate(`/citizen/questionnaire/${type}`, {
      state: { editQuestionId: questionId, answers, questionnaireId }
    });
  };

  const handleSaveAndSubmit = async () => {
    try {
      setSaving(true);
      setError('');

      await responseAPI.saveResponse({
        questionnaireId: questionnaireId || type,
        answers,
      });
      
      navigate('/citizen');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || t('questionnaire.couldNotSave');
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate(`/citizen/questionnaire/${type}`, {
      state: { answers, questionnaireId }
    });
  };

  const relevantQuestions = getRelevantQuestions();

  return (
    <div className="review-container">
      <div className="review-header">
        <h1>
          {type === 'morning' 
            ? `🌅 ${t('review.morningTitle')}` 
            : `🌙 ${t('review.eveningTitle')}`}
        </h1>
        <div className="review-header-actions">
          <LanguageToggle />
          <button 
            onClick={toggleTheme} 
            className="theme-toggle" 
            title={theme === 'light' ? t('theme.toggleDark') : t('theme.toggleLight')}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button onClick={handleBack} className="btn btn-secondary">
            {t('common.back')}
          </button>
        </div>
      </div>

      <div className="review-content">
        <div className="review-intro">
          <p>{t('review.intro')}</p>
        </div>

        <div className="review-questions">
          {relevantQuestions.map((question, index) => {
            const answer = answers[question.id];
            const conditionalQuestions = getConditionalQuestionsForQuestion(question);
            const questionText = language === 'en' && question.textEn 
              ? question.textEn 
              : question.textDa || question.text;

            return (
              <div key={question.id} className="review-question-card">
                <div className="review-question-header">
                  <span className="review-question-number">{index + 1}</span>
                  <h3 className="review-question-text">{questionText}</h3>
                  <button
                    onClick={() => handleEdit(question.id)}
                    className="btn btn-secondary btn-small"
                  >
                    {t('review.edit')}
                  </button>
                </div>
                <div className="review-answer">
                  <strong>{t('review.yourAnswer')}:</strong> {formatAnswer(question, answer)}
                </div>

                {/* Vis conditional questions hvis de findes */}
                {conditionalQuestions.length > 0 && (
                  <div className="review-conditional-questions">
                    {conditionalQuestions.map((conditionalQuestion) => {
                      const conditionalAnswer = answers[conditionalQuestion.id];
                      const conditionalText = language === 'en' && conditionalQuestion.textEn 
                        ? conditionalQuestion.textEn 
                        : conditionalQuestion.textDa || conditionalQuestion.text;

                      return (
                        <div key={conditionalQuestion.id} className="review-conditional-question">
                          <div className="review-question-header">
                            <h4 className="review-conditional-question-text">{conditionalText}</h4>
                            <button
                              onClick={() => handleEdit(conditionalQuestion.id)}
                              className="btn btn-secondary btn-small"
                            >
                              {t('review.edit')}
                            </button>
                          </div>
                          <div className="review-answer">
                            <strong>{t('review.yourAnswer')}:</strong> {formatAnswer(conditionalQuestion, conditionalAnswer)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="review-actions">
          <button
            onClick={handleBack}
            className="btn btn-secondary"
            disabled={saving}
          >
            {t('common.back')}
          </button>
          <button
            onClick={handleSaveAndSubmit}
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? t('common.saving') : t('review.saveAndSubmit')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionnaireReview;





