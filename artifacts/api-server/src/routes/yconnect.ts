import { Router, type IRouter, type Request, type Response } from "express";
import { createHash } from "node:crypto";

type Role =
  | "admin"
  | "case_manager"
  | "champion"
  | "treatment_supporter"
  | "mentor_mother"
  | "facility_officer"
  | "counsellor"
  | "me_officer";

type User = {
  id: number;
  name: string;
  email: string;
  role: Role;
  roleLabel: string;
  initials: string;
  district: string;
  status: string;
  passwordHash: string;
};

const roles: Record<Role, { label: string; permissions: string[] }> = {
  admin: {
    label: "System administrator",
    permissions: ["dashboard.view", "reports.view", "audit.view", "admin.users", "admin.directory", "admin.content"],
  },
  case_manager: {
    label: "Community case manager",
    permissions: ["dashboard.view", "cases.view", "cases.edit", "referrals.manage", "followup.manage", "eid.manage", "connect.manage", "rights.escalate", "safeguarding.manage", "reports.view", "admin.directory"],
  },
  champion: {
    label: "Y-CONNECT Champion",
    permissions: ["dashboard.view", "cases.view", "cases.edit", "referrals.manage", "followup.manage", "connect.manage", "rights.escalate"],
  },
  treatment_supporter: {
    label: "Adolescent Treatment Supporter",
    permissions: ["dashboard.view", "cases.view", "cases.edit", "followup.manage"],
  },
  mentor_mother: {
    label: "Mentor Mother",
    permissions: ["dashboard.view", "cases.view", "cases.edit", "followup.manage", "eid.manage"],
  },
  facility_officer: {
    label: "Facility data officer",
    permissions: ["dashboard.view", "cases.view", "cases.edit", "referrals.manage", "followup.manage"],
  },
  counsellor: {
    label: "Psychosocial counsellor",
    permissions: ["dashboard.view", "rights.escalate"],
  },
  me_officer: {
    label: "Programme / M&E officer",
    permissions: ["dashboard.view", "reports.view"],
  },
};

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

// Demonstration auth only: SHA-256 of the shared demo password "Password123!".
// A production build would use a salted, slow hash (bcrypt/Argon2) behind a real server boundary.
const DEMO_PASSWORD_HASH = sha256("Password123!");

let users: User[] = [
  ["Amina Mensah", "admin@yconnect.test", "admin", "AM", "Kumasi"],
  ["Kojo Owusu", "casemanager@yconnect.test", "case_manager", "KO", "Kumasi"],
  ["Efua Boateng", "champion@yconnect.test", "champion", "EB", "Kumasi"],
  ["Yaw Asare", "supporter@yconnect.test", "treatment_supporter", "YA", "Accra"],
  ["Akosua Antwi", "mentormother@yconnect.test", "mentor_mother", "AA", "Kumasi"],
  ["Nana Kusi", "facility@yconnect.test", "facility_officer", "NK", "Accra"],
  ["Adjoa Frimpong", "counsellor@yconnect.test", "counsellor", "AF", "Kumasi"],
  ["Kwame Osei", "me@yconnect.test", "me_officer", "KO", "Accra"],
].map(([name, email, role, initials, district], index) => ({
  id: index + 1,
  name,
  email,
  role: role as Role,
  roleLabel: roles[role as Role].label,
  initials,
  district,
  status: "active",
  passwordHash: DEMO_PASSWORD_HASH,
}));

let content = [
  { id: 1, title: "A simple guide to protecting yourself", slug: "protecting-yourself", category: "prevention", mediaType: "article", excerpt: "Small choices can help you feel more confident about your health.", body: "You have the right to clear information and respectful services. Condoms, testing, prevention options, and talking with a trained supporter can all help you choose your next step. Services are confidential and you can ask questions at your own pace.", duration: "4 min read", featured: true },
  { id: 2, title: "What to expect when you visit a service", slug: "your-first-visit", category: "wellbeing", mediaType: "article", excerpt: "A calm, practical look at finding help and asking questions.", body: "You can ask what will happen before you begin. A trusted service should listen, explain your options, and protect your privacy. If one place does not feel right, you can ask for another pathway.", duration: "3 min read", featured: true },
  { id: 3, title: "Understanding self-testing", slug: "understanding-self-testing", category: "prevention", mediaType: "article", excerpt: "Know the steps, the limits, and where to go for confirmation.", body: "Self-testing can be a private first step. Follow the instructions carefully and speak with a qualified provider about any result. A self-test does not replace confirmatory testing or a clinical assessment.", duration: "5 min read", featured: true },
  { id: 4, title: "A conversation about staying in care", slug: "staying-in-care", category: "treatment", mediaType: "video", excerpt: "Peer voices on making appointments work for real life.", body: "This short community story shares practical ways to ask for support when appointments, transport, or privacy become difficult.", duration: "06:20", featured: false },
  { id: 5, title: "Pregnancy, newborn care, and support", slug: "pregnancy-and-newborn-care", category: "pmtct", mediaType: "article", excerpt: "Where pregnant adolescents and young mothers can find respectful support.", body: "Pregnant adolescents and young mothers deserve kind, confidential care. A mentor mother or trained provider can help you plan visits and understand newborn milestones.", duration: "4 min read", featured: false },
  { id: 6, title: "Keeping a newborn's milestones in view", slug: "newborn-milestones", category: "eid", mediaType: "video", excerpt: "A gentle explainer about follow-up visits and returned results.", body: "Keeping the next milestone visible can make follow-up easier. Ask your supporter to help you find a service when travel or timing changes.", duration: "04:45", featured: false },
  { id: 7, title: "You deserve respect", slug: "you-deserve-respect", category: "rights", mediaType: "article", excerpt: "Your privacy, choices, and dignity matter at every service point.", body: "You can ask questions, request privacy, and expect respectful, non-discriminatory care. If something feels unsafe or unfair, you can report a concern or request support.", duration: "3 min read", featured: false },
  { id: 8, title: "Talking about health with someone you trust", slug: "talking-with-someone", category: "stigma", mediaType: "article", excerpt: "Ideas for choosing a safe person and starting a hard conversation.", body: "You do not have to share more than you want to. Start with the kind of support you need, and choose someone who listens without pressure.", duration: "3 min read", featured: false },
].map((item) => ({ ...item, reviewStatus: "approved" as string }));

