import { useI18n } from 'vue-i18n'

export function useGradeHelpers() {
  const { t } = useI18n()

  function scoreToGrade(score: number | null): number {
    if (score === null) return 0
    if (score > 80) return 5
    if (score > 60) return 4
    if (score > 40) return 3
    return 2
  }

  function progressBarColor(score: number): string {
    if (score > 80) return 'bg-success-500'
    if (score > 60) return 'bg-warning-500'
    return 'bg-error-500'
  }

  function gradeCircleClass(score: number | null | undefined): string {
    if (score == null) return 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
    if (score > 80) return 'bg-success-100 text-success-700 dark:bg-success-500/10 dark:text-success-400'
    if (score > 60) return 'bg-warning-100 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400'
    return 'bg-error-100 text-error-700 dark:bg-error-500/10 dark:text-error-400'
  }

  function quarterBadgeClass(grade: number | null | undefined): string {
    if (grade == null) return 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'
    if (grade >= 5) return 'bg-success-100 text-success-700 dark:bg-success-500/10 dark:text-success-400'
    if (grade >= 4) return 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400'
    if (grade >= 3) return 'bg-warning-100 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400'
    return 'bg-error-100 text-error-700 dark:bg-error-500/10 dark:text-error-400'
  }

  function quarterLabel(grade: number | null | undefined): string {
    if (grade == null) return '—'
    if (grade >= 5) return t('students.excellent')
    if (grade >= 4) return t('students.good')
    if (grade >= 3) return t('students.average')
    return t('students.belowAvg')
  }

  function gradeNumberColor(grade: number | null | undefined): string {
    if (grade == null) return 'text-gray-400 dark:text-gray-500'
    if (grade >= 5) return 'text-success-600 dark:text-success-400'
    if (grade >= 4) return 'text-brand-600 dark:text-brand-400'
    if (grade >= 3) return 'text-warning-600 dark:text-warning-400'
    return 'text-error-600 dark:text-error-400'
  }

  function percentColor(score: number | null | undefined): string {
    if (score == null) return 'text-gray-400 dark:text-gray-500'
    if (score > 80) return 'text-success-600 dark:text-success-400'
    if (score > 60) return 'text-warning-600 dark:text-warning-400'
    return 'text-error-600 dark:text-error-400'
  }

  return {
    scoreToGrade,
    progressBarColor,
    gradeCircleClass,
    quarterBadgeClass,
    quarterLabel,
    gradeNumberColor,
    percentColor,
  }
}
