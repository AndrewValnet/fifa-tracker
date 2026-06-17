"use client";

import { useEffect, useMemo, useState } from "react";
import { TRIVIA_QUESTIONS, type TriviaQuestion } from "@/data/trivia-questions";
import { SectionHeader } from "@/components/SectionHeader";

export const dynamic = "force-dynamic";

// ─── Category badge colours ────────────────────────────────────────────────
const CATEGORY_LABEL: Record<TriviaQuestion["category"], string> = {
  history: "History",
  records: "Records",
  wc2026: "WC 2026",
  players: "Players",
};

const CATEGORY_COLOR: Record<TriviaQuestion["category"], string> = {
  history: "bg-gold/20 text-gold",
  records: "bg-live/20 text-live",
  wc2026: "bg-pitch/20 text-pitch",
  players: "bg-sky-400/20 text-sky-300",
};

const QUESTIONS_PER_ROUND = 5;
const STORAGE_KEY = "wc26-trivia-score";

// ─── Helpers ──────────────────────────────────────────────────────────────
function getDailyQuestions(): TriviaQuestion[] {
  const seed = Math.floor(Date.now() / 86400000);
  const shuffled = [...TRIVIA_QUESTIONS].sort((a, b) => {
    const ha = Math.sin(seed * 9301 + a.id * 49297 + 233720) * 49;
    const hb = Math.sin(seed * 9301 + b.id * 49297 + 233720) * 49;
    return ha - hb;
  });
  return shuffled.slice(0, QUESTIONS_PER_ROUND);
}

type AnswerState = "unanswered" | "correct" | "wrong";

interface RoundState {
  answers: (number | null)[]; // chosen option index per question
  states: AnswerState[];
  revealed: boolean[]; // whether fact is shown
}

function initRound(count: number): RoundState {
  return {
    answers: Array(count).fill(null),
    states: Array(count).fill("unanswered"),
    revealed: Array(count).fill(false),
  };
}

