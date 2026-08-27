# Admin promotion — multiple administrators

The website supports **multiple admins at the same time**. Promoting a user adds admin access; existing admins are not removed or replaced.

## Demo admin (seed)

After `npm run seed` in `server/`:

| Field | Default |
|-------|---------|
| Email | `s8139428@live.vu.edu.au` |
| Student ID | `S8139428` |
| Password | `Admin@12345` |

Override with `ADMIN_EMAIL`, `ADMIN_STUDENT_ID`, `ADMIN_PASSWORD` in `.env`.

## Add a second admin (UI)

1. Log in at **Admin login** (`/login/admin`) with the seed admin account.
2. Open **Admin Dashboard** → **Admins** tab (`/admin?tab=admins`).
3. In **Add administrator**, search by email or student ID (e.g. a registered voter).
4. Click **Add as Admin** and confirm.
5. The **Current administrators** table should list both accounts.

The promoted user can log in via `/login/admin` with their existing password.

## API (admin-only, Bearer token)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/admin/users/admins` | List all administrators |
| `POST` | `/api/admin/users/:id/promote` | Add admin role (keeps other admins) |
| `POST` | `/api/admin/users/:id/role` | Generic role change (audit logged; blocks demoting the only admin) |

Promotion writes an audit log event `USER_PROMOTED_TO_ADMIN`. Unverified users can be promoted; the API returns a `warning` field and the UI shows a toast.

## Notes

- There is **no “transfer rights”** flow — only add-admin in the dashboard.
- Demote UI is intentionally omitted; the generic role endpoint exists for API use only.
