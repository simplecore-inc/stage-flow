---
id: mbti-test
title: MBTI Test
sidebar_label: MBTI Test
---

# MBTI Test

Interactive MBTI personality test using individual stage components and StageRenderer for multi-step personality assessment.

## Overview

This example demonstrates how to create an interactive MBTI personality test using Stage Flow for managing complex questionnaire flows with progress tracking and bilingual support.

- **Individual Stage Components**: Each stage is a separate React component
- **StageRenderer**: Automatic stage rendering based on current stage
- **Step-by-Step Questions**: Guided progression through MBTI questions
- **Bilingual Support**: English and Korean language support
- **Progress Tracking**: Visual progress indicator
- **Data Persistence**: Maintaining answers across questions
- **Back Navigation**: Ability to go back and modify previous answers
- **Result Calculation**: Automatic MBTI type calculation

## Key Features to Observe

1. **Individual Stage Components**: Each stage (welcome, questions, results) is a separate component
2. **StageRenderer Usage**: Automatic stage rendering without conditional rendering
3. **Bilingual Support**: Toggle between English and Korean
4. **Step-by-Step Questions**: Guided progression through MBTI questions
5. **Progress Tracking**: Visual progress indicator
6. **Data Persistence**: Maintaining answers across questions
7. **Back Navigation**: Ability to go back and modify previous answers
8. **Result Calculation**: Automatic MBTI type calculation based on answers

## Live Example

