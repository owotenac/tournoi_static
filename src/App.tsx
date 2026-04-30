import React, { useState, useEffect, useCallback } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Equipe {
  id: string;
  nom: string;
}

interface EquipeStat {
  id: string;
  nom: string;
  points: number;
  joues: number;
  gagnes: number;
  nuls: number;
  perdus: number;
  buts_pour: number;
  buts_contre: number;
}

function calcClassement(equipes: Equipe[], matchs: Match[]): EquipeStat[] {
  const stats: Record<string, EquipeStat> = {};
  for (const e of equipes) {
    stats[e.id] = { id: e.id, nom: e.nom, points: 0, joues: 0, gagnes: 0, nuls: 0, perdus: 0, buts_pour: 0, buts_contre: 0 };
  }
  for (const m of matchs) {
    if (m.score_domicile === null || m.score_exterieur === null) continue;
    const dom = stats[m.equipe_domicile];
    const ext = stats[m.equipe_exterieur];
    if (!dom || !ext) continue;
    dom.joues++; ext.joues++;
    dom.buts_pour += m.score_domicile; dom.buts_contre += m.score_exterieur;
    ext.buts_pour += m.score_exterieur; ext.buts_contre += m.score_domicile;
    if (m.score_domicile > m.score_exterieur) {
      dom.gagnes++; dom.points += 3; ext.perdus++;
    } else if (m.score_domicile < m.score_exterieur) {
      ext.gagnes++; ext.points += 3; dom.perdus++;
    } else {
      dom.nuls++; dom.points++; ext.nuls++; ext.points++;
    }
  }
  return Object.values(stats).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const diffA = a.buts_pour - a.buts_contre;
    const diffB = b.buts_pour - b.buts_contre;
    if (diffB !== diffA) return diffB - diffA;
    return b.buts_pour - a.buts_pour;
  });
}

interface Match {
  id: string;
  heure: string;
  terrain?: string;
  equipe_domicile: string;
  equipe_exterieur: string;
  score_domicile: number | null;
  score_exterieur: number | null;
  repos?: string | null;
}

interface SectionData {
  section: string;
  jour: string;
  terrain: string;
  equipes: Equipe[];
  matchs: Match[];
}

// ─── Config ──────────────────────────────────────────────────────────────────

