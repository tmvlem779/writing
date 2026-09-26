export function hasPassedConceptCheck(passedIndexes: number[], checkIndex: number) {
  return passedIndexes.includes(checkIndex);
}

export function canAdvanceConceptCheck(
  currentIndex: number,
  totalChecks: number,
  passedIndexes: number[]
) {
  return currentIndex < totalChecks - 1 && hasPassedConceptCheck(passedIndexes, currentIndex);
}

export function advanceConceptCheck(
  currentIndex: number,
  totalChecks: number,
  passedIndexes: number[]
) {
  if (!canAdvanceConceptCheck(currentIndex, totalChecks, passedIndexes)) return currentIndex;
  return currentIndex + 1;
}

export function isConceptCheckComplete(totalChecks: number, passedIndexes: number[]) {
  return totalChecks > 0
    && Array.from({ length: totalChecks }, (_, index) => index).every((index) => passedIndexes.includes(index));
}
