import React, { useState } from 'react';
import { GDD_SECTIONS } from '../data/gddContent';
import { calculateSpeed, calculateObstacleSpacing, calculateReactionTimeMs } from '../game/difficulty';
import { BookOpen, Download, FileText, Gauge, Hash, Play, Search, Sparkles } from 'lucide-react';

interface GddDocumentProps {
  onPlayGame: () => void;
  onInspectCharacters: () => void;
}

// Helper to cleanly format inline markdown bold and code
function formatInlineText(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\$[^$]+\$)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="text-white font-bold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={i} className="text-cyan-300 not-italic font-semibold">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="bg-slate-950 px-1.5 py-0.5 rounded text-cyan-300 font-mono text-xs border border-slate-800">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('$') && part.endsWith('$')) {
      return (
        <span key={i} className="font-mono text-amber-300 font-semibold px-1">
          {part.slice(1, -1)}
        </span>
      );
    }
    return part;
  });
}

export const GddDocument: React.FC<GddDocumentProps> = ({ onPlayGame, onInspectCharacters }) => {
  const [activeSectionId, setActiveSectionId] = useState(GDD_SECTIONS[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [simDistance, setSimDistance] = useState(1200); // meters slider

  const filteredSections = GDD_SECTIONS.filter((sec) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      sec.title.toLowerCase().includes(q) ||
      sec.subtitle.toLowerCase().includes(q) ||
      sec.contentMarkdown.toLowerCase().includes(q)
    );
  });

  const activeSection =
    filteredSections.find((s) => s.id === activeSectionId) || filteredSections[0] || GDD_SECTIONS[0];

  // Dynamic calculations for the difficulty curve widget
  const speed = calculateSpeed(simDistance);
  const speedKmh = (speed * 3.6).toFixed(1);
  const spacing = calculateObstacleSpacing(simDistance);
  const reactionTime = calculateReactionTimeMs(spacing, speed).toFixed(0);

  // Handle Export / Download GDD as Markdown file
  function handleExportGdd() {
    const fullMarkdown = `# Urban Dash 3D - Complete Game Design Document
Platform: Android Mobile (Mid-range 60 FPS Target)
Art Style: Stylized Low-Poly (Vertex lit, Flat Shading)
Engine: Unity / Godot Compatible

---

${GDD_SECTIONS.map((sec) => `## ${sec.title}\n*${sec.subtitle}*\n\n${sec.contentMarkdown}\n\n---\n`).join('\n')}
`;

    const blob = new Blob([fullMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Urban_Dash_3D_Game_Design_Document.md';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-7xl mx-auto p-4 md:p-6 text-slate-100">
      {/* Sidebar: Table of Contents & Interactive Curve Widget */}
      <div className="w-full lg:w-[340px] flex flex-col gap-5 shrink-0">
        {/* Search & Actions Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>GDD Navigation</span>
            </div>
            <button
              onClick={handleExportGdd}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold border border-cyan-500/40 transition"
              title="Download entire GDD as Markdown file"
            >
              <Download className="w-3.5 h-3.5" />
              Export .MD
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search design specs, stats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Table of Contents list */}
          <div className="flex flex-col gap-1.5 mt-1 max-h-[380px] overflow-y-auto pr-1">
            {filteredSections.map((sec) => {
              const isSelected = activeSection.id === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSectionId(sec.id)}
                  className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-950/40 text-white shadow-md shadow-cyan-950/20'
                      : 'border-transparent bg-slate-800/40 hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  <span className="text-xs font-bold leading-snug">{sec.title}</span>
                  <span className="text-[10px] text-slate-400 truncate max-w-[280px]">
                    {sec.subtitle}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Difficulty Curve Calculator Widget */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <Gauge className="w-4 h-4" />
            <span>Live Difficulty Curve Simulator</span>
          </div>

          <div className="text-xs text-slate-300">
            <div className="flex items-center justify-between mb-1.5">
              <span>Run Distance:</span>
              <span className="font-mono font-bold text-amber-300">{simDistance} meters</span>
            </div>
            <input
              type="range"
              min="0"
              max="5000"
              step="50"
              value={simDistance}
              onChange={(e) => setSimDistance(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs mt-1">
            <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] block uppercase font-bold">Speed v(d)</span>
              <span className="font-mono font-bold text-cyan-300">
                {speed.toFixed(1)} m/s ({speedKmh} km/h)
              </span>
            </div>
            <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
              <span className="text-slate-400 text-[10px] block uppercase font-bold">Obstacle Spacing</span>
              <span className="font-mono font-bold text-amber-300">{spacing.toFixed(1)} m</span>
            </div>
            <div className="bg-slate-950/80 p-2 rounded-lg border border-slate-800 col-span-2 flex items-center justify-between">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Reaction Window</span>
              <span className="font-mono font-bold text-emerald-400">{reactionTime} ms (Playable)</span>
            </div>
          </div>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onPlayGame}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/20 transition active:scale-[0.98]"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            Play 3D Prototype Now
          </button>
          <button
            onClick={onInspectCharacters}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase tracking-wider border border-slate-700 transition"
          >
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Inspect 10 Characters 3D
          </button>
        </div>
      </div>

      {/* Main Document Body */}
      <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-2xl overflow-hidden flex flex-col">
        {/* Section Header */}
        <div className="border-b border-slate-800/80 pb-5 mb-6">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest mb-1.5">
            <Hash className="w-3.5 h-3.5" />
            <span>Document Section</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            {activeSection.title}
          </h1>
          <p className="text-sm text-slate-400 font-medium mt-1">{activeSection.subtitle}</p>
        </div>

        {/* Formatted Markdown Content */}
        <div className="text-slate-300 text-sm leading-relaxed space-y-4">
          {activeSection.contentMarkdown.split('\n\n').map((block, idx) => {
            const trimmed = block.trim();

            if (trimmed.startsWith('### ')) {
              return (
                <h3 key={idx} className="text-lg font-bold text-white tracking-tight mt-6 mb-2 border-b border-slate-800/80 pb-1">
                  {formatInlineText(trimmed.replace('### ', ''))}
                </h3>
              );
            }
            if (trimmed.startsWith('#### ')) {
              return (
                <h4 key={idx} className="text-base font-bold text-cyan-300 mt-4 mb-1">
                  {formatInlineText(trimmed.replace('#### ', ''))}
                </h4>
              );
            }
            if (trimmed.startsWith('```')) {
              const code = trimmed.replace(/```[a-z]*\n?/g, '').trim();
              return (
                <pre
                  key={idx}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-cyan-200 overflow-x-auto my-3"
                >
                  {code}
                </pre>
              );
            }
            if (trimmed.startsWith('|')) {
              // Markdown Table renderer
              const rows = trimmed.split('\n');
              const headers = rows[0].split('|').filter(Boolean).map((h) => h.trim());
              const dataRows = rows.slice(2);

              return (
                <div key={idx} className="overflow-x-auto my-4 border border-slate-800 rounded-xl shadow-lg">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-950 text-cyan-300 font-bold border-b border-slate-800">
                      <tr>
                        {headers.map((h, i) => (
                          <th key={i} className="p-3">
                            {formatInlineText(h)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 bg-slate-900/60 font-mono text-[11px]">
                      {dataRows.map((r, ri) => {
                        const cols = r.split('|').filter(Boolean).map((c) => c.trim());
                        return (
                          <tr key={ri} className="hover:bg-slate-800/40">
                            {cols.map((col, ci) => (
                              <td key={ci} className="p-3 text-slate-300">
                                {formatInlineText(col)}
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            }
            if (trimmed.startsWith('- ') || trimmed.startsWith('1. ') || trimmed.startsWith('2. ') || trimmed.startsWith('3. ') || trimmed.startsWith('4. ')) {
              const items = trimmed.split('\n');
              return (
                <ul key={idx} className="space-y-1.5 my-2 list-none pl-1">
                  {items.map((it, itemIdx) => {
                    const cleanItem = it.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '');
                    return (
                      <li key={itemIdx} className="flex items-start gap-2 text-slate-300">
                        <span className="text-cyan-400 font-bold shrink-0 mt-0.5">•</span>
                        <span>{formatInlineText(cleanItem)}</span>
                      </li>
                    );
                  })}
                </ul>
              );
            }
            if (trimmed === '---') {
              return <hr key={idx} className="border-slate-800 my-4" />;
            }
            return (
              <p key={idx} className="leading-relaxed">
                {formatInlineText(trimmed)}
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
};
