import { Award, Grid3x3, Send, Users } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { PanelHeader, SimpleTable } from "@/components/ui/Panel";
import { primaryButton } from "@/components/ui/styles";
import {
  formatVnd,
  getPrizeAmountByRank,
  registrationsFor,
  resultsFor,
} from "../utils";

export function RaceRegistrations({ race }) {
  const registrations = registrationsFor(race);
  return (
    <Card>
      <PanelHeader
        icon={Users}
        title="Đăng ký cuộc đua"
        subtitle={`${registrations.length} hồ sơ đăng ký`}
      />
      <SimpleTable
        headers={["Ngựa", "Chủ ngựa", "Jockey", "Duyệt"]}
        rows={registrations.map((item) => [
          item.horse,
          item.owner,
          item.jockey,
          <Badge key="a" tone={item.approval === "Đã duyệt" ? "green" : "gold"}>
            {item.approval}
          </Badge>,
        ])}
      />
    </Card>
  );
}

export function RaceGates({ race }) {
  return (
    <Card>
      <PanelHeader
        icon={Grid3x3}
        title="Vị trí xuất phát"
        subtitle="Phân làn các ngựa đã được duyệt"
      />
      <div className="grid gap-4 p-6 md:grid-cols-2">
        {registrationsFor(race)
          .slice(0, race.maxHorses)
          .map((item, index) => (
            <div
              key={item.horse}
              className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] p-4"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#dda50e] text-xl font-bold">
                {index + 1}
              </span>
              <div>
                <p className="font-bold">{item.horse}</p>
                <p className="text-sm text-white/55">{item.jockey}</p>
              </div>
            </div>
          ))}
      </div>
    </Card>
  );
}

export function RaceResults({ race }) {
  return (
    <Card>
      <PanelHeader
        icon={Award}
        title="Nhập kết quả cuộc đua"
        subtitle="Xếp hạng và công bố thành tích"
      />
      <SimpleTable
        headers={["Hạng", "Ngựa", "Jockey", "Thời gian", "Giải thưởng"]}
        rows={resultsFor(race).map((item) => [
          `#${item.position}`,
          item.horse,
          item.jockey,
          item.time,
          item.position < 4
            ? formatVnd(getPrizeAmountByRank(race, item.position))
            : "—",
        ])}
      />
      <div className="flex justify-end p-6 pt-0">
        <button type="button" className={primaryButton}>
          <Send className="h-5 w-5" />
          Công bố kết quả
        </button>
      </div>
    </Card>
  );
}
