import { useState } from "react";
import "./App.css";

type Player = {
  name: string;
  level: number;
};

type Pair = [Player, Player];

type Match = {
  teamA: Pair;
  teamB: Pair;
};

type Court = {
  match: Match;
};

type Round = {
  courts: Court[];
  playing: Player[];
  resting: Player[];
};

// ---------- Utils ----------
function makePairKey(a: string, b: string): string {
  return [a, b].sort().join("-");
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

function teamLevel(pair: Pair) {
  return pair[0].level + pair[1].level;
}

// ---------- Core ----------
function generateRound(
  players: Player[],
  usedPairs: Set<string>
): Round | null {
  if (players.length !== 8) return null;

  const shuffled = shuffle(players);
  const pairs: Pair[] = [];

  // 👉 สร้างคู่ก่อน (ห้ามซ้ำ)
  for (let i = 0; i < 8; i += 2) {
    const p1 = shuffled[i];
    const p2 = shuffled[i + 1];
    const key = makePairKey(p1.name, p2.name);

    if (usedPairs.has(key)) return null;

    pairs.push([p1, p2]);
  }

  // 👉 เช็ค balance match
  const match1Diff = Math.abs(
    teamLevel(pairs[0]) - teamLevel(pairs[1])
  );
  const match2Diff = Math.abs(
    teamLevel(pairs[2]) - teamLevel(pairs[3])
  );

  if (match1Diff > 1 || match2Diff > 1) {
    return null; // ไม่บาลานซ์
  }

  // 👉 save history
  pairs.forEach(([a, b]) => {
    usedPairs.add(makePairKey(a.name, b.name));
  });

  return {
    courts: [
      { match: { teamA: pairs[0], teamB: pairs[1] } },
      { match: { teamA: pairs[2], teamB: pairs[3] } },
    ],
    playing: players,
    resting: [],
  };
}

function generateRoundWithRetry(
  players: Player[],
  usedPairs: Set<string>,
  maxRetry = 1000
): Round | null {
  for (let i = 0; i < maxRetry; i++) {
    const r = generateRound(players, usedPairs);
    if (r) return r;
  }
  return null;
}

// ---------- React ----------
function App() {
  const [input, setInput] = useState("");
  const [roundCount, setRoundCount] = useState(5);
  const [rounds, setRounds] = useState<Round[]>([]);

  const parsePlayers = (): Player[] => {
    return input
      .split(",")
      .map((p) => {
        const [name, level] = p.split(":");
        return {
          name: name.trim(),
          level: Number(level),
        };
      })
      .filter((p) => p.name && p.level >= 1 && p.level <= 3);
  };

  const handleGenerate = () => {
    const players = parsePlayers();

    if (players.length !== 16) {
      alert("ต้องมี 16 คน และกำหนด level 1-3");
      return;
    }

    const usedPairs = new Set<string>();
    const result: Round[] = [];

    let queue = shuffle(players);

    for (let i = 0; i < roundCount; i++) {
      const playing = queue.slice(0, 8);
      const resting = queue.slice(8, 16);

      const r = generateRoundWithRetry(playing, usedPairs);

      if (!r) {
        alert(`ตันหรือบาลานซ์ไม่ได้ที่รอบ ${i + 1}`);
        break;
      }

      r.playing = playing;
      r.resting = resting;

      result.push(r);

      // rotate
      queue = [...resting, ...playing];
    }

    setRounds(result);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>🏸 Badminton Level Balance Generator</h1>

      {/* INPUT */}
      <div style={{ marginBottom: 20 }}>
        <input
          style={{ width: "500px", padding: "8px" }}
          placeholder="A:1,B:2,C:3,..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <input
          type="number"
          value={roundCount}
          onChange={(e) => setRoundCount(Number(e.target.value))}
          style={{ width: "80px", marginLeft: 10 }}
        />

        <button onClick={handleGenerate} style={{ marginLeft: 10 }}>
          Generate
        </button>
      </div>

      {/* GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: "16px",
        }}
      >
        {rounds.map((round, rIndex) => (
          <div
            key={rIndex}
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              borderRadius: "8px",
              background: "#fff",
            }}
          >
            <h4>Round {rIndex + 1}</h4>

            <p style={{ fontSize: 12 }}>
              ▶ เล่น:{" "}
              {round.playing
                .map((p) => `${p.name}(${p.level})`)
                .join(", ")}
              <br />
              ⏸ พัก:{" "}
              {round.resting
                .map((p) => `${p.name}(${p.level})`)
                .join(", ")}
            </p>

            <table border={1} cellPadding={6} width="100%">
              <thead>
                <tr>
                  <th>สนาม</th>
                  <th>ทีม A</th>
                  <th>ทีม B</th>
                </tr>
              </thead>
              <tbody>
                {round.courts.map((court, i) => {
                  const a = court.match.teamA;
                  const b = court.match.teamB;

                  return (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>
                        {a[0].name}({a[0].level}) /{" "}
                        {a[1].name}({a[1].level}) ={" "}
                        {teamLevel(a)}
                      </td>
                      <td>
                        {b[0].name}({b[0].level}) /{" "}
                        {b[1].name}({b[1].level}) ={" "}
                        {teamLevel(b)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;