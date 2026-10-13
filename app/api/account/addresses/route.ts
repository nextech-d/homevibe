import { NextResponse } from "next/server";
import {
  createSavedAddress,
  deleteSavedAddress,
  getCurrentUser,
  listUserAddresses,
} from "../../../lib/users.server";
import { rejectCrossSiteWrite } from "../../../lib/same-origin.server";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  const addresses = await listUserAddresses(user.id);
  return NextResponse.json({ success: true, addresses });
}

export async function POST(request: Request) {
  const refused = rejectCrossSiteWrite(request);
  if (refused) return refused;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json()) as {
    label?: string;
    addressLine?: string;
    city?: string;
    isDefault?: boolean;
  };

  if (!body.addressLine?.trim() || !body.city?.trim()) {
    return NextResponse.json(
      { success: false, message: "Address and city are required." },
      { status: 400 }
    );
  }

  const address = await createSavedAddress(user.id, {
    label: body.label ?? "Home",
    addressLine: body.addressLine,
    city: body.city,
    isDefault: body.isDefault,
  });

  return NextResponse.json({ success: true, address });
}

export async function DELETE(request: Request) {
  const refused = rejectCrossSiteWrite(request);
  if (refused) return refused;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));
  if (!id) {
    return NextResponse.json({ success: false, message: "Address id required." }, { status: 400 });
  }

  const deleted = await deleteSavedAddress(user.id, id);
  if (!deleted) {
    return NextResponse.json({ success: false, message: "Address not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
