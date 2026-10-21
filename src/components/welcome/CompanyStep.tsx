import { CompanyForm } from '@/components/company/CompanyForm'
import { Button } from '@/components/ui/button'
import { useSetupCompanies } from '@/hooks/useSetupCompanies'
import { SetupCompanyList } from './SetupCompanyList'
import { StepCard } from './StepCard'

/** Step 1: companies (PRD AC34.2, design F1.3). Add as many as needed; Continue once there's one. */
export function CompanyStep({ onDone }: { onDone: () => void }) {
  const setup = useSetupCompanies()
  const hasCompanies = setup.companies.length > 0

  return (
    <StepCard
      title="Who do you work for?"
      description="Add each employer or client. Their color tags your tasks."
    >
      <SetupCompanyList companies={setup.companies} onRemove={(company) => void setup.remove(company)} />
      {/* Waits for the list, so a resumed setup preselects the next unused color. */}
      {setup.loaded ? (
        <CompanyForm
          defaultValues={setup.nextValues()}
          nameLabel="Company name"
          submitLabel="Add company"
          onSubmit={setup.add}
          resetTo={setup.nextValues}
        />
      ) : null}
      <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
        <Button variant="outline" size="lg" onClick={onDone}>
          Skip for now
        </Button>
        {hasCompanies ? (
          <Button size="lg" onClick={onDone}>
            Continue
          </Button>
        ) : null}
      </div>
    </StepCard>
  )
}
