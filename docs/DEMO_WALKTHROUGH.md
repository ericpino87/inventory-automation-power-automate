# Five-minute local walkthrough

1. Install Node.js 20+ (no third-party packages required).
2. From the repository root, run `npm test`.
3. Run `npm run demo`.
4. Open `demo/output/inventory_report.csv` or `assets/demo-report.xlsx`.
5. Inspect the records:
   - `A-DEMO-T14` combines two warehouse rows and follows an explicit commercial rule.
   - `A-DEMO-F14` is identified from its model, generation and CPU; ETA resolves after a demo SKU-prefix normalization.
   - `B-DEMO-E14` does **not** appear because both stock indicators are zero.
   - The unrelated warehouse 3 row is ignored.
   - `O-DEMO-MONITOR` remains `REVIEW_REQUIRED`, highlighting an unresolved classification rather than guessing.

Expected summary: 9 ERP rows, 5 unique SKUs, 4 reported products, 1 classification review required.

The `office-scripts/` folder contains illustrative cloud adapters, separate from the locally tested Node.js core. They require Microsoft 365 setup and should **not** be pasted into a live environment without review.
