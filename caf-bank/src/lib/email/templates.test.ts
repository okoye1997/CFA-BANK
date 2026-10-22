import { describe, expect, it } from "vitest";
import { renderEmail } from "./templates";

describe("email template", () => {
  it("escapes account data and keeps the verification action usable", () => {
    const rendered = renderEmail({ title: "Verify your email address", customerName: '<Member & Co>', content: "Thank you for creating your account.", action: { label: "Verify Email Address", href: "https://bank.example/verify-email?token=abc&email=user%40example.com" } });
    expect(rendered.html).toContain("&lt;Member &amp; Co&gt;");
    expect(rendered.html).toContain("token=abc&amp;email=");
    expect(rendered.html).not.toContain("<Member & Co>");
    expect(rendered.text).toContain("Verify Email Address: https://bank.example/verify-email?");
  });
});
