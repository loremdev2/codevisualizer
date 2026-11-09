#!/usr/bin/env bash
# Applies every migration in supabase/migrations/ to the remote project over
# HTTPS using the Supabase Management API. Unlike `supabase db push`, this
# needs NO direct Postgres connection and NO database password — just a
# personal access token. Use it when port 5432 is blocked by a firewall/VPN.
set -euo pipefail

REF="egcqvkcirxkynjaakrsr"
TOKEN="${SUPABASE_ACCESS_TOKEN:-}"

if [[ -z "$TOKEN" ]]; then
  echo "Missing access token. Create one at:"
  echo "  https://supabase.com/dashboard/account/tokens"
  echo ""
  echo "Then run:"
  echo "  SUPABASE_ACCESS_TOKEN='your-token' npm run db:apply"
  exit 1
fi

# Concatenate all migrations in filename order into a single query.
QUERY=""
for file in supabase/migrations/*.sql; do
  QUERY+="$(cat "$file")
"
done

node -e '
  const [token, ref, query] = process.argv.slice(1);
  fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  }).then(async (res) => {
    const body = await res.text();
    if (!res.ok) {
      console.error("Error", res.status, body.slice(0, 600));
      process.exit(1);
    }
    console.log("Applied migrations successfully (HTTP", res.status + ").");
  }).catch((err) => {
    console.error("Request failed:", err.message);
    process.exit(1);
  });
' "$TOKEN" "$REF" "$QUERY"
