import React from 'react';
import { Folder, Video, Link as LinkIcon, FileText, PlayCircle, ExternalLink } from 'lucide-react';
import { Materia, Recurso } from '../../hooks/useMaterias';

const getIcon = (type: Recurso['type']) => {
  switch (type) {
    case 'drive': return <Folder size={14} />;
    case 'youtube': return <PlayCircle size={14} />;
    case 'notion': return <FileText size={14} />;
    default: return <LinkIcon size={14} />;
  }
};

export const QuickLinks: React.FC<{ materias: Materia[] }> = ({ materias }) => {
  // Aplanamos recursos y les inyectamos el color/nombre de su materia
  const allResources = materias.flatMap(m => 
    m.recursos.map(r => ({ ...r, materiaName: m.name, materiaColor: m.color }))
  ).slice(0, 6);

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber/10 border border-amber/20">
            <ExternalLink size={16} className="text-amber" />
          </div>
          <h2 className="text-sm font-semibold tracking-tight text-text-primary">Hub de Cátedra</h2>
        </div>
      </div>

      {allResources.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 px-4 rounded-xl border border-dashed border-border/60 bg-base/30 group hover:border-amber/40 transition-colors">
          <div className="p-3 rounded-full bg-elevated text-text-faint mb-3 group-hover:text-amber transition-colors">
            <LinkIcon size={20} />
          </div>
          <p className="text-xs font-medium text-text-secondary text-center max-w-[200px]">
             Aquí aparecerán los links de Drive o Youtube que guardes en tus materias.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {allResources.map((res) => (
            <a
              key={res.id}
              href={res.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl bg-base border border-border/50 hover:border-amber/30 hover:bg-elevated transition-all group"
            >
              <div className="p-2 rounded-lg bg-surface text-text-muted group-hover:text-amber transition-colors">
                {getIcon(res.type)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-text-primary truncate">{res.label}</p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span 
                    className="w-1.5 h-1.5 rounded-full" 
                    style={{ backgroundColor: res.materiaColor }} 
                  />
                  <span className="text-[10px] text-text-faint truncate">{res.materiaName}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
