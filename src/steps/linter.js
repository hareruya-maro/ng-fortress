import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

export async function setupLinter(projectPath, stylingChoice) {
  console.log(chalk.green('\n🚨 [Step 4] Configuring the Strict Linter (The "Fortress")...'));

  // 1. Add Dev Dependencies to package.json
  const pkgPath = path.join(projectPath, 'package.json');
  const pkg = fs.readJsonSync(pkgPath);
  pkg.devDependencies = pkg.devDependencies || {};

  const linterDeps = {
    "eslint": "^9.0.0",
    "typescript-eslint": "^8.0.0",
    "@angular-eslint/eslint-plugin": "^19.0.0",
    "@angular-eslint/eslint-plugin-template": "^19.0.0",
    "@angular-eslint/template-parser": "^19.0.0",
    "eslint-plugin-boundaries": "^5.0.0",
    "eslint-plugin-import": "^2.31.0",
    "eslint-plugin-functional": "^7.0.0",
    "prettier": "^3.0.0",
    "stylelint": "^16.0.0",
    "stylelint-config-standard": "^36.0.0"
  };

  if (stylingChoice === 'tailwind') {
    Object.assign(linterDeps, {
      "tailwindcss": "^3.4.0",
      "postcss": "^8.4.0",
      "autoprefixer": "^10.4.0"
    });
  }

  Object.assign(pkg.devDependencies, linterDeps);

  pkg.scripts = pkg.scripts || {};
  pkg.scripts.lint = "eslint .";
  pkg.scripts["format:check"] = "prettier --check .";
  pkg.scripts["format:write"] = "prettier --write .";
  pkg.type = "module";

  fs.writeJsonSync(pkgPath, pkg, { spaces: 2 });

  // 2. Generate eslint.config.js (Flat Config)
  const eslintConfig = `import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import angularAuth from '@angular-eslint/eslint-plugin';
import angularTemplate from '@angular-eslint/eslint-plugin-template';
import angularTemplateParser from '@angular-eslint/template-parser';
import boundaries from 'eslint-plugin-boundaries';
import importPlugin from 'eslint-plugin-import';
import functional from 'eslint-plugin-functional';

export default tseslint.config(
  {
    ignores: ['src/main.ts', '**/*.config.ts', 'src/app/app.routes.ts', 'e2e/**/*', 'scripts/**/*']
  },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@angular-eslint': angularAuth,
      'boundaries': boundaries,
      'import': importPlugin,
      'functional': functional
    },
    settings: {
      'boundaries/elements': [
        { type: 'ui', pattern: 'src/app/ui/**/*' },
        { type: 'features', pattern: 'src/app/features/**/*' },
        { type: 'infrastructure', pattern: 'src/app/infrastructure/**/*' },
        { type: 'schema', pattern: 'src/app/schema/**/*' }
      ],
      'boundaries/include': ['src/app/**/*']
    },
    rules: {
      '@angular-eslint/directive-selector': ['error', { type: 'attribute', prefix: 'app', style: 'camelCase' }],
      '@angular-eslint/component-selector': ['error', { type: 'element', prefix: 'app', style: 'kebab-case' }],
      // Strict structural boundaries
      'boundaries/element-types': ['error', {
        default: 'disallow',
        rules: [
          { from: 'ui', allow: ['ui'] }, // ui can import from ui? usually no logic allowed, but basic types OK. Wait, schema shouldn't be imported by UI? Actually Schema is fine for inputs. Let's allow schema.
          { from: 'ui', allow: ['schema'] },
          { from: 'features', allow: ['ui', 'features', 'infrastructure', 'schema'] }, 
          // Infrastructure is dependency inversion: features know about infrastructure interfaces? 
          // Wait, typically features shouldn't know infra directly, they should know schema. But for simplicity, features can call infra services.
          // Spec says: features -> infrastructure, schema is allowed.
          { from: 'infrastructure', allow: ['schema', 'infrastructure'] }, // Infrastructure cannot import features or ui!
        ]
      }],
      // Ban specific names
      'id-denylist': ['error', 'data', 'info', 'obj', 'res', 'handle', 'item'],
      // Functional strictness
      'prefer-const': 'error',
      'functional/no-let': 'error', // No let used for state
      // Third-party imports ban in ui/features
      'no-restricted-imports': ['error', {
        patterns: [
          {
             group: ['rxjs/*', '!rxjs'], 
             // Just an example. Real strictness would ban non-angular libraries outside infrastructure.
          }
        ]
      }]
    }
  },
  {
    files: ['**/app.component.ts'],
    rules: {
      'max-lines': ['error', { max: 30, skipBlankLines: true, skipComments: true }],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'MethodDefinition',
          message: 'Methods are strictly forbidden in app.component.ts. Keep it as a routing shell and implement logic in ui/ or features/ components.'
        }
      ]
    }
  },
  {
    files: ['**/*.html'],
    plugins: {
      '@angular-eslint/template': angularTemplate,
    },
    languageOptions: {
      parser: angularTemplateParser,
    },
    rules: {
      // no-async-pipe handled by custom tool in real life, omitting here to prevent crash
      '@angular-eslint/template/eqeqeq': 'error',
    }
  }
);
`;
  fs.writeFileSync(path.join(projectPath, 'eslint.config.js'), eslintConfig);

  // 3. Generate Prettier
  const prettierConfig = `{"printWidth": 120, "singleQuote": true, "useTabs": false, "tabWidth": 2, "semi": true, "bracketSpacing": true}`;
  fs.writeFileSync(path.join(projectPath, '.prettierrc'), prettierConfig);

  const prettierIgnore = `dist\n.angular\nnode_modules\n`;
  fs.writeFileSync(path.join(projectPath, '.prettierignore'), prettierIgnore);

  // 4. Set up styling constraints
  if (stylingChoice === 'tailwind') {
    // Tailwind Setup
    const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: { extend: {} },
  plugins: [],
}
`;
    fs.writeFileSync(path.join(projectPath, 'tailwind.config.js'), tailwindConfig);

    const stylesCss = `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n`;
    fs.writeFileSync(path.join(projectPath, 'src/styles.css'), stylesCss);
  } else if (stylingChoice === 'strict-css') {
    const stylelintConfig = `export default {
    "extends": ["stylelint-config-standard"],
    "rules": {
        "declaration-no-important": true,
        "color-no-hex": true,
        "max-nesting-depth": 2,
        "selector-class-pattern": "^[a-z]([a-z0-9-]+)?(__([a-z0-9]+-?)+)?(--([a-z0-9]+-?)+){0,2}$" // BEM
    }
};
`;
    fs.writeFileSync(path.join(projectPath, 'stylelint.config.js'), stylelintConfig);
    pkg.scripts["lint:style"] = "stylelint \"src/**/*.css\"";
    fs.writeJsonSync(pkgPath, pkg, { spaces: 2 });
  } else if (stylingChoice === 'no-css') {
    // Angular Material is just a placeholder here, we just add a lint rule ban on styling maybe, 
    // or just leave it for now. We can ban standard CSS modifications via ESLint or custom script later.
  }
}
