import type { DialogueLine } from "./types";

export class Dialogue {
  private i = 0;
  done = false;
  constructor(private lines: DialogueLine[]) {
    this.done = lines.length === 0;
  }
  current(): DialogueLine | null {
    return this.done ? null : this.lines[this.i];
  }
  isLast(): boolean {
    return this.i + 1 >= this.lines.length;
  }
  next(): DialogueLine | null {
    if (this.i + 1 >= this.lines.length) {
      this.done = true;
      return null;
    }
    return this.lines[++this.i];
  }
}
