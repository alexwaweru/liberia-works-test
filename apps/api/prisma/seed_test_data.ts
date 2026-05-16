/**
 * Test data seeder — idempotent, skips records that already exist.
 * Creates: 5 employers + admin users, 4 MoL staff users, 50 vacancies, 25 job seekers, 30 program cycles.
 * Run: pnpm --filter @liberia-works/api db:seed:test
 */

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient({ adapter: new PrismaPg(new pg.Pool({ connectionString: process.env.DATABASE_URL })) })

// ── Employer data ─────────────────────────────────────────────────────────────

const EMPLOYERS = [
  {
    companyName: 'Liberia Steel Corporation',
    lraRegistrationNumber: 'LRA-001-2020',
    email: 'employer1@test.libworks.lr',
    phone: '+2317700001',
  },
  {
    companyName: 'Monrovia Tech Hub',
    lraRegistrationNumber: 'LRA-002-2021',
    email: 'employer2@test.libworks.lr',
    phone: '+2317700002',
  },
  {
    companyName: 'Harbel Sugar Company',
    lraRegistrationNumber: 'LRA-003-2019',
    email: 'employer3@test.libworks.lr',
    phone: '+2317700003',
  },
  {
    companyName: 'Grand Bassa Trading Co.',
    lraRegistrationNumber: 'LRA-004-2022',
    email: 'employer4@test.libworks.lr',
    phone: '+2317700004',
  },
  {
    companyName: 'Roberts International Services',
    lraRegistrationNumber: 'LRA-005-2023',
    email: 'employer5@test.libworks.lr',
    phone: '+2317700005',
  },
]

const MOL_USERS = [
  {
    email: 'mol-officer1@test.libworks.lr',
    fullName: 'Sarah Doe',
    phone: '+2317720001',
    role: 'MOL_OFFICER' as const,
  },
  {
    email: 'mol-officer2@test.libworks.lr',
    fullName: 'Emmanuel Wesseh',
    phone: '+2317720002',
    role: 'MOL_OFFICER' as const,
  },
  {
    email: 'mol-director1@test.libworks.lr',
    fullName: 'Patricia Karngbeae',
    phone: '+2317720003',
    role: 'MOL_DIRECTOR' as const,
  },
  {
    email: 'mol-director2@test.libworks.lr',
    fullName: 'Joseph Tubman',
    phone: '+2317720004',
    role: 'MOL_DIRECTOR' as const,
  },
]

const VACANCY_TITLES = [
  'Software Engineer',
  'Marketing Manager',
  'Accountant',
  'Operations Supervisor',
  'Data Analyst',
  'HR Coordinator',
  'Supply Chain Officer',
  'Legal Counsel',
  'Customer Service Representative',
  'Field Technician',
]

const VACANCY_DETAILS: Record<
  string,
  { positionSummary: string; offer: string[]; mustHave: string[]; niceToHave: string[]; responsibilities: string[] }
> = {
  'Software Engineer': {
    positionSummary: 'You will join our growing engineering team to design, build and maintain software systems that power our core business operations.',
    offer: ['Competitive salary and performance bonuses', 'Opportunities to work on challenging, high-impact projects', 'Collaborative and inclusive team culture', 'Continuous learning and professional development budget'],
    mustHave: ['3+ years of professional software development experience', 'Proficiency in at least one backend language (e.g. Node.js, Python, Java)', 'Experience with relational databases and REST API design'],
    niceToHave: ['Experience with cloud platforms (AWS, GCP, or Azure)', 'Familiarity with containerisation (Docker/Kubernetes)'],
    responsibilities: ['Design and implement scalable backend services', 'Collaborate with product and design teams on new features', 'Write clean, well-tested code and participate in code reviews', 'Investigate and resolve production issues'],
  },
  'Marketing Manager': {
    positionSummary: "You will lead marketing initiatives to grow our brand presence and drive customer acquisition, working closely with the CEO's office and product teams.",
    offer: ['Competitive salary with performance incentives', 'Creative freedom to shape the brand strategy', 'Exposure to a fast-growing company in the Liberian market', 'Supportive leadership team'],
    mustHave: ['5+ years of marketing experience, at least 2 in a managerial role', 'Proven track record of running successful digital and offline campaigns', 'Strong analytical skills and data-driven mindset'],
    niceToHave: ['Experience in the financial services or tech sector', 'Proficiency with tools like Google Analytics, HubSpot, or Mailchimp'],
    responsibilities: ['Develop and execute the annual marketing plan', 'Manage social media, email, and offline campaigns', 'Track KPIs and report on marketing ROI to senior leadership', 'Oversee brand guidelines and creative output'],
  },
  'Accountant': {
    positionSummary: 'You will be responsible for maintaining accurate financial records, preparing reports, and supporting the finance team with day-to-day accounting operations.',
    offer: ['Competitive compensation package', 'Structured career growth in a dynamic finance function', 'Exposure to multi-entity accounting and local compliance', 'Friendly, professional work environment'],
    mustHave: ['Bachelor\'s degree in Accounting, Finance, or a related field', '2+ years of accounting experience', 'Proficiency in accounting software (QuickBooks, Sage, or similar)', 'Strong understanding of IFRS or GAAP'],
    niceToHave: ['CPA or ACCA certification (or in progress)', 'Experience with payroll processing and Liberian tax compliance'],
    responsibilities: ['Manage accounts payable and receivable', 'Prepare monthly, quarterly, and annual financial statements', 'Ensure compliance with Liberian Revenue Authority requirements', 'Support external audits and internal controls reviews'],
  },
  'Operations Supervisor': {
    positionSummary: 'You will oversee day-to-day operations at our facility, coordinating teams to ensure smooth delivery of services and adherence to quality standards.',
    offer: ['Competitive salary with performance bonuses', 'Leadership development opportunities', 'Chance to optimise processes and make a measurable impact', 'Stable and growing organisation'],
    mustHave: ['3+ years of operations or supervisory experience', 'Strong leadership and people management skills', 'Excellent problem-solving and organisational ability'],
    niceToHave: ['Experience with lean or Six Sigma methodologies', 'Industry-specific certifications relevant to the role'],
    responsibilities: ['Supervise and support a team of operational staff', 'Monitor daily output and quality metrics', 'Identify bottlenecks and implement process improvements', 'Liaise with procurement, logistics, and HR departments'],
  },
  'Data Analyst': {
    positionSummary: 'You will turn raw data into actionable insights, building dashboards and reports that inform strategic decisions across the business.',
    offer: ['Opportunity to work with rich, diverse datasets', 'Collaborative team with a culture of experimentation', 'Professional development and tool access', 'Competitive compensation'],
    mustHave: ['2+ years of data analysis experience', 'Proficiency in SQL and at least one visualisation tool (Power BI, Tableau, or Looker)', 'Strong attention to detail and ability to communicate findings clearly'],
    niceToHave: ['Experience with Python or R for statistical analysis', 'Background in business intelligence or data engineering'],
    responsibilities: ['Extract, clean, and analyse data from multiple sources', 'Build and maintain dashboards for key business metrics', 'Collaborate with stakeholders to define analytical requirements', 'Present data-backed recommendations to leadership'],
  },
  'HR Coordinator': {
    positionSummary: 'You will support all aspects of human resources operations, from recruitment and onboarding to employee relations and compliance, helping us build a great place to work.',
    offer: ['Exposure to the full HR lifecycle in a growing organisation', 'Opportunity to shape people practices and culture', 'Competitive salary', 'Supportive management team'],
    mustHave: ['2+ years of HR experience', 'Knowledge of Liberian Labour Law and employment best practices', 'Excellent interpersonal and communication skills'],
    niceToHave: ['CIPD qualification or equivalent HR certification', 'Experience with HRIS or ATS platforms'],
    responsibilities: ['Coordinate end-to-end recruitment processes', 'Manage employee records, contracts, and onboarding logistics', 'Support payroll processing and leave management', 'Assist with employee relations issues and disciplinary procedures'],
  },
  'Supply Chain Officer': {
    positionSummary: 'You will manage procurement, logistics, and inventory to ensure a reliable supply of goods and services that keep our operations running smoothly.',
    offer: ['Hands-on role with real impact on business continuity', 'Exposure to local and international supplier networks', 'Competitive salary and benefits', 'Clear growth path within the operations function'],
    mustHave: ['3+ years of supply chain or procurement experience', 'Strong negotiation and vendor management skills', 'Proficiency with inventory management systems'],
    niceToHave: ['CIPS certification or equivalent', 'Experience with import/export regulations in West Africa'],
    responsibilities: ['Source and evaluate suppliers, negotiate contracts and pricing', 'Monitor inventory levels and coordinate restocking', 'Track shipments and resolve logistics issues', 'Maintain procurement records and prepare cost reports'],
  },
  'Legal Counsel': {
    positionSummary: 'You will provide legal advice across the business, manage contracts, ensure regulatory compliance, and represent the company in legal matters.',
    offer: ['High-impact role with exposure to diverse legal matters', 'Opportunity to build and lead a legal function', 'Competitive compensation package', 'Collaborative executive team'],
    mustHave: ['Law degree and admission to the Liberian Bar Association', '4+ years of legal practice experience (commercial law preferred)', 'Strong drafting, negotiation, and analytical skills'],
    niceToHave: ['Experience in labour law, corporate governance, or regulatory compliance', 'LLM or advanced specialisation in commercial or finance law'],
    responsibilities: ['Draft, review, and negotiate contracts and agreements', 'Advise management on legal risks and regulatory requirements', 'Manage relationships with external counsel', 'Oversee compliance with corporate governance standards'],
  },
  'Customer Service Representative': {
    positionSummary: 'You will be the voice of our company, handling customer enquiries, resolving issues, and ensuring every client interaction leaves a positive impression.',
    offer: ['Friendly and supportive team environment', 'Training and development opportunities', 'Competitive salary', 'Potential for growth into senior customer success roles'],
    mustHave: ['1+ years of customer service or client-facing experience', 'Excellent verbal and written communication skills', 'Patience, empathy, and a solutions-oriented mindset'],
    niceToHave: ['Experience with CRM software (Zendesk, Salesforce, or similar)', 'Multilingual ability (French or local Liberian languages an asset)'],
    responsibilities: ['Respond to customer enquiries via phone, email, and chat', 'Resolve complaints promptly and escalate complex issues', 'Maintain accurate records of customer interactions in the CRM', 'Gather and relay customer feedback to improve products and services'],
  },
  'Field Technician': {
    positionSummary: 'You will install, maintain, and repair technical equipment at client sites, ensuring our systems operate reliably and efficiently in the field.',
    offer: ['Hands-on, active role with variety every day', 'Technical training and certification support', 'Competitive salary plus field allowances', 'Opportunity to develop specialist expertise'],
    mustHave: ['2+ years of technical or maintenance experience', 'Ability to read technical diagrams and manuals', 'Valid driving licence and willingness to travel within Liberia'],
    niceToHave: ['Electrical or mechanical engineering qualification', 'Experience with solar, telecommunications, or industrial equipment'],
    responsibilities: ['Install and commission equipment at customer premises', 'Perform scheduled preventive maintenance', 'Diagnose and repair faults in a timely manner', 'Complete service reports and maintain maintenance logs'],
  },
}

