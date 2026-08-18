import { computed, ref } from 'vue'
import { getTeacherMyClassesApi } from '@/api/teacherDashboard'
import type { TeacherClassGroup } from '@/types/teacherDashboard'

export interface TeacherOfferingOption {
  offeringId: number
  classGroupId: number
  displayName: string
  gradeLevel: number
}

export interface TeacherSubjectOfferings {
  subjectName: string
  offerings: TeacherOfferingOption[]
}

export interface TeacherClassOption {
  classGroupId: number
  displayName: string
}

/**
 * The classes the signed-in teacher actually teaches, inverted into
 * subject → offerings. Homework is created per offering, and the API rejects
 * offerings the caller does not teach, so this is the only safe option source.
 */
export function useTeacherOfferings() {
  const classes = ref<TeacherClassGroup[]>([])
  const loading = ref(false)
  const loadError = ref(false)

  async function load(): Promise<void> {
    loading.value = true
    loadError.value = false
    try {
      const { data } = await getTeacherMyClassesApi()
      classes.value = Array.isArray(data) ? data : []
    } catch {
      classes.value = []
      loadError.value = true
    } finally {
      loading.value = false
    }
  }

  const subjectGroups = computed<TeacherSubjectOfferings[]>(() => {
    const grouped = new Map<string, TeacherOfferingOption[]>()
    classes.value.forEach(classGroup => {
      classGroup.subjects.forEach(subject => {
        const offering: TeacherOfferingOption = {
          offeringId: subject.offering_id,
          classGroupId: classGroup.class_group_id,
          displayName: classGroup.display_name,
          gradeLevel: classGroup.grade_level,
        }
        const existing = grouped.get(subject.subject_name)
        if (existing) existing.push(offering)
        else grouped.set(subject.subject_name, [offering])
      })
    })
    return [...grouped.entries()]
      .map(([subjectName, offerings]) => ({
        subjectName,
        offerings: offerings.sort(
          (a, b) => a.gradeLevel - b.gradeLevel || a.displayName.localeCompare(b.displayName),
        ),
      }))
      .sort((a, b) => a.subjectName.localeCompare(b.subjectName))
  })

  const classOptions = computed<TeacherClassOption[]>(() =>
    classes.value
      .slice()
      .sort((a, b) => a.grade_level - b.grade_level || a.display_name.localeCompare(b.display_name))
      .map(classGroup => ({
        classGroupId: classGroup.class_group_id,
        displayName: classGroup.display_name,
      })),
  )

  return { classes, loading, loadError, load, subjectGroups, classOptions }
}
