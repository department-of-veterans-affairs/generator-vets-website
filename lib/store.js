/**
 * Central store for generator options and props
 * Manages the actual data that flows between generators
 * Generators own their questions, this owns the answers
 */

export class GeneratorStore {
  constructor() {
    this.reset();
  }

  reset() {
    // The actual data - what users provide and what gets computed
    this.options = {}; // CLI arguments
    this.props = {}; // Resolved/computed values
    this.meta = {
      isDryRun: false,
      trackedFiles: [],
    };
  }

  // Options management (CLI args)
  setOption(key, value) {
    this.options[key] = value;
  }

  getOption(key) {
    return this.options[key];
  }

  setOptions(options) {
    this.options = { ...this.options, ...options };
  }

  getAllOptions() {
    return { ...this.options };
  }

  // Props management (resolved values)
  setProp(key, value) {
    this.props[key] = value;
  }

  getProp(key) {
    return this.props[key];
  }

  setProps(props) {
    this.props = { ...this.props, ...props };
  }

  getAllProps() {
    return { ...this.props };
  }

  // Combined access
  getValue(key) {
    // Props take precedence over options
    return this.props[key] === undefined ? this.options[key] : this.props[key];
  }

  // File tracking
  trackFile(filePath) {
    if (!this.meta.trackedFiles.includes(filePath)) {
      this.meta.trackedFiles.push(filePath);
    }
  }

  getTrackedFiles() {
    return [...this.meta.trackedFiles];
  }

  clearTrackedFiles() {
    this.meta.trackedFiles = [];
  }

  // Dry run state
  setDryRun(isDryRun) {
    this.meta.isDryRun = isDryRun;
  }

  isDryRun() {
    return this.meta.isDryRun;
  }

  // Debug
  getState() {
    return {
      options: { ...this.options },
      props: { ...this.props },
      meta: { ...this.meta },
    };
  }
}

// Singleton instance - the central store
export const store = new GeneratorStore();