function buildVacancyDescription(title: string, companyName: string): string {
  const d = VACANCY_DETAILS[title]
  if (!d) return `<p>Test vacancy for ${title} at ${companyName}.</p>`

  const offerItems = d.offer.map((item) => `<li><p>${item}</p></li>`).join('')
  const mustHaveItems = d.mustHave.map((item) => `<li><p>${item}</p></li>`).join('')
  const niceToHaveItems = d.niceToHave.map((item) => `<li><p>${item}</p></li>`).join('')
  const responsibilityItems = d.responsibilities.map((item) => `<li><p>${item}</p></li>`).join('')

  return [
    `<h2><strong>About ${companyName}</strong></h2>`,
    `<p><em>${companyName} is a leading organisation operating in Liberia, committed to delivering high-quality services while investing in local talent development.</em></p>`,
    `<h2><strong>The position</strong></h2>`,
    `<p><em>${d.positionSummary}</em></p>`,
    `<h2><strong>What this job can offer you</strong></h2>`,
    `<ul>${offerItems}</ul>`,
    `<h2><strong>What you bring</strong></h2>`,
    `<h3><strong>Must have (professional experience):</strong></h3>`,
    `<ul>${mustHaveItems}</ul>`,
    `<h3><strong>Nice to have</strong></h3>`,
    `<ul>${niceToHaveItems}</ul>`,
    `<h2><strong>Key Responsibilities</strong></h2>`,
    `<ul>${responsibilityItems}</ul>`,
    `<h2><strong>Interview process</strong></h2>`,
    `<ol><li><p>Interview with our Recruiter</p></li><li><p>Technical or skills assessment</p></li><li><p>Final interview with hiring manager</p></li></ol>`,
    `<p></p>`,
  ].join('')
}

const VACANCY_TYPES = [
  'PERMANENT',
  'CONTRACT',
  'INTERNSHIP',
  'VACATION_JOB',
  'PERMANENT',
  'CONTRACT',
  'INTERNSHIP',
  'VACATION_JOB',
  'PERMANENT',
  'CONTRACT',
] as const

// ── Job seeker data ───────────────────────────────────────────────────────────