type ServicePoint = {
  id: number;
  name: string;
  type: string;
  district: string;
  address: string;
  latitude: number;
  longitude: number;
  services: string[];
  hours: string;
  phone: string;
};

let services: ServicePoint[] = [
  [1, "Community Health Point A", "community", "Kumasi", "Near Adum Market, Kumasi", 6.695, -1.625, ["testing", "hivst", "condoms"], "Mon–Sat · 08:00–17:00", "030 000 0101"],
  [2, "Asokwa Youth Wellness Hub", "cso", "Kumasi", "Lake Road, Asokwa", 6.67, -1.59, ["testing", "prep", "psychosocial"], "Mon–Fri · 09:00–18:00", "030 000 0102"],
  [3, "Bantama Community Clinic", "facility", "Kumasi", "Bantama High Street", 6.705, -1.65, ["testing", "art", "pmtct", "eid"], "Every day · 08:00–16:00", "030 000 0103"],
  [4, "Nhyiaeso Safe Space", "cso", "Kumasi", "Garden City Avenue", 6.68, -1.61, ["condoms", "psychosocial", "prep"], "Tue–Sat · 10:00–18:00", "030 000 0104"],
  [5, "Kumasi North Service Point", "facility", "Kumasi", "Mampong Road, North", 6.73, -1.62, ["testing", "hivst", "art"], "Mon–Fri · 08:00–15:00", "030 000 0105"],
  [6, "Accra Central Youth Desk", "community", "Accra", "Independence Avenue", 5.56, -0.2, ["testing", "hivst", "condoms"], "Mon–Sat · 08:00–17:00", "030 000 0201"],
  [7, "Osu Wellbeing Centre", "cso", "Accra", "Oxford Street, Osu", 5.556, -0.182, ["prep", "psychosocial", "condoms"], "Mon–Fri · 10:00–18:00", "030 000 0202"],
  [8, "Labadi Link Clinic", "facility", "Accra", "La Road, Labadi", 5.56, -0.15, ["testing", "art", "pmtct", "eid"], "Every day · 08:00–16:00", "030 000 0203"],
  [9, "Madina Community Health Point", "community", "Accra", "Zongo Junction, Madina", 5.68, -0.17, ["testing", "hivst", "condoms"], "Mon–Sat · 08:00–17:00", "030 000 0204"],
  [10, "Akyem Riverside Outreach", "community", "Eastern Corridor", "Riverside Road, Akyem", 6.1, -0.45, ["testing", "condoms", "psychosocial"], "Wed–Sat · 09:00–16:00", "030 000 0301"],
  [11, "Sunrise PMTCT Link", "facility", "Eastern Corridor", "Community One, Akyem", 6.08, -0.44, ["pmtct", "eid", "testing"], "Mon–Fri · 08:00–15:00", "030 000 0302"],
  [12, "Koforidua Prevention Corner", "pharmacy", "Eastern Corridor", "Main Street, Koforidua", 6.09, -0.26, ["hivst", "condoms"], "Mon–Sat · 08:00–19:00", "030 000 0303"],
].map(([id, name, type, district, address, latitude, longitude, serviceList, hours, phone]) => ({ id: Number(id), name: String(name), type: String(type), district: String(district), address: String(address), latitude: Number(latitude), longitude: Number(longitude), services: serviceList as string[], hours: String(hours), phone: String(phone) }));

let cases = [
  [1, "YC-000123", "Case 123", "prevention", "Kumasi", "active", "moderate", "Efua Boateng", "given"],
  [2, "YC-000124", "Case 124", "alhiv", "Kumasi", "re_engaged", "elevated", "Efua Boateng", "pending"],
  [3, "YC-000125", "Case 125", "pregnant", "Kumasi", "active", "moderate", "Akosua Antwi", "given"],
  [4, "YC-000126", "Case 126", "caregiver", "Kumasi", "active", "elevated", "Akosua Antwi", "not_required"],
  [5, "YC-000127", "Case 127", "prevention", "Accra", "active", "low", "Yaw Asare", "given"],
  [6, "YC-000128", "Case 128", "alhiv", "Accra", "active", "urgent", "Yaw Asare", "withdrawn"],
  [7, "YC-000129", "Case 129", "pregnant", "Kumasi", "active", "elevated", "Akosua Antwi", "pending"],
  [8, "YC-000130", "Case 130", "caregiver", "Accra", "closed", "low", "Nana Kusi", "given"],
  [9, "YC-000131", "Case 131", "prevention", "Kumasi", "active", "moderate", "Efua Boateng", "not_required"],
  [10, "YC-000132", "Case 132", "alhiv", "Accra", "re_engaged", "elevated", "Yaw Asare", "given"],
].map(([id, caseRef, alias, subtype, district, status, riskLevel, assignedTo, consentStatus]) => ({ id, caseRef, alias, subtype, district, status, riskLevel, assignedTo, consentStatus }));

let followups = [
  { id: 1, caseId: 1, caseRef: "YC-000123", alias: "Case 123", type: "missed_appointment", dueDate: "2026-09-04", assignedTo: "Kojo Owusu", status: "open", barrier: "", alternativePathway: "", overdue: true },
  { id: 2, caseId: 2, caseRef: "YC-000124", alias: "Case 124", type: "at_risk", dueDate: "2026-09-06", assignedTo: "Efua Boateng", status: "in_progress", barrier: "Confidentiality concern", alternativePathway: "Community service point", overdue: false },
  { id: 3, caseId: 3, caseRef: "YC-000125", alias: "Case 125", type: "pmtct", dueDate: "2026-09-09", assignedTo: "Akosua Antwi", status: "open", barrier: "", alternativePathway: "", overdue: false },
  { id: 4, caseId: 5, caseRef: "YC-000127", alias: "Case 127", type: "missed_appointment", dueDate: "2026-08-28", assignedTo: "Nana Kusi", status: "completed", barrier: "Transport cost", alternativePathway: "Nearer facility", overdue: true },
  { id: 5, caseId: 6, caseRef: "YC-000128", alias: "Case 128", type: "results_return", dueDate: "2026-09-12", assignedTo: "Kojo Owusu", status: "open", barrier: "", alternativePathway: "", overdue: false },
  { id: 6, caseId: 9, caseRef: "YC-000131", alias: "Case 131", type: "at_risk", dueDate: "2026-09-03", assignedTo: "Efua Boateng", status: "open", barrier: "", alternativePathway: "", overdue: true },
];

