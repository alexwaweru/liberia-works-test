import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'My Profile' }

export default function ProfilePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold">My Profile</h1>
      {/* TODO: ProfileCompletionBar, PersonalInfoForm, EducationSection, WorkHistorySection, SkillsSection, SectorInterests */}
    </div>
  )
}