const SEEKER_PROFILES = [
  {
    fullName: 'James Kollie',
    email: 'seeker1@test.libworks.lr',
    gender: 'MALE' as const,
    dateOfBirth: '2002-03-15',
    nin: 'LR-NIN-001',
    educationLevel: '6',
    vacationJobOptIn: true,
    education: [
      { institutionName: 'University of Liberia', qualification: 'BSc Computer Science', fieldOfStudy: 'Computer Science', iscedCode: '6', startDate: '2020-01-01', endDate: '2024-12-31' },
    ],
    workHistory: [
      { employerName: 'Monrovia Tech Solutions', title: 'Junior Developer', iscoCode: '2000', startDate: '2023-06-01', endDate: '2024-05-31', isCurrent: false },
    ],
    skills: [
      { skillName: 'JavaScript', proficiency: 'INTERMEDIATE' as const, yearsExperience: 2 },
      { skillName: 'Python', proficiency: 'BEGINNER' as const, yearsExperience: 1 },
      { skillName: 'SQL', proficiency: 'BEGINNER' as const, yearsExperience: 1 },
    ],
    sectorInterests: ['J', 'M'],
  },
  {
    fullName: 'Mary Wleh',
    email: 'seeker2@test.libworks.lr',
    gender: 'FEMALE' as const,
    dateOfBirth: '2003-07-22',
    nin: 'LR-NIN-002',
    educationLevel: '5',
    vacationJobOptIn: false,
    education: [
      { institutionName: 'African Methodist Episcopal University', qualification: 'Diploma in Business Administration', fieldOfStudy: 'Business Administration', iscedCode: '5', startDate: '2021-01-01', endDate: '2023-12-31' },
    ],
    workHistory: [],
    skills: [
      { skillName: 'Microsoft Office', proficiency: 'INTERMEDIATE' as const, yearsExperience: 2 },
      { skillName: 'Customer Service', proficiency: 'BEGINNER' as const, yearsExperience: 1 },
    ],
    sectorInterests: ['G', 'N'],
  },
  {
    fullName: 'David Togba',
    email: 'seeker3@test.libworks.lr',
    gender: 'MALE' as const,
    dateOfBirth: '2000-11-08',
    nin: 'LR-NIN-003',
    educationLevel: '6',
    vacationJobOptIn: true,
    education: [
      { institutionName: 'University of Liberia', qualification: 'BSc Accounting', fieldOfStudy: 'Accounting', iscedCode: '6', startDate: '2019-01-01', endDate: '2023-12-31' },
    ],
    workHistory: [
      { employerName: 'Ecobank Liberia', title: 'Graduate Trainee Accountant', iscoCode: '4000', startDate: '2023-09-01', isCurrent: true },
    ],
    skills: [
      { skillName: 'QuickBooks', proficiency: 'INTERMEDIATE' as const, yearsExperience: 2 },
      { skillName: 'Financial Reporting', proficiency: 'INTERMEDIATE' as const, yearsExperience: 2 },
      { skillName: 'Excel', proficiency: 'ADVANCED' as const, yearsExperience: 3 },
    ],
    sectorInterests: ['K', 'M'],
  },
  {
    fullName: 'Grace Paye',
    email: 'seeker4@test.libworks.lr',
    gender: 'FEMALE' as const,
    dateOfBirth: '2003-04-30',
    nin: 'LR-NIN-004',
    educationLevel: '3',
    vacationJobOptIn: true,
    education: [
      { institutionName: 'G.W. Gibson High School', qualification: 'West African Senior School Certificate', fieldOfStudy: 'Sciences', iscedCode: '3', startDate: '2019-01-01', endDate: '2022-12-31' },
    ],
    workHistory: [
      { employerName: 'Total Liberia', title: 'Customer Service Attendant', iscoCode: '5000', startDate: '2022-07-01', endDate: '2023-01-31', isCurrent: false },
    ],
    skills: [
      { skillName: 'Communication', proficiency: 'INTERMEDIATE' as const, yearsExperience: 1 },
      { skillName: 'Cashiering', proficiency: 'BEGINNER' as const, yearsExperience: 1 },
    ],
    sectorInterests: ['G', 'I'],
  },
  {
    fullName: 'Emmanuel Mulbah',
    email: 'seeker5@test.libworks.lr',
    gender: 'MALE' as const,
    dateOfBirth: '2001-09-18',
    nin: 'LR-NIN-005',
    educationLevel: '6',
    vacationJobOptIn: false,
    education: [
      { institutionName: 'Cuttington University', qualification: 'BSc Civil Engineering', fieldOfStudy: 'Civil Engineering', iscedCode: '6', startDate: '2020-01-01', endDate: '2024-12-31' },
    ],
    workHistory: [
      { employerName: 'Liberia Roads Authority', title: 'Site Engineer Intern', iscoCode: '2000', startDate: '2023-07-01', endDate: '2023-12-31', isCurrent: false },
    ],
    skills: [
      { skillName: 'AutoCAD', proficiency: 'BEGINNER' as const, yearsExperience: 1 },
      { skillName: 'Project Planning', proficiency: 'BEGINNER' as const, yearsExperience: 1 },
      { skillName: 'Surveying', proficiency: 'INTERMEDIATE' as const, yearsExperience: 2 },
    ],
    sectorInterests: ['F', 'M'],
  },
  {
    fullName: 'Rebecca Flomo',
    email: 'seeker6@test.libworks.lr',
    gender: 'FEMALE' as const,
    dateOfBirth: '1998-05-14',
    nin: 'LR-NIN-006',
    educationLevel: '6',
    vacationJobOptIn: false,
    education: [
      { institutionName: 'University of Liberia', qualification: 'BSc Education', fieldOfStudy: 'Education', iscedCode: '6', startDate: '2017-01-01', endDate: '2021-12-31' },
    ],
    workHistory: [
      { employerName: 'E.J. Roye Memorial School', title: 'Secondary School Teacher', iscoCode: '2000', startDate: '2021-09-01', isCurrent: true },
    ],
    skills: [
      { skillName: 'Curriculum Design', proficiency: 'INTERMEDIATE' as const, yearsExperience: 3 },
      { skillName: 'Classroom Management', proficiency: 'ADVANCED' as const, yearsExperience: 5 },
      { skillName: 'Microsoft Office', proficiency: 'INTERMEDIATE' as const, yearsExperience: 3 },
    ],
    sectorInterests: ['P', 'Q'],
  },
  {
    fullName: 'Samuel Kollie',
    email: 'seeker7@test.libworks.lr',
    gender: 'MALE' as const,
    dateOfBirth: '2004-02-27',
    nin: 'LR-NIN-007',
    educationLevel: '4',
    vacationJobOptIn: true,
    education: [
      { institutionName: 'Don Bosco Polytechnic', qualification: 'Certificate in IT Support', fieldOfStudy: 'Information Technology', iscedCode: '4', startDate: '2022-01-01', endDate: '2023-12-31' },
    ],
    workHistory: [],
    skills: [
      { skillName: 'Hardware Maintenance', proficiency: 'BEGINNER' as const, yearsExperience: 1 },
      { skillName: 'Networking Basics', proficiency: 'BEGINNER' as const, yearsExperience: 1 },
      { skillName: 'Windows Administration', proficiency: 'INTERMEDIATE' as const, yearsExperience: 1 },
    ],
    sectorInterests: ['J', 'N'],
  },
  {
    fullName: 'Esther Nimba',
    email: 'seeker8@test.libworks.lr',
    gender: 'FEMALE' as const,
    dateOfBirth: '2002-08-11',
    nin: 'LR-NIN-008',
    educationLevel: '5',
    vacationJobOptIn: false,
    education: [
      { institutionName: 'A.M. Dogliotti College of Medicine', qualification: 'Diploma in Nursing', fieldOfStudy: 'Nursing', iscedCode: '5', startDate: '2020-01-01', endDate: '2022-12-31' },
    ],
    workHistory: [
      { employerName: 'John F. Kennedy Medical Center', title: 'Enrolled Nurse', iscoCode: '3000', startDate: '2022-10-01', isCurrent: true },
    ],
    skills: [
      { skillName: 'Patient Care', proficiency: 'INTERMEDIATE' as const, yearsExperience: 2 },
      { skillName: 'Medical Records', proficiency: 'BEGINNER' as const, yearsExperience: 2 },
      { skillName: 'First Aid', proficiency: 'ADVANCED' as const, yearsExperience: 3 },
    ],
    sectorInterests: ['Q'],
  },
  {
    fullName: 'Moses Pewee',
    email: 'seeker9@test.libworks.lr',
    gender: 'MALE' as const,
    dateOfBirth: '1997-12-03',
    nin: 'LR-NIN-009',
    educationLevel: '6',
    vacationJobOptIn: false,
    education: [
      { institutionName: 'University of Liberia', qualification: 'BSc Business Administration', fieldOfStudy: 'Banking and Finance', iscedCode: '6', startDate: '2016-01-01', endDate: '2020-12-31' },
    ],
    workHistory: [
      { employerName: 'Liberia Bank for Development and Investment', title: 'Credit Officer', iscoCode: '4000', startDate: '2020-08-01', isCurrent: true },
      { employerName: 'Cellcom Liberia', title: 'Customer Service Rep', iscoCode: '5000', startDate: '2019-06-01', endDate: '2020-07-31', isCurrent: false },
    ],
    skills: [
      { skillName: 'Credit Analysis', proficiency: 'INTERMEDIATE' as const, yearsExperience: 4 },
      { skillName: 'Banking Software', proficiency: 'INTERMEDIATE' as const, yearsExperience: 4 },
      { skillName: 'Financial Analysis', proficiency: 'INTERMEDIATE' as const, yearsExperience: 3 },
    ],
    sectorInterests: ['K', 'N'],
  },
  {
    fullName: 'Abigail Konneh',
    email: 'seeker10@test.libworks.lr',
    gender: 'FEMALE' as const,
    dateOfBirth: '2002-06-19',
    nin: 'LR-NIN-010',
    educationLevel: '6',
    vacationJobOptIn: true,
    education: [
      { institutionName: 'Stella Maris Polytechnic', qualification: 'BSc Marketing', fieldOfStudy: 'Marketing', iscedCode: '6', startDate: '2020-01-01', endDate: '2024-12-31' },
    ],
    workHistory: [],
    skills: [
      { skillName: 'Social Media Marketing', proficiency: 'INTERMEDIATE' as const, yearsExperience: 2 },
      { skillName: 'Content Creation', proficiency: 'BEGINNER' as const, yearsExperience: 1 },
      { skillName: 'Market Research', proficiency: 'BEGINNER' as const, yearsExperience: 1 },
    ],
    sectorInterests: ['G', 'M'],
  },
  {
    fullName: 'Thomas Varney',
    email: 'seeker11@test.libworks.lr',
    gender: 'MALE' as const,
    dateOfBirth: '1995-01-25',
    nin: 'LR-NIN-011',
    educationLevel: '7',
    vacationJobOptIn: false,
    education: [
      { institutionName: 'University of Liberia', qualification: 'MSc Economics', fieldOfStudy: 'Economics', iscedCode: '7', startDate: '2018-01-01', endDate: '2020-12-31' },
      { institutionName: 'University of Liberia', qualification: 'BSc Economics', fieldOfStudy: 'Economics', iscedCode: '6', startDate: '2014-01-01', endDate: '2018-12-31' },
    ],
    workHistory: [
      { employerName: 'Ministry of Finance', title: 'Economic Analyst', iscoCode: '2000', startDate: '2020-08-01', isCurrent: true },
    ],
    skills: [
      { skillName: 'Economic Modelling', proficiency: 'ADVANCED' as const, yearsExperience: 5 },
      { skillName: 'Data Analysis', proficiency: 'ADVANCED' as const, yearsExperience: 5 },
      { skillName: 'Policy Research', proficiency: 'INTERMEDIATE' as const, yearsExperience: 5 },
      { skillName: 'R/Stata', proficiency: 'INTERMEDIATE' as const, yearsExperience: 4 },
    ],
    sectorInterests: ['O', 'K'],
  },
  {
    fullName: 'Naomi Gbor',
    email: 'seeker12@test.libworks.lr',
    gender: 'FEMALE' as const,
    dateOfBirth: '2002-10-07',
    nin: 'LR-NIN-012',
    educationLevel: '6',
    vacationJobOptIn: true,
    education: [
      { institutionName: 'Cuttington University', qualification: 'BSc Public Health', fieldOfStudy: 'Public Health', iscedCode: '6', startDate: '2020-01-01', endDate: '2024-12-31' },
    ],
    workHistory: [],
    skills: [
      { skillName: 'Health Education', proficiency: 'BEGINNER' as const, yearsExperience: 1 },
      { skillName: 'Community Outreach', proficiency: 'INTERMEDIATE' as const, yearsExperience: 2 },
      { skillName: 'Epidemiology Basics', proficiency: 'BEGINNER' as const, yearsExperience: 1 },
    ],
    sectorInterests: ['Q', 'P'],
  },
  {
    fullName: 'Peter Sumo',
    email: 'seeker13@test.libworks.lr',
    gender: 'MALE' as const,
    dateOfBirth: '2000-03-16',
    nin: 'LR-NIN-013',
    educationLevel: '5',
    vacationJobOptIn: false,
    education: [
      { institutionName: 'Don Bosco Polytechnic', qualification: 'Diploma in Electrical Engineering', fieldOfStudy: 'Electrical Engineering', iscedCode: '5', startDate: '2019-01-01', endDate: '2021-12-31' },
    ],
    workHistory: [
      { employerName: 'Liberia Electricity Corporation', title: 'Electrician Technician', iscoCode: '3000', startDate: '2021-05-01', isCurrent: true },
    ],
    skills: [
      { skillName: 'Electrical Wiring', proficiency: 'ADVANCED' as const, yearsExperience: 3 },
      { skillName: 'Solar PV Installation', proficiency: 'INTERMEDIATE' as const, yearsExperience: 2 },
      { skillName: 'AutoCAD Electrical', proficiency: 'BEGINNER' as const, yearsExperience: 1 },
    ],
    sectorInterests: ['D', 'F'],
  },
  {
    fullName: 'Hannah Boakai',
    email: 'seeker14@test.libworks.lr',
    gender: 'FEMALE' as const,
    dateOfBirth: '2001-11-29',
    nin: 'LR-NIN-014',
    educationLevel: '6',
    vacationJobOptIn: false,
    education: [
      { institutionName: 'African Methodist Episcopal University', qualification: 'BSc Finance', fieldOfStudy: 'Finance', iscedCode: '6', startDate: '2019-01-01', endDate: '2023-12-31' },
    ],
    workHistory: [
      { employerName: 'Guaranty Trust Bank Liberia', title: 'Banking Officer', iscoCode: '4000', startDate: '2023-07-01', isCurrent: true },
    ],
    skills: [
      { skillName: 'Financial Modelling', proficiency: 'INTERMEDIATE' as const, yearsExperience: 2 },
      { skillName: 'Treasury Operations', proficiency: 'BEGINNER' as const, yearsExperience: 1 },
      { skillName: 'Excel/VBA', proficiency: 'INTERMEDIATE' as const, yearsExperience: 2 },
    ],
    sectorInterests: ['K', 'M'],
  },
  {
    fullName: 'John Tweah',
    email: 'seeker15@test.libworks.lr',
    gender: 'MALE' as const,
    dateOfBirth: '1996-08-22',
    nin: 'LR-NIN-015',
    educationLevel: '6',
    vacationJobOptIn: true,
    education: [
      { institutionName: 'University of Liberia', qualification: 'BSc Agriculture', fieldOfStudy: 'Agriculture', iscedCode: '6', startDate: '2015-01-01', endDate: '2019-12-31' },
    ],
    workHistory: [
      { employerName: 'Firestone Liberia', title: 'Agriculture Extension Officer', iscoCode: '2000', startDate: '2019-08-01', isCurrent: true },
      { employerName: 'Ministry of Agriculture', title: 'Field Officer Intern', iscoCode: '2000', startDate: '2018-06-01', endDate: '2019-04-30', isCurrent: false },
    ],
    skills: [
      { skillName: 'Crop Management', proficiency: 'ADVANCED' as const, yearsExperience: 5 },
      { skillName: 'Irrigation Systems', proficiency: 'INTERMEDIATE' as const, yearsExperience: 4 },
      { skillName: 'Agri-business Planning', proficiency: 'INTERMEDIATE' as const, yearsExperience: 3 },
    ],
    sectorInterests: ['A', 'M'],
  },
  {
    fullName: 'Comfort Zulu',
    email: 'seeker16@test.libworks.lr',
    gender: 'FEMALE' as const,
    dateOfBirth: '2003-05-09',
    nin: 'LR-NIN-016',
    educationLevel: '3',
    vacationJobOptIn: true,
    education: [
      { institutionName: 'C.W.A. Cooke High School', qualification: 'West African Senior School Certificate', fieldOfStudy: 'Arts', iscedCode: '3', startDate: '2019-01-01', endDate: '2022-12-31' },
    ],
    workHistory: [
      { employerName: 'Shoprite Liberia', title: 'Sales Associate', iscoCode: '5000', startDate: '2022-09-01', endDate: '2024-03-31', isCurrent: false },
    ],
    skills: [
      { skillName: 'Retail Sales', proficiency: 'INTERMEDIATE' as const, yearsExperience: 2 },
      { skillName: 'Inventory Management', proficiency: 'BEGINNER' as const, yearsExperience: 1 },
      { skillName: 'Point-of-Sale Systems', proficiency: 'INTERMEDIATE' as const, yearsExperience: 2 },
    ],
    sectorInterests: ['G', 'I'],
  },
  {
    fullName: 'Daniel Karnga',
    email: 'seeker17@test.libworks.lr',
    gender: 'MALE' as const,
    dateOfBirth: '2001-07-14',
    nin: 'LR-NIN-017',
    educationLevel: '6',
    vacationJobOptIn: false,
    education: [
      { institutionName: 'University of Liberia', qualification: 'BSc Information Technology', fieldOfStudy: 'Information Technology', iscedCode: '6', startDate: '2019-01-01', endDate: '2023-12-31' },
    ],
    workHistory: [
      { employerName: 'Lonestar Cell MTN', title: 'IT Support Analyst', iscoCode: '3000', startDate: '2023-06-01', isCurrent: true },
    ],
    skills: [
      { skillName: 'Network Administration', proficiency: 'INTERMEDIATE' as const, yearsExperience: 2 },
      { skillName: 'Cybersecurity Basics', proficiency: 'BEGINNER' as const, yearsExperience: 1 },
      { skillName: 'Python', proficiency: 'INTERMEDIATE' as const, yearsExperience: 2 },
      { skillName: 'Linux', proficiency: 'INTERMEDIATE' as const, yearsExperience: 2 },
    ],
    sectorInterests: ['J', 'M'],
  },
  {
    fullName: 'Patience Borbor',
    email: 'seeker18@test.libworks.lr',
    gender: 'FEMALE' as const,
    dateOfBirth: '1999-02-04',
    nin: 'LR-NIN-018',
    educationLevel: '6',
    vacationJobOptIn: false,
    education: [
      { institutionName: 'University of Liberia', qualification: 'BSc Human Resource Management', fieldOfStudy: 'Human Resource Management', iscedCode: '6', startDate: '2018-01-01', endDate: '2022-12-31' },
    ],
    workHistory: [
      { employerName: 'UNMIL (UN Mission)', title: 'HR Assistant', iscoCode: '4000', startDate: '2022-08-01', isCurrent: true },
      { employerName: 'Total Liberia', title: 'Recruitment Coordinator', iscoCode: '4000', startDate: '2021-06-01', endDate: '2022-07-31', isCurrent: false },
    ],
    skills: [
      { skillName: 'Recruitment', proficiency: 'ADVANCED' as const, yearsExperience: 4 },
      { skillName: 'HRIS Systems', proficiency: 'INTERMEDIATE' as const, yearsExperience: 3 },
      { skillName: 'Labour Law', proficiency: 'INTERMEDIATE' as const, yearsExperience: 3 },
      { skillName: 'Payroll Processing', proficiency: 'INTERMEDIATE' as const, yearsExperience: 3 },
    ],
    sectorInterests: ['N', 'O'],
  },
  {
    fullName: 'Stephen Cheawe',
    email: 'seeker19@test.libworks.lr',
    gender: 'MALE' as const,
    dateOfBirth: '2001-12-20',
    nin: 'LR-NIN-019',
    educationLevel: '4',
    vacationJobOptIn: true,
    education: [
      { institutionName: 'Liberia Institute of Public Administration (LIPA)', qualification: 'Certificate in Construction Technology', fieldOfStudy: 'Construction', iscedCode: '4', startDate: '2021-01-01', endDate: '2022-12-31' },
    ],
    workHistory: [
      { employerName: 'China Union', title: 'Site Labourer / Assistant Mason', iscoCode: '9000', startDate: '2022-03-01', endDate: '2024-02-29', isCurrent: false },
    ],
    skills: [
      { skillName: 'Masonry', proficiency: 'INTERMEDIATE' as const, yearsExperience: 2 },
      { skillName: 'Blueprint Reading', proficiency: 'BEGINNER' as const, yearsExperience: 1 },
      { skillName: 'Safety Procedures', proficiency: 'INTERMEDIATE' as const, yearsExperience: 2 },
    ],
    sectorInterests: ['F'],
  },
  {
    fullName: 'Agnes Dahn',
    email: 'seeker20@test.libworks.lr',
    gender: 'FEMALE' as const,
    dateOfBirth: '2000-09-01',
    nin: 'LR-NIN-020',
    educationLevel: '5',
    vacationJobOptIn: false,
    education: [
      { institutionName: 'Stella Maris Polytechnic', qualification: 'Diploma in Tourism and Hospitality Management', fieldOfStudy: 'Tourism and Hospitality', iscedCode: '5', startDate: '2019-01-01', endDate: '2021-12-31' },
    ],
    workHistory: [
      { employerName: 'Hotel Africa', title: 'Front Desk Officer', iscoCode: '5000', startDate: '2021-07-01', isCurrent: true },
    ],
    skills: [
      { skillName: 'Hospitality Management', proficiency: 'INTERMEDIATE' as const, yearsExperience: 3 },
      { skillName: 'PMS (Hotel Software)', proficiency: 'INTERMEDIATE' as const, yearsExperience: 2 },
      { skillName: 'Guest Relations', proficiency: 'ADVANCED' as const, yearsExperience: 3 },
    ],
    sectorInterests: ['I', 'G'],
  },
  {
    fullName: 'Michael Yancy',
    email: 'seeker21@test.libworks.lr',
    gender: 'MALE' as const,
    dateOfBirth: '1994-04-17',
    nin: 'LR-NIN-021',
    educationLevel: '6',
    vacationJobOptIn: false,
    education: [
      { institutionName: 'University of Liberia', qualification: 'BSc Mining Engineering', fieldOfStudy: 'Mining Engineering', iscedCode: '6', startDate: '2013-01-01', endDate: '2017-12-31' },
    ],
    workHistory: [
      { employerName: 'ArcelorMittal Liberia', title: 'Mining Engineer', iscoCode: '2000', startDate: '2017-09-01', isCurrent: true },
      { employerName: 'Bea Mountain Mining Corp.', title: 'Junior Engineer', iscoCode: '2000', startDate: '2016-06-01', endDate: '2017-08-31', isCurrent: false },
    ],
    skills: [
      { skillName: 'Mine Planning', proficiency: 'ADVANCED' as const, yearsExperience: 7 },
      { skillName: 'Geotechnical Analysis', proficiency: 'ADVANCED' as const, yearsExperience: 6 },
      { skillName: 'Blasting Techniques', proficiency: 'INTERMEDIATE' as const, yearsExperience: 5 },
      { skillName: 'AutoCAD', proficiency: 'ADVANCED' as const, yearsExperience: 5 },
    ],
    sectorInterests: ['B', 'M'],
  },
  {
    fullName: 'Bertha Kamara',
    email: 'seeker22@test.libworks.lr',
    gender: 'FEMALE' as const,
    dateOfBirth: '2002-01-28',
    nin: 'LR-NIN-022',
    educationLevel: '6',
    vacationJobOptIn: true,
    education: [
      { institutionName: 'Louis Arthur Grimes School of Law (University of Liberia)', qualification: 'Bachelor of Laws (LLB)', fieldOfStudy: 'Law', iscedCode: '6', startDate: '2019-01-01', endDate: '2023-12-31' },
    ],
    workHistory: [
      { employerName: 'Liberian Judicial Institute', title: 'Legal Research Assistant', iscoCode: '2000', startDate: '2023-08-01', isCurrent: true },
    ],
    skills: [
      { skillName: 'Legal Research', proficiency: 'INTERMEDIATE' as const, yearsExperience: 2 },
      { skillName: 'Contract Drafting', proficiency: 'BEGINNER' as const, yearsExperience: 1 },
      { skillName: 'Commercial Law', proficiency: 'BEGINNER' as const, yearsExperience: 1 },
    ],
    sectorInterests: ['O', 'K'],
  },
  {
    fullName: 'Joseph Tokpah',
    email: 'seeker23@test.libworks.lr',
    gender: 'MALE' as const,
    dateOfBirth: '2000-06-11',
    nin: 'LR-NIN-023',
    educationLevel: '6',
    vacationJobOptIn: false,
    education: [
      { institutionName: 'African Methodist Episcopal University', qualification: 'BSc Supply Chain Management', fieldOfStudy: 'Supply Chain Management', iscedCode: '6', startDate: '2019-01-01', endDate: '2023-12-31' },
    ],
    workHistory: [
      { employerName: 'Maersk Liberia', title: 'Logistics Coordinator', iscoCode: '4000', startDate: '2023-07-01', isCurrent: true },
    ],
    skills: [
      { skillName: 'Inventory Management', proficiency: 'INTERMEDIATE' as const, yearsExperience: 2 },
      { skillName: 'Procurement', proficiency: 'INTERMEDIATE' as const, yearsExperience: 2 },
      { skillName: 'ERP Systems', proficiency: 'BEGINNER' as const, yearsExperience: 1 },
      { skillName: 'Logistics Planning', proficiency: 'INTERMEDIATE' as const, yearsExperience: 2 },
    ],
    sectorInterests: ['H', 'G'],
  },
  {
    fullName: 'Lydia Gono',
    email: 'seeker24@test.libworks.lr',
    gender: 'FEMALE' as const,
    dateOfBirth: '1998-08-25',
    nin: 'LR-NIN-024',
    educationLevel: '6',
    vacationJobOptIn: false,
    education: [
      { institutionName: 'Cuttington University', qualification: 'BSc Social Work', fieldOfStudy: 'Social Work', iscedCode: '6', startDate: '2016-01-01', endDate: '2020-12-31' },
    ],
    workHistory: [
      { employerName: 'International Rescue Committee (IRC)', title: 'Community Engagement Officer', iscoCode: '2000', startDate: '2020-06-01', isCurrent: true },
      { employerName: 'Carter Center Liberia', title: 'Field Monitor', iscoCode: '3000', startDate: '2019-01-01', endDate: '2020-05-31', isCurrent: false },
    ],
    skills: [
      { skillName: 'Community Mobilisation', proficiency: 'ADVANCED' as const, yearsExperience: 5 },
      { skillName: 'Case Management', proficiency: 'ADVANCED' as const, yearsExperience: 4 },
      { skillName: 'Report Writing', proficiency: 'ADVANCED' as const, yearsExperience: 4 },
      { skillName: 'Stakeholder Engagement', proficiency: 'INTERMEDIATE' as const, yearsExperience: 4 },
    ],
    sectorInterests: ['Q', 'S'],
  },
  {
    fullName: 'Charles Gongloe',
    email: 'seeker25@test.libworks.lr',
    gender: 'MALE' as const,
    dateOfBirth: '1993-10-05',
    nin: 'LR-NIN-025',
    educationLevel: '7',
    vacationJobOptIn: false,
    education: [
      { institutionName: 'Harvard Kennedy School', qualification: 'MPA Public Administration', fieldOfStudy: 'Public Administration', iscedCode: '7', startDate: '2019-01-01', endDate: '2021-12-31' },
      { institutionName: 'University of Liberia', qualification: 'BSc Political Science', fieldOfStudy: 'Political Science & Public Administration', iscedCode: '6', startDate: '2012-01-01', endDate: '2016-12-31' },
    ],
    workHistory: [
      { employerName: 'Liberia Revenue Authority', title: 'Senior Policy Officer', iscoCode: '1000', startDate: '2021-01-01', isCurrent: true },
      { employerName: 'Ministry of Justice', title: 'Policy Analyst', iscoCode: '2000', startDate: '2016-09-01', endDate: '2020-12-31', isCurrent: false },
    ],
    skills: [
      { skillName: 'Policy Analysis', proficiency: 'EXPERT' as const, yearsExperience: 8 },
      { skillName: 'Public Administration', proficiency: 'EXPERT' as const, yearsExperience: 9 },
      { skillName: 'Strategic Planning', proficiency: 'ADVANCED' as const, yearsExperience: 7 },
      { skillName: 'Budget Management', proficiency: 'ADVANCED' as const, yearsExperience: 6 },
    ],
    sectorInterests: ['O', 'K'],
  },
]