let referrals = [
  { id: 1, caseId: 1, caseRef: "YC-000123", targetService: "testing", servicePointId: 1, servicePoint: "Community Health Point A", status: "initiated", reason: "Requested a nearby service", initiatedAt: "2026-09-05T10:20:00Z", completionNotes: "" },
  { id: 2, caseId: 2, caseRef: "YC-000124", targetService: "prevention", servicePointId: 2, servicePoint: "Asokwa Youth Wellness Hub", status: "in_progress", reason: "Follow-up pathway", initiatedAt: "2026-09-03T08:30:00Z", completionNotes: "" },
  { id: 3, caseId: 3, caseRef: "YC-000125", targetService: "newborn support", servicePointId: 3, servicePoint: "Bantama Community Clinic", status: "completed", reason: "Milestone support", initiatedAt: "2026-08-25T09:00:00Z", completionNotes: "Connection confirmed by facility team." },
  { id: 4, caseId: 5, caseRef: "YC-000127", targetService: "prevention", servicePointId: 7, servicePoint: "Osu Wellbeing Centre", status: "completed", reason: "Requested support", initiatedAt: "2026-08-21T12:00:00Z", completionNotes: "Completed at service point." },
];

const milestoneNames = ["Birth sample", "6-week sample", "First result return", "9-month check", "18-month check", "Final outcome"];
let pairs = [1, 2, 3].map((id) => ({
  id,
  motherRef: `YC-00012${4 + id}`,
  infantRef: `INF-0000${44 + id}`,
  district: id === 2 ? "Accra" : "Kumasi",
  progress: id === 1 ? 50 : id === 2 ? 66 : 16,
  nextDue: id === 3 ? "2026-09-07" : id === 1 ? "2026-09-10" : "2026-09-18",
  milestones: milestoneNames.map((name, index) => ({
    id: id * 10 + index + 1,
    name,
    dueDate: new Date(Date.UTC(2026, index < 2 ? index + 1 : index + 2, 6 + index * 3 + id)).toISOString().slice(0, 10),
    status: index < (id === 1 ? 3 : id === 2 ? 4 : 1) ? "done" : index === 2 && id === 3 ? "missed" : "pending",
    result: index === 1 && id === 1 ? "negative" : "na",
  })),
}));

let supportRequests = [
  { id: 1, caseRef: "YC-000133", requestedRole: "champion", preferredContact: "call", message: "I would like to talk to someone.", status: "new", createdAt: "2026-09-06T08:40:00Z" },
  { id: 2, caseRef: "YC-000134", requestedRole: "counsellor", preferredContact: "in_app", message: "Could someone help me think through my options?", status: "assigned", createdAt: "2026-09-05T16:10:00Z" },
  { id: 3, caseRef: "YC-000135", requestedRole: "facility", preferredContact: "sms", message: "I need help finding a service.", status: "new", createdAt: "2026-09-05T11:20:00Z" },
];

let safeguardingReports = [
  { id: 1, reference: "SG-2026-0007", reporterType: "anonymous", category: "confidentiality", severity: "medium", description: "A concern about privacy at a service point.", status: "new", createdAt: "2026-09-05T13:10:00Z" },
  { id: 2, reference: "SG-2026-0006", reporterType: "community", category: "safeguarding", severity: "high", description: "A fictional urgent concern for demonstration.", status: "escalated", createdAt: "2026-09-02T09:05:00Z" },
  { id: 3, reference: "SG-2026-0005", reporterType: "staff", category: "discrimination", severity: "low", description: "A fictional report awaiting support.", status: "in_support", createdAt: "2026-08-30T15:25:00Z" },
];

let notifications = [
  { id: 1, userId: 2, title: "Follow-up due today", body: "YC-000123 has a task due today.", unread: true, createdAt: "2026-09-07T08:00:00Z" },
  { id: 2, userId: 2, title: "New connection request", body: "A new request is waiting to be assigned.", unread: true, createdAt: "2026-09-06T08:40:00Z" },
  { id: 3, userId: 5, title: "Milestone reminder", body: "INF-000047 has a milestone coming up.", unread: false, createdAt: "2026-09-05T09:00:00Z" },
  { id: 4, userId: 1, title: "Content awaiting review", body: "A learning resource is waiting for approval.", unread: true, createdAt: "2026-09-04T09:00:00Z" },
];

let reminders = [
  { id: 1, relatedType: "followup", relatedId: 3, recipientType: "cadre", recipientRef: "Akosua Antwi", channel: "in_app", message: "Reminder: a follow-up visit is due soon. Tap for details.", sendAt: "2026-09-08T08:00:00Z", status: "scheduled", createdAt: "2026-09-07T08:00:00Z" },
  { id: 2, relatedType: "eid", relatedId: 31, recipientType: "client", recipientRef: "YC-000127", channel: "sms_sim", message: "Reminder: your next visit is due. Tap for details.", sendAt: "2026-09-10T08:00:00Z", status: "scheduled", createdAt: "2026-09-07T08:00:00Z" },
  { id: 3, relatedType: "followup", relatedId: 4, recipientType: "cadre", recipientRef: "Nana Kusi", channel: "in_app", message: "Reminder: a completed case may need a check-in call.", sendAt: "2026-08-29T08:00:00Z", status: "sent", createdAt: "2026-08-28T08:00:00Z" },
];

