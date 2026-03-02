export interface InviteEmailPayload {
  toEmail: string;
  inviteLink: string;
  role: string;
  inviterName: string;
  companyName: string;
}

interface EmailJsRequestBody {
  service_id: string;
  template_id: string;
  user_id: string;
  template_params: {
    inviter_name: string;
    company_name: string;
    role: string;
    invite_link: string;
    current_year: string;
    to_email: string;
    email: string;
    to: string;
    recipient_email: string;
  };
}

const EMAILJS_ENDPOINT = "https://api.emailjs.com/api/v1.0/email/send";

const getEmailJsConfig = () => {
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

  return { serviceId, templateId, publicKey };
};

export const canSendInviteEmail = () => {
  const { serviceId, templateId, publicKey } = getEmailJsConfig();
  return Boolean(serviceId && templateId && publicKey);
};

export const sendInviteEmail = async (payload: InviteEmailPayload) => {
  const { serviceId, templateId, publicKey } = getEmailJsConfig();
  if (!serviceId || !templateId || !publicKey) {
    throw new Error(
      "EmailJS config missing. Set NEXT_PUBLIC_EMAILJS_SERVICE_ID, NEXT_PUBLIC_EMAILJS_TEMPLATE_ID, and NEXT_PUBLIC_EMAILJS_PUBLIC_KEY."
    );
  }

  const body: EmailJsRequestBody = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    template_params: {
      inviter_name: payload.inviterName,
      company_name: payload.companyName,
      role: payload.role,
      invite_link: payload.inviteLink,
      current_year: String(new Date().getFullYear()),
      to_email: payload.toEmail,
      email: payload.toEmail,
      to: payload.toEmail,
      recipient_email: payload.toEmail,
    },
  };

  const response = await fetch(EMAILJS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`EmailJS request failed (${response.status}): ${errorText}`);
  }
};
