package com.questionnaire.config;

import com.questionnaire.model.*;
import com.questionnaire.repository.QuestionRepository;
import com.questionnaire.repository.QuestionnaireRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    @Autowired
    private QuestionnaireRepository questionnaireRepository;

    @Autowired
    private QuestionRepository questionRepository;

    @Override
    public void run(String... args) throws Exception {
        // Opret morgenskema hvis det ikke findes
        Questionnaire morningQuestionnaire = questionnaireRepository.findByType(QuestionnaireType.morning)
                .orElseGet(() -> {
                    Questionnaire q = new Questionnaire(QuestionnaireType.morning, "Morgenskema");
                    return questionnaireRepository.save(q);
                });

        // Slet alle eksisterende spørgsmål for morgenskemaet og opret nye
        deleteExistingMorningQuestions(morningQuestionnaire.getId());
        seedMorningQuestions(morningQuestionnaire.getId());

        // Opret aftenskema hvis det ikke findes (tomt, kan redigeres af rådgivere)
        questionnaireRepository.findByType(QuestionnaireType.evening)
                .orElseGet(() -> {
                    Questionnaire q = new Questionnaire(QuestionnaireType.evening, "Aftenskema");
                    return questionnaireRepository.save(q);
                });
    }

    private void seedMorningQuestions(String questionnaireId) {
        // Spørgsmål 1: Medicin/kosttilskud
        Question q1 = new Question(questionnaireId, 
                "Tog du nogen form for medicin eller kosttilskud for at hjælpe dig med at sove?", 
                QuestionType.multiple_choice, true, 1);
        q1.setTextDa("Tog du nogen form for medicin eller kosttilskud for at hjælpe dig med at sove?");
        q1.setTextEn("Did you take any form of medicine or dietary supplements to help you sleep?");
        
        List<QuestionOption> q1Options = new ArrayList<>();
        QuestionOption q1OptionNo = new QuestionOption();
        q1OptionNo.setId("med_no");
        q1OptionNo.setText("Nej");
        q1OptionNo.setTextDa("Nej");
        q1OptionNo.setTextEn("No");
        q1Options.add(q1OptionNo);
        
        QuestionOption q1OptionYes = new QuestionOption();
        q1OptionYes.setId("med_yes");
        q1OptionYes.setText("Ja");
        q1OptionYes.setTextDa("Ja");
        q1OptionYes.setTextEn("Yes");
        q1Options.add(q1OptionYes);
        
        q1.setOptions(q1Options);
        q1 = questionRepository.save(q1);
        
        // Conditional child til spørgsmål 1: Hvilken type medicin/kosttilskud
        Question q1Child = new Question(questionnaireId, 
                "Hvilken type medicin eller kosttilskud?", 
                QuestionType.multiple_choice_multiple, true, 1);
        q1Child.setTextDa("Hvilken type medicin eller kosttilskud?");
        q1Child.setTextEn("What type of medicine or dietary supplement?");
        
        List<QuestionOption> q1ChildOptions = new ArrayList<>();
        QuestionOption q1ChildOption1 = new QuestionOption();
        q1ChildOption1.setId("med_sleeping_pill");
        q1ChildOption1.setText("Sovemedicin");
        q1ChildOption1.setTextDa("Sovemedicin");
        q1ChildOption1.setTextEn("Sleeping medication");
        q1ChildOptions.add(q1ChildOption1);
        
        QuestionOption q1ChildOption2 = new QuestionOption();
        q1ChildOption2.setId("med_melatonin");
        q1ChildOption2.setText("Melatonin piller");
        q1ChildOption2.setTextDa("Melatonin piller");
        q1ChildOption2.setTextEn("Melatonin pills");
        q1ChildOptions.add(q1ChildOption2);
        
        QuestionOption q1ChildOption3 = new QuestionOption();
        q1ChildOption3.setId("med_other");
        q1ChildOption3.setText("Andet");
        q1ChildOption3.setTextDa("Andet");
        q1ChildOption3.setTextEn("Other");
        q1ChildOption3.setIsOther(true);
        q1ChildOptions.add(q1ChildOption3);
        
        q1Child.setOptions(q1ChildOptions);
        q1Child = questionRepository.save(q1Child);
        
        // Tilføj conditional child til spørgsmål 1
        List<ConditionalChild> q1ConditionalChildren = new ArrayList<>();
        q1ConditionalChildren.add(new ConditionalChild("med_yes", q1Child.getId()));
        q1.setConditionalChildren(q1ConditionalChildren);
        questionRepository.save(q1);

        // Spørgsmål 2
        Question q2 = new Question(questionnaireId, 
                "Hvad foretog du dig de sidste par timer inden du gik i seng?", 
                QuestionType.text, true, 2);
        q2.setTextDa("Hvad foretog du dig de sidste par timer inden du gik i seng?");
        q2.setTextEn("What did you do in the last few hours before going to bed?");
        questionRepository.save(q2);

        // Spørgsmål 3
        Question q3 = new Question(questionnaireId, 
                "I går gik jeg i seng klokken:", 
                QuestionType.time_picker, true, 3);
        q3.setTextDa("I går gik jeg i seng klokken:");
        q3.setTextEn("Yesterday I went to bed at:");
        questionRepository.save(q3);

        // Spørgsmål 4
        Question q4 = new Question(questionnaireId, 
                "Jeg slukkede lyset klokken:", 
                QuestionType.time_picker, true, 4);
        q4.setTextDa("Jeg slukkede lyset klokken:");
        q4.setTextEn("I turned off the light at:");
        questionRepository.save(q4);

        // Spørgsmål 5
        Question q5 = new Question(questionnaireId, 
                "Efter jeg slukkede lyset, sov jeg ca. efter (minutter):", 
                QuestionType.numeric, true, 5);
        q5.setTextDa("Efter jeg slukkede lyset, sov jeg ca. efter (minutter):");
        q5.setTextEn("After I turned off the light, I fell asleep approximately after (minutes):");
        questionRepository.save(q5);

        // Spørgsmål 6: Vågnede du i løbet af natten?
        Question q6 = new Question(questionnaireId, 
                "Vågnede du i løbet af natten?", 
                QuestionType.multiple_choice, true, 6);
        q6.setTextDa("Vågnede du i løbet af natten?");
        q6.setTextEn("Did you wake up during the night?");
        
        List<QuestionOption> q6Options = new ArrayList<>();
        QuestionOption q6OptionNo = new QuestionOption();
        q6OptionNo.setId("wake_no");
        q6OptionNo.setText("Nej");
        q6OptionNo.setTextDa("Nej");
        q6OptionNo.setTextEn("No");
        q6Options.add(q6OptionNo);
        
        QuestionOption q6OptionYes = new QuestionOption();
        q6OptionYes.setId("wake_yes");
        q6OptionYes.setText("Ja");
        q6OptionYes.setTextDa("Ja");
        q6OptionYes.setTextEn("Yes");
        q6Options.add(q6OptionYes);
        
        q6.setOptions(q6Options);
        q6 = questionRepository.save(q6);
        
        // Spørgsmål 7: Hvor mange gange? (conditional child af spørgsmål 6)
        Question q7 = new Question(questionnaireId, 
                "Hvor mange gange?", 
                QuestionType.numeric, true, 7);
        q7.setTextDa("Hvor mange gange?");
        q7.setTextEn("How many times?");
        q7 = questionRepository.save(q7);
        
        // Spørgsmål 8: Hvor mange minutter? (conditional child af spørgsmål 6)
        Question q8 = new Question(questionnaireId, 
                "Hvor mange minutter?", 
                QuestionType.numeric, true, 8);
        q8.setTextDa("Hvor mange minutter?");
        q8.setTextEn("How many minutes?");
        q8 = questionRepository.save(q8);
        
        // Tilføj conditional children til spørgsmål 6
        List<ConditionalChild> q6ConditionalChildren = new ArrayList<>();
        q6ConditionalChildren.add(new ConditionalChild("wake_yes", q7.getId()));
        q6ConditionalChildren.add(new ConditionalChild("wake_yes", q8.getId()));
        q6.setConditionalChildren(q6ConditionalChildren);
        questionRepository.save(q6);

        // Spørgsmål 9
        Question q9 = new Question(questionnaireId, 
                "I morges vågnede jeg klokken?", 
                QuestionType.time_picker, true, 9);
        q9.setTextDa("I morges vågnede jeg klokken?");
        q9.setTextEn("This morning I woke up at:");
        questionRepository.save(q9);

        // Spørgsmål 10
        Question q10 = new Question(questionnaireId, 
                "Og jeg stod op klokken?", 
                QuestionType.time_picker, true, 10);
        q10.setTextDa("Og jeg stod op klokken?");
        q10.setTextEn("And I got out of bed at:");
        questionRepository.save(q10);

        // Spørgsmål 11
        Question q11 = new Question(questionnaireId, 
                "Et par timer efter jeg stod op følte jeg mig? (1–5)", 
                QuestionType.slider, true, 11);
        q11.setTextDa("Et par timer efter jeg stod op følte jeg mig? (1–5)");
        q11.setTextEn("A few hours after I got up, I felt? (1–5)");
        q11.setMinValue(1);
        q11.setMaxValue(5);
        questionRepository.save(q11);
    }

    private void deleteExistingMorningQuestions(String questionnaireId) {
        List<Question> allQuestions = questionRepository.findAllByQuestionnaireIdIncludingDeleted(questionnaireId);
        if (!allQuestions.isEmpty()) {
            questionRepository.deleteAll(allQuestions);
        }
    }

}