// ── Program cycle data ────────────────────────────────────────────────────────

type ProgramSpec = {
  name: string
  year: number
  status: 'PLANNED' | 'OPEN' | 'MATCHING' | 'COMPLETED'
  startDate: Date
  endDate: Date
}

const SEASONS = ['Quarter 1', 'Quarter 2', 'Quarter 3', 'Quarter 4', 'Mid-Year', 'Year-End']

function buildProgramCycles(): ProgramSpec[] {
  const cycles: ProgramSpec[] = []

  // 2020 — 3 COMPLETED (seasons 0,1,2)
  for (let s = 0; s < 3; s++) {
    cycles.push({
      name: `Vacation Job Programme ${SEASONS[s]} 2020`,
      year: 2020,
      status: 'COMPLETED',
      startDate: new Date('2020-01-15'),
      endDate: new Date('2020-06-30'),
    })
  }

  // 2021 — 3 COMPLETED (seasons 3,4,5)
  for (let s = 3; s < 6; s++) {
    cycles.push({
      name: `Vacation Job Programme ${SEASONS[s]} 2021`,
      year: 2021,
      status: 'COMPLETED',
      startDate: new Date('2021-01-15'),
      endDate: new Date('2021-09-30'),
    })
  }

  // 2022 — 4 COMPLETED (seasons 0-3)
  for (let s = 0; s < 4; s++) {
    cycles.push({
      name: `Vacation Job Programme ${SEASONS[s]} 2022`,
      year: 2022,
      status: 'COMPLETED',
      startDate: new Date('2022-02-01'),
      endDate: new Date('2022-10-31'),
    })
  }

  // 2023 — 2 COMPLETED + 4 OPEN
  for (let s = 0; s < 2; s++) {
    cycles.push({
      name: `Vacation Job Programme ${SEASONS[s]} 2023`,
      year: 2023,
      status: 'COMPLETED',
      startDate: new Date('2023-01-15'),
      endDate: new Date('2023-06-30'),
    })
  }
  for (let s = 2; s < 6; s++) {
    cycles.push({
      name: `Vacation Job Programme ${SEASONS[s]} 2023`,
      year: 2023,
      status: 'OPEN',
      startDate: new Date('2023-07-01'),
      endDate: new Date('2026-12-31'),
    })
  }

  // 2024 — 5 OPEN (seasons 0-4)
  for (let s = 0; s < 5; s++) {
    cycles.push({
      name: `Vacation Job Programme ${SEASONS[s]} 2024`,
      year: 2024,
      status: 'OPEN',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2026-12-31'),
    })
  }

  // 2025 — 4 OPEN + 5 PLANNED + 4 MATCHING
  for (let s = 0; s < 4; s++) {
    cycles.push({
      name: `Vacation Job Programme ${SEASONS[s]} 2025`,
      year: 2025,
      status: 'OPEN',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2026-12-31'),
    })
  }
  for (let s = 4; s < 6; s++) {
    cycles.push({
      name: `Vacation Job Programme ${SEASONS[s]} 2025 A`,
      year: 2025,
      status: 'PLANNED',
      startDate: new Date('2026-07-01'),
      endDate: new Date('2026-12-31'),
    })
  }
  // 3 more PLANNED under different names
  for (let s = 0; s < 3; s++) {
    cycles.push({
      name: `Vacation Job Programme ${SEASONS[s]} 2025 B`,
      year: 2025,
      status: 'PLANNED',
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-12-31'),
    })
  }
  // 4 MATCHING
  for (let s = 0; s < 4; s++) {
    cycles.push({
      name: `Vacation Job Programme ${SEASONS[s]} 2025 C`,
      year: 2025,
      status: 'MATCHING',
      startDate: new Date('2025-03-01'),
      endDate: new Date('2026-12-31'),
    })
  }

  return cycles
}

