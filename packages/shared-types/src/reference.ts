// Reference data types — mirrors shared-schemas/src/reference.ts

export type SectorResponse = {
  id: string
  name: string
  parentId: string | null
  level: number
}

export type OccupationResponse = {
  id: string
  name: string
  iscoCode: string
  majorGroup: string
}

export type CountryResponse = {
  id: number
  name: string
  iso2: string
  iso3: string | null
  emoji: string | null
}

export type EducationLevelResponse = {
  id: string
  name: string
  iscedCode: string
  levelOrder: number
}
