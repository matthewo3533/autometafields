# Metafield Rule System Documentation

## Overview
This Shopify app automatically assigns product metafields based on configurable rules. Rules are based on product collection membership and define which metafield to assign and its value. The app supports automatic assignment on product creation/update, a manual trigger, and provides a UI for rule management and log viewing.

## Features
- Auto-assign metafields to products based on collection membership
- Reacts to product creation and update events via Shopify webhooks
- Manual trigger to apply rules to all products
- UI for managing rules (add, edit, delete)
- Log viewer for tracking assignment attempts (success/failure)

## Rule Example
```json
{
  "collectionTitle": "Amethyst",
  "metafield": {
    "namespace": "custom",
    "key": "zodiac_category",
    "type": "single_line_text_field",
    "value": "Pisces",
    "owner_resource": "product"
  }
}
```

## API Endpoints
- `GET /api/rules` — List all rules
- `POST /api/rules` — Create, update, or delete a rule (use `{ _method: 'create'|'update'|'delete', rule, id }`)
- `GET /api/logs` — List recent metafield assignment logs

## UI Usage
- **Rule Manager**: Add, edit, or delete rules. Each rule specifies a collection, metafield namespace/key/type/value, and owner resource.
- **Manual Trigger**: Button to apply all rules to all products in the store.
- **Log Viewer**: Table showing recent assignment attempts, including status, product, rule, and error messages if any.

## Project Management Notes
- Rules and logs are stored in the database using Prisma models (`MetafieldRule`, `MetafieldLog`).
- Webhooks for `products/create` and `products/update` are registered in `shopify.app.toml` and handled in the app.
- The main dashboard UI is implemented in `app/routes/_index/route.jsx`.
- Backend logic for rule application is in `app/services/metafields.server.js`.

## Future Improvements
- Pagination for products/logs
- More complex rule conditions (e.g., tags, vendors)
- Bulk product processing for large stores
- Enhanced error handling and notifications 