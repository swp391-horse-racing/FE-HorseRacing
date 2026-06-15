import { normalizePrizeList } from "../utils";

export function mergeDraftRaces(tournament, races) {
  const draftRaces = races.filter((race) => race.isNew);
  if (!draftRaces.length) return tournament;

  const mergedRaces = [...tournament.races, ...draftRaces].map((race, index) => ({
    ...race,
    no: index + 1,
  }));

  return {
    ...tournament,
    races: mergedRaces,
    raceCount: mergedRaces.length,
  };
}

export function shiftTime(time, hours) {
  if (!time) return "";

  const [hour = "00", minute = "00"] = time.split(":");
  const nextHour = Math.max(0, Math.min(23, Number(hour) + hours));
  return `${String(nextHour).padStart(2, "0")}:${String(Number(minute)).padStart(2, "0")}`;
}

export function clampDate(date, min, max) {
  if (!date) return "";
  if (min && date < min) return min;
  if (max && date > max) return max;
  return date;
}

export function clampTime(time, min, max) {
  if (!time) return "";
  if (min && time < min) return min;
  if (max && time > max) return max;
  return time;
}

export function metersFromDistance(distance) {
  return String(distance || "").match(/\d+/)?.[0] || "";
}

export function formatDistance(distance) {
  const meters = metersFromDistance(distance);
  return meters ? `${meters}m` : "";
}

function toDateTimeValue(date, time = "08:00") {
  return `${date}T${time || "08:00"}`;
}

function addOneHourDateTimeValue(date, time = "08:00") {
  if (!date) return "";

  const [hours = "08", minutes = "00"] = time.split(":");
  const start = new Date(
    Date.UTC(
      Number(date.slice(0, 4)),
      Number(date.slice(5, 7)) - 1,
      Number(date.slice(8, 10)),
      Number(hours),
      Number(minutes),
    ),
  );
  start.setUTCHours(start.getUTCHours() + 1);

  return start.toISOString().slice(0, 16);
}

export function getRaceValidationError(races, tournament) {
  const tournamentStart = toDateTimeValue(
    tournament.startDate,
    tournament.startTime || "00:00",
  );
  const tournamentEnd = toDateTimeValue(
    tournament.endDate,
    tournament.endTime || "23:59",
  );
  const keys = new Set();

  for (const race of races) {
    const raceName = race.name?.trim();
    const raceDistance = race.distance?.trim();
    const raceStart = toDateTimeValue(race.date, race.time);
    const raceEnd = addOneHourDateTimeValue(race.date, race.time);
    const raceKey = `${raceName?.toLowerCase()}|${raceStart}`;
    const prizeRanks = new Set();

    if (!raceName) return "Tên cuộc đua không được để trống";
    if (raceName.length > 120) return "Tên cuộc đua tối đa 120 ký tự";
    if (!raceDistance) return "Khoảng cách cuộc đua không được để trống";
    if (raceDistance.length > 80) return "Khoảng cách tối đa 80 ký tự";
    if (Number(metersFromDistance(raceDistance)) <= 0)
      return "Khoảng cách phải lớn hơn 0 m";
    if (!race.venueId) return "Vui lòng chọn địa điểm đua";
    if ((race.description || "").length > 1000)
      return "Mô tả cuộc đua tối đa 1000 ký tự";
    if (!race.date || !race.time)
      return "Ngày và giờ thi đấu không được để trống";
    if (raceStart < tournamentStart || raceEnd > tournamentEnd)
      return "Lịch thi đấu phải nằm trong thời gian mùa giải";
    if (Number(race.minHorses) <= 0 || Number(race.maxHorses) <= 0)
      return "Giới hạn ngựa phải lớn hơn 0";
    if (Number(race.minHorses) > Number(race.maxHorses))
      return "Tối thiểu ngựa không được lớn hơn tối đa ngựa";
    if (Number(race.entryFee) < 0)
      return "Lệ phí đăng ký không được âm";
    if (keys.has(raceKey))
      return "Tên cuộc đua và giờ thi đấu không được trùng nhau trong cùng giải";

    const prizes = normalizePrizeList(race.prizes);
    for (const prize of prizes) {
      if (prize.rank <= 0) return "Hạng giải thưởng phải lớn hơn 0";
      if (Number(prize.amount) < 0) return "Số tiền giải thưởng không được âm";
      if (prizeRanks.has(prize.rank))
        return "Hạng giải thưởng không được trùng nhau trong cùng cuộc đua";
      prizeRanks.add(prize.rank);
    }

    for (let index = 1; index < prizes.length; index += 1) {
      if (Number(prizes[index - 1].amount) <= Number(prizes[index].amount)) {
        return "Số tiền giải sau phải nhỏ hơn giải trước";
      }
    }

    keys.add(raceKey);
  }

  return "";
}
