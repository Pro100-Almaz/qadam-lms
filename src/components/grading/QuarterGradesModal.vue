<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[100000] flex items-stretch justify-center overscroll-contain bg-black/50 sm:items-center sm:overflow-y-auto sm:p-4"
        role="dialog"
        aria-modal="true"
        :aria-label="t('quarterGrades.title')"
        @mousedown="backdrop.onMouseDown"
        @mouseup="backdrop.onMouseUp"
      >
        <div class="flex h-dvh w-full max-w-7xl flex-col bg-white shadow-xl sm:h-auto sm:max-h-[92vh] sm:rounded-xl dark:bg-gray-900">
          <!-- Header -->
          <div class="flex items-start justify-between gap-3 border-b border-gray-200 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:gap-4 sm:px-6 sm:py-4 dark:border-gray-800">
            <div class="min-w-0">
              <h3 class="text-base font-semibold text-gray-800 sm:text-lg dark:text-white/90">{{ t('quarterGrades.title') }}</h3>
              <p class="mt-1 hidden text-sm text-gray-500 sm:block dark:text-gray-400">{{ t('quarterGrades.subtitle') }}</p>
            </div>
            <button
              type="button"
              class="-m-1 shrink-0 rounded-lg p-2.5 text-gray-400 hover:bg-gray-100 sm:m-0 sm:p-1.5 dark:hover:bg-white/5"
              :aria-label="t('common.cancel')"
              @click="close"
            >
              <X class="h-4 w-4" />
            </button>
          </div>

          <!-- Filters: all three are required and none is preselected. -->
          <div class="grid grid-cols-2 gap-3 border-b border-gray-200 px-4 py-3 sm:grid-cols-3 sm:gap-4 sm:px-6 sm:py-4 dark:border-gray-800">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {{ t('quarterGrades.classGroup') }} <span class="text-error-500">*</span>
              </label>
              <SelectMenu
                v-model="classGroupId"
                :options="classOptions"
                :placeholder="offeringsLoading ? t('common.loading') : t('quarterGrades.selectClass')"
                :aria-label="t('quarterGrades.classGroup')"
                :disabled="offeringsLoading || !classOptions.length || submitting"
                :trigger-class="TRIGGER_CLASS"
              />
              <p
                v-if="!offeringsLoading && !classOptions.length"
                class="mt-1.5 text-xs text-gray-500 dark:text-gray-400"
              >
                {{ t('quarterGrades.noOfferings') }}
              </p>
            </div>
            <div class="col-span-2 sm:col-span-1">
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {{ t('quarterGrades.subject') }} <span class="text-error-500">*</span>
              </label>
              <SelectMenu
                v-model="offeringId"
                :options="subjectOptions"
                :placeholder="t('quarterGrades.selectSubject')"
                :aria-label="t('quarterGrades.subject')"
                :disabled="!subjectOptions.length || submitting"
                :trigger-class="TRIGGER_CLASS"
              />
            </div>
            <div class="col-start-2 row-start-1 sm:col-start-auto sm:row-start-auto">
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {{ t('quarterGrades.quarter') }} <span class="text-error-500">*</span>
              </label>
              <SelectMenu
                v-model="quarter"
                :options="quarterOptions"
                :placeholder="t('quarterGrades.selectQuarter')"
                :aria-label="t('quarterGrades.quarter')"
                :disabled="submitting"
                :trigger-class="TRIGGER_CLASS"
              />
            </div>
          </div>

          <!-- Body -->
          <div class="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            <!-- Nothing picked yet -->
            <div v-if="!filtersComplete" class="py-14 text-center">
              <SlidersHorizontal class="mx-auto h-8 w-8 text-gray-400" />
              <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">{{ t('quarterGrades.pickFilters') }}</p>
            </div>

            <!-- Loading -->
            <div v-else-if="loading" class="space-y-3">
              <div v-for="index in 6" :key="index" class="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"></div>
            </div>

            <!-- Error -->
            <div v-else-if="loadError" class="py-12 text-center">
              <CircleAlert class="mx-auto h-8 w-8 text-error-500" />
              <p class="mt-3 text-sm text-error-600 dark:text-error-400">{{ loadError }}</p>
              <button
                type="button"
                class="mt-4 rounded-lg bg-error-500 px-4 py-2 text-sm font-medium text-white hover:bg-error-600"
                @click="loadSheet"
              >
                {{ t('quarterGrades.tryAgain') }}
              </button>
            </div>

            <div v-else-if="!students.length" class="py-14 text-center">
              <Users class="mx-auto h-8 w-8 text-gray-400" />
              <p class="mt-3 text-sm text-gray-500 dark:text-gray-400">{{ t('quarterGrades.noStudents') }}</p>
            </div>

            <template v-else>
              <!-- Save failures: what is wrong with whom, from the server's 400. -->
              <div
                v-if="submitError || studentErrorList.length"
                class="mb-3 rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-600 dark:border-error-500/20 dark:bg-error-500/10 dark:text-error-400"
                role="alert"
              >
                <p v-if="submitError" class="flex items-start gap-2">
                  <CircleAlert class="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{{ submitError }}</span>
                </p>
                <ul v-if="studentErrorList.length" class="space-y-1" :class="{ 'mt-2': submitError }">
                  <li v-for="item in studentErrorList" :key="item.id" class="flex items-start gap-2">
                    <CircleAlert v-if="!submitError" class="mt-0.5 h-4 w-4 shrink-0" />
                    <span><span class="font-medium">{{ item.name }}:</span> {{ item.message }}</span>
                  </li>
                </ul>
              </div>

              <!-- No assignments: nothing to weigh or estimate, the grades go straight in. -->
              <p
                v-if="!groups.length"
                class="mb-3 flex items-start gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400"
              >
                <ClipboardList class="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                {{ t('quarterGrades.noAssignments') }}
              </p>

              <!-- Toolbar: the weight total is the one thing that blocks submitting. -->
              <div v-else class="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  <span
                    class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium"
                    :class="
                      weightsValid
                        ? 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400'
                        : 'bg-error-50 text-error-600 dark:bg-error-500/10 dark:text-error-400'
                    "
                  >
                    <Check v-if="weightsValid" class="h-4 w-4" />
                    <TriangleAlert v-else class="h-4 w-4" />
                    {{ t('quarterGrades.weightsTotal') }}: {{ formatPercent(weightSum) }}%
                  </span>
                  <span v-if="!weightsValid" class="text-xs text-error-600 dark:text-error-400">
                    {{ t('quarterGrades.weightsMustSum') }}
                  </span>
                  <span class="text-xs text-gray-500 dark:text-gray-400">
                    {{ t('quarterGrades.meta', { students: students.length, assignments: assignmentCount }) }}
                  </span>
                </div>
                <div class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                  <button
                    type="button"
                    class="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium sm:py-1.5 text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                    :disabled="submitting"
                    @click="resetWeights"
                  >
                    <RotateCcw class="h-3.5 w-3.5" />
                    {{ t('quarterGrades.resetWeights') }}
                  </button>
                  <button
                    type="button"
                    class="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium sm:py-1.5 text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                    :disabled="submitting || !weightsValid"
                    @click="openFillDialog"
                  >
                    <Wand2 class="h-3.5 w-3.5" />
                    {{ t('quarterGrades.fillFromEstimates') }}
                  </button>
                </div>
              </div>

              <div ref="tableBox" class="-mx-4 overflow-x-auto overscroll-x-contain border-y border-gray-200 custom-scrollbar sm:mx-0 sm:max-w-full sm:rounded-xl sm:border dark:border-gray-800">
                <table class="w-full table-fixed border-separate border-spacing-0" :style="{ minWidth: tableMinWidth }">
                  <colgroup>
                    <col :style="{ width: `${columnWidths.name}px` }" />
                    <col
                      v-for="index in assignmentCount + fillerColumns"
                      :key="index"
                      :style="{ width: `${columnWidths.assignment}px` }"
                    />
                    <col :style="{ width: `${columnWidths.grade}px` }" />
                  </colgroup>
                  <thead>
                    <!-- Row 1: one group per category, its weight typed in the header. -->
                    <tr>
                      <th
                        :rowspan="groups.length ? 2 : 1"
                        scope="col"
                        class="border-b border-r sm:sticky sm:left-0 sm:z-20 border-gray-200 bg-gray-50 px-3 py-2 sm:px-4 text-left align-bottom text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400"
                      >
                        {{ t('quarterGrades.student') }}
                      </th>
                      <th
                        v-for="group in groups"
                        :key="group.category.code"
                        :colspan="group.assignments.length"
                        scope="colgroup"
                        class="overflow-hidden border-b border-l border-gray-200 bg-gray-50 px-1.5 py-2 sm:px-3 dark:border-gray-800 dark:bg-white/[0.03]"
                      >
                        <div class="flex min-w-0 flex-col items-center justify-center gap-1.5 sm:flex-row sm:gap-2">
                          <button
                            type="button"
                            class="flex max-w-full min-w-0 cursor-default items-center gap-1.5 rounded focus-visible:outline-2 focus-visible:outline-brand-500"
                            :aria-label="group.category.name"
                            @pointerdown="notePointer"
                            @pointerenter="hoverTip($event, { title: group.category.name })"
                            @pointerleave="leaveTip($event)"
                            @click="tapTip($event, { title: group.category.name })"
                          >
                            <span
                              class="h-2 w-2 shrink-0 rounded-full"
                              :class="CATEGORY_DOTS[group.category.code] ?? 'bg-gray-400'"
                            ></span>
                            <span class="truncate text-xs font-semibold text-gray-700 dark:text-gray-200">
                              {{ group.category.name }}
                            </span>
                          </button>
                          <label class="relative w-full max-w-20 shrink-0 sm:w-20">
                            <span class="sr-only">{{ t('quarterGrades.weightFor', { category: group.category.name }) }}</span>
                            <input
                              :value="weights[group.category.code]"
                              type="text"
                              inputmode="decimal"
                              autocomplete="off"
                              maxlength="6"
                              @input="weights[group.category.code] = keepPercent($event)"
                              :disabled="submitting"
                              class="h-9 w-full rounded-md border bg-white py-1 pl-1.5 pr-5 text-right text-base font-medium sm:h-8 sm:text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90"
                              :class="
                                weightInvalid(group.category.code)
                                  ? 'border-error-500'
                                  : 'border-gray-300 dark:border-gray-700'
                              "
                            />
                            <span class="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                          </label>
                        </div>
                      </th>
                      <!-- Blank slots that keep the grid's shape when there are few assignments. -->
                      <th
                        v-for="index in fillerColumns"
                        :key="`filler-${index}`"
                        :rowspan="groups.length ? 2 : 1"
                        aria-hidden="true"
                        class="border-b border-l border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/[0.03]"
                      ></th>
                      <th
                        :rowspan="groups.length ? 2 : 1"
                        scope="col"
                        class="border-b border-l sm:sticky sm:right-0 sm:z-20 border-gray-200 bg-gray-50 px-2 py-2 sm:px-3 text-center align-bottom text-[11px] font-medium uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400"
                      >
                        {{ t('quarterGrades.quarterGrade') }}
                        <span class="mt-0.5 block text-[10px] font-normal normal-case tracking-normal text-gray-400">
                          {{ t('quarterGrades.gradedCount', { graded: gradedCount, total: students.length }) }}
                        </span>
                      </th>
                    </tr>

                    <!-- Row 2: the assignments, category by category, oldest first. -->
                    <tr v-if="groups.length">
                      <template v-for="group in groups" :key="`titles-${group.category.code}`">
                        <th
                          v-for="(assignment, index) in group.assignments"
                          :key="assignment.id"
                          scope="col"
                          class="overflow-hidden border-b border-gray-200 px-1.5 py-2 text-center align-bottom sm:px-2 dark:border-gray-800"
                          :class="index === 0 ? 'border-l' : 'border-l border-l-gray-100 dark:border-l-gray-800/60'"
                        >
                          <button
                            type="button"
                            class="block w-full min-w-0 cursor-default rounded focus-visible:outline-2 focus-visible:outline-brand-500"
                            :aria-label="assignment.title"
                            @pointerdown="notePointer"
                            @pointerenter="hoverTip($event, assignmentTip(assignment))"
                            @pointerleave="leaveTip($event)"
                            @click="tapTip($event, assignmentTip(assignment))"
                          >
                            <span class="block truncate text-[11px] font-medium text-gray-700 dark:text-gray-300">
                              {{ assignment.title }}
                            </span>
                          </button>
                          <span class="block text-[10px] font-normal text-gray-500 dark:text-gray-400">
                            {{ formatAcademicDay(assignment.date) }} · / {{ assignment.max_grade }}
                          </span>
                          <span class="block text-[10px] font-normal text-gray-400 dark:text-gray-500">
                            {{ t('quarterGrades.perAssignment', { percent: formatPercent(assignmentWeight(group)) }) }}
                          </span>
                        </th>
                      </template>
                    </tr>
                  </thead>

                  <tbody>
                    <tr v-for="student in students" :key="student.id" class="group">
                      <th
                        scope="row"
                        class="border-b border-r sm:sticky sm:left-0 sm:z-10 border-gray-200 bg-white px-3 py-2 text-left text-xs font-medium sm:px-4 sm:text-sm text-gray-800 group-hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-white/90 dark:group-hover:bg-gray-800"
                      >
                        <span class="line-clamp-2 sm:line-clamp-none sm:block sm:truncate">{{ student.full_name }}</span>
                      </th>

                      <template v-for="group in groups" :key="`${student.id}-${group.category.code}`">
                        <td
                          v-for="(assignment, index) in group.assignments"
                          :key="assignment.id"
                          class="border-b border-gray-200 px-2 py-1.5 text-center group-hover:bg-gray-50 dark:border-gray-800 dark:group-hover:bg-white/5"
                          :class="index === 0 ? 'border-l' : 'border-l border-l-gray-100 dark:border-l-gray-800/60'"
                        >
                          <template v-if="student.grades[assignment.id] != null">
                            <span class="block text-sm font-medium tabular-nums text-gray-800 dark:text-white/90">
                              {{ student.grades[assignment.id] }}<span class="text-xs font-normal text-gray-400"> / {{ assignment.max_grade }}</span>
                            </span>
                            <span class="block text-[11px] tabular-nums text-gray-500 dark:text-gray-400">
                              {{ formatPercent(contribution(student, assignment, group)) }}%
                            </span>
                          </template>
                          <template v-else>
                            <span class="block text-sm text-gray-300 dark:text-gray-600">—</span>
                            <span class="block text-[11px] tabular-nums text-gray-300 dark:text-gray-600">0%</span>
                          </template>
                        </td>
                      </template>

                      <td
                        v-for="index in fillerColumns"
                        :key="`filler-${index}`"
                        aria-hidden="true"
                        class="border-b border-l border-gray-200 group-hover:bg-gray-50 dark:border-gray-800 dark:group-hover:bg-white/5"
                      ></td>

                      <!-- Teacher's grade on top, the weighted estimate under it. -->
                      <td
                        class="border-b border-l sm:sticky sm:right-0 sm:z-10 border-gray-200 bg-white px-2 py-1.5 text-center sm:px-3 group-hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:group-hover:bg-gray-800"
                      >
                        <input
                          :value="finalGrades[student.id]"
                          type="text"
                          inputmode="numeric"
                          pattern="[0-9]*"
                          autocomplete="off"
                          maxlength="1"
                          @input="finalGrades[student.id] = keepWholeNumber($event)"
                          :placeholder="hasEstimate ? String(suggestedGrade(estimate(student)) ?? '—') : '—'"
                          :disabled="submitting"
                          :aria-label="t('quarterGrades.gradeFor', { student: student.full_name })"
                          :title="
                            studentErrors[student.id] ||
                            (gradeInvalid(student.id) ? t('quarterGrades.gradeRange', { min: GRADE_MIN, max: GRADE_MAX }) : undefined)
                          "
                          class="mx-auto block h-9 w-14 rounded-md border px-1 text-center text-base font-semibold text-gray-800 placeholder:font-normal placeholder:text-gray-300 focus:border-brand-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500/10 sm:h-8 sm:w-16 sm:px-2 sm:text-sm dark:text-white/90 dark:placeholder:text-gray-600"
                          :class="
                            gradeInvalid(student.id) || studentErrors[student.id]
                              ? 'border-error-500 bg-white dark:bg-gray-900'
                              : gradeDirty(student.id)
                                ? 'border-brand-400 bg-brand-50 dark:border-brand-500 dark:bg-brand-500/10'
                                : 'border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900'
                          "
                        />
                        <span
                          v-if="groups.length"
                          class="mt-1 block text-[11px] font-medium tabular-nums"
                          :class="weightsValid ? estimateTone(estimate(student)) : 'text-gray-400'"
                        >
                          {{ t('quarterGrades.estimate', { percent: weightsValid ? formatPercent(estimate(student)) : '—' }) }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p v-if="groups.length" class="mt-3 text-xs text-gray-500 dark:text-gray-400">
                {{ t('quarterGrades.ungradedNote') }}
              </p>
            </template>
          </div>

          <!-- Footer -->
          <div class="flex flex-col gap-2 border-t border-gray-200 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-6 sm:py-4 dark:border-gray-800">
            <p v-if="submitHint" class="text-xs text-gray-500 dark:text-gray-400">{{ submitHint }}</p>
            <span v-else class="hidden sm:block"></span>
            <div class="grid grid-cols-2 gap-3 sm:flex sm:justify-end">
              <button
                type="button"
                :disabled="submitting"
                class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                @click="close"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                type="button"
                :disabled="!canSubmit"
                class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white sm:py-2 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                @click="submit"
              >
                <Loader2 v-if="submitting" class="h-4 w-4 animate-spin" />
                <Send v-else class="h-4 w-4" />
                {{ submitting ? t('quarterGrades.submitting') : t('quarterGrades.submit') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Fill dialog: where each grade starts, then the blanks are filled. -->
        <div
          v-if="fillOpen"
          class="fixed inset-0 z-[100001] flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          :aria-label="t('quarterGrades.fillTitle')"
          @mousedown="fillBackdrop.onMouseDown"
          @mouseup="fillBackdrop.onMouseUp"
        >
          <form
            class="max-h-[90dvh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:max-w-sm sm:rounded-xl dark:bg-gray-900"
            novalidate
            @submit.prevent="applyFill"
          >
            <div class="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 dark:border-gray-800">
              <div class="min-w-0">
                <h4 class="text-base font-semibold text-gray-800 dark:text-white/90">{{ t('quarterGrades.fillTitle') }}</h4>
                <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">{{ t('quarterGrades.fillSubtitle') }}</p>
              </div>
              <button
                type="button"
                class="-m-1 shrink-0 rounded-lg p-2.5 text-gray-400 hover:bg-gray-100 sm:m-0 sm:p-1.5 dark:hover:bg-white/5"
                :aria-label="t('common.cancel')"
                @click="fillOpen = false"
              >
                <X class="h-4 w-4" />
              </button>
            </div>

            <div class="space-y-3 px-5 py-4">
              <div v-for="grade in SCALE" :key="grade" class="flex items-center gap-3">
                <span
                  class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold"
                  :class="GRADE_BADGES[grade]"
                >
                  {{ grade }}
                </span>
                <label :for="`quarter-threshold-${grade}`" class="flex-1 text-sm text-gray-700 dark:text-gray-300">
                  {{ t('quarterGrades.gradeFrom', { grade }) }}
                </label>
                <div class="relative">
                  <input
                    :id="`quarter-threshold-${grade}`"
                    :value="thresholdDraft[grade]"
                    type="text"
                    inputmode="decimal"
                    autocomplete="off"
                    maxlength="6"
                    @input="thresholdDraft[grade] = keepPercent($event)"
                    class="h-11 w-28 rounded-lg border bg-white py-1 pl-3 pr-7 text-right text-base font-medium sm:h-9 sm:w-24 sm:text-sm text-gray-800 focus:border-brand-300 focus:outline-hidden focus:ring-2 focus:ring-brand-500/10 dark:bg-gray-900 dark:text-white/90"
                    :class="draftFieldInvalid(grade) ? 'border-error-500' : 'border-gray-300 dark:border-gray-700'"
                  />
                  <span class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                </div>
              </div>

              <p v-if="draftError" class="flex items-start gap-1.5 text-xs text-error-600 dark:text-error-400">
                <CircleAlert class="mt-px h-3.5 w-3.5 shrink-0" />
                {{ draftError }}
              </p>
              <template v-else>
                <p v-if="draftThresholds && draftThresholds[GRADE_MIN] > 0" class="text-xs text-gray-500 dark:text-gray-400">
                  {{ t('quarterGrades.belowLowest', { percent: formatPercent(draftThresholds[GRADE_MIN]) }) }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ t('quarterGrades.fillCount', { count: fillCount }) }}
                </p>
              </template>
            </div>

            <div class="grid grid-cols-2 gap-3 border-t border-gray-200 px-5 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:flex sm:justify-end sm:pb-3 dark:border-gray-800">
              <button
                type="button"
                class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-white/5"
                @click="fillOpen = false"
              >
                {{ t('common.cancel') }}
              </button>
              <button
                type="submit"
                :disabled="Boolean(draftError)"
                class="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50 sm:py-2"
              >
                {{ t('quarterGrades.apply') }}
              </button>
            </div>
          </form>
        </div>

        <!-- Full text of a truncated header: hover with a mouse, tap on touch. -->
        <div
          v-if="tip"
          role="tooltip"
          class="pointer-events-none fixed z-[100002] w-max max-w-64 -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg dark:bg-gray-700"
          :class="{ '-translate-y-full': tip.above }"
          :style="{ left: `${tip.x}px`, top: `${tip.y}px` }"
        >
          <p class="break-words font-medium">{{ tip.title }}</p>
          <p v-if="tip.detail" class="mt-0.5 text-gray-300">{{ tip.detail }}</p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Check,
  CircleAlert,
  ClipboardList,
  Loader2,
  RotateCcw,
  Send,
  SlidersHorizontal,
  TriangleAlert,
  Users,
  Wand2,
  X,
} from 'lucide-vue-next'
import SelectMenu, { type SelectOption } from '@/components/ui/SelectMenu.vue'
import { getAcademicYearsApi } from '@/api/academic'
import { readAnalyticsError, type AssignmentOfferingPickerItem } from '@/api/analytics'
import {
  createQuarterGradesApi,
  deleteQuarterGradesApi,
  getQuarterGradesApi,
  updateQuarterGradesApi,
  type QuarterGradeErrorBody,
  type QuarterGradeMap,
} from '@/api/quarterGrades'
import { getAllOfferingGradesApi } from '@/api/subjectAssignments'
import { useAssignmentCategories } from '@/composables/useAssignmentCategories'
import { useClassRoster } from '@/composables/useClassRoster'
import { useBackdropClose } from '@/composables/useBackdropClose'
import { useToast } from '@/composables/useToast'
import type { AcademicYear } from '@/types/academic'
import { formatAcademicDay } from '@/utils/gradeDates'
import { flattenErrorMessage } from '@/utils/fileDownload'

/**
 * Sets a class's quarter grades in one subject.
 *
 * The teacher weighs the categories the quarter's assignments fall into — only
 * the ones that actually occur, so a subject with no homework has no homework
 * weight to enter — and each student's weighted percentage is estimated live.
 * Within a category every assignment counts equally, whatever its max points:
 * a cell shows the points and, under them, how much of the 100% they earned.
 *
 * The estimate only advises, and the weights are not saved anywhere. What is
 * saved is the grade the teacher types, through `/offerings/{id}/quarter-grades/`.
 *
 * The marks come from `/offerings/{id}/subject-grades/`, bounded by the
 * quarter's dates from the academic year, laid over the class roster — so
 * every student has a row, including the ones without a single mark.
 */
const props = defineProps<{
  open: boolean
  /** The page's `/analytics/assignment-offerings/` picker. */
  offerings: AssignmentOfferingPickerItem[]
  offeringsLoading?: boolean
}>()

const emit = defineEmits<{ (e: 'close'): void }>()

const { t } = useI18n()
const { success } = useToast()
const { categories: categoryList, load: loadCategories } = useAssignmentCategories()
const backdrop = useBackdropClose(close)

const GRADE_MIN = 2
const GRADE_MAX = 5

/** Same hues as `GradebookTable`, so a category keeps one colour. */
const CATEGORY_DOTS: Record<string, string> = {
  lesson: 'bg-blue-light-500',
  exam: 'bg-warning-500',
  final: 'bg-error-500',
  homework: 'bg-purple-500',
}

const TRIGGER_CLASS =
  'flex h-11 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-4 text-left text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90'

// ─── Filters ─────────────────────────────────────────────────────────────────

const classGroupId = ref<number | string | null>(null)
/** The subject picker's value is the offering itself — class + subject is one. */
const offeringId = ref<number | string | null>(null)
const quarter = ref<number | string | null>(null)

/**
 * Only offerings the caller teaches: writing is refused to anyone else, the
 * class's homeroom teacher included.
 */
const gradableOfferings = computed(() => props.offerings.filter(offering => offering.access !== 'homeroom'))

const classOptions = computed<SelectOption[]>(() => {
  const seen = new Map<number, string>()
  for (const offering of gradableOfferings.value) seen.set(offering.class_group_id, offering.class_group)
  return [...seen]
    .sort((a, b) => a[1].localeCompare(b[1], undefined, { numeric: true }))
    .map(([value, label]) => ({ value, label }))
})

const subjectOptions = computed<SelectOption[]>(() =>
  gradableOfferings.value
    .filter(offering => offering.class_group_id === Number(classGroupId.value))
    .sort((a, b) => a.subject.localeCompare(b.subject))
    .map(offering => ({ value: offering.id, label: offering.subject })),
)

const selectedOffering = computed(
  () => gradableOfferings.value.find(offering => offering.id === Number(offeringId.value)) ?? null,
)

const quarterOptions = computed<SelectOption[]>(() =>
  [1, 2, 3, 4].map(value => ({ value, label: t('quarterGrades.quarterOption', { quarter: value }) })),
)

const filtersComplete = computed(() => Boolean(selectedOffering.value && quarter.value))

// A subject the new class is not taught is not a valid pick any more.
watch(classGroupId, () => {
  if (!subjectOptions.value.some(option => option.value === offeringId.value)) offeringId.value = null
})

// ─── Academic year ───────────────────────────────────────────────────────────

/** Fetched once per modal instance; quarter dates do not move mid-session. */
const academicYears = ref<AcademicYear[] | null>(null)

async function loadAcademicYears(): Promise<AcademicYear[]> {
  if (!academicYears.value) academicYears.value = (await getAcademicYearsApi()).data
  return academicYears.value
}

// ─── Sheet ───────────────────────────────────────────────────────────────────

interface SheetCategory {
  code: string
  name: string
}

interface SheetAssignment {
  id: number
  title: string
  category: string
  date: string
  max_grade: number
}

interface SheetStudent {
  /** Student profile id — the key the quarter-grade writes take. */
  id: number
  full_name: string
  /** Points per assignment id; `null` where ungraded. */
  grades: Record<number, number | null>
}

interface Sheet {
  offeringId: number
  quarter: number
  assignments: SheetAssignment[]
  students: SheetStudent[]
}

const classRoster = useClassRoster()
const sheet = ref<Sheet | null>(null)
const loading = ref(false)
const loadError = ref('')
/** Drops a response that lands after the filters moved on. */
let loadToken = 0

interface CategoryGroup {
  category: SheetCategory
  assignments: SheetAssignment[]
}

const students = computed<SheetStudent[]>(() => sheet.value?.students ?? [])

/**
 * The categories this sheet actually has, in `/assignment-categories/` order,
 * each with its assignments oldest first. A code the list does not know — it
 * failed to load, or was added since — still gets a group, after the rest.
 */
const groups = computed<CategoryGroup[]>(() => {
  if (!sheet.value) return []
  const known = categoryList.value.map(category => ({ code: category.code, name: category.name }))
  const extra = [...new Set(sheet.value.assignments.map(assignment => assignment.category))]
    .filter(code => !known.some(category => category.code === code))
    .map(code => ({ code, name: code }))
  const assignments = sheet.value.assignments
  return [...known, ...extra]
    .map(category => ({
      category,
      assignments: assignments
        .filter(assignment => assignment.category === category.code)
        .sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id),
    }))
    .filter(group => group.assignments.length > 0)
})

