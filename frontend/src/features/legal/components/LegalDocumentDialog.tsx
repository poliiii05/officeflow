import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

export type LegalDocumentSection = {
  id: string
  title: string
  description: string
  icon: LucideIcon
  content: ReactNode
}

type LegalDocumentDialogProps = {
  triggerLabel: string
  title: string
  description: string
  sidebarLabel: string
  icon: LucideIcon
  sections: LegalDocumentSection[]
  notice: ReactNode
}

export function LegalDocumentDialog({
  triggerLabel,
  title,
  description,
  sidebarLabel,
  icon: HeaderIcon,
  sections,
  notice,
}: LegalDocumentDialogProps) {
  const [open, setOpen] = useState(false)
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id ?? '')
  const [hasReachedEnd, setHasReachedEnd] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement | null>(null)
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  function updateReadingState() {
    const scrollArea = scrollAreaRef.current
    if (!scrollArea) return

    const reachedEnd =
      scrollArea.scrollTop + scrollArea.clientHeight >= scrollArea.scrollHeight - 16

    setHasReachedEnd(reachedEnd)

    if (reachedEnd) {
      setActiveSectionId(sections[sections.length - 1]?.id ?? '')
      return
    }

    const readingLine = scrollArea.getBoundingClientRect().bottom - 120
    let currentSection = sections[0]?.id ?? ''

    for (const section of sections) {
      const node = sectionRefs.current[section.id]
      if (!node) continue

      if (node.getBoundingClientRect().top <= readingLine) {
        currentSection = section.id
      }
    }

    setActiveSectionId(currentSection)
  }

  function scrollToSection(sectionId: string) {
    const scrollArea = scrollAreaRef.current
    const section = sectionRefs.current[sectionId]

    if (!scrollArea || !section) return

    scrollArea.scrollTo({
      top: Math.max(0, section.offsetTop - 18),
      behavior: 'smooth',
    })
  }

  useEffect(() => {
    if (!open) return

    setActiveSectionId(sections[0]?.id ?? '')
    setHasReachedEnd(false)

    requestAnimationFrame(() => {
      const scrollArea = scrollAreaRef.current
      if (!scrollArea) return

      scrollArea.scrollTop = 0
      updateReadingState()
    })
  }, [open, sections])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger type="button" className="font-medium text-primary hover:underline">
        {triggerLabel}
      </DialogTrigger>

      <DialogContent className="!w-[calc(100vw-2rem)] !max-w-[980px] gap-0 overflow-hidden p-0 sm:!max-w-[980px]">
        <div className="grid h-[82vh] max-h-[700px] min-h-[560px] min-w-0 overflow-hidden md:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="hidden min-w-0 border-r bg-muted/40 p-5 md:block">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <HeaderIcon className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">OfficeFlow</p>
                <p className="truncate text-xs text-muted-foreground">{sidebarLabel}</p>
              </div>
            </div>

            <div className="mt-7 space-y-2">
              {sections.map((section, index) => {
                const isActive = section.id === activeSectionId

                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => scrollToSection(section.id)}
                    className={cn(
                      'flex w-full min-w-0 items-center gap-3 rounded-xl px-2 py-2 text-left text-sm transition-all',
                      isActive
                        ? 'bg-background text-foreground shadow-sm ring-1 ring-border'
                        : 'text-muted-foreground hover:bg-background/60 hover:text-foreground'
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background text-muted-foreground ring-1 ring-border'
                      )}
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0 truncate">{section.title}</span>
                  </button>
                )
              })}
            </div>
          </aside>

          <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
            <div className="shrink-0 border-b p-5 sm:p-6">
              <DialogHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <HeaderIcon className="size-5" />
                </div>
                <DialogTitle className="text-2xl leading-tight">{title}</DialogTitle>
                <DialogDescription className="max-w-2xl">{description}</DialogDescription>
              </DialogHeader>
            </div>

            <div
              ref={scrollAreaRef}
              onScroll={updateReadingState}
              className="min-h-0 flex-1 space-y-7 overflow-y-auto overflow-x-hidden p-5 sm:p-6"
            >
              {sections.map((section) => {
                const Icon = section.icon

                return (
                  <section
                    key={section.id}
                    ref={(node) => {
                      sectionRefs.current[section.id] = node
                    }}
                    className="scroll-mt-6"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold">{section.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
                      </div>
                    </div>

                    <div className="mt-3 text-sm leading-6 text-muted-foreground">
                      {section.content}
                    </div>
                  </section>
                )
              })}

              <div className="rounded-xl border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
                {notice}
              </div>
            </div>

            <div className="shrink-0 border-t bg-background p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground">
                  {hasReachedEnd
                    ? 'You reached the end of this document.'
                    : 'Scroll to the bottom to continue.'}
                </p>

                <Button
                  className="cursor-pointer sm:w-40"
                  type="button"
                  disabled={!hasReachedEnd}
                  onClick={() => setOpen(false)}
                >
                  I understand
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}