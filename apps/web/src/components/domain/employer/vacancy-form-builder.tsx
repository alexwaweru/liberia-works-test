'use client'

import { useState } from 'react'
import { FormBuilder } from '@/components/ui/form-system/form-builder'
import type { FormDefinition, FormSection } from '@/components/ui/form-system/types'

const PERSONAL_INFO_SECTION_ID = '__personal_info__'

const PERSONAL_INFO_FIELDS: FormSection['fields'] = [
  { id: '__pi_first_name__', type: 'text', label: 'First Name', placeholder: 'First Name', validation: { required: true } },
  { id: '__pi_last_name__', type: 'text', label: 'Last Name', placeholder: 'Last Name', validation: { required: true } },
  { id: '__pi_email__', type: 'email', label: 'Email', placeholder: 'applicant@example.com', validation: { required: true } },
  { id: '__pi_phone__', type: 'text', label: 'Phone', placeholder: 'Includes country code', validation: { required: true } },
  { id: '__pi_country__', type: 'text', label: 'Country', placeholder: 'Country', validation: { required: true } },
  { id: '__pi_linkedin__', type: 'url', label: 'LinkedIn Profile', placeholder: 'https://linkedin.com/in/yourprofile'},
]

const SELF_IDENTIFICATION_SECTION_ID = '__self_identification__'

const SELF_IDENTIFICATION_FIELDS: FormSection['fields'] = [
  { 
    id: '__si_enthinicty__', 
    type: 'select', 
    label: 'Ethnicity', 
    placeholder: 'Select your ethnicity', 
    options: [ 
      { label: 'Hispanic or Latino', value: 'hispanic_latino' }, 
      { label: 'White', value: 'white' },
      { label: 'Black or African American', value: 'black_african_american' },
      { label: 'Native American or American Indian', value: 'native_american_american_indian' },
      { label: 'Asian / Pacific Islander', value: 'asian_pacific_islander' },
      { label: 'Two or more', value: 'two_more' } 
    ] 
  },
  { 
    id: '__si_gender__', 
    type: 'select', 
    label: 'Gender', 
    placeholder: 'What gender do you identify with?', 
    options: [ 
      { label: 'Female', value: 'female' }, 
      { label: 'Male', value: 'male' },
      { label: 'Non-binary', value: 'non_binary' },
      { label: 'Prefer not to say', value: 'prefer_not_to_say' },
    ]
  },
  { 
    id: '__si_disability__', 
    type: 'select', 
    label: 'Do you consider yourself to have a disability?', 
    placeholder: 'Do you consider yourself to have a disability?', 
    options: [ 
      { label: 'Yes', value: 'yes' }, 
      { label: 'No', value: 'no' } 
    ]
  }
]

function buildDefaultSection(id: string, title: string, fields: FormSection['fields'], nextSectionId: string | null): FormSection {
  return {
    id: id,
    title: title,
    locked: true,
    fields: fields,
    navigation: { defaultNext: nextSectionId, conditionalRules: [] },
  }
}

function injectDefaultSections(definition?: FormDefinition): FormDefinition {
  if (!definition) {
    const sectionId = crypto.randomUUID()
    return {
      id: crypto.randomUUID(),
      title: 'Apply for this job',
      description: '',
      sections: [
        buildDefaultSection(PERSONAL_INFO_SECTION_ID, 'Personal Information', PERSONAL_INFO_FIELDS, sectionId),
        { id: sectionId, title: 'Application Questions', description: '', fields: [], navigation: { defaultNext: SELF_IDENTIFICATION_SECTION_ID, conditionalRules: [] } },
        buildDefaultSection(SELF_IDENTIFICATION_SECTION_ID, 'Self Identification', SELF_IDENTIFICATION_FIELDS, null),
      ],
      version: 1,
    }
  }
  // Already injected
  if (definition.sections[0]?.id === PERSONAL_INFO_SECTION_ID) return definition
  const firstId = definition.sections[0]?.id ?? null
  return {
    ...definition,
    sections: [
      buildDefaultSection(PERSONAL_INFO_SECTION_ID, 'Personal Information', PERSONAL_INFO_FIELDS, SELF_IDENTIFICATION_SECTION_ID),
      buildDefaultSection(SELF_IDENTIFICATION_SECTION_ID, 'Self Identification', SELF_IDENTIFICATION_FIELDS, firstId),
      ...definition.sections,
    ],
  }
}

interface VacancyFormBuilderProps {
  definition?: FormDefinition
  onChange: (definition: FormDefinition) => void
}

export function VacancyFormBuilder({ definition, onChange }: VacancyFormBuilderProps) {
  const [initialDefinition] = useState<FormDefinition>(() => injectDefaultSections(definition))

  return (
    <FormBuilder
      definition={initialDefinition}
      onChange={onChange}
      showFormMeta={false}
    />
  )
}
