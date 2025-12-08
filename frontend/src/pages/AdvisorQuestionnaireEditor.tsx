import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import LanguageToggle from '../components/LanguageToggle';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { questionnaireAPI, questionAPI } from '../services/api';
import type { Question, Questionnaire, QuestionType } from '../types';
import AdvisorQuestionnaireEditorSkeleton from '../components/AdvisorQuestionnaireEditorSkeleton';
import './AdvisorQuestionnaireEditor.css';

const AdvisorQuestionnaireEditor = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ questionId: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const isReadOnly = type === 'morning';

  useEffect(() => {
    loadQuestionnaire();
  }, [type, language]);

  const loadQuestionnaire = async () => {
    try {
      setLoading(true);
      const q = await questionnaireAPI.getQuestionnaire(type!);
      setQuestionnaire(q);

      // Load questions
      const questionsData = await questionAPI.getQuestions(q.id, language);
      
      // Cleanup: Fjern alle conditionalChildren med temp IDs
      for (const question of questionsData) {
        if (question.conditionalChildren && question.conditionalChildren.length > 0) {
          const hasTempIds = question.conditionalChildren.some(
            cc => cc.childQuestionId && cc.childQuestionId.startsWith('temp_')
          );
          
          if (hasTempIds && question.id) {
            // Fjern alle conditionalChildren med temp IDs
            for (const cc of question.conditionalChildren) {
              if (cc.childQuestionId && cc.childQuestionId.startsWith('temp_')) {
                try {
                  await questionAPI.removeConditionalChild(question.id, cc.optionId, cc.childQuestionId);
                } catch (err) {
                  // Ignorer fejl ved fjernelse af temp IDs
                }
              }
            }
          }
        }
      }
      
      // Reload questions efter cleanup
      const cleanedQuestions = await questionAPI.getQuestions(q.id, language);
      setQuestions(cleanedQuestions);
    } catch (err: any) {
      setError(err.message || t('editor.couldNotLoad'));
    } finally {
      setLoading(false);
    }
  };

  // Find root spørgsmål (spørgsmål der ikke er conditional children)
  const getRootQuestions = () => {
    const allChildQuestionIds = new Set<string>();
    questions.forEach(q => {
      q.conditionalChildren?.forEach(cc => {
        allChildQuestionIds.add(cc.childQuestionId);
      });
    });
    const rootQuestions = questions.filter(q => q.id && !allChildQuestionIds.has(q.id));
    // Sorter efter order for at sikre korrekt rækkefølge
    return rootQuestions.sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  const rootQuestions = getRootQuestions();

  const handleDragEnd = async (event: DragEndEvent) => {
    if (isReadOnly) return;

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = rootQuestions.findIndex((q) => q.id === active.id);
    const newIndex = rootQuestions.findIndex((q) => q.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newRootQuestions = arrayMove(rootQuestions, oldIndex, newIndex);
    // Update order for root questions only
    const updatedRootQuestions = newRootQuestions.map((q, index) => ({
      ...q,
      order: index + 1,
    }));

    // Update order in backend
    try {
      for (const question of updatedRootQuestions) {
        if (!question.isLocked && question.id) {
          await questionAPI.updateQuestion(question.id, question);
        }
      }
      // Reload to get updated state
      const allQuestions = await questionAPI.getQuestions(questionnaire!.id, language);
      setQuestions(allQuestions);
    } catch (err: any) {
      setError(err.message || t('editor.couldNotUpdate'));
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (isReadOnly) return;
    if (!questionId || questionId.trim() === '') {
      setError(t('editor.missingId'));
      return;
    }
    // Vis bekræftelsesdialog
    setDeleteConfirmation({ questionId });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;
    
    const questionId = deleteConfirmation.questionId;
    setDeleteConfirmation(null);

    try {
      await questionAPI.deleteQuestion(questionId);
      // Reload alle spørgsmål for at sikre korrekt state
      const allQuestions = await questionAPI.getQuestions(questionnaire!.id);
      setQuestions(allQuestions);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError(t('editor.lockedCannotDelete'));
      } else {
        setError(err.message || t('editor.couldNotDelete'));
      }
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmation(null);
  };

  const handleSaveQuestion = async (question: Question) => {
    try {
      // Sikre at alle options har unikke IDs
      const questionToSave: Question = {
        ...question,
        options: question.options?.map((opt, index) => ({
          ...opt,
          id: opt.id || `opt_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
        })),
      };

      // For nye spørgsmål (uden ID), ignorer conditional children - de skal tilføjes efter spørgsmålet er gemt
      if (!question.id || question.id.trim() === '') {
        // Create new - find højeste order værdi
        const maxOrder = questions.length > 0 
          ? Math.max(...questions.map(q => q.order || 0))
          : 0;
        
        // Fjern ID og conditionalChildren for nyt spørgsmål så MongoDB kan generere en ny
        const { id, conditionalChildren, ...questionWithoutId } = questionToSave;
        
        const newQuestion: Question = {
          ...questionWithoutId,
          questionnaireId: questionnaire!.id,
          isLocked: false,
          order: maxOrder + 1,
        } as Question;
        
        const created = await questionAPI.createQuestion(newQuestion);
        
        // Reload alle spørgsmål for at sikre korrekt state
        const allQuestions = await questionAPI.getQuestions(questionnaire!.id, language);
        setQuestions(allQuestions);
        
        setEditingQuestion(null);
        setShowAddQuestion(false);
        return;
      }

      // For eksisterende spørgsmål: Find nye conditional spørgsmål der skal oprettes (dem med tempId)
      const newConditionalQuestions: Array<{ question: Partial<Question>; optionId: string; tempId: string }> = [];
      const conditionalChildrenToSave: typeof questionToSave.conditionalChildren = [];
      
      // Hent nye conditional spørgsmål fra question state
      const newConditionalQuestionsFromState = (question as any).newConditionalQuestions || [];
      
      if (questionToSave.conditionalChildren) {
        for (const cond of questionToSave.conditionalChildren) {
          // Hvis childQuestionId starter med "temp_", er det et nyt spørgsmål
          if (cond.childQuestionId && cond.childQuestionId.startsWith('temp_')) {
            const newQ = newConditionalQuestionsFromState.find(
              (nq: any) => nq.tempId === cond.childQuestionId
            );
            if (newQ) {
              newConditionalQuestions.push({
                question: newQ,
                optionId: cond.optionId,
                tempId: cond.childQuestionId,
              });
            }
            // Ignorer hvis newConditionalQuestion ikke findes
          } else {
            conditionalChildrenToSave.push(cond);
          }
        }
      }

      if (question.id && question.id.trim() !== '') {
        // Update existing
        const existingQuestion = questions.find((q) => q.id === question.id);
        
        // Opret nye conditional spørgsmål først
        const tempIdToRealId: Record<string, string> = {};
        for (const newCondQ of newConditionalQuestions) {
          const maxOrder = questions.length > 0 
            ? Math.max(...questions.map(q => q.order || 0))
            : 0;
          
          const { tempId, optionId, ...newQWithoutMeta } = newCondQ.question;
          const newQuestion: Question = {
            ...(newQWithoutMeta as Question),
            id: undefined as any,
            questionnaireId: questionnaire!.id,
            isLocked: false,
            order: maxOrder + 1,
          } as Question;
          
          const created = await questionAPI.createQuestion(newQuestion);
          if (created.id) {
            tempIdToRealId[newCondQ.tempId] = created.id;
          }
        }
        
        // Opdater conditional children med rigtige IDs (kun hvis alle nye spørgsmål er oprettet)
        const updatedConditionalChildren = [
          ...conditionalChildrenToSave,
          ...newConditionalQuestions
            .filter(ncq => tempIdToRealId[ncq.tempId]) // Kun inkluder hvis spørgsmålet blev oprettet
            .map(ncq => ({
              optionId: ncq.optionId,
              childQuestionId: tempIdToRealId[ncq.tempId],
            })),
        ];
        
        // Først: Fjern alle eksisterende conditional children (inkl. dem med temp IDs)
        if (existingQuestion && existingQuestion.conditionalChildren) {
          // Lav en kopi af listen for at undgå at modificere den mens vi itererer
          const conditionalsToRemove = [...existingQuestion.conditionalChildren];
          for (const existing of conditionalsToRemove) {
            try {
              await questionAPI.removeConditionalChild(
                question.id,
                existing.optionId,
                existing.childQuestionId
              );
            } catch (err) {
              // Ignorer fejl hvis conditional child ikke findes (fx hvis det er en temp ID)
            }
          }
        }
        
        // Vent lidt for at sikre at alle fjernelser er færdige
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Opdater spørgsmålet (uden conditional children - de håndteres separat)
        await questionAPI.updateQuestion(question.id, {
          ...questionToSave,
          conditionalChildren: [], // Sæt eksplicit til tom array
        });
        
        // Vent lidt for at sikre at opdateringen er færdig
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Tilføj alle conditional children igen med de rigtige IDs
        for (const cond of updatedConditionalChildren) {
          if (cond.childQuestionId && !cond.childQuestionId.startsWith('temp_')) {
            try {
              await questionAPI.addConditionalChild(
                question.id,
                cond.optionId,
                cond.childQuestionId
              );
            } catch (err) {
              // Ignorer fejl ved tilføjelse af conditional child
            }
          }
          // Skip conditional children med temp IDs
        }
        
        // Vent lidt for at sikre at alle tilføjelser er færdige
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Reload spørgsmålet direkte for at verificere at conditionalChildren er korrekt
        const updatedQuestion = await questionAPI.getQuestion(question.id, language);
        
        // Tjek om der stadig er temp IDs i conditionalChildren
        if (updatedQuestion.conditionalChildren) {
          const hasTempIds = updatedQuestion.conditionalChildren.some(
            cc => cc.childQuestionId && cc.childQuestionId.startsWith('temp_')
          );
          if (hasTempIds) {
            // Prøv at fjerne dem igen
            for (const cc of updatedQuestion.conditionalChildren) {
              if (cc.childQuestionId && cc.childQuestionId.startsWith('temp_')) {
                try {
                  await questionAPI.removeConditionalChild(question.id, cc.optionId, cc.childQuestionId);
                } catch (err) {
                  // Ignorer fejl
                }
              }
            }
            // Reload igen for at verificere
            await questionAPI.getQuestion(question.id, language);
          }
        }
        
        // Reload alle spørgsmål for at sikre korrekt state
        const allQuestions = await questionAPI.getQuestions(questionnaire!.id, language);
        setQuestions(allQuestions);
      }
      setEditingQuestion(null);
      setShowAddQuestion(false);
    } catch (err: any) {
      if (err.response?.status === 403) {
        setError(t('editor.lockedCannotEdit'));
      } else {
        setError(err.message || t('editor.couldNotSave'));
      }
    }
  };


  const handleRemoveConditional = async (questionId: string, optionId: string, childQuestionId: string) => {
    if (!questionId) {
      setError(t('editor.missingId'));
      return;
    }

    try {
      await questionAPI.removeConditionalChild(questionId, optionId, childQuestionId);
      
      // Reload alle spørgsmål for at sikre korrekt state
      const allQuestions = await questionAPI.getQuestions(questionnaire!.id);
      setQuestions(allQuestions);
    } catch (err: any) {
      setError(err.message || t('editor.couldNotRemoveConditional'));
    }
  };

  const handleMoveConditional = async (questionId: string, optionId: string, childQuestionId: string, direction: 'up' | 'down') => {
    if (!questionId) {
      setError(t('editor.missingId'));
      return;
    }

    try {
      const question = questions.find(q => q.id === questionId);
      if (!question || !question.conditionalChildren) return;

      const conditionalChildren = question.conditionalChildren.filter(cc => cc.optionId === optionId);
      const currentIndex = conditionalChildren.findIndex(cc => cc.childQuestionId === childQuestionId);
      
      if (currentIndex === -1) return;

      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= conditionalChildren.length) return;

      // Swap
      const newOrder = [...conditionalChildren];
      [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];

      const childQuestionIds = newOrder.map(cc => cc.childQuestionId);
      await questionAPI.updateConditionalChildrenOrder(questionId, optionId, childQuestionIds);
      
      // Reload alle spørgsmål for at sikre korrekt state
      const allQuestions = await questionAPI.getQuestions(questionnaire!.id);
      setQuestions(allQuestions);
    } catch (err: any) {
      setError(err.message || t('editor.couldNotMoveConditional'));
    }
  };

  if (loading) {
    return <AdvisorQuestionnaireEditorSkeleton />;
  }

  return (
    <div className="editor-container">
      <header className="dashboard-header">
        <h1>
          {type === 'morning' ? `🌅 ${t('questionnaire.morning')}` : `🌙 ${t('editor.title', { type: t('questionnaire.evening') })}`}
          {isReadOnly && ` ${t('editor.readOnly')}`}
        </h1>
        <div className="header-actions">
          <LanguageToggle />
          <button onClick={toggleTheme} className="theme-toggle" title={theme === 'light' ? t('theme.toggleDark') : t('theme.toggleLight')}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <button onClick={() => navigate('/advisor')} className="btn btn-secondary">
            {t('common.back')}
          </button>
          <button onClick={logout} className="btn btn-secondary">
            {t('common.logout')}
          </button>
        </div>
      </header>

      <div className="container">
        {error && (
          <div className="error-message" onClick={() => setError('')}>
            {error} ({t('common.close')})
          </div>
        )}

        {!isReadOnly && (
          <div className="editor-actions">
            <button
              onClick={() => {
                setShowAddQuestion(true);
                setEditingQuestion({
                  id: undefined as any, // Undefined for nyt spørgsmål
                  questionnaireId: questionnaire!.id,
                  text: '',
                  type: 'text' as QuestionType,
                  isLocked: false,
                  order: questions.length + 1,
                });
              }}
              className="btn btn-primary"
            >
              {t('editor.addQuestion')}
            </button>
          </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={rootQuestions.map((q) => q.id || `temp_${q.order}`)} strategy={verticalListSortingStrategy}>
            <div className="questions-list">
              {rootQuestions.map((question, index) => (
                <SortableQuestionItem
                  key={question.id || `temp_${question.order}_${index}`}
                  question={question}
                  isReadOnly={isReadOnly}
                  allQuestions={questions}
                  onEdit={() => setEditingQuestion(question)}
                  onEditChild={(childQuestion) => setEditingQuestion(childQuestion)}
                  onDelete={() => {
                    if (question.id) {
                      handleDeleteQuestion(question.id);
                    } else {
                      setError(t('editor.missingId'));
                    }
                  }}
                  onAddConditional={() => {}}
                  onRemoveConditional={handleRemoveConditional}
                  onMoveConditional={handleMoveConditional}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {editingQuestion && (
          <QuestionEditModal
            question={editingQuestion}
            onSave={handleSaveQuestion}
            onClose={() => {
              setEditingQuestion(null);
              setShowAddQuestion(false);
            }}
            allQuestions={questions}
            onAddConditional={() => {}}
            questionnaireType={type}
          />
        )}

        {deleteConfirmation && (
          <div className="modal-overlay" onClick={cancelDelete}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>{t('editor.confirmDelete')}</h2>
              <div className="modal-actions">
                <button onClick={cancelDelete} className="btn btn-secondary">
                  {t('common.cancel')}
                </button>
                <button onClick={confirmDelete} className="btn btn-danger">
                  {t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface SortableQuestionItemProps {
  question: Question;
  isReadOnly: boolean;
  onEdit: () => void;
  onEditChild?: (childQuestion: Question) => void;
  onDelete: () => void;
  onAddConditional: (optionId: string) => void;
  onRemoveConditional: (questionId: string, optionId: string, childQuestionId: string) => void;
  onMoveConditional: (questionId: string, optionId: string, childQuestionId: string, direction: 'up' | 'down') => void;
  allQuestions: Question[];
}

const SortableQuestionItem: React.FC<SortableQuestionItemProps> = ({
  question,
  isReadOnly,
  onEdit,
  onEditChild,
  onDelete,
  onAddConditional,
  onRemoveConditional,
  onMoveConditional,
  allQuestions,
}) => {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id || `temp_${question.order}`,
    disabled: isReadOnly || question.isLocked,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Find conditional spørgsmål grupperet efter option
  const getConditionalQuestionsByOption = () => {
    if (!question.conditionalChildren || question.conditionalChildren.length === 0) {
      return [];
    }

    const grouped: Array<{ optionId: string; optionText: string; questions: Question[] }> = [];
    
    question.conditionalChildren.forEach(cc => {
      const childQuestion = allQuestions.find(q => q.id === cc.childQuestionId);
      if (!childQuestion) return;

      const option = question.options?.find(opt => opt.id === cc.optionId);
      if (!option) return;

      let group = grouped.find(g => g.optionId === cc.optionId);
      if (!group) {
        group = { optionId: cc.optionId, optionText: option.text, questions: [] };
        grouped.push(group);
      }
      
      if (!group.questions.find(q => q.id === childQuestion.id)) {
        group.questions.push(childQuestion);
      }
    });

    return grouped;
  };

  const conditionalGroups = getConditionalQuestionsByOption();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`question-item ${question.isLocked ? 'locked' : ''} ${isDragging ? 'dragging' : ''}`}
    >
      <div className="question-header">
        <div className="question-drag-handle" {...attributes} {...listeners}>
          {!isReadOnly && !question.isLocked && '⋮⋮'}
        </div>
        <div className="question-content">
          <div className="question-top">
            <span className="question-order">#{question.order}</span>
            <span className="question-type">{question.type}</span>
            {question.isLocked && <span className="question-locked">{t('editor.locked')}</span>}
          </div>
          <div className="question-text">{question.text}</div>
          {question.options && question.options.length > 0 && (
            <div className="question-options-preview">
              {question.options.map((option, index) => {
                const optionId = option.id || `opt_${question.id}_${index}`;
                const group = conditionalGroups.find(g => g.optionId === optionId);
                return (
                  <div key={optionId} className="option-preview">
                    <span>{option.text}</span>
                    {group && group.questions.length > 0 && (
                      <span className="option-conditional-indicator">→ {group.questions.length}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        {!isReadOnly && !question.isLocked && question.id && (
          <div className="question-actions">
            <button onClick={onEdit} className="btn btn-secondary">
              {t('common.edit')}
            </button>
            <button onClick={onDelete} className="btn btn-danger">
              {t('common.delete')}
            </button>
          </div>
        )}
      </div>
      
      {/* Vis conditional spørgsmål indlejret */}
      {conditionalGroups.length > 0 && (
        <div className="conditional-questions-container">
          {conditionalGroups.map((group) => (
            <div key={group.optionId} className="conditional-group">
              <div className="conditional-group-header">
                <span className="conditional-group-label">{t('editor.ifOption', { optionText: group.optionText })}</span>
              </div>
              <div className="conditional-questions-list">
                {group.questions.map((childQuestion) => (
                  <div key={childQuestion.id} className="conditional-question-item">
                    <div className="conditional-question-content">
                      <span className="conditional-question-order">#{childQuestion.order}</span>
                      <span className="conditional-question-text">{childQuestion.text}</span>
                      <span className="conditional-question-type">{childQuestion.type}</span>
                    </div>
                    {!isReadOnly && !question.isLocked && (
                      <div className="conditional-question-actions">
                        {onEditChild && (
                          <button
                            onClick={() => onEditChild(childQuestion)}
                            className="btn btn-secondary btn-small"
                          >
                            {t('common.edit')}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (question.id && childQuestion.id) {
                              onRemoveConditional(question.id, group.optionId, childQuestion.id);
                            }
                          }}
                          className="btn btn-danger btn-small"
                        >
                          {t('common.remove')}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface QuestionEditModalProps {
  question: Question;
  onSave: (question: Question) => void;
  onClose: () => void;
  allQuestions: Question[];
  onAddConditional: (childQuestionId: string) => void;
  questionnaireType?: string;
}

const QuestionEditModal: React.FC<QuestionEditModalProps> = ({
  question,
  onSave,
  onClose,
  allQuestions,
  onAddConditional,
  questionnaireType,
}) => {
  const { t } = useTranslation();
  const isEveningQuestionnaire = questionnaireType === 'evening';
  const [editedQuestion, setEditedQuestion] = useState<Question>(() => {
    // Sikre at alle options har unikke IDs og bevar conditional children
    const q = { ...question } as any;
    if (q.options) {
      q.options = q.options.map((opt, index) => ({
        ...opt,
        id: opt.id || `opt_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
      }));
    }
    // Bevar conditional children hvis de findes
    if (question.conditionalChildren) {
      q.conditionalChildren = [...question.conditionalChildren];
    }
    // Bevar newConditionalQuestions hvis de findes (for nye spørgsmål)
    if ((question as any).newConditionalQuestions) {
      q.newConditionalQuestions = [...(question as any).newConditionalQuestions];
    }
    return q;
  });
  const [newOptionText, setNewOptionText] = useState('');
  const [newOptionTextEn, setNewOptionTextEn] = useState('');
  const [expandedOption, setExpandedOption] = useState<string | null>(null);
  const [creatingNewConditional, setCreatingNewConditional] = useState<{ optionId: string } | null>(null);
  const [newConditionalQuestion, setNewConditionalQuestion] = useState<Partial<Question>>({
    text: '',
    type: 'text' as QuestionType,
    options: [],
  });
  const [newConditionalOptionText, setNewConditionalOptionText] = useState('');
  const [newConditionalOptionTextEn, setNewConditionalOptionTextEn] = useState('');

  const handleAddOption = () => {
    if (!newOptionText.trim()) return;
    const newOption = {
      id: `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: newOptionText.trim(), // For bagudkompatibilitet
      textDa: newOptionText.trim(),
      textEn: newOptionTextEn.trim() || undefined,
    };
    setEditedQuestion({
      ...editedQuestion,
      options: [...(editedQuestion.options || []), newOption],
    });
    setNewOptionText('');
    setNewOptionTextEn('');
  };

  const handleAddOtherOption = () => {
    // Tjek om der allerede er en "Andet" option
    const hasOtherOption = editedQuestion.options?.some(opt => opt.isOther);
    if (hasOtherOption) {
      return; // Der er allerede en "Andet" option
    }
    
    const otherOption = {
      id: `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: 'Andet', // For bagudkompatibilitet
      textDa: 'Andet',
      textEn: 'Other',
      isOther: true,
    };
    setEditedQuestion({
      ...editedQuestion,
      options: [...(editedQuestion.options || []), otherOption],
    });
  };

  const handleRemoveOption = (optionId: string) => {
    setEditedQuestion({
      ...editedQuestion,
      options: editedQuestion.options?.filter((opt) => opt.id !== optionId),
      conditionalChildren: editedQuestion.conditionalChildren?.filter(
        (cc) => cc.optionId !== optionId
      ),
    });
  };

  const getConditionalChildrenForOption = (optionId: string) => {
    return editedQuestion.conditionalChildren?.filter((cc) => cc.optionId === optionId) || [];
  };

  const handleRemoveConditional = (optionId: string, childQuestionId: string) => {
    setEditedQuestion({
      ...editedQuestion,
      conditionalChildren: editedQuestion.conditionalChildren?.filter(
        (cc) => !(cc.optionId === optionId && cc.childQuestionId === childQuestionId)
      ),
    });
  };

  const handleAddConditionalToOption = (optionId: string, childQuestionId: string) => {
    const newConditional = {
      optionId,
      childQuestionId,
      order: (getConditionalChildrenForOption(optionId).length || 0) + 1,
    };
    setEditedQuestion({
      ...editedQuestion,
      conditionalChildren: [...(editedQuestion.conditionalChildren || []), newConditional],
    });
  };

  const handleCreateNewConditional = () => {
    if (!creatingNewConditional || !(newConditionalQuestion.textDa || newConditionalQuestion.text)?.trim()) return;
    
    // Valider at multiple_choice har mindst én option
    if ((newConditionalQuestion.type === 'multiple_choice' || newConditionalQuestion.type === 'multiple_choice_multiple') && 
        (!newConditionalQuestion.options || newConditionalQuestion.options.length === 0)) {
      return; // Button er allerede disabled, men sikkerhedscheck
    }
    
    // Opret temp ID for det nye spørgsmål
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Tilføj til conditional children med temp ID
    const newConditional = {
      optionId: creatingNewConditional.optionId,
      childQuestionId: tempId,
      order: (getConditionalChildrenForOption(creatingNewConditional.optionId).length || 0) + 1,
    };
    
    // Gem det nye spørgsmål i editedQuestion state med alle felter
    const newQ = {
      ...newConditionalQuestion,
      tempId,
      optionId: creatingNewConditional.optionId,
      // Sikre at options har IDs
      options: newConditionalQuestion.options?.map((opt, index) => ({
        ...opt,
        id: opt.id || `opt_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
      })),
    };
    
    setEditedQuestion((prev) => {
      const updated = {
        ...prev,
        conditionalChildren: [...(prev.conditionalChildren || []), newConditional],
        newConditionalQuestions: [
          ...((prev as any).newConditionalQuestions || []),
          newQ,
        ],
      };
      return updated;
    });
    
    setCreatingNewConditional(null);
    setNewConditionalQuestion({ text: '', type: 'text', options: [] });
    setNewConditionalOptionText('');
    setNewConditionalOptionTextEn('');
  };

  const handleAddOtherOptionToNewConditional = () => {
    // Undgå flere "Andet" options
    const hasOther = newConditionalQuestion.options?.some((opt) => opt.isOther);
    if (hasOther) return;

    const otherOption = {
      id: `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text: 'Andet', // For bagudkompatibilitet
      textDa: 'Andet',
      textEn: 'Other',
      isOther: true,
    };

    setNewConditionalQuestion({
      ...newConditionalQuestion,
      options: [...(newConditionalQuestion.options || []), otherOption],
    });
  };

  // Tjek om dette spørgsmål er et conditional spørgsmål (dvs. findes i conditionalChildren af et andet spørgsmål)
  const isConditionalQuestion = question.id && allQuestions.some(
    (q) => q.conditionalChildren?.some(
      (cc) => cc.childQuestionId === question.id
    )
  );

  const availableQuestions = allQuestions.filter(
    (q) => q.id && q.id !== question.id && !q.isLocked
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{question.id ? t('editor.editQuestion') : t('editor.newQuestion')}</h2>

        <div className="form-group">
          <label>{t('editor.questionText')} (Dansk)</label>
          <textarea
            value={editedQuestion.textDa || editedQuestion.text || ''}
            onChange={(e) =>
              setEditedQuestion({ ...editedQuestion, textDa: e.target.value, text: e.target.value })
            }
            className="form-input"
            rows={3}
          />
        </div>
        <div className="form-group">
          <label>{t('editor.questionText')} (English)</label>
          <textarea
            value={editedQuestion.textEn || ''}
            onChange={(e) =>
              setEditedQuestion({ ...editedQuestion, textEn: e.target.value })
            }
            className="form-input"
            rows={3}
          />
        </div>

        <div className="form-group">
          <label>{t('editor.type')}</label>
          <select
            value={editedQuestion.type}
            onChange={(e) =>
              setEditedQuestion({ ...editedQuestion, type: e.target.value as QuestionType })
            }
            className="form-input"
            disabled={question.isLocked}
          >
            <option value="text">Text</option>
            <option value="time_picker">Time Picker</option>
            <option value="numeric">Numeric</option>
            <option value="slider">Slider</option>
            <option value="multiple_choice">Multiple Choice (Enkelt valg)</option>
            <option value="multiple_choice_multiple">Multiple Choice (Flere valg)</option>
          </select>
        </div>

        {/* Min/Max værdier for numeric og slider */}
        {(editedQuestion.type === 'numeric' || editedQuestion.type === 'slider') && (
          <div className="form-group">
            <label>{t('editor.validation')}</label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.9em', marginBottom: '4px', display: 'block' }}>{t('editor.minValue')}</label>
                <input
                  type="number"
                  value={editedQuestion.minValue ?? ''}
                  onChange={(e) =>
                    setEditedQuestion({
                      ...editedQuestion,
                      minValue: e.target.value === '' ? undefined : parseInt(e.target.value, 10),
                    })
                  }
                  className="form-input"
                  placeholder={t('editor.noLimit')}
                  disabled={question.isLocked}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.9em', marginBottom: '4px', display: 'block' }}>{t('editor.maxValue')}</label>
                <input
                  type="number"
                  value={editedQuestion.maxValue ?? ''}
                  onChange={(e) =>
                    setEditedQuestion({
                      ...editedQuestion,
                      maxValue: e.target.value === '' ? undefined : parseInt(e.target.value, 10),
                    })
                  }
                  className="form-input"
                  placeholder={t('editor.noLimit')}
                  disabled={question.isLocked}
                />
              </div>
            </div>
            <small style={{ color: '#666', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
              {t('editor.defaultNoNegative')}
            </small>
          </div>
        )}

        {/* Min/Max tid for time_picker */}
        {editedQuestion.type === 'time_picker' && (
          <div className="form-group">
            <label>{t('editor.validation')}</label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.9em', marginBottom: '4px', display: 'block' }}>{t('editor.earliestTime')}</label>
                <input
                  type="time"
                  value={editedQuestion.minTime ?? ''}
                  onChange={(e) =>
                    setEditedQuestion({
                      ...editedQuestion,
                      minTime: e.target.value || undefined,
                    })
                  }
                  className="form-input"
                  disabled={question.isLocked}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.9em', marginBottom: '4px', display: 'block' }}>{t('editor.latestTime')}</label>
                <input
                  type="time"
                  value={editedQuestion.maxTime ?? ''}
                  onChange={(e) =>
                    setEditedQuestion({
                      ...editedQuestion,
                      maxTime: e.target.value || undefined,
                    })
                  }
                  className="form-input"
                  disabled={question.isLocked}
                />
              </div>
            </div>
            <small style={{ color: '#666', fontSize: '0.85em', marginTop: '4px', display: 'block' }}>
              {t('editor.timeFormat')}
            </small>
          </div>
        )}

        {/* Farvekode indstillinger - kun for aftenspørgsmål og ikke låste spørgsmål */}
        {isEveningQuestionnaire && !question.isLocked && 
         (editedQuestion.type === 'numeric' || editedQuestion.type === 'slider') && (
          <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={editedQuestion.hasColorCode || false}
                onChange={(e) =>
                  setEditedQuestion({
                    ...editedQuestion,
                    hasColorCode: e.target.checked,
                    // Ryd farvekode-værdier hvis deaktiveret
                    ...(e.target.checked ? {} : {
                      colorCodeGreenMax: undefined,
                      colorCodeGreenMin: undefined,
                      colorCodeYellowMin: undefined,
                      colorCodeYellowMax: undefined,
                      colorCodeRedMin: undefined,
                      colorCodeRedMax: undefined,
                    }),
                  })
                }
              />
              {t('editor.colorCode.enable')}
            </label>
            <small style={{ color: 'var(--text-secondary)', fontSize: '0.85em', marginTop: '4px', display: 'block', marginLeft: '24px' }}>
              {t('editor.colorCode.description')}
            </small>

            {editedQuestion.hasColorCode && (
              <div className="color-code-settings">
                <div style={{ marginBottom: '16px' }}>
                  <label>
                    {t('editor.colorCode.green')}
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={editedQuestion.colorCodeGreenMin ?? ''}
                      onChange={(e) =>
                        setEditedQuestion({
                          ...editedQuestion,
                          colorCodeGreenMin: e.target.value === '' ? undefined : parseInt(e.target.value, 10),
                        })
                      }
                      className="form-input"
                      placeholder="fx 1"
                      style={{ flex: 1 }}
                    />
                    <span>-</span>
                    <input
                      type="number"
                      value={editedQuestion.colorCodeGreenMax ?? ''}
                      onChange={(e) =>
                        setEditedQuestion({
                          ...editedQuestion,
                          colorCodeGreenMax: e.target.value === '' ? undefined : parseInt(e.target.value, 10),
                        })
                      }
                      className="form-input"
                      placeholder="fx 9"
                      style={{ flex: 1 }}
                    />
                  </div>
                  <small style={{ display: 'block', marginTop: '4px' }}>
                    {t('editor.colorCode.greenDescription')}
                  </small>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <label>
                    {t('editor.colorCode.yellow')}
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={editedQuestion.colorCodeYellowMin ?? ''}
                      onChange={(e) =>
                        setEditedQuestion({
                          ...editedQuestion,
                          colorCodeYellowMin: e.target.value === '' ? undefined : parseInt(e.target.value, 10),
                        })
                      }
                      className="form-input"
                      placeholder="fx 10"
                      style={{ flex: 1 }}
                    />
                    <span>-</span>
                    <input
                      type="number"
                      value={editedQuestion.colorCodeYellowMax ?? ''}
                      onChange={(e) =>
                        setEditedQuestion({
                          ...editedQuestion,
                          colorCodeYellowMax: e.target.value === '' ? undefined : parseInt(e.target.value, 10),
                        })
                      }
                      className="form-input"
                      placeholder="fx 19"
                      style={{ flex: 1 }}
                    />
                  </div>
                  <small style={{ display: 'block', marginTop: '4px' }}>
                    {t('editor.colorCode.yellowDescription')}
                  </small>
                </div>

                <div>
                  <label>
                    {t('editor.colorCode.red')}
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="number"
                      value={editedQuestion.colorCodeRedMin ?? ''}
                      onChange={(e) =>
                        setEditedQuestion({
                          ...editedQuestion,
                          colorCodeRedMin: e.target.value === '' ? undefined : parseInt(e.target.value, 10),
                        })
                      }
                      className="form-input"
                      placeholder="fx 20"
                      style={{ flex: 1 }}
                    />
                    <span>-</span>
                    <input
                      type="number"
                      value={editedQuestion.colorCodeRedMax ?? ''}
                      onChange={(e) =>
                        setEditedQuestion({
                          ...editedQuestion,
                          colorCodeRedMax: e.target.value === '' ? undefined : parseInt(e.target.value, 10),
                        })
                      }
                      className="form-input"
                      placeholder="fx 30"
                      style={{ flex: 1 }}
                    />
                  </div>
                  <small style={{ display: 'block', marginTop: '4px' }}>
                    {t('editor.colorCode.redDescription')}
                  </small>
                </div>
              </div>
            )}
          </div>
        )}

        {(editedQuestion.type === 'multiple_choice' || editedQuestion.type === 'multiple_choice_multiple') && (
          <div className="form-group">
            <label>{t('editor.options')}</label>
            {editedQuestion.options?.map((option) => {
              const optionId = option.id || '';
              const conditionalChildren = getConditionalChildrenForOption(optionId);
              const isExpanded = expandedOption === optionId;
              
              return (
                <div key={option.id} className="option-edit-section">
                  <div className="option-edit-item" style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <input
                      type="text"
                      value={option.textDa || option.text || ''}
                      onChange={(e) =>
                        setEditedQuestion({
                          ...editedQuestion,
                          options: editedQuestion.options?.map((opt) =>
                            opt.id === option.id ? { ...opt, textDa: e.target.value, text: e.target.value } : opt
                          ),
                        })
                      }
                      className="form-input"
                      disabled={option.isOther} // "Andet" option kan ikke redigeres
                      placeholder="Dansk tekst"
                    />
                    <input
                      type="text"
                      value={option.textEn || ''}
                      onChange={(e) =>
                        setEditedQuestion({
                          ...editedQuestion,
                          options: editedQuestion.options?.map((opt) =>
                            opt.id === option.id ? { ...opt, textEn: e.target.value } : opt
                          ),
                        })
                      }
                      className="form-input"
                      disabled={option.isOther} // "Andet" option kan ikke redigeres
                      placeholder="English text"
                    />
                    {option.isOther && (
                      <span style={{ fontSize: '0.85em', color: '#666', marginLeft: '8px' }}>
                        ({t('editor.otherOption')})
                      </span>
                    )}
                    {/* Farvekode selector for options - kun for aftenspørgsmål */}
                    {isEveningQuestionnaire && !question.isLocked && (
                      <select
                        value={option.colorCode || ''}
                        onChange={(e) =>
                          setEditedQuestion({
                            ...editedQuestion,
                            options: editedQuestion.options?.map((opt) =>
                              opt.id === option.id 
                                ? { ...opt, colorCode: e.target.value ? (e.target.value as 'green' | 'yellow' | 'red') : undefined }
                                : opt
                            ),
                          })
                        }
                        className="form-input"
                        style={{ width: '120px', marginLeft: '8px' }}
                      >
                        <option value="">{t('editor.colorCode.none')}</option>
                        <option value="green">{t('editor.colorCode.greenOption')}</option>
                        <option value="yellow">{t('editor.colorCode.yellowOption')}</option>
                        <option value="red">{t('editor.colorCode.redOption')}</option>
                      </select>
                    )}
                    <button
                      onClick={() => handleRemoveOption(option.id)}
                      className="btn btn-danger btn-small"
                    >
                      {t('common.delete')}
                    </button>
                  </div>
                  
                  {/* Vis kun conditional sektion hvis spørgsmålet allerede er gemt (har et ID) og IKKE er et conditional spørgsmål */}
                  {!question.isLocked && question.id && question.id.trim() !== '' && !isConditionalQuestion && (
                    <div className="conditional-section">
                      <button
                        onClick={() => setExpandedOption(isExpanded ? null : optionId)}
                        className="btn-conditional-toggle"
                      >
                        {isExpanded ? '▼' : '▶'} {t('editor.conditionalQuestions', { count: conditionalChildren.length })}
                      </button>
                      
                      {isExpanded && (
                        <div className="conditional-content">
                          {conditionalChildren.length > 0 && (
                            <div className="conditional-list">
                              {conditionalChildren.map((cc) => {
                                const childQ = allQuestions.find((q) => q.id === cc.childQuestionId);
                                return (
                                  <div key={cc.childQuestionId} className="conditional-item">
                                    <span>→ #{childQ?.order} - {childQ?.text}</span>
                                    <button
                                      onClick={() => handleRemoveConditional(optionId, cc.childQuestionId)}
                                      className="btn-remove-small"
                                    >
                                      ×
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          
                          <div className="conditional-add-section">
                            <button
                              onClick={() => setCreatingNewConditional({ optionId })}
                              className="btn btn-primary btn-small"
                              style={{ marginBottom: '12px', width: '100%' }}
                            >
                              {t('editor.createNewConditional')}
                            </button>
                            
                            {creatingNewConditional?.optionId === optionId ? (
                              <div className="new-conditional-form">
                                <div className="form-group" style={{ marginBottom: '12px' }}>
                                  <label>{t('editor.questionText')} (Dansk)</label>
                                  <input
                                    type="text"
                                    value={newConditionalQuestion.textDa || newConditionalQuestion.text || ''}
                                    onChange={(e) => setNewConditionalQuestion({ ...newConditionalQuestion, textDa: e.target.value, text: e.target.value })}
                                    className="form-input"
                                    placeholder={t('editor.questionText')}
                                  />
                                </div>
                                <div className="form-group" style={{ marginBottom: '12px' }}>
                                  <label>{t('editor.questionText')} (English)</label>
                                  <input
                                    type="text"
                                    value={newConditionalQuestion.textEn || ''}
                                    onChange={(e) => setNewConditionalQuestion({ ...newConditionalQuestion, textEn: e.target.value })}
                                    className="form-input"
                                    placeholder={t('editor.questionText')}
                                  />
                                </div>
                                <div className="form-group" style={{ marginBottom: '12px' }}>
                                  <label>{t('editor.type')}</label>
                                  <select
                                    value={newConditionalQuestion.type || 'text'}
                                    onChange={(e) => {
                                      const newType = e.target.value as QuestionType;
                                      setNewConditionalQuestion({ 
                                        ...newConditionalQuestion, 
                                        type: newType,
                                        // Ryd options hvis type ændres fra multiple_choice
                                        options: (newType === 'multiple_choice' || newType === 'multiple_choice_multiple') ? (newConditionalQuestion.options || []) : undefined,
                                      });
                                    }}
                                    className="form-input"
                                  >
                                    <option value="text">Text</option>
                                    <option value="time_picker">Time Picker</option>
                                    <option value="numeric">Numeric</option>
                                    <option value="slider">Slider</option>
                                    <option value="multiple_choice">Multiple Choice (Enkelt valg)</option>
                                    <option value="multiple_choice_multiple">Multiple Choice (Flere valg)</option>
                                  </select>
                                </div>

                                {/* Options for multiple_choice */}
                                {(newConditionalQuestion.type === 'multiple_choice' || newConditionalQuestion.type === 'multiple_choice_multiple') && (
                                  <div className="form-group" style={{ marginBottom: '12px' }}>
                                    <label>{t('editor.options')}</label>
                                    {newConditionalQuestion.options?.map((opt, index) => (
                                      <div key={opt.id || index} className="option-edit-item" style={{ marginBottom: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <input
                                          type="text"
                                          value={opt.textDa || opt.text || ''}
                                          onChange={(e) =>
                                            setNewConditionalQuestion({
                                              ...newConditionalQuestion,
                                              options: newConditionalQuestion.options?.map((o, i) =>
                                                i === index ? { ...o, textDa: e.target.value, text: e.target.value } : o
                                              ),
                                            })
                                          }
                                          className="form-input"
                                          placeholder="Dansk tekst"
                                        />
                                        <input
                                          type="text"
                                          value={opt.textEn || ''}
                                          onChange={(e) =>
                                            setNewConditionalQuestion({
                                              ...newConditionalQuestion,
                                              options: newConditionalQuestion.options?.map((o, i) =>
                                                i === index ? { ...o, textEn: e.target.value } : o
                                              ),
                                            })
                                          }
                                          className="form-input"
                                          placeholder="English text"
                                        />
                                        <button
                                          onClick={() =>
                                            setNewConditionalQuestion({
                                              ...newConditionalQuestion,
                                              options: newConditionalQuestion.options?.filter((_, i) => i !== index),
                                            })
                                          }
                                          className="btn btn-danger btn-small"
                                        >
                                          {t('common.delete')}
                                        </button>
                                      </div>
                                    ))}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                      <input
                                        type="text"
                                        value={newConditionalOptionText}
                                        onChange={(e) => setNewConditionalOptionText(e.target.value)}
                                        placeholder={t('editor.newOption') + ' (Dansk)'}
                                        className="form-input"
                                        onKeyPress={(e) => {
                                          if (e.key === 'Enter' && newConditionalOptionText.trim()) {
                                            const newOption = {
                                              id: `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                              text: newConditionalOptionText.trim(),
                                              textDa: newConditionalOptionText.trim(),
                                              textEn: newConditionalOptionTextEn.trim() || undefined,
                                            };
                                            setNewConditionalQuestion({
                                              ...newConditionalQuestion,
                                              options: [...(newConditionalQuestion.options || []), newOption],
                                            });
                                            setNewConditionalOptionText('');
                                            setNewConditionalOptionTextEn('');
                                          }
                                        }}
                                      />
                                      <input
                                        type="text"
                                        value={newConditionalOptionTextEn}
                                        onChange={(e) => setNewConditionalOptionTextEn(e.target.value)}
                                        placeholder={t('editor.newOption') + ' (English)'}
                                        className="form-input"
                                        onKeyPress={(e) => {
                                          if (e.key === 'Enter' && newConditionalOptionText.trim()) {
                                            const newOption = {
                                              id: `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                              text: newConditionalOptionText.trim(),
                                              textDa: newConditionalOptionText.trim(),
                                              textEn: newConditionalOptionTextEn.trim() || undefined,
                                            };
                                            setNewConditionalQuestion({
                                              ...newConditionalQuestion,
                                              options: [...(newConditionalQuestion.options || []), newOption],
                                            });
                                            setNewConditionalOptionText('');
                                            setNewConditionalOptionTextEn('');
                                          }
                                        }}
                                      />
                                      <button
                                        onClick={() => {
                                          if (newConditionalOptionText.trim()) {
                                            const newOption = {
                                              id: `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                              text: newConditionalOptionText.trim(),
                                              textDa: newConditionalOptionText.trim(),
                                              textEn: newConditionalOptionTextEn.trim() || undefined,
                                            };
                                            setNewConditionalQuestion({
                                              ...newConditionalQuestion,
                                              options: [...(newConditionalQuestion.options || []), newOption],
                                            });
                                            setNewConditionalOptionText('');
                                            setNewConditionalOptionTextEn('');
                                          }
                                        }}
                                        className="btn btn-primary btn-small"
                                      >
                                        {t('common.add')}
                                      </button>
                                      <button
                                        onClick={handleAddOtherOptionToNewConditional}
                                        className="btn btn-secondary btn-small"
                                        disabled={newConditionalQuestion.options?.some((opt) => opt.isOther)}
                                        style={{ marginLeft: '8px' }}
                                      >
                                        {t('editor.addOtherOption')}
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Min/Max værdier for numeric og slider */}
                                {(newConditionalQuestion.type === 'numeric' || newConditionalQuestion.type === 'slider') && (
                                  <div className="form-group" style={{ marginBottom: '12px' }}>
                                    <label>{t('editor.validation')}</label>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                      <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '0.9em', marginBottom: '4px', display: 'block' }}>{t('editor.minValue')}</label>
                                        <input
                                          type="number"
                                          value={newConditionalQuestion.minValue ?? ''}
                                          onChange={(e) =>
                                            setNewConditionalQuestion({
                                              ...newConditionalQuestion,
                                              minValue: e.target.value === '' ? undefined : parseInt(e.target.value, 10),
                                            })
                                          }
                                          className="form-input"
                                          placeholder={t('editor.noLimit')}
                                        />
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '0.9em', marginBottom: '4px', display: 'block' }}>{t('editor.maxValue')}</label>
                                        <input
                                          type="number"
                                          value={newConditionalQuestion.maxValue ?? ''}
                                          onChange={(e) =>
                                            setNewConditionalQuestion({
                                              ...newConditionalQuestion,
                                              maxValue: e.target.value === '' ? undefined : parseInt(e.target.value, 10),
                                            })
                                          }
                                          className="form-input"
                                          placeholder={t('editor.noLimit')}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Min/Max tid for time_picker */}
                                {newConditionalQuestion.type === 'time_picker' && (
                                  <div className="form-group" style={{ marginBottom: '12px' }}>
                                    <label>{t('editor.validation')}</label>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                      <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '0.9em', marginBottom: '4px', display: 'block' }}>{t('editor.earliestTime')}</label>
                                        <input
                                          type="time"
                                          value={newConditionalQuestion.minTime ?? ''}
                                          onChange={(e) =>
                                            setNewConditionalQuestion({
                                              ...newConditionalQuestion,
                                              minTime: e.target.value || undefined,
                                            })
                                          }
                                          className="form-input"
                                        />
                                      </div>
                                      <div style={{ flex: 1 }}>
                                        <label style={{ fontSize: '0.9em', marginBottom: '4px', display: 'block' }}>{t('editor.latestTime')}</label>
                                        <input
                                          type="time"
                                          value={newConditionalQuestion.maxTime ?? ''}
                                          onChange={(e) =>
                                            setNewConditionalQuestion({
                                              ...newConditionalQuestion,
                                              maxTime: e.target.value || undefined,
                                            })
                                          }
                                          className="form-input"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                )}

                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    onClick={handleCreateNewConditional}
                                    className="btn btn-primary btn-small"
                                    disabled={!(newConditionalQuestion.textDa || newConditionalQuestion.text)?.trim() || 
                                      ((newConditionalQuestion.type === 'multiple_choice' || newConditionalQuestion.type === 'multiple_choice_multiple') && (!newConditionalQuestion.options || newConditionalQuestion.options.length === 0))}
                                  >
                                    {t('common.add')}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setCreatingNewConditional(null);
                                      setNewConditionalQuestion({ text: '', type: 'text', options: [] });
                                      setNewConditionalOptionText('');
                                      setNewConditionalOptionTextEn('');
                                    }}
                                    className="btn btn-secondary btn-small"
                                  >
                                    {t('common.cancel')}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <select
                                value=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleAddConditionalToOption(optionId, e.target.value);
                                    e.target.value = '';
                                  }
                                }}
                                className="form-input"
                              >
                                <option value="">{t('editor.selectExisting')}</option>
                                {availableQuestions.map((q) => (
                                  <option key={q.id} value={q.id || ''}>
                                    #{q.order} - {q.text}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            <div className="add-option" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="text"
                value={newOptionText}
                onChange={(e) => setNewOptionText(e.target.value)}
                placeholder={t('editor.newOption') + ' (Dansk)'}
                className="form-input"
                onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
              />
              <input
                type="text"
                value={newOptionTextEn}
                onChange={(e) => setNewOptionTextEn(e.target.value)}
                placeholder={t('editor.newOption') + ' (English)'}
                className="form-input"
                onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
              />
              <button onClick={handleAddOption} className="btn btn-primary">
                {t('common.add')}
              </button>
            </div>
            <div style={{ marginTop: '8px' }}>
              <button 
                onClick={handleAddOtherOption} 
                className="btn btn-secondary"
                disabled={editedQuestion.options?.some(opt => opt.isOther)}
              >
                {t('editor.addOtherOption')}
              </button>
            </div>
          </div>
        )}

        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-secondary">
            {t('common.cancel')}
          </button>
          <button
            onClick={() => {
              // Sikre at newConditionalQuestions sendes med
              const questionToSave = {
                ...editedQuestion,
                newConditionalQuestions: (editedQuestion as any).newConditionalQuestions || [],
              };
              onSave(questionToSave as Question);
            }}
            className="btn btn-primary"
            disabled={!(editedQuestion.textDa || editedQuestion.text)?.trim()}
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
};


export default AdvisorQuestionnaireEditor;

