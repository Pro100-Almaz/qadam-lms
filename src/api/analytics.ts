import api from './client'

/**
 * Analytics — the records already in the system, reshaped for charts.
 *
 * Nothing here is a new fact about a student: every number is derived from marks
 * and registers other endpoints already serve. What these add is the comparison
 * — a class band around a student's line, a class mean beside their radar —
 * which is expensive to assemble client-side and cheap server-side.
 *
 * ## Three families, and why they are not interchangeable
 *
 * The module covers three separate records, and a screen must not mix them:
 *
 * - **Lesson grades** (`trajectory`, `topic-heatmap`, `subject-radar`) — the
 *   per-topic marks behind `/subject-grades/`, the gradebook on a subject.
 * - **Assignment grades** (`assignment-*`) — the graded assignments behind
 *   `/subject-assignments/`, which carry their own `max_grade` and a category.
 * - **Attendance** (`attendance-*`) — the registers behind `/attendance/`.
 *
 * They answer about different work and rarely agree. A subject's page reports
 * the first, the grading page the second; neither is a check on the other.
 *
 * ## Missing marks: two opposite conventions
 *
 * The lesson-grade endpoints report `grading.missing_topics_as: "zero"` — a
 * topic nobody marked counts as 0, so an ungraded lesson and a failed one look
 * identical and a marking backlog drags a strong student's trend negative.
 * `coverage` is the only thing separating them, and `isPartiallyGraded()` below
 * is the test; charts must encode it — hollow markers, hatched cells — rather
 * than plotting a partial value on the normal scale as if it were real.
 *
 * The assignment and attendance endpoints default the other way,
 * `missing=exclude`: what nobody entered is left out of the divisor entirely.
 * That removes the trap but adds a quieter one — a mean over one mark and a mean
 * over twenty read the same. Those responses carry `graded` per point and
 * `coverage.graded_share` per panel to say how much is behind a value, and the
 * charts show it beside the number. `missing=zero` restores the zero-fill
 * behaviour for a caller who wants "what has been earned so far".
 */

// ─── Shared shapes ────────────────────────────────────────────────────────────

export interface AnalyticsStudent {
  /** Student **profile** id — the same id space `/subject-grades/?student=` uses. */
  id: number
  full_name: string
  /** "A. Serikova" — for axis ticks and heatmap rows, where full names do not fit. */
  short_name: string
}

export interface AnalyticsOffering {
  id: number
  subject: string
  subject_id: number
  class_group: string
  academic_year: string
  /** Upper bound of the grades below, so a chart's y-axis need not guess. */
  max_points: number
  grading_strategy: string
}

/**
 * How much of what was gradeable actually carries a mark.
 *
 * `graded_topic_count < topic_count` means the value beside it is part real
 * mark, part zero-fill.
 */
export interface AnalyticsCoverage {
  topic_count: number
  graded_topic_count: number
}

/** True when zero-fill contributed to the value this coverage belongs to. */
export function isPartiallyGraded(coverage: AnalyticsCoverage | null | undefined): boolean {
  if (!coverage) return false
  return coverage.graded_topic_count < coverage.topic_count
}

/** Nothing was marked at all — a stronger claim than "partial", and a different cue. */
export function isUngraded(coverage: AnalyticsCoverage | null | undefined): boolean {
  return !!coverage && coverage.graded_topic_count === 0
}

/** Echoed back by every endpoint, so a chart can caption the rule it was drawn under. */
export interface AnalyticsGradingNote {
  missing_topics_as: string
}

// ─── 1. Trajectory ────────────────────────────────────────────────────────────

export interface TrajectoryParams {
  /** 1–4. Omitted means the whole year. */
  quarter?: number
  /** 1–15. Omitted means every unit. */
  unit?: number
  /** `YYYY-MM-DD`. */
  date_from?: string
  /** `YYYY-MM-DD`. */
  date_to?: string
  /**
   * Defaults to `true`. Set `false` and the class band, rank and `class_size`
   * are dropped from every point and the summary's `class_mean` and `delta`
   * come back `null` — the student's own line is all that survives.
   */
  include_class_stats?: boolean
}

