import { zodResolver } from '@hookform/resolvers/zod'
import { ExternalLinkIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { FormField } from '@/components/common/FormField'
import { PasswordField } from '@/components/common/PasswordField'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { jiraConnectSchema, type JiraConnectValues } from '@/schemas/jiraForm'
import { fieldDescribedBy } from '@/utils/formAria'

interface JiraConnectFormProps {
  error: string | null
  onConnect: (values: JiraConnectValues) => Promise<boolean>
}

const TOKEN_HELP = 'https://id.atlassian.com/manage-profile/security/api-tokens'

/** Site, email and API token; "Test connection" checks and saves them (PRD AC15.1). */
export function JiraConnectForm({ error, onConnect }: JiraConnectFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<JiraConnectValues>({
    resolver: zodResolver(jiraConnectSchema),
    defaultValues: { site: '', email: '', token: '' },
    mode: 'onTouched',
  })

  return (
    <form
      noValidate
      className="grid gap-3"
      onSubmit={handleSubmit(async (values) => {
        // Clear the token from the page once it's saved.
        if (await onConnect(values)) reset()
      })}
    >
      <FormField id="jira-site" label="Jira site" error={errors.site?.message}>
        <Input
          id="jira-site"
          placeholder="yoursite.atlassian.net"
          autoComplete="url"
          spellCheck={false}
          aria-invalid={!!errors.site}
          aria-describedby={fieldDescribedBy('jira-site', errors.site?.message)}
          {...register('site')}
        />
      </FormField>
      <FormField id="jira-email" label="Email" error={errors.email?.message}>
        <Input
          id="jira-email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          aria-describedby={fieldDescribedBy('jira-email', errors.email?.message)}
          {...register('email')}
        />
      </FormField>
      <PasswordField
        id="jira-token"
        label="API token"
        autoComplete="off"
        error={errors.token?.message}
        registration={register('token')}
      />
      <a
        href={TOKEN_HELP}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center gap-1 justify-self-start text-sm font-medium underline underline-offset-4 outline-none hover:no-underline focus-visible:ring-2 focus-visible:ring-ring"
      >
        How to create an API token
        <ExternalLinkIcon aria-hidden="true" className="size-3.5" />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="min-h-11 justify-self-start" disabled={isSubmitting}>
        {isSubmitting ? 'Testing…' : 'Test connection'}
      </Button>
    </form>
  )
}
