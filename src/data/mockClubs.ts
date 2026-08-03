export interface ClubMember {
  id: number
  name: string
  className: string
  initials: string
  color: string
}

export type ClubWeekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export interface ClubScheduleSlot {
  id: string
  day: ClubWeekday
  startTime: string
  endTime: string
  location: string
}

export interface ClubAttendanceRecord {
  date: string
  presentMemberIds: number[]
  absentMemberIds: number[]
}

export interface MockClub {
  id: string
  clubName: string
  academicYear: string
  startDate: string
  endDate: string
  plan: string
  criteria: string
  attachmentNames: string[]
  memberIds: number[]
  schedule: ClubScheduleSlot[]
  attendanceRecords: ClubAttendanceRecord[]
}

export const mockClubMembers: ClubMember[] = [
  { id: 1, name: 'Aruzhan Sarsenova', className: '8A', initials: 'AS', color: 'bg-brand-100 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300' },
  { id: 2, name: 'Dias Akhmetov', className: '7B', initials: 'DA', color: 'bg-blue-light-100 text-blue-light-700 dark:bg-blue-light-500/20 dark:text-blue-light-300' },
  { id: 3, name: 'Amina Tulegenova', className: '9A', initials: 'AT', color: 'bg-success-100 text-success-700 dark:bg-success-500/20 dark:text-success-300' },
  { id: 4, name: 'Alikhan Nurzhan', className: '8B', initials: 'AN', color: 'bg-warning-100 text-warning-700 dark:bg-warning-500/20 dark:text-warning-300' },
  { id: 5, name: 'Sofia Kim', className: '7A', initials: 'SK', color: 'bg-theme-purple-500/10 text-theme-purple-500' },
  { id: 6, name: 'Miras Zhaksybek', className: '9B', initials: 'MZ', color: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-300' },
]

const STORAGE_KEY = 'qadam-lms-mock-clubs'

function getStoredMockClubs(): MockClub[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const clubs = stored ? JSON.parse(stored) as MockClub[] : []
    return clubs.map(normalizeClub)
  } catch {
    return []
  }
}

function normalizeClub(club: MockClub): MockClub {
  const firstYear = club.academicYear?.match(/\d{4}/)?.[0] ?? String(new Date().getFullYear())
  const secondYear = String(Number(firstYear) + 1)
  return {
    ...club,
    startDate: club.startDate ?? `${firstYear}-09-01`,
    endDate: club.endDate ?? `${secondYear}-05-31`,
    attachmentNames: club.attachmentNames ?? [],
    memberIds: club.memberIds ?? [],
    schedule: club.schedule ?? [],
    attendanceRecords: club.attendanceRecords ?? [],
  }
}

export function getAllMockClubs(): MockClub[] {
  return getStoredMockClubs()
}

export function getMockClub(id: string): MockClub | undefined {
  return getAllMockClubs().find(club => club.id === id)
}

export function saveMockClub(club: MockClub): void {
  const clubs = getStoredMockClubs()
  const index = clubs.findIndex(item => item.id === club.id)
  if (index >= 0) clubs[index] = normalizeClub(club)
  else clubs.unshift(normalizeClub(club))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clubs))
}

export function deleteMockClub(id: string): void {
  const clubs = getStoredMockClubs().filter(club => club.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clubs))
}

export function saveCreatedMockClub(club: MockClub): void {
  saveMockClub(club)
}
