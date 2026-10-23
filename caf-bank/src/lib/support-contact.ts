export const supportContact = {
  whatsappNumber: "+5978991423",
  email: "Customerservice.cfa@outlook.com",
  inAppHref: "/dashboard/support",
} as const;

export const supportWhatsAppHref = `https://wa.me/${supportContact.whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent("Hello, I need assistance with my account.")}`;
export const supportEmailHref = `mailto:${supportContact.email}?subject=${encodeURIComponent("Customer Support Request")}`;