/**
 * One lesson. The class fields are absent, not null, when
 * `include_class_stats=false` was asked for.
 */
export interface TrajectoryPoint {
  lesson_id: number
  title: string
  /** `YYYY-MM-DD`. */
  date: string
  order: number
  quarter: number
  unit: number | null
  status: string
  student_grade: number
  coverage: AnalyticsCoverage
  class_mean?: number
  class_median?: number
  /** The band's floor and ceiling — the middle half of the class. */
  p25?: number
  p75?: number
  class_min?: number
  class_max?: number
  class_size?: number
  /** 1 is the top of the class. */
  rank?: number
}

export interface TrajectorySummary {
  lesson_count: number
  student_mean: number
  class_mean: number | null
  /** `student_mean - class_mean`; `null` without class stats. */
  delta: number | null
  /**
   * Points per lesson. Reads as "improving" or "declining", but it is computed
   * over the zero-filled values, so a stretch of unmarked work tips it
   * negative on its own — read it next to `summary.coverage`.
   */
  trend_slope: number
  coverage: AnalyticsCoverage
}

export interface TrajectoryFilters {
  quarter: number | null
  unit: number | null
  date_from: string | null
  date_to: string | null
}

export interface TrajectoryResponse {
  student: AnalyticsStudent
  offering: AnalyticsOffering
  filters: TrajectoryFilters
  grading: AnalyticsGradingNote
  points: TrajectoryPoint[]
  summary: TrajectorySummary
}

/**
 * One student's lesson-by-lesson line in one subject, with the class's middle
 * half as a band behind it.
 *
 * A student not enrolled in the offering is a 404, not an empty series.
 */
export function getStudentTrajectoryApi(
  studentId: number,
  offeringId: number,
  params?: TrajectoryParams,
) {
  return api.get<TrajectoryResponse>(
    `/analytics/students/${studentId}/offerings/${offeringId}/trajectory/`,
    { params },
  )
}

// ─── 2. Topic heatmap ─────────────────────────────────────────────────────────

/**
 * `topic_title` — the default — merges every lesson's "Homework" into one
 * column, which is the readable view: three or four columns against the class.
 * `topic` keeps each Topic row separate, one column per lesson per topic, which
 * is how you find the single unmarked cell behind a dip.
 */
export type HeatmapGroupBy = 'topic_title' | 'topic'

export interface TopicHeatmapParams {
  quarter?: number
  unit?: number
  date_from?: string
  date_to?: string
  /** Defaults to `topic_title`. */
  group_by?: HeatmapGroupBy
  /** Defaults to `false`. */
  include_subtopics?: boolean
}

export interface HeatmapTopic {
  /** The topic title under `topic_title`, the topic **id** as a string under `topic`. */
  key: string
  label: string
  parent: string | null
  /** Its share of the lesson mark under a weighted strategy. */
  weight: number
  lesson_count: number
  topic_count: number
}

export interface TopicHeatmapResponse {
  offering: AnalyticsOffering
  filters: TrajectoryFilters & {
    group_by: HeatmapGroupBy
    include_subtopics: boolean
  }
  grading: AnalyticsGradingNote
  /** The colour scale's ends — not necessarily 0–100. */
  scale: { min: number; max: number }
  /** Row order. Sorted by surname, so it is **not** id order. */
  students: AnalyticsStudent[]
  /** Column order. */
  topics: HeatmapTopic[]
  /** `matrix[i][j]` is `students[i]` × `topics[j]`. */
  matrix: number[][]
  /**
   * Same indexing as `matrix`. Each cell is the count of graded topics behind
   * it; the denominator is its column's `topics[j].topic_count`, so a `3` under
   * a `topic_count: 4` column is three-quarters real and one-quarter zero-fill.
   */
  coverage: number[][]
  row_means: number[]
  column_means: number[]
  class_size: number
  lesson_count: number
  /** The server capped the matrix; what is drawn is a prefix, not the whole class. */
  truncated: boolean
}

