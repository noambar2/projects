export type LinkType = 'mockup' | 'figma' | 'git' | 'env'

export interface ProjectLink {
  type: LinkType
  url: string
  /** Required for env links; the other types have a fixed label. */
  label?: string
}

export interface ProjectSection {
  title: string
  /** Where the mockup can be opened. Set only on sections with a mockup link. */
  mockupDevice?: 'mobile' | 'desktop'
  links: ProjectLink[]
}

export interface Project {
  title: string
  note?: string
  area?: string
  /** Where the mockup can be opened. Set only on projects with a mockup link. */
  mockupDevice?: 'mobile' | 'desktop'
  links: ProjectLink[]
  /** Parts of the project with links of their own, shown under the project's links. */
  sections?: ProjectSection[]
}

const MALSHABIA_FIGMA = 'https://www.figma.com/design/fub6Qx5498BVhspyx26p0x/%D7%9E%D7%9C%D7%A9%D7%B4%D7%91%D7%99%D7%94'
const AI_MALSHAB_GIT = 'https://github.com/noambar2/ai-malshab'

export const projects: Project[] = [
  {
    title: 'אתר מתגייסים',
    mockupDevice: 'mobile',
    links: [
      { type: 'mockup', url: 'https://noambar2.github.io/MitgMockup/' },
      { type: 'figma', url: 'https://www.figma.com/design/vipNN5WWANGtIqvF11ijMi/%D7%90%D7%AA%D7%A8-%D7%9E%D7%AA%D7%92%D7%99%D7%99%D7%A1%D7%99%D7%9D-%D7%94%D7%97%D7%93%D7%A9?node-id=0-1&t=RIoPJOxmp8OQsWt5-1' },
      { type: 'git', url: 'https://github.com/noambar2/MitgMockup' },
    ],
  },
  {
    title: 'שביט',
    note: 'תנופה / דף בית מלש״ביה',
    mockupDevice: 'desktop',
    links: [
      { type: 'mockup', url: 'https://noambar2.github.io/shavit-dashboard/' },
      { type: 'figma', url: 'https://www.figma.com/design/sesEpeQbogqsLcQsBhzTG5/%D7%A9%D7%91%D7%99%D7%98?node-id=92-11532&t=mDwFC7elGEjTm8PW-1' },
      { type: 'git', url: 'https://github.com/noambar2/shavit-dashboard' },
    ],
  },
  {
    title: 'פרטי מלש״ב',
    note: 'כולל סיכום חכם ועוזר חכם',
    area: 'מלש״ביה',
    mockupDevice: 'desktop',
    links: [
      { type: 'mockup', url: 'https://noambar2.github.io/ai-malshab/#/malshab' },
      { type: 'figma', url: `${MALSHABIA_FIGMA}?node-id=7008-236542` },
      { type: 'git', url: AI_MALSHAB_GIT },
    ],
  },
  {
    title: 'משתמטים',
    note: 'כולל הצעה חכמה בתהליך הכרזה',
    area: 'מלש״ביה',
    mockupDevice: 'desktop',
    links: [
      { type: 'mockup', url: 'https://noambar2.github.io/ai-malshab/#/dodgers' },
      { type: 'figma', url: `${MALSHABIA_FIGMA}?node-id=7164-17270` },
      { type: 'git', url: AI_MALSHAB_GIT },
    ],
  },
  {
    title: 'דירקטיבות',
    area: 'מלש״ביה',
    mockupDevice: 'desktop',
    links: [
      { type: 'mockup', url: 'https://noambar2.github.io/ai-malshab/#/directives' },
      { type: 'figma', url: `${MALSHABIA_FIGMA}?node-id=8132-10911` },
      { type: 'git', url: AI_MALSHAB_GIT },
    ],
  },
  {
    title: 'קהילות, לשכה דיגיטלית וראיון לכל',
    links: [
      { type: 'figma', url: 'https://www.figma.com/design/ZymO7V3gaIfw1bAmskFR6l/Lishka?node-id=3727-60354&t=nnSXvTnuXunTW9UGb-' },
      { type: 'env', url: 'https://communities.malshab.idf.il', label: 'קהילות prod' },
      { type: 'env', url: 'https://communities.preprod.malshab.idf.il/login', label: 'קהילות preprod' },
    ],
    sections: [
      {
        title: 'צו בצוותא',
        mockupDevice: 'desktop',
        links: [
          { type: 'mockup', url: 'https://noambar2.github.io/communities/' },
          { type: 'git', url: 'https://github.com/noambar2/communities' },
        ],
      },
    ],
  },
  {
    title: 'AI ואפי',
    links: [{ type: 'git', url: 'https://github.com/WafiKhanjer/RAG-Malshabia' }],
  },
  {
    title: 'חוקות',
    links: [{ type: 'figma', url: 'https://www.figma.com/design/rzxaGQIrp5YJ2IadwVDhdz/%D7%A2%D7%99%D7%A6%D7%95%D7%91-%D7%9E%D7%A2%D7%A8%D7%9B%D7%AA-%D7%97%D7%95%D7%A7%D7%95%D7%AA?node-id=0-1&t=w0WAufwJnsfviMo6-1' }],
  },
  {
    title: 'דפ״ר בשחור',
    links: [{ type: 'figma', url: 'https://www.figma.com/design/xbD1Z44MHS3uzMatYfEVpZ/%D7%93%D7%A4%D7%B4%D7%A8-%D7%91%D7%A9%D7%97%D7%95%D7%A8?node-id=0-1&t=wC8rUBUFET3avr88-1' }],
  },
  {
    title: 'תחנות',
    links: [{ type: 'figma', url: 'https://www.figma.com/design/mEkJZ9NzDjZFpSaM5kTTip/%D7%AA%D7%97%D7%A0%D7%95%D7%AA?node-id=930-3623&t=4LIXoDXe4bIEk181-1' }],
  },
]

/** Every project with a mockup, for linking a task to one. */
export const mockups = projects.flatMap((project) =>
  [project, ...(project.sections ?? [])].flatMap((item) =>
    item.links
      .filter((link) => link.type === 'mockup')
      .map((link) => ({ title: item.title, url: link.url, device: item.mockupDevice })),
  ),
)