function buildProgramDescription(cycle: ProgramSpec): string {
  const statusNote =
    cycle.status === 'PLANNED'
      ? 'This cycle is coming soon. Registration will open shortly.'
      : cycle.status === 'COMPLETED'
        ? 'This cycle has concluded. All placements have been finalised.'
        : cycle.status === 'MATCHING'
          ? 'Applications are closed. Employer matching is currently underway.'
          : 'Registration is now open. Eligible individuals and employers can apply.'

  const eligibilityItems = [
    '<li><p>Current university or TVET students in their final or penultimate year</p></li>',
    '<li><p>Liberian nationals aged 18–35</p></li>',
    '<li><p>Have not previously completed a Vacation Job placement with the same employer</p></li>',
    '<li><p>In good academic standing at their registered institution</p></li>',
  ].join('')

  const activityItems = [
    '<li><p>Rotate through business units and gain hands-on experience in your field of study</p></li>',
    '<li><p>Work on a supervised project aligned to the employer\'s operational needs</p></li>',
    '<li><p>Attend structured learning sessions and employer-led workshops</p></li>',
    '<li><p>Contribute to team objectives under the guidance of a designated mentor</p></li>',
  ].join('')

  const benefitItems = [
    '<li><p>A stipend for the duration of the placement</p></li>',
    '<li><p>A certificate of completion issued by the Ministry of Labour</p></li>',
    '<li><p>Practical skills and a professional reference from your host employer</p></li>',
    '<li><p>Priority consideration for future employment opportunities at the host organisation</p></li>',
  ].join('')

  const matchingSteps = [
    '<li><p>Eligible individuals opt in and indicate their county and sector preferences</p></li>',
    '<li><p>Registered employers declare available slots by county and preferred candidate profile</p></li>',
    '<li><p>The platform runs an automated matching algorithm to align candidates with employers</p></li>',
    '<li><p>Both parties are notified of their match and confirm participation</p></li>',
    '<li><p>Placements begin on the cycle start date</p></li>',
  ].join('')

  const startStr = cycle.startDate.toISOString().split('T')[0]
  const endStr = cycle.endDate.toISOString().split('T')[0]

  return [
    `<h2><strong>About the programme</strong></h2>`,
    `<p>The ${cycle.name} is a Ministry of Labour initiative that connects eligible Liberian students with private sector employers for structured short-term work experience. ${statusNote}</p>`,
    `<h2><strong>Who can participate</strong></h2>`,
    `<ul>${eligibilityItems}</ul>`,
    `<h2><strong>What you'll do</strong></h2>`,
    `<ul>${activityItems}</ul>`,
    `<h2><strong>What you'll gain</strong></h2>`,
    `<ul>${benefitItems}</ul>`,
    `<h2><strong>How matching works</strong></h2>`,
    `<p>Placements are allocated through a structured matching process managed by the Ministry of Labour platform:</p>`,
    `<ol>${matchingSteps}</ol>`,
    `<h2><strong>Timeline</strong></h2>`,
    `<p>This cycle runs from <strong>${startStr}</strong> to <strong>${endStr}</strong> (${cycle.year} cohort). Ensure all opt-ins and hosting declarations are submitted before the registration deadline.</p>`,
  ].join('')
}

