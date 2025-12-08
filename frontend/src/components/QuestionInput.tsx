import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Question, QuestionType } from '../types';
import './QuestionInput.css';

interface QuestionInputProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
  allQuestions?: Question[];
  answers?: Record<string, any>;
  questionnaireType?: string;
}

const QuestionInput: React.FC<QuestionInputProps> = ({ question, value, onChange, allQuestions = [], answers = {}, questionnaireType }) => {
  const { t } = useTranslation();
  const [localValue, setLocalValue] = useState(value);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    // Når question.id eller question.type ændres, nulstil værdien hvis den ikke matcher typen
    if (question.type === 'time_picker' && typeof value !== 'string') {
      setLocalValue('');
    } else if (question.type === 'numeric' && typeof value === 'string' && value.includes(':')) {
      setLocalValue('');
    } else {
      setLocalValue(value);
    }
    setError(''); // Ryd fejl når værdi ændres eksternt
  }, [value, question.id, question.type]);

  const validateNumeric = (val: number): boolean => {
    if (isNaN(val)) {
      setError(t('questionInput.invalidNumber'));
      return false;
    }
    
    // For morgenskema spørgsmål 8: hvis spørgsmål 6 er "Nej", må spørgsmål 8 ikke være > 0
    if (questionnaireType === 'morning' && question.order === 8 && question.type === 'numeric') {
      const question6 = allQuestions.find(q => q.order === 6 && q.type === 'multiple_choice');
      if (question6) {
        const answer6 = answers[question6.id];
        if (answer6 !== undefined && answer6 !== null) {
          try {
            const optionId = typeof answer6 === 'object' && answer6?.optionId ? answer6.optionId : answer6;
            if (optionId === 'wake_no' && val > 0) {
              setError(t('questionInput.question6MaxValueWhenQuestion5IsZero'));
              return false;
            }
          } catch (e) {
            // Hvis parsing fejler, fortsæt med normal validering
          }
        }
      }
    }
    
    if (question.minValue !== undefined && val < question.minValue) {
      setError(t('questionInput.minValue', { min: question.minValue }));
      return false;
    }
    
    if (question.maxValue !== undefined && val > question.maxValue) {
      setError(t('questionInput.maxValue', { max: question.maxValue }));
      return false;
    }
    
    // Standard: ingen negative værdier hvis ikke minValue er sat
    if (question.minValue === undefined && val < 0) {
      setError(t('questionInput.negativeNotAllowed'));
      return false;
    }
    
    setError('');
    return true;
  };

  const validateText = (text: string): boolean => {
    if (!text || text.trim().length === 0) {
      setError('');
      return true; // Tom værdi er ok (valideres ved submit)
    }
    
    // For morgenskema spørgsmål 1: max 200 tegn
    if (question.order === 2 && text.length > 200) {
      setError(t('questionInput.maxLength', { max: 200 }));
      return false;
    }
    
    setError('');
    return true;
  };

  const validateTime = (timeString: string): boolean => {
    if (!timeString) {
      setError('');
      return true; // Tom værdi er ok (valideres ved submit)
    }
    
    const time = timeString.split(':');
    if (time.length !== 2) {
      setError(t('questionInput.invalidTime'));
      return false;
    }
    
    const hours = parseInt(time[0], 10);
    const minutes = parseInt(time[1], 10);
    
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      setError(t('questionInput.invalidTime'));
      return false;
    }
    
    // Valider mod min/max tid
    if (question.minTime) {
      const [minH, minM] = question.minTime.split(':').map(Number);
      const minTotal = minH * 60 + minM;
      const currentTotal = hours * 60 + minutes;
      
      if (currentTotal < minTotal) {
        // For morgenskema spørgsmål 4, vis en mere specifik fejlbesked
        if (questionnaireType === 'morning' && question.order === 4) {
          setError(t('questionnaire.lightOffTimeError', { lightOffTime: timeString, bedTime: question.minTime }));
        } else {
          setError(t('questionInput.minTime', { time: question.minTime }));
        }
        return false;
      }
    }
    
    if (question.maxTime) {
      const [maxH, maxM] = question.maxTime.split(':').map(Number);
      const maxTotal = maxH * 60 + maxM;
      const currentTotal = hours * 60 + minutes;
      
      if (currentTotal > maxTotal) {
        // For morgenskema spørgsmål 10, vis en mere specifik fejlbesked
        if (questionnaireType === 'morning' && question.order === 10) {
          setError(t('questionnaire.wakeTimeError', { wakeTime: question.maxTime, outOfBedTime: timeString }));
        } else {
          setError(t('questionInput.maxTime', { time: question.maxTime }));
        }
        return false;
      }
    }
    
    setError('');
    return true;
  };

  const handleChange = (newValue: any) => {
    setLocalValue(newValue);
    
    // Valider baseret på type
    if (question.type === 'numeric' || question.type === 'slider') {
      const numValue = typeof newValue === 'number' ? newValue : parseFloat(newValue);
      if (!isNaN(numValue)) {
        validateNumeric(numValue);
      }
    } else if (question.type === 'time_picker' && newValue) {
      validateTime(newValue);
    } else if (question.type === 'text' && newValue) {
      validateText(newValue);
    } else {
      setError(''); // Ryd fejl for andre typer
    }
    
    // Send værdien til parent (uden justering)
    onChange(newValue);
  };

  switch (question.type) {
    case 'text':
      // For morgenskema spørgsmål 1: max 200 tegn
      const maxLength = question.order === 2 ? 200 : undefined;
      return (
        <div>
          <textarea
            className="question-input text-input"
            value={localValue || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={t('questionInput.placeholder')}
            rows={4}
            maxLength={maxLength}
          />
          {maxLength && (
            <div className="input-hint" style={{ marginTop: '4px', fontSize: '0.875rem', color: '#666' }}>
              {t('questionInput.maxLengthHint', { max: maxLength })}
            </div>
          )}
          {error && <div className="input-error">{error}</div>}
        </div>
      );

    case 'time_picker':
      // Sikre at værdien er en string i HH:mm format, ikke et tal
      let timeValue = typeof localValue === 'string' && localValue.includes(':') 
        ? localValue 
        : '';
      
      // Valider min/max format først
      const isValidTimeFormat = (time: string | undefined): boolean => {
        if (!time) return false;
        return /^\d{2}:\d{2}$/.test(time.trim());
      };
      
      const minTime = isValidTimeFormat(question.minTime) ? question.minTime!.trim() : undefined;
      const maxTime = isValidTimeFormat(question.maxTime) ? question.maxTime!.trim() : undefined;
      
      return (
        <div>
          <input
            type="time"
            className={`question-input time-input ${error ? 'error' : ''}`}
            value={timeValue}
            onChange={(e) => handleChange(e.target.value)}
            step={question.text.includes('5 min') ? '300' : undefined}
            min={minTime}
            max={maxTime}
          />
          {error && <div className="input-error">{error}</div>}
        </div>
      );

    case 'numeric':
      // For morgenskema spørgsmål 8: hvis spørgsmål 6 er "Nej", begræns max til 0
      let maxValue = question.maxValue;
      let isDisabled = false;
      if (questionnaireType === 'morning' && question.order === 8) {
        const question6 = allQuestions.find(q => q.order === 6 && q.type === 'multiple_choice');
        if (question6) {
          const answer6 = answers[question6.id];
          if (answer6 !== undefined && answer6 !== null) {
            try {
              const optionId = typeof answer6 === 'object' && answer6?.optionId ? answer6.optionId : answer6;
              if (optionId === 'wake_no') {
                maxValue = 0;
                isDisabled = true;
              }
            } catch (e) {
              // Hvis parsing fejler, fortsæt normalt
            }
          }
        }
      }
      
      return (
        <div>
          <input
            type="number"
            className={`question-input numeric-input ${error ? 'error' : ''}`}
            value={localValue !== null && localValue !== undefined ? localValue : ''}
            onChange={(e) => {
              const val = e.target.value === '' ? '' : parseInt(e.target.value, 10);
              handleChange(isNaN(val as number) ? '' : val);
            }}
            min={question.minValue !== undefined ? question.minValue : 0}
            max={maxValue}
            disabled={isDisabled}
            title={isDisabled ? t('questionInput.question6DisabledWhenQuestion5IsZero') : undefined}
          />
          {isDisabled && (
            <div className="input-hint" style={{ marginTop: '4px', fontSize: '0.875rem', color: '#666', fontStyle: 'italic' }}>
              {t('questionInput.question6HintWhenQuestion5IsZero')}
            </div>
          )}
          {error && <div className="input-error">{error}</div>}
        </div>
      );

    case 'slider':
      const min = question.minValue !== undefined ? question.minValue : 1;
      const max = question.maxValue !== undefined ? question.maxValue : 5;
      const sliderValue = localValue || min;
      // For morgenskema spørgsmål 9, vis beskrivende labels
      const isQuestion9 = question.order === 9;
      return (
        <div className="slider-container">
          <input
            type="range"
            className="question-input slider-input"
            min={min}
            max={max}
            value={sliderValue}
            onChange={(e) => handleChange(parseInt(e.target.value))}
          />
          <div className="slider-labels">
            {isQuestion9 ? (
              <>
                <span className="slider-label-left">{t('questionInput.slider1')}</span>
                <span className="slider-value">{sliderValue}</span>
                <span className="slider-label-right">{t('questionInput.slider5')}</span>
              </>
            ) : (
              <>
                <span>{min}</span>
                <span className="slider-value">{sliderValue}</span>
                <span>{max}</span>
              </>
            )}
          </div>
          {error && <div className="input-error">{error}</div>}
        </div>
      );

    case 'multiple_choice':
      // Tjek om der er en "Andet" option valgt
      const otherOption = question.options?.find(opt => opt.isOther);
      const isOtherSelected = otherOption && (
        localValue === otherOption.id || 
        (typeof localValue === 'object' && localValue?.optionId === otherOption.id)
      );
      const otherCustomText = typeof localValue === 'object' && localValue?.optionId === otherOption?.id 
        ? localValue.customText || '' 
        : '';

      return (
        <div className="multiple-choice-container">
          {question.options?.map((option) => {
            const isSelected = option.isOther 
              ? isOtherSelected
              : localValue === option.id || (typeof localValue === 'object' && localValue?.optionId === option.id);
            
            return (
              <div key={option.id}>
                <label className="multiple-choice-option">
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={option.id}
                    checked={isSelected}
                    onChange={() => {
                      if (option.isOther) {
                        // Når "Andet" vælges, sæt værdien til et objekt
                        handleChange({ optionId: option.id, customText: '' });
                      } else {
                        // Normal option - bare gem optionId
                        handleChange(option.id);
                      }
                    }}
                  />
                  <span>{option.text}</span>
                </label>
                {option.isOther && isOtherSelected && (
                  <div style={{ marginLeft: '24px', marginTop: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      className="question-input"
                      value={otherCustomText}
                      onChange={(e) => handleChange({ optionId: option.id, customText: e.target.value })}
                      placeholder={t('questionInput.otherPlaceholder')}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );

    case 'multiple_choice_multiple':
      // Sikre at localValue er et array
      const selectedValues = Array.isArray(localValue) ? localValue : (localValue ? [localValue] : []);
      
      // Find "Andet" option
      const otherOptionMultiple = question.options?.find(opt => opt.isOther);
      const isOtherSelectedMultiple = otherOptionMultiple && selectedValues.some(
        val => val === otherOptionMultiple.id || 
        (typeof val === 'object' && val?.optionId === otherOptionMultiple.id)
      );
      const otherCustomTextMultiple = otherOptionMultiple && selectedValues.find(
        val => typeof val === 'object' && val?.optionId === otherOptionMultiple.id
      )?.customText || '';

      const handleCheckboxChange = (optionId: string, isChecked: boolean) => {
        if (isChecked) {
          // Hvis det er "Andet" option, tilføj som objekt
          if (otherOptionMultiple && optionId === otherOptionMultiple.id) {
            handleChange([...selectedValues, { optionId, customText: '' }]);
          } else {
            // Normal option - tilføj option ID til arrayet
            handleChange([...selectedValues, optionId]);
          }
        } else {
          // Fjern option ID eller objekt fra arrayet
          handleChange(selectedValues.filter((val: any) => {
            if (typeof val === 'object') {
              return val.optionId !== optionId;
            }
            return val !== optionId;
          }));
        }
      };

      return (
        <div className="multiple-choice-container">
          {question.options?.map((option) => {
            const isSelected = selectedValues.some(val => {
              if (option.isOther) {
                return val === option.id || (typeof val === 'object' && val?.optionId === option.id);
              }
              return val === option.id || (typeof val === 'object' && val?.optionId === option.id);
            });

            return (
              <div key={option.id}>
                <label className="multiple-choice-option">
                  <input
                    type="checkbox"
                    value={option.id}
                    checked={isSelected}
                    onChange={(e) => handleCheckboxChange(option.id, e.target.checked)}
                  />
                  <span>{option.text}</span>
                </label>
                {option.isOther && isSelected && (
                  <div style={{ marginLeft: '24px', marginTop: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      className="question-input"
                      value={otherCustomTextMultiple}
                      onChange={(e) => {
                        // Opdater customText i arrayet
                        const updatedValues = selectedValues.map((val: any) => {
                          if (typeof val === 'object' && val?.optionId === option.id) {
                            return { optionId: option.id, customText: e.target.value };
                          }
                          return val;
                        });
                        handleChange(updatedValues);
                      }}
                      placeholder={t('questionInput.otherPlaceholder')}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );

    default:
      return (
        <input
          type="text"
          className="question-input"
          value={localValue || ''}
          onChange={(e) => handleChange(e.target.value)}
        />
      );
  }
};

export default QuestionInput;




