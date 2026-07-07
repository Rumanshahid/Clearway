import { notFound } from "next/navigation";
import Link from "next/link";
import { getSiteContent } from "@/lib/criteria-repo";
import { CONTENT_PAGES, getPageBySlug, fieldValue, sectionVisible } from "@/lib/content-schema";
import { saveSiteContentAction } from "../actions";

function Field({ name, label, value, textarea }: { name: string; label: string; value: string; textarea?: boolean }) {
  return (
    <div>
      <label className="label" htmlFor={name}>{label}</label>
      {textarea ? (
        <textarea className="input" id={name} name={name} rows={2} defaultValue={value} />
      ) : (
        <input className="input" id={name} name={name} defaultValue={value} />
      )}
    </div>
  );
}

export default async function AdminContentPageEditor({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getPageBySlug(slug);
  if (!page) notFound();

  const content = await getSiteContent();

  return (
    <div className="max-w-[1100px] mx-auto py-8 px-5 flex gap-6 items-start">
      <aside className="w-[200px] flex-shrink-0 card p-2 sticky top-8">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 px-3 py-2">Pages</div>
        {CONTENT_PAGES.map((p) => (
          <Link
            key={p.slug}
            href={`/admin/content/${p.slug}`}
            className="block px-3 py-2 rounded-md text-[13.5px] hover:bg-gray-50 transition-colors"
            style={
              p.slug === slug
                ? { background: "var(--gray-100)", color: "var(--gray-900)", fontWeight: 600 }
                : { color: "var(--gray-600)" }
            }
          >
            {p.label}
          </Link>
        ))}
      </aside>

      <div className="flex-1 min-w-0">
        <h1 className="text-[24px] font-semibold mb-1">{page.label} page content</h1>
        <p className="text-[14px] text-gray-600 mb-6">Edits go live on asaanbil.com immediately after saving.</p>

        <form action={saveSiteContentAction} className="flex flex-col gap-6">
          <input type="hidden" name="_page" value={page.slug} />
          {page.sections.map((section) => (
            <section key={section.title} className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[15px] font-semibold">{section.title}</h2>
                {section.visibilityKey && (
                  <label className="flex items-center gap-2 text-[12.5px]">
                    <input
                      type="checkbox"
                      name={`visible_${section.visibilityKey}`}
                      defaultChecked={sectionVisible(content, section)}
                      className="w-4 h-4"
                    />
                    Visible
                  </label>
                )}
              </div>
              <div className="flex flex-col gap-4">
                {section.fields.map((field) => (
                  <Field
                    key={field.key}
                    name={field.key}
                    label={field.label}
                    value={fieldValue(content, field)}
                    textarea={field.type === "textarea"}
                  />
                ))}
              </div>
            </section>
          ))}

          <button className="btn btn-primary self-start" type="submit">Save changes</button>
        </form>
      </div>
    </div>
  );
}
