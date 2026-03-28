/**
 * Azure DevOps connector — fetches work items from ADO boards.
 */

import { getADOCredentials } from "../credentials.js";

export interface ADOConfig {
  orgUrl: string;
  project: string;
  pat: string;
}

export interface WorkItem {
  id: number;
  title: string;
  state: string;
  type: string;
  assignedTo: string;
}

/** Load ADO config from credentials file. Returns null if not configured. */
export function loadADOConfig(): ADOConfig | null {
  const creds = getADOCredentials();
  if (!creds) return null;
  return { orgUrl: creds.org_url.replace(/\/+$/, ""), project: creds.project, pat: creds.pat };
}

function authHeader(pat: string): string {
  return `Basic ${Buffer.from(`:${pat}`).toString("base64")}`;
}

/**
 * Fetch active work items assigned to the current user.
 * Uses WIQL to query, then batch-fetches work item details.
 */
export async function fetchActiveWorkItems(config: ADOConfig): Promise<WorkItem[]> {
  const { orgUrl, project, pat } = config;

  // Step 1: WIQL query for work item IDs
  const wiqlUrl = `${orgUrl}/${project}/_apis/wit/wiql?api-version=7.1`;
  const wiqlBody = {
    query: `SELECT [System.Id] FROM WorkItems WHERE [System.AssignedTo] = @me AND [System.State] NOT IN ('Closed', 'Completed', 'Done', 'Removed') ORDER BY [Microsoft.VSTS.Common.Priority] ASC, [System.ChangedDate] DESC`,
  };

  const wiqlRes = await fetch(wiqlUrl, {
    method: "POST",
    headers: {
      Authorization: authHeader(pat),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(wiqlBody),
  });

  if (!wiqlRes.ok) {
    const text = await wiqlRes.text();
    throw new Error(`ADO WIQL query failed (${wiqlRes.status}): ${text}`);
  }

  const wiqlData = (await wiqlRes.json()) as { workItems: { id: number }[] };
  const ids = wiqlData.workItems.map((wi) => wi.id);

  if (ids.length === 0) return [];

  // Step 2: Batch fetch work item details (max 200 per request)
  const batchIds = ids.slice(0, 200);
  const fields = "System.Id,System.Title,System.State,System.WorkItemType,System.AssignedTo";
  const detailUrl = `${orgUrl}/${project}/_apis/wit/workitems?ids=${batchIds.join(",")}&fields=${fields}&api-version=7.1`;

  const detailRes = await fetch(detailUrl, {
    headers: { Authorization: authHeader(pat) },
  });

  if (!detailRes.ok) {
    const text = await detailRes.text();
    throw new Error(`ADO work items fetch failed (${detailRes.status}): ${text}`);
  }

  const detailData = (await detailRes.json()) as {
    value: Array<{
      id: number;
      fields: {
        "System.Title": string;
        "System.State": string;
        "System.WorkItemType": string;
        "System.AssignedTo"?: { displayName: string };
      };
    }>;
  };

  return detailData.value.map((wi) => ({
    id: wi.id,
    title: wi.fields["System.Title"],
    state: wi.fields["System.State"],
    type: wi.fields["System.WorkItemType"],
    assignedTo: wi.fields["System.AssignedTo"]?.displayName ?? "",
  }));
}
