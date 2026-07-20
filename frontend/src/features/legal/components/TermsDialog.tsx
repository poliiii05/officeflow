import {
  AlertTriangle,
  ClipboardCheck,
  ClipboardList,
  Scale,
  ShieldCheck,
  UserCheck,
} from 'lucide-react'

import { LegalDocumentDialog } from '@/features/legal/components/LegalDocumentDialog'

const termsSections = [
  {
    id: 'accepting-terms',
    title: 'Accepting the terms',
    description: 'Agreement when creating or using an OfficeFlow account.',
    icon: ClipboardCheck,
    content: (
      <p>
        By creating an OfficeFlow account, the user agrees to use the system for valid office service workflows,
        including appointment requests, ticket submissions, request tracking, and communication with assigned staff.
      </p>
    ),
  },
  {
    id: 'using-officeflow',
    title: 'Using OfficeFlow',
    description: 'What the system is intended to support.',
    icon: ClipboardList,
    content: (
      <p>
        OfficeFlow is intended to organize office requests from submission to resolution. Users may submit tickets,
        book appointments, check status updates, and receive service-related notifications once those features are enabled.
      </p>
    ),
  },
  {
    id: 'requester-responsibilities',
    title: 'Requester responsibilities',
    description: 'Expected behavior for employees and visitors.',
    icon: UserCheck,
    content: (
      <p>
        Employees and visitors should provide accurate names, email addresses, request details, preferred schedules,
        and supporting information. False, incomplete, or misleading submissions may delay processing or require admin review.
      </p>
    ),
  },
  {
    id: 'staff-access-rules',
    title: 'Staff access rules',
    description: 'How internal users should handle system records.',
    icon: ShieldCheck,
    content: (
      <p>
        Staff, admins, and super admins should access account records, tickets, appointments, and request notes only when
        needed for authorized office duties. Internal access should follow role-based permissions and office policies.
      </p>
    ),
  },
  {
    id: 'system-restrictions',
    title: 'System restrictions',
    description: 'Actions that are not allowed in the system.',
    icon: AlertTriangle,
    content: (
      <p>
        Users must not attempt unauthorized access, submit spam requests, impersonate another person, disrupt service queues,
        or misuse future integrations such as email, SMS, push notifications, storage, or AI assistance.
      </p>
    ),
  },
  {
    id: 'account-review',
    title: 'Account review',
    description: 'How misuse or suspicious activity can be handled.',
    icon: Scale,
    content: (
      <p>
        Accounts involved in misuse, repeated false requests, unauthorized access attempts, or policy violations may be
        reviewed, restricted, suspended, or escalated to the responsible office administrator.
      </p>
    ),
  },
]

export function TermsDialog() {
  return (
    <LegalDocumentDialog
      triggerLabel="Terms of Service"
      title="Terms of Service"
      description="Updated for the OfficeFlow portfolio prototype. These terms explain responsible use of the appointment and ticketing system."
      sidebarLabel="Terms guide"
      icon={Scale}
      sections={termsSections}
      notice={
        <p>
          This content is suitable for a portfolio prototype. A real deployment should have terms reviewed by the office,
          organization, or legal adviser responsible for the system.
        </p>
      }
    />
  )
}