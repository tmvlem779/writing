"use client";

import { useState } from "react";
import { RealLifeChapter } from "@/components/real-life-chapter";
import { SituationWritingActivity } from "@/components/situation-writing-activity";
import type { RealLifeMaterialGroup } from "@/lib/curriculum/real-life-materials";

type SelfStudyGroup = Exclude<RealLifeMaterialGroup, "all"> | "sentence-making";

const groups: Array<{
  id: SelfStudyGroup;
  label: string;
  description: string;
  countLabel: string;
}> = [
  {
    id: "literature",
    label: "문학 작품",
    description: "시에서는 문법 요소를 찾고, 소설에서는 모든 문장에 직접 밑줄을 그으며 질문에 답해요.",
    countLabel: "시 2편 · 소설 2편"
  },
  {
    id: "authentic",
    label: "실생활 자료",
    description: "기사·안내문·대화·발표·인터뷰·SNS의 문장을 분석하고 바꾸어 써요.",
    countLabel: "6가지 실제 언어 맥락"
  },
  {
    id: "sentence-making",
    label: "그림·상황 문장 만들기",
    description: "그림을 먼저 관찰하고, 보이는 사실과 상황에 맞는 문장을 직접 만들어요.",
    countLabel: "3가지 학교생활 장면"
  }
];

export function SelfStudyWorkspace() {
  const [activeGroup, setActiveGroup] = useState<SelfStudyGroup>("literature");

  return (
    <>
      <section className="self-study-group-tabs" aria-label="스스로 유형 학습 자료 갈래">
        {groups.map((group) => (
          <button
            aria-pressed={activeGroup === group.id}
            className={activeGroup === group.id ? "self-study-group-tab active" : "self-study-group-tab"}
            key={group.id}
            onClick={() => setActiveGroup(group.id)}
            type="button"
          >
            <span>{group.countLabel}</span>
            <strong>{group.label}</strong>
            <small>{group.description}</small>
          </button>
        ))}
      </section>
      {activeGroup === "sentence-making" ? (
        <SituationWritingActivity />
      ) : (
        <RealLifeChapter
          key={activeGroup}
          lessonNumber={6}
          materialGroup={activeGroup}
          showOverview={false}
          trackId="grammar"
        />
      )}
    </>
  );
}
