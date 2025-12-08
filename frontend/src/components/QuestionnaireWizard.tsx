import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import LanguageToggle from './LanguageToggle';
import { questionnaireAPI, responseAPI, questionAPI } from '../services/api';
import type { Question, QuestionType } from '../types';
import QuestionInput from './QuestionInput';
import QuestionnaireWizardSkeleton from './QuestionnaireWizardSkeleton';
import './QuestionnaireWizard.css';

const QuestionnaireWizard = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questionnaireId, setQuestionnaireId] = useState<string | null>(null);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [conditionalQuestions, setConditionalQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [questionHistory, setQuestionHistory] = useState<string[]>([]); // Track spørgsmål i rækkefølge
  const isInitialLoad = useRef(true);
  const previousLanguage = useRef<string>(language);

  // Load first question when type changes
  useEffect(() => {
    isInitialLoad.current = true;
    // Tjek om der er state fra review siden eller edit
    const state = location.state as any;
    if (state?.answers && state?.questionnaireId) {
      // Restore state fra review/edit
      setAnswers(state.answers);
      setQuestionnaireId(state.questionnaireId);
      if (state.editQuestionId) {
        // Hent spørgsmålet og sæt det som current
        const loadEditQuestion = async () => {
          try {
            setLoading(true);
            const question = await questionAPI.getQuestion(state.editQuestionId, language);
            setCurrentQuestion(question);
            if (question.questionnaireId && allQuestions.length === 0) {
              const allQuestionsData = await questionAPI.getQuestions(question.questionnaireId, language);
              setAllQuestions(allQuestionsData);
            }
            setQuestionHistory(prev => {
              if (!prev.includes(question.id)) {
                return [...prev, question.id];
              }
              return prev;
            });
          } catch (err) {
            loadFirstQuestion();
          } finally {
            setLoading(false);
          }
        };
        loadEditQuestion();
      } else {
        loadFirstQuestion();
      }
    } else {
      loadFirstQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  // Handle language change - reload current question with new language
  useEffect(() => {
    // Skip on initial load
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      previousLanguage.current = language;
      return;
    }

    // Only reload if language actually changed and we have a current question
    if (previousLanguage.current !== language && currentQuestion && questionnaireId) {
      previousLanguage.current = language;
      
      // Reload current question with new language
      const reloadCurrentQuestion = async () => {
        try {
          const currentQuestionId = currentQuestion.id;
          const conditionalQuestionIds = conditionalQuestions.map(q => q.id);
          
          // Reload current question with new language
          const question = await questionAPI.getQuestion(currentQuestionId, language);
          setCurrentQuestion(question);
          
          // Reload all questions with new language
          const allQuestionsData = await questionAPI.getQuestions(questionnaireId, language);
          setAllQuestions(allQuestionsData);
          
          // Reload conditional questions if they exist
          if (conditionalQuestionIds.length > 0) {
            const reloadedConditionals = await Promise.all(
              conditionalQuestionIds.map(id => questionAPI.getQuestion(id, language))
            );
            reloadedConditionals.sort((a, b) => a.order - b.order);
            setConditionalQuestions(reloadedConditionals);
          }
        } catch (err) {
          // Ignorer fejl ved reload
        }
      };
      
      reloadCurrentQuestion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const loadFirstQuestion = async () => {
    try {
      setLoading(true);
      setConditionalQuestions([]); // Ryd conditional questions
      const questions = await questionnaireAPI.startQuestionnaire(type!, language);
      if (questions.length > 0) {
        const firstQuestion = questions[0];
        
        // Hvis vi får questionnaireId, hent alle spørgsmål og find det med order 1
        if (firstQuestion.questionnaireId) {
          setQuestionnaireId(firstQuestion.questionnaireId);
          const allQuestionsData = await questionAPI.getQuestions(firstQuestion.questionnaireId, language);
          setAllQuestions(allQuestionsData);
          
          // Find det første spørgsmål baseret på order (ikke conditional children)
          const conditionalChildIds = new Set<string>();
          allQuestionsData.forEach(q => {
            q.conditionalChildren?.forEach(cc => {
              conditionalChildIds.add(cc.childQuestionId);
            });
          });
          const rootQuestions = allQuestionsData
            .filter(q => q.id && !conditionalChildIds.has(q.id))
            .sort((a, b) => (a.order || 0) - (b.order || 0));
          
          if (rootQuestions.length > 0) {
            const actualFirstQuestion = rootQuestions[0];
            setCurrentQuestion(actualFirstQuestion);
            setQuestionHistory([actualFirstQuestion.id]);
          } else {
            setCurrentQuestion(firstQuestion);
            setQuestionHistory([firstQuestion.id]);
          }
        } else {
          setCurrentQuestion(firstQuestion);
          setQuestionHistory([firstQuestion.id]);
        }
      } else {
        setError(t('questionnaire.noQuestions'));
      }
    } catch (err: any) {
      setError(err.message || t('questionnaire.couldNotLoad'));
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (value: any) => {
    if (!currentQuestion) return;
    
    // Gem svaret
    const updatedAnswers = await new Promise<Record<string, any>>((resolve) => {
      setAnswers((prev) => {
        const newAnswers = {
          ...prev,
          [currentQuestion.id]: value,
        };
        
        // Hvis det er morgenskema og spørgsmål 3 (gik i seng), sæt default for spørgsmål 4 (slukkede lyset)
        if (type === 'morning' && currentQuestion.order === 3 && currentQuestion.type === 'time_picker' && value) {
          const question4 = allQuestions.find(q => q.order === 4 && q.type === 'time_picker');
          if (question4) {
            const previousAnswer3 = prev[currentQuestion.id];
            const currentAnswer4 = prev[question4.id];
            
            // Opdater default værdi hvis:
            // 1. Spørgsmål 4 ikke har et svar endnu, ELLER
            // 2. Spørgsmål 4's værdi matcher den tidligere værdi fra spørgsmål 3 (dvs. det er stadig default værdien)
            if (!currentAnswer4 || (previousAnswer3 && currentAnswer4.toString().trim() === previousAnswer3.toString().trim())) {
              // Sæt spørgsmål 4 til samme værdi som spørgsmål 3
              newAnswers[question4.id] = value;
            }
          }
        }
        
        // Hvis det er morgenskema og spørgsmål 7 (vågnede), sæt default for spørgsmål 8 (stod op)
        if (type === 'morning' && currentQuestion.order === 9 && currentQuestion.type === 'time_picker' && value) {
          const question10 = allQuestions.find(q => q.order === 10 && q.type === 'time_picker');
          if (question10) {
            const previousAnswer9 = prev[currentQuestion.id];
            const currentAnswer10 = prev[question10.id];
            
            // Opdater default værdi hvis:
            // 1. Spørgsmål 10 ikke har et svar endnu, ELLER
            // 2. Spørgsmål 10's værdi matcher den tidligere værdi fra spørgsmål 9 (dvs. det er stadig default værdien)
            if (!currentAnswer10 || (previousAnswer9 && currentAnswer10.toString().trim() === previousAnswer9.toString().trim())) {
              // Sæt spørgsmål 10 til samme værdi som spørgsmål 9
              newAnswers[question10.id] = value;
            }
          }
        }
        
        resolve(newAnswers);
        return newAnswers;
      });
    });
    
    // Valider med det samme hvis det er relevant
    // Ryd fejl først
    setError('');
    
    // Valider tidslogik for spørgsmål 4 (slukkede lyset) hvis det er det nuværende spørgsmål
    if (type === 'morning' && currentQuestion.order === 4 && currentQuestion.type === 'time_picker') {
      const lightOffTimeError = validateLightOffTimeWithAnswers(updatedAnswers);
      if (lightOffTimeError) {
        setError(lightOffTimeError);
      }
    }
    
    // Valider tidslogik for spørgsmål 3 (gik i seng) hvis det er det nuværende spørgsmål
    // (da spørgsmål 4's validering afhænger af spørgsmål 3)
    if (type === 'morning' && currentQuestion.order === 3 && currentQuestion.type === 'time_picker') {
      const lightOffTimeError = validateLightOffTimeWithAnswers(updatedAnswers);
      if (lightOffTimeError) {
        setError(lightOffTimeError);
      }
    }
    
    // Valider tidslogik for spørgsmål 10 (stod op) hvis det er det nuværende spørgsmål
    if (type === 'morning' && currentQuestion.order === 10 && currentQuestion.type === 'time_picker') {
      const wakeTimeError = validateWakeTimesWithAnswers(updatedAnswers);
      if (wakeTimeError) {
        setError(wakeTimeError);
      }
    }
    
    // Valider tidslogik for spørgsmål 9 (vågnede) hvis det er det nuværende spørgsmål
    // (da spørgsmål 10's validering afhænger af spørgsmål 9)
    if (type === 'morning' && currentQuestion.order === 9 && currentQuestion.type === 'time_picker') {
      const wakeTimeError = validateWakeTimesWithAnswers(updatedAnswers);
      if (wakeTimeError) {
        setError(wakeTimeError);
      }
    }

    // Hvis det er multiple choice og der er conditional children, hent dem
    if ((currentQuestion.type === 'multiple_choice' || currentQuestion.type === 'multiple_choice_multiple') && currentQuestion.conditionalChildren) {
      // For multiple_choice_multiple er value et array, for multiple_choice er det en enkelt værdi
      // Ekstraher option IDs fra value (håndter både strings og objekter)
      let selectedOptionIds: string[] = [];
      if (Array.isArray(value)) {
        selectedOptionIds = value.map((val: any) => typeof val === 'object' && val?.optionId ? val.optionId : val);
      } else if (value) {
        selectedOptionIds = [typeof value === 'object' && value?.optionId ? value.optionId : value];
      }
      
      const matchingConditionals = currentQuestion.conditionalChildren.filter(
        cc => selectedOptionIds.includes(cc.optionId)
      );

      if (matchingConditionals.length > 0) {
        // Hent alle conditional child spørgsmål
        try {
          const childQuestions = await Promise.all(
            matchingConditionals.map(cc => questionAPI.getQuestion(cc.childQuestionId, language))
          );
          
          // Sorter efter order
          childQuestions.sort((a, b) => a.order - b.order);
          
          setConditionalQuestions(childQuestions);
        } catch (err) {
          setConditionalQuestions([]);
        }
      } else {
        // Ingen conditional children for de valgte options - ryd dem
        setConditionalQuestions([]);
      }
    } else {
      // Ikke multiple choice eller ingen conditional children - ryd dem
      setConditionalQuestions([]);
    }
  };

  // Valider svar - tjek om "Andet" er valgt og om customText er udfyldt
  const validateAnswer = (answer: any, question: Question): boolean => {
    if (answer === undefined || answer === null || answer === '') {
      return false;
    }
    
    // Valider text input længde (spørgsmål 2 i morgenskema: max 200 tegn)
    if (question.type === 'text' && type === 'morning' && question.order === 2) {
      const text = answer.toString();
      if (text.trim().length === 0) {
        return false;
      }
      if (text.length > 200) {
        return false;
      }
    }
    
    // For morgenskema spørgsmål 8: hvis spørgsmål 6 er "Nej", må spørgsmål 8 ikke være > 0
    if (type === 'morning' && question.order === 8 && question.type === 'numeric') {
      const question6 = allQuestions.find(q => q.order === 6 && q.type === 'multiple_choice');
      if (question6) {
        const answer6 = answers[question6.id];
        if (answer6 !== undefined && answer6 !== null) {
          try {
            const optionId = typeof answer6 === 'object' && answer6?.optionId ? answer6.optionId : answer6;
            const value8 = typeof answer === 'number' ? answer : parseInt(answer.toString(), 10);
            if (optionId === 'wake_no' && !isNaN(value8) && value8 > 0) {
              return false;
            }
          } catch (e) {
            // Hvis parsing fejler, fortsæt med normal validering
          }
        }
      }
    }
    
    // For multiple_choice med "Andet"
    if (question.type === 'multiple_choice' && typeof answer === 'object' && answer.optionId) {
      const option = question.options?.find(opt => opt.id === answer.optionId);
      if (option?.isOther) {
        return answer.customText !== undefined && answer.customText !== null && answer.customText.trim() !== '';
      }
    }
    
    // For multiple_choice_multiple med "Andet"
    if (question.type === 'multiple_choice_multiple' && Array.isArray(answer)) {
      const otherOption = question.options?.find(opt => opt.isOther);
      if (otherOption) {
        const otherAnswer = answer.find((val: any) => 
          (typeof val === 'object' && val?.optionId === otherOption.id) || val === otherOption.id
        );
        if (otherAnswer && typeof otherAnswer === 'object' && otherAnswer.optionId === otherOption.id) {
          if (!otherAnswer.customText || otherAnswer.customText.trim() === '') {
            return false;
          }
        }
      }
    }
    
    return true;
  };

  // Find alle conditional child question IDs (spørgsmål der er conditional children)
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

  // Beregn hvilke spørgsmål der skal vises i progress bar (kun hovedspørgsmål, ikke conditional)
  const getRelevantQuestions = (): Question[] => {
    if (allQuestions.length === 0) return [];
    
    // Find alle conditional child IDs
    const conditionalChildIds = getConditionalChildQuestionIds();
    
    // Filtrer conditional children fra - vis kun hovedspørgsmål i progress bar
    const mainQuestions = allQuestions.filter(q => !conditionalChildIds.has(q.id));
    
    // Sorter efter order
    return mainQuestions.sort((a, b) => a.order - b.order);
  };


  // Beregn progress (kun hovedspørgsmål, ikke conditional)
  const calculateProgress = (): { current: number; total: number; percentage: number } => {
    const relevantQuestions = getRelevantQuestions();
    const total = relevantQuestions.length;
    
    // Tæl kun besvarede hovedspørgsmål (conditional questions tælles ikke med)
    let answered = 0;
    for (const question of relevantQuestions) {
      if (validateAnswer(answers[question.id], question)) {
        answered++;
      }
    }
    
    return {
      current: answered,
      total,
      percentage: total > 0 ? Math.round((answered / total) * 100) : 0
    };
  };

  // Naviger til et specifikt spørgsmål
  const navigateToQuestion = async (questionId: string) => {
    if (!questionnaireId || !currentQuestion) {
      return;
    }
    
    // Forhindre navigation hvis det er samme spørgsmål
    if (questionId === currentQuestion.id) {
      return;
    }
    
    try {
      // Hent spørgsmålet
      const question = await questionAPI.getQuestion(questionId, language);
      setCurrentQuestion(question);
      
      // Hvis det er morgenskema og spørgsmål 6, og spørgsmål 5 er 0, sæt spørgsmål 6 til 0
      // Hvis spørgsmål 5 er > 0, sørg for at spørgsmål 6 ikke er låst
      if (type === 'morning' && question.order === 8 && question.type === 'numeric') {
        const question6 = allQuestions.find(q => q.order === 6 && q.type === 'multiple_choice');
        if (question6) {
          const answer6 = answers[question6.id];
          if (answer6 !== undefined && answer6 !== null) {
            const optionId = typeof answer6 === 'object' && answer6?.optionId ? answer6.optionId : answer6;
            if (optionId === 'wake_no') {
              // Sæt spørgsmål 8 automatisk til 0
              setAnswers((prev) => ({
                ...prev,
                [question.id]: 0,
              }));
            } else {
              // Hvis spørgsmål 6 er "Ja", sørg for at spørgsmål 8 ikke er låst (slet ikke 0 hvis det er sat)
              const currentAnswer8 = answers[question.id];
              if (currentAnswer8 === 0) {
                // Nulstil spørgsmål 8 så brugeren kan udfylde det
                setAnswers((prev) => {
                  const newAnswers = { ...prev };
                  delete newAnswers[question.id];
                  return newAnswers;
                });
              }
            }
          }
        }
      }
      
      // Tilføj til history hvis det ikke allerede er der
      setQuestionHistory(prev => {
        if (!prev.includes(questionId)) {
          return [...prev, questionId];
        }
        return prev;
      });
      
      // Opdater conditional questions hvis nødvendigt
      if (question.conditionalChildren && question.conditionalChildren.length > 0) {
        const answer = answers[question.id];
        if (answer !== undefined && answer !== null && answer !== '') {
          let selectedOptionIds: string[] = [];
          if (Array.isArray(answer)) {
            selectedOptionIds = answer.map((val: any) => typeof val === 'object' && val?.optionId ? val.optionId : val);
          } else if (typeof answer === 'object' && answer?.optionId) {
            selectedOptionIds = [answer.optionId];
          } else if (answer) {
            selectedOptionIds = [answer];
          }
          
          const matchingConditionals = question.conditionalChildren.filter(
            cc => selectedOptionIds.includes(cc.optionId)
          );
          
          if (matchingConditionals.length > 0) {
            const childQuestions = await Promise.all(
              matchingConditionals.map(cc => questionAPI.getQuestion(cc.childQuestionId, language))
            );
            childQuestions.sort((a, b) => a.order - b.order);
            setConditionalQuestions(childQuestions);
          } else {
            setConditionalQuestions([]);
          }
        } else {
          setConditionalQuestions([]);
        }
      } else {
        setConditionalQuestions([]);
      }
      
      // Valider tidslogik når brugeren navigerer tilbage til relevante spørgsmål
      if (type === 'morning' && question.type === 'time_picker') {
        if (question.order === 3 || question.order === 4) {
          // Valider light off time når brugeren navigerer til spørgsmål 2 eller 3
          const lightOffTimeError = validateLightOffTimeWithAnswers(answers);
          if (lightOffTimeError) {
            setError(lightOffTimeError);
          } else {
            setError(''); // Ryd fejl hvis validering passerer
          }
        } else if (question.order === 9 || question.order === 10) {
          // Valider wake times når brugeren navigerer til spørgsmål 7 eller 8
          const wakeTimeError = validateWakeTimesWithAnswers(answers);
          if (wakeTimeError) {
            setError(wakeTimeError);
          } else {
            setError(''); // Ryd fejl hvis validering passerer
          }
        } else {
          setError(''); // Ryd fejl for andre spørgsmål
        }
      } else {
        setError(''); // Ryd fejl for andre typer
      }
    } catch (err) {
      setError(t('questionnaire.couldNotLoad'));
    }
  };

  // Find forrige spørgsmål
  const getPreviousQuestion = (): Question | null => {
    if (!currentQuestion) return null;
    
    const relevantQuestions = getRelevantQuestions();
    if (relevantQuestions.length === 0) return null;
    
    const currentIndex = relevantQuestions.findIndex(q => q.id === currentQuestion.id);
    if (currentIndex <= 0) return null;
    
    return relevantQuestions[currentIndex - 1];
  };

  // Tjek om det er sidste spørgsmål
  const isLastQuestion = (): boolean => {
    if (!currentQuestion || allQuestions.length === 0) return false;
    
    const relevantQuestions = getRelevantQuestions();
    if (relevantQuestions.length === 0) return false;
    
    // Tjek om nuværende spørgsmål er et conditional question
    const conditionalChildIds = getConditionalChildQuestionIds();
    const isCurrentQuestionConditional = conditionalChildIds.has(currentQuestion.id);
    
    // Hvis det er et conditional question, find hovedspørgsmålet
    let mainQuestion: Question | undefined;
    if (isCurrentQuestionConditional) {
      for (const q of relevantQuestions) {
        if (q.conditionalChildren) {
          const hasThisConditional = q.conditionalChildren.some(
            cc => cc.childQuestionId === currentQuestion.id
          );
          if (hasThisConditional) {
            mainQuestion = q;
            break;
          }
        }
      }
    } else {
      mainQuestion = currentQuestion;
    }
    
    if (!mainQuestion) return false;
    
    // Find det nuværende spørgsmåls order værdi
    const currentOrder = mainQuestion.order || 0;
    
    // Tjek om der er flere hovedspørgsmål med højere order værdi
    const hasMoreMainQuestions = relevantQuestions.some(q => (q.order || 0) > currentOrder);
    if (hasMoreMainQuestions) {
      return false;
    }
    
    // Hvis det er sidste hovedspørgsmål, tjek om der er conditional questions
    if (isCurrentQuestionConditional) {
      // Vi er på et conditional question - tjek om det er sidste conditional question
      const parentConditionals = mainQuestion.conditionalChildren || [];
      if (parentConditionals.length === 0) return true;
      
      // Find alle conditional questions for dette hovedspørgsmål
      const answer = answers[mainQuestion.id];
      if (!answer) return false;
      
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
      
      const matchingConditionals = parentConditionals.filter(
        cc => selectedOptionIds.includes(cc.optionId)
      );
      
      if (matchingConditionals.length === 0) return true;
      
      // Find alle conditional question IDs
      const conditionalQuestionIds = matchingConditionals.map(cc => cc.childQuestionId);
      const currentConditionalIndex = conditionalQuestionIds.indexOf(currentQuestion.id);
      
      // Tjek om det er sidste conditional question
      return currentConditionalIndex === conditionalQuestionIds.length - 1;
    } else {
      // Vi er på hovedspørgsmålet - tjek om der er conditional questions
      if (conditionalQuestions.length > 0) {
        // Der er conditional questions - det er ikke sidste spørgsmål endnu
        return false;
      }
      
      // Tjek om der potentielt kan være conditional questions baseret på svar
      if (mainQuestion.conditionalChildren && mainQuestion.conditionalChildren.length > 0) {
        const answer = answers[mainQuestion.id];
        if (answer) {
          // Der er et svar - tjek om det trigger conditional questions
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
          
          const matchingConditionals = mainQuestion.conditionalChildren.filter(
            cc => selectedOptionIds.includes(cc.optionId)
          );
          
          if (matchingConditionals.length > 0) {
            // Der er conditional questions der skal vises - det er ikke sidste spørgsmål
            return false;
          }
        }
      }
      
      // Det er sidste hovedspørgsmål og der er ingen conditional questions
      return true;
    }
  };

  // Håndter "Forrige" knap
  const handlePrevious = () => {
    const previousQuestion = getPreviousQuestion();
    if (previousQuestion) {
      navigateToQuestion(previousQuestion.id);
    }
  };

  const validateLightOffTime = (): string | null => {
    return validateLightOffTimeWithAnswers(answers);
  };
  
  const validateLightOffTimeWithAnswers = (answersToValidate: Record<string, any>): string | null => {
    // Valider at spørgsmål 3 (slukkede lyset) ikke er før spørgsmål 2 (gik i seng)
    if (type !== 'morning') {
      return null;
    }
    
    const wentToBedQuestion = allQuestions.find(q => q.order === 3 && q.type === 'time_picker');
    const lightOffQuestion = allQuestions.find(q => q.order === 4 && q.type === 'time_picker');
    
    if (!wentToBedQuestion || !lightOffQuestion) {
      return null;
    }
    
    const wentToBedAnswer = answersToValidate[wentToBedQuestion.id];
    const lightOffAnswer = answersToValidate[lightOffQuestion.id];
    
    // Kun valider hvis begge er besvaret
    if (!wentToBedAnswer || !lightOffAnswer) {
      return null;
    }
    
    try {
      // Brug de faktiske værdier fra answers (ikke justerede værdier)
      const bedTime = wentToBedAnswer.toString().trim();
      const lightOffTime = lightOffAnswer.toString().trim();
      
      // Tjek om værdierne er i korrekt format
      if (!/^\d{2}:\d{2}$/.test(bedTime) || !/^\d{2}:\d{2}$/.test(lightOffTime)) {
        return null; // Hvis format er forkert, ignorer (valideres allerede i QuestionInput)
      }
      
      const [bedH, bedM] = bedTime.split(':').map(Number);
      const [lightH, lightM] = lightOffTime.split(':').map(Number);
      
      // Tjek om parsing lykkedes
      if (isNaN(bedH) || isNaN(bedM) || isNaN(lightH) || isNaN(lightM)) {
        return null;
      }
      
      const bedTotal = bedH * 60 + bedM;
      const lightTotal = lightH * 60 + lightM;
      
      if (lightTotal < bedTotal) {
        // Brug de faktiske værdier i fejlbeskeden
        return t('questionnaire.lightOffTimeError', { lightOffTime, bedTime });
      }
    } catch (e) {
      // Hvis parsing fejler, ignorer
      return null;
    }
    
    return null; // Ingen fejl
  };

  const validateSleepTimes = (): string | null => {
    // Find spørgsmålene baseret på order (som i backend)
    // Order 2: Gik i seng klokken
    // Order 4: Faldt i søvn efter (kan være numeric eller time_picker)
    const wentToBedQuestion = allQuestions.find(q => q.order === 3 && q.type === 'time_picker');
    const fellAsleepQuestion = allQuestions.find(q => q.order === 5);
    
    if (!wentToBedQuestion || !fellAsleepQuestion) {
      return null; // Ingen validering hvis spørgsmålene ikke findes
    }
    
    const wentToBedAnswer = answers[wentToBedQuestion.id];
    const fellAsleepAnswer = answers[fellAsleepQuestion.id];
    
    // Kun valider hvis begge er besvaret
    if (!wentToBedAnswer || !fellAsleepAnswer) {
      return null;
    }
    
    try {
      const bedTime = wentToBedAnswer.toString().trim();
      const sleepTimeStr = fellAsleepAnswer.toString().trim();
      
      // Parse "faldt i søvn efter" - kan være enten tid eller minutter
      if (fellAsleepQuestion.type === 'time_picker' && sleepTimeStr.includes(':')) {
        // Det er en tid - tjek om den er før bedTime
        const [bedH, bedM] = bedTime.split(':').map(Number);
        const [sleepH, sleepM] = sleepTimeStr.split(':').map(Number);
        
        const bedTotal = bedH * 60 + bedM;
        const sleepTotal = sleepH * 60 + sleepM;
        
        if (sleepTotal < bedTotal) {
          return t('questionnaire.sleepTimeError', { sleepTime: sleepTimeStr, bedTime });
        }
      } else if (fellAsleepQuestion.type === 'numeric') {
        // Det er minutter - tjek om det er negativt
        const minutes = typeof fellAsleepAnswer === 'number' 
          ? fellAsleepAnswer 
          : parseInt(sleepTimeStr, 10);
        if (isNaN(minutes) || minutes < 0) {
          return t('questionnaire.sleepTimeErrorMinutes');
        }
      }
    } catch (e) {
      // Hvis parsing fejler, ignorer (valideres allerede i QuestionInput)
      return null;
    }
    
    return null; // Ingen fejl
  };

  const validateWakeTimes = (): string | null => {
    return validateWakeTimesWithAnswers(answers);
  };
  
  const validateWakeTimesWithAnswers = (answersToValidate: Record<string, any>): string | null => {
    // Find spørgsmålene baseret på order
    // Order 7: Vågnede klokken
    // Order 8: Stod op klokken
    const wokeUpQuestion = allQuestions.find(q => q.order === 9 && q.type === 'time_picker');
    const gotOutOfBedQuestion = allQuestions.find(q => q.order === 10 && q.type === 'time_picker');
    
    if (!wokeUpQuestion || !gotOutOfBedQuestion) {
      return null; // Ingen validering hvis spørgsmålene ikke findes
    }
    
    const wokeUpAnswer = answersToValidate[wokeUpQuestion.id];
    const gotOutOfBedAnswer = answersToValidate[gotOutOfBedQuestion.id];
    
    // Kun valider hvis begge er besvaret
    if (!wokeUpAnswer || !gotOutOfBedAnswer) {
      return null;
    }
    
    try {
      const wakeTime = wokeUpAnswer.toString().trim();
      const outOfBedTime = gotOutOfBedAnswer.toString().trim();
      
      const [wakeH, wakeM] = wakeTime.split(':').map(Number);
      const [outH, outM] = outOfBedTime.split(':').map(Number);
      
      const wakeTotal = wakeH * 60 + wakeM;
      const outTotal = outH * 60 + outM;
      
      if (outTotal < wakeTotal) {
        return t('questionnaire.wakeTimeError', { wakeTime, outOfBedTime });
      }
    } catch (e) {
      // Hvis parsing fejler, ignorer (valideres allerede i QuestionInput)
      return null;
    }
    
    return null; // Ingen fejl
  };

  const validateQuestion6 = (): string | null => {
    // Valider spørgsmål 6-8: hvis spørgsmål 6 er "Ja", skal både spørgsmål 7 og 8 være besvaret
    if (type !== 'morning') {
      return null;
    }
    
    const question6 = allQuestions.find(q => q.order === 6 && q.type === 'multiple_choice');
    const question7 = allQuestions.find(q => q.order === 7 && q.type === 'numeric');
    const question8 = allQuestions.find(q => q.order === 8 && q.type === 'numeric');
    
    if (!question6 || !question7 || !question8) {
      return null;
    }
    
    const answer6 = answers[question6.id];
    
    // Kun valider hvis spørgsmål 6 er besvaret
    if (answer6 === undefined || answer6 === null) {
      return null;
    }
    
    try {
      const optionId = typeof answer6 === 'object' && answer6?.optionId ? answer6.optionId : answer6;
      
      if (optionId === 'wake_yes') {
        // Hvis spørgsmål 6 er "Ja", skal både spørgsmål 7 og 8 være besvaret
        const answer7 = answers[question7.id];
        const answer8 = answers[question8.id];
        
        if (answer7 === undefined || answer7 === null || answer7 === '') {
          return t('questionnaire.question6Missing', { value5: 1, question6Order: question7.order });
        }
        
        if (answer8 === undefined || answer8 === null || answer8 === '') {
          return t('questionnaire.question6Missing', { value5: 1, question6Order: question8.order });
        }
        
        const value7 = typeof answer7 === 'number' ? answer7 : parseInt(answer7.toString(), 10);
        const value8 = typeof answer8 === 'number' ? answer8 : parseInt(answer8.toString(), 10);
        
        if (isNaN(value7) || isNaN(value8)) {
          return t('questionnaire.question6Missing', { value5: 1, question6Order: question7.order });
        }
        
        if (value7 >= 1 && value8 === 0) {
          return t('questionnaire.question6Error', { value5: value7 });
        }
      } else if (optionId === 'wake_no') {
        // Hvis spørgsmål 6 er "Nej", skal spørgsmål 8 være 0
        const answer8 = answers[question8.id];
        if (answer8 !== undefined && answer8 !== null && answer8 !== '') {
          const value8 = typeof answer8 === 'number' ? answer8 : parseInt(answer8.toString(), 10);
          if (!isNaN(value8) && value8 > 0) {
            return t('questionnaire.question6Error', { value5: 0 });
          }
        }
      }
    } catch (e) {
      // Hvis parsing fejler, ignorer
      return null;
    }
    
    return null; // Ingen fejl
  };

  const handleNext = async () => {
    if (!currentQuestion) return;

    try {
      setSaving(true);
      setError(''); // Clear previous errors
      
      // Tjek om der er conditional children der ikke er besvaret
      const unansweredConditionals = conditionalQuestions.filter(
        q => !validateAnswer(answers[q.id], q)
      );

      if (unansweredConditionals.length > 0) {
        // Der er conditional children der ikke er besvaret - vis fejl
        setError(t('questionnaire.mustAnswerAll'));
        setSaving(false);
        return;
      }

      // Valider tidslogik (slukkede lyset ikke før gik i seng)
      const lightOffTimeError = validateLightOffTime();
      if (lightOffTimeError) {
        setError(lightOffTimeError);
        setSaving(false);
        return;
      }

      // Valider tidslogik (faldt i søvn ikke før gik i seng)
      const sleepTimeError = validateSleepTimes();
      if (sleepTimeError) {
        setError(sleepTimeError);
        setSaving(false);
        return;
      }

      // Valider tidslogik (stod op ikke før vågnede)
      const wakeTimeError = validateWakeTimes();
      if (wakeTimeError) {
        setError(wakeTimeError);
        setSaving(false);
        return;
      }

      // Fjern validering af spørgsmål 6 fra handleNext - den valideres kun ved saveResponse

      // Ensure current answer is saved before getting next question
      // Inkluder også alle conditional children svar
      const currentAnswer = answers[currentQuestion.id];
      const currentAnswers = {
        ...answers,
        [currentQuestion.id]: currentAnswer,
      };
      
      // Tilføj alle conditional children svar
      conditionalQuestions.forEach(q => {
        if (answers[q.id] !== undefined) {
          currentAnswers[q.id] = answers[q.id];
        }
      });
      
      // Hvis det er morgenskema og vi er på spørgsmål 6, og svaret er "Nej", sæt spørgsmål 8 til 0
      if (type === 'morning' && currentQuestion.order === 6 && currentQuestion.type === 'multiple_choice') {
        const optionId = typeof currentAnswer === 'object' && currentAnswer?.optionId ? currentAnswer.optionId : currentAnswer;
        if (optionId === 'wake_no') {
          const question8 = allQuestions.find(q => q.order === 8 && q.type === 'numeric');
          if (question8) {
            // Sæt spørgsmål 8 automatisk til 0
            currentAnswers[question8.id] = 0;
          }
        }
      }

      const nextQuestion = await responseAPI.getNextQuestion({
        questionnaireId: questionnaireId || type!,
        currentQuestionId: currentQuestion.id,
        currentAnswers,
      }, language);

      if (nextQuestion) {
        setCurrentQuestion(nextQuestion);
        // Tilføj til history hvis det ikke allerede er der
        setQuestionHistory(prev => {
          if (!prev.includes(nextQuestion.id)) {
            return [...prev, nextQuestion.id];
          }
          return prev;
        });
        setConditionalQuestions([]); // Ryd conditional questions når vi går videre
        setError(''); // Ryd fejl når vi går videre til næste spørgsmål
        // Opdater questionnaireId hvis det mangler (fra conditional child)
        if (!questionnaireId && nextQuestion.questionnaireId) {
          setQuestionnaireId(nextQuestion.questionnaireId);
        }
        // Opdater allQuestions hvis vi ikke har dem endnu eller hvis questionnaireId er opdateret
        if (allQuestions.length === 0 || (nextQuestion.questionnaireId && (!questionnaireId || nextQuestion.questionnaireId !== questionnaireId))) {
          const allQuestionsData = await questionAPI.getQuestions(nextQuestion.questionnaireId || questionnaireId!, language);
          setAllQuestions(allQuestionsData);
        }
      } else {
        // Ingen flere spørgsmål - naviger til review siden
        // Opdater answers med alle conditional children svar først
        const finalAnswers = {
          ...answers,
          [currentQuestion.id]: currentAnswer,
        };
        conditionalQuestions.forEach(q => {
          if (answers[q.id] !== undefined) {
            finalAnswers[q.id] = answers[q.id];
          }
        });
        
        // Hent alle spørgsmål hvis vi ikke har dem endnu
        let finalAllQuestions = allQuestions;
        if (finalAllQuestions.length === 0 && questionnaireId) {
          finalAllQuestions = await questionAPI.getQuestions(questionnaireId, language);
          setAllQuestions(finalAllQuestions);
        }
        
        navigate('/citizen/questionnaire/review', {
          state: {
            answers: finalAnswers,
            questionnaireId: questionnaireId || type!,
            type: type!,
            allQuestions: finalAllQuestions.length > 0 ? finalAllQuestions : allQuestions,
          }
        });
      }
    } catch (err: any) {
      if (err.response?.status === 204) {
        // No content - no more questions - naviger til review
        const finalAnswers = {
          ...answers,
          [currentQuestion.id]: answers[currentQuestion.id],
        };
        conditionalQuestions.forEach(q => {
          if (answers[q.id] !== undefined) {
            finalAnswers[q.id] = answers[q.id];
          }
        });
        
        let finalAllQuestions = allQuestions;
        if (finalAllQuestions.length === 0 && questionnaireId) {
          finalAllQuestions = await questionAPI.getQuestions(questionnaireId, language);
          setAllQuestions(finalAllQuestions);
        }
        
        navigate('/citizen/questionnaire/review', {
          state: {
            answers: finalAnswers,
            questionnaireId: questionnaireId || type!,
            type: type!,
            allQuestions: finalAllQuestions.length > 0 ? finalAllQuestions : allQuestions,
          }
        });
      } else {
        // Vis fejlbesked fra backend (valideringsfejl eller anden fejl)
        const errorMessage = err.response?.data?.error || err.message || t('questionnaire.couldNotGetNext');
        setError(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  const saveResponse = async () => {
    try {
      setSaving(true);
      setError(''); // Clear previous errors
      
      // Valider tidslogik (slukkede lyset ikke før gik i seng)
      const lightOffTimeError = validateLightOffTime();
      if (lightOffTimeError) {
        setError(lightOffTimeError);
        setSaving(false);
        return;
      }

      // Valider tidslogik før vi gemmer
      const sleepTimeError = validateSleepTimes();
      if (sleepTimeError) {
        setError(sleepTimeError);
        setSaving(false);
        return;
      }

      // Valider tidslogik (stod op ikke før vågnede)
      const wakeTimeError = validateWakeTimes();
      if (wakeTimeError) {
        setError(wakeTimeError);
        setSaving(false);
        return;
      }

      // Valider spørgsmål 6 - vis fejlbesked hvis spørgsmål 5 >= 1 og spørgsmål 6 mangler eller er 0
      const question6Error = validateQuestion6();
      if (question6Error) {
        setError(question6Error);
        setSaving(false);
        // Naviger til spørgsmål 7 eller 8 hvis de mangler
        const question7 = allQuestions.find(q => q.order === 7 && q.type === 'numeric');
        const question8 = allQuestions.find(q => q.order === 8 && q.type === 'numeric');
        if (question6Error.includes('questionnaire.question6Missing')) {
          // Naviger til spørgsmål 7 eller 8 så brugeren kan udfylde det
          const targetQuestion = question7 && !answers[question7.id] ? question7 : question8;
          if (targetQuestion) {
            setTimeout(() => {
              navigateToQuestion(targetQuestion.id);
            }, 100);
          }
        }
        return;
      }
      
      await responseAPI.saveResponse({
        questionnaireId: questionnaireId || type!,
        answers,
      });
      navigate('/citizen');
    } catch (err: any) {
      // Hvis backend returnerer en fejl, vis den
      const errorMessage = err.response?.data?.message || err.message || t('questionnaire.couldNotSave');
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    navigate('/citizen');
  };

  if (loading) {
    return <QuestionnaireWizardSkeleton />;
  }

  if (!currentQuestion) {
    return (
      <div className="wizard-container">
        <div className="wizard-error">
          <p>{error || t('questionnaire.noQuestions')}</p>
          <button onClick={handleBack} className="btn btn-primary">
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  // Opdater question objekt med dynamisk minTime baseret på answers
  const getQuestionWithDynamicMinTime = (question: Question): Question => {
    if (type !== 'morning') {
      return question;
    }
    
    // Hjælpefunktion til at validere og formatere time string
    const formatTimeString = (timeValue: any): string | undefined => {
      if (!timeValue) return undefined;
      const timeStr = timeValue.toString().trim();
      // Tjek om det er i HH:mm format
      if (/^\d{2}:\d{2}$/.test(timeStr)) {
        return timeStr;
      }
      return undefined;
    };
    
    // For spørgsmål 4 (slukkede lyset), sæt minTime til spørgsmål 3's værdi
    if (question.order === 4 && question.type === 'time_picker') {
      const question3 = allQuestions.find(q => q.order === 3 && q.type === 'time_picker');
      if (question3) {
        const answer3 = answers[question3.id];
        const formattedTime = formatTimeString(answer3);
        if (formattedTime) {
          return { ...question, minTime: formattedTime };
        }
      }
    }
    
    // For spørgsmål 10 (stod op), sæt minTime til spørgsmål 9's værdi
    if (question.order === 10 && question.type === 'time_picker') {
      const question9 = allQuestions.find(q => q.order === 9 && q.type === 'time_picker');
      if (question9) {
        const answer9 = answers[question9.id];
        const formattedTime = formatTimeString(answer9);
        if (formattedTime) {
          return { ...question, minTime: formattedTime };
        }
      }
    }
    
    return question;
  };

  const currentAnswer = answers[currentQuestion.id];
  const canProceed = validateAnswer(currentAnswer, currentQuestion);
  const progress = calculateProgress();
  const relevantQuestions = getRelevantQuestions();
  const questionWithMinTime = getQuestionWithDynamicMinTime(currentQuestion);

  return (
    <div className="wizard-container">
      <div className="wizard-header">
        <h1>{type === 'morning' ? `🌅 ${t('questionnaire.morning')}` : `🌙 ${t('questionnaire.evening')}`}</h1>
        <div className="wizard-header-actions">
          <LanguageToggle />
          <button onClick={toggleTheme} className="theme-toggle" title={theme === 'light' ? t('theme.toggleDark') : t('theme.toggleLight')}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button onClick={handleBack} className="btn btn-secondary">
            {t('common.cancel')}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="wizard-progress-container">
        <div className="wizard-progress-steps">
          {relevantQuestions.map((question, index) => {
            const isAnswered = validateAnswer(answers[question.id], question);
            // Tjek om det nuværende spørgsmål er et conditional question
            const conditionalChildIds = getConditionalChildQuestionIds();
            const isCurrentQuestionConditional = conditionalChildIds.has(currentQuestion.id);
            
            // Hvis nuværende spørgsmål er conditional, find det tilhørende hovedspørgsmål
            let isCurrent = false;
            if (isCurrentQuestionConditional) {
              // Find hovedspørgsmålet der har dette conditional question som child
              for (const mainQuestion of relevantQuestions) {
                if (mainQuestion.conditionalChildren) {
                  const hasThisConditional = mainQuestion.conditionalChildren.some(
                    cc => cc.childQuestionId === currentQuestion.id
                  );
                  if (hasThisConditional) {
                    isCurrent = question.id === mainQuestion.id;
                    break;
                  }
                }
              }
            } else {
              isCurrent = question.id === currentQuestion.id;
            }
            
            const currentIndex = relevantQuestions.findIndex(q => {
              if (isCurrentQuestionConditional) {
                // Find hovedspørgsmålet for conditional question
                for (const mainQuestion of relevantQuestions) {
                  if (mainQuestion.conditionalChildren) {
                    const hasThisConditional = mainQuestion.conditionalChildren.some(
                      cc => cc.childQuestionId === currentQuestion.id
                    );
                    if (hasThisConditional) {
                      return q.id === mainQuestion.id;
                    }
                  }
                }
                return false;
              }
              return q.id === currentQuestion.id;
            });
            const questionIndex = relevantQuestions.findIndex(q => q.id === question.id);
            // Gør alle spørgsmål klikbare - både dem der er besvaret og dem der kommer før det nuværende
            const isClickable = isAnswered || questionIndex <= currentIndex || questionHistory.includes(question.id);
            
            // Tjek om dette step er før det nuværende step (for at farve linjen korrekt - kun linjen FØR current, ikke efter)
            const isBeforeCurrent = questionIndex < currentIndex;
            
            return (
              <div
                key={question.id}
                className={`progress-step ${isCurrent ? 'current' : ''} ${isAnswered ? 'answered' : ''} ${isClickable ? 'clickable' : ''} ${isBeforeCurrent ? 'before-current' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (isClickable) {
                    navigateToQuestion(question.id);
                  }
                }}
                title={isClickable ? t('questionnaire.clickToNavigate', { number: index + 1 }) : t('questionnaire.mustAnswerPrevious')}
              >
                <span className="progress-step-number">{index + 1}</span>
                <div className="progress-step-dot" />
                {index < relevantQuestions.length - 1 && <div className="progress-step-line" />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="wizard-content">
        <div className="wizard-question-card">
          <h2 className="wizard-question-text">{language === 'en' && currentQuestion.textEn ? currentQuestion.textEn : currentQuestion.textDa || currentQuestion.text}</h2>

          <div className="wizard-input-container">
            <QuestionInput
              question={questionWithMinTime}
              value={currentAnswer}
              onChange={handleAnswer}
              allQuestions={allQuestions}
              answers={answers}
              questionnaireType={type}
            />
          </div>

          {/* Vis conditional children hvis de findes */}
          {conditionalQuestions.length > 0 && (
            <div className="conditional-questions-container">
              {conditionalQuestions.map((conditionalQuestion) => (
                <div key={conditionalQuestion.id} className="conditional-question">
                  <h3 className="conditional-question-text">{language === 'en' && conditionalQuestion.textEn ? conditionalQuestion.textEn : conditionalQuestion.textDa || conditionalQuestion.text}</h3>
                  <div className="conditional-input-container">
                    <QuestionInput
                      question={conditionalQuestion}
                      value={answers[conditionalQuestion.id]}
                      onChange={(value) => {
                        setAnswers((prev) => ({
                          ...prev,
                          [conditionalQuestion.id]: value,
                        }));
                      }}
                      allQuestions={allQuestions}
                      answers={answers}
                      questionnaireType={type}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <div className="wizard-actions">
            <button
              onClick={handlePrevious}
              className="btn btn-secondary"
              disabled={!getPreviousQuestion() || saving}
            >
              {t('common.previous')}
            </button>
            <button
              onClick={handleNext}
              className="btn btn-primary"
              disabled={!canProceed || saving}
            >
              {saving 
                ? t('common.saving') 
                : isLastQuestion() 
                  ? t('review.confirm') 
                  : t('common.next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionnaireWizard;

