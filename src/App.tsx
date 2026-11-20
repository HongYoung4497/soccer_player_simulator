import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { TabShell } from './components/TabShell'
import { GameProvider } from './gameContext'
import { AuthScreen } from './screens/AuthScreen'
import { CareerTab } from './screens/CareerTab'
import { CreatePlayerScreen } from './screens/CreatePlayerScreen'
import { HistoryTab } from './screens/HistoryTab'
import { PlayerTab } from './screens/PlayerTab'
import {
  EventInjuryScreen,
  EventLoanScreen,
  EventRoleScreen,
  QuarterPrepScreen,
  QuarterProgressScreen,
  QuarterResultScreen,
} from './screens/QuarterScreens'
import {
  ConflictScreen,
  RetireScreen,
  SquadScreen,
} from './screens/RetireScreens'
import { SeasonTab } from './screens/SeasonTab'
import { SeasonWrapScreen } from './screens/SeasonWrapScreen'
import { TitleScreen } from './screens/TitleScreen'
import { YouthIntroScreen } from './screens/YouthIntroScreen'

export default function App() {
  return (
    <GameProvider>
      <BrowserRouter>
        <div className="phone-frame">
          <Routes>
            <Route path="/" element={<TitleScreen />} />
            <Route path="/auth" element={<AuthScreen />} />
            <Route path="/create" element={<CreatePlayerScreen />} />
            <Route path="/youth" element={<YouthIntroScreen />} />
            <Route path="/app" element={<TabShell />}>
              <Route index element={<Navigate to="season" replace />} />
              <Route path="season" element={<SeasonTab />} />
              <Route path="career" element={<CareerTab />} />
              <Route path="player" element={<PlayerTab />} />
              <Route path="history" element={<HistoryTab />} />
            </Route>
            <Route path="/quarter/prep" element={<QuarterPrepScreen />} />
            <Route path="/quarter/progress" element={<QuarterProgressScreen />} />
            <Route path="/quarter/result" element={<QuarterResultScreen />} />
            <Route path="/events/role" element={<EventRoleScreen />} />
            <Route path="/events/loan" element={<EventLoanScreen />} />
            <Route path="/events/injury" element={<EventInjuryScreen />} />
            <Route path="/season-wrap" element={<SeasonWrapScreen />} />
            <Route path="/retire" element={<RetireScreen />} />
            <Route path="/squad" element={<SquadScreen />} />
            <Route path="/conflict" element={<ConflictScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </BrowserRouter>
    </GameProvider>
  )
}
