export function hasPassedConceptCheck(passedIndexes: number[], checkIndex: number) {
  return passedIndexes.includes(checkIndex);
}

export function hasSubmittedConceptCheck(submittedIndexes: number[], checkIndex: number) {
  return submittedIndexes.includes(checkIndex);
}

export function canAdvanceConceptCheck(
  currentIndex: number,
  totalChecks: number,
  submittedIndexes: number[]
) {
  return currentIndex < totalChecks - 1 && hasSubmittedConceptCheck(submittedIndexes, currentIndex);
}

export function advanceConceptCheck(
  currentIndex: number,
  totalChecks: number,
  submittedIndexes: number[]
) {
  if (!canAdvanceConceptCheck(currentIndex, totalChecks, submittedIndexes)) return currentIndex;
  return currentIndex + 1;
}

export function getConceptCheckSummary(
  totalChecks: number,
  submittedIndexes: number[],
  passedIndexes: number[]
) {
  const initialRoundComplete = totalChecks > 0
    && Array.from({ length: totalChecks }, (_, index) => submittedIndexes.includes(index)).every(Boolean);
  const incorrectIndexes = Array.from({ length: totalChecks }, (_, index) => index)
    .filter((index) => submittedIndexes.includes(index) && !passedIndexes.includes(index));

  return {
    initialRoundComplete,
    correctCount: passedIndexes.filter((index) => index >= 0 && index < totalChecks).length,
    incorrectIndexes
  };
}

export function getNextUnresolvedConceptCheck(totalChecks: number, passedIndexes: number[]) {
  return Array.from({ length: totalChecks }, (_, index) => index)
    .find((index) => !passedIndexes.includes(index)) ?? null;
}

export function isConceptCheckComplete(totalChecks: number, passedIndexes: number[]) {
  return totalChecks > 0
    && Array.from({ length: totalChecks }, (_, index) => index).every((index) => passedIndexes.includes(index));
}

export function canCompleteConceptChapter(
  allChecksPassed: boolean,
  summaryRequired: boolean,
  summaryComplete: boolean
) {
  return allChecksPassed && (!summaryRequired || summaryComplete);
}
