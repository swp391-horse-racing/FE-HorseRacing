import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Gavel } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { PanelHeader } from "@/components/ui/Panel";
import JudgeAssigner from "@/components/admin/judges/JudgeAssigner";
import { refereeService } from "@/services/refereeService";
import { getPublishedAssignmentEntry } from "@/services/refereeAssignmentService";
import { tournamentService } from "@/services/tournamentService";
import { mapRaceForJudges } from "@/utils/judgeTournamentUtils";
import { toneForStatus } from "../utils";
import { formatDisplayDate } from "@/utils/dateFormat";

function resolveRefereeLabels(judgeRace, refereesById) {
  const published = getPublishedAssignmentEntry(judgeRace.id);
  if (published?.assignments?.length) {
    return published.assignments.map(
      (item) =>
        item.refereeName ||
        refereesById.get(String(item.refereeId))?.name ||
        "Trọng tài",
    );
  }

  if (judgeRace.raw?.refereeUsername) {
    return [judgeRace.raw.refereeUsername];
  }

  if (judgeRace.judges?.length) {
    return judgeRace.judges.map(
      (item) => refereesById.get(String(item.refereeId))?.name || "Chưa xác định",
    );
  }

  return [];
}

export default function RaceReferees({ race, tournament, setTournament }) {
  const [referees, setReferees] = useState([]);
  const [loadingReferees, setLoadingReferees] = useState(true);
  const [assignmentsVersion, setAssignmentsVersion] = useState(0);
  const [judges, setJudges] = useState(() => mapRaceForJudges(race).judges);

  const judgeTournament = useMemo(
    () => ({
      id: tournament.id,
      name: tournament.name,
      location: tournament.location ?? "",
      races: (tournament.races ?? []).map(mapRaceForJudges),
    }),
    [tournament],
  );

  const mappedRace = useMemo(
    () => mapRaceForJudges(race),
    [race, assignmentsVersion],
  );

  const assignerRace = useMemo(
    () => ({ ...mappedRace, judges }),
    [mappedRace, judges],
  );

  const tournamentRaces = useMemo(
    () => (tournament.races ?? []).map(mapRaceForJudges),
    [tournament.races, assignmentsVersion],
  );

  const refereesById = useMemo(
    () => new Map(referees.map((referee) => [referee.id, referee])),
    [referees],
  );

  useEffect(() => {
    setJudges(mapRaceForJudges(race).judges);
  }, [race.id, race.raw?.refereeId, assignmentsVersion]);

  useEffect(() => {
    let cancelled = false;

    async function loadReferees() {
      try {
        setLoadingReferees(true);
        const data = await refereeService.getAvailableReferees();
        if (!cancelled) setReferees(data);
      } catch {
        if (!cancelled) setReferees([]);
      } finally {
        if (!cancelled) setLoadingReferees(false);
      }
    }

    loadReferees();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const handleAssignmentsUpdated = () => setAssignmentsVersion((value) => value + 1);
    window.addEventListener("referee-assignments-updated", handleAssignmentsUpdated);
    return () => window.removeEventListener("referee-assignments-updated", handleAssignmentsUpdated);
  }, []);

  const refreshTournament = async () => {
    if (!setTournament || !tournament?.id) return;

    try {
      const response = await tournamentService.getAdminTournament(tournament.id);
      setTournament(response.data);
    } catch (error) {
      console.error("Không thể làm mới phân công trọng tài", error?.response?.data || error);
    }
  };

  const handleAssigned = async () => {
    setAssignmentsVersion((value) => value + 1);
    await refreshTournament();
  };

  return (
    <div className="space-y-6">
      <Card className="min-w-0 overflow-hidden">
        <PanelHeader
          icon={Gavel}
          title="Trọng tài theo vòng đua"
          subtitle={`${tournamentRaces.length} cuộc đua trong giải · đồng bộ từ phân công admin`}
        />

        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-6 pb-4">
          <p className="text-sm text-white/55">
            Xem nhanh trọng tài được giao cho từng cuộc đua của giải{" "}
            <strong className="text-white/80">{tournament.name}</strong>.
          </p>
          <Link
            to="/admin/judges"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#dda50e] hover:underline"
          >
            Mở trang phân công
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="max-w-full overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-white/45">
                {["Vòng", "Cuộc đua", "Lịch", "Trạng thái", "Trọng tài phân công"].map((header) => (
                  <th key={header} className="px-5 py-4">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tournamentRaces.map((item) => {
                const labels = resolveRefereeLabels(item, refereesById);
                const isActive = String(item.id) === String(race.id);

                return (
                  <tr
                    key={item.id}
                    className={`border-b border-white/5 text-sm last:border-0 ${
                      isActive ? "bg-[#dda50e]/10" : ""
                    }`}
                  >
                    <td className="px-5 py-4 font-semibold text-white">R{item.no}</td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-white">{item.name}</div>
                      {isActive ? (
                        <span className="text-xs text-[#dda50e]">Đang xem</span>
                      ) : null}
                    </td>
                    <td className="px-5 py-4 text-white/60">
                      {formatDisplayDate(item.date, "Chưa có ngày")}
                      {item.time ? ` · ${item.time}` : ""}
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={toneForStatus(item.status)}>{item.status}</Badge>
                    </td>
                    <td className="px-5 py-4">
                      {loadingReferees && !labels.length ? (
                        <span className="text-white/40">Đang tải...</span>
                      ) : labels.length ? (
                        <div className="space-y-1">
                          {labels.map((label) => (
                            <div key={`${item.id}-${label}`} className="font-medium text-white/85">
                              {label}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-white/40">Chưa phân công</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div>
        <p className="mb-3 text-sm text-white/50">
          Phân công cho cuộc đua đang chọn:{" "}
          <strong className="text-white/80">{race.name || `R${race.no}`}</strong>
        </p>
        <JudgeAssigner
          tournament={judgeTournament}
          race={assignerRace}
          onChangeJudges={setJudges}
          onAssigned={handleAssigned}
        />
      </div>
    </div>
  );
}
