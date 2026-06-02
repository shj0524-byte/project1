/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle, 
  ChevronRight, 
  RotateCcw, 
  User, 
  MessageSquare, 
  FileText, 
  Mic, 
  Info,
  Award,
  Smartphone,
  PhoneCall,
  Printer
} from 'lucide-react';
import { QUIZ_LIST, Quiz } from './data';

// Helper function to colorize URLs/links inside SMS texts (made blue and underlined for elders to identify link danger)
function renderSmsWithColoredUrls(text: string) {
  if (!text) return '';
  const regex = /(https?:\/\/\u0025*(?:[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]|\.\.\.)+|bit\.ly\/\S+|sh\.kr\/\S+|cs-card-guard\.net)/gi;
  const parts = text.split(regex);
  return parts.map((part, index) => {
    if (part.toLowerCase().match(/https?:\/\/|bit\.ly\/|sh\.kr\/|cs-card-guard\.net/)) {
      return (
        <span key={index} className="text-blue-400 font-extrabold underline whitespace-nowrap">
          {part}
        </span>
      );
    }
    return part;
  });
}

export default function App() {
  // --- Persistent State ---
  const [nickname, setNickname] = useState<string>(() => {
    return localStorage.getItem('senior_nickname') || '';
  });
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'huge'>(() => {
    return (localStorage.getItem('senior_font_size') as any) || 'large';
  });
  const [speechEnabled, setSpeechEnabled] = useState<boolean>(() => {
    return localStorage.getItem('senior_speech_enabled') !== 'false';
  });

  // --- Dynamic App State ---
  const [step, setStep] = useState<'onboarding' | 'training' | 'review' | 'certificate'>('onboarding');
  const [selectedQuizzes, setSelectedQuizzes] = useState<Quiz[]>([]);
  const [quizIndex, setQuizIndex] = useState<number>(0);
  const [shuffledOrder, setShuffledOrder] = useState<number[]>([0, 1, 2]);
  
  // Feedback and choice evaluation
  const [selectedChoiceIndices, setSelectedChoiceIndices] = useState<number[]>([]); // Options user already pressed
  const [lastSelectedChoice, setLastSelectedChoice] = useState<number | null>(null);
  const [answered, setAnswered] = useState<boolean>(false);
  const [wrongFeedback, setWrongFeedback] = useState<string | null>(null);
  const [correctFeedback, setCorrectFeedback] = useState<string | null>(null);
  
  // Score tracking
  const [score, setScore] = useState<number>(0);
  const [wasCorrectOnFirstTry, setWasCorrectOnFirstTry] = useState<boolean>(true);
  const [firstTryArray, setFirstTryArray] = useState<boolean[]>([true, true, true]);

  // Mic state (Speech to Text)
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSTTSupported, setIsSTTSupported] = useState<boolean>(false);

  // --- Check STT compatibility ---
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSTTSupported(!!SpeechRecognition);
  }, []);

  // --- Speech Synthesis Helper ---
  const speak = (text: string) => {
    if (!speechEnabled) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Cancel any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 0.88; // Extra slow and stable pace for seniors
      utterance.pitch = 1.0; 
      
      // Let's try to fine-tune a warm voice if possible
      const voices = window.speechSynthesis.getVoices();
      const koVoice = voices.find(v => v.lang.startsWith('ko') || v.lang.includes('Korean'));
      if (koVoice) {
        utterance.voice = koVoice;
      }
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('senior_nickname', nickname);
  }, [nickname]);

  useEffect(() => {
    localStorage.setItem('senior_font_size', fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('senior_speech_enabled', String(speechEnabled));
    if (!speechEnabled) {
      stopSpeaking();
    }
  }, [speechEnabled]);

  // Clean speaking on component unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);

  // --- Font size mapping ---
  const fontSizes = {
    normal: {
      title: 'text-xl sm:text-2xl md:text-3xl font-black leading-tight tracking-tight',
      desc: 'text-base sm:text-lg md:text-xl font-bold leading-normal',
      smContent: 'text-sm sm:text-base md:text-lg font-medium leading-relaxed',
      small: 'text-xs sm:text-sm font-semibold leading-relaxed text-neutral-400',
      praise: 'text-base sm:text-lg md:text-xl font-black leading-relaxed',
      button: 'text-base sm:text-lg md:text-xl font-bold py-4 px-4',
    },
    large: {
      title: 'text-2xl sm:text-3xl md:text-4xl font-black leading-tight tracking-tight',
      desc: 'text-lg sm:text-xl md:text-2xl font-bold leading-normal',
      smContent: 'text-base sm:text-lg md:text-xl font-bold leading-relaxed',
      small: 'text-sm sm:text-base font-bold leading-relaxed text-neutral-300',
      praise: 'text-lg sm:text-xl md:text-2xl font-black leading-relaxed',
      button: 'text-lg sm:text-xl md:text-2xl font-extrabold py-5 px-5',
    },
    huge: {
      title: 'text-3xl sm:text-4xl md:text-5xl font-black leading-tight tracking-tight',
      desc: 'text-xl sm:text-2.5xl md:text-3xl font-black leading-normal',
      smContent: 'text-lg sm:text-xl md:text-2xl font-black leading-relaxed',
      small: 'text-base sm:text-lg md:text-xl font-black leading-relaxed text-neutral-200',
      praise: 'text-xl sm:text-2.5xl md:text-3xl font-black leading-relaxed',
      button: 'text-xl sm:text-2.5xl md:text-3xl font-black py-7 px-6',
    }
  };

  const currentFont = fontSizes[fontSize];

  // Try to vibrate mobile device for instant tactile feel
  const triggerVibe = (pattern: number[]) => {
    if (window.navigator && window.navigator.vibrate) {
      try {
        window.navigator.vibrate(pattern);
      } catch (e) {
        // Silently ignore
      }
    }
  };

  // --- Start voice recognition for nickname ---
  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    triggerVibe([100]);
    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      speak("어르신, 이름을 천천히 말씀해 주세요.");
    };

    recognition.onresult = (event: any) => {
      const resultText = event.results[0][0].transcript;
      const cleanName = resultText.replace(/\./g, "").trim();
      setNickname(cleanName);
      speak(`${cleanName} 어르신, 참 반갑고 좋은 성함입니다.`);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  // --- Start 3-quiz practice with specified real-life cases ---
  const handleStartPractice = () => {
    triggerVibe([150]);
    stopSpeaking();
    
    // Select the 3 specific quizzes matching our real-world uploaded images in sequence
    // id 1: 택배, id 6: 자녀사칭, id 3: 정부지원금
    const selected = [
      QUIZ_LIST.find(q => q.id === 1)!,
      QUIZ_LIST.find(q => q.id === 6)!,
      QUIZ_LIST.find(q => q.id === 3)!
    ].filter(Boolean);
    
    setSelectedQuizzes(selected);
    setQuizIndex(0);
    
    // Shuffle options order for the first question
    const arr = [0, 1, 2];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setShuffledOrder(arr);

    setScore(0);
    setFirstTryArray([true, true, true]);
    setWasCorrectOnFirstTry(true);
    
    setSelectedChoiceIndices([]);
    setLastSelectedChoice(null);
    setAnswered(false);
    setWrongFeedback(null);
    setCorrectFeedback(null);
    
    setStep('training');

    // Guide Voice
    const introSpeech = `안심 훈련을 시작합니다. 화면 중앙에 온 의심 문자를 잘 확인하시고, 하단의 세 가지 대처법 중 하나를 신중하게 골라 손으로 눌러주세요.`;
    setTimeout(() => {
      speak(introSpeech);
    }, 200);
  };

  // --- Evaluate Choice ---
  const handleSelectChoice = (choiceIndex: number) => {
    if (answered) return; // Already solved current step

    const currentQuiz = selectedQuizzes[quizIndex];
    const isCorrect = choiceIndex === currentQuiz.correctIndex;
    
    triggerVibe(isCorrect ? [80, 50, 80] : [200, 100]);

    if (isCorrect) {
      setAnswered(true);
      setLastSelectedChoice(choiceIndex);
      setWrongFeedback(null);
      setCorrectFeedback(currentQuiz.praiseComment);
      
      // Calculate final score
      let finalFirstTry = wasCorrectOnFirstTry;
      const updatedFirstTryArray = [...firstTryArray];
      updatedFirstTryArray[quizIndex] = finalFirstTry;
      setFirstTryArray(updatedFirstTryArray);

      if (finalFirstTry) {
        setScore(prev => prev + 1);
      }

      // Read praise with voice automatically
      speak(`정답입니다! ${currentQuiz.praiseComment}`);
    } else {
      // Wrong option select
      setWasCorrectOnFirstTry(false);
      if (!selectedChoiceIndices.includes(choiceIndex)) {
        setSelectedChoiceIndices(prev => [...prev, choiceIndex]);
      }
      setWrongFeedback(currentQuiz.dangerExplanation);
      setLastSelectedChoice(choiceIndex);
      
      // Read alert details with voice automatically
      speak(`잠깐만요! 위험해요! ${currentQuiz.dangerExplanation}`);
    }
  };

  // --- Move to Next Quiz or Certificate ---
  const handleNextStep = () => {
    stopSpeaking();
    triggerVibe([80]);

    if (quizIndex < 2) {
      // Proceed to next question
      const nextIndex = quizIndex + 1;
      setQuizIndex(nextIndex);
      
      // Shuffle options order for the next question
      const arr = [0, 1, 2];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      setShuffledOrder(arr);

      setWasCorrectOnFirstTry(true);
      setSelectedChoiceIndices([]);
      setLastSelectedChoice(null);
      setAnswered(false);
      setWrongFeedback(null);
      setCorrectFeedback(null);

      // Speak text of the new message
      setTimeout(() => {
        speak(`다음 두 번째 예방 훈련입니다. 문자를 천천히 살펴보고 골라주세요.`);
      }, 200);
    } else {
      // Proceed to review table first as requested
      setStep('review');
      const finalMsg = `${nickname || '어르신'}, 정말 대단하십니다! 세 단계의 스미싱 예방 훈련을 마치셨습니다. 과연 나의 예방 성적표 점수는 몇 점이고 무엇을 복습해야 할지 결과를 지금 확인해 보셔요.`;
      setTimeout(() => {
        speak(finalMsg);
      }, 200);
    }
  };

  const handleGoToCertificate = () => {
    stopSpeaking();
    triggerVibe([150]);
    setStep('certificate');
    const finalMsg = `영광스러운 수령장 수여식입니다. ${nickname || '자랑스러운 어르신'}! 사기꾼들의 미끼를 단번에 사정없이 완파하셨으므로, 대한민국 금융안심 은빛 수료증을 마음껏 수여받으셔요!`;
    setTimeout(() => {
      speak(finalMsg);
    }, 200);
  };

  // Current Active Quiz
  const currentQuiz = selectedQuizzes[quizIndex];

  return (
    <div className="bg-[#000000] text-white min-h-screen font-sans border-t-8 border-yellow-400 selection:bg-yellow-400 selection:text-black flex flex-col justify-between" id="app_root">
      
      {/* ================= HEADER PANEL ================= */}
      <header className="bg-brand-black border-b-4 border-brand-white min-h-[80px] py-4 px-6 sticky top-0 z-50 flex items-center justify-between" id="app_header">
        <div className="max-w-6xl w-full mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo Title section */}
          <div className="flex items-center gap-4">
            <div className="bg-brand-yellow text-brand-black p-2 rounded-full border-2 border-brand-white animate-pulse" id="shield_badge">
              <ShieldCheck className="w-8 h-8 md:w-10 md:h-10" />
            </div>
            <div>
              <h1 className={`${currentFont.desc} font-black text-brand-yellow flex items-center gap-2 tracking-tight`}>
                안심 시니어 <span className={`${currentFont.small} text-brand-white border-l-2 border-neutral-700 pl-2 font-bold inline-block`}>[스미싱 방어 훈련소]</span>
              </h1>
              {nickname && (
                <div className={`${currentFont.smContent} text-brand-green font-bold animate-pulse`} id="header_user_info">
                  👤 {nickname} 어르신 훈련 중
                </div>
              )}
            </div>
          </div>

          {/* Quick controls: Voice toggle & Font sizing */}
          <div className="flex flex-wrap items-center justify-center gap-3 w-full md:w-auto" id="header_tools">
            
            {/* Speech synthesized toggle */}
            <button 
              id="btn_speech_toggle"
              onClick={() => {
                triggerVibe([50]);
                setSpeechEnabled(!speechEnabled);
              }}
              className={`flex items-center gap-2 px-4 py-2 border-2 rounded-lg font-bold cursor-pointer hover:bg-neutral-800 transition ${currentFont.small} ${
                speechEnabled ? 'border-brand-green text-brand-green' : 'border-neutral-600 text-neutral-400'
              }`}
              title="도움말 음성을 켜고 끕니다"
            >
              {speechEnabled ? (
                <>
                  <Volume2 className="w-5 h-5 text-brand-green animate-bounce" />
                  <span>🔊 소리 설명 켜짐</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-5 h-5 text-neutral-500" />
                  <span>🔇 소리 설명 꺼짐</span>
                </>
              )}
            </button>

            {/* Sizing Indicator labels */}
            <div className="flex items-center bg-neutral-950 p-1 border border-neutral-700 rounded-lg" id="font_size_selector">
              <span className={`${currentFont.small} px-2 text-neutral-400 font-bold`}>글자 크기:</span>
              {(['normal', 'large', 'huge'] as const).map((sz) => {
                const labels = { normal: '보통', large: '크게', huge: '아주 크게' };
                const isActive = fontSize === sz;
                return (
                  <button
                    key={sz}
                    onClick={() => {
                      triggerVibe([40]);
                      setFontSize(sz);
                    }}
                    className={`px-3 py-1 font-black rounded cursor-pointer transition ${currentFont.small} ${
                      isActive 
                        ? 'bg-brand-yellow text-brand-black shadow-inner font-extrabold' 
                        : 'text-brand-white hover:bg-neutral-800'
                    }`}
                  >
                    {labels[sz]}
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </header>

      {/* Dynamic progress bar underneath header during active training */}
      {step === 'training' && (
        <div className="w-full bg-neutral-800 h-3.5 relative z-40 border-b border-brand-white" id="header_progress_bar">
          <div 
            className="h-full bg-brand-green transition-all duration-500 ease-out" 
            style={{ width: `${((quizIndex + 1) / 3) * 100}%` }}
          ></div>
        </div>
      )}

      {/* ================= MAIN INTERFACE BODY ================= */}
      <main className="flex-grow max-w-5xl w-full mx-auto px-4 py-6 md:py-10 flex flex-col justify-center" id="app_main">
        <AnimatePresence mode="wait">
          
          {/* 1. ONBOARDING SETUP VIEW */}
          {step === 'onboarding' && (
            <motion.div 
              key="onboarding"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="border-4 border-brand-white bg-brand-black p-6 md:p-10 rounded-3xl shadow-2xl flex flex-col gap-6 md:gap-8 justify-center items-center text-center"
              id="view_onboarding"
            >
              {/* Guardian Mascot Header */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-24 h-24 rounded-full bg-brand-yellow border-4 border-brand-white flex items-center justify-center text-brand-black font-black text-5xl">
                  👮‍♂️
                </div>
                <div className={`bg-brand-yellow text-brand-black font-black px-4 py-1.5 rounded animate-bounce border border-brand-white ${currentFont.small}`}>
                  친절한 금융 주치의 안심이
                </div>
              </div>

              {/* Friendly Onboarding Quote */}
              <div className="max-w-xl">
                <h2 className={`${currentFont.title} text-brand-yellow mb-4 font-black`}>
                  "어르신, 대단히 반갑습니다!"
                </h2>
                <p className={`${currentFont.desc} text-brand-white leading-relaxed font-bold`}>
                  최근 나쁜 자들이 교묘하게 휴대폰으로 보낸 사기 문자 때문에 가슴 졸이신 적이 있으실 텐데요. <br className="hidden md:inline" />
                  저희 <strong>"안심 시니어"</strong>에서 모의 훈련을 통해 안전하게 사기문자 구별법을 배울 수 있습니다!
                </p>
              </div>

              {/* Horizontal Divider */}
              <hr className="w-full border-neutral-800 my-2" />

              {/* Sizing Setting Reminder Box */}
              <div className="w-full max-w-xl bg-[#111111] border-4 border-brand-white p-5 rounded-2xl flex flex-col items-center gap-4">
                <p className={`${currentFont.desc} text-brand-yellow font-black flex items-center gap-2`}>
                  <Sparkles className="w-6 h-6 text-brand-yellow shrink-0 animate-pulse" />
                  어르신 눈에 가장 편한 글자 크기를 골라주셔요
                </p>
                <div className="grid grid-cols-3 gap-3 w-full">
                  {(['normal', 'large', 'huge'] as const).map((sz) => {
                    const sampleTexts = { normal: '보통 크기 (20pt 이상)', large: '기본 크게 (26pt 이상)', huge: '매우 크게 (34pt 이상)' };
                    const detail = sampleTexts[sz];
                    const active = fontSize === sz;
                    return (
                      <button
                        key={sz}
                        onClick={() => {
                          triggerVibe([40]);
                          setFontSize(sz);
                          speak(`${sampleTexts[sz]}로 설정 중입니다`);
                        }}
                        className={`py-3 px-2 border-2 rounded-lg font-black transition cursor-pointer ${currentFont.small} ${
                          active 
                            ? 'border-brand-yellow bg-brand-yellow text-brand-black' 
                            : 'border-neutral-600 bg-brand-black hover:border-brand-white text-neutral-300'
                        }`}
                      >
                        {detail}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* User Name Input Section with Speech Recognition Option! */}
              <div className="w-full max-w-xl flex flex-col gap-3 text-left">
                <label className={`${currentFont.desc} text-brand-white font-black block mb-1`}>
                  ✍️ 어르신의 함자를 아래에 적어주세요 (상장을 드립니다)
                </label>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="성함 또는 불리고 싶은 이름 (예: 김동해, 박순자)"
                    className={`flex-grow bg-[#111111] border-4 border-brand-white text-brand-white font-extrabold py-4 px-4 text-center rounded-xl focus:border-brand-yellow focus:outline-none placeholder:text-neutral-600 shadow-inner ${currentFont.desc}`}
                    id="input_nickname"
                  />
                  
                  {isSTTSupported && (
                    <button
                      onClick={startVoiceInput}
                      className={`px-5 py-4 border-4 rounded-xl font-bold flex items-center gap-2 cursor-pointer transition ${
                        isListening 
                          ? 'bg-brand-red border-brand-white animate-pulse text-brand-white' 
                          : 'bg-brand-yellow border-brand-white text-brand-black hover:bg-yellow-300'
                      }`}
                      title="마이크 단추를 눌러 말로 이름을 입력하세요"
                      id="btn_mic_on"
                    >
                      <Mic className="w-6 h-6 shrink-0" />
                      <span className={`${currentFont.smContent} font-black`}>말로 입력</span>
                    </button>
                  )}
                </div>

                {isListening && (
                  <p className={`${currentFont.desc} text-brand-yellow font-extrabold text-center animate-pulse`}>
                    🎙️ "어르신, 이름을 천천히 불러주셔요! 귀를 쫑긋 세우고 듣고 있습니다."
                  </p>
                )}
                
                <p className={`${currentFont.small} leading-normal`}>
                  * 성함을 쓰시면 나중에 자랑스러운 <strong>수료증</strong>에 그대로 예쁘게 인쇄되어 친지분들에게 자랑하실 수 있습니다.
                </p>
              </div>

              {/* Giant Launch Training Button */}
              <div className="w-full max-w-xl mt-4">
                <button
                  id="btn_start_training"
                  onClick={handleStartPractice}
                  className={`w-full ${currentFont.button} bg-brand-green hover:bg-[#00EE00] text-brand-black border-4 border-brand-white rounded-2xl shadow-xl font-black cursor-pointer transform hover:scale-102 transition flex items-center justify-center gap-3`}
                >
                  <span>🛡️ 가상 스미싱 훈련 시작하기 !</span>
                  <ChevronRight className="w-8 h-8 md:w-10 md:h-10 text-brand-black stroke-[3]" />
                </button>
                <p className={`${currentFont.small} mt-2`}>버튼이 아주 큽니다. 편하게 손바닥이나 손가락으로 누지르셔요.</p>
              </div>

            </motion.div>
          )}

          {/* 2. CORE TRAINING QUIZ SIMULATION VIEW */}
          {step === 'training' && currentQuiz && (
            <motion.div 
              key={`training-${quizIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-6 md:gap-8"
              id="view_quiz_simulation"
            >
              
              {/* Training Progress indicator */}
              <div className="flex flex-col md:flex-row items-center justify-between bg-neutral-900 border-2 border-white p-4 rounded-xl gap-4">
                <div className="flex items-center gap-3">
                  <div className={`bg-yellow-400 text-black rounded-lg py-1 px-3 font-black ${currentFont.smContent}`}>
                    훈련 {quizIndex + 1} 단 계
                  </div>
                  <span className={`${currentFont.smContent} font-bold`}>
                    ({quizIndex + 1} / 3 번째 실전 코스)
                  </span>
                </div>

                {/* Stars/Lives Tracker */}
                <div className="flex items-center gap-3">
                  <span className={`${currentFont.small} font-bold`}>이번 코스 첫 방어:</span>
                  <div className="flex gap-2">
                    {[0, 1, 2].map((idx) => {
                      const isPast = idx < quizIndex;
                      const isCurrent = idx === quizIndex;
                      const wasFirstTryCorrect = firstTryArray[idx];

                      let emoji = '⚪'; // Upcoming
                      if (isPast) {
                        emoji = wasFirstTryCorrect ? '🟢 정답' : '🟡 보완';
                      } else if (isCurrent) {
                        emoji = '⚡ 방어 대조 중';
                      }

                      return (
                        <span 
                          key={idx} 
                          className={`px-3 py-1 font-black rounded ${currentFont.small} ${
                            isCurrent 
                              ? 'bg-yellow-400 text-black font-extrabold animate-pulse' 
                              : isPast && wasFirstTryCorrect 
                                ? 'bg-green-600 text-white' 
                                : isPast 
                                  ? 'bg-orange-600 text-white' 
                                  : 'bg-neutral-800 text-neutral-500'
                          }`}
                        >
                          {idx + 1}단계: {emoji}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Two Column Grid: Left is simulated Phone, Right is Questions and Choices */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
                
                {/* 2A. LEFT: REAL SMS SQUEEZE DETECTOR (NO PHONE FRAME) */}
                <div className="lg:col-span-5 flex flex-col gap-6 w-full" id="real_sms_case_detector">
                  
                  {/* Title Bar styling: Highly high-contrast, double border */}
                  <div className="bg-[#111111] border-4 border-brand-yellow rounded-2xl p-4 text-center shadow-lg">
                    <p className={`${currentFont.desc} text-brand-yellow font-black`}>
                      🔎 실제 사기꾼이 보낸 가짜 문자 화면
                    </p>
                  </div>

                  {/* Real screenshot container (NO PHONE FRAME) */}
                  {currentQuiz?.realImageSrc ? (
                    <div className="bg-[#0f0f0f] border-4 border-brand-white rounded-2xl overflow-hidden shadow-2xl p-4 flex flex-col justify-center items-center">
                      <div className="w-full bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden flex justify-center items-center py-4 px-2 max-h-[380px]">
                        <img 
                          src={currentQuiz.realImageSrc} 
                          alt={currentQuiz.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-auto object-contain max-h-[340px] rounded hover:scale-103 transition duration-300"
                        />
                      </div>
                      <span className={`${currentFont.small} text-brand-red font-black mt-2 animate-pulse`}>
                        ⚠️ 실제 사기 문자 캡처 화면입니다.
                      </span>
                    </div>
                  ) : (
                    /* Fallback when there's no image */
                    <div className="bg-[#111111] border-4 border-dashed border-brand-yellow rounded-2xl p-6 text-left shadow-lg relative" id="sms_bubble_element">
                      <p className={`${currentFont.smContent} text-brand-white font-black whitespace-pre-line leading-relaxed break-all`}>
                        {renderSmsWithColoredUrls(currentQuiz?.smsContent)}
                      </p>
                    </div>
                  )}

                  {/* Magnified Text Assist Bubble (For Senior Readability - Dynamically Scales with All Font Sizes!) */}
                  <div className="bg-[#111111] border-4 border-double border-brand-yellow rounded-2xl p-5 text-left shadow-lg relative">
                    <div className="absolute right-3 top-3 bg-brand-yellow text-brand-black text-xs font-black px-2 py-0.5 rounded tracking-tighter">
                      👀 돋보기 가동중
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-2xl shrink-0">🔍</span>
                      <p className={`${currentFont.smContent} text-brand-yellow font-black`}>
                        밑에 쓰여있는 문자 글씨 크게보기:
                      </p>
                    </div>
                    
                    {/* The Magnified text transcription */}
                    <p className={`${currentFont.desc} text-brand-white leading-relaxed font-bold whitespace-pre-line break-all bg-black/60 p-4 rounded-xl border border-neutral-800 shadow-inner`}>
                      {renderSmsWithColoredUrls(currentQuiz.smsContent)}
                    </p>
                  </div>

                  {/* Speaker helper trigger for SMS */}
                  <button
                    onClick={() => {
                      triggerVibe([50]);
                      speak(`발신인: ${currentQuiz.sender}. 문자 내용: ${currentQuiz.smsContent}`);
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-850 px-5 py-4 border-2 border-white rounded-xl text-yellow-400 font-black cursor-pointer shadow-md transition transform hover:scale-101"
                    title="의심문자를 소리로 듣습니다"
                  >
                    <Volume2 className="w-6 h-6 text-yellow-400 animate-bounce" />
                    <span className={currentFont.smContent}>🔈 이 문자내용 소리로 전부 듣기</span>
                  </button>

                </div>

                {/* 2B. RIGHT: QUESTION & INSTRUCTIONS AREA */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                  
                  {/* Real Question Board */}
                  <div className="bg-[#111111] border-4 border-brand-white p-5 md:p-6 rounded-2xl text-left flex flex-col gap-4 shadow-xl" id="question_board_card">
                    
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`bg-brand-yellow text-brand-black font-black px-4 py-1.5 rounded-lg border border-brand-white ${currentFont.smContent}`}>
                        🚨 훈련 {quizIndex + 1}단계 : {currentQuiz.type} 사기
                      </span>
                      <span className={`text-neutral-400 font-bold ${currentFont.small}`}>
                        [{currentQuiz.title}]
                      </span>
                    </div>

                    <div className="border-b border-neutral-800 pb-3">
                      <h3 className={`${currentFont.desc} text-brand-white font-medium leading-relaxed`}>
                        어르신! 실제 사기문자를 확인하시고 아래 파란 미끼 주소에 대해 어떻게 할 지 결정해 주셔요:
                        <br />
                        <span className="text-brand-yellow font-black mt-2 block">"{currentQuiz.question}"</span>
                      </h3>
                    </div>

                    <div className="flex items-center gap-2.5 text-neutral-300 bg-black border border-neutral-800 p-3 rounded-lg font-semibold">
                      <Info className="w-5 h-5 text-brand-yellow shrink-0" />
                      <span className={currentFont.small}>아래 3가지 중 가장 현명하고 안전한 은빛 대처법 단추 하나를 골라 주셔요.</span>
                    </div>
                  </div>

                   {/* Choices Stack - Massive buttons for shaking/imprecise fingers */}
                  <div className="flex flex-col gap-5" id="choices_container">
                    {shuffledOrder.map((origIdx, renderIdx) => {
                      const choice = currentQuiz.choices[origIdx];
                      const cleanChoice = choice.replace(/^[1-3]\.\s*/, '');
                      const isCorrect = origIdx === currentQuiz.correctIndex;
                      const isSelected = lastSelectedChoice === origIdx;
                      const isPreviouslyFailed = selectedChoiceIndices.includes(origIdx);

                      // Determine button styling based on feedback and state
                      let btnStyle = 'border-brand-white text-brand-white bg-black hover:bg-neutral-900 hover:border-brand-yellow font-black';
                      
                      if (answered && isCorrect) {
                        btnStyle = 'border-brand-green bg-neutral-950 text-brand-green pointer-events-none ring-4 ring-brand-green/30 font-black';
                      } else if (isPreviouslyFailed) {
                        btnStyle = 'border-brand-red bg-neutral-950 text-brand-red opacity-50 cursor-not-allowed line-through font-black';
                      } else if (isSelected && !answered) {
                        btnStyle = 'border-brand-yellow text-brand-yellow bg-neutral-950 font-black';
                      }

                      return (
                        <button
                          key={origIdx}
                          id={`btn_choice_${origIdx}`}
                          disabled={answered || isPreviouslyFailed}
                          onClick={() => handleSelectChoice(origIdx)}
                          className={`w-full ${currentFont.button} rounded-[25px] border-[6px] text-left p-5 md:p-6 transition transform hover:scale-101 active:scale-98 shadow-md flex items-center gap-5 cursor-pointer ${btnStyle}`}
                        >
                          {/* Number Indicator Badge */}
                          <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full border-[4px] flex items-center justify-center shrink-0 font-black ${currentFont.desc} ${
                            answered && isCorrect 
                              ? 'bg-brand-green border-brand-white text-black' 
                              : isPreviouslyFailed 
                                ? 'bg-brand-red border-brand-white text-white line-through' 
                                : 'bg-white text-black border-brand-yellow'
                          }`}>
                            {renderIdx + 1}
                          </div>

                          <span className="flex-grow font-black leading-tight">{cleanChoice}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* ================= FULLSCREEN CORRECT FEEDBACK OVERLAY ================= */}
                  <AnimatePresence>
                    {correctFeedback && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/95 backdrop-blur-md z-[999] flex items-center justify-center p-4 md:p-8"
                        id="correct_feedback_fullscreen"
                      >
                        <motion.div
                          initial={{ scale: 0.9, y: 30 }}
                          animate={{ scale: 1, y: 0 }}
                          exit={{ scale: 0.9, y: 30 }}
                          transition={{ type: "spring", damping: 25, stiffness: 180 }}
                          className="bg-brand-black border-8 border-brand-green p-6 md:p-10 rounded-3xl text-left max-w-2xl w-full flex flex-col gap-6 shadow-2xl relative"
                        >
                          {/* Praise Header Box */}
                          <div className="flex items-center gap-3 bg-green-950 border-2 border-brand-green p-4 rounded-2xl">
                            <div className="p-2 bg-brand-green rounded-full text-brand-black animate-bounce shrink-0">
                              <CheckCircle className="w-8 h-8 md:w-10 md:h-10" />
                            </div>
                            <h3 className={`${currentFont.title} font-black text-brand-white leading-tight`}>
                              🎉 참 잘하셨어요! 완벽한 정답입니다!
                            </h3>
                          </div>

                          {/* Message Description */}
                          <div className="flex-grow">
                            <p className={`${currentFont.desc} text-brand-yellow font-black leading-relaxed mb-4`}>
                              "어르신! 사기 수법을 완벽하고 시원하게 물리치셨습니다!"
                            </p>
                            
                            <hr className="border-neutral-800 my-3" />
                            
                            <p className={`${currentFont.smContent} text-brand-white leading-relaxed font-bold`}>
                              {correctFeedback}
                            </p>

                            {/* Core rule banner */}
                            <div className="mt-6 bg-[#111111] border-4 border-dashed border-brand-green p-4 md:p-5 rounded-2xl text-left shadow-lg">
                              <span className={`${currentFont.desc} text-brand-green font-black block mb-1.5`}>💡 은빛 안심 우수교재 요약:</span>
                              <p className={`${currentFont.smContent} text-brand-white font-bold leading-relaxed`}>
                                {quizIndex === 0 && "출처 불명 문자 메시지의 인터넷 주소(URL)는 클릭하기 전에 무조건 의심하고 누르지 않는 것이 완벽한 예방입니다!"}
                                {quizIndex === 1 && "가족을 사칭해 휴대폰 파손이나 임시번호 소식을 전해오면 확인 전까지 카드를 사거나 대리 결제하지 마시고, 기존 번호로 꼭 통화해보세요!"}
                                {quizIndex === 2 && "공공기관, 금융기관 등은 어떠한 경우에도 문자나 카카오톡으로 보안카드 이미지나 개인금융정보를 수집하거나 요구하지 않습니다!"}
                              </p>
                            </div>
                          </div>

                          {/* Next controls inside overlay block */}
                          <div className="flex justify-center border-t border-neutral-800 pt-4 mt-2">
                            <button
                              id="btn_next_training"
                              onClick={handleNextStep}
                              className={`w-full ${currentFont.button} bg-brand-green hover:bg-[#00EE00] text-brand-black border-4 border-brand-white rounded-2xl font-black cursor-pointer flex items-center justify-center gap-3 shadow-2xl transition hover:scale-102`}
                            >
                              <span>{quizIndex < 2 ? '다음 단계 훈련으로 전진 ➡️' : '은빛 수료증 받기 🎓'}</span>
                            </button>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ================= FULLSCREEN RETRY OVERLAY ON WRONG ANSWER ================= */}
                  <AnimatePresence>
                    {wrongFeedback && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/95 backdrop-blur-md z-[999] flex items-center justify-center p-4 md:p-8"
                        id="wrong_feedback_fullscreen"
                      >
                        <motion.div
                          initial={{ scale: 0.9, y: 30 }}
                          animate={{ scale: 1, y: 0 }}
                          exit={{ scale: 0.9, y: 30 }}
                          transition={{ type: "spring", damping: 25, stiffness: 180 }}
                          className="bg-brand-black border-8 border-brand-red p-6 md:p-10 rounded-3xl text-left max-w-2xl w-full flex flex-col gap-6 shadow-2xl relative"
                        >
                          {/* Alert Header Box */}
                          <div className="flex items-center gap-3 bg-red-950 border-2 border-brand-red p-4 rounded-2xl">
                            <div className="p-2 bg-brand-red rounded-full text-white animate-bounce shrink-0">
                              <AlertTriangle className="w-8 h-8 md:w-10 md:h-10" />
                            </div>
                            <h3 className={`${currentFont.title} font-black text-white leading-tight`}>
                              ⚠️ 잠깐만요! 어르신, 위험합니다!
                            </h3>
                          </div>

                          {/* Message Description */}
                          <div className="flex-grow">
                            <p className={`${currentFont.desc} text-brand-yellow font-black leading-relaxed mb-4`}>
                              "방금 선택하신 방법은 매우 큰 사기 피해를 당하실 수 있습니다!"
                            </p>
                            
                            <hr className="border-neutral-800 my-3" />
                            
                            <p className={`${currentFont.smContent} text-brand-white leading-relaxed font-bold`}>
                              {wrongFeedback}
                            </p>

                            {/* Core rule warning banner */}
                            <div className="mt-6 bg-[#111111] border-4 border-dashed border-brand-yellow p-4 md:p-5 rounded-2xl text-left shadow-lg">
                              <span className={`${currentFont.desc} text-brand-yellow font-black block mb-1.5`}>💡 은빛 안심 보수교육 처방전:</span>
                              <p className={`${currentFont.smContent} text-brand-white font-bold leading-relaxed`}>
                                문자의 인터넷 <span className="text-brand-red underline decoration-2 font-black">파란 인터넷 주소(링크)</span>는 전송된 해커 악성 코드이며, 자녀 사칭은 반드시 <span className="text-brand-green font-black">기존에 알던 번호로 무조건 먼저 전화를 걸어 대조</span>해야 안전합니다!
                              </p>
                            </div>
                          </div>

                          {/* Retry control button */}
                          <div className="flex justify-center border-t border-neutral-800 pt-4 mt-2">
                            <button
                              onClick={() => {
                                triggerVibe([80]);
                                setWrongFeedback(null);
                                speak("괜찮습니다! 다시 골라봅시다. 화이팅!");
                              }}
                              className={`w-full ${currentFont.button} bg-brand-yellow hover:bg-yellow-300 text-brand-black border-4 border-brand-white rounded-2xl font-black cursor-pointer flex items-center justify-center gap-3 shadow-2xl transition hover:scale-102`}
                              id="btn_wrong_retry"
                            >
                              <RotateCcw className="w-8 h-8 shrink-0 animate-spin" style={{ animationDuration: '3s' }} />
                              <span>🔄 다른 답으로 다시 고르기 (재도전)</span>
                            </button>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>

              </div>

            </motion.div>
          )}

          {/* 2.5. SCORE REVIEW SCREEN */}
          {step === 'review' && (
            <motion.div 
              key="review"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="border-4 border-brand-white bg-brand-black p-5 sm:p-8 rounded-3xl shadow-2xl flex flex-col gap-6 md:gap-8"
              id="view_score_review"
            >
              {/* Header Box */}
              <div className="text-center flex flex-col items-center gap-2">
                <div className="w-20 h-20 rounded-full bg-brand-yellow text-brand-black border-4 border-brand-white flex items-center justify-center font-black text-4xl shadow-md">
                  📋
                </div>
                <h2 className={`${currentFont.title} text-brand-yellow font-black`}>
                  안심 시니어 모의 훈련 예방 성적표
                </h2>
                <p className={`${currentFont.desc} text-neutral-300 font-bold max-w-xl mx-auto`}>
                  어르신, 대단히 애쓰셨습니다! 나쁜 금융 사기꾼들을 향한 3가지 실전 안심 방어력이 아래와 같이 채점되었습니다.
                </p>
              </div>

              {/* High Contrast Scoreboard Table */}
              <div className="w-full bg-[#111111] border-4 border-brand-white rounded-2xl overflow-hidden shadow-inner">
                <div className="grid grid-cols-1 md:grid-cols-3 border-b border-brand-white text-center">
                  <div className="p-4 border-b md:border-b-0 md:border-r border-brand-white animate-fade">
                    <p className={`${currentFont.small} text-brand-yellow font-black uppercase mb-1`}>🛡️ 훈련 참가인</p>
                    <p className={`${currentFont.title} text-brand-white font-black truncate`}>
                      {nickname || '김안심'} 어르신
                    </p>
                  </div>
                  <div className="p-4 border-b md:border-b-0 md:border-r border-brand-white bg-brand-red/10 animate-fade">
                    <p className={`${currentFont.small} text-brand-red font-black uppercase mb-1`}>🎯 첫 시도 정답 개수</p>
                    <p className={`${currentFont.title} font-extrabold text-brand-white flex items-center justify-center gap-1.5 leading-none py-1`}>
                      <span className="text-brand-yellow animate-pulse font-black">{score}</span>
                      <span className={`${currentFont.small} text-neutral-400 font-bold`}>/ 3 문제</span>
                    </p>
                  </div>
                  <div className="p-4 flex flex-col justify-center items-center">
                    <p className={`${currentFont.small} text-brand-green font-black uppercase mb-1`}>🎗️ 훈련 합격 판정</p>
                    {score === 3 ? (
                      <span className={`bg-brand-green text-brand-black px-4 py-1.5 rounded-lg font-black tracking-widest border border-brand-white ${currentFont.smContent}`}>
                        합격 ! 🏆 [영웅]
                      </span>
                    ) : (
                      <span className={`bg-brand-red text-brand-white px-4 py-1.5 rounded-lg font-black tracking-widest border border-brand-white ${currentFont.smContent}`}>
                        오답 보완 필 ⚠️
                      </span>
                    )}
                  </div>
                </div>

                {/* Score Status Message with Voice Friendly Speech Text */}
                <div className="p-4 text-center bg-black/40">
                  {score === 3 ? (
                    <p className={`${currentFont.desc} text-brand-green font-black`}>
                      💯 만점입니다! 어르신께서는 스미싱의 파란 미끼와 가짜 자녀 번호 사기를 100% 간파하셨습니다! 최고의 은빛 국가 안심 수료 자격을 인정해 드립니다.
                    </p>
                  ) : (
                    <p className={`${currentFont.desc} text-brand-yellow font-black`}>
                      ⚠️ 아직 한차례 실수가 남아있습니다! 나쁜 사기 일당의 기만적인 함정들을 100% 피해내기 위하여 틀린 부분을 상기한 후, 만점으로 수료증에 다시 도전해보셔요!
                    </p>
                  )}
                </div>
              </div>

              {/* Bento Score Review Detail items */}
              <div className="flex flex-col gap-4">
                <h3 className={`${currentFont.smContent} text-left text-brand-yellow font-black flex items-center gap-1.5 border-l-4 border-brand-yellow pl-3`}>
                  🧐 각 문항별 훈련 결과 오답 노트 대조
                </h3>

                <div className="grid grid-cols-1 gap-4">
                  {selectedQuizzes.map((quiz, idx) => {
                    const isFirstTryCorrect = firstTryArray[idx];
                    return (
                      <div 
                        key={quiz.id}
                        className={`border-4 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center ${
                          isFirstTryCorrect 
                            ? 'border-brand-green bg-brand-green/5' 
                            : 'border-brand-red bg-brand-red/5'
                        }`}
                      >
                        {/* Left Info Column */}
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                          {/* Case Image Thumbnail if present */}
                          {quiz.realImageSrc ? (
                            <div className="w-20 h-20 rounded-xl bg-neutral-900 border border-neutral-800 p-1 flex justify-center items-center overflow-hidden shrink-0">
                              <img 
                                src={quiz.realImageSrc} 
                                alt={quiz.title} 
                                className="w-full h-auto object-contain max-h-[70px]" 
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ) : (
                            <div className="w-20 h-20 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                              <span className="text-3xl">📱</span>
                            </div>
                          )}

                          {/* Text summary info */}
                          <div className="text-left">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`bg-neutral-800 text-neutral-300 font-black px-2 py-0.5 rounded ${currentFont.small}`}>
                                단계 {idx + 1}
                              </span>
                              <span className="text-neutral-500 font-bold text-xs">|</span>
                              <span className={`text-brand-yellow font-black ${currentFont.smContent}`}>
                                [{quiz.type}] 부문
                              </span>
                            </div>
                            <p className={`${currentFont.smContent} text-brand-white font-black mt-1`}>
                              {quiz.title}
                            </p>
                            
                            {/* Quiz specific danger highlights */}
                            <p className={`${currentFont.small} text-neutral-400 mt-0.5 leading-relaxed font-semibold`}>
                              내용: {quiz.smsContent.length > 50 ? quiz.smsContent.slice(0, 50) + '...' : quiz.smsContent}
                            </p>
                          </div>
                        </div>

                        {/* Right Resolution Column */}
                        <div className="w-full md:w-auto text-left md:text-right flex flex-col gap-1 shrink-0 border-t md:border-t-0 border-neutral-800 pt-3 md:pt-0">
                          <div className="flex items-center gap-2 md:justify-end">
                            {isFirstTryCorrect ? (
                              <span className={`bg-brand-green text-brand-black px-3 py-1 rounded-full font-black border border-brand-white flex items-center gap-1 ${currentFont.small}`}>
                                <span>🟢 첫 시도 성공</span>
                              </span>
                            ) : (
                              <span className={`bg-brand-red text-brand-white px-3 py-1 rounded-full font-black border border-brand-white flex items-center gap-1 animate-pulse ${currentFont.small}`}>
                                <span>🟡 복습 및 교정완료</span>
                              </span>
                            )}
                          </div>
                          
                          <p className={`${currentFont.small} text-brand-yellow mt-1 font-bold`}>
                            핵심 방지 행동 요약:
                          </p>
                          <p className={`${currentFont.smContent} text-brand-white font-black leading-snug md:max-w-xs`}>
                            💡 {quiz.coreRule}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Call to Active Navigation Buttons */}
              <div className="flex flex-col gap-4 mt-4">
                {/* Score block conditional actions */}
                {score === 3 ? (
                  <div className="flex flex-col gap-3">
                    <button
                      id="btn_claim_cert"
                      onClick={handleGoToCertificate}
                      className={`w-full ${currentFont.button} bg-brand-green hover:bg-[#00EE00] text-brand-black border-4 border-brand-white rounded-2xl shadow-2xl font-black cursor-pointer flex items-center justify-center gap-3 transform hover:scale-102 transition duration-240`}
                    >
                      <span>🎓 만점 달성! 은빛 평생 안심 수료증 발부받기 ➡️</span>
                    </button>
                    <button
                      onClick={handleStartPractice}
                      className={`${currentFont.small} self-center text-neutral-400 underline decoration-1 hover:text-brand-yellow cursor-pointer font-bold`}
                    >
                      🔄 기록 갱신과 무작위 복습을 위해 처음부터 다시 훈련할래요
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <button
                      id="btn_retry_practice"
                      onClick={() => {
                        triggerVibe([100]);
                        handleStartPractice();
                      }}
                      className={`w-full ${currentFont.button} bg-brand-yellow hover:bg-yellow-300 text-brand-black border-4 border-brand-white rounded-2xl shadow-xl font-black cursor-pointer flex items-center justify-center gap-3 transform hover:scale-102 transition duration-240`}
                    >
                      <RotateCcw className="w-7 h-7 stroke-[3]" />
                      <span>🔄 오답 상기해서 수료증 따러 다시 도전하기 !</span>
                    </button>
                    
                    {/* Locked Certificate Visual indicator */}
                    <div className="bg-neutral-900 border border-neutral-800 text-neutral-500 rounded-xl p-3.5 flex items-center justify-center gap-2.5">
                      <span className="text-xl">🔒</span>
                      <p className={`${currentFont.small} font-bold text-neutral-400`}>
                        은빛 평생 보호 수료증은 오답 실수가 전혀 없는 <strong className="text-brand-yellow">"100점 만점"</strong> 기록 시에만 명예롭게 발급됩니다!
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* 3. CERTIFICATE AND ACTION REPORT VIEW */}
          {step === 'certificate' && (
            <motion.div 
              key="certificate"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col gap-8 text-center"
              id="view_certificate"
            >
              
              {/* Main Gorgeous Stamp Certificate frame */}
              <div className="border-8 border-double border-brand-yellow bg-brand-black p-6 md:p-12 rounded-3xl relative overflow-hidden text-left shadow-2xl flex flex-col gap-6" id="printed_certificate">
                
                {/* Background retro frame borders */}
                <div className="absolute top-2 left-2 right-2 bottom-2 border-2 border-dashed border-brand-yellow/20 pointer-events-none rounded-2xl"></div>
                
                {/* Vintage top ribbon */}
                <div className="text-center flex flex-col items-center gap-2">
                  <div className="w-16 h-16 bg-brand-yellow text-brand-black p-3 rounded-full border-4 border-brand-white flex items-center justify-center shadow-lg">
                    <Award className="w-10 h-10" />
                  </div>
                  <span className={`text-brand-yellow font-bold tracking-widest font-mono ${currentFont.small}`}>제 2026-안심-9945호</span>
                  <h3 className={`${currentFont.title} md:text-5xl font-black text-brand-white text-center border-b-4 border-brand-yellow pb-2 md:pb-4 w-max mx-auto tracking-widest`}>
                    금융 안심 은빛 수료증
                  </h3>
                </div>

                {/* Star Scoring Achievement Badge */}
                <div className="flex justify-center items-center gap-2 my-2 bg-neutral-900 border border-neutral-800 p-4 rounded-2xl max-w-sm mx-auto w-full">
                  <div className={`text-left font-bold text-neutral-400 mr-3 ${currentFont.small}`}>
                    방어 성과 등급:
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3].map((star) => {
                      // Award stars: 
                      // 3 stars: Score === 3
                      // 2 stars: Score === 2
                      // 1 star: Score <= 1
                      const isAwarded = star <= score;
                      return (
                        <span 
                          key={star} 
                          className={`text-3xl md:text-4xl transition-all ${
                            isAwarded ? 'text-brand-yellow animate-spin-once' : 'text-neutral-700 font-light'
                          }`}
                        >
                          {isAwarded ? '★' : '☆'}
                        </span>
                      );
                    })}
                  </div>
                  <div className={`font-mono text-brand-yellow font-extrabold ml-2 ${currentFont.smContent}`}>
                    ({score} / 3 개 철저방어)
                  </div>
                </div>

                {/* Customer Personalized Statement */}
                <div className="my-3 flex flex-col gap-4 text-center max-w-2xl mx-auto">
                  <p className={`${currentFont.title} text-brand-white`}>
                    성 명: <span className="text-brand-yellow border-b-2 border-dashed border-brand-white px-2 font-black">{nickname || '자랑스러운 어르신'}</span> 귀하
                  </p>
                  
                  <p className={`${currentFont.smContent} text-neutral-200 leading-relaxed text-center font-bold px-2 py-4 bg-neutral-900/60 rounded-xl border border-neutral-800`}>
                    위 어르신은 악독한 스미싱 사기꾼들이 꾸며낸 택배 사칭, 가족 사칭, 공공기관 허위 통지 등 세상이 어지러운 속임수들을 완벽한 예리함과 지혜로 무참히 격퇴하고 소중한 금융 안전지대를 일구어 내셨습니다. <br className="hidden md:inline" /> <br />
                    이에 고마운 뜻과 높은 노고를 깊이 기리고자, "안심 시니어" 군민 수비대로 정식 위촉함과 동시에 이 <strong>은빛 기사 수료장</strong>을 수여합니다.
                  </p>
                </div>

                {/* Outer Official Seal Stamp */}
                <div className="flex justify-between items-end mt-4">
                  <div className={`text-neutral-500 font-mono ${currentFont.small}`}>
                    발급일: 2026년 5월 28일<br />
                    방어소 교육 소장: 친절한 안심이 드림
                  </div>
                  
                  {/* Digital Signature stamp in RED */}
                  <div className={`w-20 h-20 md:w-24 md:h-24 border-4 border-brand-red rounded-full flex items-center justify-center text-center text-brand-red font-black rotate-[-8deg] shadow-lg animate-pulse select-none bg-brand-black ${currentFont.small}`}>
                    안심시니어<br />인증도장
                  </div>
                </div>

              </div>

              {/* ================= CORE EDUCATION WRAP-UP (SUMMARY) ================= */}
              <div className="text-left bg-brand-black border-4 border-brand-white p-6 md:p-8 rounded-2xl flex flex-col gap-6" id="summary_cheatsheet">
                
                <h4 className={`text-brand-yellow font-black flex items-center gap-2 border-b-2 border-neutral-800 pb-2 ${currentFont.title}`}>
                  <span className="bg-brand-yellow text-brand-black py-0.5 px-3 rounded-md font-bold">필독!</span>
                  수명 연장 금융 사기 방어 필수 3대 원칙
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="rules_bento">
                  
                  <div className="border bg-neutral-900 border-neutral-800 p-4 rounded-xl flex flex-col gap-2">
                    <span className={`text-brand-red font-black ${currentFont.title}`}>1원칙</span>
                    <h5 className={`font-black text-brand-white ${currentFont.desc}`}>출처 불명 링크 클릭 금지</h5>
                    <p className={`text-neutral-300 leading-relaxed font-bold ${currentFont.smContent}`}>
                      모르는 번호(010, 02 등)로 들어온 문자 속의 <strong>파란색 인터넷 링크 주소(URL)</strong>는 100% 해킹 악성코드입니다! 절대로 손가락으로 누르시면 안 됩니다.
                    </p>
                  </div>

                  <div className="border bg-neutral-900 border-neutral-800 p-4 rounded-xl flex flex-col gap-2">
                    <span className={`text-brand-yellow font-black ${currentFont.title}`}>2원칙</span>
                    <h5 className={`font-black text-brand-white ${currentFont.desc}`}>자녀 사칭은 늘 유선 통화로</h5>
                    <p className={`text-neutral-300 leading-relaxed font-bold ${currentFont.smContent}`}>
                      "엄마, 폰 고장 나서 대리폰이야" 하며 임시 주소 설치나 카드대리 구매를 강요하면 꼭 무시하시고, <strong>기존에 내 폰에 저장된 자녀 진짜 번호</strong>로 전화를 걸어 검증하세요.
                    </p>
                  </div>

                  <div className="border bg-neutral-900 border-neutral-800 p-4 rounded-xl flex flex-col gap-2">
                    <span className={`text-brand-green font-black ${currentFont.title}`}>3원칙</span>
                    <h5 className={`font-black text-brand-white ${currentFont.desc}`}>민관 공식 대조 문의</h5>
                    <p className={`text-neutral-300 leading-relaxed font-bold ${currentFont.smContent}`}>
                      법원, 검찰, 세무서, 우체국, 구청은 절대로 전화를 하거나 개인 주소로 비밀번호를 요구하지 않습니다. 미심쩍을 땐 문자를 지우고, 해당 <strong>정부기관의 진짜 공식 콜센터</strong>로 물어보세요.
                    </p>
                  </div>

                </div>

                {/* Print simulator & family share message */}
                <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-brand-yellow text-brand-black p-2 rounded-full shrink-0">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <p className={`text-neutral-400 leading-normal font-bold ${currentFont.small}`}>
                      이 비법들을 자식이나 자녀, 소중한 친구들에게 소문내셔요! 전화를 걸어 <strong>"내가 안심 은빛 수료증을 땄다!"</strong> 알려주면 가족 모두 보이스 피싱 불안에서 해방됩니다.
                    </p>
                  </div>

                  {/* Mock print triggers */}
                  <button
                    onClick={() => {
                      triggerVibe([100]);
                      window.print();
                    }}
                    className={`px-4 py-2 border border-neutral-500 rounded-lg font-bold text-neutral-300 hover:text-white flex items-center gap-2 shrink-0 cursor-pointer ${currentFont.small}`}
                    title="인쇄용지 출력"
                  >
                    <Printer className="w-4 h-4" />
                    <span>상장 인쇄하기</span>
                  </button>
                </div>

              </div>

              {/* Master Control: Train again with new scrambled tasks */}
              <div className="max-w-md mx-auto w-full mt-2">
                <button
                  id="btn_restart"
                  onClick={handleStartPractice}
                  className="w-full py-6 bg-brand-yellow hover:opacity-90 text-brand-black font-black border-4 border-brand-white text-2xl md:text-3xl rounded-2xl cursor-pointer transform hover:scale-102 transition flex items-center justify-center gap-3 shadow-2xl"
                >
                  <RotateCcw className="w-8 h-8 md:w-10 md:h-10 text-brand-black" />
                  <span>🔄 새로운 문제로 다시 연습하기!</span>
                </button>
                <button
                  onClick={() => {
                    triggerVibe([40]);
                    stopSpeaking();
                    setStep('onboarding');
                  }}
                  className="mt-4 px-6 py-3 border border-dashed border-neutral-500 rounded-xl text-neutral-400 hover:text-white text-lg font-bold block mx-auto cursor-pointer"
                >
                  ◀ 처음 화면(닉네임 설정)으로 돌아가기
                </button>
              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ================= FOOTER DECORATION AREA ================= */}
      <footer className="bg-neutral-900 border-t-4 border-double border-white py-6 px-4 text-center mt-10" id="app_footer">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-3">
          <p className={`text-neutral-400 leading-relaxed font-semibold ${currentFont.small}`}>
            본 "안심 시니어" 훈련소의 시뮬레이션 문양 및 사례는 경찰청, 금융감독원 공식 합동 배포 실제 스미싱 사건을 기반으로 안전 조립되었습니다. <br />
            개인 식별명 정보는 어르신의 휴대폰 안전 로컬 드라이버(Local Storage)에만 보존되고 외부 서버로 수집되지 않으오니 안심하십시오.
          </p>
          
          <div className={`flex gap-4 items-center mt-1 text-neutral-500 font-mono ${currentFont.small}`}>
            <span>© 2026 안심 시니어 실전 수호 위원회</span>
            <span>|</span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full inline-block animate-pulse"></span>
              24H 실시간 수호 레이더 가동중
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
