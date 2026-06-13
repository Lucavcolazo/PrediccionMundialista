import { FlagImage } from './FlagImage';
import { getIsoCode } from '../lib/api-football';

export interface BracketNodeData {
  id: string; // e.g., "R32_1"
  homeTeamCode: string | null;
  awayTeamCode: string | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
  homeScore: number | null;
  awayScore: number | null;
  winnerCode: string | null; // which one advanced
}

interface BracketProps {
  nodes: Record<string, BracketNodeData>;
  onPredict: (nodeId: string, winnerCode: string) => void;
}

function TeamRow({
  teamCode,
  teamName,
  score,
  isWinner,
  onClick,
  interactive
}: {
  teamCode: string | null;
  teamName: string | null;
  score: number | null;
  isWinner: boolean;
  onClick: () => void;
  interactive: boolean;
}) {
  const isPlaceholder = !teamCode;
  
  return (
    <div
      onClick={interactive && !isPlaceholder ? onClick : undefined}
      className={`flex items-center justify-between p-2 transition-colors ${
        interactive && !isPlaceholder ? 'cursor-pointer hover:bg-[var(--bg-border)]' : ''
      }`}
      style={{
        background: isWinner ? 'var(--accent-gold-dim)' : 'transparent',
        borderBottom: '1px solid var(--bg-border)',
      }}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        {isPlaceholder ? (
          <div className="w-5 h-5 rounded-sm bg-[var(--bg-border)] shrink-0" />
        ) : (
          <FlagImage code={getIsoCode(teamCode)} teamName={teamName || ''} size="sm" />
        )}
        <span className={`text-[12px] truncate ${isWinner ? 'text-[var(--accent-gold)] font-bold' : 'text-[var(--text-primary)] font-medium'}`}>
          {isPlaceholder ? 'Por definir' : teamName}
        </span>
      </div>
      {score !== null && (
        <span className="font-mono-score text-xs font-bold pl-2">{score}</span>
      )}
    </div>
  );
}

function MatchNode({ node, onPredict }: { node: BracketNodeData; onPredict: (w: string) => void }) {
  const interactive = Boolean(node.homeTeamCode && node.awayTeamCode);
  
  return (
    <div className="w-[180px] bg-[var(--bg-card)] border border-[var(--bg-border)] rounded-lg overflow-hidden shrink-0 shadow-sm relative z-10">
      <TeamRow
        teamCode={node.homeTeamCode}
        teamName={node.homeTeamName}
        score={node.homeScore}
        isWinner={node.winnerCode === node.homeTeamCode && node.homeTeamCode !== null}
        interactive={interactive}
        onClick={() => node.homeTeamCode && onPredict(node.homeTeamCode)}
      />
      <div style={{ height: '1px', background: 'var(--bg-border)', width: '100%' }} />
      <TeamRow
        teamCode={node.awayTeamCode}
        teamName={node.awayTeamName}
        score={node.awayScore}
        isWinner={node.winnerCode === node.awayTeamCode && node.awayTeamCode !== null}
        interactive={interactive}
        onClick={() => node.awayTeamCode && onPredict(node.awayTeamCode)}
      />
    </div>
  );
}

export function Bracket({ nodes, onPredict }: BracketProps) {
  // We'll hardcode the structural layout of a 32-team bracket.
  // Due to its massive size, we split it into LEFT and RIGHT sides merging in the center.

  const generateNodes = (roundPrefix: string, count: number, startIdx = 1) => {
    return Array.from({ length: count }).map((_, i) => {
      const id = `${roundPrefix}_${startIdx + i}`;
      return nodes[id] || { id, homeTeamCode: null, awayTeamCode: null, homeTeamName: null, awayTeamName: null, homeScore: null, awayScore: null, winnerCode: null };
    });
  };

  const leftR32 = generateNodes('R32', 8, 1);
  const leftR16 = generateNodes('R16', 4, 1);
  const leftQF = generateNodes('QF', 2, 1);
  const leftSF = generateNodes('SF', 1, 1);

  const rightR32 = generateNodes('R32', 8, 9);
  const rightR16 = generateNodes('R16', 4, 5);
  const rightQF = generateNodes('QF', 2, 3);
  const rightSF = generateNodes('SF', 1, 2);

  const finalNode = generateNodes('F', 1, 1)[0];

  return (
    <div className="w-full overflow-x-auto pb-8 pt-4">
      <div className="min-w-[1200px] flex justify-between items-center px-4 gap-8">
        
        {/* LEFT SIDE */}
        <div className="flex gap-8">
          <div className="flex flex-col gap-4 justify-around">
            {leftR32.map(n => <MatchNode key={n.id} node={n} onPredict={w => onPredict(n.id, w)} />)}
          </div>
          <div className="flex flex-col gap-12 justify-around">
            {leftR16.map(n => <MatchNode key={n.id} node={n} onPredict={w => onPredict(n.id, w)} />)}
          </div>
          <div className="flex flex-col gap-24 justify-around">
            {leftQF.map(n => <MatchNode key={n.id} node={n} onPredict={w => onPredict(n.id, w)} />)}
          </div>
          <div className="flex flex-col gap-0 justify-around">
            {leftSF.map(n => <MatchNode key={n.id} node={n} onPredict={w => onPredict(n.id, w)} />)}
          </div>
        </div>

        {/* CENTER FINAL */}
        <div className="flex flex-col items-center justify-center gap-4 shrink-0 px-4">
          <div className="text-sm font-black font-bebas tracking-widest text-[var(--accent-gold)]">FINAL</div>
          <MatchNode node={finalNode} onPredict={w => onPredict(finalNode.id, w)} />
          {finalNode.winnerCode && (
            <div className="mt-4 p-4 rounded-xl bg-[var(--accent-gold-dim)] border border-[rgba(201,168,76,0.3)] flex flex-col items-center animate-fade-in">
              <span className="text-[10px] uppercase tracking-widest text-[var(--accent-gold)] mb-2 font-bold">CAMPEÓN MUNDIAL</span>
              <FlagImage code={getIsoCode(finalNode.winnerCode)} teamName={finalNode.winnerCode} size="xl" />
            </div>
          )}
        </div>

        {/* RIGHT SIDE */}
        <div className="flex gap-8 flex-row-reverse">
          <div className="flex flex-col gap-4 justify-around">
            {rightR32.map(n => <MatchNode key={n.id} node={n} onPredict={w => onPredict(n.id, w)} />)}
          </div>
          <div className="flex flex-col gap-12 justify-around">
            {rightR16.map(n => <MatchNode key={n.id} node={n} onPredict={w => onPredict(n.id, w)} />)}
          </div>
          <div className="flex flex-col gap-24 justify-around">
            {rightQF.map(n => <MatchNode key={n.id} node={n} onPredict={w => onPredict(n.id, w)} />)}
          </div>
          <div className="flex flex-col gap-0 justify-around">
            {rightSF.map(n => <MatchNode key={n.id} node={n} onPredict={w => onPredict(n.id, w)} />)}
          </div>
        </div>

      </div>
    </div>
  );
}
