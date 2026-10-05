"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LoginForm } from "@/components/login-form";

const storySteps = [
  {
    eyebrow: "문득문득 ver.3",
    title: "질문으로 얻고,\n문장으로 깨닫다",
    copy: "스크롤하며 문장 속 질문을 한 장씩 만나 보세요.",
    visualLabel: "질문이 숨어 있는 문법책"
  },
  {
    eyebrow: "01 · 발견",
    title: "먼저,\n발견합니다",
    copy: "정답보다 먼저 문장에 보이는 단서를 찾습니다.",
    visualLabel: "문장을 비추는 관찰 돋보기"
  },
  {
    eyebrow: "02 · 탐구",
    title: "표시하며\n구조를 봅니다",
    copy: "주어·서술어와 절의 경계를 직접 표시합니다.",
    visualLabel: "이어지고 확장되는 문장 조각"
  },
  {
    eyebrow: "03 · 설명",
    title: "내 말로\n설명합니다",
    copy: "질문과 단서를 따라 마지막 문장은 내가 완성합니다.",
    visualLabel: "생각을 문장으로 옮기는 연필"
  },
  {
    eyebrow: "04 · 시작",
    title: "오늘의 문법책에\n내 문장을 남겨 보세요.",
    copy: "학교 계정으로 로그인하면 학습 기록이 이어집니다.",
    visualLabel: "나의 학습 기록이 쌓이는 책장"
  }
] as const;

