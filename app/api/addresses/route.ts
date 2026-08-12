import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { addressSchema } from "@/lib/validators";
import { getUserAddresses } from "@/lib/queries";
import { handleError, ok } from "@/lib/api";

export async function GET() {
  try {
    const user = await requireUser();
    return ok({ addresses: await getUserAddresses(user.id) });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const data = addressSchema.parse(await request.json());

    const count = await prisma.address.count({ where: { userId: user.id } });
    const isDefault = data.isDefault || count === 0;

    if (isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId: user.id,
        fullName: data.fullName,
        phone: data.phone,
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || null,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        isDefault,
      },
    });

    return ok({ address }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
