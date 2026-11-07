
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  BookOpen,
  Calculator,
  Download,
  Settings,
  TrendingUp,
} from "lucide-react";

import { api, messageOf } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { CURRICULUM, type Subject } from "../data/curriculum";
import {
  calculateCGPA,
  calculateSGPA,
} from "../utils/calculation";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import Notice from "../components/Notice";

type MarksMap = Record<number, Record<string, number>>;

type PercentageResult = {
  obtained: number;
  maximum: number;
  percentage: number | null;
};

// Check whether a subject is eligible for percentage calculation.
function isPercentageEligible(subject: Subject): boolean {
  const category = subject.category.trim().toLowerCase();
  const name = subject.name.trim().toLowerCase();

  if (
    !subject.includedInSGPA ||
    !subject.includedInCGPA
  ) {
    return false;
  }

  if (
    category === "core" ||
    category === "allied" ||
    category === "skill course"
  ) {
    return true;
  }

  if (
    category === "practical" &&
    name.startsWith("core lab")
  ) {
    return true;
  }

  if (
    category === "project" &&
    name.startsWith("core ")
  ) {
    return true;
  }

  return false;
}

// Calculate percentage using only eligible subjects with entered marks.
function calculatePercentage(
  subjects: Subject[],
  semesterMarks: Record<string, number>
): PercentageResult {
  let obtained = 0;
  let maximum = 0;

  const eligibleSubjects = subjects.filter(
    isPercentageEligible
  );

  for (const subject of eligibleSubjects) {
    const mark = semesterMarks[subject.id];

    if (
      mark !== undefined &&
      Number.isFinite(mark) &&
      mark >= 0 &&
      mark <= subject.maxMarks
    ) {
      obtained += mark;
      maximum += subject.maxMarks;
    }
  }

  return {
    obtained,
    maximum,
    percentage:
      maximum > 0
        ? (obtained / maximum) * 100
        : null,
  };
}

