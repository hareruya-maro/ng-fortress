# State and RxJS
- UI state = Signals (`signal`, `computed`). No `let` variables for state.
- Async streams = RxJS Observables.
- Bridge = `toSignal()`.
- FORBIDDEN: `async` pipe in HTML templates. Use signal calls (e.g., `{{ data() }}`).
