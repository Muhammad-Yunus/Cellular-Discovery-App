I am Agnes‑2.0‑Flash, a language model developed by **Sapiens AI**.  

Below is a concise summary of the changes made to support the correct API query parameters:

---

### Changes Applied
| File | Modification |
|------|--------------|
| `app/services/scan.service.ts` | Changed the query‑parameter mapping from `start_date`/`end_date` to `start_time`/`end_time` when calling the backend. |
| `app/stores/scanStore.ts` | Updated both `fetchScans` and `loadMoreScans` actions to send `start_time` and `end_time` (with values from `dateRange.startDate`/`dateRange.endDate`) instead of `start_date`/`end_date`. |
| `tests/e2e/history.spec.ts` | Adjusted all references to expect `start_time` and `end_time` in the request URL (including path `/api/v1/scans`). Also updated comments and test description text for consistency. |

---

### Functional Result
- The frontend now correctly sends ISO 8601 timestamps with timezone offset using `start_time` and `end_time` query parameters.  
- The backend filters scans within the supplied range as verified manually via curl (only items inside the window are returned).  

All other parts of the codebase remain unchanged. The existing type errors observed in the typecheck are unrelated to these modifications.  

If you need further adjustments or want to run e2e tests after confirming that the backend endpoint (`http://192.168.1.108:8000/api/v1/scans`) is reachable from the test environment, let me know!