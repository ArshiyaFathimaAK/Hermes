import { dayAt, dragAnchor, orderedRange, rowCount, weekSpans } from '../month-grid';

// December 2026 starts on a Tuesday.
const month = '2026-12-01';
const grid = { width: 350, rowHeight: 46 };
const at = (column: number, row: number, min = '2026-12-01') =>
  dayAt(month, { x: column * 50 + 25, y: row * 46 + 20 }, grid, min);

describe('dayAt', () => {
  it('finds the day under a finger', () => {
    expect(at(2, 0)).toBe('2026-12-01');
    expect(at(0, 1)).toBe('2026-12-06');
    expect(at(4, 4)).toBe('2026-12-31');
  });

  it('stays inside the month', () => {
    expect(at(0, 0)).toBe('2026-12-01');
    expect(at(6, 9)).toBe('2026-12-31');
    expect(dayAt(month, { x: -50, y: -50 }, grid, month)).toBe('2026-12-01');
  });

  it('never picks a day before the minimum', () => {
    expect(at(2, 0, '2026-12-10')).toBe('2026-12-10');
  });
});

describe('dragging', () => {
  const range = { start: '2026-12-03', end: '2026-12-07' };

  it('keeps the other end when an end is grabbed', () => {
    expect(dragAnchor(range, '2026-12-03')).toBe('2026-12-07');
    expect(dragAnchor(range, '2026-12-07')).toBe('2026-12-03');
  });

  it('starts over from anywhere else', () => {
    expect(dragAnchor(range, '2026-12-05')).toBe('2026-12-05');
    expect(dragAnchor(undefined, '2026-12-05')).toBe('2026-12-05');
  });

  it('works backwards', () => {
    expect(orderedRange('2026-12-07', '2026-12-03')).toEqual(range);
  });
});

describe('weekSpans', () => {
  it('splits a range into weeks', () => {
    const spans = weekSpans(month, { start: '2026-12-03', end: '2026-12-07' });
    expect(spans).toHaveLength(rowCount(month));
    expect(spans.slice(0, 3)).toEqual([{ from: 4, to: 6 }, { from: 0, to: 1 }, undefined]);
  });

  it('clips a range that continues into another month', () => {
    expect(weekSpans(month, { start: '2026-12-30', end: '2027-01-04' })[4]).toEqual({ from: 3, to: 4 });
    expect(weekSpans(month, { start: '2027-01-02', end: '2027-01-04' })).toEqual(Array(5).fill(undefined));
  });
});
