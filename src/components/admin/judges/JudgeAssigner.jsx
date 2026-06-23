import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { refereeService } from '@/services/refereeService'
import { publishRaceAssignments } from '@/services/refereeAssignmentService'
import {
  refereePaymentService,
  isRacePayoutLocked,
  REFEREE_PAYOUTS_UPDATED_EVENT,
} from '@/services/refereePaymentService'
import { isRaceCompletedForRefereePayout } from '@/utils/refereePayoutUtils'
import { getApiErrorMessage } from '@/utils/apiError'
import AssignedJudgesPanel from './AssignedJudgesPanel'
import RefereeInvitePanel from './RefereeInvitePanel'
import RefereePaymentPanel from './RefereePaymentPanel'
import JudgeWorkflowSteps from './JudgeWorkflowSteps'

const DEFAULT_JUDGE_ROLE = 'Trọng tài chính'
const MAX_REFEREES_PER_RACE = 1

function resolveAssignedRefereeId(race) {
  return race?.raw?.refereeId ?? race?.refereeId ?? null
}

export default function JudgeAssigner({ tournament, race, onChangeJudges, onAssigned }) {
  const assignments = race.judges ?? []
  const [referees, setReferees] = useState([])
  const [loadingReferees, setLoadingReferees] = useState(true)
  const [refereeError, setRefereeError] = useState('')
  const [saving, setSaving] = useState(false)
  const [payoutStatus, setPayoutStatus] = useState(null)

  const payoutLocked = isRacePayoutLocked(payoutStatus)
  const isPaid = payoutStatus?.status === 'PAID'
  const officialRefereeId = resolveAssignedRefereeId(race)
  const isOfficiallyAssigned = Boolean(officialRefereeId)
  const isRaceCompleted = isRaceCompletedForRefereePayout(race, tournament)

  const refreshPayoutStatus = useCallback(async () => {
    if (!race?.id) {
      setPayoutStatus(null)
      return
    }
    const status = await refereePaymentService.getRacePayoutStatus(race.id)
    setPayoutStatus(status)
  }, [race?.id])

  useEffect(() => {
    refreshPayoutStatus()
  }, [refreshPayoutStatus, officialRefereeId])

  useEffect(() => {
    const handleUpdated = () => refreshPayoutStatus()
    window.addEventListener(REFEREE_PAYOUTS_UPDATED_EVENT, handleUpdated)
    return () => window.removeEventListener(REFEREE_PAYOUTS_UPDATED_EVENT, handleUpdated)
  }, [refreshPayoutStatus])

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
    if (payoutLocked) {
      toast.error('Cuộc đua này đã thanh toán lương — không thể thêm trọng tài')
      return
    }
    if (assignedIds.has(refereeId)) return
    if (assignments.length >= MAX_REFEREES_PER_RACE) {
      toast.info('Mỗi cuộc đua chỉ có một trọng tài chính. Hãy gỡ trọng tài hiện tại trước khi chọn người khác.')
      return
    }
    onChangeJudges([...assignments, { refereeId, role: DEFAULT_JUDGE_ROLE }])
  }

  const removeJudge = (refereeId) => {
    if (payoutLocked) {
      toast.error('Cuộc đua này đã thanh toán lương — không thể thay đổi phân công')
      return
    }
    onChangeJudges(assignments.filter((item) => item.refereeId !== refereeId))
  }

  const inviteReferee = async (referee) => {
    if (!referee?.id) return
    if (payoutLocked) {
      toast.error('Cuộc đua này đã thanh toán lương — không thể gửi thêm lời mời')
      return
    }
    if (officialRefereeId && String(officialRefereeId) !== String(referee.id)) {
      toast.error('Cuộc đua đã có trọng tài. Không thể đổi trọng tài sau khi phân công.')
      return
    }

    try {
      setSaving(true)
      const assignment = [{ refereeId: referee.id, role: DEFAULT_JUDGE_ROLE }]
      publishRaceAssignments({ tournament, race, assignments: assignment, refereesById })
      await refereeService.assignRaceReferee(race.id, referee.id)
      onChangeJudges(assignment)
      toast.success(`Đã gửi lời mời/phân công tới ${referee.name}. Trọng tài sẽ thấy ở mục "Lời mời".`)
      onAssigned?.({ refereeId: referee.id })
    } catch (error) {
      toast.error(getApiErrorMessage(error) || 'Không thể gửi lời mời trọng tài')
    } finally {
      setSaving(false)
    }
  }

  const submitAssignment = async () => {
    if (payoutLocked) {
      toast.error('Cuộc đua này đã thanh toán lương — không thể gửi lại phân công')
      return
    }

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
      onAssigned?.({ refereeId: primary.refereeId })
    } catch (error) {
      toast.error(getApiErrorMessage(error) || 'Không thể gửi phân công trọng tài')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <JudgeWorkflowSteps
        hasSelection={assignments.length > 0}
        isAssigned={isOfficiallyAssigned}
        isRaceCompleted={isRaceCompleted}
        isPaid={isPaid}
        isLocked={payoutLocked}
      />

      <RefereeInvitePanel
        tournament={tournament}
        race={race}
        locked={payoutLocked}
        saving={saving}
        maxReached={assignments.length >= MAX_REFEREES_PER_RACE}
        assignedIds={assignedIds}
        officialRefereeId={officialRefereeId}
        onSelectForAssignment={(referee) => addJudge(referee.id)}
        onInviteReferee={inviteReferee}
      />

      <AssignedJudgesPanel
        race={race}
        assignments={assignments}
        refereesById={refereesById}
        saving={saving}
        locked={payoutLocked}
        isOfficiallyAssigned={isOfficiallyAssigned}
        onRemove={removeJudge}
        onSubmit={submitAssignment}
      />

      <RefereePaymentPanel
        tournament={tournament}
        race={race}
        refereesById={refereesById}
        payoutLocked={payoutLocked}
      />
    </div>
  )
}