const assignmentCount = computed(() => groups.value.reduce((sum, group) => sum + group.assignments.length, 0))

// ─── Column layout ───────────────────────────────────────────────────────────

/** Same breakpoint as Tailwind's `sm`, where the columns widen and pin. */
const wideQuery = typeof window !== 'undefined' ? window.matchMedia('(min-width: 640px)') : null
const isWide = ref(wideQuery?.matches ?? true)
function onWideChange(event: MediaQueryListEvent) {
  isWide.value = event.matches
}
wideQuery?.addEventListener('change', onWideChange)

const columnWidths = computed(() =>
  isWide.value ? { name: 208, assignment: 96, grade: 96 } : { name: 128, assignment: 88, grade: 80 },
)

/** The scroll box's width, watched so the blank grid fills exactly what is left. */
const tableBox = ref<HTMLElement | null>(null)
const boxWidth = ref(0)
const boxObserver =
  typeof ResizeObserver !== 'undefined'
    ? new ResizeObserver(entries => {
        boxWidth.value = entries[0]?.contentRect.width ?? 0
      })
    : null

// The box only exists while a sheet is shown, so it is observed as it comes and goes.
watch(tableBox, (box, previous) => {
  if (previous) boxObserver?.unobserve(previous)
  if (box) boxObserver?.observe(box)
})

