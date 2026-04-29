export type VacancyType = 'PERMANENT' | 'CONTRACT' | 'INTERNSHIP' | 'VACATION_JOB'

export type FormState = {
  currentStep: number
  isDirty: boolean
  // Step 1: Basic Info
  title: string
  description: string
  vacancyType: VacancyType | ''
  // Step 2: Location & Sector
  stateId: number | null
  sectorId: string
  occupationId: string
  // Step 3: Requirements
  minimumEducationLevelId: string
  slotsAvailable: number
  deadline: string
  isMandatoryAdvertised: boolean
  // Step 4: Screening Questions
  applicationForm: Record<string, unknown> | null
}

export type FieldKey = Exclude<keyof FormState, 'currentStep' | 'isDirty'>

export type Action =
  | { type: 'SET_FIELD'; field: FieldKey; value: FormState[FieldKey] }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'RESET' }

export const TOTAL_STEPS = 5

export const initialState: FormState = {
  currentStep: 0,
  isDirty: false,
  title: '',
  description: '',
  vacancyType: '',
  stateId: null,
  sectorId: '',
  occupationId: '',
  minimumEducationLevelId: '',
  slotsAvailable: 1,
  deadline: '',
  isMandatoryAdvertised: false,
  applicationForm: null,
}

export function vacancyFormReducer(state: FormState, action: Action): FormState {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value, isDirty: true }
    case 'NEXT_STEP':
      return state.currentStep < TOTAL_STEPS - 1
        ? { ...state, currentStep: state.currentStep + 1 }
        : state
    case 'PREV_STEP':
      return state.currentStep > 0
        ? { ...state, currentStep: state.currentStep - 1 }
        : state
    case 'RESET':
      return initialState
    default:
      return state
  }
}
