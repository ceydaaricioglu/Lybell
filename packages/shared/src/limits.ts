/**
 * Free vs Pro limitleri (Faz 2).
 * Pro: sınırsız (sayı kontrolü yapılmaz).
 */

export const FREE_MAX_CATEGORIES = 4;
export const FREE_MAX_TASKS = 50;
/** Free: görev başına en fazla alt görev sayısı; Pro: sınırsız. */
export const FREE_MAX_SUBTASKS_PER_TASK = 3;

export function canAddCategory(isPro: boolean, currentCount: number): boolean {
  if (isPro) return true;
  return currentCount < FREE_MAX_CATEGORIES;
}

export function canAddTask(isPro: boolean, currentCount: number): boolean {
  if (isPro) return true;
  return currentCount < FREE_MAX_TASKS;
}

export function canAddSubtask(isPro: boolean, currentCount: number): boolean {
  if (isPro) return true;
  return currentCount < FREE_MAX_SUBTASKS_PER_TASK;
}