// ─── Client component ─────────────────────────────────────────────────────
function TriviaQuizClient() {
  const questions = useMemo(() => getDailyQuestions(), []);
  const [current, setCurrent] = useState(0);
  const [round, setRound] = useState<RoundState>(() => initRound(questions.length));
  const [finished, setFinished] = useState(false);

  const score = round.states.filter((s) => s === "correct").length;

  // Persist daily score
  useEffect(() => {
    if (!finished) return;
    try {
      const today = new Date().toISOString().slice(0, 10);
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      stored[today] = score;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch {
      // ignore storage errors
    }
  }, [finished, score]);

  function handleAnswer(optionIndex: number) {
    if (round.states[current] !== "unanswered") return;
    const q = questions[current];
    const isCorrect = optionIndex === q.correctIndex;
    setRound((prev) => {
      const next = { ...prev };
      next.answers = [...prev.answers];
      next.answers[current] = optionIndex;
      next.states = [...prev.states];
      next.states[current] = isCorrect ? "correct" : "wrong";
      next.revealed = [...prev.revealed];
      next.revealed[current] = true;
      return next;
    });
  }

  function handleNext() {
    if (current < questions.length - 1) {
      setCurrent((c) => c + 1);
    } else {
      setFinished(true);
    }
  }

  function handleRestart() {
    setCurrent(0);
    setRound(initRound(questions.length));
    setFinished(false);
  }

  if (finished) {
    return <ResultScreen score={score} total={questions.length} onRestart={handleRestart} />;
  }

  const q = questions[current];
  const state = round.states[current];
  const answered = state !== "unanswered";

  return (
    <div className="mx-auto max-w-2xl">
      {/* Progress */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex flex-1 gap-1.5">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < current
                  ? round.states[i] === "correct"
                    ? "bg-pitch"
                    : "bg-live"
                  : i === current
                  ? "bg-gold"
                  : "bg-edge"
              }`}
            />
          ))}
        </div>
        <span className="font-display text-sm text-dim">
          {current + 1} / {questions.length}
        </span>
      </div>

      {/* Question card */}
      <div className="rounded-2xl border border-edge bg-panel p-6 shadow-lg">
        <div className="mb-4 flex items-start justify-between gap-3">
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${CATEGORY_COLOR[q.category]}`}
          >
            {CATEGORY_LABEL[q.category]}
          </span>
          <span className="font-display text-sm font-semibold text-gold">
            {round.states.filter((s) => s === "correct").length} pts
          </span>
        </div>

        <p className="mb-6 font-display text-lg font-semibold leading-snug tracking-wide text-ink">
          {q.question}
        </p>

        {/* Options */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {q.options.map((option, i) => {
            let optClass =
              "w-full rounded-xl border border-edge bg-navy px-4 py-3 text-left font-body text-sm text-ink transition-all";

            if (answered) {
              if (i === q.correctIndex) {
                optClass += " border-pitch bg-pitch/10 text-pitch font-semibold";
              } else if (i === round.answers[current] && state === "wrong") {
                optClass += " border-live bg-live/10 text-live line-through";
              } else {
                optClass += " opacity-40";
              }
            } else {
              optClass +=
                " hover:border-pitch/60 hover:bg-pitch/5 active:scale-[0.98] cursor-pointer";
            }

            return (
              <button
                key={i}
                className={optClass}
                onClick={() => handleAnswer(i)}
                disabled={answered}
                aria-pressed={round.answers[current] === i}
              >
                <span className="mr-2 font-display font-bold text-dim">
                  {["A", "B", "C", "D"][i]}.
                </span>
                {option}
              </button>
            );
          })}
        </div>

        {/* Fact reveal */}
        {answered && (
          <div className="mt-5 rounded-xl border border-gold/30 bg-gold/5 px-4 py-3">
            <p className="mb-1 font-display text-xs font-semibold uppercase tracking-wider text-gold">
              {state === "correct" ? "Correct! +" : "Wrong — "}
              {state === "correct" ? "1 pt" : "0 pts"}
            </p>
            <p className="font-body text-sm leading-relaxed text-ink/80">{q.fact}</p>
          </div>
        )}

        {/* Next button */}
        {answered && (
          <button
            className="mt-5 w-full rounded-xl bg-pitch px-4 py-3 font-display font-semibold uppercase tracking-wider text-navy transition hover:brightness-110 active:scale-[0.98]"
            onClick={handleNext}
          >
            {current < questions.length - 1 ? "Next Question →" : "See Results"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Result screen ─────────────────────────────────────────────────────────
function ResultScreen({
  score,
  total,
  onRestart,
}: {
  score: number;
  total: number;
  onRestart: () => void;
}) {
  const pct = Math.round((score / total) * 100);
  const grade =
    score === total
      ? "Perfect score! ⚽"
      : score >= 4
      ? "Excellent!"
      : score >= 3
      ? "Good effort!"
      : score >= 2
      ? "Keep practicing!"
      : "Better luck tomorrow!";

  return (
    <div className="mx-auto max-w-md text-center">
      <div className="rounded-2xl border border-edge bg-panel p-8 shadow-lg">
        <div className="mb-4 font-display text-6xl font-black text-gold">
          {score}
          <span className="text-3xl text-dim">/{total}</span>
        </div>
        <div className="mb-2 font-display text-xl font-semibold uppercase tracking-wide text-ink">
          {grade}
        </div>
        <div className="mb-6 font-body text-sm text-dim">{pct}% correct · Daily quiz</div>

        {/* Score bar */}
        <div className="mb-6 h-3 w-full overflow-hidden rounded-full bg-navy">
          <div
            className="h-full rounded-full bg-pitch transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>

        <p className="mb-6 font-body text-sm text-dim">
          Come back tomorrow for a new set of questions. Your score has been saved locally.
        </p>

        <button
          onClick={onRestart}
          className="w-full rounded-xl border border-edge bg-navy px-4 py-3 font-display font-semibold uppercase tracking-wider text-ink transition hover:border-pitch/60 hover:text-pitch active:scale-[0.98]"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────
export default function TriviaPage() {
  return (
    <div className="mx-auto max-w-shell px-4 py-8">
      <h1 className="mb-1 font-display text-2xl font-black uppercase tracking-tight text-ink md:text-3xl">
        WC Trivia <span className="text-pitch">Quiz</span>
      </h1>
      <p className="mb-6 font-body text-sm text-dim">
        5 daily questions about World Cup history, records, and WC 2026 facts.
      </p>
      <SectionHeader title="Today's Quiz" right="Refreshes every 24 hours" />
      <TriviaQuizClient />
    </div>
  );
}
