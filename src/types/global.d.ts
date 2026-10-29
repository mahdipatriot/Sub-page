import type { UserInfo, ConfigData, ChartData, AppClient } from "./user";

// P5.11: InitialData is the shape of the JSON embedded in the
// <script type="application/json" id="initial-data"> tag in index.html.
// Read via getInitialData() from @/lib/initialData.
export interface InitialData {
  user?: UserInfo; // User data as structured object from template
  links?: string[];
  apps?: AppClient[];
}

export {};
