import { useMemo, useState } from 'react'
import { JUDGE_ROLES, MOCK_REFEREES } from '@/data/adminJudgeMock'
import AssignedJudgesPanel from './AssignedJudgesPanel'
import AvailableRefereesPanel from './AvailableRefereesPanel'

export default function JudgeAssigner({ race, onChangeJudges }) {
  const assignments = race.judges ?? []
  const [pickRole, setPickRole] = useState(JUDGE_ROLES[0])

  const refereesById = useMemo(
    () => new Map(MOCK_REFEREES.map((referee) => [referee.id, referee])),
    [],
  )
  const assignedIds = useMemo(
    () => new Set(assignments.map((item) => item.refereeId)),
    [assignments],
  )

  const chiefCount = assignments.filter((item) => item.role === 'Trọng tài chính').length
  const hasChief = chiefCount > 0
  const hasDoping = assignments.some((item) => item.role === 'Giám sát doping')
  const ready =
    hasChief &&
    chiefCount <= 1 &&
    hasDoping &&
    assignments.length >= 3

  const addJudge = (refereeId, role) => {
    if (assignedIds.has(refereeId)) return
    onChangeJudges([...assignments, { refereeId, role }])
  }

  const removeJudge = (refereeId) => {
    onChangeJudges(assignments.filter((item) => item.refereeId !== refereeId))
  }

  const changeRole = (refereeId, role) => {
    onChangeJudges(
      assignments.map((item) => (item.refereeId === refereeId ? { ...item, role } : item)),
    )
  }

  return (
    <div className="space-y-6">
      <AssignedJudgesPanel
        race={race}
        assignments={assignments}
        refereesById={refereesById}
        onClearAll={() => onChangeJudges([])}
        onRemove={removeJudge}
        onChangeRole={changeRole}
        ready={ready}
      />
      <AvailableRefereesPanel
        assignedIds={assignedIds}
        pickRole={pickRole}
        onPickRole={setPickRole}
        onAdd={addJudge}
      />
    </div>
  )
}
