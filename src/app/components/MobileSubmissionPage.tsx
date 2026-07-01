import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";

const GROUPS = ["1조", "2조", "3조", "4조", "5조", "6조"];
const MAX_LENGTH = 300;
const INTRO_SESSION_KEY = "letters-to-god-write-intro-seen";

const SENTENCE_STARTERS = [
  "하나님, 제가 요즘…",
  "하나님, 오늘 나눔을 통해…",
  "하나님, 제가 다시 붙잡고 싶은 것은…",
  "하나님, 제가 내려놓고 싶은 것은…",
];

function getStarterText(starter: string) {
  return starter.replace(/…$/, "");
}

interface Props {
  onSubmit: (group: string, message: string) => Promise<void>;
  viewSwitcher: ReactNode;
}

export function MobileSubmissionPage({ onSubmit, viewSwitcher }: Props) {
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem(INTRO_SESSION_KEY) !== "true";
  });
  const [selectedGroup, setSelectedGroup] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedGroup) {
      setError("조를 선택해주세요.");
      return;
    }
    if (!message.trim()) {
      setError("메시지를 입력해주세요.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(selectedGroup, message.trim());
      setSubmitted(true);
      setError("");
    } catch {
      setError("문자 저장에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSelectedGroup("");
    setMessage("");
    setSubmitted(false);
    setError("");
  };

  useEffect(() => {
    if (!showIntro || typeof window === "undefined") return;

    window.sessionStorage.setItem(INTRO_SESSION_KEY, "true");
    const timer = window.setTimeout(() => {
      setShowIntro(false);
    }, 6200);

    return () => window.clearTimeout(timer);
  }, [showIntro]);

  return (
    <div
      className="min-h-screen relative"
      style={{
        background:
          "radial-gradient(circle at 50% 0%, rgba(244, 162, 97, 0.14), transparent 34%), linear-gradient(160deg, #fdf9f3 0%, #fef6ec 40%, #fdf2f6 100%)",
        fontFamily: "'Noto Sans KR', sans-serif",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(74, 46, 26, 0.08) 0.55px, transparent 0.55px)",
          backgroundSize: "5px 5px",
          opacity: 0.28,
          mixBlendMode: "multiply",
        }}
      />
      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="min-h-screen flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, duration: 0.6, type: "spring", stiffness: 200 }}
              className="text-6xl mb-6"
            >
              ✉️
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-xl font-semibold mb-3"
              style={{ color: "#7B4F2E" }}
            >
              하나님께 보내는 문자가 전달되었어요.
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.5 }}
              className="text-sm leading-relaxed mb-10"
              style={{ color: "#A07858" }}
            >
              함께 모인 고백을 통해<br />
              하나님이 우리 가운데 일하시길 기대해요.
            </motion.p>
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              onClick={handleReset}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-3.5 rounded-2xl text-white shadow-md"
              style={{ background: "linear-gradient(135deg, #F4A261, #E76F51)" }}
            >
              하나 더 보내기
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col min-h-screen"
          >
            {/* Header */}
            <div className="pt-5 pb-5 px-6">
              <div className="max-w-6xl mx-auto">
                <p
                  className="text-xs tracking-widest mb-2 uppercase"
                  style={{ color: "#D4956A", letterSpacing: "0.2em" }}
                >
                  ✦ 밝음둥이
                </p>
                <h1
                  className="text-2xl font-semibold mb-2"
                  style={{ color: "#4A2E1A" }}
                >
                  하나님께 쓰는 문자
                </h1>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "#8C6A4E" }}
                >
                    완벽한 문장이 아니어도 괜찮아요.<br />
                    나의 마음 그대로, 하나님께.
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {viewSwitcher}
                </div>
              </div>
            </div>

            {/* Form area */}
            <div className="flex-1 px-6 pb-72 overflow-y-auto">
              <div className="max-w-6xl mx-auto">
              {/* Group selector */}
              <div
                className="rounded-3xl p-5 mb-4"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255, 252, 246, 0.9), rgba(255, 247, 238, 0.78))",
                  backgroundImage:
                    "radial-gradient(rgba(90, 70, 45, 0.08) 0.55px, transparent 0.55px)",
                  backgroundSize: "5px 5px",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(244, 162, 97, 0.2)",
                  boxShadow: "0 10px 28px rgba(93, 58, 30, 0.08), 0 1px 2px rgba(93, 58, 30, 0.06)",
                }}
              >
                <p
                  className="text-xs mb-3 font-medium tracking-wide"
                  style={{ color: "#C47B4A" }}
                >
                  조 선택
                </p>
                <div className="flex flex-wrap gap-2">
                  {GROUPS.map((group) => (
                    <motion.button
                      key={group}
                      onClick={() => {
                        setSelectedGroup(group);
                        setError("");
                      }}
                      whileTap={{ scale: 0.93 }}
                      className="px-3.5 py-1.5 rounded-full text-sm transition-all duration-200"
                      style={
                        selectedGroup === group
                          ? {
                              background: "#F4A261",
                              color: "#fff",
                              boxShadow: "0 2px 8px rgba(231, 111, 81, 0.35)",
                            }
                          : {
                              background: "#FFF8F3",
                              color: "#A07858",
                              border: "1px solid #F0D5C0",
                            }
                      }
                    >
                      {group}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Message input */}
              <div
                className="rounded-3xl p-5 mb-3"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(255, 252, 246, 0.94), rgba(255, 247, 238, 0.84))",
                  backgroundImage:
                    "radial-gradient(rgba(90, 70, 45, 0.08) 0.55px, transparent 0.55px)",
                  backgroundSize: "5px 5px",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(244, 162, 97, 0.2)",
                  boxShadow: "0 12px 32px rgba(93, 58, 30, 0.1), 0 1px 2px rgba(93, 58, 30, 0.07)",
                }}
              >
                <div className="relative">
                  <textarea
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value.slice(0, MAX_LENGTH));
                      setError("");
                    }}
                    placeholder="하나님, 지금 제 마음은요…"
                    rows={5}
                    className="w-full resize-none rounded-2xl px-4 py-3.5 text-sm leading-relaxed focus:outline-none"
                    style={{
                      background: "#FFF9F5",
                      border: "1px solid rgba(244, 162, 97, 0.25)",
                      color: "#4A2E1A",
                      caretColor: "#E76F51",
                      fontFamily: "'KyoboHandwriting2025', 'Noto Sans KR', sans-serif",
                      fontSize: 18,
                    }}
                  />
                  <span
                    className="absolute bottom-3 right-4 text-xs"
                    style={{
                      color: message.length >= MAX_LENGTH ? "#E76F51" : "#C8A88A",
                    }}
                  >
                    {message.length} / {MAX_LENGTH}
                  </span>
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-sm px-2 mb-3"
                    style={{ color: "#E07060" }}
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Writing helpers */}
              <div className="mt-6 mb-2">
                {/* Sentence starters */}
                <div
                  className="rounded-2xl p-4 mb-5"
                  style={{
                    background: "rgba(255, 252, 246, 0.56)",
                    border: "1px solid rgba(244, 162, 97, 0.15)",
                    boxShadow: "0 8px 18px rgba(93, 58, 30, 0.05)",
                  }}
                >
                  <p className="text-xs mb-3" style={{ color: "#C8A88A" }}>
                    이런 문장으로 시작해보세요
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {SENTENCE_STARTERS.map((starter, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.08 * i + 0.15, duration: 0.35 }}
                        onClick={() => {
                          setMessage(getStarterText(starter));
                          setError("");
                        }}
                        className="text-left text-sm py-1.5 px-2 rounded-lg cursor-pointer transition-colors duration-150"
                        style={{ color: "#A07858" }}
                        whileHover={{
                          x: 3,
                          backgroundColor: "rgba(244, 162, 97, 0.08)",
                        }}
                      >
                        <span style={{ color: "#D4956A", marginRight: 6 }}>→</span>
                        {starter}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            </div>

            {/* Fixed bottom submit area */}
            <div
              className="fixed bottom-0 left-0 right-0 px-6 pb-10 pt-6 z-20"
              style={{
                background:
                  "linear-gradient(to top, rgba(253,249,243,0.96) 60%, transparent)",
              }}
            >
              <div className="max-w-6xl mx-auto">
              <motion.button
                onClick={handleSubmit}
                disabled={submitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="w-full py-4 rounded-2xl text-white shadow-lg"
                style={{
                  background: "linear-gradient(135deg, #F4A261 0%, #E76F51 100%)",
                  boxShadow: "0 4px 20px rgba(231, 111, 81, 0.3)",
                  fontFamily: "'Noto Sans KR', sans-serif",
                  opacity: submitting ? 0.7 : 1,
                }}
              >
                {submitting ? "보내는 중..." : "문자 보내기 ✉️"}
              </motion.button>
              <p
                className="text-xs text-center mt-3 leading-relaxed px-4"
                style={{ color: "#C8A88A" }}
              >
                작성한 문자는 익명으로 전체 화면에 표시될 수 있습니다.<br />
                너무 개인적이거나 민감한 내용, 다른 사람의 이름은 적지 말아주세요.
              </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showIntro && (
          <motion.div
            key="write-intro"
            className="fixed inset-0 z-[100] flex items-center justify-center px-7 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            style={{
              background:
                "radial-gradient(circle at 30% 28%, rgba(255, 244, 226, 0.94) 0%, rgba(255, 236, 207, 0.74) 26%, transparent 55%), radial-gradient(circle at 72% 58%, rgba(244, 162, 97, 0.3) 0%, rgba(244, 162, 97, 0.14) 28%, transparent 58%), linear-gradient(160deg, rgba(253,249,243,0.96), rgba(255,246,234,0.94))",
              backdropFilter: "blur(10px)",
              pointerEvents: "auto",
            }}
            onAnimationComplete={(definition) => {
              if (definition === "exit") setShowIntro(false);
            }}
          >
            <motion.div
              aria-hidden="true"
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              style={{
                background:
                  "radial-gradient(ellipse at 50% 42%, rgba(255,255,255,0.66), transparent 42%), radial-gradient(ellipse at 42% 52%, rgba(255, 226, 190, 0.5), transparent 48%)",
                filter: "blur(18px)",
              }}
            />
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: [0, 1, 1, 0], y: [12, 0, 0, -8] }}
              transition={{
                delay: 0.35,
                duration: 5.15,
                times: [0, 0.14, 0.86, 1],
                ease: "easeInOut",
              }}
              onAnimationComplete={() => setShowIntro(false)}
              className="relative max-w-3xl text-2xl sm:text-3xl leading-relaxed"
              style={{
                color: "#5A3922",
                fontFamily: "'KyoboHandwriting2025', 'Noto Sans KR', sans-serif",
                textShadow: "0 1px 12px rgba(255,255,255,0.72)",
              }}
            >
              오늘 나눔을 통해 하나님께 드리고 싶은 마음을 문자로 남겨주세요.<br />
              오늘 마음에 남은 질문이든, 다시 붙잡고 싶은 마음이든, 내려놓고 싶은 부담이나 두려움이든,
              복음 안에서 기억하고 싶은 정체성이든 — 떠오르는 대로 편하게 적어주세요.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
