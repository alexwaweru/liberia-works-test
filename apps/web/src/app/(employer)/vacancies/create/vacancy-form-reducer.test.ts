import { vacancyFormReducer, initialState, TOTAL_STEPS } from './vacancy-form-reducer'
import type { FormState } from './vacancy-form-reducer'

describe('vacancyFormReducer', () => {
  describe('NEXT_STEP', () => {
    it('increments currentStep', () => {
      const state: FormState = { ...initialState, currentStep: 0 }
      const next = vacancyFormReducer(state, { type: 'NEXT_STEP' })
      expect(next.currentStep).toBe(1)
    })

    it('does not go past TOTAL_STEPS - 1', () => {
      const state: FormState = { ...initialState, currentStep: TOTAL_STEPS - 1 }
      const next = vacancyFormReducer(state, { type: 'NEXT_STEP' })
      expect(next.currentStep).toBe(TOTAL_STEPS - 1)
    })
  })

  describe('PREV_STEP', () => {
    it('decrements currentStep', () => {
      const state: FormState = { ...initialState, currentStep: 1 }
      const prev = vacancyFormReducer(state, { type: 'PREV_STEP' })
      expect(prev.currentStep).toBe(0)
    })

    it('does not go below 0', () => {
      const state: FormState = { ...initialState, currentStep: 0 }
      const prev = vacancyFormReducer(state, { type: 'PREV_STEP' })
      expect(prev.currentStep).toBe(0)
    })
  })

  describe('SET_FIELD', () => {
    it('sets the correct field value', () => {
      const next = vacancyFormReducer(initialState, {
        type: 'SET_FIELD',
        field: 'title',
        value: 'Engineer',
      })
      expect(next.title).toBe('Engineer')
    })

    it('sets isDirty to true', () => {
      const state: FormState = { ...initialState, isDirty: false }
      const next = vacancyFormReducer(state, {
        type: 'SET_FIELD',
        field: 'title',
        value: 'Any Title',
      })
      expect(next.isDirty).toBe(true)
    })
  })

  describe('RESET', () => {
    it('returns to initialState', () => {
      const dirty: FormState = {
        ...initialState,
        title: 'Some Title',
        currentStep: 3,
        isDirty: true,
      }
      const reset = vacancyFormReducer(dirty, { type: 'RESET' })
      expect(reset).toEqual(initialState)
    })
  })
})
