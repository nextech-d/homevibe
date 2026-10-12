import { Hono } from "hono";
import { getDashboardData } from "../../lib/dashboard.js";
import { clientErrorMessage } from "../../../../shared/client-errors.js";

export const adminDashboardRoute = new Hono();

adminDashboardRoute.get("/", async (c) => {
  try {
    const dashboard = await getDashboardData();
    return c.json({ success: true, dashboard });
  } catch (error) {
    const message = clientErrorMessage(error, "Failed to load dashboard.");
    return c.json({ success: false, message }, 500);
  }
});