export default function DashboardPage() {
  const { user } = useAuth();

  const [marks, setMarks] = useState<MarksMap>({});
  const [error, setError] = useState("");

  // Load saved academic marks.
  useEffect(() => {
    let active = true;

    async function loadAcademicRecord() {
      try {
        const { data } = await api.get("/api/academic");

        const semesters = data?.record?.semesters || [];
        const updatedMarks: MarksMap = {};

        for (const semester of semesters) {
          const semesterNumber = Number(semester.semester);
          const savedMarks = semester.marks;

          if (Array.isArray(savedMarks)) {
            updatedMarks[semesterNumber] =
              Object.fromEntries(savedMarks);
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
          setError("");
        }
      } catch (e) {
        if (active) {
          setError(messageOf(e));
        }
      }
    }

    loadAcademicRecord();

    return () => {
      active = false;
    };
  }, []);

  // Calculate CGPA.
  const cgpa = useMemo(
    () => calculateCGPA(CURRICULUM, marks),
    [marks]
  );

  // Calculate semester-wise results and percentages.
  const cards = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const semester = i + 1;

      const subjects = CURRICULUM.filter(
        (subject) => subject.semester === semester
      );

      const semesterMarks = marks[semester] || {};

      const result = calculateSGPA(
        subjects,
        semesterMarks
      );

      const percentageResult = calculatePercentage(
        subjects,
        semesterMarks
      );

      const started =
        Object.keys(semesterMarks).length > 0;

      return {
        semester,
        subjects,
        result,
        percentageResult,
        status: !subjects.length
          ? "Curriculum pending"
          : result.complete
            ? "Completed"
            : started
              ? "In progress"
              : "Not started",
      };
    });
  }, [marks]);

  // Calculate overall percentage across all semesters.
  const overallPercentage = useMemo(() => {
    let obtained = 0;
    let maximum = 0;

    for (const card of cards) {
      obtained += card.percentageResult.obtained;
      maximum += card.percentageResult.maximum;
    }

    const percentage =
      maximum > 0
        ? (obtained / maximum) * 100
        : null;

    return {
      obtained,
      maximum,
      percentage,
    };
  }, [cards]);

  const completed = cards.filter(
    (card) => card.status === "Completed"
  ).length;

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">STUDENT WORKSPACE</span>

          <h1>
            Good to see you,{" "}
            {user?.fullName?.split(" ")[0] || "student"}.
          </h1>

          <p>Here’s your academic overview.</p>
        </div>

        <Link className="btn btn-outline" to="/settings">
          <Settings size={17} />
          Settings
        </Link>
      </div>

      {error && (
        <Notice type="error">
          {error}
        </Notice>
      )}

      {!CURRICULUM.length && (
        <Notice>
          Official CSDA curriculum has not been configured yet.
          Semester subjects, credits and maximum marks will appear
          here after the official details are added. No academic
          results are fabricated.
        </Notice>
      )}

      {/* Overall academic statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon">
            <TrendingUp />
          </span>

          <span className="stat-label">Current CGPA</span>

          <strong>
            {cgpa.cgpa === null
              ? "—"
              : cgpa.cgpa.toFixed(2)}
          </strong>

          <small>
            {cgpa.complete
              ? "All configured requirements met"
              : "Pending curriculum or marks"}
          </small>
        </div>

        <div className="stat-card">
          <span className="stat-icon">
            <BookOpen />
          </span>

          <span className="stat-label">
            Completed semesters
          </span>

          <strong>{completed} / 6</strong>

          <small>
            Based on required subject marks
          </small>
        </div>

        <div className="stat-card">
          <span className="stat-icon">
            <Calculator />
          </span>

          <span className="stat-label">
            Eligible credits entered
          </span>

          <strong>{cgpa.credits}</strong>

          <small>
            From configured CGPA subjects
          </small>
        </div>

        <div className="stat-card">
          <span className="stat-icon">
            <TrendingUp />
          </span>

          <span className="stat-label">
            Overall Percentage
          </span>

          <strong>
            {overallPercentage.percentage === null
              ? "—"
              : `${overallPercentage.percentage.toFixed(2)}%`}
          </strong>

          <small>
            {overallPercentage.obtained} / {overallPercentage.maximum} eligible marks
          </small>
        </div>
      </div>

      {/* Semester-wise overview */}
      <div className="section-heading">
        <div>
          <h2>Semester overview</h2>
          <p>Your SGPA and percentage across six semesters.</p>
        </div>

        <Link to="/results" className="text-link">
          View results <ArrowUpRight size={16} />
        </Link>
      </div>

      <div className="semester-grid">
        {cards.map((card) => (
          <article
            className="semester-card"
            key={card.semester}
          >
            <div className="semester-card-top">
              <span className="semester-number">
                0{card.semester}
              </span>

              <span
                className={`status-pill ${
                  card.status === "Completed"
                    ? "status-done"
                    : ""
                }`}
              >
                {card.status}
              </span>
            </div>

            <h3>Semester {card.semester}</h3>

            <div className="semester-score">
              {card.result.sgpa === null
                ? "—"
                : card.result.sgpa.toFixed(2)}

              <small>SGPA</small>
            </div>

            {/* Semester percentage */}
            <div
              style={{
                marginTop: "10px",
                marginBottom: "10px",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#2867b7",
                }}
              >
                Percentage:{" "}
                {card.percentageResult.percentage === null
                  ? "—"
                  : `${card.percentageResult.percentage.toFixed(2)}%`}
              </div>

              <div
                style={{
                  fontSize: "12px",
                  color: "#8293aa",
                  marginTop: "4px",
                }}
              >
                {card.percentageResult.obtained} /{" "}
                {card.percentageResult.maximum} marks
              </div>
            </div>

            <div className="semester-meta">
              {card.result.credits} eligible credits
            </div>

            <Link
              className="semester-action"
              to={`/semester/${card.semester}`}
            >
              Open semester <ArrowUpRight size={16} />
            </Link>
          </article>
        ))}
      </div>

      {/* SGPA performance chart */}
      {CURRICULUM.length > 0 && (
        <section className="panel chart-panel">
          <div className="panel-heading">
            <div>
              <h2>Semester performance</h2>
              <p>
                SGPA for semesters with calculable marks.
              </p>
            </div>
          </div>

          <div className="chart-wrap">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart
                data={cards
                  .filter(
                    (card) => card.result.sgpa !== null
                  )
                  .map((card) => ({
                    semester: `Sem ${card.semester}`,
                    sgpa: Number(
                      card.result.sgpa!.toFixed(2)
                    ),
                  }))}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                />

                <XAxis dataKey="semester" />

                <YAxis domain={[0, 10]} />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="sgpa"
                  stroke="#2867b7"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <div className="quick-actions">
        <Link to="/results">
          <Download size={18} />
          Results & downloads
        </Link>

        <Link to="/settings">
          <Settings size={18} />
          Profile settings
        </Link>
      </div>
    </>
  );
}