/**
 * A quarter with two assignments would otherwise stretch them into banners, so
 * the grid is padded with blank columns of the same width up to the box's
 * edge. A wide sheet gets none; it scrolls.
 */
const fillerColumns = computed(() => {
  const { name, assignment, grade } = columnWidths.value
  const free = boxWidth.value - name - grade - assignmentCount.value * assignment
  return Math.max(0, Math.floor(free / assignment))
})

/**
 * `table-layout: fixed` keeps the widths above from growing with a long title;
 * this floor keeps them from being squeezed on a narrow screen instead of scrolling.
 */
const tableMinWidth = computed(() => {
  const { name, assignment, grade } = columnWidths.value
  return `${name + (assignmentCount.value + fillerColumns.value) * assignment + grade}px`
})

async function loadSheet() {
  const offering = selectedOffering.value
  const quarterNumber = Number(quarter.value)
  submitError.value = ''
  studentErrors.value = {}
  if (!offering || !quarterNumber) {
    sheet.value = null
    return
  }
  const token = ++loadToken
  loading.value = true
  loadError.value = ''
  try {
    const years = await loadAcademicYears()
    const year = years.find(item => item.id === offering.academic_year_id) ?? years.find(item => item.is_active)
    const range = year?.quarters?.find(item => item.quarter === quarterNumber)
    if (!range?.start || !range?.end) {
      if (token !== loadToken) return
      sheet.value = null
      loadError.value = t('quarterGrades.quarterDatesMissing', { quarter: quarterNumber })
      return
    }

    const [assignments, roster, { data: saved }] = await Promise.all([
      getAllOfferingGradesApi(offering.id, { date_from: range.start, date_to: range.end }),
      classRoster.get(offering.class_group_id),
      getQuarterGradesApi(offering.id, quarterNumber),
      loadCategories(),
    ])
    if (token !== loadToken) return

    // Switched-off assignments come back too; they do not count here.
    const columns = assignments.filter(assignment => assignment.is_active !== false)
    // Assignment id → student id → points, from the stored rows only.
    const points = new Map(
      columns.map(assignment => [assignment.id, new Map(assignment.grades.map(row => [row.student, row.grade]))]),
    )

    sheet.value = {
      offeringId: offering.id,
      quarter: quarterNumber,
      assignments: columns.map(assignment => ({
        id: assignment.id,
        title: assignment.title,
        category: assignment.category,
        date: assignment.date,
        max_grade: assignment.max_grade,
      })),
      students: roster.map(student => ({
        id: student.id,
        full_name: student.full_name,
        grades: Object.fromEntries(
          columns.map(assignment => [assignment.id, points.get(assignment.id)?.get(student.id) ?? null]),
        ),
      })),
    }
    applySaved(saved.map(row => [row.student, row.grade]))
    finalGrades.value = Object.fromEntries(
      sheet.value.students.map(student => [student.id, savedGrades.value[student.id]?.toString() ?? '']),
    )
    resetWeights()
  } catch (error) {
    if (token !== loadToken) return
    sheet.value = null
    loadError.value = readAnalyticsError(error) || t('quarterGrades.loadError')
  } finally {
    if (token === loadToken) loading.value = false
  }
}

