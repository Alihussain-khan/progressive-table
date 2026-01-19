import React, { useEffect, useMemo, useRef, useState } from "react";

export default function ProgressiveJsonTable({ data }) {


  const initialColumns = useMemo(() => {
    const keys = new Set();
    (data || []).forEach((row) => Object.keys(row || {}).forEach((k) => keys.add(k)));
    return Array.from(keys);
  }, [data]);

 
  const [headers, setHeaders] = useState(initialColumns);

  // Keep headers in sync if data changes shape (simple reset)
  useEffect(() => {
    setHeaders(initialColumns);
  }, [initialColumns]);

  const rowCount = (data || []).length;
  const colCount = headers.length;

  // Header row is an extra row in the grid (row 0)
  // Body rows are 1..rowCount
  const totalRowsIncludingHeader = rowCount + 1;
  const totalCells = totalRowsIncludingHeader * colCount;

  // Values for body cells, indexed by body row r (0..rowCount-1)
  const [values, setValues] = useState(() =>
    (data || []).map((row) => headers.map((h, i) => String(row?.[initialColumns[i]] ?? "")))
  );

  // Re-init values when data/headers change (maps by original column key positions)
  useEffect(() => {
    setValues(
      (data || []).map((row) =>
        headers.map((_, i) => String(row?.[initialColumns[i]] ?? ""))
      )
    );
  }, [data, headers, initialColumns]);

  // Reveal cells progressively
  const [revealedCells, setRevealedCells] = useState(totalCells > 0 ? 1 : 0);

  // Reset reveal when structure changes
  useEffect(() => {
    setRevealedCells(totalCells > 0 ? 1 : 0);
  }, [totalCells]);

  // Cursor over the whole grid including header row
  // r=0 is header row, r>=1 is body row index r-1
  const [cursor, setCursor] = useState({ r: 0, c: 0 });

  // refs: include header row too
  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current = Array.from({ length: totalRowsIncludingHeader }, (_, r) =>
      Array.from({ length: colCount }, (_, c) => inputRefs.current?.[r]?.[c] ?? null)
    );
  }, [totalRowsIncludingHeader, colCount]);

  const idx = (r, c) => r * colCount + c;
  const isRevealed = (r, c) => idx(r, c) < revealedCells;

  const clampCursor = (r, c) => ({
    r: Math.max(0, Math.min(totalRowsIncludingHeader - 1, r)),
    c: Math.max(0, Math.min(colCount - 1, c)),
  });

  const revealUpToInclusive = (linearIndex) => {
    setRevealedCells((prev) => Math.min(Math.max(prev, linearIndex + 1), totalCells));
  };

  const focusCursorSoon = (nextCursor) => {
    requestAnimationFrame(() => {
      const el = inputRefs.current?.[nextCursor.r]?.[nextCursor.c];
      if (el) el.focus();
    });
  };

  const goRight = () => {
    const cur = idx(cursor.r, cursor.c);
    const next = Math.min(cur + 1, Math.max(totalCells - 1, 0));

    revealUpToInclusive(next);
    const nextCursor = clampCursor(Math.floor(next / colCount), next % colCount);
    setCursor(nextCursor);
    focusCursorSoon(nextCursor);
  };

  const goDownRevealRow = () => {
    const nextRow = Math.min(cursor.r + 1, totalRowsIncludingHeader - 1);
    const endOfRow = idx(nextRow, colCount - 1);

    revealUpToInclusive(endOfRow);
    const nextCursor = { r: nextRow, c: 0 };
    setCursor(nextCursor);
    focusCursorSoon(nextCursor);
  };

  const goLeft = () => {
    const cur = idx(cursor.r, cursor.c);
    const prev = Math.max(cur - 1, 0);

    if (prev < revealedCells) {
      const nextCursor = { r: Math.floor(prev / colCount), c: prev % colCount };
      setCursor(nextCursor);
      focusCursorSoon(nextCursor);
    }
  };

  const goUp = () => {
    const prevRow = Math.max(cursor.r - 1, 0);
    const targetIndex = idx(prevRow, cursor.c);
    if (targetIndex < revealedCells) {
      const nextCursor = { r: prevRow, c: cursor.c };
      setCursor(nextCursor);
      focusCursorSoon(nextCursor);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goRight();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      goDownRevealRow();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goLeft();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      goUp();
    }
  };

  // Edit header cell
  const onChangeHeader = (c, v) => {
    setHeaders((prev) => {
      const copy = prev.slice();
      copy[c] = v;
      return copy;
    });
  };

  // Edit body cell (grid row r >= 1)
  const onChangeBodyCell = (gridR, c, v) => {
    const bodyR = gridR - 1;
    setValues((prev) => {
      const copy = prev.map((row) => row.slice());
      copy[bodyR][c] = v;
      return copy;
    });
  };

  // Focus first revealed cell on mount
  useEffect(() => {
    if (totalCells > 0) focusCursorSoon({ r: 0, c: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ overflowX: "auto", fontFamily: "system-ui, sans-serif" }}>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            {headers.map((h, c) => {
              const shown = isRevealed(0, c);
              const active = cursor.r === 0 && cursor.c === c;

              return (
                <th key={c} style={{ border: "1px solid #ddd", padding: 6 }}>
                  {shown ? (
                   
                    <input
                      ref={(el) => {
                        if (!inputRefs.current[0]) inputRefs.current[0] = [];
                        inputRefs.current[0][c] = el;
                      }}
                      value={h}
                      onChange={(e) => onChangeHeader(c, e.target.value)}
                      onKeyDown={onKeyDown}
                      className="outline-0 w-full text-left reveal"
                    />

                  ) : (
                    <div style={{ height: 2, width: 34 }} />
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody>
          {Array.from({ length: rowCount }).map((_, bodyR) => {
            const gridR = bodyR + 1;
            return (
              <tr key={bodyR}>
                {Array.from({ length: colCount }).map((__, c) => {
                  const shown = isRevealed(gridR, c);
                  const active = cursor.r === gridR && cursor.c === c;

                  return (
                    <td key={c} style={{ border: "1px solid #ddd", padding: 6 }}>
                      {shown ? (
                        <input
                          ref={(el) => {
                            if (!inputRefs.current[gridR]) inputRefs.current[gridR] = [];
                            inputRefs.current[gridR][c] = el;
                          }}
                          value={values?.[bodyR]?.[c] ?? ""}
                          onChange={(e) =>
                            onChangeBodyCell(gridR, c, e.target.value)
                          }
                          onKeyDown={onKeyDown}
                          className="w-full outline-0 reveal"
                        />
                      ) : (
                        <div style={{ height: 23 }} />
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>

      <div style={{ marginTop: 10, fontSize: 13, opacity: 0.8 }}>
        Keys: → reveal/move to next cell, ↓ reveal next row (header counts as row 1).
        (←/↑ optional)
      </div>
    </div>
  );
}