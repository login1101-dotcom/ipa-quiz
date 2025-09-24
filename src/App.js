import React, { useMemo, useState } from "react";
import "./App.css";

/** 出題データ */
const ITEMS = [
  { name: "short a", ipa: "/æ/", examples: ["cat", "camp", "bath", "fan"] },
  { name: "long a", ipa: "/eɪ/", examples: ["fate", "they", "great"] },
  { name: "ar sound", ipa: "/ɑːr/", examples: ["car", "art", "mark"] },
  { name: "Schwa", ipa: "/ə/", examples: ["about", "support", "pencil"] },
  { name: "short e", ipa: "/e/", examples: ["let", "get", "egg"] },
  { name: "long e", ipa: "/iː/", examples: ["fee", "she", "believe"] },
  { name: "er sound", ipa: "/ɜːr/", examples: ["bird", "term", "hurt"] },
  { name: "short i", ipa: "/ɪ/", examples: ["fit", "income", "it"] },
  { name: "long i", ipa: "/aɪ/", examples: ["eye", "iron", "idea"] },
  // short o は ɒ ではなく ɑ を使う
  { name: "short o", ipa: "/ɑ/", examples: ["dog", "hot", "not", "lock"] },
  { name: "short oo", ipa: "/ʊ/", examples: ["book", "should", "put"] },
  { name: "long oo", ipa: "/uː/", examples: ["too", "loose", "through"] },
  { name: "long o", ipa: "/oʊ/", examples: ["note", "no", "slow"] },
  { name: "ow sound", ipa: "/aʊ/", examples: ["house", "out", "count"] },
  { name: "oi sound", ipa: "/ɔɪ/", examples: ["boy", "joy", "join"] },
  { name: "or sound", ipa: "/ɔːr/", examples: ["for", "sort", "storm"] },
  { name: "short u", ipa: "/ʌ/", examples: ["but", "fun", "cup"] },
];

const ALL_IPA = ITEMS.map((d) => d.ipa);
const ALL_NAMES = ITEMS.map((d) => d.name);

/** 配列シャッフル */
function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** 選択肢 4 つ作成（正解 + ダミー） */
function pickOptions(correct, pool, n = 4) {
  const others = shuffleArray(pool.filter((p) => p !== correct)).slice(0, n - 1);
  return shuffleArray([correct, ...others]);
}

/** IPA → 例単語でハイライトすべき綴りパターン（長い順） */
const IPA_PATTERNS = {
  "/æ/": ["a"],
  "/eɪ/": ["eigh", "ay", "ai", "ea", "ey", "a", "e"],
  "/ɑːr/": ["ar"],
  "/ə/": [], // Schwa は特別扱い
  "/e/": ["ea", "e"],
  "/iː/": ["ee", "ie", "ei", "e"],
  "/ɜːr/": ["er", "ir", "ur"],
  "/ɪ/": ["i", "y"],
  "/aɪ/": ["igh", "ie", "y", "i", "eye"],
  "/ɑ/": ["o", "a"],
  "/ʊ/": ["oo", "ou", "u"],
  "/uː/": ["oo", "ough", "u", "ue", "ew"],
  "/oʊ/": ["oa", "ow", "oe", "o"],
  "/aʊ/": ["ow", "ou"],
  "/ɔɪ/": ["oi", "oy"],
  "/ɔːr/": ["or", "oar"],
  "/ʌ/": ["u", "o"],
};

/** Schwa 専用：単語ごとに特定の 1 文字だけ赤にする */
const SCHWA_TARGETS = { about: "a", support: "u", pencil: "i" };

/** 単語内の該当部分を赤で強調 */
function highlightByIPA(word, ipa) {
  if (ipa === "/ə/") {
    const target = SCHWA_TARGETS[word.toLowerCase()];
    if (target) {
      const idx = word.toLowerCase().indexOf(target);
      if (idx !== -1) {
        return (
          <>
            {word.slice(0, idx)}
            <span className="vowel">{word[idx]}</span>
            {word.slice(idx + 1)}
          </>
        );
      }
    }
    return word;
  }
  const patterns = IPA_PATTERNS[ipa] || [];
  for (const pat of patterns.sort((a, b) => b.length - a.length)) {
    const re = new RegExp(pat, "i");
    const m = word.match(re);
    if (m) {
      const i = m.index ?? 0;
      const mid = word.slice(i, i + m[0].length);
      return (
        <>
          {word.slice(0, i)}
          <span className="vowel">{mid}</span>
          {word.slice(i + m[0].length)}
        </>
      );
    }
  }
  return word;
}

