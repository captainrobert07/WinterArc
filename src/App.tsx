import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, ComponentType } from 'react'
import {
  Activity,
  AlarmClock,
  BarChart3,
  Bell,
  BookOpen,
  Brain,
  CalendarDays,
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Cigarette,
  CircleSlash,
  Dumbbell,
  Flame,
  Footprints,
  Home,
  Moon,
  Smartphone,
  Target,
  Trash2,
  Trophy,
  Upload,
  User,
  Utensils,
  Wine,
} from 'lucide-react'
import './App.css'

type Person = 'Kristom' | 'Hanna'
type Tab = 'home' | 'calendar' | 'progress' | 'profile'
type ViewMode = 'week' | 'month' | 'arc'
type IconType = ComponentType<{ size?: number; strokeWidth?: number; className?: string }>

type Habit = {
  id: string
  name: string
  helper: string
  icon: IconType
}

type DailyEntry = {
  completed: Record<string, boolean>
  note: string
  photo?: string
  updatedAt?: string
}

type AppData = Record<Person, Record<string, DailyEntry>>

const STORAGE_KEY = 'winter-arc-2026-local-state-v1'
const PROFILE_KEY = 'winter-arc-2026-active-profile'
const START_DATE = '2026-10-01'
const END_DATE = '2026-12-31'
const TOTAL_DAYS = 92
const PARTICIPANTS: Person[] = ['Kristom', 'Hanna']

const habits: Habit[] = [
  { id: 'wake', name: 'Wake Up by 6:30 AM', helper: 'Start before the day starts asking questions.', icon: AlarmClock },
  { id: 'gym', name: 'Morning Gym / Workout', helper: 'Training, mobility, cardio, or a disciplined session.', icon: Dumbbell },
  { id: 'junk', name: 'No Junk Food', helper: 'Keep the fuel clean today.', icon: Utensils },
  { id: 'sugar', name: 'No Added Sugar', helper: 'Skip sweets, sugary drinks, and sneaky extras.', icon: CircleSlash },
  { id: 'photo', name: 'Take Progress Photo', helper: 'Upload a private progress check-in for this day.', icon: Camera },
  { id: 'learning', name: 'Learning', helper: 'Build one useful skill block.', icon: Brain },
  { id: 'reading', name: 'Read Minimum 15 Minutes', helper: 'A focused page count beats a perfect setup.', icon: BookOpen },
  { id: 'alcohol', name: 'No Alcohol', helper: 'Checking means you avoided alcohol.', icon: Wine },
  { id: 'smoking', name: 'No Smoking / Vape', helper: 'Checking means no smoking or vaping.', icon: Cigarette },
  { id: 'social', name: 'No Social Media', helper: 'No recreational scrolling.', icon: Smartphone },
  { id: 'steps', name: '10,000 Steps', helper: 'Walk the distance, close the loop.', icon: Footprints },
  { id: 'sleep', name: '8 Hours Sleep', helper: 'Protect recovery like training.', icon: Moon },
]

const emptyEntry = (): DailyEntry => ({
  completed: Object.fromEntries(habits.map((habit) => [habit.id, false])),
  note: '',
})

const emptyData = (): AppData => ({
  Kristom: {},
  Hanna: {},
})

function dateFromKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 12))
}

