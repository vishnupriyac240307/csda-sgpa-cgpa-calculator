
import { useEffect, useMemo, useState } from "react";
import { Download, Printer } from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { CURRICULUM } from "../data/curriculum";
import { calculateCGPA, calculateSGPA } from "../utils/calculation";
import Notice from "../components/Notice";

type MarksMap = Record<number, Record<string, number>>;

export default function ResultsPage() {
  const { user } = useAuth();
  const [marks, setMarks] = useState<MarksMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadMarks = async () => {
      try {
        setLoading(true);
        setError("");

        const { data } = await api.get("/api/academic");

        const updatedMarks: MarksMap = {};
        const semesters = data?.record?.semesters || [];

        for (const semester of semesters) {
          const semesterNumber = Number(semester.semester);
          const savedMarks = semester.marks;

          if (Array.isArray(savedMarks)) {
            updatedMarks[semesterNumber] = Object.fromEntries(savedMarks);
          } else if (
            savedMarks &&
            typeof savedMarks === "object"
          ) {
            updatedMarks[semesterNumber] = savedMarks;
          } else {
            updatedMarks[semesterNumber] = {};
          }
        }

        if (active) {
          setMarks(updatedMarks);
        }
      } catch (err) {
        console.error("Failed to load academic results:", err);

        if (active) {
          setError("Unable to load your saved marks. Please refresh the page and try again.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadMarks();

    return () => {
      active = false;
    };
  }, []);

  const cgpa = useMemo(
    () => calculateCGPA(CURRICULUM, marks),
    [marks]
  );

  const resetAll = async () => {
    const confirmed = window.confirm(
      "Delete all saved academic marks for your account? Your profile and login will not be deleted."
    );

    if (!confirmed) return;

    try {
      await api.delete("/api/academic");
      setMarks({});
    } catch (err) {
      console.error("Failed to reset marks:", err);
      alert("Unable to reset marks. Please try again.");
    }
  };

  const download = () => {
    const rows: string[][] = [
      ["CSDA SGPA & CGPA Calculator"],
      ["Student", user?.fullName || ""],
      ["Roll number", user?.rollNumber || ""],
      [
        "Current CGPA",
        cgpa.cgpa === null ? "Not available" : cgpa.cgpa.toFixed(2),
      ],
      [
        "Calculation method",
        "Credit-weighted reference formula; subject to official rules",
      ],
      [],
      [
        "Semester",
        "Subject",
        "Marks",
        "Maximum marks",
        "Credits",
        "Grade point",
        "Weighted point",
      ],
    ];

    CURRICULUM.forEach((subject) => {
      const mark = marks[subject.semester]?.[subject.id];

      if (mark !== undefined) {
        const gradePoint =
          (mark / subject.maxMarks) * 10;

        rows.push([
          String(subject.semester),
          subject.name,
          String(mark),
          String(subject.maxMarks),
          String(subject.credits),
          gradePoint.toFixed(2),
          (gradePoint * subject.credits).toFixed(2),
        ]);
      }
    });

    const csv = rows
      .map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = "csda-academic-results.csv";
    a.click();

    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="panel">
        <p>Loading your academic results...</p>
      </div>
    );
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">ACADEMIC REPORT</span>
          <h1>Results</h1>
          <p>Your saved academic marks and calculated performance.</p>
        </div>

        <div className="heading-actions">
          <button
            className="btn btn-ghost"
            onClick={resetAll}
            disabled={!CURRICULUM.length}
          >
            Reset all marks
          </button>

          <button
            className="btn btn-outline"
            onClick={() => window.print()}
          >
            <Printer size={16} /> Print
          </button>

          <button
            className="btn btn-primary"
            onClick={download}
            disabled={!CURRICULUM.length}
          >
            <Download size={16} /> Download CSV
          </button>
        </div>
      </div>

      {error && <Notice>{error}</Notice>}

      {!CURRICULUM.length ? (
        <Notice>
          Results will be available after the official CSDA curriculum is
          configured and marks are entered.
        </Notice>
      ) : (
        <div className="panel printable">
          <div className="report-title">
            <div>
              <h2>CSDA Academic Summary</h2>
              <p>
                {user?.fullName} · {user?.rollNumber}
              </p>
            </div>

            <div className="report-cgpa">
              <small>
                {cgpa.complete ? "Final CGPA" : "Current CGPA"}
              </small>

              <strong>
                {cgpa.cgpa === null ? "—" : cgpa.cgpa.toFixed(2)}
              </strong>
            </div>
          </div>

          {Array.from({ length: 6 }, (_, i) => i + 1).map((n) => {
            const subjects = CURRICULUM.filter(
              (subject) => subject.semester === n
            );

            const result = calculateSGPA(
              subjects,
              marks[n] || {}
            );

            return (
              <div className="report-semester" key={n}>
                <h3>
                  Semester {n}
                  <span>
                    {result.complete ? "Completed" : "In progress"}
                  </span>
                </h3>

                <div className="table-scroll">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Marks</th>
                        <th>Maximum</th>
                        <th>Credits</th>
                        <th>Grade point</th>
                        <th>Weighted point</th>
                      </tr>
                    </thead>

                    <tbody>
                      {subjects.map((subject) => {
                        const mark = marks[n]?.[subject.id];

                        return (
                          <tr key={subject.id}>
                            <td>{subject.name}</td>

                            <td>{mark ?? "—"}</td>

                            <td>{subject.maxMarks}</td>

                            <td>{subject.credits}</td>

                            <td>
                              {mark === undefined
                                ? "—"
                                : (
                                    (mark / subject.maxMarks) * 10
                                  ).toFixed(2)}
                            </td>

                            <td>
                              {mark === undefined
                                ? "—"
                                : (
                                    (mark / subject.maxMarks) *
                                    10 *
                                    subject.credits
                                  ).toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <p className="report-sgpa">
                  SGPA:{" "}
                  <b>
                    {result.sgpa === null
                      ? "—"
                      : result.sgpa.toFixed(2)}
                  </b>
                  {" · "}
                  Eligible credits entered: {result.credits}
                </p>
              </div>
            );
          })}

          <small className="report-disclaimer">
            Calculation method shown is the configurable reference formula.
            Official university rules take precedence once supplied.
          </small>
        </div>
      )}
    </>
  );
}