function StageIllustration({ step }: { step: number }) {
  if (step === 0) {
    return <svg className="v3-stage-svg" viewBox="0 0 640 520"><path className="fill-paper" d="M142 86h330c30 0 54 24 54 54v292H196c-30 0-54-24-54-54z"/><path className="fill-green" d="M112 64h330c30 0 54 24 54 54v292H166c-30 0-54-24-54-54z"/><path className="stroke-light" d="M160 119h286M160 156h214M160 313h270"/><circle className="fill-lime" cx="374" cy="238" r="58"/><path className="stroke-ink" d="M356 219c0-22 37-29 42-6 6 27-25 28-25 50M374 286v2"/><path className="fill-orange" d="M414 410h60v78l-30-20-30 20z"/><text className="hangul-art light-text" x="220" y="244">문장</text></svg>;
  }
  if (step === 1) {
    return <svg className="v3-stage-svg" viewBox="0 0 640 520"><rect className="fill-paper" x="78" y="94" width="402" height="294" rx="30"/><path className="stroke-soft" d="M128 157h244M128 211h300M128 265h202M128 319h278"/><circle className="fill-lime-soft" cx="385" cy="226" r="91"/><circle className="stroke-green" cx="385" cy="226" r="68"/><path className="stroke-green-heavy" d="m434 277 83 83"/><path className="fill-orange" d="M162 142h126v25H162zM231 250h129v25H231z"/><circle className="fill-green" cx="518" cy="104" r="18"/><text className="hangul-art" x="385" y="226">말</text></svg>;
  }
  if (step === 2) {
    return <svg className="v3-stage-svg" viewBox="0 0 640 520"><path className="stroke-green" d="M126 258h388"/><rect className="fill-orange-soft" x="86" y="132" width="168" height="96" rx="22"/><rect className="fill-lime-soft" x="280" y="132" width="168" height="96" rx="22"/><rect className="fill-paper" x="182" y="290" width="168" height="96" rx="22"/><rect className="fill-green" x="376" y="290" width="168" height="96" rx="22"/><path className="stroke-green" d="M170 228v30h194v-30M266 258v32M460 258v32"/><text x="170" y="192">주어</text><text x="364" y="192">서술어</text><text x="266" y="350">절</text><text className="light-text" x="460" y="350">문장</text></svg>;
  }
  if (step === 3) {
    return <svg className="v3-stage-svg" viewBox="0 0 640 520"><path className="fill-paper" d="M106 88h392v328H106z"/><path className="stroke-soft" d="M158 158h274M158 212h231M158 266h286M158 320h186"/><path className="fill-orange" d="m170 340 226-226 58 58-226 226-82 23z"/><path className="fill-lime" d="m396 114 28-28 58 58-28 28z"/><path className="stroke-ink" d="m146 421 82-23"/><circle className="fill-green" cx="500" cy="382" r="50"/><path className="stroke-light" d="M478 382h44M500 360v44"/></svg>;
  }
  return <svg className="v3-stage-svg" viewBox="0 0 640 520"><path className="fill-green" d="M94 116c0-24 20-44 44-44h154c24 0 44 20 44 44v296H138c-24 0-44-20-44-44z"/><path className="fill-paper" d="M304 116c0-24 20-44 44-44h154c24 0 44 20 44 44v252c0 24-20 44-44 44H304z"/><path className="stroke-soft" d="M350 150h132M350 204h132M350 258h98"/><path className="stroke-light" d="M140 146h150M140 202h112M140 258h150"/><circle className="fill-lime" cx="426" cy="342" r="38"/><path className="stroke-ink" d="m408 342 13 13 25-29"/><path className="fill-orange" d="M226 72h52v84l-26-18-26 18z"/></svg>;
}

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function BookJourney() {
  const journeyRef = useRef<HTMLElement>(null);
  const [storyStep, setStoryStep] = useState(0);
  const [turnDirection, setTurnDirection] = useState<"forward" | "backward">("forward");
  const lastStepRef = useRef(0);

  useEffect(() => {
    const journey = journeyRef.current;
    if (!journey) return;
    let animationFrame = 0;

    function updateJourney() {
      animationFrame = 0;
      if (!journey) return;
      const rect = journey.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      const progress = clamp(-rect.top / travel);
      // 표지가 90도를 넘어 시야에서 사라지는 즉시 첫 학습 장면을 보여 주어
      // 천천히 스크롤해도 겹침이나 빈 장이 생기지 않게 한다.
      const open = clamp(progress / 0.14);
      const explore = clamp((progress - 0.36) / 0.34);
      const write = clamp((progress - 0.62) / 0.2);
      const finish = clamp((progress - 0.84) / 0.13);

      journey.style.setProperty("--journey-progress", progress.toFixed(4));
      journey.style.setProperty("--book-open", open.toFixed(4));
      journey.style.setProperty("--book-explore", explore.toFixed(4));
      journey.style.setProperty("--page-write", write.toFixed(4));
      journey.style.setProperty("--journey-finish", finish.toFixed(4));

      const nextStep = progress < 0.074 ? 0 : progress < 0.38 ? 1 : progress < 0.63 ? 2 : progress < 0.84 ? 3 : 4;
      if (nextStep !== lastStepRef.current) {
        setTurnDirection(nextStep > lastStepRef.current ? "forward" : "backward");
        lastStepRef.current = nextStep;
        setStoryStep(nextStep);
      }
    }

    function requestUpdate() {
      if (animationFrame) return;
      animationFrame = window.requestAnimationFrame(updateJourney);
    }

    updateJourney();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <section className={`v3-home v3-book-journey story-step-${storyStep} scroll-${turnDirection}`} ref={journeyRef} aria-labelledby="home-title">
      <div className="v3-book-stage">
        <header className="v3-journey-header">
          <Link aria-label="문득문득 처음으로" className="v3-wordmark" href="/"><i aria-hidden="true">문</i><strong>문득문득</strong></Link>
          <span>질문으로 펼치는 문법책 <b>ver.3</b></span>
        </header>

        <div className="v3-atmosphere" aria-hidden="true"><i /><i /><i /></div>

        <div className="v3-story-copy" aria-live="polite">
          {storySteps.map((step, index) => (
            <article aria-hidden={storyStep !== index} className={`v3-story-panel panel-${index}`} key={step.eyebrow}>
              <span>{step.eyebrow}</span>
              <h1 id={index === 0 ? "home-title" : undefined}>{step.title.split("\n").map((line) => <span key={line}>{line}</span>)}</h1>
              <p>{step.copy}</p>
              {index === 4 && (
                <div className="v3-inline-login">
                  <span>학교 계정으로 학습 이어가기</span>
                  <LoginForm />
                  <Link className="v3-privacy-link" href="/privacy">개인정보 안내</Link>
                </div>
              )}
            </article>
          ))}
        </div>

        <div className="v3-visual-stack" aria-hidden="true">
          {storySteps.map((step, index) => (
            <figure className={storyStep === index ? "active" : ""} key={step.visualLabel}>
              <StageIllustration step={index} />
              <figcaption>{step.visualLabel}</figcaption>
            </figure>
          ))}
        </div>

        <div className="v3-book-viewport" aria-hidden="true">
          <div className="v3-book">
            <div className="v3-page-spread">
              <section className="v3-page v3-page-left" />
              <div className="v3-book-gutter" />
              <section className="v3-page v3-page-right" />
            </div>

          </div>
        </div>

        <div className="v3-book-cover" aria-hidden="true">
          <div className="v3-cover-grain" />
          <div className="v3-cover-visual"><StageIllustration step={0} /></div>
          <div className="v3-cover-title"><i>문</i><h2>문득문득</h2><p>질문으로 얻고,<br />문장으로 깨닫다</p></div>
          <div className="v3-cover-rule" />
          <span className="v3-cover-foot">나의 문장을 발견하는 문법 학습</span>
        </div>

        {storyStep > 1 && (
          <div className={`v3-scroll-page-turn ${turnDirection}`} key={`${storyStep}-${turnDirection}`} aria-hidden="true">
            <div className="v3-scroll-sheet-face v3-scroll-sheet-front"><i /><span>문득문득</span></div>
            <div className="v3-scroll-sheet-face v3-scroll-sheet-back"><i /><span>문득문득</span></div>
          </div>
        )}

        <nav className="v3-progress" aria-label="책 속으로 들어가는 과정">
          {storySteps.map((step, index) => <span className={storyStep === index ? "active" : storyStep > index ? "passed" : ""} key={step.eyebrow}><i />{index + 1}</span>)}
        </nav>

        <div className="v3-scroll-cue" aria-hidden="true"><span>책 속으로 스크롤</span><i /></div>
        <p className="v3-safety-note">AI는 답을 대신 쓰지 않고, 스스로 발견하도록 질문합니다.</p>

        <div className="v3-reduced-summary">
          <span>문득문득 ver.3</span>
          <h1>질문으로 얻고,<br />문장으로 깨닫다</h1>
          <p>문득문득은 답을 대신 써주지 않습니다. 단계별 질문으로 생각의 문을 열고, 스스로 올바른 문장을 쓰도록 돕습니다.</p>
          <div className="v3-inline-login">
            <span>학교 계정으로 학습 이어가기</span>
            <LoginForm />
          </div>
        </div>
      </div>
    </section>
  );
}
