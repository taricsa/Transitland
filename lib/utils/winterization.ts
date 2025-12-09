// Winterization protocol implementation
// Based on PRD: October 1st start, November 1st deadline

export interface WinterizationChecklist {
  antiGel: boolean;
  heater: boolean;
  tireTread: boolean;
  battery: boolean;
  windshieldWipers: boolean;
}

export function getWinterizationDates(year?: number): { start: Date; deadline: Date } {
  const currentYear = year || new Date().getFullYear();
  return {
    start: new Date(currentYear, 9, 1), // October 1st (month is 0-indexed)
    deadline: new Date(currentYear, 10, 1), // November 1st
  };
}

export function isWinterizationPeriod(date: Date = new Date()): boolean {
  const { start, deadline } = getWinterizationDates(date.getFullYear());
  return date >= start && date < deadline;
}

export function isAfterWinterizationDeadline(date: Date = new Date()): boolean {
  const { deadline } = getWinterizationDates(date.getFullYear());
  return date >= deadline;
}

export function shouldInjectWinterizationChecklist(
  vehicleWinterized: boolean,
  date: Date = new Date()
): boolean {
  return isWinterizationPeriod(date) && !vehicleWinterized;
}

export function getWinterizationChecklistText(): string {
  return `WINTERIZATION CHECKLIST REQUIRED:
- Anti-gel additive check
- Heater system check
- Tire tread depth check (must be > 4/32")
- Battery condition check
- Windshield wiper condition`;
}

export function shouldBlockDispatch(
  vehicleWinterized: boolean,
  date: Date = new Date()
): boolean {
  return isAfterWinterizationDeadline(date) && !vehicleWinterized;
}

export function getDaysUntilDeadline(date: Date = new Date()): number {
  const { deadline } = getWinterizationDates(date.getFullYear());
  const diff = deadline.getTime() - date.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

