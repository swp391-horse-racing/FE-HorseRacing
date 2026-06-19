import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { refereeService } from '@/services/refereeService'
import { publishRaceAssignments } from '@/services/refereeAssignmentService'
import { getApiErrorMessage } from '@/utils/apiError'
import AssignedJudgesPanel from './AssignedJudgesPanel'
import AvailableRefereesPanel from './AvailableRefereesPanel'

const DEFAULT_JUDGE_ROLE = 'Trọng tài chính'

export default function JudgeAssigner({ tournament, race, onChangeJudges, onAssigned }) {
  const assignments = race.judges ?? []
  const [referees, setReferees] = useState([])
  const [loadingReferees, setLoadingReferees] = useState(true)
  const [refereeError, setRefereeError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function loadReferees() {
      try {
        setLoadingReferees(true)
        const data = await refereeService.getAvailableReferees()
        if (!cancelled) {
          setReferees(data)
          setRefereeError('')
        }
      } catch (error) {
        if (!cancelled) {
          setReferees([])
          setRefereeError(getApiErrorMessage(error) || 'Không thể tải danh sách trọng tài')
        }
      } finally {
        if (!cancelled) setLoadingReferees(false)
      }
    }

    loadReferees()
    return () => {
      cancelled = true
    }
  }, [])

  const refereesById = useMemo(
    () => new Map(referees.map((referee) => [referee.id, referee])),
    [referees],
  )
  const assignedIds = useMemo(
    () => new Set(assignments.map((item) => item.refereeId)),
    [assignments],
  )

  const addJudge = (refereeId) => {
    if (assignedIds.has(refereeId)) return
    onChangeJudges([...assignments, { refereeId, role: DEFAULT_JUDGE_ROLE }])
  }

  const removeJudge = (refereeId) => {
    onChangeJudges(assignments.filter((item) => item.refereeId !== refereeId))
  }

  const submitAssignment = async () => {
    const primary = assignments[0]
    if (!primary) {
      toast.error('Phải chọn ít nhất một trọng tài trước khi gửi phân công')
      return
    }

    try {
      setSaving(true)
      publishRaceAssignments({
        tournament,
        race,
        assignments,
        refereesById,
      })

      await refereeService.assignRaceReferee(race.id, primary.refereeId)

      toast.success('Đã gửi phân công trọng tài. Trọng tài có thể xem cuộc đua được giao.')
      onAssigned?.(primary.refereeId)
    } catch (error) {
      toast.error(getApiErrorMessage(error) || 'Không thể gửi phân công trọng tài')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <AssignedJudgesPanel
        race={race}
        assignments={assignments}
        refereesById={refereesById}
        saving={saving}
        onRemove={removeJudge}
        onSubmit={submitAssignment}
      />
      <AvailableRefereesPanel
        referees={referees}
        loading={loadingReferees}
        error={refereeError}
        assignedIds={assignedIds}
        onAdd={addJudge}
      />
    </div>
  )
}