watch([offeringId, quarter], loadSheet)

// ─── Typed numbers ───────────────────────────────────────────────────────────

/**
 * The inputs are plain text, so nothing but what each one takes can be typed
 * or pasted: the field is cleaned in place and the clean text is returned.
 */
function cleanInput(event: Event, clean: (raw: string) => string): string {
  const input = event.target as HTMLInputElement
  const value = clean(input.value)
  if (input.value !== value) input.value = value
  return value
}

/** Grades: digits only. `maxlength` keeps it to one. */
function keepWholeNumber(event: Event): string {
  return cleanInput(event, raw => raw.replace(/\D/g, ''))
}

/**
 * Weights and thresholds: a percentage with up to two decimals, since an equal
 * three-way split is 33.33. A comma is taken as the decimal point, as phones
 * with a ru/kz keypad type one.
 */
function keepPercent(event: Event): string {
  return cleanInput(event, raw => {
    const [whole = '', ...rest] = raw.replace(/,/g, '.').replace(/[^\d.]/g, '').split('.')
    return rest.length ? `${whole.slice(0, 3)}.${rest.join('').slice(0, 2)}` : whole.slice(0, 3)
  })
}

// ─── Header tooltip ──────────────────────────────────────────────────────────

/**
 * Column widths are fixed, so long titles are cut with an ellipsis. One shared
 * tooltip shows the full text: on hover for a mouse, and on tap for touch,
 * where there is no hover — a second tap, a tap elsewhere or a scroll closes it.
 */