let rightsEscalations = [
  { id: 1, caseRef: "YC-000124", note: "Requested clarity on confidentiality before continuing.", raisedBy: "Efua Boateng", status: "open", createdAt: "2026-09-05T09:30:00Z" },
];

let audits = [
  { id: 1, action: "followup.barrier", entity: "YC-000124", actor: "Efua Boateng", time: "Today · 09:42" },
  { id: 2, action: "referral.create", entity: "YC-000123", actor: "Kojo Owusu", time: "Today · 08:26" },
  { id: 3, action: "eid.result_return", entity: "INF-000045", actor: "Akosua Antwi", time: "Yesterday · 16:18" },
  { id: 4, action: "login", entity: "session", actor: "Amina Mensah", time: "Yesterday · 14:02" },
  { id: 5, action: "safeguarding.report", entity: "SG-2026-0007", actor: "Guest", time: "Yesterday · 13:10" },
];

let assessments: Array<{ band: string }> = [
  { band: "low" }, { band: "low" }, { band: "low" }, { band: "low" }, { band: "low" }, { band: "moderate" }, { band: "moderate" }, { band: "moderate" }, { band: "moderate" }, { band: "moderate" }, { band: "elevated" }, { band: "elevated" }, { band: "elevated" }, { band: "urgent" }, { band: "urgent" },
];

let assessmentResults = new Map<number, Record<string, unknown>>();

let nextId = 200;

// The self-assessment rubric: deterministic, versioned, and reviewable (no AI/ML anywhere).
// A single source of truth used both to render the question set and to score answers.
type RubricQuestion = {
  code: string;
  prompt: string;
  inputType: "boolean" | "single";
  yesScore?: number;
  safeguarding?: boolean;
  pmtct?: boolean;
  options?: Array<{ value: string; label: string; score: number }>;
};
const ENGINE_VERSION = "v1";
const RUBRIC: RubricQuestion[] = [
  { code: "last_test", prompt: "When was your last HIV test?", inputType: "single", options: [
    { value: "never", label: "I have never tested", score: 3 },
    { value: "over_year", label: "More than a year ago", score: 2 },
    { value: "within_year", label: "Within the last year", score: 1 },
    { value: "within_3m", label: "Within the last 3 months", score: 0 },
  ] },
  { code: "condomless_sex", prompt: "In the last 3 months, have you had sex without a condom?", inputType: "boolean", yesScore: 3 },
  { code: "multiple_partners", prompt: "Have you had more than one sexual partner recently?", inputType: "boolean", yesScore: 2 },
  { code: "partner_status_unknown", prompt: "Do you not know your partner's HIV status?", inputType: "boolean", yesScore: 2 },
  { code: "sti_symptoms", prompt: "Have you had any STI symptoms recently?", inputType: "boolean", yesScore: 2 },
  { code: "injection_sharing", prompt: "Have you shared needles or injecting equipment?", inputType: "boolean", yesScore: 3 },
  { code: "known_positive_partner", prompt: "Is a partner known to be living with HIV and not on treatment?", inputType: "boolean", yesScore: 3 },
  { code: "forced_sex", prompt: "Have you experienced forced or coerced sex?", inputType: "boolean", yesScore: 3, safeguarding: true },
  { code: "pregnant", prompt: "Are you currently pregnant or breastfeeding?", inputType: "boolean", yesScore: 1, pmtct: true },
];

function isYes(value: unknown) {
  return value === "yes" || value === true;
}

function scoreAssessment(answers: Record<string, unknown>) {
  let total = 0;
  for (const question of RUBRIC) {
    if (question.inputType === "boolean") {
      if (isYes(answers[question.code])) total += question.yesScore ?? 0;
    } else if (question.options) {
      const chosen = question.options.find((option) => option.value === answers[question.code]);
      if (chosen) total += chosen.score;
    }
  }
  let band = total >= 10 ? "urgent" : total >= 6 ? "elevated" : total >= 3 ? "moderate" : "low";
  if ((isYes(answers.known_positive_partner) || isYes(answers.injection_sharing)) && band !== "urgent") band = "elevated";
  const pregnant = isYes(answers.pregnant);
  const safeguardingFlag = isYes(answers.forced_sex);
  let pathway = band === "low"
    ? "Lower risk right now. Keep protecting yourself and test regularly."
    : band === "moderate"
      ? "Some risk factors. Testing and prevention services are recommended."
      : band === "elevated"
        ? "Several risk factors. Please test soon and consider prevention support."
        : "Please seek support and testing promptly. We can connect you now.";
  if (pregnant) pathway += " Since you mentioned pregnancy or breastfeeding, PMTCT information and a mentor-mother connection are available to you.";
  pathway += " This is not a diagnosis or an HIV test. It only suggests next steps.";
  return { total, band, pathway, urgent: band === "urgent", safeguardingFlag, pregnant, engineVersion: ENGINE_VERSION };
}

// Deep snapshot of the seeded state, taken once at startup, so "Reset demo data" can restore it exactly.
const SEED = structuredClone({ users, content, services, cases, followups, referrals, pairs, supportRequests, safeguardingReports, notifications, reminders, rightsEscalations, audits, assessments, assessmentResults, nextId });

function resetAll() {
  const clone = structuredClone(SEED);
  users = clone.users;
  content = clone.content;
  services = clone.services;
  cases = clone.cases;
  followups = clone.followups;
  referrals = clone.referrals;
  pairs = clone.pairs;
  supportRequests = clone.supportRequests;
  safeguardingReports = clone.safeguardingReports;
  notifications = clone.notifications;
  reminders = clone.reminders;
  rightsEscalations = clone.rightsEscalations;
  audits = clone.audits;
  assessments = clone.assessments;
  assessmentResults = clone.assessmentResults;
  nextId = clone.nextId;
}

function currentUser(req: Request): User | null {
  const id = Number(req.header("x-yc-user") ?? req.cookies?.yc_user ?? 0);
  return users.find((user) => user.id === id && user.status === "active") ?? null;
}

