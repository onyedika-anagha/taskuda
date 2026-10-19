import { CompanyForm } from '@/components/company/CompanyForm'
import { useCompanyActions } from '@/hooks/useCompanyActions'
import { DEFAULT_COMPANY_COLOR_ID } from '@/utils/companyPalette'
import { StepCard } from './StepCard'

/** Step 1: first company (design F1.2). */
export function CompanyStep({ onDone }: { onDone: () => void }) {
  const actions = useCompanyActions()
  return (
    <StepCard title="Add your first company" description="Who do you work for? You can add more later.">
      <CompanyForm
        defaultValues={{ name: '', colorId: DEFAULT_COMPANY_COLOR_ID }}
        submitLabel="Continue"
        cancelLabel="Skip for now"
        onCancel={onDone}
        onSubmit={async (values) => {
          await actions.saveCompany(values)
          onDone()
        }}
      />
    </StepCard>
  )
}
