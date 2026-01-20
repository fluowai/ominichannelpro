export async function getPublicUrl(): Promise<string> {
  // 1. Produção: Usar variável customizada
  if (process.env.PUBLIC_URL) {
    return process.env.PUBLIC_URL;
  }
  
  // 3. Desenvolvimento: Tentar detectar ngrok
  try {
    const response = await fetch('http://127.0.0.1:4040/api/tunnels');
    const data: any = await response.json();
    const httpsTunnel = data.tunnels?.find((t: any) => t.proto === 'https');
    if (httpsTunnel) {
      return httpsTunnel.public_url;
    }
  } catch (e) {
    // ngrok não está rodando
  }
  
  // 4. Fallback: localhost (não funcionará para webhooks externos)
  console.warn('⚠️ Usando localhost como URL pública - webhooks não funcionarão!');
  return 'http://localhost:3000';
}
