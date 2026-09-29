"use client";

import { useState } from "react";
import { RealLifeChapter } from "@/components/real-life-chapter";
import type { RealLifeMaterialGroup } from "@/lib/curriculum/real-life-materials";

type SelfStudyGroup = Exclude<RealLifeMaterialGroup, "all">;

const groups: Array<{
  id: SelfStudyGroup;
  label: string;
  description: string;
  countLabel: string;
}> = [
  {
    id: "literature",
    label: "문학 작품",
    description: "시와 소설을 먼저 읽고, 내가 발견한 문장에서 질문을 시작해요.",
    countLabel: "시 2편 · 소설 2편"
  },
  {
    id: "authentic",
    label: "실생활 자료",
    description: "기사·안내문·대화·발표·인터뷰·SNS의 문장을 분석하고 바꾸어 써요.",
    countLabel: "6가지 실제 언어 맥락"
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
      <RealLifeChapter
        key={activeGroup}
        lessonNumber={6}
        materialGroup={activeGroup}
        showOverview={false}
        trackId="grammar"
      />
    </>
  );
}
