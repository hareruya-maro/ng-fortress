# Component Creation Skill

1. **Mandatory Metadata:** Every component MUST have `standalone: true` and `changeDetection: ChangeDetectionStrategy.OnPush`.
2. **Inputs/Outputs:** `@Input()` and `@Output()` decorators are FORBIDDEN. Use Signal `input()` and `output()`.
3. **UI Components (`ui/`):** Dumb. Only simple formatting. No services.
4. **Feature Components (`features/`):** Smart. Max 20 lines per method. Inject services.
5. **Separate HTML Templates:** The HTML template MUST be created in a separate `.html` file (using `templateUrl`), NOT inline as a string in the `@Component` decorator.
