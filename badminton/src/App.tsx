import { useState } from "react";
import "./App.css";

type Player = string;
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

// ---------- Core ----------
function generateRound(
  players: Player[],
  usedPairs: Set<string>
): Round | null {
  if (players.length !== 8) return null;

  const shuffled = shuffle(players);
  const pairs: Pair[] = [];

  for (let i = 0; i < 8; i += 2) {
    const p1 = shuffled[i];
    const p2 = shuffled[i + 1];
    const key = makePairKey(p1, p2);

    if (usedPairs.has(key)) return null;

    pairs.push([p1, p2]);
  }

  pairs.forEach(([a, b]) => {
    usedPairs.add(makePairKey(a, b));
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
  maxRetry = 500
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

  const handleGenerate = () => {
    const players = input
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    if (players.length !== 16) {
      alert("ต้องมีผู้เล่น 16 คน");
      return;
    }

    const usedPairs = new Set<string>();
    const result: Round[] = [];

    let queue = shuffle(players); // 👉 สุ่มครั้งแรก

    for (let i = 0; i < roundCount; i++) {
      const playing = queue.slice(0, 8);
      const resting = queue.slice(8, 16);

      const r = generateRoundWithRetry(playing, usedPairs);

      if (!r) {
        alert(`ตันที่รอบ ${i + 1}`);
        break;
      }

      r.playing = playing;
      r.resting = resting;

      result.push(r);

      // 🔄 rotate
      queue = [...resting, ...playing];
    }

    setRounds(result);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>🏸 Badminton Rotate Generator</h1>

      {/* INPUT */}
      <div style={{ marginBottom: 20 }}>
        <input
          style={{ width: "320px", padding: "8px" }}
          placeholder="A,B,C,...,P"
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
              ▶ เล่น: {round.playing.join(", ")}
              <br />
              ⏸ พัก: {round.resting.join(", ")}
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
                {round.courts.map((court, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>
                      {court.match.teamA[0]} /{" "}
                      {court.match.teamA[1]}
                    </td>
                    <td>
                      {court.match.teamB[0]} /{" "}
                      {court.match.teamB[1]}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;