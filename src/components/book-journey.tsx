"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LoginForm } from "@/components/login-form";

const storySteps = [
  {
    eyebrow: "표지에서 시작하는 질문",
    title: "질문으로 얻고,\n문장으로 깨닫다",
    copy: "문득문득은 답을 대신 써주지 않습니다. 천천히 스크롤하며 문장 속으로 들어가 보세요."
  },
  {
    eyebrow: "01 · 질문",
    title: "질문이\n표지를 엽니다",
    copy: "정답을 보기 전에, 문장에서 먼저 발견한 것을 말해 봅니다."
  },
  {
    eyebrow: "02 · 탐구",
    title: "문장의 결을 따라\n책 속으로 들어갑니다",
    copy: "주어와 서술어, 절의 경계와 표현의 효과를 직접 표시하며 살펴봅니다."
  },
  {
    eyebrow: "03 · 나의 문장",
    title: "표시하고, 설명하고,\n다시 씁니다",
    copy: "AI는 한 단계씩 단서를 건네고, 마지막 문장은 학생이 완성합니다."
  },
  {
    eyebrow: "문득문득 ver.3",
    title: "이제, 나의 문장을\n펼칠 차례입니다",
    copy: "매일 한 장씩 넘기며 문법을 발견하고 내 문장을 남겨 보세요."
  }
] as const;

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function BookJourney() {
  const journeyRef = useRef<HTMLElement>(null);
  const [storyStep, setStoryStep] = useState(0);

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
      const open = clamp((progress - 0.11) / 0.25);
      const explore = clamp((progress - 0.36) / 0.34);
      const write = clamp((progress - 0.62) / 0.2);
      const finish = clamp((progress - 0.84) / 0.13);

      journey.style.setProperty("--journey-progress", progress.toFixed(4));
      journey.style.setProperty("--book-open", open.toFixed(4));
      journey.style.setProperty("--book-explore", explore.toFixed(4));
      journey.style.setProperty("--page-write", write.toFixed(4));
      journey.style.setProperty("--journey-finish", finish.toFixed(4));

      const nextStep = progress < 0.17 ? 0 : progress < 0.38 ? 1 : progress < 0.63 ? 2 : progress < 0.84 ? 3 : 4;
      setStoryStep((current) => current === nextStep ? current : nextStep);
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
    <section className={`v3-home v3-book-journey story-step-${storyStep}`} ref={journeyRef} aria-labelledby="home-title">
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

        <div className="v3-book-viewport" aria-hidden="true">
          <div className="v3-book-shadow" />
          <div className="v3-book">
            <div className="v3-page-spread">
              <section className="v3-page v3-page-left">
                <span className="v3-page-label">질문 01</span>
                <h2>문장에서<br />누가 움직이나요?</h2>
                <p className="v3-pencil-note">먼저 내가 찾은 부분에 표시해 보기</p>
                <div className="v3-question-lines"><i /><i /><i /></div>
                <small>14</small>
              </section>
              <div className="v3-book-gutter" />
              <section className="v3-page v3-page-right">
                <span className="v3-page-label">문장 탐구</span>
                <h2>문장을 자세히<br />읽어 봐요.</h2>
                <p className="v3-sentence-line"><mark>학생들이</mark> 운동장에서 공을 <em>찬다.</em></p>
                <div className="v3-page-question"><span>관찰 질문</span><strong>‘누가/무엇이?’와 ‘어찌하다?’에 답하는 말은 무엇인가요?</strong></div>
                <div className="v3-answer-line"><i /> 나의 설명을 적는 자리</div>
                <small>15</small>
              </section>
              <div className="v3-turning-page"><span>생각을 한 문장으로<br />설명해 보세요.</span></div>
            </div>

            <div className="v3-book-cover">
              <div className="v3-cover-grain" />
              <span className="v3-cover-edition">KOREAN GRAMMAR · 2026</span>
              <div className="v3-cover-title"><i>문</i><h2>문득문득</h2><p>질문으로 얻고,<br />문장으로 깨닫다</p></div>
              <div className="v3-cover-rule" />
              <span className="v3-cover-foot">나의 문장을 발견하는 문법 학습</span>
            </div>
          </div>
        </div>

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