// ── Application form builder ──────────────────────────────────────────────────

const APPLICATION_QUESTIONS: Record<string, { label: string; placeholder: string }[]> = {
  'Software Engineer': [
    { label: 'Describe a challenging technical problem you solved and the approach you took.', placeholder: 'Enter text...' },
    { label: 'What programming languages and frameworks are you most proficient in?', placeholder: 'e.g. Node.js, TypeScript, PostgreSQL...' },
    { label: 'Provide a link to your GitHub profile or a project you are proud of.', placeholder: 'https://github.com/yourprofile' },
  ],
  'Marketing Manager': [
    { label: 'Describe a successful marketing campaign you led. What was the outcome?', placeholder: 'Enter text...' },
    { label: 'How do you approach setting and measuring marketing KPIs?', placeholder: 'Enter text...' },
    { label: 'What channels have you found most effective for reaching audiences in the Liberian market?', placeholder: 'Enter text...' },
  ],
  'Accountant': [
    { label: 'Describe your experience with financial reporting and month-end close processes.', placeholder: 'Enter text...' },
    { label: 'What accounting software have you used, and how proficient are you with it?', placeholder: 'e.g. QuickBooks, Sage, Xero...' },
    { label: 'How familiar are you with Liberian Revenue Authority tax compliance requirements?', placeholder: 'Enter text...' },
  ],
  'Operations Supervisor': [
    { label: 'Describe a time you improved an operational process. What was the impact?', placeholder: 'Enter text...' },
    { label: 'How do you handle conflicts within your team?', placeholder: 'Enter text...' },
    { label: 'How many people have you directly supervised, and in what context?', placeholder: 'Enter text...' },
  ],
  'Data Analyst': [
    { label: 'Describe an analysis project you completed. What tools did you use and what insights did you surface?', placeholder: 'Enter text...' },
    { label: 'What SQL concepts are you most comfortable with (e.g. window functions, CTEs)?', placeholder: 'Enter text...' },
    { label: 'Share a link to a dashboard or data project you have built.', placeholder: 'https://...' },
  ],
  'HR Coordinator': [
    { label: 'Describe your experience managing end-to-end recruitment processes.', placeholder: 'Enter text...' },
    { label: 'How have you handled a complex employee relations issue in a previous role?', placeholder: 'Enter text...' },
    { label: 'What is your understanding of key Liberian Labour Law provisions relevant to this role?', placeholder: 'Enter text...' },
  ],
  'Supply Chain Officer': [
    { label: 'Describe your experience managing supplier relationships and procurement processes.', placeholder: 'Enter text...' },
    { label: 'How do you ensure inventory accuracy and prevent stockouts?', placeholder: 'Enter text...' },
    { label: 'What experience do you have with import/export or cross-border logistics?', placeholder: 'Enter text...' },
  ],
  'Legal Counsel': [
    { label: 'Describe your experience drafting and negotiating commercial contracts.', placeholder: 'Enter text...' },
    { label: 'What areas of law have you specialised in during your career so far?', placeholder: 'Enter text...' },
    { label: 'Provide your Liberian Bar Association membership number (if applicable).', placeholder: 'LBA-XXXXX' },
  ],
  'Customer Service Representative': [
    { label: 'Describe a time you turned a frustrated customer into a satisfied one.', placeholder: 'Enter text...' },
    { label: 'How do you prioritise multiple customer requests at the same time?', placeholder: 'Enter text...' },
    { label: 'What customer service or CRM tools have you used?', placeholder: 'e.g. Zendesk, Freshdesk, Intercom...' },
  ],
  'Field Technician': [
    { label: 'Describe your hands-on technical experience and the types of equipment you have worked with.', placeholder: 'Enter text...' },
    { label: 'How do you approach diagnosing a fault when you have limited documentation available?', placeholder: 'Enter text...' },
    { label: 'Do you hold a valid driving licence? What counties/regions of Liberia are you willing to travel to?', placeholder: 'Enter text...' },
  ],
}