/**
 * The whole class against the topics they were marked on.
 *
 * Staff and the teachers of the offering only — a student or parent asking is a
 * 403, since the grid names every classmate.
 */
export function getTopicHeatmapApi(offeringId: number, params?: TopicHeatmapParams) {
  return api.get<TopicHeatmapResponse>(`/analytics/offerings/${offeringId}/topic-heatmap/`, {
    params,
  })
}

// ─── 3. Subject radar ─────────────────────────────────────────────────────────

/**
 * Where an axis's value comes from.
 *
 * `snapshot` is the quarter's frozen mark, `live` recomputes from the lessons
 * on record. `auto` — the default — prefers the snapshot and falls back to
 * live, which is the only setting that shows a finished quarter correctly.
 * Forcing `live` on a closed quarter can empty an axis that has a perfectly
 * good snapshot behind it.
 */
export type RadarSource = 'auto' | 'snapshot' | 'live'

export interface SubjectRadarParams {
  /** Academic year **id**. Defaults to the active year. */
  academic_year?: number
  /** Defaults to the year's current quarter, or 1. */
  quarter?: number
  source?: RadarSource
  /** Defaults to `true`. */
  include_class_mean?: boolean
}

export interface RadarAxis {
  offering_id: number
  subject_id: number
  subject: string
  language_group: string
  value: number
  /** Never `auto` — this is what the server actually used for this axis. */
  source: Exclude<RadarSource, 'auto'>
  /**
   * Zero means the subject had no lessons in this quarter — "nothing
   * scheduled", not "scored zero". The summary excludes such axes; a chart
   * should mark them rather than let the reader read a 0.
   */
  lesson_count: number
  graded_lesson_count: number
  /** Snapshot axes only. */
  letter_grade?: string
  class_mean?: number
  percentile?: number
}

export interface SubjectRadarSummary {
  overall_mean: number
  class_overall_mean: number | null
  strongest: { subject: string; value: number } | null
  weakest: { subject: string; value: number } | null
  /**
   * Axes drawn. Held steady across quarters so the polygon keeps its shape,
   * which is why it can exceed `subject_count`.
   */
  axis_count: number
  /** Axes the aggregates above actually used — those with lessons behind them. */
  subject_count: number
  sources: { snapshot: number; live: number }
}

export interface SubjectRadarResponse {
  student: AnalyticsStudent
  academic_year: { id: number; year: string }
  class_group: string
  quarter: number
  grading: AnalyticsGradingNote
  axes: RadarAxis[]
  summary: SubjectRadarSummary
}

/**
 * Every subject a student takes, on one polygon, each axis labelled with
 * whether it came from a snapshot or was recomputed.
 *
 * Doubles as the offering directory for a student: each axis carries the
 * `offering_id` that {@link getStudentTrajectoryApi} needs, so a screen holding
 * only a student id can still offer the per-subject trajectory.
 */
export function getSubjectRadarApi(studentId: number, params?: SubjectRadarParams) {
  return api.get<SubjectRadarResponse>(`/analytics/students/${studentId}/subject-radar/`, {
    params,
  })
}

// ═══ Assignment grades ════════════════════════════════════════════════════════
//
// A different record from the three above: graded assignments, not lesson
// topics. Every value is a **percent of the assignment's own `max_grade`**, so
// a 41/50 and an 18/20 are comparable on one axis; `grading.scale` says so.

/** The three kinds an assignment can be set as. */
export type AssignmentCategory = 'lesson' | 'exam' | 'final'

export const ASSIGNMENT_CATEGORIES: readonly AssignmentCategory[] = ['lesson', 'exam', 'final']

/**
 * What to do with an assignment nobody marked.
 *
 * `exclude` — the default — drops it from the divisor: the value is the mean of
 * the marks actually entered. `zero` counts it as a 0, which is "what has been
 * earned of what was set" and is the harsher, and more complete, reading.
 */
export type MissingMode = 'exclude' | 'zero'

/** One category's slice of a value. `value` is 0 when nothing was graded in it. */
export interface AssignmentCategoryStat {
  assignment_count: number
  graded_count: number
  value: number
}

