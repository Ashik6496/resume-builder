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

export async function GET() {
  const session = await getSession();
  if (!session) return Response.json({ error: "Sign in to continue." }, { status: 401 });

  try {
    const records = await (await getDatabase())
      .collection<ResumeRecord>("resumes")
      .find({ userId: session.userId }, { projection: { data: 0 } })
      .sort({ updatedAt: -1 })
      .toArray();
    return Response.json({
      resumes: records.map(({ _id, title, updatedAt }) => ({
        id: _id.toString(),
        title,
        updatedAt: updatedAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Unable to load resumes", error);
    return Response.json({ error: "Unable to load your resumes." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Sign in to continue." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { data?: unknown } | null;
  if (!isResumeData(body?.data)) {
    return Response.json({ error: "Resume data is invalid." }, { status: 400 });
  }

  try {
    const now = new Date();
    const record: Omit<ResumeRecord, "_id"> = {
      userId: session.userId,
      title: body.data.name.trim() || "Untitled resume",
      data: body.data,
      createdAt: now,
      updatedAt: now,
    };
    const result = await (await getDatabase()).collection("resumes").insertOne(record);
    return Response.json(
      { id: result.insertedId.toString(), title: record.title, data: body.data },
      { status: 201 },
    );
  } catch (error) {
    console.error("Unable to create resume", error);
    return Response.json({ error: "Unable to create your resume." }, { status: 503 });
  }
}
