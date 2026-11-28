/** Calendar day, "YYYY-MM-DD". Never a Date, so time zones can't shift it. */
export type IsoDate = string;

export interface DateRange {
  start: IsoDate;
  end: IsoDate;
}
