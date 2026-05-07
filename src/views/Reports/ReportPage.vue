<template>
  <div class="report-page" :data-theme="theme">
    <!-- Controls Bar -->
    <div class="controls-bar no-print">
      <button class="btn-back" @click="router.back()">
        ← {{ t('common.back') }}
      </button>
      <div class="controls-right">
        <button class="btn-theme" @click="toggleTheme">
          {{ theme === 'dark' ? '☀' : '🌙' }}
        </button>
        <button class="btn-download" @click="downloadPdf" :disabled="downloadingPdf || !report?.report_data">
        <span class="download-icon">↓</span>
        {{ downloadingPdf ? t('common.loading') : t('reports.downloadPdf') }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="state-screen">
      <div class="loading-spinner" />
      <p class="state-text">{{ t('reports.generating') }}</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="state-screen">
      <p class="error-text">{{ error }}</p>
      <button class="btn-retry" @click="fetchReport">{{ t('reports.retry') }}</button>
    </div>

    <!-- Pending / Generating -->
    <div v-else-if="report && (report.status === 'pending' || report.status === 'generating')" class="state-screen">
      <div class="loading-spinner" />
      <p class="state-text">{{ t('reports.generating') }}</p>
    </div>

    <!-- Report Document -->
    <div v-else-if="report?.report_data" class="report-doc">
      <!-- HEADER -->
      <div class="report-header">
        <div class="header-content">
          <div class="header-brand">
            <div class="brand-icon">📊</div>
            <div>
              <div class="brand-label">Qadam Analytics</div>
              <div class="brand-school">{{ t('app.school') }}</div>
            </div>
          </div>
          <h1 class="header-title">{{ t('reports.title') }}</h1>
          <div class="header-meta">
            <div class="meta-item">
              <span class="meta-label">{{ t('students.student') }}:</span>
              <span class="meta-value">{{ report.student_name }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">{{ t('students.class') }}:</span>
              <span class="meta-value">{{ report.class_group }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">{{ t('reports.quarter') }}:</span>
              <span class="meta-value">Q{{ report.quarter }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">{{ t('academicYears.title') }}:</span>
              <span class="meta-value">{{ report.academic_year_label }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- BODY -->
      <div v-if="data" class="report-body">
        <!-- Summary -->
        <div class="summary-card">
          <div class="summary-label">{{ t('reports.summary') }}</div>
          <p class="summary-text">{{ data.summary }}</p>
        </div>

        <!-- Overall Assessment -->
        <div class="section">
          <div class="section-header">
            <h2 class="section-title">{{ t('reports.overallAssessment') }}</h2>
            <div class="section-line" />
          </div>
          <span :class="['badge', badgeClass(data.overall_assessment.score_label)]">
            {{ data.overall_assessment.score_label }}
          </span>
          <p class="assessment-text">{{ data.overall_assessment.description }}</p>
        </div>

        <!-- Academic Performance -->
        <div class="section">
          <div class="section-header">
            <h2 class="section-title">{{ t('reports.academicPerformance') }}</h2>
            <div class="section-line" />
          </div>
          <p class="assessment-text" style="margin-bottom: 20px">
            {{ data.academic_performance.overview }}
          </p>

          <div class="subject-grid">
            <div
              v-for="s in data.academic_performance.subject_analyses"
              :key="s.subject"
              class="subject-card"
            >
              <div class="subject-top">
                <span class="subject-name">{{ s.subject }}</span>
                <span :class="['subject-trend', trendInfo(s.trend).class]">
                  {{ trendInfo(s.trend).icon }} {{ t(`reports.${s.trend}`) }}
                </span>
              </div>
              <div class="subject-scores">
                <span :class="['score-main', `score-${gradeColor(s.grade_percentage)}`]">
                  {{ s.grade_percentage }}%
                </span>
                <span class="score-avg">{{ t('reports.classAverage') }}: {{ s.class_average }}%</span>
              </div>
              <div class="bar-wrap">
                <div class="bar-track bar-track-main">
                  <div
                    class="bar-fill"
                    :style="{
                      width: barWidth(s.grade_percentage),
                      background: `var(--grade-${gradeColor(s.grade_percentage)})`
                    }"
                  />
                </div>
                <div class="bar-track bar-track-avg">
                  <div
                    class="bar-fill bar-fill-avg"
                    :style="{ width: barWidth(s.class_average) }"
                  />
                </div>
              </div>
              <p class="subject-analysis">{{ s.analysis }}</p>
              <div class="tip-box">💡 {{ s.recommendation }}</div>
            </div>
          </div>
        </div>

        <!-- Strengths -->
        <div class="section">
          <div class="section-header">
            <h2 class="section-title">{{ t('reports.strengths') }}</h2>
            <div class="section-line" />
          </div>
          <div v-if="data.strengths.length" class="strength-list">
            <div v-for="item in data.strengths" :key="item.area" class="strength-item">
              <div class="strength-icon">✓</div>
              <div>
                <div class="strength-title">{{ item.area }}</div>
                <div class="strength-desc">{{ item.description }}</div>
              </div>
            </div>
          </div>
          <p v-else class="empty-text">{{ t('reports.noDataAvailable') }}</p>
        </div>

        <!-- Areas for Improvement -->
        <div class="section">
          <div class="section-header">
            <h2 class="section-title">{{ t('reports.areasForImprovement') }}</h2>
            <div class="section-line" />
          </div>
          <div v-if="data.areas_for_improvement.length" class="improve-list">
            <div v-for="item in data.areas_for_improvement" :key="item.area" class="improve-card">
              <div class="improve-header">
                <span class="improve-icon">△</span>
                <span class="improve-title">{{ item.area }}</span>
              </div>
              <p class="improve-desc">{{ item.description }}</p>
              <div class="action-box">→ {{ item.suggested_action }}</div>
            </div>
          </div>
          <p v-else class="empty-text">{{ t('reports.noDataAvailable') }}</p>
        </div>

        <!-- Psychological Profile -->
        <div class="section">
          <div class="section-header">
            <h2 class="section-title">{{ t('reports.psychologicalProfile') }}</h2>
            <div class="section-line" />
          </div>
          <p class="psych-summary">{{ data.psychological_profile.summary }}</p>

          <template v-if="data.psychological_profile.observations?.length">
            <div class="psych-group-label">{{ t('reports.observations') }}</div>
            <div class="psych-list">
              <div v-for="obs in data.psychological_profile.observations" :key="obs" class="psych-item">
                <span class="psych-bullet">•</span> {{ obs }}
              </div>
            </div>
          </template>

          <template v-if="data.psychological_profile.recommendations?.length">
            <div class="psych-group-label">{{ t('reports.recommendations') }}</div>
            <div class="psych-list">
              <div v-for="rec in data.psychological_profile.recommendations" :key="rec" class="psych-item">
                <span class="psych-rec-bullet">▸</span> {{ rec }}
              </div>
            </div>
          </template>
        </div>

        <!-- Extracurricular -->
        <div class="section">
          <div class="section-header">
            <h2 class="section-title">{{ t('reports.extracurricular') }}</h2>
            <div class="section-line" />
          </div>
          <p class="extra-summary">{{ data.extracurricular.summary }}</p>
          <div v-if="data.extracurricular.highlights?.length" class="extra-grid">
            <div v-for="h in data.extracurricular.highlights" :key="h" class="extra-card">
              {{ h }}
            </div>
          </div>
        </div>

        <!-- Recommendations -->
        <div class="section">
          <div class="section-header">
            <h2 class="section-title">{{ t('reports.recommendations') }}</h2>
            <div class="section-line" />
          </div>
          <div class="rec-grid">
            <div class="rec-column rec-column-teacher">
              <div class="rec-col-header">
                <span class="rec-col-icon">🎓</span>
                <span class="rec-col-title">{{ t('reports.forTeachers') }}</span>
              </div>
              <div v-for="r in data.recommendations.for_teachers" :key="r" class="rec-item">
                <span class="rec-bullet rec-bullet-teacher">▪</span> {{ r }}
              </div>
            </div>
            <div class="rec-column rec-column-parent">
              <div class="rec-col-header">
                <span class="rec-col-icon">👨‍👩‍👦</span>
                <span class="rec-col-title">{{ t('reports.forParents') }}</span>
              </div>
              <div v-for="r in data.recommendations.for_parents" :key="r" class="rec-item">
                <span class="rec-bullet rec-bullet-parent">▪</span> {{ r }}
              </div>
            </div>
            <div class="rec-column rec-column-student">
              <div class="rec-col-header">
                <span class="rec-col-icon">📝</span>
                <span class="rec-col-title">{{ t('reports.forStudent') }}</span>
              </div>
              <div v-for="r in data.recommendations.for_student" :key="r" class="rec-item">
                <span class="rec-bullet rec-bullet-student">▪</span> {{ r }}
              </div>
            </div>
          </div>
        </div>

        <!-- Conclusion -->
        <div class="conclusion-card">
          <div class="conclusion-label">{{ t('reports.conclusion') }}</div>
          <p class="conclusion-text">{{ data.conclusion }}</p>
        </div>

        <!-- Footer -->
        <div class="report-footer">
          <div class="footer-left">
            {{ formatDate(report.created_at) }}
            <template v-if="report.generated_by_name"> · {{ report.generated_by_name }}</template>
          </div>
          <div class="footer-right">
            <span class="footer-dot" />
            Qadam Analytics — AI Generated
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { getReportApi, downloadReportPdfApi } from '@/api/reports'
import type { StudentReport } from '@/types/report'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()

const report = ref<StudentReport | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)
const downloadingPdf = ref(false)

const reportId = computed(() => Number(route.params.id))
const data = computed(() => report.value?.report_data)
const theme = ref(document.documentElement.classList.contains('dark') ? 'dark' : 'light')

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
}

let pollTimer: ReturnType<typeof setInterval> | null = null

function gradeColor(pct: number): string {
  if (pct >= 80) return 'high'
  if (pct >= 60) return 'mid'
  return 'low'
}

function barWidth(pct: number): string {
  return `${Math.min(100, Math.max(0, pct))}%`
}

function trendInfo(trend: string) {
  switch (trend) {
    case 'improving': return { icon: '↑', class: 'trend-up' }
    case 'declining': return { icon: '↓', class: 'trend-down' }
    default: return { icon: '→', class: 'trend-stable' }
  }
}

function badgeClass(label: string): string {
  const l = label.toLowerCase()
  if (l.includes('excellent') || l.includes('отлично')) return 'badge-excellent'
  if (l.includes('good') || l.includes('хорошо')) return 'badge-good'
  if (l.includes('average') || l.includes('удовл')) return 'badge-average'
  return 'badge-low'
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

async function downloadPdf() {
  if (!report.value) return
  downloadingPdf.value = true
  try {
    const blob = await downloadReportPdfApi(reportId.value)
    const url = URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `Report_${report.value.student_name}_Q${report.value.quarter}.pdf`
    link.click()
    URL.revokeObjectURL(url)
  } catch { /* handled by interceptor */ }
  finally { downloadingPdf.value = false }
}

async function fetchReport() {
  isLoading.value = true
  error.value = null
  try {
    report.value = await getReportApi(reportId.value)
    if (report.value.status === 'failed') {
      error.value = report.value.error_message || t('reports.failed')
    } else if (report.value.status === 'pending' || report.value.status === 'generating') {
      startPolling()
    }
  } catch {
    error.value = t('reports.failed')
  } finally {
    isLoading.value = false
  }
}

function startPolling() {
  if (pollTimer) return
  pollTimer = setInterval(async () => {
    try {
      report.value = await getReportApi(reportId.value)
      if (report.value.status === 'completed' || report.value.status === 'failed') {
        if (pollTimer) clearInterval(pollTimer)
        pollTimer = null
        if (report.value.status === 'failed') {
          error.value = report.value.error_message || t('reports.failed')
        }
      }
    } catch { /* keep polling */ }
  }, 3000)
}

onMounted(fetchReport)
onUnmounted(() => { if (pollTimer) clearInterval(pollTimer) })
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Noto+Sans:wght@400;500;600;700&display=swap');

/* ─── Page ───────────────────────────────────────────────────────────────── */
.report-page {
  --bg: #f0f1f3;
  --bg-card: #ffffff;
  --bg-card-alt: #f9fafb;
  --bg-header: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  --text-primary: #1e293b;
  --text-secondary: #475569;
  --text-muted: #94a3b8;
  --border: #e2e8f0;
  --border-light: #f1f5f9;
  --accent: #4f6cff;
  --accent-light: #eef1ff;
  --grade-high: #22c55e;
  --grade-mid: #f59e0b;
  --grade-low: #ef4444;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.08);
  --shadow-lg: 0 2px 20px rgba(0,0,0,0.1);
  --radius: 12px;
  --radius-sm: 8px;
  --font-display: 'Outfit', sans-serif;
  --font-body: 'Noto Sans', sans-serif;

  font-family: var(--font-body);
  color: var(--text-primary);
  background: var(--bg);
  min-height: 100vh;
}

.report-page[data-theme="dark"] {
  --bg: #0f172a;
  --bg-card: #1e293b;
  --bg-card-alt: #1a2332;
  --bg-header: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  --text-primary: #e2e8f0;
  --text-secondary: #94a3b8;
  --text-muted: #64748b;
  --border: #334155;
  --border-light: #1e293b;
  --accent: #6d8cff;
  --accent-light: #1e2a4a;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.2);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.3);
  --shadow-lg: 0 2px 20px rgba(0,0,0,0.25);
}

/* ─── Controls Bar ───────────────────────────────────────────────────────── */
.controls-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: var(--bg-card);
  border-bottom: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
}
.btn-back {
  padding: 8px 18px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 14px;
  font-family: var(--font-display);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-back:hover { border-color: var(--accent); color: var(--accent); }
.controls-right { display: flex; align-items: center; gap: 8px; }
.btn-theme {
  width: 36px; height: 36px; border-radius: var(--radius-sm); border: 1px solid var(--border);
  background: var(--bg-card); color: var(--text-secondary); font-size: 16px;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.btn-theme:hover { border-color: var(--accent); color: var(--accent); }
.btn-download {
  padding: 8px 20px;
  border-radius: var(--radius-sm);
  border: none;
  background: var(--accent);
  color: #fff;
  font-size: 14px;
  font-family: var(--font-display);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}
.btn-download:hover { opacity: 0.9; }
.btn-download:disabled { opacity: 0.5; cursor: not-allowed; }
.download-icon { font-size: 16px; font-weight: 700; }

/* ─── State Screens ──────────────────────────────────────────────────────── */
.state-screen {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  min-height: 50vh; gap: 16px;
}
.loading-spinner {
  width: 40px; height: 40px; border: 4px solid var(--border);
  border-top-color: var(--accent); border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
.state-text { color: var(--text-muted); font-size: 14px; }
.error-text { color: var(--grade-low); font-size: 14px; }
.btn-retry {
  padding: 8px 20px; border-radius: var(--radius-sm); border: none;
  background: var(--accent); color: #fff; font-size: 14px; cursor: pointer;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* ─── Report Document ────────────────────────────────────────────────────── */
.report-doc {
  max-width: 900px;
  margin: 32px auto;
  background: var(--bg-card);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  border: 1px solid var(--border);
}

/* ─── Header ─────────────────────────────────────────────────────────────── */
.report-header {
  background: var(--bg-header); color: #fff; padding: 40px 48px;
}
.header-content { max-width: 100%; }
.header-brand { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
.brand-icon { font-size: 28px; }
.brand-label { font-family: var(--font-display); font-weight: 700; font-size: 16px; letter-spacing: 0.5px; }
.brand-school { font-size: 12px; opacity: 0.7; margin-top: 2px; }
.header-title {
  font-family: var(--font-display); font-size: 26px; font-weight: 800;
  margin: 0 0 20px; letter-spacing: -0.3px;
}
.header-meta {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px; background: rgba(255,255,255,0.08); border-radius: var(--radius-sm);
  padding: 16px 20px;
}
.meta-item { display: flex; flex-direction: column; gap: 2px; }
.meta-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; opacity: 0.6; }
.meta-value { font-family: var(--font-display); font-weight: 600; font-size: 15px; }

/* ─── Body ───────────────────────────────────────────────────────────────── */
.report-body { padding: 40px 48px; }

/* ─── Summary Card ───────────────────────────────────────────────────────── */
.summary-card {
  background: var(--accent-light); border-left: 4px solid var(--accent);
  border-radius: var(--radius-sm); padding: 20px 24px; margin-bottom: 32px;
}
.summary-label {
  font-family: var(--font-display); font-weight: 600; font-size: 12px;
  text-transform: uppercase; letter-spacing: 0.5px; color: var(--accent); margin-bottom: 8px;
}
.summary-text { font-size: 15px; line-height: 1.7; color: var(--text-secondary); margin: 0; }

/* ─── Sections ───────────────────────────────────────────────────────────── */
.section { margin-bottom: 36px; }
.section-header { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
.section-title {
  font-family: var(--font-display); font-size: 20px; font-weight: 700;
  color: var(--text-primary); white-space: nowrap;
}
.section-line { flex: 1; height: 1px; background: var(--border); }

/* ─── Badges ─────────────────────────────────────────────────────────────── */
.badge {
  display: inline-block; padding: 6px 16px; border-radius: 20px;
  font-family: var(--font-display); font-weight: 600; font-size: 14px; margin-bottom: 12px;
}
.badge-excellent { background: #dcfce7; color: #166534; }
.badge-good { background: #dbeafe; color: #1e40af; }
.badge-average { background: #fef3c7; color: #92400e; }
.badge-low { background: #fee2e2; color: #991b1b; }

.assessment-text { font-size: 14px; line-height: 1.7; color: var(--text-secondary); }

/* ─── Subject Cards ──────────────────────────────────────────────────────── */
.subject-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 16px; }
.subject-card {
  background: var(--bg-card-alt); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 20px; transition: box-shadow 0.2s;
}
.subject-card:hover { box-shadow: var(--shadow-md); }
.subject-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px; }
.subject-name { font-family: var(--font-display); font-weight: 600; font-size: 16px; }
.subject-trend { font-size: 13px; font-weight: 500; padding: 3px 10px; border-radius: 12px; white-space: nowrap; }
.trend-up { background: #dcfce7; color: #166534; }
.trend-down { background: #fee2e2; color: #991b1b; }
.trend-stable { background: #f1f5f9; color: #475569; }

.subject-scores { display: flex; align-items: baseline; gap: 12px; margin-bottom: 10px; flex-wrap: wrap; }
.score-main { font-family: var(--font-display); font-weight: 700; font-size: 28px; }
.score-high { color: var(--grade-high); }
.score-mid { color: var(--grade-mid); }
.score-low { color: var(--grade-low); }
.score-avg { font-size: 13px; color: var(--text-muted); }

.bar-wrap { display: flex; flex-direction: column; gap: 4px; margin-bottom: 12px; }
.bar-track { height: 8px; border-radius: 4px; background: var(--border-light); overflow: hidden; }
.bar-track-avg { height: 5px; }
.bar-fill { height: 100%; border-radius: 4px; transition: width 0.6s ease; }
.bar-fill-avg { background: var(--text-muted); opacity: 0.4; }
.subject-analysis { font-size: 13px; line-height: 1.6; color: var(--text-secondary); margin-bottom: 10px; }
.tip-box {
  background: var(--accent-light); border-radius: var(--radius-sm);
  padding: 10px 14px; font-size: 13px; color: var(--accent); line-height: 1.5;
}

/* ─── Strengths ──────────────────────────────────────────────────────────── */
.strength-list { display: flex; flex-direction: column; gap: 12px; }
.strength-item { display: flex; gap: 14px; align-items: flex-start; }
.strength-icon {
  width: 28px; height: 28px; border-radius: 50%; background: #dcfce7; color: #166534;
  display: flex; align-items: center; justify-content: center; font-weight: 700;
  font-size: 14px; flex-shrink: 0;
}
.strength-title { font-family: var(--font-display); font-weight: 600; font-size: 14px; color: var(--text-primary); }
.strength-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin-top: 2px; }

/* ─── Improvements ───────────────────────────────────────────────────────── */
.improve-list { display: flex; flex-direction: column; gap: 12px; }
.improve-card {
  background: var(--bg-card-alt); border: 1px solid var(--border);
  border-radius: var(--radius-sm); padding: 16px;
}
.improve-header { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.improve-icon { color: var(--grade-mid); font-size: 16px; }
.improve-title { font-family: var(--font-display); font-weight: 600; font-size: 14px; }
.improve-desc { font-size: 13px; color: var(--text-secondary); line-height: 1.5; margin-bottom: 8px; }
.action-box {
  background: var(--accent-light); border-radius: var(--radius-sm);
  padding: 8px 12px; font-size: 13px; color: var(--accent);
}

/* ─── Psychological Profile ──────────────────────────────────────────────── */
.psych-summary { font-size: 14px; line-height: 1.7; color: var(--text-secondary); margin-bottom: 16px; }
.psych-group-label {
  font-family: var(--font-display); font-weight: 600; font-size: 13px;
  text-transform: uppercase; letter-spacing: 0.3px; color: var(--text-muted);
  margin: 16px 0 8px;
}
.psych-list { display: flex; flex-direction: column; gap: 6px; }
.psych-item { font-size: 13px; color: var(--text-secondary); line-height: 1.5; }
.psych-bullet { color: var(--text-muted); margin-right: 6px; }
.psych-rec-bullet { color: var(--accent); margin-right: 6px; }

/* ─── Extracurricular ────────────────────────────────────────────────────── */
.extra-summary { font-size: 14px; color: var(--text-secondary); line-height: 1.7; margin-bottom: 12px; }
.extra-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.extra-card {
  background: var(--bg-card-alt); border: 1px solid var(--border);
  border-radius: 20px; padding: 8px 16px; font-size: 13px; color: var(--text-secondary);
}

/* ─── Recommendations ────────────────────────────────────────────────────── */
.rec-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
.rec-column { border-radius: var(--radius); padding: 20px; }
.rec-column-teacher { background: #eff6ff; }
.rec-column-parent { background: #f0fdf4; }
.rec-column-student { background: #faf5ff; }

.rec-col-header { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
.rec-col-icon { font-size: 18px; }
.rec-col-title { font-family: var(--font-display); font-weight: 600; font-size: 14px; }
.rec-item { font-size: 13px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 6px; }
.rec-bullet { margin-right: 6px; }
.rec-bullet-teacher { color: #3b82f6; }
.rec-bullet-parent { color: #22c55e; }
.rec-bullet-student { color: #a855f7; }

/* ─── Conclusion ─────────────────────────────────────────────────────────── */
.conclusion-card {
  background: var(--bg-card-alt); border: 1px solid var(--border);
  border-radius: var(--radius); padding: 24px; margin-top: 36px;
}
.conclusion-label {
  font-family: var(--font-display); font-weight: 600; font-size: 12px;
  text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin-bottom: 8px;
}
.conclusion-text { font-size: 15px; line-height: 1.7; color: var(--text-secondary); margin: 0; }

/* ─── Footer ─────────────────────────────────────────────────────────────── */
.report-footer {
  display: flex; justify-content: space-between; align-items: center;
  margin-top: 36px; padding-top: 20px; border-top: 1px solid var(--border);
  font-size: 12px; color: var(--text-muted); flex-wrap: wrap; gap: 8px;
}
.footer-right { display: flex; align-items: center; gap: 6px; }
.footer-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--accent); display: inline-block;
}

.empty-text { font-size: 13px; color: var(--text-muted); font-style: italic; }

/* ─── Responsive ─────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .controls-bar { padding: 10px 16px; }
  .btn-back { padding: 6px 12px; font-size: 13px; }
  .btn-download { padding: 6px 14px; font-size: 13px; }
  .report-doc { margin: 16px 8px; border-radius: 8px; }
  .report-header { padding: 24px 20px; }
  .header-title { font-size: 20px; }
  .header-meta { grid-template-columns: 1fr 1fr; gap: 8px; padding: 12px 16px; }
  .report-body { padding: 20px; }
  .subject-grid { grid-template-columns: 1fr; }
  .rec-grid { grid-template-columns: 1fr; }
  .section-title { font-size: 17px; }
  .score-main { font-size: 22px; }
}

@media (max-width: 480px) {
  .report-doc { margin: 8px 4px; }
  .report-header { padding: 20px 16px; }
  .header-title { font-size: 18px; }
  .header-meta { grid-template-columns: 1fr; }
  .report-body { padding: 16px; }
  .summary-card { padding: 16px; }
  .subject-card { padding: 16px; }
  .rec-column { padding: 16px; }
}

/* ─── Print ──────────────────────────────────────────────────────────────── */
@media print {
  .no-print { display: none !important; }
  .report-page { background: #fff !important; }
  .report-doc { box-shadow: none; border: none; border-radius: 0; margin: 0; }
  .report-header { padding: 24px; }
  .report-body { padding: 24px; }
  .section { break-inside: avoid; }
}
</style>
