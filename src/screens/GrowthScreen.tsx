import { useState } from 'react'
import { QuestsScreen } from './QuestsScreen'
import { SkillsScreen } from './SkillsScreen'
import { AchievementsGrid } from '../achievements/AchievementsGrid'
import { SegmentedTabs } from '../components/SegmentedTabs'

type GrowthTab = 'quests' | 'skills'

export function GrowthScreen() {
  const [tab, setTab] = useState<GrowthTab>('quests')

  return (
    <div className="space-y-4">
      <SegmentedTabs
        tabs={[
          { id: 'quests', label: 'Квесты' },
          { id: 'skills', label: 'Навыки' },
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === 'quests' ? <QuestsScreen /> : <SkillsScreen />}
      <AchievementsGrid />
    </div>
  )
}