```jsx live
// import { StageFlowEngine } from '@stage-flow/core';
// import { StageFlowProvider, useStageFlow } from '@stage-flow/react';

function MBTITest() {
  // Language context
  const [language, setLanguage] = React.useState('en');

  const translations = {
    en: {
      welcome: {
        title: "MBTI Personality Test",
        subtitle: "Discover your personality type",
        description: "This test will help you understand your MBTI personality type. Answer each question honestly based on how you typically feel or behave.",
        startButton: "Start Test",
        languageToggle: "한국어"
      },
      questions: {
        backButton: "Back",
        nextButton: "Next",
        question: "Question",
        of: "of"
      },
      results: {
        title: "Your MBTI Type",
        subtitle: "Based on your answers",
        restartButton: "Take Test Again",
        languageToggle: "한국어"
      },
      mbtiTypes: {
        "INTJ": {
          title: "The Architect",
          description: "Imaginative and strategic thinkers, with a plan for everything."
        },
        "INTP": {
          title: "The Logician",
          description: "Innovative inventors with an unquenchable thirst for knowledge."
        },
        "ENTJ": {
          title: "The Commander",
          description: "Bold, imaginative and strong-willed leaders."
        },
        "ENTP": {
          title: "The Debater",
          description: "Smart and curious thinkers who cannot resist an intellectual challenge."
        },
        "INFJ": {
          title: "The Advocate",
          description: "Quiet and mystical, yet very inspiring and tireless idealists."
        },
        "INFP": {
          title: "The Mediator",
          description: "Poetic, kind and altruistic people, always eager to help a good cause."
        },
        "ENFJ": {
          title: "The Protagonist",
          description: "Charismatic and inspiring leaders, able to mesmerize their listeners."
        },
        "ENFP": {
          title: "The Campaigner",
          description: "Enthusiastic, creative and sociable free spirits."
        },
        "ISTJ": {
          title: "The Logistician",
          description: "Practical and fact-minded individuals, whose reliability cannot be doubted."
        },
        "ISFJ": {
          title: "The Defender",
          description: "Very dedicated and warm protectors, always ready to defend their loved ones."
        },
        "ESTJ": {
          title: "The Executive",
          description: "Excellent administrators, unsurpassed at managing things or people."
        },
        "ESFJ": {
          title: "The Consul",
          description: "Extraordinarily caring, social and popular people."
        },
        "ISTP": {
          title: "The Virtuoso",
          description: "Bold and practical experimenters, masters of all kinds of tools."
        },
        "ISFP": {
          title: "The Adventurer",
          description: "Flexible and charming artists, always ready to explore and experience something new."
        },
        "ESTP": {
          title: "The Entrepreneur",
          description: "Smart, energetic and very perceptive people."
        },
        "ESFP": {
          title: "The Entertainer",
          description: "Spontaneous, energetic and enthusiastic entertainers."
        }
      }
    },
    ko: {
      welcome: {
        title: "MBTI 성격 유형 검사",
        subtitle: "당신의 성격 유형을 발견하세요",
        description: "이 검사는 당신의 MBTI 성격 유형을 이해하는 데 도움이 됩니다. 각 질문에 대해 당신이 일반적으로 느끼거나 행동하는 방식에 따라 솔직하게 답해주세요.",
        startButton: "검사 시작",
        languageToggle: "English"
      },
      questions: {
        backButton: "이전",
        nextButton: "다음",
        question: "질문",
        of: "/"
      },
      results: {
        title: "당신의 MBTI 유형",
        subtitle: "답변을 바탕으로",
        restartButton: "다시 검사하기",
        languageToggle: "English"
      },
      mbtiTypes: {
        "INTJ": {
          title: "건축가",
          description: "상상력이 풍부하고 전략적인 사고를 하는 사람으로, 모든 것에 대한 계획을 가지고 있습니다."
        },
        "INTP": {
          title: "논리술사",
          description: "지식에 대한 끊임없는 갈증을 가진 혁신적인 발명가입니다."
        },
        "ENTJ": {
          title: "통솔자",
          description: "대담하고 상상력이 풍부하며 의지가 강한 리더입니다."
        },
        "ENTP": {
          title: "변론가",
          description: "지적 도전을 거부할 수 없는 똑똑하고 호기심 많은 사상가입니다."
        },
        "INFJ": {
          title: "옹호자",
          description: "조용하고 신비롭지만 매우 영감을 주고 지칠 줄 모르는 이상주의자입니다."
        },
        "INFP": {
          title: "중재자",
          description: "시적이고 친절하며 이타적인 사람으로, 좋은 일을 돕고 싶어 합니다."
        },
        "ENFJ": {
          title: "주인공",
          description: "카리스마 있고 영감을 주는 리더로, 청중을 매료시킬 수 있습니다."
        },
        "ENFP": {
          title: "활동가",
          description: "열정적이고 창의적이며 사교적인 자유로운 영혼입니다."
        },
        "ISTJ": {
          title: "현실주의자",
          description: "실용적이고 사실 중심의 개인으로, 그들의 신뢰성은 의심할 수 없습니다."
        },
        "ISFJ": {
          title: "수호자",
          description: "매우 헌신적이고 따뜻한 보호자로, 항상 사랑하는 사람들을 보호할 준비가 되어 있습니다."
        },
        "ESTJ": {
          title: "경영자",
          description: "뛰어난 관리자로, 사물이나 사람을 관리하는 데 뛰어납니다."
        },
        "ESFJ": {
          title: "집정관",
          description: "특별히 돌보고 사교적이며 인기 있는 사람들입니다."
        },
        "ISTP": {
          title: "만능재주꾼",
          description: "대담하고 실용적인 실험가로, 모든 종류의 도구의 마스터입니다."
        },
        "ISFP": {
          title: "모험가",
          description: "유연하고 매력적인 예술가로, 항상 새로운 것을 탐험하고 경험할 준비가 되어 있습니다."
        },
        "ESTP": {
          title: "사업가",
          description: "똑똑하고 활기차며 매우 통찰력 있는 사람들입니다."
        },
        "ESFP": {
          title: "연예인",
          description: "자발적이고 활기차며 열정적인 엔터테이너입니다."
        }
      }
    }
  };

  const t = translations[language];

  // MBTI Questions
  const mbtiQuestions = [
    {
      id: 1,
      question: {
        en: "When you're in a group, you usually:",
        ko: "그룹에 있을 때, 당신은 보통:"
      },
      options: [
        { value: "E", text: { en: "Talk to many people", ko: "많은 사람들과 대화한다" } },
        { value: "I", text: { en: "Talk to a few people", ko: "소수의 사람들과만 대화한다" } }
      ]
    },
    {
      id: 2,
      question: {
        en: "You're more likely to:",
        ko: "당신은 더 가능성이 높은 것은:"
      },
      options: [
        { value: "E", text: { en: "Go to a party", ko: "파티에 간다" } },
        { value: "I", text: { en: "Stay home", ko: "집에 있다" } }
      ]
    },
    {
      id: 3,
      question: {
        en: "You prefer to:",
        ko: "당신은 선호하는 것은:"
      },
      options: [
        { value: "S", text: { en: "Focus on details", ko: "세부사항에 집중한다" } },
        { value: "N", text: { en: "Focus on the big picture", ko: "큰 그림에 집중한다" } }
      ]
    },
    {
      id: 4,
      question: {
        en: "You're more interested in:",
        ko: "당신이 더 관심 있는 것은:"
      },
      options: [
        { value: "S", text: { en: "What is real", ko: "실제로 존재하는 것" } },
        { value: "N", text: { en: "What is possible", ko: "가능한 것" } }
      ]
    },
    {
      id: 5,
      question: {
        en: "When making decisions, you rely more on:",
        ko: "결정을 내릴 때, 당신은 더 의존하는 것은:"
      },
      options: [
        { value: "T", text: { en: "Logic and facts", ko: "논리와 사실" } },
        { value: "F", text: { en: "Feelings and values", ko: "감정과 가치관" } }
      ]
    },
    {
      id: 6,
      question: {
        en: "You're more likely to:",
        ko: "당신은 더 가능성이 높은 것은:"
      },
      options: [
        { value: "T", text: { en: "Be direct and honest", ko: "직접적이고 솔직하다" } },
        { value: "F", text: { en: "Be tactful and diplomatic", ko: "재치 있고 외교적이다" } }
      ]
    },
    {
      id: 7,
      question: {
        en: "You prefer to:",
        ko: "당신은 선호하는 것은:"
      },
      options: [
        { value: "J", text: { en: "Have a plan", ko: "계획을 세운다" } },
        { value: "P", text: { en: "Keep options open", ko: "선택지를 열어둔다" } }
      ]
    },
    {
      id: 8,
      question: {
        en: "You're more comfortable with:",
        ko: "당신이 더 편안해하는 것은:"
      },
      options: [
        { value: "J", text: { en: "Structure and order", ko: "구조와 질서" } },
        { value: "P", text: { en: "Flexibility and spontaneity", ko: "유연성과 즉흥성" } }
      ]
    }
  ];

  // Common UI Components
  function FormContainer({ children, title = "MBTI Test" }) {
    const { engine } = useStageFlow();
    
    const handleLanguageToggle = React.useCallback(() => {
      const newLanguage = language === 'en' ? 'ko' : 'en';
      setLanguage(newLanguage);

      engine.setStageData({
        ...engine.getCurrentData(),
        language: newLanguage
      });
    }, [language, engine]);

    return (
      <div
        style={{
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          maxWidth: "600px",
          backgroundColor: "white",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ margin: "0", color: "#333" }}>{title}</h2>
          <button
            onClick={handleLanguageToggle}
            style={{
              padding: "4px 8px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              backgroundColor: "white",
              color: "#333",
              cursor: "pointer",
              fontSize: "12px"
            }}
          >
            {language === 'en' ? t.welcome.languageToggle : t.welcome.languageToggle}
          </button>
        </div>
        {children}
      </div>
    );
  }

  function FormButton({ onClick, children, variant = "primary", type = "button", style = {} }) {
    const buttonStyles = {
      primary: {
        backgroundColor: "#007bff",
        color: "white",
      },
      secondary: {
        backgroundColor: "#6c757d",
        color: "white",
      },
      success: {
        backgroundColor: "#28a745",
        color: "white",
      },
    };

    const buttonStyle = {
      padding: "8px 16px",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "14px",
      color: "#333",
      ...buttonStyles[variant],
      ...style,
    };

    return (
      <button onClick={onClick} type={type} style={buttonStyle}>
        {children}
      </button>
    );
  }

  function ProgressBar({ currentStep, totalSteps }) {
    const percentage = (currentStep / totalSteps) * 100;

    return (
      <div style={{ marginBottom: "30px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "10px",
          }}
        >
          <span style={{ fontSize: "14px", color: "#666" }}>
            {t.questions.question} {currentStep} {t.questions.of} {totalSteps}
          </span>
          <span style={{ fontSize: "14px", color: "#666" }}>{Math.round(percentage)}%</span>
        </div>
        <div
          style={{
            width: "100%",
            height: "8px",
            backgroundColor: "#e9ecef",
            borderRadius: "4px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${percentage}%`,
              height: "100%",
              backgroundColor: "#007bff",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>
    );
  }

  function DebugInfo() {
    const { currentStage, data } = useStageFlow();

    return (
      <div
        style={{
          marginBottom: "20px",
          padding: "15px",
          backgroundColor: "#f8f9fa",
          borderRadius: "4px",
          border: "1px solid #e9ecef",
          maxWidth: "600px",
          width: "100%",
        }}
      >
        <div style={{ marginBottom: "10px" }}>
          <h4 style={{ margin: "0", color: "#495057" }}>Debug Info:</h4>
        </div>

        <div>
          <p style={{ margin: "5px 0", fontSize: "12px", color: "#6c757d" }}>
            <strong>Current Stage:</strong> {currentStage}
          </p>
          <p style={{ margin: "5px 0", fontSize: "12px", color: "#6c757d" }}>
            <strong>Language:</strong> {language}
          </p>
          <p style={{ margin: "5px 0", fontSize: "12px", color: "#6c757d" }}>
            <strong>Current Data:</strong> {JSON.stringify(data)}
          </p>
        </div>
      </div>
    );
  }

  // Welcome stage component
  function WelcomeStage({ data, send }) {
    const handleStartTest = React.useCallback(() => {
      send("startTest", {
        ...(data || {}),
        currentQuestion: 1,
        totalQuestions: mbtiQuestions.length,
        answers: {},
      });
    }, [data, send]);

    return (
      <FormContainer title={t.welcome.title}>
        <div
          style={{
            padding: "20px",
            backgroundColor: "#f8f9fa",
            borderRadius: "4px",
            minHeight: "300px",
            textAlign: "center",
          }}
        >
          <h3 style={{ margin: "0 0 20px 0", color: "#333" }}>{t.welcome.subtitle}</h3>
          <p style={{ color: "#666", marginBottom: "30px", lineHeight: "1.6" }}>
            {t.welcome.description}
          </p>
          <FormButton onClick={handleStartTest} style={{ fontSize: "16px", padding: "12px 24px" }}>
            {t.welcome.startButton}
          </FormButton>
        </div>
      </FormContainer>
    );
  }

  // Questions stage component
  function QuestionsStage({ data, send }) {
    const { engine } = useStageFlow();
    const currentQuestion = mbtiQuestions[data?.currentQuestion - 1];
    const currentAnswer = data?.answers?.[currentQuestion?.id];

    const handleBack = React.useCallback(() => {
      const prevQuestion = data?.currentQuestion - 1;
      if (prevQuestion >= 1) {
        send("back", {
          ...(data || {}),
          currentQuestion: prevQuestion,
        });
      } else {
        send("backToWelcome", {
          ...(data || {}),
          currentQuestion: 1,
        });
      }
    }, [data, send]);

    const handleAnswer = React.useCallback((answer) => {
      const newAnswers = { ...(data?.answers || {}), [currentQuestion.id]: answer };
      const nextQuestion = data?.currentQuestion + 1;
      
      if (nextQuestion <= mbtiQuestions.length) {
        engine.setStageData({
          ...(data || {}),
          answers: newAnswers,
          currentQuestion: nextQuestion,
        });
      } else {
        send("completeTest", {
          ...(data || {}),
          answers: newAnswers,
          currentQuestion: mbtiQuestions.length,
        });
      }
    }, [data, send, currentQuestion, engine]);

    if (!currentQuestion) {
      return <div>Loading...</div>;
    }

    return (
      <FormContainer title={t.welcome.title}>
        <ProgressBar currentStep={data?.currentQuestion || 1} totalSteps={mbtiQuestions.length} />

        <div
          style={{
            padding: "20px",
            backgroundColor: "#f8f9fa",
            borderRadius: "4px",
            minHeight: "300px",
          }}
        >
          <h3 style={{ margin: "0 0 20px 0", color: "#333" }}>
            {t.questions.question} {data?.currentQuestion} {t.questions.of} {mbtiQuestions.length}
          </h3>
          <p style={{ color: "#333", marginBottom: "30px", fontSize: "16px", lineHeight: "1.5" }}>
            {currentQuestion.question[language]}
          </p>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "15px", marginBottom: "30px" }}>
            {currentQuestion.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(option.value)}
                style={{
                  padding: "15px",
                  border: currentAnswer === option.value ? "2px solid #007bff" : "1px solid #ddd",
                  borderRadius: "8px",
                  backgroundColor: currentAnswer === option.value ? "#e3f2fd" : "white",
                  color: "#333",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "14px",
                  transition: "all 0.2s ease",
                }}
              >
                {option.text[language]}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <FormButton onClick={handleBack} variant="secondary">
              {t.questions.backButton}
            </FormButton>
          </div>
        </div>
      </FormContainer>
    );
  }

  // Results stage component
  function ResultsStage({ data, send }) {
    const calculateMBTI = (answers) => {
      let E = 0, I = 0, S = 0, N = 0, T = 0, F = 0, J = 0, P = 0;
      
      Object.values(answers).forEach(answer => {
        if (answer === 'E') E++;
        if (answer === 'I') I++;
        if (answer === 'S') S++;
        if (answer === 'N') N++;
        if (answer === 'T') T++;
        if (answer === 'F') F++;
        if (answer === 'J') J++;
        if (answer === 'P') P++;
      });

      const firstLetter = E > I ? 'E' : 'I';
      const secondLetter = S > N ? 'S' : 'N';
      const thirdLetter = T > F ? 'T' : 'F';
      const fourthLetter = J > P ? 'J' : 'P';

      return firstLetter + secondLetter + thirdLetter + fourthLetter;
    };

    const mbtiType = calculateMBTI(data?.answers || {});
    const mbtiInfo = t.mbtiTypes[mbtiType] || { title: "Unknown", description: "Type not found" };

    const handleRestart = React.useCallback(() => {
      send("restart", {
        ...(data || {}),
        currentQuestion: 1,
        answers: {},
      });
    }, [data, send]);

    return (
      <FormContainer title={t.results.title}>
        <div
          style={{
            padding: "20px",
            backgroundColor: "#f8f9fa",
            borderRadius: "4px",
            minHeight: "300px",
            textAlign: "center",
          }}
        >
          <h3 style={{ margin: "0 0 20px 0", color: "#333" }}>{t.results.subtitle}</h3>
          
          <div style={{ marginBottom: "30px" }}>
            <div style={{ 
              fontSize: "48px", 
              fontWeight: "bold", 
              color: "#007bff", 
              marginBottom: "10px" 
            }}>
              {mbtiType}
            </div>
            <div style={{ 
              fontSize: "20px", 
              color: "#333", 
              marginBottom: "10px" 
            }}>
              {mbtiInfo.title}
            </div>
            <p style={{ 
              color: "#666", 
              lineHeight: "1.6",
              maxWidth: "400px",
              margin: "0 auto"
            }}>
              {mbtiInfo.description}
            </p>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <h4 style={{ color: "#333", marginBottom: "10px" }}>
              {language === 'en' ? "Your Answers:" : "당신의 답변:"}
            </h4>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
              gap: "10px",
              textAlign: "left"
            }}>
              {Object.entries(data?.answers || {}).map(([questionId, answer]) => {
                const question = mbtiQuestions.find(q => q.id === parseInt(questionId));
                return (
                  <div key={questionId} style={{ 
                    padding: "10px", 
                    backgroundColor: "white", 
                    borderRadius: "4px",
                    border: "1px solid #ddd"
                  }}>
                    <div style={{ fontSize: "12px", color: "#666", marginBottom: "5px" }}>
                      {language === 'en' ? `Q${questionId}` : `질문${questionId}`}
                    </div>
                    <div style={{ fontSize: "14px", color: "#333" }}>
                      {answer}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <FormButton onClick={handleRestart} style={{ fontSize: "16px", padding: "12px 24px" }}>
            {t.results.restartButton}
          </FormButton>
        </div>
      </FormContainer>
    );
  }

  // Create engine directly without useRef
  const engine = new StageFlowEngine({
    initial: "welcome",
    data: {
      currentQuestion: 1,
      totalQuestions: mbtiQuestions.length,
      answers: {},
      language: 'en'
    },
    stages: [
      {
        name: "welcome",
        transitions: [
          { target: "questions", event: "startTest" },
        ],
      },
      {
        name: "questions",
        transitions: [
          { target: "questions", event: "nextQuestion" },
          { target: "results", event: "completeTest" },
          { target: "welcome", event: "backToWelcome" },
          { target: "questions", event: "back" },
        ],
      },
      {
        name: "results",
        transitions: [
          { target: "welcome", event: "restart" },
        ],
      },
    ],
  });
  engine.start();

  return (
    <StageFlowProvider engine={engine}>
      <DebugInfo />
      <StageRenderer
        stageComponents={{
          welcome: WelcomeStage,
          questions: QuestionsStage,
          results: ResultsStage,
        }}
      />
    </StageFlowProvider>
  );
}
```