export default function IPAQuizApp() {
  const [order, setOrder] = useState(() => shuffleArray(ITEMS.map((_, i) => i)));
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showExamples, setShowExamples] = useState(false);
  const [results, setResults] = useState([]);
  const [showSummary, setShowSummary] = useState(false);
  const [mode, setMode] = useState("nameToIpa"); // "nameToIpa" | "ipaToName"

  const current = ITEMS[order[index]];
  const correct = mode === "nameToIpa" ? current.ipa : current.name;
  const pool = mode === "nameToIpa" ? ALL_IPA : ALL_NAMES;

  const options = useMemo(() => pickOptions(correct, pool, 4), [correct, pool]);

  const onChoose = (opt) => setSelected(opt);

  const next = () => {
    const isCorrect = selected === correct;
    setResults((arr) => [
      ...arr,
      {
        qNo: arr.length + 1,
        name: current.name,
        correctIpa: current.ipa,
        chosenLabel: selected,
        isCorrect,
        examples: current.examples,
        mode,
      },
    ]);
    if (index + 1 >= order.length) setShowSummary(true);
    else {
      setIndex(index + 1);
      setSelected(null);
    }
  };

  const total = order.length;

  if (showSummary) {
    const aggregate = {};
    results.forEach((r) => {
      aggregate[r.name] ??= { correct: 0, incorrect: 0, examples: r.examples, ipa: r.correctIpa };
      r.isCorrect ? (aggregate[r.name].correct += 1) : (aggregate[r.name].incorrect += 1);
    });
    const rows = ITEMS.map((it) => ({
      name: it.name,
      ipa: it.ipa,
      examples: aggregate[it.name]?.examples || it.examples,
      correct: aggregate[it.name]?.correct || 0,
      incorrect: aggregate[it.name]?.incorrect || 0,
    }));
    return (
      <div className="container">
        <h2 className="title">結果一覧（1–17）</h2>
        <table className="table">
          <thead>
            <tr>
              <th>#</th><th>名称</th><th>IPA</th><th>例単語</th><th>正解</th><th>不正解</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.name}>
                <td className="tc">{i + 1}</td>
                <td>{r.name}</td>
                <td className="tc">{r.ipa}</td>
                <td>
                  {r.examples.map((w, j) => (
                    <span key={j} style={{ marginRight: 10 }}>
                      {highlightByIPA(w, r.ipa)}
                      {j < r.examples.length - 1 ? "," : ""}
                    </span>
                  ))}
                </td>
                <td className="tc">{r.correct}</td>
                <td className="tc">{r.incorrect}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ textAlign: "center", marginTop: 18 }}>
          <button
            onClick={() => {
              setOrder(shuffleArray(ITEMS.map((_, i) => i)));
              setIndex(0);
              setSelected(null);
              setShowSummary(false);
              setResults([]);
            }}
            className="btn"
          >
            もう一度
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h2 className="title">IPA Vowel Quiz</h2>

      <div className="modeBar">
        <button
          onClick={() => { setMode("nameToIpa"); setSelected(null); }}
          disabled={mode === "nameToIpa"}
          className="modeBtn"
        >
          名称→IPA
        </button>
        <button
          onClick={() => { setMode("ipaToName"); setSelected(null); }}
          disabled={mode === "ipaToName"}
          className="modeBtn"
        >
          IPA→名称
        </button>
      </div>

      <div className="subinfo">
        {index + 1} / {total}　—　モード：{mode === "nameToIpa" ? "名称→IPA" : "IPA→名称"}
      </div>

      {/* 問題とその下に例の単語 */}
      <div className="questionWrap">
        <h3 className="questionTitle">{mode === "nameToIpa" ? current.name : current.ipa}</h3>
        <div className="examples examples--under" style={{ visibility: showExamples ? "visible" : "hidden" }}>
          {current.examples.slice(0, 3).map((w, i) => (
            <span key={i} className="exampleWord">
              {highlightByIPA(w, current.ipa)}
            </span>
          ))}
        </div>
      </div>

      {/* 選択肢 */}
      <div className="choices">
        {options.map((opt) => {
          const isPicked = selected === opt;
          const isCorrect = opt === correct;
          const cls =
            isPicked && isCorrect ? "choice picked correct" :
            isPicked && !isCorrect ? "choice picked wrong" : "choice";
          return (
            <button key={opt} onClick={() => onChoose(opt)} className={cls}>
              {opt}
            </button>
          );
        })}
      </div>

      <div className="bottomBar">
        <button onClick={() => setShowExamples((v) => !v)} className={`btn ${showExamples ? "btn-primary" : ""}`}>
          例の単語
        </button>
        <button onClick={next} disabled={!selected} className="btn nextBtn">
          {index + 1 >= order.length ? "結果を見る" : "次へ"}
        </button>
      </div>
    </div>
  );
}
