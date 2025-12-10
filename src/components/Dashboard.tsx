import React, { useMemo, useState } from 'react';
import { UserProfile, WorkoutLog, NutritionLog } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Flame, Calendar as CalendarIcon, Activity, ChevronLeft, ChevronRight, X, Clock, Dumbbell, Target, Utensils, TrendingUp, Trash2 } from 'lucide-react';

interface DashboardProps {
  logs: WorkoutLog[];
  user: UserProfile;
  nutritionLogs?: NutritionLog[];
  onDeleteLog?: (id: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ logs, user, nutritionLogs = [], onDeleteLog }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedLog, setSelectedLog] = useState<WorkoutLog | null>(null);

  const nextMonth = () => {
    setCurrentDate(prev => {
      const next = new Date(prev);
      next.setMonth(prev.getMonth() + 1);
      return next;
    });
  };

  const prevMonth = () => {
    setCurrentDate(prev => {
      const prevDate = new Date(prev);
      prevDate.setMonth(prev.getMonth() - 1);
      return prevDate;
    });
  };

  // Calculate stats based on currentDate
  const stats = useMemo(() => {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const monthlyLogs = logs.filter(l => {
      const d = new Date(l.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalCalories = monthlyLogs.reduce((acc, curr) => acc + Number(curr.calories || 0), 0);
    const workoutsCount = monthlyLogs.length;

    const today = new Date();
    const recentChartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      const dayLogs = logs.filter(l => {
        const logDate = new Date(l.date);
        return logDate.getDate() === d.getDate() &&
          logDate.getMonth() === d.getMonth() &&
          logDate.getFullYear() === d.getFullYear();
      });
      const dayCals = dayLogs.reduce((acc, curr) => acc + Number(curr.calories || 0), 0);

      recentChartData.push({
        name: d.toLocaleDateString('es-ES', { weekday: 'short' }),
        cals: dayCals
      });
    }

    // Nutrition Stats for Today
    const todayNutritionLogs = nutritionLogs.filter(l => {
      const d = new Date(l.date);
      return d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear();
    });
    const consumedCalories = todayNutritionLogs.reduce((acc, curr) => acc + curr.calories, 0);

    const todayWorkoutLogs = logs.filter(l => {
      const d = new Date(l.date);
      return d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear();
    });
    const burnedCaloriesToday = todayWorkoutLogs.reduce((acc, curr) => acc + Number(curr.calories || 0), 0);

    const goalCalories = user.dietPlan?.dailyCalories || 2000; // Default if no plan

    const netCalories = consumedCalories - burnedCaloriesToday;
    const percentageNet = (netCalories / goalCalories) * 100;

    let statusColor = 'text-green-500';

    if (percentageNet > 100) {
      statusColor = 'text-red-500';
    } else if (percentageNet > 85) {
      statusColor = 'text-red-500'; // "Próximos o nos pasamos" -> Red
    } else if (percentageNet > 50) {
      statusColor = 'text-yellow-500';
    }

    return { totalCalories, workoutsCount, chartData: recentChartData, consumedCalories, burnedCaloriesToday, goalCalories, statusColor, netCalories };
  }, [logs, currentDate, nutritionLogs, user.dietPlan]);

  // Calendar Grid Generation
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday

    // Adjust for Monday start (0 = Monday, 6 = Sunday)
    const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const days = [];

    // Empty slots for previous month
    for (let i = 0; i < startDay; i++) {
      days.push({ day: null, log: null });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      // Find the first workout for this day (if any)
      const log = logs.find(l => {
        const d = new Date(l.date);
        return d.getDate() === i && d.getMonth() === month && d.getFullYear() === year;
      });
      days.push({ day: i, log });
    }
    return days;
  }, [logs, currentDate]);

  const monthName = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 animate-fade-in relative">

      {/* Workout Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--color-card)] w-full max-w-lg rounded-3xl border border-[var(--color-primary)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

            <div className="p-6 border-b border-gray-700 flex justify-between items-start bg-[var(--color-bg)]">
              <div>
                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Detalles del Entrenamiento</p>
                <h3 className="text-2xl font-bold text-[var(--color-text)] leading-tight">{selectedLog.name}</h3>
                <p className="text-sm text-[var(--color-primary)] font-medium mt-1">
                  {new Date(selectedLog.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-[var(--color-text)]"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="flex gap-4 mb-6">
                <div className="flex-1 bg-[var(--color-bg)] p-4 rounded-xl border border-gray-700 flex flex-col items-center justify-center text-center">
                  <Flame size={24} className="text-[var(--color-primary)] mb-2" />
                  <span className="text-2xl font-bold text-[var(--color-text)]">{selectedLog.calories}</span>
                  <span className="text-xs text-gray-500 uppercase">Calorías</span>
                </div>
                <div className="flex-1 bg-[var(--color-bg)] p-4 rounded-xl border border-gray-700 flex flex-col items-center justify-center text-center">
                  <Clock size={24} className="text-[var(--color-secondary)] mb-2" />
                  <span className="text-2xl font-bold text-[var(--color-text)]">{selectedLog.durationMinutes}</span>
                  <span className="text-xs text-gray-500 uppercase">Minutos</span>
                </div>
              </div>

              <div className="bg-[var(--color-bg)] p-5 rounded-xl border border-gray-700">
                <h4 className="text-sm font-bold text-gray-300 mb-3 flex items-center gap-2">
                  <Dumbbell size={16} className="text-[var(--color-primary)]" />
                  Ejercicios y Notas
                </h4>
                <p className="text-gray-300 text-sm whitespace-pre-line leading-relaxed">
                  {selectedLog.description}
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-gray-700 bg-[var(--color-bg)] flex gap-3">
              {onDeleteLog && (
                <button
                  onClick={() => {
                    onDeleteLog(selectedLog.id);
                    setSelectedLog(null);
                  }}
                  className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white font-bold rounded-xl transition-colors flex items-center justify-center"
                >
                  <Trash2 size={20} />
                </button>
              )}
              <button
                onClick={() => setSelectedLog(null)}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl transition-colors"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)] flex items-center gap-2">
            Hola, {user.name} <Dumbbell className="text-[var(--color-primary)]" size={28} />
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>

          {/* Level Progress Bar */}
          <div className="mt-2 w-48">
            <div className="flex justify-between text-[10px] text-gray-400 mb-1">
              <span className="uppercase font-bold text-[var(--color-primary)]">{user.fitnessLevel}</span>
              <span>{Math.floor(user.levelProgress || 0)}%</span>
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--color-primary)] transition-all duration-500"
                style={{ width: `${user.levelProgress || 0}%` }}
              ></div>
            </div>
          </div>
        </div>

      </div>

      {/* Nutrition Summary Widgets */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Goal Calories */}
        <div className="bg-[var(--color-card)] p-4 rounded-2xl border border-[var(--color-secondary)] shadow-lg flex flex-col items-center justify-center text-center relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="absolute right-0 top-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
            <Target size={40} />
          </div>
          <Target size={24} className="text-[var(--color-primary)] mb-2 relative z-10" />
          <span className="text-2xl font-black text-[var(--color-text)] relative z-10">{stats.goalCalories}</span>
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider relative z-10">Meta Diaria</span>
        </div>

        {/* Consumed Calories */}
        <div className="bg-[var(--color-card)] p-4 rounded-2xl border border-[var(--color-secondary)] shadow-lg flex flex-col items-center justify-center text-center relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="absolute right-0 top-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
            <Utensils size={40} />
          </div>
          <Utensils size={24} className="text-[var(--color-primary)] mb-2 relative z-10" />
          <span className="text-2xl font-black text-[var(--color-text)] relative z-10">{stats.consumedCalories}</span>
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider relative z-10">Consumidas</span>
        </div>

        {/* Burned Calories */}
        <div className="bg-[var(--color-card)] p-4 rounded-2xl border border-[var(--color-secondary)] shadow-lg flex flex-col items-center justify-center text-center relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="absolute right-0 top-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
            <Flame size={40} />
          </div>
          <Flame size={24} className="text-[var(--color-secondary)] mb-2 relative z-10" />
          <span className="text-2xl font-black text-[var(--color-text)] relative z-10">{stats.burnedCaloriesToday}</span>
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider relative z-10">Quemadas (Hoy)</span>
        </div>

        {/* Status */}
        <div className="bg-[var(--color-card)] p-4 rounded-2xl border border-[var(--color-secondary)] shadow-lg flex flex-col items-center justify-center text-center relative overflow-hidden group hover:scale-[1.02] transition-transform">
          <div className="absolute right-0 top-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity">
            <TrendingUp size={40} />
          </div>
          <TrendingUp size={24} className={`${stats.statusColor} mb-2 relative z-10`} />
          <span className={`text-2xl font-black ${stats.statusColor} relative z-10`}>{stats.netCalories}</span>
          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider relative z-10">Balance Neto</span>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[var(--color-card)] p-5 rounded-2xl border border-[var(--color-secondary)] shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 p-4 opacity-10">
            <Flame size={60} />
          </div>
          <p className="text-gray-400 text-xs font-bold uppercase mb-1">Calorías ({monthName})</p>
          <h3 className="text-3xl font-extrabold text-[var(--color-primary)]">{stats.totalCalories}</h3>
          <p className="text-xs text-gray-500 mt-2">Kcal quemadas</p>
        </div>
        <div className="bg-[var(--color-card)] p-5 rounded-2xl border border-[var(--color-secondary)] shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 p-4 opacity-10">
            <Activity size={60} />
          </div>
          <p className="text-gray-400 text-xs font-bold uppercase mb-1">Entrenamientos</p>
          <h3 className="text-3xl font-extrabold text-[var(--color-text)]">{stats.workoutsCount}</h3>
          <p className="text-xs text-gray-500 mt-2">Sesiones completadas</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Chart Section */}
        <div className="lg:col-span-2 bg-[var(--color-card)] p-6 rounded-2xl border border-[var(--color-secondary)] shadow-lg">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Activity size={18} className="text-[var(--color-primary)]" />
            Actividad Reciente (7 días)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  hide
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
                  itemStyle={{ color: 'var(--color-primary)' }}
                  cursor={{ fill: 'transparent' }}
                />
                <Bar
                  dataKey="cals"
                  fill="var(--color-primary)"
                  radius={[4, 4, 0, 0]}
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Calendar Mini View */}
        <div className="bg-[var(--color-card)] p-6 rounded-2xl border border-[var(--color-secondary)] shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <CalendarIcon size={18} className="text-[var(--color-primary)]" />
              Calendario
            </h3>
            <div className="flex gap-1">
              <button onClick={prevMonth} className="p-1 hover:bg-gray-700 rounded-full transition-colors">
                <ChevronLeft size={20} className="text-gray-400" />
              </button>
              <button onClick={nextMonth} className="p-1 hover:bg-gray-700 rounded-full transition-colors">
                <ChevronRight size={20} className="text-gray-400" />
              </button>
            </div>
          </div>

          <div className="text-center mb-4 font-bold text-[var(--color-text)] capitalize">
            {monthName}
          </div>

          <div className="grid grid-cols-7 gap-2 text-center mb-2">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
              <span key={d} className="text-xs font-bold text-gray-500">{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((d, i) => (
              <div
                key={i}
                onClick={() => d.log && setSelectedLog(d.log)}
                className={`
                        aspect-square rounded-lg flex items-center justify-center text-sm font-medium transition-all
                        ${!d.day ? 'invisible' : ''}
                        ${d.log
                    ? 'bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/30 cursor-pointer hover:scale-110'
                    : 'bg-[var(--color-bg)] text-gray-500 border border-gray-800'}
                    `}
              >
                {d.day}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Recent Logs List */}
      <div className="bg-[var(--color-card)] rounded-2xl border border-[var(--color-secondary)] overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h3 className="font-bold">Historial Reciente</h3>
        </div>
        <div>
          {logs.slice().reverse().slice(0, 5).map((log) => (
            <div
              key={log.id}
              className="p-4 border-b border-gray-800 flex justify-between items-center hover:bg-[var(--color-bg)] transition-colors group"
            >
              <div
                onClick={() => setSelectedLog(log)}
                className="flex-1 cursor-pointer"
              >
                <p className="font-bold text-sm text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">{log.name}</p>
                <p className="text-xs text-gray-500">{new Date(log.date).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-[var(--color-primary)] font-bold text-sm">{log.calories} kcal</span>
                  <p className="text-[10px] text-gray-400 uppercase">{log.type}</p>
                </div>
                {onDeleteLog && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteLog(log.id);
                    }}
                    className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="p-8 text-center text-gray-500 text-sm">No hay registros aún.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
