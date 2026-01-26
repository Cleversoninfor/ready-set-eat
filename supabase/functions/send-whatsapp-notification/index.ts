import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  observation?: string | null;
}

interface NotificationPayload {
  orderId: number;
  customerName: string;
  customerPhone: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: string;
  addressStreet: string;
  addressNumber: string;
  addressNeighborhood: string;
  addressComplement?: string | null;
  changeFor?: number | null;
  deliveryType: 'delivery' | 'pickup';
  storePhone?: string;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatPaymentMethod(method: string): string {
  const methods: Record<string, string> = {
    money: 'Dinheiro',
    pix: 'PIX',
    credit: 'Cartão de Crédito',
    debit: 'Cartão de Débito',
    card: 'Cartão',
  };
  return methods[method] || method;
}

function formatPhoneForWhatsApp(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // If already has country code (starts with 55 and has 12-13 digits), use as is
  if (digits.startsWith('55') && digits.length >= 12) {
    return digits;
  }
  
  // Add Brazil country code
  return `55${digits}`;
}

function buildMessage(data: NotificationPayload, trackingUrl: string): string {
  const lines: string[] = [];
  
  // Header with greeting
  lines.push(`🎉 *Obrigado pela compra, ${data.customerName}!*`);
  lines.push('');
  lines.push(`📦 *Pedido #${data.orderId}*`);
  lines.push('');
  
  // Order items
  lines.push('*Itens do Pedido:*');
  data.items.forEach((item) => {
    const itemTotal = item.quantity * item.unit_price;
    lines.push(`• ${item.quantity}x ${item.product_name} - ${formatCurrency(itemTotal)}`);
    if (item.observation) {
      lines.push(`  _Obs: ${item.observation}_`);
    }
  });
  lines.push('');
  
  // Total
  lines.push(`💰 *Total: ${formatCurrency(data.totalAmount)}*`);
  lines.push('');
  
  // Payment method
  lines.push(`💳 *Pagamento:* ${formatPaymentMethod(data.paymentMethod)}`);
  if (data.paymentMethod === 'money' && data.changeFor) {
    lines.push(`💵 *Troco para:* ${formatCurrency(data.changeFor)}`);
  }
  lines.push('');
  
  // Delivery info
  if (data.deliveryType === 'delivery') {
    lines.push('📍 *Endereço de Entrega:*');
    lines.push(`${data.addressStreet}, ${data.addressNumber}`);
    lines.push(`${data.addressNeighborhood}`);
    if (data.addressComplement) {
      lines.push(`Complemento: ${data.addressComplement}`);
    }
  } else {
    lines.push('🏪 *Retirada no local*');
  }
  lines.push('');
  
  // Store WhatsApp
  if (data.storePhone) {
    lines.push(`📞 *WhatsApp:* ${data.storePhone}`);
    lines.push('');
  }
  
  // Tracking link
  lines.push('─────────────────');
  lines.push('');
  lines.push('📲 *Acompanhe o seu pedido!*');
  lines.push(trackingUrl);
  
  return lines.join('\n');
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
    const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
    const EVOLUTION_INSTANCE_NAME = Deno.env.get("EVOLUTION_INSTANCE_NAME");

    console.log("[send-whatsapp-notification] EVOLUTION_API_URL raw:", EVOLUTION_API_URL);
    console.log("[send-whatsapp-notification] EVOLUTION_INSTANCE_NAME:", EVOLUTION_INSTANCE_NAME);

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE_NAME) {
      console.error("Missing Evolution API configuration");
      return new Response(
        JSON.stringify({ error: "Evolution API not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize URL - ensure it starts with https:// and remove trailing slash
    EVOLUTION_API_URL = EVOLUTION_API_URL.trim();
    if (!EVOLUTION_API_URL.startsWith("http://") && !EVOLUTION_API_URL.startsWith("https://")) {
      EVOLUTION_API_URL = `https://${EVOLUTION_API_URL}`;
    }
    EVOLUTION_API_URL = EVOLUTION_API_URL.replace(/\/+$/, ""); // Remove trailing slashes

    const payload: NotificationPayload = await req.json();
    
    console.log("[send-whatsapp-notification] Received payload:", {
      orderId: payload.orderId,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      itemsCount: payload.items?.length,
    });

    // Build tracking URL
    const trackingUrl = `https://ready-set-eat.lovable.app/my-orders`;
    
    // Build message
    const message = buildMessage(payload, trackingUrl);
    
    // Format phone for WhatsApp
    const formattedPhone = formatPhoneForWhatsApp(payload.customerPhone);
    
    console.log("[send-whatsapp-notification] Sending to:", formattedPhone);

    // Send via Evolution API
    const evolutionUrl = `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE_NAME}`;
    
    console.log("[send-whatsapp-notification] Final URL:", evolutionUrl);
    const evolutionPayload = {
      number: formattedPhone,
      text: message,
    };

    const response = await fetch(evolutionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": EVOLUTION_API_KEY,
      },
      body: JSON.stringify(evolutionPayload),
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error("[send-whatsapp-notification] Evolution API error:", response.status, responseText);
      return new Response(
        JSON.stringify({ 
          error: "Failed to send WhatsApp message",
          details: responseText,
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[send-whatsapp-notification] Message sent successfully");
    
    return new Response(
      JSON.stringify({ success: true, message: "WhatsApp notification sent" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[send-whatsapp-notification] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
