import React, { useState } from "react";
import { FaClipboardList, FaArrowRight, FaCheckCircle, FaTimesCircle } from "react-icons/fa";

/**
 * OnboardingStep5 - Màn 5: Đánh giá nhanh (Optional)
 * Design theo style Dashboard - Professional & Clean
 */

const QUESTIONS = [
  {
    id: 1,
    question: "She _____ to the gym every morning.",
    options: ["go", "goes", "going", "went"],
    correct: 1,
  },
  {
    id: 2,
    question: "I have lived here _____ 2020.",
    options: ["for", "since", "from", "at"],
    correct: 1,
  },
  {
    id: 3,
    question: "If I _____ you, I would study harder.",
    options: ["am", "was", "were", "be"],
    correct: 2,
  },
  {
    id: 4,
    question: "The book _____ by millions of people.",
    options: ["read", "reads", "is read", "was reading"],
    correct: 2,
  },
  {
    id: 5,
    question: "Choose the word closest in meaning to 'improve':",
    options: ["decline", "enhance", "worsen", "maintain"],
    correct: 1,
  },
];

export default function OnboardingStep5({ onNext, onBack, onSkip }) {
  const [showGame, setShowGame] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);

  function handleStartGame() {
    setShowGame(true);
  }

  function handleSkip() {
    if (onSkip) {
      onSkip({ assessmentSkipped: true });
    }
  }

  function handleAnswer(optionIndex) {
    if (showFeedback) return;
    
    setSelectedAnswer(optionIndex);
    setShowFeedback(true);
    
    const isCorrect = optionIndex === QUESTIONS[currentQuestion].correct;
    const newAnswers = [...answers, { questionId: QUESTIONS[currentQuestion].id, isCorrect }];
    setAnswers(newAnswers);

    // Move to next question after 1.5s
    setTimeout(() => {
      if (currentQuestion < QUESTIONS.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
      } else {
        // Finish game
        const score = newAnswers.filter(a => a.isCorrect).length;
        if (onNext) {
          onNext({ 
            assessmentCompleted: true, 
            score,
            totalQuestions: QUESTIONS.length 
          });
        }
      }
    }, 1500);
  }

  if (!showGame) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-3xl">
          {/* Header Section */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-r from-[#6C5CE7] to-[#A29BFE] shadow-lg mb-6">
              <FaClipboardList className="text-4xl text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3">
              Đánh giá nhanh trình độ
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Hoàn thành 5 câu hỏi ngắn để chúng tôi đánh giá chính xác trình độ của bạn
            </p>
          </div>

          {/* Action Cards */}
          <div className="grid gap-5">
            {/* Primary Option */}
            <button
              onClick={handleStartGame}
              className="w-full bg-white rounded-xl p-8 border-2 border-purple-100 hover:border-[#6C5CE7] hover:shadow-xl transition-all duration-300 text-left group"
            >
              <div className="flex items-center gap-5">
                <div className="flex-none w-16 h-16 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#00CEC9] flex items-center justify-center text-white text-2xl shadow-md group-hover:scale-110 transition-transform">
                  <FaArrowRight />
                </div>
                <div className="flex-1">
                  <div className="text-2xl font-bold text-gray-800 mb-2">
                    Bắt đầu đánh giá
                  </div>
                  <div className="text-sm text-gray-600">
                    Chỉ mất 2 phút • Giúp tạo lộ trình chính xác hơn
                  </div>
                </div>
                <div className="flex-none">
                  <span className="px-4 py-2 rounded-lg bg-[#6C5CE7]/10 text-[#6C5CE7] text-sm font-semibold">
                    Khuyên dùng
                  </span>
                </div>
              </div>
            </button>

            {/* Secondary Option */}
            <button
              onClick={handleSkip}
              className="w-full bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-300 text-center"
            >
              <p className="text-gray-600">
                Bỏ qua, tôi muốn vào Dashboard ngay
              </p>
            </button>
          </div>

          {/* Back Button */}
          <div className="mt-10 text-center">
            <button
              onClick={onBack}
              className="px-8 py-3 rounded-xl font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-300"
            >
              ← Quay lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Game Screen
  const question = QUESTIONS[currentQuestion];
  const progress = ((currentQuestion + 1) / QUESTIONS.length) * 100;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-3xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span className="font-semibold">Câu hỏi {currentQuestion + 1}/{QUESTIONS.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#6C5CE7] to-[#00CEC9] transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-xl p-8 shadow-lg border-2 border-purple-100 mb-6">
          <p className="text-2xl font-bold text-gray-800 leading-relaxed">
            {question.question}
          </p>
        </div>

        {/* Feedback Message */}
        {showFeedback && (
          <div className={`mb-6 p-5 rounded-xl border-2 transition-all duration-300 ${
            selectedAnswer === question.correct
              ? "bg-green-50 border-green-300" 
              : "bg-orange-50 border-orange-300"
          }`}>
            <div className="flex items-center gap-3">
              {selectedAnswer === question.correct ? (
                <FaCheckCircle className="text-2xl text-green-600" />
              ) : (
                <FaTimesCircle className="text-2xl text-orange-600" />
              )}
              <p className={`font-semibold text-lg ${
                selectedAnswer === question.correct ? "text-green-700" : "text-orange-700"
              }`}>
                {selectedAnswer === question.correct ? "Chính xác!" : "Chưa đúng, nhưng không sao!"}
              </p>
            </div>
          </div>
        )}

        {/* Options */}
        <div className="grid gap-3">
          {question.options.map((option, index) => {
            const isCorrect = index === question.correct;
            const isSelected = index === selectedAnswer;
            
            return (
              <button
                key={index}
                onClick={() => !showFeedback && handleAnswer(index)}
                disabled={showFeedback}
                className={`
                  p-5 rounded-xl text-left transition-all duration-300 border-2
                  ${showFeedback
                    ? isCorrect
                      ? "bg-green-50 border-green-400"
                      : isSelected
                        ? "bg-orange-50 border-orange-300"
                        : "bg-gray-50 border-gray-200 opacity-50"
                    : "bg-white border-gray-200 hover:border-[#6C5CE7] hover:shadow-md"
                  }
                  ${showFeedback ? "cursor-default" : "cursor-pointer"}
                `}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${
                    showFeedback && isCorrect
                      ? "bg-green-500 text-white"
                      : showFeedback && isSelected
                        ? "bg-orange-400 text-white"
                        : "bg-gray-100 text-gray-700"
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className="text-lg text-gray-800">{option}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
