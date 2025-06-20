module.exports = {
  projectName: "Budget App v2",
  projectDescription: "Paycheck-period focused zero-based budgeting app with envelope method",
  frameworkType: "nextjs",
  language: "typescript",
  
  codebaseContext: {
    architecture: "Next.js 15 App Router + Supabase + TypeScript",
    patterns: [
      "Zero-based budgeting with envelope method",
      "Paycheck period driven (semi-monthly cycles)",
      "Enhanced frequency system for recurring items",
      "Household sharing with permissions"
    ],
    keyFiles: [
      "src/app/(dashboard)/budget-setup/",
      "src/types/frequency.ts",
      "src/lib/services/frequency-calculator.ts"
    ]
  },

  integration: {
    cursor: true,
    terminal: true
  },

  taskCategories: [
    "budget-setup",
    "frequency-system", 
    "api-endpoints",
    "ui-components",
    "testing"
  ]
};
