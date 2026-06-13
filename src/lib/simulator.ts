import type { BracketNodeData } from '../components/Bracket';
import type { GroupPrediction, StandingGroup, Team } from '../types';

export function generateBracketNodes(
  groupPredictions: GroupPrediction[],
  standings: StandingGroup[],
  userBracketPreds: Record<string, string>
): Record<string, BracketNodeData> {
  const nodes: Record<string, BracketNodeData> = {};
  
  // Find team by code
  const getTeam = (code: string | null): Team | null => {
    if (!code) return null;
    for (const g of standings) {
      for (const s of g.standings) {
        if (s.team.code === code || s.team.code.toLowerCase() === code.toLowerCase()) {
          return s.team;
        }
      }
    }
    return null;
  };

  // Collect all advancing teams from predictions
  let advancing: Team[] = [];
  const thirds: Team[] = [];

  // Assuming 12 groups, we need 24 (1st and 2nd) + 8 (best 3rds) = 32 teams for R32
  // We'll collect them in a predictable order for now, since WC2026 format is complex
  // and user is providing manual inputs.

  // Sort groups alphabetically (Grupo A, Grupo B...)
  const sortedPreds = [...groupPredictions].sort((a, b) => a.group_name.localeCompare(b.group_name));

  sortedPreds.forEach(p => {
    const t1 = getTeam(p.first_place_code);
    const t2 = getTeam(p.second_place_code);
    const t3 = getTeam(p.third_place_code);
    if (t1) advancing.push(t1);
    if (t2) advancing.push(t2);
    if (t3) thirds.push(t3);
  });

  // Take top 8 thirds that were provided
  advancing = advancing.concat(thirds.slice(0, 8));

  // Fill with dummy teams if less than 32
  while (advancing.length < 32) {
    advancing.push({ id: Math.random(), name: 'Por definir', code: '', logo: '' });
  }

  // R32 nodes
  for (let i = 0; i < 16; i++) {
    const id = `R32_${i + 1}`;
    const t1 = advancing[i * 2];
    const t2 = advancing[i * 2 + 1];
    const winner = userBracketPreds[id] || null;
    nodes[id] = {
      id,
      homeTeamCode: t1?.code || null,
      awayTeamCode: t2?.code || null,
      homeTeamName: t1?.name || null,
      awayTeamName: t2?.name || null,
      homeScore: null,
      awayScore: null,
      winnerCode: winner
    };
  }

  // R16
  for (let i = 0; i < 8; i++) {
    const id = `R16_${i + 1}`;
    const p1 = nodes[`R32_${i * 2 + 1}`];
    const p2 = nodes[`R32_${i * 2 + 2}`];
    
    const t1 = advancing.find(t => t.code && t.code === p1?.winnerCode);
    const t2 = advancing.find(t => t.code && t.code === p2?.winnerCode);

    nodes[id] = {
      id,
      homeTeamCode: t1?.code || null,
      awayTeamCode: t2?.code || null,
      homeTeamName: t1?.name || null,
      awayTeamName: t2?.name || null,
      homeScore: null,
      awayScore: null,
      winnerCode: userBracketPreds[id] || null
    };
  }

  // QF
  for (let i = 0; i < 4; i++) {
    const id = `QF_${i + 1}`;
    const p1 = nodes[`R16_${i * 2 + 1}`];
    const p2 = nodes[`R16_${i * 2 + 2}`];
    const t1 = advancing.find(t => t.code && t.code === p1?.winnerCode);
    const t2 = advancing.find(t => t.code && t.code === p2?.winnerCode);
    nodes[id] = { id, homeTeamCode: t1?.code || null, awayTeamCode: t2?.code || null, homeTeamName: t1?.name || null, awayTeamName: t2?.name || null, homeScore: null, awayScore: null, winnerCode: userBracketPreds[id] || null };
  }

  // SF
  for (let i = 0; i < 2; i++) {
    const id = `SF_${i + 1}`;
    const p1 = nodes[`QF_${i * 2 + 1}`];
    const p2 = nodes[`QF_${i * 2 + 2}`];
    const t1 = advancing.find(t => t.code && t.code === p1?.winnerCode);
    const t2 = advancing.find(t => t.code && t.code === p2?.winnerCode);
    nodes[id] = { id, homeTeamCode: t1?.code || null, awayTeamCode: t2?.code || null, homeTeamName: t1?.name || null, awayTeamName: t2?.name || null, homeScore: null, awayScore: null, winnerCode: userBracketPreds[id] || null };
  }

  // Final
  const pf1 = nodes[`SF_1`];
  const pf2 = nodes[`SF_2`];
  const tf1 = advancing.find(t => t.code && t.code === pf1?.winnerCode);
  const tf2 = advancing.find(t => t.code && t.code === pf2?.winnerCode);
  nodes['F_1'] = { id: 'F_1', homeTeamCode: tf1?.code || null, awayTeamCode: tf2?.code || null, homeTeamName: tf1?.name || null, awayTeamName: tf2?.name || null, homeScore: null, awayScore: null, winnerCode: userBracketPreds['F_1'] || null };

  return nodes;
}
