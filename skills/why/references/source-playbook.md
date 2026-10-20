# Source playbooks

The why skill (`skill://why`) spawns one investigator per available evidence category, each reading a single source-specific playbook below. The playbooks are concrete examples for common MCPs. Adapt them for a different MCP in the same category, or for the installed skill or CLI that reaches that source (`atlassian` for Jira and Confluence, `slack-cli` for Slack, `gh` and `issue://<number>` for GitHub Issues). A source the session cannot reach is reported as unavailable, never invented.

| Category | Playbook | Example MCP it documents |
|---|---|---|
| Source control history | [`code-archaeology.md`](skill://why/references/sources/code-archaeology.md) | git, `gh` |
| Issue / ticket tracker | [`linear.md`](skill://why/references/sources/linear.md) | Linear (adapt for Jira, GitHub Issues, Plane, Shortcut) |
| Long-form documents | [`notion.md`](skill://why/references/sources/notion.md) | Notion (adapt for Confluence, Google Docs, Coda) |
| Real-time team chat | [`slack.md`](skill://why/references/sources/slack.md) | Slack (adapt for Discord, Microsoft Teams, Mattermost) |
| Infrastructure observability | [`datadog.md`](skill://why/references/sources/datadog.md) | Datadog (adapt for New Relic, Honeycomb, Grafana, Splunk) |
| Error / exception tracking | [`sentry.md`](skill://why/references/sources/sentry.md) | Sentry (adapt for Rollbar, Bugsnag, Airbrake) |
| Product analytics warehouse | [`databricks.md`](skill://why/references/sources/databricks.md) | Databricks SQL (adapt for Snowflake, BigQuery, ClickHouse, dbt) |

Cross-cutting:

- [`incident-postmortem.md`](skill://why/references/sources/incident-postmortem.md). Add this if the target code looks defensive (null checks, retry, timeout, rate limit, feature flag, egress guard, OOM handler).