function buildApplicationForm(title: string): object {
  const questions = APPLICATION_QUESTIONS[title] ?? [
    { label: 'Why are you interested in this position?', placeholder: 'Enter text...' },
  ]

  const questionFields = questions.map((q, i) => ({
    id: `aq_${i + 1}_${title.toLowerCase().replace(/\s+/g, '_')}`,
    type: 'textarea',
    label: q.label,
    placeholder: q.placeholder,
  }))

  const appQuestionsSection = {
    id: 'app_questions',
    title: 'Application Questions',
    description: '',
    fields: questionFields,
    navigation: { defaultNext: '__self_identification__', conditionalRules: [] },
  }

  return {
    title: 'Apply for this job',
    version: 1,
    description: '',
    sections: [
      {
        id: '__personal_info__',
        title: 'Personal Information',
        locked: true,
        fields: [
          { id: '__pi_first_name__', type: 'text', label: 'First Name', validation: { required: true }, placeholder: 'First Name' },
          { id: '__pi_last_name__', type: 'text', label: 'Last Name', validation: { required: true }, placeholder: 'Last Name' },
          { id: '__pi_email__', type: 'email', label: 'Email', validation: { required: true }, placeholder: 'applicant@example.com' },
          { id: '__pi_phone__', type: 'text', label: 'Phone', validation: { required: true }, placeholder: 'Includes country code' },
          { id: '__pi_country__', type: 'text', label: 'Country', validation: { required: true }, placeholder: 'Country' },
          { id: '__pi_linkedin__', type: 'url', label: 'LinkedIn Profile', placeholder: 'https://linkedin.com/in/yourprofile' },
        ],
        navigation: { defaultNext: 'app_questions', conditionalRules: [] },
      },
      appQuestionsSection,
      {
        id: '__self_identification__',
        title: 'Self Identification',
        locked: true,
        fields: [
          {
            id: '__si_ethnicity__',
            type: 'select',
            label: 'Ethnicity',
            placeholder: 'Select your ethnicity',
            options: [
              { label: 'Hispanic or Latino', value: 'hispanic_latino' },
              { label: 'White', value: 'white' },
              { label: 'Black or African American', value: 'black_african_american' },
              { label: 'Native American or American Indian', value: 'native_american_american_indian' },
              { label: 'Asian / Pacific Islander', value: 'asian_pacific_islander' },
              { label: 'Two or more', value: 'two_more' },
            ],
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
            ],
          },
          {
            id: '__si_disability__',
            type: 'select',
            label: 'Do you consider yourself to have a disability?',
            placeholder: 'Do you consider yourself to have a disability?',
            options: [
              { label: 'Yes', value: 'yes' },
              { label: 'No', value: 'no' },
            ],
          },
        ],
        navigation: { defaultNext: null, conditionalRules: [] },
      },
    ],
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('Seeding test data...')

  // ── Resolve Liberian states ─────────────────────────────────────────────────
  const liberia = await prisma.country.findUnique({ where: { iso2: 'LR' } })
  let states: { id: number; name: string }[] = []

  if (!liberia) {
    console.warn('  WARNING: Country LR (Liberia) not found in database. Location data may not be seeded yet.')
  } else {
    states = await prisma.state.findMany({
      where: { countryId: liberia.id },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    })
    if (states.length === 0) {
      console.warn('  WARNING: No states found for Liberia. Location data may not be seeded yet.')
    } else {
      console.log(`  Found ${states.length} Liberian states`)
    }
  }

  // ── Resolve first available sector and occupation ───────────────────────────
  const firstSector = await prisma.sector.findFirst({ orderBy: { isicCode: 'asc' } })
  const firstOccupation = await prisma.occupation.findFirst({ orderBy: { iscoCode: 'asc' } })

  if (!firstSector) console.warn('  WARNING: No sectors found. Run db:seed first.')
  if (!firstOccupation) console.warn('  WARNING: No occupations found. Run db:seed first.')

  // ── Look up education levels and sectors/occupations for seeker profiles ────
  const eduLevels = await prisma.educationLevel.findMany({ select: { id: true, iscedCode: true } })
  const eduMap = new Map(eduLevels.map(e => [e.iscedCode, e.id]))

  const allSectors = await prisma.sector.findMany({ select: { id: true, isicCode: true } })
  const sectorMap = new Map(allSectors.map(s => [s.isicCode, s.id]))

  const allOccupations = await prisma.occupation.findMany({ select: { id: true, iscoCode: true } })
  const occupationMap = new Map(allOccupations.map(o => [o.iscoCode, o.id]))

  const liberiaCountryId = liberia?.id ?? null

  // ── Employers + admin users ─────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Test@1234', 10)
  const createdEmployers: { id: string; companyName: string }[] = []

  for (const [i, spec] of EMPLOYERS.entries()) {
    const user = await prisma.user.upsert({
      where: { email: spec.email },
      update: {},
      create: {
        email: spec.email,
        passwordHash,
        role: 'EMPLOYER_ADMIN',
        fullName: `Admin ${spec.companyName}`,
        isEmailVerified: true,
      },
    })

    const stateId = states.length > 0 ? states[i % states.length]!.id : undefined

    const employer = await prisma.employer.upsert({
      where: { lraRegistrationNumber: spec.lraRegistrationNumber },
      update: {},
      create: {
        lraRegistrationNumber: spec.lraRegistrationNumber,
        companyName: spec.companyName,
        primaryContactName: `Admin ${spec.companyName}`,
        primaryContactEmail: spec.email,
        primaryContactPhone: spec.phone,
        vacationJobHosting: true,
        ...(stateId !== undefined ? { stateId } : {}),
      },
    })

    // EmployerUser link — upsert using the unique constraint on (employerId, userId)
    await prisma.employerUser.upsert({
      where: { employerId_userId: { employerId: employer.id, userId: user.id } },
      update: {},
      create: {
        employerId: employer.id,
        userId: user.id,
        role: 'ADMIN',
        isActive: true,
      },
    })

    createdEmployers.push({ id: employer.id, companyName: spec.companyName })
  }
  console.log(`  ${EMPLOYERS.length} employers + admin users`)

  // ── MoL staff users ─────────────────────────────────────────────────────────
  for (const spec of MOL_USERS) {
    await prisma.user.upsert({
      where: { email: spec.email },
      update: {},
      create: {
        email: spec.email,
        phoneNumber: spec.phone,
        passwordHash,
        role: spec.role,
        fullName: spec.fullName,
        isEmailVerified: true,
        isPhoneVerified: true,
      },
    })
  }
  console.log(`  ${MOL_USERS.length} MoL staff users`)

  // ── Vacancies ───────────────────────────────────────────────────────────────
  if (states.length === 0) {
    console.warn('  WARNING: Skipping vacancy creation — no Liberian states found (stateId is required).')
  } else {
    let vacanciesCreated = 0

    for (const employer of createdEmployers) {
      const existing = await prisma.vacancy.count({ where: { employerId: employer.id } })
      if (existing > 0) {
        console.log(`  Skipping vacancies for ${employer.companyName} — already has ${existing}`)
        continue
      }

      const vacanciesData = VACANCY_TITLES.map((title, idx) => ({
        employerId: employer.id,
        title,
        description: buildVacancyDescription(title, employer.companyName),
        applicationForm: buildApplicationForm(title),
        vacancyType: VACANCY_TYPES[idx % VACANCY_TYPES.length]!,
        stateId: states[idx % states.length]!.id,
        slotsAvailable: 2 + (idx % 5),
        deadline: new Date('2026-12-31'),
        status: idx < 7 ? ('ACTIVE' as const) : ('DRAFT' as const),
        postedAt: idx < 7 ? new Date() : null,
        sectorId: firstSector?.id ?? null,
        occupationId: firstOccupation?.id ?? null,
      }))

      await prisma.vacancy.createMany({ data: vacanciesData })
      vacanciesCreated += vacanciesData.length
    }

    console.log(`  ${vacanciesCreated} vacancies created`)
  }

  // ── Job seekers ─────────────────────────────────────────────────────────────
  let seekersCreated = 0

  for (const [i, profile] of SEEKER_PROFILES.entries()) {
    const phoneNumber = `+231771000${String(i + 1).padStart(2, '0')}`

    const user = await prisma.user.upsert({
      where: { phoneNumber },
      update: {},
      create: {
        phoneNumber,
        email: profile.email,
        passwordHash,
        fullName: profile.fullName,
        role: 'INDIVIDUAL',
        gender: profile.gender,
        dateOfBirth: new Date(profile.dateOfBirth),
        isPhoneVerified: true,
        isEmailVerified: true,
      },
    })

    let individual = await prisma.individual.findUnique({ where: { userId: user.id } })
    if (!individual) {
      individual = await prisma.individual.create({
        data: {
          userId: user.id,
          nin: profile.nin,
          educationLevelId: eduMap.get(profile.educationLevel) ?? null,
          vacationJobOptIn: profile.vacationJobOptIn,
          profileCompletionPct: 85,
          ...(profile.vacationJobOptIn ? { vacationJobOptInAt: new Date() } : {}),
        },
      })
      seekersCreated++
    }

    // Address (Liberia, rotate through states)
    if (liberiaCountryId) {
      const existingAddress = await prisma.address.findUnique({ where: { userId: user.id } })
      if (!existingAddress) {
        await prisma.address.create({
          data: {
            userId: user.id,
            countryId: liberiaCountryId,
            ...(states.length > 0 ? { stateId: states[i % states.length]!.id } : {}),
          },
        })
      }
    }

    // Education
    const existingEdu = await prisma.individualEducation.count({ where: { individualId: individual.id } })
    if (existingEdu === 0) {
      for (const edu of profile.education as { institutionName: string; qualification?: string; fieldOfStudy?: string; iscedCode: string; startDate?: string; endDate?: string; isCurrent?: boolean }[]) {
        await prisma.individualEducation.create({
          data: {
            individualId: individual.id,
            institutionName: edu.institutionName,
            qualification: edu.qualification ?? null,
            fieldOfStudy: edu.fieldOfStudy ?? null,
            educationLevelId: eduMap.get(edu.iscedCode) ?? null,
            startDate: edu.startDate ? new Date(edu.startDate) : null,
            endDate: edu.endDate ? new Date(edu.endDate) : null,
            isCurrent: edu.isCurrent ?? false,
            source: 'MANUAL',
          },
        })
      }
    }

    // Work history
    const existingWork = await prisma.individualWorkHistory.count({ where: { individualId: individual.id } })
    if (existingWork === 0) {
      for (const job of profile.workHistory as { employerName: string; title?: string; iscoCode: string; startDate?: string; endDate?: string; isCurrent?: boolean; description?: string }[]) {
        await prisma.individualWorkHistory.create({
          data: {
            individualId: individual.id,
            employerName: job.employerName,
            title: job.title ?? null,
            occupationId: occupationMap.get(job.iscoCode) ?? null,
            startDate: job.startDate ? new Date(job.startDate) : null,
            endDate: job.endDate ? new Date(job.endDate) : null,
            isCurrent: job.isCurrent ?? false,
            description: job.description ?? null,
            source: 'MANUAL',
          },
        })
      }
    }

    // Skills
    const existingSkills = await prisma.individualSkill.count({ where: { individualId: individual.id } })
    if (existingSkills === 0) {
      await prisma.individualSkill.createMany({
        data: profile.skills.map(skill => ({
          individualId: individual!.id,
          skillName: skill.skillName,
          proficiency: skill.proficiency,
          yearsExperience: skill.yearsExperience ?? null,
        })),
      })
    }

    // Sector interests
    const existingInterests = await prisma.individualSectorInterest.count({ where: { individualId: individual.id } })
    if (existingInterests === 0) {
      for (const [order, isicCode] of profile.sectorInterests.entries()) {
        const sectorId = sectorMap.get(isicCode)
        if (sectorId) {
          await prisma.individualSectorInterest.create({
            data: {
              individualId: individual.id,
              sectorId,
              priorityOrder: order,
            },
          })
        }
      }
    }
  }

  console.log(`  ${seekersCreated} new job seekers created (${SEEKER_PROFILES.length} total checked)`)

  // ── Program cycles ──────────────────────────────────────────────────────────
  const cycles = buildProgramCycles()
  let cyclesCreated = 0

  for (const cycle of cycles) {
    const existing = await prisma.programCycle.findFirst({
      where: { name: cycle.name, year: cycle.year },
    })
    if (existing) continue

    await prisma.programCycle.create({
      data: {
        type: 'VACATION_JOB',
        name: cycle.name,
        description: buildProgramDescription(cycle),
        year: cycle.year,
        startDate: cycle.startDate,
        endDate: cycle.endDate,
        status: cycle.status,
      },
    })
    cyclesCreated++
  }

  console.log(`  ${cyclesCreated} program cycles created (${cycles.length} total checked)`)
  console.log('\nDone. Test data seeded successfully.')
}

main()
  .catch((err) => {
    console.error('Test seed failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
