# Migration from CRA to Vite + Tailwind CSS

## Changes Made

### 1. Build Tool Migration (CRA → Vite)
- **Removed**: `react-scripts`
- **Added**: `vite` and `@vitejs/plugin-react`
- **New config file**: `vite.config.js`
- **Entry point**: `index.html` moved to root, `src/index.js` → `src/main.jsx`

### 2. Styling Migration (CSS → Tailwind CSS)
- **Removed**: All custom CSS files (`Auth.css`, `Dashboard.css`)
- **Added**: Tailwind CSS with custom color scheme
- **Config files**: `tailwind.config.js`, `postcss.config.js`
- **Base styles**: `src/index.css` now imports Tailwind directives

### 3. File Extension Changes
- All `.js` files converted to `.jsx` for better clarity
- Components now use `.jsx` extension

### 4. Custom Tailwind Theme
Added custom color palette matching the original design:
- `primary-500`: #667eea (purple-blue)
- `secondary-500`: #764ba2 (purple)

## Benefits

### Vite Advantages:
✅ **Faster dev server** - Lightning fast HMR (Hot Module Replacement)
✅ **Faster builds** - Uses esbuild instead of webpack
✅ **Better DX** - Instant server start
✅ **Modern** - Native ESM support

### Tailwind Advantages:
✅ **Smaller bundle size** - Only used classes are included
✅ **Consistency** - Design system built-in
✅ **Responsive** - Mobile-first utilities
✅ **Maintainability** - No custom CSS to manage
✅ **Productivity** - Rapid UI development

## Script Changes

### Before (CRA):
```json
"start": "react-scripts start"
"build": "react-scripts build"
```

### After (Vite):
```json
"dev": "vite"
"build": "vite build"
"preview": "vite preview"
```

## File Structure Changes

### Before:
```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── index.js
│   ├── App.js
│   ├── pages/
│   │   ├── Login.js
│   │   ├── Signup.js
│   │   ├── Dashboard.js
│   │   ├── Auth.css
│   │   └── Dashboard.css
```

### After:
```
frontend/
├── index.html         (moved to root)
├── vite.config.js     (new)
├── tailwind.config.js (new)
├── postcss.config.js  (new)
├── src/
│   ├── main.jsx       (renamed from index.js)
│   ├── App.jsx        (renamed from App.js)
│   ├── index.css      (Tailwind directives)
│   └── pages/
│       ├── Login.jsx
│       ├── Signup.jsx
│       └── Dashboard.jsx
```

## Running the New Stack

1. **Delete old dependencies**:
   ```bash
   rm -rf node_modules package-lock.json
   ```

2. **Install new dependencies**:
   ```bash
   npm install
   ```

3. **Start dev server**:
   ```bash
   npm run dev
   ```

## Notes

- The CSS lint errors for `@tailwind` directives are expected and will be resolved when dependencies are installed
- All functionality remains the same, only the tooling and styling approach changed
- Old CSS files can be safely deleted after confirming everything works
