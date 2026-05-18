import { useState, useEffect, type FormEvent, type MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Plus, 
  ChevronLeft, 
  Receipt, 
  TrendingUp, 
  Wallet, 
  ArrowRight,
  Trash2,
  Sparkles,
  Search,
  PieChart as PieChartIcon,
  Globe,
  Settings,
  Share2,
  Download,
  BookOpen,
  Backpack,
  Home,
  CalendarDays
} from 'lucide-react';
import { Group, Member, Expense, Settlement, Balance } from './types';
import { calculateBalances, calculateSettlements } from './lib/splitting';
import { cn, formatCurrency } from './lib/utils';
import { format } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { useMemo } from 'react';
import { jsPDF } from 'jspdf';

// Mock/Initial Data or LocalStorage loading
const STORAGE_KEY = 'groupsplit_data';

export default function App() {
  const [groups, setGroups] = useState<Group[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [isAddingGroup, setIsAddingGroup] = useState(false);
  const [showLanding, setShowLanding] = useState(() => groups.length === 0);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
  }, [groups]);

  const activeGroup = groups.find(g => g.id === activeGroupId);

  const addGroup = (name: string, mNames: string[], currency: string = 'USD') => {
    const newGroup: Group = {
      id: crypto.randomUUID(),
      name,
      members: mNames.map(n => ({ id: crypto.randomUUID(), name: n })),
      expenses: [],
      createdAt: new Date().toISOString(),
      currency,
      status: 'active'
    };
    setGroups([...groups, newGroup]);
    setActiveGroupId(newGroup.id);
    setIsAddingGroup(false);
    setShowLanding(false);
  };

  const updateGroup = (updatedGroup: Group) => {
    setGroups(groups.map(g => g.id === updatedGroup.id ? updatedGroup : g));
  };

  const deleteGroup = (id: string) => {
    setGroups(groups.filter(g => g.id !== id));
    if (activeGroupId === id) setActiveGroupId(null);
  };

  const addExpense = (groupId: string, expense: Omit<Expense, 'id'>) => {
    setGroups(groups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          expenses: [
            { ...expense, id: crypto.randomUUID() },
            ...g.expenses
          ]
        };
      }
      return g;
    }));
  };

  const deleteExpense = (groupId: string, expenseId: string) => {
    setGroups(groups.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          expenses: g.expenses.filter(e => e.id !== expenseId)
        };
      }
      return g;
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <nav className="flex items-center justify-between px-6 md:px-8 py-4 bg-white border-b border-slate-200 sticky top-0 z-30">
        <div 
          className="flex items-center gap-2 md:gap-3 cursor-pointer group" 
          onClick={() => {
            setActiveGroupId(null);
            setShowLanding(groups.length === 0);
          }}
        >
          <div className="w-8 h-8 md:w-10 md:h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg md:text-xl transition-transform group-hover:scale-110">S</div>
          <h1 className="text-lg md:text-xl font-bold text-slate-800 tracking-tight">SplitFlow</h1>
        </div>
        <div className="flex items-center gap-3 md:gap-6">
          {!activeGroupId && !showLanding && (
            <button 
              onClick={() => setShowLanding(true)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100"
            >
              Explore Use Cases
            </button>
          )}
          {activeGroup && (
            <div className="hidden lg:flex gap-2 items-center">
              <span className="text-sm text-slate-500">Active:</span>
              <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold border border-indigo-100 truncate max-w-[150px]">{activeGroup.name}</span>
            </div>
          )}
          {/*<button className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
            <Users size={16} />
          </button>*/}
        </div>
      </nav>

      <div className="flex flex-1 min-h-[calc(100vh-73px)]">
        <AnimatePresence mode="wait">
          {showLanding ? (
            <LandingPage key="landing" onStart={() => setShowLanding(false)} onCreateGroup={() => setIsAddingGroup(true)} hasGroups={groups.length > 0} />
          ) : !activeGroupId ? (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex-1 max-w-6xl mx-auto p-4 md:p-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight mb-1">Your Groups</h2>
                  <p className="text-slate-500 text-sm">Organize shared expenses for any situation</p>
                </div>
                <button 
                  onClick={() => setIsAddingGroup(true)}
                  className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={18} /> New Group
                </button>
              </div>

              {groups.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 md:p-16 text-center border border-slate-200 shadow-sm">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Users className="text-slate-300" size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">No groups yet</h3>
                  <p className="text-slate-500 mb-8 max-w-sm mx-auto">Create a group to start tracking shared expenses with friends effortlessly.</p>
                  <button 
                    onClick={() => setIsAddingGroup(true)}
                    className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
                  >
                    Create group
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {groups.map(group => (
                    <GroupCard 
                      key={group.id} 
                      group={group} 
                      onClick={() => setActiveGroupId(group.id)} 
                      onDelete={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this group and all its expenses?')) deleteGroup(group.id);
                      }}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="group-view"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="flex-1 flex"
            >
              <GroupView 
                group={activeGroup!} 
                groups={groups}
                onSelectGroup={(id) => setActiveGroupId(id)}
                onAddGroup={() => setIsAddingGroup(true)}
                onAddExpense={addExpense}
                onDeleteExpense={deleteExpense}
                onUpdateGroup={updateGroup}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isAddingGroup && (
          <AddGroupModal 
            onClose={() => setIsAddingGroup(false)}
            onAdd={addGroup}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function GroupCard({ group, onClick, onDelete }: { group: Group, onClick: () => void, onDelete: (e: MouseEvent) => void, key?: string }) {
  const totalSpent = group.expenses.reduce((sum, e) => sum + e.amount, 0);
  
  return (
    <motion.div 
      whileHover={{ y: -4, shadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}
      onClick={onClick}
      className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-all cursor-pointer group relative"
    >
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {group.status === 'completed' && (
          <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded uppercase tracking-widest">Completed</span>
        )}
        <button 
          onClick={onDelete}
          className="p-2 text-rose-300 md:text-slate-200 hover:text-rose-500 transition-colors md:opacity-0 md:group-hover:opacity-100"
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold mb-4">
        {group.members.length} members
      </div>
      <h3 className="text-xl font-bold text-slate-800 mb-1 truncate pr-16 tracking-tight">{group.name}</h3>
      <div className="flex items-end justify-between mt-8">
        <div>
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Total Spent</div>
          <div className="text-2xl font-bold text-slate-900">{formatCurrency(totalSpent, group.currency)}</div>
        </div>
        <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:scale-110">
          <ArrowRight size={18} />
        </div>
      </div>
    </motion.div>
  );
}

function AddGroupModal({ onClose, onAdd }: { onClose: () => void, onAdd: (name: string, members: string[], currency: string) => void }) {
  const [name, setName] = useState('');
  const [members, setMembers] = useState(['', '']);
  const [currency, setCurrency] = useState('USD');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const validMembers = members.filter(m => m.trim());
    if (name && validMembers.length >= 2) {
      onAdd(name, validMembers, currency);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-md rounded-[24px] p-6 md:p-8 shadow-2xl relative border border-slate-200"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors">
          <Plus size={24} className="rotate-45" />
        </button>
        <h2 className="text-2xl font-bold text-slate-900 mb-6 tracking-tight">Create New Group</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">Group Purpose Name</label>
            <input 
              required
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Iceland Trip, Room 204, Dinner Club"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all text-lg font-medium"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">Currency</label>
              <select 
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
                <option value="JPY">JPY (¥)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
              </select>
            </div>
            <div>
               <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">Invite</label>
               <div className="text-[10px] text-slate-400 pt-3">Members will use this currency</div>
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">Members (Min 2)</label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {members.map((m, i) => (
                <div key={i} className="flex gap-2">
                  <input 
                    required={i < 2}
                    value={m}
                    onChange={e => {
                      const next = [...members];
                      next[i] = e.target.value;
                      setMembers(next);
                    }}
                    placeholder={`Friend ${i + 1}`}
                    className="flex-1 bg-slate-50 border border-slate-100 rounded-lg px-4 py-2 outline-none focus:ring-2 ring-indigo-500/10 focus:border-indigo-500 transition-all"
                  />
                  {members.length > 2 && (
                    <button 
                      type="button" 
                      onClick={() => setMembers(members.filter((_, idx) => idx !== i))}
                      className="p-2 text-slate-300 hover:text-rose-500"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button 
              type="button"
              onClick={() => setMembers([...members, ''])}
              className="mt-3 text-xs font-bold flex items-center gap-1 text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              <Plus size={14} /> Add another friend
            </button>
          </div>
          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-3 rounded-xl font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
            >
              Create
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function GroupView({ 
  group, 
  groups, 
  onSelectGroup, 
  onAddGroup, 
  onAddExpense,
  onDeleteExpense,
  onUpdateGroup
}: { 
  group: Group, 
  groups: Group[], 
  onSelectGroup: (id: string) => void,
  onAddGroup: () => void,
  onAddExpense: (gid: string, e: Omit<Expense, 'id'>) => void,
  onDeleteExpense: (gid: string, eid: string) => void,
  onUpdateGroup: (g: Group) => void
}) {
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const balances = calculateBalances(group);
  const settlements = calculateSettlements(balances);
  const totalSpent = group.expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="flex flex-1 overflow-hidden h-[calc(100vh-73px)] relative">
      {/* Sidebar - Desktop and Mobile Overlay */}
      <aside className={cn(
        "bg-white border-r border-slate-200 flex flex-col transition-all z-20",
        "absolute inset-y-0 left-0 w-64 md:relative",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex items-center justify-between mb-4 md:hidden">
            <h2 className="text-sm font-black text-slate-800">SplitFlow</h2>
            <button onClick={() => setIsSidebarOpen(false)}><Plus className="rotate-45 text-slate-400"/></button>
          </div>
          <h2 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4">My Groups</h2>
          <ul className="space-y-1 mb-8">
            {groups.map(g => (
              <li 
                key={g.id}
                onClick={() => {
                  onSelectGroup(g.id);
                  setIsSidebarOpen(false);
                }}
                className={cn(
                  "flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all",
                  g.id === group.id 
                    ? "bg-indigo-50 text-indigo-700 font-bold shadow-sm" 
                    : "text-slate-600 hover:bg-slate-50 md:hover:bg-slate-50"
                )}
              >
                <div className={cn(
                  "w-2 h-2 rounded-full flex-shrink-0",
                  g.id === group.id ? "bg-indigo-600" : "bg-slate-300"
                )}></div> 
                <span className="truncate">{g.name}</span>
              </li>
            ))}
          </ul>

          <h2 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4">Group Members</h2>
          <ul className="space-y-3">
            {group.members.map(m => (
              <li key={m.id} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-[10px] border border-slate-200">
                  {m.name.substring(0, 2).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-slate-700 truncate">{m.name}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-auto p-6 border-t border-slate-100">
          <button 
            onClick={onAddGroup}
            className="w-full border-2 border-dashed border-slate-200 text-slate-400 py-2.5 rounded-xl text-sm font-bold hover:border-indigo-300 hover:text-indigo-500 hover:bg-indigo-50 transition-all mb-3"
          >
            + New Group
          </button>
          <button 
            onClick={() => setShowSettings(true)}
            className="w-full bg-slate-900 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-black transition-all"
          >
            Group Settings
          </button>
        </div>
      </aside>

      {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/40 z-10 md:hidden" onClick={() => setIsSidebarOpen(false)} />}

      {/* Center Column: Expense Feed */}
      <main className="flex-1 flex flex-col bg-slate-50 overflow-y-auto pb-24 md:pb-8">
        {/* Mobile Toolbar */}
        <div className="flex md:hidden items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
           <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-500"><Plus className="rotate-90"/></button>
           <h3 className="font-bold text-slate-800 truncate px-2">{group.name}</h3>
           <button onClick={() => setShowSummary(true)} className="p-2 text-slate-500"><TrendingUp size={20}/></button>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-6 p-4 md:p-8 bg-white border-b border-slate-200">
          <div className="p-6 rounded-[28px] bg-indigo-600 text-white shadow-xl shadow-indigo-100 relative overflow-hidden group">
            <p className="text-[10px] text-white/60 uppercase font-black tracking-widest mb-2">Total Group Spend</p>
            <p className="text-3xl font-black">{formatCurrency(totalSpent, group.currency)}</p>
            <TrendingUp size={60} className="absolute -bottom-4 -right-4 text-white/10 group-hover:scale-110 transition-transform" />
          </div>
          <div className="p-6 rounded-[28px] bg-slate-50 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">Current Status</p>
            <div className="flex items-center gap-2">
               <div className={cn("w-2 h-2 rounded-full", group.status === 'active' ? "bg-emerald-500 animate-pulse" : "bg-slate-400")} />
               <p className="text-xl font-black text-slate-700 capitalize">{group.status}</p>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-bold italic">Trip is {group.status}</p>
          </div>
          <div className="p-6 rounded-[28px] bg-rose-50 border border-rose-100 shadow-sm hover:border-rose-200 transition-colors group">
            <p className="text-[10px] text-rose-600 uppercase font-black tracking-widest mb-2">Pending Dues</p>
            <div className="flex items-center justify-between">
               <p className="text-2xl font-black text-rose-700">{settlements.length} Transfers</p>
               <ArrowRight size={20} className="text-rose-300 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Mobile Settlement Guide */}
        {settlements.length > 0 && (
          <div className="xl:hidden px-4 md:px-8 py-6 border-b border-slate-100 bg-white">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Optimized Settlements</h3>
                <TrendingUp size={14} className="text-indigo-400" />
             </div>
             <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide snap-x">
                {settlements.map((s, i) => (
                  <div key={i} className="flex-shrink-0 w-[85vw] sm:w-72 p-5 bg-gradient-to-br from-white to-slate-50 rounded-2xl border border-slate-100 shadow-sm relative group snap-center">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-xs font-black text-white shadow-lg shadow-indigo-100">
                        {s.from[0]}
                      </div>
                      <div className="flex-1 h-[1px] bg-slate-200 relative">
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-1">
                            <ArrowRight size={12} className="text-slate-300" />
                         </div>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-xs font-black text-white shadow-lg shadow-emerald-100">
                        {s.to[0]}
                      </div>
                    </div>
                    <p className="text-[11px] font-bold text-slate-500 mb-1">
                      <span className="text-indigo-600">{s.from}</span> to <span className="text-emerald-600">{s.to}</span>
                    </p>
                    <p className="text-xl font-black text-slate-900 tracking-tight">{formatCurrency(s.amount, group.currency)}</p>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* Recent Activity Feed */}
        <div className="flex-1 p-4 md:p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-slate-900 tracking-tight">Recent Expenses</h3>
            <button 
              onClick={() => setIsAddingExpense(true)}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              <Plus size={18} /> Add
            </button>
          </div>
          
          <div className="space-y-4">
            {group.expenses.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-slate-200 rounded-[32px] p-12 md:p-16 text-center text-slate-400">
                <Receipt className="mx-auto mb-4 opacity-20" size={48} />
                <p className="text-lg font-bold">No expenses yet</p>
                <p className="text-sm">Click "+ Add" to record a cost</p>
              </div>
            ) : (
              group.expenses.map(expense => {
                const payer = group.members.find(m => m.id === expense.paidById);
                const date = new Date(expense.date);
                return (
                  <div key={expense.id} className="flex items-center justify-between p-4 md:p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:border-indigo-200 group">
                    <div className="flex items-center gap-4 md:gap-5 min-w-0">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-slate-50 group-hover:bg-indigo-50 rounded-xl flex flex-col items-center justify-center transition-colors flex-shrink-0">
                        <span className="text-[9px] text-slate-400 font-black tracking-widest">{format(date, 'MMM').toUpperCase()}</span>
                        <span className="text-lg font-black text-slate-700 leading-none">{format(date, 'd')}</span>
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 text-base md:text-lg leading-tight mb-1 truncate">{expense.description}</h4>
                        <p className="text-xs text-slate-500 font-medium truncate">
                          Paid by <strong className="text-slate-800">{payer?.name}</strong> • {expense.splitBetweenIds.length} beneficiaries
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-4 flex-shrink-0">
                      <div>
                        <p className="text-lg md:text-xl font-black text-slate-900 tracking-tight">{formatCurrency(expense.amount, group.currency)}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest hidden sm:block">{format(date, 'h:mm a')}</p>
                      </div>
                      <button 
                        onClick={() => {
                          if (confirm('Remove this expense?')) onDeleteExpense(group.id, expense.id);
                        }}
                        className="p-2 text-rose-300 md:text-slate-200 hover:text-rose-500 md:opacity-0 md:group-hover:opacity-100 transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Right Column: Settlements - Desktop only */}
      <aside className="w-80 bg-white border-l border-slate-200 p-8 hidden xl:flex flex-col overflow-y-auto">
        {settlements.length > 0 && (
          <div className="space-y-4 mb-10">
            <div className="p-6 bg-slate-50 rounded-[28px] border border-slate-100 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                 <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Optimized Settlements</p>
              </div>
              <div className="space-y-6">
                {settlements.map((s, i) => (
                  <div key={i} className="group relative">
                    <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-[10px] font-black text-indigo-600 shadow-sm">
                            {s.from[0]}
                          </div>
                          <ArrowRight size={12} className="text-slate-300" />
                          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-[10px] font-black text-white">
                            {s.to[0]}
                          </div>
                       </div>
                       <span className="text-sm font-black text-slate-900">{formatCurrency(s.amount, group.currency)}</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-500 mb-2 truncate">
                      {s.from} pays {s.to}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h3 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-6">Group Health</h3>
          <div className="space-y-5">
            {balances.map(b => (
              <div key={b.memberId} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 group-hover:bg-white group-hover:border-indigo-200 transition-all">
                    {b.memberName[0]}
                  </div>
                  <span className="text-sm font-bold text-slate-700 truncate max-w-[100px]">{b.memberName}</span>
                </div>
                <div className={cn(
                  "text-xs font-black px-2 py-1 rounded-lg shadow-sm border whitespace-nowrap",
                  b.netAmount >= 0 
                    ? "text-emerald-700 bg-emerald-50 border-emerald-100" 
                    : "text-rose-600 bg-rose-50 border-rose-100"
                )}>
                  {b.netAmount >= 0 ? '+' : ''}{formatCurrency(b.netAmount, group.currency)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto">
          <button 
            onClick={() => setShowSummary(true)}
            className="w-full bg-indigo-600 text-white p-5 rounded-3xl shadow-xl shadow-indigo-100 overflow-hidden group transition-all hover:scale-[1.02]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black opacity-70 uppercase tracking-widest">Analytics Report</span>
              <PieChartIcon size={16} className="opacity-70" />
            </div>
            <div className="text-left">
              <p className="text-xl font-black tracking-tight leading-tight">View Trip Summary & Export</p>
            </div>
          </button>
        </div>
      </aside>

      <AnimatePresence>
        {isAddingExpense && (
          <AddExpenseModal 
            group={group}
            onClose={() => setIsAddingExpense(false)}
            onAdd={(exp) => {
              onAddExpense(group.id, exp);
              setIsAddingExpense(false);
            }}
          />
        )}
        {showSettings && (
          <GroupSettingsModal 
            group={group} 
            onClose={() => setShowSettings(false)} 
            onUpdate={(u) => {
              onUpdateGroup(u);
              setShowSettings(false);
            }} 
          />
        )}
        {showSummary && (
          <TripSummaryModal 
             group={group} 
             balances={balances} 
             settlements={settlements} 
             onClose={() => setShowSummary(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AddExpenseModal({ group, onClose, onAdd }: { group: Group, onClose: () => void, onAdd: (e: Omit<Expense, 'id'>) => void }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(group.members[0].id);
  const [splitWith, setSplitWith] = useState<string[]>(group.members.map(m => m.id));

  const currencySymbol = useMemo(() => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: group.currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(0).replace(/\d/g, '').replace(/[.,]/g, '').trim();
    } catch {
      return group.currency;
    }
  }, [group.currency]);

  const toggleMember = (id: string) => {
    if (splitWith.includes(id)) {
      setSplitWith(splitWith.filter(i => i !== id));
    } else {
      setSplitWith([...splitWith, id]);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (description && amount && splitWith.length > 0) {
      onAdd({
        description,
        amount: parseFloat(amount),
        paidById: paidBy,
        splitBetweenIds: splitWith,
        date: new Date().toISOString()
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-2xl rounded-[32px] p-8 max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Add Expense</h2>
          <button onClick={onClose} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all">
            <Plus size={24} className="rotate-45" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="text-[10px] uppercase font-black text-slate-400 mb-3 block tracking-widest">Description</label>
              <input 
                required
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Ice Hotel Accomodation"
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 outline-none focus:ring-4 ring-indigo-500/5 focus:border-indigo-400 transition-all text-lg font-bold text-slate-800 placeholder:text-slate-300 shadow-sm"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-black text-slate-400 mb-3 block tracking-widest">Amount</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-300 tracking-tighter">{currencySymbol}</span>
                <input 
                  required
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-10 pr-5 py-4 outline-none focus:ring-4 ring-indigo-500/5 focus:border-indigo-400 transition-all text-3xl font-black text-slate-900 placeholder:text-slate-200 shadow-sm"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <label className="text-[10px] uppercase font-black text-slate-400 mb-4 block tracking-widest">Paid By</label>
              <div className="flex flex-wrap gap-2.5">
                {group.members.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaidBy(m.id)}
                    className={cn(
                      "px-5 py-2.5 rounded-xl text-xs font-black transition-all border shadow-sm",
                      paidBy === m.id 
                        ? "bg-slate-900 text-white border-slate-900 scale-105" 
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"
                    )}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase font-black text-slate-400 mb-4 block tracking-widest">Split with</label>
              <div className="flex flex-wrap gap-2.5">
                {group.members.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleMember(m.id)}
                    className={cn(
                      "px-5 py-2.5 rounded-xl text-xs font-black transition-all border shadow-sm",
                      splitWith.includes(m.id) 
                        ? "bg-emerald-600 text-white border-emerald-600 scale-105" 
                        : "bg-white border-slate-200 text-slate-600 hover:border-slate-400"
                    )}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button 
              type="submit"
              className="w-full py-5 rounded-3xl font-black text-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 active:scale-95 transform tracking-tight"
            >
              Add Expense to Feed
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function LandingPage({ onStart, onCreateGroup, hasGroups }: { onStart: () => void, onCreateGroup: () => void, hasGroups: boolean, key?: string }) {
  const useCases = [
    { title: 'Global Travelers', icon: <Backpack className="text-blue-500" />, desc: 'Split hostels, taxis, and dinners across currencies.', tag: 'Travel' },
    { title: 'Student Life', icon: <BookOpen className="text-indigo-500" />, desc: 'Track shared groceries, utilities, and party costs.', tag: 'Students' },
    { title: 'PG & Renters', icon: <Home className="text-emerald-500" />, desc: 'Simplify monthly rent, broadband, and house chores.', tag: 'Homes' },
    { title: 'Event Planning', icon: <CalendarDays className="text-rose-500" />, desc: 'Manage wedding costs or surprise birthday bashes.', tag: 'Events' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-1 overflow-y-auto"
    >
      <section className="bg-white border-b border-slate-100 py-16 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Globe size={400} />
        </div>
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-full text-xs font-bold mb-6 border border-indigo-100">
            <Sparkles size={12} /> SMART EXPENSE MANAGEMENT
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tighter leading-tight">
            Stop worrying about who owes <span className="text-indigo-600">who what.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto font-medium">
            The most beautiful and functional way to split group expenses. Whether you're traveling the world or sharing a flat.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={onCreateGroup}
              className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all hover:scale-105"
            >
              Start Splitting Free
            </button>
            {hasGroups && (
              <button 
                onClick={onStart}
                className="w-full sm:w-auto px-8 py-4 bg-slate-50 text-slate-700 rounded-2xl font-bold text-lg hover:bg-slate-100 transition-all border border-slate-200"
              >
                Go to Dashboard
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 md:px-8 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Built for every journey</h2>
          <p className="text-slate-500 font-medium">Powering shared experiences across multiple domains</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {useCases.map((useCase, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all group"
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {useCase.icon}
              </div>
              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg uppercase tracking-widest mb-3 inline-block">
                {useCase.tag}
              </span>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{useCase.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed font-medium">
                {useCase.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-20 bg-slate-900 text-white px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-black mb-8 tracking-tighter leading-tight">
                User Friendly. <br/> Currency Fluid. <br/> Mobile Ready.
              </h2>
              <div className="space-y-6">
                {[
                  { title: 'Easy Expence Input', desc: 'Just add amount & small desc and we handle the rest.' },
                  { title: 'Smart Settlement', desc: 'Our algorithm minimizes the number of transfers needed.' },
                  { title: 'Interactive Analytics', desc: 'Beautiful charts to visualize group spending habits.' }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-6 h-6 rounded-full bg-indigo-500 shrink-0 flex items-center justify-center text-[10px] font-black">
                      {i+1}
                    </div>
                    <div>
                      <h4 className="font-bold text-lg mb-1">{item.title}</h4>
                      <p className="text-slate-400 text-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-800/50 p-8 rounded-[40px] border border-slate-700 backdrop-blur-xl">
               <div className="flex items-center justify-between mb-8">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  </div>
                  <div className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Global Transactions</div>
               </div>
               <div className="space-y-4">
                  {[
                    { from: 'Alex', to: 'Sarah', amount: 'Rs.140.20' },
                    { from: 'Mike', to: 'Alex', amount: 'Rs.350.50' },
                    { from: 'Emily', to: 'Mike', amount: 'Rs.1400.00' }
                  ].map((t, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-2xl border border-slate-700/50">
                       <span className="font-bold">{t.from} Pays {t.to}</span>
                       <span className="text-indigo-400 font-black">{t.amount}</span>
                    </div>
                  ))}
                  <div className="pt-4 text-center">
                     <button className="text-xs font-bold text-indigo-400 hover:text-indigo-300">VIEW CONSOLIDATED SETTLEMENTS →</button>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-12 border-t border-slate-100 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
           <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">S</div>
             <span className="font-bold text-slate-800">SplitFlow</span>
           </div>
           <p className="text-slate-400 text-xs font-medium">© 2026 SplitFlow Inc. All rights reserved.</p>
           <div className="flex gap-6 text-xs font-bold text-slate-500">
             <a href="#" className="hover:text-indigo-600">Privacy</a>
             <a href="#" className="hover:text-indigo-600">Terms</a>
             <a href="#" className="hover:text-indigo-600">Feedback</a>
           </div>
        </div>
      </footer>
    </motion.div>
  );
}

function GroupSettingsModal({ group, onClose, onUpdate }: { group: Group, onClose: () => void, onUpdate: (g: Group) => void }) {
  const [name, setName] = useState(group.name);
  const [currency, setCurrency] = useState(group.currency);
  const [status, setStatus] = useState(group.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-md rounded-[32px] p-8 shadow-2xl border border-slate-200"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Settings</h2>
          <button onClick={onClose} className="p-2 bg-slate-50 rounded-xl hover:bg-slate-100"><Plus className="rotate-45" /></button>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="text-[10px] uppercase font-black text-slate-400 mb-2 block tracking-widest">Group Name</label>
            <input 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:ring-4 ring-indigo-500/5 font-bold"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-black text-slate-400 mb-2 block tracking-widest">Base Currency</label>
            <select 
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:ring-4 ring-indigo-500/5 font-black uppercase"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="INR">INR (₹)</option>
              <option value="JPY">JPY (¥)</option>
              <option value="CAD">CAD ($)</option>
              <option value="AUD">AUD ($)</option>
            </select>
            <p className="text-[10px] text-slate-400 mt-2 italic font-medium">Note: All current expenses will be displayed in this currency.</p>
          </div>
          <div>
            <label className="text-[10px] uppercase font-black text-slate-400 mb-2 block tracking-widest">Trip Status</label>
            <div className="flex p-1 bg-slate-100 rounded-2xl">
              <button 
                onClick={() => setStatus('active')}
                className={cn(
                  "flex-1 py-2 rounded-xl text-xs font-black transition-all",
                  status === 'active' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                ACTIVE
              </button>
              <button 
                onClick={() => setStatus('completed')}
                className={cn(
                  "flex-1 py-2 rounded-xl text-xs font-black transition-all",
                  status === 'completed' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                COMPLETED
              </button>
            </div>
          </div>
        </div>

        <div className="pt-10">
          <button 
            onClick={() => onUpdate({ ...group, name, currency, status })}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
          >
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function TripSummaryModal({ group, balances, settlements, onClose }: { group: Group, balances: Balance[], settlements: Settlement[], onClose: () => void }) {
  const chartData = balances.map(b => ({
    name: b.memberName,
    balance: b.netAmount,
    fill: b.netAmount >= 0 ? '#10b981' : '#f43f5e'
  }));

  const categoryData = group.expenses.reduce((acc: any[], exp) => {
    const existing = acc.find(a => a.name === exp.description); // Simple grouping by description prefix for mock
    if (existing) {
      existing.value += exp.amount;
    } else {
      acc.push({ name: exp.description.substring(0, 10) + '...', value: exp.amount });
    }
    return acc;
  }, []);

  const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#8b5cf6', '#ec4899'];

  const totalSpend = group.expenses.reduce((s, e) => s + e.amount, 0);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = margin;

    // Helper for colors
    const primaryColor = [99, 102, 241]; // Indigo 500
    const successColor = [16, 185, 129]; // Emerald 500
    const dangerColor = [244, 63, 94];   // Rose 500
    const grayColor = [100, 116, 139];   // Slate 500

    // Header Design
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(28);
    doc.text("SplitFlow Report", margin, 25);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(group.name, margin, 33);
    
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth - margin - 40, 25);

    y = 55;

    // Overview Section Cards
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Trip Overview", margin, y);
    y += 10;

    // Draw Stats Boxes
    const cardWidth = (pageWidth - (margin * 3)) / 2;
    
    // Total Spent Card
    doc.setDrawColor(230, 230, 230);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(margin, y, cardWidth, 25, 3, 3, 'FD');
    doc.setFontSize(10);
    doc.setTextColor( grayColor[0], grayColor[1], grayColor[2]);
    doc.text("TOTAL GROUP SPEND", margin + 5, y + 8);
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(formatCurrency(totalSpend, group.currency), margin + 5, y + 18);

    // Members Card
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(margin + cardWidth + 20, y, cardWidth - 20, 25, 3, 3, 'FD');
    doc.setFontSize(10);
    doc.setTextColor( grayColor[0], grayColor[1], grayColor[2]);
    doc.text("MEMBERS", margin + cardWidth + 25, y + 8);
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`${group.members.length} Active`, margin + cardWidth + 25, y + 18);

    y += 40;

    // Diagram: Net Balance Chart (Manual Drawing)
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Member Spending Distribution", margin, y);
    y += 10;

    const chartHeight = 50;
    const chartWidth = pageWidth - (margin * 2);
    const barWidth = 15;
    const spacing = (chartWidth - (balances.length * barWidth)) / (balances.length + 1);

    // Find max balance for scaling
    const maxVal = Math.max(...balances.map(b => Math.abs(b.netAmount)), 1);
    
    // Draw baseline
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y + (chartHeight/2), margin + chartWidth, y + (chartHeight/2));

    balances.forEach((b, i) => {
      const x = margin + spacing + (i * (barWidth + spacing));
      const h = (Math.abs(b.netAmount) / maxVal) * (chartHeight / 2);
      
      if (b.netAmount >= 0) {
        doc.setFillColor(successColor[0], successColor[1], successColor[2]);
        doc.rect(x, y + (chartHeight/2) - h, barWidth, h, 'F');
      } else {
        doc.setFillColor(dangerColor[0], dangerColor[1], dangerColor[2]);
        doc.rect(x, y + (chartHeight/2), barWidth, h, 'F');
      }
      
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text(b.memberName.substring(0, 5), x, y + chartHeight + 5);
    });

    y += chartHeight + 20;

    // Final Settlements Section
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Final Settlements Diagram", margin, y);
    y += 12;

    if (settlements.length === 0) {
      doc.setFont("helvetica", "normal");
      doc.setTextColor(successColor[0], successColor[1], successColor[2]);
      doc.text("✔ All expenses are perfectly settled!", margin, y);
      y += 10;
    } else {
      settlements.forEach((s, idx) => {
        // Draw a settlement "box"
        doc.setDrawColor(240, 240, 240);
        doc.setFillColor(252, 252, 255);
        doc.roundedRect(margin, y, pageWidth - (margin * 2), 15, 2, 2, 'FD');
        
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(s.from, margin + 5, y + 9);
        
        doc.setTextColor(150, 150, 150);
        doc.text("→ Pays →", margin + 40, y + 9);
        
        doc.setTextColor(successColor[0], successColor[1], successColor[2]);
        doc.text(s.to, margin + 70, y + 9);
        
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.text(formatCurrency(s.amount, group.currency), pageWidth - margin - 35, y + 9.5);
        
        y += 18;
        if (y > 270) { doc.addPage(); y = margin; }
      });
    }

    y += 10;
    if (y > 250) { doc.addPage(); y = margin; }

    // Detailed Expense List
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Detailed Expense Feed", margin, y);
    y += 10;

    // Header for table
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, y, pageWidth - (margin * 2), 8, 'F');
    doc.setFontSize(9);
    doc.text("Date", margin + 2, y + 5.5);
    doc.text("Description", margin + 30, y + 5.5);
    doc.text("Paid By", margin + 110, y + 5.5);
    doc.text("Amount", pageWidth - margin - 20, y + 5.5);
    y += 12;

    group.expenses.forEach(e => {
      const date = format(new Date(e.date), 'MMM d');
      const payer = group.members.find(m => m.id === e.paidById)?.name || 'Unknown';
      
      doc.setFont("helvetica", "normal");
      doc.text(date, margin + 2, y);
      doc.text(e.description.substring(0, 30), margin + 30, y);
      doc.text(payer, margin + 110, y);
      doc.setFont("helvetica", "bold");
      doc.text(formatCurrency(e.amount, group.currency), pageWidth - margin - 20, y);
      
      y += 8;
      if (y > 280) { doc.addPage(); y = margin; }
    });

    // Footer on last page
    doc.setFontSize(8);
    doc.setTextColor(180, 180, 180);
    doc.text("Generated by SplitFlow - The Smartest Way to Split Costs", pageWidth/2, 290, { align: 'center' });

    doc.save(`${group.name.replace(/\s+/g, '_')}_Final_Report.pdf`);
    alert('PDF report downloaded successfully!');
  };

  const handleShare = async () => {
    const text = `Expense Report for ${group.name}\nTotal Spent: ${formatCurrency(totalSpend, group.currency)}\nSettlements needed: ${settlements.length}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'SplitFlow Expense Report',
          text: text,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      navigator.clipboard.writeText(text);
      alert('Report summary copied to clipboard!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-4xl rounded-[40px] p-6 md:p-10 max-h-[90vh] overflow-y-auto shadow-2xl relative"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Trip Analytics</h2>
            <p className="text-slate-500 font-medium">{group.name} • Full Report</p>
          </div>
          <div className="flex gap-2">
            {/*<button 
              onClick={handleShare}
              className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all" 
              title="Share Report"
            >
               <Share2 size={24} />
            </button>*/}
            <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100">
               <Plus className="rotate-45" size={24} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-10">
          <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100">
             <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8">Net Balances</h3>
             <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                      <YAxis hide />
                      <RechartsTooltip 
                        cursor={{ fill: 'transparent' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                             return (
                               <div className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-black">
                                 {formatCurrency(payload[0].value as number, group.currency)}
                               </div>
                             )
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="balance" radius={[8, 8, 0, 0]} />
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm relative overflow-hidden">
             <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-8">Expense Distribution</h3>
             <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                   </PieChart>
                </ResponsiveContainer>
             </div>
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                <span className="text-xl font-black text-slate-900">{formatCurrency(totalSpend, group.currency)}</span>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
             <h3 className="text-xl font-black text-slate-900 mb-6 tracking-tight">Final Settlements</h3>
             <div className="space-y-4">
                {settlements.map((s, idx) => (
                  <div key={idx} className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between group hover:bg-indigo-600 transition-all">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-black text-indigo-600 shadow-sm group-hover:scale-110 transition-transform">
                           {s.from[0]}
                        </div>
                        <span className="font-bold text-slate-700 group-hover:text-white transition-colors">{s.from} Pays {s.to}</span>
                     </div>
                     <span className="text-lg font-black text-indigo-700 group-hover:text-white transition-colors">{formatCurrency(s.amount, group.currency)}</span>
                  </div>
                ))}
             </div>
          </div>
          
          <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden">
             <Globe className="absolute -bottom-10 -right-10 opacity-10 rotate-12" size={200} />
             <h3 className="text-xl font-black mb-6 tracking-tight relative z-10">Share Results</h3>
             <p className="text-slate-400 mb-8 relative z-10 font-medium">Send the final report to all members via direct message or email. Keep everyone in the loop with a clear breakdown.</p>
             <div className="grid grid-cols-2 gap-4 relative z-10">
                {/*<button className="flex items-center justify-center gap-2 bg-white text-slate-900 py-3 rounded-2xl font-black hover:bg-indigo-50 transition-all">
                  <Share2 size={16} /> Link
                </button>*/}
                <button 
                  onClick={handleDownloadPDF}
                  className="flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-2xl font-black hover:bg-indigo-700 transition-all"
                >
                  <Download size={16} /> PDF
                </button>
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
