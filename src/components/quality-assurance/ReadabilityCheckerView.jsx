import React, { useState, useCallback } from "react";

/** Approximate syllable count for a word (English heuristic: vowel groups, min 1). */
function countSyllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length === 0) return 0;
  const vowelGroups = w.match(/[aeiouy]+/g);
  const count = vowelGroups ? vowelGroups.length : 1;
  // Silent e at end often doesn't add a syllable
  if (count > 1 && /e$/.test(w) && !/le$/.test(w)) return count - 1;
  return Math.max(1, count);
}

/** Split text into sentences (simple: . ! ?). */
function getSentences(text) {
  return text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Get words from text. */
function getWords(text) {
  return text.trim().split(/\s+/).filter(Boolean);
}

function getFleschReadability(text) {
  const sentences = getSentences(text);
  const allWords = getWords(text);
  if (sentences.length === 0 || allWords.length === 0) return null;
  const totalSentences = sentences.length;
  const totalWords = allWords.length;
  const totalSyllables = allWords.reduce(
    (sum, word) => sum + countSyllables(word),
    0,
  );

  const wordsPerSentence = totalWords / totalSentences;
  const syllablesPerWord = totalSyllables / totalWords;

  // Flesch Reading Ease: 206.835 - 1.015 * (words/sentences) - 84.6 * (syllables/words)
  const readingEase =
    206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord;

  // Flesch-Kincaid Grade Level
  const gradeLevel = 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;

  return {
    readingEase: Math.round(readingEase * 10) / 10,
    gradeLevel: Math.max(0, Math.min(18, gradeLevel)),
  };
}

const GRADE_LEVEL_LABELS = [
  { maxGrade: 4.9, label: "Below 5th grade" },
  { maxGrade: 5.9, label: "5th grade" },
  { maxGrade: 6.9, label: "6th grade" },
  { maxGrade: 7.9, label: "7th grade" },
  { maxGrade: 9.9, label: "8th to 9th grade" },
  { maxGrade: 12.9, label: "10th to 12th grade" },
  { maxGrade: 16, label: "College" },
  { maxGrade: 999, label: "College graduate" },
];

function gradeLevelToLabel(grade) {
  for (const { maxGrade, label } of GRADE_LEVEL_LABELS) {
    if (grade <= maxGrade) return label;
  }
  return "College graduate";
}

export default function ReadabilityCheckerView() {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState(null);

  const handleCalculate = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed) {
      setResult(null);
      return;
    }
    const flesch = getFleschReadability(trimmed);
    if (!flesch) {
      setResult(null);
      return;
    }
    const label = gradeLevelToLabel(flesch.gradeLevel);
    setResult({
      readingEase: flesch.readingEase,
      gradeLevel: flesch.gradeLevel,
      label,
    });
  }, [inputText]);

  return (
    <div
      className="readability-checker-view d-flex flex-column w-100"
      style={{ minHeight: "calc(100vh - 10rem)" }}
    >
      <div className="card border-0 shadow-sm rounded-3 flex-grow-1 d-flex flex-column w-100">
        <div className="card-body p-4 p-lg-5 d-flex flex-column flex-grow-1">
          <h6 className="fw-semibold text-body mb-1 d-flex align-items-center gap-2">
            <i
              className="isax isax-eye text-primary fs-18"
              aria-hidden="true"
            />
            Readability Checker
          </h6>
          <p className="fs-13 text-muted mb-4">
            Calculate the readability score of any text (based on Flesch
            Kincaid)
          </p>

          <div className="row g-4 flex-grow-1">
            <div className="col-lg-6 d-flex flex-column">
              <label
                htmlFor="readability-checker-text"
                className="form-label visually-hidden"
              >
                Enter text
              </label>
              <textarea
                id="readability-checker-text"
                className="form-control border border-secondary border-opacity-25 rounded-3 flex-grow-1"
                placeholder="Type or paste your text here..."
                rows={20}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                style={{ resize: "vertical", minHeight: "min(420px, 50vh)" }}
                aria-label="Text to analyze"
              />
              <button
                type="button"
                className="btn btn-light border border-secondary border-opacity-25 rounded-2 mt-3 text-primary fw-medium"
                onClick={handleCalculate}
              >
                Calculate Readability Score
              </button>
            </div>
            <div className="col-lg-6 d-flex flex-column">
              <div
                className="rounded-3 border border-secondary border-opacity-25 bg-body-tertiary bg-opacity-50 p-4 p-lg-5 flex-grow-1 d-flex flex-column justify-content-center"
                style={{ minHeight: "min(380px, 45vh)" }}
              >
                <h6 className="fw-semibold text-body mb-4 fs-5">
                  Readability Level
                </h6>
                {result ? (
                  <p className="mb-0 d-flex align-items-baseline flex-wrap gap-2">
                    <span
                      className="display-5 fw-bold text-body"
                      style={{ fontSize: "2.25rem" }}
                    >
                      {result.readingEase}
                    </span>
                    <span className="text-muted fs-4 fw-medium">
                      - {result.label}
                    </span>
                  </p>
                ) : (
                  <p className="text-muted mb-0" style={{ fontSize: "1rem" }}>
                    Enter text and click "Calculate Readability Score" to see
                    the result.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