function requireStaff(req: Request, res: Response, permission?: string): User | null {
  const user = currentUser(req);
  if (!user) {
    res.status(401).json({ error: "Sign in required" });
    return null;
  }
  if (permission && !roles[user.role].permissions.includes(permission)) {
    res.status(403).json({ error: "You do not have permission to access this area." });
    return null;
  }
  return user;
}

function userPayload(user: User) {
  const { passwordHash: _passwordHash, ...safe } = user;
  return { ...safe, permissions: roles[user.role].permissions };
}

function addAudit(action: string, entity: string, actor: string) {
  audits.unshift({ id: ++nextId, action, entity, actor, time: "Just now" });
}

function notifyUser(userId: number, title: string, body: string) {
  notifications.unshift({ id: ++nextId, userId, title, body, unread: true, createdAt: new Date().toISOString() });
}

function notifyByName(name: string, title: string, body: string) {
  const user = users.find((entry) => entry.name === name);
  if (user) notifyUser(user.id, title, body);
}

function notificationsFor(user: User) {
  return notifications.filter((note) => note.userId === user.id).map(({ userId: _userId, ...safe }) => safe);
}

function findUsersWithPermission(permission: string) {
  return users.filter((user) => user.status === "active" && roles[user.role].permissions.includes(permission));
}

const router: IRouter = Router();

router.get("/content", (req, res) => {
  const category = String(req.query.category ?? "");
  const approved = content.filter((item) => item.reviewStatus === "approved");
  res.json(category ? approved.filter((item) => item.category === category) : approved);
});

router.get("/content/:slug", (req, res) => {
  const item = content.find((entry) => entry.slug === req.params.slug && entry.reviewStatus === "approved");
  item ? res.json(item) : res.status(404).json({ error: "Content not found" });
});

router.get("/admin/content", (req, res) => {
  if (!requireStaff(req, res, "admin.content")) return;
  res.json(content);
});

