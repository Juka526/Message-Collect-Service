import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import type { ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Message } from "../App";
import bgImage from "../../imports/image.webp";
import noteImage from "../../assets/images/paperclip-note-transparent.png";

const NOTE_ASPECT_RATIO = "736 / 1307";
const TEXT_AREA = {
  top: "34%",
  right: "15%",
  bottom: "12%",
  left: "21%",
};
const NOTE_HEIGHT_RATIO = 1307 / 736;
const CONTENT_PADDING = 320;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getNoteSize(message: string) {
  const length = message.trim().length;

  if (length < 20) {
    return { width: 250, fontSize: 21, lineHeight: 1.55 };
  }

  if (length < 80) {
    return { width: 315, fontSize: 19, lineHeight: 1.55 };
  }

  return { width: 390, fontSize: 17, lineHeight: 1.5 };
}

function getSpotlightNoteSize(message: string, availableWidth: number, availableHeight: number) {
  const length = message.trim().length;
  const width = Math.min(540, availableWidth);

  if (length < 20) {
    return {
      width: Math.min(390, availableWidth),
      height: Math.min(690, availableHeight),
      fontSize: 30,
      lineHeight: 1.55,
    };
  }

  if (length < 80) {
    return {
      width: Math.min(470, availableWidth),
      height: Math.min(835, availableHeight),
      fontSize: 27,
      lineHeight: 1.55,
    };
  }

  if (length < 180) {
    return {
      width,
      height: availableHeight,
      fontSize: 21,
      lineHeight: 1.45,
    };
  }

  return {
    width,
    height: availableHeight,
    fontSize: length > 260 ? 16 : 18,
    lineHeight: 1.42,
  };
}

function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

function getCardLayout(message: Message, index: number) {
  let hash = 0;
  const id = message.id;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0xffff;
  }
  const seed = hash + index * 137;
  const cols = 4;
  const col = index % cols;
  const row = Math.floor(index / cols);
  const baseX = col * 455 + 80;
  const baseY = row * 620 + 260;
  const jitterX = (seededRand(seed) - 0.5) * 140;
  const jitterY = (seededRand(seed + 7) - 0.5) * 100;
  const rotation = (seededRand(seed + 13) - 0.5) * 6;
  return {
    x: baseX + jitterX,
    y: baseY + jitterY,
    rotation,
    ...getNoteSize(message.message),
  };
}

interface Props {
  messages: Message[];
  loading: boolean;
  onVerifyAdmin: (password: string) => Promise<boolean>;
  onReset: (password: string) => Promise<boolean>;
  onDeleteMessage: (id: string, password: string) => Promise<boolean>;
  viewSwitcher: ReactNode;
}

