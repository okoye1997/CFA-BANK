"use client";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { format, subDays } from "date-fns";
export function ActivityChart({ transactions }: { transactions: { createdAt: string; amount: number; status: string }[] }) {
  const data = Array.from({ length: 7 }, (_, index) => {
    const day = subDays(new Date(), 6 - index);
    const key = format(day, "yyyy-MM-dd");
    return { day: format(day, "EEE"), amount: transactions.filter(t => t.status === "PENDING" && t.createdAt.slice(0, 10) === key).reduce((sum, t) => sum + t.amount, 0) / 100 };
  });
  return <div className="card p-6 mt-7"><h2 className="text-xl font-bold">Transfer activity</h2><p className="muted text-sm mt-1">Pending transfer amounts over the last seven days</p><div className="h-56 mt-5"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data}><defs><linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#1d75d0" stopOpacity={0.28}/><stop offset="100%" stopColor="#1d75d0" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#eaf0f8" vertical={false}/><XAxis dataKey="day" stroke="#6d8098"/><YAxis stroke="#6d8098" tickFormatter={value=>`$${value/1000}k`}/><Tooltip formatter={value=>`$${Number(value).toLocaleString()}`}/><Area type="monotone" dataKey="amount" stroke="#1468c6" strokeWidth={3} fill="url(#chartFill)"/></AreaChart></ResponsiveContainer></div></div>;
}