interface TipContent {
  title: string
  detail?: string
}

const tip = ref<(TipContent & { x: number; y: number; above: boolean }) | null>(null)
let tipAnchor: HTMLElement | null = null
/** The pointer that started the current click; `click` itself does not say. */
let lastPointer = ''

function notePointer(event: PointerEvent) {
  lastPointer = event.pointerType
}

function assignmentTip(assignment: SheetAssignment): TipContent {
  return { title: assignment.title, detail: `${formatAcademicDay(assignment.date)} · / ${assignment.max_grade}` }
}

function showTip(anchor: HTMLElement, content: TipContent) {
  const rect = anchor.getBoundingClientRect()
  const half = Math.min(128, (window.innerWidth - 16) / 2)
  const x = Math.min(Math.max(rect.left + rect.width / 2, 8 + half), window.innerWidth - 8 - half)
  // Below the header unless that would run off the bottom of the screen.
  const above = rect.bottom + 96 > window.innerHeight
  tipAnchor = anchor
  tip.value = { ...content, x, y: above ? rect.top - 6 : rect.bottom + 6, above }
}

function hideTip() {
  tip.value = null
  tipAnchor = null
}

function hoverTip(event: PointerEvent, content: TipContent) {
  if (event.pointerType === 'mouse') showTip(event.currentTarget as HTMLElement, content)
}

