/**
 * Script de teste para verificar o log de acessos
 * 
 * USO:
 * node test-log.js
 * 
 * Ou com curl:
 * curl -X POST http://localhost:8888/.netlify/functions/log-access \
 *   -H "Content-Type: application/json" \
 *   -d '{"ip":"200.147.67.123","path":"/api/hub/conecta","userAgent":"Mozilla/5.0"}'
 */

const testLog = async () => {
  const testData = {
    ip: "200.147.67.123",
    path: "/api/hub/conecta",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    timestamp: new Date().toISOString(),
  }

  console.log("📝 Enviando log de teste...")
  console.log("Dados:", JSON.stringify(testData, null, 2))

  try {
    const response = await fetch("http://localhost:8888/.netlify/functions/log-access", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testData),
    })

    const result = await response.json()

    if (response.ok) {
      console.log("✅ Log registrado com sucesso!")
      console.log("Resposta:", JSON.stringify(result, null, 2))
    } else {
      console.error("❌ Erro ao registrar log:")
      console.error(result)
    }
  } catch (error) {
    console.error("❌ Erro na conexão:")
    console.error(error.message)
    console.log("\n💡 Certifique-se de que o 'netlify dev' está rodando")
  }
}

testLog()