router.post("/admin/content", (req, res) => {
  const user = requireStaff(req, res, "admin.content");
  if (!user) return;
  const body = req.body ?? {};
  const title = String(body.title ?? "Untitled resource");
  const item = {
    id: ++nextId,
    title,
    slug: String(body.slug ?? title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")) || `resource-${nextId}`,
    category: String(body.category ?? "wellbeing"),
    mediaType: String(body.mediaType ?? "article"),
    excerpt: String(body.excerpt ?? ""),
    body: String(body.body ?? ""),
    duration: String(body.duration ?? "3 min read"),
    featured: Boolean(body.featured ?? false),
    reviewStatus: "draft",
  };
  content.unshift(item);
  addAudit("admin.content.create", item.slug, user.name);
  res.status(201).json(item);
});

router.patch("/admin/content/:id", (req, res) => {
  const user = requireStaff(req, res, "admin.content");
  if (!user) return;
  const item = content.find((entry) => entry.id === Number(req.params.id));
  if (!item) return res.status(404).json({ error: "Content not found" }) as never;
  const body = req.body ?? {};
  if (body.title !== undefined) item.title = String(body.title);
  if (body.category !== undefined) item.category = String(body.category);
  if (body.mediaType !== undefined) item.mediaType = String(body.mediaType);
  if (body.excerpt !== undefined) item.excerpt = String(body.excerpt);
  if (body.body !== undefined) item.body = String(body.body);
  if (body.duration !== undefined) item.duration = String(body.duration);
  if (body.featured !== undefined) item.featured = Boolean(body.featured);
  if (body.reviewStatus !== undefined) item.reviewStatus = String(body.reviewStatus);
  addAudit("admin.content.update", item.slug, user.name);
  res.json(item);
});

router.get("/services", (req, res) => {
  const district = String(req.query.district ?? "");
  const service = String(req.query.service ?? "");
  res.json(services.filter((item) => (!district || item.district === district) && (!service || item.services.includes(service))));
});

router.get("/services/:id", (req, res) => {
  const item = services.find((entry) => entry.id === Number(req.params.id));
  item ? res.json(item) : res.status(404).json({ error: "Service not found" });
});

router.post("/services", (req, res) => {
  const user = requireStaff(req, res, "admin.directory");
  if (!user) return;
  const body = req.body ?? {};
  const item: ServicePoint = {
    id: ++nextId,
    name: String(body.name ?? "New service point"),
    type: String(body.type ?? "community"),
    district: String(body.district ?? "Kumasi"),
    address: String(body.address ?? ""),
    latitude: Number(body.latitude ?? 6.69),
    longitude: Number(body.longitude ?? -1.62),
    services: Array.isArray(body.services) ? body.services.map(String) : String(body.services ?? "").split(",").map((entry: string) => entry.trim()).filter(Boolean),
    hours: String(body.hours ?? ""),
    phone: String(body.phone ?? ""),
  };
  services.unshift(item);
  addAudit("admin.directory.create", item.name, user.name);
  res.status(201).json(item);
});

router.patch("/services/:id", (req, res) => {
  const user = requireStaff(req, res, "admin.directory");
  if (!user) return;
  const item = services.find((entry) => entry.id === Number(req.params.id));
  if (!item) return res.status(404).json({ error: "Service not found" }) as never;
  const body = req.body ?? {};
  if (body.name !== undefined) item.name = String(body.name);
  if (body.type !== undefined) item.type = String(body.type);
  if (body.district !== undefined) item.district = String(body.district);
  if (body.address !== undefined) item.address = String(body.address);
  if (body.latitude !== undefined) item.latitude = Number(body.latitude);
  if (body.longitude !== undefined) item.longitude = Number(body.longitude);
  if (body.services !== undefined) item.services = Array.isArray(body.services) ? body.services.map(String) : String(body.services).split(",").map((entry: string) => entry.trim()).filter(Boolean);
  if (body.hours !== undefined) item.hours = String(body.hours);
  if (body.phone !== undefined) item.phone = String(body.phone);
  addAudit("admin.directory.update", item.name, user.name);
  res.json(item);
});

router.get("/assessment-questions", (_req, res) => {
  res.json({ engineVersion: ENGINE_VERSION, questions: RUBRIC.map(({ code, prompt, inputType, options }) => ({ code, prompt, inputType, options })) });
});

router.post("/assessments", (req, res) => {
  const answers = (req.body?.answers ?? {}) as Record<string, unknown>;
  const scored = scoreAssessment(answers);
  const result = { id: ++nextId, ...scored };
  assessments.push({ band: result.band });
  assessmentResults.set(result.id, result);
  addAudit("assessment.create", `assessment-${result.id}`, "Guest");
  res.status(201).json(result);
});

router.get("/assessments/:id", (req, res) => {
  const result = assessmentResults.get(Number(req.params.id));
  result ? res.json(result) : res.status(404).json({ error: "Assessment not found" });
});

router.post("/support-requests", (req, res) => {
  const request = { id: ++nextId, caseRef: `YC-${String(100 + nextId).padStart(6, "0")}`, requestedRole: String(req.body?.requestedRole ?? "champion"), preferredContact: String(req.body?.preferredContact ?? "in_app"), message: String(req.body?.message ?? ""), status: "new", createdAt: new Date().toISOString() };
  supportRequests.unshift(request);
  addAudit("connect.request", request.caseRef, "Guest");
  for (const user of findUsersWithPermission("connect.manage")) notifyUser(user.id, "New connection request", `${request.caseRef} is waiting to be assigned.`);
  res.status(201).json(request);
});

router.post("/safeguarding-reports", (req, res) => {
  const reference = `SG-2026-${String(safeguardingReports.length + 8).padStart(4, "0")}`;
  const report = { id: ++nextId, reference, reporterType: String(req.body?.reporterType ?? "anonymous"), category: String(req.body?.category ?? "other"), severity: String(req.body?.severity ?? "medium"), description: String(req.body?.description ?? ""), status: req.body?.severity === "high" ? "escalated" : "new", createdAt: new Date().toISOString() };
  safeguardingReports.unshift(report);
  addAudit("safeguarding.report", reference, "Guest");
  for (const user of findUsersWithPermission("safeguarding.manage")) notifyUser(user.id, "New safeguarding report", `A ${report.severity} severity report was received (${reference}).`);
  res.status(201).json({ reference, status: report.status });
});

router.post("/auth/login", (req, res) => {
  const email = String(req.body?.email ?? "").toLowerCase();
  const password = String(req.body?.password ?? "");
  const user = users.find((entry) => entry.email === email && entry.status === "active");
  if (!user || sha256(password) !== user.passwordHash) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  res.cookie("yc_user", String(user.id), { httpOnly: true, sameSite: "lax" });
  addAudit("login", "session", user.name);
  res.json(userPayload(user));
});

router.post("/auth/logout", (req, res) => {
  const user = currentUser(req);
  if (user) addAudit("logout", "session", user.name);
  res.clearCookie("yc_user");
  res.status(204).send();
});

router.get("/auth/me", (req, res) => {
  const user = currentUser(req);
  user ? res.json(userPayload(user)) : res.status(401).json({ error: "Not signed in" });
});

router.get("/notifications", (req, res) => {
  const user = requireStaff(req, res, "dashboard.view");
  if (!user) return;
  const items = notificationsFor(user);
  res.json({ items, unreadCount: items.filter((item) => item.unread).length });
});

router.post("/notifications/:id/read", (req, res) => {
  const user = requireStaff(req, res, "dashboard.view");
  if (!user) return;
  const note = notifications.find((entry) => entry.id === Number(req.params.id) && entry.userId === user.id);
  if (!note) return res.status(404).json({ error: "Notification not found" }) as never;
  note.unread = false;
  res.json({ id: note.id, title: note.title, body: note.body, unread: note.unread });
});

router.get("/dashboard/summary", (req, res) => {
  const user = requireStaff(req, res, "dashboard.view");
  if (!user) return;
  const metrics = user.role === "me_officer"
    ? [{ label: "Assessments this period", value: 15, detail: "Across all bands", href: "/reports", tone: "teal" }, { label: "Referral completion", value: 50, detail: "2 of 4 completed", href: "/reports", tone: "indigo" }, { label: "Follow-up tasks", value: 6, detail: "3 open · 2 overdue", href: "/reports", tone: "amber" }, { label: "EID milestones", value: 12, detail: "8 on time · 4 missed", href: "/reports", tone: "blue" }]
    : user.role === "admin"
      ? [{ label: "Staff accounts", value: users.length, detail: "All active", href: "/admin/users", tone: "teal" }, { label: "Service points", value: services.length, detail: "3 districts", href: "/admin/directory", tone: "indigo" }, { label: "Draft content", value: content.filter((item) => item.reviewStatus === "draft").length, detail: "Awaiting review", href: "/admin/content", tone: "amber" }, { label: "Open concerns", value: safeguardingReports.filter((report) => report.status !== "closed").length, detail: "Counts only", href: "/safeguarding", tone: "rose" }]
      : [{ label: "Open follow-up", value: followups.filter((task) => task.status !== "completed").length, detail: "2 need attention today", href: "/followup", tone: "teal" }, { label: "Referrals in progress", value: referrals.filter((referral) => referral.status !== "completed").length, detail: "Across your work", href: "/referrals", tone: "indigo" }, { label: "Milestones due", value: 3, detail: "This week", href: "/eid", tone: "amber" }, { label: "New requests", value: supportRequests.filter((request) => request.status === "new").length, detail: "Waiting to be assigned", href: "/connect-requests", tone: "blue" }];
  res.json({ metrics, recentActivity: [{ id: 1, text: "A follow-up barrier was recorded for YC-000124.", time: "42 min ago", type: "followup" }, { id: 2, text: "A referral moved to in progress.", time: "2 hrs ago", type: "referral" }, { id: 3, text: "A milestone reminder was scheduled.", time: "Yesterday", type: "eid" }], notifications: notificationsFor(user) });
});

router.get("/cases", (req, res) => {
  const user = requireStaff(req, res, "cases.view");
  if (!user) return;
  res.json(user.role === "champion" || user.role === "treatment_supporter" || user.role === "mentor_mother" ? cases.filter((item) => item.assignedTo === user.name) : cases);
});

router.post("/cases/:id/consent", (req, res) => {
  const user = requireStaff(req, res, "cases.edit");
  if (!user) return;
  const item = cases.find((entry) => entry.id === Number(req.params.id));
  if (!item) return res.status(404).json({ error: "Case not found" }) as never;
  item.consentStatus = String(req.body?.status ?? item.consentStatus);
  addAudit("case.consent", String(item.caseRef), user.name);
  res.json(item);
});

router.get("/followups", (req, res) => {
  const user = requireStaff(req, res, "followup.manage");
  if (!user) return;
  res.json([...followups].sort((a, b) => Number(b.overdue) - Number(a.overdue)));
});

router.post("/followups", (req, res) => {
  const user = requireStaff(req, res, "followup.manage");
  if (!user) return;
  const item = cases.find((entry) => entry.id === Number(req.body?.caseId));
  const task = { id: ++nextId, caseId: Number(item?.id ?? 1), caseRef: String(item?.caseRef ?? "YC-000123"), alias: String(item?.alias ?? "Case 123"), type: String(req.body?.type ?? "at_risk"), dueDate: String(req.body?.dueDate ?? "2026-09-15"), assignedTo: user.name, status: "open", barrier: "", alternativePathway: "", overdue: false };
  followups.unshift(task);
  addAudit("followup.create", task.caseRef, user.name);
  res.status(201).json(task);
});

router.get("/followups/:id", (req, res) => {
  const user = requireStaff(req, res, "followup.manage");
  if (!user) return;
  const task = followups.find((entry) => entry.id === Number(req.params.id));
  task ? res.json(task) : res.status(404).json({ error: "Follow-up not found" });
});

router.post("/followups/:id/barrier", (req, res) => {
  const user = requireStaff(req, res, "followup.manage");
  if (!user) return;
  const task = followups.find((entry) => entry.id === Number(req.params.id));
  if (!task) return res.status(404).json({ error: "Follow-up not found" }) as never;
  task.barrier = String(req.body?.barrier ?? "");
  task.alternativePathway = String(req.body?.alternativePathway ?? "");
  task.status = "in_progress";
  addAudit("followup.barrier", task.caseRef, user.name);
  res.json(task);
});

router.post("/followups/:id/complete", (req, res) => {
  const user = requireStaff(req, res, "followup.manage");
  if (!user) return;
  const task = followups.find((entry) => entry.id === Number(req.params.id));
  if (!task) return res.status(404).json({ error: "Follow-up not found" }) as never;
  task.status = "completed";
  addAudit("followup.complete", task.caseRef, user.name);
  reminders.unshift({ id: ++nextId, relatedType: "followup", relatedId: task.id, recipientType: "cadre", recipientRef: task.assignedTo, channel: "in_app", message: `Reminder: your next visit is due. Tap for details. (${task.caseRef})`, sendAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), status: "scheduled", createdAt: new Date().toISOString() });
  res.json(task);
});