function leaveTip(event: PointerEvent) {
  if (event.pointerType === 'mouse') hideTip()
}

function tapTip(event: MouseEvent, content: TipContent) {
  if (lastPointer === 'mouse') return
  const anchor = event.currentTarget as HTMLElement
  if (tipAnchor === anchor) hideTip()
  else showTip(anchor, content)
}

function onOutsidePointer(event: Event) {
  if (tipAnchor && !tipAnchor.contains(event.target as Node)) hideTip()
}

watch(
  () => Boolean(tip.value),
  shown => {
    const method = shown ? 'addEventListener' : 'removeEventListener'
    document[method]('pointerdown', onOutsidePointer, true)
    // The table scrolls on both axes, and the header would leave the tip behind.
    window[method]('scroll', hideTip, true)
    window[method]('resize', hideTip)
  },
)

onBeforeUnmount(() => {
  hideTip()
  boxObserver?.disconnect()
  wideQuery?.removeEventListener('change', onWideChange)
})

// ─── Weights ─────────────────────────────────────────────────────────────────

/** Category code → weight as typed, in percent. Strings, since inputs can be blank. */
const weights = ref<Record<string, string | number>>({})

function parseWeight(code: string): number {
  const raw = weights.value[code]
  if (raw === '' || raw == null) return NaN
  return Number(raw)
}

function weightInvalid(code: string): boolean {
  const value = parseWeight(code)
  return !Number.isFinite(value) || value < 0 || value > 100
}

const weightSum = computed(() =>
  groups.value.reduce((sum, group) => {
    const value = parseWeight(group.category.code)
    return sum + (Number.isFinite(value) ? value : 0)
  }, 0),
)

