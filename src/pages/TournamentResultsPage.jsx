import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Award, ChevronLeft, Flag, Trophy } from "lucide-react";
import { toast } from "sonner";
import { tournamentApi } from "@/api/tournamentApi";

export default function TournamentResultsPage() {
  const { id = "" } = useParams();
  const [tournament, setTournament] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [tournamentData, resultsData] = await Promise.all([
          tournamentApi.getById(id),
          tournamentApi.getResults(id),
        ]);
        setTournament(tournamentData);
        setResults(Array.isArray(resultsData) ? resultsData : []);
      } catch (error) {
        console.error(error);
        toast.error("Không thể tải kết quả cuộc đua");
      } finally {
        setLoading(false);
      }
    }

    if (id) load();
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24 text-center text-[#1E3A5F]/55">
        Đang tải kết quả...
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-24 text-center text-[#1E3A5F]/55">
        Không tìm thấy giải đấu.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF8F0] via-white to-[#FAFAFA] pt-24">
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          to={`/tournaments/${id}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#1E3A5F]/60 hover:text-[#D4A017]"
        >
          <ChevronLeft className="h-4 w-4" />
          Quay lại giải đấu
        </Link>
        <div className="rounded-[2rem] border border-[#1E3A5F]/10 bg-white p-8 shadow-2xl shadow-[#1E3A5F]/5">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-3 inline-flex rounded-full bg-[#D4A017]/10 px-4 py-1 text-sm font-semibold text-[#D4A017]">
                Kết quả cuộc đua
              </div>
              <h1 className="text-3xl font-bold text-[#1E3A5F] md:text-5xl">
                {tournament.name}
              </h1>
            </div>
            <Link
              to={`/tournaments/${id}/register`}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#D4A017] px-5 py-3 font-semibold text-white transition hover:bg-[#B8941F]"
            >
              <Award className="h-5 w-5" />
              Đăng ký lại
            </Link>
          </div>

          <div className="space-y-8">
            {results.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[#1E3A5F]/15 bg-[#FAFAFA] p-12 text-center text-[#1E3A5F]/55">
                Chưa có kết quả được công bố.
              </div>
            ) : (
              results.map((item) => (
                <section
                  key={item.race.id}
                  className="rounded-3xl border border-[#1E3A5F]/10 bg-[#FAFAFA] p-6"
                >
                  <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-[#1E3A5F]">
                        <Flag className="mr-2 inline-block h-5 w-5 text-[#D4A017]" />
                        #{item.race.raceNumber} {item.race.name}
                      </h2>
                      <p className="mt-2 text-sm text-[#1E3A5F]/55">
                        {item.race.description}
                      </p>
                    </div>
                    <span className="inline-flex rounded-full bg-[#D4A017]/10 px-3 py-1 text-sm font-semibold text-[#D4A017]">
                      {item.race.status}
                    </span>
                  </div>

                  <div className="overflow-hidden rounded-2xl border border-[#1E3A5F]/10 bg-white">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-[#1E3A5F]/10 bg-[#FFF8F0] text-left text-sm text-[#1E3A5F]/65">
                          <th className="px-4 py-3">Hạng</th>
                          <th className="px-4 py-3">Ngựa</th>
                          <th className="px-4 py-3">Jockey</th>
                          <th className="px-4 py-3">Thời gian</th>
                          <th className="px-4 py-3">Điểm</th>
                        </tr>
                      </thead>
                      <tbody>
                        {item.results.map((result) => (
                          <tr
                            key={result.id}
                            className="border-b border-[#1E3A5F]/5 text-sm text-[#1E3A5F]/80"
                          >
                            <td className="px-4 py-3 font-semibold text-[#D4A017]">
                              #{result.position}
                            </td>
                            <td className="px-4 py-3 font-semibold">
                              {result.horseName}
                            </td>
                            <td className="px-4 py-3">
                              {result.jockeyName || "Chưa có"}
                            </td>
                            <td className="px-4 py-3">{result.time || "-"}</td>
                            <td className="px-4 py-3">{result.points || 0}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
