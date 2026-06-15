import { useState } from "react";
import { Info } from "lucide-react";
import Card from "@/components/ui/Card";
import Field from "@/components/ui/Field";
import { Input, Select, TextArea } from "@/components/ui/Input";
import { PanelActions, PanelHeader } from "@/components/ui/Panel";
import {
  clampDate,
  clampTime,
  shiftTime,
} from "./helpers";
import { formatDisplayDate } from "@/utils/dateFormat";

export default function RaceInfo({
  race,
  tournament,
  saving,
  venues,
  distanceOptions,
  loadingOptions,
  onSave,
}) {
  const [draft, setDraft] = useState(race);
  const updateDraft = (patch) => {
    setDraft((previous) => ({ ...previous, ...patch }));
  };
  const raceDateMin = tournament.startDate || undefined;
  const raceDateMax = tournament.endDate || undefined;
  const raceTimeMin =
    draft.date === tournament.startDate
      ? tournament.startTime || undefined
      : undefined;
  const raceTimeMax =
    draft.date === tournament.endDate
      ? shiftTime(tournament.endTime, -1) || undefined
      : undefined;
  const distanceIsConfigured = distanceOptions.some(
    (option) => option.value === draft.distance,
  );
  const removedDistance = draft.distance && !distanceIsConfigured;

  return (
    <Card>
      <PanelHeader
        icon={Info}
        title="Thông tin cuộc đua"
        subtitle="Tên, thời gian, đường đua, lệ phí và giới hạn ngựa"
      />
      <div className="grid gap-5 p-6 md:grid-cols-2">
        <Field label="Tên cuộc đua">
          <Input
            value={draft.name}
            onChange={(event) => updateDraft({ name: event.target.value })}
          />
        </Field>
        <Field label="Số thứ tự">
          <Input
            type="number"
            value={draft.no}
            onChange={(event) =>
              updateDraft({ no: Number(event.target.value) })
            }
          />
        </Field>
        <Field label="Mô tả" full>
          <TextArea
            value={draft.description}
            onChange={(event) =>
              updateDraft({ description: event.target.value })
            }
          />
        </Field>
        <Field label="Ngày thi đấu">
          <Input
            type="date"
            min={raceDateMin}
            max={raceDateMax}
            value={draft.date}
            onChange={(event) => {
              const date = clampDate(
                event.target.value,
                tournament.startDate,
                tournament.endDate,
              );
              const nextRaceTimeMin =
                date === tournament.startDate ? tournament.startTime : "";
              const nextRaceTimeMax =
                date === tournament.endDate
                  ? shiftTime(tournament.endTime, -1)
                  : "";

              updateDraft({
                date,
                time: clampTime(draft.time, nextRaceTimeMin, nextRaceTimeMax),
              });
            }}
          />
          <p className="mt-2 text-xs text-white/40">
            Chỉ chọn trong thời gian mùa giải: {formatDisplayDate(tournament.startDate)} -{" "}
            {formatDisplayDate(tournament.endDate)}.
          </p>
        </Field>
        <Field label="Giờ thi đấu">
          <Input
            type="time"
            min={raceTimeMin}
            max={raceTimeMax}
            value={draft.time}
            onChange={(event) =>
              updateDraft({
                time: clampTime(event.target.value, raceTimeMin, raceTimeMax),
              })
            }
          />
          {(raceTimeMin || raceTimeMax) && (
            <p className="mt-2 text-xs text-white/40">
              Giờ thi đấu trong ngày này: {raceTimeMin || "00:00"} -{" "}
              {raceTimeMax || "23:59"}.
            </p>
          )}
        </Field>
        <Field label="Khoảng cách">
          <Select
            value={draft.distance}
            disabled={loadingOptions}
            onChange={(event) => updateDraft({ distance: event.target.value })}
          >
            <option value="">{loadingOptions ? "Đang tải..." : "Chọn khoảng cách"}</option>
            {removedDistance && (
              <option value={draft.distance} disabled>
                {draft.distance} - đã xóa khỏi cấu hình
              </option>
            )}
            {distanceOptions.map((option) => (
              <option key={option.meters} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
          {removedDistance && !loadingOptions && (
            <p className="mt-2 text-xs font-medium text-amber-300">
              Khoảng cách hiện tại không còn trong cấu hình. Vui lòng chọn lại trước khi lưu.
            </p>
          )}
        </Field>
        <Field label="Địa điểm đua">
          <Select
            value={draft.venueId || ""}
            disabled={loadingOptions || !tournament.provinceId}
            onChange={(event) => {
              const venue = venues.find((item) => item.id === event.target.value);
              updateDraft({
                venueId: event.target.value,
                venueName: venue?.name || "",
                venueAddress: venue?.address || "",
                provinceId: venue?.provinceId || tournament.provinceId,
                provinceName: venue?.provinceName || tournament.provinceName,
              });
            }}
          >
            <option value="">
              {!tournament.provinceId
                ? "Chọn tỉnh cho giải trước"
                : loadingOptions
                  ? "Đang tải..."
                  : "Chọn địa điểm đua"}
            </option>
            {venues.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name}
              </option>
            ))}
          </Select>
          {draft.venueAddress && (
            <p className="mt-2 text-xs text-white/45">
              {draft.venueAddress} - {draft.provinceName || tournament.provinceName}
            </p>
          )}
        </Field>
        <Field label="Số ngựa tối thiểu của cuộc đua">
          <Input
            type="number"
            min="1"
            value={draft.minHorses}
            onChange={(event) =>
              updateDraft({ minHorses: Number(event.target.value) })
            }
          />
        </Field>
        <Field label="Số ngựa tối đa của cuộc đua">
          <Input
            type="number"
            min="1"
            value={draft.maxHorses}
            onChange={(event) =>
              updateDraft({ maxHorses: Number(event.target.value) })
            }
          />
        </Field>
        <Field label="Lệ phí đăng ký">
          <div className="relative">
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={draft.entryFee ?? ""}
              onChange={(event) => {
                const digits = event.target.value.replace(/\D/g, "");
                updateDraft({ entryFee: digits ? Number(digits) : "" });
              }}
              className="pr-20"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-white/45">
              VND
            </span>
          </div>
        </Field>
        <Field label="Trạng thái" full>
          <Input value={draft.status || "Nháp"} disabled />
        </Field>
      </div>
      <PanelActions
        saving={saving}
        onCancel={() => setDraft(race)}
        onSave={() => onSave(draft)}
      />
    </Card>
  );
}