const weightsValid = computed(
  () =>
    groups.value.length > 0 &&
    groups.value.every(group => !weightInvalid(group.category.code)) &&
    Math.abs(weightSum.value - 100) < 0.01,
)

/**
 * Equal shares to two decimals; whatever rounding leaves over goes to the last
 * category, so the total is exactly 100 (33.33 / 33.33 / 33.34).
 */
/** Whether there is an estimate to show — no assignments, nothing to estimate. */
const hasEstimate = computed(() => groups.value.length > 0 && weightsValid.value)

/** Weights block saving only when there are categories to weigh. */
const weightsBlockSubmit = computed(() => groups.value.length > 0 && !weightsValid.value)

function resetWeights() {
  const codes = groups.value.map(group => group.category.code)
  if (!codes.length) {
    weights.value = {}
    return
  }
  const share = Math.floor(10000 / codes.length) / 100
  const last = Math.round((100 - share * (codes.length - 1)) * 100) / 100
  weights.value = Object.fromEntries(codes.map((code, index) => [code, index === codes.length - 1 ? last : share]))
}

function assignmentWeight(group: CategoryGroup): number {
  const weight = parseWeight(group.category.code)
  return Number.isFinite(weight) ? weight / group.assignments.length : 0
}

/** Share of the 100% this mark earned. A missing mark earns nothing. */
function contribution(student: SheetStudent, assignment: SheetAssignment, group: CategoryGroup): number {
  const points = student.grades[assignment.id]
  if (points == null || !assignment.max_grade) return 0
  return (points / assignment.max_grade) * assignmentWeight(group)
}

function estimate(student: SheetStudent): number {
  return groups.value.reduce(
    (sum, group) =>
      sum + group.assignments.reduce((inner, assignment) => inner + contribution(student, assignment, group), 0),
    0,
  )
}

// ─── Grade scale ─────────────────────────────────────────────────────────────

/** Highest grade first — the order thresholds are checked and listed in. */
const SCALE = [5, 4, 3, 2] as const
type ScaleGrade = (typeof SCALE)[number]
type Thresholds = Record<ScaleGrade, number>

const GRADE_BADGES: Record<ScaleGrade, string> = {
  5: 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-400',
  4: 'bg-blue-light-50 text-blue-light-700 dark:bg-blue-light-500/10 dark:text-blue-light-400',
  3: 'bg-warning-50 text-warning-700 dark:bg-warning-500/10 dark:text-warning-400',
  2: 'bg-error-50 text-error-700 dark:bg-error-500/10 dark:text-error-400',
}

/**
 * Where each grade starts, in percent. Defaults to the criteria-based
 * conversion; the fill dialog changes it, and it then also drives the
 * suggestions and estimate colours in the table. Kept across sheets.
 */
const thresholds = ref<Thresholds>({ 5: 85, 4: 65, 3: 40, 2: 0 })

/** `null` below the lowest threshold — no grade is suggested there. */
function gradeFor(percent: number, scale: Thresholds): ScaleGrade | null {
  return SCALE.find(grade => percent >= scale[grade]) ?? null
}

function suggestedGrade(percent: number): ScaleGrade | null {
  return gradeFor(percent, thresholds.value)
}

function estimateTone(percent: number): string {
  const grade = suggestedGrade(percent)
  if (grade === 5) return 'text-success-600 dark:text-success-400'
  if (grade === 4) return 'text-blue-light-600 dark:text-blue-light-400'
  if (grade === 3) return 'text-warning-600 dark:text-warning-400'
  return 'text-error-600 dark:text-error-400'
}

function formatPercent(value: number): string {
  return (Math.round(value * 10) / 10).toLocaleString(undefined, { maximumFractionDigits: 1 })
}

// ─── Quarter grades ──────────────────────────────────────────────────────────

/** Student id → grade as typed. */
const finalGrades = ref<Record<number, string | number>>({})
/** Student id → grade on record. What the typed grades are diffed against. */
const savedGrades = ref<Record<number, number>>({})

function applySaved(rows: [number, number][]) {
  savedGrades.value = Object.fromEntries(rows)
}

function readGrade(studentId: number): number | null {
  const raw = finalGrades.value[studentId]
  if (raw === '' || raw == null) return null
  return Number(raw)
}

function gradeInvalid(studentId: number): boolean {
  const value = readGrade(studentId)
  return value != null && (!Number.isInteger(value) || value < GRADE_MIN || value > GRADE_MAX)
}

function gradeDirty(studentId: number): boolean {
  return readGrade(studentId) !== (savedGrades.value[studentId] ?? null)
}

const gradedCount = computed(() => students.value.filter(student => readGrade(student.id) != null).length)

/**
 * What submitting would send, split the way the API splits it: a grade with
 * nothing on record is created, a different one is changed, a cleared one is
 * deleted.
 */
const changes = computed(() => {
  const create: QuarterGradeMap = {}
  const update: QuarterGradeMap = {}
  const remove: number[] = []
  for (const student of students.value) {
    if (!gradeDirty(student.id) || gradeInvalid(student.id)) continue
    const typed = readGrade(student.id)
    const saved = savedGrades.value[student.id]
    if (typed == null) remove.push(student.id)
    else if (saved == null) create[student.id] = typed
    else update[student.id] = typed
  }
  return {
    create,
    update,
    remove,
    count: Object.keys(create).length + Object.keys(update).length + remove.length,
  }
})

// ─── Fill from estimates ─────────────────────────────────────────────────────

const fillOpen = ref(false)
/** The dialog's inputs as typed; only applied thresholds reach the table. */
const thresholdDraft = ref<Record<ScaleGrade, string | number>>({ ...thresholds.value })
const fillBackdrop = useBackdropClose(() => {
  fillOpen.value = false
})

function openFillDialog() {
  if (!weightsValid.value) return
  thresholdDraft.value = { ...thresholds.value }
  fillOpen.value = true
}

function readDraft(grade: ScaleGrade): number {
  const raw = thresholdDraft.value[grade]
  return raw === '' || raw == null ? NaN : Number(raw)
}

function draftFieldInvalid(grade: ScaleGrade): boolean {
  const value = readDraft(grade)
  return !Number.isFinite(value) || value < 0 || value > 100
}

