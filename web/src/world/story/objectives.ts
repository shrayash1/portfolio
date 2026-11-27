import type { Objective } from "./types";

export class Objectives {
  private doneIds = new Set<string>();
  constructor(private list: Objective[]) {}
  active(): Objective | null {
    return this.list.find((o) => !o.optional && !this.doneIds.has(o.id)) ?? null;
  }
  complete(id: string): void {
    if (this.list.some((o) => o.id === id)) this.doneIds.add(id);
  }
  isDone(id: string): boolean {
    return this.doneIds.has(id);
  }
  allRequiredDone(): boolean {
    return this.list.every((o) => o.optional || this.doneIds.has(o.id));
  }
}
