import { Group, Balance, Settlement } from "../types";

export function calculateBalances(group: Group): Balance[] {
  const balances: Record<string, number> = {};

  // Initialize
  group.members.forEach(m => {
    balances[m.id] = 0;
  });

  // Process expenses
  group.expenses.forEach(expense => {
    // Member who paid gets a credit
    balances[expense.paidById] = (balances[expense.paidById] || 0) + expense.amount;

    // Split amount among beneficiaries
    if (expense.splitBetweenIds.length > 0) {
      const share = expense.amount / expense.splitBetweenIds.length;
      expense.splitBetweenIds.forEach(id => {
        balances[id] = (balances[id] || 0) - share;
      });
    }
  });

  return group.members.map(m => ({
    memberId: m.id,
    memberName: m.name,
    netAmount: Math.round(balances[m.id] * 100) / 100,
  }));
}

export function calculateSettlements(balances: Balance[]): Settlement[] {
  const settlements: Settlement[] = [];
  
  // Separate into debtors and creditors
  let debtors = balances
    .filter(b => b.netAmount < -0.01)
    .map(b => ({ ...b, netAmount: Math.abs(b.netAmount) }))
    .sort((a, b) => b.netAmount - a.netAmount);
    
  let creditors = balances
    .filter(b => b.netAmount > 0.01)
    .map(b => ({ ...b }))
    .sort((a, b) => b.netAmount - a.netAmount);

  while (debtors.length > 0 && creditors.length > 0) {
    const debtor = debtors[0];
    const creditor = creditors[0];
    
    const amount = Math.min(debtor.netAmount, creditor.netAmount);
    
    if (amount > 0.01) {
      settlements.push({
        from: debtor.memberName,
        to: creditor.memberName,
        amount: Math.round(amount * 100) / 100,
      });
    }

    debtor.netAmount -= amount;
    creditor.netAmount -= amount;

    if (debtor.netAmount < 0.01) debtors.shift();
    if (creditor.netAmount < 0.01) creditors.shift();
  }

  return settlements;
}
