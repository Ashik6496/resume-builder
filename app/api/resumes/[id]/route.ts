import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/mongodb";
import { isResumeData, type Resume } from "@/lib/resume";
import { getSession } from "@/lib/session";

type ResumeRecord = {
  _id: ObjectId;
  userId: string;
  title: string;
  data: Resume;
  createdAt: Date;
  updatedAt: Date;
};

type RouteContext = { params: Promise<{ id: string }> };

async function getOwnedRecord(id: string, userId: string) {
  if (!ObjectId.isValid(id)) return null;
  return (await getDatabase()).collection<ResumeRecord>("resumes").findOne({
    _id: new ObjectId(id),
    userId,
  });
}

export async function GET(_request: Request, { params }: RouteContext) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Sign in to continue." }, { status: 401 });
  const { id } = await params;

  try {
    const record = await getOwnedRecord(id, session.userId);
    if (!record) return Response.json({ error: "Resume not found." }, { status: 404 });
    return Response.json({ id: record._id.toString(), title: record.title, data: record.data });
  } catch (error) {
    console.error("Unable to load resume", error);
    return Response.json({ error: "Unable to load this resume." }, { status: 503 });
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Sign in to continue." }, { status: 401 });
  const { id } = await params;
  if (!ObjectId.isValid(id)) return Response.json({ error: "Resume not found." }, { status: 404 });
  const body = (await request.json().catch(() => null)) as { data?: unknown } | null;
  if (!isResumeData(body?.data)) {
    return Response.json({ error: "Resume data is invalid." }, { status: 400 });
  }

  try {
    const result = await (await getDatabase()).collection<ResumeRecord>("resumes").updateOne(
      { _id: new ObjectId(id), userId: session.userId },
      {
        $set: {
          data: body.data,
          title: body.data.name.trim() || "Untitled resume",
          updatedAt: new Date(),
        },
      },
    );
    if (!result.matchedCount) return Response.json({ error: "Resume not found." }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Unable to save resume", error);
    return Response.json({ error: "Unable to save your changes." }, { status: 503 });
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Sign in to continue." }, { status: 401 });
  const { id } = await params;
  if (!ObjectId.isValid(id)) return Response.json({ error: "Resume not found." }, { status: 404 });

  try {
    const result = await (await getDatabase()).collection<ResumeRecord>("resumes").deleteOne({
      _id: new ObjectId(id),
      userId: session.userId,
    });
    if (!result.deletedCount) return Response.json({ error: "Resume not found." }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Unable to delete resume", error);
    return Response.json({ error: "Unable to delete this resume." }, { status: 503 });
  }
}
