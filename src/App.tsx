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
  PhoneCall
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

// Strip out any URLs/links so they are not spoken aloud for seniors
function cleanUrlsForSpeech(text: string): string {
  if (!text) return '';
  const regex = /(https?:\/\/\u0025*(?:[a-zA-Z0-9-._~:/?#[\]@!$&'()*+,;=]|\.\.\.)+|bit\.ly\/\S+|sh\.kr\/\S+|cs-card-guard\.net)/gi;
  // Replace tilde symbol so it is not spoken aloud as well
  let withPauses = text.replace(regex, '').replace(/~/g, '');
  // Replace newlines with period and space if not already ending in terminal punctuations for natural breathing pauses
  withPauses = withPauses.split('\n').map(line => {
    const trimmed = line.trim();
    if (!trimmed) return '';
    if (/[.!?]$/.test(trimmed)) return trimmed;
    return trimmed + '.';
  }).join(' ');
  return withPauses.replace(/\s+/g, ' ').trim();
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
  const [showWrongNotes, setShowWrongNotes] = useState<boolean>(false);

  // Mic state (Speech to Text)
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSTTSupported, setIsSTTSupported] = useState<boolean>(false);
  const [sttErrorMessage, setSttErrorMessage] = useState<string | null>(null);
  const [isSpeakerActive, setIsSpeakerActive] = useState<boolean>(false);

  // --- Check STT compatibility ---
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSTTSupported(!!SpeechRecognition);
  }, []);

  // --- Speech Synthesis Helper ---
  const speak = (text: string, onEndCallback?: () => void) => {
    if (!speechEnabled) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Cancel any ongoing speech

      // Replace manual line breaks with punctuation so the voice stops naturally, stripping tildes (~)
      let processedText = text.replace(/~/g, '').split('\n').map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        if (/[.!?]$/.test(trimmed)) return trimmed;
        return trimmed + '.';
      }).join(' ');
      processedText = processedText.replace(/\s+/g, ' ').trim();

      const utterance = new SpeechSynthesisUtterance(processedText);
      utterance.lang = 'ko-KR';
      
      // Default: 친절하고 천천히 읽기 (천천하고 다정한 속도 변경)
      let rate = 0.82; 
      let pitch = 1.05; 

      const hasExclamation = text.includes('!');
      const isCorrectText = text.includes('정답') || text.includes('잘하셨') || text.includes('완벽') || text.includes('대단하십니다') || text.includes('만점');
      const isWrongText = text.includes('위험') || text.includes('잠깐만요') || text.includes('주의') || text.includes('오답') || text.includes('안 됩니다') || text.includes('속으시면');

      if (hasExclamation) {
        if (isCorrectText) {
          // 정답을 맞췄으면 기뻐하는 활기찬 목소리로 
          rate = 0.91;
          pitch = 1.25;
        } else if (isWrongText) {
          // 틀렸으면 보다 다정하고 부드럽게 위로하듯 
          rate = 0.74;
          pitch = 1.00;
        } else {
          // 일반적인 강조
          rate = 0.81;
          pitch = 1.10;
        }
      } else {
        // 느낌표가 없는 경우라도 보정
        if (isCorrectText) {
          rate = 0.84;
          pitch = 1.12;
        } else if (isWrongText) {
          rate = 0.76;
          pitch = 1.02;
        }
      }

      utterance.rate = rate; 
      utterance.pitch = pitch; 
      
      // Let's try to fine-tune a warm voice if possible
      const voices = window.speechSynthesis.getVoices();
      const koVoice = voices.find(v => v.lang.startsWith('ko') || v.lang.includes('Korean'));
      if (koVoice) {
        utterance.voice = koVoice;
      }
      
      utterance.onend = () => {
        setIsSpeakerActive(false);
        if (onEndCallback) onEndCallback();
      };
      utterance.onerror = () => {
        setIsSpeakerActive(false);
        if (onEndCallback) onEndCallback();
      };
      
      setIsSpeakerActive(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeakerActive(false);
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
    if (!SpeechRecognition) {
      setSttErrorMessage("🎤 기기나 브라우저에서 목소리 입력기능을 지원하지 않습니다. 아래 빈칸을 누르시고 성함을 편히 적어주셔요!");
      return;
    }

    triggerVibe([100]);
    setSttErrorMessage(null); // Clear previous errors
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
      setSttErrorMessage(null);
      speak(`${cleanName} 어르신, 훈련 힘내세요!`);
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      // Determine error type and formulate senior-friendly guides
      const errorType = event.error || '';
      let msg = '';
      if (errorType === 'not-allowed') {
        msg = "🎤 마이크 사용 권한이 비활성화되어 있습니다. 아래 빈칸을 누르시고 성함을 편히 적어주셔요!";
      } else if (errorType === 'no-speech') {
        msg = "🎤 말씀해주신 소리가 작거나 잘 안 들렸습니다. 단추를 다시 누르시고 천천히 크게 말씀해 주셔요!";
      } else if (errorType === 'network') {
        msg = "🎤 브라우저 보안 또는 마이크 환경 설정 관계로 직접 입력을 권해 드려요. 아래 빈칸을 누르시고 성함을 편히 적어주셔요!";
      } else {
        msg = "🎤 현재 음성 입력 환경에 잠시 지연이 발생했습니다. 아래 빈칸을 누르시고 성함을 편히 적어주셔요!";
      }
      setSttErrorMessage(msg);
      speak(msg);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (err: any) {
      setIsListening(false);
      setSttErrorMessage("🎤 음성 인식을 준비하는 중에 문제가 있습니다. 아래 빈칸을 누르시고 성함을 편히 적어주셔요!");
    }
  };

  // --- Start 3-quiz practice with specified real-life cases ---
  const handleStartPractice = () => {
    triggerVibe([150]);
    stopSpeaking();
    
    // Select the 3 specific quizzes matching our real-world uploaded images in sequence
    // id 1: 택배 사기, id 6: 자녀사칭, id 3: 정부지원금
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
    setShowWrongNotes(false);
    
    setSelectedChoiceIndices([]);
    setLastSelectedChoice(null);
    setAnswered(false);
    setWrongFeedback(null);
    setCorrectFeedback(null);
    
    setStep('training');

    // Guide Voice
    setTimeout(() => {
      speak(`첫번째 문제입니다! ${selected[0].question}`);
    }, 220);
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
      speak("참 잘하셨어요! 완벽한 정답입니다!");
    } else {
      // Wrong option select
      setWasCorrectOnFirstTry(false);
      if (!selectedChoiceIndices.includes(choiceIndex)) {
        setSelectedChoiceIndices(prev => [...prev, choiceIndex]);
      }
      setWrongFeedback(currentQuiz.dangerExplanation);
      setLastSelectedChoice(choiceIndex);
      
      // Read alert details with voice automatically
      speak("잠깐만요! 방금 선택하신 방법은 위험합니다. 다시 해보시겠어요?");
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
        const nextQuiz = selectedQuizzes[nextIndex];
        if (nextIndex === 1) {
          speak(`두번째 문제입니다! ${nextQuiz.question}`);
        } else if (nextIndex === 2) {
          speak(`마지막 문제입니다! ${nextQuiz.question}`);
        }
      }, 220);
    } else {
      // Proceed to review table first as requested
      setStep('review');
      const finalMsg = '훈련 고생하셨습니다! 결과표를 확인해 보세요!';
      setTimeout(() => {
        speak(finalMsg);
      }, 200);
    }
  };

  const handleGoToCertificate = () => {
    stopSpeaking();
    triggerVibe([150]);
    setStep('certificate');
    const finalMsg = `영광스러운 수여식입니다. ${nickname || '자랑스러운'} 어르신! 모든 훈련을 통과하셨으므로, 금융안심 은빛 수료증을 수여합니다!`;
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
                  최근 나쁜 자들이 교묘하게 휴대폰으로 보낸 사기 문자 때문에 가슴 졸이셨죠?<br />
                  저희 <strong>"안심 시니어"</strong>에서 모의 훈련을 통해 안전하게 사기 문자 구별법을 배울 수 있습니다!
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
                    const sampleTexts = { normal: '보통 크기', large: '기본 크게', huge: '매우 크게' };
                    const detail = sampleTexts[sz];
                    const active = fontSize === sz;
                    return (
                      <button
                        key={sz}
                        onClick={() => {
                          triggerVibe([40]);
                          setFontSize(sz);
                          speak(`${sampleTexts[sz]}로 설정 하였습니다`);
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
                    placeholder="성함 또는 불리고 싶은 이름"
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

                {sttErrorMessage && (
                  <div className="bg-brand-red/15 border-4 border-brand-red p-4 rounded-xl text-center mt-1">
                    <p className={`${currentFont.smContent} text-brand-yellow font-black`}>
                      {sttErrorMessage}
                    </p>
                  </div>
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
                  <span>🛡️ 가상 스미싱 훈련 시작하기!</span>
                  <ChevronRight className="w-8 h-8 md:w-10 md:h-10 text-brand-black stroke-[3]" />
                </button>
                <p className={`${currentFont.small} mt-2`}>버튼이 아주 큽니다. 편하게 누르셔도 돼요!</p>
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
                        emoji = '⚡ 훈련 중';
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
                        ⚠️ 실제 사기꾼이 보낸 가짜 문자 화면
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
                      if (isSpeakerActive) {
                        stopSpeaking();
                      } else {
                        speak(cleanUrlsForSpeech(currentQuiz.smsContent));
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-850 px-5 py-4 border-2 border-white rounded-xl text-yellow-400 font-black cursor-pointer shadow-md transition transform hover:scale-101"
                    title="의심문자를 소리로 듣습니다"
                  >
                    {isSpeakerActive ? (
                      <Volume2 className="w-6 h-6 text-brand-red animate-pulse" />
                    ) : (
                      <Volume2 className="w-6 h-6 text-yellow-400 animate-bounce" />
                    )}
                    <span className={currentFont.smContent}>
                      {isSpeakerActive ? '⏹️ 소리 읽어주기 중지' : '🔈 이 문자내용 소리로 전부 듣기'}
                    </span>
                  </button>

                </div>

                {/* 2B. RIGHT: QUESTION & INSTRUCTIONS AREA */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                  
                  {/* Real Question Board */}
                  <div className="bg-[#111111] border-4 border-brand-white p-5 md:p-6 rounded-2xl text-left flex flex-col gap-4 shadow-xl" id="question_board_card">
                    
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`bg-brand-yellow text-brand-black font-black px-4 py-1.5 rounded-lg border border-brand-white ${currentFont.smContent}`}>
                        🚨 훈련 {quizIndex + 1}단계
                      </span>
                    </div>

                    <div className="border-b border-neutral-800 pb-3">
                      <h3 className={`${currentFont.desc} text-brand-white font-medium leading-relaxed`}>
                        <span className="text-brand-yellow font-black mt-2 block">"{currentQuiz.question}"</span>
                      </h3>
                    </div>

                    <div className="flex items-center gap-2.5 text-neutral-300 bg-black border border-neutral-800 p-3 rounded-lg font-semibold">
                      <Info className="w-5 h-5 text-brand-yellow shrink-0" />
                      <span className={currentFont.small}>아래 3가지 중 가장 현명하고 안전한 대처법 하나를 골라 주셔요.</span>
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


                          </div>

                          {/* Next controls inside overlay block */}
                          <div className="flex justify-center border-t border-neutral-800 pt-4 mt-2">
                            <button
                              id="btn_next_training"
                              onClick={handleNextStep}
                              className={`w-full ${currentFont.button} bg-brand-green hover:bg-[#00EE00] text-brand-black border-4 border-brand-white rounded-2xl font-black cursor-pointer flex items-center justify-center gap-3 shadow-2xl transition hover:scale-102`}
                            >
                              <span>{quizIndex < 2 ? '다음 단계 훈련으로 전진 ➡️' : '결과표 확인하기 🎓'}</span>
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


                          </div>

                          {/* Retry control button */}
                          <div className="flex justify-center border-t border-neutral-800 pt-4 mt-2">
                            <button
                              onClick={() => {
                                triggerVibe([80]);
                                setWrongFeedback(null);
                                speak("괜찮습니다! 다시 골라봅시다!");
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
                  안심 시니어 모의 훈련 예방 결과표
                </h2>
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
                        합격! 🏆
                      </span>
                    ) : (
                      <span className={`bg-brand-red text-brand-white px-4 py-1.5 rounded-lg font-black tracking-widest border border-brand-white ${currentFont.smContent}`}>
                        보완 필요 ⚠️
                      </span>
                    )}
                  </div>
                </div>

                {/* Score Status Message with Voice Friendly Speech Text */}
                <div className="p-4 text-center bg-black/40">
                  {score === 3 ? (
                    <p className={`${currentFont.desc} text-brand-green font-black`}>
                      💯 만점입니다! 파란 미끼와 가족 사기를 완벽히 막아내셨습니다!
                    </p>
                  ) : (
                    <p className={`${currentFont.desc} text-brand-yellow font-black`}>
                      ⚠️ 오답 부분을 확인하시고 만점 수료증에 다시 도전해보세요!
                    </p>
                  )}
                </div>
              </div>

              {/* Toggleable Incorrect review items */}
              <div className="flex flex-col gap-4">
                <button
                  onClick={() => {
                    triggerVibe([50]);
                    setShowWrongNotes(!showWrongNotes);
                  }}
                  className="w-full py-4 px-6 border-4 border-brand-white bg-neutral-900 text-brand-yellow font-black text-xl md:text-2xl rounded-2xl cursor-pointer hover:bg-neutral-850 transition flex items-center justify-center gap-3 shadow-lg"
                >
                  <span>{showWrongNotes ? '🕵️‍♂️ 오답 확인란 닫기 (접기)' : '🕵️‍♂️ 틀린 문제(오답) 확인하기'}</span>
                </button>

                {showWrongNotes && (
                  <div className="grid grid-cols-1 gap-4 mt-2">
                    {(() => {
                      const wrongItems = selectedQuizzes
                        .map((quiz, idx) => ({ quiz, idx, isCorrectOnFirstTry: firstTryArray[idx] }))
                        .filter(item => !item.isCorrectOnFirstTry);

                      if (wrongItems.length === 0) {
                        return (
                          <div className="bg-neutral-900 border-4 border-brand-green p-6 rounded-2xl text-center">
                            <p className={`${currentFont.desc} text-brand-green font-black`}>
                              🎉 틀린 문제가 없습니다! 모든 문제를 첫 도전에 한 번에 완벽히 격파하셨습니다!
                            </p>
                          </div>
                        );
                      }

                      return wrongItems.map(({ quiz, idx }) => (
                        <div 
                          key={quiz.id}
                          className="border-4 border-brand-red bg-brand-red/5 rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row gap-5 justify-between items-start md:items-center text-left shadow-md"
                        >
                          {/* Case Image and Details column */}
                          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            {quiz.realImageSrc ? (
                              <div className="w-24 h-24 rounded-xl bg-neutral-900 border border-neutral-800 p-1.5 flex justify-center items-center overflow-hidden shrink-0">
                                <img 
                                  src={quiz.realImageSrc} 
                                  alt={quiz.title} 
                                  className="w-full h-auto object-contain max-h-[80px]" 
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            ) : (
                              <div className="w-24 h-24 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                                <span className="text-4xl">📱</span>
                              </div>
                            )}

                            <div>
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="bg-brand-red text-brand-white font-black px-3 py-1 rounded text-sm">
                                  단계 {idx + 1} 틀림 ⚠️
                                </span>
                                <span className="text-neutral-500 font-bold text-xs">|</span>
                                <span className="text-brand-yellow font-black text-sm">
                                  [{quiz.type}]
                                </span>
                              </div>
                              <p className={`${currentFont.desc} text-brand-white font-black`}>
                                {quiz.title}
                              </p>
                              <p className={`${currentFont.smContent} text-neutral-300 mt-2 p-2 bg-black/40 rounded-lg border border-neutral-850 max-w-xl`}>
                                <strong className="text-neutral-400">의심문자 내용:</strong> {quiz.smsContent}
                              </p>
                            </div>
                          </div>

                          {/* Action remediation column */}
                          <div className="w-full md:w-auto shrink-0 border-t md:border-t-0 border-neutral-800 pt-4 md:pt-0">
                            <span className="text-brand-yellow font-black block mb-1 text-sm">🚨 안전 예방 요약:</span>
                            <p className={`${currentFont.smContent} text-brand-white font-bold leading-relaxed max-w-sm`}>
                              {quiz.coreRule}
                            </p>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
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
                      <span>🔄 다시 도전하기 !</span>
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

                <button
                  onClick={() => {
                    triggerVibe([40]);
                    stopSpeaking();
                    setStep('onboarding');
                  }}
                  className="mt-4 px-6 py-3 border border-dashed border-neutral-500 rounded-xl text-neutral-400 hover:text-white text-lg font-bold block mx-auto cursor-pointer w-full max-w-sm"
                >
                  ◀ 처음 화면(이름 설정)으로 돌아가기
                </button>
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
              className="flex flex-col gap-8 text-center animate-fadeIn"
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
                <div className="flex justify-center items-center gap-2 my-2 bg-neutral-900 border border-neutral-800 p-4 rounded-2xl">
                  <span className="text-2xl">⭐️⭐️⭐️</span>
                  <span className={`${currentFont.desc} text-brand-yellow font-black`}>스미싱 예방 완벽 100점 달성자</span>
                  <span className="text-2xl">⭐️⭐️⭐️</span>
                </div>

                <div className="my-6 text-center flex flex-col gap-4">
                  <p className={`${currentFont.desc} text-brand-white font-bold`}>
                    성 명 : <span className="text-brand-yellow font-black border-b-2 border-brand-yellow px-4">{nickname || " 어르신"}</span> 어르신
                  </p>
                  <p className={`${currentFont.smContent} text-neutral-300 leading-relaxed font-bold max-w-2xl mx-auto`}>
                    위 어르신은 교묘하고 나쁜 금융 사기꾼들의 수법에 맞서, 
                    모든 의심스런 상황을 명백히 간파하고 안전 대응법을 훌륭하게 완수하셨습니다.
                    이에 우리 가족과 은빛 안심 훈련소는 어르신의 훌륭한 예방 지혜를 높이 기리며 
                    이 "금융 안심 은빛 수료증"을 명예롭게 선사합니다.
                  </p>
                </div>

                {/* Core 3 Principles */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="border bg-neutral-900 border-neutral-800 p-4 rounded-xl flex flex-col gap-2">
                    <span className={`text-brand-green font-black ${currentFont.title}`}>1원칙</span>
                    <h5 className={`font-black text-brand-white ${currentFont.desc}`}>파란색 미끼 누르기 금지</h5>
                    <p className={`text-neutral-300 leading-relaxed font-bold ${currentFont.smContent}`}>
                      문자 속의 출처 불명 파란색 인터넷 주소(링크)는 악성 앱을 전송해 돈을 강제 이체하려는 사기입니다. 클릭하지 않는 것이 최고의 지혜입니다.
                    </p>
                  </div>

                  <div className="border bg-neutral-900 border-neutral-800 p-4 rounded-xl flex flex-col gap-2">
                    <span className={`text-brand-green font-black ${currentFont.title}`}>2원칙</span>
                    <h5 className={`font-black text-brand-white ${currentFont.desc}`}>자녀 사칭은 늘 유선 통화로</h5>
                    <p className={`text-neutral-300 leading-relaxed font-bold ${currentFont.smContent}`}>
                      "엄마, 아빠 폰 고장 나서 대리폰" 이라며 결제와 상품권 대리 구매를 요하면 꼭 무시하시고, <strong>기존의 저장 자녀 번호</strong>로 유선 통화하여 정교하게 대조해 보세요.
                    </p>
                  </div>

                  <div className="border bg-neutral-900 border-neutral-800 p-4 rounded-xl flex flex-col gap-2">
                    <span className={`text-brand-green font-black ${currentFont.title}`}>3원칙</span>
                    <h5 className={`font-black text-brand-white ${currentFont.desc}`}>민관 공식 대조 문의</h5>
                    <p className={`text-neutral-300 leading-relaxed font-bold ${currentFont.smContent}`}>
                      법원, 검찰, 세무서, 우체국, 구청은 절대로 전화를 하거나 개인 주소로 금융비밀번호를 입력을 유도하지 않습니다. 미심쩍을 땐 문자를 무시하고, <strong>정부기관 콜센터</strong>로 직접 확인해 보셔요.
                    </p>
                  </div>
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
