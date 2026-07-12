import { DEADLINE_REFERENCE, DENIAL_GUIDE, SOURCE_HONESTY_NOTE, SOURCE_NOTES } from "@/lib/resources-data";
import { getSiteContent } from "@/lib/criteria-repo";
import { getPageBySlug, makeFieldGetter } from "@/lib/content-schema";

const RESOURCES_PAGE = getPageBySlug("resources")!;

export default async function ResourcesPage() {
  const c = makeFieldGetter(RESOURCES_PAGE, await getSiteContent());

  return (
    <div className="max-w-[1000px] mx-auto py-8 px-5">
      <h1 className="text-[24px] font-semibold mb-1">{c("resources_h1")}</h1>
      <p className="text-[14px] text-gray-600 mb-8">{c("resources_subtitle")}</p>

      <section className="card p-6 mb-6">
        <h2 className="text-[15px] font-semibold mb-4">{c("resources_section1_title")}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="text-left text-gray-400 text-[11px] uppercase tracking-wide" style={{ borderBottom: "1px solid var(--gray-200)" }}>
                <th className="py-2 pr-4 font-semibold">Denial reason</th>
                <th className="py-2 pr-4 font-semibold">Correct response</th>
                <th className="py-2 font-semibold">Key action</th>
              </tr>
            </thead>
            <tbody>
              {DENIAL_GUIDE.map((row) => (
                <tr key={row.reason} style={{ borderBottom: "1px solid var(--gray-200)" }}>
                  <td className="py-3 pr-4 font-medium">{row.reason}</td>
                  <td className="py-3 pr-4">
                    <span className="status-pill" style={{ background: "#EEF0FF", color: "var(--indigo-600)" }}>{row.fix}</span>
                  </td>
                  <td className="py-3 text-gray-600">{row.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card p-6 mb-6">
        <h2 className="text-[15px] font-semibold mb-4">{c("resources_section2_title")}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="text-left text-gray-400 text-[11px] uppercase tracking-wide" style={{ borderBottom: "1px solid var(--gray-200)" }}>
                <th className="py-2 pr-4 font-semibold">Payer</th>
                <th className="py-2 pr-4 font-semibold">Imaging reviewer</th>
                <th className="py-2 pr-4 font-semibold">Appeal deadline</th>
                <th className="py-2 pr-4 font-semibold">Expedited</th>
                <th className="py-2 pr-4 font-semibold">Peer-to-peer</th>
                <th className="py-2 font-semibold">Further review</th>
              </tr>
            </thead>
            <tbody>
              {DEADLINE_REFERENCE.map((row) => (
                <tr key={row.payer} style={{ borderBottom: "1px solid var(--gray-200)" }}>
                  <td className="py-3 pr-4 font-medium">{row.payer}</td>
                  <td className="py-3 pr-4 text-gray-600">{row.imagingReviewer}</td>
                  <td className="py-3 pr-4 text-gray-600">{row.standard}</td>
                  <td className="py-3 pr-4 text-gray-600">{row.expedited}</td>
                  <td className="py-3 pr-4 text-gray-600">{row.peerToPeer}</td>
                  <td className="py-3 text-gray-600">{row.externalReview}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-[15px] font-semibold mb-4">{c("resources_section3_title")}</h2>
        <ul className="flex flex-col gap-3 text-[13px] text-gray-600 leading-relaxed">
          {SOURCE_NOTES.map((note, i) => (
            <li key={i} className="flex gap-2">
              <span style={{ color: "var(--indigo-600)" }}>•</span>
              <span>{note}</span>
            </li>
          ))}
        </ul>
        <p className="text-[12px] text-gray-400 mt-4 pt-4" style={{ borderTop: "1px solid var(--gray-200)" }}>
          {SOURCE_HONESTY_NOTE}
        </p>
      </section>
    </div>
  );
}
