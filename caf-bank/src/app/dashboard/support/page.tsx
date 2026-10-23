import { getTranslations } from "next-intl/server";
import { SupportChat } from "@/components/support-chat";
import { SupportContactLinks } from "@/components/support-contact-links";
export default async function SupportPage() {
  const t = await getTranslations("supportPage");
  return <><span className="eyebrow">{t("eyebrow")}</span><h1 className="text-3xl font-bold mt-1 mb-7">{t("title")}</h1><div className="mb-7"><SupportContactLinks showInApp={false} /></div><SupportChat/></>;
}
