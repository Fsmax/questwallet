import { useRef, useState } from 'react'
import { Download, Upload } from 'lucide-react'
import { useAppState } from '../state/AppStateContext'
import { useAuth } from '../auth/useAuth'
import { loadTransactions } from '../storage/storage'
import { SettingsCard } from './SettingsCard'
import { Modal } from '../components/Modal'
import type { AppState, Transaction } from '../types'

interface ExportPayload {
  exportedAt: string
  appVersion: string
  state: AppState
  transactions: Transaction[]
}

export function ExportImportSection() {
  const { state, replaceState } = useAppState()
  const auth = useAuth()
  const [importing, setImporting] = useState(false)
  const [confirmImport, setConfirmImport] = useState<ExportPayload | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  if (!state || !auth.user) return null

  const handleExport = async () => {
    setErr(null)
    try {
      // Подгружаем максимум транзакций для бэкапа (1000 — реалистичный предел для pet-проекта)
      const all = await loadTransactions(auth.user!.id, 1000, 0)
      const payload: ExportPayload = {
        exportedAt: new Date().toISOString(),
        appVersion: '1.0.0',
        state,
        transactions: all.length > 0 ? all : state.transactions,
      }
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `questwallet-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Не удалось экспортировать')
    }
  }

  const handlePickFile = () => {
    fileRef.current?.click()
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErr(null)
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as Partial<ExportPayload>
      if (!parsed.state || typeof parsed.state !== 'object') {
        throw new Error('Файл не похож на бэкап QuestWallet')
      }
      // Базовая sanity-проверка
      const s = parsed.state as AppState
      if (typeof s.balance !== 'number' || !Array.isArray(s.tasks) || !Array.isArray(s.goals)) {
        throw new Error('В файле нет нужных полей')
      }
      setConfirmImport({
        exportedAt: parsed.exportedAt ?? '?',
        appVersion: parsed.appVersion ?? '?',
        state: s,
        transactions: parsed.transactions ?? [],
      })
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Не удалось прочитать файл')
    }
  }

  const applyImport = () => {
    if (!confirmImport) return
    setImporting(true)
    replaceState(confirmImport.state)
    setConfirmImport(null)
    setImporting(false)
  }

  return (
    <SettingsCard title="Бэкап">
      <div className="space-y-2">
        <button
          onClick={handleExport}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition"
        >
          <Download size={16} />
          Скачать JSON
        </button>
        <button
          onClick={handlePickFile}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition"
        >
          <Upload size={16} />
          Загрузить из JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      {err && (
        <div className="mt-3 text-sm text-[var(--color-coral)] bg-[var(--color-coral)]/10 border border-[var(--color-coral)]/30 rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      <Modal
        open={confirmImport !== null}
        onClose={() => setConfirmImport(null)}
        title="Подтверждение импорта"
      >
        {confirmImport && (
          <div className="space-y-4">
            <p className="text-sm text-white/80">
              Текущий прогресс <strong className="text-[var(--color-coral)]">будет заменён</strong> данными из файла.
            </p>
            <div className="bg-black/30 rounded-xl p-3 text-sm space-y-1">
              <div className="text-white/50">Файл создан: <span className="text-white tabular-nums">{confirmImport.exportedAt.slice(0, 10)}</span></div>
              <div className="text-white/50">Квестов: <span className="text-white">{confirmImport.state.tasks.length}</span></div>
              <div className="text-white/50">Целей: <span className="text-white">{confirmImport.state.goals.length}</span></div>
              <div className="text-white/50">Баланс: <span className="text-white tabular-nums">{confirmImport.state.balance}</span></div>
            </div>
            <p className="text-xs text-white/40">
              Старые транзакции в облаке останутся (для безопасности). State будет перезаписан.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmImport(null)}
                className="flex-1 py-3 bg-white/5 border border-white/10 text-white/80 font-semibold rounded-xl hover:bg-white/10"
              >
                Отмена
              </button>
              <button
                onClick={applyImport}
                disabled={importing}
                className="flex-1 py-3 bg-[var(--color-gold)] text-[var(--color-bg-deep)] font-bold rounded-xl disabled:opacity-50"
              >
                Импортировать
              </button>
            </div>
          </div>
        )}
      </Modal>
    </SettingsCard>
  )
}
