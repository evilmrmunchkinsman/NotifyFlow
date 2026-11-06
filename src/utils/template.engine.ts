export const renderTemplate = (body: string, payload: Record<string, any>): string => {
  let renderedBody = body;

  // Loop through the payload (e.g., { firstName: "John", appName: "Netflix" })
  for (const key in payload) {
    // Replace all instances of {{key}} with the value
    const regex = new RegExp(`{{${key}}}`, 'g');
    renderedBody = renderedBody.replace(regex, String(payload[key]));
  }

  return renderedBody;
};