import assert from "node:assert/strict";
import test from "node:test";
import { rememberPrimaryActivityAnswer } from "../src/lib/learning/primary-activity-answer.ts";

test("P2·P3: 앞 활동에서 만든 기준 문장은 뒤의 꼬리 답변으로 바뀌지 않는다", () => {
  const created = rememberPrimaryActivityAnswer({}, "grammar-embedded-transform", "나는 친구가 발표하는 것을 지켜본다.");
  const afterFollowUp = rememberPrimaryActivityAnswer(created, "grammar-embedded-transform", "‘발표하는’이 ‘것’을 꾸며 줍니다.");

  assert.equal(afterFollowUp["grammar-embedded-transform"], "나는 친구가 발표하는 것을 지켜본다.");
  assert.equal(afterFollowUp, created);
});

test("P2: 빈 답은 기준 문장으로 저장하지 않고 활동별 첫 답을 따로 보존한다", () => {
  const empty = rememberPrimaryActivityAnswer({}, "first", "   ");
  const first = rememberPrimaryActivityAnswer(empty, "first", "학생이 책을 읽는다.");
  const second = rememberPrimaryActivityAnswer(first, "second", "나는 학교에 간다.");

  assert.deepEqual(empty, {});
  assert.equal(second.first, "학생이 책을 읽는다.");
  assert.equal(second.second, "나는 학교에 간다.");
});