const JOURS = [
  {
    label: 'Vendredi 1 Mai',
    emoji: '⚽',
    sections: [
      { key: 'vendredi_u11f', label: 'U11F' },
      { key: 'vendredi_u13f', label: 'U13F' },
      { key: 'vendredi_u15f', label: 'U15F' },
    ],
  },
  // {
  //   label: 'Samedi',
  //   emoji: '⚽',
  //   sections: [
  //     { key: 'samedi_u7', label: 'U7' },
  //     { key: 'samedi_u8', label: 'U8' },
  //   ],
  // },
  // {
  //   label: 'Dimanche',
  //   emoji: '⚽',
  //   sections: [
  //     { key: 'dimanche_u9', label: 'U9' },
  //   ],
  // },
];

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [jourIdx, setJourIdx] = useState(0);
  const [sectionIdx, setSectionIdx] = useState(0);
  const [tab, setTab] = useState<'planning' | 'classement'>('planning');
  const [data, setData] = useState<SectionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const jour = JOURS[jourIdx];
  const section = jour.sections[sectionIdx];

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/data/${section.key}.json?t=${Date.now()}`);
      if (!res.ok) throw new Error('Fichier introuvable');
      const json: SectionData = await res.json();
      setData(json);
    } catch (e) {
      setError('Impossible de charger les données');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [section.key]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60_000); // refresh every 60s
    return () => clearInterval(interval);
  }, [fetchData]);

  // Reset section index when jour changes
  const handleJourChange = (idx: number) => {
    setJourIdx(idx);
    setSectionIdx(0);
  };

  return (
    <div style={styles.root}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <span style={styles.logo}>🏆</span>
          <h1 style={styles.title}>Tournoi AS CANET</h1>
          <button style={styles.refreshBtn} onClick={fetchData} title="Actualiser">
            🔄
          </button>
        </div>

        {/* Jour selector */}
        <div style={styles.jourRow}>
          {JOURS.map((j, i) => (
            <button
              key={j.label}
              onClick={() => handleJourChange(i)}
              style={{
                ...styles.jourBtn,
                ...(i === jourIdx ? styles.jourBtnActive : {}),
              }}
            >
              {j.label}
            </button>
          ))}
        </div>

        {/* Section selector */}
        <div style={styles.sectionRow}>
          {jour.sections.map((s, i) => (
            <button
              key={s.key}
              onClick={() => setSectionIdx(i)}
              style={{
                ...styles.sectionBtn,
                ...(i === sectionIdx ? styles.sectionBtnActive : {}),
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div style={styles.tabBar}>
        <button
          onClick={() => setTab('planning')}
          style={{ ...styles.tabBtn, ...(tab === 'planning' ? styles.tabBtnActive : {}) }}
        >
          📅 Planning
        </button>
        <button
          onClick={() => setTab('classement')}
          style={{ ...styles.tabBtn, ...(tab === 'classement' ? styles.tabBtnActive : {}) }}
        >
          🏅 Classement
        </button>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {loading && (
          <div style={styles.center}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>Chargement…</p>
          </div>
        )}
        {error && !loading && (
          <div style={styles.center}>
            <p style={styles.errorText}>{error}</p>
            <button style={styles.retryBtn} onClick={fetchData}>Réessayer</button>
          </div>
        )}
        {!loading && !error && data && (
          <>
            {tab === 'planning' ? (
              <PlanningScreen data={data} />
            ) : (
              <ClassementScreen data={data} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Planning ────────────────────────────────────────────────────────────────

function PlanningScreen({ data }: { data: SectionData }) {
  const equipeMap = Object.fromEntries(data.equipes.map(e => [e.id, e.nom]));
  const byHeure = data.matchs.reduce<Record<string, Match[]>>((acc, m) => {
    if (!acc[m.heure]) acc[m.heure] = [];
    acc[m.heure].push(m);
    return acc;
  }, {});
  const heures = Object.keys(byHeure).sort();

  return (
    <div>
      {heures.map(heure => (
        <div key={heure}>
          <div style={styles.heureLabel}>{heure}</div>
          {byHeure[heure].map(match => (
            <MatchCard key={match.id} match={match} equipeMap={equipeMap} defaultTerrain={data.terrain} />
          ))}
        </div>
      ))}
    </div>
  );
}

function MatchCard({ match, equipeMap, defaultTerrain }: { match: Match; equipeMap: Record<string, string>; defaultTerrain: string }) {
  const dom = equipeMap[match.equipe_domicile] ?? match.equipe_domicile;
  const ext = equipeMap[match.equipe_exterieur] ?? match.equipe_exterieur;
  const terrain = match.terrain ?? defaultTerrain;
  const hasScore = match.score_domicile !== null && match.score_exterieur !== null;
  const reposNom = match.repos ? (equipeMap[match.repos] ?? match.repos) : null;

  return (
    <div style={styles.matchCard}>
      <div style={styles.matchTerrain}>📍 {terrain}</div>
      <div style={styles.matchRow}>
        <span style={styles.matchTeam}>{dom}</span>
        <div style={styles.scoreBox}>
          {hasScore ? (
            <span style={styles.score}>
              {match.score_domicile ?? '–'} : {match.score_exterieur ?? '–'}
            </span>
          ) : (
            <span style={styles.scoreVs}>VS</span>
          )}
        </div>
        <span style={{ ...styles.matchTeam, textAlign: 'right' }}>{ext}</span>
      </div>
      {reposNom && (
        <div style={styles.reposBadge}>😴 Repos : {reposNom}</div>
      )}
    </div>
  );
}

// ─── Classement ──────────────────────────────────────────────────────────────

function ClassementScreen({ data }: { data: SectionData }) {
  const sorted = calcClassement(data.equipes, data.matchs);

  return (
    <div>
      <div style={styles.classementHeader}>
        <span style={{ flex: 0.4, textAlign: 'center' }}>#</span>
        <span style={{ flex: 3 }}>Équipe</span>
        <span style={{ flex: 0.6, textAlign: 'center' }}>J</span>
        <span style={{ flex: 0.6, textAlign: 'center' }}>G</span>
        <span style={{ flex: 0.6, textAlign: 'center' }}>N</span>
        <span style={{ flex: 0.6, textAlign: 'center' }}>P</span>
        <span style={{ flex: 0.8, textAlign: 'center' }}>Diff</span>
        <span style={{ flex: 0.8, textAlign: 'center', fontWeight: 700 }}>Pts</span>
      </div>
      {sorted.map((equipe, idx) => (
        <ClassementRow key={equipe.id} equipe={equipe} rank={idx + 1} />
      ))}
      <p style={styles.legendeText}>Critères : Points → Différence de buts → Buts marqués</p>
    </div>
  );
}

function ClassementRow({ equipe, rank }: { equipe: EquipeStat; rank: number }) {
  const diff = equipe.buts_pour - equipe.buts_contre;
  const isTop = rank === 1;

  return (
    <div style={{
      ...styles.classementRow,
      ...(isTop ? styles.classementRowTop : {}),
      ...(rank % 2 === 0 ? styles.classementRowEven : {}),
    }}>
      {/* <span style={{ flex: 0.4, textAlign: 'center', fontWeight: 700, color: isTop ? C.green : C.gray300 }}>
        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
      </span> */}
      <span style={{ flex: 3, fontWeight: isTop ? 700 : 400, fontSize: 13, color: C.textDark }}>{equipe.nom}</span>
      <span style={{ flex: 0.6, textAlign: 'center', color: C.gray500, fontSize: 13 }}>{equipe.joues}</span>
      <span style={{ flex: 0.6, textAlign: 'center', color: C.green, fontSize: 13 }}>{equipe.gagnes}</span>
      <span style={{ flex: 0.6, textAlign: 'center', color: C.gray500, fontSize: 13 }}>{equipe.nuls}</span>
      <span style={{ flex: 0.6, textAlign: 'center', color: C.red, fontSize: 13 }}>{equipe.perdus}</span>
      <span style={{ flex: 0.8, textAlign: 'center', fontSize: 13, color: diff > 0 ? C.green : diff < 0 ? C.red : C.gray500 }}>
        {diff > 0 ? `+${diff}` : diff}
      </span>
      <span style={{ flex: 0.8, textAlign: 'center', fontWeight: 700, fontSize: 15, color: C.green }}>
        {equipe.points}
      </span>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const C = {
  green: '#1a7a3c',
  greenDark: '#145f2e',
  greenLight: '#22a050',
  greenFaint: 'rgba(26,122,60,0.12)',
  greenBorder: 'rgba(26,122,60,0.3)',
  white: '#ffffff',
  offWhite: '#f4f8f5',
  gray100: '#e8efe9',
  gray300: '#b0c4b5',
  gray500: '#6b8f73',
  gray700: '#3a5c41',
  textDark: '#1a2e1d',
  textMid: '#4a6b50',
  red: '#c0392b',
};

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    background: C.offWhite,
    color: C.textDark,
    fontFamily: "'Barlow', 'Segoe UI', sans-serif",
    maxWidth: 480,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    background: C.green,
    padding: '16px 16px 0 16px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 4px 12px rgba(26,122,60,0.3)',
  },
  headerTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  logo: { fontSize: 24 },
  title: {
    margin: 0,
    fontSize: 22,
    fontWeight: 800,
    letterSpacing: '-0.5px',
    flex: 1,
    color: C.white,
  },
  refreshBtn: {
    background: 'transparent',
    border: 'none',
    fontSize: 20,
    cursor: 'pointer',
    padding: 4,
  },
  jourRow: { display: 'flex', gap: 6, marginBottom: 8 },
  jourBtn: {
    flex: 1,
    padding: '6px 0',
    background: 'rgba(255,255,255,0.15)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 8,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  jourBtnActive: {
    background: C.white,
    borderColor: C.white,
    color: C.green,
  },
  sectionRow: { display: 'flex', gap: 6, paddingBottom: 12 },
  sectionBtn: {
    flex: 1,
    padding: '5px 0',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 6,
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  sectionBtnActive: {
    background: 'rgba(255,255,255,0.25)',
    borderColor: 'rgba(255,255,255,0.6)',
    color: C.white,
  },
  tabBar: {
    display: 'flex',
    background: C.white,
    borderBottom: `2px solid ${C.gray100}`,
    boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
  },
  tabBtn: {
    flex: 1,
    padding: '12px 0',
    background: 'transparent',
    border: 'none',
    borderBottom: '3px solid transparent',
    color: C.gray500,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  tabBtnActive: {
    color: C.green,
    borderBottomColor: C.green,
    background: C.greenFaint,
  },
  content: {
    flex: 1,
    padding: '12px',
    overflowY: 'auto',
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  spinner: {
    width: 32,
    height: 32,
    border: `3px solid ${C.gray100}`,
    borderTopColor: C.green,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: { color: C.gray500, margin: 0 },
  errorText: { color: C.red, margin: 0, textAlign: 'center' },
  retryBtn: {
    padding: '8px 20px',
    background: C.green,
    border: 'none',
    borderRadius: 8,
    color: C.white,
    fontWeight: 600,
    cursor: 'pointer',
  },
  heureLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: C.gray500,
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 6,
    paddingLeft: 4,
    textTransform: 'uppercase',
  },
  matchCard: {
    background: C.white,
    borderRadius: 12,
    padding: '10px 14px',
    marginBottom: 8,
    borderLeft: `4px solid ${C.green}`,
    boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
  },
  matchTerrain: {
    fontSize: 11,
    color: C.gray500,
    marginBottom: 6,
    fontWeight: 500,
  },
  matchRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  matchTeam: {
    flex: 1,
    fontSize: 13,
    fontWeight: 600,
    color: C.textDark,
    lineHeight: 1.2,
  },
  scoreBox: {
    flexShrink: 0,
    minWidth: 60,
    textAlign: 'center',
  },
  score: {
    fontSize: 20,
    fontWeight: 800,
    color: C.green,
    letterSpacing: 1,
  },
  scoreVs: {
    fontSize: 13,
    fontWeight: 700,
    color: C.gray300,
  },
  reposBadge: {
    marginTop: 8,
    fontSize: 11,
    color: C.gray500,
    fontStyle: 'italic',
  },
  classementHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 12px',
    fontSize: 11,
    fontWeight: 700,
    color: C.gray500,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  classementRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 12px',
    borderRadius: 10,
    marginBottom: 4,
    background: C.white,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  classementRowEven: {
    background: C.offWhite,
  },
  classementRowTop: {
    background: C.greenFaint,
    boxShadow: `0 0 0 1px ${C.greenBorder}`,
  },
  legendeText: {
    fontSize: 11,
    color: C.gray300,
    textAlign: 'center',
    marginTop: 16,
  },
};
