import { ref, reactive } from 'vue'

interface UseFormOptions<T extends Record<string, unknown>> {
  initialValues: T
  submitFn: (values: T) => Promise<void>
  validate?: (values: T) => Record<string, string>
}

export function useForm<T extends Record<string, unknown>>(options: UseFormOptions<T>) {
  const values = reactive({ ...options.initialValues }) as T
  const errors = ref<Record<string, string>>({})
  const isSubmitting = ref(false)
  const isSubmitted = ref(false)

  function setError(field: string, message: string) {
    errors.value[field] = message
  }

  function clearErrors() {
    errors.value = {}
  }

  async function submit() {
    clearErrors()

    if (options.validate) {
      const validationErrors = options.validate(values)
      if (Object.keys(validationErrors).length > 0) {
        errors.value = validationErrors
        return false
      }
    }

    isSubmitting.value = true
    try {
      await options.submitFn(values)
      isSubmitted.value = true
      return true
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const resp = (error as { response: { data: Record<string, string[]> } }).response
        if (resp?.data) {
          for (const [field, messages] of Object.entries(resp.data)) {
            if (Array.isArray(messages)) {
              errors.value[field] = messages[0]
            }
          }
        }
      }
      return false
    } finally {
      isSubmitting.value = false
    }
  }

  function reset() {
    Object.assign(values, options.initialValues)
    clearErrors()
    isSubmitted.value = false
  }

  return { values, errors, isSubmitting, isSubmitted, submit, reset, setError, clearErrors }
}
