/* Bounded, serialised history; storage failures never discard the active project. */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.ExploraProjectStore = factory();
})(typeof window === 'object' ? window : globalThis, () => {
  class History {
    constructor(initial, limit = 40, budget = 16 * 1024 * 1024) {
      this.limit = limit; this.budget = budget; this.reset(initial);
    }
    reset(value) { this.steps = [value]; this.index = 0; }
    push(value) {
      if (value === this.current) return false;
      this.steps = this.steps.slice(0, this.index + 1);
      this.steps.push(value); this.index++;
      while (this.steps.length > 1 && (this.steps.length > this.limit || this.steps.reduce((n, s) => n + s.length * 2, 0) > this.budget)) {
        this.steps.shift(); this.index--;
      }
      return true;
    }
    get current() { return this.steps[this.index]; }
    get canUndo() { return this.index > 0; }
    get canRedo() { return this.index < this.steps.length - 1; }
    undo() { if (this.canUndo) this.index--; return this.current; }
    redo() { if (this.canRedo) this.index++; return this.current; }
  }
  function write(storage, key, value) {
    try { storage.setItem(key, value); return true; } catch { return false; }
  }
  return { History, write };
});