/** Always all three categories, present even when empty. */
export type AssignmentCategoryBreakdown = Record<AssignmentCategory, AssignmentCategoryStat>

/**
 * How much of what could have been marked was.
 *
 * Unlike the lesson-grade `coverage`, a shortfall here does **not** mean the
 * value is diluted with zeros — under `exclude` it means the value rests on
 * fewer marks than it looks like it does.
 */
export interface AssignmentCoverage {
  possible_count: number
  graded_count: number
  /** Percent, already computed — `graded_count / possible_count * 100`. */
  graded_share: number
}

/** Echoed by every assignment endpoint, so a panel can caption its own rules. */
export interface AssignmentGradingNote {
  /** `"excluded"` or `"zero"` — the resolved form of the `missing` parameter. */
  missing_grades_as: string
  /** `"percent_of_max_grade"`. */
  scale: string
}

export interface AssignmentFilterEcho {
  category: AssignmentCategory | null
  date_from: string | null
  date_to: string | null
  missing: MissingMode
}

/** The class group as the assignment and attendance endpoints spell it out. */
export interface AnalyticsClassGroup {
  id: number
  name: string
  grade_level: number
  letter: string
  academic_year: string
}

// ─── 4. Assignment trajectory ─────────────────────────────────────────────────

export interface AssignmentTrajectoryParams {
  category?: AssignmentCategory
  /** `YYYY-MM-DD`. */
  date_from?: string
  /** `YYYY-MM-DD`. */
  date_to?: string
  /** Defaults to `exclude`. */
  missing?: MissingMode
  /**
   * Defaults to `true`. Set `false` and the band, `rank` and `class_size` are
   * dropped from every point, and the summary's `class_mean` and `delta` come
   * back `null`.
   */
  include_class_stats?: boolean
}

/**
 * One assignment.
 *
 * `percent` is `0.0` whenever `graded` is false — **the pair is the only way to
 * tell an unmarked assignment from a real zero**, and `rank` is `0` rather than
 * last in that case. Never plot `percent` without consulting `graded`.
 */
export interface AssignmentTrajectoryPoint {
  id: number
  title: string
  category: AssignmentCategory
  /** `YYYY-MM-DD`. */
  date: string
  max_grade: number
  /** Raw points, out of `max_grade`. */
  grade: number
  /** `grade / max_grade * 100` — what the chart plots. */
  percent: number
  graded: boolean
  class_mean?: number
  class_median?: number
  /** The band's floor and ceiling — the middle half of the class. */
  p25?: number
  p75?: number
  class_min?: number
  class_max?: number
  class_size?: number
  /** How many of the class have a mark here — the class stats' real divisor. */
  graded_class_count?: number
  /** 1 is the top of the class; `0` means this student has no mark. */
  rank?: number
}

export interface AssignmentTrajectorySummary {
  assignment_count: number
  graded_count: number
  student_mean: number
  class_mean: number | null
  /** `student_mean - class_mean`; `null` without class stats. */
  delta: number | null
  /** Percentage points per assignment, over the points as filtered. */
  trend_slope: number
  by_category: AssignmentCategoryBreakdown
  coverage: AssignmentCoverage
}

export interface AssignmentTrajectoryResponse {
  student: AnalyticsStudent
  offering: AnalyticsOffering
  filters: AssignmentFilterEcho
  grading: AssignmentGradingNote
  points: AssignmentTrajectoryPoint[]
  summary: AssignmentTrajectorySummary
}

/**
 * One student's assignments in one subject as a line, with the class's middle
 * half behind it.
 *
 * A student not enrolled in the offering is a 404, not an empty series.
 */
export function getAssignmentTrajectoryApi(
  studentId: number,
  offeringId: number,
  params?: AssignmentTrajectoryParams,
) {
  return api.get<AssignmentTrajectoryResponse>(
    `/analytics/students/${studentId}/offerings/${offeringId}/assignment-trajectory/`,
    { params },
  )
}

// ─── 5. Assignment heatmap ────────────────────────────────────────────────────

