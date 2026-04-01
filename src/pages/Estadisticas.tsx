import React, { useMemo } from 'react';
import { useExams } from '../hooks/useExams';
import { useWeekBlocks } from '../hooks/useWeekBlocks';
import { useMaterias } from '../hooks/useMaterias';
import { formatDateES, cn, daysUntil } from '../lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const CustomTooltipLine = ({ active, payload }: { active?: boolean; payload?: { payload: { subject: string; fullDate: string; grade: number } }[] }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-elevated border border-border p-3 rounded-card shadow-xl">
        <p className="font-semibold text-text-primary text-sm mb-1">{d.subject}</p>
        <p className="text-xs text-text-muted">{d.fullDate}</p>
        <p className="text-amber font-bold text-lg mt-1">{d.grade}</p>
      </div>
    );
  }
  return null;
};

export const Estadisticas = () => {
  const { exams } = useExams();
  const { blocks } = useWeekBlocks();
  const { materias } = useMaterias();

  const statsData = useMemo(() => {
    // Top 4 stats
    const subjectsCursando = new Set(exams.filter(e => e.status === 'pendiente').map(e => e.subject)).size;
    const gradedExams = exams.filter(e => typeof e.grade === 'number');
    const promedio = gradedExams.length ? (gradedExams.reduce((a, b) => a + b.grade!, 0) / gradedExams.length).toFixed(2) : '-';
    
    const passed = exams.filter(e => e.status === 'aprobado').length;
    const failed = exams.filter(e => e.status === 'desaprobado').length;
    const tasaAprobacion = passed + failed > 0 ? Math.round((passed / (passed + failed)) * 100) : 0;
    
    const studyHoursPerWeek = blocks.filter(b => b.category === 'estudio').reduce((acc, b) => acc + (b.endHour - b.startHour), 0);
    const studyHoursMonth = Math.round(studyHoursPerWeek * 4.33);

    // Line Chart: Evolución de notas
    const lineChartData = exams
      .filter(e => typeof e.grade === 'number')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(e => ({
        name: formatDateES(e.date).split(',')[0], // just day and month
        subject: e.subject,
        grade: e.grade,
        fullDate: formatDateES(e.date),
      }));

    // Generate colors for subjects
    const subjects = Array.from(new Set(exams.map(e => e.subject)));
    const subjectColors = subjects.reduce((acc, sub, i) => {
      const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];
      acc[sub] = colors[i % colors.length];
      return acc;
    }, {} as Record<string, string>);

    // Bar Chart: Distribucion por materia
    const distData = subjects.map(sub => {
      const subGrades = exams.filter(e => e.subject === sub && typeof e.grade === 'number');
      const avg = subGrades.length ? subGrades.reduce((a, b) => a + b.grade!, 0) / subGrades.length : 0;
      return { subject: sub, avg };
    }).filter(d => d.avg > 0).sort((a, b) => b.avg - a.avg);

    // Bar Chart: Carga semanal historica (mocked from current week)
    const weekLoad = blocks.filter(b => b.category === 'estudio' || b.category === 'facultad').reduce((acc, b) => acc + (b.endHour - b.startHour), 0);
    const weeklyData = Array.from({ length: 8 }).map((_, i) => ({
      name: `Sem ${10 + i}`,
      hours: weekLoad > 0 ? Math.max(0, weekLoad + ((((i * 7) % 11) / 10) * 10 - 5)) : 0, // slight variation
    }));

    const proximasEntregas = materias
      .flatMap(m => m.entregas.filter(e => !e.done).map(e => ({ ...e, materiaName: m.name, materiaColor: m.color })))
      .sort((a,b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);

    return { subjectsCursando, promedio, tasaAprobacion, studyHoursMonth, lineChartData, subjectColors, distData, weeklyData, proximasEntregas };
  }, [exams, blocks, materias]);



  return (
    <div className="space-y-8 pb-20">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Estadísticas</h1>
        <p className="text-text-muted mt-1 text-[13px]">Resumen histórico de tu rendimiento</p>
      </header>
      
      {/* 4 Generic Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Materias cursando', val: statsData.subjectsCursando },
          { label: 'Promedio general', val: statsData.promedio },
          { label: 'Tasa de aprobación', val: statsData.tasaAprobacion + '%' },
          { label: 'Horas (mensual)', val: statsData.studyHoursMonth + 'h' },
        ].map(s => (
          <div key={s.label} className="bg-elevated border border-border p-4 rounded-card flex flex-col gap-1">
            <span className="text-xs text-text-muted uppercase font-medium">{s.label}</span>
            <span className="text-2xl font-bold text-text-primary mt-auto">{s.val}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Line Chart */}
        <div className="bg-elevated border border-border p-5 rounded-xl flex flex-col min-h-[300px]">
          <h3 className="text-sm font-semibold tracking-[-0.2px] text-text-primary mb-6">Evolución de notas</h3>
          {statsData.lineChartData.length < 2 ? (
            <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
              Cargá más notas para ver la evolución
            </div>
          ) : (
            <div className="flex-1 min-h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={statsData.lineChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                  <YAxis domain={['auto', 10]} stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip content={<CustomTooltipLine />} cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                  <Line type="monotone" dataKey="grade" stroke="var(--amber)" strokeWidth={3} dot={{ stroke: 'var(--amber)', strokeWidth: 2, r: 4, fill: 'var(--bg-elevated)' }} activeDot={{ r: 6, fill: 'var(--amber)' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Bar Chart Dist */}
        <div className="bg-elevated border border-border p-5 rounded-xl flex flex-col min-h-[300px]">
          <h3 className="text-sm font-semibold tracking-[-0.2px] text-text-primary mb-6">Distribución por materia</h3>
          {statsData.distData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
              Sin datos suficientes
            </div>
          ) : (
            <div className="flex-1 min-h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statsData.distData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" domain={[0, 10]} stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="subject" stroke="var(--text-primary)" fontSize={11} tickLine={false} axisLine={false} width={120} tickFormatter={(val) => val.length > 15 ? val.substring(0, 15) + '...' : val} />
                  <Tooltip cursor={{ fill: 'var(--border)', opacity: 0.2 }} content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return <div className="bg-elevated border border-border px-3 py-2 rounded shadow-md text-xs font-bold text-text-primary">{payload[0].payload.subject}: {(payload[0].value as number).toFixed(2)}</div>
                    } return null;
                  }} />
                  <Bar dataKey="avg" radius={[0, 4, 4, 0]} barSize={24}>
                    {statsData.distData.map((entry, index) => {
                      const c = entry.avg >= 7 ? 'var(--green)' : entry.avg >= 5 ? 'var(--amber)' : 'var(--red)';
                      return <Cell key={`cell-${index}`} fill={c} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Carga Semanal Histórica */}
        <div className="bg-elevated border border-border p-5 rounded-xl flex flex-col min-h-[300px]">
          <h3 className="text-sm font-semibold tracking-[-0.2px] text-text-primary mb-6">Carga Semanal Histórica</h3>
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsData.weeklyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                <Tooltip cursor={{ fill: 'var(--border)', opacity: 0.2 }} content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return <div className="bg-elevated border border-border px-2 py-1 rounded shadow-md text-xs font-bold text-text-primary">{(payload[0].value as number).toFixed(1)} hs</div>
                  } return null;
                }} />
                <Bar dataKey="hours" radius={[3, 3, 0, 0]} barSize={28}>
                  {statsData.weeklyData.map((entry, index) => {
                    const c = entry.hours <= 35 ? 'var(--green)' : entry.hours <= 40 ? 'var(--amber)' : 'var(--red)';
                    return <Cell key={`cell-${index}`} fill={c} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Entregas Próximas */}
        <div className="bg-elevated border border-border p-5 rounded-xl flex flex-col min-h-[300px]">
          <h3 className="text-sm font-semibold tracking-[-0.2px] text-text-primary mb-6">Entregas próximas</h3>
          <div className="flex flex-col gap-3 flex-1 overflow-y-auto no-scrollbar">
            {statsData.proximasEntregas.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
                No hay entregas pendientes
              </div>
            ) : (
              statsData.proximasEntregas.map((ent, idx) => {
                const d = daysUntil(ent.dueDate);
                return (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-[10px] bg-base border border-border/50 hover:border-border transition-colors">
                    <div className="flex items-start gap-3 min-w-0 pr-2">
                      <div className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: ent.materiaColor }} />
                      <div className="flex flex-col min-w-0">
                        <span className="text-[13px] font-medium text-text-primary truncate">{ent.title}</span>
                        <span className="text-[11px] text-text-muted truncate">{ent.materiaName}</span>
                      </div>
                    </div>
                    <span className={cn("px-2 py-0.5 rounded-[6px] text-xs font-medium shrink-0", 
                      d < 0 ? "bg-red/10 text-red border border-red/20" :
                      d < 3 ? "bg-red/10 text-red border border-red/20" :
                      d < 7 ? "bg-amber/10 text-amber border border-amber/20" :
                      "bg-green/10 text-green border border-green/20"
                    )}>
                      {d < 0 ? 'Vencido' : `${d}d`}
                    </span>
                  </div>
                );
              })
            )}
          </div>
          {statsData.proximasEntregas.length > 0 && (
            <Link to="/materias" className="mt-4 pt-4 border-t border-border flex items-center justify-center gap-1.5 text-xs text-amber font-medium hover:underline">
              Ver todas en Materias <ArrowRight size={12} />
            </Link>
          )}
        </div>

      </div>
    </div>
  );
};