function keyFromDate(date: Date) {
  const year = date.getUTCFullYear()
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0')
  const day = `${date.getUTCDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addDays(dateKey: string, amount: number) {
  const date = dateFromKey(dateKey)
  date.setUTCDate(date.getUTCDate() + amount)
  return keyFromDate(date)
}

function daysBetween(startKey: string, endKey: string) {
  const start = dateFromKey(startKey).getTime()
  const end = dateFromKey(endKey).getTime()
  return Math.round((end - start) / 86_400_000)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function todayInKolkata() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const year = parts.find((part) => part.type === 'year')?.value ?? '2026'
  const month = parts.find((part) => part.type === 'month')?.value ?? '10'
  const day = parts.find((part) => part.type === 'day')?.value ?? '01'

  return `${year}-${month}-${day}`
}

function formatDay(dateKey: string, compact = false) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: compact ? undefined : 'long',
    month: compact ? 'short' : 'long',
    day: 'numeric',
  }).format(dateFromKey(dateKey))
}

function dayNumber(dateKey: string) {
  return clamp(daysBetween(START_DATE, dateKey) + 1, 1, TOTAL_DAYS)
}

function allChallengeDates() {
  return Array.from({ length: TOTAL_DAYS }, (_, index) => addDays(START_DATE, index))
}

function completedCount(entry: DailyEntry) {
  return habits.reduce((count, habit) => count + (entry.completed[habit.id] ? 1 : 0), 0)
}

function percentFromParts(done: number, total: number) {
  if (!total) return 0
  return Math.round((done / total) * 100)
}

function ensureEntry(data: AppData, person: Person, dateKey: string) {
  return data[person][dateKey] ?? emptyEntry()
}

function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyData()
    const parsed = JSON.parse(raw) as AppData
    return {
      Kristom: parsed.Kristom ?? {},
      Hanna: parsed.Hanna ?? {},
    }
  } catch {
    return emptyData()
  }
}

function loadProfile(): Person {
  const saved = localStorage.getItem(PROFILE_KEY)
  return saved === 'Hanna' ? 'Hanna' : 'Kristom'
}

function scoreMessage(percent: number) {
  if (percent === 100) return 'Perfect day.'
  if (percent >= 76) return 'Almost a perfect day.'
  if (percent >= 51) return 'Keep pushing.'
  if (percent >= 26) return 'Momentum is building.'
  return 'Start strong.'
}

function monthName(monthIndex: number) {
  return ['October', 'November', 'December'][monthIndex]
}

function getMonthDates(monthIndex: number) {
  const start = ['2026-10-01', '2026-11-01', '2026-12-01'][monthIndex]
  const length = [31, 30, 31][monthIndex]
  return Array.from({ length }, (_, index) => addDays(start, index))
}

function useLocalState() {
  const [data, setData] = useState<AppData>(() => loadData())

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  return [data, setData] as const
}

function buildStats(data: AppData, person: Person, todayKey: string) {
  const dates = allChallengeDates()
  const elapsedDates = dates.filter((date) => date <= todayKey)
  const entries = elapsedDates.map((date) => ensureEntry(data, person, date))
  const completed = entries.reduce((sum, entry) => sum + completedCount(entry), 0)
  const denominator = elapsedDates.length * habits.length
  const perfectDates = elapsedDates.filter((date) => completedCount(ensureEntry(data, person, date)) === habits.length)
  const habitRates = habits.map((habit) => {
    const done = elapsedDates.reduce((sum, date) => sum + (ensureEntry(data, person, date).completed[habit.id] ? 1 : 0), 0)
    return { ...habit, done, total: elapsedDates.length, percent: percentFromParts(done, elapsedDates.length) }
  })

  let currentStreak = 0
  for (let index = elapsedDates.length - 1; index >= 0; index -= 1) {
    const date = elapsedDates[index]
    const done = completedCount(ensureEntry(data, person, date))

    if (done === habits.length) {
      currentStreak += 1
      continue
    }

    if (date === todayKey) continue
    break
  }

  let longestStreak = 0
  let running = 0
  elapsedDates.forEach((date) => {
    if (completedCount(ensureEntry(data, person, date)) === habits.length) {
      running += 1
      longestStreak = Math.max(longestStreak, running)
    } else {
      running = 0
    }
  })

  return {
    completed,
    denominator,
    overallPercent: percentFromParts(completed, denominator),
    perfectDays: perfectDates.length,
    currentStreak,
    longestStreak,
    habitRates,
    elapsedDays: elapsedDates.length,
    challengePercent: percentFromParts(elapsedDates.length, TOTAL_DAYS),
  }
}

function ProgressRing({
  percent,
  size = 172,
  label,
}: {
  percent: number
  size?: number
  label: string
}) {
  const radius = 48
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference

  return (
    <div className="progress-ring" style={{ width: size, height: size }} aria-label={`${label} ${percent}%`}>
      <svg viewBox="0 0 120 120" role="img" aria-hidden="true">
        <circle className="ring-track" cx="60" cy="60" r={radius} />
        <circle
          className="ring-value"
          cx="60"
          cy="60"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="ring-center">
        <strong>{percent}%</strong>
        <span>{label}</span>
      </div>
    </div>
  )
}

function MetricCard({ icon: Icon, label, value }: { icon: IconType; label: string; value: string }) {
  return (
    <div className="metric-card">
      <Icon size={18} aria-hidden="true" />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function HabitCard({
  habit,
  completed,
  disabled,
  photo,
  onToggle,
  onPhoto,
  onDeletePhoto,
}: {
  habit: Habit
  completed: boolean
  disabled: boolean
  photo?: string
  onToggle: () => void
  onPhoto: (event: ChangeEvent<HTMLInputElement>) => void
  onDeletePhoto: () => void
}) {
  const Icon = habit.icon
  const isPhoto = habit.id === 'photo'

  return (
    <article className={`habit-card ${completed ? 'complete' : ''} ${disabled ? 'disabled' : ''}`}>
      <button className="habit-main" type="button" onClick={onToggle} disabled={disabled}>
        <span className="habit-icon">
          <Icon size={21} aria-hidden="true" />
        </span>
        <span className="habit-copy">
          <strong>{habit.name}</strong>
          <small>{habit.helper}</small>
        </span>
        <span className="habit-check" aria-hidden="true">
          {completed && <Check size={17} strokeWidth={3} />}
        </span>
      </button>

      {isPhoto && !disabled && (
        <div className="photo-actions">
          <label className="mini-action">
            <Upload size={15} aria-hidden="true" />
            {photo ? 'Replace photo' : 'Upload photo'}
            <input accept="image/*" type="file" onChange={onPhoto} />
          </label>
          {photo && (
            <>
              <a className="mini-action" href={photo} target="_blank" rel="noreferrer">
                View photo
              </a>
              <button className="mini-action danger" type="button" onClick={onDeletePhoto}>
                <Trash2 size={15} aria-hidden="true" />
                Delete
              </button>
            </>
          )}
        </div>
      )}
    </article>
  )
}

function DailyChecklist({
  entry,
  disabled,
  onToggle,
  onNote,
  onPhoto,
  onDeletePhoto,
}: {
  entry: DailyEntry
  disabled: boolean
  onToggle: (habitId: string) => void
  onNote: (note: string) => void
  onPhoto: (event: ChangeEvent<HTMLInputElement>) => void
  onDeletePhoto: () => void
}) {
  return (
    <section className="section-stack">
      <div className="section-title-row">
        <h2>Today's Rules</h2>
        <span>{completedCount(entry)} / 12</span>
      </div>
      <div className="habit-list">
        {habits.map((habit) => (
          <HabitCard
            key={habit.id}
            habit={habit}
            completed={Boolean(entry.completed[habit.id])}
            disabled={disabled}
            photo={entry.photo}
            onToggle={() => onToggle(habit.id)}
            onPhoto={onPhoto}
            onDeletePhoto={onDeletePhoto}
          />
        ))}
      </div>
      <label className="note-card">
        <span>Daily note</span>
        <textarea
          maxLength={500}
          value={entry.note}
          placeholder="Add a private note..."
          onChange={(event) => onNote(event.target.value)}
          disabled={disabled}
        />
      </label>
    </section>
  )
}

function App() {
  const [data, setData] = useLocalState()
  const [activePerson, setActivePerson] = useState<Person>(() => loadProfile())
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [todayKey, setTodayKey] = useState(() => todayInKolkata())
  const [selectedDate, setSelectedDate] = useState(() => todayInKolkata())
  const [monthIndex, setMonthIndex] = useState(() => clamp(dateFromKey(todayInKolkata()).getUTCMonth() - 9, 0, 2))
  const [progressMode, setProgressMode] = useState<ViewMode>('month')
  const [celebrate, setCelebrate] = useState(false)

  const currentEntry = ensureEntry(data, activePerson, selectedDate)
  const todayEntry = ensureEntry(data, activePerson, todayKey)
  const partner = activePerson === 'Kristom' ? 'Hanna' : 'Kristom'
  const partnerToday = ensureEntry(data, partner, todayKey)
  const selectedIsFuture = selectedDate > todayKey || selectedDate < START_DATE
  const selectedIsPast = selectedDate < todayKey && selectedDate >= START_DATE
  const selectedPercent = percentFromParts(completedCount(currentEntry), habits.length)
  const stats = useMemo(() => buildStats(data, activePerson, todayKey), [data, activePerson, todayKey])
  const partnerStats = useMemo(() => buildStats(data, partner, todayKey), [data, partner, todayKey])

  useEffect(() => {
    localStorage.setItem(PROFILE_KEY, activePerson)
  }, [activePerson])

  useEffect(() => {
    const timer = window.setInterval(() => {
      const nextToday = todayInKolkata()
      setTodayKey((current) => {
        if (current === nextToday) return current
        setSelectedDate(nextToday)
        setMonthIndex(clamp(dateFromKey(nextToday).getUTCMonth() - 9, 0, 2))
        return nextToday
      })
    }, 30_000)

    return () => window.clearInterval(timer)
  }, [])

  const updateEntry = (dateKey: string, updater: (entry: DailyEntry) => DailyEntry) => {
    setData((current) => {
      const existing = ensureEntry(current, activePerson, dateKey)
      const nextEntry = updater({ ...existing, completed: { ...existing.completed } })

      return {
        ...current,
        [activePerson]: {
          ...current[activePerson],
          [dateKey]: {
            ...nextEntry,
            updatedAt: new Date().toISOString(),
          },
        },
      }
    })
  }

  const toggleHabit = (habitId: string) => {
    if (selectedIsFuture) return

    const wasPerfect = completedCount(currentEntry) === habits.length
    updateEntry(selectedDate, (entry) => {
      entry.completed[habitId] = !entry.completed[habitId]
      return entry
    })

    const nextCompleted = currentEntry.completed[habitId] ? completedCount(currentEntry) - 1 : completedCount(currentEntry) + 1
    if (!wasPerfect && nextCompleted === habits.length) {
      setCelebrate(true)
      window.setTimeout(() => setCelebrate(false), 1800)
    }
  }

  const updateNote = (note: string) => {
    if (selectedIsFuture) return
    updateEntry(selectedDate, (entry) => ({ ...entry, note }))
  }

  const updatePhoto = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || selectedIsFuture) return

    const reader = new FileReader()
    reader.onload = () => {
      updateEntry(selectedDate, (entry) => ({
        ...entry,
        photo: String(reader.result),
        completed: { ...entry.completed, photo: true },
      }))
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const deletePhoto = () => {
    if (selectedIsFuture) return
    updateEntry(selectedDate, (entry) => ({
      ...entry,
      photo: undefined,
      completed: { ...entry.completed, photo: false },
    }))
  }

  const openDate = (dateKey: string) => {
    setSelectedDate(dateKey)
    setActiveTab('home')
  }

  const remainingHabits = habits.filter((habit) => !todayEntry.completed[habit.id])
  const challengeState = todayKey < START_DATE ? 'before' : todayKey > END_DATE ? 'complete' : 'active'

  return (
    <main className="app-shell">
      {celebrate && (
        <div className="perfect-burst" role="status" aria-live="polite">
          <span>Perfect Day</span>
          <strong>12 / 12</strong>
        </div>
      )}

      <header className="top-header">
        <div>
          <p>{formatDay(todayKey, true)}</p>
          <h1>Hi {activePerson}</h1>
        </div>
        <button className="icon-button" type="button" aria-label="Notifications prepared">
          <Bell size={20} />
        </button>
      </header>

      <section className="profile-switch" aria-label="Profile switcher">
        {PARTICIPANTS.map((person) => (
          <button key={person} className={person === activePerson ? 'active' : ''} type="button" onClick={() => setActivePerson(person)}>
            {person}
          </button>
        ))}
      </section>

      {activeTab === 'home' && (
        <>
          {challengeState === 'before' && (
            <section className="hero-card">
              <span className="eyebrow">Winter Arc Begins In</span>
              <strong>{Math.max(0, daysBetween(todayKey, START_DATE))} Days</strong>
              <p>October 1 to December 31. Your first checklist opens automatically.</p>
            </section>
          )}

          {challengeState === 'complete' && (
            <section className="edit-banner">
              <strong>Winter Arc Complete</strong>
              <span>Your full challenge history is still available.</span>
            </section>
          )}

          <section className="hero-card">
            <div className="hero-topline">
              <span>{selectedDate === todayKey ? 'Day Today' : selectedIsPast ? 'Past Day' : 'Not Started'}</span>
              <span>Day {dayNumber(selectedDate)} of 92</span>
            </div>
            <div className="hero-content">
              <ProgressRing percent={selectedPercent} label={selectedDate === todayKey ? 'Today' : 'Score'} />
              <div>
                <p>{formatDay(selectedDate)}</p>
                <strong>{completedCount(currentEntry)} / 12</strong>
                <span>{selectedIsFuture ? 'Not started yet.' : `${12 - completedCount(currentEntry)} left`}</span>
              </div>
            </div>
            <p className="score-message">{selectedIsFuture ? 'Future days stay locked.' : scoreMessage(selectedPercent)}</p>
          </section>

          {selectedIsPast && (
            <section className="edit-banner">
              <strong>Past Day</strong>
              <span>You're editing {formatDay(selectedDate)}. Changes update your stats instantly.</span>
            </section>
          )}

          <section className="quick-grid">
            <MetricCard icon={Flame} label="Current Streak" value={`${stats.currentStreak} Days`} />
            <MetricCard icon={Trophy} label="Perfect Days" value={`${stats.perfectDays}`} />
            <MetricCard icon={Target} label="Overall" value={`${stats.overallPercent}%`} />
          </section>

          <section className="status-card">
            <div>
              <span>Winter Arc Progress</span>
              <strong>{stats.challengePercent}%</strong>
            </div>
            <div className="linear-track" aria-hidden="true">
              <span style={{ width: `${stats.challengePercent}%` }} />
            </div>
            <p>{stats.elapsedDays} / 92 days elapsed in Asia/Kolkata.</p>
          </section>

          <section className="partner-card">
            <div>
              <span>{partner} Today</span>
              <strong>{completedCount(partnerToday)} / 12</strong>
            </div>
            <ProgressRing percent={percentFromParts(completedCount(partnerToday), habits.length)} size={96} label={partner} />
          </section>

          <section className="remaining-card">
            <span>{remainingHabits.length === 0 ? 'Today Complete' : `${remainingHabits.length} Left Today`}</span>
            <div>
              {remainingHabits.slice(0, 5).map((habit) => {
                const Icon = habit.icon
                return (
                  <span key={habit.id} title={habit.name}>
                    <Icon size={16} />
                  </span>
                )
              })}
            </div>
          </section>

          <DailyChecklist
            entry={currentEntry}
            disabled={selectedIsFuture}
            onToggle={toggleHabit}
            onNote={updateNote}
            onPhoto={updatePhoto}
            onDeletePhoto={deletePhoto}
          />
        </>
      )}

      {activeTab === 'calendar' && (
        <section className="page-panel">
          <div className="screen-heading">
            <div>
              <span>History</span>
              <h2>{monthName(monthIndex)} 2026</h2>
            </div>
            <div className="month-controls">
              <button type="button" onClick={() => setMonthIndex((value) => clamp(value - 1, 0, 2))} aria-label="Previous month">
                <ChevronLeft size={18} />
              </button>
              <button type="button" onClick={() => setMonthIndex((value) => clamp(value + 1, 0, 2))} aria-label="Next month">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          <CalendarGrid data={data} person={activePerson} todayKey={todayKey} monthIndex={monthIndex} openDate={openDate} />
        </section>
      )}

      {activeTab === 'progress' && (
        <section className="page-panel">
          <div className="screen-heading">
            <div>
              <span>Progress</span>
              <h2>Winter Arc</h2>
            </div>
          </div>
          <div className="segmented">
            {(['week', 'month', 'arc'] as ViewMode[]).map((mode) => (
              <button key={mode} className={progressMode === mode ? 'active' : ''} type="button" onClick={() => setProgressMode(mode)}>
                {mode}
              </button>
            ))}
          </div>
          <ProgressView
            data={data}
            person={activePerson}
            partner={partner}
            stats={stats}
            partnerStats={partnerStats}
            todayKey={todayKey}
            mode={progressMode}
          />
        </section>
      )}

      {activeTab === 'profile' && (
        <section className="page-panel">
          <div className="profile-card">
            <div className="avatar">{activePerson.slice(0, 1)}</div>
            <span>Active Profile</span>
            <h2>{activePerson}</h2>
            <p>Winter Arc 2026 runs October 1 to December 31. No login is required in this Vercel-ready mobile build.</p>
          </div>
          <section className="quick-grid">
            <MetricCard icon={Activity} label="Habits Done" value={`${stats.completed}`} />
            <MetricCard icon={Flame} label="Longest Streak" value={`${stats.longestStreak}`} />
            <MetricCard icon={Target} label="Day" value={`${dayNumber(todayKey)} / 92`} />
          </section>
          <section className="rules-card">
            <h2>Challenge Rules</h2>
            {habits.map((habit, index) => (
              <p key={habit.id}>
                <span>{index + 1}</span>
                {habit.name}
              </p>
            ))}
          </section>
        </section>
      )}

      <nav className="bottom-nav" aria-label="Primary navigation">
        {[
          ['home', Home, 'Home'],
          ['calendar', CalendarDays, 'Calendar'],
          ['progress', BarChart3, 'Progress'],
          ['profile', User, 'Profile'],
        ].map(([tab, Icon, label]) => {
          const NavIcon = Icon as IconType
          return (
            <button key={tab as string} className={activeTab === tab ? 'active' : ''} type="button" onClick={() => setActiveTab(tab as Tab)}>
              <NavIcon size={20} />
              <span>{label as string}</span>
            </button>
          )
        })}
      </nav>
    </main>
  )
}

function CalendarGrid({
  data,
  person,
  todayKey,
  monthIndex,
  openDate,
}: {
  data: AppData
  person: Person
  todayKey: string
  monthIndex: number
  openDate: (dateKey: string) => void
}) {
  const dates = getMonthDates(monthIndex)
  const firstDayOffset = dateFromKey(dates[0]).getUTCDay()
  const blanks = Array.from({ length: firstDayOffset === 0 ? 6 : firstDayOffset - 1 })

  return (
    <div className="calendar-card">
      <div className="weekday-row">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
          <span key={`${day}-${index}`}>{day}</span>
        ))}
      </div>
      <div className="calendar-grid">
        {blanks.map((_, index) => (
          <span key={`blank-${index}`} />
        ))}
        {dates.map((dateKey) => {
          const entry = ensureEntry(data, person, dateKey)
          const percent = percentFromParts(completedCount(entry), habits.length)
          const isFuture = dateKey > todayKey
          const className =
            percent === 100 ? 'perfect' : percent >= 75 ? 'strong' : percent >= 50 ? 'medium' : percent > 0 ? 'started' : ''

          return (
            <button key={dateKey} className={`${className} ${dateKey === todayKey ? 'today' : ''} ${isFuture ? 'future' : ''}`} type="button" onClick={() => openDate(dateKey)}>
              <span>{dateFromKey(dateKey).getUTCDate()}</span>
              <small>{isFuture ? '-' : `${percent}%`}</small>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ProgressView({
  data,
  person,
  partner,
  stats,
  partnerStats,
  todayKey,
  mode,
}: {
  data: AppData
  person: Person
  partner: Person
  stats: ReturnType<typeof buildStats>
  partnerStats: ReturnType<typeof buildStats>
  todayKey: string
  mode: ViewMode
}) {
  const lastSeven = allChallengeDates().filter((date) => date <= todayKey).slice(-7)

  return (
    <div className="progress-stack">
      <section className="arc-card">
        <ProgressRing percent={stats.overallPercent} size={190} label="Completion" />
        <div>
          <span>{person}</span>
          <h3>{stats.completed} / {stats.denominator || 0}</h3>
          <p>Habits completed against days elapsed so far.</p>
        </div>
      </section>

      {mode === 'week' && (
        <section className="week-card">
          {lastSeven.map((dateKey) => {
            const percent = percentFromParts(completedCount(ensureEntry(data, person, dateKey)), habits.length)
            return (
              <div key={dateKey}>
                <span style={{ height: `${Math.max(8, percent)}%` }} />
                <strong>{percent}%</strong>
                <small>{formatDay(dateKey, true).split(' ')[0]}</small>
              </div>
            )
          })}
        </section>
      )}

      {mode === 'month' && (
        <section className="month-stack">
          {[0, 1, 2].map((month) => {
            const dates = getMonthDates(month).filter((date) => date <= todayKey)
            const done = dates.reduce((sum, date) => sum + completedCount(ensureEntry(data, person, date)), 0)
            const total = dates.length * habits.length
            const percent = percentFromParts(done, total)

            return (
              <div className="month-card" key={monthName(month)}>
                <div>
                  <span>{monthName(month)}</span>
                  <strong>{percent}%</strong>
                </div>
                <p>{done} / {total || 0} habits</p>
                <div className="linear-track">
                  <span style={{ width: `${percent}%` }} />
                </div>
              </div>
            )
          })}
        </section>
      )}

      {mode === 'arc' && (
        <>
          <section className="comparison-card">
            <h2>{person} x {partner}</h2>
            <div className="compare-grid">
              <div>
                <span>{person}</span>
                <strong>{stats.overallPercent}%</strong>
                <small>{stats.perfectDays} perfect days</small>
              </div>
              <div>
                <span>{partner}</span>
                <strong>{partnerStats.overallPercent}%</strong>
                <small>{partnerStats.perfectDays} perfect days</small>
              </div>
            </div>
          </section>
          <section className="habit-performance">
            <h2>Habit Performance</h2>
            {stats.habitRates.map((habit) => {
              const Icon = habit.icon
              return (
                <div className="performance-row" key={habit.id}>
                  <Icon size={18} />
                  <span>{habit.name}</span>
                  <strong>{habit.percent}%</strong>
                  <div className="linear-track">
                    <span style={{ width: `${habit.percent}%` }} />
                  </div>
                </div>
              )
            })}
          </section>
        </>
      )}
    </div>
  )
}

export default App
