import { CurrencySwitch } from '../settings/CurrencySwitch'
import { CategoriesSection } from '../settings/CategoriesSection'
import { RecurringSection } from '../settings/RecurringSection'

/** Финансовый «бюджет»: валюта, категории/лимиты, регулярные платежи. */
export function BudgetScreen() {
  return (
    <div className="space-y-4">
      <CurrencySwitch />
      <CategoriesSection />
      <RecurringSection />
    </div>
  )
}
