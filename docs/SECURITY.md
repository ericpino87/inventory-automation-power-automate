# Public portfolio publishing checklist

This repository deliberately uses fictional SKUs, brands, costs, quantities, product descriptions and ETA comments.

Before publishing anything taken from real projects, obtain written permission from the organization and have the following reviewed:

- [ ] Ownership and intellectual-property rights to publish code and process documentation.
- [ ] Removal of actual ERP exports, stock, costs, suppliers, customers and employee identities.
- [ ] Removal of production Office Scripts, SharePoint paths, workspace IDs and workbook links.
- [ ] Removal of Power Automate exported connections, tokens, service accounts and environment IDs.
- [ ] Removal of actual email addresses, signatures, internal URLs, screenshots and metadata.
- [ ] Check that git history never contained secrets or confidential artifacts.
- [ ] Review whether the flow diagram discloses internal security architecture.
- [ ] Confirm that any metrics in the CV are measured and approved for external use.

**Important:** `.gitignore` cannot retroactively prevent exposure of files previously committed. Never push production backups or original company spreadsheets.

This repository intentionally has no automatic publishing, connectors, tokens or network calls.