router.get("/referrals", (req, res) => {
  if (!requireStaff(req, res, "referrals.manage")) return;
  res.json(referrals);
});

router.post("/referrals", (req, res) => {
  const user = requireStaff(req, res, "referrals.manage");
  if (!user) return;
  const item = cases.find((entry) => entry.id === Number(req.body?.caseId));
  const service = services.find((entry) => entry.id === Number(req.body?.servicePointId));
  const referral = { id: ++nextId, caseId: Number(item?.id ?? 1), caseRef: String(item?.caseRef ?? "YC-000123"), targetService: String(req.body?.targetService ?? "testing"), servicePointId: Number(service?.id ?? 1), servicePoint: String(service?.name ?? "Community Health Point A"), status: "initiated", reason: String(req.body?.reason ?? ""), initiatedAt: new Date().toISOString(), completionNotes: "" };
  referrals.unshift(referral);
  addAudit("referral.create", referral.caseRef, user.name);
  for (const manager of findUsersWithPermission("referrals.manage")) if (manager.id !== user.id) notifyUser(manager.id, "New referral", `${referral.caseRef} was referred to ${referral.servicePoint}.`);
  res.status(201).json(referral);
});

router.post("/referrals/:id/advance", (req, res) => {
  const user = requireStaff(req, res, "referrals.manage");
  if (!user) return;
  const referral = referrals.find((entry) => entry.id === Number(req.params.id));
  if (!referral) return res.status(404).json({ error: "Referral not found" }) as never;
  referral.status = String(req.body?.status ?? referral.status);
  referral.completionNotes = String(req.body?.completionNotes ?? referral.completionNotes);
  addAudit("referral.advance", referral.caseRef, user.name);
  res.json(referral);
});

router.get("/eid/pairs", (req, res) => {
  if (!requireStaff(req, res, "eid.manage")) return;
  res.json(pairs);
});

router.get("/eid/pairs/:id", (req, res) => {
  if (!requireStaff(req, res, "eid.manage")) return;
  const pair = pairs.find((entry) => entry.id === Number(req.params.id));
  pair ? res.json(pair) : res.status(404).json({ error: "Pair not found" });
});

router.post("/eid/milestones/:id/complete", (req, res) => {
  const user = requireStaff(req, res, "eid.manage");
  if (!user) return;
  const milestone = pairs.flatMap((pair) => pair.milestones.map((entry) => ({ pair, entry }))).find(({ entry }) => entry.id === Number(req.params.id));
  if (!milestone) return res.status(404).json({ error: "Milestone not found" }) as never;
  milestone.entry.status = "done";
  milestone.entry.result = String(req.body?.result ?? "pending");
  milestone.pair.progress = Math.min(100, milestone.pair.progress + 16);
  addAudit("eid.result_return", milestone.pair.infantRef, user.name);
  for (const manager of findUsersWithPermission("eid.manage")) if (manager.id !== user.id) notifyUser(manager.id, "EID result returned", `${milestone.pair.infantRef} has a new milestone result.`);
  const next = milestone.pair.milestones.find((entry) => entry.status === "pending");
  if (next) reminders.unshift({ id: ++nextId, relatedType: "eid", relatedId: next.id, recipientType: "client", recipientRef: milestone.pair.motherRef, channel: "sms_sim", message: "Reminder: your next visit is due. Tap for details.", sendAt: next.dueDate, status: "scheduled", createdAt: new Date().toISOString() });
  res.json(milestone.pair);
});

