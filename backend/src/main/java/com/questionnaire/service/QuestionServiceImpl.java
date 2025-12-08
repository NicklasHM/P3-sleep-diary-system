package com.questionnaire.service;

import com.questionnaire.model.Question;
import com.questionnaire.model.QuestionBuilder;
import com.questionnaire.model.QuestionOption;
import com.questionnaire.model.QuestionOptionBuilder;
import com.questionnaire.repository.QuestionRepository;
import com.questionnaire.service.interfaces.IQuestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class QuestionServiceImpl implements IQuestionService {

    @Autowired
    private QuestionRepository questionRepository;

    public Question createQuestion(Question question) {
        // Sæt ID til null for at sikre at MongoDB genererer en ny ID
        question.setId(null);
        
        // Valider spørgsmålet før oprettelse
        question.validate();
        
        return questionRepository.save(question);
    }

    public Question updateQuestion(String id, Question questionDetails) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Spørgsmål ikke fundet"));

        // Brug domain logic fra Question-klassen
        question.updateFrom(questionDetails);

        return questionRepository.save(question);
    }

    public void deleteQuestion(String id) {
        Question question = questionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Spørgsmål ikke fundet"));

        // Brug domain logic fra Question-klassen
        question.validateUpdate();

        // Soft delete: sæt deletedAt i stedet for at slette
        question.setDeletedAt(new Date());
        questionRepository.save(question);
    }

    public Question findById(String id) {
        return questionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Spørgsmål ikke fundet"));
    }

    public Question findById(String id, String language) {
        Question question = findById(id);
        return translateQuestion(question, language);
    }
    
    // Find spørgsmål uanset om det er slettet eller ej (til besvarelser)
    public Question findByIdIncludingDeleted(String id) {
        Optional<Question> question = questionRepository.findById(id);
        if (question.isPresent()) {
            return question.get();
        }
        throw new RuntimeException("Spørgsmål ikke fundet");
    }
    
    public Question findByIdIncludingDeleted(String id, String language) {
        Question question = findByIdIncludingDeleted(id);
        return translateQuestion(question, language);
    }

    public List<Question> findByQuestionnaireId(String questionnaireId) {
        // Denne metode returnerer kun aktive spørgsmål (deletedAt == null)
        // pga. query i repository
        return questionRepository.findByQuestionnaireIdOrderByOrderAsc(questionnaireId);
    }

    public List<Question> findByQuestionnaireId(String questionnaireId, String language) {
        List<Question> questions = findByQuestionnaireId(questionnaireId);
        return questions.stream()
                .map(q -> translateQuestion(q, language))
                .collect(java.util.stream.Collectors.toList());
    }
    
    // Find alle spørgsmål inkl. slettede (til visning af besvarelser)
    public List<Question> findByQuestionnaireIdIncludingDeleted(String questionnaireId) {
        return questionRepository.findAllByQuestionnaireIdIncludingDeleted(questionnaireId);
    }
    
    public List<Question> findByQuestionnaireIdIncludingDeleted(String questionnaireId, String language) {
        List<Question> questions = findByQuestionnaireIdIncludingDeleted(questionnaireId);
        return questions.stream()
                .map(q -> translateQuestion(q, language))
                .collect(java.util.stream.Collectors.toList());
    }

    // Hjælpemetode til at oversætte spørgsmål baseret på sprog
    public Question translateQuestion(Question question, String language) {
        // Brug Builder pattern til at kopiere og oversætte
        QuestionBuilder builder = QuestionBuilder.from(question).withLanguage(language);
        
        // Oversæt options hvis de findes
        if (question.getOptions() != null) {
            List<QuestionOption> translatedOptions = question.getOptions().stream()
                    .map(option -> QuestionOptionBuilder.from(option).withLanguage(language).build())
                    .collect(Collectors.toList());
            builder.options(translatedOptions);
        }
        
        return builder.build();
    }

    public Question addConditionalChild(String questionId, String optionId, String childQuestionId) {
        Question question = findById(questionId);
        
        // Brug domain logic fra Question-klassen
        question.addConditionalChild(optionId, childQuestionId);
        
        return questionRepository.save(question);
    }

    public Question removeConditionalChild(String questionId, String optionId, String childQuestionId) {
        Question question = findById(questionId);
        
        // Brug domain logic fra Question-klassen
        question.removeConditionalChild(optionId, childQuestionId);
        
        return questionRepository.save(question);
    }

    public Question updateConditionalChildrenOrder(String questionId, String optionId, List<String> childQuestionIds) {
        Question question = findById(questionId);
        
        // Brug domain logic fra Question-klassen
        question.updateConditionalChildrenOrder(optionId, childQuestionIds);
        
        return questionRepository.save(question);
    }

    /**
     * Finder alle root spørgsmål (ikke conditional children) for et questionnaire
     * @param questions Alle spørgsmål i questionnaire
     * @return Liste af root spørgsmål sorteret efter order
     */
    public List<Question> findRootQuestions(List<Question> questions) {
        // Find alle conditional child IDs (spørgsmål der er conditional children)
        java.util.Set<String> conditionalChildIds = new java.util.HashSet<>();
        for (Question q : questions) {
            if (q.getConditionalChildren() != null) {
                for (com.questionnaire.model.ConditionalChild cc : q.getConditionalChildren()) {
                    if (cc.getChildQuestionId() != null) {
                        conditionalChildIds.add(cc.getChildQuestionId());
                    }
                }
            }
        }
        
        // Filtrer conditional children fra og sorter efter order
        List<Question> rootQuestions = new java.util.ArrayList<>();
        for (Question q : questions) {
            if (!conditionalChildIds.contains(q.getId())) {
                rootQuestions.add(q);
            }
        }
        
        // Sorter efter order
        rootQuestions.sort((a, b) -> Integer.compare(a.getOrder(), b.getOrder()));
        
        return rootQuestions;
    }
}