/** The draft as numbers, or `null` while any field is blank or out of range. */
const draftThresholds = computed<Thresholds | null>(() => {
  if (SCALE.some(draftFieldInvalid)) return null
  return Object.fromEntries(SCALE.map(grade => [grade, readDraft(grade)])) as Thresholds
})

const draftError = computed(() => {
  const scale = draftThresholds.value
  if (!scale) return t('quarterGrades.thresholdRange')
  // Each grade has to start strictly above the one under it, or a band is empty.
  const ordered = SCALE.every((grade, index) => index === SCALE.length - 1 || scale[grade] > scale[SCALE[index + 1]])
  return ordered ? '' : t('quarterGrades.thresholdOrder')
})

const fillCount = computed(() => {
  const scale = draftThresholds.value
  if (!scale) return 0
  return students.value.filter(
    student => readGrade(student.id) == null && gradeFor(estimate(student), scale) != null,
  ).length
})

/**
 * Saves the thresholds and fills only the blanks, so nothing the teacher typed
 * is overwritten. A student below the lowest threshold stays blank.
 */
function applyFill() {
  const scale = draftThresholds.value
  if (!scale || draftError.value || !weightsValid.value) return
  thresholds.value = scale
  const next = { ...finalGrades.value }
  for (const student of students.value) {
    if (readGrade(student.id) != null) continue
    const grade = gradeFor(estimate(student), scale)
    if (grade != null) next[student.id] = String(grade)
  }
  finalGrades.value = next
  fillOpen.value = false
}

// ─── Submit ──────────────────────────────────────────────────────────────────

const submitting = ref(false)
/** A failure not tied to one student: 403, a bad quarter, a network error. */
const submitError = ref('')
/** Student id → the server's reason that student's grade was refused. */
const studentErrors = ref<Record<number, string>>({})

const studentErrorList = computed(() =>
  students.value
    .filter(student => studentErrors.value[student.id])
    .map(student => ({ id: student.id, name: student.full_name, message: studentErrors.value[student.id] })),
)

const sheetReady = computed(
  () => filtersComplete.value && !loading.value && !!sheet.value && students.value.length > 0,
)

/** Why a loaded sheet cannot be submitted yet, or what submitting would do. */
const submitHint = computed(() => {
  if (!sheetReady.value) return ''
  if (weightsBlockSubmit.value) return t('quarterGrades.weightsMustSum')
  if (students.value.some(student => gradeInvalid(student.id)))
    return t('quarterGrades.gradeRange', { min: GRADE_MIN, max: GRADE_MAX })
  if (!changes.value.count) return t('quarterGrades.noChanges')
  return t('quarterGrades.changesSummary', {
    create: Object.keys(changes.value.create).length,
    update: Object.keys(changes.value.update).length,
    remove: changes.value.remove.length,
  })
})

const canSubmit = computed(
  () =>
    sheetReady.value &&
    !weightsBlockSubmit.value &&
    changes.value.count > 0 &&
    !students.value.some(student => gradeInvalid(student.id)) &&
    !submitting.value,
)

/** Splits a 400 into per-student messages and whatever is left over. */
function readSubmitError(error: unknown): { perStudent: Record<number, string>; general: string } {
  const response = (error as { response?: { status?: number; data?: unknown } })?.response
  const body = (response?.data ?? null) as QuarterGradeErrorBody | null
  const perStudent: Record<number, string> = {}
  if (body && typeof body === 'object' && body.grades && typeof body.grades === 'object') {
    for (const [key, messages] of Object.entries(body.grades)) {
      const id = Number(key)
      if (Number.isInteger(id)) perStudent[id] = flattenErrorMessage(messages)
    }
  }
  const rest =
    body && typeof body === 'object' ? flattenErrorMessage({ ...body, grades: undefined }) : ''
  const general =
    rest || (Object.keys(perStudent).length ? '' : response ? t('quarterGrades.saveFailed') : t('quarterGrades.networkError'))
  return { perStudent, general }
}

/**
 * POST, then PATCH, then DELETE — each only when it has something to send.
 * Each call is all-or-nothing on the server, but the three together are not:
 * if a later one fails, the earlier ones stand. So the record is re-read after
 * any failure, and the teacher's typed values are kept for them to fix.
 */
async function submit() {
  const current = sheet.value
  if (!canSubmit.value || !current) return
  const { create, update, remove } = changes.value
  const { offeringId: id, quarter: quarterNumber } = current

  submitting.value = true
  submitError.value = ''
  studentErrors.value = {}
  let savedSomething = false
  try {
    if (Object.keys(create).length) {
      await createQuarterGradesApi(id, quarterNumber, create)
      savedSomething = true
    }
    if (Object.keys(update).length) {
      await updateQuarterGradesApi(id, quarterNumber, update)
      savedSomething = true
    }
    if (remove.length) {
      await deleteQuarterGradesApi(id, quarterNumber, remove)
    }
    success(t('quarterGrades.submitted'))
    emit('close')
  } catch (error) {
    const { perStudent, general } = readSubmitError(error)
    studentErrors.value = perStudent
    submitError.value = [general, savedSomething ? t('quarterGrades.partialSaved') : '']
      .filter(Boolean)
      .join(' ')
    if (savedSomething) await refreshSaved(id, quarterNumber)
  } finally {
    submitting.value = false
  }
}

/** Re-reads what is on record without touching what the teacher typed. */
async function refreshSaved(id: number, quarterNumber: number) {
  try {
    const { data } = await getQuarterGradesApi(id, quarterNumber)
    if (sheet.value?.offeringId === id && sheet.value.quarter === quarterNumber) {
      applySaved(data.map(row => [row.student, row.grade]))
    }
  } catch {
    // The banner already says something went wrong; a stale diff is the worst case.
  }
}

// ─── Open / close ────────────────────────────────────────────────────────────

function close() {
  if (submitting.value) return
  fillOpen.value = false
  hideTip()
  emit('close')
}

watch(
  () => props.open,
  isOpen => {
    if (!isOpen) return
    // No defaults: every opening starts from an empty set of filters.
    loadToken++
    classGroupId.value = null
    offeringId.value = null
    quarter.value = null
    sheet.value = null
    loading.value = false
    loadError.value = ''
    submitError.value = ''
    studentErrors.value = {}
  },
  { immediate: true },
)
</script>