export interface AssignmentHeatmapParams {
  category?: AssignmentCategory
  date_from?: string
  date_to?: string
  missing?: MissingMode
}

export interface HeatmapAssignment {
  id: number
  title: string
  category: AssignmentCategory
  /** `YYYY-MM-DD`. */
  date: string
  max_grade: number
  /** How many of the class have a mark on it. */
  graded_count: number
}

export interface AssignmentHeatmapResponse {
  offering: AnalyticsOffering
  filters: AssignmentFilterEcho
  grading: AssignmentGradingNote
  /** The colour scale's ends. */
  scale: { min: number; max: number }
  /** Row order. */
  students: AnalyticsStudent[]
  /** Column order. */
  assignments: HeatmapAssignment[]
  /** `matrix[i][j]` is `students[i]` on `assignments[j]`, as a percent. */
  matrix: number[][]
  /** Same indexing. `false` means no mark — `matrix` there is a filler `0.0`. */
  graded: boolean[][]
  /** Same indexing, in the assignment's own points. `null` where ungraded. */
  raw_grades: (number | null)[][]
  /**
   * Under `missing=exclude` the divisor is the marks entered, **not** the column
   * count — a row with one mark of 60% has a `row_mean` of 60, not 30.
   */
  row_means: number[]
  column_means: number[]
  coverage: AssignmentCoverage
  class_size: number
  assignment_count: number
  /** Capped at 60 assignments, most recent kept. */
  truncated: boolean
}

/**
 * The whole class against the assignments they were set.
 *
 * Teachers of the offering, its homeroom teacher, psychologists and admin only —
 * the grid names every classmate, so a student or parent asking is a 403.
 */
export function getAssignmentHeatmapApi(offeringId: number, params?: AssignmentHeatmapParams) {
  return api.get<AssignmentHeatmapResponse>(
    `/analytics/offerings/${offeringId}/assignment-heatmap/`,
    { params },
  )
}

// ─── 6. Assignment summary ────────────────────────────────────────────────────

export interface AssignmentSummaryParams {
  /** Academic year **id**. Defaults to the active year. */
  academic_year?: number
  /** 1–4. A quarter the year has no dates for is a 400, not an empty answer. */
  quarter?: number
  category?: AssignmentCategory
  date_from?: string
  date_to?: string
  missing?: MissingMode
  /** Defaults to `true`. */
  include_class_mean?: boolean
}

/**
 * One subject's axis.
 *
 * A subject with no assignments still gets an axis, at `value: 0` with
 * `assignment_count: 0` — "nothing set", not "scored zero". Such axes are
 * excluded from the summary's averages, which is why `axis_count` (what is
 * drawn) can exceed `subject_count` (what was averaged).
 */
export interface AssignmentSummaryAxis {
  offering_id: number
  subject_id: number
  subject: string
  language_group: string
  value: number
  assignment_count: number
  graded_count: number
  by_category: AssignmentCategoryBreakdown
  class_mean?: number
  percentile?: number
}

export interface AssignmentSummaryTotals {
  overall_mean: number
  class_overall_mean: number | null
  strongest: { subject: string; value: number } | null
  weakest: { subject: string; value: number } | null
  /** Axes drawn — includes the empty ones. */
  axis_count: number
  /** Axes the averages used. */
  subject_count: number
  assignment_count: number
  graded_count: number
  by_category: AssignmentCategoryBreakdown
}

export interface AssignmentSummaryResponse {
  student: AnalyticsStudent
  academic_year: { id: number; year: string }
  class_group: AnalyticsClassGroup
  filters: AssignmentFilterEcho & { quarter: number | null }
  grading: AssignmentGradingNote
  /** Ordered by subject name, never by value — the polygon keeps its shape. */
  axes: AssignmentSummaryAxis[]
  summary: AssignmentSummaryTotals
}

/**
 * Every subject a student has assignments in, on one polygon.
 *
 * Doubles as the offering directory for a student: each axis carries the
 * `offering_id` {@link getAssignmentTrajectoryApi} needs, so a screen holding
 * only a student id can still offer the per-subject trajectory.
 */
