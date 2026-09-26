export const WHATSAPP_NUMBER = "2348105519705";

export function whatsappLink(message: string) {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message.slice(0, 1500))}`;
}

export function customRequestMessage(businessName?: string, summary?: string) {
  const intro = businessName?.trim()
    ? `Hi, I'm ${businessName.trim()}, interested in a custom website request.`
    : "Hi, I'm interested in a custom website request.";
  return summary ? `${intro}\n\nWhat I need:\n${summary}` : intro;
}
