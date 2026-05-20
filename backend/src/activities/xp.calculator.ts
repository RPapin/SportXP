export function calculateXP(distanceM: number, averageGradePercent: number | null): number {
  const grade = averageGradePercent == null ? 1 : Math.abs(averageGradePercent) || 1;
  return (distanceM / 100) * grade;
}