router.get("/support-requests", (req, res) => {
  if (!requireStaff(req, res, "connect.manage")) return;
  res.json(supportRequests);
});

router.get("/safeguarding-reports", (req, res) => {
  if (!requireStaff(req, res, "safeguarding.manage")) return;
  res.json(safeguardingReports.map(({ description: _description, ...safe }) => safe));
});

router.get("/rights/escalations", (req, res) => {
  if (!requireStaff(req, res, "rights.escalate")) return;
  res.json(rightsEscalations);
});

router.post("/rights/escalations", (req, res) => {
  const user = requireStaff(req, res, "rights.escalate");
  if (!user) return;
  const item = cases.find((entry) => entry.id === Number(req.body?.caseId));
  const escalation = { id: ++nextId, caseRef: String(item?.caseRef ?? "YC-000123"), note: String(req.body?.note ?? ""), raisedBy: user.name, status: "open", createdAt: new Date().toISOString() };
  rightsEscalations.unshift(escalation);
  addAudit("rights.escalate", escalation.caseRef, user.name);
  for (const manager of findUsersWithPermission("safeguarding.manage")) notifyUser(manager.id, "Rights escalation raised", `${escalation.caseRef} needs a legal/rights review.`);
  res.status(201).json(escalation);
});

router.post("/rights/escalations/:id/resolve", (req, res) => {
  const user = requireStaff(req, res, "rights.escalate");
  if (!user) return;
  const escalation = rightsEscalations.find((entry) => entry.id === Number(req.params.id));
  if (!escalation) return res.status(404).json({ error: "Escalation not found" }) as never;
  escalation.status = "resolved";
  addAudit("rights.escalate.resolve", escalation.caseRef, user.name);
  res.json(escalation);
});

router.get("/reminders", (req, res) => {
  if (!requireStaff(req, res, "dashboard.view")) return;
  res.json(reminders);
});

router.post("/reminders/process", (req, res) => {
  const user = requireStaff(req, res, "admin.users");
  if (!user) return;
  const now = Date.now();
  let processed = 0;
  for (const reminder of reminders) {
    if (reminder.status === "scheduled" && new Date(reminder.sendAt).getTime() <= now) {
      reminder.status = "sent";
      processed += 1;
      if (reminder.recipientType === "cadre") notifyByName(reminder.recipientRef, "Reminder sent", reminder.message);
    }
  }
  addAudit("reminders.process", `${processed} processed`, user.name);
  res.json({ processed, total: reminders.length });
});

router.get("/reports", (req, res) => {
  if (!requireStaff(req, res, "reports.view")) return;
  res.json({ assessments: { low: assessments.filter((item) => item.band === "low").length, moderate: assessments.filter((item) => item.band === "moderate").length, elevated: assessments.filter((item) => item.band === "elevated").length, urgent: assessments.filter((item) => item.band === "urgent").length }, referrals: { initiated: referrals.filter((item) => item.status === "initiated").length, in_progress: referrals.filter((item) => item.status === "in_progress").length, completed: referrals.filter((item) => item.status === "completed").length, completionRate: Math.round(referrals.filter((item) => item.status === "completed").length / referrals.length * 100) }, followups: { open: followups.filter((item) => item.status !== "completed").length, completed: followups.filter((item) => item.status === "completed").length, overdue: followups.filter((item) => item.overdue && item.status !== "completed").length }, eid: { onTime: 8, missed: 4 }, supportRequests: { champion: 1, counsellor: 1, facility: 1 }, safeguarding: { new: safeguardingReports.filter((item) => item.status === "new").length, escalated: safeguardingReports.filter((item) => item.status === "escalated").length, in_support: safeguardingReports.filter((item) => item.status === "in_support").length, closed: 0 } });
});

router.get("/audit", (req, res) => {
  if (!requireStaff(req, res, "audit.view")) return;
  res.json(audits.slice(0, 20));
});

router.get("/admin/users", (req, res) => {
  if (!requireStaff(req, res, "admin.users")) return;
  res.json(users.map(userPayload));
});

router.post("/admin/users", (req, res) => {
  const user = requireStaff(req, res, "admin.users");
  if (!user) return;
  const role = String(req.body?.role ?? "champion") as Role;
  const name = String(req.body?.name ?? "New staff member");
  const password = String(req.body?.password ?? "Password123!");
  const created: User = { id: ++nextId, name, email: String(req.body?.email ?? `staff${nextId}@yconnect.test`), role, roleLabel: roles[role]?.label ?? "Staff member", initials: name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase(), district: String(req.body?.district ?? "Kumasi"), status: "active", passwordHash: sha256(password) };
  users.push(created);
  addAudit("admin.user.create", created.email, user.name);
  res.status(201).json(userPayload(created));
});

router.patch("/admin/users/:id/status", (req, res) => {
  const user = requireStaff(req, res, "admin.users");
  if (!user) return;
  const target = users.find((entry) => entry.id === Number(req.params.id));
  if (!target) return res.status(404).json({ error: "Staff account not found" }) as never;
  target.status = String(req.body?.status ?? target.status);
  addAudit("admin.user.status", target.email, user.name);
  res.json(userPayload(target));
});

router.delete("/admin/users/:id", (req, res) => {
  const user = requireStaff(req, res, "admin.users");
  if (!user) return;
  const target = users.find((entry) => entry.id === Number(req.params.id));
  if (!target) return res.status(404).json({ error: "Staff account not found" }) as never;
  users = users.filter((entry) => entry.id !== target.id);
  addAudit("admin.user.remove", target.email, user.name);
  res.status(204).send();
});

router.post("/admin/reset", (_req, res) => {
  resetAll();
  addAudit("admin.reset", "demo-data", "System");
  res.json({ ok: true });
});

export default router;
