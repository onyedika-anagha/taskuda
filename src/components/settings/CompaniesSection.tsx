import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'
import { ResponsiveDialog } from '@/components/common/ResponsiveDialog'
import { CompanyChip } from '@/components/company/CompanyChip'
import { CompanyForm } from '@/components/company/CompanyForm'
import { DeleteCompanyDialog } from '@/components/company/DeleteCompanyDialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useCompanies } from '@/hooks/useCompanies'
import { useCompanyActions } from '@/hooks/useCompanyActions'
import type { Company } from '@/types/company'
import { DEFAULT_COMPANY_COLOR_ID } from '@/utils/companyPalette'

type EditorState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; company: Company }

/** S7a Companies (PRD FR5). */
export function CompaniesSection() {
  const { companies } = useCompanies()
  const actions = useCompanyActions()
  const [editor, setEditor] = useState<EditorState>({ mode: 'closed' })
  const [deleting, setDeleting] = useState<Company | null>(null)
  const closeEditor = () => setEditor({ mode: 'closed' })
  const editing = editor.mode === 'edit' ? editor.company : undefined

  return (
    <section aria-labelledby="companies-heading" className="grid gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 id="companies-heading" className="text-lg font-semibold">
          Companies
        </h2>
        <Button className="min-h-11" onClick={() => setEditor({ mode: 'create' })}>
          <PlusIcon aria-hidden="true" />
          Add company
        </Button>
      </div>

      {companies === undefined ? (
        <Skeleton className="h-14 w-full" />
      ) : companies.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No companies yet. Add one to color-code your tasks.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {companies.map((company) => (
            <li key={company.id} className="flex items-center gap-2 py-1 pr-1 pl-4">
              <CompanyChip company={company} className="flex-1 text-sm" />
              <Button
                variant="ghost"
                size="icon"
                className="size-11"
                aria-label={`Edit ${company.name}`}
                onClick={() => setEditor({ mode: 'edit', company })}
              >
                <PencilIcon aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-11 text-destructive"
                aria-label={`Delete ${company.name}`}
                onClick={() => setDeleting(company)}
              >
                <Trash2Icon aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <ResponsiveDialog
        open={editor.mode !== 'closed'}
        onOpenChange={(open) => !open && closeEditor()}
        title={editing ? 'Edit company' : 'Add company'}
      >
        {editor.mode !== 'closed' ? (
          <CompanyForm
            key={editing?.id ?? 'new'}
            defaultValues={{
              name: editing?.name ?? '',
              colorId: editing?.colorId ?? DEFAULT_COMPANY_COLOR_ID,
            }}
            onCancel={closeEditor}
            onSubmit={async (values) => {
              await actions.saveCompany(values, editing)
              closeEditor()
            }}
          />
        ) : null}
      </ResponsiveDialog>

      <DeleteCompanyDialog company={deleting} onClose={() => setDeleting(null)} />
    </section>
  )
}
