import type { ReactNode } from 'react'

interface SettingsCardProps {
  title: string
  children: ReactNode
}

export function SettingsCard({ title, children }: SettingsCardProps) {
  return (
    <section className="bg-white/5 border border-white/10 rounded-2xl p-4">
      <h2 className="text-xs uppercase tracking-wide text-white/55 font-bold mb-3">{title}</h2>
      {children}
    </section>
  )
}

interface SettingsRowProps {
  label: string
  hint?: string
  children: ReactNode
}

export function SettingsRow({ label, hint, children }: SettingsRowProps) {
  return (
    <div className="py-2.5 first:pt-0 last:pb-0 border-b border-white/5 last:border-b-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1">
          <div className="text-white font-semibold">{label}</div>
          {hint && <div className="text-xs text-white/55 mt-0.5">{hint}</div>}
        </div>
        <div className="flex-shrink-0">{children}</div>
      </div>
    </div>
  )
}