export function getAssignmentSummaryApi(studentId: number, params?: AssignmentSummaryParams) {
  return api.get<AssignmentSummaryResponse>(
    `/analytics/students/${studentId}/assignment-summary/`,
    { params },
  )
}

// ═══ Attendance ═══════════════════════════════════════════════════════════════
//
// Registers, not marks. A slot nobody took the register for is *unrecorded* and
// counts as neither present nor absent — `rate = present / (present + absent)`,
// so the denominator is `recorded`, which every row carries for exactly that
// reason.

/** The counting rule, echoed so a panel can caption it. */
export interface AttendanceCountingNote {
  /** `"excluded"` — an unrecorded slot is not an absence. */
  unrecorded_as: string
  /** `"present / (present + absent)"`. */
  rate: string
}

/** The four numbers every attendance breakdown row carries. */
export interface AttendanceCounts {
  recorded: number
  present: number
  absent: number
  /** Percent. `0.0` when `recorded` is 0 — check `recorded` before reading it. */
  attendance_rate: number
}

export interface AttendanceSubjectRow extends AttendanceCounts {
  /** `null` for an offering-less schedule — a break or a club, named by `subject`. */
  offering_id: number | null
  subject: string
}

export interface AttendanceWeekdayRow extends AttendanceCounts {
  /** 0 = Monday … 6 = Sunday. Always all seven, in order. */
  weekday: number
}

export interface AttendanceMonthRow extends AttendanceCounts {
  /** `YYYY-MM`. */
  month: string
}

// ─── 7. Student attendance summary ────────────────────────────────────────────

export interface AttendanceSummaryParams {
  /** Academic year **id**. */
  academic_year?: number
  /** 1–4. */
  quarter?: number
  date_from?: string
  date_to?: string
  /** Narrow to one subject offering. */
  offering?: number
  /** Defaults to `true`. */
  include_class_stats?: boolean
}

/**
 * How the student sits against their class. Aggregate only — no classmate is
 * named, which is why this is safe to show a student or parent.
 */
export interface AttendanceClassComparison {
  class_size: number
  /** Pooled over every register row of the class. */
  class_attendance_rate: number
  /** The mean of the per-student rates — what `rank` and `percentile` are over. */
  class_mean_rate: number
  /** 1 is the best attendance in the class. */
  rank: number
  percentile: number
  /** The student's rate minus `class_mean_rate`. */
  delta: number
}

export interface AttendanceSummaryResponse {
  student: AnalyticsStudent
  academic_year: { id: number; year: string }
  class_group: AnalyticsClassGroup
  filters: {
    academic_year: number | null
    quarter: number | null
    date_from: string | null
    date_to: string | null
    offering: number | null
  }
  counting: AttendanceCountingNote
  totals: AttendanceCounts
  by_subject: AttendanceSubjectRow[]
  /** Always seven rows, 0 = Monday. */
  by_weekday: AttendanceWeekdayRow[]
  by_month: AttendanceMonthRow[]
  /** Absent when `include_class_stats=false` was asked for. */
  class_comparison?: AttendanceClassComparison | null
}

/** One student's attendance, split by subject, weekday and month. */
export function getAttendanceSummaryApi(studentId: number, params?: AttendanceSummaryParams) {
  return api.get<AttendanceSummaryResponse>(
    `/analytics/students/${studentId}/attendance-summary/`,
    { params },
  )
}

// ─── 8. Attendance heatmap ────────────────────────────────────────────────────

export interface AttendanceHeatmapParams {
  /** The schedule's own `SubjectSchedule.quarter`, not a date-derived one. */
  quarter?: number
  date_from?: string
  date_to?: string
}

/**
 * One column: a single (date, session) pair. A subject taught twice on a Tuesday
 * gets two columns, which is why `key` exists — `"<date>:<session_id>"`.
 */
export interface AttendanceSlot {
  key: string
  /** `YYYY-MM-DD`. */
  date: string
  session_id: number
  /** `"09:00:00"` — when the lesson runs, which is what names the column. */
  time_start: string
  time_end: string
  /** 0 = Monday. */
  weekday: number
  quarter: number
}

