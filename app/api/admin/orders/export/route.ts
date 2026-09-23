import { NextResponse } from "next/server";
import { listOrders, ordersToCsv } from "../../../../lib/orders.server";

export async function GET() {
  const orders = await listOrders();
  const csv = ordersToCsv(orders);
  const filename = `homevibe-orders-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
