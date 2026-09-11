import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@submitin/database";
import { auth } from "@/lib/auth";

/** DELETE /api/forms/[id]/invites/[inviteId] — cancela um link ainda não usado. */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; inviteId: string }> }
) {
  const { id, inviteId } = await params;
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { count } = await prisma.formInvite.deleteMany({
    where: { id: inviteId, formId: id, usedAt: null, form: { userId: session.user.id } },
  });
  if (count === 0) {
    return NextResponse.json({ error: "Link não encontrado ou já usado." }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
