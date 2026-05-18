export interface Member {
  id: string;
  name: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  paidById: string;
  splitBetweenIds: string[]; // IDs of members the expense is divided among
  date: string;
}

export interface Group {
  id: string;
  name: string;
  members: Member[];
  expenses: Expense[];
  createdAt: string;
  currency: string;
  status: 'active' | 'completed';
}

export type UseCase = 'travel' | 'students' | 'pghome' | 'events';

export interface Settlement {
  from: string; // Member Name
  to: string; // Member Name
  amount: number;
}

export interface Balance {
  memberId: string;
  memberName: string;
  netAmount: number; // Positive means they are owed, negative means they owe
}