/**
 * `null` means **nobody took the register** — the only nullable matrix in these
 * modules, and the one cell that must not be drawn as an absence.
 */
export type AttendanceCell = 'present' | 'absent' | null

export interface AttendanceHeatmapResponse {
  offering: AnalyticsOffering
  filters: {
    academic_year: number | null
    quarter: number | null
    date_from: string | null
    date_to: string | null
  }
  counting: AttendanceCountingNote
  legend: AttendanceCell[]
  students: AnalyticsStudent[]
  /** Capped at 90 slots, most recent kept, sorted newest start time first. */
  slots: AttendanceSlot[]
  /** `matrix[i][j]` is `students[i]` in `slots[j]`. */
  matrix: AttendanceCell[][]
  row_summary: AttendanceCounts[]
  column_summary: AttendanceCounts[]
  totals: AttendanceCounts
  class_size: number
  slot_count: number
  truncated: boolean
}

/**
 * A class's register, lesson by lesson.
 *
 * Teachers of the offering, its homeroom teacher, psychologists and admin only.
 */
export function getAttendanceHeatmapApi(offeringId: number, params?: AttendanceHeatmapParams) {
  return api.get<AttendanceHeatmapResponse>(
    `/analytics/offerings/${offeringId}/attendance-heatmap/`,
    { params },
  )
}

// ─── 9. Class-group attendance overview ───────────────────────────────────────

export interface ClassAttendanceOverviewParams {
  /** Defaults to the class group's own year. */
  academic_year?: number
  quarter?: number
  date_from?: string
  date_to?: string
  /** 0–100, default 90. The rate under which a student lands in `at_risk`. */
  at_risk_below?: number
}

export interface ClassAttendanceStudentRow extends AttendanceCounts {
  student: AnalyticsStudent
  /** 1 is the best attendance. Ties share the better rank. */
  rank: number
}

export interface ClassAttendanceOverviewResponse {
  class_group: AnalyticsClassGroup
  academic_year: { id: number; year: string }
  filters: {
    academic_year: number | null
    quarter: number | null
    date_from: string | null
    date_to: string | null
    at_risk_below: number
  }
  counting: AttendanceCountingNote
  totals: AttendanceCounts & {
    class_size: number
    /** The mean of the per-student rates, unlike the pooled `attendance_rate`. */
    mean_student_rate: number
  }
  /** Every enrolled student, best first — including any with `recorded: 0`. */
  students: ClassAttendanceStudentRow[]
  by_subject: AttendanceSubjectRow[]
  by_weekday: AttendanceWeekdayRow[]
  by_month: AttendanceMonthRow[]
  /**
   * Below `at_risk_below`. A student with no rows at all is **not** here: no
   * register is no evidence, rather than a 0% record.
   */
  at_risk: ClassAttendanceStudentRow[]
}

/**
 * A whole class group's attendance, ranked, with the students below a threshold
 * called out.
 *
 * Any teacher of the class group, its homeroom teacher, psychologists and admin.
 */
export function getClassAttendanceOverviewApi(
  classGroupId: number,
  params?: ClassAttendanceOverviewParams,
) {
  return api.get<ClassAttendanceOverviewResponse>(
    `/analytics/class-groups/${classGroupId}/attendance-overview/`,
    { params },
  )
}

// ─── Errors ───────────────────────────────────────────────────────────────────

/**
 * The endpoints answer a bad filter per parameter (`{ "quarter": "..." }`) and
 * a permission or enrolment problem under `detail`. Flatten either into one
 * line for the panel that failed.
 */
export function readAnalyticsError(error: unknown): string | null {
  const data = (error as { response?: { data?: unknown } })?.response?.data
  if (!data || typeof data !== 'object') return null

  const record = data as Record<string, unknown>
  const first = record.detail ?? Object.values(record)[0]
  if (typeof first === 'string') return first
  if (Array.isArray(first) && typeof first[0] === 'string') return first[0]
  return null
}
