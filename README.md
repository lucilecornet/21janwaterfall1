# VC Waterfall Calculator

A web application for modeling liquidation preferences and exit scenarios for VC-backed startups.

## Features

- **Waterfall Table**: Shows proceeds by shareholder across exit values (EV)
- **Price Per Share (PPS)**: Calculates PPS by share class at each exit value
- **Plain-English Explanation**: Describes what happens at the selected exit value
- **Excel Export**: Download full waterfall analysis as an Excel file

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Usage

### 1. Company Settings
- Enter your company name (used in UI and Excel export)
- Select currency (EUR, USD, or GBP)

### 2. Add Shareholders
- Enter shareholder name, share class, number of shares, and amount invested
- Create new share classes by clicking the "+" button next to the class dropdown
- Common shareholders have 0 invested amount

### 3. Configure Share Class Terms
Each preferred share class can be configured with:
- **Preference Type**: Non-participating (standard) or Participating (double-dip)
- **Preference Multiple**: Default 1x (can be 2x, 3x, etc.)
- **Participation Cap**: Only for participating preferred (optional)
- **Seniority Group**: Lower number = more senior (paid first)

### 4. Advanced Settings (Optional)
- Cash on balance sheet (added to equity value)
- Debt (subtracted from equity value)
- Transaction fees (subtracted from equity value)
- EV step size and maximum

### 5. View Results
- Use the slider or click table rows to select an exit value
- Toggle between class totals and per-shareholder breakdown
- Read the explanation panel for details on what happens at that exit

### 6. Export
Click "Download Excel" to export the full analysis with:
- Waterfall by Shareholder
- Class Summary with PPS
- Inputs and Terms

## Waterfall Logic

### EV to Equity Value
```
Equity Value = max(0, EV + Cash - Debt - Fees)
```

### Distribution Order
1. **Pay Preferences**: Classes paid in seniority order (most senior first)
   - If insufficient funds: pro-rata allocation within seniority bucket
2. **Participating Preferred**: Gets preference + participation in remainder
   - Cap enforced if present
3. **Non-Participating Preferred**: Chooses max(preference, conversion value)
   - Iteratively determines which classes convert
4. **Common**: Receives remaining proceeds

### Key Concepts
- **Seniority**: Lower group number = more senior = paid first
- **Pari Passu**: Same seniority group = split pro-rata by claim
- **Non-Participating**: Takes preference OR converts to common (whichever is better)
- **Participating**: Takes preference AND participates with common
- **Participation Cap**: Limits total proceeds for participating preferred

## Project Structure

```
src/
├── app/
│   ├── page.tsx          # Main application page
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/
│   ├── CompanySettings.tsx
│   ├── ShareholderTable.tsx
│   ├── ClassTerms.tsx
│   ├── AdvancedSettings.tsx
│   ├── WaterfallTable.tsx
│   ├── ExplanationPanel.tsx
│   └── ExcelExport.tsx
├── hooks/
│   └── useWaterfallState.ts  # State management hook
├── lib/
│   ├── waterfall.ts      # Core calculation engine
│   ├── excel-export.ts   # Excel export logic
│   └── format.ts         # Formatting utilities
├── types/
│   └── index.ts          # TypeScript interfaces
└── __tests__/
    └── waterfall.test.ts # Unit tests
```

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Excel Export**: SheetJS (xlsx)
- **Testing**: Vitest

## Deployment

This app is configured for deployment on Vercel:

1. Push to GitHub
2. Import project in Vercel
3. Deploy (no additional configuration needed)

All calculations run client-side, so no backend is required.

## Testing

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run
```

The calculation engine has comprehensive unit tests covering:
- Basic preference payouts
- Non-participating conversion decisions
- Participating preferred with caps
- Seniority and pari passu scenarios
- Shareholder allocation
- Edge cases

## License

MIT
