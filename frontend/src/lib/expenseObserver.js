/**
 * Expense Observer Pattern
 * Multiple components subscribe to expense changes and react automatically.
 */

export class ExpenseObserver {
  onExpenseAdded(expense) {
    throw new Error('onExpenseAdded() must be implemented')
  }

  onExpenseDeleted(expenseId) {
    throw new Error('onExpenseDeleted() must be implemented')
  }

  onExpenseUpdated(expense) {
    throw new Error('onExpenseUpdated() must be implemented')
  }

  onExpensesRefreshed(expenses) {
    throw new Error('onExpensesRefreshed() must be implemented')
  }
}

export class ExpenseSubject {
  constructor() {
    this.observers = []
    this.expenses = []
  }

  subscribe(observer) {
    if (!this.observers.includes(observer)) {
      this.observers.push(observer)
    }
  }

  unsubscribe(observer) {
    this.observers = this.observers.filter((obs) => obs !== observer)
  }

  addExpense(expense) {
    this.expenses.push(expense)
    this.notifyObserversExpenseAdded(expense)
  }

  deleteExpense(expenseId) {
    this.expenses = this.expenses.filter((e) => e.id !== expenseId)
    this.notifyObserversExpenseDeleted(expenseId)
  }

  updateExpense(updatedExpense) {
    const index = this.expenses.findIndex((e) => e.id === updatedExpense.id)
    if (index !== -1) {
      this.expenses[index] = updatedExpense
    }
    this.notifyObserversExpenseUpdated(updatedExpense)
  }

  setExpenses(expenses) {
    this.expenses = expenses
    this.notifyObserversExpensesRefreshed(expenses)
  }

  getExpenses() {
    return [...this.expenses]
  }

  notifyObserversExpenseAdded(expense) {
    this.observers.forEach((observer) => {
      observer.onExpenseAdded(expense)
    })
  }

  notifyObserversExpenseDeleted(expenseId) {
    this.observers.forEach((observer) => {
      observer.onExpenseDeleted(expenseId)
    })
  }

  notifyObserversExpenseUpdated(expense) {
    this.observers.forEach((observer) => {
      observer.onExpenseUpdated(expense)
    })
  }

  notifyObserversExpensesRefreshed(expenses) {
    this.observers.forEach((observer) => {
      observer.onExpensesRefreshed(expenses)
    })
  }
}

export class DashboardObserver extends ExpenseObserver {
  constructor(onUpdate) {
    super()
    this.onUpdate = onUpdate
  }

  onExpenseAdded(expense) {
    this.onUpdate()
  }

  onExpenseDeleted(expenseId) {
    this.onUpdate()
  }

  onExpenseUpdated(expense) {
    this.onUpdate()
  }

  onExpensesRefreshed(expenses) {
    this.onUpdate()
  }
}

export class ChartObserver extends ExpenseObserver {
  constructor(onUpdate) {
    super()
    this.onUpdate = onUpdate
  }

  onExpenseAdded(expense) {
    this.onUpdate()
  }

  onExpenseDeleted(expenseId) {
    this.onUpdate()
  }

  onExpenseUpdated(expense) {
    this.onUpdate()
  }

  onExpensesRefreshed(expenses) {
    this.onUpdate()
  }
}

export class StatisticsObserver extends ExpenseObserver {
  constructor(onUpdate) {
    super()
    this.onUpdate = onUpdate
  }

  onExpenseAdded(expense) {
    this.onUpdate()
  }

  onExpenseDeleted(expenseId) {
    this.onUpdate()
  }

  onExpenseUpdated(expense) {
    this.onUpdate()
  }

  onExpensesRefreshed(expenses) {
    this.onUpdate()
  }
}

export const globalExpenseSubject = new ExpenseSubject()
