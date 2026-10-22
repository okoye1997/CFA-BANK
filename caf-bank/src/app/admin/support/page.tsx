import { SupportChat } from "@/components/support-chat";
import { getTranslations } from "next-intl/server";
export default async function AdminSupport(){const admin=await getTranslations("admin"),ui=await getTranslations("adminScreen");return <><span className="eyebrow">{ui("queue")}</span><h1 className="text-3xl font-bold mt-1 mb-7">{admin("support")}</h1><SupportChat admin/></>}