export function DisplayPage({ messages, loading, onVerifyAdmin, onReset, onDeleteMessage, viewSwitcher }: Props) {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [spotlightMode, setSpotlightMode] = useState(false);
  const [spotlightIndex, setSpotlightIndex] = useState(0);

  // Admin panel state
  const [adminOpen, setAdminOpen] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [viewport, setViewport] = useState({
    width: typeof window === "undefined" ? 1024 : window.innerWidth,
    height: typeof window === "undefined" ? 768 : window.innerHeight,
  });

  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const hasDraggedRef = useRef(false);

  const layouts = useMemo(
    () => messages.map((msg, i) => ({
      ...getCardLayout(msg, i),
      message: msg,
    })),
    [messages],
  );

  const contentBounds = useMemo(() => {
    if (layouts.length === 0) {
      return {
        left: 0,
        top: 0,
        right: viewport.width,
        bottom: viewport.height,
      };
    }

    return layouts.reduce(
      (bounds, item) => {
        const height = item.width * NOTE_HEIGHT_RATIO;
        return {
          left: Math.min(bounds.left, item.x),
          top: Math.min(bounds.top, item.y),
          right: Math.max(bounds.right, item.x + item.width),
          bottom: Math.max(bounds.bottom, item.y + height),
        };
      },
      {
        left: Infinity,
        top: Infinity,
        right: -Infinity,
        bottom: -Infinity,
      },
    );
  }, [layouts, viewport.height, viewport.width]);

  const panBounds = useMemo(
    () => ({
      left: contentBounds.left - CONTENT_PADDING,
      top: contentBounds.top - CONTENT_PADDING,
      right: contentBounds.right + CONTENT_PADDING,
      bottom: contentBounds.bottom + CONTENT_PADDING,
    }),
    [contentBounds],
  );

  const canvasWidth = Math.max(2100, panBounds.right + CONTENT_PADDING);
  const canvasHeight = Math.max(1300, panBounds.bottom + CONTENT_PADDING);

  const constrainOffset = useCallback(
    (nextOffset: { x: number; y: number }, nextZoom = zoom) => {
      const scaledWidth = (panBounds.right - panBounds.left) * nextZoom;
      const scaledHeight = (panBounds.bottom - panBounds.top) * nextZoom;

      const centeredX =
        viewport.width / 2 - ((panBounds.left + panBounds.right) / 2) * nextZoom;
      const centeredY =
        viewport.height / 2 - ((panBounds.top + panBounds.bottom) / 2) * nextZoom;

      const x =
        scaledWidth <= viewport.width
          ? centeredX
          : clamp(
              nextOffset.x,
              viewport.width - panBounds.right * nextZoom,
              -panBounds.left * nextZoom,
            );
      const y =
        scaledHeight <= viewport.height
          ? centeredY
          : clamp(
              nextOffset.y,
              viewport.height - panBounds.bottom * nextZoom,
              -panBounds.top * nextZoom,
            );

      return { x, y };
    },
    [panBounds, viewport.height, viewport.width, zoom],
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) hasDraggedRef.current = true;
    setOffset(constrainOffset({ x: dragStartRef.current.ox + dx, y: dragStartRef.current.oy + dy }));
  }, [constrainOffset]);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        const rect = container.getBoundingClientRect();
        const pointer = {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };

        setZoom((currentZoom) => {
          const zoomFactor = Math.exp(-e.deltaY * 0.01);
          const nextZoom = clamp(currentZoom * zoomFactor, MIN_ZOOM, MAX_ZOOM);

          setOffset((currentOffset) => {
            const worldX = (pointer.x - currentOffset.x) / currentZoom;
            const worldY = (pointer.y - currentOffset.y) / currentZoom;
            return constrainOffset(
              {
                x: pointer.x - worldX * nextZoom,
                y: pointer.y - worldY * nextZoom,
              },
              nextZoom,
            );
          });

          return nextZoom;
        });
        return;
      }

      setOffset((prev) => constrainOffset({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    };

    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [constrainOffset]);

  useEffect(() => {
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setOffset((prev) => {
      const next = constrainOffset(prev, zoom);
      return next.x === prev.x && next.y === prev.y ? prev : next;
    });
  }, [constrainOffset, zoom]);

  const hasMessages = messages.length > 0;
  const currentSpotlightIndex = hasMessages
    ? ((spotlightIndex % messages.length) + messages.length) % messages.length
    : 0;
  const spotlightMessage = hasMessages ? messages[currentSpotlightIndex] : null;
  const spotlightAvailableWidth = Math.max(280, viewport.width - 48);
  const spotlightAvailableHeight = Math.max(320, viewport.height - 224);
  const spotlightSize = spotlightMessage
    ? getSpotlightNoteSize(
        spotlightMessage.message,
        spotlightAvailableWidth,
        spotlightAvailableHeight,
      )
    : null;

  useEffect(() => {
    if (!spotlightMode) return;
    if (!hasMessages) {
      setSpotlightIndex(0);
      return;
    }
    if (spotlightIndex !== currentSpotlightIndex) {
      setSpotlightIndex(currentSpotlightIndex);
    }
  }, [currentSpotlightIndex, hasMessages, spotlightIndex, spotlightMode]);

  const prevSpotlight = () => {
    if (!hasMessages) return;
    setSpotlightIndex((prev) => (prev - 1 + messages.length) % messages.length);
  };

  const nextSpotlight = () => {
    if (!hasMessages) return;
    setSpotlightIndex((prev) => (prev + 1) % messages.length);
  };

  const enterSpotlight = (index: number) => {
    setSpotlightIndex(index);
    setSpotlightMode(true);
  };

  const handleAdminLogin = async () => {
    if (!adminPassword.trim()) {
      setAdminError("비밀번호를 입력해주세요.");
      return;
    }

    const ok = await onVerifyAdmin(adminPassword);
    if (ok) {
      setAdminAuthed(true);
      setAdminOpen(false);
      setAdminError("");
    } else {
      setAdminError("비밀번호가 올바르지 않아요.");
    }
  };

  const handleReset = async () => {
    if (!window.confirm("전체 문자를 삭제하시겠습니까?")) return;
    setResetting(true);
    const ok = await onReset(adminPassword);
    setResetting(false);
    if (ok) {
      setResetDone(true);
      setTimeout(() => {
        setResetDone(false);
        setAdminOpen(false);
        setAdminAuthed(false);
        setAdminPassword("");
      }, 1800);
    } else {
      setAdminError("삭제에 실패했어요. 다시 시도해주세요.");
    }
  };

  const closeAdmin = () => {
    setAdminOpen(false);
    setAdminError("");
    setResetDone(false);
  };

  const logoutAdmin = () => {
    setAdminOpen(false);
    setAdminAuthed(false);
    setAdminPassword("");
    setAdminError("");
    setResetDone(false);
  };

  const handleDeleteMessage = async (id: string) => {
    if (!adminAuthed || deletingId) return;
    if (!window.confirm("이 문자를 삭제하시겠습니까?")) return;

    setDeletingId(id);
    const ok = await onDeleteMessage(id, adminPassword);
    setDeletingId(null);
    if (!ok) {
      setAdminError("문자 삭제에 실패했어요. 다시 시도해주세요.");
      setAdminOpen(true);
    }
  };

  return (
    <div
      className="relative w-full h-screen overflow-hidden select-none"
      style={{ fontFamily: "'Noto Sans KR', sans-serif" }}
    >
      {/* Background photo */}
      <img
        src={bgImage}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ filter: "grayscale(20%) brightness(0.45)" }}
      />
      {/* Warm dark overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(160deg, rgba(30,20,10,0.55) 0%, rgba(18,12,6,0.45) 50%, rgba(25,16,8,0.55) 100%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255, 238, 210, 0.14) 0.55px, transparent 0.55px)",
          backgroundSize: "5px 5px",
          opacity: 0.28,
          mixBlendMode: "screen",
        }}
      />

      {/* Top bar */}
      <div
        className="relative z-20 px-6 py-5"
        style={{
          background: "linear-gradient(to bottom, rgba(30, 23, 15, 0.85) 0%, transparent 100%)",
        }}
      >
        <div className="max-w-6xl mx-auto">
          <p
            className="text-xs tracking-widest mb-2 uppercase"
            style={{ color: "#D4956A", letterSpacing: "0.2em" }}
          >
            ✦ 밝음둥이
          </p>
          <h1 className="text-2xl font-semibold tracking-wide" style={{ color: "#F5E6D0" }}>
            하나님께 쓰는 문자
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#A0856A" }}>
            우리의 마음이 하나님께 모이고 있습니다.
          </p>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          {viewSwitcher}
          <span className="text-xs" style={{ color: "#A0856A" }}>
            {messages.length}개의 문자
          </span>
          {loading && (
            <span className="text-xs" style={{ color: "#A0856A" }}>불러오는 중…</span>
          )}
          <motion.button
            onClick={() => setSpotlightMode((v) => !v)}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="px-4 py-2 rounded-full text-sm transition-all duration-300"
            style={
              spotlightMode
                ? {
                    background: "transparent",
                    color: "#F4A261",
                    border: "1px solid rgba(244, 162, 97, 0.65)",
                  }
                : {
                    background: "transparent",
                    color: "#F5E6D0",
                    border: "1px solid rgba(255, 255, 255, 0.26)",
                  }
            }
          >
            ✦ 스포트라이트 모드
          </motion.button>
        </div>
        </div>
      </div>

      {/* Draggable canvas */}
      <div
        ref={containerRef}
        className="absolute inset-0"
        onMouseDown={handleMouseDown}
        style={{ cursor: "grab", touchAction: "none" }}
      >
        <div
          style={{
            position: "absolute",
            width: canvasWidth,
            height: canvasHeight,
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
            willChange: "transform",
          }}
        >
          {hasMessages ? (
            layouts.map((item, i) => (
              <motion.div
                key={item.message.id}
                initial={{ opacity: 0, scale: 0.7, rotate: item.rotation - 5 }}
                animate={{ opacity: 1, scale: 1, rotate: item.rotation }}
                transition={{
                  duration: 0.6,
                  delay: i < 12 ? i * 0.06 : 0,
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{
                  position: "absolute",
                  left: item.x,
                  top: item.y,
                  width: item.width,
                  aspectRatio: NOTE_ASPECT_RATIO,
                  backgroundImage: `url(${noteImage})`,
                  backgroundSize: "100% 100%",
                  backgroundRepeat: "no-repeat",
                  filter: "drop-shadow(0 8px 18px rgba(0,0,0,0.32))",
                  cursor: spotlightMode ? "pointer" : "inherit",
                }}
                onClick={() => {
                  if (!hasDraggedRef.current && spotlightMode) enterSpotlight(i);
                }}
                whileHover={spotlightMode ? { scale: 1.04, boxShadow: "0 8px 36px rgba(0,0,0,0.35)" } : {}}
              >
                {adminAuthed && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMessage(item.message.id);
                    }}
                    disabled={deletingId === item.message.id}
                    className="absolute z-10 flex items-center justify-center rounded-full transition-transform duration-150 hover:scale-105"
                    style={{
                      top: "21%",
                      right: "12%",
                      width: 28,
                      height: 28,
                      background: "rgba(28, 20, 14, 0.74)",
                      border: "1px solid rgba(255,255,255,0.18)",
                      color: "#FFE2DA",
                      fontSize: 19,
                      lineHeight: 1,
                      opacity: deletingId === item.message.id ? 0.55 : 1,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
                    }}
                    title="이 문자 삭제"
                  >
                    ×
                  </button>
                )}
                <div
                  style={{
                    position: "absolute",
                    top: "29%",
                    right: "19%",
                    maxWidth: "34%",
                    color: "#3C3328",
                    fontFamily: "'KyoboHandwriting2025', 'Noto Sans KR', sans-serif",
                    fontSize: 17,
                    fontWeight: 400,
                    lineHeight: 1.3,
                    pointerEvents: "none",
                    textAlign: "center",
                  }}
                >
                  {item.message.group}
                </div>
                <div
                  style={{
                    position: "absolute",
                    ...TEXT_AREA,
                    overflow: "hidden",
                    pointerEvents: "none",
                  }}
                >
                  <p
                    className="leading-relaxed"
                    style={{
                      color: "#3C3328",
                      lineHeight: item.lineHeight,
                      fontFamily: "'KyoboHandwriting2025', 'Noto Sans KR', sans-serif",
                      fontSize: item.fontSize,
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                      whiteSpace: "pre-wrap",
                      maxHeight: "100%",
                      overflow: "hidden",
                    }}
                  >
                    {item.message.message}
                  </p>
                </div>
              </motion.div>
            ))
          ) : (
            <>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: 120 + i * 280,
                    top: 200 + (i % 2 === 0 ? 0 : 40),
                    width: [250, 315, 390][i],
                    aspectRatio: NOTE_ASPECT_RATIO,
                    backgroundImage: `url(${noteImage})`,
                    backgroundSize: "100% 100%",
                    backgroundRepeat: "no-repeat",
                    opacity: 0.3,
                    transform: `rotate(${[-4, 2, -2][i]}deg)`,
                  }}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Empty state */}
      {!hasMessages && !loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
          <p className="text-2xl font-semibold mb-3" style={{ color: "#F5E6D0" }}>
            아직 도착한 문자가 없어요.
          </p>
          <p className="text-sm" style={{ color: "#A0856A" }}>
            QR코드로 접속해 하나님께 지금 마음을 남겨주세요.
          </p>
        </div>
      )}

      {/* Drag hint */}
      {hasMessages && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <motion.p
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="text-xs text-center"
            style={{ color: "#A0856A" }}
          >
            ↔ 드래그해서 함께 모인 문자들을 둘러보세요.
          </motion.p>
        </div>
      )}

      {/* Admin button — subtle, bottom-right */}
      <button
        onClick={() => setAdminOpen(true)}
        className="absolute bottom-5 right-5 z-20 w-8 h-8 flex items-center justify-center rounded-full transition-opacity duration-200 opacity-30 hover:opacity-70"
        style={{
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.15)",
          color: "#F5E6D0",
          fontSize: 14,
        }}
        title="관리자"
      >
        {adminAuthed ? "⚙" : "🔒"}
      </button>

      {/* Admin modal */}
      <AnimatePresence>
        {adminOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center"
            style={{ background: "rgba(10,7,4,0.75)", backdropFilter: "blur(8px)" }}
            onClick={(e) => { if (e.target === e.currentTarget) closeAdmin(); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="w-80 rounded-3xl p-8"
              style={{
                background: "#1C140E",
                border: "1px solid rgba(255,255,255,0.1)",
                boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
              }}
            >
              {resetDone ? (
                <div className="text-center py-4">
                  <div className="text-4xl mb-4">✅</div>
                  <p className="font-medium" style={{ color: "#F5E6D0" }}>
                    전체 메시지가 삭제되었어요.
                  </p>
                </div>
              ) : !adminAuthed ? (
                <>
                  <p className="text-base font-semibold mb-1" style={{ color: "#F5E6D0" }}>
                    관리자 접근
                  </p>
                  <p className="text-xs mb-5" style={{ color: "#A0856A" }}>
                    비밀번호를 입력해주세요.
                  </p>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => { setAdminPassword(e.target.value); setAdminError(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAdminLogin(); }}
                    placeholder="비밀번호"
                    autoFocus
                    className="w-full px-4 py-3 rounded-xl text-sm mb-3 focus:outline-none"
                    style={{
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "#F5E6D0",
                      fontFamily: "'Noto Sans KR', sans-serif",
                    }}
                  />
                  {adminError && (
                    <p className="text-xs mb-3" style={{ color: "#E07060" }}>{adminError}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={closeAdmin}
                      className="flex-1 py-2.5 rounded-xl text-sm"
                      style={{
                        background: "rgba(255,255,255,0.07)",
                        color: "#A0856A",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}
                    >
                      취소
                    </button>
                    <motion.button
                      onClick={handleAdminLogin}
                      whileTap={{ scale: 0.97 }}
                      className="flex-1 py-2.5 rounded-xl text-sm text-white"
                      style={{ background: "#F4A261" }}
                    >
                      확인
                    </motion.button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-base font-semibold mb-1" style={{ color: "#F5E6D0" }}>
                    관리자 메뉴
                  </p>
                  <p className="text-xs mb-6" style={{ color: "#A0856A" }}>
                    현재 전체 화면에 {messages.length}개의 문자가 있어요. 개별 문자는 종이 위 × 버튼으로 삭제할 수 있어요.
                  </p>
                  {adminError && (
                    <p className="text-xs mb-3" style={{ color: "#E07060" }}>{adminError}</p>
                  )}
                  <motion.button
                    onClick={handleReset}
                    disabled={resetting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-3 rounded-xl text-sm font-medium mb-3"
                    style={{
                      background: resetting ? "rgba(255,255,255,0.08)" : "rgba(220,60,60,0.2)",
                      border: "1px solid rgba(220,60,60,0.35)",
                      color: resetting ? "#A0856A" : "#FF8A80",
                    }}
                  >
                    {resetting ? "삭제 중…" : "🗑 전체 메시지 삭제"}
                  </motion.button>
                  <button
                    onClick={closeAdmin}
                    className="w-full py-2.5 rounded-xl text-sm"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      color: "#A0856A",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    닫기
                  </button>
                  <button
                    onClick={logoutAdmin}
                    className="w-full py-2.5 rounded-xl text-sm mt-2"
                    style={{
                      background: "transparent",
                      color: "#7E6652",
                    }}
                  >
                    관리자 모드 종료
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spotlight overlay */}
      <AnimatePresence>
        {spotlightMode && (
          <motion.div
            key="spotlight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="absolute inset-0 z-30 flex items-center justify-center"
            style={{ background: "rgba(20, 14, 8, 0.88)", backdropFilter: "blur(6px)" }}
          >
            <motion.button
              onClick={() => setSpotlightMode(false)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="absolute top-5 right-5 px-5 py-2.5 rounded-full text-sm"
              style={{
                background: "rgba(255, 255, 255, 0.12)",
                color: "#F5E6D0",
                border: "1px solid rgba(255, 255, 255, 0.22)",
                fontFamily: "'Noto Sans KR', sans-serif",
              }}
            >
              전체 보기로 돌아가기
            </motion.button>

            <div
              className="absolute left-0 right-0 overflow-visible px-6"
              style={{
                top: 72,
                bottom: 132,
              }}
            >
              <div className="h-full flex items-center justify-center">
                {spotlightMessage && spotlightSize ? (
                  <motion.div
                    key={spotlightMessage.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      position: "relative",
                      width: spotlightSize.width,
                      height: spotlightSize.height,
                      backgroundImage: `url(${noteImage})`,
                      backgroundSize: "100% 100%",
                      backgroundRepeat: "no-repeat",
                      filter: "drop-shadow(0 20px 44px rgba(0,0,0,0.52))",
                    }}
                  >
                      <div
                        style={{
                          position: "absolute",
                          top: "29%",
                          right: "19%",
                          maxWidth: "34%",
                          color: "#3C3328",
                          fontFamily: "'KyoboHandwriting2025', 'Noto Sans KR', sans-serif",
                          fontSize: 21,
                          fontWeight: 400,
                          lineHeight: 1.3,
                          textAlign: "center",
                        }}
                      >
                        {spotlightMessage.group}
                      </div>
                      <div
                        style={{
                          position: "absolute",
                          ...TEXT_AREA,
                          overflowY: "auto",
                          overflowX: "hidden",
                          WebkitOverflowScrolling: "touch",
                        }}
                      >
                        <p
                          className="leading-relaxed"
                          style={{
                            color: "#3C3328",
                            lineHeight: spotlightSize.lineHeight,
                            fontWeight: 400,
                            fontFamily: "'KyoboHandwriting2025', 'Noto Sans KR', sans-serif",
                            fontSize: spotlightSize.fontSize,
                            wordBreak: "break-word",
                            overflowWrap: "anywhere",
                            whiteSpace: "pre-wrap",
                            overflow: "visible",
                          }}
                        >
                          {spotlightMessage.message}
                        </p>
                      </div>
                  </motion.div>
                ) : (
                  <div className="text-center px-8 self-center" style={{ color: "#F5E6D0" }}>
                    <p className="text-xl font-semibold mb-2">표시할 문자를 찾을 수 없어요.</p>
                    <p className="text-sm" style={{ color: "#A0856A" }}>
                      전체 보기로 돌아가 다시 시도해주세요.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3">
              <motion.button
                onClick={prevSpotlight}
                disabled={!hasMessages}
                whileHover={hasMessages ? { scale: 1.04 } : {}}
                whileTap={hasMessages ? { scale: 0.96 } : {}}
                className="px-5 py-3 rounded-full text-sm"
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#F5E6D0",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  opacity: hasMessages ? 1 : 0.45,
                  fontFamily: "'Noto Sans KR', sans-serif",
                }}
              >
                ← 이전 문자
              </motion.button>
              <motion.button
                onClick={nextSpotlight}
                disabled={!hasMessages}
                whileHover={hasMessages ? { scale: 1.04 } : {}}
                whileTap={hasMessages ? { scale: 0.96 } : {}}
                className="px-5 py-3 rounded-full text-sm"
                style={{
                  background: "#F4A261",
                  color: "#fff",
                  boxShadow: "0 4px 20px rgba(231, 111, 81, 0.4)",
                  opacity: hasMessages ? 1 : 0.45,
                  fontFamily: "'Noto Sans KR', sans-serif",
                }}
              >
                다음 문자 →
              </motion.button>
            </div>

            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 flex gap-1.5">
              {messages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSpotlightIndex(i)}
                  className="w-2 h-2 rounded-full transition-all duration-200"
                  style={{
                    background: i === currentSpotlightIndex ? "#F4A261" : "rgba(255,255,255,0.2)",
                    transform: i === currentSpotlightIndex ? "scale(1.4)" : "scale(1)",
                  }}
                  aria-label={`${i + 1}번째 문자 보기`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
