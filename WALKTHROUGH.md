# GoalFlow V2 walkthrough

## Dashboard
- The dashboard now shows a new Remaining Salary card and a Financial Plan Status widget.
- These values update from the current month’s income, expenses, allocations, and goal contribution state.

## Expenses
- The Expenses view now supports both single-entry and bulk-entry modes.
- Bulk mode lets you add multiple rows and save them in one action.

## Planning
- Monthly planning supports two modes: goal-based planning and custom planning.
- After saving a plan, the app asks whether each planned transfer was already completed or should remain pending.

## Pendings and history
- Pending transfers are tracked in the Pendings page and can be marked complete or edited.
- Monthly history is stored in monthly_summaries and can be reviewed from the History page.

## Firestore
- New collections are used for monthly_plans, monthly_summaries, and pending_contributions.
- Existing goal, expense, income, and allocation data remains intact while month-based records are archived by month.
