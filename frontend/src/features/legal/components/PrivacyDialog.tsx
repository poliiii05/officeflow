import {
  CalendarClock,
  Database,
  Eye,
  FileLock2,
  LockKeyhole,
  ShieldCheck,
  UserRoundCheck,
} from 'lucide-react'

import { LegalDocumentDialog } from '@/features/legal/components/LegalDocumentDialog'

const privacySections = [
  {
    id: 'data-collected',
    title: 'Data collected',
    description: 'Information needed to operate tickets and appointments.',
    icon: Database,
    content: (
      <p>
        OfficeFlow may collect basic account details such as name, email address, requester type, password-protected
        account credentials, appointment records, ticket details, request status, and staff handling activity.
      </p>
    ),
  },
  {
    id: 'purpose-of-use',
    title: 'Purpose of use',
    description: 'How collected information supports office workflows.',
    icon: Eye,
    content: (
      <p>
        Information is used to create accounts, authenticate users, process tickets, schedule appointments, assign staff,
        track request progress, send future notifications, generate reports, and maintain system security.
      </p>
    ),
  },
  {
    id: 'role-based-access',
    title: 'Role-based access',
    description: 'Who can see records inside OfficeFlow.',
    icon: UserRoundCheck,
    content: (
      <p>
        Requesters should only see their own tickets and appointments. Staff should see assigned office queues.
        Admins and super admins may access broader records for operations, configuration, reporting, and audit purposes.
      </p>
    ),
  },
  {
    id: 'retention',
    title: 'Retention',
    description: 'How long records should be kept.',
    icon: CalendarClock,
    content: (
      <p>
        Request and account records should be kept only as long as needed for office operations, reporting, audit trails,
        dispute handling, or policy requirements. Inactive records may later be archived or deleted.
      </p>
    ),
  },
  {
    id: 'security-practices',
    title: 'Security practices',
    description: 'How the system should protect information.',
    icon: LockKeyhole,
    content: (
      <p>
        The system should collect only necessary information, restrict access by role, protect authentication tokens,
        use secure storage practices, and avoid exposing sensitive request data to unauthorized users.
      </p>
    ),
  },
  {
    id: 'user-rights',
    title: 'User rights',
    description: 'Requests users may make about their information.',
    icon: ShieldCheck,
    content: (
      <p>
        Depending on applicable policy and law, users may request access, correction, deletion or blocking, objection,
        portability, or review of personal data used by the system.
      </p>
    ),
  },
  {
    id: 'future-integrations',
    title: 'Future integrations',
    description: 'Privacy expectations for planned integrations.',
    icon: FileLock2,
    content: (
      <p>
        Email, SMS, push notifications, cloud storage, and AI assistance should process only the data needed for
        the selected workflow and should follow role-based access controls.
      </p>
    ),
  },
]

export function PrivacyDialog() {
  return (
    <LegalDocumentDialog
      triggerLabel="Privacy Policy"
      title="Privacy Policy"
      description="How OfficeFlow may collect, use, protect, and manage information for office request workflows."
      sidebarLabel="Privacy guide"
      icon={ShieldCheck}
      sections={privacySections}
      notice={
        <p>
          This privacy notice is a portfolio prototype and should be reviewed against the actual office policy,
          deployment environment, and applicable privacy requirements before real production use.
        </p>
      }
    />
  )
}