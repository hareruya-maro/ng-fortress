# Infrastructure Layer
- Layer is split into `browser/` (DOM, window), `server/` (Node.js API), and `universal/` (e.g. HttpClient).
- `browser/` and `server/` must never import each other.
- External libraries MUST be wrapped in a service here.
- Do NOT expose external types. Map them to `schema/` types.
- Convert callbacks/Promises to RxJS Observables.
- Stateless: No application state inside this layer.
- IF/Switch limit: Keep logic extremely simple. Cyclomatic complexity strictly limited.
