import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconChevronRight, IconCode, IconCopy, IconFileCode2, IconFolder } from "@tabler/icons-react";
import { PageHeader } from "@/components/layout/PageHeader";

const apiExample = `// GET /api/products
SELECT id, name, category, price, stock_quantity, supplier, status
FROM products
ORDER BY id DESC;

// GET /api/products/:id
SELECT id, name, category, description, price, stock_quantity,
       supplier, status, created_at, updated_at
FROM products
WHERE id = ?;`;

const apiGroups = [
  { title: "Products", methods: "list · get · create · update · remove", description: "Loads and manages product records. Create and update validate the product input before saving." },
  { title: "Reorder requests", methods: "listReorders · createReorder · updateReorder · removeReorder", description: "Tracks replenishment work from draft through receipt, independently from the product catalogue." },
  { title: "Decision data", methods: "dashboard · report", description: "Builds KPI, risk, supplier, category, and reorder-status summaries from the current records." },
];

const pageGuides = [
  { name: "Dashboard", route: "/", description: "A quick view of product count, stock units, low-stock items, inventory value, and category distribution." },
  { name: "Products", route: "/products", description: "The main catalogue workspace for searching, filtering, creating, editing, and deleting products." },
  { name: "Product Details", route: "/products/:id", description: "A contextual detail view opened from a product name in the Products or Reorder Center tables." },
  { name: "Reorder Center", route: "/reorder", description: "Shows products at or below the reorder threshold and manages replenishment requests." },
  { name: "Inventory Reports", route: "/reports", description: "Supports decisions with inventory value, risk severity, supplier exposure, category performance, and request status." },
];

export function DocumentationPage() {
  const [selected, setSelected] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyCode = async () => {
    await navigator.clipboard.writeText(apiExample);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Documentation" description="How the application keeps product and reorder data behind a single API boundary." />
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="h-fit overflow-hidden rounded-lg border border-line bg-panel">
          <div className="border-b border-line px-4 py-3 text-xs font-medium text-muted">Project files</div>
          <div className="p-2">
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-amber"><IconFolder size={18} /><span>client</span></div>
            <div className="ml-4 border-l border-line py-1 pl-2">
              <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted"><IconFolder size={18} /><span>src</span></div>
              <div className="ml-4 border-l border-line py-1 pl-2">
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted"><IconFolder size={18} /><span>lib</span></div>
                <button type="button" onClick={() => setSelected((current) => !current)} aria-expanded={selected} className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-copy transition-colors hover:bg-[#202123]">
                  <IconFileCode2 size={18} className="text-lime" />
                  <span className="flex-1">api.ts</span>
                  <IconChevronRight size={16} className={selected ? "rotate-90 transition-transform" : "transition-transform"} />
                </button>
              </div>
            </div>
          </div>
        </aside>
        <section className="overflow-hidden rounded-lg border border-line bg-panel">
          <div className="border-b border-line p-5 md:p-6">
            <div className="flex items-center gap-2 text-copy"><IconCode size={18} /><h2 className="font-medium">API layer</h2></div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Product methods call the local HTTP server, which reads and writes SQLite. Reorder requests and recent activity are still stored in browser localStorage.</p>
          </div>
          <AnimatePresence initial={false}>
            {selected && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }} className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-line bg-[#151719] px-4 py-3"><div className="flex items-center gap-2 text-sm text-copy"><IconFileCode2 size={17} className="text-lime" /> client/src/lib/api.ts</div><button type="button" onClick={() => void copyCode()} className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-xs text-muted transition-colors hover:border-lime hover:text-copy"><IconCopy size={15} /> {copied ? "Copied" : "Copy code"}</button></div>
              <pre className="max-h-[calc(100svh-23rem)] overflow-auto bg-[#111213] p-5 text-xs leading-6 text-[#d8dbd3] md:p-6"><code>{apiExample}</code></pre>
            </motion.div>}
          </AnimatePresence>
        </section>
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-lg border border-line bg-panel">
          <div className="border-b border-line p-5 md:p-6"><h2 className="font-medium text-copy">API methods</h2><p className="mt-1 text-xs text-muted">The small contract pages use to access inventory data.</p></div>
          <div className="divide-y divide-line">{apiGroups.map((group) => <div key={group.title} className="p-5"><div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between"><h3 className="text-sm font-medium text-copy">{group.title}</h3><code className="text-xs text-lime">{group.methods}</code></div><p className="mt-2 text-sm leading-6 text-muted">{group.description}</p></div>)}</div>
        </section>
        <section className="rounded-lg border border-line bg-panel">
          <div className="border-b border-line p-5 md:p-6"><h2 className="font-medium text-copy">Application pages</h2><p className="mt-1 text-xs text-muted">Where each workflow lives in the interface.</p></div>
          <div className="divide-y divide-line">{pageGuides.map((page) => <div key={page.route} className="p-5"><div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between"><h3 className="text-sm font-medium text-copy">{page.name}</h3><code className="text-xs text-muted">{page.route}</code></div><p className="mt-2 text-sm leading-6 text-muted">{page.description}</p></div>)}</div>
        </section>
      </div>
    </div>
  );
}
